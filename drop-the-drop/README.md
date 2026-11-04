# Drop the Drop (טיפות צבע לכוסות)

A calm browser game for young children, based on a real activity: drops of coloured water on smooth paper are guided into cups drawn on the paper. It is played in landscape; an upright phone or tablet is asked to turn.

- **Drag** a drop with a finger or the mouse. It stretches toward the finger, lags a little like real water, and wobbles as it settles when you let go.
- **Join** drops to make a bigger drop. A cup shows its colour and a dashed circle the size of the drop it wants; dots on a cup count the drops it still takes.
- **Keep colours apart** in the early levels: a drop of another colour trembles when you come close, and if two colours touch they mix. The game shows what happened (red + blue = purple) and you play the level again.
- **Mix colours** in the later levels: red + yellow make orange, blue + yellow make green, red + blue make purple. Every mix has a name, such as turquoise (blue + green); later cups want in-between colours like turquoise, lime, red-orange, indigo and magenta.
- A slow finger moves a drop calmly; a fast finger pulls it along fast.
- The plant on the table grows from level to level and blooms near the end.
- **Split** a big drop in two with a double tap (or a double click), to share one colour between two mixes.
- **Glitter glue:** dragging a drop through a glue stripe gives it glitter. Cups with glitter on their rim want glittery drops; plain cups don't, so sometimes you go through the glue and sometimes around it.
- **A free mixing level:** lots of tiny dots of every colour to join into one huge brown drop; nothing can go wrong.
- **The paper towel:** a drop that touches the towel soaks in right there, at the edge it reached; the colour wicks through the fibres, mixes where stains meet and dries lighter. First free colouring, then pictures cut out of towel to colour (a red dot to learn it, a flower, a sun, three balloons), mixing colours like green from yellow and blue. A clearly wrong colour shows a try-again card; small bleeds are fine.
- **35 levels** that open one by one. Play (or "next" at the end of a level) goes on to the next level; the Levels screen shows every open level, plus the next one, locked.
- When the last cup fills, the cups hop, star stickers pop onto the paper and "כל הכבוד!" is written on it.
- If you wait a while, a see-through finger shows a move to try.
- Buttons are drops of jelly: pressing one splashes it, then the next screen opens.

No ads, no accounts, no cookies. Only plays and play time are counted, anonymously (no personal data). Sound can be muted with the speaker button.

## Development

```
npm install
npm run dev      # http://localhost:5173
npm run build    # type check + production build
npm test         # Playwright
```

Debug pages: `?debug=play`, `?level=N`, `?debug=party&level=N`, `?debug=lab`, `?debug=sheet`, `?debug=icon`, `?debug=state`.

## Deploying

A Vercel project with Root Directory `drop-the-drop` (framework Vite). `vercel.json` carries the strict CSP and other headers. Set `SITE_URL` once there is a custom domain.

### Play statistics (optional)

Anonymous counts of plays, players, play time and which levels are started and finished, shown at `/stats.html`. In Vercel → Settings → Environment Variables (all environments), set:

- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`: from a free database at upstash.com. The URL is `https://<name>.upstash.io`, with no port. One database can serve all the games, since each game uses its own key prefix; this one is `dd:`.
- `STATS_KEY`: the password for the dashboard.

Then redeploy. Without these variables the game works exactly the same and counts nothing.
