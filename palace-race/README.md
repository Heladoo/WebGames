# 🏰 המרוץ לארמון (Race to the Palace)

A calm racing game for young children, in Hebrew. The child picks a royal animal (a unicorn, a horse, a fawn, a reindeer or a dragon) and a child rider, then races the other animals to the palace. Along the way they jump over logs and rocks, duck under branches and garlands, and collect candies to go faster. At the end the winner gets a golden cup and everyone else claps and cheers. There is no timer and no losing: everyone earns coins for new tracks and for colourful helmets, braids and special saddles.

It is built to be **stress free** and **playable without reading**: every button is a picture, and numbers are shown as coins, medals and a road to the palace.

## How to play

1. **Choose:** tap Play, pick a track on the map, then an animal and a rider (all pictures).
2. **Race:** the animal runs by itself.
   - **Controls:** ⬆ jump, ⬇ duck, ↖ and ↘ move to the far or near lane. On a keyboard: the arrows (or W A S D, Space to jump), and Esc to pause. On a touch screen: the big round buttons, or swipe on the race.
   - **Hints:** a glowing bubble above each obstacle shows which button to press. In the first two races everything slows down before the first obstacles and a hand points at the button.
   - **Candies** fill a rainbow bar that makes the animal faster. A full bar gives a short rainbow dash.
   - **Bumping an obstacle** is only a little stumble and a short slowdown.
3. **Ceremony:** at the palace, the winner holds a golden cup. 2nd and 3rd get medals, and everyone claps. Everyone gets coins (more for a better place, plus a few for candies).
4. **Coins:**
   - **New tracks** cost coins: the flower meadow, the snowy mountains, the sunset cliffs and the palace gardens.
   - **The shop (🛒)** has helmets, braids and saddles that show on the child and the animal straight away.
   - **Not enough coins yet:** a coin jar shows how close you are.
5. **For grown-ups** (hold ⚙ for a moment): music, sounds, volume, help mode (the animal sometimes dodges by itself), and starting over. Progress is saved only in this browser. There are no accounts, no ads and no cookies; only anonymous play counts are collected.

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

## Play statistics (anonymous, shares the other games' database)

Same as the other games. Counters use the prefix `pr:` (Otter River `or:`, Word Trail `wt:`, Bead Box `bb:`). In the **palace-race** Vercel project add `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` and `STATS_KEY`, then redeploy. Open `/stats.html` and enter the `STATS_KEY`. A play is counted when the first race of a visit starts, and play time only while racing.
