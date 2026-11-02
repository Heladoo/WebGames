# CLAUDE.md (drop-the-drop)

**Drop the Drop** (טיפות צבע לכוסות) is a calm game for young children, after a real activity: drops of coloured water on smooth paper are pushed with a stick into cups drawn on the paper. The player drags drops, joins drops of one colour into a bigger drop, keeps colours apart (or mixes them, in later levels), and takes each drop to the cup of its colour. Shared rules (Vercel, CSP, sound, saves, home screen) are in the root `CLAUDE.md`.

## Status

**A one-level sample**, built to agree on the look and feel before the full game. The level (`sample` in `src/levels.ts`): three red and three blue drops, interleaved; a red cup and a blue cup, each waiting for one drop of volume 3. The planned progression (one colour and just drag → join → join and keep colours apart → mix to get new colours) is in `BACKLOG.md`. `?level=mix` already plays a mixing level (orange, green, purple cups) as a preview.

## Principles (the owner asked for these)

- **The drops are the game.** The motion, joining, gloss and see-through look of the drops get the most care; everything else is simple.
- **Slow and stress free.** No timer, no score. The drag speed is capped (`VMAX`), refusals are a gentle sway and two soft notes.
- **A mistake shows its reason and the level can be replayed.** The only way to fail is touching a drop of another colour in a level without mixing: the drops really mix on screen first, then a card shows `red + blue = purple` as drops, a sentence, and a big "again" button.
- **Hebrew UI, `dir="rtl"`, playable without reading:** buttons pair a word with an icon (`src/icons.ts`); the cups say what they want with their colour and a dashed circle the size of the drop they need.

## How it works

- **World units** (`game.ts`): the short side of the screen is 100 units; a drop of volume 1 has radius `R1` (`drop.ts`). The paper is the whole screen; cups sit along the bottom, drops start in the free part above them (`zone()`), pushed apart by `spread()` (more room between different colours).
- **Soft-body drops** (`drop.ts`): a centre plus 64 radial offsets, each a damped spring toward a target shape, coupled to its neighbours (surface tension), with the area held at the volume (`keepArea`).
  - **Dragging:** the centre follows the finger on an under-damped spring (viscous lag, soft overshoot); the target shape becomes a teardrop pointing at the finger. On release the target is round again and the springs ring down: the settle wobble.
  - **Joining** (`mergeInto`): the new outline starts as both old outlines seen from the joint centre (a peanut with a neck), and the springs pull it round. Pigment and volume add up.
  - **Touch** (`reach`): the dragged drop's outline reaching into another drop, so a stretched tip can touch first. A drop of another colour close by trembles (`shiver`) as a warning.
- **Colour** (`color.ts`): drops carry red/yellow/blue pigment amounts; colour comes from an RYB cube (paint-like mixing: red + yellow = orange). `sameColor` compares proportions.
- **Rendering** (`render.ts`, Canvas 2D): per drop, a shadow and a coloured light pool (canvas shadows of an off-screen copy of the path), a see-through body with a gradient stretched with the drop's shape, a dark inner rim, a caustic on the far side, a reflected rim line and a window highlight on the light side (top left). Big drops are flatter: the rim width is capped, so their middle is clearer and their gloss smaller. Cups are marker drawings with scalloped water like the reference picture.
- **Cups:** a drop released over a cup goes in if its colour matches and its volume is at least `need`; otherwise the cup throbs (wrong colour) or its dashed circle swells (too small), and the drop slides back to a free spot.
- **Hints:** after 7 quiet seconds a see-through fingertip shows a useful move (`suggest()`).
- **Sound** (`sfx.ts`): plops (a sine rising fast, like a ringing bubble), FM bells on a pentatonic walk for each join, a three-note chime per cup, a soft two-note "no", a gentle "oh" for a mix, and a bell arpeggio over a pad for the win. Room reverb and a compressor.
- **Save** (`state.ts`): `drop-the-drop:v1` keeps the mute setting and finished levels. No stats are collected yet.

## Debug hooks

- `?debug=state` exposes the game as `window.__dd` (`snapshot()` gives positions in CSS pixels); the tests use it.
- `?debug=play` skips the home screen. `?debug=sheet`: every colour at three sizes. `?debug=icon`: one big drop for the icons (screenshot 400×400, crop 40 px; `public/icon-*.png`, `favicon.png`, `apple-touch-icon.png`). `og-image.png` is a 1200×630 screenshot of the home screen.
- `?level=mix` plays the mixing preview.

## Tests

`npm test` (Playwright): the home screen fits four screen sizes with icons and 48 px buttons and links to the portal; "from the start" asks first; joining three drops and pouring them into their cups wins; a small drop is refused and stays; a red drop touching a blue one shows the explanation and "again" restarts.
