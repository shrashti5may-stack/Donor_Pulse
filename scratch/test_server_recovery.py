import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from datetime import datetime, timezone

from server import parse_date_str, is_donor_in_90_day_recovery

fixed_now = datetime(2026, 10, 29, 12, 0, 0, tzinfo=timezone.utc)

# Case 1: Donated 40 days ago (2026-09-19)
d1 = '2026-09-19'
rec1 = is_donor_in_90_day_recovery(d1, fixed_now)
print(f"Date {d1}: in_recovery = {rec1} (expected True)")
assert rec1 is True

# Case 2: Donated with format '18 Sep 2026'
d2 = '18 Sep 2026'
rec2 = is_donor_in_90_day_recovery(d2, fixed_now)
print(f"Date {d2}: in_recovery = {rec2} (expected True)")
assert rec2 is True

# Case 3: Donated 137 days ago (14 Jun 2026)
d3 = '14 Jun 2026'
rec3 = is_donor_in_90_day_recovery(d3, fixed_now)
print(f"Date {d3}: in_recovery = {rec3} (expected False)")
assert rec3 is False

# Case 4: First-time Donor
d4 = 'First-time Donor'
rec4 = is_donor_in_90_day_recovery(d4, fixed_now)
print(f"Date {d4}: in_recovery = {rec4} (expected False)")
assert rec4 is False

# Case 5: None or empty
rec5 = is_donor_in_90_day_recovery(None, fixed_now)
print(f"Date None: in_recovery = {rec5} (expected False)")
assert rec5 is False

print("\nSUCCESS: ALL SERVER.PY RECOVERY TESTS PASSED!")
