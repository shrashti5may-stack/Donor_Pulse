const fs = require('fs');
const assert = require('assert');

// Mock browser globals
global.window = global;
global.window.addEventListener = () => {};
global.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};
global.localStorage = (function() {
  let s = {};
  return {
    getItem: (k) => s[k] || null,
    setItem: (k, v) => { s[k] = String(v); },
    removeItem: (k) => { delete s[k]; },
    clear: () => { s = {}; }
  };
})();
// Fail the fetch in unit test so it tests the offline fallback logic
global.fetch = () => Promise.reject(new Error('Unit test offline simulation'));

// 1. Evaluate store.js
const storeCode = fs.readFileSync('js/store.js', 'utf-8');
eval(storeCode);

async function runTests() {
  console.log('--- TEST 1: calculateAge Functionality ---');
  const testRefDate = new Date('2026-11-04T12:00:00Z');

  // Donor born 1997-04-12 -> 29 years old in Nov 2026
  const age1 = window.calculateAge('1997-04-12', testRefDate);
  console.log('DOB 1997-04-12 -> Age:', age1, '(expected 29)');
  assert.strictEqual(age1, 29);

  // Donor born 1997-12-25 -> 28 years old (birthday in December, has not happened yet)
  const age2 = window.calculateAge('1997-12-25', testRefDate);
  console.log('DOB 1997-12-25 -> Age:', age2, '(expected 28)');
  assert.strictEqual(age2, 28);

  // Patient born 1994-06-25 -> 32 years old
  const age3 = window.calculateAge('1994-06-25', testRefDate);
  console.log('DOB 1994-06-25 -> Age:', age3, '(expected 32)');
  assert.strictEqual(age3, 32);

  // Pediatric patient born 2021-03-10 -> 5 years old
  const age4 = window.calculateAge('2021-03-10', testRefDate);
  console.log('DOB 2021-03-10 -> Age:', age4, '(expected 5)');
  assert.strictEqual(age4, 5);

  // Edge cases
  assert.strictEqual(window.calculateAge(''), null);
  assert.strictEqual(window.calculateAge(null), null);
  assert.strictEqual(window.calculateAge('invalid-date'), null);

  console.log('✓ TEST 1 PASSED: calculateAge handles all dates and birthdays correctly.\n');

  console.log('--- TEST 2: Automatic Age Updation in PulseStore ---');
  const store = window.PulseStore || new Store();

  // Test donor age update
  store.state.donor = {
    id: 'DP-TEST-1',
    name: 'Arjun Nair',
    fullName: 'Arjun Nair',
    dateOfBirth: '1997-04-12',
    age: 20 // stale / outdated age
  };

  const donor = store.getDonor();
  console.log('Donor after getDonor(): age =', donor.age, '(auto-updated from 20 to 29)');
  assert.strictEqual(donor.age, 29);

  // Test recipient age update
  store.state.recipient = {
    requestId: 'REQ-TEST-1',
    patientName: 'Devika Sharma',
    patientDob: '1994-06-25',
    patientAge: 18 // outdated age
  };

  const recipient = store.getRecipient();
  console.log('Recipient after getRecipient(): patientAge =', recipient.patientAge, '(auto-updated from 18 to 32)');
  assert.strictEqual(recipient.patientAge, 32);

  // Recipient cases list
  store.state.recipientCases = [
    { id: 'CASE-1', patientName: 'Patient 1', patientDob: '1996-05-18', patientAge: 10 },
    { id: 'CASE-2', patientName: 'Patient 2', patientDob: '1981-03-12', patientAge: 10 }
  ];

  const cases = store.getRecipientCases();
  console.log('Cases after getRecipientCases():', cases.map(c => `${c.patientName}: ${c.patientAge}`));
  assert.strictEqual(cases[0].patientAge, 30);
  assert.strictEqual(cases[1].patientAge, 45);

  console.log('✓ TEST 2 PASSED: PulseStore dynamically updates age based on DOB without manual change.\n');

  console.log('--- TEST 3: New Donor Registration & Requisition with DOB ---');
  // Register donor with DOB
  const newDonorData = {
    fullName: 'Rohan Verma',
    dob: '1998-08-15',
    gender: 'Male',
    bloodGroup: 'A+',
    phone: '+91 91234 56789'
  };

  const createdDonor = await store.registerNewDonor(newDonorData);
  console.log('Created donor:', { id: createdDonor.id, name: createdDonor.fullName, dob: createdDonor.dateOfBirth, age: createdDonor.age });
  assert.strictEqual(createdDonor.dateOfBirth, '1998-08-15');
  assert.strictEqual(createdDonor.age, 28);

  // Create recipient request with patientDob
  const newReqData = {
    patientName: 'Kavita Rao',
    patientDob: '1995-10-20',
    patientGender: 'Female',
    bloodGroup: 'O-',
    unitsRequired: 2,
    hospitalName: 'Manipal Hospital'
  };

  const createdCase = await store.createNewPatientRequest(newReqData);
  console.log('Created case:', { id: createdCase.id, patient: createdCase.patientName, dob: createdCase.patientDob, age: createdCase.patientAge });
  assert.strictEqual(createdCase.patientDob, '1995-10-20');
  assert.strictEqual(createdCase.patientAge, 31);

  console.log('✓ TEST 3 PASSED: Donor registration and patient request correctly compute & persist DOB and Age.\n');
  console.log('ALL TESTS PASSED SUCCESSFULLY! 🎉');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
