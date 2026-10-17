// A small painter's toolkit for the scenery. Scenes are painted once into a picture (see scene.ts), so these
// helpers are free to use hundreds of shapes and SVG filters. Everything is seeded: a scene looks the same
// every time it is drawn.

export function rng(seed: number): () => number {
  let s = (seed >>> 0) || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

export const f1 = (n: number) => n.toFixed(1);

export const lg = (id: string, stops: [number, string, number?][], x1 = 0, y1 = 0, x2 = 0, y2 = 1, user = false) =>
  `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${user ? ' gradientUnits="userSpaceOnUse"' : ''}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('')}</linearGradient>`;

export const rg = (id: string, stops: [number, string, number?][], cx = 0.5, cy = 0.5, r = 0.5, user = false) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${user ? ' gradientUnits="userSpaceOnUse"' : ''}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('')}</radialGradient>`;

/** Filters every scene can use. `fluff` gives clouds and snow soft, irregular edges; `grain*` are paper-like textures. */
export const FX =
  [1, 2, 3, 5, 8, 14].map((n) => `<filter id="b${n}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${n}"/></filter>`).join('') +
  `<filter id="fluff" x="-15%" y="-30%" width="130%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".02 .03" numOctaves="3" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="10" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation=".8"/></filter>` +
  `<filter id="grainSand" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="8"/><feColorMatrix values="0 0 0 0 .55  0 0 0 0 .38  0 0 0 0 .2  1.2 0 0 0 -.42"/></filter>` +
  `<filter id="grainWhite" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="5"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1.4 0 0 0 -.62"/></filter>` +
  `<filter id="grainDark" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="11"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 .1  1.2 0 0 0 -.5"/></filter>` +
  `<filter id="bark" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".06 .5" numOctaves="3" seed="2"/><feColorMatrix values="0 0 0 0 .1  0 0 0 0 .05  0 0 0 0 0  1.5 0 0 0 -.62"/></filter>` +
  `<filter id="wood" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".012 .32" numOctaves="3" seed="6"/><feColorMatrix values="0 0 0 0 .42  0 0 0 0 .24  0 0 0 0 .1  1.6 0 0 0 -.7"/></filter>`;

/** A cumulus cloud: every lobe is its own little sphere (bright top, shaded underside), piled so the lobes read. */
export function cloud(x: number, y: number, w: number, h: number, seed: number, tone: [string, string, string] = ['#c3cdf0', '#f3e4f6', '#ffffff'], glow = '#f9bdd9', opacity = 1): string {
  const r = rng(seed);
  const id = `cg${seed}`;
  const n = Math.round(w / 15) + 3;
  const cs: { cx: number; cy: number; r: number }[] = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const dome = Math.sin(Math.PI * (0.08 + 0.84 * u));
    cs.push({ cx: x + u * w, cy: y - dome * h * 0.3 * (0.6 + r() * 0.6), r: (0.4 + 0.6 * dome) * h * (0.5 + r() * 0.3) });
  }
  for (let i = 0; i < Math.round(n / 2); i++) {
    const u = 0.15 + r() * 0.7;
    const dome = Math.sin(Math.PI * u);
    cs.push({ cx: x + u * w, cy: y - h * 0.4 * dome - r() * h * 0.22, r: h * (0.3 + r() * 0.22) });
  }
  cs.sort((p, q) => q.cy - p.cy); // low lobes first, so higher ones overlap them
  const lobe = (c: { cx: number; cy: number; r: number }) => `<circle cx="${f1(c.cx)}" cy="${f1(c.cy)}" r="${f1(c.r)}" fill="url(#${id})"/>`;
  return (
    `<g opacity="${opacity}"><defs>${rg(id, [[0, tone[2]], [0.5, tone[1]], [1, tone[0]]], 0.36, 0.28, 0.85)}${lg(id + 'b', [[0, tone[1]], [1, tone[0]]])}</defs>` +
    `<g filter="url(#fluff)">` +
    `<ellipse cx="${f1(x + w / 2)}" cy="${f1(y + h * 0.32)}" rx="${f1(w * 0.55)}" ry="${f1(h * 0.26)}" fill="${glow}" opacity=".6" filter="url(#b8)"/>` +
    `<rect x="${f1(x - h * 0.05)}" y="${f1(y - h * 0.1)}" width="${f1(w + h * 0.1)}" height="${f1(h * 0.36)}" rx="${f1(h * 0.18)}" fill="url(#${id}b)"/>` +
    cs.map(lobe).join('') +
    cs.filter((c) => c.cy < y - h * 0.15).map((c) => `<circle cx="${f1(c.cx - c.r * 0.28)}" cy="${f1(c.cy - c.r * 0.3)}" r="${f1(c.r * 0.5)}" fill="#fff" opacity=".55"/>`).join('') +
    `</g></g>`
  );
}

