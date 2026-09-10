/**
 * DonorPulse Main Application Logic
 * Integrates all screens, state management, interactive controls, and UI updates.
 */

function startApp() {
  initToasts();
  initRouterHooks();
  initFormControllers();
  initInteractiveWidgets();
  initPrototypeToolbar();
  
  // Initial render of all dynamic views
  renderAllViews();
  
  // Listen for state changes
  if (window.PulseStore) {
    window.PulseStore.subscribe(() => {
      renderAllViews();
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

// ============================================================================
// 1. TOAST NOTIFICATION SYSTEM
// ============================================================================
function showToast(title, message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const iconMap = {
    'success': 'check_circle',
    'error': 'error',
    'warning': 'warning',
    'info': 'info'
  };
  const colorMap = {
    'success': 'border-tertiary text-tertiary',
    'error': 'border-error text-error',
    'warning': 'border-amber-600 text-amber-600',
    'info': 'border-primary text-primary'
  };

  const icon = iconMap[type] || 'info';
  const color = colorMap[type] || 'border-primary text-primary';

  toast.className = `toast-message flex items-start gap-3 bg-surface-container-lowest text-on-surface p-4 rounded-xl shadow-xl border-l-4 ${color} max-w-sm w-full`;
  toast.innerHTML = `
    <span class="material-symbols-outlined shrink-0 text-[24px]">${icon}</span>
    <div class="flex-1 min-w-0">
      <h4 class="font-title-md text-title-md font-bold text-on-surface">${escapeHtml(title)}</h4>
      <p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-snug">${escapeHtml(message)}</p>
    </div>
    <button class="text-on-surface-variant hover:text-on-surface text-sm" onclick="this.parentElement.remove()">
      <span class="material-symbols-outlined text-[18px]">close</span>
    </button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

function initToasts() {
  window.showToast = showToast;
}

// ============================================================================
// 2. ROUTER LIFECYCLE HOOKS
// ============================================================================
function initRouterHooks() {
  window.PulseRouter.onRouteChange((route, params) => {
    // If request ID is specified in query, set it
    if (params.id) {
      window.PulseStore.setSelectedRequestId(params.id);
    }

    if (route === 'donor-dashboard') {
      renderDonorDashboard();
    } else if (route === 'hospital-dashboard') {
      renderHospitalDashboard();
    } else if (route === 'hospital-verification') {
      renderHospitalVerification();
    } else if (route === 'request-confirmation') {
      renderRequestConfirmation();
    } else if (route === 'matched-donors') {
      renderMatchedDonors();
    } else if (route === 'request-tracking') {
      renderRequestTracking();
    }
  });
}

// ============================================================================
// 3. FORM CONTROLLERS & DEMO FILLERS
// ============================================================================
function initFormControllers() {
  // A. Donor Registration Form
  const donorForm = document.getElementById('form-donor-register');
  if (donorForm) {
    donorForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(donorForm);
      const donorData = {
        fullName: formData.get('fullName') || 'Sarah Jenkins',
        age: parseInt(formData.get('age') || 28, 10),
        bloodGroup: formData.get('bloodGroup') || 'O-',
        phone: formData.get('phone') || '+1 (555) 234-5678',
        email: formData.get('email') || 'donor@pulse.org',
        address: formData.get('address') || '482 Lexington Ave',
        city: formData.get('city') || 'Downtown Metro Center',
        medicalHistory: formData.get('medicalHistory') || 'No pre-existing conditions reported. Verified vitals standard.',
        lastDonationDate: formData.get('lastDonationDate') || '2024-10-14',
        availability: formData.get('availability') === 'on' || formData.get('availability') === 'true',
        radiusMiles: parseInt(formData.get('radiusMiles') || 10, 10)
      };

      window.PulseStore.setDonor(donorData);
      showToast('Registration Successful', `Welcome, ${donorData.fullName}! Your donor profile is active.`, 'success');
      window.PulseRouter.navigate('donor-dashboard');
    });

    const btnDemoDonor = document.getElementById('btn-fill-demo-donor');
    if (btnDemoDonor) {
      btnDemoDonor.addEventListener('click', () => {
        fillDonorFormDemo();
        showToast('Demo Donor Data Loaded', 'Sarah Jenkins (O- Universal Donor) profile loaded.', 'info');
      });
    }
  }

  // B. Hospital Registration Form
  const hospitalForm = document.getElementById('form-hospital-register');
  if (hospitalForm) {
    hospitalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(hospitalForm);
      const hospitalData = {
        name: formData.get('hospitalName') || 'Metro General Hospital & Trauma Center',
        location: formData.get('hospitalLocation') || 'Ward 4B, Emergency Wing',
        address: formData.get('address') || '1200 Healthcare Blvd',
        city: formData.get('city') || 'New York, NY',
        phone: formData.get('phone') || '+1 (800) 555-8821',
        email: formData.get('email') || 'triage@metrogeneral.org',
        licenseNumber: formData.get('licenseNumber') || 'HSP-88219-NY',
        authorizedPerson: formData.get('authorizedPerson') || 'Dr. Aris Thorne, MD',
        verificationStatus: formData.get('initialStatus') || 'pending'
      };

      window.PulseStore.setHospital(hospitalData);
      showToast('Hospital Registered', 'Facility submitted for National Haemovigilance verification.', 'info');
      window.PulseRouter.navigate('hospital-verification');
    });

    const btnDemoHospital = document.getElementById('btn-fill-demo-hospital');
    if (btnDemoHospital) {
      btnDemoHospital.addEventListener('click', () => {
        fillHospitalFormDemo();
        showToast('Demo Hospital Data Loaded', 'Metro General Hospital & Trauma Center details loaded.', 'info');
      });
    }
  }

  // C. Blood Request Modal / Form
  const requestForms = document.querySelectorAll('.form-blood-request');
  requestForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Ensure hospital is verified
      if (!window.PulseStore.isHospitalVerified()) {
        showToast('Access Denied', 'Only accredited and VERIFIED hospitals can raise emergency requisitions.', 'error');
        window.PulseRouter.navigate('hospital-verification');
        closeRequestModal();
        return;
      }

      const formData = new FormData(form);
      const bloodGroup = form.querySelector('input[name="blood_type"]:checked')?.value || 'O-';
      const component = form.querySelector('[name="component"]')?.value || 'Whole Blood';
      const units = form.querySelector('[name="units"]')?.value || 3;
      const ward = form.querySelector('[name="ward"]')?.value || 'Trauma OR - Suite 3';
      const urgency = form.querySelector('[name="urgency"]')?.value || 'Stat Emergency (< 45 Mins)';
      const notes = form.querySelector('[name="notes"]')?.value || 'Urgent clinical blood request.';
      const location = form.querySelector('[name="location"]')?.value || window.PulseStore.getHospital().city;

      const newReq = window.PulseStore.addRequest({
        bloodGroup,
        component,
        units,
        ward,
        urgency,
        notes,
        location
      });

      closeRequestModal();
      showToast('Emergency Request Raised', `Requisition #${newReq.id} broadcasted to compatible donors!`, 'success');
      window.PulseRouter.navigate('request-confirmation', { id: newReq.id });
    });
  });
}

