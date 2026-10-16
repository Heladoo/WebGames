import './styles.css';
import { runDebug } from './debug';
import { ICONS } from './art/icons';
import { LAYERS, STAGE_H, STAGE_W, trackLayer } from './art/tracks';
import { paint } from './art/sprite';

const params = new URLSearchParams(location.search);
const debug = params.get('debug');

// This is the art preview (stage 1): the title screen leads to a still of a race. The race itself comes next.
async function title() {
  const app = document.getElementById('app')!;
  app.innerHTML = `<div class="title"><canvas class="stage"></canvas><div class="title-box"><img class="logo" src="/logo.webp" alt="המרוץ לארמון" width="900" height="740" draggable="false"><button class="round-btn big" id="btn-play" aria-label="לשחק">${ICONS.play}</button></div></div>`;
  document.getElementById('btn-play')!.addEventListener('click', () => (location.search = '?debug=mock'));
  const cv = app.querySelector('canvas')!;
  cv.width = STAGE_W;
  cv.height = STAGE_H;
  const g = cv.getContext('2d')!;
  for (const l of LAYERS) g.drawImage(await paint(trackLayer('forest', l), { x: 0, y: 0, w: STAGE_W, h: STAGE_H }), 0, 0);
  const logo = app.querySelector<HTMLImageElement>('img.logo')!;
  await logo.decode().catch(() => {});
  await document.fonts.ready;
  (window as unknown as { __ready: boolean }).__ready = true;
}

if (debug) void runDebug(debug, params);
else void title();
