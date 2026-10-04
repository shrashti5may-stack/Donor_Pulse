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
  initFloatingBackToOverview();
  initLoginInterface();
  
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
    } else if (['recipient-dashboard', 'recipient-overview', 'patient-dashboard', 'family-dashboard', 'recipient-requests', 'recipient-requests-section', 'recipient-donors', 'recipient-donors-section', 'recipient-tracking', 'recipient-tracking-section', 'sos-appeal', 'hospital-dashboard', 'hospital-overview', 'hospital-requests', 'hospital-requests-section', 'matched-donors', 'hospital-donors-section', 'request-tracking', 'hospital-tracking-section'].includes(route)) {
      if (typeof window.renderRecipientDashboard === 'function') {
        window.renderRecipientDashboard();
      } else if (typeof renderHospitalDashboard === 'function') {
        renderHospitalDashboard();
      }
    } else if (route === 'request-confirmation') {
      renderRequestConfirmation();
    }
  });
}

// ============================================================================
// 3. FORM CONTROLLERS & DEMO FILLERS
// ============================================================================
function initFormControllers() {
  // A0. Donor Registration Popup Modal Form
  const modalDonorReg = document.getElementById('modal-donor-register');
  if (modalDonorReg) {
    modalDonorReg.querySelectorAll('input[name="donor_blood_type"]').forEach(radio => {
      radio.addEventListener('change', () => {
        modalDonorReg.querySelectorAll('.donor-blood-btn').forEach(btn => {
          btn.classList.remove('bg-primary', 'text-white', 'shadow-md');
          btn.classList.add('bg-surface-container', 'text-on-surface');
        });
        const activeDiv = radio.nextElementSibling;
        if (activeDiv) {
          activeDiv.classList.add('bg-primary', 'text-white', 'shadow-md');
          activeDiv.classList.remove('bg-surface-container', 'text-on-surface');
        }
      });
    });

    const modalDonorForm = document.getElementById('form-donor-register-modal');
    if (modalDonorForm) {
      modalDonorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('btn-donor-register-submit');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">sync</span><span>Registering Donor Profile...</span>';
        }

        const formData = new FormData(modalDonorForm);
        const bloodGroup = modalDonorForm.querySelector('input[name="donor_blood_type"]:checked')?.value || formData.get('donor_blood_type') || 'A+';
        const donorData = {
          fullName: formData.get('fullName')?.toString().trim() || 'Registered Volunteer Donor',
          age: parseInt(formData.get('age') || 29, 10),
          gender: formData.get('gender')?.toString().trim() || 'Male',
          bloodGroup: bloodGroup,
          phone: formData.get('phone')?.toString().trim() || '+91 98451 44290',
          email: formData.get('email')?.toString().trim() || 'donor@donor-pulse.in',
          address: formData.get('address')?.toString().trim() || '#24, 4th Cross, Koramangala 4th Block',
          city: formData.get('city')?.toString().trim() || 'Bengaluru, Karnataka',
          medicalHistory: formData.get('medicalHistory')?.toString().trim() || 'Pre-screened whole blood donor. Optimal hemoglobin 15.2 g/dL.',
          lastDonationDate: formData.get('lastDonationDate') || 'First-time Donor',
          availability: formData.get('availability') === 'on' || formData.get('availability') === 'true',
          radiusMiles: parseInt(formData.get('radiusMiles') || 10, 10)
        };

        window.PulseStore.registerNewDonor(donorData);

        setTimeout(() => {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">how_to_reg</span><span>Complete Registration &amp; Launch Dashboard</span>';
          }
          closeDonorRegisterModal();
          renderDonorDashboard();
          showToast('Registration Successful', `Welcome, ${donorData.fullName}! Your ${donorData.bloodGroup} donor dashboard is ready.`, 'success');
          window.PulseRouter.navigate('donor-dashboard');
        }, 500);
      });
    }
  }

  // A. Donor Registration Form (Page View)
  const donorForm = document.getElementById('form-donor-register');
  if (donorForm) {
    donorForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(donorForm);
      const donorData = {
        fullName: formData.get('fullName')?.toString().trim() || 'New Registered Donor',
        age: parseInt(formData.get('age') || 25, 10),
        bloodGroup: formData.get('bloodGroup')?.toString().trim() || 'O-',
        phone: formData.get('phone')?.toString().trim() || '+91 98452 33109',
        email: formData.get('email')?.toString().trim() || 'ananya.sharma@donor-pulse.in',
        address: formData.get('address')?.toString().trim() || '#482, 12th Main Road, HAL 2nd Stage, Indiranagar',
        city: formData.get('city')?.toString().trim() || 'Bengaluru, Karnataka',
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
        showToast('Demo Donor Data Loaded', 'Arjun Nair (A+ Donor) profile pre-filled for testing.', 'info');
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
        address: formData.get('address')?.toString().trim() || '154/11 Bannerghatta Main Road',
        city: formData.get('city')?.toString().trim() || 'Bengaluru',
        state: formData.get('state')?.toString().trim() || 'Karnataka',
        zip: formData.get('zip')?.toString().trim() || '560076',
        phone: formData.get('phone')?.toString().trim() || '+91 (80) 2630-4050',
        email: formData.get('email')?.toString().trim() || 'triage@apollo-bengaluru.in',
        licenseNumber: formData.get('licenseNumber')?.toString().trim() || 'NABH-BB-KA-88219',
        authorizedPerson: formData.get('authorizedPerson')?.toString().trim() || 'Dr. Aravind Sharma, MD',
        roleTitle: formData.get('roleTitle')?.toString().trim() || 'Medical Director & Chief of Transfusion Medicine',
        documentType: formData.get('documentType')?.toString().trim() || 'CDSCO & State Drug Controller Blood Bank Operating License',
        documentNumber: formData.get('documentNumber')?.toString().trim() || 'CERT-KA-2026-89240',
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
        updateProofUI('state_accreditation_certificate_2026.pdf', '2.4 MB');
        showToast('Sample Facility Loaded', 'Apollo Hospitals & Apex Trauma Centre details & verification proof loaded.', 'info');
      });
    }
  }

  // C. Emergency Patient Blood Request Modal / Form
  const requestForms = document.querySelectorAll('.form-blood-request');
  requestForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const patientName = form.querySelector('[name="patientName"]')?.value?.trim() || 'Devika Sharma';
      const patientAge = parseInt(form.querySelector('[name="patientAge"]')?.value || 32, 10);
      const patientGender = form.querySelector('[name="patientGender"]')?.value || 'Female';
      const bloodGroup = form.querySelector('input[name="blood_type"]:checked')?.value || 'B+';
      const component = form.querySelector('[name="component"]')?.value || 'Platelets (Apheresis)';
      const units = parseInt(form.querySelector('[name="units"]')?.value || 3, 10);
      const hospitalName = form.querySelector('[name="hospitalName"]')?.value?.trim() || 'Apollo Hospitals & Apex Trauma Centre';
      const ward = form.querySelector('[name="ward"]')?.value?.trim() || 'ICU Ward 4B, Bed 12';
      const attendantName = form.querySelector('[name="attendantName"]')?.value?.trim() || 'Rajesh Sharma';
      const attendantRelation = form.querySelector('[name="attendantRelation"]')?.value?.trim() || 'Brother / Attendant';
      const attendantPhone = form.querySelector('[name="attendantPhone"]')?.value?.trim() || '+91 95280 33454';
      const urgency = form.querySelector('[name="urgency"]')?.value || 'Stat Emergency (< 45 Mins)';
      const notes = form.querySelector('[name="notes"]')?.value?.trim() || 'Urgent clinical blood request for patient.';
      const proofDocType = form.querySelector('[name="proofDocType"]')?.value || 'Hospital Blood Requisition Slip (Form 27-C Stamped)';
      const doctorRegId = form.querySelector('[name="doctorRegId"]')?.value?.trim() || 'Dr. Aravind Sharma (NMC/KMC-48921)';
      const ipdCaseNo = form.querySelector('[name="ipdCaseNo"]')?.value?.trim() || 'IPD-9042-ICU';
      const proofFileName = form.querySelector('.proof-filename-display')?.textContent?.trim() || 'apollo_blood_requisition_form27c_signed.pdf';

      let newPatient = null;
      if (window.PulseStore && typeof window.PulseStore.createNewPatientRequest === 'function') {
        newPatient = window.PulseStore.createNewPatientRequest({
          patientName,
          patientAge,
          patientGender,
          bloodGroup,
          component,
          unitsRequired: units,
          hospitalName,
          ward,
          attendantName,
          attendantRelation,
          attendantPhone,
          urgency,
          notes,
          proofDocType,
          doctorRegId,
          ipdCaseNo,
          proofFileName
        });
      } else if (window.PulseStore && typeof window.PulseStore.addRequest === 'function') {
        window.PulseStore.addRequest({
          bloodGroup,
          component,
          units,
          ward,
          urgency,
          notes,
          location: hospitalName
        });
      }

      closeRequestModal();
      showToast(
        '🚨 Emergency Requisition Broadcasted!',
        `Patient ${patientName} (${bloodGroup} ${component}) requisition #${newPatient ? newPatient.requestId : 'REQ-9042'} dispatched to proximate verified donors!`,
        'success'
      );

      // Transition to recipient dashboard so the family can immediately monitor live donors & PIN
      if (window.PulseRouter) {
        window.PulseRouter.navigate('recipient-dashboard');
      } else {
        window.location.href = 'index.html#/recipient-dashboard';
      }

      if (typeof window.renderRecipientDashboard === 'function') {
        setTimeout(() => window.renderRecipientDashboard(), 80);
      }
    });
  });
}

function fillDonorFormDemo() {
  const form = document.getElementById('form-donor-register');
  if (!form) return;
  setInputValue(form, 'fullName', 'Arjun Nair');
  setInputValue(form, 'age', '29');
  setInputValue(form, 'bloodGroup', 'A+');
  setInputValue(form, 'phone', '+91 98451 44290');
  setInputValue(form, 'email', 'arjun.nair@donor-pulse.in');
  setInputValue(form, 'address', '#24, 4th Cross, Koramangala 4th Block');
  setInputValue(form, 'city', 'Bengaluru, Karnataka');
  setInputValue(form, 'lastDonationDate', '2026-06-14');
  setInputValue(form, 'radiusMiles', '10');
  setInputValue(form, 'medicalHistory', 'Pre-screened whole blood donor. Optimal hemoglobin 15.2 g/dL. No restrictions.');
  const avail = form.querySelector('[name="availability"]');
  if (avail) avail.checked = true;
}

