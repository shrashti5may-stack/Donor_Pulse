with open('index.html', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

import re
m = re.search(r'id=["\']modal-incoming-donor-call["\'].*?(?=<!-- END MODAL|<div id=["\']modal-|$)', text, re.DOTALL)
if m:
    btns = re.findall(r'<button\b[^>]*>.*?</button>', m.group(0), re.DOTALL)
    print(f"Found {len(btns)} buttons in modal-incoming-donor-call:")
    for b in btns:
        print("  -", b.strip()[:100])
