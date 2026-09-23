#!/usr/bin/env node
/**
 * Diffs the versions in the in-app changelog against those in CHANGELOG.md.
 *
 * Counting with a line-based regex is unreliable: an entry split across lines
 * is missed, and an unrelated object with a `v:` key is counted. This parses
 * the changelog array properly and compares the two version lists directly,
 * so you see exactly which versions differ rather than just a count.
 *
 *   node tools\diff-changelog.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const appFile = path.join(root, 'project-tracker.html');
const mdFile = path.join(root, 'CHANGELOG.md');

for (const f of [appFile, mdFile]) {
  if (!fs.existsSync(f)) { console.error('Not found: ' + f); process.exit(1); }
}
const src = fs.readFileSync(appFile, 'utf8');
const md = fs.readFileSync(mdFile, 'utf8');

/* Same extraction the generator uses. */
function extractChangelogArray(text) {
  const anchor = text.indexOf('major:');
  if (anchor < 0) throw new Error('No changelog data found (no "major:" key).');
  let depth = 0, start = -1;
  for (let i = anchor; i >= 0; i--) {
    const c = text[i];
    if (c === ']' || c === '}') depth++;
    else if (c === '[') { if (depth === 0) { start = i; break; } depth--; }
    else if (c === '{') { if (depth > 0) depth--; }
  }
  if (start < 0) throw new Error('Could not find the start of the changelog array.');
  let d = 0, inStr = null, esc = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (esc) { esc = false; continue; }
    if (inStr) { if (c === '\\') esc = true; else if (c === inStr) inStr = null; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '[') d++;
    else if (c === ']') { d--; if (d === 0) return text.slice(start, i + 1); }
  }
  throw new Error('Unbalanced brackets in the changelog array.');
}

let data;
try {
  data = vm.runInNewContext('(' + extractChangelogArray(src) + ')', Object.create(null), { timeout: 2000 });
} catch (e) {
  console.error('Could not parse the changelog array: ' + e.message);
  process.exit(1);
}

/* Versions actually present in the app data. */
const appVersions = [];
const groups = [];
for (const g of data) {
  const rels = (g.releases || g.items || []).map(r => r.v || r.version).filter(Boolean);
  groups.push({ major: g.major || '(unnamed)', count: rels.length });
  appVersions.push(...rels);
}

/* Versions present as headings in the markdown. */
const mdVersions = [...md.matchAll(/^### v([\d.]+)/gm)].map(m => m[1]);

/* The naive line-based regex, for comparison. */
const naive = (src.match(/\{\s*v:\s*"[\d.]+"/g) || []).length;

console.log('Version groups in the app file:');
groups.forEach(g => console.log('   ' + g.major + ': ' + g.count + ' release(s)'));
console.log('');
console.log('  parsed from app data : ' + appVersions.length);
console.log('  headings in CHANGELOG: ' + mdVersions.length);
console.log('  naive line regex     : ' + naive + '   <- unreliable, for reference only');
console.log('');

const appSet = new Set(appVersions);
const mdSet = new Set(mdVersions);

const missingFromMd = appVersions.filter(v => !mdSet.has(v));
const extraInMd = mdVersions.filter(v => !appSet.has(v));

const dupOf = arr => {
  const seen = new Set(), dup = new Set();
  arr.forEach(v => (seen.has(v) ? dup.add(v) : seen.add(v)));
  return [...dup];
};
const appDupes = dupOf(appVersions);
const mdDupes = dupOf(mdVersions);

let problems = 0;
if (missingFromMd.length) { problems++; console.log('In the app but MISSING from CHANGELOG.md:\n   ' + missingFromMd.join(', ') + '\n'); }
if (extraInMd.length)     { problems++; console.log('In CHANGELOG.md but NOT in the app data:\n   ' + extraInMd.join(', ') + '\n'); }
if (appDupes.length)      { problems++; console.log('Duplicate version entries in the app data:\n   ' + appDupes.join(', ') + '\n'); }
if (mdDupes.length)       { problems++; console.log('Duplicate headings in CHANGELOG.md:\n   ' + mdDupes.join(', ') + '\n'); }

if (!problems) {
  console.log('MATCH - every version in the app appears exactly once in CHANGELOG.md.');
  if (naive !== appVersions.length) {
    console.log('');
    console.log('Note: the naive regex reports ' + naive + ' rather than ' + appVersions.length + '.');
    console.log('That is the regex being wrong, not the changelog. It misses entries');
    console.log('split across lines and counts unrelated objects with a "v:" key.');
  }
  process.exit(0);
}
process.exit(1);
