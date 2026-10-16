# CLAUDE.md (palace-race)

**המרוץ לארמון** (Race to the Palace) is a calm racing game for children aged about 4–9. The child picks a royal animal (unicorn, horse, fawn, reindeer, dragon) and a child rider. They race the other four animals to the palace, jumping over and ducking under friendly obstacles and collecting candies for speed. At the end, the winner holds a cup while everyone claps. Shared rules (Vercel, CSP, stats, sound, saves) are in the root `CLAUDE.md`.

## Status

**Stage 1 (art) is done; stage 2 (the game) waits for the owner's approval of the art.** What exists:
- the drawings, their debug sheets and tests;
- a title screen whose Play button opens a still of a race (`?debug=mock`);
- the public images.

The approved plan for stage 2 is summarised under "Next" below.

## Principles (the owner asked for these; tests check them)

- **Stress free.**
  - No timer and no countdown pressure. The animal runs by itself.
  - A hit is a soft stumble with sparkles and a short slowdown, never a stop, a red flash or an error sound.
  - Obstacles are announced early by a glowing hint icon (⬆ jump or ⬇ duck) above them.
  - Everyone gets coins, and the ceremony celebrates everyone.
- **Playable without reading.**
  - Every button is a drawn SVG icon (`src/art/icons.ts`, no emoji) with an `aria-label`; any text is small and for grown-ups.
  - Choices are made by tapping pictures.
  - Numbers are shown as pictures: coins, medals, and a progress bar ending at the palace.
