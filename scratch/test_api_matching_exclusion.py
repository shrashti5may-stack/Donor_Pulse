import urllib.request
import json

base_url = 'http://localhost:3000'

# Create a test donor in recovery
recovery_donor = {
    "name": "Recovery Test Donor",
    "fullName": "Recovery Test Donor",
    "bloodGroup": "O-",
    "phone": "+91 99999 11111",
    "email": "rec.test@pulse.in",
    "password": "+91 99999 11111",
    "lastDonationDate": "2026-09-18",
    "isAvailable": True,
    "availability": True,
    "role": "DONOR",
    "coordinates": {"type": "Point", "coordinates": [77.5983, 12.8958]}
}

reg_req = urllib.request.Request(
    f"{base_url}/api/donor/register",
    data=json.dumps(recovery_donor).encode('utf-8'),
    headers={"Content-Type": "application/json"}
)
res = urllib.request.urlopen(reg_req)
donor_data = json.loads(res.read().decode('utf-8'))
donor_id = donor_data['donor']['id']
print(f"Registered recovery test donor: {donor_id} with lastDonationDate: 2026-09-18")

# Now create an emergency request for O-
req_body = {
    "patientId": "test_patient_rec_check",
    "patientName": "Critical Trauma Patient",
    "bloodGroupNeeded": "O-",
    "unitsNeeded": 1,
    "hospitalName": "Trauma Emergency",
    "coordinates": [77.5983, 12.8958]
}

req_obj = urllib.request.Request(
    f"{base_url}/api/requests",
    data=json.dumps(req_body).encode('utf-8'),
    headers={"Content-Type": "application/json"}
)
res = urllib.request.urlopen(req_obj)
req_resp = json.loads(res.read().decode('utf-8'))
print("req_resp keys:", req_resp.keys())
matched_count = req_resp.get('matchedDonorsCount', 0)
matched_donors = req_resp.get('matchedDonors', [])
print(f"Matched donors count: {matched_count}, list len: {len(matched_donors)}")

matched_ids = [d.get('id') or (d.get('donor') and d['donor'].get('id')) for d in matched_donors]
print(f"Matched IDs: {matched_ids}")
assert donor_id not in matched_ids, f"ERROR: Donor {donor_id} in 90-day recovery was alerted!"
print("SUCCESS: Recovery donor was strictly excluded from notification and dispatch matching!")
