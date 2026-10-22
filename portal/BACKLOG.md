# Backlog (portal)

Ideas that were suggested and postponed. Nothing here is planned yet.

- **English version.** The owner may add English later. Keep all page text in `index.html`, `src/games.ts` and the TS files easy to translate (a `lang` switch would need `dir` to follow it).
- **The "coming soon" box is off** (`COMING_SOON = 0` in `src/games.ts`) so that five games plus the idea box fill two rows of three. Turn it back on when a sixth game arrives.
- **Logos inside the games.** The Otter River and Bead Box (צמיד לדרך) logos are only used on the homepage; they could also become those games' title-screen headings.
- **Rules for games from outside this repo.** They should follow the same rules (no ads, no accounts, no tracking), and may need a "from a friend" mark. Not needed yet.
- **Owner edits before approving** (fix a typo in an idea) on the stats page. Today an idea is approved or rejected as it is.
- **Custom domain.** None for now. When there is one, set `SITE_URL` in Vercel and redeploy.
- **Show each game's new-badge automatically** (for example for 30 days after an `added` date) instead of the manual `isNew` flag.
- **A counting note.** The repo convention is to say in the UI wherever anything is counted (the portal counts visits). The owner removed the note under the shelf and kept only the facts line (ages, free, no ads, no sign-up, no cookies, safe and calm); bring it back if wanted.
- **Opening animation (on hold).** The owner made a 10 s video of the Dorothy Games logo being drawn (a leaf wreath, the hills, the sign, then the girl). Trimmed to a square, silent, 1.6× faster version it is about 6 s and 220 KB (MP4). The suggested approach was to play it on the portal once a day, skippable with any tap, never blocking the page (its still picture is the finished logo; skipped with reduced motion), rather than in every game, since games open from the portal and children would see it twice.
