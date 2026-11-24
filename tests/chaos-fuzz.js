// Seeded chaos fuzz, shared by tests/stress-test.js and tests/m11-ghost-slot.js (m11).
// One seed drives everything random in the page: the fuzz's own actions AND the game's Math.random
// (bot choices, spawns, mutations). The clock follows game time and the real-time animation loop is
// paused during the fuzz, so the same seed replays the same run, step for step.
const URL = process.env.SH_URL || 'http://localhost:8765/?debug';

// runs in the page before any game code
function seedPage(seed) {
  const mulberry32 = (s) => { let a = s >>> 0; return function () {
    a = (a + 0x6D2B79F5) >>> 0; let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }; };
  const main = mulberry32(seed), side = mulberry32(seed ^ 0x9E3779B9);
  Math.random = main;
  // Timers fire on the real clock (the music picks notes every 60 ms, sounds and banners are delayed), so
  // anything run from a timer draws from a separate stream: the main stream then depends on the seed alone.
  const wrap = (fn) => typeof fn !== 'function' ? fn : function () { const keep = Math.random; Math.random = side; try { return fn.apply(this, arguments); } finally { Math.random = keep; } };
  const st = window.setTimeout, si = window.setInterval;
  window.setTimeout = function (fn, ...r) { return st.call(window, wrap(fn), ...r); };
  window.setInterval = function (fn, ...r) { return si.call(window, wrap(fn), ...r); };
  const BASE = Date.UTC(2026, 10, 24, 12, 0, 0); // a fixed Tuesday noon UTC: no weekly Admin Abuse unless forced
  const RealDate = Date;
  const now = () => BASE + Math.floor(((window.__sh && window.__sh.game.t) || 0) * 1000);
  window.Date = class extends RealDate { constructor(...x) { super(...(x.length ? x : [now()])); } static now() { return now(); } };
  // no real-time frames: only the fuzz's own update() calls move the game
  window.requestAnimationFrame = () => 0;
}

const INV = `window.__inv = function () {
  const S = window.__sh, P = S.player, e = [];
  for (const a of [P, ...S.bots]) {
    if (!Number.isFinite(a.cash) || a.cash < 0) e.push('bad cash ' + a.name + '=' + a.cash);
    for (const k of ['x', 'y', 'z']) if (!Number.isFinite(a.pos[k])) e.push('bad pos ' + a.name);
    if (Math.abs(a.pos.x) > 95 || Math.abs(a.pos.z) > 80) e.push('out of world ' + a.name);
    if (a.carrying && a.carrying.carrier !== a) e.push('carry link broken ' + a.name);
    if (a.carrying && !S.celebs.includes(a.carrying)) e.push('carrying a removed celeb ' + a.name);
  }
  const slotSeen = new Map();
  for (const c of S.celebs) {
    if (!Number.isFinite(c.pos.x) || !Number.isFinite(c.pos.y) || !Number.isFinite(c.pos.z)) e.push('bad celeb pos ' + c.def.name);
    if (!Number.isFinite(c.stored) || c.stored < 0) e.push('bad stored ' + c.def.name);
    const s = c.state === 'carried' ? c.homeSlot : c.slot;
    if (c.state !== 'carpet') {
      if (!s) e.push('no slot ' + c.state + ' ' + c.def.name);
      else { if (s.celeb !== c) e.push('slot mismatch ' + c.state + ' ' + c.def.name); if (slotSeen.has(s)) e.push('two celebs in one slot'); slotSeen.set(s, c); }
    }
    if (c.state === 'carried' && (!c.carrier || c.carrier.carrying !== c)) e.push('carried w/o carrier');
    if (c.state === 'moving' && P.moveCeleb !== c) e.push('moving w/o mover');
  }
  if (P.moveCeleb && !S.celebs.includes(P.moveCeleb)) e.push('moving a removed celeb');
  for (const b of S.bases) for (const s of b.slots) if (s.celeb && !S.celebs.includes(s.celeb)) e.push('ghost celeb in slot ' + (s.celeb.def && s.celeb.def.name) + ' base ' + s.base.owner.name + ' state ' + s.celeb.state);
  if (!Number.isFinite(S.game.t)) e.push('time NaN');
  return e;
};`;

