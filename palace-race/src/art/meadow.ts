// The meadow at the bottom of the home screen, a quiet backdrop in front of the palace's hill: low rolling hills,
// a few tufts of grass, small loose groups of flowers that stand on the ground (each with a stem, leaves and a
// shadow, drawn back to front), two round bushes at the sides and two butterflies. Painted once, seeded, on the
// 1600 x 900 stage; everything above y = 670 is left to the sky and the palace.

import { rng, f1, lg, butterfly } from './paint';
import { mix, shade } from './geom';

type Bloom = 'daisy' | 'tulip' | 'poppy' | 'bell' | 'butter' | 'cosmos';

const PETALS: Record<Bloom, string[]> = {
  daisy: ['#ffffff', '#fff4fa', '#f4f0ff'],
  tulip: ['#ff7aa8', '#ff5a7a', '#ffa94d', '#c9a0ff'],
  poppy: ['#ff5a4a', '#ff7a3a', '#f0467a'],
  bell: ['#8a7ae8', '#6fa4f0', '#b08ae8'],
  butter: ['#ffd93a', '#ffe566'],
  cosmos: ['#ff9ec8', '#ffc2dc', '#e86aa8'],
};

/** A smooth hill: a crest made of a few sines, filled down to the bottom of the stage. */
function hill(y0: number, amp: number, seed: number, top: string, bottom: string, id: string, blur = ''): { svg: string; crest: (x: number) => number } {
  const r = rng(seed);
  const waves = [0, 1, 2].map((i) => ({ a: amp * (0.6 - i * 0.18) * (0.7 + r() * 0.6), f: (1.2 + i * 1.3 + r() * 0.5) * (Math.PI / 1600), p: r() * 6.28 }));
  const crest = (x: number) => y0 + waves.reduce((s, w) => s + Math.sin(x * w.f + w.p) * w.a, 0);
  let d = `M-20 ${f1(crest(-20))}`;
  for (let x = 0; x <= 1620; x += 20) d += `L${x} ${f1(crest(x))}`;
  d += 'V910H-20Z';
  const defs = lg(id, [[0, top], [1, bottom]], 0, 0, 0, 1);
  return { svg: `<defs>${defs}</defs><path d="${d}" fill="url(#${id})"${blur ? ` filter="url(#${blur})"` : ''}/>`, crest };
}

