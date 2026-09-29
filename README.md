# WebGames

## 🦦 Otter River (`otter-river/`)

A cozy pixel-art game: float down a calm river on your back, collect shells, fish and pearls, and spend them on outfits and friends for your otter at the River Market.

- **Play:** ← → / A D on desktop, or drag on the river on mobile. P / Esc pauses, M mutes.
- **The River Market is always open** (a side panel on desktop, a drawer on phones). Try items on while you swim; owned items switch on and off instantly, and several friends can come along at once. New items unlock as your lifetime shell total grows.
- **A living river:** it splits around islands, passes through five biomes (meadow, blossom grove, pine woods, marsh, shell cove), and cycles through day, sunset and night with fireflies and lanterns. It rains now and then, and ducks, herons, kingfishers, bunnies, deer, jumping fish and dragonflies pass by.
- **No game over.** Rocks, islands and banks are solid, so you slide around them, and logs only give you a gentle bump.
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
- `?skip=1150`: start further down the river.
- `?animal=heron`: summon an animal.
- `?rain=1`: start rain soon.
- `?shells=500`: give yourself shells.

### Deploy on Vercel

1. On [vercel.com](https://vercel.com), choose **Add New… → Project** and import `Heladoo/WebGames`.
2. Set **Root Directory** to `otter-river`. The framework is detected as **Vite** from `otter-river/vercel.json`.
3. Click **Deploy**. Every push to the production branch redeploys automatically.

### How the art works

All art is pixel art written as text in code. Nothing is loaded from image files.

- `src/art/shapes.ts` builds smooth, consistently shaded shapes (ellipses and custom outlines lit from the top-left). Hand-placed pixels add the faces and details.
- `src/art/palette.ts` holds the single shared palette. Each letter maps to one color, and sprites may only use these letters. The build fails on an unknown letter.
- `src/art/otter.ts` holds the otter "puppet" parts: head, body, paws and tail. They move in whole-pixel steps to breathe, bob, blink, paddle and sway.
- `src/art/items.ts` holds every wearable. Each item snaps its pivot pixel onto a named anchor of the otter (head top, eyes, ears, neck, body, paw or belly), so it moves with the otter automatically.
- `src/art/world.ts` holds collectibles, scenery and UI icons.

To add an item, draw a grid, pick an anchor and a pivot, and add one line to the catalog in `items()`.
