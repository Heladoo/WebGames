// Renders public/og-image.png from ?debug=og (the logo plus the shelf pictures).
// Start the dev server first, then from portal/:
//
//   npx vite --port 5199 &
//   node scripts/render-art.mjs
//
// The icons and the logo files come from scripts/logo-assets.py instead.

import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';

const localChromium = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = process.env.BASE_URL || 'http://localhost:5199';

const browser = await chromium.launch(existsSync(localChromium) ? { executablePath: localChromium } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(`${BASE}/?debug=og`);
await page.waitForFunction(() => window.__ready === true);
await page.locator('#og').screenshot({ path: new URL('../public/og-image.png', import.meta.url).pathname });
console.log('wrote og-image.png');
await browser.close();
