"""
DonorPulse Telephony & Messaging Service
Cloud Telephony (Twilio Voice + SMS) Engine with Provider Abstraction,
Safety Validation Gate, Automated 10s Short-Ring Emergency Alerts,
and Patient-to-Donor Manual Call Bridging.
"""

import os
import sys
import re
import json
import uuid
import base64
import urllib.request
import urllib.parse
from datetime import datetime, timezone, timedelta

# Ensure UTF-8 output stream on Windows consoles
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

# ==============================================================================
# ENVIRONMENT & CONFIGURATION LOADER
# ==============================================================================
def load_env_file(filepath=".env", override=False):
    """Loads key=value pairs from .env into os.environ."""
    if not os.path.exists(filepath):
        return
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("'\"")
                if override or k not in os.environ:
                    os.environ[k] = v
    except Exception as e:
        print(f"[TelephonyConfig] Notice loading {filepath}: {e}")

load_env_file()

def get_telephony_config():
    """Reads live telephony configuration and secrets, refreshing from .env."""
    load_env_file(override=True)
    account_sid = os.environ.get("TWILIO_ACCOUNT_SID", "").strip()
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN", "").strip()
    from_number = os.environ.get("TWILIO_PHONE_NUMBER", "").strip()
    mock_mode = os.environ.get("MOCK_TELEPHONY", "true").strip().lower() in ("true", "1", "yes")

    # If Twilio credentials are placeholder, empty, or unconfigured, force mock mode for safety
    if not account_sid or not auth_token or account_sid.startswith("AC_") or "your_" in account_sid or "your_" in auth_token:
        mock_mode = True

    return {
        "mockMode": mock_mode,
        "accountSid": account_sid,
        "authToken": auth_token,
        "fromNumber": from_number,
        "publicBaseUrl": os.environ.get("PUBLIC_WEBHOOK_BASE_URL", "http://localhost:3000").rstrip("/"),
        "autoAlertTimeout": int(os.environ.get("AUTO_ALERT_RING_TIMEOUT", 10)),
        "manualCallTimeout": int(os.environ.get("MANUAL_CALL_RING_TIMEOUT", 40)),
        "maxConcurrent": int(os.environ.get("MAX_CONCURRENT_DONOR_CALLS", 5)),
        "cooldownSeconds": int(os.environ.get("ALERT_COOLDOWN_SECONDS", 300))
    }

# Backwards compatible module-level references
_INITIAL_CFG = get_telephony_config()
MOCK_TELEPHONY = _INITIAL_CFG["mockMode"]
TWILIO_ACCOUNT_SID = _INITIAL_CFG["accountSid"]
TWILIO_AUTH_TOKEN = _INITIAL_CFG["authToken"]
TWILIO_PHONE_NUMBER = _INITIAL_CFG["fromNumber"]
PUBLIC_WEBHOOK_BASE_URL = _INITIAL_CFG["publicBaseUrl"]
AUTO_ALERT_RING_TIMEOUT = _INITIAL_CFG["autoAlertTimeout"]
MANUAL_CALL_RING_TIMEOUT = _INITIAL_CFG["manualCallTimeout"]
MAX_CONCURRENT_DONOR_CALLS = _INITIAL_CFG["maxConcurrent"]
ALERT_COOLDOWN_SECONDS = _INITIAL_CFG["cooldownSeconds"]

# Medical Compatibility Matrix
COMPATIBILITY_MATRIX = {
    'O+': ['O+', 'O-'],
    'O-': ['O-'],
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'A-': ['A-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    'AB-': ['AB-', 'A-', 'B-', 'O-']
}

# In-memory storage for cooldowns, active calls, and telephony logs
RECENT_ALERTS = {}         # (donor_id, request_id) -> timestamp_utc
ACTIVE_CALLS = {}          # call_sid -> call_context_dict
TELEPHONY_LOGS = []        # list of { timestamp, type: "call"|"sms", sid, to, from, status, details }

TELEPHONY_LOGS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "telephony_logs.json")

def persist_telephony_logs():
    """Saves telemetry logs to disk."""
    try:
        os.makedirs(os.path.dirname(TELEPHONY_LOGS_FILE), exist_ok=True)
        with open(TELEPHONY_LOGS_FILE, "w", encoding="utf-8") as f:
            json.dump(TELEPHONY_LOGS[-500:], f, indent=2)
    except Exception as e:
        print(f"[TelephonyLog] Error persisting logs: {e}")

