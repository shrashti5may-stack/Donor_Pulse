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

    if (['donor-dashboard', 'nearby-requests', 'dashboard/requests', 'donor-dashboard/requests', 'donor-requests', 'donor-requests-section', 'donation-history', 'donor-history'].includes(route)) {
      renderDonorDashboard();
    } else if (route === 'donor-profile') {
      populateDonorProfileForm();
    } else if (['hospital-dashboard', 'hospital-overview', 'hospital-requests', 'hospital-requests-section', 'matched-donors', 'hospital-donors-section', 'request-tracking', 'hospital-tracking-section'].includes(route)) {
      renderHospitalDashboard();
    } else if (route === 'request-confirmation') {
      renderRequestConfirmation();
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
        fullName: formData.get('fullName')?.toString().trim() || 'New Registered Donor',
        age: parseInt(formData.get('age') || 25, 10),
        bloodGroup: formData.get('bloodGroup')?.toString().trim() || 'O-',
        phone: formData.get('phone')?.toString().trim() || '+1 (555) 000-0000',
        email: formData.get('email')?.toString().trim() || 'donor@pulse.org',
        address: formData.get('address')?.toString().trim() || 'Metro District',
        city: formData.get('city')?.toString().trim() || 'Downtown Metro Center',
        medicalHistory: formData.get('medicalHistory')?.toString().trim() || 'Pre-screened verified donor. Clinical vitals within healthy standard range.',
        lastDonationDate: formData.get('lastDonationDate') || 'First-time Donor',
        availability: formData.get('availability') === 'on' || formData.get('availability') === 'true',
        radiusMiles: parseInt(formData.get('radiusMiles') || 10, 10)
      };

      window.PulseStore.registerNewDonor(donorData);
      renderDonorDashboard();
      showToast('Registration Successful', `Welcome, ${donorData.fullName}! Your ${donorData.bloodGroup} donor dashboard is ready.`, 'success');
      window.PulseRouter.navigate('donor-dashboard');
    });

    const btnDemoDonor = document.getElementById('btn-fill-demo-donor');
    if (btnDemoDonor) {
      btnDemoDonor.addEventListener('click', () => {
        fillDonorFormDemo();
        showToast('Demo Donor Data Loaded', 'Alex Morgan (A+ Donor) profile pre-filled for testing.', 'info');
      });
    }
  }

  // A2. Donor Profile & Vitals Editing Form
  const editProfileForm = document.getElementById('form-donor-profile');
  if (editProfileForm) {
    editProfileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const currentDonor = window.PulseStore.getDonor();
      const formData = new FormData(editProfileForm);

      // Name and Blood Group CANNOT be changed once registered - strictly preserved
      const updatedDonorData = {
        fullName: currentDonor.fullName,
        bloodGroup: currentDonor.bloodGroup,
        age: parseInt(formData.get('age') || currentDonor.age, 10),
        phone: formData.get('phone')?.toString().trim() || currentDonor.phone,
        email: formData.get('email')?.toString().trim() || currentDonor.email,
        city: formData.get('city')?.toString().trim() || currentDonor.city,
        address: formData.get('address')?.toString().trim() || currentDonor.address,
        lastDonationDate: formData.get('lastDonationDate')?.toString().trim() || currentDonor.lastDonationDate,
        radiusMiles: parseInt(formData.get('radiusMiles') || currentDonor.radiusMiles, 10),
        medicalHistory: formData.get('medicalHistory')?.toString().trim() || currentDonor.medicalHistory,
        availability: formData.get('availability') === 'on' || formData.get('availability') === 'true' || document.getElementById('edit-donor-availability')?.checked,
        vitals: {
          hemoglobin: formData.get('vitals_hemoglobin')?.toString().trim() || (currentDonor.vitals && currentDonor.vitals.hemoglobin) || '14.8 g/dL',
          bp: formData.get('vitals_bp')?.toString().trim() || (currentDonor.vitals && currentDonor.vitals.bp) || '118/76 mmHg',
          pulse: formData.get('vitals_pulse')?.toString().trim() || (currentDonor.vitals && currentDonor.vitals.pulse) || '72 bpm',
          weight: formData.get('vitals_weight')?.toString().trim() || (currentDonor.vitals && currentDonor.vitals.weight) || '64 kg'
        }
      };

      window.PulseStore.setDonor(updatedDonorData);
      renderDonorDashboard();
      showToast('Profile & Vitals Updated', `Updated details and clinical vitals for ${currentDonor.fullName} saved successfully.`, 'success');
      window.PulseRouter.navigate('donor-dashboard');
    });
  }

  // B. Hospital Registration Form & Verification Proof
  const hospitalForm = document.getElementById('form-hospital-register');
  const proofFileInput = document.getElementById('hospital-proof-file');
  const proofDropzone = document.getElementById('hospital-upload-dropzone');
  const proofPreview = document.getElementById('hospital-proof-preview');
  const proofFilenameEl = document.getElementById('hospital-proof-filename');
  const proofFilesizeEl = document.getElementById('hospital-proof-filesize');
  const btnRemoveProof = document.getElementById('btn-remove-proof');
  const btnAttachSampleProof = document.getElementById('btn-attach-sample-proof');

  let currentProofAttachment = {
    fileName: 'state_accreditation_certificate_2024.pdf',
    fileSize: '2.4 MB',
    attached: true
  };

  function updateProofUI(name, size) {
    if (proofFilenameEl) proofFilenameEl.textContent = name;
    if (proofFilesizeEl) proofFilesizeEl.textContent = `${size} • Uploaded & Verified Valid`;
    if (proofPreview) proofPreview.classList.remove('hidden');
    if (proofDropzone) proofDropzone.classList.add('hidden');
    currentProofAttachment = { fileName: name, fileSize: size, attached: true };
  }

  function clearProofUI() {
    if (proofFileInput) proofFileInput.value = '';
    if (proofPreview) proofPreview.classList.add('hidden');
    if (proofDropzone) proofDropzone.classList.remove('hidden');
    currentProofAttachment = { fileName: '', fileSize: '', attached: false };
  }

  if (proofDropzone && proofFileInput) {
    proofDropzone.addEventListener('click', () => proofFileInput.click());
    
    proofDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      proofDropzone.classList.add('border-primary', 'bg-primary/5');
    });

    proofDropzone.addEventListener('dragleave', () => {
      proofDropzone.classList.remove('border-primary', 'bg-primary/5');
    });

    proofDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      proofDropzone.classList.remove('border-primary', 'bg-primary/5');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        updateProofUI(file.name, `${sizeMb} MB`);
      }
    });

    proofFileInput.addEventListener('change', () => {
      if (proofFileInput.files && proofFileInput.files.length > 0) {
        const file = proofFileInput.files[0];
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        updateProofUI(file.name, `${sizeMb} MB`);
      }
    });
  }

  if (btnRemoveProof) {
    btnRemoveProof.addEventListener('click', (e) => {
      e.stopPropagation();
      clearProofUI();
    });
  }

  if (btnAttachSampleProof) {
    btnAttachSampleProof.addEventListener('click', () => {
      updateProofUI('state_accreditation_certificate_2024.pdf', '2.4 MB');
      showToast('Sample Certificate Attached', 'Accredited State Health Board certificate loaded.', 'info');
    });
  }

  if (hospitalForm) {
    hospitalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(hospitalForm);

      const autoVerify = formData.get('autoVerify') === 'on' || formData.get('autoVerify') === 'true' || document.getElementById('check-auto-verify')?.checked;

      const hospitalData = {
        name: formData.get('hospitalName')?.toString().trim() || 'New Healthcare Facility',
        category: formData.get('hospitalCategory')?.toString().trim() || 'Apex Multi-Specialty & Trauma Center',
        location: formData.get('hospitalLocation')?.toString().trim() || 'Emergency Wing',
        bedCapacity: parseInt(formData.get('bedCapacity') || 450, 10),
        traumaLevel: formData.get('traumaLevel')?.toString().trim() || 'Trauma Level 1',
        address: formData.get('address')?.toString().trim() || '742 Healthcare Expressway',
        city: formData.get('city')?.toString().trim() || 'Chicago',
        state: formData.get('state')?.toString().trim() || 'IL',
        zip: formData.get('zip')?.toString().trim() || '60611',
        phone: formData.get('phone')?.toString().trim() || '+1 (800) 555-8821',
        email: formData.get('email')?.toString().trim() || 'triage@hospitaldomain.org',
        licenseNumber: formData.get('licenseNumber')?.toString().trim() || 'HSP-90412-IL',
        authorizedPerson: formData.get('authorizedPerson')?.toString().trim() || 'Dr. Evelyn Vance, MD',
        roleTitle: formData.get('roleTitle')?.toString().trim() || 'Chief Medical Officer & Triage Director',
        documentType: formData.get('documentType')?.toString().trim() || 'State Department Health Operating License',
        documentNumber: formData.get('documentNumber')?.toString().trim() || 'CERT-IL-2024-89240',
        fileName: currentProofAttachment.attached ? currentProofAttachment.fileName : 'clinical_establishment_license.pdf',
        fileSize: currentProofAttachment.attached ? currentProofAttachment.fileSize : '2.1 MB',
        verificationStatus: autoVerify ? 'verified' : 'pending'
      };

      const newHospital = window.PulseStore.registerNewHospital(hospitalData);

      if (autoVerify) {
        window.PulseStore.setHospitalVerification('verified');
        renderHospitalDashboard();
        showToast('Facility Verified & Dashboard Generated', `${newHospital.name} successfully registered. Dedicated dashboard active!`, 'success');
        window.PulseRouter.navigate('hospital-dashboard');
      } else {
        renderHospitalDashboard();
        showToast('Hospital Registered', 'Facility submitted and registered on the National Haemovigilance Network.', 'success');
        window.PulseRouter.navigate('hospital-dashboard');
      }
    });

    const btnDemoHospital = document.getElementById('btn-fill-demo-hospital');
    if (btnDemoHospital) {
      btnDemoHospital.addEventListener('click', () => {
        fillHospitalFormDemo();
        updateProofUI('state_accreditation_certificate_2024.pdf', '2.4 MB');
        showToast('Sample Facility Loaded', 'St. Jude Memorial Hospital details & verification proof loaded.', 'info');
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
  setInputValue(form, 'fullName', 'Alex Morgan');
  setInputValue(form, 'age', '29');
  setInputValue(form, 'bloodGroup', 'A+');
  setInputValue(form, 'phone', '+1 (555) 342-8891');
  setInputValue(form, 'email', 'alex.morgan@healthgrid.org');
  setInputValue(form, 'address', '742 Evergreen Terrace');
  setInputValue(form, 'city', 'Metro West District');
  setInputValue(form, 'lastDonationDate', '2024-11-05');
  setInputValue(form, 'radiusMiles', '10');
  setInputValue(form, 'medicalHistory', 'Pre-screened whole blood donor. Optimal hemoglobin 15.2 g/dL. No restrictions.');
  const avail = form.querySelector('[name="availability"]');
  if (avail) avail.checked = true;
}

function fillHospitalFormDemo() {
  const form = document.getElementById('form-hospital-register');
  if (!form) return;
  setInputValue(form, 'hospitalName', 'St. Jude Memorial Hospital & Trauma Center');
  setInputValue(form, 'hospitalCategory', 'Apex Multi-Specialty & Trauma Center');
  setInputValue(form, 'hospitalLocation', 'Trauma Resuscitation Wing, Floor 1');
  setInputValue(form, 'bedCapacity', '450');
  setInputValue(form, 'traumaLevel', 'Trauma Level 1');
  setInputValue(form, 'address', '742 Healthcare Expressway, Medical District');
  setInputValue(form, 'city', 'Chicago');
  setInputValue(form, 'state', 'IL');
  setInputValue(form, 'zip', '60611');
  setInputValue(form, 'phone', '+1 (312) 555-0199');
  setInputValue(form, 'email', 'emergency.triage@stjudememorial.org');
  setInputValue(form, 'licenseNumber', 'HSP-99214-IL');
  setInputValue(form, 'authorizedPerson', 'Dr. Evelyn Vance, MD');
  setInputValue(form, 'roleTitle', 'Chief Medical Officer & Triage Director');
  setInputValue(form, 'documentType', 'State Department Health Operating License');
  setInputValue(form, 'documentNumber', 'CERT-IL-2024-89240');
}

function setInputValue(form, name, value) {
  const input = form.querySelector(`[name="${name}"]`);
  if (input) input.value = value;
}

// ============================================================================
// 4. INTERACTIVE WIDGETS & MODAL CONTROLS
// ============================================================================
function initInteractiveWidgets() {
  // --- A. Donor Availability Toggle Switch Controller ---
  function updateDonorAvailabilityUI(isAvailable) {
    const btn = document.getElementById('toggleAvailabilityBtn');
    const knob = document.getElementById('toggleAvailabilityKnob');
    const availText = document.getElementById('donor-avail-text');
    const availSubtext = document.getElementById('donor-avail-subtext');
    const radiusBadge = document.getElementById('donor-radius-badge');
    const greetingBadge = document.getElementById('donor-avail-badge');
    const legacyToggle = document.getElementById('toggleAvailability');

    if (legacyToggle) {
      legacyToggle.checked = isAvailable;
    }

    if (btn) {
      btn.setAttribute('aria-checked', isAvailable ? 'true' : 'false');
      if (isAvailable) {
        btn.classList.remove('bg-surface-variant');
        btn.classList.add('bg-tertiary');
      } else {
        btn.classList.remove('bg-tertiary');
        btn.classList.add('bg-surface-variant');
      }
    }

    if (knob) {
      if (isAvailable) {
        knob.classList.remove('translate-x-0');
        knob.classList.add('translate-x-5');
      } else {
        knob.classList.remove('translate-x-5');
        knob.classList.add('translate-x-0');
      }
    }

    if (availText) {
      availText.textContent = isAvailable ? 'Active / On Call' : 'Temporarily Off Call';
      availText.className = isAvailable
        ? 'font-headline-md text-headline-md text-on-surface font-bold leading-tight'
        : 'font-headline-md text-headline-md text-on-surface-variant font-bold leading-tight';
    }

    if (availSubtext) {
      availSubtext.textContent = isAvailable ? 'Ready for Emergency Ping' : 'Paused — Not Receiving Dispatch Alerts';
      availSubtext.className = isAvailable
        ? 'font-body-sm text-body-sm text-tertiary font-medium mt-1'
        : 'font-body-sm text-body-sm text-secondary font-medium mt-1';
    }

    if (radiusBadge) {
      if (isAvailable) {
        radiusBadge.textContent = 'RADIUS: 10 MILES ACTIVE';
        radiusBadge.className = 'bg-tertiary-container/20 px-space-xs py-1 rounded text-[11px] font-label-badge text-tertiary uppercase font-semibold inline-block w-fit';
      } else {
        radiusBadge.textContent = 'STATUS: PAUSED / OFFLINE';
        radiusBadge.className = 'bg-surface-container-high px-space-xs py-1 rounded text-[11px] font-label-badge text-secondary uppercase font-semibold inline-block w-fit';
      }
    }

    if (greetingBadge) {
      greetingBadge.innerHTML = isAvailable
        ? '<span class="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Available to Donate'
        : '<span class="w-1.5 h-1.5 rounded-full bg-secondary"></span> Off Call';
    }
  }
  window.updateDonorAvailabilityUI = updateDonorAvailabilityUI;

  function handleDonorToggle(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const isAvailable = window.PulseStore.toggleDonorAvailability();
    updateDonorAvailabilityUI(isAvailable);
    showToast(
      isAvailable ? 'Availability Active' : 'Availability Paused',
      isAvailable ? 'You will receive immediate emergency dispatch alerts.' : 'Status updated to temporarily off call.',
      isAvailable ? 'success' : 'info'
    );
  }

  const btnToggle = document.getElementById('toggleAvailabilityBtn');
  if (btnToggle) {
    btnToggle.onclick = handleDonorToggle;
  }
  const cardToggle = document.getElementById('donor-avail-card');
  if (cardToggle) {
    cardToggle.onclick = (e) => {
      if (e.target.closest('#toggleAvailabilityBtn')) return;
      handleDonorToggle(e);
    };
  }
  const legacyToggle = document.getElementById('toggleAvailability');
  if (legacyToggle) {
    legacyToggle.onchange = handleDonorToggle;
  }

  // --- B. In-Page Smooth Scroll Navigation Helpers ---
  window.scrollToHospitalSection = function(sectionId) {
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.querySelectorAll('.hospital-nav-btn').forEach(btn => {
        const navKey = btn.getAttribute('data-hospital-nav');
        if ((sectionId === 'hospital-overview' && navKey === 'overview') ||
            (sectionId === 'hospital-requests-section' && navKey === 'requests') ||
            (sectionId === 'hospital-donors-section' && navKey === 'donors') ||
            (sectionId === 'hospital-tracking-section' && navKey === 'tracking')) {
          btn.classList.add('bg-primary/10', 'text-primary', 'font-bold');
          btn.classList.remove('text-on-surface-variant');
        } else {
          btn.classList.remove('bg-primary/10', 'text-primary', 'font-bold');
          btn.classList.add('text-on-surface-variant');
        }
      });
    }
  };

  window.scrollToDonorSection = function(sectionId) {
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.querySelectorAll('.donor-nav-btn').forEach(btn => {
        const navKey = btn.getAttribute('data-donor-nav');
        if ((sectionId === 'donor-overview' && navKey === 'dashboard') ||
            (sectionId === 'donor-requests-section' && navKey === 'requests') ||
            (sectionId === 'donor-history-section' && navKey === 'history')) {
          btn.classList.add('bg-surface-container', 'text-primary', 'font-bold');
          btn.classList.remove('text-on-surface-variant');
        } else {
          btn.classList.remove('bg-surface-container', 'text-primary', 'font-bold');
          btn.classList.add('text-on-surface-variant');
        }
      });
    }
  };

  // --- C. Verification State Switcher Buttons ---
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
      renderHospitalDashboard();
    });
  });

  // --- D. Modal open / close triggers ---
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

  // --- E. Tracking stepper advance button ---
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
        if (window.renderRequestTracking) renderRequestTracking();
        if (window.renderHospitalRequestsList) renderHospitalRequestsList();
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

