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

test('level 22: a drop dragged through the glitter glue gets glitter, and the glitter cup takes it', async ({ page }) => {
  await startLevel(page, 22);
  let s = await snap(page);
  expect(s.drops[0].glitter).toBe(false);
  expect(s.cups[0].glitter).toBe(true);
  await drag(page, s.drops[0], s.cups[0], 60);
  s = await snap(page);
  await expect(page.locator('#win')).toBeVisible({ timeout: 6000 });
});

test('level 23: a plain drop through the glue cannot go to its plain cup, and the card says why', async ({ page }) => {
  await startLevel(page, 23);
  const s = await snap(page);
  const blue = s.drops.find((d) => isBlue(d.pig))!;
  const cup = s.cups.find((c) => !c.glitter)!;
  // straight through the middle of the stripe
  await dragPath(page, [blue, await world(page, 80, 30), cup]);
  await expect(page.locator('#fail')).toBeVisible({ timeout: 4000 });
  await expect(page.locator('#fail-text')).toContainText('נצנצים');
});

test('level 23: going round the end of the glue keeps a drop plain; the hint shows that way', async ({ page }) => {
  await startLevel(page, 23);
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

test('level 19: four green halves can never make lime and turquoise, so the level ends with the try-again card', async ({ page }) => {
  await startLevel(page, 19);
  // the state from the owner's screenshot: the yellow and blue drops are gone, four green halves are left
  await page.evaluate(() => {
    const g = (window as any).__dd;
    const Drop = g.drops[0].constructor;
    g.drops = [0, 1, 2, 3].map((i: number) => { const d = new Drop(40 + i * 25, 40, 1, [0, 0.5, 0.5]); d.still = 1; return d; });
    g.dirty = true;
  });
  await expect(page.locator('#fail')).toBeVisible({ timeout: 4000 });
  await expect(page.locator('#fail-text')).toContainText('ננסה שוב');
});

test('level 16: the hint splits the big red drop first (joining first would be a dead end)', async ({ page }) => {
  await startLevel(page, 16);
  const h = await page.evaluate(() => (window as any).__dd.suggest());
  expect(h.tap2, 'the first hint is a double tap (split)').toBe(true);
});

test('the brown level: any joins are fine, and all the dots make one huge brown drop for the cup', async ({ page }) => {
  await startLevel(page, 21); // the brown level comes right before the glitter
  let s = await snap(page);
  expect(s.cups[0].need).toBe(6);
  // join the dots one by one into the first drop, in any order
  for (let n = 0; n < 12 && s.drops.length > 1; n++) {
    const big = s.drops.reduce((m, d) => (d.vol > m.vol ? d : m));
    const small = s.drops.filter((d) => d !== big).sort((a, b) => Math.hypot(a.x - big.x, a.y - big.y) - Math.hypot(b.x - big.x, b.y - big.y))[0];
    await drag(page, small, big, 30);
    expect(await page.locator('#fail').isVisible(), 'no join is a mistake here').toBe(false);
    s = await snap(page);
  }
  expect(s.drops.length).toBe(1);
  expect(s.drops[0].vol).toBeCloseTo(6, 5);
  await drag(page, s.drops[0], s.cups[0]);
  await expect(page.locator('#win')).toBeVisible({ timeout: 7000 });
});

/** Follow the game's own hints (with their turns) until the level ends. */
async function followHints(page: Page, max = 16) {
  for (let n = 0; n < max; n++) {
    const h = await page.evaluate(() => {
      const g = (window as any).__dd; const h = g.suggest(); if (!h) return null;
      const P = (x: number, y: number) => ({ x: g.ox + x * g.S, y: g.oy + y * g.S });
      const vs = h.via ? (Array.isArray(h.via) ? h.via : [h.via]) : [];
      return [P(h.ax, h.ay), ...vs.map((q: any) => P(q.x, q.y)), P(h.bx, h.by)];
    });
    if (!h) break;
    await dragPath(page, h);
    await page.waitForTimeout(1200);
    if (await page.locator('#fail').isVisible() || await page.locator('#win').isVisible()) break;
  }
}

test('free towel colouring: every drop soaks in, and the level is done', async ({ page }) => {
  await startLevel(page, 30);
  await followHints(page);
  await expect(page.locator('#win')).toBeVisible({ timeout: 8000 });
});

test('the red dot: a drop soaks in as soon as it touches the towel, before it is let go', async ({ page }) => {
  await startLevel(page, 32);
  const s = await snap(page);
  const dot = await page.evaluate(() => { const g = (window as any).__dd, c = g.towel.areaCentre(0); return { x: g.ox + c.x * g.S, y: g.oy + c.y * g.S }; });
  const d = s.drops[0];
  await page.mouse.move(d.x, d.y); await page.mouse.down();
  for (let i = 1; i <= 30; i++) { await page.mouse.move(d.x + ((dot.x - d.x) * i) / 30, d.y + ((dot.y - d.y) * i) / 30); await page.waitForTimeout(16); }
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => (window as any).__dd.drops[0].state), 'soaking while the finger is still down').toBe('soak');
  expect(await page.evaluate(() => (window as any).__dd.placedParts().size), 'the dot\'s guide is gone once a drop is on it').toBe(1);
  await page.mouse.up();
  await expect(page.locator('#win')).toBeVisible({ timeout: 8000 });
});

for (const [n, what] of [[33, 'the sun (a yellow drop on each ray)'], [34, 'the flower (joining yellow and blue for green)'], [35, 'the balloons (orange, green, purple)']] as const) {
  test(`towel picture ${n}: following the hints colours ${what}`, async ({ page }) => {
    await startLevel(page, n);
    await followHints(page);
    await expect(page.locator('#win')).toBeVisible({ timeout: 8000 });
  });
}

test('the towel flower: red on the green stem is a mistake, and the card says where', async ({ page }) => {
  await startLevel(page, 34);
  // the game's own path planner leads the red drop to the stem without touching the petals
  const pts = await page.evaluate(() => {
    const g = (window as any).__dd, t = g.towel;
    const red = g.drops.find((d: any) => d.pig[0] > 0.9);
    const c = t.areaCentre(1);
    const via = g.planPath(red, c.x, c.y, t.cellAt(c.x, c.y));
    const P = (x: number, y: number) => ({ x: g.ox + x * g.S, y: g.oy + y * g.S });
    return [P(red.x, red.y), ...via.map((q: any) => P(q.x, q.y)), P(c.x, c.y)];
  });
  await dragPath(page, pts);
  await expect(page.locator('#fail')).toBeVisible({ timeout: 6000 });
  await expect(page.locator('#fail-text')).toContainText('בגבעול');
  // trying again brings back every guide (the stem's had gone when the red drop soaked in)
  await page.click('#btn-retry');
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => (window as any).__dd.placedParts().size)).toBe(0);
  const guide = await page.evaluate(() => {
    const g = (window as any).__dd, t = g.towel, c = t.partCentre(1, t.parts()[1][0]);
    // the average of a small patch (the towel's quilted dots are grey)
    const b = g.bg.getContext('2d').getImageData(Math.round((g.ox + c.x * g.S) * g.dpr) - 4, Math.round((g.oy + c.y * g.S) * g.dpr) - 4, 9, 9).data;
    const m = [0, 0, 0];
    for (let i = 0; i < b.length; i += 4) for (let k = 0; k < 3; k++) m[k] += b[i + k] / 81;
    return m;
  });
  expect(guide[1] - guide[0], 'the stem is pale green again').toBeGreaterThan(4);
});
