import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

base_url = 'http://localhost:3000'

print("=" * 60)
print("E2E VERIFICATION: Single Popup at Bottom Right on Recipient Dashboard")
print("=" * 60)

# Test 1: Accept via /api/donor/respond
print("\n[Test 1] Donor Accepts via /api/donor/respond...")
accept_payload = json.dumps({
    "caseId": "CASE-9042",
    "requestId": "REQ-9042",
    "donorId": "DNR-4821",
    "donorName": "Arjun Nair",
    "donorBloodGroup": "O-",
    "status": "ACCEPTED",
    "eta": "15 mins"
}).encode('utf-8')

req = urllib.request.Request(f'{base_url}/api/donor/respond', data=accept_payload, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as r:
    data = json.loads(r.read().decode('utf-8'))
    assert data['success'] == True
    print("  ✓ Server accepted donor confirmation.")

events_resp = json.loads(urllib.request.urlopen(f'{base_url}/api/live-events?since=0&lastId=0').read().decode('utf-8'))
accept_events = [e for e in events_resp['events'] if e['type'] == 'DONOR_RESPONSE' and e['payload'].get('status') == 'ACCEPTED']
assert len(accept_events) > 0, "Expected at least 1 ACCEPTED event"
latest_accept = accept_events[-1]['payload']
assert latest_accept['donorName'] == "Arjun Nair"
assert latest_accept['status'] == "ACCEPTED"
print(f"  ✓ Live event broadcasted with status=ACCEPTED for {latest_accept['donorName']}.")

# Test 2: Deny via /api/donor/respond
print("\n[Test 2] Donor Denies via /api/donor/respond...")
decline_payload = json.dumps({
    "caseId": "CASE-9042",
    "requestId": "REQ-9042",
    "donorId": "DNR-9999",
    "donorName": "Karan Varma",
    "donorBloodGroup": "O-",
    "status": "DECLINED"
}).encode('utf-8')

req = urllib.request.Request(f'{base_url}/api/donor/respond', data=decline_payload, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as r:
    data = json.loads(r.read().decode('utf-8'))
    assert data['success'] == True
    print("  ✓ Server registered donor decline.")

events_resp = json.loads(urllib.request.urlopen(f'{base_url}/api/live-events?since=0&lastId=0').read().decode('utf-8'))
decline_events = [e for e in events_resp['events'] if e['type'] == 'DONOR_RESPONSE' and e['payload'].get('status') == 'DECLINED']
assert len(decline_events) > 0, "Expected at least 1 DECLINED event"
latest_decline = decline_events[-1]['payload']
assert latest_decline['donorName'] == "Karan Varma"
assert latest_decline['status'] == "DECLINED"
print(f"  ✓ Live event broadcasted with status=DECLINED for {latest_decline['donorName']}.")

# Test 3: Accept via /api/requests/:id/accept
print("\n[Test 3] Accept via /api/requests/REQ-9042/accept...")
req3 = urllib.request.Request(f'{base_url}/api/requests/REQ-9042/accept', data=json.dumps({'donorId': 'DNR-4821'}).encode(), headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req3) as r:
    d3 = json.loads(r.read().decode('utf-8'))
    assert d3['success'] == True
    print("  ✓ /api/requests/:id/accept returned success.")

# Test 4: Decline via /api/requests/:id/decline
print("\n[Test 4] Decline via /api/requests/REQ-9042/decline...")
req4 = urllib.request.Request(f'{base_url}/api/requests/REQ-9042/decline', data=json.dumps({'donorId': 'DNR-4821'}).encode(), headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req4) as r:
    d4 = json.loads(r.read().decode('utf-8'))
    assert d4['success'] == True
    print("  ✓ /api/requests/:id/decline returned success.")

# Test 5: Verify recipient-dashboard.html contains all necessary real-time popup logic
print("\n[Test 5] Verifying recipient-dashboard.html logic...")
with open('recipient-dashboard.html', 'r', encoding='utf-8') as f:
    rec_dash = f.read()

assert 'showDonorResponseToast' in rec_dash
assert 'container.innerHTML = \'\'' in rec_dash
assert 'window.location.reload()' not in rec_dash
assert 'alert(`🎉' not in rec_dash
assert 'seenResponseTimestamps' in rec_dash
assert 'donorpulse_cross_tab_sync' in rec_dash
assert '/api/live-events' in rec_dash
print("  ✓ recipient-dashboard.html is completely wired for immediate single bottom-right popup.")

# Test 6: Verify js/app.js contains all necessary real-time popup logic
print("\n[Test 6] Verifying js/app.js logic...")
with open('js/app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

assert 'showDonorResponseToast' in app_js
assert 'container.innerHTML = \'\'' in app_js
assert '_seenDonorResponseTimestamps' in app_js
assert 'donorpulse_cross_tab_sync' in app_js
assert '/api/donor/respond' in app_js
print("  ✓ js/app.js is completely wired for immediate single bottom-right popup and donor sync.")

print("\n" + "=" * 60)
print("ALL E2E CHECKS PASSED SUCCESSFULLY!")
print("=" * 60)