/** Long thin streaks of high cloud. */
export function cirrus(seed: number, n: number, y0: number, y1: number, w = 400): string {
  const r = rng(seed);
  return Array.from({ length: n }, () => {
    const x = r() * w;
    const y = y0 + r() * (y1 - y0);
    const l = 40 + r() * 110;
    return `<path d="M${f1(x)} ${f1(y)} q${f1(l * 0.4)} ${f1(-4 - r() * 5)} ${f1(l)} ${f1(-r() * 4)} q${f1(-l * 0.5)} ${f1(5 + r() * 3)} ${f1(-l)} ${f1(r() * 3)}Z" fill="#fff" opacity="${(0.25 + r() * 0.3).toFixed(2)}" filter="url(#b2)"/>`;
  }).join('');
}

// ---------- plants ----------

export interface Pt { x: number; y: number }

export const bez = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const u = 1 - t;
  return { x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x, y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y };
};

/** A tapering, shaded, ringed trunk along a curve. */
export function trunk(p0: Pt, p1: Pt, p2: Pt, p3: Pt, w0: number, w1: number, base = '#6b4426', light = '#a47445', ringCol = '#3f2512', rings = true): string {
  const N = 24;
  const L: Pt[] = [];
  const R: Pt[] = [];
  const C: Pt[] = [];
  const Nrm: Pt[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = bez(p0, p1, p2, p3, t);
    const q = bez(p0, p1, p2, p3, Math.min(1, t + 0.01));
    const o = bez(p0, p1, p2, p3, Math.max(0, t - 0.01));
    const dx = q.x - o.x;
    const dy = q.y - o.y;
    const m = Math.hypot(dx, dy) || 1;
    const nx = -dy / m;
    const ny = dx / m;
    const w = (w0 + (w1 - w0) * t) / 2;
    L.push({ x: p.x + nx * w, y: p.y + ny * w });
    R.push({ x: p.x - nx * w, y: p.y - ny * w });
    C.push(p);
    Nrm.push({ x: nx, y: ny });
  }
  const poly = (a: Pt[], b: Pt[]) => 'M' + a.map((p) => `${f1(p.x)} ${f1(p.y)}`).join('L') + 'L' + b.slice().reverse().map((p) => `${f1(p.x)} ${f1(p.y)}`).join('L') + 'Z';
  const lerp = (a: Pt[], b: Pt[], k: number) => a.map((p, i) => ({ x: p.x + (b[i].x - p.x) * k, y: p.y + (b[i].y - p.y) * k }));
  const hi = poly(lerp(L, R, 0.12), lerp(L, R, 0.45));
  const sh = poly(lerp(L, R, 0.72), lerp(L, R, 1));
  let s = `<path d="${poly(L, R)}" fill="${base}"/><path d="${hi}" fill="${light}" opacity=".8"/><path d="${sh}" fill="#2a170a" opacity=".35"/>`;
  if (rings) {
    for (let i = 1; i < N; i++) {
      const a = L[i];
      const b = R[i];
      s += `<path d="M${f1(a.x)} ${f1(a.y)} Q${f1((a.x + b.x) / 2)} ${f1((a.y + b.y) / 2 + 2.4)} ${f1(b.x)} ${f1(b.y)}" stroke="${ringCol}" stroke-width="1.1" fill="none" opacity=".5"/>`;
    }
  }
  return s;
}

