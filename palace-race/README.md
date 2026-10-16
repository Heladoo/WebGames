# 🏰 המרוץ לארמון (Race to the Palace)

A calm racing game for young children, in Hebrew. The child picks a royal animal (a unicorn, a horse, a fawn, a reindeer or a dragon) and a child rider, then races the other animals to the palace. Along the way they jump over logs and rocks, duck under branches and garlands, and collect candies to go faster. At the end the winner gets a golden cup and everyone else claps and cheers. There is no timer and no losing: everyone earns coins for new tracks and for colourful helmets, braids and special saddles.

It is built to be **stress free** and **playable without reading**: every button is a picture, and numbers are shown as coins, medals and a road to the palace.

**Status: stage 1 (the art).** Every drawing is ready for review: the animals in every pose, the children and their items, five tracks, obstacles, candies, the ceremony, the logo, the icons and a still of a race. The playable race is stage 2.

## Run locally

```bash
cd palace-race
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in palace-race/dist
npm test         # art checks (Playwright + Chromium)
```

## Look at the art

- `?debug=mock`: a moment in a race, with the on-screen buttons (`&track=snow`, `meadow`, `canyon`, `garden`).
- `?debug=animals`: every animal in every pose.
- `?debug=riders`: the four children standing, and riding every animal.
- `?debug=wardrobe`: helmets, braids and saddles in the race poses.
- `?debug=obstacles`: obstacles per track, and the candies.
- `?debug=track&track=forest`: one track's painted layers.
- `?debug=podium`: the end-of-race picture.
- `?debug=faces`: close-ups of every animal's and child's face.
- `?debug=palace`: the palace close up.
- `?debug=icons`: the button icons.

The logo, the app icon and the favicon are the owner's own pictures (`public/`).

## Deploy on Vercel

Import `Heladoo/WebGames` as another project and set **Root Directory** to `palace-race`. The framework is detected as Vite from `palace-race/vercel.json`, which also carries the strict security headers.

## Privacy

There are no accounts, no ads and no cookies, and the game collects no personal data. Anonymous play counts (prefix `pr:`) will be added with the race, the same way as in the other games.