function fillDonorFormDemo() {
  const form = document.getElementById('form-donor-register');
  if (!form) return;
  setInputValue(form, 'fullName', 'Sarah Jenkins');
  setInputValue(form, 'age', '28');
  setInputValue(form, 'bloodGroup', 'O-');
  setInputValue(form, 'phone', '+1 (555) 234-5678');
  setInputValue(form, 'email', 'sarah.jenkins@medvolunteer.org');
  setInputValue(form, 'address', '482 Lexington Ave, Apt 4B');
  setInputValue(form, 'city', 'Downtown Metro Center');
  setInputValue(form, 'lastDonationDate', '2024-10-14');
  setInputValue(form, 'radiusMiles', '10');
  setInputValue(form, 'medicalHistory', 'Hemoglobin 14.8 g/dL (Normal). Regular whole blood donor. No travel abroad in past 6 months. Blood pressure 118/76.');
  const avail = form.querySelector('[name="availability"]');
  if (avail) avail.checked = true;
}

function fillHospitalFormDemo() {
  const form = document.getElementById('form-hospital-register');
  if (!form) return;
  setInputValue(form, 'hospitalName', 'Metro General Hospital & Trauma Center');
  setInputValue(form, 'hospitalLocation', 'Ward 4B, Emergency Wing');
  setInputValue(form, 'address', '1200 Healthcare Blvd, Suite 100');
  setInputValue(form, 'city', 'New York, NY');
  setInputValue(form, 'phone', '+1 (800) 555-8821');
  setInputValue(form, 'email', 'triage@metrogeneral.org');
  setInputValue(form, 'licenseNumber', 'HSP-88219-NY');
  setInputValue(form, 'authorizedPerson', 'Dr. Aris Thorne, MD');
}

function setInputValue(form, name, value) {
  const input = form.querySelector(`[name="${name}"]`);
  if (input) input.value = value;
}

// ============================================================================
// 4. INTERACTIVE WIDGETS & MODAL CONTROLS
// ============================================================================
function initInteractiveWidgets() {
  // Donor availability toggle
  const donorToggle = document.getElementById('toggleAvailability');
  if (donorToggle) {
    donorToggle.addEventListener('change', () => {
      const isAvailable = window.PulseStore.toggleDonorAvailability();
      showToast(
        isAvailable ? 'Availability Active' : 'Availability Paused',
        isAvailable ? 'You will receive immediate emergency dispatch alerts.' : 'Status updated to temporarily unavailable.',
        isAvailable ? 'success' : 'info'
      );
    });
  }

  // Verification State Switcher Buttons (on verification screen and header/toolbar)
  document.querySelectorAll('[data-set-verification]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const status = btn.getAttribute('data-set-verification');
      window.PulseStore.setHospitalVerification(status);
      showToast(
        'Hospital Verification Status Changed',
        `Facility accreditation is now set to: ${status.toUpperCase()}`,
        status === 'verified' ? 'success' : (status === 'pending' ? 'warning' : 'error')
      );
    });
  });

  // Modal open / close triggers
  document.querySelectorAll('[data-open-modal-request]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openRequestModal();
    });
  });

  document.querySelectorAll('[data-close-modal-request]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      closeRequestModal();
    });
  });

  // Tracking stepper advance button
  const btnAdvanceStage = document.getElementById('btn-advance-tracking-stage');
  if (btnAdvanceStage) {
    btnAdvanceStage.addEventListener('click', () => {
      const currentReq = window.PulseStore.getSelectedRequest();
      if (currentReq) {
        const nextStage = window.PulseStore.advanceTrackingStage(currentReq.id);
        const stageNames = [
          'Request Raised',
          'Finding Donors',
          'Donor Notified',
          'Donor Accepted',
          'Hospital-Donor Connected',
          'Donation Completed'
        ];
        showToast(
          'Pipeline Advanced',
          `Stage ${nextStage}: ${stageNames[nextStage - 1]}`,
          nextStage === 6 ? 'success' : 'info'
        );
      }
    });
  }

  // Interactive Blood Compatibility Widget & Matrix Controller
  initBloodCompatibilityWidget();
}

