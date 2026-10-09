with open('index.html', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

import re
m = re.search(r'id=["\']modal-incoming-donor-call["\'].*?(?=<!-- END MODAL|<div id=["\']modal-|$)', text, re.DOTALL)
if m:
    print('modal-incoming-donor-call found, length:', len(m.group(0)))
    print(m.group(0)[:600])
else:
    print('modal-incoming-donor-call NOT found in index.html!')
