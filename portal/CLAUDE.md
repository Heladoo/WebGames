# CLAUDE.md (portal)

Guidance for `portal/` only: the Hebrew homepage "משחקי דורותי" (Dorothy Games) that links to every game. Shared topics (Vercel headers, Upstash stats, persistence) are in the root `CLAUDE.md`.

## What it is

- A Hebrew, right-to-left page (`lang="he" dir="rtl"`) styled as a toy shelf: each game is a box on a wooden plank (design "A" of the owner's mockups). Fonts are self-hosted: Secular One for headings, Rubik for text.
- Picture-first for children aged 4–99: boxes show just a square logo picture (the name is in the logo, so it is not printed under it; it stays as screen-reader text, `.sr-only`), under the owner's logo (the header; the `<h1>` is the logo image with the alt text "משחקי דורותי"). A game's one-line description lives in the tooltip of its (?) button (`.info` + `.tip`, in the HTML at build time so search engines see it). Under the shelf there is one quiet line (`SITE.facts`: ages 4–99, free, no ads, no sign-up, no cookies, safe and calm) and nothing else; the owner removed the game list and the counting note.
- Games open in a **new tab** (`target="_blank" rel="noopener"`; the owner changed this so the portal doesn't depend on any change in a game). They live on their own origins (one Vercel project each), so the portal never frames them and their saves are untouched.

## Map

| File | Purpose |
|---|---|
| `src/games.ts` | **The registry.** Games (Hebrew name, one sentence for the tooltip, url, `isNew`), `COMING_SOON` box count, site texts (`SITE`, including the facts line). Four games are in this repo; Birdnet Kids is not (`github.com/Heladoo/Birdnet_kids`, GitHub Pages, English UI), so it is just an entry with an outside url and its logo is a copy of that repo's `logo-badge.png`. |
| `vite.config.ts` | Writes the shelf (with each game's (?) button and tooltip) and the JSON-LD (`WebSite` + `ItemList` of `VideoGame`) into `index.html` **at build time** from `games.ts`, so the page works and is indexed without JavaScript. Also `%SITE_URL%`, `robots.txt`, `sitemap.xml`. |
| `src/main.ts` | Rounds each shelf row's plank ends (`markRows`, the grid wraps by itself), board open/closed by width, install button (`beforeinstallprompt`, an instructions dialog on iOS), service worker, stats. |
| `src/ideas.ts` | Ideas board: notes from `/api/ideas`, hearts (optimistic, remembered in `localStorage` `dorothy-games-hearts`). |
| `src/composer.ts` | The idea form (`<dialog>`): one icon (optional), a description (≤500 characters), one optional sender name. |
| `src/pictures.ts` | The 18 idea icons, drawn as SVG in code (a player picks one). Their ids are a whitelist shared with `api/ideas.js`. |
| `src/rules.ts` | `LIMITS` and `NAME_RE`, mirrored in `api/ideas.js` (a test checks they match). No browser globals here: the Node tests import it. |
| `src/stats.ts`, `api/stats.js` | Shared stats pattern, prefix `pt:`: a visit = `start`; tapping a game box sends `open` (`HINCRBY pt:opens <id>`). No play-time heartbeats. |
| `api/ideas.js` | Ideas API (see below). |
| `public/stats.html`, `public/stats.js` | The owner's page (static, outside the bundle, `noindex`, behind `STATS_KEY`): **the ideas waiting for approval come first** (Approve, Reject, and Remove for approved ones), then visits, visitors and which games were tapped. Player text is shown with `textContent`; the sender name sits in a `<bdi>` so Hebrew doesn't scramble the line. |
| `public/sw.js` | Network-first service worker (offline fallback only, never caches `/api/`). Bump `VERSION` to drop old caches. |
| `src/debug.ts` | `?debug=og` (the logo plus the shelf pictures), screenshotted by `scripts/render-art.mjs`. |
| `scripts/tile-art.mjs` | Renders `public/games/<id>.jpg` (square, 700×700) for all five games from their logos (`TILES`): the logos in `art/logos/` (Otter River, Bead Box, Birdnet Kids) sit on the logo's own background colour, so no square shows; Word Trail's and Race to the Palace's logos are read from their game folders and sit on a gradient of the game's colours. |
| `scripts/logo-assets.py`, `art/dorothy-logo.jpg` | The owner's logo and the Pillow script that makes `public/logo.webp` / `logo-small.webp` (background flood-filled to transparent), the icons (cream background, since iOS turns transparent corners black) and `favicon.png` (a round crop of the girl). |

## Ideas: safety rules (keep them if anything changes)

- Children's text is shown to other children, so **nothing is public until the owner approves it** (`pt:ideas:new` → `pt:ideas:ok`).
- The server still bounds everything: the icon from the whitelist only (or none); text ≤ 500 characters and one name ≤ 30 characters, both after control characters and bidi overrides are stripped. **There are no content rules** (the owner decided that names and text are free, because every idea is read on the stats page before it can be shown); an idea needs an icon or at least 2 characters of text. There is no age field.
- Player text is always set with `textContent`, never `innerHTML` (a test injects markup; descriptions may be long, so notes wrap).
- Limits: 5 ideas per network address per day (a hashed, day-salted key that expires; the address is never stored), at most 300 waiting.
- Hearts: one per browser, using the anonymous stats id. `SADD pt:ideas:h:<idea>` decides whether the count in `pt:ideas:hearts` moves; a heart for an idea that isn't approved is refused and cleaned up.
- The public list (`GET /api/ideas`) is cached at Vercel's edge (`s-maxage=30`), so page views cost Redis almost nothing.

## Layout rules

- The shelf is one CSS grid with no column gap; each cell draws its own piece of plank (`.cell::after`), so the pieces in a row join into one shelf. 2 per row on phones, 3 per row from 600px (`minmax(max(185px, 30%), 1fr)`).
- From 900px the board sits beside the shelf and starts open; below that it is folded under the shelf (owner's request). Four notes show before "show more".
- Tap targets are at least 44px (tested on a 360px phone, picture buttons included).

## Tests

`npm test` (Playwright, Vite on port 5199):
- `tests/api.spec.ts` runs `api/ideas.js` in Node against an in-memory fake of the Upstash pipeline: validation, approve/reject/remove, hearts, rate limit, behavior without Redis, and that pictures and limits match the client.
- `tests/page.spec.ts` fakes `/api/ideas` with `page.route`: boxes per row and nothing overflowing at 5 sizes, board open/closed by width, links and pictures, the no-JavaScript HTML and JSON-LD, the tooltips, that no text block sits under the shelf, notes and escaping, hearts, the form (one icon at a time, name validation, a single name box, refusal messages), and tap sizes on a small phone.

Before shipping, also check the production build against the real headers: `npm run build`, serve `dist/` with the headers from `vercel.json`, and fail on any `securitypolicyviolation` (CSP problems don't show in dev).

## Art

- The logo is the owner's picture on a flat cream background. `--wall` (#fef7e5) is that cream; `logo.webp` has a transparent background so there is no box around it, and the icons keep the cream. After changing the logo, run `python3 scripts/logo-assets.py`, then `node scripts/render-art.mjs` with the dev server on 5199 for `og-image.png`.
- Game pictures: rerun `node scripts/tile-art.mjs` when a logo changes (no dev servers needed). When adding a logo, sample its edge colours and use that as the tile `bg` (a vertical gradient if the sky varies, as in the Bead Box logo). Tiles are 1:1 (`aspect-ratio` in `.box img`).

## Open items

- All five game urls were given by the owner (the Birdnet Kids address is GitHub Pages, so it is not a `vercel.app` one). The sandbox can't reach vercel.app, so none has been opened from here.
- Postponed ideas are in `BACKLOG.md`.