function initBloodCompatibilityWidget() {
  const bloodData = {
    'O-': {
      name: 'Type O Negative',
      tag: 'Universal Red Cell Donor',
      tagClass: 'bg-primary-fixed text-primary',
      stats: '7% of population • Critical Emergency Need',
      summary: "Type O- is the universal donor for red blood cells. In trauma situations where the patient's blood type is unknown, O- is the emergency choice.",
      donate: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
      receive: ['O-']
    },
    'O+': {
      name: 'Type O Positive',
      tag: 'Most Common Blood Type',
      tagClass: 'bg-surface-container-highest text-on-surface',
      stats: '38% of population • Constant High Demand',
      summary: 'Type O+ is the most widely transfused red blood cell type, heavily utilized in emergency rooms and elective surgeries worldwide.',
      donate: ['O+', 'A+', 'B+', 'AB+'],
      receive: ['O-', 'O+']
    },
    'A-': {
      name: 'Type A Negative',
      tag: 'Universal Platelet Component',
      tagClass: 'bg-surface-container-highest text-on-surface',
      stats: '6% of population • High Clinical Value',
      summary: 'Type A- donors can provide whole blood to 4 different types and are prized for specialized apheresis platelet donations.',
      donate: ['A-', 'A+', 'AB-', 'AB+'],
      receive: ['O-', 'A-']
    },
    'A+': {
      name: 'Type A Positive',
      tag: 'Second Most Common Type',
      tagClass: 'bg-surface-container-highest text-on-surface',
      stats: '34% of population • High Surgical Demand',
      summary: 'Type A+ blood is critical in cancer therapies and trauma care, being compatible with A+ and AB+ recipients.',
      donate: ['A+', 'AB+'],
      receive: ['O-', 'O+', 'A-', 'A+']
    },
    'B-': {
      name: 'Type B Negative',
      tag: 'Rare Blood Type',
      tagClass: 'bg-primary-fixed/40 text-primary',
      stats: '2% of population • Priority Acute Need',
      summary: 'With only 2% prevalence, regional reserves of B- are frequently in critical short supply when emergency surgeries occur.',
      donate: ['B-', 'B+', 'AB-', 'AB+'],
      receive: ['O-', 'B-']
    },
    'B+': {
      name: 'Type B Positive',
      tag: 'Vital Clinical Match',
      tagClass: 'bg-surface-container-highest text-on-surface',
      stats: '9% of population • Ongoing Need',
      summary: 'Type B+ is especially common in diverse patient populations and essential in thalassemia and sickle cell care.',
      donate: ['B+', 'AB+'],
      receive: ['O-', 'O+', 'B-', 'B+']
    },
    'AB-': {
      name: 'Type AB Negative',
      tag: 'Rarest Blood Type',
      tagClass: 'bg-secondary-container text-secondary',
      stats: '1% of population • Specialized Transfusion',
      summary: 'The rarest blood type on earth. While red blood cell usage is specific, AB- individuals make universal plasma donors.',
      donate: ['AB-', 'AB+'],
      receive: ['O-', 'A-', 'B-', 'AB-']
    },
    'AB+': {
      name: 'Type AB Positive',
      tag: 'Universal Red Cell Recipient',
      tagClass: 'bg-tertiary-fixed text-on-tertiary-fixed',
      stats: '3% of population • Universal Plasma Donor',
      summary: 'Type AB+ patients are universal recipients of red blood cells (can receive from all 8 groups). In addition, AB+ donors are universal plasma donors!',
      donate: ['AB+'],
      receive: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
    }
  };

  let currentSelectedBlood = 'O-';

  function selectBlood(type) {
    if (!type) return;
    type = type.trim();
    const data = bloodData[type];
    if (!data) return;
    currentSelectedBlood = type;

    // 1. Update Blood Pills
    const pills = document.querySelectorAll('#blood-pills-container button[data-blood]');
    pills.forEach(p => {
      const pType = p.getAttribute('data-blood');
      if (pType === type) {
        p.classList.add('active');
        p.classList.remove('bg-surface-container-low');
        p.setAttribute('aria-selected', 'true');
      } else {
        p.classList.remove('active');
        p.classList.add('bg-surface-container-low');
        p.setAttribute('aria-selected', 'false');
      }
    });

    // 2. Update Details Card
    const badgeEl = document.getElementById('widget-group-badge');
    const titleEl = document.getElementById('widget-group-title');
    const tagEl = document.getElementById('widget-tag');
    const statsEl = document.getElementById('widget-stats');
    const summaryEl = document.getElementById('widget-summary');
    const donateListEl = document.getElementById('widget-can-donate-list');
    const receiveListEl = document.getElementById('widget-can-receive-list');

    if (badgeEl) {
      badgeEl.textContent = type;
      badgeEl.classList.add('scale-105');
      setTimeout(() => badgeEl.classList.remove('scale-105'), 200);
    }
    if (titleEl) titleEl.textContent = data.name;
    if (tagEl) {
      tagEl.textContent = data.tag;
      tagEl.className = `px-2.5 py-0.5 rounded-full font-label-badge text-[11px] font-bold ${data.tagClass}`;
    }
    if (statsEl) statsEl.textContent = data.stats;
    if (summaryEl) summaryEl.textContent = data.summary;

    // Render clickable donate badges
    if (donateListEl) {
      donateListEl.innerHTML = data.donate.map(item =>
        `<button type="button" onclick="window.selectBloodType('${item}')" class="clickable-blood-pill px-2.5 py-1 rounded-lg bg-tertiary-fixed/30 hover:bg-tertiary text-on-tertiary-fixed hover:text-on-tertiary font-label-badge text-xs font-bold transition-all shadow-xs" title="Click to view ${item} profile">${item}</button>`
      ).join('');
    }

    // Render clickable receive badges
    if (receiveListEl) {
      receiveListEl.innerHTML = data.receive.map(item =>
        `<button type="button" onclick="window.selectBloodType('${item}')" class="clickable-blood-pill px-2.5 py-1 rounded-lg bg-primary-fixed/40 hover:bg-primary text-primary hover:text-on-primary font-label-badge text-xs font-bold transition-all shadow-xs" title="Click to view ${item} profile">${item}${data.receive.length === 1 && item === 'O-' ? ' Only' : ''}</button>`
      ).join('');
    }

    // 3. Highlight Matrix Table Rows and Columns
    highlightMatrixSelection(type);

    // 4. Update Inspector Panel to selected group overview
    updateInspectorForGroup(type, data);
  }

  function highlightMatrixSelection(type) {
    // Highlight matching recipient row
    const matrixRows = document.querySelectorAll('#matrixTable tbody tr');
    matrixRows.forEach(row => {
      const rType = row.getAttribute('data-recipient-row');
      if (rType === type) {
        row.classList.add('matrix-row-selected');
      } else {
        row.classList.remove('matrix-row-selected');
      }
    });

    // Highlight matching donor column headers and cells
    const colHeaders = document.querySelectorAll('#matrixTable thead th[data-donor-col]');
    colHeaders.forEach(th => {
      const dType = th.getAttribute('data-donor-col');
      if (dType === type) {
        th.classList.add('matrix-col-selected', 'text-primary');
      } else {
        th.classList.remove('matrix-col-selected', 'text-primary');
      }
    });

    const cells = document.querySelectorAll('#matrixTable tbody td[data-cell-donor]');
    cells.forEach(td => {
      const dType = td.getAttribute('data-cell-donor');
      if (dType === type) {
        td.classList.add('matrix-col-selected');
      } else {
        td.classList.remove('matrix-col-selected');
      }
    });
  }

  function inspectCrossMatch(recipient, donor) {
    if (!recipient || !donor) return;
    recipient = recipient.trim();
    donor = donor.trim();

    const rData = bloodData[recipient];
    const isCompatible = rData && rData.receive.includes(donor);

    // Spotlight clicked cell
    const allCells = document.querySelectorAll('#matrixTable tbody td[data-cell-recipient]');
    allCells.forEach(td => {
      td.classList.remove('matrix-cell-active-match');
    });

    const targetCell = document.querySelector(`#matrixTable tbody td[data-cell-recipient="${recipient}"][data-cell-donor="${donor}"]`);
    if (targetCell) {
      targetCell.classList.add('matrix-cell-active-match');
    }

    // Highlight row and column
    const matrixRows = document.querySelectorAll('#matrixTable tbody tr');
    matrixRows.forEach(row => {
      const rType = row.getAttribute('data-recipient-row');
      if (rType === recipient) {
        row.classList.add('matrix-row-selected');
      } else {
        row.classList.remove('matrix-row-selected');
      }
    });

    const colHeaders = document.querySelectorAll('#matrixTable thead th[data-donor-col]');
    colHeaders.forEach(th => {
      const dType = th.getAttribute('data-donor-col');
      if (dType === donor) {
        th.classList.add('matrix-col-selected', 'text-primary');
      } else {
        th.classList.remove('matrix-col-selected', 'text-primary');
      }
    });

    // Generate clinical explanation
    let explanation = '';
    if (isCompatible) {
      if (recipient === donor) {
        explanation = `Identical ABO & Rh match. Donor ${donor} red blood cells share the exact antigenic structure of Recipient ${recipient}. Completely safe for transfusion.`;
      } else if (donor === 'O-') {
        explanation = `Universal donor compatibility. Donor O- red blood cells lack A, B, and Rh(D) surface antigens. Recipient ${recipient}'s plasma antibodies will not attack them. Safe for emergency transfusion.`;
      } else if (recipient === 'AB+') {
        explanation = `Universal recipient compatibility. Recipient AB+ plasma lacks anti-A, anti-B, and anti-Rh antibodies, safely accepting Donor ${donor} red blood cells without agglutination.`;
      } else {
        explanation = `Clinically compatible. Donor ${donor} red blood cells carry no antigens foreign to Recipient ${recipient}'s immune system. Safe for clinical transfusion.`;
      }
    } else {
      if (donor.includes('+') && recipient.includes('-')) {
        explanation = `Contraindicated: Rh Incompatibility! Donor ${donor} carries Rh(D) surface antigens. Infusion into Rh-negative Recipient ${recipient} triggers anti-D immunization and acute or delayed hemolytic destruction.`;
      } else if ((donor.includes('A') || donor.includes('AB')) && (recipient.startsWith('B') || recipient.startsWith('O'))) {
        explanation = `Contraindicated: Severe ABO Incompatibility! Donor ${donor} red cells have type A antigens. Recipient ${recipient} plasma contains natural IgM anti-A antibodies that provoke immediate catastrophic intravascular hemolysis.`;
      } else if ((donor.includes('B') || donor.includes('AB')) && (recipient.startsWith('A') || recipient.startsWith('O'))) {
        explanation = `Contraindicated: Severe ABO Incompatibility! Donor ${donor} red cells have type B antigens. Recipient ${recipient} plasma contains natural IgM anti-B antibodies that provoke immediate catastrophic intravascular hemolysis.`;
      } else {
        explanation = `Contraindicated: Incompatible blood grouping. Recipient ${recipient} circulating antibodies will agglutinate and destroy transfused Donor ${donor} red blood cells.`;
      }
    }

    // Render in inspector panel
    const panel = document.getElementById('matrix-inspector-panel');
    if (panel) {
      panel.innerHTML = `
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-start sm:items-center gap-3">
            <div class="w-11 h-11 rounded-xl ${isCompatible ? 'bg-emerald-600 text-white' : 'bg-error text-on-error'} flex items-center justify-center font-bold shrink-0 shadow-md">
              <span class="material-symbols-outlined text-[24px]">${isCompatible ? 'check_circle' : 'gpp_bad'}</span>
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-headline-sm text-sm sm:text-base font-bold text-on-surface">
                  Recipient ${recipient} &larr; Donor ${donor}
                </span>
                <span class="px-2.5 py-0.5 rounded-full font-label-badge text-xs font-bold ${
                  isCompatible 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                    : 'bg-error/20 text-error font-extrabold'
                }">
                  ${isCompatible ? '✓ COMPATIBLE (Safe Transfusion)' : '✕ INCOMPATIBLE (Adverse Reaction)'}
                </span>
              </div>
              <p class="font-body-sm text-xs sm:text-sm text-on-surface-variant mt-1 max-w-2xl leading-relaxed">
                ${explanation}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button type="button" onclick="window.selectBloodType('${recipient}')" class="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-xs font-bold transition-all shadow-xs" title="Select ${recipient} as active profile">
              View ${recipient}
            </button>
            <button type="button" onclick="window.selectBloodType('${donor}')" class="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-xs font-bold transition-all shadow-xs" title="Select ${donor} as active profile">
              View ${donor}
            </button>
          </div>
        </div>
      `;
    }

    if (window.showToast) {
      window.showToast(
        `${recipient} + ${donor}: ${isCompatible ? 'Compatible' : 'Incompatible'}`,
        isCompatible ? `Recipient ${recipient} can safely receive red cells from Donor ${donor}.` : `Transfusion unsafe: Recipient ${recipient} antibodies will attack ${donor} cells.`,
        isCompatible ? 'success' : 'error'
      );
    }
  }

  function updateInspectorForGroup(type, data) {
    const panel = document.getElementById('matrix-inspector-panel');
    if (!panel) return;
    panel.innerHTML = `
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold">
            <span class="material-symbols-outlined text-[20px]">science</span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-headline-sm text-sm font-bold text-on-surface">Active Match Profile: ${data.name} (${type})</span>
              <span class="px-2 py-0.5 rounded-md ${data.tagClass} font-label-badge text-[10px] font-bold">${data.tag}</span>
            </div>
            <p class="font-body-sm text-xs text-on-surface-variant mt-0.5 max-w-2xl">
              Can donate to: <strong>${data.donate.join(', ')}</strong> &bull; Can receive from: <strong>${data.receive.join(', ')}</strong>. Click any cell in the table to test direct pairings.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span class="font-body-sm text-xs text-on-surface-variant">Click any cell above to test direct pairing</span>
        </div>
      </div>
    `;
  }

  function toggleMatrixTable() {
    const matrixContainer = document.getElementById('matrix-full-container');
    const toggleIcon = document.getElementById('matrix-toggle-icon');
    const toggleText = document.getElementById('matrix-toggle-text');
    if (!matrixContainer) return;

    const isHidden = matrixContainer.classList.contains('hidden');
    if (isHidden) {
      matrixContainer.classList.remove('hidden');
      if (toggleIcon) toggleIcon.textContent = 'expand_less';
      if (toggleText) toggleText.textContent = 'Hide 8×8 Clinical Compatibility Matrix Table';
      // Ensure active selection is highlighted
      highlightMatrixSelection(currentSelectedBlood);
    } else {
      matrixContainer.classList.add('hidden');
      if (toggleIcon) toggleIcon.textContent = 'expand_more';
      if (toggleText) toggleText.textContent = 'View Full 8×8 Clinical Compatibility Matrix Table';
    }
  }

  // Expose global methods
  window.selectBloodType = selectBlood;
  window.toggleMatrixTable = toggleMatrixTable;
  window.inspectCrossMatch = inspectCrossMatch;
  window.initBloodCompatibilityWidget = initBloodCompatibilityWidget;

  // Bind event listeners to blood pills
  const pills = document.querySelectorAll('#blood-pills-container button[data-blood]');
  pills.forEach(p => {
    p.onclick = (e) => {
      e.preventDefault();
      const type = p.getAttribute('data-blood');
      selectBlood(type);
    };
  });

  // Bind toggle button
  const btnToggle = document.getElementById('btn-toggle-matrix');
  if (btnToggle) {
    btnToggle.onclick = (e) => {
      e.preventDefault();
      toggleMatrixTable();
    };
  }

  // Bind matrix table recipient rows
  const matrixRows = document.querySelectorAll('#matrixTable tbody tr');
  matrixRows.forEach(row => {
    const rType = row.getAttribute('data-recipient-row');
    const labelTd = row.querySelector('td:first-child');
    if (labelTd && rType) {
      labelTd.addEventListener('click', () => {
        selectBlood(rType);
      });
    }
  });

  // Bind matrix table donor columns
  const colHeaders = document.querySelectorAll('#matrixTable thead th[data-donor-col]');
  colHeaders.forEach(th => {
    const dType = th.getAttribute('data-donor-col');
    if (dType) {
      th.addEventListener('click', () => {
        selectBlood(dType);
      });
    }
  });

  // Bind matrix cells
  const cells = document.querySelectorAll('#matrixTable tbody td[data-cell-donor]');
  cells.forEach(td => {
    const r = td.getAttribute('data-cell-recipient');
    const d = td.getAttribute('data-cell-donor');
    if (r && d) {
      td.addEventListener('click', () => {
        inspectCrossMatch(r, d);
      });
    }
  });

  // Default initialize to O-
  selectBlood('O-');
}


