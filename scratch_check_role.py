with open('role-selection.html', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

import re
print("modal-incoming-donor-call in role-selection.html:", 'modal-incoming-donor-call' in text)
print("api/live-events in role-selection.html:", '/api/live-events' in text)
