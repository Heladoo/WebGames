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
      // a towel picture: its areas' paint; free colouring wants whatever there is
      for (const a of g.towel?.areas ?? []) {
        const p = PIG[a.color], s = p[0] + p[1] + p[2];
        p.forEach((v: number, k: number) => (want[k] += (v / s) * a.need));
      }
      if (l.towel && !l.towel.picture) have.forEach((v: number, k: number) => (want[k] = v));
      // drops start off the towel
      const onTowel = l.towel ? g.drops.some((d: any) => d.x + d.R > l.towel.x0 && d.y + d.R > l.towel.y0) : false;
      let closest = Infinity;
      for (const a of g.drops) for (const b of g.drops) if (a !== b) closest = Math.min(closest, Math.hypot(a.x - b.x, a.y - b.y) - a.R - b.R);
      const lowest = Math.max(...g.drops.map((d: any) => d.y + d.R));
      // no drop starts on a glue stripe
      let onGlue = false;
      for (const q of l.glue ?? []) for (const d of g.drops) {
        const dx = q.x1 - q.x0, dy = q.y1 - q.y0;
        const t = Math.max(0, Math.min(1, ((d.x - q.x0) * dx + (d.y - q.y0) * dy) / (dx * dx + dy * dy)));
        if (Math.hypot(d.x - q.x0 - dx * t, d.y - q.y0 - dy * t) < (q.w ?? 7) / 2 + d.R + 2) onGlue = true;
      }
      g.dirty = true; g.think();
      return { id: l.id, have, want, closest, lowest, onGlue, onTowel, cupTop: g.cups[0]?.top ?? 999, hint: !!g.suggest(), solvable: g.answer?.solvable ?? 'yes', free: !!l.free };
    });
  });
  for (const r of report) {
    r.have.forEach((v: number, k: number) => expect(v, `${r.id}: paint ${k}`).toBeCloseTo(r.want[k], 5));
    expect(r.closest, `${r.id}: drops start apart`).toBeGreaterThan(5);
    expect(r.lowest, `${r.id}: drops start above the cups`).toBeLessThan(r.cupTop - 5);
    expect(r.hint, `${r.id}: the hint has a first move`).toBe(true);
    expect(r.onGlue, `${r.id}: no drop starts on glue`).toBe(false);
    expect(r.solvable, `${r.id}: the solver finds a way`).toBe('yes');
    expect(r.onTowel, `${r.id}: drops start off the towel`).toBe(false);
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