function openVerificationHubModal() {
  const modal = document.getElementById('modal-verification-hub');
  if (modal) {
    renderVerificationHubModal();
    modal.classList.remove('hidden');
  }
}
window.openVerificationHubModal = openVerificationHubModal;

function closeVerificationHubModal() {
  const modal = document.getElementById('modal-verification-hub');
  if (modal) {
    modal.classList.add('hidden');
  }
}
window.closeVerificationHubModal = closeVerificationHubModal;

function renderVerificationHubModal() {
  const container = document.getElementById('verification-hub-modal-content');
  if (!container || !window.PulseStore) return;
  const hospital = window.PulseStore.getHospital() || {};
  const proof = hospital.verificationProof || {};
  const isVerified = hospital.verificationStatus === 'verified';

  container.innerHTML = `
    <!-- Top Verified Status Banner -->
    <div class="p-4 rounded-xl ${isVerified ? 'bg-tertiary-container/30 border border-tertiary/40' : 'bg-amber-500/20 border border-amber-500/40'} flex items-start justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl ${isVerified ? 'bg-tertiary text-on-tertiary' : 'bg-amber-600 text-white'} flex items-center justify-center shadow-xs shrink-0">
          <span class="material-symbols-outlined text-[28px]">${isVerified ? 'verified' : 'hourglass_top'}</span>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-bold text-sm uppercase ${isVerified ? 'text-tertiary' : 'text-amber-800'}">
              ${isVerified ? 'Accreditation Approved & Active' : 'Accreditation Review Pending'}
            </span>
            <span class="px-2 py-0.5 rounded-full bg-surface-container-high text-xs font-mono font-bold">${escapeHtml(hospital.licenseNumber || 'HSP-99214-IL')}</span>
          </div>
          <h4 class="font-title-md font-bold text-on-surface mt-0.5">${escapeHtml(hospital.name || 'Healthcare Facility')}</h4>
          <p class="text-xs text-on-surface-variant mt-0.5">National Node ID: <span class="font-mono font-semibold text-primary">${escapeHtml(hospital.id || 'HSP-35349-IL')}</span></p>
        </div>
      </div>
      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${isVerified ? 'bg-tertiary text-white' : 'bg-amber-600 text-white'} text-xs font-bold shrink-0">
        <span class="w-2 h-2 rounded-full bg-white animate-ping"></span>
        ${isVerified ? 'VERIFIED' : 'PENDING'}
      </span>
    </div>

    <!-- Facility Metadata Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
      <div class="p-3.5 rounded-xl bg-surface-container-low border border-surface-container">
        <span class="text-xs text-on-surface-variant block font-medium">Facility Legal Name</span>
        <span class="font-semibold text-on-surface">${escapeHtml(hospital.name || '')}</span>
      </div>
      <div class="p-3.5 rounded-xl bg-surface-container-low border border-surface-container">
        <span class="text-xs text-on-surface-variant block font-medium">Official License / NPI</span>
        <span class="font-semibold font-mono text-on-surface">${escapeHtml(hospital.licenseNumber || '')}</span>
      </div>
      <div class="p-3.5 rounded-xl bg-surface-container-low border border-surface-container">
        <span class="text-xs text-on-surface-variant block font-medium">Trauma Accreditation Level</span>
        <span class="font-semibold text-primary">${escapeHtml(hospital.traumaLevel || 'Trauma Level 1 (Apex Multi-Specialty)')}</span>
      </div>
      <div class="p-3.5 rounded-xl bg-surface-container-low border border-surface-container">
        <span class="text-xs text-on-surface-variant block font-medium">Emergency Wing & Address</span>
        <span class="font-semibold text-on-surface">${escapeHtml(hospital.location || '')}, ${escapeHtml(hospital.city || '')}${hospital.state ? ', ' + escapeHtml(hospital.state) : ''}</span>
      </div>
      <div class="p-3.5 rounded-xl bg-surface-container-low border border-surface-container">
        <span class="text-xs text-on-surface-variant block font-medium">24/7 Triage Hotline</span>
        <span class="font-semibold text-on-surface">${escapeHtml(hospital.phone || '+1 (312) 555-0199')}</span>
      </div>
      <div class="p-3.5 rounded-xl bg-surface-container-low border border-surface-container">
        <span class="text-xs text-on-surface-variant block font-medium">Authorized Superintendent / Officer</span>
        <span class="font-semibold text-on-surface">${escapeHtml(hospital.authorizedPerson || 'Chief Medical Officer')}</span>
      </div>
    </div>

    <!-- Submitted Regulatory Proof Section -->
    <div class="p-4 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[16px] text-tertiary">folder_shared</span>
          Submitted Accreditation Proof
        </span>
        <span class="text-xs text-tertiary font-bold flex items-center gap-1">
          <span class="material-symbols-outlined text-[14px]">check_circle</span>
          Verified Document
        </span>
      </div>
      <div class="p-3 rounded-lg bg-surface-container-lowest border border-surface-container flex items-center justify-between gap-3">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-9 h-9 rounded-lg bg-error-container/30 text-error flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[20px]">picture_as_pdf</span>
          </div>
          <div class="flex flex-col min-w-0">
            <span class="font-title-md text-sm font-bold text-on-surface truncate">${escapeHtml(proof.fileName || 'state_accreditation_certificate_2024.pdf')}</span>
            <span class="text-xs text-on-surface-variant">${escapeHtml(proof.documentType || 'State Health Operating License')} • ${escapeHtml(proof.fileSize || '2.4 MB')}</span>
          </div>
        </div>
        <button type="button" onclick="window.showToast('Document Viewer', 'Rendering preview of ' + (window.PulseStore.getHospital().verificationProof?.fileName || 'certificate.pdf'), 'info')" class="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold shrink-0 cursor-pointer">
          Preview
        </button>
      </div>
    </div>
  `;
}
window.renderVerificationHubModal = renderVerificationHubModal;

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
  populateDonorProfileForm();
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

  // Name, ID, Age, Address, Blood Group
  setTextContentAll('.donor-name-display', donor.fullName);
  setTextContentAll('.donor-id-display', `ID #${donor.id}`);
  setTextContentAll('.donor-blood-display', donor.bloodGroup);
  setTextContentAll('.donor-age-display', `${donor.age} yrs`);
  setTextContentAll('.donor-address-display', donor.address || donor.city);
  setTextContentAll('.donor-location-display', `${donor.address ? donor.address + ', ' : ''}${donor.city} • Within ${donor.radiusMiles} miles`);
  setTextContentAll('.donor-last-date-display', donor.lastDonationDate || 'First-time Donor');
  setTextContentAll('.donor-donations-display', `${donor.totalDonations} Units`);
  setTextContentAll('.donor-lives-display', `${donor.livesSaved} Lives Saved to Date`);
  setTextContentAll('.donor-points-display', (donor.rewardPoints || 0).toLocaleString());
  setTextContentAll('.donor-tier-display', donor.rewardTier || 'Active Registered Donor');
  setTextContentAll('.donor-next-tier-display', `Next: Platinum (${donor.nextTierPointsLeft || 400} pts left)`);

  // Blood Group Compatibility & Clinical Notes
  const bloodTraits = {
    'O-': { subtitle: 'Universal Red Cell Donor', note: 'Can receive only O-', reserve: 'Universal Donor Reserve' },
    'O+': { subtitle: 'Universal Red Cells for Positive', note: 'Can receive O+, O-', reserve: 'High Demand Blood Type' },
    'A-': { subtitle: 'Universal Platelet & A/AB Donor', note: 'Can receive A-, O-', reserve: 'Emergency Whole Blood Reserve' },
    'A+': { subtitle: 'Compatible with A+ and AB+', note: 'Can receive A+, A-, O+, O-', reserve: 'Vital Clinical Reserve' },
    'B-': { subtitle: 'Rare Blood Donor Group', note: 'Can receive B-, O-', reserve: 'Critical Emergency Reserve' },
    'B+': { subtitle: 'Compatible with B+ and AB+', note: 'Can receive B+, B-, O+, O-', reserve: 'High Demand Red Cells' },
    'AB-': { subtitle: 'Universal Plasma Donor', note: 'Can receive AB-, A-, B-, O-', reserve: 'Specialized Plasma Unit' },
    'AB+': { subtitle: 'Universal Red Cell Recipient', note: 'Can receive all blood types', reserve: 'Universal Plasma Donor' }
  };
  const traits = bloodTraits[donor.bloodGroup] || {
    subtitle: `Compatible with ${donor.bloodGroup}`,
    note: `Verified clinical matches only`,
    reserve: `${donor.bloodGroup} Donor Reserve`
  };

  setTextContentAll('.donor-blood-subtitle', traits.subtitle);
  setTextContentAll('.donor-blood-receive-note', traits.note);
  setTextContentAll('.donor-blood-reserve-tag', traits.reserve);

  // Dynamic Urgent Notification Banner on Donor Dashboard
  const codeRedTitle = document.getElementById('donor-code-red-title');
  if (codeRedTitle) {
    codeRedTitle.innerHTML = `CRITICAL: Urgent ${donor.bloodGroup} units needed at St. Mary's Trauma Center`;
  }

  // Availability Toggle & Badge
  if (window.updateDonorAvailabilityUI) {
    window.updateDonorAvailabilityUI(donor.availability);
  }

  // Update vitals pass text if present
  const vitalsPassText = document.getElementById('donor-vitals-pass-text');
  if (vitalsPassText && donor.vitals) {
    vitalsPassText.textContent = `Instant clinical check-in QR code active. Verified vitals: Hemoglobin ${donor.vitals.hemoglobin || '14.8 g/dL'} (Normal) • BP ${donor.vitals.bp || '118/76 mmHg'}.`;
  }
}

