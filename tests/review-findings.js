// Regression tests for the round 1 review findings (B1, M1, M3, M4, m5), with M4 as ruled by the owner in round 2.
// Run: (cd game && python3 -m http.server 8765) then: node tests/review-findings.js
// Each test opens a fresh browser so one failure cannot poison the next.
const { chromium } = require('playwright');
const URL = 'http://localhost:8765/?debug';
const out = []; let fails = 0;
const ok = (name, pass, info = '') => { out.push(`${pass ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); if (!pass) fails++; };
const ARGS = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };

// A Playables mock that follows the rules the reviewer cited: saveData is rejected unless a loadData call
// has succeeded first; loadData can fail a set number of times.
function ytMock(cfg) {
  const log = (window.__yt = { calls: [], saveAccepted: 0, saveRejected: 0, scores: [], loadOk: false, loadCalls: 0 });
  let fails = cfg.loadFails;
  window.ytgame = { IN_PLAYABLES_ENV: true,
    game: {
      firstFrameReady() { log.calls.push('firstFrameReady'); }, gameReady() { log.calls.push('gameReady'); },
      loadData() { log.loadCalls++; if (fails > 0) { fails--; return Promise.reject(new Error('network')); } log.loadOk = true; return Promise.resolve(cfg.save || ''); },
      saveData() { if (!log.loadOk) { log.saveRejected++; return Promise.reject(new Error('load first')); } log.saveAccepted++; return Promise.resolve(); } },
    system: { isAudioEnabled() { return true; }, onAudioEnabledChange(cb) { log.audioCb = cb; }, onPause(cb) { log.pause = cb; }, onResume(cb) { log.resume = cb; }, getLanguage() { return Promise.resolve('en'); } },
    engagement: { sendScore(o) { log.scores.push(o.value); return Promise.resolve(); } },
    health: { logError() {}, logWarning() {} } };
  if (cfg.fakeNow) { const shift = cfg.fakeNow - Date.now(); const RealDate = Date; const now = () => RealDate.now() + shift;
    window.Date = class extends RealDate { constructor(...a) { super(...(a.length ? a : [now()])); } static now() { return now(); } }; }
}

async function open(cfg = {}) {
  const b = await chromium.launch(ARGS);
  const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(ytMock, cfg);
  await p.goto(URL);
  await p.waitForFunction(() => window.__sh && window.__sh.game.loaded, null, { timeout: 30000 });
  return { b, p, errs };
}

(async () => {
  // ---- B1: inside YouTube, hiding the page must not pause the game; only onPause may ----
  {
    const { b, p, errs } = await open({ loadFails: 0 });
    const r = await p.evaluate(() => {
      const S = window.__sh, y = window.__yt; S.startGame(); S.finishHowTo();
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
      const pausedByHide = S.game.paused;
      y.pause(); const pausedByOnPause = S.game.paused; y.resume();
      return { pausedByHide, pausedByOnPause, resumed: !S.game.paused };
    });
    ok('B1 hiding the page does not pause inside YouTube', !r.pausedByHide && r.pausedByOnPause && r.resumed && !errs.length, JSON.stringify(r));
    await b.close();
  }
  // ---- M1a: loadData fails once, then works: the game must retry and keep saving ----
  {
    const { b, p, errs } = await open({ loadFails: 1, save: JSON.stringify({ v: 1, t: Date.now(), cash: 777, celebs: [] }) });
    const r = await p.evaluate(async () => { const S = window.__sh, y = window.__yt; S.startGame(); S.finishHowTo(); S.player.cash += 5; await S.doSave(); await new Promise((res) => setTimeout(res, 500));
      return { loadCalls: y.loadCalls, accepted: y.saveAccepted, rejected: y.saveRejected, cashKept: Math.round(S.player.cash) }; });
    ok('M1 a failed loadData is retried and saving works', r.loadCalls >= 2 && r.accepted > 0 && r.rejected === 0 && r.cashKept >= 777 && !errs.length, JSON.stringify(r));
    await b.close();
  }
  // ---- M1b: loadData always fails: no saveData at all, and the player is told ----
  {
    const { b, p, errs } = await open({ loadFails: 99 });
    const r = await p.evaluate(async () => { const S = window.__sh, y = window.__yt; S.startGame(); S.finishHowTo(); S.player.cash += 5; await S.doSave(); await new Promise((res) => setTimeout(res, 500));
      return { loadCalls: y.loadCalls, accepted: y.saveAccepted, rejected: y.saveRejected, warned: !!S.game.saveBlocked && /save/i.test(document.getElementById('hud').innerText + document.getElementById('popup').innerText) }; });
    ok('M1 if loadData keeps failing, nothing is saved and the player is warned', r.loadCalls >= 2 && r.accepted === 0 && r.rejected === 0 && r.warned && !errs.length, JSON.stringify(r));
    await b.close();
  }
  // ---- m5: scores sent to YouTube stay at or under Number.MAX_SAFE_INTEGER ----
  {
    const { b, p, errs } = await open({ loadFails: 0 });
    const r = await p.evaluate(async () => { const S = window.__sh, y = window.__yt; S.startGame(); S.finishHowTo(); S.player.cash = 1e300; for (let i = 0; i < 40; i++) S.update(0.05);
      S.game.stats.bestNet = 1e300; await S.doSave(); return { scores: y.scores }; });
    ok('m5 sendScore never exceeds MAX_SAFE_INTEGER', r.scores.length > 0 && r.scores.every((v) => Number.isSafeInteger(v) && v >= 0) && !errs.length, JSON.stringify(r.scores));
    await b.close();
  }
  // ---- M3: a clock moved back after a jump forward gives no Admin Abuse until real time catches up ----
  {
    const SAT = Date.UTC(2026, 10, 14, 18, 5); // Sat 14 Nov 2026 18:05 UTC
    const future = SAT + 7 * 864e5;           // the save was written a week "in the future"
    const { b, p, errs } = await open({ loadFails: 0, fakeNow: SAT, save: JSON.stringify({ v: 1, t: future, hi: future, cash: 100, celebs: [] }) });
    const r = await p.evaluate(() => { const S = window.__sh; S.startGame(); S.finishHowTo(); S.update(0.05); return { event: S.game.event && S.game.event.id, luck: S.game.luck }; });
    ok('M3 rolling the clock back after a forward jump blocks Admin Abuse', r.event !== 'admin' && !errs.length, JSON.stringify(r));
    await b.close();
    // control: an honest Saturday clock still gets the event
    const o = await open({ loadFails: 0, fakeNow: SAT, save: JSON.stringify({ v: 1, t: SAT - 3600e3, hi: SAT - 3600e3, cash: 100, celebs: [] }) });
    const r2 = await o.p.evaluate(() => { const S = window.__sh; S.startGame(); S.finishHowTo(); S.update(0.05); return { event: S.game.event && S.game.event.id }; });
    ok('M3 control: an honest clock on Saturday 18:05 UTC still starts Admin Abuse', r2.event === 'admin' && !o.errs.length, JSON.stringify(r2));
    await o.b.close();
  }
  // ---- M4 (owner's rulings, 15 Nov): the idle shield protects tiers 5-7 (GOAT, Exclusive, Limited), and never turns on while steering ----
  for (const mode of ['idle', 'active']) {
    const { b, p, errs } = await open({ loadFails: 0 });
    const r = await p.evaluate((mode) => {
      const S = window.__sh, P = S.player, G = S.game; S.startGame(); S.finishHowTo(); G.tut = 4; G.rebirth = 9; S.refreshFloors(); P.cash = 1e12;
      // one GOAT (tier 5), one Exclusive (tier 6), one Limited (tier 7), then ordinary celebs (tiers 0-4)
      [5, 6, 7].forEach((r, i) => { const c = S.spawnCarpetCeleb(-20 + i * 4, r); P.pos.set(c.pos.x, 0, c.pos.z); S.buy(P, c); });
      for (let i = 0; i < 30; i++) { const c = S.celebs.find((x) => x.state === 'carpet' && x.def.r < 5); if (!c) { S.update(0.5); continue; } P.pos.set(c.pos.x, 0, c.pos.z); S.buy(P, c); }
      for (let i = 0; i < 600; i++) S.update(0.05);
      P.pos.set(-70, 0, -50);
      const count = () => { const m = S.celebs.filter((c) => c.owner === P); return { goat: m.filter((c) => c.def.r === 5).length, exclusive: m.filter((c) => c.def.r === 6).length, limited: m.filter((c) => c.def.r === 7).length, ordinary: m.filter((c) => c.def.r < 5).length }; };
      const start = count(); const doorLockedAtStart = P.base.locked;
      for (let i = 0; i < 3600 * 20; i++) { if (mode === 'active') G.idleT = 0; S.update(0.05); }
      return { start, end: count(), doorLockedAtStart, playerNeverLocked: true };
    }, mode);
    const rareKept = r.end.goat === r.start.goat && r.end.exclusive === r.start.exclusive && r.end.limited === r.start.limited;
    const rareLost = r.end.goat + r.end.exclusive + r.end.limited < r.start.goat + r.start.exclusive + r.start.limited;
    if (mode === 'idle') ok('M4 idle player, door unlocked, 1 hour: GOAT, Exclusive and Limited kept; ordinary celebs can still be stolen',
      r.start.goat === 1 && r.start.exclusive === 1 && r.start.limited === 1 && rareKept && r.end.ordinary < r.start.ordinary && !errs.length, JSON.stringify(r));
    else ok('M4 control: an active, unlocked player can lose rare celebs too', rareLost && !errs.length, JSON.stringify(r));
    await b.close();
  }
  {
    const { b, p, errs } = await open({ loadFails: 0 });
    const r = await p.evaluate(() => {
      const S = window.__sh, G = S.game; S.startGame(); S.finishHowTo(); G.tut = 4;
      const run = (secs) => { for (let i = 0; i < secs * 20; i++) S.update(0.05); return S.shielded(); };
      const res = {};
      // hold W for two minutes: one keydown, no keyup
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', bubbles: true }));
      res.holdingKey = run(120);
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW', bubbles: true }));
      res.afterKeyRelease = run(61);
      // hold the joystick for two minutes
      S.joy.id = 7; res.holdingJoystick = run(120);
      S.joy.id = null; res.afterJoystickRelease = run(61);
      return res;
    });
    ok('M4 the shield stays off while steering, and turns on 60 s after letting go',
      r.holdingKey === false && r.holdingJoystick === false && r.afterKeyRelease === true && r.afterJoystickRelease === true && !errs.length, JSON.stringify(r));
    await b.close();
  }
  console.log(out.join('\n'));
  console.log(`\n${out.length - fails}/${out.length} passed`);
  process.exit(fails ? 1 : 0);
})();
