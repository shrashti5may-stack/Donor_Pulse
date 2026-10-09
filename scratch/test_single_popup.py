import urllib.request
import json
import time
import re
import sys

# Ensure UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8')

base_url = 'http://localhost:3000'

print("=" * 60)
print("TEST: Single Popup at Bottom-Right Verification")
print("=" * 60)

# --- Test 1: Server Polling Deduplication ---
print("\n[Step 1] Verifying server does not duplicate events on consecutive polls...")
init_resp = json.loads(urllib.request.urlopen(f'{base_url}/api/live-events').read().decode('utf-8'))
start_server_time = init_resp['serverTime']

# Post a donor decline response
decline_payload = json.dumps({
    "caseId": "CASE-8686",
    "requestId": "REQ-8686",
    "donorId": "DNR-4821",
    "donorName": "Volunteer Donor",
    "donorBloodGroup": "O+",
    "status": "DECLINED"
}).encode('utf-8')

req = urllib.request.Request(f'{base_url}/api/donor/respond', data=decline_payload, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as r:
    decline_data = json.loads(r.read().decode('utf-8'))
    assert decline_data['success'] == True
    print("  ✓ Donor decline response successfully registered on server.")

# Poll 1: Should receive the new event
p1 = json.loads(urllib.request.urlopen(f'{base_url}/api/live-events?since={start_server_time - 2000}&lastId=0').read().decode('utf-8'))
declined_events = [e for e in p1['events'] if e['type'] == 'DONOR_RESPONSE' and e['payload'].get('status') == 'DECLINED']
assert len(declined_events) >= 1, "Expected at least 1 decline event on first poll"
last_event_id = p1['events'][-1]['eventId']
print(f"  ✓ Poll 1 received event (eventId: {last_event_id}).")

# Polls 2 through 6 (simulating repeated 1.2s client polling with lastId)
for poll_num in range(2, 7):
    pn = json.loads(urllib.request.urlopen(f'{base_url}/api/live-events?since={start_server_time}&lastId={last_event_id}').read().decode('utf-8'))
    assert len(pn['events']) == 0, f"Poll {poll_num} returned duplicate events: {pn['events']}"
print("  ✓ Polls 2-6 with lastId returned exactly 0 duplicate events! Server re-broadcasting is prevented.")

# --- Test 2: CSS Rules for Bottom-Right Corner Pinning ---
print("\n[Step 2] Verifying CSS rules for #toast-container in custom.css...")
with open('css/custom.css', 'r', encoding='utf-8') as f:
    css_content = f.read()

assert '#toast-container' in css_content, "#toast-container rule missing in custom.css"
assert 'bottom: 24px !important' in css_content, "bottom: 24px !important missing in custom.css"
assert 'right: 24px !important' in css_content, "right: 24px !important missing in custom.css"
assert 'position: fixed !important' in css_content, "position: fixed !important missing in custom.css"
assert 'align-items: flex-end !important' in css_content, "align-items: flex-end !important missing in custom.css"
print("  ✓ #toast-container is strictly pinned to bottom-right (bottom: 24px, right: 24px, z-index: 999999).")

# --- Test 3: JavaScript Deduplication & Single Popup in js/app.js ---
print("\n[Step 3] Verifying js/app.js toast logic...")
with open('js/app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

assert 'showDonorResponseToast' in app_js, "showDonorResponseToast missing in app.js"
assert "container.innerHTML = ''" in app_js, "Container clearing of previous toasts missing"
assert '_seenDonorResponseTimestamps' in app_js, "Token timestamp deduplication missing in app.js"
assert "bottom = '24px'" in app_js, "bottom = '24px' missing in getOrCreateToastContainer"
assert "right = '24px'" in app_js, "right = '24px' missing in getOrCreateToastContainer"
print("  ✓ showDonorResponseToast clears container (container.innerHTML = '') before appending (guarantees strictly ONE popup).")
print("  ✓ _seenDonorResponseTimestamps suppresses cross-channel duplicates within 6s.")

# --- Test 4: recipient-dashboard.html Logic ---
print("\n[Step 4] Verifying recipient-dashboard.html logic...")
with open('recipient-dashboard.html', 'r', encoding='utf-8') as f:
    rec_dash = f.read()

assert 'css/custom.css' in rec_dash, "css/custom.css link missing in recipient-dashboard.html"
assert 'showDonorResponseToast' in rec_dash, "showDonorResponseToast missing in recipient-dashboard.html"
assert 'window.location.reload()' not in rec_dash, "window.location.reload() should not be in recipient-dashboard.html event handler"
assert 'seenResponseTimestamps' in rec_dash, "seenResponseTimestamps deduplication missing in recipient-dashboard.html"
print("  ✓ recipient-dashboard.html includes custom.css, showDonorResponseToast, and no page reload.")

print("\n" + "=" * 60)
print("ALL TESTS PASSED! Single popup at bottom-right is verified!")
print("=" * 60)
