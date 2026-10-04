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

### Play statistics (optional, anonymous, free)

The game can count plays, estimated unique players and play time. It uses no cookies, no accounts and no personal data. It stores only counters, plus a random anonymous id per device to estimate unique players. **It's optional:** until you set it up the game works exactly the same and simply doesn't count anything.

The counters live in a small Redis database. **You don't need anything from Vercel's Storage tab.** Upstash has a permanent free plan that is enough for a game like this, and you create the database on Upstash's own site:

1. **Create a free Upstash account** at [console.upstash.com](https://console.upstash.com) (sign up with Google, GitHub or email; the Free plan needs no credit card).
2. In the **Redis** tab, click **Create Database**. Give it any name (for example `otter-river`), choose the **region closest to your players**, and choose the **Free** plan (not "Pay as you go" or "Fixed").
3. Open the new database. In its **REST API** section, copy two values:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. In **Vercel**, open your project → **Settings → Environment Variables** and add three variables (tick Production, Preview and Development for each):

   | Name | Value |
   |---|---|
   | `UPSTASH_REDIS_REST_URL` | the URL you copied |
   | `UPSTASH_REDIS_REST_TOKEN` | the token you copied |
   | `STATS_KEY` | any secret phrase you choose (this is your dashboard password) |

5. **Redeploy.** Variables only apply to new deployments: Deployments → the latest one → **⋯ → Redeploy**.
6. Open `https://<your-site>/stats.html`, enter your `STATS_KEY`, and play the game once. You'll see total plays, players, total and average play time, and 30-day charts (refresh the page to update).

**If you prefer Vercel's own Storage tab:** you may find **Upstash** listed under the Marketplace providers. If it offers a Free plan, connect it to the project; it adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`, which the game understands automatically (you still add `STATS_KEY`). If you only see a paid "Redis" product, use steps 1 to 5 above instead.

**What it costs:** nothing, on Upstash's Free plan (256 MB and 500,000 commands a month, according to Upstash's published pricing; please check their page for current limits). A play uses 4 commands and every 2 minutes of play uses 2 more, so a 10-minute session is about 14 commands, which is roughly 35,000 sessions a month. If the monthly limit is ever reached, counting pauses and the game keeps working normally.

**Troubleshooting** (the dashboard shows these messages itself):

| What you see | What to do |
|---|---|
| "STATS_KEY is not set in Vercel yet" | Add `STATS_KEY` (step 4) and redeploy. |
| "That key does not match STATS_KEY" | Re-enter the phrase exactly; check for spaces. |
| "Redis is not connected" | Add the two Upstash variables (step 4) and redeploy. |
| "Redis did not answer" | Re-copy the URL and token; check the database isn't deleted or over its free limit. |
| "The stats function was not found" | In Vercel, set the project's **Root Directory** to `otter-river`, then redeploy. |
| Dashboard works but shows 0 | Counting is off on `localhost` and on `?debug=` pages. Play on the real site, then refresh. |

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

An endless, gentle English word adventure for young children (about 4–7) who are just starting English. Everything is drawn in code in a layered **paper-cut** style: paper pieces with cast shadows, hand-cut edges and a paper grain. The browser's built-in voice speaks every word and letter.

- **Choose:** the hero walks along the trail until a signpost arrives. The choice pops out of it: the voice asks a question ("What will the dog wear?") and reads out 2–4 picture cards. One tap on a card chooses it.
- **Learn the word:** the chosen word is shown and spoken, and then the child practises its letters:
  - **Tap:** the letters wait in slots and each tap says the letter's name. Harder levels shuffle the letters and add one or two extra ones.
  - **Trace:** the child traces dotted letters with a finger. A letter counts once nearly all of each stroke is covered and the finger lifts, and then its name is spoken. A hint dot shows the stroke after a pause, and after a few hints the game traces it together with the child.
- **Walk:** the choice joins the trip and stays:
  - **Clothes**, one per body slot: hat, cap, crown, helmet or bow; scarf or tie; coat; boots, shoes or socks; cape or bag; glasses.
  - **Things**: a kite or balloon on a string, plus one thing on the back (ball, star, book, drum, flag, bell or gift).
  - **Friends**: up to 3 follow along; when a fourth joins, the oldest leaves.
  - **Rides** (car, bus, train, bike, and a boat only by the sea) last until the next new place.
  - **Sky and places**: the sky (sun, cloud, rain, rainbow, moon) and the place (park, farm, woods, snow, sand, sea, hill, pond) change the scenery.

  A new choice only replaces the item in the same slot. You can tap anything on the trail to hear its name. After each word, its letters are spelled aloud, and each letter bounces as it is said.
- **No losing and no end.** Longer words and harder letter levels appear as the child learns more.
- **Music:** a quiet, generated melody that changes with each place, with matching nature sounds (birds, waves, wind, a brook, frogs, crickets at night, rain). It quietens whenever the voice speaks.
- **Quiet celebrations:** badges and photos are celebrated with pictures, sounds and confetti, not speech.
- **Paper confetti:** a small burst for each finished word, falling paper bunting for a new badge, and a full-screen paper party for milestones (10, 25 or 50 words, A to Z, every place).
- **Stickers, badges and photos:** every learned word becomes a sticker. The camera makes a postcard of the trip with a caption. Postcards and the sticker page can be shared (system share sheet) or saved as images.
- **Start over** with the paw button: it asks "Choose a new friend?" with big ✓ and ✕ buttons.
- **For grown-ups** (hold the ⚙️ button): uppercase or lowercase letters, tap/trace/both, the voice (every English voice on the device, a British female voice by default) and its speed, music, sound effects, progress, and "New trip". Progress is saved only in the browser (localStorage and IndexedDB). There are no accounts, ads or cookies.

