## Claude Code's round 3 answer

All round 3 code is in one commit on `main`: **ce696f5** ("Round 3: M4 shield covers tiers 5-7, M5 rebirths accept Icons, M3 known limit"). Every test below ran on that commit. The commit was not changed afterwards: a fresh `node tools/build.js` produced a zip whose unzipped contents are identical to the committed zip (`diff -r` printed nothing).

### M4, idle shield covers tiers 5-7 (done)

- **Change:** `guarded()` now reads `c.owner === player && c.def.r >= 5 && shielded()`, which covers GOAT (5), Exclusive (6) and Limited (7). Tiers 0-4 can still be stolen from an idle player. The steering fix is unchanged: the idle timer resets while a key, the joystick or the camera drag is held.
- **Message:** the `idleShield` text now names all three tiers in en, es, pt, hi and id. English: "🛡️ Idle shield on: bots won't steal your All-Time GOATs, Exclusives or Limiteds while you're away."
- **Test, executed** (`node tests/review-findings.js`). The idle player owns one GOAT, one Exclusive, one Limited and 22 ordinary celebs, with the door unlocked. One simulated hour follows:
  - `PASS M4 idle player, door unlocked, 1 hour: GOAT, Exclusive and Limited kept; ordinary celebs can still be stolen — {"start":{"goat":1,"exclusive":1,"limited":1,"ordinary":22},"end":{"goat":1,"exclusive":1,"limited":1,"ordinary":0},"doorLockedAtStart":false,"playerNeverLocked":true}`
  - `PASS M4 control: an active, unlocked player can lose rare celebs too — {"start":{"goat":1,"exclusive":1,"limited":1,"ordinary":22},"end":{"goat":0,"exclusive":0,"limited":0,"ordinary":2},...}`
  - `PASS M4 the shield stays off while steering, and turns on 60 s after letting go — {"holdingKey":false,"afterKeyRelease":true,"holdingJoystick":false,"afterJoystickRelease":true}`
- **Note for the owner (reasoning):** in that hour an idle, unlocked player lost all 22 ordinary celebs. That is what the ruling asks for, but the owner should know it is the result.

### M5, rebirths 8 to 10 accept an Icon (done). The dropped multiplier is a proposal.

- **Change:** `REBIRTHS[7..9]` are now `{ cash: 800e6, tier: 4 }, { cash: 3e9, tier: 4 }, { cash: 12e9, tier: 4 }`. Rebirths 1-7 are unchanged. Exclusives and Limiteds also count, because `rebirthStatus()` checks `def.r >= tier` (primary source: `game/game.js`, `rebirthStatus`). That also satisfies the doc's wording "an Icon or an Exclusive".
- **Proposal for the owner to approve: drop the album multiplier.** It was `1 + 0.01 × albumCount()`, up to x3.10 with all 210 celebs. It is now `albumMult = () => 1`, with a comment in the code explaining why.
  - **Why this one (reasoning):** it is the only multiplier the player never chooses or pays for. It never resets, through rebirth or Prestige, and it stacks silently on the others. The rebirth multiplier is the core loop. Star Power is a paid upgrade that resets on rebirth. VIP is a deliberate Star Gem purchase. Prestige is the end-game reward.
  - **What the album keeps:** every finished page still pays cash and 20 Star Gems. The `alBonus` text changed in all 5 languages to "Finish a page for a cash bonus and 20 Star Gems", and the album line in LAUNCH_KIT.md now matches.
  - **Before and after (reasoning, arithmetic from the constants in `playerIncomeMult()`), best case before Prestige:**
    - Before: rebirth x6 (rebirth 10) × Star Power x3.5 (level 10) × album x3.10 × VIP x1.5 = **x97.65**
    - After: x6 × x3.5 × x1.5 = **x31.5**
  - Reverting it is a one-line change if the owner prefers another multiplier.
- **Progression sim, executed** (`node tests/progression-sim.js 48`, three runs from rebirth 7, no Admin Abuse):

| Run | Reached | Game hours | Rebirth 8 / 9 / 10 at (h) | Icons seen / bought | GOATs seen / bought | Page errors |
|---|---|---|---|---|---|---|
| 1 | 10 | 4.65 | 0.61 / 1.91 / 4.65 | 19 / 18 | 0 / 0 | none |
| 2 | 10 | 3.93 | 0.51 / 1.67 / 3.93 | 17 / 17 | 1 / 1 | none |
| 3 | 10 | 4.29 | 0.51 / 1.78 / 4.29 | 19 / 18 | 1 / 1 | none |

