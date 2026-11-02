import { expect, test } from '@playwright/test';

// The home screen fits every screen, its buttons have pictures, and the
// Dorothy Games logo leads back to the portal.

const SIZES = {
  'small phone': { width: 360, height: 640 },
  phone: { width: 390, height: 844 },
  tablet: { width: 1180, height: 820 },
  'phone landscape': { width: 844, height: 390 },
};

type Box = { x: number; y: number; w: number; h: number };
const inside = (a: Box, b: Box, slack = 1) =>
  a.x >= b.x - slack && a.y >= b.y - slack && a.x + a.w <= b.x + b.w + slack && a.y + a.h <= b.y + b.h + slack;

for (const [name, viewport] of Object.entries(SIZES)) {
  test(`${name}: the home screen fits, and every button has a picture`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/?debug=state');
    await page.waitForSelector('#home:not(.hidden) .home-btn');
    for (const going of [false, true]) {
      if (going) {
        // start playing, touch something, then come back home
        await page.click('#btn-play');
        await page.evaluate(() => { (window as any).__dd.touched = true; });
        await page.click('#btn-home');
      }
      await page.waitForTimeout(500);
      const m = await page.evaluate(() => {
        const box = (e: Element) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
        return {
          view: { x: 0, y: 0, w: innerWidth, h: innerHeight },
          card: box(document.querySelector('.title-card')!),
          buttons: [...document.querySelectorAll<HTMLElement>('.title-card .home-btn')].filter((e) => e.offsetParent).map((b) => ({
            label: b.querySelector('.home-label')!.textContent,
            icon: !!b.querySelector('.home-ic svg'),
            h: b.getBoundingClientRect().height,
            spill: b.scrollWidth - b.clientWidth,
          })),
          portal: (document.querySelector('.portal-link') as HTMLAnchorElement).href,
          portalImg: (document.querySelector('.portal-link img') as HTMLImageElement).naturalWidth,
        };
      });
      expect(inside(m.card, m.view), 'the home card fits on screen').toBe(true);
      expect(m.buttons.map((b) => b.label)).toEqual(going ? ['להמשיך', 'מההתחלה'] : ['לשחק']);
      for (const b of m.buttons) {
        expect(b.icon, `"${b.label}" has a picture`).toBe(true);
        expect(b.h, `"${b.label}" is easy to tap`).toBeGreaterThanOrEqual(48);
        expect(b.spill, `"${b.label}" fits its button`).toBeLessThanOrEqual(1);
      }
      expect(m.portal).toBe('https://dorothy-games.vercel.app/');
      expect(m.portalImg).toBeGreaterThan(0);
    }
  });
}

test('"from the start" asks first, and "no" keeps the game', async ({ page }) => {
  await page.goto('/?debug=state');
  await page.click('#btn-play');
  await page.evaluate(() => { (window as any).__dd.touched = true; });
  await page.click('#btn-home');
  await page.click('#btn-new');
  await expect(page.locator('#ask')).toBeVisible();
  await page.click('#btn-no');
  await expect(page.locator('#home')).toBeVisible();
  expect(await page.evaluate(() => (window as any).__dd.touched)).toBe(true);
});
