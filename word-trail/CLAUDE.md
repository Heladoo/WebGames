# CLAUDE.md (word-trail)

This file has guidance that applies only to `word-trail/`: an endless, gentle English word adventure for children aged about 4–7. Topics shared by all games are in the root `CLAUDE.md`: Vercel deploy and headers, Upstash stats setup, the Web Audio rules and the persistence conventions.

Word Trail differs from the root defaults in a few ways:
- It draws **SVG**, not canvas.
- It self-hosts its fonts (`@fontsource/andika`, `@fontsource/fredoka`), so the CSP uses `font-src 'self'` and has no Google Fonts.
- It **has automated tests**.

## Commands

```bash
npm install
npm run dev                                       # http://localhost:5173
npm run build                                     # tsc --noEmit + vite build → dist/
npm test                                          # Playwright (starts its own vite on :5199)
npx playwright test tests/director.spec.ts        # one file
npx playwright test -g "fits inside its frame"    # one test, by name
```

`@playwright/test` is pinned to `1.56.1` to match the sandbox Chromium. `playwright.config.ts` uses `/opt/pw-browsers/chromium-1194/...` when that path exists.

## Working with the owner

- **Preview first.** Show the work before opening a PR: screenshots (phone and tablet sizes), or the Vercel branch preview at `https://word-trail-git-<branch>-heladooo.vercel.app`. The owner reviews on a phone. Open and merge a PR only when asked.
- Ideas that were postponed or rejected go in `BACKLOG.md`.
- The owner wants few spoken lines. Words, letters, the question for each choice and "Bye bye, cat!" when a friend leaves are spoken. Achievements, remarks about a choice and photo remarks are **not** spoken: those moments get pictures, sound and confetti only.
- Children feel bad losing things, so nothing just vanishes: a friend who leaves waves goodbye, and an item the hero swaps away goes to a friend.

## Game loop (`src/main.ts`, `run()`)

`nextDecision` → `scene.walkToSign` → `choose` → `learn` → `apply` → badges, then repeat.
- **Walking to the choice.** The hero walks until a signpost moving with the ground reaches it. The choice panel then pops out of the sign. A single tap on a card chooses it.
- **Learning the word.** `learn` takes turns between three activities (the grown-ups menu can pick one):
  - **tap** (`tapLetters.ts`): its level grows with the number of words learned.
  - **trace** (`trace.ts`, strokes in `glyphs.ts`): a letter completes only when about 80% of each stroke is covered **and** the finger lifts. A word is traced only if its capitals would be at least 75 CSS px tall on this screen (`fitTrace`); otherwise it is tapped. On a phone that means words of up to 4 letters.
  - The trace area is layered: pale letter shapes, then the child's ink, then the dotted guides (with a white halo on the current letter), the start dot and hint dot, so scribbling never hides the letter or the hints.
  - **find** (`findWord.ts`): the word is shown big above with its picture, and the child picks the same word from 3 word cards (other first letters) or, later, 4 (same first letter or length, like RAIN for RAINBOW). A wrong card wobbles and says its own word; after quiet moments the word is said again and then the right card glows.
  - After any of them, the word is spelled aloud, and each letter lights up as it is said (the `speech.spell` callback).
- **Applying the choice.** `apply` changes only the slot of the chosen item. The rules for what stays and what goes:
  - **Friends:** at most 3; when a fourth joins, the oldest says "Bye bye" first (`scene.farewell`, spoken too) from its own spot while the others keep theirs, then hops off; only then does the new friend join, so nobody stands where it waves. The paper bubble, with the friend's picture, floats above everyone inside the view (on a phone the oldest friend is out of view).
  - **Hand-me-downs** (`gear.ts`): an item the hero swaps away goes to the newest animal friend (one drawn like a hero) with that spot free, and stays with it (`trip.gear`) until that friend leaves. Small friends (bee, bird, …) can't wear things.
  - **Carried things:** `carry` (a thing on the back: ball, star, book, drum, flag, bell, gift) and `air` (kite or balloon) are separate slots.
  - **Rides:** a `ride` lasts until the place changes.
- **Choice variety** (`director.ts`).
  - **Even categories:** they are drawn from a shuffled `DECK`, so each comes up evenly and never twice in a row.
  - **Filtering** (`candidates()`): drops items already worn, and offers the boat only at `sea`.
  - **Word length:** longer words unlock as more words are learned (`maxLength`).
- **Saving** (`state.ts`): everything is in one `localStorage` key, `word-trail-save-v1`, and every field is validated on load. Add new trip fields to `newTrip()`, `Trip` and `load()` together.

## Art: everything is SVG drawn in code, in a paper-cut style

