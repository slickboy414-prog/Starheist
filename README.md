# Star Heist: Steal the Celebs!

A 3D "buy and steal" tycoon game built for **YouTube Playables** (three.js, no build step).
Sign fictional celebs off the red carpet, steal from rival bot agencies, and lock up your own.

- `game/`: the Playables build (`index.html`, `game.js`, bundled `three.module.min.js`)
- `preview/`: the same game without the YouTube SDK tag, for playing in a normal browser
- `star-heist-playables.zip`: the upload bundle
- `LAUNCH_KIT.md`: store listing, compliance checklist, submission steps
- `promo/`: screenshots

## Run locally
```bash
cd game && python3 -m http.server 8000
```
Then open http://localhost:8000 (add `?debug` for the test hook).

All celebrities in this game are fictional characters.
