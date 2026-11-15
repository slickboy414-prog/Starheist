// m8: how long does an attentive player take from rebirth 7 to 10 with no Admin Abuse?
// Run: (cd game && python3 -m http.server 8765) then: node tests/progression-sim.js [hours]
// The simulated player teleports, collects every podium perfectly, buys the best affordable celeb,
// keeps the doors locked when it can, buys Star Power and podium upgrades, and rebirths as soon as allowed.
// It does not walk, so its times are a lower bound (best case) for a real player.
const { chromium } = require('playwright');
const HOURS = +(process.argv[2] || 48);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext()).newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8765/?debug'); await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} }); await p.reload();
  await p.waitForFunction(() => window.__sh && window.__sh.game.loaded, null, { timeout: 60000 });
  const r = await p.evaluate((HOURS) => {
    const S = window.__sh, P = S.player, G = S.game;
    S.startGame(); S.finishHowTo(); G.tut = 4; G.rebirth = 7; S.refreshFloors(); P.cash = 50000; // rebirth 7 start cash
    const log = [], DT = 0.1, END = HOURS * 3600; let t = 0, nextAct = 0, goatsSeen = 0, goatsBought = 0; const seen = new Set();
    const cps = () => S.celebs.filter((c) => c.owner === P && c.state === 'placed').reduce((s, c) => s + c.income, 0) * S.playerIncomeMult();
    const UP = { star: (l) => 3000 * Math.pow(3, l), slots: (l) => 900 * Math.pow(4.2, l) };
    log.push({ h: 0, rebirth: G.rebirth, note: 'start', cash: P.cash });
    while (t < END && G.rebirth < 10) {
      G.idleT = 0; S.update(DT); t += DT;
      for (const c of S.celebs) if (c.state === 'carpet' && c.def.r === 5 && !seen.has(c)) { seen.add(c); goatsSeen++; }
      if (t < nextAct) continue; nextAct = t + 1;
      // collect everything
      for (const c of S.celebs) if (c.owner === P && c.state === 'placed' && c.stored > 0) { P.cash += c.stored; c.stored = 0; }
      // keep the doors locked
      if (!P.base.locked && P.base.lockCd <= 0) S.lockBase(P.base);
      // upgrades worth buying (keep a reserve for celebs)
      for (const k of ['star', 'slots']) { const l = G.up[k], max = k === 'star' ? 10 : 4, cost = UP[k](l); if (l < max && P.cash > cost * 3) { P.cash -= cost; G.up[k]++; if (k === 'slots') S.refreshFloors(); } }
      // rebirth as soon as allowed
      const st = S.rebirthStatus();
      if (st.ok) { S.doRebirth(); S.doRebirth(); log.push({ h: +(t / 3600).toFixed(2), rebirth: G.rebirth, note: 'rebirthed', cps: Math.round(cps()) }); continue; }
      // buy the best affordable celeb; if full, replace the weakest when the new one earns 1.5x more
      let best = null;
      for (const c of S.celebs) if (c.state === 'carpet' && S.buy && c.def.cost * c.mut.mult <= P.cash && (!best || c.income > best.income)) best = c;
      if (best) {
        if (!S.freeSlot(P)) { const mine = S.celebs.filter((c) => c.owner === P && c.state === 'placed').sort((a, b) => a.income - b.income); if (mine[0] && best.income > mine[0].income * 1.5 && !(st.req && mine[0].def.r >= st.req.tier && mine.filter((c) => c.def.r >= st.req.tier).length === 1)) S.sell(mine[0]); }
        P.floor = 0; P.stair = null; P.pos.set(best.pos.x, 0, best.pos.z);
        if (S.buy(P, best) && best.def.r === 5) goatsBought++;
      }
      if (Math.floor(t) % 3600 === 0) log.push({ h: +(t / 3600).toFixed(2), rebirth: G.rebirth, cash: Math.round(P.cash), cps: Math.round(cps()), need: st.req ? st.req.cash : null, ownsTier: !!st.hasTier });
    }
    return { reached: G.rebirth, hours: +(t / 3600).toFixed(2), goatsSeen, goatsBought, log };
  }, HOURS);
  console.log(JSON.stringify({ reached: r.reached, hours: r.hours, goatsSeen: r.goatsSeen, goatsBought: r.goatsBought }));
  for (const l of r.log) console.log(JSON.stringify(l));
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
