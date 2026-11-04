# apply_directions_update.py
import re

# 1. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

target_index = '''              <!-- Hospital Live Location Window with Maximizing Option -->
              <div class="flex flex-col gap-2.5 pt-1">
                <div id="donor-mission-map-window" class="relative w-full h-48 sm:h-52 rounded-xl overflow-hidden border border-surface-container shadow-inner bg-surface-container-low group">
                  <!-- Fallback / Loading radar background -->
                  <div class="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-low text-on-surface-variant pointer-events-none z-0">
                    <div class="relative flex items-center justify-center">
                      <div class="w-14 h-14 rounded-full border-2 border-primary/30 animate-ping absolute"></div>
                      <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span class="material-symbols-outlined text-primary text-2xl">local_hospital</span>
                      </div>
                    </div>
                    <span class="text-[11px] font-semibold text-on-surface mt-2">Connecting to Hospital Location Beacon...</span>
                  </div>

                  <!-- Live Map Iframe -->
                  <iframe id="donor-mission-map-frame" 
                          title="Hospital Live Location Map"
                          src="https://maps.google.com/maps?q=Metro+Trauma+Blood+Centre+Bengaluru&amp;t=&amp;z=15&amp;ie=UTF8&amp;iwloc=&amp;output=embed" 
                          class="w-full h-full border-0 relative z-1" 
                          loading="lazy" 
                          referrerpolicy="no-referrer-when-downgrade" 
                          allowfullscreen></iframe>

                  <!-- Live Destination Pin Beacon (Top Left) -->
                  <div class="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-lowest/90 backdrop-blur-xs text-[10px] font-bold text-on-surface shadow-xs border border-surface-container-high/60 pointer-events-none">
                    <span class="relative flex h-2 w-2">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                    </span>
                    <span>Live Hospital Location</span>
                  </div>

                  <!-- Small Maximizing Option Button (Top Right) -->
                  <a id="donor-mission-map-maximize" 
                     href="https://www.google.com/maps/search/?api=1&amp;query=Metro+Trauma+Blood+Centre+Bengaluru" 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     class="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-lowest/95 hover:bg-surface-container text-on-surface hover:text-primary text-[11px] font-bold shadow-md hover:shadow-lg transition-all border border-surface-container-high cursor-pointer active:scale-95" 
                     title="Maximize to full Google Maps navigation">
                    <span class="material-symbols-outlined text-[15px] text-primary">open_in_new</span>
                    <span>Maximize</span>
                  </a>

                  <!-- Bottom Destination Strip Overlay -->
                  <div class="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between px-2.5 py-1 rounded-lg bg-surface-container-lowest/90 backdrop-blur-xs text-[10px] text-on-surface shadow-xs border border-surface-container-high/60 pointer-events-none">
                    <div class="flex items-center gap-1 truncate">
                      <span class="material-symbols-outlined text-[13px] text-primary shrink-0">pin_drop</span>
                      <span id="donor-mission-map-target-name" class="truncate font-semibold">Metro Trauma Blood Centre</span>
                    </div>
                    <span class="shrink-0 text-emerald-700 font-bold ml-1 flex items-center gap-0.5">
                      <span class="material-symbols-outlined text-[12px]">how_to_reg</span>
                      <span>Reporting Point</span>
                    </span>
                  </div>
                </div>

                <!-- Call Hospital Blood Desk Button -->
                <a id="donor-mission-desk-phone-btn" href="tel:+918026304050" class="w-full py-2.5 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-xs font-semibold transition-all border border-surface-container-high flex items-center justify-center gap-2 cursor-pointer">
                  <span class="material-symbols-outlined text-[18px] text-primary">call</span>
                  <span>Call Hospital Blood Desk</span>
                </a>
              </div>'''