function fillHospitalFormDemo() {
  const form = document.getElementById('form-hospital-register');
  if (!form) return;
  setInputValue(form, 'hospitalName', 'Apollo Hospitals & Apex Trauma Centre');
  setInputValue(form, 'hospitalCategory', 'Apex Multi-Specialty & Level 1 Trauma Center');
  setInputValue(form, 'hospitalLocation', 'Trauma Resuscitation Wing, Floor 1');
  setInputValue(form, 'bedCapacity', '650');
  setInputValue(form, 'traumaLevel', 'Trauma Level 1');
  setInputValue(form, 'address', '154/11 Bannerghatta Main Road');
  setInputValue(form, 'city', 'Bengaluru');
  setInputValue(form, 'state', 'Karnataka');
  setInputValue(form, 'zip', '560076');
  setInputValue(form, 'phone', '+91 (80) 2630-4050');
  setInputValue(form, 'email', 'emergency.triage@apollo-bengaluru.in');
  setInputValue(form, 'licenseNumber', 'NABH-BB-KA-88219');
  setInputValue(form, 'authorizedPerson', 'Dr. Aravind Sharma, MD');
  setInputValue(form, 'roleTitle', 'Chief Medical Officer & Triage Director');
  setInputValue(form, 'documentType', 'CDSCO & State Drug Controller Blood Bank Operating License');
  setInputValue(form, 'documentNumber', 'CERT-KA-2026-89240');
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
        radiusBadge.textContent = 'RADIUS: 10 KM ACTIVE';
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
  window.scrollToRecipientSection = function(sectionId) {
    let target = document.getElementById(sectionId);
    if (!target && sectionId === 'recipient-overview') {
      target = document.getElementById('hospital-overview') || document.getElementById('view-recipient-dashboard');
    }
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (sectionId === 'recipient-overview' || sectionId === 'hospital-overview') {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      if (document.documentElement) document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      if (document.body) document.body.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
    document.querySelectorAll('.recipient-nav-btn, .hospital-nav-btn').forEach(btn => {
      const navKey = btn.getAttribute('data-recipient-nav') || btn.getAttribute('data-hospital-nav');
      if ((sectionId.includes('overview') && navKey === 'overview') ||
          (sectionId.includes('donors') && navKey === 'donors') ||
          (sectionId.includes('tracking') && navKey === 'tracking') ||
          (sectionId.includes('requests') && navKey === 'requests')) {
        btn.classList.add('bg-primary/10', 'text-primary', 'font-bold');
        btn.classList.remove('text-on-surface-variant');
      } else {
        btn.classList.remove('bg-primary/10', 'text-primary', 'font-bold');
        btn.classList.add('text-on-surface-variant');
      }
    });
  };
  window.scrollToHospitalSection = window.scrollToRecipientSection;

  window.scrollToDonorSection = function(sectionId) {
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (sectionId === 'donor-overview') {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      if (document.documentElement) document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      if (document.body) document.body.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
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
      // If clicked from within the recipient dashboard or requisitions section, open the specialized update units modal
      if (btn.closest('#recipient-requests-section') || btn.closest('#view-recipient-dashboard')) {
        openRequestMoreBloodModal();
      } else {
        openRequestModal();
      }
    });
  });

  document.querySelectorAll('[data-close-modal-request]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      closeRequestModal();
    });
  });

  const modalReq = document.getElementById('modal-request');
  if (modalReq) {
    modalReq.addEventListener('click', (e) => {
      if (e.target === modalReq) closeRequestModal();
    });
    modalReq.querySelectorAll('input[name="blood_type"]').forEach(radio => {
      radio.addEventListener('change', () => {
        modalReq.querySelectorAll('.blood-radio-btn').forEach(btn => {
          btn.classList.remove('bg-primary', 'text-white', 'shadow-md');
          btn.classList.add('bg-surface-container', 'text-on-surface');
        });
        const activeDiv = radio.nextElementSibling;
        if (activeDiv) {
          activeDiv.classList.add('bg-primary', 'text-white', 'shadow-md');
          activeDiv.classList.remove('bg-surface-container', 'text-on-surface');
        }
      });
    });
  }

  // Listener for update units form
  const formUpdateUnits = document.getElementById('form-update-blood-units');
  if (formUpdateUnits) {
    formUpdateUnits.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('update-units-input');
      const noteInput = document.getElementById('update-units-note');
      const newUnits = parseInt(input ? input.value : currentBaseUnits, 10);

      if (isNaN(newUnits) || newUnits < 1) {
        if (typeof showToast === 'function') {
          showToast('Invalid Units', 'Please enter at least 1 unit of blood required.', 'warning');
        }
        return;
      }

      const note = noteInput ? noteInput.value.trim() : '';

      // Update in central store
      let updatedRecipient = null;
      if (window.PulseStore && typeof window.PulseStore.updateRecipientUnits === 'function') {
        updatedRecipient = window.PulseStore.updateRecipientUnits(newUnits, note ? { clinicalReason: note } : {});
      } else if (window.PulseStore && typeof window.PulseStore.updateRecipient === 'function') {
        updatedRecipient = window.PulseStore.updateRecipient({ unitsRequired: newUnits, ...(note ? { clinicalReason: note } : {}) });
      }

      closeRequestMoreBloodModal();

      const patientName = (updatedRecipient && updatedRecipient.patientName) || 'Devika Sharma';
      const bloodGroup = (updatedRecipient && updatedRecipient.bloodGroup) || 'B+';
      const comp = (updatedRecipient && updatedRecipient.component) || 'Platelets';

      if (typeof showToast === 'function') {
        showToast(
          '✅ Blood Requirement Updated!',
          `Requirement for ${patientName} (${bloodGroup} ${comp}) updated to ${newUnits} Units. Live grid updated.`,
          'success'
        );
      }

      // Re-render UI
      if (typeof window.renderRecipientDashboard === 'function') {
        window.renderRecipientDashboard();
      }
    });
  }

  const modalUpdateUnits = document.getElementById('modal-update-units');
  if (modalUpdateUnits) {
    modalUpdateUnits.addEventListener('click', (e) => {
      if (e.target === modalUpdateUnits) closeRequestMoreBloodModal();
    });
  }

  const updateUnitsInput = document.getElementById('update-units-input');
  if (updateUnitsInput) {
    updateUnitsInput.addEventListener('input', () => updateUnitsDiffDisplay());
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeRequestModal();
      closeRequestMoreBloodModal();
      if (typeof closeDonorLoginModal === 'function') closeDonorLoginModal();
      if (typeof closeHospitalLoginModal === 'function') closeHospitalLoginModal();
      if (typeof closeRecipientLoginModal === 'function') closeRecipientLoginModal();
    }
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


function resetRaiseRequestModal(modal) {
  if (!modal) modal = document.getElementById('modal-request');
  if (!modal) return;
  const form = modal.querySelector('form.form-blood-request') || modal.querySelector('form');
  if (form) form.reset();

  modal.querySelectorAll('input:not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="file"])').forEach(i => i.value = '');
  modal.querySelectorAll('textarea').forEach(t => t.value = '');
  modal.querySelectorAll('select').forEach(s => s.selectedIndex = 0);

  modal.querySelectorAll('input[name="blood_type"]').forEach(r => r.checked = false);
  modal.querySelectorAll('.blood-radio-btn').forEach(btn => {
    btn.classList.remove('bg-primary', 'text-white', 'shadow-md');
    btn.classList.add('bg-surface-container', 'text-on-surface');
  });

  const fileInput = modal.querySelector('.proof-file-input');
  if (fileInput) fileInput.value = '';
  const fileLabel = modal.querySelector('.proof-filename-display');
  if (fileLabel) fileLabel.textContent = 'No document attached yet';
  const sizeLabel = modal.querySelector('.proof-filesize-display');
  if (sizeLabel) sizeLabel.textContent = 'Upload hospital requisition slip, doctor prescription, or lab report (PDF/JPG/PNG)';

  const authTag = modal.querySelector('.proof-auth-tag');
  if (authTag) authTag.classList.add('hidden');

  const viewProofBtn = modal.querySelector('.proof-view-btn');
  if (viewProofBtn) viewProofBtn.classList.add('hidden');

  const uploadBtnText = modal.querySelector('.proof-upload-btn-text');
  if (uploadBtnText) uploadBtnText.textContent = 'Upload';

  const badge = modal.querySelector('.proof-verification-badge');
  if (badge) badge.classList.add('hidden');
}

function openRequestModal() {
  const modal = document.getElementById('modal-request');
  if (modal) {
    resetRaiseRequestModal(modal);
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }
}

function closeRequestModal() {
  const modal = document.getElementById('modal-request');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

function fillDemoRaiseRequest() {
  const modal = document.getElementById('modal-request') || document.querySelector('.form-blood-request');
  if (!modal) return;

  const setVal = (name, val) => {
    const el = modal.querySelector(`[name="${name}"]`);
    if (el) el.value = val;
  };

  setVal('patientName', 'Devika Sharma');
  setVal('patientAge', '32');
  setVal('patientGender', 'Female');
  setVal('hospitalName', 'Apollo Hospitals & Apex Trauma Centre');
  setVal('ward', 'ICU Ward 4B, Bed 12');
  setVal('component', 'Platelets (Apheresis)');
  setVal('units', '3');
  setVal('urgency', 'Stat Emergency (< 45 Mins)');
  setVal('attendantName', 'Rajesh Sharma');
  setVal('attendantRelation', 'Brother / Primary Attendant');
  setVal('attendantPhone', '+91 95280 33454');
  setVal('notes', 'Severe thrombocytopenia with acute hemorrhagic risk. Immediate donor-matched platelet transfusion required.');
  setVal('proofDocType', 'Hospital Blood Requisition Slip (Form 27-C Stamped)');
  setVal('doctorRegId', 'Dr. Aravind Sharma (NMC/KMC-48921)');
  setVal('ipdCaseNo', 'IPD-9042-ICU');

  const fileLabel = modal.querySelector('.proof-filename-display');
  if (fileLabel) fileLabel.textContent = 'apollo_blood_requisition_form27c_signed.pdf';
  const sizeLabel = modal.querySelector('.proof-filesize-display');
  if (sizeLabel) sizeLabel.textContent = '1.4 MB • Official Hospital Seal & Doctor Signature Detected';

  const authTag = modal.querySelector('.proof-auth-tag');
  if (authTag) authTag.classList.remove('hidden');

  const viewProofBtn = modal.querySelector('.proof-view-btn');
  if (viewProofBtn) viewProofBtn.classList.remove('hidden');

  const uploadBtnText = modal.querySelector('.proof-upload-btn-text');
  if (uploadBtnText) uploadBtnText.textContent = 'Replace';

  const badge = modal.querySelector('.proof-verification-badge');
  if (badge) {
    badge.classList.remove('hidden');
    badge.className = 'proof-verification-badge p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex flex-col gap-1.5 transition-all';
    const statusText = badge.querySelector('.proof-status-text');
    if (statusText) statusText.textContent = 'Authenticity Check: 100% Genuine Requisition';
  }

  const radio = modal.querySelector('input[name="blood_type"][value="B+"]') || modal.querySelector('input[name="blood_type"][value="O-"]');
  if (radio) {
    radio.checked = true;
    modal.querySelectorAll('.blood-radio-btn').forEach(btn => {
      btn.classList.remove('bg-primary', 'text-white', 'shadow-md');
      btn.classList.add('bg-surface-container', 'text-on-surface');
    });
    const activeDiv = radio.nextElementSibling;
    if (activeDiv) {
      activeDiv.classList.add('bg-primary', 'text-white', 'shadow-md');
      activeDiv.classList.remove('bg-surface-container', 'text-on-surface');
    }
  }
}

function handleProofFileSelect(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const fileSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
  const fileName = file.name;

  document.querySelectorAll('.proof-filename-display').forEach(el => el.textContent = fileName);
  document.querySelectorAll('.proof-filesize-display').forEach(el => el.textContent = `${fileSize} • Uploaded Document`);

  document.querySelectorAll('.proof-auth-tag').forEach(el => el.classList.remove('hidden'));
  document.querySelectorAll('.proof-view-btn').forEach(el => el.classList.remove('hidden'));
  document.querySelectorAll('.proof-upload-btn-text').forEach(el => el.textContent = 'Replace');

  // Simulate instant AI OCR & security seal verification scan
  document.querySelectorAll('.proof-verification-badge').forEach(badge => {
    badge.classList.remove('hidden');
    badge.className = 'proof-verification-badge p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs flex flex-col gap-1.5 transition-all animate-pulse';
    const statusText = badge.querySelector('.proof-status-text');
    if (statusText) statusText.innerHTML = '<span class="material-symbols-outlined text-[15px] animate-spin inline-block mr-1 align-text-bottom">sync</span> Verifying document signatures &amp; hospital seal...';
  });

  setTimeout(() => {
    document.querySelectorAll('.proof-verification-badge').forEach(badge => {
      badge.classList.remove('hidden');
      badge.className = 'proof-verification-badge p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex flex-col gap-1.5 transition-all';
      const statusText = badge.querySelector('.proof-status-text');
      if (statusText) statusText.textContent = 'Authenticity Check: 100% Genuine Requisition';
    });
    document.querySelectorAll('.proof-filesize-display').forEach(el => el.textContent = `${fileSize} • Official Hospital Seal & Doctor Signature Detected`);
    if (typeof showToast === 'function') {
      showToast('✅ Medical Document Authenticity Confirmed', 'Official hospital seal, doctor registration, and tamper-free metadata verified 100% genuine.', 'success');
    }
  }, 700);
}

function openMedicalProofViewer(customData) {
  const modal = document.getElementById('modal-medical-proof');
  if (!modal) return;

  const currentPatient = (customData) || (window.PulseStore && window.PulseStore.state && window.PulseStore.state.recipient) || {};
  const form = document.querySelector('.form-blood-request');
  
  const patientName = (form && form.querySelector('[name="patientName"]')?.value?.trim()) || currentPatient.patientName || 'Devika Sharma';
  const age = (form && form.querySelector('[name="patientAge"]')?.value) || currentPatient.patientAge || 32;
  const gender = (form && form.querySelector('[name="patientGender"]')?.value) || currentPatient.patientGender || 'Female';
  const ward = (form && form.querySelector('[name="ward"]')?.value?.trim()) || currentPatient.hospitalWard || 'ICU Ward 4B, Bed 12';
  const blood = (form && form.querySelector('input[name="blood_type"]:checked')?.value) || currentPatient.bloodGroup || 'B+';
  const component = (form && form.querySelector('[name="component"]')?.value) || currentPatient.component || 'Platelets (Apheresis)';
  const units = (form && form.querySelector('[name="units"]')?.value) || currentPatient.unitsRequired || 3;
  const urgency = (form && form.querySelector('[name="urgency"]')?.value) || currentPatient.urgency || 'Stat Emergency (< 45 Mins)';
  const notes = (form && form.querySelector('[name="notes"]')?.value?.trim()) || currentPatient.clinicalReason || 'Severe thrombocytopenia with acute hemorrhagic risk. Immediate donor-matched platelet transfusion required.';
  const doctor = (form && form.querySelector('[name="doctorRegId"]')?.value?.trim()) || currentPatient.doctorName || 'Dr. Aravind Sharma (NMC/KMC-48921)';
  const ipd = (form && form.querySelector('[name="ipdCaseNo"]')?.value?.trim()) || (currentPatient.verificationProof && currentPatient.verificationProof.ipdCaseNo) || 'IPD-9042-ICU';

  const setText = (id, txt) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  };

  setText('doc-proof-patient-name', patientName);
  setText('doc-proof-patient-meta', `${age} Yrs / ${gender} • ${ipd}`);
  setText('doc-proof-ward', ward);
  const bloodText = (blood.includes('Positive') || blood.includes('Negative'))
    ? blood
    : blood.endsWith('+')
      ? `${blood} (Positive)`
      : blood.endsWith('-')
        ? `${blood} (Negative)`
        : blood;
  setText('doc-proof-blood-group', bloodText);
  setText('doc-proof-component-units', `${component} — ${units} Units`);
  setText('doc-proof-urgency', urgency);
  setText('doc-proof-notes', notes);
  setText('doc-proof-doctor-reg', `${doctor} — Registered Practitioner`);
  setText('doc-proof-sl-no', `REQ-9042 / ${ipd}`);

  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

function closeMedicalProofViewer() {
  const modal = document.getElementById('modal-medical-proof');
  if (modal) {
    modal.classList.add('hidden');
    // Only restore body overflow if request modal is also closed
    const reqModal = document.getElementById('modal-request');
    if (!reqModal || reqModal.classList.contains('hidden')) {
      document.body.classList.remove('overflow-hidden');
    }
  }
}

function printMedicalProof() {
  window.print();
}

// --- REQUEST MORE BLOOD / UPDATE REQUIRED UNITS MODAL ---
let currentBaseUnits = 3;

function openRequestMoreBloodModal() {
  const modal = document.getElementById('modal-update-units');
  if (!modal) return;

  const recipient = (window.PulseStore && typeof window.PulseStore.getRecipient === 'function')
    ? window.PulseStore.getRecipient()
    : { patientName: 'Devika Sharma', bloodGroup: 'B+', component: 'Platelets (Apheresis)', hospitalName: 'Apollo Hospitals & Apex Trauma Centre', hospitalWard: 'ICU Ward 4B, Bed 12', requestId: 'REQ-9042', unitsRequired: 3, unitsArranged: 2, unitsFulfilled: 1, attendantName: 'Rajesh Sharma', attendantPhone: '+91 95280 33454', doctorName: 'Dr. Aravind Sharma' };

  currentBaseUnits = parseInt(recipient.unitsRequired || 3, 10);

  // Populate context badges
  const badgeBlood = modal.querySelector('.update-modal-blood-badge');
  if (badgeBlood) badgeBlood.textContent = recipient.bloodGroup || 'B+';

  const patientNameEl = modal.querySelector('.update-modal-patient-name');
  if (patientNameEl) patientNameEl.textContent = recipient.patientName || 'Devika Sharma';

  const reqIdEl = modal.querySelector('.update-modal-req-id');
  if (reqIdEl) reqIdEl.textContent = '#' + (recipient.requestId || 'REQ-9042');

  const compHospEl = modal.querySelector('.update-modal-component-hospital');
  if (compHospEl) {
    compHospEl.textContent = `${recipient.component || 'Platelets (Apheresis)'} • ${recipient.hospitalName || 'Apollo Hospitals & Apex Trauma Centre'} (${recipient.hospitalWard || 'ICU Ward 4B, Bed 12'})`;
  }

  const attendantEl = modal.querySelector('.update-modal-attendant-info');
  if (attendantEl) {
    attendantEl.textContent = `Attendant: ${recipient.attendantName || 'Rajesh Sharma'} (${recipient.attendantPhone || '+91 95280 33454'}) • Doctor: ${recipient.doctorName || 'Dr. Aravind Sharma'} (Form 27-C Verified)`;
  }

  const currReqEl = modal.querySelector('.update-modal-current-req');
  if (currReqEl) currReqEl.textContent = `${currentBaseUnits} Units`;

  const arrangedEl = modal.querySelector('.update-modal-arranged');
  if (arrangedEl) arrangedEl.textContent = `${recipient.unitsArranged || 2} Donors`;

  const fulfilledEl = modal.querySelector('.update-modal-fulfilled');
  if (fulfilledEl) fulfilledEl.textContent = `${recipient.unitsFulfilled || 1} Received`;

  // Set input value to current units
  const input = document.getElementById('update-units-input');
  if (input) {
    input.value = currentBaseUnits;
  }

  const noteInput = document.getElementById('update-units-note');
  if (noteInput) noteInput.value = '';

  updateUnitsDiffDisplay();

  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');

  if (input) {
    setTimeout(() => {
      input.focus();
      input.select();
    }, 80);
  }
}

function closeRequestMoreBloodModal() {
  const modal = document.getElementById('modal-update-units');
  if (modal) {
    modal.classList.add('hidden');
    // Only restore body overflow if other modals are closed
    const reqModal = document.getElementById('modal-request');
    if (!reqModal || reqModal.classList.contains('hidden')) {
      document.body.classList.remove('overflow-hidden');
    }
  }
}

function stepUpdateUnits(delta) {
  const input = document.getElementById('update-units-input');
  if (!input) return;
  let val = parseInt(input.value || currentBaseUnits, 10);
  if (isNaN(val)) val = currentBaseUnits;
  val = Math.max(1, Math.min(25, val + delta));
  input.value = val;
  updateUnitsDiffDisplay();
}

function quickAddUnits(amount) {
  const input = document.getElementById('update-units-input');
  if (!input) return;
  input.value = Math.max(1, Math.min(25, currentBaseUnits + amount));
  updateUnitsDiffDisplay();
}

function resetUnitsToCurrent() {
  const input = document.getElementById('update-units-input');
  if (!input) return;
  input.value = currentBaseUnits;
  updateUnitsDiffDisplay();
}

function updateUnitsDiffDisplay() {
  const input = document.getElementById('update-units-input');
  const bannerText = document.getElementById('update-units-diff-text');
  if (!input || !bannerText) return;

  const newVal = parseInt(input.value || currentBaseUnits, 10);
  const diff = newVal - currentBaseUnits;

  if (diff > 0) {
    bannerText.innerHTML = `Increasing requirement by <strong class="text-primary font-bold">+${diff} unit${diff > 1 ? 's' : ''}</strong> (Total <strong>${newVal} Units</strong> needed). Proximate donors alerted.`;
  } else if (diff < 0) {
    bannerText.innerHTML = `Decreasing requirement by <strong class="text-secondary font-bold">${diff} unit${Math.abs(diff) > 1 ? 's' : ''}</strong> (New total <strong>${newVal} Units</strong>).`;
  } else {
    bannerText.innerHTML = `Requirement remains set to current requirement of <strong>${currentBaseUnits} Units</strong>.`;
  }
}

window.openRaiseRequestModal = openRequestModal;
window.closeRaiseRequestModal = closeRequestModal;
window.openRequestModal = openRequestModal;
window.closeRequestModal = closeRequestModal;
window.resetRaiseRequestModal = resetRaiseRequestModal;
window.fillDemoRaiseRequest = fillDemoRaiseRequest;
window.handleProofFileSelect = handleProofFileSelect;
window.openMedicalProofViewer = openMedicalProofViewer;
window.closeMedicalProofViewer = closeMedicalProofViewer;
window.printMedicalProof = printMedicalProof;

window.openRequestMoreBloodModal = openRequestMoreBloodModal;
window.closeRequestMoreBloodModal = closeRequestMoreBloodModal;
window.stepUpdateUnits = stepUpdateUnits;
window.quickAddUnits = quickAddUnits;
window.resetUnitsToCurrent = resetUnitsToCurrent;
window.updateUnitsDiffDisplay = updateUnitsDiffDisplay;

// --- DONOR REGISTRATION POPUP MODAL FUNCTIONS ---
function openDonorRegisterModal() {
  const modal = document.getElementById('modal-donor-register');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    const nameInput = modal.querySelector('input[name="fullName"]');
    if (nameInput) setTimeout(() => nameInput.focus(), 100);
  }
}

