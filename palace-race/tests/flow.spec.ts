import { expect, test, type Page } from '@playwright/test';

// The real game, driven in the browser: the screens, saving, medals opening tracks, old saves, the shop, the controls, pausing and the
// grown-ups panel. Races are driven by window.__drive (an autopilot and a speed-up) so they take a few seconds.

const KEY = 'palace-race-save-v1';

async function start(page: Page, save?: object, drive?: object) {
  await page.addInitScript(
    ([k, s, d]) => {
      if (s && !sessionStorage.getItem('seeded')) {
        localStorage.setItem(k as string, JSON.stringify(s));
        sessionStorage.setItem('seeded', '1');
      }
      if (d) (window as unknown as { __drive: unknown }).__drive = d;
    },
    [KEY, save ?? null, drive ?? null] as const,
  );
  await page.goto('/');
}

const saved = (page: Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), KEY);
const tap = async (page: Page, sel: string) => {
  await page.locator(sel).first().waitFor();
  await page.locator(sel).first().click({ force: true });
};
const base = { coins: 0, medals: 0, unlocked: ['forest'], owned: [], races: 5, wins: 0, settings: { music: false, sound: false, volume: 0.5, help: true } };

test('title → map → animal → rider → race → ceremony, and the coins are saved', async ({ page }) => {
  test.setTimeout(120_000);
  await start(page, base, { autopilot: 1, speed: 8 });
  await tap(page, '#btn-play');
  await tap(page, '.track-card[data-t="forest"]');
  await tap(page, '.choice[data-id="reindeer"]');
  await expect(page.locator('.choice[data-id="reindeer"]')).toHaveClass(/on/);
  await tap(page, '#btn-next');
  await tap(page, '.choice[data-id="tamar"]');
  await tap(page, '#btn-next');
  await page.waitForFunction(() => (window as unknown as { game?: { started: boolean } }).game?.started, null, { timeout: 60_000 });
  await page.locator('canvas.podium.ready').waitFor({ timeout: 90_000 });
  await expect.poll(async () => (await saved(page))?.races, { timeout: 5000 }).toBe(6);
  const s = await saved(page);
  expect(s.coins).toBeGreaterThanOrEqual(25);
  expect(s.animal).toBe('reindeer');
  expect(s.kid).toBe('tamar');
  // a medal opens the meadow
  expect(s.unlocked.includes('meadow')).toBe(s.medals >= 1);
  await page.locator('.reward:not(.hidden)').waitFor();
  // the coins won rise into the total, which ends at the saved count
  await expect(page.locator('#sum')).toHaveText(String(s.coins), { timeout: 8000 });
  await expect(page.locator('#medals')).toHaveText(String(s.medals), { timeout: 8000 });
  if (s.medals) await expect(page.locator('#c-new')).toBeVisible();
  await tap(page, '#c-map');
  await page.locator('.screen.map').waitFor();
});

test('tracks open with medals, never with coins', async ({ page }) => {
  await start(page, { ...base, coins: 999, medals: 0 });
  await tap(page, '#btn-play');
  await tap(page, '.track-card[data-t="meadow"]');
  await expect(page.locator('.track-card[data-t="meadow"]')).toHaveClass(/locked/);
  await expect(page.locator('.track-card[data-t="meadow"] .pips svg')).toHaveCount(1);
  await page.waitForTimeout(600);
  expect(await page.locator('.screen.map').count()).toBe(1);
  expect((await saved(page))?.coins ?? 999).toBe(999);
});

test('medals already won open their tracks', async ({ page }) => {
  await start(page, { ...base, medals: 3 });
  await tap(page, '#btn-play');
  for (const t of ['forest', 'meadow', 'snow']) await expect(page.locator(`.track-card[data-t="${t}"]`)).toHaveClass(/open/);
  await expect(page.locator('.track-card[data-t="canyon"]')).toHaveClass(/locked/);
  // 3 of the 5 medals the canyon needs are filled in
  await expect(page.locator('.track-card[data-t="canyon"] .pips svg')).toHaveCount(5);
  await tap(page, '.track-card[data-t="snow"]');
  await page.locator('.screen.choose.animal').waitFor();
});

