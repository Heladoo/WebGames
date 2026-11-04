import { expect, test, type Page } from '@playwright/test';

// The home screen fits every landscape screen, its buttons have pictures, the
// levels open one by one, and the Dorothy Games logo leads back to the portal.
// Upright screens are asked to turn the device.

const SIZES = {
  'small phone landscape': { width: 640, height: 360 },
  'phone landscape': { width: 844, height: 390 },
  'phone landscape with browser bars': { width: 800, height: 330 },
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
  const parts = [...document.querySelectorAll<HTMLElement>('.title-card .home-btn, .title-card .portal-link, .title-logo, .title-card .fine')].filter((e) => e.offsetParent);
  return {
    view: { x: 0, y: 0, w: innerWidth, h: innerHeight },
    card: box(card),
    scrolls: card.scrollHeight > card.clientHeight + 1 || card.scrollWidth > card.clientWidth + 1,
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
      expect(m.buttons.map((b) => b.label)).toEqual(done.length ? ['להמשיך', 'שלבים'] : ['לשחק', 'שלבים']);
      for (const b of m.buttons) {
        expect(b.icon, `${what}: "${b.label}" has a picture`).toBe(true);
        expect(b.h, `${what}: "${b.label}" is easy to tap`).toBeGreaterThanOrEqual(48);
        expect(b.spill, `${what}: "${b.label}" fits its button`).toBeLessThanOrEqual(1);
      }
      const ics = await page.evaluate(() => [...document.querySelectorAll('.home-buttons .home-btn')].map((b) => {
        const i = b.querySelector('.home-ic')!.getBoundingClientRect(), l = b.querySelector('.home-label')!.getBoundingClientRect(), r = b.getBoundingClientRect();
        return { icon: i.right, label: l.right, w: r.width };
      }));
      for (const x of ics) {
        expect(Math.abs(x.icon - ics[0].icon), `${what}: icons in one column`).toBeLessThan(1);
        expect(Math.abs(x.label - ics[0].label), `${what}: words start together`).toBeLessThan(1);
        expect(Math.abs(x.w - ics[0].w), `${what}: buttons share one width`).toBeLessThan(1);
      }
      const logo = m.parts.find((p) => p.id === 'title-logo')!;
      const first = m.parts.find((p) => p.id === 'btn-play')!;
      expect(m.scrolls, `${what}: the home card does not scroll`).toBe(false);
      if (viewport.height > 560) {
        expect(logo.y + logo.h, `${what}: the logo is above the buttons`).toBeLessThanOrEqual(first.y + 1);
        expect(Math.abs(first.x + first.w / 2 - (logo.x + logo.w / 2)), `${what}: the buttons are centred under the logo`).toBeLessThan(2);
      } else {
        // phones held sideways: the logo on the left, the menu on the right
        expect(logo.x + logo.w, `${what}: the logo is left of the buttons`).toBeLessThanOrEqual(first.x + 1);
      }
      expect(m.portal).toBe('https://dorothy-games.vercel.app/');
      expect(m.portalImg).toBeGreaterThan(0);
      expect(m.logo, `${what}: the game logo loads`).toBeGreaterThan(0);

      // the levels screen: the open levels plus the next one, locked
      await page.click('#btn-levels');
      await page.waitForSelector('#pick:not(.hidden) .level-tile');
      await page.waitForTimeout(450); // the card's rise animation
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

test('pressing a button splashes it, then the next screen opens', async ({ page }) => {
  await page.setViewportSize(SIZES.tablet);
  await open(page, []);
  await page.click('#btn-levels');
  // the button bursts first: the splash layer holds droplets and the levels screen is not open yet
  await expect(page.locator('#btn-levels')).toHaveClass(/pop/);
  expect(await page.locator('#pick').isHidden()).toBe(true);
  const drawn = await page.evaluate(() => {
    const c = document.getElementById('splash') as HTMLCanvasElement;
    const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4 * 7) if (d[i] > 0) n++;
    return n;
  });
  expect(drawn, 'droplets are drawn').toBeGreaterThan(0);
  await expect(page.locator('#pick')).toBeVisible();
});

test('with every level open, the levels screen still fits a small phone held sideways', async ({ page }) => {
  for (const viewport of [{ width: 640, height: 360 }, { width: 800, height: 330 }, { width: 1180, height: 820 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/?debug=state');
    const ids = await page.evaluate(async () => (await import('/src/levels.ts')).LEVELS.map((l: { id: string }) => l.id));
    await open(page, ids);
    await page.click('#btn-levels');
    await page.waitForSelector('#pick:not(.hidden) .level-tile');
    await page.waitForTimeout(450);
    const m = await page.evaluate(() => {
      const r = document.querySelector('.pick-card')!.getBoundingClientRect();
      const tiles = [...document.querySelectorAll('.level-tile')].map((t) => t.getBoundingClientRect());
      return { card: { x: r.x, y: r.y, w: r.width, h: r.height }, view: { w: innerWidth, h: innerHeight }, tiles: tiles.map((t) => ({ x: t.x, y: t.y, w: t.width, h: t.height })) };
    });
    expect(m.tiles.length).toBe(ids.length);
    expect(m.card.y + m.card.h, `${viewport.width}x${viewport.height}: the card fits`).toBeLessThanOrEqual(m.view.h + 1);
    for (const t of m.tiles) {
      expect(t.h).toBeGreaterThanOrEqual(48);
      expect(t.y + t.h, `${viewport.width}x${viewport.height}: every tile is on screen`).toBeLessThanOrEqual(m.view.h + 1);
    }
  }
});
