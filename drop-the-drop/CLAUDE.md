# CLAUDE.md (drop-the-drop)

**Drop the Drop** (טיפות צבע לכוסות) is a calm game for young children, after a real activity: drops of coloured water on smooth paper are pushed with a stick into cups drawn on the paper. The player drags drops, joins drops of one colour into a bigger drop, keeps colours apart or mixes them, and takes each drop to the cup of its colour. Shared rules (Vercel, CSP, sound, saves, home screen) are in the root `CLAUDE.md`.

## Status

**Twenty levels** (`src/levels.ts`), slow and gentle:

- **1–2:** drag drops into a cup. Level 2's cup takes three small drops; dots on the glass count them.
- **3:** sort two colours.
- **4–5:** join drops, because the cup wants a bigger drop.
- **6–8:** join each colour and keep the colours apart. Level 6 is the first sample.
- **9–12:** mix colours (red + yellow = orange, and so on). Level 12 mixes one colour and keeps another apart.
- **13–14:** the in-between colours: turquoise (two blue, one yellow) and lime, with a blue cup that must keep one blue for itself.
- **15–20:** splitting. Level 15 teaches it (its hint comes after 2.5 s, `teach: 'split'`), then big drops are split to share one colour between two mixes. These levels use red-orange, indigo, magenta, lime and turquoise, and level 19 starts with a big green drop.

The first sample was approved. The owner's feedback since then is done:
- an in-scene celebration;
- the table background;
- choosing a level two ways (the next level, or the levels screen);
- landscape only;
- a more varied touch sound;
- names for every mixable colour, the plant growing from level to level, faster drops for fast fingers, a quicker celebration, the owner's logo;
- levels with in-between colours (turquoise and friends) and splitting a drop with a double tap.

Ideas still open are in `BACKLOG.md`.

## Principles (the owner asked for these)

