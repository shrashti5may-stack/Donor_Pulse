import re

with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update checkAndRingMatchedDonor
ring_target = """  const recipient = window.PulseStore ? window.PulseStore.getRecipient() : null;
  if (!recipient) return;

  const reqId = recipient.requestId || recipient.id;"""

ring_replacement = """  const recipient = window.PulseStore ? window.PulseStore.getRecipient() : null;
  if (!recipient) return;

  // 90-Day Biological Recovery Check: Suppress all ringing & calls if donor is in recovery!
  const recovery = window.calculateDonationRecovery ? window.calculateDonationRecovery(donor.lastDonationDate) : null;
  if (recovery && recovery.inRecovery) {
    if (window.PulseAudio && typeof window.PulseAudio.stopPhoneRinging === 'function') {
      window.PulseAudio.stopPhoneRinging();
    }
    const modal = document.getElementById('modal-incoming-donor-call');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
    const docked = document.getElementById('docked-ringing-call-indicator');
    if (docked) {
      docked.classList.add('hidden');
      docked.style.display = 'none';
    }
    return;
  }

  const reqId = recipient.requestId || recipient.id;"""

if ring_target in content:
    content = content.replace(ring_target, ring_replacement, 1)
    print("Updated checkAndRingMatchedDonor successfully")
else:
    # Try normalizing newlines
    normalized_content = content.replace('\r\n', '\n')
    if ring_target in normalized_content:
        normalized_content = normalized_content.replace(ring_target, ring_replacement, 1)
        content = normalized_content
        print("Updated checkAndRingMatchedDonor (normalized newlines)")
    else:
        print("ERROR: checkAndRingMatchedDonor target not found!")

# 2. Update openIncomingDonorCallModal
modal_target = """  if (!targetDonor) {
    targetDonor = {
      id: currentDonorId || 'DNR-4821',
      name: (loggedInDonor && (loggedInDonor.fullName || loggedInDonor.name)) || 'Volunteer Donor',
      fullName: (loggedInDonor && (loggedInDonor.fullName || loggedInDonor.name)) || 'Volunteer Donor',
      bloodGroup: (loggedInDonor && loggedInDonor.bloodGroup) || bloodGroup,
      phone: (loggedInDonor && loggedInDonor.phone) || '+91 98451 44290',
      distance: (loggedInDonor && loggedInDonor.distance) || 1.8,
      liveEta: (loggedInDonor && (loggedInDonor.liveEta || loggedInDonor.eta)) || '15 mins',
      confirmed: false,
      callStatus: 'ringing'
    };
  }

  // 3. Populate Modal Content"""

modal_replacement = """  if (!targetDonor) {
    targetDonor = {
      id: currentDonorId || 'DNR-4821',
      name: (loggedInDonor && (loggedInDonor.fullName || loggedInDonor.name)) || 'Volunteer Donor',
      fullName: (loggedInDonor && (loggedInDonor.fullName || loggedInDonor.name)) || 'Volunteer Donor',
      bloodGroup: (loggedInDonor && loggedInDonor.bloodGroup) || bloodGroup,
      phone: (loggedInDonor && loggedInDonor.phone) || '+91 98451 44290',
      distance: (loggedInDonor && loggedInDonor.distance) || 1.8,
      liveEta: (loggedInDonor && (loggedInDonor.liveEta || loggedInDonor.eta)) || '15 mins',
      confirmed: false,
      callStatus: 'ringing'
    };
  }

  // 90-Day Biological Recovery Check: Block incoming call modal if target donor is in recovery!
  const donorToCheck = targetDonor || loggedInDonor;
  const rawDateToCheck = (donorToCheck && donorToCheck.lastDonationDate) || (loggedInDonor && loggedInDonor.lastDonationDate);
  const donorRecovery = window.calculateDonationRecovery ? window.calculateDonationRecovery(rawDateToCheck) : null;
  if (donorRecovery && donorRecovery.inRecovery) {
    if (window.PulseAudio && typeof window.PulseAudio.stopPhoneRinging === 'function') {
      window.PulseAudio.stopPhoneRinging();
    }
    modal.classList.add('hidden');
    modal.style.display = 'none';
    const docked = document.getElementById('docked-ringing-call-indicator');
    if (docked) {
      docked.classList.add('hidden');
      docked.style.display = 'none';
    }
    document.body.classList.remove('overflow-hidden');
    if (typeof window.showToast === 'function') {
      window.showToast(
        'Recovery Period Active',
        `Donor is currently in mandatory 90-day recovery (${donorRecovery.daysRemaining} days remaining). Emergency alerts & calls are paused until ${donorRecovery.formattedNextDate}.`,
        'warning'
      );
    }
    return;
  }

  // 3. Populate Modal Content"""

