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
👑 WEEKLY ADMIN ABUSE every Saturday: for 15 minutes only superstars and icons hit the carpet!
💎 Hunt GOLD, DIAMOND and RAINBOW versions.
🏆 Climb the Richest Agencies leaderboard!
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
5. **Timed events:** STAR STORM (luck x4) and GOLDEN HOUR (cash x2) run every ~2 minutes. **ADMIN ABUSE** happens once a week for everyone at the same moment (Saturday 18:00 UTC, 15 minutes). The title screen counts down to it in each player's local time. During it, only Superstar, Icon and GOAT tiers spawn, and cash is x3.
6. **Fame = rarity:** every nameplate shows the tier's spawn chance (Local Star 55%, Viral 28%, Famous 11%, Superstar 4.5%, Icon 1.3%, GOAT 0.22%).
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
Rebirth/prestige, more celeb packs (sports stars, chefs), cosmetic skins for your agency, and daily login rewards.
