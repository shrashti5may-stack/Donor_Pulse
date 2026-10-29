import urllib.request
import json

base_url = 'http://localhost:3000'

# Create eligible donor
eligible_donor = {
    "name": "Eligible Test Donor",
    "fullName": "Eligible Test Donor",
    "bloodGroup": "O-",
    "phone": "+91 99999 22222",
    "email": "elig.test@pulse.in",
    "password": "+91 99999 22222",
    "lastDonationDate": "2026-06-14",
    "isAvailable": True,
    "availability": True,
    "role": "DONOR",
    "coordinates": {"type": "Point", "coordinates": [77.5983, 12.8958]}
}

reg_req = urllib.request.Request(
    f"{base_url}/api/donor/register",
    data=json.dumps(eligible_donor).encode('utf-8'),
    headers={"Content-Type": "application/json"}
)
res = urllib.request.urlopen(reg_req)
donor_data = json.loads(res.read().decode('utf-8'))
donor_id = donor_data['donor']['id']
print(f"Registered eligible donor: {donor_id} with lastDonationDate: 2026-06-14 (137 days ago)")

# Fetch private event queue for this donor
event_req = urllib.request.Request(f"{base_url}/api/events/poll?room=user_{donor_id}")
res = urllib.request.urlopen(event_req)
events = json.loads(res.read().decode('utf-8'))
print(f"Initial events for eligible donor: {len(events)}")

# Create request for O-
req_body = {
    "patientId": "test_patient_elig",
    "patientName": "Critical Trauma Patient 2",
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
print(f"Request response: success={req_resp['success']}, count={req_resp['matchedDonorsCount']}")

# Check if eligible donor received event
res = urllib.request.urlopen(event_req)
events = json.loads(res.read().decode('utf-8'))
print(f"Events delivered to eligible donor's private room: {len(events)}")
assert len(events) > 0, "Eligible donor should receive matched request event"
print("SUCCESS: Eligible donor successfully received matched emergency notification!")