content_norm = content.replace('\r\n', '\n')
if modal_target in content_norm:
    content_norm = content_norm.replace(modal_target, modal_replacement, 1)
    content = content_norm
    print("Updated openIncomingDonorCallModal successfully")
else:
    print("ERROR: openIncomingDonorCallModal target not found!")

# 3. Update openImmediateResponseModal
imm_target = """window.openImmediateResponseModal = function() {
  const modal = document.getElementById('modal-immediate-response');
  if (!modal) return;"""

imm_replacement = """window.openImmediateResponseModal = function() {
  const store = window.PulseStore;
  const donor = (store && typeof store.getDonor === 'function') ? store.getDonor() : null;
  const rawLastDate = donor ? (donor.lastDonationDate || (donor.donationHistory && donor.donationHistory.length > 0 ? donor.donationHistory[0].date : null)) : null;
  const recovery = window.calculateDonationRecovery ? window.calculateDonationRecovery(rawLastDate) : null;
  if (recovery && recovery.inRecovery) {
    if (typeof window.showToast === 'function') {
      window.showToast(
        'Recovery Period Active',
        `You are currently in mandatory 90-day biological recovery (${recovery.daysRemaining} days remaining). Code Red response is locked until ${recovery.formattedNextDate}.`,
        'warning'
      );
    } else {
      alert(`You are currently in mandatory 90-day biological recovery (${recovery.daysRemaining} days remaining). Code Red response is locked until ${recovery.formattedNextDate}.`);
    }
    return;
  }

  const modal = document.getElementById('modal-immediate-response');
  if (!modal) return;"""

content_norm = content.replace('\r\n', '\n')
if imm_target in content_norm:
    content_norm = content_norm.replace(imm_target, imm_replacement, 1)
    content = content_norm
    print("Updated openImmediateResponseModal successfully")
else:
    print("ERROR: openImmediateResponseModal target not found!")

# 4. Update missionBanner & btn-code-red-respond in renderDonorDashboard
banner_target = """  // 2. Populate Emergency Mission Banner on Donor Dashboard
  const missionBanner = document.getElementById('donor-emergency-mission-banner');
  const recipient = (window.PulseStore && typeof window.PulseStore.getRecipient === 'function')
    ? window.PulseStore.getRecipient()
    : null;

  if (missionBanner && recipient) {
    const isCompat = window.PulseStore.isBloodCompatible(donor.bloodGroup, recipient.bloodGroup);
    const donorStatus = window.PulseStore.getDonorCallStatus(recipient.requestId, donor.id);

    if (isCompat) {
      if (donorStatus === 'confirmed') {
        missionBanner.classList.remove('hidden');
        missionBanner.innerHTML = `
          <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <span class="material-symbols-outlined text-[22px]">two_wheeler</span>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wide">Active Mission En Route</span>
                  <span class="text-xs font-bold text-on-surface">Requisition #${escapeHtml(recipient.requestId)}</span>
                </div>
                <p class="text-xs text-on-surface-variant mt-0.5">
                  You confirmed availability for <strong>${escapeHtml(recipient.patientName)}</strong> (${escapeHtml(recipient.bloodGroup)} ${escapeHtml(recipient.component)}). Heading to <strong>${escapeHtml(recipient.hospitalName)}</strong> (${escapeHtml(recipient.hospitalWard)}).
                </p>
              </div>
            </div>
            <a href="#/recipient-tracking" class="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-center">
              View Hospital Transit Grid
            </a>
          </div>
        `;
      } else if (donorStatus === 'declined') {
        missionBanner.classList.remove('hidden');
        missionBanner.innerHTML = `
          <div class="p-3.5 rounded-2xl bg-surface-container-high border border-surface-container flex items-center justify-between gap-3">
            <span class="text-xs text-on-surface-variant font-medium">You marked unavailable / declined for ${escapeHtml(recipient.patientName)}'s requisition.</span>
            <button type="button" onclick="window.checkAndRingMatchedDonor()" class="px-3 py-1 rounded-lg bg-surface-container hover:bg-surface-container-highest text-primary text-xs font-bold cursor-pointer">Reconsider &amp; Ring</button>
          </div>
        `;
      } else {
        // Ringing or unconfirmed compatible donor!
        missionBanner.classList.remove('hidden');
        missionBanner.innerHTML = `
          <div class="p-4 rounded-2xl bg-red-600/10 border-2 border-red-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm incoming-call-box-glow">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-2xs animate-phone-vibrate">
                <span class="material-symbols-outlined text-[24px]">ring_volume</span>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                  <span class="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-wide">Stat Emergency Alert</span>
                  <span class="text-xs font-bold text-red-900">Incoming Call For Your Blood Group (${escapeHtml(donor.bloodGroup)})</span>
                </div>
                <p class="text-xs text-on-surface mt-0.5">
                  <strong>${escapeHtml(recipient.hospitalName)}</strong> requires ${escapeHtml(recipient.unitsRequired)} units of ${escapeHtml(recipient.bloodGroup)} for <strong>${escapeHtml(recipient.patientName)}</strong>.
                </p>
              </div>
            </div>
            <button type="button" onclick="window.openIncomingDonorCallModal('${donor.id}')" class="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0 self-start sm:self-center animate-pulse cursor-pointer">
              <span class="material-symbols-outlined text-[16px]">phone_in_talk</span>
              <span>Open Call Screen</span>
            </button>
          </div>
        `;
      }
    } else {
      missionBanner.classList.remove('hidden');
      missionBanner.innerHTML = `
        <div class="p-3 rounded-2xl bg-surface-container-low border border-surface-container flex items-center justify-between gap-3">
          <div class="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
            <span class="material-symbols-outlined text-[18px] text-tertiary">check_circle</span>
            <span>No active requests matching your profile in your area.</span>
          </div>
        </div>
      `;
    }
  } else if (missionBanner) {
    missionBanner.classList.remove('hidden');
    missionBanner.innerHTML = `
      <div class="p-3 rounded-2xl bg-surface-container-low border border-surface-container flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
          <span class="material-symbols-outlined text-[18px] text-tertiary">check_circle</span>
          <span>No active requests currently pending. Your profile is on standby.</span>
        </div>
      </div>
    `;
  }"""

