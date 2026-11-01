# Backlog (drop-the-drop)

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