`src/art/paper.ts` is the style kit:
- `piece(d, fill, {part, item, word, lift})` draws a paper piece, with a crisp offset cast-shadow copy (`data-shadow`).
- `flat` draws plain details, `line` draws strings and whiskers, and `ell` builds ellipse paths.
- `C` is the palette, and `shade` lightens or darkens a colour.

**Filters.** `FILTER_DEFS` defines `#pc` (hand-cut edge plus drop shadow, for characters, friends and cards) and `#ps` (drop shadow only). They are referenced by id:
- On screen, `installDefs()` adds them to the page, and every page needs that, including debug pages.
- Rasterized images (`rewards.ts`: postcards and the sticker sheet) inline their own copy of the filters.

**Performance.** Scrolling scenery never uses filters (only cast-shadow copies). Filters go on whole groups (the hero, a friend), never on many small pieces.

**Characters** (`characters.ts`) are rigs with **named parts and anchors**:
- **Facing:** every hero faces right in a 3/4 view. The far eye is nearer the snout and smaller (`eye(…, 'eyeFar', 0.9)`). The nose is the front-most point.
- **Parts:** `data-part` marks `head`, `body`, `muzzle`, `nose`, `eyeNear`, `eyeFar`, `earNear`, `earFar`, `cheek`, `tail`, `legFrontNear`, … (birds use `legNear` and `legFar`).
- **Anchors:** `headTop`, `bow`, `neck`, `back`, `pack`, `eyeNear`, `eyeFar`, `legs`, `tail`.
- **Wearables** (`wearables.ts`) are positioned **only from anchors**, never from fixed numbers, and are marked `data-item`. Slots are set in `WEAR_SLOT`. Carried things rest at `pack`, the rear of the back, where the head and ears can't cover them.
- **Moving parts** are groups with an inline pixel `transform-origin` and `transform-box: view-box`: `.leg` (a hip swing in a diagonal gait), `.tail`, `.cape` and `.wheel`. Anything that sits on a moving part (a tail tip, a boot) must be inside its group.

**Scenery** (`places.ts`):
- Each place has three 800-wide tiles (far, middle, ground) on a 450-high stage with `GROUND = 370`.
- Each tile draws past its edges and the next tile is drawn on top, so where they overlap both must draw the same thing:
  - Any shape near a tile edge goes through `wrap()`, which also redraws it in the next tile (within 100 units of the right edge).
  - Edges that cross a tile edge must be periodic: same height and slope at x = 0 and x = 800, continued along the neighbour's curve (`tileCurve`, `tileStrip`, `hills`), never a straight stub.
  - A cut edge must lie under something the next tile paints: nearer hill bands reach further than the bands behind them, and the trail reaches 20 units further than the grass. Otherwise it shows as a hairline while the scenery scrolls.
- Skies are paper bands (`skyBands`).

**The scene** (`scene.ts`) is rebuilt as markup by `render()`:
- **Parallax** is CSS (`.walking .layer`). A redraw carries each layer's scroll over (`scroll`/`setScroll`), and the first one starts at a random spot, so the hero doesn't stop in front of the same tree every time.
- **The signpost** is moved by JS at ground speed: 80 units/s, or 145 when riding.
- **The view** is fitted per aspect ratio; portrait views zoom in and show more ground.
- **Panels.** On wide screens (4:3 and wider) the choice panel sits at the left, clear of the top buttons. The learning panel stays wide and centred and may cover the hero: the owner prefers big trace letters to seeing the hero. On short landscape phones the learning panel is two columns. Slots, bubbles and the big word size themselves from the word length (`--n`) and the panel's width (container units), so a 7-letter word fits a 360-wide phone.

**Words.** Every letter A–Z is in at least one word (tested). For J, Q, V, Y and Z the owner chose JELLYFISH, SQUIRREL, BUNNY, MONKEY and ZEBRA (friends) and VIOLIN and KEY (carried); words must be easy to recognise and not look like another word's picture, so **ask the owner to approve new words before drawing them** (VAN, PONY, JAR and QUAIL were rejected). Words of 8–9 letters appear once 30 words are learned (`maxLength`). A new word needs its picture, a rig case if a hero wears, carries or rides it, and passing art tests.

**Logo.** `public/logo.webp` (640 px) and `logo-small.webp` (256 px) are the owner's logo with the backdrop cut out (transparent). It is the title-screen heading, sits in the top-left corner while playing (`#corner-logo`; the panels on wide screens leave room for it, tested), and is drawn top-left on postcards.

**Card pictures** come from `content.ts` `picture(word)`. Item cards are framed by `ITEM_BOX` in `wearables.ts`.

## Tests (`tests/`)

