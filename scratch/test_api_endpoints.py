import urllib.request
import json

base_url = "http://localhost:3000"

def get(path):
    req = urllib.request.Request(f"{base_url}{path}")
    with urllib.request.urlopen(req) as resp:
        return resp.status, resp.read().decode('utf-8')

def post(path, data):
    body = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(f"{base_url}{path}", data=body, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        return resp.status, resp.read().decode('utf-8')

print("1. Checking GET /api/donors/current...")
status, body = get("/api/donors/current")
assert status == 200, f"Status: {status}"
res = json.loads(body)
donor = res.get('donor')
print(f"Donor: {donor.get('fullName')}, DOB: {donor.get('dateOfBirth')}, Age: {donor.get('age')}")
assert donor.get('dateOfBirth') == '1997-04-12'
assert donor.get('age') == 29, f"Expected 29, got {donor.get('age')}"

print("2. Checking GET /api/recipient-cases/current...")
status, body = get("/api/recipient-cases/current")
assert status == 200, f"Status: {status}"
res = json.loads(body)
case_data = res.get('case')
print(f"Case: {case_data.get('patientName')}, DOB: {case_data.get('patientDob')}, Age: {case_data.get('patientAge')}")
assert case_data.get('patientDob') == '1996-05-18'
assert case_data.get('patientAge') == 30, f"Expected 30, got {case_data.get('patientAge')}"

print("3. Testing POST /api/donor/register with DOB...")
new_donor_payload = {
    "fullName": "Priya Sen",
    "dob": "2001-02-10",
    "gender": "Female",
    "bloodGroup": "B+",
    "phone": "+91 98888 77777",
    "email": "priya.sen@example.com",
    "city": "Bengaluru, Karnataka",
    "address": "Indiranagar 100ft Road",
    "radiusMiles": 15
}
status, body = post("/api/donor/register", new_donor_payload)
assert status in (200, 201), f"Status: {status}"
res = json.loads(body)
assert res.get('success') is True
reg_donor = res.get('donor')
print(f"Registered Donor: {reg_donor.get('fullName')}, DOB: {reg_donor.get('dateOfBirth')}, Age: {reg_donor.get('age')}")
assert reg_donor.get('dateOfBirth') == '2001-02-10'
assert reg_donor.get('age') == 25, f"Expected 25, got {reg_donor.get('age')}"

print("4. Testing POST /api/recipient-cases with patientDob...")
new_case_payload = {
    "id": "CASE-9991",
    "caseId": "CASE-9991",
    "patientName": "Aarav Gupta",
    "patientDob": "2016-07-20",
    "patientGender": "Male",
    "bloodGroup": "O+",
    "unitsRequired": 2,
    "urgency": "Emergency",
    "hospitalName": "Apollo Hospital Bengaluru",
    "hospitalWard": "Pediatric ICU Bed 14",
    "hospitalAddress": "Bannerghatta Road",
    "attendantName": "Dr. Ramesh",
    "attendantPhone": "+91 97777 66666"
}
status, body = post("/api/recipient-cases", new_case_payload)
assert status in (200, 201), f"Status: {status}"
res = json.loads(body)
assert res.get('success') is True
reg_case = res.get('case')
print(f"Created Requisition: {reg_case.get('patientName')}, DOB: {reg_case.get('patientDob')}, Age: {reg_case.get('patientAge')}")
assert reg_case.get('patientDob') == '2016-07-20'
assert reg_case.get('patientAge') == 10, f"Expected 10, got {reg_case.get('patientAge')}"

print("5. Checking HTML files have Date of Birth fields...")
for page in ["/index.html", "/recipient-dashboard.html", "/role-selection.html"]:
    status, body = get(page)
    assert status == 200
    assert "Date of Birth" in body, f"Date of Birth missing from {page}"
    print(f"Verified {page} contains 'Date of Birth'")

print("\nALL SERVER END-TO-END CHECKS PASSED PERFECTLY! 🚀")