- **The drops are the game.** The motion, joining, gloss and see-through look of the drops get the most care; everything else is simple.
- **Calm, but quick when the child is quick.** No timer, no score. A slow drag is capped at a calm `VMAX`, but when the finger runs far ahead the spring pulls harder and the cap rises to `VMAX_FAST` (owner's request). Touches are checked on every physics step, so a fast drop cannot jump over another one. Refusals are a gentle sway and two soft notes.
- **A mistake shows its reason, and the level can be replayed.** This is the owner's choice, an exception to the root "no fail state" rule. A level ends early only when a join makes a drop that no cup can take (`fitsACup`):
  - In levels that keep colours apart (`mixing: false`), touching another colour is that mistake. A drop of another colour trembles when you come near.
  - In mixing levels, it happens when a join holds more of a colour than any cup wants. For example, two blue drops when the green and purple cups each want one blue.
  - A drop that is too big is not a mistake when halving it would fit, since it can be split (`fitsACup` tries halves down to a volume of 1).
  - Either way the drops really mix on screen first. Then a card shows the sum as drops (`a + b = mix`), a sentence that explains it, and a big "again" button.
  - **A dead end** (`checkStuck`) also ends the level gently: when `suggest()` finds no useful move for 1.2 s (no pour, no join that fits a cup, no split whose halves fit), a card shows the drops that are left and suggests trying again. This is a heuristic; a few hopeless states can still look hopeful (a drop whose halves fit by amount but can never reach the exact mix).
- **Landscape only** (owner's decision): one fixed sheet of 160 × 100 world units (`WORLD_W`, `WORLD_H`), scaled to fit, with the table around it. On an upright screen, `#rotate` (CSS `orientation: portrait`) shows a phone turning, and the game ignores touches. `screen.orientation.lock('landscape')` is tried where the browser allows it. The manifest asks for landscape.
- **Hebrew UI, `dir="rtl"`, playable without reading:** buttons pair a word with an icon (`src/icons.ts`); a cup says what it wants with its colour, a dashed circle the size of the drop it takes, and dots when it takes several.

## How it works

- **Layout** (`game.ts`): the paper is `PAPER` (`render.ts`) inside the world. Cups sit in a row at the bottom, at `CupDef.x` or spread evenly. Drops start where the level puts them, and `spread()` pushes them apart, leaving more room between different colours.
- **Cups:** `need` is the size of drop a cup takes, `total` how much it holds (default `need`), `got` how much is in it. Cups can be any colour in `PIG`, including the in-between ones. A drop released over a cup goes in if its colour matches and its volume is at least `need` and at most the room left. Otherwise the cup throbs (wrong colour) or its dashed circle swells (too small), and the drop slides back to a free spot.
- **Soft-body drops** (`drop.ts`): a centre plus 64 radial offsets, each a damped spring toward a target shape, coupled to its neighbours (surface tension), with the area held at the volume (`keepArea`).
  - **Dragging:** the centre follows the finger on an under-damped spring (viscous lag, soft overshoot), and the target shape becomes a teardrop pointing at the finger. On release the target is round again and the springs ring down; that is the settle wobble.
  - **Joining** (`mergeInto`): the new outline starts as both old outlines seen from the joint centre (a peanut with a neck), and the springs pull it round. Pigment and volume add up.
  - **Touch** (`reach`): the dragged drop's outline reaching into another drop, so a stretched tip can touch first.
  - **Splitting** (`split`, owner's request): a double tap on a drop (a second tap on the same drop within 0.4 s, in the same place) splits it into two halves with half the paint each. The halves start overlapping and stretched toward each other, then slide apart in the direction with the most room (away from other drops, the edges and the cups) and round off. Drops smaller than 2 only wobble (`sfx.noSplit`).
  - **Paint per volume:** one unit of paint per unit of water, so a level's big mixed drop (a green drop of volume 4) is `share(PIG.green) × 4`.
- **Colour** (`color.ts`): drops carry red, yellow and blue pigment amounts; the colour comes from an RYB cube (paint-like mixing). `sameColor` compares proportions.
  - **Names:** every colour a child can mix has a Hebrew name (`colorName`, `COLOR_HE`). These are the three base colours, the three secondary ones, and the in-between ones: אדום-כתום, צהוב-כתום, ירוק-ליים, טורקיז (blue + green), כחול-סגול, סגול-אדום, and חום. A colour without an everyday adjective reads "טיפה בצבע טורקיז" (`aDrop` in `main.ts`).
- **Rendering** (`render.ts`, Canvas 2D):
  - **Drops:** a shadow and a coloured light pool (canvas shadows of an off-screen copy of the path), a see-through body whose gradient stretches with the drop, a dark inner rim, a caustic on the far side, a reflected rim line and a window highlight on the light side (top left). Big drops are flatter: the rim width is capped, so their middle is clearer and their gloss smaller.
  - **Backdrop** (`drawBackdrop`): light oak planks, the black diamond card from the reference photo (its corners peek out above and below the paper), the paper sheet, and a plant whose leaves lean over the paper's top-left corner. It is painted once per resize and per level.
  - **The plant grows over the levels** (`LEAVES`, `plant()`): each leaf has the level it appears at. New leaves sprout small and light green and grow over the next levels, and every leaf turns a little from level to level. A pink bud appears at level 9 and blooms by level 11, and a violet one appears at level 15 and blooms by level 17 (`flower()`).
  - **Cups:** marker drawings with scalloped water.
- **Celebration** (`updateParty` / `drawParty`, timing in `PARTY`, quick on the owner's request; the buttons come after about a second): when the last cup fills, the cups hop one by one with little fountains, three star stickers pop onto the paper, and "כל הכבוד!" is written in marker from right to left in the cups' colours. Then the buttons (next, again, home) float over the paper (`#win`, no card).
- **Choosing a level, two ways** (owner's request; `main.ts`):
  - **The next level:** Play/Continue on the home screen resumes a level under way, or, after a finished level, opens the next one. The "next" button at the end of a level does the same.
  - **The levels screen** (`#pick`): opened from the home screen's "Levels" button or the "Levels" button at the end of a level. It shows a tile for every open level (its cups' colours, and a star when done), plus the next one, locked. A level opens when the one before it is done. The house button goes back to the home screen. Leaving a level under way asks first.
- **Buttons are liquid jelly** (owner's request, to match the logo; the "liquid buttons" block in `styles.css`): a glossy gradient body with a darker rim, a white shine and a slightly uneven blob shape; a press squashes it. (A small drop hanging from the main buttons was removed: the owner found it detached and confusing.) Blue is the main way on, pale aqua the others, green "yes", and orange the big "next". The top-bar buttons are bubbles and the level tiles are jelly squares.
- **Home:** the owner's logo (`public/logo.webp`, 600 px; its size follows the screen height), Play/Continue and Levels, then the Dorothy Games logo. On tall screens the logo is on top; on phones held sideways (560 px tall or less) it is on the left with the menu on the right, so the card never scrolls (owner's request). The menu buttons share one width, with their icons in one column and their words starting at one line (owner's request). The owner removed the "from the start" button and the subtitle.
- **Hints:** after 7 quiet seconds (2.5 s in a teaching level), a see-through fingertip shows a useful move (`suggest()`): a drop a cup takes now, else the closest pair whose join still fits a cup, else a big drop to split, shown as the finger tapping twice (`tap2`).
- **Sound** (`sfx.ts`):
  - **Touching a drop:** never the same twice. The pitch comes from the drop's size and colour and walks a pentatonic scale on quick touches. Each touch also gets a random pan, a random envelope, sometimes a soft fifth, and a short noise "tick".
  - **Dragging:** a quiet pink-noise slide sound that follows the speed. Letting go gives a low settle plop.
  - **Splits:** two falling plops, a little apart and panned left and right, with a soft bell.
  - **Joins:** a plop and a bell, with two more bells when colours mix. Each cup gets a note (a chord when full).
  - **Celebration:** hop plops, sticker pops and the win arpeggio.
  - All of it goes through a room reverb and a compressor.
- **Save** (`state.ts`): `drop-the-drop:v1` keeps the mute setting and the finished level ids.
- **Anonymous stats** (the shared pattern from the root `CLAUDE.md`, prefix `dd:`): `src/stats.ts` → `api/stats.js` → Upstash, with the dashboard at `public/stats.html`. A play is counted once per visit, when the first level starts. Play time ticks only while a level is on screen (not paused, not upright, not hidden), with a report every 2 minutes and a beacon on page hide. Nothing is counted on localhost or `?debug` URLs. The home screen's small line says what is counted.

## Debug hooks

- `?debug=state` exposes the game as `window.__dd` (`snapshot()` gives positions in CSS pixels); the tests use it. `?level=N` (1–20) picks the level.
- `?debug=play` skips the home screen. `?debug=party&level=N` plays that level's celebration at once. `?debug=lab` is a sandbox with three drops of each base colour, mixing on. `?debug=sheet` shows every colour at three sizes.
- The icons (`public/icon-*.png`, `favicon.png`, `apple-touch-icon.png`) are the owner's logo, resized; so are `logo.webp` and the portal's `art/logos/drop-the-drop.webp`. `?debug=icon` still shows one big drop.
- `og-image.png` is a 1200 × 630 screenshot of the home screen.

## Tests

`npm test` (Playwright):
- **Home and levels screens:** both fit four landscape sizes (640 × 360 up to a laptop). The home screen has icons, 48 px buttons and the portal link. The levels screen shows the open levels plus one locked tile. An upright screen shows the turn prompt. The card never scrolls (also at 800 × 330, a phone with browser bars). The logo sits above the buttons on tall screens and left of them on phones. The buttons share one width and line up their icons and words. Play opens the next level, a tile opens its level, and the house button comes back.
- **Every level:** solvable (the drops' pigment equals what the cups want), starts with drops apart and above the cups, and has a hint.
- **Play:** level 6 is won by joining and pouring, and "next" opens level 7. Level 2's cup fills drop by drop. A small drop is refused. Red touching blue explains purple. Level 9 mixes orange into its cup. Level 12's blue + red ends with the "no cup" card (purple). Level 15's big drop splits on a double tap and its halves fill the two cups; a small drop does not split. Level 13 mixes turquoise. A dead end shows its card. A fast finger pulls a drop along fast.
- **Stats:** `api/stats.js` uses the `dd:` prefix and 4 commands per play, and stays a silent no-op without Redis. The game sends nothing on localhost.
- **Colours:** every mix of up to three parts of each base colour has a Hebrew name, and blue + green is turquoise.