/** A palm frond: a drooping rib with many pointed leaflets on both sides. */
export function frond(x: number, y: number, angle: number, len: number, seed: number, dark = '#1d6e40', mid = '#2b8c4c', light = '#5db25a'): string {
  const r = rng(seed);
  const P0 = { x: 0, y: 0 };
  const P1 = { x: len * 0.35, y: -len * 0.32 };
  const P2 = { x: len * 0.75, y: -len * 0.22 };
  const P3 = { x: len, y: len * 0.2 };
  const N = 21;
  let s = '';
  for (let i = 1; i <= N; i++) {
    const t = 0.08 + (0.92 * i) / N;
    const p = bez(P0, P1, P2, P3, t);
    const q = bez(P0, P1, P2, P3, Math.min(1, t + 0.02));
    const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
    const ll = len * 0.36 * (1 - t * 0.5) * (0.85 + r() * 0.3);
    const wid = ll * 0.3;
    for (const side of [-1, 1]) {
      const a = ang + side * (52 + r() * 14) + (side > 0 ? 14 : -4);
      const col = r() > 0.5 ? mid : dark;
      s += `<path transform="translate(${f1(p.x)} ${f1(p.y)}) rotate(${f1(a)})" d="M0 0 Q${f1(ll * 0.45)} ${f1(-wid)} ${f1(ll)} ${f1(ll * 0.12)} Q${f1(ll * 0.5)} ${f1(wid * 0.8)} 0 0Z" fill="${col}"/>`;
      if (r() > 0.55) s += `<path transform="translate(${f1(p.x)} ${f1(p.y)}) rotate(${f1(a)})" d="M0 0 Q${f1(ll * 0.45)} ${f1(-wid * 0.9)} ${f1(ll * 0.8)} ${f1(ll * 0.08)}" stroke="${light}" stroke-width="1" fill="none" opacity=".7"/>`;
    }
  }
  s += `<path d="M0 0 C${f1(P1.x)} ${f1(P1.y)} ${f1(P2.x)} ${f1(P2.y)} ${f1(P3.x)} ${f1(P3.y)}" stroke="${dark}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(angle)})">${s}</g>`;
}

/** A whole palm: curved trunk, crown of fronds, coconuts. */
export function palm(x: number, y: number, h: number, lean: number, seed: number, scale = 1, fronds = 9): string {
  const r = rng(seed);
  const p0 = { x, y };
  const p1 = { x: x - lean * 0.15, y: y - h * 0.38 };
  const p2 = { x: x + lean * 0.55, y: y - h * 0.72 };
  const p3 = { x: x + lean, y: y - h };
  let s = trunk(p0, p1, p2, p3, 14 * scale, 7 * scale);
  const cx = p3.x;
  const cy = p3.y;
  const angles = Array.from({ length: fronds }, (_, i) => -200 + (i * 230) / (fronds - 1) + (r() - 0.5) * 18);
  angles.forEach((a, i) => {
    const flip = Math.cos((a * Math.PI) / 180) < 0;
    s += frond(cx, cy, a, (64 + r() * 26) * scale, seed + i * 7 + 1);
    void flip;
  });
  s += [0, 1, 2].map((i) => `<circle cx="${f1(cx - 4 + i * 5)}" cy="${f1(cy + 5 + (i % 2) * 3)}" r="${f1(4 * scale)}" fill="#6a4a22"/><circle cx="${f1(cx - 5 + i * 5)}" cy="${f1(cy + 4 + (i % 2) * 3)}" r="${f1(1.5 * scale)}" fill="#c89a5a" opacity=".7"/>`).join('');
  return s;
}

/** Rounded, bumpy foliage along a ridge: many overlapping circles in a few greens with lit tops. */
export function foliage(x0: number, x1: number, ridge: (x: number) => number, bottom: number, seed: number, cols: [string, string, string], size = 12, density = 1): string {
  const r = rng(seed);
  let s = '';
  const fill = `M${f1(x0)} ${f1(bottom)} ` + Array.from({ length: 41 }, (_, i) => `L${f1(x0 + ((x1 - x0) * i) / 40)} ${f1(ridge(x0 + ((x1 - x0) * i) / 40))}`).join(' ') + ` L${f1(x1)} ${f1(bottom)}Z`;
  s += `<path d="${fill}" fill="${cols[0]}"/>`;
  // a ragged, bumpy lower edge instead of a ruler-straight one
  for (let x = x0 + size * 0.5; x < x1; x += size * (0.7 + r() * 0.6)) {
    const k = Math.min(1, Math.max(0, (x - x0) / (size * 4)));
    s += `<circle cx="${f1(x)}" cy="${f1(bottom - size * 0.1 * r())}" r="${f1(size * (0.45 + r() * 0.45) * k)}" fill="${r() > 0.5 ? cols[0] : cols[1]}"/>`;
  }
  const n = Math.round(((x1 - x0) / size) * 2.2 * density);
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0);
    const top = ridge(x);
    const y = top + r() * Math.min(bottom - top, size * 5);
    const rad = size * (0.5 + r() * 0.8);
    const lit = y - top < size * 1.6;
    s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(rad)}" fill="${lit ? cols[1] : cols[0]}" opacity="${(0.55 + r() * 0.4).toFixed(2)}"/>`;
    if (lit && r() > 0.4) s += `<circle cx="${f1(x - rad * 0.3)}" cy="${f1(y - rad * 0.3)}" r="${f1(rad * 0.55)}" fill="${cols[2]}" opacity="${(0.35 + r() * 0.4).toFixed(2)}"/>`;
  }
  return s;
}

