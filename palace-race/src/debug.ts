// Debug pages (open with ?debug=...). They render test sheets for screenshots and expose numbers on `window`
// so Playwright can check the art without anyone looking at it by hand.
//   ?debug=animals   every animal in every pose (window.__animals has the anchors)
//   ?debug=music     every music mood rendered offline (levels, Play buttons, window.__wav)
//   ?debug=riders, hair, helmets, wardrobe, faces, palace, obstacles, track, podium, icons, mock, og   art sheets and stills
//   ?debug=rig, seams   numbers for the tests (window.__rig, window.__seams)

import { ANIMALS, POSES, drawAnimal } from './art/animals';
import { RUNNER_BOX, RUNNER_DRAW, paint } from './art/sprite';
import { RIDER_SCALE, drawRunner } from './art/runner';
import { DUCK_GAP, JUMP_PEAK, type ObstacleId } from './art/props';
import { simulate, simulateAll } from './race/calibrate';
import { Race } from './race/sim';
import { runRace } from './race/race';
import { sfx } from './sfx';
import { podiumSVG } from './art/podium';
import { MOOD_IDS, renderMusic } from './music';
import { meadow } from './art/meadow';
import { palace } from './art/palace';
import { ICONS } from './art/icons';
import { CANDIES, TRACK_OBSTACLES, candy, obstacle } from './art/props';
import { LANE_SCALE, LANE_Y, LAYERS, PARALLAX, STAGE_H, STAGE_W, trackLayer, type TrackId } from './art/tracks';
import { drawKid, HAIRS, HELMETS, KIDS, PLAIN, RIDER_POSES, HIP_H, type Outfit } from './art/riders';

function page(html: string) {
  document.getElementById('app')!.innerHTML = `<div id="sheet" style="position:absolute;inset:0;overflow:auto;background:#fdf6e8;padding:12px;direction:ltr">${html}</div>`;
  return document.getElementById('sheet')!;
}

const ground = (w: number) => `<rect x="${RUNNER_BOX.x}" y="0" width="${w}" height="20" fill="#d8c08a"/>`;