function closeDonorRegisterModal() {
  const modal = document.getElementById('modal-donor-register');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

function fillDemoDonorRegister() {
  const modal = document.getElementById('modal-donor-register');
  if (!modal) return;

  const setVal = (name, val) => {
    const el = modal.querySelector(`[name="${name}"]`);
    if (el) el.value = val;
  };

  setVal('fullName', 'Arjun Nair');
  setVal('age', '29');
  setVal('gender', 'Male');
  setVal('phone', '+91 98451 44290');
  setVal('email', 'arjun.nair@donor-pulse.in');
  setVal('city', 'Bengaluru, Karnataka');
  setVal('address', '#24, 4th Cross, Koramangala 4th Block');
  setVal('lastDonationDate', '2026-06-14');
  setVal('radiusMiles', '10');
  setVal('medicalHistory', 'Pre-screened whole blood donor. Optimal hemoglobin 15.2 g/dL. No restrictions.');

  const avail = modal.querySelector('[name="availability"]');
  if (avail) avail.checked = true;

  const radio = modal.querySelector('input[name="donor_blood_type"][value="A+"]') || modal.querySelector('input[name="donor_blood_type"][value="O-"]');
  if (radio) {
    radio.checked = true;
    modal.querySelectorAll('.donor-blood-btn').forEach(btn => {
      btn.classList.remove('bg-primary', 'text-white', 'shadow-md');
      btn.classList.add('bg-surface-container', 'text-on-surface');
    });
    const activeDiv = radio.nextElementSibling;
    if (activeDiv) {
      activeDiv.classList.add('bg-primary', 'text-white', 'shadow-md');
      activeDiv.classList.remove('bg-surface-container', 'text-on-surface');
    }
  }

  showToast('Demo Donor Profile Loaded', 'Arjun Nair (A+ Donor) details loaded into registration form.', 'info');
}

window.openDonorRegisterModal = openDonorRegisterModal;
window.closeDonorRegisterModal = closeDonorRegisterModal;
window.fillDemoDonorRegister = fillDemoDonorRegister;

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
            <span class="px-2 py-0.5 rounded-full bg-surface-container-high text-xs font-mono font-bold">${escapeHtml(hospital.licenseNumber || 'NABH-BB-KA-88219')}</span>
          </div>
          <h4 class="font-title-md font-bold text-on-surface mt-0.5">${escapeHtml(hospital.name || 'Healthcare Facility')}</h4>
          <p class="text-xs text-on-surface-variant mt-0.5">National Node ID: <span class="font-mono font-semibold text-primary">${escapeHtml(hospital.id || 'HSP-35349-KA')}</span></p>
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
        <span class="font-semibold text-on-surface">${escapeHtml(hospital.phone || '+91 (80) 2630-4050')}</span>
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
  const locStr = `${donor.address ? donor.address + ', ' : ''}${donor.city}`;
  setTextContentAll('.donor-location-display', locStr);
  setTextContentAll('.donor-distance-display', `Within ${donor.radiusMiles || 10} km`);
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
    codeRedTitle.innerHTML = `CRITICAL: Urgent ${donor.bloodGroup} units needed at Manipal Hospital Trauma Center`;
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
 * ============================================================================
 * 6. RECIPIENT & FAMILY / FRIENDS DASHBOARD CONTROLLERS
 * Dedicated to blood recipients, their relatives, or friends coordinating emergency blood.
 * ============================================================================
 */
function renderRecipientDashboard() {
  const recipient = (window.PulseStore && typeof window.PulseStore.getRecipient === 'function')
    ? window.PulseStore.getRecipient()
    : {
        id: 'CASE-9042',
        requestId: 'REQ-9042',
        patientName: 'Devika Sharma',
        patientAge: 32,
        patientGender: 'Female',
        bloodGroup: 'B+',
        component: 'Platelets (Apheresis)',
        unitsRequired: 3,
        unitsArranged: 2,
        unitsFulfilled: 1,
        urgency: 'Stat Emergency (< 45 Mins)',
        hospitalName: 'Apollo Hospitals & Apex Trauma Centre',
        hospitalWard: 'ICU Ward 4B, Bed 12',
        hospitalAddress: '154/11 Bannerghatta Main Road, Bengaluru, Karnataka 560076',
        attendantName: 'Rajesh Sharma',
        attendantRelation: 'Brother / Primary Attendant',
        attendantPhone: '+91 95280 33454',
        attendantEmail: 'rajesh.sharma@familycare.in',
        doctorName: 'Dr. Aravind Sharma, MD',
        doctorDepartment: 'Trauma & Critical Care',
        doctorPhone: '+91 (80) 2630-4050 Ext 4429',
        hospitalBloodDesk: '+91 (80) 2630-4050',
        clinicalReason: 'Severe thrombocytopenia with acute hemorrhagic risk. Immediate donor-matched platelet transfusion required.',
        handshakeOTP: '7842',
        trackingStage: 4,
        broadcastDate: 'Today, 14:10 IST',
        appealActive: true,
        verificationProof: {
          documentType: 'Hospital Blood Requisition Slip (Form 27-C Stamped)',
          doctorRegId: 'Dr. Aravind Sharma (NMC/KMC-48921)',
          ipdCaseNo: 'IPD-9042-ICU',
          fileName: 'apollo_blood_requisition_form27c_signed.pdf',
          fileSize: '1.4 MB',
          status: 'VERIFIED_GENUINE',
          verificationScore: '100% Genuine Requisition'
        }
      };

  // Recipient / Patient Identity & Attributes
  const sidebar = document.querySelector('#view-recipient-dashboard aside');
  if (sidebar) sidebar.scrollTop = 0;

  const cleanRelation = (recipient.attendantRelation || '').split('/')[0].trim();
  const cleanHospital = recipient.hospitalName.split('&')[0].trim();
  const cleanWard = recipient.hospitalWard.split(',')[0].trim();

  setTextContentAll('.patient-name-display', recipient.patientName);
  setTextContentAll('.patient-blood-display', `${recipient.bloodGroup} ${recipient.component.split(' ')[0]}`);
  setTextContentAll('.patient-blood-group-badge', recipient.bloodGroup);
  setTextContentAll('.patient-component-display', recipient.component);
  setTextContentAll('.patient-meta-display', `${recipient.patientAge} Yrs • ${recipient.patientGender} • ICU Ward 4B`);
  setTextContentAll('.attendant-name-display', cleanRelation ? `${recipient.attendantName} (${cleanRelation})` : recipient.attendantName);
  setTextContentAll('.attendant-phone-display', recipient.attendantPhone);
  setTextContentAll('.hospital-name-display', recipient.hospitalName);
  setTextContentAll('.hospital-location-display', `${recipient.hospitalWard}, ${cleanHospital}`);
  setTextContentAll('.hospital-phone-display', recipient.hospitalBloodDesk);
  const shortHospital = cleanHospital.replace(/\s+Hospital$/i, '');
  setTextContentAll('.hospital-ward-display', `${shortHospital}, ${cleanWard}`);
  setTextContentAll('.doctor-name-display', recipient.doctorName);
  setTextContentAll('.doctor-meta-display', `${recipient.doctorDepartment} • Ext 4429`);
  setTextContentAll('.case-id-display', `Case: ${recipient.id}`);
  setTextContentAll('.patient-case-display', `${recipient.patientName} (${recipient.bloodGroup} ${recipient.component.split(' ')[0]}) — ${cleanHospital}`);
  setTextContentAll('.recipient-req-id-display', recipient.requestId);
  setTextContentAll('.handshake-otp-display', recipient.handshakeOTP);
  setTextContentAll('.recipient-urgency-display', recipient.urgency);
  setTextContentAll('.patient-units-summary', `${recipient.unitsRequired} Units Req. • ${recipient.unitsFulfilled} Received`);
  setTextContentAll('.patient-units-needed', `${recipient.unitsRequired} Units`);
  setTextContentAll('.patient-units-enroute', `${Math.max(0, recipient.unitsArranged - recipient.unitsFulfilled)} En Route`);
  setTextContentAll('.patient-units-fulfilled', `${recipient.unitsFulfilled} Received`);

  // Progress Bar for Units
  const pct = Math.min(100, Math.round((recipient.unitsArranged / recipient.unitsRequired) * 100));
  document.querySelectorAll('.recipient-progress-bar').forEach(bar => {
    bar.style.width = `${pct}%`;
  });
  setTextContentAll('.recipient-progress-pct', `${pct}% Arranged`);

  // Case Switcher Dropdown (Supported if element exists in DOM)
  const switcher = document.getElementById('recipient-case-switcher');
  if (switcher && typeof window.PulseStore.getRecipientCases === 'function') {
    const list = window.PulseStore.getRecipientCases();
    switcher.innerHTML = list.map(c => `
      <option value="${escapeHtml(c.id)}" ${c.id === recipient.id ? 'selected' : ''}>
        ${escapeHtml(c.patientName)} (${escapeHtml(c.bloodGroup)} ${escapeHtml(c.component.split(' ')[0])}) — ${escapeHtml(c.hospitalName.split(' ')[0])}
      </option>
    `).join('');

    if (!switcher.dataset.hasListener) {
      switcher.dataset.hasListener = 'true';
      switcher.addEventListener('change', (e) => {
        const switched = window.PulseStore.switchRecipientCase(e.target.value);
        if (switched) {
          showToast('Patient Case Active', `Switched view to ${switched.patientName} (${switched.bloodGroup})`, 'info');
          renderRecipientDashboard();
        }
      });
    }
  }

  // Pre-fill SOS WhatsApp preview text
  const originUrl = window.location.origin + window.location.pathname;
  const appealText = `🚨 URGENT BLOOD NEEDED!
Patient: ${recipient.patientName} (${recipient.bloodGroup})
Requirement: ${recipient.unitsRequired} Units of ${recipient.component}
Hospital: ${recipient.hospitalName}, ${recipient.hospitalWard}
Urgency: ${recipient.urgency}
Attendant Contact: ${recipient.attendantName} (${recipient.attendantPhone})
Verified Case: #${recipient.requestId}
👉 Click to respond or volunteer: ${originUrl}#/emergency-request`;

  const appealTextarea = document.getElementById('recipient-appeal-preview');
  if (appealTextarea) {
    appealTextarea.value = appealText;
  }

  // Backwards compatibility with legacy node selectors if present in DOM
  setTextContentAll('.hospital-license-display', `Verified Patient Case (Requisition #${recipient.requestId})`);
  setTextContentAll('.hospital-triage-officer', recipient.doctorName);
  setTextContentAll('.hospital-beds-display', recipient.hospitalWard);
  setTextContentAll('.hospital-trauma-display', `Urgency: ${recipient.urgency}`);
  setTextContentAll('.hospital-category-badge', `${recipient.bloodGroup} ${recipient.component}`);
  setTextContentAll('.hospital-node-id', `Case: ${recipient.id}`);

  // Render Sub-Sections
  renderRecipientDonorsSection(recipient);
  renderRecipientTrackingSection(recipient);
  renderRecipientRequestsList(recipient);
}

function renderRecipientDonorsSection(recipient) {
  const container = document.getElementById('recipient-donors-container');
  if (!container) return;

  const bloodGroup = recipient.bloodGroup || 'B+';
  const donors = (window.PulseStore && typeof window.PulseStore.getRequestDonorTracking === 'function')
    ? window.PulseStore.getRequestDonorTracking(recipient.requestId, bloodGroup)
    : [];

  const arrivingDonors = donors.slice(0, 3);
  setTextContentAll('.recipient-donors-count-badge', `${arrivingDonors.length} Donors Responding`);
  setTextContentAll('.recipient-donors-active-count', arrivingDonors.length);

  if (arrivingDonors.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center bg-surface-container-low rounded-xl">
        <p class="font-body-md text-on-surface-variant">Searching for nearby volunteer donors...</p>
      </div>
    `;
    return;
  }

  container.innerHTML = arrivingDonors.map((d, idx) => `
    <div class="p-4 rounded-xl bg-surface-container-low border border-surface-container-high hover:border-primary/40 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${idx === 0 ? 'ring-2 ring-primary/20 bg-primary-fixed/5' : ''}">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-12 h-12 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-headline-sm shrink-0 shadow-xs">
          ${escapeHtml(d.initials || d.name.substring(0, 2).toUpperCase())}
        </div>
        <div class="flex flex-col min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <h4 class="font-title-md font-bold text-on-surface">${escapeHtml(d.name)}</h4>
            <span class="px-2 py-0.5 rounded-full ${d.bloodGroup === 'O-' ? 'bg-error-container text-primary font-bold' : 'bg-surface-container-high text-on-surface font-bold'} text-xs">
              ${escapeHtml(d.bloodGroup)}
            </span>
            <span class="px-2.5 py-0.5 rounded-full ${d.statusClass || 'bg-primary-fixed text-primary'} text-[11px] font-bold">
              ${escapeHtml(d.transitStatus || 'En Route')}
            </span>
            ${idx === 0 ? '<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">Fastest ETA</span>' : ''}
          </div>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant mt-1">
            <span class="flex items-center gap-1 font-semibold text-primary">
              <span class="material-symbols-outlined text-[15px]">timer</span>
              ETA: ${escapeHtml(d.liveEta || '14 mins')}
            </span>
            <span>•</span>
            <span class="flex items-center gap-1">
              <span class="material-symbols-outlined text-[15px] text-tertiary">near_me</span>
              ${escapeHtml(d.landmark || 'Approaching hospital')}
            </span>
            <span>•</span>
            <span>Match: 100% Compatible</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0 self-end md:self-center">
        <button type="button" onclick="window.verifyDonorHandshake('${recipient.handshakeOTP}', '${escapeHtml(d.name)}')" class="px-3.5 py-2 rounded-xl bg-tertiary-container/30 hover:bg-tertiary-container/50 text-tertiary font-label-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95" title="Verify Donor at Blood Bank Counter">
          <span class="material-symbols-outlined text-[16px]">pin</span>
          <span>Confirm Arrival</span>
        </button>
        <a href="tel:${escapeHtml(d.phone || '+91 98201 44521')}" class="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs" title="Call Donor Directly">
          <span class="material-symbols-outlined text-[16px] text-primary">call</span>
          <span>Call Donor</span>
        </a>
        <button type="button" onclick="window.showToast('Donor Line Active', 'Opening messaging link to ${escapeHtml(d.name)}', 'info')" class="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition-all cursor-pointer" title="Direct Message">
          <span class="material-symbols-outlined text-[18px]">chat</span>
        </button>
      </div>
    </div>
  `).join('');
}

function renderRecipientTrackingSection(recipient) {
  const container = document.getElementById('recipient-stepper-container');
  if (!container) return;

  const currentStage = recipient.trackingStage || 4;
  const stages = [
    { num: 1, name: 'Requisition Raised', sub: 'Broadcasted to Grid', icon: 'campaign' },
    { num: 2, name: 'Donors Alerted', sub: '16 Paged nearby', icon: 'cell_tower' },
    { num: 3, name: 'Donors Accepted', sub: '3 Pledged to Donate', icon: 'how_to_reg' },
    { num: 4, name: 'En Route to Hospital', sub: 'In Transit (~14 mins)', icon: 'directions_car' },
    { num: 5, name: 'Blood Bank Intake', sub: 'Sample Cross-Match', icon: 'science' },
    { num: 6, name: 'Transfusion Ready', sub: 'Delivery to Ward 4B', icon: 'favorite' }
  ];

  container.innerHTML = stages.map(s => {
    const isCompleted = s.num < currentStage;
    const isCurrent = s.num === currentStage;

    let badgeClass = 'bg-surface-container-high text-on-surface-variant';
    let ringClass = '';
    let statusText = 'Upcoming';

    if (isCompleted) {
      badgeClass = 'bg-tertiary-fixed text-on-tertiary-fixed font-bold';
      statusText = 'Completed';
    } else if (isCurrent) {
      badgeClass = 'bg-primary text-on-primary font-bold shadow-md';
      ringClass = 'ring-4 ring-primary/20 animate-pulse';
      statusText = 'IN PROGRESS';
    }

    return `
      <div onclick="window.setRecipientStage(${s.num})" class="flex flex-col items-center text-center p-2.5 rounded-xl hover:bg-surface-container-low transition-all cursor-pointer group" title="Click to view or switch to Stage ${s.num}">
        <div class="w-11 h-11 rounded-full flex items-center justify-center mb-2 ${badgeClass} ${ringClass} transition-transform group-hover:scale-105">
          <span class="material-symbols-outlined text-[20px]">${isCompleted ? 'check' : s.icon}</span>
        </div>
        <span class="text-xs font-bold text-on-surface leading-tight">${s.name}</span>
        <span class="text-[10px] text-on-surface-variant mt-0.5">${s.sub}</span>
        <span class="mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${isCurrent ? 'bg-primary-fixed text-primary' : isCompleted ? 'text-tertiary font-semibold' : 'text-secondary'}">
          ${statusText}
        </span>
      </div>
    `;
  }).join('');
}

function renderRecipientRequestsList(recipient) {
  const container = document.getElementById('recipient-requests-container');
  if (!container) return;

  container.innerHTML = `
    <div class="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-13 h-13 rounded-2xl bg-error-container text-primary flex items-center justify-center font-bold text-2xl shrink-0 shadow-xs">
          ${escapeHtml(recipient.bloodGroup)}
        </div>
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-mono font-bold text-xs text-primary bg-primary-fixed/30 px-2 py-0.5 rounded">${recipient.requestId}</span>
            <h4 class="font-title-md font-bold text-on-surface">${escapeHtml(recipient.component)}</h4>
            <span class="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[11px] font-bold animate-pulse">
              ${escapeHtml(recipient.urgency)}
            </span>
          </div>
          <p class="text-xs text-on-surface-variant mt-1">
            <strong>${recipient.unitsRequired} Units Required</strong> (${recipient.unitsArranged} Arranged, ${recipient.unitsFulfilled} Received) • Admitted: ${escapeHtml(recipient.hospitalWard)}
          </p>
          <p class="text-xs text-secondary mt-0.5 italic">
            Clinical note: "${escapeHtml(recipient.clinicalReason)}"
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button type="button" onclick="window.copySOSAppealLink()" class="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer">
          <span class="material-symbols-outlined text-[16px]">share</span>
          <span>Share Case</span>
        </button>
        <button type="button" onclick="window.openRequestMoreBloodModal()" class="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer">
          <span class="material-symbols-outlined text-[16px]">edit_note</span>
          <span>Update Need</span>
        </button>
      </div>
    </div>
  `;
}

// Global actions for Recipient / Family Dashboard
window.renderRecipientDashboard = renderRecipientDashboard;
window.renderHospitalDashboard = renderRecipientDashboard; // alias for backwards compatibility

window.copySOSAppealLink = function() {
  const recipient = (window.PulseStore && typeof window.PulseStore.getRecipient === 'function')
    ? window.PulseStore.getRecipient()
    : { patientName: 'Devika Sharma', bloodGroup: 'B+', component: 'Platelets', hospitalName: 'Apollo Hospitals & Apex Trauma Centre', requestId: 'REQ-9042', attendantPhone: '+91 95280 33454' };

  const originUrl = window.location.origin + window.location.pathname;
  const text = `🚨 URGENT BLOOD NEEDED!
Patient: ${recipient.patientName} (${recipient.bloodGroup})
Requirement: ${recipient.unitsRequired || 3} Units of ${recipient.component}
Hospital: ${recipient.hospitalName}, ${recipient.hospitalWard || 'Ward 4B'}
Verified Case ID: #${recipient.requestId}
Attendant Contact: ${recipient.attendantPhone}
Please donate or share: ${originUrl}#/emergency-request`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      window.showToast('Appeal Copied!', 'Emergency appeal text copied to clipboard. Ready to paste in WhatsApp, SMS, or Telegram.', 'success');
    }).catch(() => {
      window.showToast('Appeal Ready', 'Please select and copy the appeal text box.', 'info');
    });
  } else {
    window.showToast('Appeal Ready', 'Emergency appeal text is ready in the preview box.', 'info');
  }
};