/** Grass blades: short curved strokes in two greens. */
export function grass(x0: number, x1: number, y: number, n: number, h: number, seed: number, c1 = '#3f9a4a', c2 = '#7cc65e'): string {
  const r = rng(seed);
  return Array.from({ length: n }, () => {
    const x = x0 + r() * (x1 - x0);
    const hh = h * (0.5 + r() * 0.7);
    const bend = (r() - 0.5) * hh * 0.7;
    return `<path d="M${f1(x)} ${f1(y)} Q${f1(x + bend * 0.2)} ${f1(y - hh * 0.6)} ${f1(x + bend)} ${f1(y - hh)}" stroke="${r() > 0.45 ? c1 : c2}" stroke-width="${(1 + r() * 1.3).toFixed(1)}" fill="none" stroke-linecap="round" opacity=".9"/>`;
  }).join('');
}

/** A big tropical leaf with a midrib and lateral veins. */
export function bigLeaf(x: number, y: number, len: number, wid: number, angle: number, c1 = '#2f9a4e', c2 = '#1d6f3d', vein = '#8fd68a', id = 'leaf'): string {
  let veins = '';
  for (let i = 1; i < 9; i++) {
    const t = i / 9.5;
    const px = len * t;
    const w = wid * Math.sin(Math.PI * Math.min(1, t * 1.05 + 0.05)) * 0.5;
    veins += `<path d="M${f1(px)} 0 Q${f1(px + len * 0.07)} ${f1(-w * 0.55)} ${f1(px + len * 0.14)} ${f1(-w * 0.95)}" stroke="${vein}" stroke-width="1.1" fill="none" opacity=".55"/><path d="M${f1(px)} 0 Q${f1(px + len * 0.07)} ${f1(w * 0.55)} ${f1(px + len * 0.14)} ${f1(w * 0.95)}" stroke="${vein}" stroke-width="1.1" fill="none" opacity=".55"/>`;
  }
  return (
    `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(angle)})"><defs>${lg(id, [[0, c1], [1, c2]], 0, 0, 0, 1)}</defs>` +
    `<path d="M0 0 C${f1(len * 0.2)} ${f1(-wid * 0.62)} ${f1(len * 0.7)} ${f1(-wid * 0.5)} ${f1(len)} 0 C${f1(len * 0.7)} ${f1(wid * 0.5)} ${f1(len * 0.2)} ${f1(wid * 0.62)} 0 0Z" fill="url(#${id})"/>` +
    `<path d="M0 0 C${f1(len * 0.2)} ${f1(-wid * 0.62)} ${f1(len * 0.7)} ${f1(-wid * 0.5)} ${f1(len)} 0 C${f1(len * 0.6)} ${f1(-wid * 0.2)} ${f1(len * 0.2)} ${f1(-wid * 0.1)} 0 0Z" fill="#fff" opacity=".1"/>` +
    veins + `<path d="M0 0 L${f1(len)} 0" stroke="${vein}" stroke-width="2" opacity=".75" stroke-linecap="round"/></g>`
  );
}

