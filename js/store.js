/**
 * DonorPulse Central State Store
 * Manages persistent local mock data for Donors, Hospitals, Verification, Requests, and Tracking.
 */

const STORAGE_KEY = 'donorpulse_state_v5_live';

const DEFAULT_RECIPIENT_CASES = [
  {
    id: 'CASE-8686',
    requestId: 'REQ-8686',
    caseId: 'CASE-8686',
    patientName: 'Sanchit',
    patientAge: 30,
    patientGender: 'Male',
    bloodGroup: 'B+',
    component: 'Packed Red Blood Cells (PRBC)',
    unitsRequired: 2,
    unitsArranged: 1,
    unitsFulfilled: 0,
    urgency: 'Standard Schedule (Today)',
    hospitalName: 'Metro Trauma Blood Centre',
    hospitalWard: 'ICU Emergency Bed 4',
    hospitalAddress: 'Metro Trauma Blood Centre, ICU Emergency Bed 4',
    attendantName: 'Duty Attendant',
    attendantRelation: 'Immediate Family',
    attendantPhone: '+91 98000 12345',
    attendantEmail: 'attendant@donor-pulse.in',
    doctorName: 'Duty Medical Officer (NMC-REG-2026)',
    doctorDepartment: 'Trauma & Critical Care',
    doctorPhone: '+91 98000 12345',
    hospitalBloodDesk: '+91 98000 12345',
    clinicalReason: 'Acute hemorrhagic requirement. Immediate compatible donor transfusion needed.',
    handshakeOTP: '7120',
    trackingStage: 4,
    broadcastDate: 'Today',
    appealActive: true,
    donors: [
      {
        id: 'D-KM-01',
        name: 'Karan Mehta',
        initials: 'KM',
        bloodGroup: 'O-',
        phone: '+91 98452 33109',
        distance: 1.5,
        eta: '19 mins',
        liveEta: '19 mins',
        confirmed: true,
        callStatus: 'confirmed',
        transitStatus: '🚗 En Route to Hospital Blood Bank',
        statusClass: 'bg-emerald-500/20 text-emerald-800 font-semibold border border-emerald-400/30',
        notified: true,
        transitMode: '🚗 Emergency Vehicle Corridor',
        progressPct: 65,
        landmark: '1.5 km away • Crossing Metro Junction'
      }
    ],
    verificationProof: {
      documentType: 'Hospital Blood Requisition Slip (Form 27-C Stamped / e-RaktKosh)',
      doctorRegId: 'Duty Medical Officer (NMC-REG-2026)',
      ipdCaseNo: 'IPD-EMERGENCY-ICU',
      fileName: 'apollo_blood_requisition_form27c_signed.pdf',
      fileSize: '1.4 MB',
      status: 'VERIFIED_GENUINE',
      verificationScore: '100% Genuine Requisition',
      doctorVerified: true,
      hospitalSealDetected: true,
      fraudRiskScore: '0.0%',
      verifiedAt: 'Today',
      issuer: 'Metro Trauma Blood Centre'
    }
  },
  {
    id: 'CASE-9042',
    requestId: 'REQ-9042',
    caseId: 'CASE-9042',
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
    broadcastDate: 'Today',
    appealActive: true,
    donors: [
      {
        id: 'D-AS-01',
        name: 'Ananya Sharma',
        initials: 'AS',
        bloodGroup: 'O-',
        phone: '+91 98452 33109',
        distance: 1.8,
        eta: '18 mins',
        liveEta: '18 mins',
        confirmed: true,
        callStatus: 'confirmed',
        transitStatus: '🚗 En Route to Hospital Blood Bank',
        statusClass: 'bg-emerald-500/20 text-emerald-800 font-semibold border border-emerald-400/30',
        notified: true,
        transitMode: '🚗 Emergency Vehicle Corridor',
        progressPct: 60,
        landmark: '1.8 km away • Indiranagar Corridor'
      }
    ],
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
      verifiedAt: 'Today',
      issuer: 'Apollo Hospitals & Apex Trauma Centre'
    }
  }
];

