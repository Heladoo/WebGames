import { expect, test } from '@playwright/test';

// The race is simulated (no drawing) hundreds of times with different kinds of players. These are the promises
// of a stress-free race: it always ends in about a minute, a stumble never stops anyone, a lane is always free,
// everyone earns coins, a child who never presses anything still finishes close, and playing well pays off.

interface Report { races: number; winRate: number; avgPlace: number; worstPlace: number; minCoins: number; maxTime: number; minTime: number; maxGap: number; minSpeed: number; obstacles: number; blockedLanes: number }

test('races are fair, close and stress free on every track', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/?debug=sim&n=40');
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true, null, { timeout: 110_000 });
  const rep = await page.evaluate(() => (window as unknown as { __sim: Record<string, Report> }).__sim);
  expect(await page.evaluate(() => (window as unknown as { __det: boolean }).__det), 'deterministic').toBe(true);
  for (const t of ['forest', 'meadow', 'snow', 'canyon', 'garden']) {
    for (const p of ['perfect', 'average', 'idle', 'idleHelp']) {
      const r = rep[`${t}:${p}`];
      const k = `${t}:${p}`;
      expect(r.minTime, `${k} not too short`).toBeGreaterThan(40);
      expect(r.maxTime, `${k} not too long`).toBeLessThan(95);
      expect(r.minSpeed, `${k} a stumble never stops`).toBeGreaterThan(0.5);
      expect(r.blockedLanes, `${k} a lane is always free`).toBe(0);
      expect(r.minCoins, `${k} everyone earns coins`).toBeGreaterThanOrEqual(25);
      expect(r.maxGap, `${k} finishes close to the winner`).toBeLessThan(15);
    }
    const avg = rep[`${t}:average`].winRate;
    expect(avg, `${t}: an average child wins often but not always`).toBeGreaterThanOrEqual(0.35);
    expect(avg, `${t}: an average child wins often but not always`).toBeLessThanOrEqual(0.8);
    expect(rep[`${t}:perfect`].winRate, `${t}: playing well pays off`).toBeGreaterThanOrEqual(avg - 0.05);
    expect(rep[`${t}:idleHelp`].avgPlace, `${t}: help mode helps`).toBeLessThanOrEqual(rep[`${t}:idle`].avgPlace + 0.1);
  }
});
