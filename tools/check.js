#!/usr/bin/env node
/**
 * Pre-commit checks for project-tracker.html.
 *
 * There is no build step, so nothing else catches a stray brace or a
 * mistyped element id - both fail silently at runtime. Run before pushing:
 *
 *   node tools\check.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const file = process.argv[2] || path.join(__dirname, '..', 'project-tracker.html');
if (!fs.existsSync(file)) {
  console.error('Not found: ' + file);
  process.exit(1);
}
const src = fs.readFileSync(file, 'utf8');
let failures = 0;

const pass = m => console.log('  PASS  ' + m);
const fail = m => { console.error('  FAIL  ' + m); failures++; };

/* 1. Every script block must parse. One bad brace kills the whole app. */
const blocks = [...src.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let bad = 0;
blocks.forEach((code, i) => {
  try { new vm.Script(code, { filename: 'block' + i }); }
  catch (e) { fail('script block ' + i + ': ' + e.message); bad++; }
});
if (!bad) pass(blocks.length + ' script blocks parse cleanly');

/* 2. The three version locations must agree. */
const constV = (src.match(/const APP_VERSION\s*=\s*"([\d.]+)"/) || [])[1];
const badgeV = (src.match(/id="verBadge"[^>]*>v([\d.]+)</) || [])[1];
const logV   = (src.match(/\{\s*v:\s*"([\d.]+)"/) || [])[1];
if (constV && constV === badgeV && constV === logV) {
  pass('version ' + constV + ' consistent across constant, badge and changelog');
} else {
  fail('version mismatch - constant=' + constV + ', badge=' + badgeV + ', changelog=' + logV);
}

/* 3. Every getElementById target must exist in the markup.
      A wrong id returns null and the guard skips it silently - this is how
      the v6.44 import bug survived. Elements built at runtime are listed. */
const RUNTIME_IDS = ['colViewStyle', 'persistBanner', 'persistBannerX', 'reassignSel', 'emptyImport', 'clearF', 'clearIssueF'];
const ids = new Set([...src.matchAll(/id="([A-Za-z0-9_-]+)"/g)].map(m => m[1]));
const refs = [...new Set([...src.matchAll(/getElementById\("([A-Za-z0-9_-]+)"\)/g)].map(m => m[1]))];
const unresolved = refs.filter(r => !ids.has(r) && RUNTIME_IDS.indexOf(r) < 0);
unresolved.length
  ? fail('getElementById targets with no matching element: ' + unresolved.join(', '))
  : pass(refs.length + ' element references all resolve');

/* 4. Undecoded escapes must not leak into the markup (regression from v6.2/6.16). */
const markup = src.replace(/<script>[\s\S]*?<\/script>/g, '').replace(/<style>[\s\S]*?<\/style>/g, '');
const escapes = markup.match(/\\u[0-9a-fA-F]{4}/g) || [];
escapes.length
  ? fail(escapes.length + ' raw \\uXXXX escape(s) visible in markup: ' + [...new Set(escapes)].join(', '))
  : pass('no undecoded escapes in markup');

/* 5. Storage writes must still be verified by reading them back (v6.41). */
(src.includes('localStorage.getItem(STORAGE_KEY)') && src.includes('lsFailed'))
  ? pass('storage write-verification present')
  : fail('save() no longer verifies its write by reading it back');

/* 6. Destructive paths must snapshot first. */
(src.match(/await pushBackup\(\)/g) || []).length >= 4
  ? pass('destructive paths take a snapshot first')
  : fail('fewer pushBackup() calls than expected - a destructive path may be unguarded');

console.log(failures ? '\n' + failures + ' check(s) failed.' : '\nAll checks passed.');
process.exit(failures ? 1 : 0);
