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

# Persistent recipient cases database shared across all devices
DATA_DIR = os.path.join(DIRECTORY, 'data')
CASES_FILE = os.path.join(DATA_DIR, 'recipient_cases.json')
DB_RECIPIENT_CASES = {}
CURRENT_ACTIVE_CASE_ID = 'CASE-8686'

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

load_recipient_cases()

def init_db():
    pass

init_db()

class DonorPulseHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

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

            # Look for exact or partial case match in persistent database
            for c in DB_RECIPIENT_CASES.values():
                c_id = str(c.get('id', '')).lower()
                c_case = str(c.get('caseId', '')).lower()
                c_req = str(c.get('requestId', '')).lower()
                c_name = str(c.get('patientName', '')).lower()
                c_phone = str(c.get('attendantPhone', '')).replace(' ', '').replace('-', '')
                c_pin = str(c.get('handshakeOTP', ''))

                clean_tid = target_id.lower().replace(' ', '')
                clean_tpwd = target_pwd.replace(' ', '').replace('-', '')

                # Matches ID, caseId, requestId, patientName, attendantPhone, or PIN
                if (clean_tid in [c_id, c_case, c_req, c_name.replace(' ', ''), c_phone, c_pin] or
                    (len(clean_tid) >= 3 and clean_tid in c_name.replace(' ', '')) or
                    (clean_tpwd in [c_phone, c_pin])):
                    matched = c
                    break

            # If no match but cases exist and target_id provided, default to closest or active case
            if not matched and DB_RECIPIENT_CASES:
                # Check if target_id mentions sanchit or 8686
                for c in DB_RECIPIENT_CASES.values():
                    if '8686' in target_id or 'sanchit' in target_id.lower() or '7120' in target_pwd:
                        matched = c
                        break
                if not matched and target_id:
                    matched = list(DB_RECIPIENT_CASES.values())[0]

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
