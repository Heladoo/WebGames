# Drop the Drop (טיפות צבע לכוסות)

A calm browser game for young children, based on a real activity: drops of coloured water on smooth paper are guided into cups drawn on the paper.

- **Drag** a drop with a finger or the mouse. It stretches toward the finger, lags a little like real water, and wobbles as it settles when you let go.
- **Join** drops of the same colour to make a bigger drop.
- **Keep colours apart**: if a drop touches a drop of another colour they mix. The game shows what happened (red + blue = purple) and you play the level again.
- **Take each drop to its cup.** A cup shows its colour, plus a dashed circle the size of the drop it wants. A drop that is too small or the wrong colour gently slides back out.
- If you wait a while, a see-through finger shows a move to try.

This is a **one-level sample** for agreeing on the look and feel; more levels (one colour, joining, mixing colours) will follow.

No ads, no accounts, no cookies, nothing counted or sent. Sound can be muted with the speaker button.

## Development

```
npm install
npm run dev      # http://localhost:5173
npm run build    # type check + production build
npm test         # Playwright
```

Debug pages: `?debug=play`, `?debug=sheet`, `?debug=icon`, `?debug=state`, `?level=mix`.

## Deploying

A Vercel project with Root Directory `drop-the-drop` (framework Vite). `vercel.json` carries the strict CSP and other headers. Set `SITE_URL` once there is a custom domain.
