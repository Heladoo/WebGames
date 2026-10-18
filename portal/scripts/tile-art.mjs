// Renders the shelf pictures (public/games/<id>.jpg) from each game's own
// link-preview page (?debug=og), with the English title box taken out, cropped
// to 4:3. Run each game's dev server first, then from portal/:
//
//   (cd ../otter-river && npx vite --port 5301) &
//   (cd ../word-trail  && npx vite --port 5302) &
//   (cd ../bead-box    && npx vite --port 5303) &
//   node scripts/tile-art.mjs
//
// A game from outside this repo just needs a 4:3 picture (about 700×525)
// saved as public/games/<id>.jpg.

import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';

const localChromium = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT = new URL('../public/games/', import.meta.url);

const SHOTS = [
  {
    id: 'otter-river',
    url: 'http://localhost:5301/?debug=assets&kind=og',
    // the title is painted on the canvas: skip the text and its rounded box
    init: () => {
      CanvasRenderingContext2D.prototype.fillText = () => {};
      CanvasRenderingContext2D.prototype.roundRect = () => {};
    },
    ready: async (page) => page.waitForTimeout(1500),
    clip: { x: 360, y: 170, width: 600, height: 450 },
  },
  {
    id: 'word-trail',
    url: 'http://localhost:5302/?debug=og',
    ready: async (page) => {
      await page.waitForSelector('.og-title');
      await page.evaluate(() => document.querySelector('.og-title')?.remove());
      await page.waitForTimeout(800);
    },
    clip: { x: 380, y: 105, width: 700, height: 525 },
  },
  {
    id: 'bead-box',
    url: 'http://localhost:5303/?debug=og',
    ready: async (page) => {
      await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
      await page.evaluate(() => {
        const og = document.getElementById('og');
        [...(og?.children ?? [])].find((el) => el.textContent?.includes('Bead Box'))?.remove();
      });
    },
    clip: { x: 470, y: 105, width: 700, height: 525 },
  },
];

const browser = await chromium.launch(existsSync(localChromium) ? { executablePath: localChromium } : {});
for (const s of SHOTS) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  if (s.init) await page.addInitScript(s.init);
  await page.goto(s.url);
  await s.ready(page);
  const path = new URL(`${s.id}.jpg`, OUT).pathname;
  await page.screenshot({ path, type: 'jpeg', quality: 82, clip: s.clip });
  console.log('wrote', path);
  await page.close();
}
await browser.close();
