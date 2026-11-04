const fs = require('fs');
const assert = require('assert');

// 1. Verify index.html contains view-donor-mission with live directions map window & no turn-by-turn box
console.log('--- TEST 1: Inspect index.html view-donor-mission & Live Directions Map Window ---');
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
  'donor-mission-map-window',
  'donor-mission-map-frame',
  'donor-mission-map-maximize',
  'donor-mission-map-target-name',
  'donor-mission-start-nav-btn',
  'donor-mission-desk-phone-btn',
  'donor-mission-attendant-name',
  'donor-mission-attendant-phone',
  'donor-mission-attendant-phone-btn'
];

requiredIds.forEach(id => {
  assert(indexHtml.includes(`id="${id}"`), `Missing element with id "${id}" in index.html`);
});

// Assert the removed section is truly removed
assert(!indexHtml.includes('Turn-by-Turn Directions to Hospital'), 'Turn-by-Turn Directions section must be removed');
assert(!indexHtml.includes('id="donor-mission-direction-step-1"'), 'Direction steps must be removed');
assert(!indexHtml.includes('Follow Emergency Transit Corridor'), 'Emergency corridor text must be removed');

assert(indexHtml.includes('Start Google Maps Live Directions (GPS)'), 'Start navigation button must be present');
assert(indexHtml.includes("window.PulseRouter.navigate('donor-dashboard')"), 'Back to Donor Dashboard button missing in view-donor-mission');
console.log('✓ TEST 1 PASSED: Turn-by-Turn box is removed, and directions map window & navigation button are intact.\n');

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
assert(appJs.includes("mapsEmbedDirectionsUrl"), 'Directions embed calculation missing');
assert(appJs.includes("mapsNavigationUrl"), 'Directions navigation calculation missing');

console.log('✓ TEST 3 PASSED: Banner points to donor mission page, and renderDonorMissionDetails calculates directions & navigation.\n');

// 4. Test renderDonorMissionDetails execution with mock DOM
console.log('--- TEST 4: Execute renderDonorMissionDetails with mock DOM ---');
const domElements = {};
global.document = {
  getElementById: (id) => {
    if (!domElements[id]) {
      domElements[id] = { id, textContent: '', href: '', src: '' };
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
      address: '#24, 4th Cross, Koramangala 4th Block',
      city: 'Bengaluru, Karnataka',
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
      hospitalAddress: '#154/11 Bannerghatta Main Road, Opposite IIMB, Bengaluru',
      attendantName: 'Priya Sharma',
      attendantPhone: '+91 98450 11223',
      doctorName: 'Dr. Ramesh K., MD',
      clinicalReason: 'Acute clinical blood requirement, emergency broadcast.',
      handshakeOTP: '7120'
    }),
    state: { selectedRequestId: 'REQ-8686' }
  },
  calculateAge: (dob) => {
    return 30;
  }
};

// Evaluate render function
eval(appJs.substring(appJs.indexOf('function renderDonorMissionDetails('), appJs.indexOf('window.renderDonorMissionDetails = renderDonorMissionDetails;') + 61));

window.renderDonorMissionDetails();

console.log('Rendered elements:', {
  patient: domElements['donor-mission-patient-name']?.textContent,
  age: domElements['donor-mission-patient-age']?.textContent,
  hospital: domElements['donor-mission-hospital-name']?.textContent,
  mapSrc: domElements['donor-mission-map-frame']?.src,
  maximizeHref: domElements['donor-mission-map-maximize']?.href,
  startNavHref: domElements['donor-mission-start-nav-btn']?.href
});

assert.strictEqual(domElements['donor-mission-patient-name'].textContent, 'Sanchit');
assert(domElements['donor-mission-patient-age'].textContent.includes('30 yrs'), 'Patient age should be 30 yrs');
assert.strictEqual(domElements['donor-mission-hospital-name'].textContent, 'Metro Trauma Blood Centre');
assert.strictEqual(domElements['donor-mission-otp'].textContent, '7120');

// Verify directions embed contains saddr and daddr
assert(domElements['donor-mission-map-frame'].src.includes('saddr='), 'Map frame must have saddr');
assert(domElements['donor-mission-map-frame'].src.includes('daddr='), 'Map frame must have daddr');
assert(domElements['donor-mission-map-frame'].src.includes('dirflg=d'), 'Map frame must have dirflg=d');

// Verify navigation links
assert(domElements['donor-mission-map-maximize'].href.includes('google.com/maps/dir'), 'Maximize must open directions');
assert(domElements['donor-mission-start-nav-btn'].href.includes('google.com/maps/dir'), 'Start nav must open directions');

console.log('✓ TEST 4 PASSED: renderDonorMissionDetails properly configures directions without removed text box!\n');

console.log('ALL TESTS COMPLETED SUCCESSFULLY! 🎉');