/**
 * Pre-populates the Edit Profile & Vitals form with current donor data.
 * Blood Group and Full Name are strictly locked against edits.
 */
function populateDonorProfileForm() {
  const donor = window.PulseStore ? window.PulseStore.getDonor() : null;
  if (!donor) return;

  // Locked non-editable identity fields (Full Name & Blood Group)
  const nameInput = document.getElementById('edit-donor-fullName');
  if (nameInput) nameInput.value = donor.fullName || '';

  const bloodInput = document.getElementById('edit-donor-bloodGroup');
  if (bloodInput) bloodInput.value = donor.bloodGroup || '';

  // Editable fields (matching registration options)
  const ageInput = document.getElementById('edit-donor-age');
  if (ageInput) ageInput.value = donor.age || 28;

  const phoneInput = document.getElementById('edit-donor-phone');
  if (phoneInput) phoneInput.value = donor.phone || '';

  const emailInput = document.getElementById('edit-donor-email');
  if (emailInput) emailInput.value = donor.email || '';

  const cityInput = document.getElementById('edit-donor-city');
  if (cityInput) cityInput.value = donor.city || '';

  const addressInput = document.getElementById('edit-donor-address');
  if (addressInput) addressInput.value = donor.address || '';

  const lastDonationInput = document.getElementById('edit-donor-lastDonationDate');
  if (lastDonationInput) lastDonationInput.value = donor.lastDonationDate || '';

  const radiusSelect = document.getElementById('edit-donor-radiusMiles');
  if (radiusSelect) radiusSelect.value = donor.radiusMiles || 10;

  const medHistoryInput = document.getElementById('edit-donor-medicalHistory');
  if (medHistoryInput) medHistoryInput.value = donor.medicalHistory || '';

  const availCheckbox = document.getElementById('edit-donor-availability');
  if (availCheckbox) availCheckbox.checked = donor.availability !== false;

  // Clinical Vitals
  const vitals = donor.vitals || {};
  const hemoInput = document.getElementById('edit-donor-vitals-hemoglobin');
  if (hemoInput) hemoInput.value = vitals.hemoglobin || '14.8 g/dL';

  const bpInput = document.getElementById('edit-donor-vitals-bp');
  if (bpInput) bpInput.value = vitals.bp || '118/76 mmHg';

  const pulseInput = document.getElementById('edit-donor-vitals-pulse');
  if (pulseInput) pulseInput.value = vitals.pulse || '72 bpm';

  const weightInput = document.getElementById('edit-donor-vitals-weight');
  if (weightInput) weightInput.value = vitals.weight || '64 kg';
}