/** A hibiscus with veined, ruffled petals, a dark throat and a long stamen. */
export function hibiscus(x: number, y: number, r: number, id = 'hib', petal = ['#ff8aa6', '#e63c68'], throat = '#9c1448'): string {
  const petals = Array.from({ length: 5 }, (_, i) => {
    const a = -90 + i * 72 + 8;
    const rr = r;
    const edge = (k: number) => `${f1(rr * (0.98 + 0.06 * Math.sin(k * 5)))}`;
    void edge;
    const d = `M0 0 C${f1(rr * 0.45)} ${f1(-rr * 0.25)} ${f1(rr * 0.95)} ${f1(-rr * 0.55)} ${f1(rr * 1.02)} ${f1(-rr * 0.18)} q${f1(rr * 0.1)} ${f1(rr * 0.12)} ${f1(-rr * 0.02)} ${f1(rr * 0.24)} q${f1(rr * 0.08)} ${f1(rr * 0.14)} ${f1(-rr * 0.1)} ${f1(rr * 0.24)} C${f1(rr * 0.8)} ${f1(rr * 0.6)} ${f1(rr * 0.4)} ${f1(rr * 0.35)} 0 0Z`;
    let veins = '';
    for (let k = -2; k <= 2; k++) veins += `<path d="M${f1(rr * 0.12)} 0 Q${f1(rr * 0.5)} ${f1(k * rr * 0.06)} ${f1(rr * 0.92)} ${f1(k * rr * 0.1 + rr * 0.02)}" stroke="${throat}" stroke-width="0.9" fill="none" opacity=".4"/>`;
    return `<g transform="rotate(${a})"><path d="${d}" fill="url(#${id})"/><path d="${d}" fill="none" stroke="#ffd0dc" stroke-width="1" opacity=".5"/>${veins}</g>`;
  }).join('');
  return (
    `<g transform="translate(${f1(x)} ${f1(y)})"><defs>${rg(id, [[0, throat], [0.28, petal[1]], [1, petal[0]]], 0, 0, 1, false).replace('cx="0" cy="0" r="1"', `cx="0" cy="0" r="${f1(r * 1.05)}" gradientUnits="userSpaceOnUse"`)}</defs>` +
    `<ellipse cx="2" cy="${f1(r * 0.35)}" rx="${f1(r * 1.1)}" ry="${f1(r * 0.4)}" fill="#000" opacity=".16" filter="url(#b3)"/>` + petals +
    `<circle r="${f1(r * 0.2)}" fill="${throat}"/>` +
    `<path d="M0 0 Q${f1(r * 0.35)} ${f1(-r * 0.5)} ${f1(r * 0.55)} ${f1(-r * 0.95)}" stroke="#f3b33a" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
    [0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${f1(r * 0.5 + (i % 3) * 2 - 2)}" cy="${f1(-r * 0.9 - (i > 2 ? 3 : 0) + (i % 2) * 2)}" r="1.9" fill="${i % 2 ? '#ffd24a' : '#ffb21a'}"/>`).join('') + `</g>`
  );
}

/** A ridged scallop shell. */
export function shell(x: number, y: number, w: number, rot: number, c1 = '#fde3ea', c2 = '#e9a6bd', id = 'shell'): string {
  const h = w * 0.82;
  const ridges = Array.from({ length: 9 }, (_, i) => {
    const a = -52 + i * 13;
    const rr = (a * Math.PI) / 180;
    return `<path d="M0 ${f1(h * 0.45)} L${f1(Math.sin(rr) * w * 0.62)} ${f1(h * 0.45 - Math.cos(rr) * h * 0.95)}" stroke="${c2}" stroke-width="1.8" opacity=".75"/><path d="M1.5 ${f1(h * 0.45)} L${f1(Math.sin(rr) * w * 0.62 + 2)} ${f1(h * 0.45 - Math.cos(rr) * h * 0.95)}" stroke="#fff" stroke-width=".9" opacity=".6"/>`;
  }).join('');
  return (
    `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${rot})"><defs>${lg(id, [[0, c1], [1, c2]], 0, 0, 0, 1)}</defs>` +
    `<ellipse cx="3" cy="${f1(h * 0.5)}" rx="${f1(w * 0.55)}" ry="${f1(h * 0.14)}" fill="#8a5a2a" opacity=".25" filter="url(#b2)"/>` +
    `<path d="M0 ${f1(h * 0.5)} C${f1(-w * 0.62)} ${f1(h * 0.42)} ${f1(-w * 0.72)} ${f1(-h * 0.1)} ${f1(-w * 0.4)} ${f1(-h * 0.36)} C${f1(-w * 0.2)} ${f1(-h * 0.52)} ${f1(w * 0.2)} ${f1(-h * 0.52)} ${f1(w * 0.4)} ${f1(-h * 0.36)} C${f1(w * 0.72)} ${f1(-h * 0.1)} ${f1(w * 0.62)} ${f1(h * 0.42)} 0 ${f1(h * 0.5)}Z" fill="url(#${id})"/>` +
    ridges + `<path d="M${f1(-w * 0.18)} ${f1(h * 0.5)} h${f1(w * 0.36)} l${f1(-w * 0.06)} ${f1(h * 0.1)} h${f1(-w * 0.24)}Z" fill="${c2}"/></g>`
  );
}