### Run locally

```bash
cd word-trail
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in word-trail/dist
npm test         # anatomy tests (Playwright + Chromium)
```

**Anatomy tests** (`tests/anatomy.spec.ts`, rules in `tests/rules.ts`) render every hero alone, with every item and on every ride (8 heroes alone, with each of 14 clothes and 9 things, and on 5 rides), and measure each named part. They check that parts relate correctly:
- The face follows the 3/4 turn: the far eye is nearer the snout and smaller, the eyes sit on one line above the snout, and the nose is the front-most point.
- The body is connected: the neck overlaps, the tail and ears attach, the feet are on the ground, front and back legs sit under the right half, and near legs are drawn over far legs.
- Items fit: hats rest on the head, lenses sit over the eyes, the scarf wraps the neck, boots are on the feet, bags and capes are on the back, carried things rest on the back, and riders sit in their vehicles.

They also check:
- Anything sitting on a moving part (a tail tip, a sock) moves with it.
- Things on the back aren't hidden behind the head or ears.
- No card picture is cut off at its frame.
- Every scenery tile repeats without a seam.

`tests/director.spec.ts` plays 360 choices and checks that every kind of question comes up evenly, never twice in a row, and that a boat is only offered by the sea.

Debug pages: `?debug=words` (every picture), `?debug=wardrobe` (every hero with every item and ride), `?debug=glyphs` (tracing strokes), `?debug=rig` / `?debug=tiles` (what the tests measure), and `?debug=icon` / `?debug=og` (the art used for `public/` icons and the link preview).

You can also start from a ready-made scene, for example `?hero=fox&wear=cap,glasses&friends=bee,cat&place=sea&sky=rainbow&ride=boat&carry=kite`. Add `?words=12` to pretend 12 words are already learned, which unlocks the harder levels.

### Play statistics (anonymous, shares Otter River's database)

Word Trail counts plays, estimated unique players and play time, exactly like Otter River. Open **`/stats.html`** on the Word Trail site and enter your `STATS_KEY` to see the numbers.

**One free Upstash database serves both games.** Every Word Trail counter is stored under the name prefix `wt:`, and Otter River's under `or:`, so their numbers never mix. To connect it:
1. In Vercel, open the **word-trail** project (not otter-river) → **Settings → Environment Variables**.
2. Add the same three variables as Otter River, with the same values: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` and `STATS_KEY`. You can also choose a different `STATS_KEY`.
3. Redeploy.

The two games share the free plan's monthly command allowance (500,000 commands). A play uses about 14 commands for 10 minutes of play, so the allowance still covers tens of thousands of sessions a month.

### Deploy on Vercel

Import `Heladoo/WebGames` as a second project and set **Root Directory** to `word-trail`. The framework is detected as Vite from `word-trail/vercel.json`.

## 📿 Bead Box (`bead-box/`)

A calm bracelet-making game for young children learning English (about 4–8). There is no timer, no rush and no way to fail. Everything is drawn in code as smooth SVG: painted scenery, glossy rounded beads and cream cards. The browser's built-in voice says every word.

- **Make a bracelet:** pick a bead **shape** on the tabs, then a **color or design** in the grid. You hear the word ("blue", "star") and see it on the word card, then **tap the bracelet** (or the ✓ button) to place the bead. Tap an empty slot to fill it, or a filled slot to swap the bead. Twelve beads finish a bracelet.
- **Places:** the map starts with **Hawaii Beach** and **The Woods**. Each finished bracelet opens the next place: **Night Ball**, **Big City**, **Snowy Mountain** and **Flower Garden**. Each place has its own scenery, table, beads and music, and every place can be played again. An unfinished bracelet is kept for when you come back.
- **Album:** a finished bracelet is saved as a framed picture of the place, with a celebration and a new place unlocked. The album can share the picture, or a link that redraws the same bracelet in another browser (the link only carries bead and place ids, never text).
- **Words:** about 40 words: ten colors, four designs (stripes, dots, gold, glitter), fifteen bead shapes, "bead", "bracelet" and the place names. The settings list how many have been learned.
- **Music:** a quiet generated melody that changes with each place, with matching nature sounds, and it quietens when the voice speaks.
- **Settings:** music, sounds, volume, voice (every English voice on the device) and speed. Progress is saved only in the browser. There are no accounts, ads or cookies.

### Run locally

```bash
cd bead-box
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in bead-box/dist
npm test         # Playwright + Chromium
```

Every place is a hand-painted-in-code scene (clouds, sea and foam, palms, a canopy, a mirror ball, a skyline, snowy peaks, a flower garden) with a matching table, and the beads have glazed color, pearl, gold and glitter finishes with real string holes. Scenes are painted once into pictures, with a light layer of gentle motion on top (gulls, pollen, snow, butterflies) that is switched off if the device asks for reduced motion.

Debug pages: `?debug=beads` (every shape in every design, `&zoom=1` for big ones), `?debug=scene&place=beach` (one painted scene with paint time and detail numbers), `?debug=places` (every finished album picture), `?debug=rig` (slot geometry checks), `?debug=og` / `?debug=icon` (the art used for `public/` images), and `?debug=play&place=woods&beads=round:blue,leaf:green` to start straight in a workshop state.

### Play statistics (anonymous, shares the other games' database)

Same as the other games. Counters use the prefix `bb:` (Otter River `or:`, Word Trail `wt:`). In the **bead-box** Vercel project add `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` and `STATS_KEY`, then redeploy. Open `/stats.html` and enter the `STATS_KEY`.

### Deploy on Vercel

Import `Heladoo/WebGames` as another project and set **Root Directory** to `bead-box`. The framework is detected as Vite from `bead-box/vercel.json`.
