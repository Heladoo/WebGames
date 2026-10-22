// Renders the shelf pictures (public/games/<id>.jpg), 1:1, from each game's logo.
//
//   node scripts/tile-art.mjs
//
// The logos of Otter River, Bead Box and Birdnet Kids live in art/logos/ (Birdnet Kids is a
// separate repo, Heladoo/Birdnet_kids, and its logo is a copy of that repo's logo-badge.png).
// Word Trail's and Race to the Palace's logos are read from their own folders.
//
// A logo is drawn on a backdrop (`bg`): the logo's own background colour where it has one (so
// the picture blends in with no visible square; sampled from the file's edges), or a gradient
// of the game's colours. `width` is the logo's width as a percentage of the 700 px square tile.
//
// A game with no logo just needs a square picture (about 700×700) saved as public/games/<id>.jpg.

import { chromium } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

const localChromium = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT = new URL('../public/games/', import.meta.url);

const TILES = [
  { id: 'otter-river', logo: '../art/logos/otter-river.webp', bg: '#fcf6e8', width: 100 },
  { id: 'word-trail', logo: '../../word-trail/public/logo.webp', bg: 'radial-gradient(circle at 50% 42%, #f4fbf4 0%, #cfe9e4 100%)', width: 88 },
  { id: 'bead-box', logo: '../art/logos/bead-box.webp', bg: 'linear-gradient(#76d8fd 0%, #9be7fd 50%, #8ce1fb 100%)', width: 100 },
  { id: 'palace-race', logo: '../../palace-race/public/logo.webp', bg: 'radial-gradient(circle at 50% 48%, #3b2d7a 0%, #1b1450 100%)', width: 92 },
  { id: 'birdnet-kids', logo: '../art/logos/birdnet-kids.png', bg: '#faf6eb', width: 100 },
];

const MIME = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg' };
const dataUri = (rel) => `data:${MIME[rel.split('.').pop()]};base64,${readFileSync(new URL(rel, import.meta.url)).toString('base64')}`;

const browser = await chromium.launch(existsSync(localChromium) ? { executablePath: localChromium } : {});
for (const t of TILES) {
  const page = await browser.newPage({ viewport: { width: 700, height: 700 } });
  const src = dataUri(t.logo);
  await page.setContent(`<body style="margin:0;width:700px;height:700px;position:relative;overflow:hidden;background:${t.bg}">
    <img src="${src}" style="position:absolute;left:50%;top:50%;width:${t.width}%;height:auto;transform:translate(-50%,-50%)"></body>`);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete));
  const path = new URL(`${t.id}.jpg`, OUT).pathname;
  await page.screenshot({ path, type: 'jpeg', quality: 86 });
  console.log('wrote', path);
  await page.close();
}
await browser.close();
