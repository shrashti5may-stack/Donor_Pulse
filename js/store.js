/**
 * DonorPulse Central State Store
 * Manages persistent local mock data for Donors, Hospitals, Verification, Requests, and Tracking.
 */

const STORAGE_KEY = 'donorpulse_state_in_v3';

const DEFAULT_STATE = {
  // Active incoming emergency donor call
  activeIncomingCall: null,

  // Active role session: 'guest' | 'donor' | 'hospital'
  currentRole: 'donor',

  // Current Donor Profile (Adapted for India - Bengaluru, Karnataka)
  donor: {
    id: 'DP-8924-O',
    fullName: 'Ananya Sharma',
    age: 28,
    bloodGroup: 'O-',
    phone: '+91 98452 33109',
    email: 'ananya.sharma@donor-pulse.in',
    address: '#482, 12th Main Road, HAL 2nd Stage, Indiranagar',
    city: 'Bengaluru, Karnataka',
    medicalHistory: 'Hemoglobin 14.8 g/dL (Normal). Regular whole blood & apheresis donor. Pre-screened verified volunteer. Blood pressure optimal at 118/76 mmHg. No high-altitude or malaria endemic travel in past 3 months.',
    lastDonationDate: '2026-09-18',
    nextEligibleDate: 'Eligible Now',
    availability: true, // true = Active / On Call, false = Temporarily Unavailable
    radiusMiles: 10, // 10 km radius active
    totalDonations: 8,
    livesSaved: 24,
    rewardPoints: 2450,
    rewardTier: 'Gold Tier Donor Milestone',
    nextTierPointsLeft: 50,
    vitals: {
      hemoglobin: '14.8 g/dL',
      bp: '118/76 mmHg',
      pulse: '72 bpm',
      weight: '64 kg'
    }
  },

  // Current Hospital Profile (Apollo Hospitals & Apex Trauma Centre, Bengaluru)
  hospital: {
    id: 'HSP-88219-BLR',
    name: 'Apollo Hospitals & Apex Trauma Centre',
    category: 'Apex Multi-Specialty & Trauma Care (NABH Accredited)',
    location: 'ICU Ward 4B, Emergency Wing',
    address: '154/11 Bannerghatta Main Road, Opposite IIMB',
    city: 'Bengaluru',
    state: 'Karnataka',
    zip: '560076',
    phone: '+91 (80) 2630-4050',
    email: 'triage@apollohospitals-bengaluru.org',
    licenseNumber: 'NABH-BB-KA-88219',
    authorizedPerson: 'Dr. Aravind Sharma, MD',
    roleTitle: 'Chief Medical Superintendent',
    bedCapacity: 650,
    traumaLevel: 'Trauma Level 1 Apex Centre',
    verificationProof: {
      documentType: 'NABH Blood Bank Operating License & CDSCO Clearance Form 28-C',
      documentNumber: 'NABH-BB-KA-90428-2026',
      fileName: 'apollo_bengaluru_nabh_accreditation.pdf',
      fileSize: '2.4 MB',
      uploadedAt: 'Sep 12, 2026'
    },
    // Verification state: 'verified' | 'pending' | 'rejected'
    verificationStatus: 'verified',
    rejectionReason: 'State blood transfusion council documentation mismatch on primary accreditation license certificate.'
  },

  // Current Recipient & Patient Profile (Dedicated to Recipient / Family & Friends)
  recipient: {
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
    hospitalAddress: '154/11 Bannerghatta Main Road, Opposite IIMB, Bengaluru, Karnataka 560076',
    attendantName: 'Rajesh Sharma',
    attendantRelation: 'Brother / Primary Attendant',
    attendantPhone: '+91 95280 33454',
    attendantEmail: 'rajesh.sharma@familycare.org.in',
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
      documentType: 'Hospital Blood Requisition Slip (Form 27-C Stamped / e-RaktKosh)',
      doctorRegId: 'Dr. Aravind Sharma (NMC/KMC-48921)',
      ipdCaseNo: 'IPD-9042-ICU',
      fileName: 'apollo_blood_requisition_form27c_signed.pdf',
      fileSize: '1.4 MB',
      status: 'VERIFIED_GENUINE',
      verificationScore: '100% Genuine Requisition',
      doctorVerified: true,
      hospitalSealDetected: true,
      fraudRiskScore: '0.0%',
      verifiedAt: 'Today, 14:05 IST',
      issuer: 'Apollo Hospitals & Apex Trauma Centre'
    }
  },

  // Multiple Recipient / Patient Cases available for management
  recipientCases: [
    {
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
      hospitalAddress: '154/11 Bannerghatta Main Road, Opposite IIMB, Bengaluru, Karnataka 560076',
      attendantName: 'Rajesh Sharma',
      attendantRelation: 'Brother / Primary Attendant',
      attendantPhone: '+91 95280 33454',
      attendantEmail: 'rajesh.sharma@familycare.org.in',
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
        documentType: 'Hospital Blood Requisition Slip (Form 27-C Stamped / e-RaktKosh)',
        doctorRegId: 'Dr. Aravind Sharma (NMC/KMC-48921)',
        ipdCaseNo: 'IPD-9042-ICU',
        fileName: 'apollo_blood_requisition_form27c_signed.pdf',
        fileSize: '1.4 MB',
        status: 'VERIFIED_GENUINE',
        verificationScore: '100% Genuine Requisition',
        doctorVerified: true,
        hospitalSealDetected: true,
        fraudRiskScore: '0.0%',
        verifiedAt: 'Today, 14:05 IST',
        issuer: 'Apollo Hospitals & Apex Trauma Centre'
      }
    },
    {
      id: 'CASE-8991',
      requestId: 'REQ-8991',
      patientName: 'Rohan Verma',
      patientAge: 46,
      patientGender: 'Male',
      bloodGroup: 'O-',
      component: 'Whole Blood',
      unitsRequired: 2,
      unitsArranged: 1,
      unitsFulfilled: 0,
      urgency: 'Urgent (< 2 Hours)',
      hospitalName: 'Manipal Hospital Comprehensive Trauma Center',
      hospitalWard: 'ICU Triage Bay 2',
      hospitalAddress: '98 HAL Old Airport Road, Kodihalli, Bengaluru, Karnataka 560017',
      attendantName: 'Pooja Verma',
      attendantRelation: 'Spouse / Family Attendant',
      attendantPhone: '+91 98110 52391',
      attendantEmail: 'pooja.verma@netcare.org.in',
      doctorName: 'Dr. Harish Vance, MS (MCh Trauma)',
      doctorDepartment: 'General Surgery & Trauma',
      doctorPhone: '+91 (80) 2502-4444 Ext 104',
      hospitalBloodDesk: '+91 (80) 2502-4444',
      clinicalReason: 'Post-operative severe anemia stabilization following trauma resuscitation.',
      handshakeOTP: '4190',
      trackingStage: 2,
      broadcastDate: 'Today, 12:45 IST',
      appealActive: true
    }
  ],

  // Registered Hospital Registry
  registeredHospitals: [
    {
      id: 'HSP-88219-BLR',
      name: 'Apollo Hospitals & Apex Trauma Centre',
      category: 'Apex Multi-Specialty & Trauma Care (NABH Accredited)',
      location: 'ICU Ward 4B, Emergency Wing',
      address: '154/11 Bannerghatta Main Road, Opposite IIMB',
      city: 'Bengaluru',
      state: 'Karnataka',
      zip: '560076',
      phone: '+91 (80) 2630-4050',
      email: 'triage@apollohospitals-bengaluru.org',
      licenseNumber: 'NABH-BB-KA-88219',
      authorizedPerson: 'Dr. Aravind Sharma, MD',
      roleTitle: 'Chief Medical Superintendent',
      bedCapacity: 650,
      traumaLevel: 'Trauma Level 1 Apex Centre',
      verificationProof: {
        documentType: 'NABH Blood Bank Operating License & CDSCO Clearance Form 28-C',
        documentNumber: 'NABH-BB-KA-90428-2026',
        fileName: 'apollo_bengaluru_nabh_accreditation.pdf',
        fileSize: '2.4 MB',
        uploadedAt: 'Sep 12, 2026'
      },
      verificationStatus: 'verified',
      rejectionReason: ''
    }
  ],

  // Active Requests
  requests: [
    {
      id: 'REQ-9042',
      bloodGroup: 'B+',
      component: 'Platelets (Apheresis)',
      units: 3,
      urgency: 'Stat Emergency (< 45 Mins)',
      hospitalName: 'Apollo Hospitals & Apex Trauma Centre',
      ward: 'Trauma OR - Suite 3',
      location: '154/11 Bannerghatta Main Road, Bengaluru',
      notes: 'Acute arterial hemorrhage from multi-vehicle accident, cross-match in progress.',
      createdAt: 'Today, 14:10 IST',
      status: 'Donors Accepted',
      trackingStage: 4, // 1 to 6
      matchedCount: 16,
      acceptedCount: 3,
      enRouteCount: 2
    },
    {
      id: 'REQ-8991',
      bloodGroup: 'O-',
      component: 'Whole Blood',
      units: 2,
      urgency: 'Urgent (< 2 Hours)',
      hospitalName: 'Manipal Hospital Comprehensive Trauma Center',
      ward: 'ICU Triage Bay 2',
      location: '98 HAL Old Airport Road, Kodihalli, Bengaluru',
      notes: 'Post-operative severe anemia stabilization.',
      createdAt: 'Today, 12:45 IST',
      status: 'Finding Donors',
      trackingStage: 2,
      matchedCount: 8,
      acceptedCount: 1,
      enRouteCount: 0
    }
  ],

  // Currently active request selected for confirmation & tracking
  selectedRequestId: 'REQ-9042',

  // Registered Donors Pool (Strict Registered User Model)
  matchedDonorsPool: [
    {
      id: 'user_donor_001',
      _id: 'user_donor_001',
      name: 'Ananya Sharma',
      initials: 'AS',
      phone: '+91 98452 33109',
      isPhoneVerified: true,
      bloodGroup: 'O-',
      role: 'DONOR',
      coordinates: { type: 'Point', coordinates: [77.6412, 12.9716] },
      isAvailable: true,
      lastDonationDate: '2026-06-18',
      distance: 1.8,
      matchScore: 98,
      availability: 'Active / On Call',
      eligibility: 'Eligible Now',
      verified: true,
      notified: true,
      accepted: false,
      eta: '18 mins'
    },
    {
      id: 'user_donor_002',
      _id: 'user_donor_002',
      name: 'Deepak Kumar',
      initials: 'DK',
      phone: '+91 98201 44521',
      isPhoneVerified: true,
      bloodGroup: 'B+',
      role: 'DONOR',
      coordinates: { type: 'Point', coordinates: [77.6010, 12.9050] },
      isAvailable: true,
      lastDonationDate: null,
      distance: 2.5,
      matchScore: 100,
      availability: 'Active / On Call',
      eligibility: 'Eligible Now',
      verified: true,
      notified: true,
      accepted: true,
      eta: '25 mins'
    },
    {
      id: 'user_donor_003',
      _id: 'user_donor_003',
      name: 'Kavita Rao',
      initials: 'KR',
      phone: '+91 97112 88764',
      isPhoneVerified: true,
      bloodGroup: 'O+',
      role: 'DONOR',
      coordinates: { type: 'Point', coordinates: [77.5900, 12.9100] },
      isAvailable: true,
      lastDonationDate: '2026-05-10',
      distance: 4.1,
      matchScore: 95,
      availability: 'Active / On Call',
      eligibility: 'Eligible Now',
      verified: true,
      notified: false,
      accepted: false,
      eta: '32 mins'
    }
  ],

  // Donation history logs for donor spanning 2024 to 2026 across Indian healthcare institutions
  donationHistory: [
    {
      date: 'Sep 18, 2026',
      center: 'AIIMS Transfusion Medicine Centre, New Delhi',
      subtext: 'Apheresis Bay #02 • Dr. Rajesh Sharma, MD',
      type: 'Platelets (Single Donor Platelet)',
      units: '2 Units (Apheresis)',
      status: 'Completed (Verified)',
      badgeClass: 'bg-tertiary-fixed text-on-tertiary-fixed'
    },
    {
      date: 'Feb 12, 2026',
      center: 'Manipal Hospital Comprehensive Blood Centre, Bengaluru',
      subtext: 'Blood Bank Resuscitation Wing • Dr. Ananya Sen, MD',
      type: 'Whole Blood',
      units: '1 Unit (450 mL)',
      status: 'Completed (Verified)',
      badgeClass: 'bg-tertiary-fixed text-on-tertiary-fixed'
    },
    {
      date: 'Aug 24, 2025',
      center: 'Tata Memorial Centre Transfusion Unit, Mumbai',
      subtext: 'Onco-Haematology Bay #05 • Dr. V. K. Murthy',
      type: 'Packed Red Blood Cells (PRBC)',
      units: '1 Unit (350 mL)',
      status: 'Completed (Verified)',
      badgeClass: 'bg-tertiary-fixed text-on-tertiary-fixed'
    },
    {
      date: 'Jan 15, 2025',
      center: 'Apollo Hospitals Blood Bank, Chennai',
      subtext: 'Transfusion Bay #01 • Dr. Sunita Rao',
      type: 'Whole Blood',
      units: '1 Unit (450 mL)',
      status: 'Completed (Verified)',
      badgeClass: 'bg-tertiary-fixed text-on-tertiary-fixed'
    },
    {
      date: 'May 10, 2024',
      center: 'Fortis Memorial Research Institute Blood Bank, Gurugram',
      subtext: 'Mobile Transfusion Unit 02 • Dr. Priya Nair',
      type: 'Whole Blood',
      units: '1 Unit (450 mL)',
      status: 'Completed (Verified)',
      badgeClass: 'bg-tertiary-fixed text-on-tertiary-fixed'
    }
  ]
};

