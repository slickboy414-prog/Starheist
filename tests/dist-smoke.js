// Smoke test for the stripped upload build in dist/ (no test hook, so it is checked from outside).
// Run: node tools/build.js && (cd dist && python3 -m http.server 8766) then: node tests/dist-smoke.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/game_api|ERR_TUNNEL|Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.addInitScript(() => {
    const log = (window.__yt = { calls: [], saves: 0 });
    window.ytgame = { IN_PLAYABLES_ENV: true,
      game: { firstFrameReady() { log.calls.push('firstFrameReady'); }, gameReady() { log.calls.push('gameReady'); }, loadData() { return Promise.resolve(''); }, saveData() { log.saves++; return Promise.resolve(); } },
      system: { isAudioEnabled() { return true; }, onAudioEnabledChange() {}, onPause() {}, onResume() {}, getLanguage() { return Promise.resolve('en'); } },
      engagement: { sendScore() { return Promise.resolve(); } }, health: { logError() { log.calls.push('logError'); }, logWarning() {} } };
  });
  await p.goto('http://localhost:8766/?debug');
  await p.waitForFunction(() => window.__yt.calls.includes('gameReady'), null, { timeout: 30000 });
  await p.click('#playBtn', { force: true });
  // First play opens How to Play, which pauses the game; skip it like a player would, then let a save happen.
  await p.click('#howtoBody [data-ht="skip"]', { force: true });
  // The software GPU in CI renders slowly, so wait for the first save rather than a fixed time.
  await p.waitForFunction(() => window.__yt.saves > 0, null, { timeout: 25000 }).catch(() => {});
  const r = await p.evaluate(() => ({ calls: window.__yt.calls, saves: window.__yt.saves, hook: typeof window.__sh, hudShown: !document.getElementById('hud').classList.contains('hidden') }));
  await p.screenshot({ path: process.argv[2] || 'dist-smoke.png' });
  const pass = r.calls[0] === 'firstFrameReady' && r.calls.includes('gameReady') && !r.calls.includes('logError') && r.hook === 'undefined' && r.hudShown && r.saves > 0 && !errs.length;
  console.log(`${pass ? 'PASS' : 'FAIL'}  dist build boots in a mocked Playables session  — ${JSON.stringify(r)}${errs.length ? ' ERR ' + errs[0] : ''}`);
  await b.close(); process.exit(pass ? 0 : 1);
})();
