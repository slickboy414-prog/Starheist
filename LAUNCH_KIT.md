# STAR HEIST — Launch Kit (YouTube Playables)

## Store listing (copy-paste)

**Title:** Star Heist: Steal the Celebs!

**Short description (≤ 80 chars):**
Sign celebs off the red carpet, steal rivals' stars, and lock up your agency!

**Long description:**
Welcome to Starville! 🌟 Celebrities strut down the red carpet. Sign them to YOUR talent agency and they make you cash every second.
Rival bot agencies want them too. Sneak into their HQ, grab their best star, and RUN home before they catch you! 😈
Bots will steal from you too, so step on your laser LOCK pad to keep thieves out. 🔒
📸 Use your Paparazzi FLASH to stun chasers and save your celebs.
⭐ Climb the fame ladder: LOCAL STAR → VIRAL → FAMOUS → SUPERSTAR → ICON → ALL-TIME GOAT. The more famous, the rarer!
👑 WEEKLY ADMIN ABUSE every Saturday: for 30 minutes only superstars, icons and GOATs hit the carpet!
💎 Hunt GOLD, DIAMOND and RAINBOW versions.
♻️ REBIRTH for permanent income multipliers, extra podiums and a badge on your name.
🛗 Unlock up to 4 extra floors for your agency (Floor 2 to 5) with rebirths. Ride the elevator up, and watch out: bots ride it too!
🏆 Climb the Richest Agencies leaderboard!
🔥 Daily login streak and 3 daily missions
📖 Collect all 210 celebs in your Celeb Album (+1% income each)
🧪 Fuse 3 specific stars into one-of-a-kind EXCLUSIVE celebs at the Fuse Lab
🔀 Rearrange your podiums, take the stairs or the elevator between floors
👑 Prestige after Rebirth 10 for legendary titles and a golden agency
🌐 Plays in English, Español, Português, हिन्दी and Bahasa Indonesia
All celebrities are fictional characters.

**Genre / tags:** Idle · Tycoon · Steal · Simulation · Casual · 3D
**Orientation:** Both (portrait + landscape) · **Input:** touch, keyboard, mouse

## Assets
- `promo/shot1_title.png`: cover / hero
- `promo/shot2_carpet.png`: red carpet + BUY
- `promo/shot3_steal.png`: carrying a stolen celeb ("RUN HOME!")
- `promo/shot4_mobile.png`: phone portrait gameplay
- The YouTube portal also asks for an icon and a cover. Crop these from shot1 at the exact sizes the portal requests.

## Viral hooks built into the game
1. **The first 10 seconds:** you start at the door, the red carpet is right in front of you, and a bouncing arrow points at a celeb you can afford.
2. **Steal loop:** you grab a celeb, a bot chases you, you flash it, and you get a "STOLEN!" confetti burst. That's a clip-worthy moment every minute.
3. **Being robbed:** a siren, a red beam and a "THIEF" arrow make you want revenge, so you steal it back.
4. **Rarity drops:** server-style banners say "LEGENDARY … hit the red carpet!", plus mutations (Gold x2, Diamond x3, Rainbow x5) and two SECRET celebs.
5. **Timed events:** STAR STORM (luck x4) and GOLDEN HOUR (cash x2) run every ~2 minutes. **ADMIN ABUSE** happens once a week for everyone at the same moment (Saturday 18:00 UTC, 30 minutes). The title screen counts down to it in each player's local time. During it, only Superstar (50%), Icon (35%) and GOAT (15%) celebs spawn, a guaranteed GOAT drops every minute, and cash is x3.
6. **Fame = rarity:** every nameplate shows the tier's spawn chance (Local Star 55%, Viral 28%, Famous 11%, Superstar 4.5%, Icon 0.35%, GOAT 0.04%).
7. **Comeback reward:** "Welcome back! +$X" offline earnings.
8. **Leaderboard:** "Richest Agencies" in the corner, and your best net worth goes to YouTube via `sendScore`.