- **What the runs show (reasoning on the executed numbers):**
  - **Run 1 reached rebirth 10 without seeing a single GOAT.** Before M5 that was impossible. Run 1 removes the GOAT-lottery tail behind the reviewer's 13.97-hour run.
  - **It did not make the best case faster.** Before M5 the author's runs took 4.62, 4.65 and 3.80 hours; these take 3.93 to 4.65. For this teleporting player the limit is now the cash targets ($800M, $3B, $12B), not the rare spawn.
  - **The album change barely shows here.** The sim starts from a fresh save with a nearly empty album, so it can't measure the effect on a long-time player. For that player the drop matters more.
  - **These times are still a floor.** The reviewer's m8 point stands: a real player walks, stops and makes mistakes.
  - **The `"cps":0` on the `rebirthed` log lines is the sim's own logging.** It measures income right after the rebirth reset clears the podiums. It is not a game bug.

### M3, known limit in LAUNCH_KIT.md (done)

- **Primary source:** LAUNCH_KIT.md at ce696f5, in the compliance notes table. The new row reads: "Admin Abuse timing (known limit, accepted by the owner on 15 Nov 2026) | ⚠️ Moving the device clock forward still starts Admin Abuse early. Moving it back is blocked: a save that sees the clock go backwards gets no Admin Abuse until real time catches up. Playables offers no trusted time source to close this."
- **The back-clock guard still works, executed:**
  - `PASS M3 rolling the clock back after a forward jump blocks Admin Abuse — {"event":null,"luck":1}`
  - `PASS M3 control: an honest clock on Saturday 18:05 UTC still starts Admin Abuse — {"event":"admin"}`

### Housekeeping (done)

- **Build, executed:** `node tools/build.js` produced 6 files, each under 512 KiB (`three.core.min.js` is the largest at 365,910 bytes), 1,010,886 bytes unzipped in total. `star-heist-playables.zip` is 267,228 bytes and committed in ce696f5.
- **preview/ synced**, then the claude.ai playable "Star Heist" was republished as version 24: https://claude.ai/artifact/JeFdRq4ZBdV6Pe2nqkwtcQ
- **Published files match preview/, executed:** each supporting file was read back from the artifact and its sha256 compared with `preview/`. All 5 matched:
  - game.js bfe1016ed8bf…
  - i18n.js 0e53a1b74fab…
  - content.js 68d1c0dce010…
  - three.module.min.js 7beca683cc87…
  - three.core.min.js b54705636e21…
- **One file not compared:** `index.html` is the artifact page itself, and the host wraps it at publish time, so I didn't compare its hash. It was published from `preview/index.html`.

### Final test totals on ce696f5 (all executed)

- `tests/stress-test.js`, one end-to-end run: **29/29 passed**, exit code 0. It includes `PASS Long run: 2 simulated hours, idle player keeps every GOAT — player keeps 2 of 2 GOATs`.
- `tests/review-findings.js`: **9/9 passed** (B1, M1a, M1b, m5, M3, M3 control, M4 idle, M4 active control, M4 steering)
- `tests/dist-smoke.js` on a fresh build: **1/1 passed**. Output: `PASS dist build boots in a mocked Playables session — {"calls":["firstFrameReady","gameReady"],"saves":1,"hook":"undefined","hudShown":true}`
- `tests/progression-sim.js`: **3/3 runs reached rebirth 10** (4.65, 3.93, 4.29 h), no page errors.

### A correction to the record (primary source: this session's transcript)

The owner's rulings paragraph says the rebirth ruling "was passed on to Claude Code (M5)". In the author's session the ruling first arrived in the round 3 brief, not before it. It matches the author's own round 2 proposal (accept an Icon, drop one multiplier), so no work was lost. The record should still show when it actually arrived.

### Still open for the owner

- **M2:** record a real iPhone test of the current build (version 24 at the link above). The iPad Pro test is done.
- **m9:** a native-speaker check of es, pt, hi and id before launch. The round 3 `idleShield` and `alBonus` strings are new and need that check too.
- **M5 multiplier:** approve dropping the album multiplier, or name a different one to drop.
- **Protocol objections:** the owner hasn't ruled on the author's three protocol objections yet.
