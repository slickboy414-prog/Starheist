// The title screen never shows LOADING: PLAY is tappable at once, an early tap starts the game when it is ready,
// and a copy that can't load its files (opened as a local file) says so instead of waiting forever.
// Run: (cd game && python3 -m http.server 8765) then: node tests/play-button.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const out = []; let fails = 0; const ok = (n, p, i) => { out.push(`${p ? 'PASS' : 'FAIL'}  ${n}  — ${JSON.stringify(i)}`); if (!p) fails++; };
  // 1. early tap: hold game.js back for 3 s, tap PLAY at once, the game must start by itself once loaded
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true }); const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.route('**/game.js', async (r) => { await new Promise((res) => setTimeout(res, 3000)); r.continue(); });
    await p.goto('http://localhost:8765/?debug', { waitUntil: 'domcontentloaded' });
    const btn = await p.evaluate(() => { const e = document.getElementById('playBtn'); return { text: e.textContent, disabled: e.disabled }; });
    await p.tap('#playBtn', { force: true });
    await p.waitForFunction(() => window.__sh && window.__sh.game.playing, null, { timeout: 60000 }).catch(() => {});
    const playing = await p.evaluate(() => !!(window.__sh && window.__sh.game.playing));
    ok('PLAY shows at once and an early tap starts the game when ready', /PLAY/.test(btn.text) && !btn.disabled && playing && !errs.length, { atFirstPaint: btn, startedByItself: playing });
    await ctx.close();
  }
  // 2. normal: tap after load
  {
    const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
    await p.goto('http://localhost:8765/?debug'); await p.waitForFunction(() => window.__sh && window.__sh.game.loaded, null, { timeout: 60000 });
    await p.click('#playBtn', { force: true }); const playing = await p.evaluate(() => window.__sh.game.playing);
    ok('a normal tap after loading starts the game', playing, { playing });
    await p.context().close();
  }
  // 3. opened as a local file: no endless LOADING, a clear message instead
  {
    const p = await (await b.newContext()).newPage();
    await p.goto('file://' + path.resolve(__dirname, '../dist/index.html'));
    await p.waitForFunction(() => document.getElementById('playBtn').disabled, null, { timeout: 25000 }).catch(() => {});
    const r = await p.evaluate(() => ({ btn: document.getElementById('playBtn').textContent, fine: document.getElementById('fine').textContent }));
    ok('a copy opened as a file explains it cannot load', /CAN'T LOAD/.test(r.btn) && /game link/.test(r.fine), r);
    await p.context().close();
  }
  await b.close(); console.log(out.join('\n') + `\n\n${out.length - fails}/${out.length} passed`); process.exit(fails ? 1 : 0);
})();