# ==============================================================================
# 1. SHARED DONOR ELIGIBILITY & SAFETY GATE
# ==============================================================================
def normalize_phone_e164(phone_raw, default_country_code="+91"):
    """
    Normalizes a phone number to strict E.164 format (+[country_code][digits]).
    Returns None if the phone number cannot be converted to a valid E.164 string.
    """
    if not phone_raw or not isinstance(phone_raw, str):
        return None
    cleaned = re.sub(r'[\s\-\(\)\.]', '', phone_raw.strip())
    if not cleaned:
        return None

    if cleaned.startswith("+"):
        digits_after_plus = cleaned[1:]
        if digits_after_plus.isdigit() and 7 <= len(digits_after_plus) <= 15:
            return cleaned
        return None

    # Handle leading 00 (international notation)
    if cleaned.startswith("00"):
        digits = cleaned[2:]
        if digits.isdigit() and 7 <= len(digits) <= 15:
            return f"+{digits}"
        return None

    # Handle single leading 0 (domestic)
    if cleaned.startswith("0"):
        cleaned = cleaned[1:]

    # If 10 digits (standard Indian mobile), prepend default country code (+91)
    if len(cleaned) == 10 and cleaned.isdigit():
        return f"{default_country_code}{cleaned}"

    # If already includes country code without +
    if cleaned.startswith("91") and len(cleaned) == 12 and cleaned.isdigit():
        return f"+{cleaned}"

    if cleaned.isdigit() and 7 <= len(cleaned) <= 15:
        return f"{default_country_code}{cleaned}"

    return None

def is_donor_in_recovery(last_donation_val, now_dt=None):
    """Checks if donor is within 90-day clinical recovery cooldown."""
    if not last_donation_val or not isinstance(last_donation_val, str):
        return False
    val = last_donation_val.strip().lower()
    if not val or 'first' in val or val in ('none', 'null', 'n/a'):
        return False
    if now_dt is None:
        now_dt = datetime.now(timezone.utc)
    parsed = None
    for fmt in ('%Y-%m-%d', '%d %b %Y', '%d %B %Y', '%d/%m/%Y', '%m/%d/%Y'):
        try:
            parsed = datetime.strptime(val, fmt).replace(tzinfo=timezone.utc)
            break
        except Exception:
            continue
    if not parsed:
        try:
            parsed = datetime.fromisoformat(val.replace('Z', '+00:00'))
        except Exception:
            return False
    return (now_dt - parsed).days < 90

