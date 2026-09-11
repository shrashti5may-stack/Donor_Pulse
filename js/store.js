/**
 * DonorPulse Central State Store
 * Manages persistent local mock data for Donors, Hospitals, Verification, Requests, and Tracking.
 */

const STORAGE_KEY = 'donorpulse_state_v1';

const DEFAULT_STATE = {
  // Active role session: 'guest' | 'donor' | 'hospital'
  currentRole: 'donor',

  // Current Donor Profile
  donor: {
    id: 'DP-8924-O',
    fullName: 'Sarah Jenkins',
    age: 28,
    bloodGroup: 'O-',
    phone: '+1 (555) 234-5678',
    email: 'sarah.jenkins@medvolunteer.org',
    address: '482 Lexington Ave, Apt 4B',
    city: 'Downtown Metro Center',
    medicalHistory: 'Hemoglobin 14.8 g/dL (Normal). Regular whole blood donor. No travel abroad in past 6 months. Blood pressure optimal at 118/76 mmHg.',
    lastDonationDate: '2024-10-14',
    nextEligibleDate: 'Eligible Now',
    availability: true, // true = Active / On Call, false = Temporarily Unavailable
    radiusMiles: 10,
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

  // Current Hospital Profile
  hospital: {
    id: 'HSP-88219-NY',
    name: 'Metro General Hospital & Trauma Center',
    category: 'Apex Multi-Specialty & Trauma Care',
    location: 'Ward 4B, Emergency Wing',
    address: '1200 Healthcare Blvd, Suite 100',
    city: 'New York, NY',
    state: 'NY',
    zip: '10001',
    phone: '+1 (800) 555-8821',
    email: 'triage@metrogeneral.org',
    licenseNumber: 'HSP-88219-NY',
    authorizedPerson: 'Dr. Aris Thorne, MD',
    roleTitle: 'Chief Triage Officer',
    bedCapacity: 650,
    traumaLevel: 'Trauma Level 1',
    verificationProof: {
      documentType: 'State Department Health Operating License',
      documentNumber: 'ACC-NY-90428-2024',
      fileName: 'metro_general_accreditation_2024.pdf',
      fileSize: '2.4 MB',
      uploadedAt: 'Oct 12, 2024'
    },
    // Verification state: 'verified' | 'pending' | 'rejected'
    verificationStatus: 'verified',
    rejectionReason: 'State department documentation mismatch on primary accreditation license certificate.'
  },

  // Registered Hospital Registry
  registeredHospitals: [
    {
      id: 'HSP-88219-NY',
      name: 'Metro General Hospital & Trauma Center',
      category: 'Apex Multi-Specialty & Trauma Care',
      location: 'Ward 4B, Emergency Wing',
      address: '1200 Healthcare Blvd, Suite 100',
      city: 'New York, NY',
      state: 'NY',
      zip: '10001',
      phone: '+1 (800) 555-8821',
      email: 'triage@metrogeneral.org',
      licenseNumber: 'HSP-88219-NY',
      authorizedPerson: 'Dr. Aris Thorne, MD',
      roleTitle: 'Chief Triage Officer',
      bedCapacity: 650,
      traumaLevel: 'Trauma Level 1',
      verificationProof: {
        documentType: 'State Department Health Operating License',
        documentNumber: 'ACC-NY-90428-2024',
        fileName: 'metro_general_accreditation_2024.pdf',
        fileSize: '2.4 MB',
        uploadedAt: 'Oct 12, 2024'
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
      hospitalName: 'Metro General Hospital',
      ward: 'Trauma OR - Suite 3',
      location: 'Ward 4B, Emergency Wing, New York, NY',
      notes: 'Acute arterial hemorrhage from multi-vehicle accident, cross-match in progress.',
      createdAt: 'Today, 14:10 EST',
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
      hospitalName: "St. Mary's Trauma Center",
      ward: 'ICU Triage Bay 2',
      location: 'Downtown Metro Center, Sector 4',
      notes: 'Post-operative severe anemia stabilization.',
      createdAt: 'Today, 12:45 EST',
      status: 'Finding Donors',
      trackingStage: 2,
      matchedCount: 8,
      acceptedCount: 1,
      enRouteCount: 0
    }
  ],

  // Currently active request selected for confirmation & tracking
  selectedRequestId: 'REQ-9042',

  // Mock Pool of Registered Donors
  matchedDonorsPool: [
    {
      id: 'D-101',
      name: 'David K.',
      initials: 'DK',
      bloodGroup: 'B+',
      distance: 1.4,
      matchScore: 100,
      availability: 'Active / On Call',
      eligibility: 'Eligible Now',
      verified: true,
      notified: true,
      accepted: true,
      eta: '25 mins',
      lastDonation: 'Aug 12, 2024'
    },
    {
      id: 'D-102',
      name: 'Sarah Jenkins',
      initials: 'SJ',
      bloodGroup: 'O-',
      distance: 1.8,
      matchScore: 98,
      availability: 'Active / On Call',
      eligibility: 'Eligible Now',
      verified: true,
      notified: false,
      accepted: false,
      eta: '18 mins',
      lastDonation: 'Oct 14, 2024'
    },
    {
      id: 'D-103',
      name: 'Elena R.',
      initials: 'ER',
      bloodGroup: 'O-',
      distance: 2.8,
      matchScore: 95,
      availability: 'Active / On Call',
      eligibility: 'Eligible Now',
      verified: true,
      notified: true,
      accepted: false,
      eta: '32 mins',
      lastDonation: 'Sep 05, 2024'
    },
    {
      id: 'D-104',
      name: 'Marcus T.',
      initials: 'MT',
      bloodGroup: 'B+',
      distance: 3.5,
      matchScore: 100,
      availability: 'Active / On Call',
      eligibility: 'Eligible Now',
      verified: true,
      notified: true,
      accepted: true,
      eta: 'Slot: 3:30 PM',
      lastDonation: 'Jul 28, 2024'
    },
    {
      id: 'D-105',
      name: 'Chloe Bennett',
      initials: 'CB',
      bloodGroup: 'A-',
      distance: 4.1,
      matchScore: 85,
      availability: 'Active / On Call',
      eligibility: 'Eligible Now',
      verified: true,
      notified: false,
      accepted: false,
      eta: '40 mins',
      lastDonation: 'Jun 19, 2024'
    },
    {
      id: 'D-106',
      name: 'Liam Patel',
      initials: 'LP',
      bloodGroup: 'O+',
      distance: 4.7,
      matchScore: 90,
      availability: 'Active / On Call',
      eligibility: 'Eligible Now',
      verified: true,
      notified: false,
      accepted: false,
      eta: '35 mins',
      lastDonation: 'May 30, 2024'
    }
  ],

  // Donation history logs for donor
  donationHistory: [
    {
      date: 'Oct 14, 2024',
      center: 'City Central Blood Bank',
      subtext: 'Donation Bay #04 • Dr. R. Adams',
      type: 'Whole Blood',
      units: '1 Unit (450 mL)',
      status: 'Completed (Verified)',
      badgeClass: 'bg-tertiary-fixed text-on-tertiary-fixed'
    },
    {
      date: 'Jun 22, 2024',
      center: 'University Medical Center',
      subtext: 'Apheresis Wing • Clinical Trial Lab',
      type: 'Platelets',
      units: '2 Units (Apheresis)',
      status: 'Completed (Verified)',
      badgeClass: 'bg-tertiary-fixed text-on-tertiary-fixed'
    },
    {
      date: 'Feb 10, 2024',
      center: "St. Jude Children's Hospital",
      subtext: 'Mobile Van 02 • Oncology Unit',
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
      fullName: donorData.fullName || 'Registered Donor',
      age: parseInt(donorData.age || 25, 10),
      bloodGroup: rawBlood,
      phone: donorData.phone || '+1 (555) 000-0000',
      email: donorData.email || 'donor@pulse.org',
      address: donorData.address || 'Metro District',
      city: donorData.city || 'Metro Central',
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
    const stateRaw = data.state || data.city || 'GEN';
    const stateCode = stateRaw.substring(0, 2).toUpperCase().replace(/[^A-Z]/g, 'X');
    const newId = `HSP-${randomId}-${stateCode}`;

    const newHospital = {
      id: newId,
      name: (data.name || 'New Healthcare Facility').trim(),
      category: data.category || 'Multi-Specialty Hospital',
      location: data.location || 'Emergency Wing',
      address: data.address || 'Medical District',
      city: data.city || 'Metropolitan Core',
      state: data.state || '',
      zip: data.zip || '',
      phone: data.phone || '+1 (800) 555-0199',
      email: data.email || 'emergency@hospital.org',
      licenseNumber: data.licenseNumber || `LIC-${randomId}`,
      authorizedPerson: data.authorizedPerson || 'Medical Superintendent',
      roleTitle: data.roleTitle || 'Chief Medical Officer',
      bedCapacity: parseInt(data.bedCapacity || 250, 10),
      traumaLevel: data.traumaLevel || 'Trauma Level 1',
      verificationProof: {
        documentType: data.documentType || 'State Health Department Operating License',
        documentNumber: data.documentNumber || `CERT-${randomId}`,
        fileName: data.fileName || 'hospital_accreditation_proof.pdf',
        fileSize: data.fileSize || '1.8 MB',
        uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
      createdAt: 'Just now',
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

  resetToDefault() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.saveState();
  }
}

window.PulseStore = new Store();
