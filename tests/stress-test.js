// Star Heist destruction test suite
// Run: (cd game && python3 -m http.server 8765) then: node tests/stress-test.js   (needs: npm i playwright)
const { chromium, devices } = require('playwright');
const URL = 'http://localhost:8765/?debug';
const results = []; let failures = 0;
const ok = (name, pass, info = '') => { results.push(`${pass ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); if (!pass) failures++; };

// invariant checker injected into the page
const INV = `window.__inv = function () {
  const S = window.__sh, P = S.player, e = [];
  for (const a of [P, ...S.bots]) {
    if (!Number.isFinite(a.cash) || a.cash < 0) e.push('bad cash ' + a.name + '=' + a.cash);
    for (const k of ['x', 'y', 'z']) if (!Number.isFinite(a.pos[k])) e.push('bad pos ' + a.name);
    if (Math.abs(a.pos.x) > 95 || Math.abs(a.pos.z) > 80) e.push('out of world ' + a.name);
    if (a.carrying && a.carrying.carrier !== a) e.push('carry link broken ' + a.name);
  }
  const slotSeen = new Map();
  for (const c of S.celebs) {
    if (!Number.isFinite(c.pos.x) || !Number.isFinite(c.pos.y) || !Number.isFinite(c.pos.z)) e.push('bad celeb pos ' + c.def.name);
    if (!Number.isFinite(c.stored) || c.stored < 0) e.push('bad stored ' + c.def.name + '=' + c.stored + ' owner=' + (c.owner && c.owner.name) + ' state=' + c.state + ' inc=' + c.income);
    const s = c.state === 'carried' ? c.homeSlot : c.slot;
    if (c.state !== 'carpet') {
      if (!s) e.push('no slot ' + c.state + ' ' + c.def.name);
      else { if (s.celeb !== c) e.push('slot mismatch ' + c.state + ' ' + c.def.name); if (slotSeen.has(s)) e.push('two celebs in one slot'); slotSeen.set(s, c); }
    }
    if (c.state === 'carried' && (!c.carrier || c.carrier.carrying !== c)) e.push('carried w/o carrier');
    if (c.state === 'moving' && P.moveCeleb !== c) e.push('moving w/o mover');
  }
  for (const b of S.bases) for (const s of b.slots) if (s.celeb && !S.celebs.includes(s.celeb)) e.push('ghost celeb in slot');
  if (!Number.isFinite(S.game.t)) e.push('time NaN');
  return e;
};`;

async function boot(b, opts = {}) {
  const ctx = await b.newContext(opts.device || { viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|game_api|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  if (opts.init) await p.addInitScript(opts.init.fn, opts.init.arg);
  await p.goto(URL);
  const t0 = Date.now();
  let loaded = true;
  try { await p.waitForFunction(() => window.__sh && window.__sh.game.loaded, null, { timeout: 30000 }); } catch (e) { loaded = false; }
  const ms = Date.now() - t0;
  if (loaded) await p.evaluate(INV);
  return { ctx, p, errs, loaded, ms };
}

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

  // ---------------- 1. BOOT TESTS ----------------
  {
    const r = await boot(b);
    const ui = r.loaded && await r.p.evaluate(() => ({ btn: !document.getElementById('playBtn').disabled, celebs: window.__sh.celebs.length, bots: window.__sh.bots.length }));
    ok('Fresh boot', r.loaded && ui.btn && ui.bots === 5 && !r.errs.length, `ready in ${r.ms}ms, ${ui && ui.celebs} celebs on carpet`);
    await r.ctx.close();
  }
  const BAD_SAVES = {
    'garbage text': '%%%not json{{{',
    'empty string': '',
    'JSON null': 'null',
    'JSON array': '[1,2,3]',
    'JSON number': '12345',
    'wrong version': '{"v":99,"cash":5}',
    'wrong types everywhere': '{"v":1,"cash":"lots","up":{"speed":"x","slots":999},"rb":"9","pr":-5,"tut":"a","stats":7,"al":"x","ad":5,"st":"bad","mi":{"list":"bad"},"so":"maybe","lang":42,"hw":"y","br":"z","celebs":"no"}',
    'infinite / huge numbers': '{"v":1,"t":1e400,"cash":1e400,"rb":1e400,"pr":1e400,"up":{"star":1e400},"celebs":[{"d":0,"m":0,"s":0,"st":1e400}]}',
    'negative numbers': '{"v":1,"cash":-500,"rb":-3,"pr":-9,"up":{"speed":-4},"celebs":[{"d":0,"m":-1,"s":-5,"st":-99}]}',
    'invalid celeb ids': '{"v":1,"cash":10,"celebs":[{"d":99999},{"d":-1},{"d":"x"},{"d":null},{"d":0,"m":77,"s":999},{"d":3.7}]}',
    '500 celebs in save': JSON.stringify({ v: 1, cash: 10, celebs: Array.from({ length: 500 }, (_, i) => ({ d: i % 200, m: i % 4, s: i % 40, st: 5 })) }),
    'poisoned keys (__proto__)': '{"v":1,"cash":10,"__proto__":{"polluted":1},"al":{"__proto__":{"x":1},"constructor":1,"5":15},"st":{"__proto__":{"count":999}}}',
    'future timestamp': JSON.stringify({ v: 1, t: Date.now() + 9e12, cash: 50, celebs: [{ d: 0, m: 0, s: 0 }] }),
    'ancient timestamp (offline cap)': JSON.stringify({ v: 1, t: 1, cash: 50, rb: 10, up: { star: 10 }, celebs: Array.from({ length: 40 }, (_, i) => ({ d: 150 + (i % 8), m: 3, s: i })) }),
  };
  for (const [name, save] of Object.entries(BAD_SAVES)) {
    const r = await boot(b, { init: { fn: (s) => { try { localStorage.setItem('starheist_save_v1', s); } catch (e) {} }, arg: save } });
    let detail = '', good = r.loaded && !r.errs.length;
    if (r.loaded) {
      const st = await r.p.evaluate(() => { const S = window.__sh; S.startGame(); S.finishHowTo(); for (let i = 0; i < 300; i++) S.update(1 / 30); const P = S.player;
        return { cash: P.cash, rb: S.game.rebirth, owned: S.celebs.filter((c) => c.owner === P).length, inv: window.__inv(), polluted: ({}).polluted, offline: document.getElementById('popup').innerText.slice(0, 60) }; });
      good = good && st.inv.length === 0 && Number.isFinite(st.cash) && st.polluted === undefined;
      detail = `cash=${typeof st.cash === 'number' ? Math.round(st.cash) : st.cash}, rebirth=${st.rb}, celebs=${st.owned}` + (st.inv.length ? ' INVARIANTS: ' + st.inv.slice(0, 3).join('; ') : '');
    }
    ok('Corrupted save: ' + name, good, detail + (r.errs.length ? ' ERR: ' + r.errs[0] : '') + (r.loaded ? '' : ' did not finish loading'));
    await r.ctx.close();
  }
  {
    const r = await boot(b, { init: { fn: () => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); }, arg: null } });
    if (r.loaded) await r.p.evaluate(() => { window.__sh.startGame(); for (let i = 0; i < 100; i++) window.__sh.update(1 / 30); });
    ok('Boot with storage blocked (private mode)', r.loaded && !r.errs.length, r.errs[0] || '');
    await r.ctx.close();
  }
  for (const lang of ['es-MX', 'pt-BR', 'hi-IN', 'id-ID', 'zz-ZZ']) {
    const r = await boot(b, { device: { viewport: { width: 1280, height: 720 }, locale: lang } });
    const got = r.loaded && await r.p.evaluate(() => { window.__sh.startGame(); return document.querySelector('#menuBar small').textContent + ' / ' + document.documentElement.lang; });
    ok('Boot in language ' + lang, r.loaded && !r.errs.length, got || r.errs[0]);
    await r.ctx.close();
  }

  // ---------------- 2. YOUTUBE PLAYABLES SDK (mocked) ----------------
  for (const mode of ['normal', 'loadData fails', 'loadData hangs 3s']) {
    const init = { fn: (mode) => {
      const log = (window.__yt = { calls: [], saves: [], scores: [] });
      window.ytgame = { IN_PLAYABLES_ENV: true,
        game: { firstFrameReady() { log.calls.push('firstFrameReady'); }, gameReady() { log.calls.push('gameReady'); },
          loadData() { log.calls.push('loadData'); if (mode === 'loadData fails') return Promise.reject(new Error('net')); if (mode === 'loadData hangs 3s') return new Promise((r) => setTimeout(() => r(''), 3000)); return Promise.resolve(''); },
          saveData(s) { log.saves.push(s); return Promise.resolve(); } },
        system: { isAudioEnabled() { return false; }, onAudioEnabledChange(cb) { log.audioCb = cb; }, onPause(cb) { log.pause = cb; }, onResume(cb) { log.resume = cb; }, getLanguage() { return Promise.resolve('es-ES'); } },
        engagement: { sendScore(o) { log.scores.push(o); return Promise.resolve(); } },
        health: { logError() { log.calls.push('logError'); }, logWarning() { log.calls.push('logWarning'); } } };
    }, arg: mode };
    const r = await boot(b, { init });
    if (!r.loaded) { ok('YouTube SDK: ' + mode, false, 'did not load'); await r.ctx.close(); continue; }
    const yt = await r.p.evaluate(async () => {
      const S = window.__sh, y = window.__yt; S.startGame(); S.finishHowTo(); S.claimStreak();
      for (let i = 0; i < 60; i++) S.update(1 / 30);
      y.pause(); const tBefore = S.game.t; await new Promise((r) => setTimeout(r, 400)); const frozen = S.game.paused && S.game.t === tBefore;
      y.resume(); await new Promise((r) => setTimeout(r, 400)); const resumed = !S.game.paused && S.game.t > tBefore;
      y.audioCb && y.audioCb(true);
      S.player.cash = 123456.7; await new Promise((r) => setTimeout(r, 3500));
      const last = y.saves[y.saves.length - 1] || '';
      let parsed = null; try { parsed = JSON.parse(last); } catch (e) {}
      return { calls: y.calls, frozen, resumed, saves: y.saves.length, saveBytes: last.length, saveOk: !!parsed && parsed.v === 1, scores: y.scores.map((s) => s.value), lang: document.documentElement.lang };
    });
    const order = yt.calls.indexOf('firstFrameReady') > -1 && yt.calls.indexOf('gameReady') > yt.calls.indexOf('firstFrameReady');
    const scoresOk = yt.scores.every((v) => Number.isInteger(v) && v >= 0);
    ok('YouTube SDK: ' + mode, order && yt.frozen && yt.resumed && yt.saves > 0 && yt.saveOk && yt.saveBytes < 3 * 1024 * 1024 && scoresOk && !r.errs.length,
      `firstFrame→gameReady=${order}, pause freezes=${yt.frozen}, resume=${yt.resumed}, saves=${yt.saves} (${yt.saveBytes} bytes), scores=${JSON.stringify(yt.scores)}, lang=${yt.lang}${r.errs.length ? ' ERR ' + r.errs[0] : ''}`);
    await r.ctx.close();
  }

  // ---------------- 3. CHAOS FUZZ ----------------
  {
    const r = await boot(b);
    await r.p.evaluate(() => { const S = window.__sh; S.startGame(); });
    const memBefore = await r.p.evaluate(() => ({ ...window.__sh.renderer.info.memory, children: window.__sh.scene.children.length }));
    const sizes = [[390, 664], [1280, 720], [750, 342], [810, 1080], [320, 568], [1920, 1080]];
    let invFails = [], steps = 0;
    for (let round = 0; round < 12; round++) {
      await r.p.setViewportSize({ width: sizes[round % sizes.length][0], height: sizes[round % sizes.length][1] });
      const out = await r.p.evaluate((round) => {
        const S = window.__sh, P = S.player, G = S.game, bad = [];
        const KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'KeyF', 'KeyL', 'KeyQ', 'KeyM', 'KeyB', 'KeyR', 'KeyP', 'Escape', 'Space', 'Enter', 'ArrowUp'];
        const key = (code, type) => window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
        const tap = (el) => el && el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }));
        const rnd = (n) => Math.floor(Math.random() * n);
        for (let i = 0; i < 1500; i++) {
          const a = rnd(20);
          if (a < 6) { const k = KEYS[rnd(KEYS.length)]; key(k, 'keydown'); if (Math.random() < 0.7) key(k, 'keyup'); }
          else if (a < 9) { const btns = [...document.querySelectorAll('button')].filter((x) => x.offsetParent); tap(btns[rnd(btns.length)]); }
          else if (a === 9) { const t = [S.celebs[rnd(S.celebs.length)], null][rnd(2)]; if (t) { P.floor = t.floor || 0; P.stair = null; P.pos.set(t.pos.x + 1, t.pos.y, t.pos.z); } }
          else if (a === 10) { P.pos.set((Math.random() - 0.5) * 170, 0, (Math.random() - 0.5) * 130); P.floor = 0; P.stair = null; }
          else if (a === 11) { P.cash = [0, 1e3, 1e7, 1e13, 1e300][rnd(5)]; }
          else if (a === 12) { G.rebirth = rnd(11); S.refreshFloors(); }
          else if (a === 13 && Math.random() < 0.1) S.forceAdmin(0.5);
          else if (a === 14) { const ms = ['shop', 'rebirth', 'missions', 'album', 'fuse', 'pause', 'howto']; S.openModal(ms[rnd(ms.length)]); }
          else if (a === 15) S.closeModal();
          else if (a === 16 && S.bots.length) { const bt = S.bots[rnd(5)]; bt.cash = 1e9; if (S.botCanRebirth(bt)) S.botRebirth(bt); }
          else if (a === 17) { const c = S.celebs.find((x) => x.owner === P && x.state === 'placed'); if (c) { S.startMove(c); S.endMove(S.playerSlots()[rnd(S.playerSlots().length)]); } }
          else if (a === 18) { S.setLang(['en', 'es', 'pt', 'hi', 'id'][rnd(5)]); S.applyLangUI(); }
          S.update([1 / 60, 1 / 30, 0.05, 0.05, 0][rnd(5)]);
          if (i % 50 === 0) { const e = window.__inv(); if (e.length) bad.push(i + ': ' + e[0]); }
        }
        for (const k of KEYS) key(k, 'keyup');
        S.closeModal();
        return { bad: bad.slice(0, 3), celebs: S.celebs.length };
      }, round);
      steps += 1500; invFails.push(...out.bad);
    }
    await r.p.evaluate(() => { const S = window.__sh; for (let i = 0; i < 300; i++) S.update(1 / 30); S.renderer.render(S.scene, S.camera); });
    const memAfter = await r.p.evaluate(() => ({ ...window.__sh.renderer.info.memory, children: window.__sh.scene.children.length, celebs: window.__sh.celebs.length }));
    ok('Chaos fuzz (18,000 random actions, 6 screen sizes, all menus, languages, rebirths, events)', invFails.length === 0 && r.errs.length === 0,
      `${invFails.length} integrity problems${invFails.length ? ': ' + invFails.slice(0, 3).join(' | ') : ''}${r.errs.length ? ' ERRORS: ' + [...new Set(r.errs)].slice(0, 3).join(' | ') : ''}`);
    const growth = memAfter.geometries - memBefore.geometries, texGrowth = memAfter.textures - memBefore.textures;
    ok('Memory leak check after fuzz', memAfter.children - memBefore.children < 150 && texGrowth < 250 && memAfter.celebs < 260,
      `scene objects ${memBefore.children}→${memAfter.children}, geometries ${memBefore.geometries}→${memAfter.geometries}, textures ${memBefore.textures}→${memAfter.textures}, celebs alive ${memAfter.celebs}`);
    await r.ctx.close();
  }

  // ---------------- 4. LONG RUN + SPEED ----------------
  {
    const r = await boot(b);
    const out = await r.p.evaluate(() => {
      const S = window.__sh, P = S.player; S.startGame(); S.finishHowTo(); S.game.tut = 4; S.game.rebirth = 9; S.refreshFloors(); P.cash = 1e9;
      for (let i = 0; i < 40; i++) { const c = S.celebs.find((x) => x.state === 'carpet'); if (!c) { S.update(0.5); continue; } P.pos.set(c.pos.x, 0, c.pos.z); S.buy(P, c); }
      P.pos.set(-70, 0, -50);
      const bad = []; const t0 = performance.now(); const steps = 2 * 3600 * 20;
      for (let i = 0; i < steps; i++) { S.update(0.05); if (i % 2000 === 0) { const e = window.__inv(); if (e.length) bad.push(e[0]); } }
      const total = performance.now() - t0;
      const t1 = performance.now(); for (let i = 0; i < 300; i++) { S.update(1 / 60); S.renderer.render(S.scene, S.camera); } const frame = (performance.now() - t1) / 300;
      return { bad, perStep: total / steps, frame, celebs: S.celebs.length, owned: S.celebs.filter((c) => c.owner === P).length, botRb: S.bots.map((b) => b.rebirth || 0), cash: P.cash };
    });
    ok('Long run: 2 simulated hours, player with 40 celebs on 5 floors', out.bad.length === 0 && Number.isFinite(out.cash) && !r.errs.length,
      `bots rebirths ${out.botRb.join(',')}, celebs alive ${out.celebs}, player still owns ${out.owned}${out.bad.length ? ' INVARIANT: ' + out.bad[0] : ''}`);
    ok('Simulation speed', out.perStep < 4, `${out.perStep.toFixed(2)} ms per game-logic step; ${out.frame.toFixed(1)} ms per full frame in a software GPU (a real phone GPU is much faster)`);
    await r.ctx.close();
  }

  // ---------------- 5. RAPID LIFECYCLE ABUSE ----------------
  {
    const r = await boot(b, { device: devices['iPhone 13'] });
    const out = await r.p.evaluate(async () => {
      const S = window.__sh; S.startGame(); S.finishHowTo();
      for (let i = 0; i < 200; i++) { document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('resize')); window.dispatchEvent(new Event('orientationchange')); S.update(0.016); }
      for (let i = 0; i < 300; i++) { S.openModal(['shop', 'pause', 'album'][i % 3]); S.closeModal(); }
      let doubleStart = true; try { S.startGame(); S.startGame(); } catch (e) { doubleStart = false; }
      await new Promise((r) => setTimeout(r, 500));
      return { inv: window.__inv(), doubleStart, paused: S.game.paused };
    });
    ok('Rapid pause/resize/rotate/menu spam + double start', out.inv.length === 0 && out.doubleStart && !r.errs.length, out.inv[0] || r.errs[0] || '');
    await r.ctx.close();
  }

  await b.close();
  console.log(results.join('\n'));
  console.log(`\n${results.length - failures}/${results.length} passed`);
})();