def check_donor_telephony_safety(donor, request_case, max_distance_km=25.0, cooldown_seconds=ALERT_COOLDOWN_SECONDS):
    """
    Central safety validation gate. Returns tuple: (is_eligible: bool, reason: str, e164_phone: str)
    Used by both Flow A (auto-alerts) and Flow B (manual calls).
    """
    if not donor or not isinstance(donor, dict):
        return False, "Donor profile missing or invalid", None

    donor_id = donor.get("id") or donor.get("_id")
    if not donor_id:
        return False, "Donor missing identifier", None

    # 1. Phone number normalization & E.164 check
    raw_phone = donor.get("phone") or donor.get("mobileNumber") or donor.get("contactPhone")
    phone_e164 = normalize_phone_e164(raw_phone)
    if not phone_e164:
        return False, f"Donor {donor_id} does not have a valid E.164 phone number (provided: '{raw_phone}')", None

    # 2. Availability flag check
    is_avail = donor.get("isAvailable", donor.get("availability", True))
    if is_avail is False or str(is_avail).lower() in ("false", "0"):
        return False, f"Donor {donor_id} is currently set to Unavailable", phone_e164

    # 3. 90-Day biological recovery check
    last_donation = donor.get("lastDonationDate")
    if is_donor_in_recovery(last_donation):
        return False, f"Donor {donor_id} is in mandatory 90-day clinical cooldown", phone_e164

    # 4. Blood compatibility
    req_bg = request_case.get("bloodGroup") or request_case.get("bloodGroupNeeded") or "B+"
    compatible_groups = COMPATIBILITY_MATRIX.get(req_bg, [req_bg])
    donor_bg = donor.get("bloodGroup", "")
    if donor_bg not in compatible_groups:
        return False, f"Donor blood group '{donor_bg}' is incompatible with requested '{req_bg}'", phone_e164

    # 5. Proximity check (if coordinates available)
    req_coords = request_case.get("coordinates")
    donor_coords = donor.get("coordinates")
    if req_coords and donor_coords:
        try:
            r_c = req_coords.get("coordinates", req_coords) if isinstance(req_coords, dict) else req_coords
            d_c = donor_coords.get("coordinates", donor_coords) if isinstance(donor_coords, dict) else donor_coords
            if isinstance(r_c, list) and isinstance(d_c, list) and len(r_c) >= 2 and len(d_c) >= 2:
                # distance calculation
                import math
                lat1, lon1 = r_c[1], r_c[0]
                lat2, lon2 = d_c[1], d_c[0]
                R = 6371.0
                d_lat = math.radians(lat2 - lat1)
                d_lon = math.radians(lon2 - lon1)
                a = (math.sin(d_lat / 2.0) ** 2 +
                     math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
                     math.sin(d_lon / 2.0) ** 2)
                c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
                dist = R * c
                if dist > max_distance_km:
                    return False, f"Donor distance ({round(dist, 1)} km) exceeds radius ({max_distance_km} km)", phone_e164
        except Exception:
            pass

    # 6. Anti-Spam / Cooldown check
    req_id = request_case.get("id") or request_case.get("caseId") or request_case.get("requestId")
    cooldown_key = (str(donor_id), str(req_id))
    now_ts = datetime.now(timezone.utc).timestamp()
    if cooldown_key in RECENT_ALERTS:
        last_alert_ts = RECENT_ALERTS[cooldown_key]
        elapsed = now_ts - last_alert_ts
        if elapsed < cooldown_seconds:
            remaining = int(cooldown_seconds - elapsed)
            return False, f"Anti-spam cooldown active for donor ({remaining}s remaining)", phone_e164

    return True, "Eligible", phone_e164

# ==============================================================================
# 2. TELEPHONY PROVIDER INTERFACE & TWILIO / MOCK IMPLEMENTATION
# ==============================================================================
class TelephonyProvider:
    """Abstract Telephony Provider Interface (Twilio, Exotel, Mock)."""
    def make_call(self, to_phone, from_phone, twiml_xml, timeout_seconds, status_callback_url):
        raise NotImplementedError

    def send_sms(self, to_phone, from_phone, body, status_callback_url=None):
        raise NotImplementedError

class TwilioTelephonyProvider(TelephonyProvider):
    """Twilio Programmable Voice & SMS implementation via official REST API."""
    def __init__(self, account_sid, auth_token, from_number):
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.from_number = from_number
        auth_str = f"{account_sid}:{auth_token}"
        self.basic_auth = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")

    def make_call(self, to_phone, from_phone, twiml_xml, timeout_seconds, status_callback_url):
        url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Calls.json"
        data = {
            "To": to_phone,
            "From": from_phone or self.from_number,
            "Twiml": twiml_xml,
            "Timeout": str(timeout_seconds),
        }
        # Twilio rejects StatusCallback if given a localhost or private URL
        if status_callback_url and not any(h in status_callback_url for h in ("localhost", "127.0.0.1", "0.0.0.0")):
            data["StatusCallback"] = status_callback_url
            data["StatusCallbackMethod"] = "POST"
            data["StatusCallbackEvent"] = ["initiated", "ringing", "answered", "completed"]

        encoded_data = urllib.parse.urlencode(data, doseq=True).encode("utf-8")
        req = urllib.request.Request(url, data=encoded_data, method="POST")
        req.add_header("Authorization", f"Basic {self.basic_auth}")
        req.add_header("Content-Type", "application/x-www-form-urlencoded")

        try:
            with urllib.request.urlopen(req, timeout=12) as response:
                resp_json = json.loads(response.read().decode("utf-8"))
                return {
                    "success": True,
                    "provider": "twilio",
                    "callSid": resp_json.get("sid"),
                    "status": resp_json.get("status", "queued"),
                    "raw": resp_json
                }
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            print(f"[TwilioVoiceError] HTTP {e.code}: {err_body}")
            return {
                "success": False,
                "provider": "twilio",
                "error": f"Twilio API Error {e.code}: {err_body}"
            }
        except Exception as e:
            print(f"[TwilioVoiceError] Network Error: {e}")
            return {
                "success": False,
                "provider": "twilio",
                "error": f"Network Error: {str(e)}"
            }

    def send_sms(self, to_phone, from_phone, body, status_callback_url=None):
        url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages.json"
        data = {
            "To": to_phone,
            "From": from_phone or self.from_number,
            "Body": body
        }
        if status_callback_url and not any(h in status_callback_url for h in ("localhost", "127.0.0.1", "0.0.0.0")):
            data["StatusCallback"] = status_callback_url

        encoded_data = urllib.parse.urlencode(data).encode("utf-8")
        req = urllib.request.Request(url, data=encoded_data, method="POST")
        req.add_header("Authorization", f"Basic {self.basic_auth}")
        req.add_header("Content-Type", "application/x-www-form-urlencoded")

        try:
            with urllib.request.urlopen(req, timeout=12) as response:
                resp_json = json.loads(response.read().decode("utf-8"))
                return {
                    "success": True,
                    "provider": "twilio",
                    "messageSid": resp_json.get("sid"),
                    "status": resp_json.get("status", "queued"),
                    "raw": resp_json
                }
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            print(f"[TwilioSmsError] HTTP {e.code}: {err_body}")
            return {
                "success": False,
                "provider": "twilio",
                "error": f"Twilio SMS Error {e.code}: {err_body}"
            }
        except Exception as e:
            print(f"[TwilioSmsError] Network Error: {e}")
            return {
                "success": False,
                "provider": "twilio",
                "error": f"Network Error: {str(e)}"
            }