replacement_index = '''              <!-- Hospital Directions Window & Turn-by-Turn Route Navigation -->
              <div class="flex flex-col gap-3 pt-1">
                
                <!-- Live Directions Route Map Container -->
                <div id="donor-mission-map-window" class="relative w-full h-64 sm:h-72 rounded-xl overflow-hidden border border-surface-container shadow-inner bg-surface-container-low group">
                  <!-- Fallback / Loading radar background -->
                  <div class="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-low text-on-surface-variant pointer-events-none z-0">
                    <div class="relative flex items-center justify-center">
                      <div class="w-14 h-14 rounded-full border-2 border-primary/30 animate-ping absolute"></div>
                      <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span class="material-symbols-outlined text-primary text-2xl">directions</span>
                      </div>
                    </div>
                    <span class="text-[11px] font-semibold text-on-surface mt-2">Calculating Driving Directions to Hospital...</span>
                  </div>

                  <!-- Live Google Maps Directions Iframe -->
                  <iframe id="donor-mission-map-frame" 
                          title="Google Maps Driving Directions to Hospital"
                          src="https://maps.google.com/maps?saddr=%2324%2C+4th+Cross%2C+Koramangala+4th+Block%2C+Bengaluru&amp;daddr=Metro+Trauma+Blood+Centre%2C+Bannerghatta+Road%2C+Bengaluru&amp;dirflg=d&amp;output=embed" 
                          class="w-full h-full border-0 relative z-1" 
                          loading="lazy" 
                          referrerpolicy="no-referrer-when-downgrade" 
                          allowfullscreen></iframe>

                  <!-- Route Status Pill (Top Left) -->
                  <div class="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-lowest/95 backdrop-blur-xs text-[10px] font-bold text-on-surface shadow-xs border border-surface-container-high/60 pointer-events-none">
                    <span class="relative flex h-2 w-2">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                    </span>
                    <span>Live Directions Route</span>
                  </div>

                  <!-- Small Maximizing Option Button (Top Right) -->
                  <a id="donor-mission-map-maximize" 
                     href="https://www.google.com/maps/dir/?api=1&amp;origin=%2324%2C+4th+Cross%2C+Koramangala+4th+Block%2C+Bengaluru&amp;destination=Metro+Trauma+Blood+Centre%2C+Bannerghatta+Road%2C+Bengaluru&amp;travelmode=driving" 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     class="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-lowest/95 hover:bg-surface-container text-on-surface hover:text-primary text-[11px] font-bold shadow-md hover:shadow-lg transition-all border border-surface-container-high cursor-pointer active:scale-95" 
                     title="Maximize to full Google Maps navigation">
                    <span class="material-symbols-outlined text-[15px] text-primary">open_in_new</span>
                    <span>Maximize</span>
                  </a>

                  <!-- Bottom Destination Strip Overlay -->
                  <div class="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between px-2.5 py-1 rounded-lg bg-surface-container-lowest/95 backdrop-blur-xs text-[10px] text-on-surface shadow-xs border border-surface-container-high/60 pointer-events-none">
                    <div class="flex items-center gap-1 truncate">
                      <span class="material-symbols-outlined text-[13px] text-primary shrink-0">pin_drop</span>
                      <span id="donor-mission-map-target-name" class="truncate font-semibold">Metro Trauma Blood Centre</span>
                    </div>
                    <span class="shrink-0 text-emerald-700 font-bold ml-1 flex items-center gap-0.5">
                      <span class="material-symbols-outlined text-[12px]">turn_sharp_right</span>
                      <span>Follow Route</span>
                    </span>
                  </div>
                </div>

                <!-- Turn-by-Turn Driving Directions Box -->
                <div class="p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-2.5">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-on-surface flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-[16px] text-primary">alt_route</span>
                      <span>Turn-by-Turn Directions to Hospital</span>
                    </span>
                    <span id="donor-mission-direction-eta-tag" class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ~12 mins (1.5 km)
                    </span>
                  </div>

                  <div class="flex flex-col gap-2 text-xs pt-1 text-on-surface-variant">
                    <div class="flex items-start gap-2.5">
                      <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <div class="flex flex-col">
                        <span class="font-semibold text-on-surface">Start from Your Registered Location</span>
                        <span id="donor-mission-direction-step-1" class="text-[11px] text-on-surface-variant">Depart from #24, 4th Cross, Koramangala 4th Block toward Hosur Main Rd.</span>
                      </div>
                    </div>

                    <div class="flex items-start gap-2.5">
                      <span class="w-5 h-5 rounded-full bg-surface-container-high text-on-surface font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <div class="flex flex-col">
                        <span class="font-semibold text-on-surface">Follow Emergency Transit Corridor</span>
                        <span id="donor-mission-direction-step-2" class="text-[11px] text-on-surface-variant">Continue along Bannerghatta Main Road link (~0.8 km) toward hospital entrance.</span>
                      </div>
                    </div>

                    <div class="flex items-start gap-2.5">
                      <span class="w-5 h-5 rounded-full bg-surface-container-high text-on-surface font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <div class="flex flex-col">
                        <span class="font-semibold text-on-surface">Arrive at Hospital Emergency Gate</span>
                        <span id="donor-mission-direction-step-3" class="text-[11px] text-on-surface-variant">Turn into Metro Trauma Blood Centre ambulance / donor parking bay.</span>
                      </div>
                    </div>

                    <div class="flex items-start gap-2.5">
                      <span class="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                      <div class="flex flex-col">
                        <span class="font-semibold text-on-surface">Report to Blood Bank &amp; Quote Handshake OTP</span>
                        <span class="text-[11px] text-on-surface-variant">Proceed to <strong id="donor-mission-direction-ward">ICU Emergency Bed 4</strong> and quote Handshake OTP <strong id="donor-mission-direction-otp" class="text-primary font-bold">7120</strong>.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Action Buttons: Google Maps Live Directions & Call Desk -->
                <div class="flex flex-col gap-2">
                  <a id="donor-mission-start-nav-btn" href="#" target="_blank" rel="noopener noreferrer" class="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-container text-white font-label-md text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98">
                    <span class="material-symbols-outlined text-[18px]">turn_sharp_right</span>
                    <span>Start Google Maps Live Directions (GPS)</span>
                  </a>
                  <a id="donor-mission-desk-phone-btn" href="tel:+918026304050" class="w-full py-2 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-xs font-semibold transition-all border border-surface-container-high flex items-center justify-center gap-2 cursor-pointer">
                    <span class="material-symbols-outlined text-[18px] text-primary">call</span>
                    <span>Call Hospital Blood Desk</span>
                  </a>
                </div>
              </div>'''

