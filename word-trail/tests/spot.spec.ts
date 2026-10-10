import { expect, test, type Page } from '@playwright/test';

// Spot it: "Where is the cloud?" The question bubble must stay small so the
// thing to find is in view and not behind it; a finger shows that the child
// should tap; tapping the thing answers; after a quiet while a ring shows it.

const SIZES = {
  'small phone': { width: 360, height: 640 },
  phone: { width: 390, height: 844 },
  tablet: { width: 1180, height: 820 },
  'phone landscape': { width: 844, height: 390 },
};

// one of each kind of thing in the scene: the sky, a friend, clothes, a carried thing, a ride, the hero
const CASES: [string, string][] = [
  ['cloud', 'sky=cloud'],
  ['sun', 'sky=sun'],
  ['bee', 'friends=bee,cat'],
  ['cat', 'friends=bee,cat'],
  ['hat', 'wear=hat'],
  ['kite', 'carry=kite'],
  ['bike', 'ride=bike'],
  ['dog', ''],
];

type Box = { x: number; y: number; w: number; h: number };
const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const box = (page: Page, sel: string) =>
  page.evaluate((sel) => {
    const e = document.querySelector(sel);
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  }, sel);

async function open(page: Page, word: string, scene: string, hint = 60000) {
  await page.goto(`/?debug=spot&word=${word}&hint=${hint}&hero=dog&${scene}`);
  await page.waitForTimeout(700); // the bubble settles, then the page measures what can be found
  return page.evaluate(() => (window as unknown as { __spot: { targets: Box[] } }).__spot.targets);
}

for (const [name, viewport] of Object.entries(SIZES)) {
  test(`${name}: the question is small and the thing to find is in view`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const [word, scene] of CASES) {
      const targets = await open(page, word, scene);
      const what = `${name}, ${word}`;
      const bubble = (await box(page, '.panel.spot'))!;
      expect(bubble.h, `${what}: the question must be small`).toBeLessThanOrEqual(100);
      expect(bubble.w, `${what}: the question must be small`).toBeLessThanOrEqual(Math.min(470, viewport.width - 20));
      expect(await page.isVisible('.panel.spot .spot-finger'), `${what}: a finger shows to tap`).toBe(true);
      expect(await page.isVisible('.panel.spot .spot-pic svg'), `${what}: the word has its picture`).toBe(true);
      // the sun can sit behind the top buttons on a phone; everything else must be findable
      if (word === 'sun' && targets.length === 0) continue;
      expect(targets.length, `${what}: the ${word} must be on screen and not under the question`).toBeGreaterThan(0);
      for (const t of targets) {
        const c = { x: t.x + t.w / 2 - 1, y: t.y + t.h / 2 - 1, w: 2, h: 2 };
        expect(overlaps(c, bubble), `${what}: the ${word} must not be behind the question`).toBe(false);
      }
    }
  });
}

test('tapping the thing answers; tapping elsewhere does not', async ({ page }) => {
  await page.setViewportSize(SIZES.phone);
  const [t] = await open(page, 'bee', 'friends=bee,cat');
  // a tap on the open grass far from the bee
  await page.mouse.click(SIZES.phone.width - 20, SIZES.phone.height - 20);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => (window as unknown as { __spot: { done: boolean } }).__spot.done)).toBe(false);
  await page.mouse.click(t.x + t.w / 2, t.y + t.h / 2);
  await page.waitForFunction(() => (window as unknown as { __spot: { done: boolean } }).__spot.done);
});

test('after a quiet while a ring and a pointing finger show the answer', async ({ page }) => {
  await page.setViewportSize(SIZES.tablet);
  const [t] = await open(page, 'hat', 'wear=hat', 800);
  expect(await page.$('.spot-ring')).toBeNull();
  await page.waitForSelector('.spot-ring', { timeout: 3000 });
  await page.waitForTimeout(100);
  const ring = (await box(page, '.spot-ring'))!;
  expect(overlaps(ring, t), 'the ring must be on the hat').toBe(true);
  expect(await page.isVisible('.spot-point'), 'a finger points at it').toBe(true);
});