class MockTelephonyProvider(TelephonyProvider):
    """
    Mock Telephony Provider for local safe testing without Twilio charges.
    Simulates actual CallSid, MessageSid, and webhook progression.
    """
    def __init__(self, from_number="+15005550006"):
        self.from_number = from_number

    def make_call(self, to_phone, from_phone, twiml_xml, timeout_seconds, status_callback_url):
        mock_sid = f"CA{uuid.uuid4().hex[:32]}"
        print(f"[MockTelephony] [OUTBOUND CALL] -> {to_phone} (Timeout: {timeout_seconds}s)")
        print(f"                From: {from_phone or self.from_number}")
        print(f"                TwiML payload: {twiml_xml[:100]}...")
        return {
            "success": True,
            "provider": "mock",
            "callSid": mock_sid,
            "status": "ringing",
            "timeoutSeconds": timeout_seconds,
            "simulated": True
        }

    def send_sms(self, to_phone, from_phone, body, status_callback_url=None):
        mock_sid = f"SM{uuid.uuid4().hex[:32]}"
        print(f"[MockTelephony] [OUTBOUND SMS] -> {to_phone}")
        print(f"                From: {from_number if (from_number := from_phone or self.from_number) else '+15005550006'}")
        print(f"                Body: {body}")
        return {
            "success": True,
            "provider": "mock",
            "messageSid": mock_sid,
            "status": "delivered",
            "simulated": True
        }

# Instantiate Global Provider
def get_telephony_provider():
    cfg = get_telephony_config()
    if cfg["mockMode"]:
        return MockTelephonyProvider(from_number=cfg["fromNumber"] or "+15005550006")
    return TwilioTelephonyProvider(cfg["accountSid"], cfg["authToken"], cfg["fromNumber"])

# ==============================================================================
# 3. TWIML RESPONSE GENERATORS (VOICE IVR & MANUAL CALLS)
# ==============================================================================
def generate_auto_alert_twiml(donor_id, case_id, blood_group, hospital_name, public_base_url):
    """
    TwiML for Flow A (Automatic 10s short-ring alert).
    Plays emergency alert and asks donor to press 1 to accept/pledge or 2 to decline.
    """
    ivr_action_url = f"{public_base_url}/api/telephony/ivr-response?donorId={urllib.parse.quote(str(donor_id))}&caseId={urllib.parse.quote(str(case_id))}"
    
    clean_bg = blood_group.replace("+", " positive").replace("-", " negative")
    
    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather numDigits="1" action="{ivr_action_url}" method="POST" timeout="6">
        <Say voice="Polly.Aditi" language="en-IN">
            Emergency alert from DonorPulse. Critical blood request for {clean_bg} at {hospital_name}.
            Press 1 to accept and pledge donation, or press 2 if unavailable.
        </Say>
    </Gather>
    <Say voice="Polly.Aditi" language="en-IN">No response received. Thank you.</Say>
    <Hangup/>
