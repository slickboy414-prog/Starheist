// Builds the YouTube upload: copies game/ to dist/, removes the ?debug test hook, and zips dist/.
// Run from the repo root: node tools/build.js
// The game/ folder keeps the hook so the test suites can drive the game.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'game');
const DIST = path.join(ROOT, 'dist');
const ZIP = path.join(ROOT, 'star-heist-playables.zip');
const FILES = ['index.html', 'game.js', 'content.js', 'i18n.js', 'three.module.min.js', 'three.core.min.js'];
const LIMIT = 512 * 1024; // Playables recommends files under 512 KiB

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST);
for (const f of FILES) fs.copyFileSync(path.join(SRC, f), path.join(DIST, f));

// Strip the test hook: the comment line and the one line that defines window.__sh.
const gp = path.join(DIST, 'game.js');
const lines = fs.readFileSync(gp, 'utf8').split('\n');
const kept = lines.filter((l) => !l.startsWith('// test hook (only with ?debug)') && !l.startsWith("if (location.search.includes('debug')) window.__sh"));
if (lines.length - kept.length !== 2) throw new Error(`Expected to remove 2 hook lines, removed ${lines.length - kept.length}`);
fs.writeFileSync(gp, kept.join('\n'));
for (const f of FILES) {
  const txt = fs.readFileSync(path.join(DIST, f), 'utf8');
  if (/__sh\b/.test(txt)) throw new Error(`Test hook still present in ${f}`);
}

let total = 0;
for (const f of FILES) {
  const size = fs.statSync(path.join(DIST, f)).size; total += size;
  console.log(`${f.padEnd(22)} ${String(size).padStart(8)} bytes${size > LIMIT ? '  OVER 512 KiB' : ''}`);
}
console.log(`total                  ${String(total).padStart(8)} bytes`);

fs.rmSync(ZIP, { force: true });
execFileSync('zip', ['-q', '-9', ZIP, ...FILES], { cwd: DIST });
console.log(`wrote ${path.relative(ROOT, ZIP)} (${fs.statSync(ZIP).size} bytes)`);
