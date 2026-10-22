// Cuts the owner's logo (art/logo-source.webp, on a flat blue backdrop) out to a
// transparent background and writes public/logo.webp (640 px) and
// public/logo-small.webp (256 px). Run from word-trail/: node scripts/logo-assets.mjs
// Uses the sandbox's Chromium (canvas flood fill), since Pillow isn't available.
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});
const page = await browser.newPage();
const src = 'data:image/webp;base64,' + readFileSync('art/logo-source.webp').toString('base64');

const out = await page.evaluate(async (src) => {
  const img = new Image();
  img.src = src;
  await img.decode();
  const W = img.width, H = img.height;
  const c = new OffscreenCanvas(W, H);
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const id = ctx.getImageData(0, 0, W, H);
  const d = id.data;
  // how much a pixel looks like the blue backdrop (or its blue shadow): 0 = not at all, 1 = fully
  const bg = (i) => Math.max(0, Math.min(1, (d[i + 2] - d[i] - 40) / 50));
  // flood fill from the border through backdrop pixels
  const seen = new Uint8Array(W * H);
  const stack = [];
  for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
  const edge = [];
  while (stack.length) {
    const p = stack.pop();
    if (seen[p]) continue;
    seen[p] = 1;
    const a = bg(p * 4);
    if (a < 0.5) { edge.push(p); continue; }
    d[p * 4 + 3] = 0;
    const x = p % W, y = (p / W) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < W - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - W);
    if (y < H - 1) stack.push(p + W);
  }
  // soften the cut: the first ring of kept pixels fades by how blue it is, tinted toward cream
  for (const p of edge) {
    const i = p * 4, a = bg(i);
    d[i + 3] = Math.round(255 * (1 - a));
    d[i] = Math.min(255, d[i] + 60 * a);
    d[i + 1] = Math.min(255, d[i + 1] + 30 * a);
  }
  ctx.putImageData(id, 0, 0);
  // trim the empty margin
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 8) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const res = {};
  for (const [name, w] of [['logo', 640], ['logo-small', 256]]) {
    const h = Math.round((w * (y1 - y0 + 1)) / (x1 - x0 + 1));
    const o = new OffscreenCanvas(w, h);
    const octx = o.getContext('2d');
    octx.imageSmoothingQuality = 'high';
    octx.drawImage(c, x0, y0, x1 - x0 + 1, y1 - y0 + 1, 0, 0, w, h);
    const blob = await o.convertToBlob({ type: 'image/webp', quality: 0.9 });
    const buf = new Uint8Array(await blob.arrayBuffer());
    let s = '';
    for (const b of buf) s += String.fromCharCode(b);
    res[name] = { b64: btoa(s), w, h };
  }
  return res;
}, src);

for (const [name, { b64, w, h }] of Object.entries(out)) {
  writeFileSync(`public/${name}.webp`, Buffer.from(b64, 'base64'));
  console.log(`public/${name}.webp ${w}×${h}`);
}
await browser.close();
