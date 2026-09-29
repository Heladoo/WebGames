# WebGames

## 🦦 Otter River (`otter-river/`)

A cozy pixel-art game: float down a calm river on your back, collect shells, fish and pearls, and spend them on outfits and friends for your otter at the River Market.

- **Play:** ← → / A D on desktop, or drag anywhere on mobile. P / Esc pauses, B opens the market, M mutes.
- **No game over.** Logs only give you a gentle bump.
- **Progress** saves in the browser (localStorage).

### Run locally

```bash
cd otter-river
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in otter-river/dist
```

Open `/?debug=wardrobe` to see every outfit in every animation pose. Use it to check that items stay aligned after art changes.

### Deploy on Vercel

1. On [vercel.com](https://vercel.com), choose **Add New… → Project** and import `Heladoo/WebGames`.
2. Set **Root Directory** to `otter-river`. The framework is detected as **Vite** from `otter-river/vercel.json`.
3. Click **Deploy**. Every push to the production branch redeploys automatically.

### How the art works

All art is pixel art written as text in code. Nothing is loaded from image files.

- `src/art/palette.ts` holds the single shared palette. Each letter maps to one color, and sprites may only use these letters. The build fails on an unknown letter.
- `src/art/otter.ts` holds the otter "puppet" parts: head, body, paws and tail. They move in whole-pixel steps to breathe, bob, blink, paddle and sway.
- `src/art/items.ts` holds every wearable. Each item snaps its pivot pixel onto a named anchor of the otter (head top, eyes, ears, neck, body, paw or belly), so it moves with the otter automatically.
- `src/art/world.ts` holds collectibles, scenery and UI icons.

To add an item, draw a grid, pick an anchor and a pivot, and add one line to the catalog in `items()`.