normalized_content = content.replace('\r\n', '\n')
normalized_target = target_index.replace('\r\n', '\n')

if normalized_target in normalized_content:
    new_content = normalized_content.replace(normalized_target, replacement_index)
    new_content = new_content.replace('?v=20261104_live_map_v6', '?v=20261104_directions_v7')
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS: index.html updated with Directions UI!")
else:
    print("ERROR: Target not found in index.html")

# 2. Update js/app.js
with open('js/app.js', 'r', encoding='utf-8') as f:
    app_content = f.read()

target_app = '''  // Live hospital location query for embedded mini-map and maximize button
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

replacement_app = '''  // Live directions: Origin (Donor Location) & Destination (Hospital Location)
  const donorAddress = (donor && donor.address)
    ? `${donor.address}, ${donor.city || 'Bengaluru, Karnataka'}`
    : '#24, 4th Cross, Koramangala 4th Block, Bengaluru, Karnataka';

  const rawAddress = hospitalAddress || '';
  let hospitalDest = hospitalName || 'Metro Trauma Blood Centre';
  if (rawAddress && !rawAddress.toLowerCase().includes(hospitalDest.toLowerCase())) {
    hospitalDest += `, ${rawAddress}`;
  } else if (rawAddress) {
    hospitalDest = rawAddress;
  }
  if (!hospitalDest.toLowerCase().includes('bengaluru') && !hospitalDest.toLowerCase().includes('bangalore')) {
    hospitalDest += ', Bengaluru, Karnataka';
  }

  // Google Maps Driving Directions Embed URL (saddr -> daddr with driving mode)
  const mapsEmbedDirectionsUrl = `https://maps.google.com/maps?saddr=${encodeURIComponent(donorAddress)}&daddr=${encodeURIComponent(hospitalDest)}&dirflg=d&output=embed`;
  
  // Google Maps Turn-by-Turn GPS Navigation URL
  const mapsNavigationUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(donorAddress)}&destination=${encodeURIComponent(hospitalDest)}&travelmode=driving`;

  const mapFrame = document.getElementById('donor-mission-map-frame');
  if (mapFrame) {
    mapFrame.src = mapsEmbedDirectionsUrl;
  }

  const mapMaximizeBtn = document.getElementById('donor-mission-map-maximize');
  if (mapMaximizeBtn) {
    mapMaximizeBtn.href = mapsNavigationUrl;
  }

  const startNavBtn = document.getElementById('donor-mission-start-nav-btn');
  if (startNavBtn) {
    startNavBtn.href = mapsNavigationUrl;
  }

  const mapTargetName = document.getElementById('donor-mission-map-target-name');
  if (mapTargetName) {
    mapTargetName.textContent = hospitalName;
  }

  const etaTag = document.getElementById('donor-mission-direction-eta-tag');
  if (etaTag) {
    etaTag.textContent = `~${eta} (${distance})`;
  }

  const step1 = document.getElementById('donor-mission-direction-step-1');
  if (step1) {
    const originDesc = (donor && donor.address) ? donor.address : '#24, 4th Cross, Koramangala 4th Block';
    step1.textContent = `Depart from ${originDesc} toward Hosur Main Rd / Bannerghatta link.`;
  }

  const step3 = document.getElementById('donor-mission-direction-step-3');
  if (step3) {
    step3.textContent = `Turn into ${hospitalName} Emergency Entrance & Triage Bay.`;
  }

  const wardEl = document.getElementById('donor-mission-direction-ward');
  if (wardEl) {
    wardEl.textContent = hospitalWard;
  }

  const otpEl = document.getElementById('donor-mission-direction-otp');
  if (otpEl) {
    otpEl.textContent = otp;
  }

  const mapsBtn = document.getElementById('donor-mission-maps-btn');
  if (mapsBtn) {
    mapsBtn.href = mapsNavigationUrl;
  }'''

normalized_app = app_content.replace('\r\n', '\n')
normalized_target_app = target_app.replace('\r\n', '\n')

if normalized_target_app in normalized_app:
    new_app = normalized_app.replace(normalized_target_app, replacement_app)
    with open('js/app.js', 'w', encoding='utf-8') as f:
        f.write(new_app)
    print("SUCCESS: js/app.js updated with Directions logic!")
else:
    print("ERROR: Target not found in js/app.js")

