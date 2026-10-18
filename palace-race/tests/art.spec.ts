import { expect, test, type Page } from '@playwright/test';

// The art is drawn in code, so these tests check the rules that keep it right: animals stand on the ground, riders
// sit in their saddles, ducking really fits under overhead obstacles, jumps clear the low ones, scenery tiles have
// no seams and paint quickly with plenty of detail, and every button has a picture.

async function open(page: Page, q: string) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(q);
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true, null, { timeout: 45_000 });
  expect(errors).toEqual([]);
}

interface Runner { eyeR: number; seat: { x: number; y: number }; top: number; ground: number; nose: number; runnerTop: number; riderHead: { x: number; y: number }; rein: { x: number; y: number } }
interface Rig { runners: Record<string, Runner>; obstacles: Record<string, { act: string; w: number; top: number; bottom: number }>; DUCK_GAP: number; JUMP_PEAK: number; kidEye: number; draw: number; farLane: number }

test.describe('rigs', () => {
  let rig: Rig;
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await open(page, '/?debug=rig');
    rig = await page.evaluate(() => (window as unknown as { __rig: Rig }).__rig);
    await page.close();
  });

  test('every animal stands on the ground except when jumping', () => {
    for (const [k, r] of Object.entries(rig.runners)) {
      if (k.endsWith(':jump')) expect(r.ground, k).toBeLessThan(-40);
      else expect(r.ground, k).toBeGreaterThanOrEqual(-8);
    }
  });

  test('the rider sits on the back, between the tail and the head, below the head of the animal', () => {
    for (const [k, r] of Object.entries(rig.runners)) {
      expect(r.seat.y, k).toBeLessThan(-100);
      expect(r.seat.x, k).toBeLessThan(r.nose);
      expect(r.riderHead.y, k).toBeLessThan(r.seat.y);
      expect(r.rein.x, k).toBeGreaterThan(r.seat.x);
    }
  });

  test('ducking fits under every overhead obstacle, and running upright does not', () => {
    for (const [k, r] of Object.entries(rig.runners)) {
      if (k.endsWith(':duck')) expect(-r.runnerTop, k).toBeLessThan(rig.DUCK_GAP - 10);
      if (k.includes(':run')) expect(-r.runnerTop, k).toBeGreaterThan(rig.DUCK_GAP + 10);
    }
    for (const [k, o] of Object.entries(rig.obstacles)) if (o.act === 'duck') expect(-o.bottom, k).toBeGreaterThanOrEqual(rig.DUCK_GAP - 30);
  });

  test('faces stay clear at game size: every eye is at least 4 px even in the far lane of a 1280 x 720 screen', () => {
    // the 1600 x 900 stage is shown at 0.8 on a 1280 x 720 screen
    const px = (r: number) => r * rig.draw * rig.farLane * 0.8;
    for (const [k, r] of Object.entries(rig.runners)) expect(px(r.eyeR), k).toBeGreaterThanOrEqual(4);
    expect(px(rig.kidEye), 'children').toBeGreaterThanOrEqual(4);
  });

  test('every jump obstacle is lower than the top of a jump', () => {
    for (const [k, o] of Object.entries(rig.obstacles)) if (o.act === 'jump') expect(-o.top, k).toBeLessThan(rig.JUMP_PEAK - 10);
  });

  test('every track has at least one obstacle to jump over and one to duck under', () => {
    for (const t of ['forest', 'meadow', 'snow', 'canyon', 'garden']) {
      const acts = Object.entries(rig.obstacles).filter(([k]) => k.startsWith(t + ':')).map(([, o]) => o.act);
      expect(acts, t).toContain('jump');
      expect(acts, t).toContain('duck');
    }
  });
});

test('scenery tiles repeat without a seam, paint quickly and have detail', async ({ page }) => {
  test.setTimeout(120_000);
  await open(page, '/?debug=seams');
  const seams = await page.evaluate(() => (window as unknown as { __seams: Record<string, { seam: number; ms: number; colors: number }> }).__seams);
  for (const [k, v] of Object.entries(seams)) {
    if (!k.endsWith(':sky')) expect(v.seam, `${k} seam`).toBeLessThan(40);
    expect(v.ms, `${k} paint time`).toBeLessThan(4000);
    // a blank or flat paint has only a handful of colours; snowy layers are pale but still far above this
    expect(v.colors, `${k} detail`).toBeGreaterThan(20);
  }
});