// opts: url, rounds, steps per round, checkEvery (integrity check interval), trace (actions kept before the first error)
async function runFuzz(browser, seed, opts = {}) {
  const rounds = opts.rounds || 12, steps = opts.steps || 1500, checkEvery = opts.checkEvery || 50, trace = opts.trace || 25;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|game_api|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.addInitScript(seedPage, seed);
  await p.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await p.goto(opts.url || URL);
  await p.waitForFunction(() => window.__sh && window.__sh.game.loaded, null, { timeout: 60000 });
  await p.evaluate(INV);
  await p.evaluate(() => { const S = window.__sh; S.startGame(); });
  const memBefore = await p.evaluate(() => ({ ...window.__sh.renderer.info.memory, children: window.__sh.scene.children.length, celebs: window.__sh.celebs.length }));
  const sizes = [[390, 664], [1280, 720], [750, 342], [810, 1080], [320, 568], [1920, 1080]];
  const invFails = []; let first = null;
  for (let round = 0; round < rounds; round++) {
    await p.setViewportSize({ width: sizes[round % sizes.length][0], height: sizes[round % sizes.length][1] });
    const out = await p.evaluate(({ round, steps, checkEvery, trace }) => {
      const S = window.__sh, P = S.player, G = S.game, bad = []; let first = null; const log = [];
      const KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'KeyF', 'KeyL', 'KeyQ', 'KeyM', 'KeyB', 'KeyR', 'KeyP', 'Escape', 'Space', 'Enter', 'ArrowUp'];
      const key = (code, type) => window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
      const tap = (el) => el && el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }));
      const rnd = (n) => Math.floor(Math.random() * n);
      const nm = (c) => c ? `${c.def.name}[${c.state}${c.owner ? ' ' + c.owner.name : ''}]` : 'none';
      const note = (i, s) => { log.push(i + ': ' + s); if (log.length > trace) log.shift(); };
      for (let i = 0; i < steps; i++) {
        const a = rnd(20);
        if (a < 6) { const k = KEYS[rnd(KEYS.length)]; key(k, 'keydown'); const up = Math.random() < 0.7; if (up) key(k, 'keyup'); note(i, `key ${k}${up ? '' : ' (held)'} near=${nm(S.celebs.find((c) => Math.hypot(c.pos.x - P.pos.x, c.pos.z - P.pos.z) < 3))} carrying=${nm(P.carrying)} moving=${nm(P.moveCeleb)}`); }
        else if (a < 9) { const btns = [...document.querySelectorAll('button')].filter((x) => x.offsetParent); const bt = btns[rnd(btns.length)]; tap(bt); note(i, 'tap ' + (bt ? bt.id || bt.textContent.trim().slice(0, 18) : 'none')); }
        else if (a === 9) { const t = [S.celebs[rnd(S.celebs.length)], null][rnd(2)]; if (t) { P.floor = t.floor || 0; P.stair = null; P.pos.set(t.pos.x + 1, t.pos.y, t.pos.z); } note(i, 'teleport to ' + nm(t)); }
        else if (a === 10) { P.pos.set((Math.random() - 0.5) * 170, 0, (Math.random() - 0.5) * 130); P.floor = 0; P.stair = null; note(i, 'teleport random'); }
        else if (a === 11) { P.cash = [0, 1e3, 1e7, 1e13, 1e300][rnd(5)]; note(i, 'set cash'); }
        else if (a === 12) { G.rebirth = rnd(11); S.refreshFloors(); note(i, 'set rebirth ' + G.rebirth); }
        else if (a === 13 && Math.random() < 0.1) { S.forceAdmin(0.5); note(i, 'force admin'); }
        else if (a === 14) { const ms = ['shop', 'rebirth', 'missions', 'album', 'fuse', 'pause', 'howto']; const m = ms[rnd(ms.length)]; S.openModal(m); note(i, 'open ' + m); }
        else if (a === 15) { S.closeModal(); note(i, 'close modal'); }
        else if (a === 16 && S.bots.length) { const bt = S.bots[rnd(5)]; bt.cash = 1e9; const can = S.botCanRebirth(bt); if (can) S.botRebirth(bt); note(i, `bot rebirth ${bt.name} ${can ? 'done' : 'not allowed'}`); }
        else if (a === 17) { const c = S.celebs.find((x) => x.owner === P && x.state === 'placed'); if (c) { S.startMove(c); const sl = S.playerSlots(); const to = sl[rnd(sl.length)]; S.endMove(to); note(i, `move ${nm(c)} to slot ${to && to.idx}`); } else note(i, 'move: nothing'); }
        else if (a === 18) { const l = ['en', 'es', 'pt', 'hi', 'id'][rnd(5)]; S.setLang(l); S.applyLangUI(); note(i, 'lang ' + l); }
        else note(i, 'idle');
        S.update([1 / 60, 1 / 30, 0.05, 0.05, 0][rnd(5)]);
        if (i % checkEvery === 0 || i === steps - 1) { const e = window.__inv(); if (e.length) { bad.push(i + ': ' + e[0]); if (!first) first = { round, step: i, error: e, actions: log.slice() }; } }
      }
      for (const k of KEYS) key(k, 'keyup');
      S.closeModal();
      return { bad: bad.slice(0, 3), first, celebs: S.celebs.length, cash: S.player.cash, t: S.game.t };
    }, { round, steps, checkEvery, trace });
    invFails.push(...out.bad); if (!first && out.first) first = out.first;
    if (opts.stopOnFail && first) break;
  }
  await p.evaluate(() => { const S = window.__sh; for (let i = 0; i < 300; i++) S.update(1 / 30); S.renderer.render(S.scene, S.camera); });
  const memAfter = await p.evaluate(() => ({ ...window.__sh.renderer.info.memory, children: window.__sh.scene.children.length, celebs: window.__sh.celebs.length }));
  const fingerprint = await p.evaluate(() => { const S = window.__sh; return `celebs=${S.celebs.length} cash=${S.player.cash} t=${S.game.t.toFixed(3)} bots=${S.bots.map((b) => Math.round(b.cash)).join(',')}`; });
  await ctx.close();
  return { seed, steps: rounds * steps, invFails, first, errs, memBefore, memAfter, fingerprint };
}

const newSeed = () => (Math.random() * 2 ** 32) >>> 0;
module.exports = { runFuzz, newSeed, seedPage, INV, URL };
