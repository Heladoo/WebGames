// Renders public/og-image.png and the app icons from ?debug=og and
// ?debug=icon. Start the dev server first, then from portal/:
//
//   npx vite --port 5199 &
//   node scripts/render-art.mjs
//
// When the owner's logo arrives: replace public/logo.svg and run this again.

import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';

const localChromium = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = process.env.BASE_URL || 'http://localhost:5199';
const out = (name) => new URL(`../public/${name}`, import.meta.url).pathname;

const browser = await chromium.launch(existsSync(localChromium) ? { executablePath: localChromium } : {});

async function shot(kind, selector, file, scale = 1, transparent = false) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: scale });
  await page.goto(`${BASE}/?debug=${kind}`);
  await page.waitForFunction(() => window.__ready === true);
  if (transparent) {
    await page.evaluate(() => {
      document.body.style.background = 'transparent';
      document.getElementById('icon').style.background = 'transparent';
    });
  }
  await page.locator(selector).screenshot({ path: out(file), omitBackground: transparent });
  console.log('wrote', file);
  await page.close();
}

await shot('og', '#og', 'og-image.png');
await shot('icon', '#icon', 'icon-512.png');
await shot('icon', '#icon', 'icon-maskable-512.png');
await shot('icon', '#icon', 'icon-192.png', 192 / 512);
await shot('icon', '#icon', 'apple-touch-icon.png', 180 / 512);
await shot('icon', '#icon', 'favicon.png', 64 / 512, true);
await browser.close();
