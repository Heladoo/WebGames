# CLAUDE.md (drop-the-drop)

**Drop the Drop** (טיפות צבע לכוסות) is a calm game for young children, after a real activity: drops of coloured water on smooth paper are pushed with a stick into cups drawn on the paper. The player drags drops, joins drops of one colour into a bigger drop, keeps colours apart or mixes them, and takes each drop to the cup of its colour. Shared rules (Vercel, CSP, sound, saves, home screen) are in the root `CLAUDE.md`.

## Status

**Twelve levels** (`src/levels.ts`), slow and gentle:

- **1–2:** drag drops into a cup. Level 2's cup takes three small drops; dots on the glass count them.
- **3:** sort two colours.
- **4–5:** join drops, because the cup wants a bigger drop.
- **6–8:** join each colour and keep the colours apart. Level 6 is the first sample.
- **9–12:** mix colours (red + yellow = orange, and so on). Level 12 mixes one colour and keeps another apart.

The first sample was approved. The owner's feedback since then is done:
- an in-scene celebration;
- the table background;
- the level picker;
- landscape only;
- a more varied touch sound.

Ideas still open are in `BACKLOG.md`.

## Principles (the owner asked for these)

- **The drops are the game.** The motion, joining, gloss and see-through look of the drops get the most care; everything else is simple.
- **Slow and stress free.** No timer, no score. The drag speed is capped (`VMAX`); refusals are a gentle sway and two soft notes.
- **A mistake shows its reason, and the level can be replayed.** This is the owner's choice, an exception to the root "no fail state" rule. A level ends early only when a join makes a drop that no cup can take (`fitsACup`):
  - In levels that keep colours apart (`mixing: false`), touching another colour is that mistake. A drop of another colour trembles when you come near.
  - In mixing levels, it happens when a join holds more of a colour than any cup wants. For example, two blue drops when the green and purple cups each want one blue.
  - Either way the drops really mix on screen first. Then a card shows the sum as drops (`a + b = mix`), a sentence that explains it, and a big "again" button.
- **Landscape only** (owner's decision): one fixed sheet of 160 × 100 world units (`WORLD_W`, `WORLD_H`), scaled to fit, with the table around it. On an upright screen, `#rotate` (CSS `orientation: portrait`) shows a phone turning, and the game ignores touches. `screen.orientation.lock('landscape')` is tried where the browser allows it. The manifest asks for landscape.
- **Hebrew UI, `dir="rtl"`, playable without reading:** buttons pair a word with an icon (`src/icons.ts`); a cup says what it wants with its colour, a dashed circle the size of the drop it takes, and dots when it takes several.

## How it works

- **Layout** (`game.ts`): the paper is `PAPER` (`render.ts`) inside the world. Cups sit in a row at the bottom, at `CupDef.x` or spread evenly. Drops start where the level puts them, and `spread()` pushes them apart, leaving more room between different colours.
- **Cups:** `need` is the size of drop a cup takes, `total` how much it holds (default `need`), `got` how much is in it. A drop released over a cup goes in if its colour matches and its volume is at least `need`. Otherwise the cup throbs (wrong colour) or its dashed circle swells (too small), and the drop slides back to a free spot.
- **Soft-body drops** (`drop.ts`): a centre plus 64 radial offsets, each a damped spring toward a target shape, coupled to its neighbours (surface tension), with the area held at the volume (`keepArea`).
  - **Dragging:** the centre follows the finger on an under-damped spring (viscous lag, soft overshoot), and the target shape becomes a teardrop pointing at the finger. On release the target is round again and the springs ring down; that is the settle wobble.
  - **Joining** (`mergeInto`): the new outline starts as both old outlines seen from the joint centre (a peanut with a neck), and the springs pull it round. Pigment and volume add up.
  - **Touch** (`reach`): the dragged drop's outline reaching into another drop, so a stretched tip can touch first.
- **Colour** (`color.ts`): drops carry red, yellow and blue pigment amounts; the colour comes from an RYB cube (paint-like mixing). `sameColor` compares proportions.
- **Rendering** (`render.ts`, Canvas 2D):
  - **Drops:** a shadow and a coloured light pool (canvas shadows of an off-screen copy of the path), a see-through body whose gradient stretches with the drop, a dark inner rim, a caustic on the far side, a reflected rim line and a window highlight on the light side (top left). Big drops are flatter: the rim width is capped, so their middle is clearer and their gloss smaller.
  - **Backdrop** (`drawBackdrop`): light oak planks, the black diamond card from the reference photo (its corners peek out above and below the paper), plant leaves on the table (clipped so they stay off the paper), and the paper sheet. It is painted once per resize.
  - **Cups:** marker drawings with scalloped water.
- **Celebration** (`updateParty` / `drawParty`): when the last cup fills, the cups hop one by one with little fountains, three star stickers pop onto the paper, and "כל הכבוד!" is written in marker from right to left in the cups' colours. Then the buttons (next, again, home) float over the paper (`#win`, no card).
- **Home** (`main.ts`): logo, Play/Continue, "from the start" (only with progress; it asks first and clears progress), the Dorothy Games logo, and the level tiles. The tiles show the open levels, each with its cups' colours and a star when done, plus the next locked level. A level opens when the one before it is done.
- **Hints:** after 7 quiet seconds, a see-through fingertip shows a useful move (`suggest()`): a drop a cup takes now, else the closest pair whose join still fits a cup.
- **Sound** (`sfx.ts`):
  - **Touching a drop:** never the same twice. The pitch comes from the drop's size and colour and walks a pentatonic scale on quick touches. Each touch also gets a random pan, a random envelope, sometimes a soft fifth, and a short noise "tick".
  - **Dragging:** a quiet pink-noise slide sound that follows the speed. Letting go gives a low settle plop.
  - **Joins:** a plop and a bell, with two more bells when colours mix. Each cup gets a note (a chord when full).
  - **Celebration:** hop plops, sticker pops and the win arpeggio.
  - All of it goes through a room reverb and a compressor.
- **Save** (`state.ts`): `drop-the-drop:v1` keeps the mute setting and the finished level ids. No stats are collected yet.

## Debug hooks

- `?debug=state` exposes the game as `window.__dd` (`snapshot()` gives positions in CSS pixels); the tests use it. `?level=N` (1–12) picks the level.
- `?debug=play` skips the home screen. `?debug=party&level=N` plays that level's celebration at once. `?debug=lab` is a sandbox with three drops of each base colour, mixing on. `?debug=sheet` shows every colour at three sizes.
- `?debug=icon`: one drop for the icons. Screenshot a 480 × 400 window at device scale 4 and crop 420 px around the centre (750, 590, 1170, 1010) for `public/icon-*.png`, `favicon.png` and `apple-touch-icon.png`.
- `og-image.png` is a 1200 × 630 screenshot of `?debug=party&level=7`, with `#win` and `#topbar` hidden.

## Tests

`npm test` (Playwright):
- **Home screen:** fits four landscape sizes (640 × 360 up to a laptop), with icons, 48 px buttons and tiles, the open levels plus one locked tile, and the portal link. An upright screen shows the turn prompt. "From the start" asks first. A level tile opens its level, and the house button comes back.
- **Every level:** solvable (the drops' pigment equals what the cups want), starts with drops apart and above the cups, and has a hint.
- **Play:** level 6 is won by joining and pouring, and "next" opens level 7. Level 2's cup fills drop by drop. A small drop is refused. Red touching blue explains purple. Level 9 mixes orange into its cup. Level 10's two blue drops end with the "no cup" card.