function openRequestModal() {
  if (!window.PulseStore.isHospitalVerified()) {
    showToast(
      'Verification Required',
      'Your hospital must be VERIFIED before raising a blood requisition.',
      'warning'
    );
    window.PulseRouter.navigate('hospital-verification');
    return;
  }

  const modal = document.getElementById('modal-request');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

function closeRequestModal() {
  const modal = document.getElementById('modal-request');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// ============================================================================
// 5. PROTOTYPE TESTER TOOLBAR
// ============================================================================
function initPrototypeToolbar() {
  const quickSelect = document.getElementById('prototype-quick-select');
  if (quickSelect) {
    quickSelect.addEventListener('change', (e) => {
      window.PulseRouter.navigate(e.target.value);
    });
  }

  const resetBtn = document.getElementById('btn-reset-prototype');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset prototype demo state to default?')) {
        window.PulseStore.resetToDefault();
        showToast('Prototype Reset', 'Mock data restored to original initial state.', 'info');
        window.PulseRouter.navigate('landing');
      }
    });
  }
}

// ============================================================================
// 6. VIEW RENDERING FUNCTIONS
// ============================================================================
function renderAllViews() {
  renderDonorDashboard();
  renderHospitalDashboard();
  renderHospitalVerification();
  renderRequestConfirmation();
  renderMatchedDonors();
  renderRequestTracking();
}