</Response>"""
    return twiml

def generate_manual_call_twiml(donor_name, patient_name, blood_group, hospital_name, caller_phone, twilio_caller_id):
    """
    TwiML for Flow B (Manual Patient-to-Donor call).
    Plays a whisper prompt to the donor upon answering, then dials the patient's phone.
    """
    clean_bg = blood_group.replace("+", " positive").replace("-", " negative")
    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi" language="en-IN">
        Incoming DonorPulse emergency call from patient {patient_name} for an urgent {clean_bg} request at {hospital_name}. Connecting you to the attendant now.
    </Say>
    <Dial callerId="{twilio_caller_id}" timeout="35">
        <Number>{caller_phone}</Number>
    </Dial>
</Response>"""
    return twiml

# ==============================================================================
# 4. FLOW A: AUTOMATIC BLOOD REQUEST ALERT (MAX 10s RING + POP-UP TEXT)
# ==============================================================================
def dispatch_auto_emergency_alerts(case_obj, db_donors, public_base_url=PUBLIC_WEBHOOK_BASE_URL, live_event_callback=None):
    """
    Dispatches automated short-ring voice calls (timeout: 10s) and parallel SMS text messages
    to up to MAX_CONCURRENT_DONOR_CALLS eligible matched donors.
    """
    if not case_obj or not db_donors:
        return {"success": False, "alertedCount": 0, "message": "No case or donor data"}

    case_id = case_obj.get("id") or case_obj.get("caseId") or case_obj.get("requestId") or "CASE-EMERGENCY"
    blood_group = case_obj.get("bloodGroup") or case_obj.get("bloodGroupNeeded") or "B+"
    hospital_name = case_obj.get("hospitalName") or "Apex Trauma Blood Centre"
    patient_name = case_obj.get("patientName") or "Emergency Patient"
    urgency = case_obj.get("urgency") or "Stat Emergency (< 45 Mins)"
    otp_code = case_obj.get("handshakeOTP") or "7120"

    provider = get_telephony_provider()
    eligible_donors = []

    # 1. Filter candidates through Safety Gate
    donor_pool = list(db_donors.values()) if isinstance(db_donors, dict) else db_donors
    for donor in donor_pool:
        is_ok, reason, e164 = check_donor_telephony_safety(donor, case_obj, max_distance_km=25.0, cooldown_seconds=ALERT_COOLDOWN_SECONDS)
        if is_ok:
            # calculate distance for sorting
            dist = float(donor.get("distance", 1.8))
            eligible_donors.append({
                "donor": donor,
                "e164": e164,
                "distance": dist
            })

    # Sort closest first
    eligible_donors.sort(key=lambda x: x["distance"])
    batch = eligible_donors[:MAX_CONCURRENT_DONOR_CALLS]

    alerted_results = []
    now_ts = datetime.now(timezone.utc).timestamp()
    now_iso = datetime.now(timezone.utc).isoformat()

    status_callback = f"{public_base_url}/api/telephony/status-webhook"
    sms_callback = f"{public_base_url}/api/telephony/sms-status"

    for item in batch:
        donor = item["donor"]
        e164_phone = item["e164"]
        donor_id = donor.get("id") or donor.get("_id")
        donor_name = donor.get("name") or donor.get("fullName") or "Volunteer Donor"

        # Record cooldown to prevent duplicate spam
        RECENT_ALERTS[(str(donor_id), str(case_id))] = now_ts

        # Action 1: Outbound Automated Voice Call (Max 10s Ring Timeout)
        twiml = generate_auto_alert_twiml(donor_id, case_id, blood_group, hospital_name, public_base_url)
        call_res = provider.make_call(
            to_phone=e164_phone,
            from_phone=TWILIO_PHONE_NUMBER,
            twiml_xml=twiml,
            timeout_seconds=AUTO_ALERT_RING_TIMEOUT,
            status_callback_url=status_callback
        )

        call_sid = call_res.get("callSid")
        if call_sid:
            ACTIVE_CALLS[call_sid] = {
                "callSid": call_sid,
                "type": "AUTO_10S_ALERT",
                "donorId": donor_id,
                "donorName": donor_name,
                "donorPhone": e164_phone,
                "caseId": case_id,
                "bloodGroup": blood_group,
                "hospitalName": hospital_name,
                "timeout": AUTO_ALERT_RING_TIMEOUT,
                "callStatus": "ringing",
                "initiatedAt": now_iso
            }

        # Action 2: Simultaneous Priority Pop-Up Text Message (SMS)
        # Direct action link to view/accept without logging in
        accept_link = f"{public_base_url}/#/donor-mission-details?caseId={case_id}&donorId={donor_id}"
        sms_body = (
            f"🚨 URGENT DonorPulse SOS: {blood_group} blood needed immediately at {hospital_name} for {patient_name} ({urgency}). "
            f"Press 1 on your incoming phone call, or tap here to accept: {accept_link} (Handshake OTP: {otp_code})"
        )
        sms_res = provider.send_sms(
            to_phone=e164_phone,
            from_phone=TWILIO_PHONE_NUMBER,
            body=sms_body,
            status_callback_url=sms_callback
        )

        msg_sid = sms_res.get("messageSid")

        # Telemetry Log
        log_entry = {
            "timestamp": now_iso,
            "caseId": case_id,
            "donorId": donor_id,
            "donorName": donor_name,
            "phone": e164_phone,
            "callSid": call_sid,
            "callStatus": "ringing_10s",
            "messageSid": msg_sid,
            "smsStatus": sms_res.get("status", "sent"),
            "flow": "AUTO_EMERGENCY_ALERT"
        }
        TELEPHONY_LOGS.append(log_entry)

        alerted_results.append(log_entry)

        # Broadcast live sync event
        if live_event_callback and callable(live_event_callback):
            live_event_callback("TELEPHONY_ALERT_DISPATCHED", {
                "caseId": case_id,
                "donorId": donor_id,
                "donorName": donor_name,
                "callSid": call_sid,
                "messageSid": msg_sid,
                "status": "ringing_10s",
                "phone": e164_phone,
                "timeoutSeconds": AUTO_ALERT_RING_TIMEOUT
            })

    persist_telephony_logs()

    return {
        "success": True,
        "alertedCount": len(alerted_results),
        "results": alerted_results,
        "mockMode": MOCK_TELEPHONY,
        "message": f"Placed automated 10-second calls and SMS alerts to {len(alerted_results)} eligible donors."
    }

