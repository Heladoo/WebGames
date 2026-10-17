# CLAUDE.md (palace-race)

**המרוץ לארמון** (Race to the Palace) is a calm racing game for children aged about 4–9. The child picks a royal animal (unicorn, horse, fawn, reindeer, dragon) and a child rider. They race the other four animals to the palace, jumping over and ducking under friendly obstacles and collecting candies for speed. At the end, the winner holds a cup while everyone claps. Shared rules (Vercel, CSP, stats, sound, saves) are in the root `CLAUDE.md`.

## Status

**The game is playable.** The owner approved the art; stage 2 built the game around it:
- **Flow:** title → map → animal → rider → race → ceremony with coins.
- **Also:** a shop, a grown-ups panel, sound and music, and anonymous stats.

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
- **Faces must be cute and clear** (owner's request).
  - Big glossy eyes with a large iris, two highlights and a sparkle; lashes (except the dragon and reindeer); a soft brow; rosy cheeks and a clear smile.
  - Animal heads are short and round. Children have big heads (`HEAD_R` = 30) with the eyes set low and a high forehead.
  - The helmet chin strap runs behind the ear, never across the face.
  - Check `?debug=faces`. A test keeps every eye at least 4 px in the far lane of a 1280 × 720 screen (`EYE_R` in animals.ts, `eyeR` on the anchors).
- **Children** (`art/riders.ts`): `maya`, `tamar` (girls), `yoav`, `ari` (boys). Big round heads in a 3/4 turn: both eyes, the far one narrower.
  - **Poses:** `ride0-2`, `jump`, `duck`, `bump`, `wave`, `stand`, `clap0/1`, `trophy`.
  - **Items:** helmets (`basic` in the child's colour, `rainbow`, `stars`, `crown`, `flowers`), braids (`pink`, `gold`, `rainbow`, replacing the hair at the back) and saddles (in `runner.ts`).
  - **Anchors:** `hands`, `head`, `feet`, `chest`.
- **Runner** (`art/runner.ts`): animal, saddle at `seat`, child at the saddle's hip (drawn `RIDER_SCALE` = 1.55× larger when riding: the owner asked for bigger children), a stirrup to the foot, and reins from the hands to `rein`. `riderPoseFor` maps animal poses to rider poses.
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
  - The winner holds the `trophy()` in front of the tummy (never over the face) on the top step.
  - 2nd and 3rd stand on their steps with medals. **4th and 5th have no medal and no number** (owner's request): they stand on the lawn and clap.
  - Children right of the winner are mirrored to face it. Medals are drawn outside the mirrored group so their numbers read correctly.
  - The animals stand behind their children.
- **Palace** (`art/palace.ts`, close-up at `?debug=palace`): drawn in the spirit of the owner's logo.
  - Purple and blue (`PALACE_LOOK`) conical roofs with fish-scale shingles, gold rings and finials, and dormers.
  - Eleven spires and turrets, arched blue-glass windows in gold frames, stone courses and battlements.
  - A crown and balcony on the keep, a golden gate with lanterns, pennants, and a golden glow with sparkles.
  - Used in every sky and in the ceremony; `haze` mixes it toward the sky for distance.
- **The owner's pictures** (not drawn in code; only the processed results are committed, in `public/`). The processing was done once with a Python/PIL script outside the repo.
  - `logo.webp` (900 px) and `logo-small.webp` (360 px) come from the logo on black. A cutout would eat into the logo's own dark outlines, so the black was lifted to a deep indigo night sky and the picture given soft, feathered edges that follow its shape. It is the title-screen heading and is drawn on the link preview.
  - `icon-512.png`, `icon-192.png` and `apple-touch-icon.png` come from the logo in its frame: the black corners outside the rounded frame were filled with the frame's light-blue rim, since iOS turns transparent corners black.
  - `favicon.png` is a round crop of the unicorn-and-palace picture, with transparent corners. `icon-maskable-512.png` is that picture whole, because its full purple background survives round masks.
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
- `?debug=faces` (close-ups of every face), `?debug=palace`, `?debug=icons`.
- `?debug=mock&track=` (a race still with HUD and touch buttons).
- **Link preview:** render `?debug=og` (`#og`) with Playwright and commit it as `public/og-image.png`.
- **Numbers for the tests:** `?debug=rig` → `window.__rig`; `?debug=seams` → `window.__seams` (seam difference, paint ms and colour count per layer).

## Tests

`npm test` (Playwright, Vite on port 5199): `tests/art.spec.ts` checks that:
- feet are on the ground except when jumping;
- the seat is on the back;
- ducking fits under every overhead obstacle and an upright runner does not;
- jump obstacles stay under `JUMP_PEAK`, and every track has both kinds of obstacle;
- tiles have no seam, paint quickly and have detail;
- every sheet renders without errors;
- every eye is big enough to read at game size;
- every button has an icon and a label;
- the title logo and Play button fit on screen;
- the HUD stays on screen without overlaps at a landscape phone, a tablet and a portrait phone.

When art changes, fix the art until these pass; don't loosen a rule.

## The game (`src/`)

| File | Purpose |
|---|---|
| `content.ts` | Pure data. Track prices (0/80/120/160/200), shop items and prices (the first of each kind is free), coins by place (50/40/35/30/25) plus 1 per 4 candies (`raceCoins`), per-track `DIFFICULTY`, and `TUTORIAL_RACES`. |
| `state.ts` | Save key `palace-race-save-v1`. Every field is validated on load, and nothing unowned is ever worn. Saving is debounced 400 ms. `stopSaving()` is for pretend games. |
| `race/sim.ts` | The race as a pure, deterministic simulation (`Race`, `buildCourse`), described in the next section. |
| `race/calibrate.ts` | `simulate()` / `simulateAll()`: hundreds of races without drawing, for `?debug=sim` and `sim.spec.ts`. |
| `race/sprites.ts` | Paints everything a race needs before it starts (runners × 10 poses, track layers, props, candies, hint icons, the palace). The scale comes from the screen (`paintScale`), and the results are cached. |
| `race/view.ts` | Canvas 2D drawing, described under "Drawing" below. |
| `race/input.ts` | Keyboard (arrows/WASD/Space, Esc or P to pause), on-screen buttons on `pointerdown`, and swipes on the stage. |
| `race/race.ts` | One race: a hoof-print loading bar, the 3-2-1 lights and horn, the frame loop, the HUD, sounds, the tutorial hand and the pause screen. `racersFor` gives the opponents: the other four animals, ridden by the other children in random outfits. The repeated child always gets a different helmet. |
| `app.ts` | Screen routing, the top bar (home, coins, shop, and the grown-ups gear that needs a 1.5 s hold), the grown-ups panel, and settings. |
| `screens.ts` | Title, map, animal and rider choice, shop, race and ceremony. Buying shows coins flying (`flyCoins`); "not yet" is a wobble with a coin jar (`jar`). The ceremony paints `podiumSVG` with the real order, then confetti, claps, a coin count-up, and buttons for again, map, shop and share (`navigator.share` with a file, else a download). |
| `ui.ts` | Cached painted pictures (`animalPic`, `kidPic`, `trackPic`, `skyPic`), `holdButton`, `flyCoins`, `jar` and `coinTag`. |
| `sfx.ts`, `music.ts` | Synthesized effects through a limiter (no error sounds: a stumble is a soft boing). A music box over a soft pad, with a mood for each track. No oscillator drives a gain. |
| `stats.ts`, `api/stats.js`, `public/stats.*` | The shared stats pattern with prefix **`pr:`** and anon id `palace-race-anon`. A play is counted when the first race of a visit starts; time ticks only while racing. |

## How the race works (`race/sim.ts`)

- **Speed:** a base of 330 units/s.
  - **Candies** fill the rainbow bar (+12%, gold +30%) for up to +35% speed. A full bar gives a 2.2 s rainbow dash (+40%).
  - **A stumble** (`BUMP_TIME`) dips speed to 55% and brings it back; it never stops the runner.
- **Forgiving timing:** a jump pressed up to 1.3 s early is *aimed*. It waits a moment and/or floats longer (up to `MAX_JUMP`) so the runner is in the air as it passes. A duck lasts until the obstacle is passed.
- **Courses:** built from a seed.
  - An obstacle covers one lane, or two on harder tracks, never three.
  - There are candy lines between obstacles, and candies above some jump obstacles that can only be taken by jumping.
- **Tutorial** (the first `TUTORIAL_RACES` races): before each of the first three obstacles everything slows to 30%, and the right button glows with a pointing hand. After 2.6 s the animal acts by itself.
- **Help mode** (the grown-ups switch, on by default): when the child does nothing, the animal dodges by itself 60% of the time.
- **Opponents:**
  - Each one plans every obstacle once: act (with probability `skill`), dodge to a free lane, or miss. They also steer toward candies.
  - The rubber band is gentle: up to −10% when ahead of the child and +4% when behind.
- **Calibration** (`?debug=sim`), as checked by `sim.spec.ts`:
  - **An average child** (70%) wins about 60% of races, and **a perfect child** about 80%.
  - **A child who never presses** still always finishes, at most about 12 s behind, with at least 25 coins.
  - **Races** last 55–75 s.
- **The end:** the order is fixed when the child has finished and the others have too, or 3 s later.

## Drawing (`race/view.ts`)

- **Landscape:** the stage covers the screen by its height.
- **Portrait:** the stage is about 720 units wide at the top, and the big buttons sit below it.
- **Camera:** the child's runner stays at 36% of the width.
- **Depth:** lanes are drawn far to near. Within a lane, the obstacle's back is drawn first, then candies, runners, and the obstacle's front.
- **The child's runner never disappears:** it stands in a golden glow, and an opponent in a nearer lane that overlaps it is drawn see-through.
- **Hints:** a hint bubble (⬆ above a low obstacle, ⬇ in front of an overhead one) shows for the next obstacle in the child's lane.
- **Particles:** sparkles, stumble stars, dust and a rainbow trail. They are reduced under `prefers-reduced-motion`.
- **The finish:** in the last 35% the horizon palace grows and sharpens in place. There is a checkered strip and a flag gate at the finish.

## Debug and test hooks for the game

- `?debug=race&track=&animal=&kid=&seed=&autopilot=0.9&speed=4&tutorial=1&help=0` starts a race at once, with `window.game` (the `Race`) and `window.__result`.
- `?debug=sim&n=60` shows the calibration table and sets `window.__sim` and `window.__det` (the determinism check).
- In the real game:
  - `window.__drive = { autopilot, speed }` (set before load) drives races, and is what `flow.spec.ts` uses.
  - `?screen=map|animal|kid|shop`, `?coins=N`, `?open=all` and `?races=N` set up a pretend game; these turn saving off.
- **Playwright:** the breathing Play buttons never become "stable", so tests click them with `force`.

## Tests (game)

- **`sim.spec.ts`:** the promises above, on every track, for every kind of player, plus determinism.
- **`flow.spec.ts`:**
  - the whole flow with saving;
  - unlocking with and without enough coins;
  - buying, wearing, and not enough coins;
  - keyboard and buttons, and pause;
  - the long press for the grown-ups panel.
- **`art.spec.ts`** also checks that every button on every screen has an icon and a label, and that the live race HUD fits at three sizes.
- **Before shipping:** build and check the production preview against `vercel.json`'s headers. The CSP must report no violations through a whole race and the ceremony.
