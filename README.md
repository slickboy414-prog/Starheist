# Star Heist: Steal the Celebs!

A 3D "buy and steal" tycoon game built for **YouTube Playables** (three.js, no build step).
Sign fictional celebs off the red carpet, steal from rival bot agencies, and lock up your own.

- `game/`: the Playables build (`index.html`, `game.js`, `content.js` (celebs, fusions, limited), `i18n.js` (translations), bundled three.js 0.171 as `three.module.min.js` + `three.core.min.js`)
- `preview/`: the same game without the YouTube SDK tag, for playing in a normal browser
- `star-heist-playables.zip`: the upload bundle, built by `node tools/build.js` (strips the `?debug` test hook)
- `tests/`: `stress-test.js` (29 checks), `review-findings.js` (round 2 regression tests), `dist-smoke.js` (checks the stripped build)
- `LAUNCH_KIT.md`: store listing, compliance checklist, submission steps
- `promo/`: screenshots

## Run locally
```bash
cd game && python3 -m http.server 8000
```
Then open http://localhost:8000 (add `?debug` for the test hook).

All celebrities in this game are fictional characters.