window.shareSOSOnWhatsApp = function() {
  const recipient = (window.PulseStore && typeof window.PulseStore.getRecipient === 'function')
    ? window.PulseStore.getRecipient()
    : { patientName: 'Devika Sharma', bloodGroup: 'B+', component: 'Platelets', hospitalName: 'Apollo Hospitals & Apex Trauma Centre', requestId: 'REQ-9042', attendantPhone: '+91 95280 33454' };

  const originUrl = window.location.origin + window.location.pathname;
  const msg = `🚨 URGENT BLOOD NEEDED!
Patient: ${recipient.patientName} (${recipient.bloodGroup})
Requirement: ${recipient.unitsRequired || 3} Units of ${recipient.component}
Hospital: ${recipient.hospitalName}, ${recipient.hospitalWard || 'Ward 4B'}
Verified Request: #${recipient.requestId}
Attendant Contact: ${recipient.attendantPhone}
👉 If you can donate or know someone who can, please click: ${originUrl}#/emergency-request`;

  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');
};

window.verifyDonorHandshake = function(otp, donorName = 'Volunteer Donor') {
  const entered = prompt(`Enter Donor Handshake OTP Code to verify arrival at hospital blood bank (Default code: ${otp}):`, otp);
  if (!entered) return;

  const result = (window.PulseStore && typeof window.PulseStore.verifyDonorHandshake === 'function')
    ? window.PulseStore.verifyDonorHandshake(entered)
    : { success: true };

  if (result.success) {
    window.showToast('Handshake Verified!', `Donor ${donorName} confirmed at Ward 4B Blood Bank counter. Units tagged for patient!`, 'success');
    if (window.PulseStore && typeof window.PulseStore.setRecipientTrackingStage === 'function') {
      window.PulseStore.setRecipientTrackingStage(5);
    }
    renderRecipientDashboard();
  } else {
    window.showToast('Verification Failed', result.message || 'Invalid code.', 'error');
  }
};