# ==============================================================================
# 5. FLOW B: MANUAL CALL BY PATIENT (NORMAL 35-45s RING DURATION)
# ==============================================================================
def initiate_manual_patient_call(donor_id, case_obj, caller_phone, db_donors, public_base_url=PUBLIC_WEBHOOK_BASE_URL, live_event_callback=None):
    """
    Places a real number-masked voice call from Patient to Donor with normal ringing duration (default 40s).
    """
    donor = None
    donor_pool = list(db_donors.values()) if isinstance(db_donors, dict) else db_donors
    for d in donor_pool:
        if str(d.get("id")) == str(donor_id) or str(d.get("_id")) == str(donor_id):
            donor = d
            break

    if not donor:
        return {"success": False, "error": f"Donor {donor_id} not found in database"}

    # 1. Gate with shared eligibility check
    is_ok, reason, donor_e164 = check_donor_telephony_safety(donor, case_obj, max_distance_km=50.0, cooldown_seconds=30)
    if not is_ok:
        return {
            "success": False,
            "error": f"Donor cannot be called: {reason}",
            "reason": reason
        }

    caller_e164 = normalize_phone_e164(caller_phone) or "+919800012345"
    case_id = case_obj.get("id") or case_obj.get("caseId") or "CASE-CALL"
    blood_group = case_obj.get("bloodGroup") or "B+"
    hospital_name = case_obj.get("hospitalName") or "Hospital Trauma Center"
    patient_name = case_obj.get("patientName") or "Patient Attendant"
    donor_name = donor.get("name") or donor.get("fullName") or "Volunteer Donor"

    provider = get_telephony_provider()
    status_callback = f"{public_base_url}/api/telephony/status-webhook"

    # Action: TwiML with whisper greeting and bridging to caller
    twiml = generate_manual_call_twiml(
        donor_name=donor_name,
        patient_name=patient_name,
        blood_group=blood_group,
        hospital_name=hospital_name,
        caller_phone=caller_e164,
        twilio_caller_id=TWILIO_PHONE_NUMBER or "+15005550006"
    )

    call_res = provider.make_call(
        to_phone=donor_e164,
        from_phone=TWILIO_PHONE_NUMBER,
        twiml_xml=twiml,
        timeout_seconds=MANUAL_CALL_RING_TIMEOUT,
        status_callback_url=status_callback
    )

    if not call_res.get("success"):
        return {
            "success": False,
            "error": call_res.get("error", "Telephony provider failed to place outbound call."),
            "provider": call_res.get("provider", "unknown")
        }

    call_sid = call_res.get("callSid")
    now_iso = datetime.now(timezone.utc).isoformat()
    is_mock = call_res.get("provider") == "mock"

    if call_sid:
        ACTIVE_CALLS[call_sid] = {
            "callSid": call_sid,
            "type": "MANUAL_PATIENT_CALL",
            "donorId": donor_id,
            "donorName": donor_name,
            "donorPhone": donor_e164,
            "callerPhone": caller_e164,
            "caseId": case_id,
            "bloodGroup": blood_group,
            "hospitalName": hospital_name,
            "timeout": MANUAL_CALL_RING_TIMEOUT,
            "callStatus": "ringing",
            "initiatedAt": now_iso,
            "mockMode": is_mock
        }

    log_entry = {
        "timestamp": now_iso,
        "caseId": case_id,
        "donorId": donor_id,
        "donorName": donor_name,
        "phone": donor_e164,
        "callerPhone": caller_e164,
        "callSid": call_sid,
        "callStatus": "ringing_40s",
        "flow": "MANUAL_PATIENT_CALL",
        "mockMode": is_mock
    }
    TELEPHONY_LOGS.append(log_entry)
    persist_telephony_logs()

    if live_event_callback and callable(live_event_callback):
        live_event_callback("MANUAL_CALL_RINGING", {
            "caseId": case_id,
            "donorId": donor_id,
            "donorName": donor_name,
            "callSid": call_sid,
            "status": "ringing",
            "timeoutSeconds": MANUAL_CALL_RING_TIMEOUT,
            "mockMode": is_mock
        })

    return {
        "success": True,
        "callSid": call_sid,
        "status": "ringing",
        "timeoutSeconds": MANUAL_CALL_RING_TIMEOUT,
        "donorName": donor_name,
        "phone": donor_e164,
        "mockMode": is_mock,
        "message": (
            f"[Mock Simulation] Simulated call to {donor_name} ({donor_e164}). To ring physical phone, set real Twilio keys in .env."
            if is_mock else
            f"Live PSTN phone call placed to {donor_name}'s mobile phone ({donor_e164})."
        )
    }

