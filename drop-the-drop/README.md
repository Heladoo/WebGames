# Drop the Drop (טיפות צבע לכוסות)

A calm browser game for young children, based on a real activity: drops of coloured water on smooth paper are guided into cups drawn on the paper. It is played in landscape; an upright phone or tablet is asked to turn.

- **Drag** a drop with a finger or the mouse. It stretches toward the finger, lags a little like real water, and wobbles as it settles when you let go.
- **Join** drops to make a bigger drop. A cup shows its colour and a dashed circle the size of the drop it wants; dots on a cup count the drops it still takes.
- **Keep colours apart** in the early levels: a drop of another colour trembles when you come close, and if two colours touch they mix. The game shows what happened (red + blue = purple) and you play the level again.
- **Mix colours** in the later levels: red + yellow make orange, blue + yellow make green, red + blue make purple.
- **12 levels** that open one by one; the home screen lists the open ones and shows the next one, locked.
- When the last cup fills, the cups hop, star stickers pop onto the paper and "כל הכבוד!" is written on it.
- If you wait a while, a see-through finger shows a move to try.

No ads, no accounts, no cookies, nothing counted or sent. Sound can be muted with the speaker button.

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
