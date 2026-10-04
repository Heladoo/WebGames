# Bead Box

Calm bracelet-making game that teaches basic English words. Pick a bead shape (tab), pick a color or design, hear and see the word on the word card, then add it with the "+" button (or by tapping the name, or a slot on the bracelet). Twelve beads finish a bracelet, which is saved as a picture of it worn on a wrist in that place, and unlocks the next place. No fail state, no timer. General rules are in the root `CLAUDE.md`; this file holds what is specific to this game.

## Stack choice

Unlike Otter River this is **not pixel art**. The look comes from a mockup: painted scenery, glossy rounded beads, cream cards, Fredoka type. Everything is drawn in code as SVG strings, in two tiers:

- **Painted once:** the scenery of each place (`art/places/*.ts`) and each table with its rope (`art/tables.ts`) are rich SVG (hundreds of shapes, blur and turbulence filters). `scene.ts` rasterizes each into a cached picture (`scenePicture`, `tablePicture`) and the screens show those as plain images. Nothing heavy is ever redrawn per frame.
- **Live:** only the beads (`art/beads.ts`, gradients and masks, no filters) and the empty-slot rings are live SVG on top of the table picture.
- **Moving:** `ambient.ts` is a separate light overlay (gulls, glints, pollen, snow, butterflies) using only simple shapes and CSS transforms, aligned to the background with container-query units, and left out under `prefers-reduced-motion`.

The album picture is the cached scenery with a painted forearm and hand (`art/wrist.ts`, cached as `wristPicture`) over it, and the bracelet drawn fresh as a ring round the wrist: the far half of the ring goes behind the arm and the near half over it, so it really wraps. `photo.ts` composes the layers (scene, back beads, arm, front beads).

## Map of `src/`

| File | Purpose |
|---|---|
| `content.ts` | Places, shapes, designs and the words. `SLOTS = 12`. Pure data, imported directly by tests. |
| `art/beads.ts` | `beadSVG` / `beadInner`. Layers: contact shadow, glazed body, subsurface glow, pattern (masked), rim shading, shape detail, **tunnel**, bounce light, highlights. `view: 'front'` (tray, card) or `'side'` (on the bracelet, hole faces along the string with rope in it). |
| `art/paint.ts` | Seeded painter's toolkit: filters (`FX`), clouds, palms, fronds, foliage, ferns, pines, flowers, buildings, shells, rays, bokeh, vignette. |
| `art/places/*.ts` | One file per place, a 400 x 700 scene. `art/places.ts` is the lookup. |
| `art/tables.ts` | Table, braided rope and knot per place (400 x 350 picture; the screen crops the empty top, `CROP` in `scene.ts`, so the bracelet can be big). |
| `art/wrist.ts` | The wrist photo: forearm, sleeve, hand with nails, and the bracelet ring (`wristBeads` gives `back` and `front` layers). |
| `scene.ts` | `slotGeometry()` (12 slots evenly along the ring), live `braceletInner/braceletSVG`, gold spacers, `scenePicture`, `tablePicture`, album layout constants. |
| `raster.ts` | `svgToCanvas`, `canvasURL`: paint an SVG once. |
| `backdrop.ts` | Full-screen background and thumbnails from the cached pictures (`bgScale` picks the resolution for the screen). |
| `workshop.ts` | The make screen: tabs, grid, word card, placing, sparkle burst, finishing. |
| `map.ts`, `menus.ts` | Place map; album, viewer, settings, shared-link landing. |
| `album.ts`, `photo.ts` | IndexedDB photos, recipe encode/decode (strict validation), sharing (`sharePng` sends the picture plus a link to the game, in the text too because some apps drop the link field; without file sharing it saves the picture and copies the link), framed PNG. |
| `sfx.ts`, `music.ts`, `speech.ts` | Shared audio context + limiter, per-place generative music, Web Speech wrapper. |
| `state.ts` | Save key `bead-box-save-v1` (unlocked, finished, learned words, drafts, settings). |
| `debug.ts` | Debug pages (below). |

## Conventions that matter

