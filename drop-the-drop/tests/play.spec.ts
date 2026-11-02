import { expect, test, type Page } from '@playwright/test';

// Real pointer drags on the canvas. Positions come from the ?debug=state hook
// (window.__dd); a test may first move drops apart so its path is clear.

type Snap = {
  over: boolean;
  drops: { id: number; x: number; y: number; r: number; vol: number; pig: number[]; state: string }[];
  cups: { x: number; y: number; filled: boolean; need: number; pig: number[] }[];
};

const snap = (page: Page) => page.evaluate(() => (window as any).__dd.snapshot() as Snap);

async function startLevel(page: Page) {
  await page.setViewportSize({ width: 1180, height: 820 });
  await page.goto('/?debug=state');
  await page.click('#btn-play');
  await page.waitForTimeout(1800); // drops drip in
}

/** Put the red drops in a left column and the blue ones in a right column. */
async function sortDrops(page: Page) {
  await page.evaluate(() => {
    const g = (window as any).__dd;
    let r = 0, b = 0;
    for (const d of g.drops) {
      if (d.pig[0] > 0) { d.x = g.W * 0.2; d.y = 25 + r++ * 14; } else { d.x = g.W * 0.8; d.y = 25 + b++ * 14; }
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
  await page.waitForTimeout(400);
}

const isRed = (p: number[]) => p[0] > 0 && p[2] === 0;
const isBlue = (p: number[]) => p[2] > 0 && p[0] === 0;

test('joining three drops of a colour and taking them to their cup wins the level', async ({ page }) => {
  await startLevel(page);
  await sortDrops(page);
  for (const [want, cupIndex] of [[isRed, 0], [isBlue, 1]] as const) {
    // join: drag the others onto the first
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
  await expect(page.locator('#win')).toBeVisible({ timeout: 4000 });
  await page.click('#btn-again');
  expect((await snap(page)).drops.length).toBe(6);
});

test('a small drop is refused by the cup and stays on the paper', async ({ page }) => {
  await startLevel(page);
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

test('touching another colour mixes the drops and explains why the level stopped', async ({ page }) => {
  await startLevel(page);
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
