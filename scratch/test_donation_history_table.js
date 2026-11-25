const fs = require('fs');
const assert = require('assert');

console.log('--- TEST 1: Inspect index.html table header alignment ---');
const indexHtml = fs.readFileSync('index.html', 'utf-8');

assert(indexHtml.includes('<th class="py-3 px-space-sm text-left rounded-l-lg whitespace-nowrap">Date</th>'), 'Date th should have text-left');
assert(indexHtml.includes('<th class="py-3 px-space-sm text-left">Hospital / Center</th>'), 'Hospital th should have text-left');
assert(indexHtml.includes('<th class="py-3 px-space-sm text-left whitespace-nowrap">Donation Type</th>'), 'Donation Type th should have text-left');
assert(indexHtml.includes('<th class="py-3 px-space-sm text-left whitespace-nowrap">Units</th>'), 'Units th should have text-left');
assert(indexHtml.includes('<th class="py-3 px-space-sm text-left whitespace-nowrap">Status</th>'), 'Status th should have text-left');
assert(indexHtml.includes('<th class="py-3 px-space-sm text-right rounded-r-lg whitespace-nowrap">Impact Certificate</th>'), 'Impact Certificate th should have text-right');
console.log('✓ TEST 1 PASSED: Table header alignment classes verified.\n');

console.log('--- TEST 2: Test rendering with older legacy data (missing center and type) ---');
const appJs = fs.readFileSync('js/app.js', 'utf-8');

// Mock escapeHtml
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Extract rendering logic from app.js
const renderExtract = appJs.substring(
  appJs.indexOf('historyTbody.innerHTML = dHistory.map(rec => {'),
  appJs.indexOf("}).join('');", appJs.indexOf('historyTbody.innerHTML = dHistory.map(rec => {')) + 12
);

// Test legacy record
const legacyRecords = [
  {
    "id": "DON-8841",
    "date": "14 Jun 2026",
    "units": "1 Unit (Whole Blood)",
    "hospital": "Apollo Hospitals, Indiranagar",
    "verified": true,
    "impact": "Emergency ICU Patient Stabilized"
  },
  {
    "id": "DON-7712",
    "date": "10 Mar 2026",
    "units": "1 Unit (Packed RBCs)",
    "hospital": "Manipal Blood Center, Old Airport Rd",
    "verified": true,
    "impact": "Surgical Hemostasis Support"
  }
];

// Evaluate rendering
let dHistory = legacyRecords;
let outputHtml = '';
eval('outputHtml = ' + renderExtract.replace('historyTbody.innerHTML = ', ''));

console.log('Generated Table HTML:\n', outputHtml);

assert(outputHtml.includes('Apollo Hospitals, Indiranagar'), 'Hospital column must be populated for legacy record 1');
assert(outputHtml.includes('Manipal Blood Center, Old Airport Rd'), 'Hospital column must be populated for legacy record 2');
assert(outputHtml.includes('Whole Blood'), 'Donation type column must be populated for legacy record 1');
assert(outputHtml.includes('Packed RBCs'), 'Donation type column must be populated for legacy record 2');
assert(!outputHtml.includes('><span class="inline-flex items-center px-2.5 py-1 rounded-lg bg-surface-container text-on-surface font-semibold text-xs border border-surface-container-high/60 shadow-2xs"></span><'), 'Empty type badge is forbidden');

assert(outputHtml.includes('text-left align-middle'), 'Row cells must have text-left align-middle');
assert(outputHtml.includes('text-right align-middle'), 'Certificate cell must have text-right align-middle');

console.log('✓ TEST 2 PASSED: Legacy data automatically fills Hospital / Center and Donation Type columns.\n');

console.log('--- TEST 3: Test rendering with new data schema ---');
const newRecords = [
  {
    "id": "DON-8841",
    "date": "14 Jun 2026",
    "hospital": "Apollo Hospitals Blood Centre, Indiranagar",
    "center": "Apollo Hospitals Blood Centre, Indiranagar",
    "type": "Whole Blood",
    "donationType": "Whole Blood",
    "units": "1 Unit (Whole Blood)",
    "subtext": "Blood Bank Resuscitation Wing • Verified",
    "verified": true,
    "impact": "Emergency ICU Patient Stabilized"
  }
];
dHistory = newRecords;
eval('outputHtml = ' + renderExtract.replace('historyTbody.innerHTML = ', ''));

assert(outputHtml.includes('Apollo Hospitals Blood Centre, Indiranagar'));
assert(outputHtml.includes('Whole Blood'));
assert(outputHtml.includes('Blood Bank Resuscitation Wing • Verified'));
console.log('✓ TEST 3 PASSED: New schema renders complete details and badges.\n');

console.log('ALL DONATION HISTORY TESTS COMPLETED SUCCESSFULLY! 🎉');

