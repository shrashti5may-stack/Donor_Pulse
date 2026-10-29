const fs = require('fs');
const assert = require('assert');

// Mock browser globals for testing app.js and store.js logic
global.window = global;
global.window.addEventListener = () => {};
global.document = {
  getElementById: (id) => null,
  querySelectorAll: (sel) => []
};
global.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) });

// 1. Test app.js recovery logic
const appJs = fs.readFileSync('js/app.js', 'utf-8');

// Evaluate the functions in isolation
const fnCode = `
${appJs.substring(appJs.indexOf('function parseDonationDate'), appJs.indexOf('window.calculateDonationRecovery = calculateDonationRecovery;'))}
window.parseDonationDate = parseDonationDate;
window.calculateDonationRecovery = calculateDonationRecovery;
`;
eval(fnCode);

console.log('--- TEST 1: calculateDonationRecovery ---');
const fixedNow = new Date('2026-10-29T12:00:00Z');

// Test A: Donated 40 days ago (2026-09-19)
const recA = window.calculateDonationRecovery('2026-09-19', fixedNow);
console.log('Donor A (2026-09-19):', {
  inRecovery: recA.inRecovery,
  isEligible: recA.isEligible,
  daysRemaining: recA.daysRemaining,
  hoursRemaining: recA.hoursRemaining,
  progressPercent: recA.progressPercent,
  formattedNextDate: recA.formattedNextDate
});
assert.strictEqual(recA.inRecovery, true, 'Should be in recovery');
assert.strictEqual(recA.isEligible, false, 'Should not be eligible');
assert(recA.daysRemaining === 49 || recA.daysRemaining === 50, 'Days remaining should be 49 or 50');
assert(recA.progressPercent > 40 && recA.progressPercent < 50, 'Progress should be ~44%');

// Test B: Donated 137 days ago (2026-06-14)
const recB = window.calculateDonationRecovery('14 Jun 2026', fixedNow);
console.log('Donor B (14 Jun 2026):', {
  inRecovery: recB.inRecovery,
  isEligible: recB.isEligible,
  daysRemaining: recB.daysRemaining,
  progressPercent: recB.progressPercent
});
assert.strictEqual(recB.inRecovery, false, 'Should not be in recovery');
assert.strictEqual(recB.isEligible, true, 'Should be eligible');
assert.strictEqual(recB.daysRemaining, 0, 'Days remaining should be 0');
assert.strictEqual(recB.progressPercent, 100, 'Progress should be 100%');

// Test C: First-time Donor
const recC = window.calculateDonationRecovery('First-time Donor', fixedNow);
console.log('Donor C (First-time Donor):', {
  inRecovery: recC.inRecovery,
  isEligible: recC.isEligible
});
assert.strictEqual(recC.inRecovery, false, 'First-time donor not in recovery');
assert.strictEqual(recC.isEligible, true, 'First-time donor is eligible');

console.log('✓ TEST 1 PASSED: calculateDonationRecovery functions correctly.\n');

// 2. Test Store 90-day recovery filtering
console.log('--- TEST 2: Store.isDonorInRecovery & Matching Exclusion ---');
// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; }
  };
})();
global.localStorage = localStorageMock;

// Evaluate store.js with global Store exposure
const storeJs = fs.readFileSync('js/store.js', 'utf-8');
eval(storeJs + '\nglobal.Store = Store;');

const testStore = new global.Store();

const donorInRecovery = {
  id: 'DNR-REC-1',
  name: 'Recovery Donor',
  bloodGroup: 'O-',
  lastDonationDate: '2026-09-18'
};

const donorEligible = {
  id: 'DNR-ELIG-1',
  name: 'Eligible Donor',
  bloodGroup: 'O-',
  lastDonationDate: '2026-06-14'
};

const donorFirstTime = {
  id: 'DNR-NEW-1',
  name: 'New Donor',
  bloodGroup: 'O-',
  lastDonationDate: 'First-time Donor'
};

assert.strictEqual(testStore.isDonorInRecovery(donorInRecovery), true, 'donorInRecovery must return true');
assert.strictEqual(testStore.isDonorInRecovery(donorEligible), false, 'donorEligible must return false');
assert.strictEqual(testStore.isDonorInRecovery(donorFirstTime), false, 'donorFirstTime must return false');

// Test getMatchedDonors exclusion
testStore.state.matchedDonorsPool = [donorInRecovery, donorEligible, donorFirstTime];
const matched = testStore.getMatchedDonors('O-');
console.log('Matched donors for O- (out of 3 pool donors):', matched.map(d => ({ id: d.id, name: d.name })));
assert.strictEqual(matched.length, 2, 'Must filter out the donor in recovery');
assert.strictEqual(matched.some(d => d.id === 'DNR-REC-1'), false, 'DNR-REC-1 must be excluded');

// Test notifyDonor block
const notifyRes = testStore.notifyDonor('DNR-REC-1');
assert.strictEqual(notifyRes, false, 'notifyDonor must return false for donor in recovery');
assert.strictEqual(donorInRecovery.notified, undefined, 'donorInRecovery must not be marked notified');

// Test ringDonor block
testStore.ringDonor('REQ-TEST', 'DNR-REC-1');
assert.strictEqual(testStore.state.activeIncomingCall, null, 'activeIncomingCall must not be set for donor in recovery');

console.log('✓ TEST 2 PASSED: Store strictly filters out and blocks donors in 90-day recovery.\n');
process.exit(0);