/**
 * Render Donor Dashboard
 */
function renderDonorDashboard() {
  const donor = window.PulseStore.getDonor();
  if (!donor) return;

  // Name & ID
  setTextContentAll('.donor-name-display', donor.fullName);
  setTextContentAll('.donor-id-display', `ID #${donor.id}`);
  setTextContentAll('.donor-blood-display', donor.bloodGroup);
  setTextContentAll('.donor-location-display', `${donor.city} • Within ${donor.radiusMiles} miles`);
  setTextContentAll('.donor-last-date-display', donor.lastDonationDate);
  setTextContentAll('.donor-donations-display', `${donor.totalDonations} Units`);
  setTextContentAll('.donor-lives-display', `${donor.livesSaved} Lives Saved to Date`);
  setTextContentAll('.donor-points-display', donor.rewardPoints.toLocaleString());
  setTextContentAll('.donor-tier-display', donor.rewardTier);
  setTextContentAll('.donor-next-tier-display', `Next: Platinum (${donor.nextTierPointsLeft} pts left)`);

  // Availability Toggle & Badge
  const toggle = document.getElementById('toggleAvailability');
  if (toggle) {
    toggle.checked = donor.availability;
  }
  const availText = document.getElementById('donor-avail-text');
  if (availText) {
    availText.textContent = donor.availability ? 'Active / On Call' : 'Temporarily Off Call';
    availText.className = donor.availability 
      ? 'font-headline-md text-headline-md text-on-surface font-bold leading-tight'
      : 'font-headline-md text-headline-md text-on-surface-variant font-bold leading-tight';
  }
  const availBadge = document.getElementById('donor-avail-badge');
  if (availBadge) {
    availBadge.innerHTML = donor.availability
      ? '<span class="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Available to Donate'
      : '<span class="w-1.5 h-1.5 rounded-full bg-secondary"></span> Off Call';
  }
}

/**
 * Render Hospital Dashboard
 */
function renderHospitalDashboard() {
  const hospital = window.PulseStore.getHospital();
  const isVerified = hospital.verificationStatus === 'verified';
  const isPending = hospital.verificationStatus === 'pending';
  const isRejected = hospital.verificationStatus === 'rejected';

  // Hospital Name & Location
  setTextContentAll('.hospital-name-display', hospital.name);
  setTextContentAll('.hospital-location-display', `${hospital.location}, ${hospital.city}`);
  setTextContentAll('.hospital-license-display', `License #${hospital.licenseNumber}`);
  setTextContentAll('.hospital-triage-officer', hospital.authorizedPerson);

  // Status Banner on Hospital Dashboard
  const statusBanner = document.getElementById('hospital-dashboard-status-banner');
  if (statusBanner) {
    if (isVerified) {
      statusBanner.className = 'hidden';
    } else if (isPending) {
      statusBanner.className = 'bg-amber-500/15 border-l-4 border-amber-500 p-4 rounded-xl flex items-center justify-between text-on-surface mb-4';
      statusBanner.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-amber-600 text-[24px]">hourglass_top</span>
          <div>
            <span class="font-bold text-amber-700 uppercase font-label-badge text-label-badge tracking-wider">Verification Pending</span>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Your facility registration is under review. "Raise Blood Request" will unlock once approved.</p>
          </div>
        </div>
        <a href="#/hospital-verification" class="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-label-md text-label-md font-semibold hover:bg-amber-700 transition-colors">
          View Status
        </a>
      `;
    } else if (isRejected) {
      statusBanner.className = 'bg-error-container/40 border-l-4 border-error p-4 rounded-xl flex items-center justify-between text-on-surface mb-4';
      statusBanner.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-error text-[24px]">cancel</span>
          <div>
            <span class="font-bold text-error uppercase font-label-badge text-label-badge tracking-wider">Verification Rejected</span>
            <p class="font-body-sm text-body-sm text-on-surface-variant">${escapeHtml(hospital.rejectionReason)}</p>
          </div>
        </div>
        <a href="#/hospital-verification" class="px-3 py-1.5 rounded-lg bg-error text-white font-label-md text-label-md font-semibold hover:bg-on-error-container transition-colors">
          Resolve Issues
        </a>
      `;
    }
  }

  // Gated "Raise Blood Request" buttons
  document.querySelectorAll('[data-open-modal-request]').forEach(btn => {
    if (isVerified) {
      btn.classList.remove('opacity-60', 'cursor-not-allowed');
      btn.removeAttribute('disabled');
      const lockIcon = btn.querySelector('.lock-indicator');
      if (lockIcon) lockIcon.remove();
    } else {
      btn.classList.add('opacity-60', 'cursor-not-allowed');
      if (!btn.querySelector('.lock-indicator')) {
        const span = document.createElement('span');
        span.className = 'lock-indicator material-symbols-outlined text-[16px] ml-1 text-on-primary/80';
        span.textContent = 'lock';
        btn.appendChild(span);
      }
    }
  });

  // Active requests counter
  const requests = window.PulseStore.getRequests();
  setTextContentAll('.hospital-active-requests-count', requests.length);
}

