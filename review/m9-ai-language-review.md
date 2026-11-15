# m9: AI language review (es, pt, hi, id)

The owner asked for an AI check of the translations, since no native speaker is available. This is **not** a native-speaker check. It lowers the risk; it doesn't remove it. The owner decides whether it closes m9.

## What was checked

1. **Automated checks, executed** (`node tests/i18n-check.mjs`). Each translated string is compared with English:
   - every key exists in every language (274 keys)
   - the same `{placeholders}`
   - the same HTML tags
   - the same emoji
   - nothing is left in English by mistake

   Result: **0 issues in all 4 languages**. Words kept in English on purpose are listed in the test with the reason. For example, Indonesian players use "Rebirth" as-is, and "VIRAL" is spelled the same in Spanish.
2. **Layout check, executed** (`node tests/i18n-layout.js`). Every visible label on a phone (390×844) and on desktop (1280×720) was checked in all 5 languages, looking for text that spills out of its box or off the screen. The test first confirms its detector fires on a deliberately oversized label, so it can't pass by default.
   - Result: **10/10 passed** (21 labels on a phone, 35 on desktop).
   - Limit: it covers the in-game HUD, not every pop-up panel.
3. **Language review (reasoning, AI reading).** I read all 274 strings in each language against the English, checking meaning, grammar, tone for a young audience, and consistency with the game's own terms.

## Changes made (before → after)

### Found in the English source and fixed in all 5 languages

During Admin Abuse, GOATs spawn too (15%), but 3 messages said only Superstars and Icons do.

| Key | Before (en) | After (en) |
|---|---|---|
| `admin` | Only SUPERSTARS & ICONS spawn! | Only SUPERSTARS, ICONS & GOATs spawn! |
| `evAdmin` | Superstars only | Superstars & up |
| `adminFeed` | superstars only, cash x3! | only superstars, icons & GOATs, cash x3! |

### Spanish (es)

| Key | Before | After | Why |
|---|---|---|---|
| `themeSat` | Sábado real | Sábado de realeza | "real" also means "real/actual"; it was ambiguous |
| `itd_guard` | Cierra tus puertas solo cuando… | Cierra tus puertas automáticamente cuando… | "solo" read as "only", not "by itself" |
| `m_rare` | Ficha {n} famosos FAMOSO o mejor | Ficha {n} famosos de rango FAMOSO o superior | "famosos FAMOSO" was clumsy |

### Portuguese (pt)

| Key | Before | After | Why |
|---|---|---|---|
| `stolenYours` | {bot} roubou sua {c}! | {bot} roubou {c} de você! | "sua" is feminine; it was wrong for every male celeb |
| `grabbedYour` | {bot} pegou sua {c}! | {bot} pegou {c} da sua agência! | same |
| `stoleYoursFeed` | {bot} roubou sua {c}. Roube de volta! | {bot} roubou {c} de você. Roube de volta! | same |
| `idleShield` | …seus GOATs, Exclusivos nem Limitados… | …suas celebridades GOAT, Exclusivas nem Limitadas… | the rest of the game uses feminine forms (celebridade, EXCLUSIVA) |
| `m_rare` | …celebridades FAMOSO ou melhor | …celebridades de nível FAMOSO ou melhor | grammar |

### Hindi (hi)

| Key | Before | After | Why |
|---|---|---|---|
| `move`, `moved`, controls "M:" | हटाओ / हटा दिया ("remove") | जगह बदलो / जगह बदल दी ("change place") | "remove" made the rearrange button sound like delete |
| `stunned`, `m_flash`, `hp4` | बेहोश ("knocked unconscious") | चकाचौंध ("dazzled") | gentler and more accurate for a camera flash; matches the kid-safe "the flash stuns" promise |

### Indonesian (id)

| Key | Before | After | Why |
|---|---|---|---|
| `homeOnly` | DI RUMAH ("at home") | HANYA DI RUMAH ("home only") | the "only" was lost |
| `stunned` + 5 hint texts | PINGSAN / pingsan ("fainted") | SILAU / silau ("dazzled") | same reason as Hindi |
| `tut2`, `hp3`, `s3d`, `ht3` | Menyelinap ke… | Masuk diam-diam ke… | proper command form |
| `r2`, `m_rare` | FAMOUS (left in English) | TERKENAL | every other tier was translated |
| `idleShield` | Perisai diam aktif… GOAT, Eksklusif… | Perisai AFK aktif… seleb GOAT, Eksklusif… | "diam" means "silent"; "AFK" is the word Indonesian players use |

## Reviewed and left as they are

- **Masculine default for celeb verbs in Hindi** ("{c} आया"). Hindi grammar needs a gender, and the masculine default for "सेलेब" is the normal choice in games.
- **ON/OFF in es, pt and id.** These are widely understood in game settings.
- **"Admin Abuse" kept in English everywhere.** It is the event's name, as in the genre.

## Still recommended

A native speaker should glance at the changed lines above before launch, if the owner can find one. Any bilingual player or friend would do; it doesn't need to be a translator.