- **The UI is Hebrew, `dir="rtl"`.** The race itself runs left to right (the animals face right, as in the owner's reference picture).

## Art (everything is SVG drawn in code)

- **Style:** classic hand-animated look.
  - One ink outline around each piece's joined silhouette (`inked()` in `geom.ts` strokes all shapes thickly in ink, then fills them on top).
  - Soft cel shading (gradients plus blurred light and shadow shapes clipped to the body).
  - Big glossy eyes, flowing locks of mane and tail (`lockPath` + `swell`).
- **Animals** (`art/animals.ts`): one four-legged skeleton (`Species`), facing right.
  - **Poses** (`run0`–`run5` gallop, `jump`, `duck`, `bump`, `stand`, `happy`) set absolute leg angles (from straight down, forward > 0), body pitch, neck and head turn, and eyes.
  - **Ground fit:** the figure is moved so its lowest foot touches y = 0 (minus `lift`).
  - **Near legs** join the body silhouette; their lower parts are redrawn with a thin outline so they read over the belly.
  - **Anchors:** `seat`, `seatAngle`, `rein`, `headTop`, `top`, `nose`, `ground`.
- **Children** (`art/riders.ts`): `maya`, `tamar` (girls), `yoav`, `ari` (boys). Big round heads in a 3/4 turn: both eyes, the far one narrower.
  - **Poses:** `ride0-2`, `jump`, `duck`, `bump`, `wave`, `stand`, `clap0/1`, `trophy`.
  - **Items:** helmets (`basic` in the child's colour, `rainbow`, `stars`, `crown`, `flowers`), braids (`pink`, `gold`, `rainbow`, replacing the hair at the back) and saddles (in `runner.ts`).
  - **Anchors:** `hands`, `head`, `feet`, `chest`.
- **Runner** (`art/runner.ts`): animal, saddle at `seat`, child at the saddle's hip (drawn `RIDER_SCALE` = 1.35× larger when riding), a stirrup to the foot, and reins from the hands to `rein`. `riderPoseFor` maps animal poses to rider poses.
- **Tracks** (`art/tracks.ts`): `forest`, `meadow`, `snow`, `canyon`, `garden`. Each has five layers on a 1600 × 900 stage:
  - `sky`: still, with the palace on the horizon.
  - `far`, `mid`, `ground`, `front`: the scrolling layers (`PARALLAX`).
  - Lanes: hooves touch at `LANE_Y` = 655 / 745 / 835 (far, middle, near), and runners are drawn at `LANE_SCALE`.
  - **Seamless tiles:** every scrolling layer is a tile drawn three times one tile apart (`<use>` in `trackLayer`), so anything that crosses an edge comes back on the other side. Skylines are `periodic()` sums of sines.
- **Obstacles and candies** (`art/props.ts`): three per track (`TRACK_OBSTACLES`), each a `jump` or a `duck` obstacle.
  - **Overhead obstacles** (`duck`) hang with their bottom at `DUCK_GAP`. Their far post or trunk is in `back` (drawn behind the runner), the rest in `svg`.
  - **Jump obstacles** are drawn `JUMP_SCALE` larger and stay lower than `JUMP_PEAK`.
  - **Candies:** `wrapped`, `lolly`, `swirl`, and a rare `gold` star.
- **Ceremony** (`art/podium.ts`): the palace garden.
  - The winner holds the `trophy()` on the top step; the others clap, with medals.
  - Children right of the winner are mirrored to face it. Medals are drawn outside the mirrored group so their numbers read correctly.
  - The animals stand behind their children.
- **Palace** (`art/palace.ts`): used in every sky, in the logo and in the ceremony. `haze` mixes it toward the sky for distance.
- **Logo** (`art/logo.ts`): live inline SVG, not painted, so its Hebrew letters use the page's self-hosted Fredoka (an SVG painted into a canvas cannot use page fonts).
- **Painting:** `art/sprite.ts` `paint()` turns an SVG string into a canvas (`raster.ts`, copied from bead-box). Characters are drawn in local coordinates with the ground at y = 0, inside `RUNNER_BOX`. Debug sheets paint each piece into its own canvas, so gradient ids never collide.
- **Paint helpers:** `art/paint.ts` is bead-box's painter's toolkit (clouds, foliage, trunks, pines, ferns, blossoms, rays). `art/geom.ts` adds blob and curve paths, ribbons, capsules, `inked`, `shade` and `mix`.

## Debug pages

All of them set `window.__ready`; screenshot after it.
- `?debug=animals` (`&animal=`, `&pose=a,b`, `&scale=`).
- `?debug=riders`.
- `?debug=wardrobe` (`&animal=&kid=`).
- `?debug=obstacles`.
- `?debug=track&track=forest&x=` (layers stacked and scrolled).
- `?debug=podium&order=unicorn,horse,…`.
- `?debug=logo`, `?debug=icons`.
- `?debug=mock&track=` (a race still with HUD and touch buttons).
- **Public images** (render with Playwright and commit to `public/`):
  - `?debug=icon&size=512` (`&round=1` for the transparent round favicon, `&pad=1` for the maskable icon);
  - `?debug=og` for `og-image.png`.
- **Numbers for the tests:** `?debug=rig` → `window.__rig`; `?debug=seams` → `window.__seams` (seam difference, paint ms and colour count per layer).

## Tests

`npm test` (Playwright, Vite on port 5199): `tests/art.spec.ts` checks that:
- feet are on the ground except when jumping;
- the seat is on the back;
- ducking fits under every overhead obstacle and an upright runner does not;
- jump obstacles stay under `JUMP_PEAK`, and every track has both kinds of obstacle;
- tiles have no seam, paint quickly and have detail;
- every sheet renders without errors;
- every button has an icon and a label;
- the HUD stays on screen without overlaps at a landscape phone, a tablet and a portrait phone.

When art changes, fix the art until these pass; don't loosen a rule.

## Next (stage 2, after approval)

- **Screens:** title → track map (locked tracks show a lock and a coin price) → pick an animal (picture) → pick a child → shop → race → ceremony → coins.
- **Race** (Canvas 2D, from the painted sprites):
  - Controls: ⬆ jump, ⬇ duck, ←/→ change lane (far/near). Keyboard and the on-screen buttons.
  - A hint bubble shows above each obstacle; the first race has a tutorial hand.
  - Gentle rubber-band opponents; a race lasts about 60–90 s.
- **Coins:** 50 / 40 / 35 / 30 / 25 by place, plus one per candy. Track prices are 0 / 80 / 120 / 160 / 200.
- **The rest:** save key `palace-race-save-v1`, stats prefix `pr:`, synthesized sound, grown-ups settings behind a hold button, and a portrait-phone layout.