/**
 * Render Hospital Verification Screen
 */
function renderHospitalVerification() {
  const hospital = window.PulseStore.getHospital();
  const status = hospital.verificationStatus;

  // Active status highlight
  const container = document.getElementById('verification-status-card');
  if (!container) return;

  if (status === 'verified') {
    container.className = 'p-6 md:p-8 rounded-2xl bg-tertiary/10 border-2 border-tertiary shadow-sm flex flex-col gap-4';
    container.innerHTML = `
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-tertiary text-on-tertiary flex items-center justify-center shadow-md">
            <span class="material-symbols-outlined text-[32px]">verified</span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-badge text-label-badge font-bold uppercase tracking-wider">
                Accreditation Approved
              </span>
              <span class="font-label-badge text-label-badge text-secondary font-mono">${hospital.licenseNumber}</span>
            </div>
            <h2 class="font-headline-md text-headline-md text-on-surface font-bold mt-1">Verified Clinical Facility</h2>
          </div>
        </div>
        <span class="w-3 h-3 rounded-full bg-tertiary animate-ping"></span>
      </div>
      <p class="font-body-md text-body-md text-on-surface-variant">
        <strong>${hospital.name}</strong> is fully accredited and authenticated on the National Haemovigilance Network. All emergency requisition tools, cold-chain telemetry, and direct donor dispatch systems are active.
      </p>
      <div class="flex flex-wrap items-center gap-3 pt-2">
        <a href="#/hospital-dashboard" class="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-semibold shadow-md hover:bg-primary-container transition-all flex items-center gap-2">
          <span>Go to Hospital Dashboard</span>
          <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
        </a>
        <button data-open-modal-request class="px-5 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface font-label-lg text-label-lg font-semibold hover:bg-surface-container-low transition-all border border-surface-container-high flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-[18px]">emergency</span>
          <span>Raise Blood Request</span>
        </button>
      </div>
    `;
  } else if (status === 'pending') {
    container.className = 'p-6 md:p-8 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 shadow-sm flex flex-col gap-4';
    container.innerHTML = `
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
            <span class="material-symbols-outlined text-[32px]">hourglass_top</span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-label-badge text-label-badge font-bold uppercase tracking-wider">
                Review in Progress
              </span>
              <span class="font-label-badge text-label-badge text-secondary font-mono">${hospital.licenseNumber}</span>
            </div>
            <h2 class="font-headline-md text-headline-md text-on-surface font-bold mt-1">Pending Institutional Verification</h2>
          </div>
        </div>
        <span class="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span>
      </div>
      <p class="font-body-md text-body-md text-on-surface-variant">
        Credentials for <strong>${hospital.name}</strong> were received. The National Haemovigilance Authority is authenticating the medical operating license (#${hospital.licenseNumber}) and medical directorship with state health registers.
      </p>
      <div class="bg-surface-container-lowest p-4 rounded-xl border border-surface-container-high space-y-2 text-body-sm">
        <div class="flex items-center gap-2 text-on-surface font-semibold">
          <span class="material-symbols-outlined text-tertiary text-[18px]">check_circle</span>
          <span>Hospital Registration Submitted</span>
        </div>
        <div class="flex items-center gap-2 text-on-surface-variant">
          <span class="material-symbols-outlined text-amber-600 text-[18px]">pending</span>
          <span>State License Certification Cross-Check (Est. 12-24 hrs)</span>
        </div>
        <div class="flex items-center gap-2 text-on-surface-variant opacity-60">
          <span class="material-symbols-outlined text-[18px]">lock</span>
          <span>Requisition Dispatch Key Issued Upon Approval</span>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-3 pt-2">
        <a href="#/hospital-dashboard" class="px-5 py-2.5 rounded-xl bg-surface-container-highest text-on-surface font-label-lg text-label-lg font-semibold hover:bg-surface-container transition-all">
          Preview Hospital Dashboard (Read-Only)
        </a>
      </div>
    `;
  } else if (status === 'rejected') {
    container.className = 'p-6 md:p-8 rounded-2xl bg-error-container/30 border-2 border-error/50 shadow-sm flex flex-col gap-4';
    container.innerHTML = `
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-error text-on-error flex items-center justify-center shadow-md">
            <span class="material-symbols-outlined text-[32px]">gpp_bad</span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full bg-error text-white font-label-badge text-label-badge font-bold uppercase tracking-wider">
                Verification Rejected
              </span>
              <span class="font-label-badge text-label-badge text-secondary font-mono">${hospital.licenseNumber}</span>
            </div>
            <h2 class="font-headline-md text-headline-md text-on-surface font-bold mt-1">Accreditation Not Approved</h2>
          </div>
        </div>
      </div>
      <p class="font-body-md text-body-md text-on-surface-variant">
        Verification could not be granted for <strong>${hospital.name}</strong>.
      </p>
      <div class="p-4 rounded-xl bg-error-container/40 border border-error/20 text-body-sm text-on-error-container">
        <strong>Reason for rejection:</strong> ${escapeHtml(hospital.rejectionReason)}
      </div>
      <p class="font-body-sm text-body-sm text-secondary">
        Blood requisition privileges are suspended until certified documentation is re-submitted.
      </p>
      <div class="flex flex-wrap items-center gap-3 pt-2">
        <a href="#/hospital-register" class="px-5 py-2.5 rounded-xl bg-error text-on-error font-label-lg text-label-lg font-semibold shadow hover:bg-on-error-container transition-all">
          Re-submit Facility Information
        </a>
      </div>
    `;
  }

  // Update switcher button active styles
  document.querySelectorAll('[data-set-verification]').forEach(btn => {
    const btnStatus = btn.getAttribute('data-set-verification');
    if (btnStatus === status) {
      btn.classList.add('ring-2', 'ring-primary', 'font-bold');
    } else {
      btn.classList.remove('ring-2', 'ring-primary', 'font-bold');
    }
  });
}