banner_replacement = """  // 2. Populate Emergency Mission Banner on Donor Dashboard
  const missionBanner = document.getElementById('donor-emergency-mission-banner');
  const recipient = (window.PulseStore && typeof window.PulseStore.getRecipient === 'function')
    ? window.PulseStore.getRecipient()
    : null;

  if (missionBanner) {
    if (recovery && recovery.inRecovery) {
      missionBanner.classList.remove('hidden');
      missionBanner.innerHTML = `
        <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[22px]">notifications_paused</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 text-[10px] font-bold uppercase tracking-wide">Biological Recovery Active</span>
                <span class="text-xs font-bold text-on-surface">Emergency Notifications Paused (${recovery.daysRemaining} Days Left)</span>
              </div>
              <p class="text-xs text-on-surface-variant mt-0.5">
                ${recipient ? `Active emergency requisition for ${escapeHtml(recipient.bloodGroup)} detected at ${escapeHtml(recipient.hospitalName)}, but emergency` : 'Emergency'} pings and ringing are safely blocked per national haemovigilance guidelines until your 90-day biological recovery concludes on <strong>${escapeHtml(recovery.formattedNextDate)}</strong>.
              </p>
            </div>
          </div>
          <a href="#donor-recovery-countdown-card" class="px-3.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-center">
            View Recovery Clock
          </a>
        </div>
      `;
    } else if (recipient) {
      const isCompat = window.PulseStore.isBloodCompatible(donor.bloodGroup, recipient.bloodGroup);
      const donorStatus = window.PulseStore.getDonorCallStatus(recipient.requestId, donor.id);

      if (isCompat) {
        if (donorStatus === 'confirmed') {
          missionBanner.classList.remove('hidden');
          missionBanner.innerHTML = `
            <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <span class="material-symbols-outlined text-[22px]">two_wheeler</span>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wide">Active Mission En Route</span>
                    <span class="text-xs font-bold text-on-surface">Requisition #${escapeHtml(recipient.requestId)}</span>
                  </div>
                  <p class="text-xs text-on-surface-variant mt-0.5">
                    You confirmed availability for <strong>${escapeHtml(recipient.patientName)}</strong> (${escapeHtml(recipient.bloodGroup)} ${escapeHtml(recipient.component)}). Heading to <strong>${escapeHtml(recipient.hospitalName)}</strong> (${escapeHtml(recipient.hospitalWard)}).
                  </p>
                </div>
              </div>
              <a href="#/recipient-tracking" class="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-center">
                View Hospital Transit Grid
              </a>
            </div>
          `;
        } else if (donorStatus === 'declined') {
          missionBanner.classList.remove('hidden');
          missionBanner.innerHTML = `
            <div class="p-3.5 rounded-2xl bg-surface-container-high border border-surface-container flex items-center justify-between gap-3">
              <span class="text-xs text-on-surface-variant font-medium">You marked unavailable / declined for ${escapeHtml(recipient.patientName)}'s requisition.</span>
              <button type="button" onclick="window.checkAndRingMatchedDonor()" class="px-3 py-1 rounded-lg bg-surface-container hover:bg-surface-container-highest text-primary text-xs font-bold cursor-pointer">Reconsider &amp; Ring</button>
            </div>
          `;
        } else {
          // Ringing or unconfirmed compatible donor!
          missionBanner.classList.remove('hidden');
          missionBanner.innerHTML = `
            <div class="p-4 rounded-2xl bg-red-600/10 border-2 border-red-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm incoming-call-box-glow">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-2xs animate-phone-vibrate">
                  <span class="material-symbols-outlined text-[24px]">ring_volume</span>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                    <span class="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-wide">Stat Emergency Alert</span>
                    <span class="text-xs font-bold text-red-900">Incoming Call For Your Blood Group (${escapeHtml(donor.bloodGroup)})</span>
                  </div>
                  <p class="text-xs text-on-surface mt-0.5">
                    <strong>${escapeHtml(recipient.hospitalName)}</strong> requires ${escapeHtml(recipient.unitsRequired)} units of ${escapeHtml(recipient.bloodGroup)} for <strong>${escapeHtml(recipient.patientName)}</strong>.
                  </p>
                </div>
              </div>
              <button type="button" onclick="window.openIncomingDonorCallModal('${donor.id}')" class="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0 self-start sm:self-center animate-pulse cursor-pointer">
                <span class="material-symbols-outlined text-[16px]">phone_in_talk</span>
                <span>Open Call Screen</span>
              </button>
            </div>
          `;
        }
      } else {
        missionBanner.classList.remove('hidden');
        missionBanner.innerHTML = `
          <div class="p-3 rounded-2xl bg-surface-container-low border border-surface-container flex items-center justify-between gap-3">
            <div class="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
              <span class="material-symbols-outlined text-[18px] text-tertiary">check_circle</span>
              <span>No active requests matching your profile in your area.</span>
            </div>
          </div>
        `;
      }
    } else {
      missionBanner.classList.remove('hidden');
      missionBanner.innerHTML = `
        <div class="p-3 rounded-2xl bg-surface-container-low border border-surface-container flex items-center justify-between gap-3">
          <div class="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
            <span class="material-symbols-outlined text-[18px] text-tertiary">check_circle</span>
            <span>No active requests currently pending. Your profile is on standby.</span>
          </div>
        </div>
      `;
    }
  }

  // Update Code Red Respond Button state based on recovery
  const codeRedBtn = document.getElementById('btn-code-red-respond');
  if (codeRedBtn) {
    if (recovery && recovery.inRecovery) {
      codeRedBtn.disabled = true;
      codeRedBtn.className = 'w-full sm:w-auto px-space-lg py-3 rounded-xl bg-surface-container-high/60 text-on-surface-variant font-label-lg text-label-lg font-bold cursor-not-allowed opacity-75';
      codeRedBtn.innerHTML = `<span class="material-symbols-outlined text-[18px]">hourglass_top</span><span>In Recovery (${recovery.daysRemaining}d left)</span>`;
      codeRedBtn.title = `Biological recovery in progress. Next eligible: ${recovery.formattedNextDate}`;
    } else {
      codeRedBtn.disabled = false;
      codeRedBtn.className = 'w-full sm:w-auto px-space-lg py-3 rounded-xl bg-on-primary text-primary font-label-lg text-label-lg font-bold shadow-md hover:bg-surface-container transition-all active:scale-98 cursor-pointer';
      codeRedBtn.innerHTML = `<span>Respond to Code Red Emergency</span><span class="material-symbols-outlined text-[20px]">arrow_forward</span>`;
      codeRedBtn.title = 'Respond to active emergency requisition';
    }
  }"""

content_norm = content.replace('\r\n', '\n')
if banner_target in content_norm:
    content_norm = content_norm.replace(banner_target, banner_replacement, 1)
    content = content_norm
    print("Updated missionBanner and btn-code-red-respond successfully")
else:
    print("ERROR: missionBanner target not found!")

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("js/app.js updated successfully")