/** Blades of grass leaning this way and that, from a point on the ground. */
function tuft(x: number, y: number, s: number, r: () => number, dark: string, light: string): string {
  let d1 = '';
  let d2 = '';
  const n = 5 + Math.floor(r() * 4);
  for (let i = 0; i < n; i++) {
    const lean = (i - (n - 1) / 2) * 5 * s + (r() - 0.5) * 5 * s;
    const h = (16 + r() * 18) * s;
    const seg = `M${f1(x + (i - n / 2) * 1.6 * s)} ${f1(y)} Q${f1(x + lean * 0.4)} ${f1(y - h * 0.6)} ${f1(x + lean)} ${f1(y - h)} `;
    if (i % 2) d1 += seg;
    else d2 += seg;
  }
  const w = f1(Math.max(1.2, 2.2 * s));
  return `<path d="${d1}" stroke="${dark}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${d2}" stroke="${light}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
}

/** One flower with its base at (x, y) and the given size: a shadow, a stem, two leaves and a bloom. */
function flower(x: number, y: number, s: number, kind: Bloom, petal: string, r: () => number): string {
  const h = (62 + r() * 34) * s;
  const lean = (r() - 0.5) * 0.3 * h;
  const tx = x + lean;
  const ty = y - h;
  const stemD = `M${f1(x)} ${f1(y)} Q${f1(x + lean * 1.4)} ${f1(y - h * 0.5)} ${f1(tx)} ${f1(ty)}`;
  const stemW = f1(Math.max(2, 3.4 * s));
  let g = `<ellipse cx="${f1(x)}" cy="${f1(y + 1)}" rx="${f1(18 * s)}" ry="${f1(5 * s)}" fill="#2f6a2a" opacity=".28"/>`;
  // leaves
  for (const side of [-1, 1]) {
    const ly = y - h * (0.28 + r() * 0.12);
    const lx = x + lean * 0.5;
    const len = (26 + r() * 10) * s;
    g += `<path d="M${f1(lx)} ${f1(ly)} Q${f1(lx + side * len * 0.6)} ${f1(ly - len * 0.7)} ${f1(lx + side * len)} ${f1(ly - len * 0.3)} Q${f1(lx + side * len * 0.5)} ${f1(ly + len * 0.05)} ${f1(lx)} ${f1(ly)}Z" fill="${side < 0 ? '#3f9a4a' : '#56b457'}"/>`;
  }
  g += `<path d="${stemD}" stroke="#3d8f45" stroke-width="${stemW}" fill="none" stroke-linecap="round"/>`;
  g += `<path d="${stemD}" stroke="#7cc65e" stroke-width="${f1(Math.max(0.8, 1.1 * s))}" fill="none" stroke-linecap="round" opacity=".7"/>`;
  const R = 16 * s;
  const dark = shade(petal, -0.2);
  const light = shade(petal, 0.35);
  const at = `translate(${f1(tx)} ${f1(ty)})`;
  if (kind === 'daisy' || kind === 'cosmos') {
    const n = kind === 'daisy' ? 11 : 8;
    let pe = '';
    for (let i = 0; i < n; i++) pe += `<ellipse cx="0" cy="${f1(-R * 0.78)}" rx="${f1(R * (kind === 'daisy' ? 0.26 : 0.4))}" ry="${f1(R * 0.62)}" fill="${petal}" stroke="${dark}" stroke-width="${f1(0.7 * s)}" stroke-opacity=".5" transform="rotate(${f1((360 / n) * i + r() * 10)})"/>`;
    g += `<g transform="${at}">${pe}<circle r="${f1(R * 0.34)}" fill="#ffc83a"/><circle cx="${f1(-R * 0.08)}" cy="${f1(-R * 0.08)}" r="${f1(R * 0.14)}" fill="#fff3a0" opacity=".9"/></g>`;
  } else if (kind === 'tulip') {
    const w = R * 0.9;
    const hh = R * 1.5;
    g += `<g transform="${at}"><path d="M${f1(-w)} ${f1(-hh * 0.9)} Q${f1(-w * 1.1)} ${f1(hh * 0.15)} 0 ${f1(hh * 0.3)} Q${f1(w * 1.1)} ${f1(hh * 0.15)} ${f1(w)} ${f1(-hh * 0.9)} L${f1(w * 0.45)} ${f1(-hh * 0.45)} L0 ${f1(-hh)} L${f1(-w * 0.45)} ${f1(-hh * 0.45)}Z" fill="${petal}" stroke="${dark}" stroke-width="${f1(0.9 * s)}" stroke-opacity=".55"/><path d="M${f1(-w * 0.45)} ${f1(-hh * 0.45)} Q${f1(-w * 0.2)} ${f1(hh * 0.1)} 0 ${f1(hh * 0.28)}" stroke="${light}" stroke-width="${f1(2.2 * s)}" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
  } else if (kind === 'poppy') {
    let pe = '';
    for (let i = 0; i < 5; i++) pe += `<ellipse cx="0" cy="${f1(-R * 0.6)}" rx="${f1(R * 0.62)}" ry="${f1(R * 0.7)}" fill="${i % 2 ? petal : shade(petal, 0.12)}" stroke="${dark}" stroke-width="${f1(0.8 * s)}" stroke-opacity=".5" transform="rotate(${f1(72 * i + 10)})"/>`;
    g += `<g transform="${at}">${pe}<circle r="${f1(R * 0.26)}" fill="#3a2440"/><circle cx="${f1(-R * 0.08)}" cy="${f1(-R * 0.08)}" r="${f1(R * 0.08)}" fill="#fff" opacity=".6"/></g>`;
  } else if (kind === 'bell') {
    // a spike of little bells climbing the top of the stem
    let pe = '';
    for (let i = 0; i < 6; i++) {
      const yy = -i * R * 0.5;
      const sz = R * (0.46 - i * 0.05);
      pe += `<circle cx="${f1(-sz * 0.7 * (i % 2 ? 1 : -1))}" cy="${f1(yy + R * 0.4)}" r="${f1(sz)}" fill="${i % 2 ? petal : light}" stroke="${dark}" stroke-width="${f1(0.7 * s)}" stroke-opacity=".5"/>`;
    }
    g += `<g transform="${at}">${pe}</g>`;
  } else {
    let pe = '';
    for (let i = 0; i < 5; i++) pe += `<circle cx="0" cy="${f1(-R * 0.5)}" r="${f1(R * 0.46)}" fill="${petal}" stroke="${dark}" stroke-width="${f1(0.7 * s)}" stroke-opacity=".5" transform="rotate(${72 * i})"/>`;
    g += `<g transform="${at}">${pe}<circle r="${f1(R * 0.3)}" fill="#ffb02e"/></g>`;
  }
  return g;
}

