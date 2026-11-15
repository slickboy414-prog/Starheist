// star-heist-standalone.html works when opened as a local file (no server), like a copy opened from Files or Drive on a phone.
// Run: node tools/build.js && node tools/build-standalone.js && node tests/standalone.js
const { chromium, devices } = require('playwright'), path = require('path');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ ...devices['Pixel 7'] }); const p = await ctx.newPage(); const errs = [], net = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) net.push(r.url()); });
  await p.goto('file://' + path.resolve(__dirname, '../star-heist-standalone.html'));
  const first = await p.evaluate(() => document.getElementById('playBtn').textContent);
  await p.waitForFunction(() => window.__starLoaded, null, { timeout: 60000 }).catch(() => {});
  await p.tap('#playBtn', { force: true }); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => ({ titleHidden: document.getElementById('title').classList.contains('hidden'), hudShown: !document.getElementById('hud').classList.contains('hidden'), cash: document.getElementById('cash').textContent }));
  await p.screenshot({ path: path.resolve(__dirname, '../review/standalone-phone.png') });
  const pass = /PLAY/.test(first) && r.titleHidden && r.hudShown && !errs.length && !net.length;
  console.log(`${pass ? 'PASS' : 'FAIL'}  standalone file opens and plays on a phone with no server  — ${JSON.stringify({ firstButton: first, ...r, pageErrors: errs, outsideRequests: net })}`);
  await b.close(); process.exit(pass ? 0 : 1);
})();
