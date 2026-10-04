# Bead Box

Calm bracelet-making game that teaches basic English words. Pick a bead shape (tab), pick a color or design, hear and see the word, then tap the bracelet to place it. Twelve beads finish a bracelet, which is saved as a picture of the place and unlocks the next place. No fail state, no timer. General rules are in the root `CLAUDE.md`; this file holds what is specific to this game.

## Stack choice

Unlike Otter River this is **not pixel art**. Art is smooth SVG built as strings (like Word Trail), because the look comes from a mockup: soft painted scenery, glossy rounded beads, cream cards, Fredoka type. Bead and scene markup is a pure function of state, so the same code draws the live screen, the album picture and a shared link.

## Map of `src/`

| File | Purpose |
|---|---|
| `content.ts` | Places, shapes, designs and the words. `SLOTS = 12`. Pure data, imported directly by tests. |
| `art/beads.ts` | `beadSVG` / `beadInner`: shape, gradient, pattern **mask** (not clip path: masks respect strokes), hole, gloss. `TONES` holds colors. |
| `art/places.ts` | One function per place, painted in a 400 x 700 box, and `TABLES` looks. |
| `scene.ts` | `slotGeometry()` (12 slots spaced evenly along the ring, not by angle), table, rope, `braceletSVG`, `photoSVG`, and `placeArt` (renames gradient ids so copies on one page never collide). |
| `workshop.ts` | The make screen: tabs, grid, word card, placing, finishing. |
| `map.ts`, `menus.ts` | Place map; album, viewer, settings, shared-link landing. |
| `album.ts`, `photo.ts` | IndexedDB photos, recipe encode/decode (strict validation), share helpers, framed PNG. |
| `sfx.ts`, `music.ts`, `speech.ts` | Shared audio context + limiter, per-place generative music, Web Speech wrapper. |
| `state.ts` | Save key `bead-box-save-v1` (unlocked, finished, learned words, drafts, settings). |
| `debug.ts` | Debug pages (below). |

## Conventions that matter

- **Words:** a bead is said as "color noun" ("blue star", "gold bead" for round). Tabs say the shape, colors say the color. `learned` records the words heard on placed beads. Without `speechSynthesis` the card still shows the word and a two-note chime plays.
- **Unlocking:** two places open at the start (`START_OPEN`), each finished bracelet opens the next in `PLACES` order. Open places can be replayed forever. Unfinished bracelets are kept as `drafts` per place.
- **Adding a place:** add it to `PLACES` (5 shapes starting with `round`, 8 colors, 4 patterns, so the grid stays two rows of six), a scene in `art/places.ts` plus a `TABLES` entry, and a mood in `music.ts` `MOODS`. Content tests will tell you what is missing.
- **Gradient ids:** inline SVGs inside `display:none` containers lose gradients defined elsewhere. Every scene or bead copy gets unique ids; keep it that way.
- **Never connect an oscillator to a gain AudioParam** (root rule). The nature-bed swell in `music.ts` uses scheduled `setTargetAtTime` instead of an LFO.
- **Vite inlines small assets as `data:` URIs by default**, and the strict CSP (`font-src 'self'`) refuses them. `assetsInlineLimit: 0` in `vite.config.ts` fixes it; do not remove it.
- Saves are debounced 400 ms; tests must poll localStorage rather than read it right after an action.

## Debug pages and tests

- `?debug=beads` every shape x design; `?debug=places` every scene with a full bracelet; `?debug=rig` slot geometry numbers on `window.__rig`; `?debug=og` and `?debug=icon&size=512` are the art for `public/og-image.png` and the icons (screenshot the `#og` / `#icon` element with Playwright); `?debug=play&place=woods&beads=round:blue,leaf:green` opens the workshop straight into a state and exposes `window.game`.
- `npm test` (Playwright, starts Vite on port 5199): `content.spec.ts` (content rules, recipe validation), `beads.spec.ts` (art sheets, slot geometry), `flow.spec.ts` (locked/open places, choose and place, replace bead, drafts, finish to album to unlock, shared link). The flow tests remove `speechSynthesis` so no voice is needed.
- Before shipping UI changes, also check the production build against the real headers (CSP violations do not show in dev): `npm run build && npx vite preview`, then drive the flow in a browser context that adds the headers from `vercel.json`.

## Stats

Same pattern as the other games: `src/stats.ts`, `api/stats.js` (key prefix **`bb:`**, anon id `bead-box-anon`), `public/stats.html`. Env vars as in the root `CLAUDE.md`.
