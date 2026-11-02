import { expect, test, type Page } from '@playwright/test';

// Real pointer drags on the canvas. Positions come from the ?debug=state hook
// (window.__dd); a test may first move drops so its path is clear.

type Snap = {
  over: boolean; won: boolean;
  drops: { id: number; x: number; y: number; r: number; vol: number; pig: number[]; state: string }[];
  cups: { x: number; y: number; filled: boolean; need: number; total: number; got: number; pig: number[] }[];
};

const snap = (page: Page) => page.evaluate(() => (window as any).__dd.snapshot() as Snap);

async function startLevel(page: Page, n: number) {
  await page.setViewportSize({ width: 1180, height: 820 });
  await page.goto(`/?debug=state&level=${n}`);
  await page.click('#btn-play');
  await page.waitForTimeout(1800); // drops drip in
}

/** Put drops of each colour in their own column (red left, yellow middle, blue right). */
async function sortDrops(page: Page) {
  await page.evaluate(() => {
    const g = (window as any).__dd;
    const n = [0, 0, 0];
    for (const d of g.drops) {
      const k = d.pig[0] > 0 ? 0 : d.pig[1] > 0 ? 1 : 2;
      d.x = [25, 80, 135][k]; d.y = 18 + n[k]++ * 15;
      d.vx = d.vy = 0;
    }
  });
  await page.waitForTimeout(100);
}

async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }, steps = 45) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(from.x + ((to.x - from.x) * i) / steps, from.y + ((to.y - from.y) * i) / steps);
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(500); // the drop catches up with the finger
  await page.mouse.up();
  await page.waitForTimeout(500);
}

const isRed = (p: number[]) => p[0] > 0 && p[1] === 0 && p[2] === 0;
const isYellow = (p: number[]) => p[1] > 0 && p[0] === 0 && p[2] === 0;
const isBlue = (p: number[]) => p[2] > 0 && p[0] === 0 && p[1] === 0;

test('level 6: joining three drops of a colour and taking them to their cup wins', async ({ page }) => {
  await startLevel(page, 6);
  await sortDrops(page);
  for (const [want, cupIndex] of [[isRed, 0], [isBlue, 1]] as const) {
    for (let k = 0; k < 2; k++) {
      const s = await snap(page);
      const mine = s.drops.filter((d) => want(d.pig));
      await drag(page, mine[mine.length - 1], mine[0]);
    }
    let s = await snap(page);
    const big = s.drops.filter((d) => want(d.pig));
    expect(big.length, 'three drops became one').toBe(1);
    expect(big[0].vol).toBe(3);
    await drag(page, big[0], s.cups[cupIndex]);
    await page.waitForTimeout(1000);
    s = await snap(page);
    expect(s.cups[cupIndex].filled).toBe(true);
  }
  // the celebration plays on the paper, then the buttons come
  await expect(page.locator('#win')).toBeVisible({ timeout: 6000 });
  await page.click('#btn-next');
  await expect(page.locator('#level-pill')).toHaveText('7');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('drop-the-drop:v1')!).done)).toContain('l6');
});

test('level 2: a cup that takes several drops fills one drop at a time', async ({ page }) => {
  await startLevel(page, 2);
  for (let k = 0; k < 3; k++) {
    const s = await snap(page);
    const d = s.drops.filter((x) => isYellow(x.pig)).sort((a, b) => Math.abs(a.x - s.cups[0].x) - Math.abs(b.x - s.cups[0].x))[0];
    await drag(page, d, s.cups[0]);
    await page.waitForTimeout(900);
    expect((await snap(page)).cups[0].got).toBe(k + 1);
  }
  expect((await snap(page)).cups[0].filled).toBe(true);
  await expect(page.locator('#win')).toBeVisible({ timeout: 6000 });
});

test('a small drop is refused by the cup and stays on the paper', async ({ page }) => {
  await startLevel(page, 6);
  await sortDrops(page);
  const s = await snap(page);
  const red = s.drops.filter((d) => isRed(d.pig)).pop()!; // the lowest, so it passes no other red drop
  await drag(page, red, s.cups[0]);
  await page.waitForTimeout(1000);
  const after = await snap(page);
  expect(after.cups[0].filled).toBe(false);
  const same = after.drops.find((d) => d.id === red.id)!;
  expect(same.state).toBe('rest');
  expect(same.y, 'it moved back above the cup').toBeLessThan(after.cups[0].y);
});

test('touching another colour mixes the drops and explains why', async ({ page }) => {
  await startLevel(page, 6);
  await sortDrops(page);
  const s = await snap(page);
  const red = s.drops.find((d) => isRed(d.pig))!;
  const blue = s.drops.find((d) => isBlue(d.pig))!;
  await drag(page, red, blue);
  await expect(page.locator('#fail')).toBeVisible({ timeout: 4000 });
  await expect(page.locator('#fail-text')).toContainText('סגולה');
  await page.click('#btn-retry');
  await expect(page.locator('#fail')).toBeHidden();
  const again = await snap(page);
  expect(again.drops.length).toBe(6);
  expect(again.over).toBe(false);
});

test('level 9: red and yellow mix to orange, and the orange cup takes it', async ({ page }) => {
  await startLevel(page, 9);
  let s = await snap(page);
  await drag(page, s.drops.find((d) => isRed(d.pig))!, s.drops.find((d) => isYellow(d.pig))!, 70);
  s = await snap(page);
  expect(s.drops.length).toBe(1);
  expect(s.drops[0].pig).toEqual([1, 1, 0]);
  await drag(page, s.drops[0], s.cups[0]);
  await expect(page.locator('#win')).toBeVisible({ timeout: 7000 });
});

test('level 10: two blue drops make a drop no cup wants, and the card says so', async ({ page }) => {
  await startLevel(page, 10);
  const s = await snap(page);
  const blues = s.drops.filter((d) => isBlue(d.pig));
  // go around the other drops: up to the top, across, and down
  await page.mouse.move(blues[0].x, blues[0].y);
  await page.mouse.down();
  const top = 120;
  const path = [{ x: blues[0].x, y: top }, { x: blues[1].x, y: top }, { x: blues[1].x, y: blues[1].y }];
  let from = { x: blues[0].x, y: blues[0].y };
  for (const p of path) {
    for (let i = 1; i <= 30; i++) { await page.mouse.move(from.x + ((p.x - from.x) * i) / 30, from.y + ((p.y - from.y) * i) / 30); await page.waitForTimeout(16); }
    await page.waitForTimeout(400);
    from = p;
  }
  await page.mouse.up();
  await expect(page.locator('#fail')).toBeVisible({ timeout: 4000 });
  await expect(page.locator('#fail-text')).toContainText('כחולות');
});
