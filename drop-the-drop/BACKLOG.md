# Backlog (drop-the-drop)

## Owner feedback on the sample (for the next version)

- **The "well done" screen** looks plain in an odd, unnatural way. Redo it as part of the scene (for example the filled cups themselves celebrate, drops dance or splash on the paper) rather than a small card with two dots.
- **The plain paper background** may be too boring (the owner is not sure). Try options: a sheet on a table (wood or a cutting mat) with the black diamond card from the reference picture, a soft texture, small doodles at the edges.
- **Home screen with levels:** continue the current level, or pick any level already opened; the next locked level is visible too.
- **Landscape only** (agreed): one wide layout leaves more room for cups and paths. A web page cannot lock orientation everywhere (iOS ignores `screen.orientation.lock`), so in portrait show a friendly "turn the device" picture over a paused game, and try `screen.orientation.lock('landscape')` after going fullscreen where the browser allows it (Android). Then design levels for one aspect range (about 16:9 to 4:3) instead of spreading them for any shape.

## Next: the full game (after the sample is approved)

- **Level path**, slow and gentle:
  1. One colour, one drop: just drag it into the cup.
  2. One colour, several drops: drag each in (cups accept any size).
  3. Join: the cup wants a drop of size 2, then 3.
  4. Two colours: join each, keep them apart (the sample level).
  5. Three colours with less room between them.
  6. Mixing: red + yellow for an orange cup, blue + yellow for green, red + blue for purple.
  7. Mixing with amounts: two yellow + one red for a yellow-orange cup.
- A level map (the home screen or a strip of paper sheets) with levels opening one by one.
- Add the game to the portal shelf (`portal/src/games.ts`, with a tile picture) once it has a Vercel URL.
- Anonymous play stats (the shared `stats.ts` / `api/stats.js` pattern, prefix `dd:`), plus a note in the UI.

## Ideas

- A drop pulled very fast could leave a tiny droplet behind (splitting).
- Drops leave a faint damp trail on the paper that fades.
- A toothpick or straw as the drag tool (shown at the finger).
- A gentle tilt of the paper in some levels.