const DEFAULT_STATE = {
  // Active incoming emergency donor call (null when no live call is ringing)
  activeIncomingCall: null,

  // Active role session: 'guest' | 'donor' | 'recipient' | 'hospital'
  currentRole: 'guest',

  // Current Donor Profile (null initially until donor creates account/registers)
  donor: null,

  // Current Hospital Profile
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
    authorizedPerson: 'Medical Superintendent',
    roleTitle: 'Chief Medical Superintendent',
    bedCapacity: 650,
    traumaLevel: 'Trauma Level 1 Apex Centre',
    verificationProof: {
      documentType: 'NABH Blood Bank Operating License & CDSCO Clearance Form 28-C',
      documentNumber: 'NABH-BB-KA-90428-2026',
      fileName: 'hospital_nabh_accreditation.pdf',
      fileSize: '2.4 MB',
      uploadedAt: 'Sep 12, 2026'
    },
    verificationStatus: 'verified',
    rejectionReason: ''
  },

  // Current Recipient & Patient Profile (defaults to active case Sanchit CASE-8686)
  recipient: DEFAULT_RECIPIENT_CASES[0],

  // Multiple Recipient / Patient Cases available for management across devices
  recipientCases: DEFAULT_RECIPIENT_CASES,

  // Registered Hospital Registry
  registeredHospitals: [],

  // Active Requests pool
  requests: [
    {
      id: DEFAULT_RECIPIENT_CASES[0].requestId,
      bloodGroup: DEFAULT_RECIPIENT_CASES[0].bloodGroup,
      component: DEFAULT_RECIPIENT_CASES[0].component,
      units: DEFAULT_RECIPIENT_CASES[0].unitsRequired,
      urgency: DEFAULT_RECIPIENT_CASES[0].urgency,
      hospitalName: DEFAULT_RECIPIENT_CASES[0].hospitalName,
      ward: DEFAULT_RECIPIENT_CASES[0].hospitalWard,
      location: DEFAULT_RECIPIENT_CASES[0].hospitalAddress,
      notes: DEFAULT_RECIPIENT_CASES[0].clinicalReason,
      createdAt: 'Today',
      status: 'En Route to Hospital Blood Bank',
      trackingStage: 4,
      matchedCount: 1,
      acceptedCount: 1,
      enRouteCount: 1,
      donors: DEFAULT_RECIPIENT_CASES[0].donors
    }
  ],

  // Currently active request selected for confirmation & tracking
  selectedRequestId: DEFAULT_RECIPIENT_CASES[0].requestId,

  // Registered Donors Pool (empty initially - saved dynamically as new donors register)
  matchedDonorsPool: [],

  // Donation history logs for donor (empty initially)
  donationHistory: []
};

class Store {
  constructor() {
    this.state = this.loadState();
    this.listeners = [];
    this.initSyncListeners();
    this.syncWithServer();
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

  async syncWithServer() {
    try {
      if (typeof fetch === 'undefined') return;
      // 1. Fetch current active case from server
      const curRes = await fetch('/api/recipient-cases/current');
      if (curRes.ok) {
        const curData = await curRes.json();
        if (curData && curData.success && curData.case) {
          this.addOrUpdateRecipientCase(curData.case, false);
        }
      }
      // 2. Fetch all shared cases
      const res = await fetch('/api/recipient-cases');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.cases)) {
          let updated = false;
          data.cases.forEach(c => {
            const idx = this.state.recipientCases.findIndex(rc => rc.id === c.id || rc.requestId === c.requestId);
            if (idx < 0) {
              this.state.recipientCases.push(c);
              updated = true;
            } else {
              this.state.recipientCases[idx] = { ...this.state.recipientCases[idx], ...c };
              updated = true;
            }
          });
          if (updated) {
            this.saveState();
          }
        }
      }

      // 3. Fetch shared donors from database
      const donorRes = await fetch('/api/donors');
      if (donorRes.ok) {
        const donorData = await donorRes.json();
        if (donorData && donorData.success && Array.isArray(donorData.donors)) {
          this.state.matchedDonorsPool = donorData.donors;
          if (!this.state.donor && donorData.donors.length > 0) {
            this.state.donor = donorData.donors[0];
          } else if (this.state.donor) {
            const fresh = donorData.donors.find(d => d.id === this.state.donor.id);
            if (fresh) {
              this.state.donor = { ...this.state.donor, ...fresh };
            }
          }
          this.saveState();
        }
      }