window.setRecipientStage = function(stageNum) {
  if (window.PulseStore && typeof window.PulseStore.setRecipientTrackingStage === 'function') {
    window.PulseStore.setRecipientTrackingStage(stageNum);
    renderRecipientDashboard();
    window.showToast('Timeline Updated', `Transfusion pipeline advanced to Stage ${stageNum}`, 'info');
  }
};

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
    <div onclick="window.openHospitalRequestModal('${req.id}')" class="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col md:flex-row md:items-center justify-between gap-space-md hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group">
      <div class="flex items-center gap-space-md min-w-0">
        <!-- Blood Group Badge: Explicitly Clickable for B+ or O- -->
        <div onclick="event.stopPropagation(); window.openHospitalRequestModal('${req.id}')" class="w-13 h-13 rounded-xl bg-error-container/80 hover:bg-error-container text-primary flex items-center justify-center font-bold text-headline-sm shrink-0 cursor-pointer shadow-xs hover:scale-105 active:scale-95 transition-all group-hover:ring-2 ring-primary/40" title="Click ${escapeHtml(req.bloodGroup)} to view matched donors, live tracking & requisition details">
          ${escapeHtml(req.bloodGroup)}
        </div>
        <div class="flex flex-col min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-mono font-bold text-sm text-primary">${escapeHtml(req.id)}</span>
            <span class="font-title-md font-bold text-on-surface group-hover:text-primary transition-colors">${escapeHtml(req.component)}</span>
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
      <div class="flex items-center gap-2 shrink-0 self-end md:self-center" onclick="event.stopPropagation()">
        <button type="button" onclick="window.openHospitalRequestModal('${req.id}')" class="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-bold transition-all shadow flex items-center gap-1.5 cursor-pointer active:scale-98" title="Open matched donors and live tracking pop-up for ${escapeHtml(req.id)}">
          <span class="material-symbols-outlined text-[18px]">open_in_new</span>
          <span>View Donors &amp; Live Tracking</span>
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
                ${donor.distance} km away
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
              ${donor.distance} km away
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
    id: 'CERT-AIIMS-2026-9041',
    date: 'September 18, 2026',
    hospital: 'AIIMS Transfusion Medicine Centre, New Delhi',
    type: 'Platelets (SDP - 2 Units)',
    bay: 'Apheresis Suite Bay 2',
    doctor: 'Dr. Rajesh Sharma, MD',
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

  const passQrModal = document.getElementById('modal-donor-pass-qr');
  if (passQrModal) {
    passQrModal.addEventListener('click', (e) => {
      if (e.target.id === 'modal-donor-pass-qr') {
        window.closeDonorPassQRModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closeCertificateModal();
      window.closeDonorPassQRModal();
    }
  });
});

// =====================================================================
// UNIVERSAL HAEMOVIGILANCE DIGITAL PASS QR MODAL HANDLERS
// =====================================================================
window.openDonorPassQRModal = function() {
  const modal = document.getElementById('modal-donor-pass-qr');
  if (!modal) return;

  const donor = window.PulseStore ? window.PulseStore.getDonor() : null;
  const donorName = (donor && donor.fullName) ? donor.fullName : 'Ananya Sharma';
  const bloodGroup = (donor && donor.bloodGroup) ? donor.bloodGroup : 'O-';
  const hb = (donor && donor.vitals && donor.vitals.hemoglobin) ? donor.vitals.hemoglobin : '14.8 g/dL';
  const bp = (donor && donor.vitals && donor.vitals.bp) ? donor.vitals.bp : '118/76 mmHg';

  const metaEl = document.getElementById('pass-modal-donor-meta');
  if (metaEl) {
    metaEl.textContent = `Verified Donor: ${donorName} • Blood Group: ${bloodGroup} (Universal)`;
  }

  const bloodEl = document.getElementById('pass-modal-blood');
  if (bloodEl) {
    bloodEl.textContent = bloodGroup.includes('O-') ? `${bloodGroup} (Universal)` : bloodGroup;
  }

  const hbEl = document.getElementById('pass-modal-hb');
  if (hbEl) hbEl.textContent = hb;

  const bpEl = document.getElementById('pass-modal-bp');
  if (bpEl) bpEl.textContent = bp;

  const imgEl = document.getElementById('pass-modal-qr-img');
  if (imgEl && !imgEl.src.includes('demo-donor-pass-qr.jpg')) {
    imgEl.src = 'images/demo-donor-pass-qr.jpg';
  }

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
};

window.closeDonorPassQRModal = function() {
  const modal = document.getElementById('modal-donor-pass-qr');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
};

window.downloadDonorPassQR = function() {
  const a = document.createElement('a');
  a.href = 'images/demo-donor-pass-qr.jpg';
  a.download = 'DonorPulse-Haemovigilance-Pass-QR.jpg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (window.showToast) {
    window.showToast('Pass QR Downloaded', 'Digital Haemovigilance Pass saved to your device.', 'success');
  }
};

/**
 * Global User Logout Handler
 */
window.logoutUser = function(role) {
  let roleName = 'Donor Portal';
  if (role === 'hospital') {
    roleName = 'Hospital Portal';
  } else if (role === 'recipient' || role === 'family' || role === 'patient') {
    roleName = 'Recipient Portal';
  } else if (role === 'donor') {
    roleName = 'Donor Portal';
  } else if (typeof role === 'string' && role.trim()) {
    roleName = `${role.charAt(0).toUpperCase() + role.slice(1)} Portal`;
  }
  if (window.showToast) {
    window.showToast('Logged Out', `Successfully signed out of the ${roleName}.`, 'info');
  }
  if (window.PulseRouter) {
    window.PulseRouter.navigate('role-selection');
  } else {
    window.location.hash = '#/role-selection';
  }
};

/**
 * Copy Donor Phone Number to Clipboard with Interactive UI Feedback
 */
window.copyDonorPhone = function(btn, phone) {
  if (!phone) return;

  const copyToClipboard = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      textArea.remove();
      return Promise.resolve();
    } catch (err) {
      textArea.remove();
      return Promise.reject(err);
    }
  };

  copyToClipboard(phone).then(() => {
    if (btn) {
      const originalHtml = btn.innerHTML;
      const originalClasses = btn.className;
      btn.classList.add('bg-tertiary-container/60', 'text-tertiary', 'border-tertiary/50');
      btn.innerHTML = `
        <span class="material-symbols-outlined text-[15px] text-tertiary">check_circle</span>
        <span class="phone-text font-bold text-tertiary">Copied!</span>
      `;
      setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.className = originalClasses;
      }, 1800);
    }
    if (window.showToast) {
      window.showToast('Phone Copied', `Donor contact ${phone} copied to clipboard.`, 'success');
    }
  }).catch(() => {
    if (window.showToast) {
      window.showToast('Contact Info', `Donor phone: ${phone}`, 'info');
    }
  });
};

// ============================================================================
// DONOR BLOOD REQUISITION DETAILS MODAL CONTROLLER
// ============================================================================
let activeDonorRequest = null;

window.openDonorRequestModal = function(data) {
  activeDonorRequest = data || {
    hospital: "Manipal Hospital Comprehensive Trauma Center",
    urgency: 'HIGH EMERGENCY',
    urgencyClass: 'bg-error-container text-on-error-container',
    blood: 'O-',
    distance: '1.8 km away • Level 1 Trauma Care',
    demand: '3 Units Needed',
    requiredBy: 'Next 2 Hours',
    reason: 'Immediate blood inventory shortage following an emergency trauma case. Emergency surgical transfusion required.',
    doctor: 'Dr. Harish Vance, MD (Chief Trauma Surgeon)',
    reqId: 'REQ-MANIPAL-8921',
    location: "Emergency Resuscitation Bay 04, HAL Airport Road, Bengaluru",
    cardId: 'card-request-1'
  };

  const modal = document.getElementById('modal-donor-request-details');
  if (!modal) return;

  const setElText = (id, text) => {
    const el = document.getElementById(id);
    if (el && text !== undefined) el.textContent = text;
  };

  setElText('donor-modal-hospital-name', activeDonorRequest.hospital);
  setElText('donor-modal-demand', activeDonorRequest.demand);
  setElText('donor-modal-timeframe', activeDonorRequest.requiredBy);
  setElText('donor-modal-reason', activeDonorRequest.reason);
  setElText('donor-modal-doctor', activeDonorRequest.doctor);
  setElText('donor-modal-req-id', activeDonorRequest.reqId);
  setElText('donor-modal-location', activeDonorRequest.location);
  setElText('donor-modal-blood-badge', `${activeDonorRequest.blood} Needed`);

  const subEl = document.getElementById('donor-modal-hospital-sub');
  if (subEl && activeDonorRequest.distance) {
    subEl.innerHTML = `<span class="material-symbols-outlined text-[16px] text-primary">pin_drop</span><span>${escapeHtml(activeDonorRequest.distance)}</span>`;
  }

  const badgeEl = document.getElementById('donor-modal-urgency-badge');
  if (badgeEl) {
    badgeEl.textContent = activeDonorRequest.urgency || 'HIGH EMERGENCY';
    badgeEl.className = `px-2.5 py-0.5 rounded-full font-label-badge text-label-badge uppercase font-bold tracking-wider ${activeDonorRequest.urgencyClass || 'bg-error-container text-on-error-container'}`;
  }

  // Populate dynamic donor availability counts and live tracking pool
  renderDonorModalTracking();

  modal.classList.remove('hidden');
};

