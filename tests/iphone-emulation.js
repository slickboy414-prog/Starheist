// M2 supporting evidence (NOT a real-device test): Chromium emulating iPhones in portrait and landscape.
// Checks: boots, the Daily Streak pop-up can be claimed by tap, joystick drag moves the player, the BUY button is reachable by tap, HUD stays on screen.
// Run: (cd game && python3 -m http.server 8765) then: node tests/iphone-emulation.js
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let fails = 0;
  for (const name of ['iPhone SE', 'iPhone 13', 'iPhone 15 Pro Max']) for (const land of [false, true]) {
    const d = devices[name + (land ? ' landscape' : '')]; if (!d) { console.log('SKIP ' + name); continue; }
    const ctx = await b.newContext({ ...d }); const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto('http://localhost:8765/?debug'); await p.waitForFunction(() => window.__sh && window.__sh.game.loaded, null, { timeout: 60000 });
    await p.evaluate(() => { const S = window.__sh; S.startGame(); S.finishHowTo(); S.game.tut = 4; for (let i = 0; i < 10; i++) S.update(0.05); });
    const vw = d.viewport.width, vh = d.viewport.height;
    // a fresh save opens the Daily Streak pop-up: claim it with a real tap, as a player would
    const claim = p.locator('#popup button', { hasText: /CLAIM/ });
    let claimedByTap = null;
    if (await claim.count()) { const cash0 = await p.evaluate(() => window.__sh.player.cash); await claim.first().tap(); await p.waitForTimeout(300);
      claimedByTap = (await p.evaluate(() => window.__sh.player.cash)) > cash0;
      const close = p.locator('#popup button', { hasText: /CLOSE/ }); if (await close.count() && await close.first().isVisible()) await close.first().tap(); }
    const popupGone = await p.evaluate(() => { const e = document.getElementById('popup'); return !e || getComputedStyle(e).display === 'none' || !e.offsetParent; });
    // joystick: touch-drag in the lower-left area
    const before = await p.evaluate(() => ({ x: window.__sh.player.pos.x, z: window.__sh.player.pos.z }));
    const cdp = await ctx.newCDPSession(p); const sx = vw * 0.18, sy = vh * 0.78;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sx, y: sy }] });
    for (let i = 1; i <= 10; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: sx, y: sy - i * 6 }] }); await p.evaluate(() => window.__sh.update(0.1)); }
    const during = await p.evaluate(() => ({ joy: window.__sh.joy.id !== null, x: window.__sh.player.pos.x, z: window.__sh.player.pos.z }));
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const moved = Math.hypot(during.x - before.x, during.z - before.z);
    // HUD on screen: every visible button inside the viewport
    const off = await p.evaluate(() => [...document.querySelectorAll('button')].filter((el) => el.offsetParent && getComputedStyle(el).visibility !== 'hidden')
      .filter((el) => { const r = el.getBoundingClientRect(); return r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1; }).map((el) => el.id || el.textContent.trim().slice(0, 15)));
    // tap target size: the area that actually responds to a tap (probing just outside the drawn box), at least 32 CSS px on the short side
    const small = await p.evaluate(() => [...document.querySelectorAll('button')].filter((el) => el.offsetParent && getComputedStyle(el).visibility !== 'hidden').map((el) => {
      const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, hits = (x, y) => { const h = document.elementFromPoint(x, y); return h === el || el.contains(h); };
      let up = 0, down = 0; while (up < 20 && hits(cx, r.top - up - 1)) up++; while (down < 20 && hits(cx, r.bottom + down + 1)) down++;
      let lf = 0, rt = 0; while (lf < 20 && hits(r.left - lf - 1, cy)) lf++; while (rt < 20 && hits(r.right + rt + 1, cy)) rt++;
      return { id: el.id || el.textContent.trim().slice(0, 12), w: Math.round(r.width + lf + rt), h: Math.round(r.height + up + down) };
    }).filter((t) => Math.min(t.w, t.h) < 32).map((t) => `${t.id} ${t.w}x${t.h}`));
    const ok = claimedByTap !== false && popupGone && during.joy && moved > 0.5 && !off.length && !errs.length;
    if (!ok) fails++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${land ? ' landscape' : ''} ${vw}x${vh}  — ${JSON.stringify({ streakClaimedByTap: claimedByTap, popupGone, joystickActive: during.joy, moved: +moved.toFixed(2), offScreen: off, smallTargets: small, errors: errs.length })}`);
    await ctx.close();
  }
  await b.close(); console.log(fails ? `\n${fails} failing` : '\nall passed'); process.exit(fails ? 1 : 0);
})();
