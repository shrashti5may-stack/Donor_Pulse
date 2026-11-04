# remove_turn_by_turn.py

# 1. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

target_index = '''                <!-- Turn-by-Turn Driving Directions Box -->
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
                </div>'''

normalized_content = content.replace('\r\n', '\n')
normalized_target = target_index.replace('\r\n', '\n')

if normalized_target in normalized_content:
    new_content = normalized_content.replace(normalized_target, '')
    new_content = new_content.replace('?v=20261104_directions_v7', '?v=20261104_clean_directions_v8')
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS: Removed Turn-by-Turn Directions box from index.html!")
else:
    print("ERROR: Target not found in index.html!")

# 2. Clean up in js/app.js
with open('js/app.js', 'r', encoding='utf-8') as f:
    app_content = f.read()

target_app = '''  const etaTag = document.getElementById('donor-mission-direction-eta-tag');
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
  }'''

normalized_app = app_content.replace('\r\n', '\n')
normalized_target_app = target_app.replace('\r\n', '\n')

if normalized_target_app in normalized_app:
    new_app = normalized_app.replace(normalized_target_app, '')
    with open('js/app.js', 'w', encoding='utf-8') as f:
        f.write(new_app)
    print("SUCCESS: Cleaned up directions steps references from js/app.js!")
else:
    print("ERROR: Target not found in js/app.js!")

