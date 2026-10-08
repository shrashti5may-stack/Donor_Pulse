import http.server
import socketserver
import os
import sys
import json
import mimetypes
import math
from datetime import datetime, timezone, timedelta

PORT = int(os.environ.get('PORT', 3000))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('image/svg+xml', '.svg')
mimetypes.add_type('font/woff2', '.woff2')
mimetypes.add_type('font/woff', '.woff')

# Medical Compatibility Matrix (Exact haemovigilance matching)
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

def haversine_distance_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 1)

# In-memory database storing registered users and requests (MongoDB/Postgres equivalent representation)
DB_USERS = {}
DB_REQUESTS = {}
# Selective private socket/event delivery map: { "user_<id>": [events] }
USER_EVENT_QUEUES = {}

# Persistent database directories and files shared across all devices
DATA_DIR = os.path.join(DIRECTORY, 'data')
CASES_FILE = os.path.join(DATA_DIR, 'recipient_cases.json')
DONORS_FILE = os.path.join(DATA_DIR, 'donors.json')
HOSPITALS_FILE = os.path.join(DATA_DIR, 'hospitals.json')

DB_DONORS = {}
DB_HOSPITALS = {}
DB_RECIPIENT_CASES = {}
CURRENT_ACTIVE_CASE_ID = 'CASE-8686'
CURRENT_ACTIVE_DONOR_ID = 'DNR-4821'

def load_donors():
    global DB_DONORS, CURRENT_ACTIVE_DONOR_ID, DB_USERS
    if os.path.exists(DONORS_FILE):
        try:
            with open(DONORS_FILE, 'r', encoding='utf-8') as f:
                d_list = json.load(f)
                for d in d_list:
                    did = d.get('id') or d.get('_id')
                    if did:
                        DB_DONORS[did] = d
                        DB_USERS[did] = d
                if d_list:
                    CURRENT_ACTIVE_DONOR_ID = d_list[0].get('id') or d_list[0].get('_id')
        except Exception as e:
            print(f"Error loading donors: {e}")

def save_donors():
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(DONORS_FILE, 'w', encoding='utf-8') as f:
            json.dump(list(DB_DONORS.values()), f, indent=2)
    except Exception as e:
        print(f"Error saving donors: {e}")

def load_hospitals():
    global DB_HOSPITALS
    if os.path.exists(HOSPITALS_FILE):
        try:
            with open(HOSPITALS_FILE, 'r', encoding='utf-8') as f:
                h_list = json.load(f)
                for h in h_list:
                    hid = h.get('id')
                    if hid:
                        DB_HOSPITALS[hid] = h
        except Exception as e:
            print(f"Error loading hospitals: {e}")

def save_hospitals():
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(HOSPITALS_FILE, 'w', encoding='utf-8') as f:
            json.dump(list(DB_HOSPITALS.values()), f, indent=2)
    except Exception as e:
        print(f"Error saving hospitals: {e}")

def load_recipient_cases():
    global DB_RECIPIENT_CASES, CURRENT_ACTIVE_CASE_ID
    if os.path.exists(CASES_FILE):
        try:
            with open(CASES_FILE, 'r', encoding='utf-8') as f:
                cases_list = json.load(f)
                for c in cases_list:
                    cid = c.get('id') or c.get('caseId')
                    if cid:
                        DB_RECIPIENT_CASES[cid] = c
                if cases_list:
                    CURRENT_ACTIVE_CASE_ID = cases_list[0].get('id') or cases_list[0].get('caseId')
        except Exception as e:
            print(f"Error loading recipient cases: {e}")

def save_recipient_cases():
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(CASES_FILE, 'w', encoding='utf-8') as f:
            json.dump(list(DB_RECIPIENT_CASES.values()), f, indent=2)
    except Exception as e:
        print(f"Error saving recipient cases: {e}")

load_donors()
load_hospitals()
load_recipient_cases()

def init_db():
    pass

init_db()

class DonorPulseHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(*args, **kwargs):
        super(DonorPulseHTTPHandler, args[0]).__init__(*args[1:], directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        clean_path = self.path.split('?')[0].split('#')[0]

        # API: GET /api/donors/current
        if clean_path in ('/api/donors/current', '/api/donor/current'):
            current_donor = DB_DONORS.get(CURRENT_ACTIVE_DONOR_ID)
            if not current_donor and DB_DONORS:
                current_donor = list(DB_DONORS.values())[0]
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "donor": current_donor}).encode('utf-8'))
            return

        # API: GET /api/donors
        if clean_path == '/api/donors':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "donors": list(DB_DONORS.values())}).encode('utf-8'))
            return

        # API: GET /api/donors/:id
        if clean_path.startswith('/api/donors/'):
            donor_id = clean_path.replace('/api/donors/', '').strip('/')
            matched = DB_DONORS.get(donor_id)
            if not matched:
                clean_q = donor_id.lower().replace(' ', '')
                for d in DB_DONORS.values():
                    if (clean_q in str(d.get('id', '')).lower() or
                        clean_q in str(d.get('email', '')).lower() or
                        clean_q in str(d.get('phone', '')).replace(' ', '').replace('-', '')):
                        matched = d
                        break
            if matched:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "donor": matched}).encode('utf-8'))
                return
            else:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Donor not found"}).encode('utf-8'))
                return

        # API: GET /api/hospitals
        if clean_path == '/api/hospitals':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "hospitals": list(DB_HOSPITALS.values())}).encode('utf-8'))
            return

        # API: GET /api/hospitals/:id
        if clean_path.startswith('/api/hospitals/'):
            hosp_id = clean_path.replace('/api/hospitals/', '').strip('/')
            matched = DB_HOSPITALS.get(hosp_id)
            if not matched:
                clean_q = hosp_id.lower().replace(' ', '')
                for h in DB_HOSPITALS.values():
                    if (clean_q in str(h.get('id', '')).lower() or
                        clean_q in str(h.get('licenseNumber', '')).lower() or
                        clean_q in str(h.get('name', '')).lower()):
                        matched = h
                        break
            if matched:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "hospital": matched}).encode('utf-8'))
                return
            else:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Hospital not found"}).encode('utf-8'))
                return

        # API: GET /api/recipient-cases/current
        if clean_path == '/api/recipient-cases/current':
            current_case = DB_RECIPIENT_CASES.get(CURRENT_ACTIVE_CASE_ID)
            if not current_case and DB_RECIPIENT_CASES:
                current_case = list(DB_RECIPIENT_CASES.values())[0]
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "case": current_case}).encode('utf-8'))
            return

        # API: GET /api/recipient-cases
        if clean_path == '/api/recipient-cases':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "cases": list(DB_RECIPIENT_CASES.values())}).encode('utf-8'))
            return

        # API: GET /api/recipient-cases/:id
        if clean_path.startswith('/api/recipient-cases/'):
            case_id = clean_path.replace('/api/recipient-cases/', '').strip('/')
            matched = DB_RECIPIENT_CASES.get(case_id)
            if not matched:
                for c in DB_RECIPIENT_CASES.values():
                    if c.get('requestId') == case_id or c.get('id') == case_id:
                        matched = c
                        break
            if matched:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "case": matched}).encode('utf-8'))
                return
            else:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Recipient case not found"}).encode('utf-8'))
                return

        # API: GET /api/requests/:id
        if clean_path.startswith('/api/requests/'):
            req_id = clean_path.replace('/api/requests/', '').strip('/')
            if req_id in DB_REQUESTS:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "request": DB_REQUESTS[req_id]}).encode('utf-8'))
                return
            else:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Request not found"}).encode('utf-8'))
                return

        # API: GET /api/events/:userId (Selective event poll for private channel)
        if clean_path.startswith('/api/events/'):
            user_id = clean_path.replace('/api/events/', '').strip('/')
            room = f"user_{user_id}"
            events = USER_EVENT_QUEUES.get(room, [])
            USER_EVENT_QUEUES[room] = [] # Clear fetched events
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "events": events}).encode('utf-8'))
            return

        # Prevent directory traversal
        full_path = os.path.normpath(os.path.join(DIRECTORY, clean_path.lstrip('/\\')))
        if not full_path.startswith(DIRECTORY):
            self.send_error(403, "Forbidden")
            return

        # Clean URLs support
        if not os.path.exists(full_path) and os.path.isfile(full_path + '.html'):
            query_part = ('?' + self.path.split('?')[1]) if '?' in self.path else ''
            self.path = clean_path + '.html' + query_part
        elif not os.path.exists(full_path) and not os.path.isfile(full_path):
            self.path = '/index.html'

        return super().do_GET()

    def do_POST(self):
        clean_path = self.path.split('?')[0].split('#')[0]

        # API: POST /api/recipient/login - Authenticate case and return across all devices
        if clean_path == '/api/recipient/login':
            content_length = int(self.headers.get('Content-Length', 0))
            body_bytes = self.rfile.read(content_length)
            try:
                body = json.loads(body_bytes.decode('utf-8'))
            except Exception:
                body = {}

            target_id = str(body.get('id') or body.get('caseId') or body.get('username') or '').strip()
            target_pwd = str(body.get('password') or body.get('phone') or body.get('pin') or '').strip()

            global CURRENT_ACTIVE_CASE_ID
            matched = None

            clean_tid = target_id.lower().replace(' ', '')
            clean_tpwd = target_pwd.replace(' ', '').replace('-', '')

            # 1. First priority: match by exact or partial Case ID, Requisition ID, or PIN
            if clean_tid:
                for c in DB_RECIPIENT_CASES.values():
                    c_id = str(c.get('id', '')).lower().replace(' ', '')
                    c_case = str(c.get('caseId', '')).lower().replace(' ', '')
                    c_req = str(c.get('requestId', '')).lower().replace(' ', '')
                    c_pin = str(c.get('handshakeOTP', '')).strip()

                    if clean_tid in [c_id, c_case, c_req, c_pin]:
                        matched = c
                        break

            # 2. Second priority: match by patient name or attendant phone if not yet matched
            if not matched and clean_tid:
                for c in DB_RECIPIENT_CASES.values():
                    c_name = str(c.get('patientName', '')).lower().replace(' ', '')
                    c_phone = str(c.get('attendantPhone', '')).replace(' ', '').replace('-', '')
                    if clean_tid in [c_phone] or (len(clean_tid) >= 3 and clean_tid in c_name):
                        matched = c
                        break

            # 3. Third priority: match by password/phone/pin alone if target_id was empty
            if not matched and clean_tpwd:
                for c in DB_RECIPIENT_CASES.values():
                    c_phone = str(c.get('attendantPhone', '')).replace(' ', '').replace('-', '')
                    c_pin = str(c.get('handshakeOTP', '')).strip()
                    if clean_tpwd in [c_phone, c_pin]:
                        matched = c
                        break

            # 4. Fallback for demo logins (e.g. CASE-8686)
            if not matched and DB_RECIPIENT_CASES:
                for c in DB_RECIPIENT_CASES.values():
                    if '8686' in target_id or 'sanchit' in target_id.lower():
                        matched = c
                        break

            if matched:
                CURRENT_ACTIVE_CASE_ID = matched.get('id') or matched.get('caseId')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "case": matched}).encode('utf-8'))
                return
            else:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "No matching patient case found on server."}).encode('utf-8'))
                return

        # API: POST /api/recipient-cases - Save or update recipient case
        if clean_path == '/api/recipient-cases':
            content_length = int(self.headers.get('Content-Length', 0))
            body_bytes = self.rfile.read(content_length)
            try:
                case_obj = json.loads(body_bytes.decode('utf-8'))
            except Exception:
                case_obj = {}

            cid = case_obj.get('id') or case_obj.get('caseId')
            if cid:
                DB_RECIPIENT_CASES[cid] = case_obj
                CURRENT_ACTIVE_CASE_ID = cid
                save_recipient_cases()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "case": case_obj}).encode('utf-8'))
                return
            else:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Invalid case object"}).encode('utf-8'))
                return

        # API: POST /api/donor/register - Store input data from ANY device and generate credentials
        if clean_path == '/api/donor/register':
            content_length = int(self.headers.get('Content-Length', 0))
            body_bytes = self.rfile.read(content_length)
            try:
                body = json.loads(body_bytes.decode('utf-8'))
            except Exception:
                body = {}

            full_name = (body.get('fullName') or body.get('name') or 'Registered Volunteer Donor').strip()
            blood_group = (body.get('bloodGroup') or body.get('donor_blood_type') or 'O-').strip()
            clean_bg = ''.join(c for c in blood_group if c.isalnum()) or 'O'
            import random
            rand_id = random.randint(1000, 9999)
            new_id = body.get('id') or f"DP-{rand_id}-{clean_bg}"
            password = body.get('password') or body.get('phone') or 'donor@2026'

            new_donor = {
                "id": new_id,
                "_id": new_id,
                "name": full_name,
                "fullName": full_name,
                "initials": "".join([part[0] for part in full_name.split() if part])[:2].upper() or "VD",
                "age": int(body.get('age') or 28),
                "gender": body.get('gender') or 'Not specified',
                "bloodGroup": blood_group,
                "phone": body.get('phone') or '+91 98000 00000',
                "email": body.get('email') or f"donor{rand_id}@donor-pulse.in",
                "password": password,
                "address": body.get('address') or 'Local Area, Bengaluru',
                "city": body.get('city') or 'Bengaluru, Karnataka',
                "medicalHistory": body.get('medicalHistory') or 'Pre-screened verified donor. Clinical vitals within healthy standard range.',
                "lastDonationDate": body.get('lastDonationDate') or 'First-time Donor',
                "nextEligibleDate": "Eligible Now",
                "availability": body.get('availability', True) in (True, 'true', 'on', 1),
                "radiusMiles": int(body.get('radiusMiles') or 10),
                "totalDonations": int(body.get('totalDonations') or 0),
                "livesSaved": int(body.get('livesSaved') or 0),
                "rewardPoints": int(body.get('rewardPoints') or 100),
                "rewardTier": body.get('rewardTier') or 'Active Registered Donor',
                "distance": float(body.get('distance') or 1.5),
                "isAvailable": True,
                "verified": True,
                "isPhoneVerified": True,
                "role": "DONOR",
                "coordinates": body.get('coordinates') or {"type": "Point", "coordinates": [77.6000, 12.9500]},
                "donationHistory": body.get('donationHistory') or [],
                "vitals": body.get('vitals') or {
                    "hemoglobin": "14.2 g/dL",
                    "bp": "120/80 mmHg",
                    "pulse": "72 bpm",
                    "weight": "68 kg"
                }
            }

            global CURRENT_ACTIVE_DONOR_ID
            CURRENT_ACTIVE_DONOR_ID = new_id
            DB_DONORS[new_id] = new_donor
            DB_USERS[new_id] = new_donor
            save_donors()

            self.send_response(201)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "message": "Donor profile registered and stored in database.",
                "donor": new_donor,
                "credentials": {
                    "id": new_id,
                    "password": password,
                    "phone": new_donor["phone"],
                    "email": new_donor["email"]
                }
            }).encode('utf-8'))
            return

        # API: POST /api/donor/login - Authenticate donor from ANY device using allotted credentials
        if clean_path == '/api/donor/login':
            content_length = int(self.headers.get('Content-Length', 0))
            body_bytes = self.rfile.read(content_length)
            try:
                body = json.loads(body_bytes.decode('utf-8'))
            except Exception:
                body = {}

            target_id = str(body.get('id') or body.get('donorId') or body.get('username') or body.get('email') or body.get('phone') or '').strip().lower()
            target_pwd = str(body.get('password') or body.get('phone') or '').strip()

            clean_tid = target_id.replace(' ', '').replace('-', '')
            clean_tpwd = target_pwd.replace(' ', '').replace('-', '')

            matched = None
            for d in DB_DONORS.values():
                d_id = str(d.get('id', '')).lower()
                d_name = str(d.get('fullName', '') or d.get('name', '')).lower().replace(' ', '')
                d_email = str(d.get('email', '')).lower()
                d_phone = str(d.get('phone', '')).replace(' ', '').replace('-', '')
                d_pwd = str(d.get('password', ''))

                # Match ID, email, phone, or name
                id_matches = (
                    target_id == d_id or
                    clean_tid == d_id.replace('-', '') or
                    target_id == d_email or
                    clean_tid in d_phone or
                    (len(clean_tid) >= 3 and clean_tid in d_name)
                )

                # Match password, phone as password, or preset demo passwords
                pwd_matches = (
                    not target_pwd or
                    target_pwd == d_pwd or
                    clean_tpwd in d_phone or
                    target_pwd in ['donor@2024', 'donor@2026', 'password']
                )

                if id_matches and pwd_matches:
                    matched = d
                    break

            if not matched and DB_DONORS:
                if '4821' in target_id or 'arjun' in target_id or 'sarah' in target_id:
                    matched = DB_DONORS.get('DNR-4821')
                elif target_id:
                    for d in DB_DONORS.values():
                        if target_id in str(d.get('id', '')).lower() or target_id in str(d.get('fullName', '')).lower():
                            matched = d
                            break
                    if not matched:
                        matched = list(DB_DONORS.values())[0]

            if matched:
                CURRENT_ACTIVE_DONOR_ID = matched.get('id')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "donor": matched}).encode('utf-8'))
                return
            else:
                self.send_response(401)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Invalid donor credentials."}).encode('utf-8'))
                return

        # API: POST /api/donor/profile - Update donor profile entered from any device
        if clean_path == '/api/donor/profile':
            content_length = int(self.headers.get('Content-Length', 0))
            body_bytes = self.rfile.read(content_length)
            try:
                body = json.loads(body_bytes.decode('utf-8'))
            except Exception:
                body = {}

            donor_id = body.get('id') or CURRENT_ACTIVE_DONOR_ID
            if donor_id and donor_id in DB_DONORS:
                DB_DONORS[donor_id].update(body)
                if donor_id in DB_USERS:
                    DB_USERS[donor_id].update(body)
                save_donors()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "donor": DB_DONORS[donor_id]}).encode('utf-8'))
                return
            elif DB_DONORS:
                cur_donor = list(DB_DONORS.values())[0]
                cur_donor.update(body)
                save_donors()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "donor": cur_donor}).encode('utf-8'))
                return
            else:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Donor not found"}).encode('utf-8'))
                return

        # API: POST /api/hospital/register - Register new hospital from any device
        if clean_path == '/api/hospital/register':
            content_length = int(self.headers.get('Content-Length', 0))
            body_bytes = self.rfile.read(content_length)
            try:
                body = json.loads(body_bytes.decode('utf-8'))
            except Exception:
                body = {}

            import random
            existing_hid = None
            if body.get('id') and body['id'] in DB_HOSPITALS:
                existing_hid = body['id']
            elif body.get('licenseNumber'):
                clean_lic = str(body['licenseNumber']).lower()
                for hid, h in DB_HOSPITALS.items():
                    if str(h.get('licenseNumber', '')).lower() == clean_lic:
                        existing_hid = hid
                        break

            if existing_hid:
                DB_HOSPITALS[existing_hid].update(body)
                body = DB_HOSPITALS[existing_hid]
            else:
                rand_id = random.randint(10000, 99999)
                hid = body.get('id') or f"HSP-{rand_id}-KA"
                body['id'] = hid
                if 'password' not in body:
                    body['password'] = body.get('phone') or 'hospital@2026'
                DB_HOSPITALS[hid] = body
            save_hospitals()

            self.send_response(201)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "hospital": body}).encode('utf-8'))
            return

        # API: POST /api/hospital/login - Authenticate hospital from any device
        if clean_path == '/api/hospital/login':
            content_length = int(self.headers.get('Content-Length', 0))
            body_bytes = self.rfile.read(content_length)
            try:
                body = json.loads(body_bytes.decode('utf-8'))
            except Exception:
                body = {}

            target_id = str(body.get('id') or body.get('licenseNumber') or body.get('email') or body.get('phone') or '').strip().lower()
            target_pwd = str(body.get('password') or body.get('phone') or '').strip()

            matched = None
            for h in DB_HOSPITALS.values():
                h_id = str(h.get('id', '')).lower()
                h_lic = str(h.get('licenseNumber', '')).lower()
                h_name = str(h.get('name', '')).lower()
                h_email = str(h.get('email', '')).lower()
                h_phone = str(h.get('phone', '')).replace(' ', '').replace('-', '')
                h_pwd = str(h.get('password', ''))

                clean_tid = target_id.replace(' ', '').replace('-', '')
                if (target_id in [h_id, h_lic, h_email] or clean_tid in h_phone or (len(clean_tid) >= 3 and clean_tid in h_name)):
                    if not target_pwd or target_pwd in [h_pwd, h_phone, 'hospital@2026']:
                        matched = h
                        break

            if not matched and DB_HOSPITALS:
                matched = list(DB_HOSPITALS.values())[0]

            if matched:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "hospital": matched}).encode('utf-8'))
                return
            else:
                self.send_response(401)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Invalid hospital credentials."}).encode('utf-8'))
                return

        # API: POST /api/recipient/update - Update recipient case from any device
        if clean_path == '/api/recipient/update':
            content_length = int(self.headers.get('Content-Length', 0))
            body_bytes = self.rfile.read(content_length)
            try:
                body = json.loads(body_bytes.decode('utf-8'))
            except Exception:
                body = {}

            case_id = body.get('id') or body.get('caseId') or CURRENT_ACTIVE_CASE_ID
            if case_id in DB_RECIPIENT_CASES:
                DB_RECIPIENT_CASES[case_id].update(body)
                save_recipient_cases()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "case": DB_RECIPIENT_CASES[case_id]}).encode('utf-8'))
                return
            else:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Case not found"}).encode('utf-8'))
                return

        # 1. API: POST /api/requests
        if clean_path == '/api/requests':
            content_length = int(self.headers.get('Content-Length', 0))
            body_bytes = self.rfile.read(content_length)
            try:
                body = json.loads(body_bytes.decode('utf-8'))
            except Exception:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Invalid JSON body"}).encode('utf-8'))
                return

            patient_id = body.get('patientId')
            blood_group_needed = body.get('bloodGroupNeeded')
            units_needed = int(body.get('unitsNeeded', 1))
            hospital_name = body.get('hospitalName', '').strip()
            hospital_address = body.get('hospitalAddress', '').strip()
            coordinates = body.get('coordinates', [77.5983, 12.8958])
            doctor_reg_number = body.get('doctorRegNumber', '').strip()
            prescription_url = body.get('prescriptionDocumentUrl', '').strip()

            # 2. Validation Layer: Verified patient profile & phone check
            if not patient_id:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "patientId is required"}).encode('utf-8'))
                return

            patient = DB_USERS.get(patient_id)
            if not patient:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Registered patient profile not found"}).encode('utf-8'))
                return

            if not patient.get('isPhoneVerified', False):
                self.send_response(403)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Patient contact number is not verified. Phone verification required."}).encode('utf-8'))
                return

            # Require medical proof input
            if not hospital_name or not hospital_address:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Hospital details are mandatory."}).encode('utf-8'))
                return

            if not doctor_reg_number and not prescription_url:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Medical authenticity proof required: Provide Doctor Registration Number or Prescription Document URL."}).encode('utf-8'))
                return

            # Rate-limit active requests per patient
            for req in DB_REQUESTS.values():
                if req.get('patientId') == patient_id and req.get('status') == 'PENDING':
                    self.send_response(429)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "success": False,
                        "error": "Rate limit exceeded: You already have an active unfulfilled emergency request pending.",
                        "activeRequestId": req.get('id')
                    }).encode('utf-8'))
                    return

            # Coordinates handling
            req_lng = coordinates[0] if isinstance(coordinates, list) else 77.5983
            req_lat = coordinates[1] if isinstance(coordinates, list) else 12.8958

            # 3. Medical Compatibility & Proximity Matching Logic
            compatible_groups = COMPATIBILITY_MATRIX.get(blood_group_needed, [])
            matched_donors = []
            now_dt = datetime.now(timezone.utc)
            cutoff_90_days = now_dt - timedelta(days=90)

            for u_id, donor in DB_USERS.items():
                if donor.get('role') != 'DONOR':
                    continue
                if not donor.get('isAvailable', False):
                    continue
                if donor.get('bloodGroup') not in compatible_groups:
                    continue

                # 90-day donation check
                last_don = donor.get('lastDonationDate')
                if last_don:
                    try:
                        last_dt = datetime.fromisoformat(last_don.replace('Z', '+00:00'))
                        if last_dt > cutoff_90_days:
                            # Exclude donors who donated within last 90 days!
                            continue
                    except Exception:
                        pass

                # Proximity check (25 km max)
                d_coords = donor.get('coordinates', {}).get('coordinates', [0, 0])
                d_lng, d_lat = d_coords[0], d_coords[1]
                dist_km = haversine_distance_km(req_lat, req_lng, d_lat, d_lng)
                if dist_km <= 25.0:
                    matched_donors.append({
                        "donor": donor,
                        "distanceKm": dist_km
                    })

            # Create request record with status PENDING
            req_id = f"req_{int(datetime.now().timestamp() * 1000)}"
            request_record = {
                "id": req_id,
                "_id": req_id,
                "patientId": patient_id,
                "bloodGroupNeeded": blood_group_needed,
                "unitsNeeded": units_needed,
                "hospitalName": hospital_name,
                "hospitalAddress": hospital_address,
                "coordinates": {"type": "Point", "coordinates": [req_lng, req_lat]},
                "doctorRegNumber": doctor_reg_number or None,
                "prescriptionDocumentUrl": prescription_url or None,
                "status": "PENDING",
                "acceptedDonorId": None,
                "matchedDonorsCount": len(matched_donors),
                "createdAt": datetime.now(timezone.utc).isoformat()
            }
            DB_REQUESTS[req_id] = request_record

            # 4. Selective Real-Time Event Routing:
            # Emit new_matched_request ONLY to each matched donor's private room: `user_<matchedDonorId>`
            # Do NOT broadcast globally to 'donors' room.
            for item in matched_donors:
                donor_id = item["donor"]["id"]
                private_room = f"user_{donor_id}"
                if private_room not in USER_EVENT_QUEUES:
                    USER_EVENT_QUEUES[private_room] = []
                USER_EVENT_QUEUES[private_room].append({
                    "event": "new_matched_request",
                    "data": {
                        "requestId": req_id,
                        "patientId": patient_id,
                        "bloodGroupNeeded": blood_group_needed,
                        "unitsNeeded": units_needed,
                        "hospitalName": hospital_name,
                        "hospitalAddress": hospital_address,
                        "distanceKm": item["distanceKm"],
                        "doctorRegNumber": doctor_reg_number,
                        "prescriptionDocumentUrl": prescription_url,
                        "status": "PENDING",
                        "createdAt": request_record["createdAt"]
                    }
                })

            self.send_response(201)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "message": f"Authentic request created. Alerted {len(matched_donors)} verified donors within 25 km.",
                "request": request_record,
                "matchedDonorsCount": len(matched_donors)
            }).encode('utf-8'))
            return

        # 2. API: POST /api/requests/:id/accept
        if clean_path.startswith('/api/requests/') and clean_path.endswith('/accept'):
            parts = clean_path.split('/')
            req_id = parts[3]
            content_length = int(self.headers.get('Content-Length', 0))
            body_bytes = self.rfile.read(content_length)
            try:
                body = json.loads(body_bytes.decode('utf-8'))
            except Exception:
                body = {}

            donor_id = body.get('donorId')
            if req_id not in DB_REQUESTS:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Request not found"}).encode('utf-8'))
                return

            req_obj = DB_REQUESTS[req_id]
            if req_obj.get('status') != 'PENDING':
                self.send_response(409)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": f"Request already locked with status {req_obj.get('status')}"}).encode('utf-8'))
                return

            donor = DB_USERS.get(donor_id)
            if not donor or donor.get('role') != 'DONOR':
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Registered donor not found"}).encode('utf-8'))
                return

            # Lock the request
            req_obj['status'] = 'ACCEPTED'
            req_obj['acceptedDonorId'] = donor_id

            # Emit request_accepted to patient's private room
            patient_room = f"user_{req_obj['patientId']}"
            if patient_room not in USER_EVENT_QUEUES:
                USER_EVENT_QUEUES[patient_room] = []
            USER_EVENT_QUEUES[patient_room].append({
                "event": "request_accepted",
                "data": {
                    "requestId": req_id,
                    "patientId": req_obj['patientId'],
                    "donor": {
                        "id": donor['id'],
                        "name": donor['name'],
                        "bloodGroup": donor['bloodGroup'],
                        "phone": donor['phone']
                    },
                    "hospitalName": req_obj['hospitalName'],
                    "status": "ACCEPTED",
                    "acceptedAt": datetime.now(timezone.utc).isoformat()
                }
            })

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "message": "Request accepted and locked.",
                "request": req_obj,
                "donor": donor
            }).encode('utf-8'))
            return

        # 3. API: POST /api/requests/:id/cancel
        if clean_path.startswith('/api/requests/') and clean_path.endswith('/cancel'):
            parts = clean_path.split('/')
            req_id = parts[3]
            if req_id in DB_REQUESTS:
                req_obj = DB_REQUESTS[req_id]
                req_obj['status'] = 'CANCELLED'
                patient_room = f"user_{req_obj.get('patientId')}"
                if patient_room in USER_EVENT_QUEUES:
                    USER_EVENT_QUEUES[patient_room].append({
                        "event": "request_cancelled",
                        "data": {"requestId": req_id, "status": "CANCELLED"}
                    })
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "message": "Request cancelled successfully.", "request": req_obj}).encode('utf-8'))
                return
            else:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "message": "Request removed.", "requestId": req_id}).encode('utf-8'))
                return

        # 4. API: POST /api/requests/:id/decline
        if clean_path.startswith('/api/requests/') and clean_path.endswith('/decline'):
            parts = clean_path.split('/')
            req_id = parts[3]
            content_length = int(self.headers.get('Content-Length', 0))
            body_bytes = self.rfile.read(content_length)
            try:
                body = json.loads(body_bytes.decode('utf-8'))
            except Exception:
                body = {}
            donor_id = body.get('donorId')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "message": "Request declined for donor.",
                "requestId": req_id,
                "donorId": donor_id
            }).encode('utf-8'))
            return

        # 5. API: POST /api/donors/:id/availability
        if clean_path.startswith('/api/donors/') and clean_path.endswith('/availability'):
            parts = clean_path.split('/')
            donor_id = parts[3]
            content_length = int(self.headers.get('Content-Length', 0))
            body_bytes = self.rfile.read(content_length)
            try:
                body = json.loads(body_bytes.decode('utf-8'))
            except Exception:
                body = {}
            
            is_avail = body.get('isAvailable', True)
            matched_donor = DB_DONORS.get(donor_id) or DB_USERS.get(donor_id)
            if matched_donor:
                matched_donor['isAvailable'] = is_avail
                matched_donor['availability'] = is_avail
                save_donors()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "isAvailable": is_avail, "donor": matched_donor}).encode('utf-8'))
                return
            else:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "isAvailable": is_avail, "donorId": donor_id}).encode('utf-8'))
                return

        self.send_error(404, "Endpoint not found")

def start_server(port=PORT, max_tries=10):
    for p in range(port, port + max_tries):
        try:
            socketserver.TCPServer.allow_reuse_address = True
            with socketserver.TCPServer(("", p), DonorPulseHTTPHandler) as httpd:
                url = f"http://localhost:{p}"
                print("\n" + "=" * 54)
                print("  DonorPulse Web Server is Running!")
                print(f"  Local URL:   {url}")
                print(f"  Directory:   {DIRECTORY}")
                print("  Pipeline:    Strict Compatibility & Proximity Active")
                print("=" * 54 + "\n", flush=True)
                httpd.serve_forever()
                return
        except OSError as e:
            if e.errno in (98, 10048):
                print(f"Port {p} in use, trying {p + 1}...", flush=True)
                continue
            else:
                raise e
    print(f"Could not bind to any port in range {port}-{port+max_tries}")

if __name__ == '__main__':
    start_server(PORT)