/**
 * Render Hospital Dashboard
 */
function renderHospitalDashboard() {
  const hospital = window.PulseStore.getHospital();
  const isVerified = hospital.verificationStatus === 'verified';
  const isPending = hospital.verificationStatus === 'pending';
  const isRejected = hospital.verificationStatus === 'rejected';

  // Hospital Name & Attributes
  setTextContentAll('.hospital-name-display', hospital.name);
  setTextContentAll('.hospital-location-display', `${hospital.location}, ${hospital.city}${hospital.state ? ', ' + hospital.state : ''}`);
  setTextContentAll('.hospital-license-display', `Verified Hospital (License #${hospital.licenseNumber})`);
  setTextContentAll('.hospital-triage-officer', hospital.authorizedPerson);
  setTextContentAll('.hospital-phone-display', hospital.phone);
  setTextContentAll('.hospital-beds-display', `${hospital.bedCapacity || 450} Beds Capacity`);
  setTextContentAll('.hospital-trauma-display', hospital.traumaLevel || 'Accredited Trauma I');
  setTextContentAll('.hospital-category-badge', hospital.category || 'Apex Multi-Specialty');
  setTextContentAll('.hospital-node-id', `Node: ${hospital.id}`);

  // Populate facility switcher dropdown
  const switcher = document.getElementById('hospital-facility-switcher');
  if (switcher) {
    const list = window.PulseStore.getHospitalList();
    switcher.innerHTML = list.map(h => `
      <option value="${escapeHtml(h.id)}" ${h.id === hospital.id ? 'selected' : ''}>
        ${escapeHtml(h.name)} (${escapeHtml(h.id)})
      </option>
    `).join('');

    if (!switcher.dataset.hasListener) {
      switcher.dataset.hasListener = 'true';
      switcher.addEventListener('change', (e) => {
        const newActive = window.PulseStore.switchHospital(e.target.value);
        if (newActive) {
          showToast('Facility Active', `Switched dashboard to ${newActive.name}`, 'info');
          renderHospitalDashboard();
        }
      });
    }
  }

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
        <button type="button" onclick="window.PulseStore.setHospitalVerification('verified'); window.renderHospitalDashboard(); window.showToast('Accreditation Approved', 'Hospital has been verified successfully.', 'success');" class="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-label-md text-label-md font-semibold hover:bg-amber-700 transition-colors cursor-pointer">
          Approve Facility
        </button>
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
        <button type="button" onclick="window.PulseStore.setHospitalVerification('verified'); window.renderHospitalDashboard(); window.showToast('Accreditation Approved', 'Hospital has been verified successfully.', 'success');" class="px-3 py-1.5 rounded-lg bg-error text-white font-label-md text-label-md font-semibold hover:bg-on-error-container transition-colors cursor-pointer">
          Re-Approve
        </button>
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

  // Render all consolidated in-page sections directly on the Hospital Dashboard
  renderHospitalRequestsList();
  renderHospitalDonorsPool();
  if (window.renderRequestTracking) renderRequestTracking();
}

