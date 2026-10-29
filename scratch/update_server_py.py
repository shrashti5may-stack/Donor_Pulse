with open('server.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add parse_date_str and is_donor_in_90_day_recovery after haversine_distance_km
helper_target = """    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 1)"""

helper_replacement = """    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 1)

def parse_date_str(date_val):
    if not date_val or not isinstance(date_val, str):
        return None
    val = date_val.strip()
    if not val or 'first' in val.lower() or val.lower() in ('none', 'null', 'n/a'):
        return None
    try:
        clean = val.replace('Z', '+00:00')
        if len(clean) == 10 and clean.count('-') == 2:
            clean += 'T00:00:00+00:00'
        return datetime.fromisoformat(clean)
    except Exception:
        pass
    for fmt in ('%d %b %Y', '%d %B %Y', '%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%d-%m-%Y'):
        try:
            return datetime.strptime(val, fmt).replace(tzinfo=timezone.utc)
        except Exception:
            continue
    return None

def is_donor_in_90_day_recovery(last_donation_date_str, now_dt=None):
    if not last_donation_date_str:
        return False
    dt = parse_date_str(last_donation_date_str)
    if not dt:
        return False
    if not now_dt:
        now_dt = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    diff = (now_dt - dt).total_seconds()
    return 0 <= diff < (90 * 86400)"""

content_norm = content.replace('\r\n', '\n')
if helper_target in content_norm:
    content_norm = content_norm.replace(helper_target, helper_replacement, 1)
    print("Added helper functions to server.py")
else:
    print("ERROR: helper_target not found in server.py")

# 2. Update DB_USERS loop in POST /api/requests
user_loop_target = """                # 90-day donation check
                last_don = donor.get('lastDonationDate')
                if last_don:
                    try:
                        last_dt = datetime.fromisoformat(last_don.replace('Z', '+00:00'))
                        if last_dt > cutoff_90_days:
                            # Exclude donors who donated within last 90 days!
                            continue
                    except Exception:
                        pass"""

user_loop_replacement = """                # 90-day clinical recovery check: Exclude donors who donated within last 90 days!
                last_don = donor.get('lastDonationDate')
                if is_donor_in_90_day_recovery(last_don, now_dt):
                    continue"""

if user_loop_target in content_norm:
    content_norm = content_norm.replace(user_loop_target, user_loop_replacement, 1)
    print("Updated DB_USERS 90-day recovery check in server.py")
else:
    print("ERROR: user_loop_target not found in server.py")

# 3. Update DB_DONORS fallback loop in POST /api/requests
fallback_target = """            if not matched_donor_list and DB_DONORS:
                for d in DB_DONORS.values():
                    d_bg = d.get('bloodGroup', blood_group_needed)
                    if d_bg in compatible_groups or not compatible_groups or d_bg == blood_group_needed:"""

fallback_replacement = """            if not matched_donor_list and DB_DONORS:
                for d in DB_DONORS.values():
                    # 90-day biological recovery check: Exclude donors in recovery!
                    if is_donor_in_90_day_recovery(d.get('lastDonationDate'), now_dt):
                        continue
                    d_bg = d.get('bloodGroup', blood_group_needed)
                    if d_bg in compatible_groups or not compatible_groups or d_bg == blood_group_needed:"""

if fallback_target in content_norm:
    content_norm = content_norm.replace(fallback_target, fallback_replacement, 1)
    print("Updated DB_DONORS fallback loop in server.py")
else:
    print("ERROR: fallback_target not found in server.py")

# 4. In POST /api/donor/respond: validate donor is not in recovery
respond_target = """            status = (body.get('status') or 'ACCEPTED').upper()
            eta = body.get('eta') or '15 mins'"""

respond_replacement = """            status = (body.get('status') or 'ACCEPTED').upper()
            eta = body.get('eta') or '15 mins'

            if status == 'ACCEPTED' and donor_id:
                donor_obj = DB_DONORS.get(donor_id) or DB_USERS.get(donor_id)
                if donor_obj and is_donor_in_90_day_recovery(donor_obj.get('lastDonationDate')):
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "success": False,
                        "error": "Donor is currently in mandatory 90-day clinical recovery interval. No donation allowed.",
                        "inRecovery": True
                    }).encode('utf-8'))
                    return"""

if respond_target in content_norm:
    content_norm = content_norm.replace(respond_target, respond_replacement, 1)
    print("Updated POST /api/donor/respond in server.py")
else:
    print("ERROR: respond_target not found in server.py")

with open('server.py', 'w', encoding='utf-8') as f:
    f.write(content_norm)
print("server.py updated successfully")