**`anatomy.spec.ts`** loads `?debug=rig`. That page renders each hero alone, with each wearable, with each carried thing, with a combined kite + star + bag, and on each ride, then measures every part and item (`src/rig.ts`). `rules.ts` then checks:
- **Face:** the far eye is right of, smaller than, and closer to the snout than the near eye; both eyes sit on one line above the snout, and the cheek is below the eyes.
- **Body:** the neck connects head and body, the tail and ears attach, the feet are on the ground (y≈192), front and back legs are on the correct half of the body, and near legs are drawn after far legs.
- **Items:** each item fits its place (hats on the head, lenses on the eyes, scarf and tie at the neck, coat over the body, boots, shoes and socks on the feet, bag and cape on the back, strings tied to the back, riders in their vehicle). The thing on the back may be at most 10% hidden.
- **Moving groups:** nothing sits on a moving group without moving with it.
- **Card frames** (`?debug=frames`): no card picture is cut off.
- **Scenery** (`?debug=tiles`): every tile repeats, and where neighbouring tiles overlap they agree, including at a scroll position between two pixels (no seam or hairline).

**`layout.spec.ts`** loads `?debug=learn` for the longest words on a small phone, a phone, a tablet and a landscape phone, in both activities, and checks that the big word stays on one line and everything fits in the panel and on screen, clear of the top buttons. It also checks that long words on a phone are tapped instead of traced.

**`content.spec.ts`**: every badge medal has a picture, captions say "an owl" and name the place and the sky ("in the desert under a rainbow").

**`gear.spec.ts`**: hand-me-downs go to the right friend (or nobody), and find-the-word options are right for each level.

**`director.spec.ts`** simulates 360 choices and checks that categories stay even, never repeat twice in a row, include a friend question regularly, and offer the boat only at sea.

When adding or changing art, add the case to `rigCases()` if needed, then **fix the art until the rules pass**. Don't loosen a rule to make art pass. Each rule exists because of a bug the owner saw: forward-facing eyes, a cropped balloon, items hidden behind the head, and a fox tail tip that didn't wag.

## Debug and scene URLs

- `?debug=words`: every card picture.
- `?debug=wardrobe`: every hero with every item and ride.
- `?debug=glyphs`: tracing strokes.
- `?debug=rig`, `?debug=frames`, `?debug=tiles`: what the tests read.
- `?debug=learn&word=rainbow&mode=tap|trace|find&level=0..3`: the learning panel alone, for layout checks (add `&hero=dog` to see the hero beside it).
- `?debug=og`: the link-preview art; regenerate `public/og-image.png` by screenshotting it. (`?debug=icon` is the old drawn icon. The favicon and app icons now come from the owner's picture of the dog in a hat: the favicon is a round crop with transparent corners; the apple-touch and app icons stay square (iOS turns transparent corners black); the maskable icon has a 5% blue margin so the hat survives round masks.)

You can also set up a scene directly from the URL: `?hero=fox&wear=cap,glasses&friends=bee,cat&place=sea&sky=moon&ride=boat&carry=kite,star&words=12`. `words=N` pretends N words are learned, which unlocks harder levels and longer words. Any scene or debug parameter turns saving off (`stopSaving()`), so a pretend trip never replaces the real one.

## Controls children shouldn't hit by accident

`holdButton()` (`ui.ts`) acts only after a press and hold, with a filling ring: the grown-ups gear (1.5 s) and start-over (1 s, then a yes/no card). A short tap only wobbles and shows a hint. Idle hints (spoken letters, hint dots) pause while any overlay is open or the page is hidden.

## Voice, music and sound

- **Speech** (`speech.ts`, Web Speech): the default voice is a British female voice (`PREFERRED_GB`). The grown-ups menu (hold ⚙️) lists every English voice on the device. Letters are spoken as capitals, with an override for `a`.
- **Music** (`music.ts`): generative notes and nature sounds per place and sky (birds, waves, wind, brook, frogs, crickets at night, rain). Polled every 200 ms, it ducks while `speechSynthesis.speaking`. It is started from the Start tap with `sfx.context`.
- **Sound effects** (`sfx.ts`): effects, plus the shared `AudioContext` and the master limiter (`sfx.output`, a `DynamicsCompressorNode`). Effects and music both end in it.
- Ambience swells (waves, wind, brook) are scheduled gain ramps on a timer, never an oscillator on a gain (the root `CLAUDE.md` rule). The flute vibrato modulates `frequency`, which is allowed.

## Stats

The game uses the shared stats pattern, with the Redis key prefix **`wt:`** (Otter River uses `or:` in the same database):
- client: `src/stats.ts`;
- function: `api/stats.js`;
- dashboard: `public/stats.html` and `stats.js`, which are static files outside the Vite bundle.

A play is counted when Start is tapped. Play time ticks once a second while the page is visible and is flushed with `sendBeacon` when the page is hidden.
