# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`WebGames` is a monorepo of small browser games. Each game lives in its own folder and is deployed as its own Vercel project. **This file holds what applies to every game; game-specific details live in `<game>/CLAUDE.md`** (Claude Code loads it when working inside that folder). When adding a game, add a short entry to the list below and put its specifics in its own folder rather than here.

## Games

| Folder | What it is | Details |
|---|---|---|
| `otter-river/` | Calm pixel-art river game: an otter floats, collects shells, dresses up | `otter-river/CLAUDE.md` |
| `word-trail/` | Endless English word adventure for young children, in paper-cut SVG art: pick choices, then tap or trace the letters | `word-trail/CLAUDE.md` |

## Shared stack and workflow

- Each game is Vite + TypeScript, drawn with Canvas 2D (Otter River) or SVG (Word Trail), with no game engine and no runtime libraries (self-hosted font packages are fine). `npm run build` (`tsc --noEmit && vite build`) is the check; there is no linter, and `tsc` runs `strict` with unused-variable errors.
- Work from inside the game's folder (`cd otter-river`): `npm install`, `npm run dev`, `npm run build`, `npm run preview`.
- **Verify in a real browser.** Playwright/Chromium is installed in the sandbox. Each game exposes `?debug=…` query parameters that force scenes, expose state, or render test sheets; use them for screenshots and scripted checks. Add the same kind of hooks to a new game rather than testing by hand. Automated tests differ per game: Word Trail has a Playwright suite (`npm test`), Otter River has none; the game's own `CLAUDE.md` says which.
- Keep each game's README in sync with player-facing behavior and setup steps.
- Commits end with the attribution lines given by the session; develop on the branch named by the task.
- **Preview before any PR.** Push to the branch, then show the work (screenshots at phone and tablet sizes, or the Vercel branch preview). Open or merge a PR only when the owner asks. Postponed or rejected ideas go in `<game>/BACKLOG.md`.

## Deploying to Vercel

- One Vercel project per game with **Root Directory = the game folder** (framework Vite). `<game>/vercel.json` carries the headers.
- **Strict CSP and security headers** are in `vercel.json` (scripts `'self'` only, `connect-src 'self'`, no framing, `nosniff`, restrictive Permissions-Policy). Any new external host or inline script needs a header change, and the CSP will block it silently in production while working in dev, so test against a server that applies the same headers. Prefer self-hosted fonts (`font-src 'self'`, as in Word Trail); Otter River still loads Google Fonts and its CSP allows those two hosts.
- **Build-time SEO:** a small Vite plugin in `vite.config.ts` replaces `%SITE_URL%` in `index.html` (from `SITE_URL`, else Vercel's production URL) and emits `robots.txt` and `sitemap.xml`. Pages need title, description, canonical, Open Graph and Twitter tags, JSON-LD, a manifest and icons; render the social image and icons from the game's own art (a debug page per game, named in its `CLAUDE.md`, plus a Playwright screenshot) and commit them under `public/`.
- Games are for kids as well as adults: no accounts, no ads, no cookies, no personal data. Say so in the UI (pause menu) wherever anything is counted.

## Anonymous play statistics (reusable)

Pattern: `src/stats.ts` (client) → `api/stats.js` (Vercel function) → Upstash Redis REST, with a private dashboard at `public/stats.html`. Copy all four into a new game and change the Redis key prefix so games sharing one database don't collide. Prefixes in use: `or:` (Otter River) and `wt:` (Word Trail).

- Counts plays, estimated unique players (HyperLogLog of a random id kept in localStorage) and play time (heartbeat every 2 minutes plus `sendBeacon` on page hide).
- **Env vars** (set in Vercel → Settings → Environment Variables for all environments, then **redeploy**; variables only apply to new deployments): `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (or the Marketplace names `KV_REST_API_URL/TOKEN`) and `STATS_KEY` (dashboard password).
- **Use a free Upstash account created on upstash.com**, not Vercel's Storage tab (its Redis offering was paid). The REST URL must be `https://<name>.upstash.io` with **no port** (6379 is the native protocol) and no quotes; the token is the REST token, not the read-only one. A wrong URL shows only as "Redis did not answer", because the function swallows the reason; check Vercel → Logs for `/api/stats` and Upstash's Data Browser for the game's keys.
- Budget: the free plan is 500k commands per month. Keep a play at ~4 commands and heartbeats at ~2; don't add per-day `EXPIRE`s or per-frame reporting.
- POSTs must stay silent no-ops when Redis isn't configured or fails, so stats can never break a game. Counting is off on localhost and `?debug` URLs.

## Sharing photos and links (reusable)

- A shareable moment is a framed PNG (stored in IndexedDB, not localStorage) plus a tiny **recipe** that lets another browser re-render the same deterministic scene; the link is `?photo=<base64url recipe>` and the landing page offers "start your own game". Share the image with `navigator.share({files})` and fall back to a download; share the link with `navigator.share({url})` and fall back to the clipboard.
- This only works if the world is a pure function of a few numbers (seed/distance/time-of-day), so build scenery that way from the start.
- **Links come from strangers.** The decoder must cap length, accept only base64url, clamp every number, whitelist item/animal ids, and never display text taken from the link (rebuild captions locally). Keep this if the recipe shape changes.

## Sound (reusable Web Audio tips)

- Synthesize audio in code (no asset files): a slow generative music box over soft pads, noise-based ambience beds (water, wind, rain, waves), small chirp/croak/cricket critters, and pentatonic pickup notes. Calm and gentle is the brief: low gains, long attacks, a lowpass-filtered echo.
- The `AudioContext` can only start from a user gesture: unlock on the first press, resume on `visibilitychange`, suspend when hidden.
- Provide Music and Sounds toggles, a volume slider and a persisted mute button; keep a master gain feeding a **compressor/limiter** so no sound can spike.
- **Never connect an oscillator (or any audio-rate source) to a `gain` AudioParam.** It adds the oscillator's ±amplitude to a gain that should sit near zero and produces a loud buzz that sounds like an error. An early frog croak did this. Shape sounds with scheduled envelope ramps and filters instead.
- A pickup melody that only climbs gets stuck on the top note; walk the scale up and down and shift key each cycle.
- Make sounds follow the world (biome, night, weather, nearby hazard) rather than looping one bed.

## Pixel-art canvas approach (reusable, canvas games)

For canvas games such as Otter River. Word Trail draws code-built paper-cut SVG instead (see `word-trail/CLAUDE.md`), but the same principles apply: one palette, art as code, characters as rigs with named anchors, and generated sheets that check every item × pose.

- Art is code: sprites are text grids baked once into offscreen canvases from a single shared palette (unknown letters throw at load), plus shaded-shape helpers. This keeps every asset visually consistent and editable without image tools.
- Render to a low-resolution canvas and upscale by an **integer** factor with `image-rendering: pixelated`. Derive the scale from the window, not from a panel that opens and closes, so UI changes never resize the characters.
- Motion is whole-pixel offsets plus eased positions; honor `prefers-reduced-motion` (bob, shimmer, sparkles).
- Characters that wear items should be puppets (separate parts moved per pose) with named **anchor points**, so any item follows any animation frame; check every item × pose on a generated sheet.

## Persistence and UI conventions

- Saves live in one versioned `localStorage` key; always wrap access in try/catch (private mode) and migrate old shapes on load. Large data (images) goes in IndexedDB.
- UI around the game stage is plain DOM.
- No fail state, gentle feedback, and every control has an accessible label and a keyboard/touch path.
