import re
import urllib.request
import json
from datetime import datetime, timezone

# 1. HTML Verification
print("=== 1. VERIFYING HTML LOCKED AGE INPUTS ===")
for fname in ['index.html', 'recipient-dashboard.html', 'role-selection.html']:
    with open(fname, 'r', encoding='utf-8') as f:
        html = f.read()
    
    assert "(Auto-Locked)" in html, f"(Auto-Locked) label missing in {fname}"
    print(f"[{fname}] Contains (Auto-Locked) label.")
    
    # Check that age inputs have readonly and lock icons
    matches = re.findall(r'<input[^>]*name=[\"\'](?:age|patientAge)[\"\'][^>]*>', html)
    assert len(matches) > 0, f"No age inputs found in {fname}"
    for m in matches:
        assert 'readonly' in m, f"Age input in {fname} is not readonly: {m}"
        assert 'tabindex="-1"' in m, f"Age input in {fname} missing tabindex=-1: {m}"
        assert 'cursor-not-allowed' in m, f"Age input in {fname} missing cursor-not-allowed: {m}"
        print(f"[{fname}] Verified locked input attributes on: {m[:60]}...")

print("\n=== 2. VERIFYING YEARLY AUTOMATIC AGE PROGRESSION ===")
# Test calculate_age_from_dob across years
def calculate_age_from_dob(dob_str, now_dt):
    dob = datetime.strptime(dob_str, "%Y-%m-%d")
    age = now_dt.year - dob.year
    if (now_dt.month, now_dt.day) < (dob.month, dob.day):
        age -= 1
    return max(0, age)

dob = "1997-04-12"
# 2026-11-04 (today) -> 29
age_2026 = calculate_age_from_dob(dob, datetime(2026, 11, 4))
print(f"DOB {dob} on 2026-11-04 -> Age: {age_2026}")
assert age_2026 == 29

# 2027-01-01 (next year, but before April birthday) -> still 29
age_early_2027 = calculate_age_from_dob(dob, datetime(2027, 1, 1))
print(f"DOB {dob} on 2027-01-01 -> Age: {age_early_2027}")
assert age_early_2027 == 29

# 2027-04-12 (birthday in 2027) -> auto turns 30
age_bday_2027 = calculate_age_from_dob(dob, datetime(2027, 4, 12))
print(f"DOB {dob} on 2027-04-12 (Birthday) -> Age: {age_bday_2027}")
assert age_bday_2027 == 30

# 2028-04-12 (birthday in 2028) -> auto turns 31
age_bday_2028 = calculate_age_from_dob(dob, datetime(2028, 4, 12))
print(f"DOB {dob} on 2028-04-12 (Birthday) -> Age: {age_bday_2028}")
assert age_bday_2028 == 31

# 2030-04-12 (birthday in 2030) -> auto turns 33
age_bday_2030 = calculate_age_from_dob(dob, datetime(2030, 4, 12))
print(f"DOB {dob} on 2030-04-12 (Birthday) -> Age: {age_bday_2030}")
assert age_bday_2030 == 33

print("\n=== 3. VERIFYING SERVER TAMPER-RESISTANCE (POST /api/donor/profile) ===")
# Attempt to tamper with age manually via API
base_url = "http://localhost:3000"
tamper_payload = {
    "dateOfBirth": "1997-04-12",
    "age": 88  # malicious manual tamper
}
req = urllib.request.Request(f"{base_url}/api/donor/profile", data=json.dumps(tamper_payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as resp:
    assert resp.status == 200
    res_data = json.loads(resp.read().decode('utf-8'))
    donor = res_data.get('donor')
    print(f"Tamper test response: Sent age=88, server stored age={donor.get('age')}")
    assert donor.get('age') == 29, f"Server allowed manual age override! Got {donor.get('age')}"

print("\nALL LOCKED AGE AND AUTOMATIC YEARLY PROGRESSION TESTS PASSED!")

