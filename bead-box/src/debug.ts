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
import { BH, BW, braceletSVG, scenePicture, slotGeometry, tablePicture } from './scene';
import { makePhoto } from './photo';
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
    if (params.get('zoom')) {
      // big beads for judging the finish: every design on a round bead, then every shape in a few designs, front and side view
      const big = (sh: ShapeId, d: (typeof designs)[number], size: number, view: 'front' | 'side' = 'front') => `<span style="display:inline-block;margin:2px">${beadSVG(sh, d, size, true, view)}</span>`;
      page(
        `<div>${designs.map((d) => big('round', d, 150)).join('')}</div><hr/>` +
          shapes.map((s) => `<div>${(['blue', 'pink', 'white', 'gold', 'glitter'] as const).map((d) => big(s, d, 120)).join('')}${big(s, 'green', 120, 'side')}${big(s, 'stripes', 120, 'side')}</div>`).join(''),
      );
      w.__beads = { shapes: shapes.length, designs: designs.length };
      return true;
    }
    page(
      `<table style="border-collapse:collapse">${shapes.map((s) => `<tr><th style="text-align:right;padding-right:8px;font-size:12px">${s}</th>${designs.map((d) => `<td title="${s} ${d}">${beadSVG(s, d, 56)}</td>`).join('')}</tr>`).join('')}</table>`,
    );
    w.__beads = { shapes: shapes.length, designs: designs.length };
    return true;
  }
  if (kind === 'scene') {
    // one painted scenery picture, full size: ?debug=scene&place=beach&scale=2
    const t0 = performance.now();
    const pic = await scenePicture(params.get('place') ?? 'beach', Number(params.get('scale')) || 2);
    // how much detail did it paint? count distinct colours (4 bits per channel) over a sample of pixels
    const px = pic.canvas.getContext('2d')!.getImageData(0, 0, pic.canvas.width, pic.canvas.height).data;
    const seen = new Map<number, number>();
    let n = 0;
    for (let i = 0; i < px.length; i += 4 * 29) {
      const k = ((px[i] >> 4) << 8) | ((px[i + 1] >> 4) << 4) | (px[i + 2] >> 4);
      seen.set(k, (seen.get(k) ?? 0) + 1);
      n++;
    }
    w.__scene = { ms: Math.round(performance.now() - t0), w: pic.canvas.width, h: pic.canvas.height, colors: seen.size, dominant: Math.max(...seen.values()) / n };
    document.body.style.cssText = 'margin:0;background:#222';
    $('app').style.cssText = 'position:static';
    $('app').innerHTML = `<img id="pic" src="${pic.url}" style="display:block;width:${pic.canvas.width / 2}px;height:${pic.canvas.height / 2}px" alt="">`;
    return true;
  }
  if (kind === 'photo') {
    // one finished album picture at full size: ?debug=photo&place=beach
    const place = PLACES.find((p) => p.id === params.get('place')) ?? PLACES[0];
    const { png } = await makePhoto(place.id, sample(place));
    document.body.style.cssText = 'margin:0;background:#222';
    $('app').style.cssText = 'position:static';
    $('app').innerHTML = `<img id="photo" src="${png}" style="display:block;width:560px" alt="">`;
    w.__photo = true;
    return true;
  }
  if (kind === 'places') {
    // every place as the finished album picture, one after another
    page('<div id="grid" style="display:flex;flex-wrap:wrap;gap:12px"></div>');
    const t0 = performance.now();
    for (const p of PLACES) {
      const { png } = await makePhoto(p.id, sample(p));
      $('grid').insertAdjacentHTML('beforeend', `<figure style="margin:0;width:300px"><img src="${png}" style="width:300px;display:block" alt="${p.name}"/><figcaption>${p.name}</figcaption></figure>`);
    }
    w.__places = { count: PLACES.length, ms: Math.round(performance.now() - t0) };
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
      // every bead must stay on the table top (ellipse centred 200,196 with radii 192 x 100)
      onTable: geo.every((g) => ((g.x - 200) / 192) ** 2 + ((g.y + g.size / 2 - 196) / 100) ** 2 <= 1),
    };
    page('<pre>' + JSON.stringify(w.__rig, null, 2) + '</pre>');
    return true;
  }
  if (kind === 'og') {
    const p = PLACES[0];
    const [scene, table] = await Promise.all([scenePicture(p.id, 2), tablePicture(p.id, 2)]);
    document.body.style.cssText = 'margin:0;background:#fff';
    $('app').style.cssText = 'position:static;width:1200px;height:630px;overflow:hidden';
    $('app').innerHTML = `<div id="og" style="position:relative;width:1200px;height:630px;overflow:hidden;font-family:Fredoka,system-ui,sans-serif">
      <img src="${scene.url}" alt="" style="position:absolute;inset:0;width:1200px;height:630px;object-fit:cover;object-position:50% 58%"/>
      <div style="position:absolute;left:60px;top:50px;background:#fdf6e8;border-radius:44px;padding:30px 48px;box-shadow:0 12px 30px rgba(40,70,120,.25)">
        <div style="font-size:120px;font-weight:600;color:#2c4a7c;line-height:1">Bead Box</div>
        <div style="font-size:38px;color:#4a8fe3;margin-top:12px">make bracelets · learn English words</div></div>
      <div style="position:absolute;left:500px;top:226px;width:680px">${braceletSVG(sample(p), {}, table.url).replace(/viewBox="0 \d+ 400 \d+"/, 'viewBox="0 56 400 294"')}</div></div>`;
    await Promise.all([...document.images].map((i) => i.decode().catch(() => undefined)));
    await document.fonts?.ready;
    w.__ready = true;
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
