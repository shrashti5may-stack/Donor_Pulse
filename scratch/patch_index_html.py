# patch_index_html.py
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''              <!-- Action Buttons: GPS Map & Call Desk -->
              <div class="flex flex-col gap-2 pt-1">
                <a id="donor-mission-maps-btn" href="#" target="_blank" rel="noopener noreferrer" class="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-container text-white font-label-md text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98">
                  <span class="material-symbols-outlined text-[18px]">navigation</span>
                  <span>Open in Google Maps (GPS)</span>
                </a>
                <a id="donor-mission-desk-phone-btn" href="tel:+918026304050" class="w-full py-2.5 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-xs font-semibold transition-all border border-surface-container-high flex items-center justify-center gap-2 cursor-pointer">
                  <span class="material-symbols-outlined text-[18px] text-primary">call</span>
                  <span>Call Hospital Blood Desk</span>
                </a>
              </div>'''

replacement = '''              <!-- Hospital Live Location Window with Maximizing Option -->
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

normalized_content = content.replace('\r\n', '\n')
normalized_target = target.replace('\r\n', '\n')

if normalized_target in normalized_content:
    new_content = normalized_content.replace(normalized_target, replacement)
    new_content = new_content.replace('?v=20261104_view_details_v5', '?v=20261104_live_map_v6')
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('SUCCESS: index.html updated successfully!')
else:
    print('ERROR: target not found!')

