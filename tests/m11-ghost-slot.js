// m11: a podium slot must never hold a celeb that has been removed from the game.
// 1. Replays chaos-fuzz seed 30, the seed that reproduced the ghost on f09c5f9 (first error: round 1, step 113).
// 2. Drives the root-cause paths directly: the player's cached action target is removed between the update
//    that chose it and the key press (a carpet celeb walking off the end; a bot celeb removed by the bot's rebirth).
// Run: (cd game && python3 -m http.server 8765) then: node tests/m11-ghost-slot.js
const { chromium } = require('playwright');
const { runFuzz } = require('./chaos-fuzz');
const BASE = process.env.SH_BASE || 'http://localhost:8765';
const ARGS = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
const out = []; let fails = 0;
const ok = (n, p, i) => { out.push(`${p ? 'PASS' : 'FAIL'}  ${n}  — ${JSON.stringify(i)}`); if (!p) fails++; };
const FAILING_SEED = 30;

(async () => {
  const b = await chromium.launch(ARGS);
  // ---- 1. replay the failing seed, checking integrity after every step of the first 2 rounds and every 50 after ----
  {
    const early = await runFuzz(b, FAILING_SEED, { url: BASE + '/?debug', rounds: 2, checkEvery: 1 });
    const full = await runFuzz(b, FAILING_SEED, { url: BASE + '/?debug' });
    const r = { seed: FAILING_SEED, firstTwoRoundsEveryStep: early.invFails.length, fullRun: full.invFails.length, first: full.first && full.first.error[0], pageErrors: [...early.errs, ...full.errs] };
    ok(`m11 replay of fuzz seed ${FAILING_SEED} (18,000 actions): no ghost or other integrity error`, !early.invFails.length && !full.invFails.length && !r.pageErrors.length, r);
  }
  // ---- 2. the exact paths ----
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await p.goto(BASE + '/?debug'); await p.waitForFunction(() => window.__sh && window.__sh.game.loaded, null, { timeout: 60000 });
  const res = await p.evaluate(() => {
    const S = window.__sh, P = S.player, G = S.game; S.startGame(); S.finishHowTo(); G.tut = 4; P.cash = 1e9;
    const space = () => { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true })); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', bubbles: true })); };
    const inSlot = (c) => S.bases.some((bs) => bs.slots.some((s) => s.celeb === c));
    const out = {};
    // (a) buy target walks off the carpet in the same update that chose it
    {
      for (const c of S.celebs.filter((x) => x.state === 'carpet')) c.pos.x = -60; // keep other carpet celebs away
      const c = S.spawnCarpetCeleb(62.99, 0); c.pos.z = 0; P.floor = 0; P.stair = null; P.pos.set(62.99, 0, 1.5);
      const cash0 = P.cash; S.update(0.05);                     // updatePlayer picks c, then updateCelebs removes it
      const removed = !S.celebs.includes(c); space();             // the player presses the action key
      out.carpet = { removedBeforePress: removed, bought: inSlot(c) || c.state !== 'carpet', cashSpent: cash0 - P.cash };
    }
    // (b) steal target removed by its bot's rebirth before the key press
    {
      const bot = S.bots[0]; bot.cash = 1e12; const mine = [];
      for (let i = 0; i < 2; i++) { const c = S.spawnCarpetCeleb(-30 + i * 3, i); bot.pos.set(c.pos.x, 0, c.pos.z); S.buy(bot, c); mine.push(c); }
      for (let i = 0; i < 2000 && mine.some((c) => c.state !== 'placed'); i++) S.update(0.05);
      const weak = mine.reduce((a, c) => (c.income < a.income ? c : a));
      bot.base.locked = false; P.carrying = null; P.floor = weak.slot.floor; P.stair = null; P.pos.set(weak.slot.pos.x, 0, weak.slot.pos.z + 0.5);
      S.update(0.01);                                             // target = steal weak
      bot.ai.state = 'home'; bot.carrying = null; S.botRebirth(bot); // removes every placed celeb but the best one
      const removed = !S.celebs.includes(weak); space();
      out.steal = { bothPlaced: mine.every((c) => c.state === 'placed' || !S.celebs.includes(c)), removedBeforePress: removed, grabbed: P.carrying === weak, carrying: !!P.carrying };
    }
    out.ghosts = S.bases.reduce((n, bs) => n + bs.slots.filter((s) => s.celeb && !S.celebs.includes(s.celeb)).length, 0);
    return out;
  });
  ok('m11 path (a): a carpet celeb that walked off after being targeted cannot be bought',
    res.carpet.removedBeforePress && !res.carpet.bought && res.carpet.cashSpent === 0 && !errs.length, res.carpet);
  ok('m11 path (b): a bot celeb removed by its bot\'s rebirth after being targeted cannot be grabbed',
    res.steal.removedBeforePress && !res.steal.grabbed && !errs.length, res.steal);
  ok('m11 no ghost celebs in any slot afterwards', res.ghosts === 0 && !errs.length, { ghosts: res.ghosts, pageErrors: errs });
  await ctx.close(); await b.close();
  console.log(out.join('\n') + `\n\n${out.length - fails}/${out.length} passed`); process.exit(fails ? 1 : 0);
})();
