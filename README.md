# WebGames

## 🦦 Otter River (`otter-river/`)

A cozy pixel-art game: float down a calm river on your back, collect shells, fish and pearls, and spend them on outfits and friends for your otter at the River Market.

- **Play:** ← → / A D on desktop, or drag on the river on mobile. P / Esc pauses, M mutes.
- **The River Market is always open** (a side panel on desktop, a drawer on phones). Try items on while you swim; owned items switch on and off instantly, and several friends can come along at once. New items unlock as your lifetime shell total grows.
- **A living river:** it splits around islands, passes through five biomes (meadow, blossom grove, pine woods, marsh, shell cove), and cycles through day, sunset and night with fireflies and lanterns. It rains now and then, and ducks, herons, kingfishers, bunnies, deer, jumping fish and dragonflies pass by.
- **No game over.** Rocks, islands, banks and beaver dams are solid, so you slide around them. Dams funnel you gently through their gap, and logs only give you a gentle bump.
- **Photos:** a "Photo op!" hint appears when something lovely happens (a visitor, a sunset, a busy beaver). Press the camera button (or C) any time. Postcards collect in your album, and you can share one as an image or as a link. The link re-creates the scene in the recipient's browser and offers "Start your own float".
- **Soundscapes:** generated wind in the woods, waves at the cove, birdsong by day, frogs in the marsh, crickets at night, rushing water at dams, and rain.
- **Progress** saves in the browser (localStorage).

### Run locally

```bash
cd otter-river
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in otter-river/dist
```

Open `/?debug=wardrobe` to see every outfit in every animation pose. Use it to check that items stay aligned after art changes.

Other debug parameters:
- `?time=0.75`: start at night (the value is a day phase from 0 to 1).
- `?island=1`: put an island in every river section.
- `?dam=1`: put a beaver dam in every river section.
- `?skip=1150`: start further down the river.
- `?animal=heron`: summon an animal.
- `?rain=1`: start rain soon.
- `?shells=500`: give yourself shells.

### Deploy on Vercel

1. On [vercel.com](https://vercel.com), choose **Add New… → Project** and import `Heladoo/WebGames`.
2. Set **Root Directory** to `otter-river`. The framework is detected as **Vite** from `otter-river/vercel.json`.
3. Click **Deploy**. Every push to the production branch redeploys automatically.

### Play statistics (anonymous)

The game counts plays, estimated unique players and play time. It uses no cookies, no accounts and no personal data. Setup takes about 3 minutes in Vercel:

1. In the Vercel project, open **Storage → Create / Connect → Upstash for Redis** (the free plan is fine) and connect it to this project. This adds the `KV_REST_API_*` environment variables.
2. Under **Settings → Environment Variables**, add `STATS_KEY` with any secret phrase you choose.
3. Redeploy, then open **`/stats.html`** and enter your `STATS_KEY`. You'll see total plays, players, total and average play time, and 30-day charts.

Until storage is connected, the game works normally and simply doesn't count anything.

### Sharing, SEO and safety

- **Link previews and search:** the page has a proper title and description, an Open Graph and Twitter card image (`public/og-image.png`), structured data, and an installable web-app manifest with icons. The build also generates `robots.txt` and `sitemap.xml`.
- **Web address:** absolute URLs use Vercel's production address automatically. If you add a custom domain, set `SITE_URL` (for example `https://otterriver.com`) in Vercel's environment variables and redeploy.
- **Security headers** (`vercel.json`): a strict Content-Security-Policy (the page can load only its own scripts, plus Google Fonts for text), no framing by other sites, `nosniff`, a strict referrer policy, and a permissions policy that blocks the camera, microphone and location.
- **Shared postcard links are treated as untrusted:**
  - Numbers are clamped.
  - Only known item and animal names are accepted.
  - Captions in links are ignored and rebuilt locally.

### How the art works

All art is pixel art written as text in code. Nothing is loaded from image files.

- `src/art/shapes.ts` builds smooth, consistently shaded shapes (ellipses and custom outlines lit from the top-left). Hand-placed pixels add the faces and details.
- `src/art/palette.ts` holds the single shared palette. Each letter maps to one color, and sprites may only use these letters. The build fails on an unknown letter.
- `src/art/otter.ts` holds the otter "puppet" parts: head, body, paws and tail. They move in whole-pixel steps to breathe, bob, blink, paddle and sway.
- `src/art/items.ts` holds every wearable. Each item snaps its pivot pixel onto a named anchor of the otter (head top, eyes, ears, neck, body, paw or belly), so it moves with the otter automatically.
- `src/art/world.ts` holds collectibles, scenery and UI icons.

To add an item, draw a grid, pick an anchor and a pivot, and add one line to the catalog in `items()`.

## 🐶 Word Trail (`word-trail/`)

An endless, gentle English word adventure for young children (about 4–7) who are just starting English. Everything is drawn in code as soft vector art. The browser's built-in voice speaks every word and letter.

- **Choose:** the voice asks a question ("What will the dog wear?") and reads out 2–4 picture cards. Tap a card to hear its word, then tap it again (or the ✓) to choose.
- **Learn the word:** the chosen word is shown and spoken, and then the child practises its letters:
  - **Tap:** the letters wait in slots and each tap says the letter's name. Harder levels shuffle the letters and add one or two extra ones.
  - **Trace:** the child traces dotted letters with a finger, and each finished letter is spoken. A hint dot shows the stroke after a pause, and after a few hints the game traces it together with the child.
- **Walk:** the choice joins the trip and stays: clothes, things to carry, friends that follow (up to 3), rides (car, bus, boat, train, bike), the sky (sun, rain, rainbow, moon…) and places (park, farm, woods, snow, sand, sea, hill, pond). You can tap anything on the trail to hear its name.
- **No losing and no end.** Longer words and harder letter levels appear as the child learns more.
- **Stickers, badges and photos:** every learned word becomes a sticker. The camera makes a postcard of the trip with a caption. Postcards and the sticker page can be shared (system share sheet) or saved as images.
- **For grown-ups** (hold the ⚙️ button): uppercase or lowercase letters, tap/trace/both, voice and speed, sound effects, progress, and "New trip". Progress is saved only in the browser (localStorage and IndexedDB). There are no accounts, ads or cookies.

### Run locally

```bash
cd word-trail
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in word-trail/dist
```

Debug pages: `?debug=words` (every picture), `?debug=wardrobe` (every hero with every item and ride), `?debug=glyphs` (tracing strokes), and `?debug=icon` / `?debug=og` (the art used for `public/` icons and the link preview).

You can also start from a ready-made scene, for example `?hero=fox&wear=cap,glasses&friends=bee,cat&place=sea&sky=rainbow&ride=boat&carry=kite`. Add `?words=12` to pretend 12 words are already learned, which unlocks the harder levels.

### Deploy on Vercel

Import `Heladoo/WebGames` as a second project and set **Root Directory** to `word-trail`. The framework is detected as Vite from `word-trail/vercel.json`.
