import { expect, test, type Page } from '@playwright/test';

// Real pointer drags on the canvas. Positions come from the ?debug=state hook
// (window.__dd); a test may first move drops so its path is clear.

type Snap = {
  over: boolean; won: boolean;
  drops: { id: number; x: number; y: number; r: number; vol: number; pig: number[]; state: string; glitter: boolean }[];
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
  // the levels screen is one way on; "next" is the other
  await page.click('#btn-win-levels');
  await expect(page.locator('.level-tile.done')).toHaveCount(1);
  await page.click('#btn-pick-back');
  await page.click('#btn-play');
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

test('level 12: blue and red make purple, which no cup wants, and the card says so', async ({ page }) => {
  await startLevel(page, 12);
  const s = await snap(page);
  const blue = s.drops.filter((d) => isBlue(d.pig)).sort((a, b) => a.x - b.x)[0];
  const red = s.drops.find((d) => isRed(d.pig))!;
  await drag(page, blue, red, 60);
  await expect(page.locator('#fail')).toBeVisible({ timeout: 4000 });
  await expect(page.locator('#fail-text')).toContainText('סגולה');
});

test('level 15: a double tap splits a big drop in two, and each half fills a cup', async ({ page }) => {
  await startLevel(page, 15);
  let s = await snap(page);
  expect(s.drops.map((d) => d.vol)).toEqual([2]);
  await page.mouse.dblclick(s.drops[0].x, s.drops[0].y);
  await page.waitForTimeout(900);
  s = await snap(page);
  expect(s.drops.map((d) => d.vol)).toEqual([1, 1]);
  expect(s.drops.every((d) => d.state === 'rest')).toBe(true);
  const [a, b] = s.drops.sort((p, q) => p.x - q.x);
  expect(Math.hypot(a.x - b.x, a.y - b.y), 'the halves end apart').toBeGreaterThan(a.r + b.r);
  const cups = s.cups.slice().sort((p, q) => p.x - q.x);
  await drag(page, a, cups[0]);
  await drag(page, b, cups[1]);
  await expect(page.locator('#win')).toBeVisible({ timeout: 6000 });
});

test('a small drop does not split', async ({ page }) => {
  await startLevel(page, 1);
  const d = (await snap(page)).drops[0];
  await page.mouse.dblclick(d.x, d.y);
  await page.waitForTimeout(600);
  expect((await snap(page)).drops.map((x) => x.vol)).toEqual([1]);
});

test('level 13: blue, yellow and blue make turquoise for the turquoise cup', async ({ page }) => {
  await startLevel(page, 13);
  let s = await snap(page);
  const blues = s.drops.filter((d) => isBlue(d.pig)).sort((a, b) => a.x - b.x);
  const yellow = s.drops.find((d) => isYellow(d.pig))!;
  await drag(page, blues[0], yellow, 60);
  s = await snap(page);
  const green = s.drops.find((d) => d.vol === 2)!;
  await drag(page, blues[1], green, 60);
  s = await snap(page);
  expect(s.drops.length).toBe(1);
  expect(s.drops[0].pig).toEqual([0, 1, 2]);
  await drag(page, s.drops[0], s.cups[0]);
  await expect(page.locator('#win')).toBeVisible({ timeout: 7000 });
});

test('a dead end (no useful move left) ends the level gently with a card', async ({ page }) => {
  await startLevel(page, 1);
  await page.evaluate(() => {
    const g = (window as any).__dd;
    g.start({ id: 'dead', mixing: true, cups: [{ color: 'red', need: 1 }], drops: [{ color: 'blue', x: 80, y: 30 }] }, false);
  });
  await expect(page.locator('#fail')).toBeVisible({ timeout: 4000 });
  await expect(page.locator('#fail-text')).toContainText('ננסה שוב');
});

test('a fast finger pulls the drop along fast', async ({ page }) => {
  await startLevel(page, 1);
  const s = await snap(page);
  const d = s.drops[0];
  const to = { x: d.x + 500, y: d.y + 40 };
  await page.mouse.move(d.x, d.y);
  await page.mouse.down();
  for (let i = 1; i <= 5; i++) await page.mouse.move(d.x + ((to.x - d.x) * i) / 5, d.y + ((to.y - d.y) * i) / 5);
  await page.waitForTimeout(300);
  const now = (await snap(page)).drops[0];
  await page.mouse.up();
  // the old calm limit would have covered only about half of this in the same time
  expect(Math.hypot(now.x - d.x, now.y - d.y)).toBeGreaterThan(0.75 * Math.hypot(to.x - d.x, to.y - d.y));
});

/** Drag along several points (world units are turned into screen points by the page). */
async function dragPath(page: Page, pts: { x: number; y: number }[]) {
  await page.mouse.move(pts[0].x, pts[0].y);
  await page.mouse.down();
  for (let k = 1; k < pts.length; k++) {
    const a = pts[k - 1], b = pts[k];
    for (let i = 1; i <= 30; i++) { await page.mouse.move(a.x + ((b.x - a.x) * i) / 30, a.y + ((b.y - a.y) * i) / 30); await page.waitForTimeout(16); }
    await page.waitForTimeout(350);
  }
  await page.mouse.up();
  await page.waitForTimeout(500);
}
const world = (page: Page, x: number, y: number) => page.evaluate(([x, y]) => {
  const g = (window as any).__dd;
  return { x: g.ox + x * g.S, y: g.oy + y * g.S };
}, [x, y]);

test('level 21: a drop dragged through the glitter glue gets glitter, and the glitter cup takes it', async ({ page }) => {
  await startLevel(page, 21);
  let s = await snap(page);
  expect(s.drops[0].glitter).toBe(false);
  expect(s.cups[0].glitter).toBe(true);
  await drag(page, s.drops[0], s.cups[0], 60);
  s = await snap(page);
  await expect(page.locator('#win')).toBeVisible({ timeout: 6000 });
});

test('level 22: a plain drop through the glue cannot go to its plain cup, and the card says why', async ({ page }) => {
  await startLevel(page, 22);
  const s = await snap(page);
  const blue = s.drops.find((d) => isBlue(d.pig))!;
  const cup = s.cups.find((c) => !c.glitter)!;
  // straight through the middle of the stripe
  await dragPath(page, [blue, await world(page, 80, 30), cup]);
  await expect(page.locator('#fail')).toBeVisible({ timeout: 4000 });
  await expect(page.locator('#fail-text')).toContainText('נצנצים');
});

test('level 22: going round the end of the glue keeps a drop plain; the hint shows that way', async ({ page }) => {
  await startLevel(page, 22);
  // lift the blue drop so the straight way to its cup would cross the glue
  await page.evaluate(() => { const g = (window as any).__dd; const b = g.drops.find((d: any) => d.pig[2] > 0); b.x = 58; b.y = 14; });
  await page.waitForTimeout(100);
  const via = await page.evaluate(() => (window as any).__dd.suggest()?.via);
  expect(via, 'the hint goes round the glue').toBeTruthy();
  const s = await snap(page);
  const blue = s.drops.find((d) => isBlue(d.pig))!;
  const cup = s.cups.find((c) => !c.glitter)!;
  await dragPath(page, [blue, await world(page, 58, 62), await world(page, 125, 62), cup]);
  await page.waitForTimeout(900);
  const after = await snap(page);
  expect(after.cups.find((c) => !c.glitter)!.filled).toBe(true);
});
