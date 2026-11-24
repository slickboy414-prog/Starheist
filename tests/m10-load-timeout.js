// m10: inside YouTube, a loadData that never answers must not hang the game or show the "CAN'T LOAD" fallback.
// Run: (cd game && python3 -m http.server 8765) then: node tests/m10-load-timeout.js
const { chromium } = require('playwright');
const BASE = process.env.SH_BASE || 'http://localhost:8765';
const ARGS = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
const out = []; let fails = 0;
const ok = (n, p, i) => { out.push(`${p ? 'PASS' : 'FAIL'}  ${n}  — ${JSON.stringify(i)}`); if (!p) fails++; };
function ytHang() {
  const log = (window.__yt = { calls: [], loadCalls: 0, saveCalls: 0 });
  window.ytgame = { IN_PLAYABLES_ENV: true,
    game: { firstFrameReady() { log.calls.push('firstFrameReady'); }, gameReady() { log.calls.push('gameReady'); },
      loadData() { log.loadCalls++; return new Promise(() => {}); },          // never answers
      saveData() { log.saveCalls++; return Promise.resolve(); } },
    system: { isAudioEnabled() { return true; }, onAudioEnabledChange() {}, onPause() {}, onResume() {},
      getLanguage() { return new Promise(() => {}); } },                    // never answers either
    engagement: { sendScore() { return Promise.resolve(); } }, health: { logError() {}, logWarning() {} } };
}
(async () => {
  const b = await chromium.launch(ARGS);
  // 1. YouTube, loadData and getLanguage never answer
  {
    const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.addInitScript(ytHang);
    const t0 = Date.now();
    await p.goto(BASE + '/?debug');
    await p.waitForFunction(() => window.__sh && window.__sh.game.loaded, null, { timeout: 15000 }).catch(() => {});
    const loadedAfter = (Date.now() - t0) / 1000;
    const r = await p.evaluate(async () => {
      const S = window.__sh; if (!S || !S.game.loaded) return { loaded: false };
      document.getElementById('playBtn').click(); S.finishHowTo(); for (let i = 0; i < 20; i++) S.update(0.05);
      S.player.cash += 5; await S.doSave(); await new Promise((r) => setTimeout(r, 300));
      const text = document.body.innerText;
      return { loaded: true, playing: S.game.playing, saveBlocked: S.game.saveBlocked, warned: /couldn.t be loaded|could not load|can.t be saved|cannot be saved/i.test(text),
        loadCalls: window.__yt.loadCalls, saveCalls: window.__yt.saveCalls, calls: window.__yt.calls, cantLoad: /CAN.T LOAD|game link instead/i.test(text) };
    });
    // still no CAN'T LOAD after the 20 s fallback would have fired
    await p.waitForTimeout(Math.max(0, 21000 - (Date.now() - t0)));
    const late = await p.evaluate(() => ({ btn: document.getElementById('playBtn').textContent, cantLoad: /CAN.T LOAD|game link instead/i.test(document.body.innerText) }));
    const order = r.calls ? r.calls.indexOf('firstFrameReady') : -1;
    ok('m10 loadData never answers: playable within 15 s, warned, 0 saveData, firstFrameReady before gameReady, no CAN\'T LOAD',
      r.loaded && loadedAfter <= 15 && r.playing && r.saveBlocked && r.warned && r.loadCalls === 3 && r.saveCalls === 0 &&
      order === 0 && r.calls[1] === 'gameReady' && !r.cantLoad && !late.cantLoad && !errs.length,
      { loadedAfterSeconds: +loadedAfter.toFixed(1), ...r, after21s: late, pageErrors: errs });
    await p.context().close();
  }
  // 2. Outside YouTube: the fallback fires, then the game finishes loading anyway, so the normal title comes back
  {
    const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
    await p.route('**/game.js', async (r) => { await new Promise((res) => setTimeout(res, 24000)); r.continue(); });
    await p.goto(BASE + '/?debug', { waitUntil: 'commit' }); // not domcontentloaded: that waits for the held-back game.js
    await p.waitForFunction(() => { const e = document.getElementById('playBtn'); return !!e && /CAN.T LOAD/.test(e.textContent); }, null, { timeout: 25000 }).catch(() => {});
    const during = await p.evaluate(() => (document.getElementById('playBtn') || {}).textContent || '');
    await p.waitForFunction(() => window.__sh && window.__sh.game.loaded, null, { timeout: 60000 });
    const after = await p.evaluate(() => { const b = document.getElementById('playBtn'), f = document.getElementById('fine');
      return { btn: b.textContent, disabled: b.disabled, fine: f.textContent, fineColor: f.style.color }; });
    ok('m10 outside YouTube: a late load restores the PLAY button and the normal footer',
      /CAN.T LOAD/.test(during) && /PLAY/.test(after.btn) && !after.disabled && /fictional/.test(after.fine) && after.fineColor === '', { during, after });
    await p.context().close();
  }
  await b.close(); console.log(out.join('\n') + `\n\n${out.length - fails}/${out.length} passed`); process.exit(fails ? 1 : 0);
})();