# ==============================================================================
# 6. WEBHOOK PROCESSORS (STATUS CALLBACK & IVR RESPONSE)
# ==============================================================================
def process_ivr_keypad_response(digits, donor_id, case_id, db_cases, db_donors, live_event_callback=None):
    """
    Handles donor keypad response from TwiML <Gather> (1: Accept & Pledge, 2: Decline).
    Returns appropriate TwiML response string and updates database state.
    """
    digits = str(digits).strip() if digits else ""
    case = db_cases.get(case_id) if isinstance(db_cases, dict) else None
    hospital_name = case.get("hospitalName", "the hospital") if case else "the designated hospital"
    otp_code = case.get("handshakeOTP", "7120") if case else "7120"
    blood_group = case.get("bloodGroup", "blood") if case else "blood"

    donor_obj = None
    donor_pool = list(db_donors.values()) if isinstance(db_donors, dict) else db_donors
    for d in donor_pool:
        if str(d.get("id")) == str(donor_id) or str(d.get("_id")) == str(donor_id):
            donor_obj = d
            break

    donor_name = donor_obj.get("name", "Volunteer Donor") if donor_obj else "Volunteer Donor"
    donor_phone = normalize_phone_e164(donor_obj.get("phone", "")) if donor_obj else None

    if digits == "1":
        # DONOR ACCEPTED / PLEDGED!
        if case:
            # Update donors array in case
            if "donors" not in case or not isinstance(case["donors"], list):
                case["donors"] = []
            
            # Check if donor already recorded
            existing = next((d for d in case["donors"] if str(d.get("id")) == str(donor_id)), None)
            if existing:
                existing["confirmed"] = True
                existing["pledgedVia"] = "IVR_KEYPAD_1"
                existing["confirmedAt"] = datetime.now(timezone.utc).strftime("%H:%M:%S")
            else:
                case["donors"].append({
                    "id": donor_id,
                    "name": donor_name,
                    "fullName": donor_name,
                    "bloodGroup": donor_obj.get("bloodGroup", blood_group) if donor_obj else blood_group,
                    "phone": donor_obj.get("phone", "+91 98000 00000") if donor_obj else "+91 98000 00000",
                    "distance": donor_obj.get("distance", 1.8) if donor_obj else 1.8,
                    "liveEta": "15 mins",
                    "confirmed": True,
                    "pledgedVia": "IVR_KEYPAD_1",
                    "confirmedAt": datetime.now(timezone.utc).strftime("%H:%M:%S")
                })
            
            case["unitsArranged"] = int(case.get("unitsArranged", 0)) + 1
            case["status"] = "Donor En Route"

        # Send confirmation SMS with details & Handshake OTP
        if donor_phone:
            conf_sms = (
                f"✅ Life-Saver Pledge Confirmed! Thank you, {donor_name}. "
                f"Please proceed to {hospital_name}. "
                f"Your Handshake Arrival OTP is: {otp_code}. Quote this at the Blood Bank triage desk."
            )
            provider = get_telephony_provider()
            provider.send_sms(to_phone=donor_phone, from_phone=TWILIO_PHONE_NUMBER, body=conf_sms)

        if live_event_callback and callable(live_event_callback):
            live_event_callback("DONOR_PLEDGED", {
                "caseId": case_id,
                "donorId": donor_id,
                "donorName": donor_name,
                "pledgedVia": "IVR_KEYPAD_1",
                "unitsArranged": case.get("unitsArranged", 1) if case else 1,
                "status": "Confirmed & En Route"
            })

        response_twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi" language="en-IN">
        Thank you for your life saving pledge! Requisition details and your handshake OTP have been sent to your phone via SMS. Please proceed to {hospital_name}. DonorPulse salutes you!
    </Say>
    <Hangup/>