/**
 * Render Hospital Active Requisitions Section directly on Dashboard
 */
function renderHospitalRequestsList() {
  const container = document.getElementById('hospital-requests-container');
  if (!container) return;
  const requests = window.PulseStore.getRequests();

  if (!requests || requests.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center bg-surface-container-low rounded-xl">
        <p class="font-body-md text-on-surface-variant">No active emergency requisitions logged.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = requests.map(req => `
    <div class="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col md:flex-row md:items-center justify-between gap-space-md hover:border-primary/30 transition-all">
      <div class="flex items-center gap-space-md min-w-0">
        <div class="w-12 h-12 rounded-xl bg-error-container/60 text-primary flex items-center justify-center font-bold text-headline-sm shrink-0">
          ${escapeHtml(req.bloodGroup)}
        </div>
        <div class="flex flex-col min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-mono font-bold text-sm text-primary">${escapeHtml(req.id)}</span>
            <span class="font-title-md font-bold text-on-surface">${escapeHtml(req.component)}</span>
            <span class="px-2 py-0.5 rounded-full ${req.urgency.includes('Stat') ? 'bg-error-container text-on-error-container animate-pulse' : 'bg-primary-fixed text-primary'} font-label-badge text-label-badge font-bold uppercase">
              ${escapeHtml(req.urgency)}
            </span>
          </div>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-on-surface-variant mt-1">
            <span>Units: <strong class="text-on-surface font-semibold">${req.units} Units</strong></span>
            <span>•</span>
            <span>Location: <strong class="text-on-surface font-medium">${escapeHtml(req.ward)}</strong></span>
            <span>•</span>
            <span class="text-tertiary font-semibold">Stage ${req.trackingStage || 1}: ${escapeHtml(req.status)}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0 self-end md:self-center">
        <button type="button" onclick="window.PulseStore.setSelectedRequestId('${req.id}'); window.scrollToHospitalSection('hospital-tracking-section'); if (window.renderRequestTracking) window.renderRequestTracking();" class="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-all flex items-center gap-1 cursor-pointer">
          <span class="material-symbols-outlined text-[18px]">vital_signs</span>
          <span>Track Status</span>
        </button>
        <button type="button" onclick="window.PulseStore.setSelectedRequestId('${req.id}'); window.scrollToHospitalSection('hospital-donors-section');" class="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold transition-all shadow flex items-center gap-1 cursor-pointer active:scale-98">
          <span class="material-symbols-outlined text-[18px]">group</span>
          <span>View Donors</span>
        </button>
      </div>
    </div>
  `).join('');
}
window.renderHospitalRequestsList = renderHospitalRequestsList;

/**
 * Render Matched & Available Donors directly on the Hospital Dashboard.
 * Rule: Show closest 3 donors on top. If more than 3, display remaining in expandable container
 * with a button to toggle "Show All Available Donors (X more)" / "Show Less".
 */
function renderHospitalDonorsPool() {
  const req = window.PulseStore.getSelectedRequest();
  const bloodGroup = req ? req.bloodGroup : null;
  const donors = window.PulseStore.getMatchedDonors(bloodGroup);

  // Sort strictly by closest distance ascending
  const sortedDonors = [...donors].sort((a, b) => (parseFloat(a.distance) || 0) - (parseFloat(b.distance) || 0));

  const countBadge = document.getElementById('hospital-donors-count-badge');
  if (countBadge) {
    countBadge.textContent = `${sortedDonors.length} Available Donors`;
  }
  const sidebarBadge = document.getElementById('hospital-sidebar-donors-badge');
  if (sidebarBadge) {
    if (sortedDonors.length > 0) {
      sidebarBadge.style.display = 'flex';
      sidebarBadge.setAttribute('title', `${sortedDonors.length} active notifications available`);
      sidebarBadge.innerHTML = `<span class="material-symbols-outlined text-[20px] text-tertiary animate-pulse">notifications_active</span>`;
    } else {
      sidebarBadge.style.display = 'none';
    }
  }
  const overviewCount = document.getElementById('hospital-overview-donors-count');
  if (overviewCount) {
    overviewCount.textContent = sortedDonors.length;
  }

  const top3Container = document.getElementById('hospital-donors-top3');
  const moreContainer = document.getElementById('hospital-donors-more');
  const toggleContainer = document.getElementById('hospital-donors-toggle-container');
  const btnToggle = document.getElementById('btn-toggle-more-donors');
  const btnText = document.getElementById('btn-toggle-more-donors-text');
  const btnIcon = document.getElementById('btn-toggle-more-donors-icon');

  if (!top3Container) return;

  function renderDonorCardHtml(donor, isTopRank) {
    return `
      <div class="bg-surface-container-lowest p-space-md rounded-xl border border-surface-container-high shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-space-md ${isTopRank ? 'border-l-4 border-l-primary' : ''}">
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
              ${isTopRank ? '<span class="px-2 py-0.5 rounded-full bg-primary-fixed text-primary font-label-badge text-label-badge font-bold uppercase">Closest Match</span>' : ''}
            </div>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-on-surface-variant mt-1">
              <span class="flex items-center gap-1 font-semibold text-primary">
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
        <div class="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          ${donor.notified ? `
            <button class="px-4 py-2 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed font-label-md text-label-md font-semibold flex items-center gap-1.5 cursor-default">
              <span class="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Ping Sent (${donor.eta})</span>
            </button>
          ` : `
            <button class="btn-notify-donor px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold transition-all shadow flex items-center gap-1.5 active:scale-98 cursor-pointer" data-donor-id="${donor.id}" data-donor-name="${donor.name}">
              <span class="material-symbols-outlined text-[16px]">sensors</span>
              <span>Notify Donor</span>
            </button>
          `}
          <button onclick="window.showToast('Direct Intercom', 'Opening secure line to volunteer ${escapeHtml(donor.name)}', 'info')" class="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer" title="Contact Directly">
            <span class="material-symbols-outlined text-[20px]">call</span>
          </button>
        </div>
      </div>
    `;
  }

  const top3 = sortedDonors.slice(0, 3);
  const rest = sortedDonors.slice(3);

  top3Container.innerHTML = top3.map((d, idx) => renderDonorCardHtml(d, idx === 0)).join('');

  if (moreContainer) {
    moreContainer.innerHTML = rest.map(d => renderDonorCardHtml(d, false)).join('');
  }

  // Configure "Show More / Less" Toggle Button
  if (toggleContainer && btnToggle) {
    if (rest.length > 0) {
      toggleContainer.style.display = 'block';
      const isExpanded = !moreContainer.classList.contains('hidden');
      if (btnText) {
        btnText.textContent = isExpanded 
          ? 'Show Less (Top 3 Closest Only)' 
          : `Show All Available Donors (${rest.length} more)`;
      }
      btnToggle.onclick = () => {
        const isHidden = moreContainer.classList.contains('hidden');
        if (isHidden) {
          moreContainer.classList.remove('hidden');
          moreContainer.classList.add('flex');
          if (btnText) btnText.textContent = 'Show Less (Top 3 Closest Only)';
          if (btnIcon) btnIcon.textContent = 'expand_less';
        } else {
          moreContainer.classList.add('hidden');
          moreContainer.classList.remove('flex');
          if (btnText) btnText.textContent = `Show All Available Donors (${rest.length} more)`;
          if (btnIcon) btnIcon.textContent = 'expand_more';
        }
      };
    } else {
      toggleContainer.style.display = 'none';
    }
  }

  // Attach click listeners to all notify buttons
  document.querySelectorAll('.btn-notify-donor').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      const donorId = btn.getAttribute('data-donor-id');
      const donorName = btn.getAttribute('data-donor-name');
      window.PulseStore.notifyDonor(donorId);
      showToast('Emergency Alert Dispatched', `Urgent ping transmitted to ${donorName}. Transit window opened.`, 'success');
      renderHospitalDonorsPool();
    };
  });
}
window.renderHospitalDonorsPool = renderHospitalDonorsPool;