## YouTube Playables compliance checklist
| Requirement | Status |
|---|---|
| Loads the SDK `https://www.youtube.com/game_api/v1` before game code | ✅ |
| `firstFrameReady()` after the first render, `gameReady()` once playable | ✅ |
| Saves through `ytgame.game.saveData` / `loadData` (no localStorage in YouTube) | ✅ (saves every 30 s, after key events, on pause) |
| Respects `isAudioEnabled` + `onAudioEnabledChange` | ✅ |
| `onPause` / `onResume`: freezes the sim, suspends audio, saves | ✅ |
| `sendScore` (integer) | ✅ best net worth |
| `health.logError/logWarning` on errors | ✅ |
| No external network requests, ads, links, IAP or "subscribe/like" prompts | ✅ everything is bundled (three.js included) |
| Small bundle | ✅ ~205 KB zipped, ~800 KB unzipped |
| Mobile + desktop, portrait + landscape, safe areas | ✅ |
| Kid-safe content | ✅ cartoon style, no violence (the camera flash "stuns"), no strobe effects |
| No real people's names or likenesses | ✅ all 21 celebs and 5 bots are original fictional archetypes (no real names) |
| Not a copy of another game's name, art or characters | ✅ original name, art and characters; only the "buy/steal" genre is shared |


## Content calendar (runs automatically, no update needed)
- **Every day:** a theme day makes one kind of celeb 4x more common (Sun movies, Mon sports, Tue music, Wed viral creators, Thu chefs & hosts, Fri DJs & dancers, Sat royals, magicians & astronauts). Daily missions rotate at midnight local time.
- **Every week:** a FEATURED celeb (8x spawn chance, x2 income) and a LIMITED celeb that only appears during the Saturday Admin Abuse. 52 Limited celebs rotate on a seasonal calendar (winter stars in winter, summer stars in summer), so none repeat for a full year.

## v3 compliance notes
| Requirement | Status |
|---|---|
| Language from `ytgame.system.getLanguage()` with in-game override | ✅ 5 languages; celeb names and fame titles stay in English |
| In-game pause button, plus YouTube `onPause`/`onResume` | ✅ every panel pauses the simulation |
| No purchases, ads, loot boxes or real-money rewards | ✅ streak, missions and fusion only give in-game cash/celebs; fusion recipes are fixed (no random paid rolls) |
| Save data size | ✅ about 1 KB (limit 3 MiB) |
| Total bundle | ✅ about 916 KB unzipped |
| Fits every screen (phones, tablets, desktops, portrait and landscape) | ✅ HUD scales with the device, camera keeps the same view width |
| First-time tutorial | ✅ 8-page How to Play on first launch, reopen from the pause menu |
| No real-money purchases (not supported by Playables yet) | ✅ Star Shop items are bought with Star Gems earned in play; `grantItem(id)` in `game.js` is the single hook to connect YouTube's purchase API if it launches |
| Only fictional characters | ✅ 210 original celebs; recipe/limited celebs are original too |


## Admin Abuse checklist
Admin Abuse runs inside the game on every player's device. There is no server and nothing to switch on each week.
1. **Schedule:** every Saturday 18:00–18:30 UTC (set by `ADMIN_ANCHOR` and `ADMIN_LEN` in `game/game.js`).
2. **It happens automatically** for anyone who has the game open during that window, including people who join halfway through.
3. **Test it before launch:** run the game locally, open `http://localhost:8000/?debug`, press PLAY, open the browser console (F12) and run `__sh.forceAdmin(30)`. You can also set your computer clock to a Saturday at 18:05 UTC.
4. **Make sure people show up:** post on your YouTube channel (Community post or Short) every Saturday before 18:00 UTC. The game itself cannot send notifications.
5. **To change the day, time or length:** edit those two values, rebuild the zip and upload the new version to YouTube.

## Star Shop (4 boost items)
| Item | Gems | Effect |
|---|---|---|
| 💎 VIP Pass | 250 | +50% income forever, VIP badge |
| 🛡️ Bodyguard | 150 | Auto-locks your doors when a thief sneaks up |
| 👟 Rocket Sneakers | 120 | +25% speed, no slowdown while carrying |
| 🍀 Lucky Charm | 40 | 30 min double luck (stacks) |

Gems: daily streak 5 (25 on day 7), each mission 3, all three +10, each album page 20, weekly Admin Abuse 15.

## How to submit
1. YouTube Playables publishing is invite/partner based. Apply through the **YouTube Playables developer program** (search "YouTube Playables developer" on developers.google.com/youtube). Requirements change, so read their current Playables policies and certification checklist.
2. Test locally with the **Playables SDK test suite** they provide once you have access.
3. Upload `star-heist-playables.zip` (index.html at the root) and the listing above.

## Run locally
```bash
cd game && python3 -m http.server 8000
```
Then open http://localhost:8000. Add `?debug` to expose `window.__sh` for testing.

## Ideas for v2
More celeb packs (sports stars, chefs), cosmetic skins for your agency, and daily login rewards.
