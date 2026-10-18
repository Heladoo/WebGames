# 🏰 המרוץ לארמון (Race to the Palace)

A calm racing game for young children, in Hebrew. The child picks a royal animal (a unicorn, a horse, a fawn, a reindeer or a dragon) and a child rider, then races the other animals to the palace. Along the way they jump over logs and rocks, duck under branches and garlands, and collect candies to go faster. At the end the winner gets a golden cup and everyone else claps and cheers. There is no timer and no losing: places 1–3 earn medals that open new tracks, and everyone earns coins for colourful helmets, hairstyles and special saddles.

It is built to be **stress free** and **playable without reading**: every button is a picture, and numbers are shown as coins, medals and a road to the palace.

## How to play

1. **Choose:** the game opens on the home screen (the map, with the logo above the road of tracks). Tap a track, then an animal and a rider (all pictures). Every other screen has a house button or a back button that returns here.
2. **Race:** the animal runs by itself.
   - **Controls:** ⬆ jump, ⬇ duck, ↖ and ↘ move to the far or near lane. On a keyboard: the arrows (or W A S D, Space to jump), and Esc to pause. On a touch screen: the big round buttons, or swipe on the race.
   - **Hints:** a glowing bubble above each obstacle shows which button to press. In the first two races everything slows down before the first obstacles and a hand points at the button.
   - **Candies** fill a rainbow bar that makes the animal faster. A full bar gives a short rainbow dash. A shadow on the ground shows each candy's lane, and every candy stays until the child takes it: the other riders never take one away.
   - **Bumping an obstacle** is only a little stumble and a short slowdown.
3. **Ceremony:** at the palace, the winner holds a golden cup, 2nd and 3rd wear medals, and everyone claps. The coins won rise into the coin total, and a medal joins the medal count. When a new track opens, its card appears; tap it to go to the map.
4. **Medals and coins:**
   - **New tracks open with medals** (a place from 1 to 3), never with coins. The flower meadow opens after the first medal, then the snowy mountains after 3, the sunset cliffs after 5 and the palace gardens after 7. Medals are kept and never spent. A locked track shows a row of medal circles, filled in for the medals already won.
   - **The shop (🛒)** spends coins on helmets (flowers, stars, racing, rainbow, knight, dinosaur, unicorn with a horn, crown), hairstyles (spikes, curls, surfer locks, a ponytail and three kinds of braids) and saddles, which show on the child and the animal straight away. Each kind is listed cheapest first, from the left, and the blue back arrow returns to the home screen.
   - **Not enough coins yet:** a coin jar shows how close you are.
5. **Labels:** hovering over any button (or a long touch outside the race) shows its name in a small bubble.
6. **For grown-ups** (hold ⚙ for a moment): music, sounds, volume, help mode (the animal sometimes dodges by itself; **off** unless a grown-up turns it on), and starting over. Progress is saved only in this browser. There are no accounts, no ads and no cookies; only anonymous play counts are collected.

## Run locally

```bash
cd palace-race
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in palace-race/dist
npm test         # art, simulation and game-flow checks (Playwright + Chromium)
```

## Look at the art and the race

- `?debug=race&autopilot=0.9`: a race straight away, driven by an autopilot (`&speed=4` to speed it up, `&tutorial=1` for the tutorial).
- `?debug=sim`: hundreds of simulated races, and how often each kind of player wins.

- `?debug=mock`: a moment in a race, with the on-screen buttons (`&track=snow`, `meadow`, `canyon`, `garden`).
- `?debug=animals`: every animal in every pose.
- `?debug=riders`: the four children standing, and riding every animal.
- `?debug=wardrobe`: helmets, hairstyles and saddles in the race poses.
- `?debug=hair`: every hairstyle on every child (`&helmet=stars`).
- `?debug=helmets`: every helmet on every child.
- `?debug=meadow`: the home screen's sky and flower meadow.
- `?debug=obstacles`: obstacles per track, and the candies.
- `?debug=track&track=forest`: one track's painted layers.
- `?debug=podium`: the end-of-race picture (`&frame=1` for the other half of the clap).
- `?debug=faces`: close-ups of every animal's and child's face.
- `?debug=palace`: the palace close up.
- `?debug=icons`: the button icons.
- `?debug=music`: every music mood rendered offline (the calm menu music and the quicker race music of each track), with Play buttons and their levels.

The logo, the app icon and the favicon are the owner's own pictures (`public/`).

## Deploy on Vercel

Import `Heladoo/WebGames` as another project and set **Root Directory** to `palace-race`. The framework is detected as Vite from `palace-race/vercel.json`, which also carries the strict security headers.

## Play statistics (anonymous, shares the other games' database)

Same as the other games. Counters use the prefix `pr:` (Otter River `or:`, Word Trail `wt:`, Bead Box `bb:`). In the **palace-race** Vercel project add `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` and `STATS_KEY`, then redeploy. Open `/stats.html` and enter the `STATS_KEY`. A play is counted when the first race of a visit starts, and play time only while racing.
