# CLAUDE.md (otter-river)

Game-specific guidance for `otter-river/`. Monorepo-wide topics (Vercel deploy and headers, Upstash stats setup, photo-sharing pattern, Web Audio rules, pixel-art approach) are in the root `CLAUDE.md`; this file only covers what is particular to the otter game.

## Commands

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc --noEmit + vite build → dist/
npm run preview
```

## Debug URLs

Handled in `src/main.ts`:
- `?debug=wardrobe`: every item × pose on one sheet (`src/debug.ts`); check item anchoring after any art change.
- `?debug=river`: exposes `window.game` for scripted checks (e.g. measuring otter/obstacle overlap).
- `?debug=assets&kind=og|icon`: renders the social image / app icon from game art (results committed in `public/`).
- Scene helpers: `?time=0..1` (day phase), `?island=1`, `?dam=1`, `?animal=heron|deer|ducks|kingfisher|bunny|fish|dragonflies`, `?rain=1`, `?skip=<world px>`, `?shells=N`.

## The otter puppet

`art/otter.ts` builds head/body/paw/foot/tail parts; `otterDraw.ts` moves them in whole pixels via `Pose` (bob, head breathing, lean, paws, feet, tail, eyes). Items attach to named anchors (`anchors()`: headTop, eyes, ears, neck, pawR, belly, lap, perch, float) using each item's pivot, and `drawOtter` sorts layers by `z` (`Z` in `art/items.ts`). Changing otter proportions means re-tuning `PART`, `anchors()` and item pivots, then re-checking the wardrobe sheet. The otter has exactly two hind feet (a four-leg bug existed once).

`art/items.ts` is also the catalog: slot, price, `unlockAt` (lifetime-shell threshold), anchor, optional `pet` mode (`follow` trails behind, `ride` sits on the otter, `fly` orbits it) and `special` (`balloon`, `bubbles`, `lantern`). Swimsuits are generated from the otter body grid so they always fit. Glasses use the translucent palette letters `Q J X Z` so eye animations stay visible. Pets are a separate list in the save (several can be active); other slots hold one item each.

## The world

`river.ts` computes channels, biomes, islands and beaver dams as pure functions of the world row `wy` (deterministic via `hash`), so scenery scrolls without stored state and photo recipes can replay a scene.
- `River.channels(wy)`: where the otter may swim (dams narrow it to the gap). `River.water(wy)`: visible water (islands split it, dams don't).
- Anything the otter must not overlap goes through `River.freeRange()`; `Game.update` hard-clamps to it. Rocks use `resolveRocks` to slide the otter around them. Pickups spawn only inside the reachable range (`reachableX`), and decorative bank props must never look like pickups (beach decor is starfish/pebbles/sandcastles, not shells).
- Biomes (meadow, blossom, forest, marsh, cove) change decor, falling petals/leaves, pad frequency and the ambience mix. The day cycle is `DAY_LENGTH` seconds; sky tint is keyframed in `SKY`.
- `game.ts` owns spawning, collisions, rendering, rain, the beaver and `photoMoment()` hints; `fauna.ts` owns passing animals (`snapshot`/`inject` serialize one into a photo recipe).

## Screen and layout

`main.ts resize()` chooses the pixel scale: ~240 virtual px across in portrait, ~340 px tall on desktop, ~290 px tall on short (phone-landscape) screens. The market is a side dock on desktop and a bottom drawer in portrait, switched by a media query that is duplicated in `main.ts` as `mobileDock()` (keep the two in sync). `Game.otterY` eases toward 64% of the stage height, so the otter sits lower when the drawer is closed but never changes size.

The market (`shop.ts`) never pauses the game: owned items toggle instantly, unowned ones preview as a ghost on the real otter, an unaffordable buy shakes the button and plays the deny sound, locked items show a lock badge, and a "NEW" banner (top of the stage, tap to jump to the item) fires once per item (persisted in `announced`).

## Photos

`game.recipe()` / `Game.applyRecipe()` define the recipe; `album.ts` stores photos and encodes/decodes links (`decodeRecipe` validates against the item list passed in from `main.ts`). `?photo=…` renders a read-only postcard page via `showPostcardPage` in `main.ts`; `Game.still` freezes spawning and motion for it.

## Stats

Uses the shared pattern with Redis key prefix `or:`. Client in `src/stats.ts`; function in `api/stats.js`; dashboard `public/stats.html` + `stats.js` (the file is static, not part of the Vite bundle).