</Response>"""
        return response_twiml, "ACCEPTED"

    elif digits == "2":
        # DONOR DECLINED
        if case and "donors" in case and isinstance(case["donors"], list):
            for d in case["donors"]:
                if str(d.get("id")) == str(donor_id):
                    d["callStatus"] = "declined"

        if live_event_callback and callable(live_event_callback):
            live_event_callback("DONOR_DECLINED", {
                "caseId": case_id,
                "donorId": donor_id,
                "donorName": donor_name,
                "reason": "Declined via IVR Keypad 2"
            })

        response_twiml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi" language="en-IN">
        Thank you for letting us know. You have been marked unavailable for this requisition. Stay safe!
    </Say>
    <Hangup/>
</Response>"""
        return response_twiml, "DECLINED"

    else:
        # Invalid input
        response_twiml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi" language="en-IN">
        Invalid option selected. Please check your SMS to accept or view details. Thank you.
    </Say>
    <Hangup/>
</Response>"""
        return response_twiml, "INVALID"

def update_call_status_from_webhook(webhook_payload, live_event_callback=None):
    """
    Processes Twilio status callback payloads (e.g. CallSid, CallStatus, CallDuration).
    """
    call_sid = webhook_payload.get("CallSid")
    call_status = webhook_payload.get("CallStatus", "unknown").lower()
    call_duration = webhook_payload.get("CallDuration", "0")

    if not call_sid or call_sid not in ACTIVE_CALLS:
        # Check logs
        return {"success": False, "message": "Call SID not tracked in active memory"}

    call_ctx = ACTIVE_CALLS[call_sid]
    call_ctx["callStatus"] = call_status
    call_ctx["duration"] = call_duration

    # Log update
    for l in reversed(TELEPHONY_LOGS):
        if l.get("callSid") == call_sid:
            l["callStatus"] = call_status
            l["duration"] = call_duration
            break

    persist_telephony_logs()

    if live_event_callback and callable(live_event_callback):
        live_event_callback("CALL_STATUS_UPDATE", {
            "callSid": call_sid,
            "caseId": call_ctx.get("caseId"),
            "donorId": call_ctx.get("donorId"),
            "donorName": call_ctx.get("donorName"),
            "callStatus": call_status,
            "duration": call_duration,
            "flow": call_ctx.get("type")
        })

    return {"success": True, "callSid": call_sid, "status": call_status}