/**
 * Render Hospital Verification Screen
 */
function renderHospitalVerification() {
  const hospital = window.PulseStore.getHospital();
  const status = hospital.verificationStatus;
  const proof = hospital.verificationProof || {};

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
              <span class="font-label-badge text-label-badge text-secondary font-mono">${escapeHtml(hospital.licenseNumber)}</span>
            </div>
            <h2 class="font-headline-md text-headline-md text-on-surface font-bold mt-1">${escapeHtml(hospital.name)}</h2>
          </div>
        </div>
        <span class="w-3 h-3 rounded-full bg-tertiary animate-ping"></span>
      </div>
      <p class="font-body-md text-body-md text-on-surface-variant">
        <strong>${escapeHtml(hospital.name)}</strong> is officially authenticated on the National Haemovigilance Network. All emergency requisition dispatch tools, cold-chain telemetry, and direct donor notification keys are active.
      </p>

      <!-- Accreditation Proof Summary Box -->
      <div class="bg-surface-container-lowest p-4 rounded-xl border border-tertiary/30 grid grid-cols-1 sm:grid-cols-2 gap-3 text-body-sm">
        <div>
          <span class="text-xs text-on-surface-variant block">Accredited Document:</span>
          <span class="font-semibold text-on-surface">${escapeHtml(proof.documentType || 'State Health Operating License')}</span>
        </div>
        <div>
          <span class="text-xs text-on-surface-variant block">Registry Certificate ID:</span>
          <span class="font-semibold font-mono text-on-surface">${escapeHtml(proof.documentNumber || hospital.licenseNumber)}</span>
        </div>
        <div>
          <span class="text-xs text-on-surface-variant block">Submitted Proof File:</span>
          <span class="font-semibold text-primary flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px]">description</span>
            ${escapeHtml(proof.fileName || 'accreditation_certificate.pdf')} (${escapeHtml(proof.fileSize || '2.4 MB')})
          </span>
        </div>
        <div>
          <span class="text-xs text-on-surface-variant block">Authorized Officer:</span>
          <span class="font-semibold text-on-surface">${escapeHtml(hospital.authorizedPerson)}</span>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3 pt-2">
        <a href="#/hospital-dashboard" class="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-semibold shadow-md hover:bg-primary-container transition-all flex items-center gap-2">
          <span>Go to Dedicated Hospital Dashboard</span>
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
              <span class="font-label-badge text-label-badge text-secondary font-mono">${escapeHtml(hospital.licenseNumber)}</span>
            </div>
            <h2 class="font-headline-md text-headline-md text-on-surface font-bold mt-1">${escapeHtml(hospital.name)}</h2>
          </div>
        </div>
        <span class="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span>
      </div>
      <p class="font-body-md text-body-md text-on-surface-variant">
        Credentials for <strong>${escapeHtml(hospital.name)}</strong> were received with proof document <code>${escapeHtml(proof.fileName || 'document.pdf')}</code>. You can perform an instant accreditation validation below to generate your dashboard immediately.
      </p>
      <div class="bg-surface-container-lowest p-4 rounded-xl border border-surface-container-high space-y-2 text-body-sm">
        <div class="flex items-center gap-2 text-on-surface font-semibold">
          <span class="material-symbols-outlined text-tertiary text-[18px]">check_circle</span>
          <span>Hospital Registration &amp; Proof Document Uploaded</span>
        </div>
        <div class="flex items-center gap-2 text-on-surface">
          <span class="material-symbols-outlined text-tertiary text-[18px]">check_circle</span>
          <span>Proof: ${escapeHtml(proof.documentType || 'Operating License')} (Ref #${escapeHtml(proof.documentNumber || hospital.licenseNumber)})</span>
        </div>
        <div class="flex items-center gap-2 text-on-surface-variant">
          <span class="material-symbols-outlined text-amber-600 text-[18px]">pending</span>
          <span>State Health Registry Digital Verification Ready</span>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-3 pt-2">
        <button type="button" id="btn-approve-and-launch" class="px-5 py-2.5 rounded-xl bg-tertiary hover:bg-tertiary-container text-on-tertiary font-label-lg text-label-lg font-bold shadow hover:shadow-md transition-all flex items-center gap-2 cursor-pointer">
          <span class="material-symbols-outlined text-[18px]">verified</span>
          <span>Approve Accreditation &amp; Launch Dashboard</span>
        </button>
        <a href="#/hospital-dashboard" class="px-5 py-2.5 rounded-xl bg-surface-container-highest text-on-surface font-label-lg text-label-lg font-semibold hover:bg-surface-container transition-all">
          Preview Hospital Dashboard (Read-Only)
        </a>
      </div>
    `;

    const btnApprove = document.getElementById('btn-approve-and-launch');
    if (btnApprove) {
      btnApprove.addEventListener('click', () => {
        window.PulseStore.setHospitalVerification('verified');
        showToast('Accreditation Approved', `Credentials verified for ${hospital.name}. Launching dashboard.`, 'success');
        renderHospitalDashboard();
        window.PulseRouter.navigate('hospital-dashboard');
      });
    }
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
              <span class="font-label-badge text-label-badge text-secondary font-mono">${escapeHtml(hospital.licenseNumber)}</span>
            </div>
            <h2 class="font-headline-md text-headline-md text-on-surface font-bold mt-1">Accreditation Not Approved</h2>
          </div>
        </div>
      </div>
      <p class="font-body-md text-body-md text-on-surface-variant">
        Verification could not be granted for <strong>${escapeHtml(hospital.name)}</strong>.
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

