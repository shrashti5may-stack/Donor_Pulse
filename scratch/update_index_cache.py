with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('js/app.js?v=20261029_static_blood_pills_v3', 'js/app.js?v=20261029_recovery_countdown_v4')
c = c.replace('js/store.js?v=20261009_final_fix', 'js/store.js?v=20261029_recovery_countdown_v4')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(c)

print("index.html cache busters updated")

