// Debug pages (open with ?debug=...). They render test sheets for screenshots and expose numbers on `window`
// so Playwright can check the art without anyone looking at it by hand.
//   ?debug=beads   every shape in every design
//   ?debug=places  every place with a full bracelet
//   ?debug=rig     slot geometry checks (window.__rig)
//   ?debug=og      the 1200x630 link-preview image
//   ?debug=icon    the app icon (add &size=512)
//   ?debug=play    the game itself, with window.game exposed (add &place=woods&beads=round:blue,leaf:green)

import { COLOR_IDS, PATTERN_IDS, PLACES, SHAPE_WORD, SLOTS, type Bead, type ShapeId } from './content';
import { beadSVG } from './art/beads';
import { BH, BW, braceletSVG, photoSVG, placeArt, slotGeometry } from './scene';
import { $ } from './dom';

function page(html: string, css = '') {
  $('app').innerHTML = `<div id="sheet" style="position:absolute;inset:0;overflow:auto;background:#fdf6e8;padding:12px;font-family:Fredoka,system-ui,sans-serif;color:#2c4a7c">${html}</div><style>${css}</style>`;
}

function sample(place: (typeof PLACES)[number]): Bead[] {
  return Array.from({ length: SLOTS }, (_, i) => ({
    shape: place.shapes[(i * 2 + (i > 5 ? 1 : 0)) % place.shapes.length],
    design: [...place.colors, ...place.patterns][(i * 5) % 12],
  }));
}

export async function runDebug(kind: string, params: URLSearchParams): Promise<boolean> {
  const w = window as unknown as Record<string, unknown>;
  if (kind === 'beads') {
    const shapes = Object.keys(SHAPE_WORD) as ShapeId[];
    const designs = [...COLOR_IDS, ...PATTERN_IDS];
    page(
      `<table style="border-collapse:collapse">${shapes.map((s) => `<tr><th style="text-align:right;padding-right:8px;font-size:12px">${s}</th>${designs.map((d) => `<td title="${s} ${d}">${beadSVG(s, d, 56)}</td>`).join('')}</tr>`).join('')}</table>`,
    );
    w.__beads = { shapes: shapes.length, designs: designs.length };
    return true;
  }
  if (kind === 'places') {
    page(
      `<div style="display:flex;flex-wrap:wrap;gap:12px">${PLACES.map((p) => `<figure style="margin:0;width:300px"><div style="width:300px">${photoSVG(p.id, sample(p)).replace(/width="800" height="1400"/, 'width="300" height="525"')}</div><figcaption>${p.name}</figcaption></figure>`).join('')}</div>`,
    );
    w.__places = PLACES.length;
    return true;
  }
  if (kind === 'rig') {
    const geo = slotGeometry();
    const gaps = geo.slice(1).map((g, i) => Math.hypot(g.x - geo[i].x, g.y - geo[i].y) - (g.size + geo[i].size) / 2);
    w.__rig = {
      slots: geo.length,
      maxOverlap: Math.max(0, ...gaps.map((g) => -g)),
      minGap: Math.min(...gaps),
      inside: geo.every((g) => g.x - g.size / 2 >= 0 && g.x + g.size / 2 <= BW && g.y - g.size / 2 >= 0 && g.y + g.size / 2 <= BH),
      // every bead must stay on the table top (ellipse centred 200,190 with radii 188 x 86)
      onTable: geo.every((g) => ((g.x - 200) / 188) ** 2 + ((g.y + g.size / 2 - 190) / 86) ** 2 <= 1),
    };
    page('<pre>' + JSON.stringify(w.__rig, null, 2) + '</pre>');
    return true;
  }
  if (kind === 'og') {
    const p = PLACES[0];
    document.body.style.cssText = 'margin:0;background:#fff';
    $('app').style.cssText = 'position:static;width:1200px;height:630px;overflow:hidden';
    $('app').innerHTML = `<div id="og" style="position:relative;width:1200px;height:630px;overflow:hidden;font-family:Fredoka,system-ui,sans-serif">
      <svg viewBox="0 190 400 190" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:1200px;height:630px">${placeArt(p.id)}</svg>
      <div style="position:absolute;left:60px;top:50px;background:#fdf6e8;border-radius:44px;padding:30px 48px;box-shadow:0 12px 30px rgba(40,70,120,.25)">
        <div style="font-size:120px;font-weight:600;color:#2c4a7c;line-height:1">Bead Box</div>
        <div style="font-size:38px;color:#4a8fe3;margin-top:12px">make bracelets · learn English words</div></div>
      <div style="position:absolute;left:520px;top:262px;width:640px">${braceletSVG(p.id, sample(p)).replace('viewBox="0 0 400 290"', 'viewBox="0 60 400 230"')}</div></div>`;
    return true;
  }
  if (kind === 'icon') {
    const size = Number(params.get('size')) || 512;
    document.body.style.cssText = 'margin:0;background:#fff';
    $('app').style.cssText = `position:static;width:${size}px;height:${size}px`;
    const cols = ['blue', 'pink', 'yellow', 'green', 'purple', 'orange', 'white', 'red'] as const;
    const beads = cols.map((d, i) => {
      const a = (i / cols.length) * Math.PI * 2 - Math.PI / 2;
      return `<g transform="translate(${(256 + Math.cos(a) * 142).toFixed(1)} ${(256 + Math.sin(a) * 142).toFixed(1)}) scale(1.02) translate(-50 -50)">${beadSVG(i % 3 === 1 ? 'flower' : i % 3 === 2 ? 'star' : 'round', d, 100, false).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`;
    }).join('');
    $('app').innerHTML = `<svg id="icon" viewBox="0 0 512 512" width="${size}" height="${size}"><defs><linearGradient id="ig" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fc3f5"/><stop offset="1" stop-color="#f6dcae"/></linearGradient></defs>
      <rect width="512" height="512" fill="url(#ig)"/><circle cx="256" cy="256" r="142" fill="none" stroke="#b9854d" stroke-width="14"/>${beads}</svg>`;
    return true;
  }
  return kind !== 'play';
}