class Store {
  constructor() {
    this.state = this.loadState();
    this.listeners = [];
    this.initSyncListeners();
  }

  initSyncListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY || e.key === 'donorpulse_sync_event') {
          this.state = this.loadState();
          this.notify();
        }
      });
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          this.syncChannel = new BroadcastChannel('donorpulse_cross_tab_sync');
          this.syncChannel.onmessage = (msg) => {
            this.state = this.loadState();
            this.notify();
          };
        } catch(e) {}
      }
    }
  }

  broadcastSync(payload) {
    try {
      if (this.syncChannel) {
        this.syncChannel.postMessage(payload);
      }
      localStorage.setItem('donorpulse_sync_event', JSON.stringify({ ...payload, _t: Date.now() }));
    } catch(e) {}
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = { ...DEFAULT_STATE, ...parsed };
        if (!Array.isArray(merged.registeredHospitals) || merged.registeredHospitals.length === 0) {
          merged.registeredHospitals = [merged.hospital || DEFAULT_STATE.hospital];
        }
        // Upgrade matchedDonorsPool if missing phones or outdated
        if (!Array.isArray(merged.matchedDonorsPool) || merged.matchedDonorsPool.length < DEFAULT_STATE.matchedDonorsPool.length || !merged.matchedDonorsPool[0]?.phone) {
          merged.matchedDonorsPool = JSON.parse(JSON.stringify(DEFAULT_STATE.matchedDonorsPool));
        }
        return merged;
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      this.notify();
    } catch (e) {
      console.warn('Failed to save state to localStorage:', e);
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.listeners.forEach(cb => {
      try { cb(this.state); } catch (err) { console.error('Listener error:', err); }
    });
  }

  // --- Donor methods ---
  getDonor() {
    return this.state.donor;
  }

  setDonor(donorData) {
    this.state.donor = { ...this.state.donor, ...donorData };
    this.saveState();
  }

  registerNewDonor(donorData) {
    const rawBlood = (donorData.bloodGroup || 'O-').trim();
    const cleanBloodCode = rawBlood.replace(/[^a-zA-Z0-9]/g, '');
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const newId = `DP-${randomId}-${cleanBloodCode}`;

    this.state.donor = {
      id: newId,
      fullName: donorData.fullName || 'Registered Volunteer Donor',
      age: parseInt(donorData.age || 25, 10),
      bloodGroup: rawBlood,
      phone: donorData.phone || '+91 98000 00000',
      email: donorData.email || 'donor@donor-pulse.in',
      address: donorData.address || 'HAL 2nd Stage, Indiranagar',
      city: donorData.city || 'Bengaluru, Karnataka',
      medicalHistory: donorData.medicalHistory || 'Pre-screened verified donor. Clinical vitals within healthy standard range.',
      lastDonationDate: donorData.lastDonationDate || 'First-time Donor',
      nextEligibleDate: 'Eligible Now',
      availability: donorData.availability !== undefined ? donorData.availability : true,
      radiusMiles: parseInt(donorData.radiusMiles || 10, 10),
      totalDonations: 0,
      livesSaved: 0,
      rewardPoints: 100,
      rewardTier: 'Active Registered Donor',
      nextTierPointsLeft: 400,
      vitals: {
        hemoglobin: '14.2 g/dL',
        bp: '120/80 mmHg',
        pulse: '72 bpm',
        weight: '68 kg'
      }
    };
    this.saveState();
    return this.state.donor;
  }

  toggleDonorAvailability() {
    this.state.donor.availability = !this.state.donor.availability;
    this.saveState();
    return this.state.donor.availability;
  }

  switchActiveDonor(donorId) {
    const pool = this.state.matchedDonorsPool || [];
    const target = pool.find(d => d.id === donorId);
    if (target) {
      this.state.donor = {
        ...this.state.donor,
        id: target.id,
        fullName: target.name,
        bloodGroup: target.bloodGroup,
        phone: target.phone,
        availability: true,
        age: target.age || 28,
        radiusMiles: 10,
        address: `${target.distance} km away, Bengaluru`,
        city: 'Bengaluru, Karnataka'
      };
      this.saveState();
      this.notify();
      this.broadcastSync({
        type: 'ACTIVE_DONOR_SWITCHED',
        donorId: target.id
      });
      return this.state.donor;
    }
    return this.state.donor;
  }

  getAllDonorsPool() {
    return this.state.matchedDonorsPool || [];
  }

  isBloodCompatible(donorBlood, targetBloodGroup) {
    if (!donorBlood || !targetBloodGroup) return false;
    const cleanDonor = donorBlood.trim();
    const cleanTarget = targetBloodGroup.trim();
    const compatMap = {
      'O-': ['O-'],
      'O+': ['O-', 'O+'],
      'A-': ['O-', 'A-'],
      'A+': ['O-', 'O+', 'A-', 'A+'],
      'B-': ['O-', 'B-'],
      'B+': ['O-', 'O+', 'B-', 'B+'],
      'AB-': ['O-', 'A-', 'B-', 'AB-'],
      'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
    };
    const validDonors = compatMap[cleanTarget] || [cleanTarget];
    return validDonors.includes(cleanDonor);
  }

  getDonorCallStatus(requestId, donorId) {
    const recipient = this.getRecipient();
    const effectiveReqId = requestId || (recipient && recipient.requestId) || this.state.selectedRequestId;
    const bloodGroup = recipient ? recipient.bloodGroup : 'B+';
    const donorList = this.getRequestDonorTracking(effectiveReqId, bloodGroup);
    const donor = donorList.find(d => d.id === donorId);
    return donor ? (donor.confirmed ? 'confirmed' : (donor.callStatus || 'ringing')) : null;
  }

  // --- Hospital methods ---
  getHospital() {
    return this.state.hospital;
  }

  getHospitalList() {
    if (!Array.isArray(this.state.registeredHospitals)) {
      this.state.registeredHospitals = [this.state.hospital];
    }
    return this.state.registeredHospitals;
  }

  setHospital(hospitalData) {
    this.state.hospital = { ...this.state.hospital, ...hospitalData };
    if (!Array.isArray(this.state.registeredHospitals)) {
      this.state.registeredHospitals = [this.state.hospital];
    } else {
      const idx = this.state.registeredHospitals.findIndex(h => h.id === this.state.hospital.id);
      if (idx >= 0) {
        this.state.registeredHospitals[idx] = { ...this.state.registeredHospitals[idx], ...hospitalData };
      }
    }
    this.saveState();
  }

  registerNewHospital(data) {
    const randomId = Math.floor(10000 + Math.random() * 90000);
    const stateRaw = data.state || data.city || 'KA';
    const stateCode = stateRaw.substring(0, 2).toUpperCase().replace(/[^A-Z]/g, 'KA');
    const newId = `HSP-${randomId}-${stateCode}`;

    const newHospital = {
      id: newId,
      name: (data.name || 'Apollo Hospitals & Apex Trauma Centre').trim(),
      category: data.category || 'Multi-Specialty & Apex Trauma Care (NABH)',
      location: data.location || 'Emergency Resuscitation Wing',
      address: data.address || 'Bannerghatta Main Road',
      city: data.city || 'Bengaluru, Karnataka',
      state: data.state || 'Karnataka',
      zip: data.zip || '560076',
      phone: data.phone || '+91 (80) 2630-4050',
      email: data.email || 'triage@apollohospitals-bengaluru.org',
      licenseNumber: data.licenseNumber || `NABH-BB-${randomId}`,
      authorizedPerson: data.authorizedPerson || 'Dr. Aravind Sharma, MD',
      roleTitle: data.roleTitle || 'Chief Medical Superintendent',
      bedCapacity: parseInt(data.bedCapacity || 650, 10),
      traumaLevel: data.traumaLevel || 'Trauma Level 1 Apex Centre',
      verificationProof: {
        documentType: data.documentType || 'NABH Blood Bank Operating License & CDSCO Clearance Form 28-C',
        documentNumber: data.documentNumber || `NABH-BB-KA-${randomId}-2026`,
        fileName: data.fileName || 'hospital_nabh_accreditation.pdf',
        fileSize: data.fileSize || '1.8 MB',
        uploadedAt: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
      },
      verificationStatus: data.verificationStatus || 'verified',
      rejectionReason: ''
    };

    if (!Array.isArray(this.state.registeredHospitals)) {
      this.state.registeredHospitals = [this.state.hospital];
    }

    // Add to registry (newest first)
    this.state.registeredHospitals.unshift(newHospital);
    // Switch active hospital to the newly registered one
    this.state.hospital = newHospital;
    this.saveState();
    return newHospital;
  }

  switchHospital(hospitalId) {
    if (!Array.isArray(this.state.registeredHospitals)) {
      this.state.registeredHospitals = [this.state.hospital];
    }
    const target = this.state.registeredHospitals.find(h => h.id === hospitalId);
    if (target) {
      this.state.hospital = target;
      this.saveState();
      return target;
    }
    return this.state.hospital;
  }

  setHospitalVerification(status, rejectionReason = '') {
    this.state.hospital.verificationStatus = status;
    if (rejectionReason) {
      this.state.hospital.rejectionReason = rejectionReason;
    }
    if (Array.isArray(this.state.registeredHospitals)) {
      const idx = this.state.registeredHospitals.findIndex(h => h.id === this.state.hospital.id);
      if (idx >= 0) {
        this.state.registeredHospitals[idx].verificationStatus = status;
        if (rejectionReason) this.state.registeredHospitals[idx].rejectionReason = rejectionReason;
      }
    }
    this.saveState();
  }

  isHospitalVerified() {
    return this.state.hospital.verificationStatus === 'verified';
  }

  // --- Recipient / Family & Friends methods ---
  getRecipient() {
    if (!this.state.recipient) {
      this.state.recipient = JSON.parse(JSON.stringify(DEFAULT_STATE.recipient));
    }
    return this.state.recipient;
  }

  getRecipientCases() {
    if (!Array.isArray(this.state.recipientCases) || this.state.recipientCases.length === 0) {
      this.state.recipientCases = JSON.parse(JSON.stringify(DEFAULT_STATE.recipientCases));
    }
    return this.state.recipientCases;
  }

  switchRecipientCase(caseId) {
    const cases = this.getRecipientCases();
    const found = cases.find(c => c.id === caseId || c.requestId === caseId);
    if (found) {
      this.state.recipient = found;
      this.saveState();
      return found;
    }
    return this.state.recipient;
  }

  updateRecipient(updates) {
    this.state.recipient = { ...this.getRecipient(), ...updates };
    const cases = this.getRecipientCases();
    const idx = cases.findIndex(c => c.id === this.state.recipient.id || c.requestId === this.state.recipient.requestId);
    if (idx >= 0) {
      cases[idx] = { ...cases[idx], ...updates };
    }
    // Synchronize matching requisition in requests pool
    if (Array.isArray(this.state.requests)) {
      const req = this.state.requests.find(r => r.id === this.state.recipient.requestId);
      if (req) {
        if (updates.unitsRequired !== undefined) req.units = updates.unitsRequired;
        if (updates.urgency !== undefined) req.urgency = updates.urgency;
        if (updates.clinicalReason !== undefined) req.notes = updates.clinicalReason;
      }
    }
    this.saveState();
    return this.state.recipient;
  }

  updateRecipientUnits(newUnits, extraData = {}) {
    const units = parseInt(newUnits, 10);
    if (isNaN(units) || units < 1) return this.getRecipient();
    return this.updateRecipient({ unitsRequired: units, ...extraData });
  }

  // 1. "Update Need": Update blood units required before donor arrives
  updateNeedBeforeDonorArrival(newUnits, note = '') {
    const recipient = this.getRecipient();
    const units = Math.max(1, parseInt(newUnits, 10) || recipient.unitsRequired);
    const updates = {
      unitsRequired: units,
      preArrivalNote: note || `Updated need to ${units} units before donor arrival.`,
      clinicalReason: note ? `${note} (Pre-arrival update)` : recipient.clinicalReason
    };
    return this.updateRecipient(updates);
  }

  // 2. "Request More Blood": Request extra units when blood was already received once
  requestExtraBloodAfterReceived(extraUnits, clinicalReason = '') {
    const recipient = this.getRecipient();
    const extra = Math.max(1, parseInt(extraUnits, 10) || 1);
    const fulfilled = Math.max(1, recipient.unitsFulfilled || 1); // Confirmed at least 1 unit already received once
    const totalRequired = fulfilled + extra;

    const updates = {
      unitsFulfilled: fulfilled,
      unitsRequired: totalRequired,
      unitsArranged: fulfilled, // extra units are not yet arranged
      trackingStage: 2, // Reset to "Donors Alerted for Supplementary Units"
      clinicalReason: clinicalReason || `Supplementary order: +${extra} extra units requested after ${fulfilled} unit received once.`,
      handshakeOTP: Math.floor(1000 + Math.random() * 9000).toString(),
      extraNeedRequested: true,
      lastExtraRequestAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST'
    };

    const updated = this.updateRecipient(updates);

    if (Array.isArray(this.state.requests)) {
      const req = this.state.requests.find(r => r.id === recipient.requestId);
      if (req) {
        req.units = totalRequired;
        req.status = `Alerting for +${extra} Extra Units`;
        req.trackingStage = 2;
        req.acceptedCount = 0;
        req.enRouteCount = 0;
      }
    }
    this.saveState();
    return updated;
  }

  setRecipientTrackingStage(stage) {
    if (this.state.recipient) {
      this.state.recipient.trackingStage = stage;
      this.saveState();
    }
  }

  verifyDonorHandshake(otp) {
    const recipient = this.getRecipient();
    if (String(otp).trim() === String(recipient.handshakeOTP).trim()) {
      return { success: true, message: 'Donor handshake verified! Unit tagged for patient.' };
    }
    return { success: false, message: 'Invalid donor verification OTP code.' };
  }

  // --- Recipient & Patient Case methods ---
  getRecipient() {
    return this.state.recipient || DEFAULT_STATE.recipient;
  }

  getRecipientCases() {
    return this.state.recipientCases || DEFAULT_STATE.recipientCases;
  }

  setRecipient(recipientData) {
    this.state.recipient = { ...this.state.recipient, ...recipientData };
    this.saveState();
    return this.state.recipient;
  }

  createNewPatientRequest(data) {
    const randomCaseNum = Math.floor(1000 + Math.random() * 9000);
    const caseId = 'CASE-' + randomCaseNum;
    const reqId = 'REQ-' + randomCaseNum;
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const patientName = (data.patientName && data.patientName.trim()) ? data.patientName.trim() : 'Emergency Patient';
    const patientAge = parseInt(data.patientAge || 30, 10);
    const patientGender = data.patientGender || 'Female';
    const bloodGroup = data.bloodGroup || 'O-';
    const component = data.component || 'Platelets (Apheresis)';
    const units = parseInt(data.unitsRequired || data.units || 2, 10);
    const urgency = data.urgency || 'Stat Emergency (< 45 Mins)';
    const hospitalName = (data.hospitalName && data.hospitalName.trim()) ? data.hospitalName.trim() : 'Apollo Hospitals & Apex Trauma Centre';
    const hospitalWard = (data.ward || data.hospitalWard || 'ICU Ward 4B, Bed 12').trim();
    const attendantName = (data.attendantName && data.attendantName.trim()) ? data.attendantName.trim() : 'Immediate Family';
    const attendantRelation = (data.attendantRelation && data.attendantRelation.trim()) ? data.attendantRelation.trim() : 'Family Attendant';
    const attendantPhone = (data.attendantPhone && data.attendantPhone.trim()) ? data.attendantPhone.trim() : '+91 95280 33454';
    const clinicalReason = (data.notes || data.clinicalReason || 'Acute clinical blood requirement, emergency broadcast.').trim();

    // MATCH COMPATIBLE DONORS AND INITIALIZE IN RINGING STATE (0 CONFIRMED YET)
    const compatDonors = this.getMatchedDonors(bloodGroup);
    const requestDonors = compatDonors.map((d, index) => ({
      ...d,
      confirmed: false,
      callStatus: 'ringing',
      transitStatus: '📞 Ringing / Awaiting Confirmation',
      statusClass: 'bg-amber-500/20 text-amber-800 font-semibold border border-amber-400/30',
      notified: true,
      liveEta: d.eta || `${Math.round(d.distance * 7 + 8)} mins`,
      transitMode: index === 0 ? '🚗 Emergency Vehicle Corridor' : (index === 1 ? '🚊 Metro Rapid Line' : '🚗 Personal Vehicle'),
      progressPct: 15,
      landmark: `${d.distance} km away • Within clinical radius`
    }));

    const primaryDonor = requestDonors[0] || this.state.matchedDonorsPool[0];

    const newPatient = {
      id: caseId,
      requestId: reqId,
      isNewRequest: true,
      patientName,
      patientAge,
      patientGender,
      bloodGroup,
      component,
      unitsRequired: units,
      unitsArranged: 0, // 0 Confirmed until donor answers and confirms availability!
      unitsFulfilled: 0,
      urgency,
      hospitalName,
      hospitalWard,
      hospitalAddress: `${hospitalName}, Bengaluru`,
      attendantName,
      attendantRelation,
      attendantPhone,
      attendantEmail: data.attendantEmail || 'attendant@donor-pulse.in',
      doctorName: data.doctorRegId || data.doctorName || 'Dr. Aravind Sharma, MD',
      doctorDepartment: 'Trauma & Critical Care',
      doctorPhone: '+91 (80) 2630-4050 Ext 4429',
      hospitalBloodDesk: '+91 (80) 2630-4050',
      clinicalReason,
      handshakeOTP: otp,
      trackingStage: 2, // Stage 2: Donors Alerted & Ringing
      broadcastDate: 'Just now',
      appealActive: true,
      donors: requestDonors,
      verificationProof: {
        documentType: data.proofDocType || data.documentType || 'Hospital Blood Requisition Slip (Form 27-C Stamped / e-RaktKosh)',
        doctorRegId: data.doctorRegId || data.doctorName || 'Dr. Aravind Sharma (NMC/KMC-48921)',
        ipdCaseNo: data.ipdCaseNo || 'IPD-9042-ICU',
        fileName: data.proofFileName || data.fileName || 'apollo_blood_requisition_form27c_signed.pdf',
        fileSize: data.proofFileSize || '1.4 MB',
        status: 'VERIFIED_GENUINE',
        verificationScore: '100% Genuine Requisition',
        doctorVerified: true,
        hospitalSealDetected: true,
        fraudRiskScore: '0.0%',
        verifiedAt: 'Just now',
        issuer: hospitalName
      }
    };

    this.state.recipient = newPatient;
    if (!this.state.recipientCases) this.state.recipientCases = [];
    this.state.recipientCases.unshift(newPatient);

    // Also push to active requisitions pool
    const newReq = {
      id: reqId,
      bloodGroup,
      component,
      units,
      urgency,
      hospitalName,
      ward: hospitalWard,
      location: newPatient.hospitalAddress,
      notes: clinicalReason,
      createdAt: 'Just now',
      status: 'Ringing Donors / Awaiting Confirmation',
      trackingStage: 2,
      matchedCount: requestDonors.length,
      acceptedCount: 0,
      enRouteCount: 0,
      donors: requestDonors
    };
    if (!this.state.requests) this.state.requests = [];
    this.state.requests.unshift(newReq);
    this.state.selectedRequestId = reqId;

    // Set active ringing call details
    this.state.activeIncomingCall = {
      requestId: reqId,
      caseId: caseId,
      patientName,
      patientAge,
      patientGender,
      bloodGroup,
      component,
      unitsRequired: units,
      urgency,
      hospitalName,
      hospitalWard,
      attendantName,
      attendantPhone,
      clinicalReason,
      donorId: primaryDonor ? primaryDonor.id : 'user_donor_001',
      donorName: primaryDonor ? primaryDonor.name : 'Ananya Sharma',
      donorPhone: primaryDonor ? primaryDonor.phone : '+91 98452 33109',
      donorBloodGroup: primaryDonor ? primaryDonor.bloodGroup : 'O-',
      donorDistance: primaryDonor ? primaryDonor.distance : 1.8,
      donorEta: primaryDonor ? (primaryDonor.liveEta || primaryDonor.eta || '18 mins') : '18 mins',
      status: 'ringing',
      timestamp: Date.now()
    };

    // Asynchronously sync with backend API pipeline (/api/requests)
    if (typeof fetch !== 'undefined') {
      fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: data.patientId || 'user_patient_001',
          bloodGroupNeeded: bloodGroup,
          unitsNeeded: units,
          hospitalName: hospitalName,
          hospitalAddress: newPatient.hospitalAddress,
          doctorRegNumber: data.doctorRegId || 'NMC/KMC-48921',
          prescriptionDocumentUrl: data.proofFileName || 'https://storage.donorpulse.in/prescriptions/req27c.pdf',
          coordinates: [77.5983, 12.8958]
        })
      }).then(r => r.json()).then(res => {
        if (res && res.success && res.matchedDonorsCount !== undefined) {
          newReq.matchedCount = res.matchedDonorsCount;
          this.saveState();
          this.notify();
        }
      }).catch(err => {
        console.warn('API pipeline sync notice:', err);
      });
    }

    this.saveState();

    // Broadcast sync event for cross-tab ringing
    this.broadcastSync({
      type: 'NEW_REQUEST_RINGING',
      requestId: reqId,
      activeIncomingCall: this.state.activeIncomingCall
    });

    return newPatient;
  }

  // --- Requests methods ---
  getRequests() {
    return this.state.requests;
  }

  getSelectedRequest() {
    const req = this.state.requests.find(r => r.id === this.state.selectedRequestId);
    return req || this.state.requests[0];
  }

  setSelectedRequestId(id) {
    this.state.selectedRequestId = id;
    this.saveState();
  }

  addRequest(newReq) {
    const id = 'REQ-' + Math.floor(1000 + Math.random() * 9000);
    const request = {
      id,
      bloodGroup: newReq.bloodGroup || 'O-',
      component: newReq.component || 'Whole Blood',
      units: parseInt(newReq.units || 1, 10),
      urgency: newReq.urgency || 'Urgent (< 2 Hours)',
      hospitalName: this.state.hospital.name,
      ward: newReq.ward || this.state.hospital.location,
      location: newReq.location || this.state.hospital.city,
      notes: newReq.notes || 'Emergency hospital requisition.',
      createdAt: new Date().toLocaleString(),
      status: 'Finding Donors',
      trackingStage: 1, // Start at 1 (Raised)
      matchedCount: Math.floor(6 + Math.random() * 10),
      acceptedCount: 0,
      enRouteCount: 0
    };

    this.state.requests.unshift(request);
    this.state.selectedRequestId = id;
    this.saveState();
    return request;
  }

  // --- Request Tracking methods ---
  advanceTrackingStage(requestId) {
    const req = this.state.requests.find(r => r.id === (requestId || this.state.selectedRequestId));
    if (req) {
      if (req.trackingStage < 6) {
        req.trackingStage += 1;
        
        // Update request status text
        const statusMap = {
          1: 'Request Raised',
          2: 'Finding Donors',
          3: 'Donors Notified',
          4: 'Donors Accepted',
          5: 'Hospital-Donor Connected',
          6: 'Donation Completed'
        };
        req.status = statusMap[req.trackingStage];

        if (req.trackingStage >= 4 && req.acceptedCount === 0) {
          req.acceptedCount = 2;
          req.enRouteCount = 1;
        }

        this.saveState();
      }
      return req.trackingStage;
    }
    return 1;
  }

  setTrackingStage(requestId, stage) {
    const req = this.state.requests.find(r => r.id === (requestId || this.state.selectedRequestId));
    if (req && stage >= 1 && stage <= 6) {
      req.trackingStage = stage;
      const statusMap = {
        1: 'Request Raised',
        2: 'Finding Donors',
        3: 'Donors Notified',
        4: 'Donors Accepted',
        5: 'Hospital-Donor Connected',
        6: 'Donation Completed'
      };
      req.status = statusMap[stage];
      this.saveState();
    }
  }

  // --- Donor Matching Pool ---
  getMatchedDonors(targetBloodGroup) {
    const compatMap = {
      'O-': ['O-'],
      'O+': ['O-', 'O+'],
      'A-': ['O-', 'A-'],
      'A+': ['O-', 'O+', 'A-', 'A+'],
      'B-': ['O-', 'B-'],
      'B+': ['O-', 'O+', 'B-', 'B+'],
      'AB-': ['O-', 'A-', 'B-', 'AB-'],
      'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
    };

    if (!targetBloodGroup) {
      return this.state.matchedDonorsPool;
    }

    const allowedDonors = compatMap[targetBloodGroup] || ['O-'];
    return this.state.matchedDonorsPool.filter(d => allowedDonors.includes(d.bloodGroup));
  }

  notifyDonor(donorId) {
    const donor = this.state.matchedDonorsPool.find(d => d.id === donorId);
    if (donor) {
      donor.notified = true;
      this.saveState();
      return true;
    }
    return false;
  }

  // --- Live Donor Tracking & Confirmation for Requisitions ---
  getRequestDonorTracking(reqId, bloodGroup) {
    const cleanBlood = (bloodGroup || 'O-').split('/')[0].trim();
    const recipient = this.getRecipient();
    const req = this.state.requests ? this.state.requests.find(r => r.id === reqId) : null;
    
    // Check if donors array already exists on the request or recipient
    let storedDonors = (req && req.donors) || (recipient && recipient.requestId === reqId && recipient.donors);

    if (!storedDonors || !storedDonors.length) {
      // STRICT MEDICAL ACCURACY: Only return compatible donors strictly mapped via getMatchedDonors.
      const compatible = this.getMatchedDonors(cleanBlood);
      // For default initial demo state CASE-9042, keep first 2 as confirmed for baseline display
      const isDefaultPrepopulated = (reqId === 'REQ-9042' && (!recipient || !recipient.isNewRequest));

      storedDonors = compatible.map((d, index) => {
        const isConfirmed = isDefaultPrepopulated ? (index < 2) : false;
        return {
          ...d,
          confirmed: isConfirmed,
          callStatus: isConfirmed ? 'confirmed' : 'ringing',
          transitStatus: isConfirmed 
            ? (index === 0 ? 'En Route' : 'In Transit')
            : '📞 Ringing / Awaiting Confirmation',
          statusClass: isConfirmed 
            ? (index === 0 ? 'bg-primary-fixed text-primary font-bold' : 'bg-tertiary-fixed text-on-tertiary-fixed font-bold')
            : 'bg-amber-500/20 text-amber-800 font-semibold border border-amber-400/30',
          transitMode: index === 0 ? '🚗 Emergency Vehicle Corridor' : (index === 1 ? '🚊 Metro Rapid Line' : '🚗 Personal Vehicle'),
          progressPct: isConfirmed ? (index === 0 ? 80 : 55) : 15,
          landmark: isConfirmed 
            ? (index === 0 ? 'Approaching hospital perimeter (0.5 km away)' : 'At Medical Plaza Station (2 stops away)')
            : `Standby radius • ${d.distance} km away`,
          liveEta: d.eta || `${Math.round(d.distance * 7 + 6)} mins`
        };
      });

      if (req) req.donors = storedDonors;
      if (recipient && recipient.requestId === reqId) recipient.donors = storedDonors;
    }

    return storedDonors;
  }

  // Get only donors who confirmed availability for this request
  getConfirmedDonors(reqId, bloodGroup) {
    const list = this.getRequestDonorTracking(reqId, bloodGroup);
    return list.filter(d => d.confirmed === true);
  }

  // Get all compatible donors available in network
  getAvailableDonors(reqId, bloodGroup) {
    return this.getRequestDonorTracking(reqId, bloodGroup);
  }

  getActiveIncomingCall() {
    return this.state.activeIncomingCall;
  }

  setActiveIncomingCall(callData) {
    this.state.activeIncomingCall = callData;
    this.saveState();
  }

  // Confirm donor availability when donor accepts the emergency call
  confirmDonorAvailability(requestId, donorId) {
    const recipient = this.getRecipient();
    const effectiveReqId = requestId || (recipient && recipient.requestId) || this.state.selectedRequestId;
    const req = this.state.requests ? this.state.requests.find(r => r.id === effectiveReqId) : null;
    const bloodGroup = recipient ? recipient.bloodGroup : (req ? req.bloodGroup : 'B+');

    const donorList = this.getRequestDonorTracking(effectiveReqId, bloodGroup);
    const donor = donorList.find(d => d.id === donorId);

    if (donor) {
      donor.confirmed = true;
      donor.callStatus = 'confirmed';
      donor.transitStatus = 'En Route (Confirmed)';
      donor.statusClass = 'bg-emerald-500/15 text-emerald-800 font-bold border border-emerald-400/40';
      donor.progressPct = Math.max(45, donor.progressPct || 45);
      donor.confirmedAt = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST';
      donor.landmark = 'Departed dispatch base • Fast-track transit corridor';

      // Update recipient units arranged and tracking stage
      if (recipient) {
        recipient.unitsArranged = Math.min(recipient.unitsRequired, (recipient.unitsArranged || 0) + 1);
        if (recipient.trackingStage < 4) {
          recipient.trackingStage = 4; // Stage 4: En Route to Hospital
        }
        recipient.donors = donorList;
      }

      // Update requests list
      if (req) {
        req.acceptedCount = (req.acceptedCount || 0) + 1;
        req.enRouteCount = (req.enRouteCount || 0) + 1;
        req.trackingStage = Math.max(req.trackingStage || 1, 4);
        req.status = 'Donors Confirmed & Responding';
        req.donors = donorList;
      }

      // If active call was for this donor, mark it accepted
      if (this.state.activeIncomingCall && this.state.activeIncomingCall.donorId === donorId) {
        this.state.activeIncomingCall.status = 'accepted';
      }

      this.saveState();

      // Broadcast sync event for cross-tab and cross-view synchronization
      this.broadcastSync({
        type: 'DONOR_CONFIRMED',
        requestId: effectiveReqId,
        donorId: donor.id,
        donorName: donor.name,
        donorBloodGroup: donor.bloodGroup,
        unitsArranged: recipient ? recipient.unitsArranged : 1
      });

      return { success: true, donor, recipient, req };
    }

    return { success: false, message: 'Donor not found' };
  }

  // Decline donor call (and optionally ring the next available donor)
  declineDonorCall(requestId, donorId) {
    const recipient = this.getRecipient();
    const effectiveReqId = requestId || (recipient && recipient.requestId) || this.state.selectedRequestId;
    const bloodGroup = recipient ? recipient.bloodGroup : 'B+';
    const donorList = this.getRequestDonorTracking(effectiveReqId, bloodGroup);

    const donor = donorList.find(d => d.id === donorId);
    if (donor) {
      donor.callStatus = 'declined';
      donor.transitStatus = 'Declined / Busy';
      donor.statusClass = 'bg-surface-container-high text-on-surface-variant line-through opacity-60';
    }

    // Look for next unconfirmed donor to ring
    const nextDonor = donorList.find(d => !d.confirmed && d.callStatus !== 'declined');
    if (nextDonor && recipient) {
      this.state.activeIncomingCall = {
        requestId: effectiveReqId,
        patientName: recipient.patientName,
        bloodGroup: recipient.bloodGroup,
        component: recipient.component,
        unitsRequired: recipient.unitsRequired,
        urgency: recipient.urgency,
        hospitalName: recipient.hospitalName,
        hospitalWard: recipient.hospitalWard,
        attendantName: recipient.attendantName,
        attendantPhone: recipient.attendantPhone,
        clinicalReason: recipient.clinicalReason,
        donorId: nextDonor.id,
        donorName: nextDonor.name,
        donorPhone: nextDonor.phone,
        donorBloodGroup: nextDonor.bloodGroup,
        donorDistance: nextDonor.distance,
        donorEta: nextDonor.liveEta || nextDonor.eta || '20 mins',
        status: 'ringing',
        timestamp: Date.now()
      };
    } else {
      this.state.activeIncomingCall = null;
    }

    this.saveState();

    this.broadcastSync({
      type: 'DONOR_DECLINED',
      requestId: effectiveReqId,
      donorId,
      nextDonorId: nextDonor ? nextDonor.id : null
    });

    return { success: true, nextDonor };
  }

  // Trigger or switch active ringing call to a specific donor
  ringDonor(requestId, donorId) {
    const recipient = this.getRecipient();
    const effectiveReqId = requestId || (recipient && recipient.requestId) || this.state.selectedRequestId;
    const bloodGroup = recipient ? recipient.bloodGroup : 'B+';
    const donorList = this.getRequestDonorTracking(effectiveReqId, bloodGroup);

    const donor = donorList.find(d => d.id === donorId);
    if (donor && recipient) {
      donor.callStatus = 'ringing';
      this.state.activeIncomingCall = {
        requestId: effectiveReqId,
        patientName: recipient.patientName,
        bloodGroup: recipient.bloodGroup,
        component: recipient.component,
        unitsRequired: recipient.unitsRequired,
        urgency: recipient.urgency,
        hospitalName: recipient.hospitalName,
        hospitalWard: recipient.hospitalWard,
        attendantName: recipient.attendantName,
        attendantPhone: recipient.attendantPhone,
        clinicalReason: recipient.clinicalReason,
        donorId: donor.id,
        donorName: donor.name,
        donorPhone: donor.phone,
        donorBloodGroup: donor.bloodGroup,
        donorDistance: donor.distance,
        donorEta: donor.liveEta || donor.eta || '18 mins',
        status: 'ringing',
        timestamp: Date.now()
      };
      this.saveState();

      this.broadcastSync({
        type: 'DONOR_RINGING',
        requestId: effectiveReqId,
        donorId: donor.id
      });

      return donor;
    }
    return null;
  }

  // Helper for quick testing/re-running the ringing simulation on the current active case
  triggerTestRingForCase(requestId) {
    const recipient = this.getRecipient();
    const effectiveReqId = requestId || (recipient && recipient.requestId) || this.state.selectedRequestId;
    const bloodGroup = recipient ? recipient.bloodGroup : 'B+';
    const donorList = this.getRequestDonorTracking(effectiveReqId, bloodGroup);

    // Reset donors to unconfirmed ringing state
    donorList.forEach(d => {
      d.confirmed = false;
      d.callStatus = 'ringing';
      d.transitStatus = '📞 Ringing / Awaiting Confirmation';
      d.statusClass = 'bg-amber-500/20 text-amber-800 font-semibold border border-amber-400/30';
    });

    if (recipient) {
      recipient.unitsArranged = 0;
      recipient.trackingStage = 2;
      recipient.donors = donorList;
    }

    const firstDonor = donorList[0] || this.state.matchedDonorsPool[0];
    this.ringDonor(effectiveReqId, firstDonor.id);
    return donorList;
  }

  resetToDefault() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.saveState();
  }
}

window.PulseStore = new Store();
