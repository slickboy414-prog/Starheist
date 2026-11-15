// m9: in every language, no button or HUD label text is cut off (text wider than its box).
// Run: (cd game && python3 -m http.server 8765) then: node tests/i18n-layout.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let fails = 0;
  for (const vp of [{ width: 390, height: 844, name: 'phone portrait' }, { width: 1280, height: 720, name: 'desktop' }]) {
    const p = await (await b.newContext({ viewport: vp, hasTouch: vp.width < 500 })).newPage(); const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto('http://localhost:8765/?debug'); await p.waitForFunction(() => window.__sh && window.__sh.game.loaded, null, { timeout: 60000 });
    await p.evaluate(() => { const S = window.__sh; S.startGame(); S.finishHowTo(); S.game.tut = 4; });
    for (const lang of ['en', 'es', 'pt', 'hi', 'id']) {
      const cut = await p.evaluate((lang) => {
        const S = window.__sh; S.setLang(lang); S.applyLangUI(); for (let i = 0; i < 5; i++) S.update(0.05);
        const bad = (el) => { const r = el.getBoundingClientRect();
          return el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2 || r.left < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1; };
        const els = [...document.querySelectorAll('button, .btn, [class*="btn"], #hud *')].filter((el) => {
          const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || !el.offsetParent || el.clientWidth === 0) return false;
          return [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        });
        // self-check: the detector must fire on a deliberately oversized label, or this test proves nothing
        const probe = els.find((el) => el.tagName === 'BUTTON') || els[0]; const tn = [...probe.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
        const keep = tn.textContent; tn.textContent = 'W'.repeat(300); const fires = bad(probe); tn.textContent = keep;
        if (!fires) return ['SELF-CHECK FAILED: detector did not fire on a 300-character label'];
        return els.filter(bad).map((el) => `${el.id || el.className}: "${el.textContent.trim().slice(0, 40)}" ${el.scrollWidth}x${el.scrollHeight} in ${el.clientWidth}x${el.clientHeight}`).concat(`(checked ${els.length} labels)`).filter((x, i, a) => !(x.startsWith('(checked') && a.length > 1 && i === a.length - 1) || a.length === 1);
      }, lang);
      const info = cut.filter((x) => x.startsWith('(checked')); const bads = cut.filter((x) => !x.startsWith('(checked'));
      console.log(`${bads.length ? 'FAIL' : 'PASS'}  ${vp.name} ${lang}  ${info.join('')}${bads.length ? '  — ' + bads.join(' | ') : ''}`); if (bads.length) fails++;
    }
    if (errs.length) { console.log('page errors: ' + errs.join('; ')); fails++; }
    await p.context().close();
  }
  await b.close(); console.log(fails ? `\n${fails} failing` : '\nall passed'); process.exit(fails ? 1 : 0);
})();