      // 4. Fetch shared hospitals from database
      const hospRes = await fetch('/api/hospitals');
      if (hospRes.ok) {
        const hospData = await hospRes.json();
        if (hospData && hospData.success && Array.isArray(hospData.hospitals)) {
          this.state.registeredHospitals = hospData.hospitals;
          if (!this.state.hospital && hospData.hospitals.length > 0) {
            this.state.hospital = hospData.hospitals[0];
          } else if (this.state.hospital) {
            const freshHosp = hospData.hospitals.find(h => h.id === this.state.hospital.id);
            if (freshHosp) {
              this.state.hospital = { ...this.state.hospital, ...freshHosp };
            }
          }
          this.saveState();
        }
      }
    } catch (e) {
      console.warn('Sync with server failed:', e);
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
      // Purge legacy storage items with old mock data
      ['donorpulse_state_in_v3', 'donorpulse_state_v2', 'donorpulse_state_v1', 'donorpulse_state_v4_live', 'blood_bank_state'].forEach(k => {
        try { localStorage.removeItem(k); } catch(e) {}
      });

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = { ...DEFAULT_STATE, ...parsed };
        if (!Array.isArray(merged.registeredHospitals)) merged.registeredHospitals = [];
        if (!Array.isArray(merged.matchedDonorsPool)) merged.matchedDonorsPool = [];
        if (!Array.isArray(merged.recipientCases) || merged.recipientCases.length === 0) {
          merged.recipientCases = JSON.parse(JSON.stringify(DEFAULT_RECIPIENT_CASES));
        }
        if (!merged.recipient) {
          merged.recipient = merged.recipientCases[0] || JSON.parse(JSON.stringify(DEFAULT_RECIPIENT_CASES[0]));
        }
        if (!Array.isArray(merged.requests) || merged.requests.length === 0) {
          merged.requests = JSON.parse(JSON.stringify(DEFAULT_STATE.requests));
        }
        if (!merged.selectedRequestId && merged.recipient) {
          merged.selectedRequestId = merged.recipient.requestId;
        }
        if (!Array.isArray(merged.donationHistory)) merged.donationHistory = [];
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
    return this.state.donor || null;
  }

  setDonor(donorData) {
    this.state.donor = { ...this.state.donor, ...donorData };
    if (this.state.donor && Array.isArray(this.state.matchedDonorsPool)) {
      const idx = this.state.matchedDonorsPool.findIndex(d => d.id === this.state.donor.id);
      if (idx >= 0) {
        this.state.matchedDonorsPool[idx] = { ...this.state.matchedDonorsPool[idx], ...donorData };
      } else {
        this.state.matchedDonorsPool.unshift(this.state.donor);
      }
    }
    this.saveState();
    if (typeof fetch !== 'undefined' && this.state.donor) {
      fetch('/api/donor/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.state.donor)
      }).catch(err => console.warn('Donor profile server sync note:', err));
    }
  }

  async loginDonor(id, password) {
    try {
      if (typeof fetch !== 'undefined') {
        const res = await fetch('/api/donor/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, password })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.donor) {
            this.state.donor = data.donor;
            if (!Array.isArray(this.state.matchedDonorsPool)) {
              this.state.matchedDonorsPool = [];
            }
            const idx = this.state.matchedDonorsPool.findIndex(d => d.id === data.donor.id);
            if (idx >= 0) this.state.matchedDonorsPool[idx] = data.donor;
            else this.state.matchedDonorsPool.unshift(data.donor);
            this.saveState();
            this.notify();
            return { success: true, donor: data.donor };
          }
        }
      }
    } catch (e) {
      console.warn('Network donor login error:', e);
    }
    // Fallback: check local pool
    const pool = this.state.matchedDonorsPool || [];
    const cleanId = String(id || '').trim().toLowerCase();
    const matched = pool.find(d => {
      const dId = String(d.id || '').toLowerCase();
      const dPhone = String(d.phone || '').replace(/[\s-]/g, '');
      return dId === cleanId || dPhone === cleanId.replace(/[\s-]/g, '');
    });
    if (matched) {
      this.state.donor = matched;
      this.saveState();
      this.notify();
      return { success: true, donor: matched };
    }
    return { success: false, error: 'Donor profile not found.' };
  }

  async registerNewDonor(donorData) {
    let newDonor = null;
    try {
      if (typeof fetch !== 'undefined') {
        const res = await fetch('/api/donor/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(donorData)
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData && resData.success && resData.donor) {
            newDonor = resData.donor;
          }
        }
      }
    } catch (netErr) {
      console.warn('Network registration fallback:', netErr);
    }

    if (!newDonor) {
      // Offline fallback
      const rawBlood = (donorData.bloodGroup || 'O-').trim();
      const cleanBloodCode = rawBlood.replace(/[^a-zA-Z0-9]/g, '');
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const newId = `DP-${randomId}-${cleanBloodCode}`;

      newDonor = {
        id: newId,
        _id: newId,
        name: donorData.fullName || 'Registered Volunteer Donor',
        fullName: donorData.fullName || 'Registered Volunteer Donor',
        initials: (donorData.fullName || 'VD').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
        age: parseInt(donorData.age || 25, 10),
        gender: donorData.gender || 'Not specified',
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
        distance: 1.5,
        isAvailable: true,
        verified: true,
        coordinates: { type: 'Point', coordinates: [77.6000, 12.9500] },
        donationHistory: [],
        vitals: {
          hemoglobin: '14.2 g/dL',
          bp: '120/80 mmHg',
          pulse: '72 bpm',
          weight: '68 kg'
        }
      };
    }

    this.state.donor = newDonor;

    // Persist registered donor to matchedDonorsPool so they can be matched across the grid
    if (!Array.isArray(this.state.matchedDonorsPool)) {
      this.state.matchedDonorsPool = [];
    }
    this.state.matchedDonorsPool = this.state.matchedDonorsPool.filter(d => d.id !== newDonor.id && d.phone !== newDonor.phone);
    this.state.matchedDonorsPool.unshift(newDonor);

    // If an active recipient request matches this donor's blood group, add to request donors
    if (this.state.recipient && this.isBloodCompatible(newDonor.bloodGroup, this.state.recipient.bloodGroup)) {
      if (!Array.isArray(this.state.recipient.donors)) {
        this.state.recipient.donors = [];
      }
      const alreadyIn = this.state.recipient.donors.some(d => d.id === newDonor.id);
      if (!alreadyIn) {
        this.state.recipient.donors.push({
          ...newDonor,
          confirmed: false,
          callStatus: 'ringing',
          transitStatus: '📞 Ringing / Awaiting Confirmation',
          statusClass: 'bg-amber-500/20 text-amber-800 font-semibold border border-amber-400/30',
          notified: true,
          liveEta: '15 mins',
          transitMode: '🚗 Personal Vehicle',
          progressPct: 15,
          landmark: `${newDonor.distance} km away • Active in network`
        });
      }
      if (!this.state.activeIncomingCall) {
        this.ringDonor(this.state.recipient.requestId, newDonor.id);
      }
    }

    this.saveState();
    this.notify();
    this.broadcastSync({
      type: 'NEW_DONOR_REGISTERED',
      donor: newDonor
    });
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
    const newId = data.id || `HSP-${randomId}-${stateCode}`;

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
    const existingIdx = this.state.registeredHospitals.findIndex(h => h.id === newId);
    if (existingIdx >= 0) {
      this.state.registeredHospitals[existingIdx] = newHospital;
    } else {
      this.state.registeredHospitals.unshift(newHospital);
    }

    // Switch active hospital to the newly registered one
    this.state.hospital = newHospital;
    this.saveState();

    if (typeof fetch !== 'undefined') {
      fetch('/api/hospital/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHospital)
      }).catch(err => console.warn('Hospital register server sync note:', err));
    }

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
    if (!this.state.recipient && Array.isArray(this.state.recipientCases) && this.state.recipientCases.length > 0) {
      this.state.recipient = this.state.recipientCases[0];
      this.state.selectedRequestId = this.state.recipient.requestId;
    }
    return this.state.recipient || null;
  }

  getRecipientCases() {
    return Array.isArray(this.state.recipientCases) ? this.state.recipientCases : [];
  }

  addOrUpdateRecipientCase(caseData, saveNow = true) {
    if (!caseData || (!caseData.id && !caseData.caseId)) return null;
    const cid = caseData.id || caseData.caseId;
    if (!Array.isArray(this.state.recipientCases)) {
      this.state.recipientCases = [];
    }
    const idx = this.state.recipientCases.findIndex(c => c.id === cid || c.requestId === caseData.requestId);
    if (idx >= 0) {
      this.state.recipientCases[idx] = { ...this.state.recipientCases[idx], ...caseData };
    } else {
      this.state.recipientCases.unshift(caseData);
    }
    this.state.recipient = caseData;
    this.state.selectedRequestId = caseData.requestId;

    // Synchronize request pool
    if (Array.isArray(this.state.requests)) {
      const rIdx = this.state.requests.findIndex(r => r.id === caseData.requestId);
      const reqObj = {
        id: caseData.requestId,
        bloodGroup: caseData.bloodGroup,
        component: caseData.component,
        units: caseData.unitsRequired,
        urgency: caseData.urgency,
        hospitalName: caseData.hospitalName,
        ward: caseData.hospitalWard,
        location: caseData.hospitalAddress,
        notes: caseData.clinicalReason,
        createdAt: caseData.broadcastDate || 'Today',
        status: (caseData.donors && caseData.donors.length > 0) ? 'En Route to Hospital Blood Bank' : 'Broadcasting',
        trackingStage: caseData.trackingStage || 2,
        matchedCount: (caseData.donors && caseData.donors.length) || 0,
        acceptedCount: (caseData.donors && caseData.donors.filter(d => d.confirmed).length) || 0,
        enRouteCount: (caseData.donors && caseData.donors.filter(d => d.confirmed).length) || 0,
        donors: caseData.donors || []
      };
      if (rIdx >= 0) {
        this.state.requests[rIdx] = { ...this.state.requests[rIdx], ...reqObj };
      } else {
        this.state.requests.unshift(reqObj);
      }
    }

    if (saveNow) {
      this.saveState();
      this.notify();
      this.broadcastSync({ type: 'RECIPIENT_CASE_UPDATED', caseId: cid });
    }
    return caseData;
  }

  switchRecipientCase(caseId) {
    const cases = this.getRecipientCases();
    let found = cases.find(c => c.id === caseId || c.requestId === caseId);
    if (!found && caseId) {
      const q = String(caseId).trim().toLowerCase();
      const numQ = q.replace(/\D/g, '');
      found = cases.find(c =>
        (c.patientName && c.patientName.toLowerCase() === q) ||
        (c.handshakeOTP && c.handshakeOTP === q) ||
        (numQ.length >= 4 && c.attendantPhone && c.attendantPhone.replace(/\D/g, '').includes(numQ))
      );
    }
    if (found) {
      this.state.recipient = found;
      this.state.selectedRequestId = found.requestId;
      this.saveState();
      this.notify();
      return found;
    }
    return this.state.recipient;
  }

  async loginRecipient(id, password) {
    try {
      if (typeof fetch !== 'undefined') {
        const res = await fetch('/api/recipient/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, password })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.case) {
            this.addOrUpdateRecipientCase(data.case, true);
            return { success: true, case: data.case };
          }
        }
      }
    } catch (e) {
      console.warn('Network recipient login error:', e);
    }
    // Fallback: check local cases
    const cases = this.getRecipientCases();
    const cleanId = String(id || '').trim().toLowerCase();
    const cleanPwd = String(password || '').trim().replace(/[\s-]/g, '');
    const matched = cases.find(c => {
      const cId = String(c.id || '').toLowerCase();
      const cCase = String(c.caseId || '').toLowerCase();
      const cPhone = String(c.attendantPhone || '').replace(/[\s-]/g, '');
      const cPin = String(c.handshakeOTP || '');
      return cId === cleanId || cCase === cleanId || cleanId === cPhone || cleanId === cPin || cleanPwd === cPhone || cleanPwd === cPin;
    });
    if (matched) {
      this.addOrUpdateRecipientCase(matched, true);
      return { success: true, case: matched };
    }
    return { success: false, error: 'Recipient case record not found.' };
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

    if (typeof fetch !== 'undefined') {
      fetch('/api/recipient/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.state.recipient)
      }).catch(err => console.warn('Recipient update sync notice:', err));
    }

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

  setRecipient(recipientData) {
    this.state.recipient = { ...this.state.recipient, ...recipientData };
    this.saveState();
    return this.state.recipient;
  }

  async createNewPatientRequest(data) {
    const randomCaseNum = Math.floor(1000 + Math.random() * 9000);
    const caseId = 'CASE-' + randomCaseNum;
    const reqId = 'REQ-' + randomCaseNum;
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const patientName = (data.patientName && data.patientName.trim()) ? data.patientName.trim() : 'Patient Case ' + randomCaseNum;
    const patientAge = parseInt(data.patientAge || 30, 10);
    const patientGender = data.patientGender || 'Other';
    const bloodGroup = (data.bloodGroup || 'O-').trim();
    const component = data.component || 'Platelets (Apheresis)';
    const units = parseInt(data.unitsRequired || data.units || 2, 10);
    const urgency = data.urgency || 'Stat Emergency (< 45 Mins)';
    const hospitalName = (data.hospitalName && data.hospitalName.trim()) ? data.hospitalName.trim() : 'Emergency Trauma Center';
    const hospitalWard = (data.ward || data.hospitalWard || 'ICU Ward 4B, Bed 12').trim();
    const attendantName = (data.attendantName && data.attendantName.trim()) ? data.attendantName.trim() : 'Immediate Family';
    const attendantRelation = (data.attendantRelation && data.attendantRelation.trim()) ? data.attendantRelation.trim() : 'Family Attendant';
    const attendantPhone = (data.attendantPhone && data.attendantPhone.trim()) ? data.attendantPhone.trim() : '';
    const clinicalReason = (data.notes || data.clinicalReason || 'Acute clinical blood requirement, emergency broadcast.').trim();

    // MATCH COMPATIBLE DONORS ONLY FROM ACTUAL REGISTERED DONORS IN matchedDonorsPool!
    const compatDonors = this.getMatchedDonors(bloodGroup);
    const requestDonors = compatDonors.map((d, index) => ({
      ...d,
      confirmed: false,
      callStatus: 'ringing',
      transitStatus: '📞 Ringing / Awaiting Confirmation',
      statusClass: 'bg-amber-500/20 text-amber-800 font-semibold border border-amber-400/30',
      notified: true,
      liveEta: d.eta || `${Math.round((d.distance || 2) * 7 + 8)} mins`,
      transitMode: index === 0 ? '🚗 Emergency Vehicle Corridor' : (index === 1 ? '🚊 Metro Rapid Line' : '🚗 Personal Vehicle'),
      progressPct: 15,
      landmark: `${d.distance || 2} km away • Within clinical radius`
    }));

    const primaryDonor = requestDonors[0] || null;

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
      hospitalAddress: `${hospitalName}`,
      attendantName,
      attendantRelation,
      attendantPhone,
      attendantEmail: data.attendantEmail || 'attendant@donor-pulse.in',
      doctorName: data.doctorRegId || data.doctorName || 'Attending Physician',
      doctorDepartment: 'Trauma & Critical Care',
      doctorPhone: attendantPhone || '+91 Emergency',
      hospitalBloodDesk: attendantPhone || '+91 Emergency Desk',
      clinicalReason,
      handshakeOTP: otp,
      trackingStage: requestDonors.length > 0 ? 2 : 1, // Stage 2: Donors Alerted & Ringing; 1: Broadcast active
      broadcastDate: 'Just now',
      appealActive: true,
      donors: requestDonors,
      verificationProof: {
        documentType: data.proofDocType || data.documentType || 'Hospital Blood Requisition Slip (Form 27-C Stamped / e-RaktKosh)',
        doctorRegId: data.doctorRegId || data.doctorName || 'Attending Physician',
        ipdCaseNo: data.ipdCaseNo || `IPD-${randomCaseNum}-ICU`,
        fileName: data.proofFileName || data.fileName || 'hospital_blood_requisition_signed.pdf',
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
    if (!Array.isArray(this.state.recipientCases)) this.state.recipientCases = [];
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
      status: requestDonors.length > 0 ? 'Ringing Donors / Awaiting Confirmation' : 'Broadcasting / Awaiting Donors',
      trackingStage: requestDonors.length > 0 ? 2 : 1,
      matchedCount: requestDonors.length,
      acceptedCount: 0,
      enRouteCount: 0,
      donors: requestDonors
    };
    if (!Array.isArray(this.state.requests)) this.state.requests = [];
    this.state.requests.unshift(newReq);
    this.state.selectedRequestId = reqId;

    // Set active ringing call details ONLY if a matched registered donor exists!
    if (primaryDonor) {
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
        donorId: primaryDonor.id,
        donorName: primaryDonor.name,
        donorPhone: primaryDonor.phone,
        donorBloodGroup: primaryDonor.bloodGroup,
        donorDistance: primaryDonor.distance || 1.8,
        donorEta: primaryDonor.liveEta || primaryDonor.eta || '18 mins',
        status: 'ringing',
        timestamp: Date.now()
      };
    } else {
      this.state.activeIncomingCall = null;
    }

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

      // Persist recipient case to shared database across all devices
      try {
        await fetch('/api/recipient-cases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPatient)
        });
      } catch (err) {
        console.warn('API recipient case sync notice:', err);
      }
    }

    this.saveState();
    this.notify();

    // Broadcast sync event for cross-tab ringing
    if (this.state.activeIncomingCall) {
      this.broadcastSync({
        type: 'NEW_REQUEST_RINGING',
        requestId: reqId,
        activeIncomingCall: this.state.activeIncomingCall
      });
    }

    return newPatient;
  }

  // --- Requests methods ---
  getRequests() {
    return Array.isArray(this.state.requests) ? this.state.requests : [];
  }

  getSelectedRequest() {
    if (!Array.isArray(this.state.requests) || this.state.requests.length === 0) return null;
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
      hospitalName: (this.state.hospital && this.state.hospital.name) || 'City Blood Centre',
      ward: newReq.ward || 'General Triage',
      location: newReq.location || 'Bengaluru',
      notes: newReq.notes || 'Emergency requisition.',
      createdAt: new Date().toLocaleString(),
      status: 'Broadcasting to Donors',
      trackingStage: 1,
      matchedCount: 0,
      acceptedCount: 0,
      enRouteCount: 0
    };

    if (!Array.isArray(this.state.requests)) this.state.requests = [];
    this.state.requests.unshift(request);
    this.state.selectedRequestId = id;
    this.saveState();
    return request;
  }

  // --- Request Tracking methods ---
  advanceTrackingStage(requestId) {
    if (!Array.isArray(this.state.requests)) return 1;
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
          req.acceptedCount = 1;
          req.enRouteCount = 1;
        }

        this.saveState();
      }
      return req.trackingStage;
    }
    return 1;
  }

  setTrackingStage(requestId, stage) {
    if (!Array.isArray(this.state.requests)) return;
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

    if (!Array.isArray(this.state.matchedDonorsPool)) {
      return [];
    }

    if (!targetBloodGroup) {
      return this.state.matchedDonorsPool;
    }

    const allowedDonors = compatMap[targetBloodGroup] || [targetBloodGroup];
    return this.state.matchedDonorsPool.filter(d => allowedDonors.includes(d.bloodGroup));
  }

  notifyDonor(donorId) {
    if (!Array.isArray(this.state.matchedDonorsPool)) return false;
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
      // Return compatible registered donors from matchedDonorsPool ONLY!
      const compatible = this.getMatchedDonors(cleanBlood);
      if (!compatible || compatible.length === 0) {
        return [];
      }

      storedDonors = compatible.map((d, index) => ({
        ...d,
        confirmed: false,
        callStatus: 'ringing',
        transitStatus: '📞 Ringing / Awaiting Confirmation',
        statusClass: 'bg-amber-500/20 text-amber-800 font-semibold border border-amber-400/30',
        transitMode: index === 0 ? '🚗 Emergency Vehicle Corridor' : (index === 1 ? '🚊 Metro Rapid Line' : '🚗 Personal Vehicle'),
        progressPct: 15,
        landmark: `Standby radius • ${d.distance || 2} km away`,
        liveEta: d.eta || `${Math.round((d.distance || 2) * 7 + 6)} mins`
      }));

      if (req) req.donors = storedDonors;
      if (recipient && recipient.requestId === reqId) recipient.donors = storedDonors;
    }

    return storedDonors || [];
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
    const effectiveReqId = requestId || (recipient && recipient.requestId) || (this.state.activeIncomingCall && this.state.activeIncomingCall.requestId) || this.state.selectedRequestId || (this.state.requests && this.state.requests[0] && this.state.requests[0].id) || 'REQ-8686';
    const req = this.state.requests ? this.state.requests.find(r => r.id === effectiveReqId) : null;
    const bloodGroup = recipient ? recipient.bloodGroup : (req ? req.bloodGroup : (this.state.activeIncomingCall ? this.state.activeIncomingCall.bloodGroup : 'B+'));

    const donorList = this.getRequestDonorTracking(effectiveReqId, bloodGroup);
    let donor = donorList.find(d => d.id === donorId || (donorId && String(d.name || '').toLowerCase() === String(donorId).toLowerCase()));

    // Resilient fallback search across matched pool, active donor, or active call
    if (!donor && this.state.matchedDonorsPool) {
      donor = this.state.matchedDonorsPool.find(d => d.id === donorId || (donorId && String(d.name || '').toLowerCase() === String(donorId).toLowerCase()));
    }
    if (!donor && this.state.donor && (this.state.donor.id === donorId || !donorId)) {
      donor = { ...this.state.donor, name: this.state.donor.fullName || this.state.donor.name };
    }
    if (!donor && this.state.activeIncomingCall) {
      donor = {
        id: this.state.activeIncomingCall.donorId || donorId || 'D-KM-01',
        name: this.state.activeIncomingCall.donorName || 'Volunteer Donor',
        bloodGroup: this.state.activeIncomingCall.donorBloodGroup || 'O-',
        phone: this.state.activeIncomingCall.donorPhone || '+91 98452 33109',
        distance: this.state.activeIncomingCall.donorDistance || 1.5,
        liveEta: this.state.activeIncomingCall.donorEta || '15 mins'
      };
    }
    if (!donor) {
      donor = {
        id: donorId || 'DNR-LIVE-01',
        name: 'Volunteer Donor',
        bloodGroup: bloodGroup === 'O-' ? 'O-' : 'O-',
        phone: '+91 98452 33109',
        distance: 1.5,
        liveEta: '15 mins'
      };
    }

    // Ensure donor is present in donorList
    if (!donorList.some(d => d.id === donor.id)) {
      donorList.unshift(donor);
    }

    donor.confirmed = true;
    donor.callStatus = 'confirmed';
    donor.transitStatus = 'En Route (Confirmed)';
    donor.statusClass = 'bg-emerald-500/15 text-emerald-800 font-bold border border-emerald-400/40';
    donor.progressPct = Math.max(45, donor.progressPct || 45);
    donor.confirmedAt = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST';
    donor.landmark = 'Departed dispatch base • Fast-track transit corridor';

    // Update recipient units arranged and tracking stage
    if (recipient) {
      recipient.unitsArranged = Math.min(recipient.unitsRequired || 2, (recipient.unitsArranged || 0) + 1);
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

    // Also update matching case in recipientCases
    if (Array.isArray(this.state.recipientCases)) {
      const cMatch = this.state.recipientCases.find(c => c.requestId === effectiveReqId || c.id === effectiveReqId || c.caseId === effectiveReqId);
      if (cMatch) {
        cMatch.unitsArranged = Math.min(cMatch.unitsRequired || 2, (cMatch.unitsArranged || 0) + 1);
        cMatch.trackingStage = 4;
        cMatch.donors = donorList;
      }
    }

    // Create active deployment status for the donor
    this.state.activeDeployment = {
      requestId: effectiveReqId,
      donorId: donor.id,
      donorName: donor.name || donor.fullName,
      patientName: recipient ? recipient.patientName : (req ? req.patientName : 'Emergency Patient'),
      bloodGroup: bloodGroup,
      hospitalName: recipient ? recipient.hospitalName : (req ? req.hospitalName : 'Emergency Hospital'),
      hospitalWard: recipient ? recipient.hospitalWard : 'ICU Trauma Wing',
      status: 'En Route',
      confirmedAt: donor.confirmedAt,
      eta: donor.liveEta || donor.eta || '15 mins'
    };

    // Terminate ringing call completely
    this.state.activeIncomingCall = null;
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

  // Decline donor call
  declineDonorCall(requestId, donorId) {
    const recipient = this.getRecipient();
    const effectiveReqId = requestId || (recipient && recipient.requestId) || (this.state.activeIncomingCall && this.state.activeIncomingCall.requestId) || this.state.selectedRequestId;
    const req = this.state.requests ? this.state.requests.find(r => r.id === effectiveReqId) : null;
    const bloodGroup = recipient ? recipient.bloodGroup : (req ? req.bloodGroup : 'B+');
    const donorList = this.getRequestDonorTracking(effectiveReqId, bloodGroup);

    let donor = donorList.find(d => d.id === donorId);
    if (!donor && this.state.activeIncomingCall && (this.state.activeIncomingCall.donorId === donorId || !donorId)) {
      donor = {
        id: this.state.activeIncomingCall.donorId,
        name: this.state.activeIncomingCall.donorName,
        bloodGroup: this.state.activeIncomingCall.donorBloodGroup
      };
      donorList.push(donor);
    }
    if (!donor && this.state.donor && (this.state.donor.id === donorId || !donorId)) {
      donor = { ...this.state.donor, name: this.state.donor.fullName || this.state.donor.name };
      donorList.push(donor);
    }

    if (donor) {
      donor.callStatus = 'declined';
      donor.transitStatus = 'Declined / Busy';
      donor.statusClass = 'bg-surface-container-high text-on-surface-variant line-through opacity-60';
    }

    // Terminate active incoming call on this client so it stops ringing and closes completely
    this.state.activeIncomingCall = null;
    this.saveState();

    this.broadcastSync({
      type: 'DONOR_DECLINED',
      requestId: effectiveReqId,
      donorId: donor ? donor.id : donorId
    });

    return { success: true, donor };
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

    const firstDonor = donorList[0] || (this.state.matchedDonorsPool && this.state.matchedDonorsPool[0]);
    if (firstDonor) {
      this.ringDonor(effectiveReqId, firstDonor.id);
    }
    return donorList;
  }

  resetToDefault() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.saveState();
  }
}

window.PulseStore = new Store();
