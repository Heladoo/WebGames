// Things on the track: obstacles to jump over or duck under (a friendly version for every track, never anything
// scary), and the candies that make the runners faster. Drawn around (0, 0) = the middle of their foot on the
// ground, at near-lane size. Each obstacle also says how it is passed (`act`) and its hit box, so the race and the
// hint icon above it agree with the picture.

import { blossom, mushroom, rng } from './paint';
import { blob, circle, curve, ellipse, f, inked, linG, pt, radG, shade, type P } from './geom';
import { star } from './riders';
import type { TrackId } from './tracks';

export type Act = 'jump' | 'duck';
/** `back` is drawn behind the runner (a far post or trunk), `svg` in front of it. */
export interface Obstacle { svg: string; back: string; act: Act; w: number; top: number; bottom: number }
export type ObstacleId = 'log' | 'rock' | 'bush' | 'snowman' | 'cactus' | 'hedge' | 'branch' | 'garland' | 'icebough' | 'arch' | 'rosearch';

export const TRACK_OBSTACLES: Record<TrackId, ObstacleId[]> = {
  forest: ['log', 'bush', 'branch'],
  meadow: ['rock', 'bush', 'garland'],
  snow: ['snowman', 'rock', 'icebough'],
  canyon: ['rock', 'cactus', 'arch'],
  garden: ['hedge', 'bush', 'rosearch'],
};

const INK = '#4a2c18';
let uidN = 0;

/** How high the bottom of an overhead obstacle is (near lane): a ducking rider fits under it, a sitting one does not. */
export const DUCK_GAP = 292;
/** How high a jump lifts the feet at its peak (near lane); every jump obstacle is lower than this. */
export const JUMP_PEAK = 160;
/** Jump obstacles are drawn this much larger, so they read clearly next to the big animals. */
const JUMP_SCALE = 1.45;

export function obstacle(id: ObstacleId, track: TrackId): Obstacle {
  const o = drawObstacle(id, track);
  if (o.act === 'duck') return o;
  const k = JUMP_SCALE;
  return { svg: `<g transform="scale(${k})">${o.svg}</g>`, back: '', act: o.act, w: o.w * k, top: o.top * k, bottom: o.bottom * k };
}

