const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('============================================================');
console.log('TEST: Verification that Blood Compatibility Pills are Non-Functional');
console.log('============================================================\n');

// 1. Inspect index.html
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// Check that no clickable-blood-pill remains in index.html
const pillMatches = html.match(/clickable-blood-pill/g);
console.log('[Check 1] Checking index.html for clickable-blood-pill...');
assert(!pillMatches, 'clickable-blood-pill should not exist in index.html');
console.log('  ✓ No clickable-blood-pill classes found in index.html');

// Check widget-can-donate-list has spans, not buttons
const donateListMatch = html.match(/<div id="widget-can-donate-list"[\s\S]*?<\/div>/);
assert(donateListMatch, 'widget-can-donate-list should exist in index.html');
assert(!donateListMatch[0].includes('<button'), 'widget-can-donate-list should not contain button tags');
assert(donateListMatch[0].includes('<span'), 'widget-can-donate-list should contain span tags');
assert(!donateListMatch[0].includes('onclick'), 'widget-can-donate-list should not have onclick attributes');
console.log('  ✓ widget-can-donate-list uses static <span> tags without onclick or button');

// Check widget-can-receive-list has spans, not buttons
const receiveListMatch = html.match(/<div id="widget-can-receive-list"[\s\S]*?<\/div>/);
assert(receiveListMatch, 'widget-can-receive-list should exist in index.html');
assert(!receiveListMatch[0].includes('<button'), 'widget-can-receive-list should not contain button tags');
assert(receiveListMatch[0].includes('<span'), 'widget-can-receive-list should contain span tags');
assert(!receiveListMatch[0].includes('onclick'), 'widget-can-receive-list should not have onclick attributes');
console.log('  ✓ widget-can-receive-list uses static <span> tags without onclick or button');

// Check "Click type to explore" was removed
assert(!html.includes('Click type to explore'), '"Click type to explore" should be removed');
console.log('  ✓ "Click type to explore" hint has been removed');

// 2. Inspect js/app.js
console.log('\n[Check 2] Checking js/app.js dynamic rendering...');
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

const appPillMatches = appJs.match(/clickable-blood-pill/g);
assert(!appPillMatches, 'clickable-blood-pill should not exist in js/app.js');
console.log('  ✓ No clickable-blood-pill classes found in js/app.js');

// Check donateListEl.innerHTML rendering in js/app.js
const donateRender = appJs.match(/donateListEl\.innerHTML\s*=\s*data\.donate\.map\([\s\S]*?\)\.join\(''\)/);
assert(donateRender, 'donateListEl.innerHTML mapping must exist in js/app.js');
assert(!donateRender[0].includes('<button'), 'donateListEl should not render buttons');
assert(donateRender[0].includes('<span'), 'donateListEl must render spans');
assert(!donateRender[0].includes('onclick'), 'donateListEl rendered spans must not have onclick');
console.log('  ✓ donateListEl renders static <span> elements without onclick or button');

// Check receiveListEl.innerHTML rendering in js/app.js
const receiveRender = appJs.match(/receiveListEl\.innerHTML\s*=\s*data\.receive\.map\([\s\S]*?\)\.join\(''\)/);
assert(receiveRender, 'receiveListEl.innerHTML mapping must exist in js/app.js');
assert(!receiveRender[0].includes('<button'), 'receiveListEl should not render buttons');
assert(receiveRender[0].includes('<span'), 'receiveListEl must render spans');
assert(!receiveRender[0].includes('onclick'), 'receiveListEl rendered spans must not have onclick');
console.log('  ✓ receiveListEl renders static <span> elements without onclick or button');

console.log('\n============================================================');
console.log('ALL NON-FUNCTIONAL BLOOD PILL CHECKS PASSED SUCCESSFULLY!');
console.log('============================================================');