/** A starfish with a dotted texture and a lit side. */
export function starfish(x: number, y: number, r: number, rot: number, c1 = '#ffb347', c2 = '#e8741c', id = 'sf'): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.42;
    const a = ((-90 + 36 * i) * Math.PI) / 180;
    pts.push(`${f1(Math.cos(a) * rr)},${f1(Math.sin(a) * rr)}`);
  }
  let dots = '';
  for (let i = 0; i < 5; i++) {
    const a = ((-90 + 72 * i) * Math.PI) / 180;
    for (let k = 1; k <= 4; k++) dots += `<circle cx="${f1(Math.cos(a) * r * 0.18 * k * 1.15)}" cy="${f1(Math.sin(a) * r * 0.18 * k * 1.15)}" r="${f1(Math.max(0.7, r * 0.035 * (5 - k) * 0.55 + 0.6))}" fill="#fff0c8" opacity=".85"/>`;
  }
  return (
    `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${rot})"><defs>${rg(id, [[0, c1], [1, c2]], 0.4, 0.35, 0.8)}</defs>` +
    `<polygon points="${pts.join(' ')}" fill="#7a3a0a" opacity=".22" transform="translate(2.5 3.5)" filter="url(#b2)"/>` +
    `<polygon points="${pts.join(' ')}" fill="url(#${id})" stroke="${c2}" stroke-width="${f1(r * 0.16)}" stroke-linejoin="round"/>` +
    `<polygon points="${pts.join(' ')}" fill="none" stroke="${c1}" stroke-width="${f1(r * 0.05)}" stroke-linejoin="round" opacity=".6"/>` + dots + `</g>`
  );
}

/** Tiny white glints scattered over water or snow. */
export function glints(seed: number, n: number, x0: number, x1: number, y0: number, y1: number, maxLen = 8, col = '#fff'): string {
  const r = rng(seed);
  return Array.from({ length: n }, () => {
    const x = x0 + r() * (x1 - x0);
    const y = y0 + r() * (y1 - y0);
    const l = 1.5 + r() * maxLen;
    return `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(l)}" height="${(0.5 + r() * 0.7).toFixed(1)}" rx=".5" fill="${col}" opacity="${(0.25 + r() * 0.65).toFixed(2)}"/>`;
  }).join('');
}

/** Soft slanted light beams. */
export function rays(x: number, y: number, n: number, len: number, spread: number, seed: number, col = '#fffbd0', op = 0.2): string {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const a = (-spread / 2 + (spread * i) / Math.max(1, n - 1) + (r() - 0.5) * 6) * (Math.PI / 180) + Math.PI / 2;
    const wdt = 8 + r() * 22;
    const x2 = x + Math.cos(a) * len;
    const y2 = y + Math.sin(a) * len;
    return `<polygon points="${f1(x - wdt * 0.2)},${f1(y)} ${f1(x + wdt * 0.2)},${f1(y)} ${f1(x2 + wdt)},${f1(y2)} ${f1(x2 - wdt)},${f1(y2)}" fill="${col}" opacity="${(op * (0.5 + r() * 0.8)).toFixed(3)}" filter="url(#b5)"/>`;
  }).join('');
}

/** Soft round lights, for night scenes and sun-dappled air. */
export function bokeh(seed: number, n: number, x0: number, x1: number, y0: number, y1: number, cols: string[], rmin = 3, rmax = 11, op = 0.35): string {
  const r = rng(seed);
  return Array.from({ length: n }, () => `<circle cx="${f1(x0 + r() * (x1 - x0))}" cy="${f1(y0 + r() * (y1 - y0))}" r="${f1(rmin + r() * (rmax - rmin))}" fill="${cols[Math.floor(r() * cols.length)]}" opacity="${(op * (0.4 + r() * 0.8)).toFixed(2)}"/>`).join('');
}

/** A soft dark edge, to pull the eye to the middle. */
export const vignette = (op = 0.22, id = 'vig') =>
  `<defs>${rg(id, [[0.55, '#102040', 0], [1, '#102040', op]], 0.5, 0.45, 0.75)}</defs><rect width="400" height="700" fill="url(#${id})"/>`;

// ---------- more shared pieces ----------

/** A mushroom with a spotted, shaded cap, gills and a creamy stem. */
export function mushroom(x: number, y: number, s: number, cap = ['#ff6a55', '#c9302a'], id = 'mush'): string {
  const spots = [[-14, -22, 5], [4, -30, 4.2], [16, -20, 5.4], [-2, -14, 3.4], [-22, -12, 3]].map(([sx, sy, sr]) => `<ellipse cx="${sx}" cy="${sy}" rx="${sr}" ry="${Number(sr) * 0.8}" fill="#fff8ec" opacity=".95"/>`).join('');
  return (
    `<g transform="translate(${f1(x)} ${f1(y)}) scale(${s})"><defs>${rg(id, [[0, cap[0]], [1, cap[1]]], 0.35, 0.25, 0.9)}${lg(id + 's', [[0, '#fff6e2'], [0.6, '#f0dcc0'], [1, '#c9a47a']], 0, 0, 1, 0)}</defs>` +
    `<ellipse cx="2" cy="16" rx="24" ry="5" fill="#2a1a08" opacity=".3" filter="url(#b2)"/>` +
    `<path d="M-8 -4 L-9 14 C-9 20 9 20 9 14 L8 -4Z" fill="url(#${id}s)"/>` +
    `<path d="M-22 -4 C-22 -14 22 -14 22 -4 C14 2 -14 2 -22 -4Z" fill="#e6cfae"/>` + Array.from({ length: 9 }, (_, i) => `<path d="M${-18 + i * 4.5} -5 L${-15 + i * 3.8} 1" stroke="#b58f66" stroke-width=".8" opacity=".7"/>`).join('') +
    `<path d="M-28 -2 C-30 -34 -12 -42 0 -42 C12 -42 30 -34 28 -2 C20 -8 -20 -8 -28 -2Z" fill="url(#${id})"/>` + spots +
    `<path d="M-20 -30 C-14 -38 -6 -40 -2 -40" stroke="#fff" stroke-width="3" fill="none" opacity=".45" stroke-linecap="round"/></g>`
  );
}

