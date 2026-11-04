const fs = require('fs');
const assert = require('assert');

// 1. Verify index.html contains view-donor-mission with all elements
console.log('--- TEST 1: Inspect index.html view-donor-mission ---');
const indexHtml = fs.readFileSync('index.html', 'utf-8');

assert(indexHtml.includes('id="view-donor-mission"'), 'view-donor-mission missing in index.html');
const requiredIds = [
  'donor-mission-req-id',
  'donor-mission-otp',
  'donor-mission-summary-patient',
  'donor-mission-summary-blood',
  'donor-mission-summary-hospital',
  'donor-mission-summary-eta',
  'donor-mission-urgency-badge',
  'donor-mission-patient-name',
  'donor-mission-patient-age',
  'donor-mission-patient-gender',
  'donor-mission-blood-group',
  'donor-mission-component',
  'donor-mission-units',
  'donor-mission-clinical-reason',
  'donor-mission-doctor-name',
  'donor-mission-hospital-name',
  'donor-mission-hospital-ward',
  'donor-mission-hospital-address',
  'donor-mission-distance',
  'donor-mission-eta-badge',
  'donor-mission-maps-btn',
  'donor-mission-desk-phone-btn',
  'donor-mission-attendant-name',
  'donor-mission-attendant-phone',
  'donor-mission-attendant-phone-btn'
];

requiredIds.forEach(id => {
  assert(indexHtml.includes(`id="${id}"`), `Missing element with id "${id}" in index.html`);
});

assert(indexHtml.includes("window.PulseRouter.navigate('donor-dashboard')"), 'Back to Donor Dashboard button missing in view-donor-mission');
console.log('✓ TEST 1 PASSED: All requested details (hospital location, patient name/age/gender, reason for blood, etc.) exist in view-donor-mission.\n');

// 2. Verify router.js
console.log('--- TEST 2: Inspect router.js routes ---');
const routerJs = fs.readFileSync('js/router.js', 'utf-8');
assert(routerJs.includes("'donor-mission-details': 'view-donor-mission'"), 'donor-mission-details route missing');
assert(routerJs.includes("'donor-mission': 'view-donor-mission'"), 'donor-mission route missing');
assert(routerJs.includes("'donor-transit-grid': 'view-donor-mission'"), 'donor-transit-grid route missing');
console.log('✓ TEST 2 PASSED: PulseRouter accurately routes to view-donor-mission.\n');

// 3. Verify app.js
console.log('--- TEST 3: Inspect app.js functionality ---');
const appJs = fs.readFileSync('js/app.js', 'utf-8');

assert(appJs.includes('href="#/donor-mission-details"'), 'Active mission banner button should link to #/donor-mission-details');
assert(appJs.includes('<span>View Details</span>'), 'Banner button label should be View Details');
assert(!appJs.includes('<a href="#/recipient-tracking" class="px-3.5 py-1.5 rounded-xl bg-emerald-700'), 'Old #/recipient-tracking link must be removed from banner');

assert(appJs.includes('function renderDonorMissionDetails('), 'renderDonorMissionDetails function definition missing');
assert(appJs.includes('window.renderDonorMissionDetails = renderDonorMissionDetails;'), 'renderDonorMissionDetails export missing');
assert(appJs.includes("['donor-mission-details', 'donor-mission', 'donor-transit-grid', 'mission-details'].includes(route)"), 'Router hook for donor-mission-details missing');

console.log('✓ TEST 3 PASSED: Banner now points to donor mission page, and renderDonorMissionDetails is hooked to router.\n');

// 4. Test renderDonorMissionDetails execution with mock DOM
console.log('--- TEST 4: Execute renderDonorMissionDetails with mock DOM ---');
const domElements = {};
global.document = {
  getElementById: (id) => {
    if (!domElements[id]) {
      domElements[id] = { id, textContent: '', href: '' };
    }
    return domElements[id];
  },
  addEventListener: () => {}
};
global.window = {
  PulseStore: {
    getDonor: () => ({
      id: 'DNR-4821',
      fullName: 'Arjun Nair',
      distance: 1.8,
      eta: '12 mins'
    }),
    getRecipient: () => ({
      requestId: 'REQ-8686',
      patientName: 'Sanchit',
      patientDob: '1996-05-18',
      patientGender: 'Male',
      bloodGroup: 'B+',
      component: 'Packed Red Blood Cells (PRBC)',
      unitsRequired: 2,
      urgency: 'Stat Emergency (< 45 Mins)',
      hospitalName: 'Metro Trauma Blood Centre',
      hospitalWard: 'ICU Emergency Bed 4',
      hospitalAddress: '#154/11 Bannerghatta Main Road, Indiranagar',
      attendantName: 'Priya Sharma',
      attendantPhone: '+91 98450 11223',
      doctorName: 'Dr. Ramesh K., MD',
      clinicalReason: 'Acute clinical blood requirement, emergency broadcast.',
      handshakeOTP: '8686'
    }),
    state: { selectedRequestId: 'REQ-8686' }
  },
  calculateAge: (dob) => {
    // 1996-05-18 in Nov 2026 is 30
    return 30;
  }
};

// Evaluate render function
eval(appJs.substring(appJs.indexOf('function renderDonorMissionDetails('), appJs.indexOf('window.renderDonorMissionDetails = renderDonorMissionDetails;') + 61));

window.renderDonorMissionDetails();

console.log('Rendered elements:', {
  patient: domElements['donor-mission-patient-name']?.textContent,
  age: domElements['donor-mission-patient-age']?.textContent,
  gender: domElements['donor-mission-patient-gender']?.textContent,
  blood: domElements['donor-mission-blood-group']?.textContent,
  hospital: domElements['donor-mission-hospital-name']?.textContent,
  reason: domElements['donor-mission-clinical-reason']?.textContent,
  otp: domElements['donor-mission-otp']?.textContent,
  mapLink: domElements['donor-mission-maps-btn']?.href
});

assert.strictEqual(domElements['donor-mission-patient-name'].textContent, 'Sanchit');
assert(domElements['donor-mission-patient-age'].textContent.includes('30 yrs'), 'Patient age should be 30 yrs');
assert.strictEqual(domElements['donor-mission-patient-gender'].textContent, 'Male');
assert.strictEqual(domElements['donor-mission-blood-group'].textContent, 'B+');
assert.strictEqual(domElements['donor-mission-hospital-name'].textContent, 'Metro Trauma Blood Centre');
assert(domElements['donor-mission-clinical-reason'].textContent.includes('Acute clinical blood requirement'), 'Reason must be shown');
assert.strictEqual(domElements['donor-mission-otp'].textContent, '8686');
assert(domElements['donor-mission-maps-btn'].href.includes('google.com/maps'), 'Google maps GPS link generated');

console.log('✓ TEST 4 PASSED: renderDonorMissionDetails properly populates all details without switching to recipient dashboard.\n');

console.log('ALL DONOR MISSION PAGE TESTS COMPLETED SUCCESSFULLY! 🎉');