test('an early save keeps its tracks, wins (as medals) and braids (as hair)', async ({ page }) => {
  await start(page, { coins: 30, unlocked: ['forest', 'canyon'], wins: 2, owned: ['braids:pink'], outfit: { helmet: 'basic', braids: 'pink', saddle: 'basic' } });
  const d = await page.evaluate(() => (window as unknown as { app: { data: { medals: number; unlocked: string[]; owned: string[]; outfit: { hair: string } } } }).app.data);
  expect(d.medals).toBe(2);
  expect(d.unlocked).toEqual(['forest', 'meadow', 'canyon']);
  expect(d.owned).toContain('hair:pink');
  expect(d.outfit.hair).toBe('pink');
});

test('the shop sells an item, wears it, and keeps coins safe when there are not enough', async ({ page }) => {
  await start(page, { ...base, coins: 60 });
  await tap(page, '#btn-play');
  await tap(page, '[data-tb="shop"]');
  await tap(page, '.item[data-id="stars"]');
  await expect.poll(async () => (await saved(page))?.coins).toBe(10);
  const s = await saved(page);
  expect(s.owned).toContain('helmet:stars');
  expect(s.outfit.helmet).toBe('stars');
  await tap(page, '.item[data-id="crown"]');
  await page.locator('.item[data-id="crown"] .jar-pop').waitFor();
  expect((await saved(page)).coins).toBe(10);
  await tap(page, '.tab[data-k="saddle"]');
  await expect(page.locator('.item[data-id="royal"]')).toBeVisible();
  await tap(page, '#btn-done');
  await page.locator('.screen.map').waitFor();
});

test('keyboard and on-screen buttons jump, duck and change lanes; pause stops the race', async ({ page }) => {
  await page.goto('/?debug=race&help=0&seed=9');
  await page.waitForFunction(() => (window as unknown as { game?: { started: boolean } }).game?.started, null, { timeout: 60_000 });
  type G = { me: { air: number; jumpAt: number; duck: number; lane: number }; t: number };
  const me = () => page.evaluate(() => { const g = (window as unknown as { game: G }).game; return { air: g.me.air, jumpAt: g.me.jumpAt, duck: g.me.duck, lane: g.me.lane, t: g.t }; });
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => (await me()).lane).toBe(2);
  await page.locator('#btn-far').dispatchEvent('pointerdown');
  await expect.poll(async () => (await me()).lane).toBe(1);
  await page.keyboard.press('ArrowUp');
  await expect.poll(async () => { const m = await me(); return m.air >= 0 || m.jumpAt >= 0; }).toBe(true);
  await page.waitForTimeout(1900);
  await page.locator('#btn-duck').dispatchEvent('pointerdown');
  await expect.poll(async () => (await me()).duck).toBeGreaterThan(0);
  await page.locator('#btn-pause').click();
  await expect(page.locator('#pause')).toBeVisible();
  const t0 = (await me()).t;
  await page.waitForTimeout(600);
  expect((await me()).t).toBe(t0);
  await page.locator('#btn-resume').click();
  await expect(page.locator('#pause')).toBeHidden();
  await expect.poll(async () => (await me()).t).toBeGreaterThan(t0);
});

test('the grown-ups panel opens only with a long press', async ({ page }) => {
  await start(page, base);
  await tap(page, '#btn-play');
  const gear = page.locator('[data-tb="gear"]');
  await gear.waitFor();
  await gear.click();
  await page.waitForTimeout(300);
  await expect(page.locator('.overlay.grownups')).toHaveCount(0);
  const b = (await gear.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1700);
  await page.mouse.up();
  await expect(page.locator('.overlay.grownups')).toBeVisible();
  await page.locator('#g-music + .switch').click();
  await expect.poll(async () => (await saved(page))?.settings?.music).toBe(true);
});
