import { expect, test } from '@playwright/test';

// Every level can be finished: the drops hold exactly the paint the cups want,
// no two drops start touching, and the hint knows a first move.

test('every level is solvable and starts tidy', async ({ page }) => {
  await page.setViewportSize({ width: 1180, height: 820 });
  await page.goto('/?debug=state');
  const report = await page.evaluate(async () => {
    const { LEVELS } = await import('/src/levels.ts');
    const { PIG } = await import('/src/color.ts');
    const g = (window as any).__dd;
    return LEVELS.map((l: any) => {
      g.start(l, false);
      const have = [0, 0, 0], want = [0, 0, 0];
      for (const d of g.drops) d.pig.forEach((v: number, k: number) => (have[k] += v));
      for (const c of l.cups) {
        const p = PIG[c.color], s = p[0] + p[1] + p[2], tot = c.total ?? c.need;
        p.forEach((v: number, k: number) => (want[k] += (v / s) * tot));
      }
      let closest = Infinity;
      for (const a of g.drops) for (const b of g.drops) if (a !== b) closest = Math.min(closest, Math.hypot(a.x - b.x, a.y - b.y) - a.R - b.R);
      const lowest = Math.max(...g.drops.map((d: any) => d.y + d.R));
      return { id: l.id, have, want, closest, lowest, cupTop: g.cups[0].top, hint: !!g.suggest() };
    });
  });
  for (const r of report) {
    r.have.forEach((v: number, k: number) => expect(v, `${r.id}: paint ${k}`).toBeCloseTo(r.want[k], 5));
    expect(r.closest, `${r.id}: drops start apart`).toBeGreaterThan(5);
    expect(r.lowest, `${r.id}: drops start above the cups`).toBeLessThan(r.cupTop - 5);
    expect(r.hint, `${r.id}: the hint has a first move`).toBe(true);
  }
});

test('every colour a child can mix has a name, and blue + green is turquoise', async ({ page }) => {
  await page.goto('/?debug=state');
  const names = await page.evaluate(async () => {
    const { colorName, COLOR_HE } = await import('/src/color.ts');
    const mixes: [number, number, number][] = [];
    for (let r = 0; r <= 3; r++) for (let y = 0; y <= 3; y++) for (let b = 0; b <= 3; b++) if (r + y + b) mixes.push([r, y, b]);
    return {
      all: mixes.map((p) => COLOR_HE[colorName(p)]),
      turquoise: colorName([0, 1, 2]),
      red: colorName([1, 0, 0]), green: colorName([0, 1, 1]), brown: colorName([1, 1, 1]),
    };
  });
  for (const n of names.all) expect(n, 'a Hebrew name').toBeTruthy();
  expect(names.turquoise).toBe('turquoise');
  expect([names.red, names.green, names.brown]).toEqual(['red', 'green', 'brown']);
});
