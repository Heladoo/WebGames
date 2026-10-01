# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

`WebGames` is a monorepo for browser games; currently only `otter-river/` exists (Vite + TypeScript + Canvas 2D, no runtime dependencies, no game engine). Everything below assumes `cd otter-river`. There is no test runner or linter: `npm run build` (`tsc --noEmit && vite build`) is the check, and `tsc` runs with `strict`, `noUnusedLocals` and `noUnusedParameters`.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build into dist/
npm run preview
```

Deploy: Vercel project with **Root Directory = `otter-river`** (framework Vite). `vercel.json` sets a strict CSP and security headers (scripts `'self'` only; fonts from Google Fonts; `connect-src 'self'`), so new external hosts or inline scripts need a header change. `api/stats.js` is a plain-ESM serverless function.

## Debug URLs (the main way to verify changes)

There are no automated tests; features are checked in a browser (Playwright/Chromium is available) using query parameters handled in `src/main.ts`:
- `?debug=wardrobe`: renders every item × animation pose on one sheet (`src/debug.ts`); use it to check item anchoring after art changes.
- `?debug=river`: exposes `window.game` for scripted checks.
- `?debug=assets&kind=og|icon`: renders the social image / app icon from game art (output committed in `public/`).
- Scene helpers: `?time=0..1` (day phase), `?island=1`, `?dam=1`, `?animal=heron|deer|ducks|…`, `?rain=1`, `?skip=<world px>`, `?shells=N`.
- Stats counting is disabled on localhost and on any `?debug` URL.

## Architecture

**All art is code, not image files.** Sprites are text grids baked once into offscreen canvases (`art/sprite.ts`), or built from shaded shapes (`art/shapes.ts`: `ellipse`, `shape`, light from top-left) plus hand-placed pixels. Every pixel letter must exist in `PALETTE` (`art/palette.ts`); `bake()` throws on unknown letters at load. Translucent letters (`Q J X Z`) are the glasses lenses. Sprites carry a pivot, and `draw()` places by pivot.

**The otter is a puppet** (`art/otter.ts`, `otterDraw.ts`): separate head/body/paw/foot/tail parts moved in whole pixels by `Pose`. Items attach to named **anchors** (`anchors()` in `otterDraw.ts`: headTop, eyes, neck, pawR, belly…) using each item's pivot, and `drawOtter` sorts layers by `z` (`Z` in `art/items.ts`). Changing otter proportions means re-tuning `PART`, `anchors()` and item pivots, then checking the wardrobe sheet. `art/items.ts` is also the catalog (price, `unlockAt` lifetime-shell threshold, slot, optional pet mode `follow|ride|fly`); the swimsuits are generated from the otter body grid so they always fit.

**The world is a pure function of the scroll distance.** `river.ts` computes channels, biomes, islands and beaver dams from the world row `wy` (deterministic via `hash`), so scenery scrolls without storing state. `River.channels(wy)` is where the otter may swim (dams narrow it to the gap); `River.water(wy)` is the visible water (islands only). Anything the otter must be unable to overlap goes through `River.freeRange()`; `Game.update` hard-clamps to it. Spawning, collisions, rendering, day/night, rain and photo moments live in `game.ts`; passing animals in `fauna.ts`.

**Fixed-resolution pixel canvas.** `main.ts resize()` picks an integer scale from the *window* (not the stage) so opening/closing the market drawer never changes the otter's size, only how much world shows. `Game.otterY` eases toward 64% of the stage height. Portrait/phone vs desktop use different virtual-size targets (see `resize()`).

**UI is DOM around the canvas**: HUD, market dock (side panel on desktop, bottom drawer in portrait via a media query duplicated in `main.ts` `mobileDock()`), album/viewer, pause. Numbers are drawn with the pixel digit sprites (`numbers.ts`), not text. `shop.ts` drives the market live (the game never pauses for shopping); owned items toggle instantly and unowned ones preview as a ghost on the real otter.

**Persistence** (`state.ts`): one `localStorage` save (`otter-river-save-v1`; always wrapped in try/catch, load migrates the old single-`pet` format). Photos live in IndexedDB (`album.ts`).

**Photos and sharing**: a photo is a framed postcard PNG plus a small `Recipe` (`game.recipe()`); share links are `?photo=<base64url recipe>` and re-render the scene via `Game.applyRecipe` on the recipient's side. Recipes come from strangers, so `decodeRecipe` clamps numbers, whitelists item ids and animal kinds, and the caption is always rebuilt locally. Keep that validation if the `Recipe` shape changes.

**Audio** (`audio.ts`): everything is synthesized with Web Audio (generative music box, river/rain/wind beds, bird/frog/cricket critters, collect melody that walks a scale). It must be unlocked by a user gesture. Never connect an oscillator to a gain parameter at audio rate (an earlier frog croak did and sounded like an error buzz); there is a master limiter.

**Stats** (`src/stats.ts` → `api/stats.js` → Upstash Redis REST; dashboard at `public/stats.html`): anonymous counts of plays, estimated unique players (HyperLogLog of a random id) and play time. The function reads `UPSTASH_REDIS_REST_URL/TOKEN` or `KV_REST_API_URL/TOKEN` plus `STATS_KEY`; the REST URL must be `https://<name>.upstash.io` with no port. POSTs are silent no-ops when unconfigured so the game never breaks. Keep Redis commands per play low (free plan is 500k/month).

**Build-time SEO**: `vite.config.ts` replaces `%SITE_URL%` in `index.html` (from `SITE_URL`, else Vercel's production URL) and emits `robots.txt` and `sitemap.xml`.

## Conventions worth knowing

- Match the existing sprite style: 1px `O` outline in soft plum, 3-tone shading, light from the top-left; reuse `shapes.ts` helpers.
- `prefers-reduced-motion` is honored through `game.reducedMotion` (bob, tail, shimmer, sparkles).
- The README documents the player-facing features and the full Vercel/Upstash stats setup; keep it in sync when behavior changes.
- Commits end with the attribution lines specified by the session; develop on the branch named by the task and don't open PRs unless asked.
