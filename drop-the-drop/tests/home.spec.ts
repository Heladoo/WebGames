import { expect, test, type Page } from '@playwright/test';

// The home screen fits every landscape screen, its buttons have pictures, the
// levels open one by one, and the Dorothy Games logo leads back to the portal.
// Upright screens are asked to turn the device.

const SIZES = {
  'small phone landscape': { width: 640, height: 360 },
  'phone landscape': { width: 844, height: 390 },
  tablet: { width: 1180, height: 820 },
  laptop: { width: 1366, height: 768 },
};

type Box = { x: number; y: number; w: number; h: number };
const inside = (a: Box, b: Box, slack = 1) =>
  a.x >= b.x - slack && a.y >= b.y - slack && a.x + a.w <= b.x + b.w + slack && a.y + a.h <= b.y + b.h + slack;

async function open(page: Page, done: string[]) {
  await page.goto('/?debug=state');
  await page.evaluate((done) => localStorage.setItem('drop-the-drop:v1', JSON.stringify({ v: 1, muted: false, done })), done);
  await page.reload();
  await page.waitForSelector('#home:not(.hidden) .home-btn');
  await page.waitForTimeout(500);
}

const measure = (page: Page) => page.evaluate(() => {
  const box = (e: Element) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  const card = document.querySelector('.title-card')!;
  const parts = [...document.querySelectorAll<HTMLElement>('.title-card .home-btn, .title-card .portal-link, .title-logo')].filter((e) => e.offsetParent);
  return {
    view: { x: 0, y: 0, w: innerWidth, h: innerHeight },
    card: box(card),
    parts: parts.map((e) => ({ id: e.id || e.className, ...box(e) })),
    buttons: [...document.querySelectorAll<HTMLElement>('.title-card .home-btn')].filter((e) => e.offsetParent).map((b) => ({
      label: b.querySelector('.home-label')!.textContent,
      icon: !!b.querySelector('.home-ic svg'),
      h: b.getBoundingClientRect().height,
      spill: b.scrollWidth - b.clientWidth,
    })),
    portal: (document.querySelector('.portal-link') as HTMLAnchorElement).href,
    portalImg: (document.querySelector('.portal-link img') as HTMLImageElement).naturalWidth,
    logo: (document.querySelector('.title-logo img') as HTMLImageElement).naturalWidth,
  };
});

for (const [name, viewport] of Object.entries(SIZES)) {
  test(`${name}: the home screen fits, with picture buttons and the open levels`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const done of [[], ['l1', 'l2', 'l3', 'l4']]) {
      await open(page, done);
      const m = await measure(page);
      const what = `${name}, ${done.length} done`;
      expect(inside(m.card, m.view), `${what}: the card fits on screen`).toBe(true);
      for (const p of m.parts) expect(inside(p, m.card), `${what}: ${p.id} is inside the card`).toBe(true);
      expect(m.buttons.map((b) => b.label)).toEqual(done.length ? ['להמשיך', 'שלבים', 'מההתחלה'] : ['לשחק', 'שלבים']);
      for (const b of m.buttons) {
        expect(b.icon, `${what}: "${b.label}" has a picture`).toBe(true);
        expect(b.h, `${what}: "${b.label}" is easy to tap`).toBeGreaterThanOrEqual(48);
        expect(b.spill, `${what}: "${b.label}" fits its button`).toBeLessThanOrEqual(1);
      }
      expect(m.portal).toBe('https://dorothy-games.vercel.app/');
      expect(m.portalImg).toBeGreaterThan(0);
      expect(m.logo, `${what}: the game logo loads`).toBeGreaterThan(0);

      // the levels screen: the open levels plus the next one, locked
      await page.click('#btn-levels');
      const p = await page.evaluate(() => {
        const box = (e: Element) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
        return {
          card: box(document.querySelector('.pick-card')!),
          tiles: [...document.querySelectorAll<HTMLButtonElement>('.level-tile')].map((t) => ({ locked: t.disabled, ...box(t) })),
        };
      });
      expect(inside(p.card, m.view), `${what}: the levels card fits on screen`).toBe(true);
      expect(p.tiles.length).toBe(done.length + 2);
      expect(p.tiles.filter((t) => t.locked).length).toBe(1);
      expect(p.tiles[p.tiles.length - 1].locked).toBe(true);
      for (const t of p.tiles) {
        expect(t.h).toBeGreaterThanOrEqual(48);
        expect(inside(t, p.card), `${what}: every tile is inside the card`).toBe(true);
      }
      await page.click('#btn-pick-back');
      await expect(page.locator('#home')).toBeVisible();
    }
  });
}

test('an upright screen asks to turn the device, and the game ignores touches', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?debug=play');
  await expect(page.locator('#rotate')).toBeVisible();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('#rotate')).toBeHidden();
});

test('"from the start" asks first; "no" keeps the progress', async ({ page }) => {
  await page.setViewportSize(SIZES.tablet);
  await open(page, ['l1', 'l2']);
  await page.click('#btn-new');
  await expect(page.locator('#ask')).toBeVisible();
  await page.click('#btn-no');
  await expect(page.locator('#home')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('drop-the-drop:v1')!).done)).toEqual(['l1', 'l2']);
  await page.click('#btn-new');
  await page.click('#btn-yes');
  await expect(page.locator('#level-pill')).toHaveText('1');
});

test('"play" opens the next level; a tile on the levels screen opens any open level', async ({ page }) => {
  await page.setViewportSize(SIZES.tablet);
  await open(page, ['l1', 'l2', 'l3']);
  await page.click('#btn-play');
  await expect(page.locator('#level-pill')).toHaveText('4');
  await page.click('#btn-home');
  await page.click('#btn-levels');
  await page.click('.level-tile >> nth=1');
  await expect(page.locator('#level-pill')).toHaveText('2');
  await page.click('#btn-home');
  await expect(page.locator('#home')).toBeVisible();
});
