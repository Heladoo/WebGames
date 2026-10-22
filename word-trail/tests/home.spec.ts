import { expect, test, type Page } from '@playwright/test';

// The home screen: the logo, picture-and-word buttons (Play/Continue, New game,
// Album) and the Dorothy Games logo as the way back to the portal. It opens at
// the start and from the house button or the corner logo, at once (no hold).

const SIZES = {
  'small phone': { width: 360, height: 640 },
  phone: { width: 390, height: 844 },
  tablet: { width: 1180, height: 820 },
  'phone landscape': { width: 844, height: 390 },
};

type Box = { x: number; y: number; w: number; h: number };
const inside = (a: Box, b: Box, slack = 1) =>
  a.x >= b.x - slack && a.y >= b.y - slack && a.x + a.w <= b.x + b.w + slack && a.y + a.h <= b.y + b.h + slack;

/** A fresh browser, or one with a saved trip (a friend on the trail). */
async function open(page: Page, saved: boolean) {
  await page.goto('/');
  await page.evaluate(async (saved) => {
    localStorage.clear();
    if (!saved) return;
    const m = await import('/src/state.ts');
    const d = m.load();
    d.trip.hero = 'dog';
    d.trip.friends = ['bee'];
    m.save(d);
  }, saved);
  await page.reload();
  await page.waitForSelector('#title:not(.hidden) .home-btn');
  await page.waitForTimeout(300);
}

const visible = (page: Page, sel: string) => page.locator(sel).isVisible();

for (const [name, viewport] of Object.entries(SIZES)) {
  test(`${name}: the home screen fits, and every button has a picture`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const saved of [false, true]) {
      await open(page, saved);
      const m = await page.evaluate(() => {
        const box = (e: Element) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
        const card = document.querySelector('.title-card')!;
        const shown = [...document.querySelectorAll<HTMLElement>('.title-card .home-btn, .title-card .portal-link, .title-logo')].filter((e) => e.offsetParent);
        return {
          view: { x: 0, y: 0, w: innerWidth, h: innerHeight },
          card: box(card),
          parts: shown.map((e) => ({ id: e.id || e.className, ...box(e) })),
          buttons: [...document.querySelectorAll<HTMLElement>('.home-btn')].filter((e) => e.offsetParent).map((b) => ({
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
      const what = `${name}, ${saved ? 'saved trip' : 'fresh'}`;
      expect(inside(m.card, m.view), `${what}: the home card fits on screen`).toBe(true);
      for (const p of m.parts) expect(inside(p, m.card), `${what}: ${p.id} is inside the card`).toBe(true);
      expect(m.buttons.map((b) => b.label)).toEqual(saved ? ['Continue', 'New game', 'Album'] : ['Play', 'Album']);
      for (const b of m.buttons) {
        expect(b.icon, `${what}: "${b.label}" has a picture`).toBe(true);
        expect(b.h, `${what}: "${b.label}" is easy to tap`).toBeGreaterThanOrEqual(48);
        expect(b.spill, `${what}: "${b.label}" fits its button`).toBeLessThanOrEqual(1);
      }
      expect(m.portal).toBe('https://dorothy-games.vercel.app/');
      expect(m.portalImg, `${what}: the Dorothy Games logo loads`).toBeGreaterThan(0);
      expect(m.logo, `${what}: the game logo loads`).toBeGreaterThan(0);
    }
  });
}

test('the house button and the corner logo open the home screen at once', async ({ page }) => {
  await page.setViewportSize(SIZES.phone);
  await open(page, true);
  await page.click('#btn-start');
  await expect(page.locator('#title')).toHaveClass(/hidden/);
  // the old hold-to-start-over button is gone; the house is a plain tap
  expect(await page.locator('#btn-new').count()).toBe(0);
  expect(await page.locator('#btn-home svg').count()).toBe(1);
  await page.click('#btn-home');
  await expect(page.locator('#title')).not.toHaveClass(/hidden/);
  expect(await page.locator('#btn-start .home-label').textContent()).toBe('Continue');
  await page.click('#btn-start');
  await expect(page.locator('#title')).toHaveClass(/hidden/);
  await page.click('#corner-logo');
  await expect(page.locator('#title')).not.toHaveClass(/hidden/);
});

test('Album opens the photos, and New game asks first', async ({ page }) => {
  await page.setViewportSize(SIZES.phone);
  await open(page, true);
  await page.click('#btn-album');
  await expect(page.locator('#book')).not.toHaveClass(/hidden/);
  await expect(page.locator('#book .tab.on')).toHaveText('Photos');
  await page.click('#book [data-close]');
  // "no" keeps the trip
  await page.click('#btn-new-game');
  await page.click('.ask-no');
  expect(await visible(page, '#title')).toBe(true);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('word-trail-save-v1')!).trip.hero)).toBe('dog');
  // "yes" starts a new trip and goes to the trail
  await page.click('#btn-new-game');
  await page.click('.ask-yes');
  await expect(page.locator('#title')).toHaveClass(/hidden/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('word-trail-save-v1')!).trip.hero)).toBe(null);
});