- **Words:** a bead is said as "color noun" ("blue star", "gold bead" for round). Tabs say the shape, colors say the color, placing says both. There is no hear-again button: the word card is the title (a button that adds the bead) with a "+" beside it. `learned` records the words heard on placed beads. Without `speechSynthesis` the card still shows the word and a two-note chime plays.
- **Unlocking:** two places open at the start (`START_OPEN`), each finished bracelet opens the next in `PLACES` order. Open places can be replayed forever. Unfinished bracelets are kept as `drafts` per place.
- **Adding a place:** `PLACES` entry (5 shapes starting with `round`, 8 colors, 4 patterns, so the grid stays two rows of six); a scene file in `art/places/` registered in `art/places.ts`; a look in `art/tables.ts` `LOOKS`; a sky color in `backdrop.ts` `SKY`; an entry in `ambient.ts` `SCENES`; a mood in `music.ts` `MOODS`. Tests tell you what is missing, and the scenery tests check paint time and detail.
- **Beads must stay filter-free and cheap** (a dozen are live at once, and they redraw whenever a bead lands). Anything that needs a filter belongs in a painted-once picture. Never animate a transform on an SVG element that also has a `transform` attribute (the animation replaces it): wrap it in a group.
- **Why a picture, not live SVG:** a filtered full-screen SVG repaints every frame whenever anything on it animates, which janks on phones.
- **Inline SVG gradient ids** must be unique per bead (they are), because inline SVGs inside `display:none` containers lose gradients defined elsewhere.
- **The bead hole** is a tinted lip, a wide inner wall (dark above, bounce-lit below) and a small tinted void. A white ring round a black dot reads as an eyeball: keep the lip and void tinted to the bead's own color.
- **Night Ball music** is a slow piano waltz (`WALTZ` chords, `piano()` voice) with no nature bed. Do not give it a `night` mode: that used to add crickets.
- **Never connect an oscillator to a gain AudioParam** (root rule). The nature-bed swell in `music.ts` uses scheduled `setTargetAtTime` instead of an LFO.
- **Vite inlines small assets as `data:` URIs by default**, and the strict CSP (`font-src 'self'`) refuses them. `assetsInlineLimit: 0` in `vite.config.ts` fixes it; do not remove it. Painted pictures are `blob:` URLs, which `img-src` allows.
- Saves are debounced 400 ms; tests must poll localStorage rather than read it right after an action.

## Debug pages and tests

- `?debug=beads` every shape x design (add `&zoom=1` for big beads, front and side view); `?debug=scene&place=beach&scale=2` one painted scene with paint time and a color-count detail metric on `window.__scene`; `?debug=places` every finished album picture, `?debug=photo&place=beach` one at full size; `?debug=rig` slot geometry numbers on `window.__rig`; `?debug=og` and `?debug=icon&size=512` are the art for `public/og-image.png` and the icons (wait for `window.__ready` or `#icon`, then screenshot `#og` / `#icon` with Playwright); `?debug=play&place=woods&beads=round:blue,leaf:green` opens the workshop straight into a state and exposes `window.game`.
- `npm test` (Playwright, starts Vite on port 5199): `content.spec.ts` (content rules, recipe validation), `beads.spec.ts` (art sheets, slot geometry, every scene paints fast and with detail, background and ambient wiring, reduced motion), `flow.spec.ts` (locked/open places, choose and place, the plus button and title, replace bead, drafts, finish to album to unlock, sharing picture plus game link, shared link). Audio can be checked without ears by tapping the master output through an `AnalyserNode` (level, clipping, energy in a frequency band). The flow tests remove `speechSynthesis` so no voice is needed.
- Before shipping UI changes, also check the production build against the real headers (CSP violations do not show in dev): `npm run build && npx vite preview`, then drive the flow in a browser context that adds the headers from `vercel.json` and fail on any `securitypolicyviolation`.

## Stats

Same pattern as the other games: `src/stats.ts`, `api/stats.js` (key prefix **`bb:`**, anon id `bead-box-anon`), `public/stats.html`. Env vars as in the root `CLAUDE.md`.