function renderDonorModalTracking() {
  const container = document.getElementById('donor-modal-tracking-pool');
  if (!container) return;

  const reqId = activeDonorRequest ? activeDonorRequest.reqId : 'REQ-STMARYS-8921';
  const blood = activeDonorRequest ? activeDonorRequest.blood : 'O-';

  const trackingPool = (window.PulseStore && typeof window.PulseStore.getRequestDonorTracking === 'function')
    ? window.PulseStore.getRequestDonorTracking(reqId, blood)
    : [];

  // Update counters
  const totalCount = trackingPool.length;
  const enRouteCount = trackingPool.filter(d => d.transitStatus === 'En Route' || d.transitStatus === 'In Transit').length;
  const acceptedCount = trackingPool.filter(d => d.transitStatus.includes('Accepted')).length;
  const standbyCount = Math.max(0, totalCount - enRouteCount - acceptedCount);

  const availBadgeText = document.getElementById('donor-modal-avail-count-text');
  if (availBadgeText) availBadgeText.textContent = `${totalCount} Available Donors`;

  const statEnRoute = document.getElementById('donor-modal-stat-enroute');
  if (statEnRoute) statEnRoute.textContent = enRouteCount;

  const statAccepted = document.getElementById('donor-modal-stat-accepted');
  if (statAccepted) statAccepted.textContent = acceptedCount;

  const statStandby = document.getElementById('donor-modal-stat-standby');
  if (statStandby) statStandby.textContent = standbyCount;

  if (trackingPool.length === 0) {
    container.innerHTML = `
      <div class="p-4 rounded-xl bg-surface-container-low border border-surface-container text-center text-xs text-on-surface-variant">
        No registered donors currently active in the immediate travel perimeter.
      </div>
    `;
    return;
  }

  container.innerHTML = trackingPool.map((donor, idx) => {
    const isEnRoute = donor.transitStatus === 'En Route';
    const isInTransit = donor.transitStatus === 'In Transit';
    const isMoving = isEnRoute || isInTransit;
    const progressColor = isEnRoute ? 'bg-primary' : (isInTransit ? 'bg-tertiary' : 'bg-secondary');

    return `
      <div class="p-3.5 rounded-xl bg-surface-container-low border border-surface-container hover:border-primary/40 transition-all flex flex-col gap-2.5">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full ${isEnRoute ? 'bg-error-container text-primary' : (isInTransit ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-surface-container-high text-on-surface')} font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
              ${escapeHtml(donor.initials || 'DN')}
            </div>
            <div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <h5 class="font-title-md font-bold text-on-surface text-sm">${escapeHtml(donor.name)}</h5>
                <span class="px-1.5 py-0.5 rounded text-[11px] font-bold bg-surface-container text-primary">${escapeHtml(donor.bloodGroup)}</span>
                <span class="inline-flex items-center text-[11px] text-tertiary font-semibold gap-0.5">
                  <span class="material-symbols-outlined text-[13px]">verified</span> ${escapeHtml(String(donor.matchScore || 95))}% match
                </span>
              </div>
              <p class="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1 flex-wrap">
                <span class="material-symbols-outlined text-[14px] text-secondary">near_me</span>
                <span>${donor.distance} mi away</span>
                <span class="text-outline/40">•</span>
                <span class="text-secondary font-medium">${escapeHtml(donor.transitMode)}</span>
              </p>
              <!-- Donor Phone Number (Indian Format) with Click-to-Copy -->
              <div class="mt-1.5 flex items-center gap-2">
                <button type="button" onclick="window.copyDonorPhone(this, '${escapeHtml(donor.phone || '+91 98452 33109')}'); event.stopPropagation();" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-mono text-xs font-semibold border border-surface-container-high hover:border-primary/40 transition-all cursor-pointer shadow-2xs active:scale-95 group/copy" title="Click to copy Indian phone number">
                  <span class="material-symbols-outlined text-[15px] text-primary transition-transform group-hover/copy:scale-110">call</span>
                  <span class="phone-text tracking-wide">${escapeHtml(donor.phone || '+91 98452 33109')}</span>
                  <span class="material-symbols-outlined text-[14px] text-on-surface-variant group-hover/copy:text-primary transition-colors">content_copy</span>
                </button>
                <span class="text-[11px] text-on-surface-variant hidden sm:inline">(Click to copy)</span>
              </div>
            </div>
          </div>
          <div class="flex flex-col items-end gap-1 shrink-0">
            <span class="px-2.5 py-1 rounded-full text-[11px] font-bold ${donor.statusClass} flex items-center gap-1">
              ${isMoving ? '<span class="w-1.5 h-1.5 rounded-full bg-current animate-ping"></span>' : ''}
              ${escapeHtml(donor.transitStatus)}
            </span>
            <span class="text-[11px] font-mono font-bold text-on-surface">
              ETA: <span class="${isEnRoute ? 'text-error font-extrabold' : 'text-primary'}">${escapeHtml(donor.liveEta)}</span>
            </span>
          </div>
        </div>

        <!-- Live Route Progress Bar & Landmark -->
        <div class="flex flex-col gap-1 pt-1 border-t border-surface-container/60">
          <div class="flex items-center justify-between text-[11px] text-on-surface-variant">
            <span class="flex items-center gap-1">
              <span class="material-symbols-outlined text-[13px] text-tertiary">my_location</span>
              <span class="truncate max-w-[260px] sm:max-w-none">${escapeHtml(donor.landmark)}</span>
            </span>
            <span class="font-mono font-bold text-on-surface shrink-0">${donor.progressPct}% route</span>
          </div>
          <div class="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
            <div class="h-full rounded-full ${progressColor} transition-all duration-500" style="width: ${donor.progressPct}%"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.closeDonorRequestModal = function() {
  const modal = document.getElementById('modal-donor-request-details');
  if (modal) modal.classList.add('hidden');
};

window.approveDonorRequest = function() {
  const req = activeDonorRequest || { hospital: "Manipal Hospital Comprehensive Trauma Center" };
  window.closeDonorRequestModal();

  if (window.showToast) {
    window.showToast(
      'Request Approved',
      `Donation slot confirmed at ${req.hospital}! Emergency transit pass generated.`,
      'success'
    );
  }

  const cardBtn = req.cardId ? document.getElementById(req.cardId + '-btn') : document.getElementById('card-request-1-btn');
  if (cardBtn) {
    cardBtn.className = 'w-full py-2.5 px-space-md rounded-xl bg-tertiary text-on-tertiary font-label-lg text-label-lg font-semibold shadow-sm flex items-center justify-center gap-2 cursor-default';
    cardBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">check_circle</span><span>Approved &amp; Confirmed</span>';
    cardBtn.onclick = () => window.showToast('Slot Confirmed', `You are already registered for this slot at ${req.hospital}.`, 'info');
  }
};

window.declineDonorRequest = function() {
  const req = activeDonorRequest || { hospital: "Manipal Hospital Comprehensive Trauma Center" };
  window.closeDonorRequestModal();

  if (window.showToast) {
    window.showToast(
      'Request Declined',
      `You have declined the requisition from ${req.hospital}. Other alerts remain active on your dashboard.`,
      'info'
    );
  }
};

document.addEventListener('click', (e) => {
  const modal = document.getElementById('modal-donor-request-details');
  if (modal && !modal.classList.contains('hidden') && e.target === modal) {
    window.closeDonorRequestModal();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.closeDonorRequestModal();
    window.closeHospitalRequestModal();
  }
});

// ============================================================================
// HOSPITAL ACTIVE REQUISITION DETAILS, MATCHED DONORS & LIVE TRACKING MODAL
// ============================================================================
let activeHospitalReq = null;

window.openHospitalRequestModal = function(requestId) {
  const requests = (window.PulseStore && typeof window.PulseStore.getRequests === 'function')
    ? window.PulseStore.getRequests()
    : [];

  const targetReq = requests.find(r => r.id === requestId)
    || (window.PulseStore && typeof window.PulseStore.getSelectedRequest === 'function' ? window.PulseStore.getSelectedRequest() : null)
    || {
      id: 'REQ-9042',
      bloodGroup: 'B+',
      component: 'Platelets (Apheresis)',
      units: 3,
      urgency: 'Stat Emergency (< 45 Mins)',
      hospitalName: 'Apollo Hospitals & Apex Trauma Centre',
      ward: 'Trauma OR - Suite 3',
      location: 'Ward 4B, Emergency Wing, Bannerghatta Main Road, Bengaluru',
      notes: 'Acute arterial hemorrhage from emergency trauma, cross-match in progress.',
      createdAt: 'Today, 14:10 IST',
      status: 'Donors Accepted',
      trackingStage: 4,
      matchedCount: 16,
      acceptedCount: 3,
      enRouteCount: 2
    };

  activeHospitalReq = targetReq;

  if (window.PulseStore && typeof window.PulseStore.setSelectedRequestId === 'function') {
    window.PulseStore.setSelectedRequestId(targetReq.id);
  }

  const modal = document.getElementById('modal-hospital-request-details');
  if (!modal) return;

  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) el.textContent = val;
  };

  // Header & identity
  setEl('modal-hosp-req-blood', targetReq.bloodGroup);
  setEl('modal-hosp-req-blood-title', targetReq.bloodGroup);
  setEl('modal-hosp-req-id', `#${targetReq.id}`);
  setEl('modal-hosp-req-urgency', targetReq.urgency);
  setEl('modal-hosp-req-component', targetReq.component);
  setEl('modal-hosp-req-location', `${targetReq.ward} • ${targetReq.location || 'Emergency Wing'}`);
  setEl('modal-hosp-req-stage-text', `Stage ${targetReq.trackingStage || 1}: ${targetReq.status}`);

  // Metrics
  setEl('modal-hosp-req-units', `${targetReq.units} Units`);
  setEl('modal-hosp-req-sla', targetReq.urgency.includes('45') ? '< 45 Mins' : '< 2 Hours');
  setEl('modal-hosp-req-accepted-count', `${targetReq.acceptedCount || 2} Donors`);
  setEl('modal-hosp-req-created', targetReq.createdAt || '14:10 EST');
  setEl('modal-hosp-req-notes', targetReq.notes || 'Acute arterial hemorrhage clinical support protocol.');

  // Stepper, Donors, and Live Tracking
  renderModalHospitalStepper(targetReq);
  renderModalHospitalDonors(targetReq);
  renderModalHospitalTracking(targetReq);

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
};

window.closeHospitalRequestModal = function() {
  const modal = document.getElementById('modal-hospital-request-details');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
};

window.advanceModalHospitalRequestStage = function() {
  if (!activeHospitalReq) return;
  const current = activeHospitalReq.trackingStage || 1;
  const nextStage = current >= 6 ? 1 : current + 1;

  if (window.PulseStore && typeof window.PulseStore.setTrackingStage === 'function') {
    window.PulseStore.setTrackingStage(activeHospitalReq.id, nextStage);
  }

  // Refresh active req reference
  const requests = window.PulseStore.getRequests();
  activeHospitalReq = requests.find(r => r.id === activeHospitalReq.id) || activeHospitalReq;
  activeHospitalReq.trackingStage = nextStage;

  const stageText = document.getElementById('modal-hosp-req-stage-text');
  if (stageText) stageText.textContent = `Stage ${nextStage}: ${activeHospitalReq.status}`;

  renderModalHospitalStepper(activeHospitalReq);

  if (window.renderHospitalDashboard) window.renderHospitalDashboard();

  if (window.showToast) {
    window.showToast(
      'Requisition Stage Advanced',
      `Pipeline for #${activeHospitalReq.id} advanced to Stage ${nextStage}: ${activeHospitalReq.status}`,
      'success'
    );
  }
};

function renderModalHospitalStepper(req) {
  const container = document.getElementById('modal-hosp-stepper');
  if (!container) return;

  const currentStage = req ? (req.trackingStage || 1) : 1;

  const stages = [
    { num: 1, name: 'Raised', time: req.createdAt || '14:10 EST' },
    { num: 2, name: 'Matching', time: `${req.matchedCount || 16} Found` },
    { num: 3, name: 'Notified', time: 'Alert Ping' },
    { num: 4, name: 'Accepted', time: `${req.acceptedCount || 3} Acc` },
    { num: 5, name: 'Connected', time: 'Direct Comms' },
    { num: 6, name: 'Delivered', time: 'Cold Chain' }
  ];

  container.innerHTML = stages.map(s => {
    let circleClass = '';
    let textClass = '';
    let icon = '';

    if (s.num < currentStage) {
      circleClass = 'bg-tertiary text-on-tertiary shadow-xs';
      textClass = 'text-on-surface font-bold';
      icon = '<span class="material-symbols-outlined text-[18px]">check</span>';
    } else if (s.num === currentStage) {
      circleClass = 'bg-primary text-on-primary ring-3 ring-primary-fixed shadow-md';
      textClass = 'text-primary font-extrabold';
      icon = '<span class="material-symbols-outlined text-[18px] animate-pulse">sync</span>';
    } else {
      circleClass = 'bg-surface-container-high text-on-surface-variant opacity-60';
      textClass = 'text-on-surface-variant opacity-60';
      icon = `<span class="text-xs font-bold font-mono">${s.num}</span>`;
    }

    return `
      <div onclick="window.PulseStore.setTrackingStage('${req.id}', ${s.num}); window.openHospitalRequestModal('${req.id}'); if(window.renderHospitalDashboard) window.renderHospitalDashboard();" class="flex flex-col items-center text-center cursor-pointer group p-1.5 rounded-lg hover:bg-surface-container transition-colors" title="Jump to Stage ${s.num}: ${s.name}">
        <div class="w-8 h-8 rounded-full ${circleClass} flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105">
          ${icon}
        </div>
        <span class="text-xs font-semibold ${textClass} leading-tight">${s.num}. ${s.name}</span>
        <span class="text-[10px] text-on-surface-variant mt-0.5">${s.time}</span>
      </div>
    `;
  }).join('');
}

function renderModalHospitalDonors(req) {
  const container = document.getElementById('modal-hosp-matched-donors-container');
  if (!container) return;

  const bloodGroup = req ? req.bloodGroup : 'B+';
  const donors = (window.PulseStore && typeof window.PulseStore.getMatchedDonors === 'function')
    ? window.PulseStore.getMatchedDonors(bloodGroup)
    : [];

  const countBadgeText = document.getElementById('modal-hosp-matched-count-text');
  if (countBadgeText) {
    countBadgeText.textContent = `${donors.length} Matched Donors`;
  }

  if (donors.length === 0) {
    container.innerHTML = `
      <div class="p-4 rounded-xl bg-surface-container-low border border-surface-container text-center text-xs text-on-surface-variant">
        No compatible verified donors found in immediate 25-mile radius.
      </div>
    `;
    return;
  }

  container.innerHTML = donors.map(donor => `
    <div class="p-3 rounded-xl bg-surface-container-low border border-surface-container hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
          ${escapeHtml(donor.initials || 'DN')}
        </div>
        <div>
          <div class="flex items-center gap-1.5 flex-wrap">
            <h5 class="font-title-md font-bold text-on-surface text-sm">${escapeHtml(donor.name)}</h5>
            <span class="px-1.5 py-0.5 rounded text-[11px] font-bold bg-surface-container text-primary">${escapeHtml(donor.bloodGroup)}</span>
            <span class="inline-flex items-center text-[11px] text-tertiary font-semibold gap-0.5">
              <span class="material-symbols-outlined text-[13px]">verified</span> ${escapeHtml(String(donor.matchScore || 95))}% match
            </span>
          </div>
          <p class="text-xs text-on-surface-variant mt-0.5 flex items-center gap-2 flex-wrap">
            <span class="flex items-center gap-0.5">
              <span class="material-symbols-outlined text-[14px] text-secondary">near_me</span>
              <span>${donor.distance} mi away</span>
            </span>
            <span class="text-outline/40">•</span>
            <span class="text-tertiary font-medium">Last donation: ${escapeHtml(donor.lastDonation || 'Recent')}</span>
          </p>
          <!-- Donor Phone Number (Indian Format) with Click-to-Copy -->
          <div class="mt-1.5 flex items-center gap-2">
            <button type="button" onclick="window.copyDonorPhone(this, '${escapeHtml(donor.phone || '+91 98452 33109')}'); event.stopPropagation();" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-mono text-xs font-semibold border border-surface-container-high hover:border-primary/40 transition-all cursor-pointer shadow-2xs active:scale-95 group/copy" title="Click to copy Indian phone number">
              <span class="material-symbols-outlined text-[15px] text-primary transition-transform group-hover/copy:scale-110">call</span>
              <span class="phone-text tracking-wide">${escapeHtml(donor.phone || '+91 98452 33109')}</span>
              <span class="material-symbols-outlined text-[14px] text-on-surface-variant group-hover/copy:text-primary transition-colors">content_copy</span>
            </button>
            <span class="text-[11px] text-on-surface-variant hidden sm:inline">(Click to copy)</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <span class="px-2.5 py-1 rounded-full text-[11px] font-bold ${donor.accepted ? 'bg-tertiary-fixed text-on-tertiary-fixed' : (donor.notified ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface')} flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full ${donor.accepted ? 'bg-tertiary' : 'bg-primary'} animate-pulse"></span>
          ${donor.accepted ? 'Accepted / On Call' : (donor.notified ? 'Notified / Standby' : 'Ready on Call')}
        </span>
        <button type="button" onclick="window.copyDonorPhone(null, '${escapeHtml(donor.phone || '+91 98452 33109')}'); window.showToast('Direct Intercom Connected', 'Dialing / copying ${escapeHtml(donor.name)} (${escapeHtml(donor.phone || '+91 98452 33109')})', 'info')" class="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer" title="Direct Audio / Push Ping">
          <span class="material-symbols-outlined text-[18px]">contact_phone</span>
        </button>
      </div>
    </div>
  `).join('');
}

function renderModalHospitalTracking(req) {
  const container = document.getElementById('modal-hosp-tracking-container');
  if (!container) return;

  const trackingPool = (window.PulseStore && typeof window.PulseStore.getRequestDonorTracking === 'function')
    ? window.PulseStore.getRequestDonorTracking(req.id, req.bloodGroup)
    : [];

  if (trackingPool.length === 0) {
    container.innerHTML = `
      <div class="p-4 rounded-xl bg-surface-container-low border border-surface-container text-center text-xs text-on-surface-variant">
        No live transit telemetry currently streaming for this requisition.
      </div>
    `;
    return;
  }

  container.innerHTML = trackingPool.map(donor => {
    const isEnRoute = donor.transitStatus === 'En Route';
    const isInTransit = donor.transitStatus === 'In Transit';
    const isMoving = isEnRoute || isInTransit;
    const progressColor = isEnRoute ? 'bg-primary' : (isInTransit ? 'bg-tertiary' : 'bg-secondary');

    return `
      <div class="p-3.5 rounded-xl bg-surface-container-low border border-surface-container hover:border-primary/40 transition-all flex flex-col gap-2.5">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full ${isEnRoute ? 'bg-error-container text-primary' : (isInTransit ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-surface-container-high text-on-surface')} font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
              ${escapeHtml(donor.initials || 'DN')}
            </div>
            <div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <h5 class="font-title-md font-bold text-on-surface text-sm">${escapeHtml(donor.name)}</h5>
                <span class="px-1.5 py-0.5 rounded text-[11px] font-bold bg-surface-container text-primary">${escapeHtml(donor.bloodGroup)}</span>
                <span class="text-xs text-on-surface-variant font-medium">• ${escapeHtml(donor.transitMode)}</span>
              </div>
              <p class="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1 flex-wrap">
                <span class="material-symbols-outlined text-[13px] text-tertiary">near_me</span>
                <span>${donor.distance} mi away</span>
                <span class="text-outline/40">•</span>
                <span class="text-secondary font-medium">Corridor Transit</span>
              </p>
              <!-- Donor Phone Number (Indian Format) with Click-to-Copy -->
              <div class="mt-1.5 flex items-center gap-2">
                <button type="button" onclick="window.copyDonorPhone(this, '${escapeHtml(donor.phone || '+91 98452 33109')}'); event.stopPropagation();" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-mono text-xs font-semibold border border-surface-container-high hover:border-primary/40 transition-all cursor-pointer shadow-2xs active:scale-95 group/copy" title="Click to copy Indian phone number">
                  <span class="material-symbols-outlined text-[15px] text-primary transition-transform group-hover/copy:scale-110">call</span>
                  <span class="phone-text tracking-wide">${escapeHtml(donor.phone || '+91 98452 33109')}</span>
                  <span class="material-symbols-outlined text-[14px] text-on-surface-variant group-hover/copy:text-primary transition-colors">content_copy</span>
                </button>
                <span class="text-[11px] text-on-surface-variant hidden sm:inline">(Click to copy)</span>
              </div>
            </div>
          </div>
          <div class="flex flex-col items-end gap-1 shrink-0">
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${donor.statusClass} flex items-center gap-1">
              ${isMoving ? '<span class="w-1.5 h-1.5 rounded-full bg-current animate-ping"></span>' : ''}
              ${escapeHtml(donor.transitStatus)}
            </span>
            <span class="text-[11px] font-mono font-bold text-on-surface">
              ETA: <span class="${isEnRoute ? 'text-error font-extrabold' : 'text-primary'}">${escapeHtml(donor.liveEta)}</span>
            </span>
          </div>
        </div>

        <!-- Progress Bar & Landmark -->
        <div class="flex flex-col gap-1 pt-1 border-t border-surface-container/60">
          <div class="flex items-center justify-between text-[11px] text-on-surface-variant">
            <span class="flex items-center gap-1">
              <span class="material-symbols-outlined text-[13px] text-tertiary">my_location</span>
              <span class="truncate max-w-[280px] sm:max-w-none">${escapeHtml(donor.landmark)}</span>
            </span>
            <span class="font-mono font-bold text-on-surface shrink-0">${donor.progressPct}% route</span>
          </div>
          <div class="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
            <div class="h-full rounded-full ${progressColor} transition-all duration-500" style="width: ${donor.progressPct}%"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================================
// 12. LIVE TELEMETRY TRIGGER HELPER
// ============================================================================
window.openHospitalTelemetry = function() {
  if (window.openHospitalRequestModal) {
    window.openHospitalRequestModal('REQ-9042');
    setTimeout(() => {
      const stepper = document.getElementById('modal-hosp-stepper') || document.getElementById('modal-hosp-tracking-container');
      if (stepper) {
        stepper.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  } else if (window.PulseRouter) {
    window.PulseRouter.navigate('request-tracking', { id: 'REQ-9042' });
  }
};

// ============================================================================
// 13. FLOATING 'BACK TO OVERVIEW' BOTTOM-RIGHT POP-UP
// ============================================================================
window.scrollToPageOverview = function(e) {
  if (e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
  }

  const donorSec = document.getElementById('view-donor-dashboard');
  const hospSec = document.getElementById('view-hospital-dashboard');
  const currentRoute = (window.PulseRouter && window.PulseRouter.currentRoute) ? window.PulseRouter.currentRoute.toLowerCase() : '';
  const currentHash = (window.location.hash || '').toLowerCase();
  const currentPath = (window.location.pathname || '').toLowerCase();

  const isHospitalActive = (hospSec && hospSec.classList.contains('active')) ||
                           currentRoute.includes('hospital') ||
                           currentHash.includes('hospital') ||
                           currentPath.includes('hospital') ||
                           (!hospSec && !donorSec && !!document.querySelector('.hospital-name-display'));

  const isDonorActive = (donorSec && donorSec.classList.contains('active')) ||
                        currentRoute.includes('donor') ||
                        currentHash.includes('donor') ||
                        currentPath.includes('donor') ||
                        (!donorSec && !hospSec && !!document.getElementById('donor-overview'));

  if (isHospitalActive) {
    if (typeof window.scrollToHospitalSection === 'function') {
      window.scrollToHospitalSection('hospital-overview');
    } else {
      const ov = document.getElementById('hospital-overview');
      if (ov) ov.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } else if (isDonorActive) {
    if (typeof window.scrollToDonorSection === 'function') {
      window.scrollToDonorSection('donor-overview');
    } else {
      const ov = document.getElementById('donor-overview');
      if (ov) ov.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Smoothly scroll window, html, and body to the top
  window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  if (document.documentElement) document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  if (document.body) document.body.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
};

function initFloatingBackToOverview() {
  const container = document.getElementById('floating-back-to-overview-container');
  const btn = document.getElementById('floating-back-to-overview-btn');
  if (!container || !btn) return;

  btn.onclick = function(e) {
    window.scrollToPageOverview(e);
  };

  const checkScroll = () => {
    const donorSec = document.getElementById('view-donor-dashboard');
    const hospSec = document.getElementById('view-hospital-dashboard');
    const currentRoute = (window.PulseRouter && window.PulseRouter.currentRoute) ? window.PulseRouter.currentRoute.toLowerCase() : '';
    const isDonorActive = (donorSec && donorSec.classList.contains('active')) ||
                          (currentRoute.includes('donor')) ||
                          (!donorSec && !hospSec && !!document.getElementById('donor-overview'));
    const isHospActive = (hospSec && hospSec.classList.contains('active')) ||
                         (currentRoute.includes('hospital')) ||
                         (!hospSec && !donorSec && !!document.querySelector('.hospital-name-display'));

    let shouldShow = false;

    if (isDonorActive) {
      const donorOverview = document.getElementById('donor-overview');
      if (donorOverview) {
        const rect = donorOverview.getBoundingClientRect();
        // scrolled below personal details section
        if (rect.bottom < 80) {
          shouldShow = true;
        }
      } else if (window.scrollY > 320) {
        shouldShow = true;
      }
    } else if (isHospActive) {
      const hospHeader = document.querySelector('.hospital-name-display') ? document.querySelector('.hospital-name-display').closest('.bg-surface-container-lowest') : null;
      if (hospHeader) {
        const rect = hospHeader.getBoundingClientRect();
        // scrolled below hospital details section
        if (rect.bottom < 80) {
          shouldShow = true;
        }
      } else if (window.scrollY > 250) {
        shouldShow = true;
      }
    }

    if (shouldShow) {
      container.classList.remove('translate-y-12', 'opacity-0', 'pointer-events-none');
      container.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
    } else {
      container.classList.add('translate-y-12', 'opacity-0', 'pointer-events-none');
      container.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
    }
  };

  window.addEventListener('scroll', checkScroll, { passive: true });
  if (window.PulseRouter) {
    window.PulseRouter.onRouteChange(() => {
      setTimeout(checkScroll, 120);
    });
  }
}

// ============================================================================
// 14. AUTHENTICATION & SEPARATED LOGIN INTERFACE CONTROLLERS
// ============================================================================

// --- DONOR LOGIN MODAL CONTROLLERS ---
window.openDonorLoginModal = function() {
  const modal = document.getElementById('modal-donor-login');
  if (!modal) return;

  const errorBox = document.getElementById('donor-login-error');
  if (errorBox) errorBox.classList.add('hidden');

  const idInput = document.getElementById('donor-input-id');
  const pwdInput = document.getElementById('donor-input-pwd');
  if (idInput) idInput.value = '';
  if (pwdInput) {
    pwdInput.value = '';
    pwdInput.type = 'password';
  }
  const toggleIcon = document.getElementById('donor-pwd-toggle-icon');
  if (toggleIcon) toggleIcon.textContent = 'visibility';

  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');

  if (idInput) {
    setTimeout(() => idInput.focus(), 100);
  }
};

window.closeDonorLoginModal = function() {
  const modal = document.getElementById('modal-donor-login');
  if (modal) modal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
};

window.toggleDonorPasswordVisibility = function() {
  const pwdInput = document.getElementById('donor-input-pwd');
  const toggleIcon = document.getElementById('donor-pwd-toggle-icon');
  if (!pwdInput || !toggleIcon) return;
  if (pwdInput.type === 'password') {
    pwdInput.type = 'text';
    toggleIcon.textContent = 'visibility_off';
  } else {
    pwdInput.type = 'password';
    toggleIcon.textContent = 'visibility';
  }
};

window.fillDemoDonorCredentials = function() {
  const idInput = document.getElementById('donor-input-id');
  const pwdInput = document.getElementById('donor-input-pwd');
  if (!idInput || !pwdInput) return;
  idInput.value = 'DNR-4821';
  pwdInput.value = 'donor@2024';
  const errorBox = document.getElementById('donor-login-error');
  if (errorBox) errorBox.classList.add('hidden');
};

window.handleDonorLoginSubmit = function(e) {
  if (e) e.preventDefault();
  const idInput = document.getElementById('donor-input-id');
  const pwdInput = document.getElementById('donor-input-pwd');
  const errorBox = document.getElementById('donor-login-error');
  const errorText = document.getElementById('donor-login-error-text');
  const btnSubmit = document.getElementById('btn-donor-login-submit');
  const btnText = document.getElementById('donor-login-btn-text');
  const btnIcon = document.getElementById('donor-login-btn-icon');

  const idVal = idInput ? idInput.value.trim() : '';
  const pwdVal = pwdInput ? pwdInput.value.trim() : '';

  if (!idVal || !pwdVal) {
    if (errorBox && errorText) {
      errorText.textContent = 'Please enter both your allotted Donor ID and authorization password.';
      errorBox.classList.remove('hidden');
    }
    return false;
  }

  // Show authenticating state
  if (btnSubmit) btnSubmit.disabled = true;
  if (btnText) btnText.textContent = 'Verifying CDSCO Credentials...';
  if (btnIcon) {
    btnIcon.textContent = 'sync';
    btnIcon.classList.add('animate-spin');
  }

  setTimeout(() => {
    // Reset button
    if (btnSubmit) btnSubmit.disabled = false;
    if (btnIcon) {
      btnIcon.textContent = 'verified_user';
      btnIcon.classList.remove('animate-spin');
    }
    if (btnText) btnText.textContent = 'Authenticate & Enter Donor Dashboard';

    window.closeDonorLoginModal();

    window.showToast('Authentication Successful', `Welcome back, verified donor (${idVal}). Access granted.`, 'success');
    if (window.PulseRouter) {
      window.PulseRouter.navigate('donor-dashboard');
    } else {
      window.location.href = 'index.html#/donor-dashboard';
    }
  }, 600);

  return false;
};

// --- HOSPITAL LOGIN MODAL CONTROLLERS ---
window.openHospitalLoginModal = function() {
  const modal = document.getElementById('modal-hospital-login');
  if (!modal) return;

  const errorBox = document.getElementById('hospital-login-error');
  if (errorBox) errorBox.classList.add('hidden');

  const idInput = document.getElementById('hospital-input-id');
  const pwdInput = document.getElementById('hospital-input-pwd');
  if (idInput) idInput.value = '';
  if (pwdInput) {
    pwdInput.value = '';
    pwdInput.type = 'password';
  }
  const toggleIcon = document.getElementById('hospital-pwd-toggle-icon');
  if (toggleIcon) toggleIcon.textContent = 'visibility';

  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');

  if (idInput) {
    setTimeout(() => idInput.focus(), 100);
  }
};

window.closeHospitalLoginModal = function() {
  const modal = document.getElementById('modal-hospital-login');
  if (modal) modal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
};

window.toggleHospitalPasswordVisibility = function() {
  const pwdInput = document.getElementById('hospital-input-pwd');
  const toggleIcon = document.getElementById('hospital-pwd-toggle-icon');
  if (!pwdInput || !toggleIcon) return;
  if (pwdInput.type === 'password') {
    pwdInput.type = 'text';
    toggleIcon.textContent = 'visibility_off';
  } else {
    pwdInput.type = 'password';
    toggleIcon.textContent = 'visibility';
  }
};

window.fillDemoRecipientCredentials = function() {
  const idInput = document.getElementById('hospital-input-id');
  const pwdInput = document.getElementById('hospital-input-pwd');
  if (!idInput || !pwdInput) return;
  idInput.value = 'CASE-9042';
  pwdInput.value = '+91 95280 33454';
  const errorBox = document.getElementById('hospital-login-error');
  if (errorBox) errorBox.classList.add('hidden');
};
window.fillDemoHospitalCredentials = window.fillDemoRecipientCredentials;

window.handleHospitalLoginSubmit = function(e) {
  if (e) e.preventDefault();
  const idInput = document.getElementById('hospital-input-id');
  const pwdInput = document.getElementById('hospital-input-pwd');
  const errorBox = document.getElementById('hospital-login-error');
  const errorText = document.getElementById('hospital-login-error-text');
  const btnSubmit = document.getElementById('btn-hospital-login-submit');
  const btnText = document.getElementById('hospital-login-btn-text');
  const btnIcon = document.getElementById('hospital-login-btn-icon');

  const idVal = idInput ? idInput.value.trim() : '';
  const pwdVal = pwdInput ? pwdInput.value.trim() : '';

  if (!idVal || !pwdVal) {
    if (errorBox && errorText) {
      errorText.textContent = 'Please enter both your Patient Case ID / Requisition ID and attendant mobile number.';
      errorBox.classList.remove('hidden');
    }
    return false;
  }

  // Show authenticating state
  if (btnSubmit) btnSubmit.disabled = true;
  if (btnText) btnText.textContent = 'Authenticating Patient Case...';
  if (btnIcon) {
    btnIcon.textContent = 'sync';
    btnIcon.classList.add('animate-spin');
  }

  setTimeout(() => {
    // Reset button
    if (btnSubmit) btnSubmit.disabled = false;
    if (btnIcon) {
      btnIcon.textContent = 'volunteer_activism';
      btnIcon.classList.remove('animate-spin');
    }
    if (btnText) btnText.textContent = 'Access Recipient Portal';

    window.closeHospitalLoginModal();

    window.showToast('Patient Case Authenticated', `Welcome back. Access granted for Case ${idVal}.`, 'success');
    if (window.PulseRouter) {
      window.PulseRouter.navigate('recipient-dashboard');
    } else {
      window.location.href = 'index.html#/recipient-dashboard';
    }
  }, 500);

  return false;
};

// Aliases for Recipient Login
window.openRecipientLoginModal = window.openHospitalLoginModal;
window.closeRecipientLoginModal = window.closeHospitalLoginModal;
window.handleRecipientLoginSubmit = window.handleHospitalLoginSubmit;

// --- BACKWARDS COMPATIBILITY ALIASES ---
window.openLoginModal = function(role = 'donor') {
  if (role === 'hospital') {
    window.openHospitalLoginModal();
  } else {
    window.openDonorLoginModal();
  }
};

window.closeLoginModal = function() {
  window.closeDonorLoginModal();
  window.closeHospitalLoginModal();
};

window.switchLoginTab = function(role) {
  if (role === 'hospital') {
    window.closeDonorLoginModal();
    window.openHospitalLoginModal();
  } else {
    window.closeHospitalLoginModal();
    window.openDonorLoginModal();
  }
};

window.toggleLoginPasswordVisibility = function() {
  const donorModal = document.getElementById('modal-donor-login');
  if (donorModal && !donorModal.classList.contains('hidden')) {
    window.toggleDonorPasswordVisibility();
  } else {
    window.toggleHospitalPasswordVisibility();
  }
};

window.fillDemoCredentials = function() {
  const donorModal = document.getElementById('modal-donor-login');
  if (donorModal && !donorModal.classList.contains('hidden')) {
    window.fillDemoDonorCredentials();
  } else {
    window.fillDemoHospitalCredentials();
  }
};

window.handleLoginSubmit = function(e) {
  const donorModal = document.getElementById('modal-donor-login');
  if (donorModal && !donorModal.classList.contains('hidden')) {
    return window.handleDonorLoginSubmit(e);
  } else {
    return window.handleHospitalLoginSubmit(e);
  }
};

function initLoginInterface() {
  const donorModal = document.getElementById('modal-donor-login');
  if (donorModal) {
    donorModal.addEventListener('click', (e) => {
      if (e.target === donorModal) {
        window.closeDonorLoginModal();
      }
    });
  }

  const hospitalModal = document.getElementById('modal-hospital-login');
  if (hospitalModal) {
    hospitalModal.addEventListener('click', (e) => {
      if (e.target === hospitalModal) {
        window.closeHospitalLoginModal();
      }
    });
  }

  // Also support legacy modal id if present
  const legacyModal = document.getElementById('modal-login-interface');
  if (legacyModal) {
    legacyModal.addEventListener('click', (e) => {
      if (e.target === legacyModal) {
        window.closeLoginModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (donorModal && !donorModal.classList.contains('hidden')) {
        window.closeDonorLoginModal();
      }
      if (hospitalModal && !hospitalModal.classList.contains('hidden')) {
        window.closeHospitalLoginModal();
      }
      if (legacyModal && !legacyModal.classList.contains('hidden')) {
        window.closeLoginModal();
      }
      const immModal = document.getElementById('modal-immediate-response');
      if (immModal && !immModal.classList.contains('hidden')) {
        window.closeImmediateResponseModal();
      }
    }
  });
}

window.goToRoleSelection = function(e) {
  if (e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
  }
  if (window.PulseRouter) {
    window.PulseRouter.navigate('role-selection');
  } else {
    window.location.hash = '#/role-selection';
  }

  window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  const roleSec = document.getElementById('view-role-selection');
  if (roleSec) {
    roleSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  setTimeout(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (roleSec) {
      roleSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 60);
};

// ============================================================================
// 15. CODE RED IMMEDIATE RESPONSE MODAL CONTROLLERS
// ============================================================================
window.openImmediateResponseModal = function() {
  const modal = document.getElementById('modal-immediate-response');
  if (!modal) return;

  const errorBox = document.getElementById('immediate-response-error');
  if (errorBox) errorBox.classList.add('hidden');

  const declineSection = document.getElementById('imm-decline-section');
  if (declineSection) declineSection.classList.add('hidden');

  const actionButtons = document.getElementById('imm-action-buttons');
  if (actionButtons) actionButtons.classList.remove('hidden');

  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
};

window.closeImmediateResponseModal = function() {
  const modal = document.getElementById('modal-immediate-response');
  if (modal) modal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
};

window.startImmediateDeclination = function() {
  const declineSection = document.getElementById('imm-decline-section');
  if (declineSection) {
    declineSection.classList.remove('hidden');
    declineSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
};

window.cancelImmediateDeclination = function() {
  const declineSection = document.getElementById('imm-decline-section');
  if (declineSection) declineSection.classList.add('hidden');
};

window.confirmImmediateDeclination = function() {
  const reasonSelect = document.getElementById('imm-decline-reason');
  const reasonText = reasonSelect ? reasonSelect.options[reasonSelect.selectedIndex].text : 'Unavailable';
  
  window.closeImmediateResponseModal();

  const btn = document.getElementById('btn-code-red-respond');
  if (btn) {
    btn.className = 'w-full sm:w-auto px-4 py-2 rounded-xl bg-surface-container/60 text-on-surface-variant font-label-md text-xs font-semibold cursor-default';
    btn.innerHTML = '<span class="material-symbols-outlined text-[16px]">close</span><span>Declined • Transferred to Next Standby</span>';
    btn.disabled = true;
  }

  if (typeof window.showToast === 'function') {
    window.showToast('Response Logged', `Requisition declined (${reasonText.slice(0, 32)}...). System alerted next reserve donor.`, 'info');
  } else {
    alert('Requisition declined. System alerted next available standby donor.');
  }
};

window.approveImmediateResponse = function() {
  const checkHealth = document.getElementById('imm-check-health');
  const checkWindow = document.getElementById('imm-check-window');
  const checkHydrated = document.getElementById('imm-check-hydrated');
  const contactPhone = document.getElementById('imm-contact-phone');
  const errorBox = document.getElementById('immediate-response-error');
  const errorText = document.getElementById('immediate-response-error-text');
  const btnApprove = document.getElementById('btn-approve-immediate-response');

  if ((checkHealth && !checkHealth.checked) || (checkWindow && !checkWindow.checked) || (checkHydrated && !checkHydrated.checked)) {
    if (errorBox && errorText) {
      errorText.textContent = 'Please confirm all 3 health and donation eligibility criteria before approving.';
      errorBox.classList.remove('hidden');
    }
    return;
  }

  if (!contactPhone || !contactPhone.value.trim()) {
    if (errorBox && errorText) {
      errorText.textContent = 'Please provide a valid callback phone number for the trauma coordinator.';
      errorBox.classList.remove('hidden');
    }
    return;
  }

  const selectedEtaRadio = document.querySelector('input[name="imm-eta"]:checked');
  const etaVal = selectedEtaRadio ? selectedEtaRadio.value : '15-20m';
  const etaDisplay = etaVal === '15-20m' ? '15–20 Mins' : (etaVal === '25-35m' ? '25–35 Mins' : '45–60 Mins');

  if (btnApprove) {
    btnApprove.disabled = true;
    btnApprove.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">sync</span><span>Transmitting Dispatch...</span>';
  }

  setTimeout(() => {
    if (btnApprove) {
      btnApprove.disabled = false;
      btnApprove.innerHTML = '<span class="material-symbols-outlined text-[18px]">verified_user</span><span>Approve &amp; Confirm Dispatch</span>';
    }

    window.closeImmediateResponseModal();

    const btn = document.getElementById('btn-code-red-respond');
    if (btn) {
      btn.className = 'w-full sm:w-auto px-4 py-2.5 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed font-label-md text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 cursor-default';
      btn.innerHTML = `<span class="material-symbols-outlined text-[16px] text-tertiary">check_circle</span><span>Dispatched • ETA ${etaDisplay}</span>`;
      btn.disabled = true;
    }

    if (typeof window.showToast === 'function') {
      window.showToast('Immediate Response Confirmed', `Manipal Hospital Trauma Bay paged. Estimated arrival logged as ${etaDisplay}. Emergency transit pass active.`, 'success');
    } else {
      alert(`Donation response confirmed! Estimated arrival logged as ${etaDisplay}. Priority transit pass active.`);
    }
  }, 600);
};