/** A small flower: round petals around a centre. */
export function blossom(x: number, y: number, r: number, petal: string, mid = '#ffd23a', n = 5): string {
  return `<g transform="translate(${f1(x)} ${f1(y)})">${Array.from({ length: n }, (_, i) => {
    const a = (360 / n) * i;
    return `<ellipse cx="0" cy="${f1(-r * 0.95)}" rx="${f1(r * 0.62)}" ry="${f1(r)}" fill="${petal}" transform="rotate(${a})"/><ellipse cx="0" cy="${f1(-r * 1.25)}" rx="${f1(r * 0.28)}" ry="${f1(r * 0.4)}" fill="#fff" opacity=".35" transform="rotate(${a})"/>`;
  }).join('')}<circle r="${f1(r * 0.5)}" fill="${mid}"/><circle cx="${f1(-r * 0.15)}" cy="${f1(-r * 0.15)}" r="${f1(r * 0.2)}" fill="#fff" opacity=".6"/></g>`;
}

/** A fern: arching fronds of paired leaflets. */
export function fern(x: number, y: number, s: number, seed: number, dark = '#1f6a38', light = '#4cad55'): string {
  const r = rng(seed);
  let out = '';
  for (let k = 0; k < 7; k++) {
    const a = -78 + k * 26 + (r() - 0.5) * 8;
    out += `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(a)}) scale(${s})">` +
      Array.from({ length: 12 }, (_, i) => {
        const t = (i + 1) / 13;
        const len = 18 * (1 - t * 0.7) * (0.8 + r() * 0.4);
        const px = 0;
        const py = -t * 62;
        const bend = t * t * 10;
        return `<path d="M${f1(px + bend)} ${f1(py)} q${f1(len * 0.5)} ${f1(-len * 0.28)} ${f1(len)} ${f1(len * 0.1)}" stroke="${r() > 0.5 ? dark : light}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M${f1(px + bend)} ${f1(py)} q${f1(-len * 0.5)} ${f1(-len * 0.28)} ${f1(-len)} ${f1(len * 0.1)}" stroke="${r() > 0.5 ? dark : light}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
      }).join('') +
      `<path d="M0 0 Q4 -30 10 -64" stroke="${dark}" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>`;
  }
  return out;
}

/** A pine with snow-capable tiers, shaded on its right side. */
export function pine(x: number, y: number, s: number, c: [string, string, string] = ['#1f6b4e', '#2f8a63', '#48a87a'], snow = false, tiers = 5): string {
  let out = `<g transform="translate(${f1(x)} ${f1(y)}) scale(${s})"><rect x="-4" y="-6" width="8" height="26" fill="#5a3a20"/><ellipse cx="2" cy="22" rx="22" ry="4" fill="#102a20" opacity=".25" filter="url(#b2)"/>`;
  for (let i = 0; i < tiers; i++) {
    const w = 34 - i * 5.2;
    const top = -8 - i * 17;
    const bottom = top + 24;
    out += `<path d="M${-w} ${bottom} Q0 ${bottom + 7} ${w} ${bottom} L0 ${top - 14}Z" fill="${c[0]}"/><path d="M0 ${top - 14} L${w} ${bottom} Q${w * 0.3} ${bottom + 5} 0 ${bottom + 3}Z" fill="${c[1]}" opacity=".55"/><path d="M${-w * 0.55} ${bottom - 6} Q${-w * 0.1} ${bottom - 2} 0 ${top - 6}" stroke="${c[2]}" stroke-width="2" fill="none" opacity=".6"/>`;
    if (snow) out += `<path d="M${-w * 0.9} ${bottom - 2} Q${-w * 0.45} ${bottom - 12} 0 ${top - 14} Q${w * 0.45} ${bottom - 12} ${w * 0.9} ${bottom - 2} Q${w * 0.5} ${bottom - 7} ${w * 0.2} ${bottom - 4} Q${-w * 0.1} ${bottom - 9} ${-w * 0.4} ${bottom - 4} Q${-w * 0.7} ${bottom - 8} ${-w * 0.9} ${bottom - 2}Z" fill="#fff"/><path d="M${w * 0.3} ${bottom - 8} Q${w * 0.6} ${bottom - 6} ${w * 0.9} ${bottom - 2}" stroke="#bcd6ee" stroke-width="2" fill="none" opacity=".7"/>`;
  }
  return out + `</g>`;
}

/** A butterfly with patterned wings. */
export function butterfly(x: number, y: number, s: number, rot: number, c1: string, c2: string, id = 'bf'): string {
  const wing = (m: number) => `<path d="M0 -2 C${m * 20} -26 ${m * 40} -16 ${m * 34} 0 C${m * 30} 8 ${m * 12} 6 0 -2Z" fill="url(#${id})"/><path d="M0 2 C${m * 22} 4 ${m * 30} 22 ${m * 18} 28 C${m * 8} 30 ${m * 2} 14 0 2Z" fill="url(#${id})" opacity=".92"/><circle cx="${m * 24}" cy="-8" r="3.4" fill="#fff" opacity=".8"/><circle cx="${m * 16}" cy="18" r="2.4" fill="#fff" opacity=".7"/><path d="M0 -2 C${m * 14} -14 ${m * 26} -12 ${m * 30} -4" stroke="#3a2a40" stroke-width="1" fill="none" opacity=".4"/>`;
  return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${rot}) scale(${s})"><defs>${rg(id, [[0, c1], [1, c2]], 0.1, 0.3, 1)}</defs>${wing(-1)}${wing(1)}<rect x="-2" y="-12" width="4" height="30" rx="2" fill="#3a2a40"/><path d="M-1 -12 Q-8 -24 -14 -26 M1 -12 Q8 -24 14 -26" stroke="#3a2a40" stroke-width="1.2" fill="none"/></g>`;
}

/** A rounded building with shaded sides and a window grid (some windows lit). */
export function building(x: number, y: number, w: number, h: number, c: [string, string], seed: number, win = '#fff3b8', dim = 'rgba(40,60,100,.35)', roof = true): string {
  const r = rng(seed);
  const id = `bd${seed}`;
  const cols = Math.max(2, Math.floor(w / 15));
  const rows = Math.max(2, Math.floor((h - 18) / 20));
  const cw = (w - 12) / cols;
  let ws = '';
  for (let a = 0; a < rows; a++) for (let b = 0; b < cols; b++) {
    const lit = r() > 0.42;
    ws += `<rect x="${f1(x + 6 + b * cw + 1.5)}" y="${f1(y + 14 + a * 20)}" width="${f1(cw - 3)}" height="11" rx="1.6" fill="${lit ? win : dim}"/>${lit ? `<rect x="${f1(x + 6 + b * cw + 1.5)}" y="${f1(y + 14 + a * 20)}" width="${f1(cw - 3)}" height="3.5" rx="1.2" fill="#fff" opacity=".5"/>` : ''}`;
  }
  const extra = roof ? (r() > 0.5
    ? `<rect x="${f1(x + w * 0.2)}" y="${f1(y - 14)}" width="${f1(w * 0.28)}" height="14" fill="#6a6f80"/><rect x="${f1(x + w * 0.2 - 2)}" y="${f1(y - 17)}" width="${f1(w * 0.28 + 4)}" height="4" fill="#4a4f5e"/>`
    : `<path d="M${f1(x + w * 0.62)} ${f1(y)} v-24 M${f1(x + w * 0.62 - 6)} ${f1(y - 14)} h12 M${f1(x + w * 0.62 - 4)} ${f1(y - 20)} h8" stroke="#4a4f5e" stroke-width="1.6" fill="none"/>`) : '';
  return (
    `<defs>${lg(id, [[0, c[0]], [1, c[1]]], 0, 0, 1, 0)}</defs>` +
    extra + `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="2.4" fill="url(#${id})"/>` +
    `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="6" rx="2.4" fill="#fff" opacity=".28"/><rect x="${f1(x + w - 5)}" y="${f1(y)}" width="5" height="${f1(h)}" fill="#000" opacity=".14"/>` + ws
  );
}
