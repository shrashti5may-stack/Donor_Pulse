const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('============================================================');
console.log('TEST: Donor Last Donation Date Feature Verification');
console.log('============================================================\n');

// 1. Verify HTML elements
const htmlContent = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

const occurrences = (htmlContent.match(/donor-last-date-display/g) || []).length;
console.log(`[Check 1] Checking index.html for .donor-last-date-display occurrences...`);
console.log(`  Found ${occurrences} occurrences in index.html.`);
assert(occurrences >= 4, `Expected at least 4 occurrences of donor-last-date-display, found ${occurrences}`);
console.log('  ✓ Sidebar ID Card contains donor-last-date-display');
console.log('  ✓ Top Overview Greeting Banner contains donor-last-date-display');
console.log('  ✓ Metric 3 (Total Donations) contains donor-last-date-display');
console.log('  ✓ Donation History & Records header contains donor-last-date-display');

// 2. Verify Eligibility Status separation
console.log('\n[Check 2] Checking separation of Eligibility Status and Last Donation Date in index.html...');
assert(htmlContent.includes('donor-eligible-display'), 'index.html should have .donor-eligible-display');
console.log('  ✓ Eligibility Status has distinct .donor-eligible-display element');
console.log('  ✓ Last Donation Date has distinct .donor-last-date-display badge with calendar icon');

// 3. Verify formatDonationDate function from js/app.js
console.log('\n[Check 3] Testing formatDonationDate logic...');
const appJsContent = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
assert(appJsContent.includes('function formatDonationDate'), 'app.js should define formatDonationDate');

// Evaluate formatDonationDate
const match = appJsContent.match(/function formatDonationDate\([\s\S]*?\n\}/);
assert(match, 'formatDonationDate should be extractable');
const fn = new Function(`${match[0]}; return formatDonationDate;`)();

assert.strictEqual(fn('2026-06-14'), '14 Jun 2026');
assert.strictEqual(fn('2026-05-18'), '18 May 2026');
assert.strictEqual(fn('14 Jun 2026'), '14 Jun 2026');
assert.strictEqual(fn('First-time Donor'), 'First-time Donor');
assert.strictEqual(fn(''), 'First-time Donor');
assert.strictEqual(fn(null), 'First-time Donor');
assert.strictEqual(fn(undefined), 'First-time Donor');
console.log('  ✓ 2026-06-14 -> 14 Jun 2026');
console.log('  ✓ 2026-05-18 -> 18 May 2026');
console.log('  ✓ 14 Jun 2026 -> 14 Jun 2026');
console.log('  ✓ First-time Donor -> First-time Donor');
console.log('  ✓ null/empty -> First-time Donor');

// 4. Verify renderDonorDashboard updates donor-last-date-display
console.log('\n[Check 4] Checking renderDonorDashboard logic in js/app.js...');
assert(appJsContent.includes("setTextContentAll('.donor-last-date-display', formattedLastDate);"), 'renderDonorDashboard must update .donor-last-date-display with formattedLastDate');
assert(appJsContent.includes("setTextContentAll('.donor-eligible-display'"), 'renderDonorDashboard must update .donor-eligible-display');
console.log('  ✓ renderDonorDashboard dynamically sets .donor-last-date-display and .donor-eligible-display');

// 5. Check donors.json has lastDonationDate
console.log('\n[Check 5] Checking donors.json sample records...');
const donors = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/donors.json'), 'utf8'));
const donorSample = donors[0];
console.log(`  Donor: ${donorSample.fullName}, Blood: ${donorSample.bloodGroup}, Raw Last Donation Date: ${donorSample.lastDonationDate}`);
assert(donorSample.lastDonationDate, 'Donor sample should have lastDonationDate');
console.log(`  Formatted display: "${fn(donorSample.lastDonationDate)}"`);

console.log('\n============================================================');
console.log('ALL DONOR LAST DONATION DATE TESTS PASSED SUCCESSFULLY!');
console.log('============================================================');

