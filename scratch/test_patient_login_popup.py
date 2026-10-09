import sys

sys.stdout.reconfigure(encoding='utf-8')

print("=" * 60)
print("TEST: Patient Login Telemetry Popup at Bottom Right")
print("=" * 60)

# 1. Verify CSS definition
print("\n[Check 1] Checking custom.css...")
with open('css/custom.css', 'r', encoding='utf-8') as f:
    css = f.read()
assert '.patient-enroute-popup' in css, ".patient-enroute-popup missing in css/custom.css"
assert 'border-radius: 22px' in css, "border-radius: 22px missing in css/custom.css"
print("  ✓ custom.css has .patient-enroute-popup animation and styles.")

# 2. Verify role-selection.html
print("\n[Check 2] Checking role-selection.html...")
with open('role-selection.html', 'r', encoding='utf-8') as f:
    role_html = f.read()
assert "sessionStorage.setItem('show_patient_enroute_popup', 'true')" in role_html, "show_patient_enroute_popup missing in role-selection.html"
print("  ✓ role-selection.html sets show_patient_enroute_popup flag upon patient authentication.")

# 3. Verify js/app.js
print("\n[Check 3] Checking js/app.js...")
with open('js/app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()
assert 'function showPatientEnRoutePopup' in app_js, "showPatientEnRoutePopup missing in js/app.js"
assert 'window.showPatientEnRoutePopup = showPatientEnRoutePopup' in app_js, "window.showPatientEnRoutePopup export missing in js/app.js"
assert 'two_wheeler' in app_js, "two_wheeler motorcycle icon missing in js/app.js"
assert 'Earliest Arrival' in app_js, "Earliest Arrival missing in js/app.js"
assert 'Donor(s) Confirmed En Route' in app_js, "Donor(s) Confirmed En Route missing in js/app.js"
assert 'En Route' in app_js, "En Route badge missing in js/app.js"
assert 'directions_car' in app_js, "directions_car icon missing in js/app.js"
assert 'Arjun Nair' in app_js, "Arjun Nair fallback missing in js/app.js"
assert 'ETA:' in app_js, "ETA label missing in js/app.js"
assert "sessionStorage.getItem('show_patient_enroute_popup') === 'true'" in app_js, "sessionStorage check in js/app.js missing"
print("  ✓ js/app.js defines showPatientEnRoutePopup with matching visual card layout and routing trigger.")

# 4. Verify recipient-dashboard.html
print("\n[Check 4] Checking recipient-dashboard.html...")
with open('recipient-dashboard.html', 'r', encoding='utf-8') as f:
    rec_dash = f.read()
assert 'function showPatientEnRoutePopup' in rec_dash, "showPatientEnRoutePopup missing in recipient-dashboard.html"
assert 'two_wheeler' in rec_dash, "two_wheeler motorcycle icon missing in recipient-dashboard.html"
assert 'Earliest Arrival' in rec_dash, "Earliest Arrival missing in recipient-dashboard.html"
assert 'Donor(s) Confirmed En Route' in rec_dash, "Donor(s) Confirmed En Route missing in recipient-dashboard.html"
assert 'En Route' in rec_dash, "En Route badge missing in recipient-dashboard.html"
assert 'directions_car' in rec_dash, "directions_car icon missing in recipient-dashboard.html"
assert 'Arjun Nair' in rec_dash, "Arjun Nair missing in recipient-dashboard.html"
assert 'ETA:' in rec_dash, "ETA missing in recipient-dashboard.html"
assert "sessionStorage.getItem('show_patient_enroute_popup') === 'true'" in rec_dash, "sessionStorage check in recipient-dashboard.html missing"
print("  ✓ recipient-dashboard.html defines showPatientEnRoutePopup and triggers on login.")

print("\n" + "=" * 60)
print("ALL PATIENT LOGIN TELEMETRY POPUP CHECKS PASSED!")
print("=" * 60)