function drawObstacle(id: ObstacleId, track: TrackId): Obstacle {
  const u = `o${(uidN++).toString(36)}`;
  const shadow = (w: number) => `<ellipse cx="0" cy="4" rx="${f(w * 0.55)}" ry="10" fill="#3a2410" opacity=".22"/>`;
  switch (id) {
    case 'log': {
      const g = `${u}g`;
      let s = `<defs>${linG(g, [[0, '#b07a48'], [0.5, '#8a5a32'], [1, '#5a3820']])}</defs>` + shadow(170);
      s += inked([{ d: blob([pt(-78, -6), pt(-74, -50), pt(60, -56), pt(72, -8), pt(40, 2), pt(-60, 2)], 0.6), fill: `url(#${g})` }, { d: ellipse(pt(66, -28), 18, 28), fill: '#e8c08a' }], INK, 2.4);
      s += `<path d="${ellipse(pt(66, -28), 11, 18)}" fill="none" stroke="#b07a48" stroke-width="2"/><path d="${ellipse(pt(66, -28), 5, 8)}" fill="none" stroke="#b07a48" stroke-width="2"/>`;
      for (let i = 0; i < 5; i++) s += `<path d="M${-60 + i * 26} -46 q6 18 0 38" stroke="#5a3820" stroke-width="2" fill="none" opacity=".5"/>`;
      s += `<path d="${blob([pt(-60, -50), pt(-20, -62), pt(20, -56), pt(-10, -48)], 0.8)}" fill="#6cb04a"/><path d="M-50 -54 q20 -8 50 -2" stroke="#a8de78" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      s += `<g transform="translate(-30 -44) scale(.55)">${mushroom(0, 0, 1, ['#ff8a6a', '#d9442e'], `${u}m`)}</g>`;
      return { svg: s, back: '', act: 'jump', w: 150, top: -60, bottom: 0 };
    }
    case 'rock': {
      const snow = track === 'snow';
      const red = track === 'canyon';
      const base = red ? '#c4603e' : snow ? '#9aa8c0' : '#a8a296';
      const g = `${u}g`;
      let s = `<defs>${radG(g, [[0, shade(base, 0.35)], [0.6, base], [1, shade(base, -0.3)]], 0.35, 0.3, 0.8)}</defs>` + shadow(110);
      s += inked([{ d: blob([pt(-52, 0), pt(-48, -36), pt(-14, -64), pt(28, -58), pt(54, -26), pt(50, 0)], 0.8), fill: `url(#${g})` }], INK, 2.4);
      s += `<path d="M-28 -40 q14 -14 34 -14" stroke="#fff" stroke-width="4" fill="none" opacity=".45" stroke-linecap="round"/>`;
      if (snow) s += `<path d="${blob([pt(-40, -40), pt(-14, -66), pt(28, -60), pt(48, -34), pt(20, -44), pt(-10, -40)], 0.8)}" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`;
      else if (!red) s += `<path d="${blob([pt(-30, -50), pt(-6, -64), pt(14, -60), pt(-4, -52)], 0.8)}" fill="#6cb04a" opacity=".9"/>${blossom(30, -8, 5, '#fff')}${blossom(-44, -4, 4, '#ffd23f')}`;
      return { svg: s, back: '', act: 'jump', w: 104, top: -64, bottom: 0 };
    }
    case 'bush': {
      const r = rng(7);
      const garden = track === 'garden';
      const cols = garden ? ['#3f8f48', '#5fae5a', '#a6d77c'] : ['#2f7a3c', '#4a9a48', '#9ad06a'];
      let s = shadow(120);
      const lobes: P[] = [pt(-50, -10), pt(-34, -44), pt(0, -62), pt(34, -46), pt(52, -12), pt(0, 0)];
      s += inked([{ d: blob(lobes, 0.9), fill: cols[0] }], INK, 2.2);
      for (let i = 0; i < 10; i++) s += `<circle cx="${f((r() - 0.5) * 80)}" cy="${f(-14 - r() * 40)}" r="${f(10 + r() * 8)}" fill="${cols[1]}"/>`;
      for (let i = 0; i < 6; i++) s += `<circle cx="${f(-8 + (r() - 0.5) * 60)}" cy="${f(-34 - r() * 20)}" r="${f(4 + r() * 5)}" fill="${cols[2]}" opacity=".8"/>`;
      // berries or roses
      for (let i = 0; i < 7; i++) s += garden ? blossom((r() - 0.5) * 80, -16 - r() * 36, 6, '#ff7aa8') : `<circle cx="${f((r() - 0.5) * 80)}" cy="${f(-14 - r() * 38)}" r="5" fill="#e8344e" stroke="${INK}" stroke-width="1.2"/><circle cx="${f((r() - 0.5) * 80)}" cy="${f(-14 - r() * 38)}" r="1.4" fill="#fff"/>`;
      return { svg: s, back: '', act: 'jump', w: 104, top: -62, bottom: 0 };
    }
    case 'snowman': {
      let s = shadow(80) + '<g transform="scale(.8)">';
      s += inked([{ d: circle(pt(0, -26), 28), fill: '#ffffff' }, { d: circle(pt(0, -70), 20), fill: '#ffffff' }], '#5a6a8a', 2.2);
      s += `<path d="${ellipse(pt(8, -18), 18, 16)}" fill="#c6d8ee" opacity=".7"/><path d="${ellipse(pt(6, -64), 12, 11)}" fill="#c6d8ee" opacity=".6"/>`;
      s += `<circle cx="-6" cy="-74" r="2.6" fill="#2a2a3a"/><circle cx="6" cy="-74" r="2.6" fill="#2a2a3a"/><path d="M0 -68 l16 3 l-16 3Z" fill="#ff8a2a" stroke="${INK}" stroke-width="1"/>`;
      s += `<path d="M-8 -62 q8 6 16 0" stroke="#2a2a3a" stroke-width="2" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M-20 -52 q20 8 40 0 l2 8 q-22 8 -44 0Z" fill="#e8344e" stroke="${INK}" stroke-width="1.6"/><path d="M10 -48 l4 18 l8 -2 l-4 -16Z" fill="#e8344e" stroke="${INK}" stroke-width="1.6"/>`;
      s += `<path d="M-16 -86 h32 l-4 -18 h-24Z" fill="#3a4a8a" stroke="${INK}" stroke-width="1.8"/><path d="M-12 -92 h24" stroke="#ffd23f" stroke-width="3"/>`;
      [-30, -18].forEach((y) => (s += `<circle cx="0" cy="${y}" r="2.6" fill="#2a2a3a"/>`));
      return { svg: s + '</g>', back: '', act: 'jump', w: 56, top: -84, bottom: 0 };
    }
    case 'cactus': {
      let s = shadow(70);
      const body = [pt(-14, 0), pt(-14, -76), pt(0, -88), pt(14, -76), pt(14, 0)];
      s += inked([{ d: blob(body, 0.5), fill: '#5a9a52' }, { d: blob([pt(-14, -40), pt(-30, -42), pt(-34, -66), pt(-24, -68), pt(-20, -52), pt(-12, -52)], 0.5), fill: '#5a9a52' }, { d: blob([pt(14, -30), pt(30, -32), pt(32, -56), pt(22, -58), pt(20, -42), pt(12, -42)], 0.5), fill: '#5a9a52' }], '#2a5a2a', 2.2);
      s += `<path d="M-4 -80 V-6 M6 -76 V-6" stroke="#8ac87a" stroke-width="2.4" opacity=".7"/>`;
      s += blossom(0, -88, 7, '#ff7aa8') + blossom(-28, -68, 5, '#ffd23f');
      return { svg: s, back: '', act: 'jump', w: 70, top: -94, bottom: 0 };
    }
    case 'hedge': {
      let s = shadow(150);
      s += inked([{ d: blob([pt(-70, 0), pt(-72, -44), pt(-60, -56), pt(60, -56), pt(72, -44), pt(70, 0)], 0.4), fill: '#3f8f48' }], '#1f4a24', 2.4);
      for (let i = 0; i < 8; i++) s += `<circle cx="${-56 + i * 16}" cy="-50" r="9" fill="#5fae5a"/>`;
      s += `<path d="M-60 -42 h120" stroke="#8fd27a" stroke-width="3" opacity=".6" stroke-linecap="round"/>`;
      for (let i = 0; i < 6; i++) s += blossom(-50 + i * 20, -24 - (i % 2) * 12, 5.5, i % 2 ? '#ffffff' : '#ff9ec8');
      return { svg: s, back: '', act: 'jump', w: 140, top: -58, bottom: 0 };
    }
    // ---- overhead: duck under these
    case 'branch':
    case 'icebough': {
      const ice = id === 'icebough';
      const y = -DUCK_GAP;
      // a tree trunk on the far side of the lane holds a long branch over it
      const back = inked([{ d: blob([pt(70, 2), pt(66, -150), pt(62, -330), pt(92, -340), pt(96, -150), pt(100, 2)], 0.5), fill: ice ? '#6a5a50' : '#7a4c2a' }], INK, 2.4);
      let s = inked([{ d: blob([pt(80, y - 70), pt(-20, y - 40), pt(-110, y - 16), pt(-120, y - 6), pt(-20, y - 22), pt(84, y - 46)], 0.8), fill: ice ? '#7a6a60' : '#8a5a32' }], INK, 2.2);
      const leaf = ice ? '#ffffff' : '#4a9a48';
      for (let i = 0; i < 9; i++) {
        const t = i / 8;
        const q = pt(80 - t * 200, y - 58 + t * 46);
        s += `<path d="${ellipse(pt(q.x, q.y + 4), 22, 12)}" fill="${leaf}" stroke="${ice ? '#8aa0c0' : INK}" stroke-width="1.8"/>`;
        if (ice) s += `<path d="M${f(q.x - 6)} ${f(q.y + 12)} l4 18 l4 -18Z" fill="#bfe6ff" stroke="#6a8ab0" stroke-width="1.2"/>`;
        else if (i % 2) s += `<path d="${ellipse(pt(q.x - 6, q.y), 8, 4)}" fill="#9ad06a"/>`;
      }
      return { svg: s, back, act: 'duck', w: 200, top: y - 80, bottom: y + 8 };
    }
    case 'garland':
    case 'rosearch':
    case 'arch': {
      const y = -DUCK_GAP;
      let s = '';
      if (id === 'arch') {
        // a natural red rock arch
        // the far pillar stands behind the lane, the near one in front, so the runner passes between them
        const back = inked([{ d: blob([pt(60, 2), pt(56, y - 40), pt(100, y - 50), pt(104, 2)], 0.5), fill: '#a84a2e' }], '#6a2416', 2.6);
        s += inked([{ d: blob([pt(-104, 2), pt(-100, y - 20), pt(-60, y - 90), pt(60, y - 96), pt(104, y - 30), pt(70, y - 4), pt(40, y), pt(-40, y + 4), pt(-60, y + 30), pt(-60, 2)], 0.6), fill: '#c4603e' }], '#6a2416', 2.6);
        for (let i = 1; i < 4; i++) s += `<path d="M-90 ${y - 70 + i * 22} q90 -20 180 0" stroke="#e8885a" stroke-width="3" fill="none" opacity=".5"/>`;
        return { svg: s, back, act: 'duck', w: 200, top: y - 96, bottom: y + 4 };
      }
      const rose = id === 'rosearch';
      // two posts and a swag of flowers between them
      const post = (x: number) => inked([{ d: blob([pt(x - 7, 2), pt(x - 7, y - 60), pt(x + 7, y - 60), pt(x + 7, 2)], 0.2), fill: rose ? '#f4ecf8' : '#c98a5a' }], INK, 2);
      const back = post(90);
      s += post(-90);
      if (rose) s += `<path d="M-90 ${y - 56} Q0 ${y - 150} 90 ${y - 56}" stroke="${INK}" stroke-width="16" fill="none"/><path d="M-90 ${y - 56} Q0 ${y - 150} 90 ${y - 56}" stroke="#3f8f48" stroke-width="12" fill="none"/>`;
      const swag = (t: number) => pt(-90 + t * 180, y - 40 + (rose ? -54 * 4 * t * (1 - t) : 30 * 4 * t * (1 - t)));
      s += `<path d="${curve(Array.from({ length: 9 }, (_, i) => swag(i / 8)))}" stroke="${INK}" stroke-width="12" fill="none" stroke-linecap="round"/><path d="${curve(Array.from({ length: 9 }, (_, i) => swag(i / 8)))}" stroke="#4a9a48" stroke-width="8" fill="none" stroke-linecap="round"/>`;
      for (let i = 0; i <= 10; i++) {
        const q = swag(i / 10);
        s += blossom(q.x, q.y, 8, rose ? ['#ff7aa8', '#ffffff', '#e8344e'][i % 3] : ['#ff9ec8', '#ffd23f', '#ffffff', '#c9a0ff'][i % 4]);
      }
      if (!rose) for (let i = 1; i < 6; i++) {
        const q = swag(i / 6);
        s += `<path d="M${f(q.x)} ${f(q.y + 6)} l-8 22 h16Z" fill="${['#ff7aa8', '#7fc4ff', '#ffd23f'][i % 3]}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`;
      }
      return { svg: s, back, act: 'duck', w: 200, top: y - (rose ? 150 : 70), bottom: y + (rose ? 0 : 30) };
    }
  }
}

// ---------------------------------------------------------------- candies

export type CandyId = 'wrapped' | 'lolly' | 'swirl' | 'gold';
export const CANDIES: CandyId[] = ['wrapped', 'lolly', 'swirl', 'gold'];
const CANDY_COLS = [['#ff7aa8', '#ffd1e3'], ['#7fc4ff', '#d8efff'], ['#b197fc', '#ece4ff'], ['#69db7c', '#d8f7dc'], ['#ffa94d', '#ffe3c4']];

/** A candy floating above the track, about 60 units wide, with a soft glow. `tone` picks its colours. */
export function candy(id: CandyId, tone = 0): string {
  const [c1, c2] = id === 'gold' ? ['#ffcf3a', '#fff3b8'] : CANDY_COLS[tone % CANDY_COLS.length];
  const u = `c${(uidN++).toString(36)}`;
  let s = `<defs>${radG(`${u}glow`, [[0, '#fffbe0', 0.9], [0.5, '#fff3b8', 0.4], [1, '#fff3b8', 0]])}${radG(`${u}b`, [[0, '#ffffff'], [0.35, c2], [1, c1]], 0.35, 0.3, 0.75)}</defs>`;
  s += `<circle cx="0" cy="0" r="${id === 'gold' ? 54 : 44}" fill="url(#${u}glow)"/>`;
  if (id === 'wrapped') {
    s += inked([
      { d: blob([pt(-16, -4), pt(-36, -20), pt(-40, 0), pt(-36, 20), pt(-16, 4)], 0.6), fill: c1 },
      { d: blob([pt(16, -4), pt(36, -20), pt(40, 0), pt(36, 20), pt(16, 4)], 0.6), fill: c1 },
      { d: ellipse(pt(0, 0), 20, 16), fill: `url(#${u}b)` },
    ], '#6a3a4a', 2);
    s += `<path d="M-10 -12 q4 12 0 24 M2 -15 q4 15 0 30 M12 -12 q4 12 0 24" stroke="#fff" stroke-width="3" fill="none" opacity=".75"/>`;
    s += `<path d="M-34 -10 l6 8 M-34 8 l6 -6 M34 -10 l-6 8 M34 8 l-6 -6" stroke="${shade(c1, -0.25)}" stroke-width="1.6"/>`;
  } else if (id === 'lolly') {
    s += `<path d="M0 12 V44" stroke="#6a3a4a" stroke-width="7" stroke-linecap="round"/><path d="M0 12 V44" stroke="#fff6e8" stroke-width="4" stroke-linecap="round"/>`;
    s += inked([{ d: circle(pt(0, -6), 22), fill: `url(#${u}b)` }], '#6a3a4a', 2);
    // a spiral of colour
    let sp = '';
    for (let i = 0; i <= 40; i++) {
      const a = i * 0.42;
      const rr = (i / 40) * 19;
      sp += `${i ? 'L' : 'M'}${f(Math.cos(a) * rr)} ${f(-6 + Math.sin(a) * rr)}`;
    }
    s += `<path d="${sp}" stroke="#fff" stroke-width="4.6" fill="none" stroke-linecap="round" opacity=".9"/>`;
  } else if (id === 'swirl') {
    s += inked([{ d: circle(pt(0, 0), 20), fill: c1 }], '#6a3a4a', 2);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      s += `<path d="M0 0 Q${f(Math.cos(a) * 18)} ${f(Math.sin(a) * 18)} ${f(Math.cos(a + 0.9) * 20)} ${f(Math.sin(a + 0.9) * 20)}" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".85"/>`;
    }
  } else {
    // the rare golden star candy
    s += star(pt(0, 0), 28, `url(#${u}b)`, '#8a5a10').replace('stroke-width="1.2"', 'stroke-width="2.4"');
    s += `<circle cx="-7" cy="-8" r="4" fill="#fff" opacity=".8"/>`;
  }
  s += `<circle cx="-8" cy="-10" r="3.6" fill="#fff" opacity=".85"/>`;
  // sparkles
  [[30, -28, 5], [-32, 24, 4], [34, 22, 3]].forEach(([x, y, r]) => (s += `<path d="M${x} ${y - r * 2} L${x + r * 0.5} ${y} L${x} ${y + r * 2} L${x - r * 0.5} ${y}Z M${x - r * 2} ${y} L${x} ${y - r * 0.5} L${x + r * 2} ${y} L${x} ${y + r * 0.5}Z" fill="#fff"/>`));
  return s;
}
