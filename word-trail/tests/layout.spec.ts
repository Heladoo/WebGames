import { expect, test, type Page } from '@playwright/test';
import { ALL_WORDS } from '../src/content';

// The learning panel must fit every word on small phones and tablets: the big
// word stays on one line, slots and bubbles stay inside the panel, and on wide
// screens the panel leaves the hero and the top buttons uncovered.
// (A 7-letter RAINBOW once wrapped as "RAINB / OW" on a phone.)

const SIZES = {
  'small phone': { width: 360, height: 640 },
  phone: { width: 390, height: 844 },
  tablet: { width: 1180, height: 820 },
  'phone landscape': { width: 844, height: 390 },
};

const longest = [...ALL_WORDS].sort((a, b) => b.length - a.length).slice(0, 4);
const words = [...longest, 'cat'];

type Box = { x: number; y: number; w: number; h: number };
const inside = (a: Box, b: Box, slack = 1) =>
  a.x >= b.x - slack && a.y >= b.y - slack && a.x + a.w <= b.x + b.w + slack && a.y + a.h <= b.y + b.h + slack;
const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

async function measure(page: Page) {
  return page.evaluate(() => {
    const box = (e: Element | null) => {
      if (!e) return null;
      const r = e.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    };
    const word = document.querySelector('.big-word') as HTMLElement;
    return {
      view: { x: 0, y: 0, w: innerWidth, h: innerHeight },
      panel: box(document.querySelector('.panel'))!,
      word: box(word)!,
      wordLines: word.getBoundingClientRect().height / parseFloat(getComputedStyle(word).fontSize),
      wordOverflow: word.scrollWidth - word.clientWidth,
      parts: [...document.querySelectorAll('.slot, .bubble, .trace-svg, .big-pic')].map((e) => ({ cls: e.getAttribute('class'), ...box(e)! })),
      hero: box(document.querySelector('#scene .walker')),
      topbar: box(document.querySelector('#topbar')),
    };
  });
}

for (const [name, viewport] of Object.entries(SIZES)) {
  for (const mode of ['tap', 'trace'] as const) {
    test(`${name}: ${mode} panel fits ${words.join(', ')}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      for (const word of words) {
        await page.goto(`/?debug=learn&word=${word}&mode=${mode}&level=3&hero=dog`);
        await page.waitForSelector('.panel.learn');
        await page.waitForTimeout(500); // the panel's entrance animation
        const m = await measure(page);
        const what = `${name}, ${mode}, ${word.toUpperCase()}`;
        expect(m.wordLines, `${what}: the big word must stay on one line`).toBeLessThan(1.6);
        expect(m.wordOverflow, `${what}: the big word must not overflow`).toBeLessThanOrEqual(1);
        expect(inside(m.word, m.panel), `${what}: the big word must be inside the panel`).toBe(true);
        for (const p of m.parts) expect(inside(p, m.panel), `${what}: .${p.cls} must be inside the panel`).toBe(true);
        expect(m.panel.y + m.panel.h, `${what}: the panel must fit on screen`).toBeLessThanOrEqual(m.view.h + 1);
        if (viewport.width / viewport.height >= 4 / 3 && viewport.width >= 1000) {
          expect(overlaps(m.panel, m.hero!), `${what}: the panel must not cover the hero`).toBe(false);
          expect(overlaps(m.panel, m.topbar!), `${what}: the panel must not cover the top buttons`).toBe(false);
        }
      }
    });
  }
}