/**
 * Render Request Confirmation View
 */
function renderRequestConfirmation() {
  const req = window.PulseStore.getSelectedRequest();
  if (!req) return;

  setTextContentAll('.confirm-req-id', req.id);
  setTextContentAll('.confirm-blood-group', req.bloodGroup);
  setTextContentAll('.confirm-component', req.component);
  setTextContentAll('.confirm-units', `${req.units} Units`);
  setTextContentAll('.confirm-urgency', req.urgency);
  setTextContentAll('.confirm-location', `${req.ward} • ${req.location}`);
  setTextContentAll('.confirm-status', req.status);
  setTextContentAll('.confirm-time', req.createdAt);
  setTextContentAll('.confirm-notes', req.notes || 'Emergency hospital clinical requisition.');

  // Set links to matched donors & tracking
  const btnViewMatches = document.getElementById('btn-confirm-view-matches');
  if (btnViewMatches) {
    btnViewMatches.onclick = () => window.PulseRouter.navigate('matched-donors', { id: req.id });
  }

  const btnTrackReq = document.getElementById('btn-confirm-track');
  if (btnTrackReq) {
    btnTrackReq.onclick = () => window.PulseRouter.navigate('request-tracking', { id: req.id });
  }
}

/**
 * Render Matched Donors View
 */
