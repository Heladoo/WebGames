import { expect, test } from '@playwright/test';

// Small friends hold hand-me-downs. A held balloon once floated over the
// monkey's face: no held thing (or kite/balloon) may cover a friend's eyes,
// and a hat must sit on the head (above the eyes).

test('small friends hold things without covering their eyes', async ({ page }) => {
  await page.goto('/?debug=words');
  const bad = await page.evaluate(async () => {
    const fr = await import('/src/art/friends.ts');
    const out: string[] = [];
    for (const f of fr.SMALL_FRIENDS) {
      for (const hold of ['balloon', 'kite', 'shoes', 'ball', 'violin', 'bag']) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('width', '400');
        svg.setAttribute('height', '400');
        svg.setAttribute('style', 'position:fixed;left:0;top:0;z-index:99;background:#fff');
        svg.innerHTML = fr.friendArt(f, { worn: { head: 'hat' }, hold });
        document.body.appendChild(svg);
        const eyes = [...svg.querySelectorAll('[data-part="eye"]')].map((e) => e.getBoundingClientRect());
        const item = svg.querySelector(`[data-item="${hold}"]`)!.getBoundingClientRect();
        const hat = svg.querySelector('[data-item="hat"]')!.getBoundingClientRect();
        // the drawing, not its (larger) box: sample the eye centres against the item's shapes
        for (const e of eyes) {
          const x = e.left + e.width / 2, y = e.top + e.height / 2;
          const points = [[x, y], [e.left + 1, y], [e.right - 1, y], [x, e.top + 1], [x, e.bottom - 1]];
          if (points.some(([px, py]) => document.elementFromPoint(px, py)?.closest(`[data-item="${hold}"]`))) out.push(`${f}: the ${hold} covers an eye`);
          if (hat.bottom > e.top + e.height * 0.5 && hat.left < x && hat.right > x && hat.top > e.top) out.push(`${f}: the hat sits below the eyes`);
        }
        if (item.width < 4) out.push(`${f}: the ${hold} is not drawn`);
        svg.remove();
      }
    }
    return out;
  });
  expect(bad, bad.join('\n')).toEqual([]);
});
