# patch_app_js.py
with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''  const mapsBtn = document.getElementById('donor-mission-maps-btn');
  if (mapsBtn) {
    mapsBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospitalName + ' ' + hospitalAddress)}`;
  }'''

replacement = '''  // Live hospital location query for embedded mini-map and maximize button
  const rawAddress = hospitalAddress || '';
  let fullLocationQuery = hospitalName || 'Metro Trauma Blood Centre';
  if (rawAddress && !rawAddress.toLowerCase().includes(fullLocationQuery.toLowerCase())) {
    fullLocationQuery += `, ${rawAddress}`;
  } else if (rawAddress) {
    fullLocationQuery = rawAddress;
  }
  if (!fullLocationQuery.toLowerCase().includes('bengaluru') && !fullLocationQuery.toLowerCase().includes('bangalore')) {
    fullLocationQuery += ', Bengaluru, Karnataka';
  }

  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullLocationQuery)}`;
  const mapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(fullLocationQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  const mapFrame = document.getElementById('donor-mission-map-frame');
  if (mapFrame) {
    mapFrame.src = mapsEmbedUrl;
  }

  const mapMaximizeBtn = document.getElementById('donor-mission-map-maximize');
  if (mapMaximizeBtn) {
    mapMaximizeBtn.href = mapsSearchUrl;
  }

  const mapTargetName = document.getElementById('donor-mission-map-target-name');
  if (mapTargetName) {
    mapTargetName.textContent = hospitalName;
  }

  const mapsBtn = document.getElementById('donor-mission-maps-btn');
  if (mapsBtn) {
    mapsBtn.href = mapsSearchUrl;
  }'''

normalized_content = content.replace('\r\n', '\n')
normalized_target = target.replace('\r\n', '\n')

if normalized_target in normalized_content:
    new_content = normalized_content.replace(normalized_target, replacement)
    with open('js/app.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('SUCCESS: js/app.js updated successfully!')
else:
    print('ERROR: target not found in js/app.js!')