function renderMatchedDonors() {
  const req = window.PulseStore.getSelectedRequest();
  const bloodGroup = req ? req.bloodGroup : 'O-';
  const matchedDonors = window.PulseStore.getMatchedDonors(bloodGroup);

  setTextContentAll('.matched-req-id', req ? req.id : 'REQ-9042');
  setTextContentAll('.matched-req-group', bloodGroup);
  setTextContentAll('.matched-count-display', `${matchedDonors.length} Potential Donors Found`);

  const container = document.getElementById('matched-donors-list');
  if (!container) return;

  if (matchedDonors.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center bg-surface-container-low rounded-xl">
        <p class="font-body-md text-on-surface-variant">No matching donors currently online in this geo-radius.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = matchedDonors.map(donor => `
    <div class="bg-surface-container-lowest p-space-md rounded-xl border border-surface-container-high shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-space-md">
      <div class="flex items-center gap-space-md min-w-0">
        <div class="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-title-md font-bold text-headline-sm shrink-0">
          ${escapeHtml(donor.initials)}
        </div>
        <div class="flex flex-col min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <h4 class="font-title-md text-title-md font-bold text-on-surface">${escapeHtml(donor.name)}</h4>
            <span class="inline-flex w-7 h-7 rounded-full ${donor.bloodGroup === 'O-' ? 'bg-primary-fixed text-primary font-bold' : 'bg-surface-container-high text-on-surface font-bold'} items-center justify-center text-xs">
              ${escapeHtml(donor.bloodGroup)}
            </span>
            <span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-tertiary-container/20 text-tertiary font-label-badge text-label-badge">
              <span class="material-symbols-outlined text-[12px]">verified</span> ${escapeHtml(donor.eligibility)}
            </span>
          </div>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-on-surface-variant mt-1">
            <span class="flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px] text-primary">pin_drop</span>
              ${donor.distance} miles away
            </span>
            <span>•</span>
            <span class="text-tertiary font-medium">Match: ${donor.matchScore}%</span>
            <span>•</span>
            <span>Last donation: ${escapeHtml(donor.lastDonation)}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-3 shrink-0 self-end md:self-center">
        ${donor.notified ? `
          <button class="px-4 py-2 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed font-label-md text-label-md font-semibold flex items-center gap-1.5 cursor-default">
            <span class="material-symbols-outlined text-[16px]">check_circle</span>
            <span>Ping Sent (${donor.eta})</span>
          </button>
        ` : `
          <button class="btn-notify-donor px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold transition-all shadow flex items-center gap-1.5 active:scale-98" data-donor-id="${donor.id}" data-donor-name="${donor.name}">
            <span class="material-symbols-outlined text-[16px]">sensors</span>
            <span>Notify Donor</span>
          </button>
        `}
      </div>
    </div>
  `).join('');

  // Attach click listeners to Notify Donor buttons
  container.querySelectorAll('.btn-notify-donor').forEach(btn => {
    btn.addEventListener('click', () => {
      const donorId = btn.getAttribute('data-donor-id');
      const donorName = btn.getAttribute('data-donor-name');
      window.PulseStore.notifyDonor(donorId);
      showToast('Dispatch Alert Broadcast', `Priority push notification delivered to ${donorName}.`, 'success');
      renderMatchedDonors();
    });
  });
}

/**
 * Render Request Tracking Pipeline
 */
function renderRequestTracking() {
  const req = window.PulseStore.getSelectedRequest();
  if (!req) return;

  const stage = req.trackingStage || 1;

  setTextContentAll('.tracking-req-id', req.id);
  setTextContentAll('.tracking-blood-group', req.bloodGroup);
  setTextContentAll('.tracking-component', req.component);
  setTextContentAll('.tracking-urgency', req.urgency);
  setTextContentAll('.tracking-location', `${req.ward} • ${req.location}`);

  // Stepper UI
  const stages = [
    { num: 1, name: 'Raised', time: '14:10 EST', desc: 'Requisition authenticated & signed cryptographically' },
    { num: 2, name: 'Finding Donors', time: '14:11 EST', desc: 'Geo-radius scan active across 25-mile radius' },
    { num: 3, name: 'Donor Notified', time: '14:14 EST', desc: 'Encrypted push broadcast sent to matching responders' },
    { num: 4, name: 'Donor Accepted', time: '14:18 EST', desc: '3 Donors confirmed route ETA (David K. ETA 25m)' },
    { num: 5, name: 'Connected', time: '14:26 EST', desc: 'Hospital triage check-in authenticated at Ward 4B' },
    { num: 6, name: 'Completed', time: '14:45 EST', desc: 'Donation safe intake logged & impact certificate attested' }
  ];

  const stepperContainer = document.getElementById('tracking-stepper');
  if (stepperContainer) {
    stepperContainer.innerHTML = stages.map(s => {
      let circleClass = '';
      let textClass = '';
      let icon = '';

      if (s.num < stage) {
        circleClass = 'bg-tertiary text-on-tertiary';
        textClass = 'text-on-surface font-bold';
        icon = '<span class="material-symbols-outlined text-[20px]">check</span>';
      } else if (s.num === stage) {
        circleClass = 'bg-primary-container text-on-primary ring-4 ring-primary-fixed shadow-md';
        textClass = 'text-primary font-extrabold';
        icon = '<span class="material-symbols-outlined text-[20px] animate-pulse">sync</span>';
      } else {
        circleClass = 'bg-surface-container-high text-on-surface-variant opacity-60';
        textClass = 'text-on-surface-variant opacity-60';
        icon = `<span class="font-label-lg font-bold">${s.num}</span>`;
      }

      return `
        <div class="flex flex-col items-center text-center cursor-pointer group p-2 rounded-xl hover:bg-surface-container-low transition-colors" data-stage-num="${s.num}">
          <div class="w-10 h-10 rounded-full ${circleClass} flex items-center justify-center font-label-lg text-label-lg mb-2 transition-transform group-hover:scale-105">
            ${icon}
          </div>
          <span class="font-label-md text-label-md ${textClass}">${s.num}. ${s.name}</span>
          <span class="font-body-sm text-[11px] text-on-surface-variant mt-0.5">${s.time}</span>
        </div>
      `;
    }).join('');

    // Allow clicking on any step to jump to that stage
    stepperContainer.querySelectorAll('[data-stage-num]').forEach(el => {
      el.addEventListener('click', () => {
        const targetStage = parseInt(el.getAttribute('data-stage-num'), 10);
        window.PulseStore.setTrackingStage(req.id, targetStage);
        showToast('Tracking Stage Updated', `Viewing Stage ${targetStage}: ${stages[targetStage - 1].name}`, 'info');
        renderRequestTracking();
      });
    });
  }

  // Active Stage Detail Box
  const activeDetail = document.getElementById('tracking-stage-detail');
  if (activeDetail) {
    const curStage = stages[stage - 1];
    activeDetail.innerHTML = `
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 rounded-xl bg-surface-container-lowest flex items-center justify-center shadow-sm text-primary shrink-0">
          <span class="material-symbols-outlined text-[28px]">vital_signs</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full bg-primary-fixed text-primary font-label-badge text-label-badge font-bold uppercase tracking-wider">
              Current Stage: ${stage} of 6
            </span>
            <span class="text-on-surface-variant text-body-sm">• ${curStage.time}</span>
          </div>
          <h3 class="font-headline-sm text-headline-sm font-bold text-on-surface mt-1">${curStage.name}</h3>
          <p class="font-body-md text-body-md text-on-surface-variant mt-1">${curStage.desc}</p>
        </div>
      </div>
    `;
  }
}

// Helper: safe text replacement across elements matching selector
function setTextContentAll(selector, text) {
  document.querySelectorAll(selector).forEach(el => {
    el.textContent = text;
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================================
// CERTIFICATE VIEWER MODAL SYSTEM
// ============================================================================
let currentCertificateData = null;

window.openCertificateModal = function(data) {
  currentCertificateData = data || {
    id: 'CERT-88391',
    date: 'October 14, 2024',
    hospital: 'City Central Blood Bank',
    type: 'Whole Blood (1 Unit - 450 mL)',
    bay: 'Donation Bay #04',
    doctor: 'Dr. R. Adams',
    hash: 'e92f8b1c4a0d92e5f67a8b9c0d1e2f3a4b5c6d7e',
    image: 'images/certificate-sarah-jenkins.jpg'
  };

  const modal = document.getElementById('modal-certificate');
  if (!modal) return;

  const subtitleEl = document.getElementById('cert-modal-subtitle');
  if (subtitleEl) {
    subtitleEl.textContent = `Donation Attestation #${currentCertificateData.id} • Clinical ID #DP-8924-O`;
  }

  const centerEl = document.getElementById('cert-modal-center');
  if (centerEl) centerEl.textContent = currentCertificateData.hospital;

  const typeEl = document.getElementById('cert-modal-type');
  if (typeEl) typeEl.textContent = currentCertificateData.type;

  const dateEl = document.getElementById('cert-modal-date');
  if (dateEl) dateEl.textContent = currentCertificateData.date;

  const hashEl = document.getElementById('cert-modal-hash');
  if (hashEl) hashEl.textContent = currentCertificateData.hash ? (currentCertificateData.hash.slice(0, 24) + '...') : 'e92f8b1c4a0d92e5f67a...';

  const imgEl = document.getElementById('cert-modal-img');
  if (imgEl) {
    imgEl.src = currentCertificateData.image || 'images/certificate-sarah-jenkins.jpg';
  }

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
};

window.closeCertificateModal = function() {
  const modal = document.getElementById('modal-certificate');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
};

window.downloadCertificate = function(certId, imageSrc = 'images/certificate-sarah-jenkins.jpg') {
  const a = document.createElement('a');
  a.href = imageSrc;
  a.download = `DonorPulse-Certificate-${certId || 'CERT-88391'}.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (window.showToast) {
    window.showToast('Certificate Downloaded', `Impact Certificate #${certId || 'CERT-88391'} saved to your device.`, 'success');
  }
};

window.downloadCertificateFromModal = function() {
  const certId = currentCertificateData ? currentCertificateData.id : 'CERT-88391';
  const img = currentCertificateData ? currentCertificateData.image : 'images/certificate-sarah-jenkins.jpg';
  window.downloadCertificate(certId, img);
};

window.printCertificate = function() {
  const imgUrl = (currentCertificateData && currentCertificateData.image) ? currentCertificateData.image : 'images/certificate-sarah-jenkins.jpg';
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>DonorPulse - Certificate of Life-Saving Impact</title>
          <style>
            @page { size: landscape; margin: 0; }
            body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fff; }
            img { max-width: 100vw; max-height: 100vh; object-fit: contain; }
          </style>
        </head>
        <body>
          <img src="${imgUrl}" onload="window.print();window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  } else {
    window.print();
  }
};

// Global modal backdrop and key listeners for Certificate Viewer
document.addEventListener('DOMContentLoaded', () => {
  const certModal = document.getElementById('modal-certificate');
  if (certModal) {
    certModal.addEventListener('click', (e) => {
      if (e.target.id === 'modal-certificate') {
        window.closeCertificateModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closeCertificateModal();
    }
  });
});

/**
 * Global User Logout Handler
 */
window.logoutUser = function(role) {
  const roleName = role === 'hospital' ? 'Hospital Portal' : 'Donor Portal';
  if (window.showToast) {
    window.showToast('Logged Out', `Successfully signed out of the ${roleName}.`, 'info');
  }
  if (window.PulseRouter) {
    window.PulseRouter.navigate('role-selection');
  } else {
    window.location.hash = '#/role-selection';
  }
};

