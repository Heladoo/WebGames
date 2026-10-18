# CLAUDE.md (portal)

Guidance for `portal/` only: the Hebrew homepage "משחקי דורותי" (Dorothy Games) that links to every game. Shared topics (Vercel headers, Upstash stats, persistence) are in the root `CLAUDE.md`.

## What it is

- A Hebrew, right-to-left page (`lang="he" dir="rtl"`) styled as a toy shelf: each game is a box on a wooden plank (design "A" of the owner's mockups). Fonts are self-hosted: Secular One for headings, Rubik for text.
- Picture-first for children aged 4–99: boxes show a picture and a name. A game's one-line description lives in the tooltip of its (i) button (`.info` + `.tip`, in the HTML at build time so search engines see it). There is deliberately **no text block under the shelf** (the owner removed the facts line, the game list and the counting note); the SEO text lives in the meta description and JSON-LD.
- Games open in the **same tab**. They live on their own origins (one Vercel project each), so the portal never frames them and their saves are untouched.

## Map

| File | Purpose |
|---|---|
| `src/games.ts` | **The registry.** Games (Hebrew name, one sentence for the tooltip, url, alt text, `isNew`), `COMING_SOON` box count, site texts (`SITE`). Games outside this repo are just entries with outside urls (`palace-race` is one; its name, sentence and picture are placeholders). |
| `vite.config.ts` | Writes the shelf (with each game's (i) button and tooltip) and the JSON-LD (`WebSite` + `ItemList` of `VideoGame`) into `index.html` **at build time** from `games.ts`, so the page works and is indexed without JavaScript. Also `%SITE_URL%`, `robots.txt`, `sitemap.xml`. |
| `src/main.ts` | Rounds each shelf row's plank ends (`markRows`, the grid wraps by itself), board open/closed by width, install button (`beforeinstallprompt`, an instructions dialog on iOS), service worker, stats. |
| `src/ideas.ts` | Ideas board: notes from `/api/ideas`, hearts (optimistic, remembered in `localStorage` `dorothy-games-hearts`). |
| `src/composer.ts` | The idea form (`<dialog>`): one icon (optional), a description (≤500 characters), one optional sender name. |
| `src/pictures.ts` | The 18 idea icons, drawn as SVG in code (a player picks one). Their ids are a whitelist shared with `api/ideas.js`. |
| `src/rules.ts` | `LIMITS` and `NAME_RE`, mirrored in `api/ideas.js` (a test checks they match). No browser globals here: the Node tests import it. |
| `src/stats.ts`, `api/stats.js` | Shared stats pattern, prefix `pt:`: a visit = `start`; tapping a game box sends `open` (`HINCRBY pt:opens <id>`). No play-time heartbeats. |
| `api/ideas.js` | Ideas API (see below). |
| `public/stats.html`, `public/ideas.html` (+ `.js`) | Owner pages (static, outside the bundle, `noindex`). `ideas.html` approves, rejects and removes ideas. Both use `STATS_KEY`. |
| `public/sw.js` | Network-first service worker (offline fallback only, never caches `/api/`). Bump `VERSION` to drop old caches. |
| `src/debug.ts` | `?debug=og` and `?debug=icon`, screenshotted by `scripts/render-art.mjs`. |
| `scripts/tile-art.mjs` | Renders `public/games/<id>.jpg` from each game's `?debug=og` page with the English title removed, cropped 4:3 around the hero. |

## Ideas: safety rules (keep them if anything changes)

- Children's text is shown to other children, so **nothing is public until the owner approves it** (`pt:ideas:new` → `pt:ideas:ok`).
- The server validates everything again: the icon from the whitelist only (or none); text ≤ 500 characters after control characters and bidi overrides are stripped; one name ≤ 30 characters, **letters only** (no digits, `@` or links, so no phone numbers or addresses; kept even though the owner called the name "free text"). An idea needs an icon or at least 2 characters of text. There is no age field, by the owner's choice.
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

- `public/logo.svg` is a **placeholder** mark (a little shelf); the owner will supply a logo. Replace the file, then run `node scripts/render-art.mjs` with the dev server on 5199 to regenerate `og-image.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` and `favicon.png`.
- Game pictures: rerun `scripts/tile-art.mjs` when a game's look changes. Don't show the English title text on a box; the Hebrew name is under it.

## Open items

- The three in-repo game urls were confirmed by the owner. `palace-race` (`https://web-games-palace-race.vercel.app/`, not in this repo) was added without being able to open it: its Hebrew name ("מירוץ הארמון"), tooltip sentence and picture (`public/games/palace-race.jpg`, drawn placeholder) are placeholders until the owner sends the real ones.
- Postponed ideas are in `BACKLOG.md`.