/** A round bush covered in blossoms, to frame the meadow at the sides. */
function bush(x: number, y: number, s: number, r: () => number, bloom: string, blossoms = 16): string {
  let g = `<ellipse cx="${f1(x)}" cy="${f1(y + 4 * s)}" rx="${f1(120 * s)}" ry="${f1(16 * s)}" fill="#2f6a2a" opacity=".3"/>`;
  const blobs = [[-70, -26, 52], [-26, -50, 60], [30, -46, 58], [74, -22, 50], [0, -22, 66], [-46, -8, 46], [48, -6, 46]];
  for (const [dx, dy, rr] of blobs) g += `<circle cx="${f1(x + dx * s)}" cy="${f1(y + dy * s)}" r="${f1(rr * s)}" fill="${mix('#3f9a4a', '#2f7a3a', r() * 0.6)}"/>`;
  for (const [dx, dy, rr] of blobs) g += `<ellipse cx="${f1(x + (dx - rr * 0.2) * s)}" cy="${f1(y + (dy - rr * 0.35) * s)}" rx="${f1(rr * 0.6 * s)}" ry="${f1(rr * 0.4 * s)}" fill="#7cc65e" opacity=".55"/>`;
  for (let i = 0; i < blossoms; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * 70 * s;
    const bx = x + Math.cos(a) * d * 1.3;
    const by = y - 30 * s + Math.sin(a) * d * 0.7;
    g += `<g transform="translate(${f1(bx)} ${f1(by)})">${[0, 1, 2, 3, 4].map((k) => `<circle cx="0" cy="${f1(-5 * s)}" r="${f1(4.6 * s)}" fill="${bloom}" transform="rotate(${72 * k})"/>`).join('')}<circle r="${f1(3 * s)}" fill="#ffe27a"/></g>`;
  }
  return g;
}

export function meadow(): string {
  const r = rng(2025);
  // low, quiet hills in front of the palace's own hill, in nearly the same greens
  const base = hill(662, 8, 3, '#76c357', '#62b24e', 'mfar');
  const h1 = hill(712, 22, 5, '#6ebd52', '#5aa94a', 'mh1');
  const h2 = hill(786, 22, 8, '#5aa94a', '#4c9d45', 'mh2');
  const h3 = hill(850, 16, 13, '#4c9d45', '#41933f', 'mh3');
  let s = base.svg + h1.svg + h2.svg + h3.svg;
  // a soft light on the crests
  for (const h of [h1, h2]) {
    let d = `M0 ${f1(h.crest(0) + 3)}`;
    for (let x = 20; x <= 1600; x += 20) d += `L${x} ${f1(h.crest(x) + 3)}`;
    s += `<path d="${d}" stroke="#c8ee98" stroke-width="3" fill="none" opacity=".4" stroke-linecap="round"/>`;
  }
  // a few small tufts of grass
  for (let i = 0; i < 40; i++) {
    const x = r() * 1600;
    const y = 730 + r() * 160;
    s += tuft(x, y, 0.5 + ((y - 720) / 180) * 0.5, r, '#468f40', '#86c860');
  }
  // sparse, small flowers in a few loose groups, drawn back to front
  const kinds: Bloom[] = ['daisy', 'tulip', 'poppy', 'cosmos', 'butter'];
  const list: { x: number; y: number; k: Bloom; c: string }[] = [];
  const patches = 8;
  for (let p = 0; p < patches; p++) {
    const cx = 110 + ((p + 0.2 + r() * 0.6) / patches) * 1380;
    const cy = 760 + r() * 100;
    const main = kinds[Math.floor(r() * kinds.length)];
    const n = 3 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const x = cx + (r() - 0.5) * 190;
      const y = Math.max(h1.crest(x) + 24, Math.min(886, cy + (r() - 0.5) * 70));
      const k = r() < 0.75 ? main : kinds[Math.floor(r() * kinds.length)];
      list.push({ x, y, k, c: PETALS[k][Math.floor(r() * PETALS[k].length)] });
    }
  }
  list.sort((a, b) => a.y - b.y);
  for (const fl of list) {
    const sc = 0.46 + ((fl.y - 730) / 160) * 0.34;
    s += flower(fl.x, fl.y, sc, fl.k, fl.c, r);
  }
  // two plain round bushes frame the sides, with only a few blossoms
  s += bush(60, 800, 0.9, r, '#ff9ec8', 6) + bush(1550, 810, 0.95, r, '#fff4fa', 6);
  // two small butterflies
  s += butterfly(520, 740, 0.7, -18, '#ffb0d8', '#e8609c', 'mbf1') + butterfly(1130, 770, 0.8, 14, '#ffe27a', '#f0a030', 'mbf2');
  return s;
}