export async function runDebug(kind: string, params: URLSearchParams): Promise<boolean> {
  const w = window as unknown as Record<string, unknown>;
  if (kind === 'animals') {
    const only = params.get('animal');
    const poses = params.get('pose')?.split(',') ?? POSES;
    const scale = Number(params.get('scale')) || 0.5;
    const sheet = page('');
    const report: Record<string, unknown> = {};
    for (const a of ANIMALS.filter((x) => !only || x === only)) {
      const row = document.createElement('div');
      row.style.whiteSpace = 'nowrap';
      sheet.appendChild(row);
      for (const p of poses) {
        const art = drawAnimal(a, p as never);
        report[`${a}:${p}`] = art.anchors;
        const cv = await paint(ground(RUNNER_BOX.w) + art.svg, RUNNER_BOX, scale);
        cv.title = `${a} ${p}`;
        row.appendChild(cv);
      }
    }
    w.__animals = report;
    w.__ready = true;
    return true;
  }
  if (kind === 'track') {
    // one track, all its layers stacked, scrolled by ?x= (ground units); &tiles=2 shows two tiles side by side
    const id = (params.get('track') ?? 'forest') as TrackId;
    const x = Number(params.get('x')) || 0;
    const scale = Number(params.get('scale')) || 1;
    const t0 = performance.now();
    const pics = await Promise.all(LAYERS.map((l) => paint(trackLayer(id, l), { x: 0, y: 0, w: STAGE_W, h: STAGE_H }, scale)));
    const ms = performance.now() - t0;
    const out = document.createElement('canvas');
    out.width = STAGE_W * scale;
    out.height = STAGE_H * scale;
    out.id = 'stage';
    const g = out.getContext('2d')!;
    pics.forEach((pc, i) => {
      const off = -((x * PARALLAX[LAYERS[i]] * scale) % out.width);
      g.drawImage(pc, off, 0);
      if (off < 0) g.drawImage(pc, off + out.width, 0);
    });
    const sheet = page('');
    sheet.style.padding = '0';
    sheet.appendChild(out);
    w.__scene = { ms: Math.round(ms) };
    w.__ready = true;
    return true;
  }
  if (kind === 'obstacles') {
    // every track's obstacles, each with a runner beside it (ducking under the overhead ones), then the candies
    const scale = Number(params.get('scale')) || 0.5;
    const sheet = page('');
    const heights: Record<string, number> = {};
    for (const a of ANIMALS) for (const p of ['run0', 'run2', 'run4', 'duck', 'jump'] as const) heights[`${a}:${p}`] = Math.round(drawRunner(a, 'maya', p, PLAIN).top);
    for (const t of Object.keys(TRACK_OBSTACLES) as (keyof typeof TRACK_OBSTACLES)[]) {
      const row = document.createElement('div');
      row.style.whiteSpace = 'nowrap';
      sheet.appendChild(row);
      for (const id of TRACK_OBSTACLES[t]) {
        const o = obstacle(id, t);
        const who = o.act === 'duck' ? drawRunner('reindeer', 'yoav', 'duck', PLAIN).svg : '';
        row.appendChild(await paint(ground(RUNNER_BOX.w) + o.back + who + o.svg + `<rect x="-140" y="${o.top}" width="280" height="${o.bottom - o.top}" fill="none" stroke="#f0f" stroke-dasharray="4 4" opacity=".5"/>`, RUNNER_BOX, scale));
      }
    }
    const row = document.createElement('div');
    sheet.appendChild(row);
    for (const [i, c] of CANDIES.entries()) row.appendChild(await paint(candy(c, i), { x: -60, y: -60, w: 120, h: 120 }, scale * 2));
    w.__heights = heights;
    w.__ready = true;
    return true;
  }
  if (kind === 'mock') {
    // a still of one moment in a race, with the HUD and touch buttons: ?debug=mock&track=forest
    const id = (params.get('track') ?? 'forest') as TrackId;
    const obst = TRACK_OBSTACLES[id];
    const app = document.getElementById('app')!;
    app.innerHTML = `<div class="race"><canvas class="stage"></canvas><div id="hints"></div><div class="hud">
      <div class="row">
        <div class="speed"><button class="round-btn" aria-label="עצירה">${ICONS.pause}</button><div class="bar"><div class="fill"></div></div></div>
        <div class="place" aria-label="מקום ראשון">1</div>
        <div class="pills"><div class="pill">${ICONS.candy}<span>5</span></div><div class="pill">${ICONS.coin}<span>120</span></div></div>
      </div>
      <div class="progress"><div class="dot" style="left:52%;background:#7fb6ff"></div><div class="dot" style="left:40%;background:#ffcf5a"></div><div class="dot" style="left:31%;background:#e8672e"></div><div class="dot" style="left:24%;background:#c9a0ff"></div><div class="dot me" style="left:58%"></div><div class="goal">${ICONS.palace}</div></div>
      <div class="pad left"><button class="round-btn" aria-label="מסלול רחוק">${ICONS.laneFar}</button><button class="round-btn" aria-label="מסלול קרוב">${ICONS.laneNear}</button></div>
      <div class="pad right"><button class="round-btn" id="btn-jump" aria-label="קפיצה">${ICONS.up}</button><button class="round-btn" aria-label="התכופפות">${ICONS.down}</button></div>
      <div class="tutor" id="tutor">${ICONS.hand}</div>
    </div></div>`;
    const cv = app.querySelector('canvas')!;
    cv.width = STAGE_W;
    cv.height = STAGE_H;
    const g = cv.getContext('2d')!;
    const scroll = 260;
    const pics = await Promise.all(LAYERS.map((l) => paint(trackLayer(id, l), { x: 0, y: 0, w: STAGE_W, h: STAGE_H }, 1)));
    // things on the track, far lane first: [x, lane, svg]
    const R = RUNNER_DRAW;
    const items: { x: number; lane: number; svg: string; box: typeof RUNNER_BOX }[] = [];
    const runners: [typeof ANIMALS[number], 'maya' | 'tamar' | 'yoav' | 'ari', number, number, string, Outfit][] = [
      ['deer', 'tamar', 0, 380, 'run2', PLAIN],
      ['dragon', 'ari', 0, 1230, 'run4', PLAIN],
      ['unicorn', 'maya', 1, 690, 'run1', { helmet: 'rainbow', hair: 'pink', saddle: 'royal' }],
      ['reindeer', 'yoav', 2, 210, 'run3', PLAIN],
      ['horse', 'maya', 2, 1420, 'run0', { helmet: 'stars', hair: 'none', saddle: 'stars' }],
    ];
    const o1 = obstacle(obst[0], id);
    const o2 = obstacle(obst[2], id);
    const shadow = (me: boolean) => (me ? `<ellipse cx="0" cy="0" rx="190" ry="26" fill="#fff3a0" opacity=".55"/>` : '') + `<ellipse cx="-10" cy="2" rx="150" ry="16" fill="#4a2a10" opacity=".22"/>`;
    for (const [a, k, lane, x, p, o] of runners) items.push({ x, lane, svg: shadow(a === 'unicorn') + drawRunner(a, k, p as never, o).svg, box: RUNNER_BOX });
    items.push({ x: 1090, lane: 1, svg: o1.back + o1.svg, box: RUNNER_BOX });
    items.push({ x: 820, lane: 0, svg: o2.back + o2.svg, box: RUNNER_BOX });
    [[900, 1, 150, 'wrapped', 0], [1240, 1, 190, 'lolly', 1], [1500, 0, 170, 'swirl', 2], [760, 2, 160, 'gold', 0], [1000, 2, 150, 'wrapped', 3]].forEach(([x, lane, h, c, t]) =>
      items.push({ x: x as number, lane: lane as number, svg: `<g transform="translate(0 ${-(h as number)})">${candy(c as never, t as number)}</g>`, box: RUNNER_BOX }));
    items.sort((p, q) => p.lane - q.lane);
    const drawLayer = (i: number) => {
      const off = -((scroll * PARALLAX[LAYERS[i]]) % STAGE_W);
      g.drawImage(pics[i], off, 0);
      g.drawImage(pics[i], off + STAGE_W, 0);
    };
    for (let i = 0; i < 4; i++) drawLayer(i);
    for (const it of items) {
      const k = R * LANE_SCALE[it.lane];
      const pic = await paint(it.svg, it.box, k * 1.5);
      g.drawImage(pic, it.x + it.box.x * k, LANE_Y[it.lane] + it.box.y * k, it.box.w * k, it.box.h * k);
    }
    drawLayer(4);
    // the hint bubble above the next obstacle, placed in screen space from stage space
    const place = () => {
      const r = cv.getBoundingClientRect();
      const sc = Math.max(r.width / STAGE_W, r.height / STAGE_H);
      const ox = (r.width - STAGE_W * sc) * 0.42;
      const oy = r.height - STAGE_H * sc;
      const hint = (x: number, y: number, icon: string) => `<div class="hint" style="left:${ox + x * sc}px;top:${oy + y * sc}px">${icon}</div>`;
      document.getElementById('hints')!.innerHTML = hint(1090, LANE_Y[1] + o1.top * R * LANE_SCALE[1] - 10, ICONS.up);
      const jb = document.getElementById('btn-jump')!.getBoundingClientRect();
      const t = document.getElementById('tutor')!;
      t.style.left = `${jb.left - 40}px`;
      t.style.top = `${jb.top + jb.height * 0.4}px`;
    };
    place();
    addEventListener('resize', place);
    await document.fonts.ready;
    w.__ready = true;
    return true;
  }
  if (kind === 'og') {
    // the 1200 x 630 link preview: a race moment with the logo
    const id = 'forest';
    const pics = await Promise.all(LAYERS.map((l) => paint(trackLayer(id, l), { x: 0, y: 0, w: STAGE_W, h: STAGE_H }, 1)));
    const cv = document.createElement('canvas');
    cv.width = STAGE_W;
    cv.height = STAGE_H;
    const g = cv.getContext('2d')!;
    for (let i = 0; i < 4; i++) g.drawImage(pics[i], i === 0 ? 0 : -300 * PARALLAX[LAYERS[i]], 0), i && g.drawImage(pics[i], STAGE_W - 300 * PARALLAX[LAYERS[i]], 0);
    const R = 0.9;
    const put = async (svg: string, lane: number, x: number) => {
      const k = R * LANE_SCALE[lane];
      const pic = await paint(svg, RUNNER_BOX, k * 1.5);
      g.drawImage(pic, x + RUNNER_BOX.x * k, LANE_Y[lane] + RUNNER_BOX.y * k, RUNNER_BOX.w * k, RUNNER_BOX.h * k);
    };
    const sh = `<ellipse cx="-10" cy="2" rx="150" ry="16" fill="#4a2a10" opacity=".22"/>`;
    await put(sh + drawRunner('dragon', 'ari', 'run4', PLAIN).svg, 0, 1250);
    await put(sh + drawRunner('deer', 'tamar', 'run2', PLAIN).svg, 0, 980);
    await put(sh + drawRunner('reindeer', 'yoav', 'run3', PLAIN).svg, 1, 1380);
    await put(`<g transform="translate(0 -170)">${candy('gold', 0)}</g>`, 1, 820);
    await put(sh + drawRunner('unicorn', 'maya', 'run1', { helmet: 'rainbow', hair: 'pink', saddle: 'royal' }).svg, 2, 1090);
    await put(sh + drawRunner('horse', 'maya', 'run0', { helmet: 'stars', hair: 'none', saddle: 'stars' }).svg, 2, 1470);
    const url = cv.toDataURL('image/png');
    page(`<div id="og" style="position:relative;width:1200px;height:630px;overflow:hidden;background:url(${url}) 70% 100%/cover no-repeat">
      <img id="og-logo" src="/logo-small.webp" alt="" style="position:absolute;left:26px;top:14px;width:360px"></div>`).style.padding = '0';
    await document.querySelector<HTMLImageElement>('#og-logo')!.decode().catch(() => {});
    w.__ready = true;
    return true;
  }
  if (kind === 'race') {
    // a race straight away: ?debug=race&track=forest&animal=unicorn&kid=maya&seed=3&autopilot=0.9&speed=4&tutorial=1
    const ap = params.get('autopilot');
    const res = runRace(document.getElementById('app')!, {
      track: (params.get('track') ?? 'forest') as TrackId,
      animal: (params.get('animal') ?? 'unicorn') as never,
      kid: (params.get('kid') ?? 'maya') as never,
      outfit: { helmet: (params.get('helmet') ?? 'rainbow') as never, hair: (params.get('hair') ?? 'pink') as never, saddle: (params.get('saddle') ?? 'royal') as never },
      seed: Number(params.get('seed')) || 1,
      tutorial: params.get('tutorial') === '1',
      help: params.get('help') !== '0',
      autopilot: ap === null ? undefined : Number(ap),
      speed: Number(params.get('speed')) || 1,
      coins: 120,
    }, { onSoundToggle: () => (sfx.enabled = !sfx.enabled), soundOn: () => sfx.enabled });
    addEventListener('pointerdown', () => sfx.unlock(), { once: true });
    w.__ready = true;
    w.__result = null;
    void res.then((r) => (w.__result = r));
    return true;
  }
  if (kind === 'music') {
    // every mood rendered offline: levels for the checks, a Play button to listen, and WAV data for review
    // (?debug=music&s=20&moods=menu,forest)
    const secs = Number(params.get('s')) || 16;
    const moods = (params.get('moods')?.split(',') ?? MOOD_IDS) as typeof MOOD_IDS;
    const sheet = page('<p>Music moods, rendered offline</p>');
    const out: Record<string, { peak: number; rms: number; ms: number; quietFrom: number }> = {};
    const wav: Record<string, string> = {};
    let ctx: AudioContext | null = null;
    for (const m of moods) {
      const t0 = performance.now();
      const { buf, notes } = await renderMusic(m, secs);
      (w.__notes ??= {} as Record<string, unknown>) as Record<string, unknown>;
      (w.__notes as Record<string, unknown>)[m] = notes;
      let peak = 0;
      let sum = 0;
      const L = buf.getChannelData(0);
      const R = buf.getChannelData(1);
      for (let i = 0; i < L.length; i++) {
        peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
        sum += L[i] * L[i] + R[i] * R[i];
      }
      out[m] = { peak, rms: Math.sqrt(sum / (2 * L.length)), ms: Math.round(performance.now() - t0), quietFrom: 0 };
      wav[m] = toWav(buf);
      const b = document.createElement('button');
      b.textContent = `▶ ${m} (peak ${peak.toFixed(2)}, rms ${out[m].rms.toFixed(3)})`;
      b.style.cssText = 'display:block;margin:8px;font:16px sans-serif;padding:8px 14px';
      b.onclick = () => {
        ctx ??= new AudioContext();
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start();
      };
      sheet.appendChild(b);
    }
    w.__music = out;
    w.__wav = wav;
    w.__ready = true;
    return true;
  }
  if (kind === 'sim') {
    // many races without drawing: how often each kind of player wins, how close it is, how slow it ever gets
    const n = Number(params.get('n')) || 60;
    const t0 = performance.now();
    const rep = simulateAll(n);
    w.__sim = rep;
    // the same seed and inputs always give the same race
    const a = simulate('average', 'meadow', 3, 77);
    const b = simulate('average', 'meadow', 3, 77);
    w.__det = JSON.stringify(a) === JSON.stringify(b);
    // candies are shared: one an opponent took is still there for the child
    const shared = new Race({ track: 'meadow', seed: 5, autopilot: 1 });
    shared.started = true;
    for (let i = 0; i < 30 * 200 && !shared.done; i++) shared.step(1 / 30);
    w.__shared = shared.course.candies.filter((c) => c.taken.includes(shared.player) && c.taken.some((id) => id !== shared.player)).length;
    const rows = Object.entries(rep).map(([k, r]) => `<tr><td>${k}</td>${[r.winRate, r.medalRate, r.avgPlace, r.worstPlace, r.minCoins, r.minTime, r.maxTime, r.maxGap, r.minSpeed, r.obstacles].map((v) => `<td>${typeof v === 'number' ? v.toFixed(2) : v}</td>`).join('')}</tr>`).join('');
    page(`<p>${n} races each, ${Math.round(performance.now() - t0)} ms</p><table border="1" cellpadding="4" style="border-collapse:collapse;font:13px monospace"><tr><th></th><th>win</th><th>medal</th><th>avg place</th><th>worst</th><th>min coins</th><th>min s</th><th>max s</th><th>max gap s</th><th>min speed</th><th>obstacles</th></tr>${rows}</table>`);
    w.__ready = true;
    return true;
  }
  if (kind === 'meadow') {
    // the home screen's background on its own (?debug=meadow)
    const pic = await paint(trackLayer('garden', 'sky') + meadow(), { x: 0, y: 0, w: STAGE_W, h: STAGE_H }, Number(params.get('scale')) || 1);
    page('').appendChild(pic);
    w.__ready = true;
    return true;
  }
  if (kind === 'palace') {
    // the palace close up, on a night sky like the logo's and on a day sky
    const sheet = page('');
    for (const bg of ['#2a2370', '#bfe0f6']) sheet.appendChild(await paint(`<rect x="-320" y="-520" width="640" height="620" fill="${bg}"/>` + palace(0, 0, 1), { x: -320, y: -520, w: 640, h: 620 }, 1));
    w.__ready = true;
    return true;
  }
  if (kind === 'faces') {
    // close-ups of every animal's and every child's face, normal and happy, to judge them
    const sheet = page('');
    const box = 150;
    for (const a of ANIMALS) {
      const row = document.createElement('div');
      row.style.whiteSpace = 'nowrap';
      sheet.appendChild(row);
      for (const p of ['stand', 'happy', 'run1'] as const) {
        const art = drawAnimal(a, p);
        const { headTop, rein } = art.anchors;
        const cx = (headTop.x + rein.x) / 2 + 4;
        const cy = (Math.max(headTop.y, rein.y - 110) + rein.y) / 2;
        row.appendChild(await paint(`<rect x="-400" y="-400" width="900" height="900" fill="#cfe8f6"/>` + art.svg, { x: cx - box / 2 - 10, y: cy - box / 2, w: box, h: box }, 2));
      }
    }
    for (const kid of KIDS) {
      const row = document.createElement('div');
      row.style.whiteSpace = 'nowrap';
      sheet.appendChild(row);
      for (const p of ['stand', 'clap0', 'ride0'] as const) {
        const k = drawKid(kid, p, PLAIN, { x: 0, y: -HIP_H });
        row.appendChild(await paint(`<rect x="-400" y="-400" width="900" height="900" fill="#fbe6c8"/>` + k.back + k.front, { x: k.head.x - 55, y: k.head.y - 60, w: 110, h: 110 }, 2.7));
      }
    }
    w.__ready = true;
    return true;
  }
  if (kind === 'rig') {
    // numbers for the tests: every runner's anchors and height in every pose, and every obstacle's box
    const runners: Record<string, unknown> = {};
    for (const a of ANIMALS) for (const p of POSES) {
      const art = drawAnimal(a, p);
      const r = drawRunner(a, 'maya', p, PLAIN);
      runners[`${a}:${p}`] = { ...art.anchors, runnerTop: r.top, riderHead: r.head };
    }
    const obstacles: Record<string, unknown> = {};
    for (const t of Object.keys(TRACK_OBSTACLES) as TrackId[]) for (const id of TRACK_OBSTACLES[t]) obstacles[`${t}:${id}`] = (({ act, w: ww, top, bottom }) => ({ act, w: ww, top, bottom }))(obstacle(id as ObstacleId, t));
    const kidEye = Math.min(...KIDS.map((kd) => drawKid(kd, 'ride0', PLAIN, { x: 0, y: 0 }).eyeR)) * RIDER_SCALE;
    w.__rig = { runners, obstacles, DUCK_GAP, JUMP_PEAK, kidEye, draw: RUNNER_DRAW, farLane: LANE_SCALE[0] };
    w.__ready = true;
    return true;
  }
  if (kind === 'seams') {
    // for every scrolling layer of every track: how different the first and last pixel columns are (a seam shows
    // as a big difference), how long it took to paint, and how many distinct colours it has
    const out: Record<string, { seam: number; ms: number; colors: number }> = {};
    for (const t of ['forest', 'meadow', 'snow', 'canyon', 'garden'] as TrackId[]) for (const l of LAYERS) {
      const t0 = performance.now();
      const cv = await paint(trackLayer(t, l), { x: 0, y: 0, w: STAGE_W, h: STAGE_H }, 0.5);
      const ms = performance.now() - t0;
      const g = cv.getContext('2d')!;
      const a = g.getImageData(0, 0, 1, cv.height).data;
      const b = g.getImageData(cv.width - 1, 0, 1, cv.height).data;
      let d = 0;
      for (let i = 0; i < a.length; i += 4) d += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) + Math.abs(a[i + 3] - b[i + 3]);
      const px = g.getImageData(0, 0, cv.width, cv.height).data;
      const seen = new Set<number>();
      for (let i = 0; i < px.length; i += 4 * 31) if (px[i + 3] > 200) seen.add(((px[i] >> 4) << 8) | ((px[i + 1] >> 4) << 4) | (px[i + 2] >> 4));
      out[`${t}:${l}`] = { seam: d / (a.length / 4), ms: Math.round(ms), colors: seen.size };
    }
    w.__seams = out;
    w.__ready = true;
    return true;
  }
  if (kind === 'podium') {
    // the end-of-race picture: ?debug=podium&order=unicorn,horse,deer,reindeer,dragon
    const animals = (params.get('order')?.split(',') ?? ['unicorn', 'horse', 'deer', 'reindeer', 'dragon']) as typeof ANIMALS;
    const kids = ['maya', 'yoav', 'tamar', 'ari', 'maya'] as const;
    const fits: Outfit[] = [
      { helmet: 'rainbow', hair: 'pink', saddle: 'royal' },
      { helmet: 'basic', hair: 'none', saddle: 'basic' },
      { helmet: 'basic', hair: 'none', saddle: 'stars' },
      { helmet: 'basic', hair: 'none', saddle: 'basic' },
      { helmet: 'flowers', hair: 'none', saddle: 'flowers' },
    ];
    const order = animals.map((a, i) => ({ animal: a, kid: kids[i], outfit: fits[i] }));
    const scale = Number(params.get('scale')) || 1;
    const cv = await paint(podiumSVG(order, params.get('frame') === '1' ? 1 : 0), { x: 0, y: 0, w: STAGE_W, h: STAGE_H }, scale);
    cv.id = 'stage';
    const sheet = page('');
    sheet.style.padding = '0';
    sheet.appendChild(cv);
    w.__ready = true;
    return true;
  }
  if (kind === 'icons') {
    // every button icon, at phone size, on the button style the game uses
    page(`<div id="icons" style="display:flex;flex-wrap:wrap;gap:14px;max-width:760px">${Object.entries(ICONS)
      .map(([k, v]) => `<div style="display:flex;flex-direction:column;align-items:center;font:14px Fredoka,sans-serif;color:#4a2a5c"><div style="width:76px;height:76px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#f3e6ff);box-shadow:0 4px 0 #c9b6e0,0 6px 14px rgba(60,30,90,.25);display:grid;place-items:center">${v}</div>${k}</div>`)
      .join('')}</div>`);
    w.__ready = true;
    return true;
  }
  if (kind === 'riders') {
    // every child in every pose standing, then every child on every animal
    const scale = Number(params.get('scale')) || 0.6;
    const sheet = page('');
    const box = { x: -70, y: -170, w: 140, h: 190 };
    for (const kid of KIDS) {
      const row = document.createElement('div');
      row.style.whiteSpace = 'nowrap';
      sheet.appendChild(row);
      for (const p of RIDER_POSES.filter((p) => !p.startsWith('ride') && !['jump', 'duck', 'bump', 'wave'].includes(p))) {
        const k = drawKid(kid, p, PLAIN, { x: 0, y: -HIP_H });
        row.appendChild(await paint(`<rect x="-70" y="0" width="140" height="20" fill="#d8c08a"/>` + k.back + k.front, box, scale * 2));
      }
    }
    const animals = (params.get('animals')?.split(',') ?? ANIMALS) as typeof ANIMALS;
    const pose = (params.get('pose') ?? 'run1') as never;
    for (const kid of KIDS) {
      const row = document.createElement('div');
      row.style.whiteSpace = 'nowrap';
      sheet.appendChild(row);
      for (const a of animals) row.appendChild(await paint(ground(RUNNER_BOX.w) + drawRunner(a, kid, pose, PLAIN).svg, RUNNER_BOX, scale));
    }
    w.__ready = true;
    return true;
  }
  if (kind === 'helmets') {
    // every helmet on every child, standing, and riding two animals (?debug=helmets&scale=)
    const scale = Number(params.get('scale')) || 1;
    const sheet = page('');
    const box = { x: -80, y: -200, w: 160, h: 220 };
    for (const kid of KIDS) {
      const row = document.createElement('div');
      row.style.whiteSpace = 'nowrap';
      sheet.appendChild(row);
      for (const helmet of HELMETS) {
        const k = drawKid(kid, 'stand', { ...PLAIN, helmet }, { x: 0, y: -HIP_H });
        row.appendChild(await paint(`<rect x="-80" y="0" width="160" height="20" fill="#d8c08a"/>` + k.back + k.front, box, scale));
      }
      row.appendChild(await paint(ground(RUNNER_BOX.w) + drawRunner('unicorn', kid, 'run1', { ...PLAIN, helmet: 'unicorn' }).svg, RUNNER_BOX, scale * 0.42));
      row.appendChild(await paint(ground(RUNNER_BOX.w) + drawRunner('dragon', kid, 'jump', { ...PLAIN, helmet: 'knight' }).svg, RUNNER_BOX, scale * 0.42));
    }
    w.__ready = true;
    return true;
  }
  if (kind === 'hair') {
    // every hairstyle on every child, standing and riding: ?debug=hair&helmet=stars
    const scale = Number(params.get('scale')) || 1;
    const sheet = page('');
    const helmet = (params.get('helmet') ?? 'basic') as Outfit['helmet'];
    const box = { x: -80, y: -180, w: 160, h: 200 };
    for (const kid of KIDS) {
      const row = document.createElement('div');
      row.style.whiteSpace = 'nowrap';
      sheet.appendChild(row);
      for (const hair of HAIRS) {
        const k = drawKid(kid, 'stand', { ...PLAIN, helmet, hair }, { x: 0, y: -HIP_H });
        row.appendChild(await paint(`<rect x="-80" y="0" width="160" height="20" fill="#d8c08a"/>` + k.back + k.front, box, scale));
      }
      row.appendChild(await paint(ground(RUNNER_BOX.w) + drawRunner('horse', kid, 'run1', { ...PLAIN, helmet, hair: 'surfer' }).svg, RUNNER_BOX, scale * 0.42));
      row.appendChild(await paint(ground(RUNNER_BOX.w) + drawRunner('unicorn', kid, 'run3', { ...PLAIN, helmet, hair: 'ponytail' }).svg, RUNNER_BOX, scale * 0.42));
    }
    w.__ready = true;
    return true;
  }
  if (kind === 'wardrobe') {
    // every helmet, hairstyle and saddle on a child, in every pose of the race
    const scale = Number(params.get('scale')) || 0.5;
    const sheet = page('');
    const animal = (params.get('animal') ?? 'unicorn') as never;
    const kid = (params.get('kid') ?? 'maya') as never;
    const outfits: Outfit[] = [
      { helmet: 'rainbow', hair: 'pink', saddle: 'royal' },
      { helmet: 'stars', hair: 'gold', saddle: 'stars' },
      { helmet: 'crown', hair: 'rainbow', saddle: 'rainbow' },
      { helmet: 'flowers', hair: 'none', saddle: 'flowers' },
      { helmet: 'basic', hair: 'spikes', saddle: 'basic' },
      { helmet: 'stars', hair: 'curls', saddle: 'royal' },
      { helmet: 'rainbow', hair: 'surfer', saddle: 'stars' },
      { helmet: 'crown', hair: 'ponytail', saddle: 'flowers' },
      { helmet: 'unicorn', hair: 'none', saddle: 'royal' },
      { helmet: 'knight', hair: 'spikes', saddle: 'stars' },
      { helmet: 'racer', hair: 'surfer', saddle: 'basic' },
      { helmet: 'dino', hair: 'curls', saddle: 'rainbow' },
    ];
    for (const o of outfits) {
      const row = document.createElement('div');
      row.style.whiteSpace = 'nowrap';
      sheet.appendChild(row);
      for (const p of ['run0', 'run3', 'jump', 'duck', 'bump', 'happy'] as const) row.appendChild(await paint(ground(RUNNER_BOX.w) + drawRunner(animal, kid, p, o).svg, RUNNER_BOX, scale));
    }
    w.__ready = true;
    return true;
  }
  return false;
}

/** A 16-bit stereo WAV of a buffer, as base64 (for saving rendered music from Playwright). */
function toWav(buf: AudioBuffer): string {
  const n = buf.length;
  const sr = buf.sampleRate;
  const bytes = new DataView(new ArrayBuffer(44 + n * 4));
  const str = (o: number, t: string) => [...t].forEach((ch, i) => bytes.setUint8(o + i, ch.charCodeAt(0)));
  str(0, 'RIFF');
  bytes.setUint32(4, 36 + n * 4, true);
  str(8, 'WAVEfmt ');
  bytes.setUint32(16, 16, true);
  bytes.setUint16(20, 1, true);
  bytes.setUint16(22, 2, true);
  bytes.setUint32(24, sr, true);
  bytes.setUint32(28, sr * 4, true);
  bytes.setUint16(32, 4, true);
  bytes.setUint16(34, 16, true);
  str(36, 'data');
  bytes.setUint32(40, n * 4, true);
  const L = buf.getChannelData(0);
  const R = buf.getChannelData(1);
  for (let i = 0; i < n; i++) {
    bytes.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true);
    bytes.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true);
  }
  let bin = '';
  const u8 = new Uint8Array(bytes.buffer);
  for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return btoa(bin);
}