test('every art sheet renders without errors', async ({ page }) => {
  test.setTimeout(120_000);
  for (const q of ['animals&scale=0.2', 'riders&scale=0.3', 'hair&scale=0.4', 'wardrobe&scale=0.3', 'obstacles&scale=0.3', 'podium&scale=0.4', 'podium&scale=0.4&frame=1', 'palace', 'icons', 'mock']) await open(page, `/?debug=${q}`);
});

test('the music renders in every mood, without clipping or silence', async ({ page }) => {
  test.setTimeout(120_000);
  await open(page, '/?debug=music&s=6');
  const m = await page.evaluate(() => (window as unknown as { __music: Record<string, { peak: number; rms: number }> }).__music);
  expect(Object.keys(m).length).toBe(6);
  for (const [k, v] of Object.entries(m)) {
    expect(v.peak, `${k} never clips`).toBeLessThan(0.9);
    expect(v.rms, `${k} is audible`).toBeGreaterThan(0.01);
  }
});

test('every button shows its label as a tooltip on hover', async ({ page }) => {
  await open(page, '/?screen=map');
  const shop = page.locator('[data-tb="shop"]');
  await shop.hover();
  await expect(page.locator('.tip.show')).toHaveText('חנות');
  await page.locator('.track-card[data-t="meadow"]').hover();
  await expect(page.locator('.tip.show')).toContainText('מדליות');
});

test('every button has a picture and a label, so children who cannot read can use it', async ({ page }) => {
  for (const q of ['/?debug=mock', '/', '/?screen=map', '/?screen=animal', '/?screen=kid', '/?screen=shop', '/?debug=race']) {
    await page.goto(q);
    await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true, null, { timeout: 45_000 });
    if (q.includes('race')) await page.waitForFunction(() => (window as unknown as { game?: { started: boolean } }).game?.started, null, { timeout: 45_000 });
    const buttons = await page.locator('button').evaluateAll((bs) => bs.map((b) => ({ icon: !!b.querySelector('svg.icon'), label: b.getAttribute('aria-label') ?? '' })));
    expect(buttons.length).toBeGreaterThan(0);
    for (const b of buttons) {
      expect(b.icon).toBe(true);
      expect(b.label.length).toBeGreaterThan(1);
    }
  }
});

for (const size of [{ width: 844, height: 390 }, { width: 1024, height: 768 }, { width: 390, height: 844 }]) for (const q of ['/?debug=mock', '/?debug=race']) {
  test(`HUD and touch buttons stay on screen and apart at ${size.width}x${size.height} (${q})`, async ({ page }) => {
    await page.setViewportSize(size);
    await open(page, q);
    if (q.includes('race')) await page.waitForFunction(() => (window as unknown as { game?: { started: boolean } }).game?.started, null, { timeout: 45_000 });
    const boxes = await page.locator('.hud button, .place, .pill, .speed .bar').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON() as DOMRect));
    for (const b of boxes) {
      expect(b.left).toBeGreaterThanOrEqual(0);
      expect(b.top).toBeGreaterThanOrEqual(0);
      expect(b.right).toBeLessThanOrEqual(size.width + 0.5);
      expect(b.bottom).toBeLessThanOrEqual(size.height + 0.5);
    }
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        const overlap = a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
        expect(overlap, `${JSON.stringify(a)} vs ${JSON.stringify(b)}`).toBe(false);
      }
  });
}

for (const size of [{ width: 844, height: 390 }, { width: 1024, height: 768 }, { width: 390, height: 844 }]) {
  test(`the title logo and Play button fit on screen at ${size.width}x${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await open(page, '/');
    const [logo, play] = await page.locator('.title-box .logo, #btn-play').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON() as DOMRect));
    for (const b of [logo, play]) {
      expect(b.top).toBeGreaterThanOrEqual(0);
      expect(b.left).toBeGreaterThanOrEqual(0);
      expect(b.bottom).toBeLessThanOrEqual(size.height + 0.5);
      expect(b.right).toBeLessThanOrEqual(size.width + 0.5);
    }
    expect(logo.bottom).toBeLessThanOrEqual(play.top);
    expect(logo.width).toBeGreaterThan(200);
  });
}
