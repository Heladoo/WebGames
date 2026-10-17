// Everything the race draws is painted once into canvases before it starts (the SVG art is far too rich to draw
// every frame): every runner in every pose, the track's layers, its obstacles, the candies, the hint icons and the
// palace at the finish. The paint resolution comes from the screen (device pixels per stage unit, capped), so phones
// paint less and big screens stay sharp. Pictures are cached, so racing again starts at once.

import { drawRunner } from '../art/runner';
import type { AnimalId, PoseId } from '../art/animals';
import type { KidId, Outfit } from '../art/riders';
import { CANDIES, TRACK_OBSTACLES, candy, obstacle, type CandyId, type Obstacle } from '../art/props';
import { LAYERS, STAGE_H, STAGE_W, trackLayer, type Layer, type TrackId } from '../art/tracks';
import { palace, PALACE_LOOK } from '../art/palace';
import { ICONS } from '../art/icons';
import { RUNNER_BOX, RUNNER_DRAW, paint } from '../art/sprite';
import { svgToCanvas } from '../raster';

export const RACE_POSES: PoseId[] = ['run0', 'run1', 'run2', 'run3', 'run4', 'run5', 'jump', 'duck', 'bump', 'happy'];
export const PROP_BOX = { x: -170, y: -470, w: 340, h: 500 };
export const CANDY_BOX = { x: -60, y: -60, w: 120, h: 120 };
export const PALACE_BOX = { x: -330, y: -560, w: 660, h: 580 };

export type Frames = Record<PoseId, HTMLCanvasElement>;
export interface PropPics { ob: Obstacle; front: HTMLCanvasElement; back: HTMLCanvasElement | null }

const cache = new Map<string, Promise<unknown>>();
function once<T>(key: string, make: () => Promise<T>): Promise<T> {
  let p = cache.get(key) as Promise<T> | undefined;
  if (!p) {
    p = make();
    cache.set(key, p);
  }
  return p;
}

/** Device pixels per stage unit for a screen, capped so a huge screen doesn't paint for ever. */
export function paintScale(stagePx: number) {
  return Math.min(1.6, Math.max(0.35, stagePx * (window.devicePixelRatio || 1)));
}

/** Paint a set of jobs a few at a time, reporting progress. */
export async function inBatches<T>(jobs: (() => Promise<T>)[], onProgress?: (done: number, all: number) => void, size = 6): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < jobs.length; i += size) {
    out.push(...(await Promise.all(jobs.slice(i, i + size).map((j) => j()))));
    onProgress?.(Math.min(jobs.length, i + size), jobs.length);
  }
  return out;
}

/** Paint jobs for one runner, one per pose in `RACE_POSES` order (see `framesOf`). */
export function runnerJobs(animal: AnimalId, kid: KidId, outfit: Outfit, k: number): (() => Promise<HTMLCanvasElement>)[] {
  const key = `r:${animal}:${kid}:${outfit.helmet}:${outfit.braids}:${outfit.saddle}:${k.toFixed(2)}`;
  return RACE_POSES.map((p) => () => once(`${key}:${p}`, () => paint(drawRunner(animal, kid, p, outfit).svg, RUNNER_BOX, k * RUNNER_DRAW)));
}

export const framesOf = (pics: HTMLCanvasElement[]): Frames => Object.fromEntries(RACE_POSES.map((p, i) => [p, pics[i]])) as Frames;

export function trackJobs(track: TrackId, k: number): (() => Promise<[Layer, HTMLCanvasElement]>)[] {
  return LAYERS.map((l) => () => once(`t:${track}:${l}:${k.toFixed(2)}`, async () => [l, await paint(trackLayer(track, l), { x: 0, y: 0, w: STAGE_W, h: STAGE_H }, k)] as [Layer, HTMLCanvasElement]));
}

export function propJobs(track: TrackId, k: number): (() => Promise<PropPics>)[] {
  return TRACK_OBSTACLES[track].map((id) => () =>
    once(`o:${track}:${id}:${k.toFixed(2)}`, async () => {
      const ob = obstacle(id, track);
      const front = await paint(ob.svg, PROP_BOX, k * RUNNER_DRAW);
      const back = ob.back ? await paint(ob.back, PROP_BOX, k * RUNNER_DRAW) : null;
      return { ob, front, back };
    }),
  );
}

export function candyJobs(k: number): (() => Promise<[string, HTMLCanvasElement]>)[] {
  const keys: [CandyId, number][] = [];
  for (const c of CANDIES) for (let t = 0; t < (c === 'gold' ? 1 : 5); t++) keys.push([c, t]);
  return keys.map(([c, t]) => () => once(`c:${c}:${t}:${k.toFixed(2)}`, async () => [`${c}:${t}`, await paint(candy(c, t), CANDY_BOX, k * RUNNER_DRAW)] as [string, HTMLCanvasElement]));
}

export function extraJobs(k: number): (() => Promise<[string, HTMLCanvasElement]>)[] {
  const icon = (name: 'up' | 'down', svg: string) => () => once(`i:${name}`, async () => [name, await svgToCanvas(svg.replace(/width="\d+" height="\d+"/, 'width="128" height="128"'), 128, 128)] as [string, HTMLCanvasElement]);
  return [
    icon('up', ICONS.up),
    icon('down', ICONS.down),
    () => once(`p:${k.toFixed(2)}`, async () => ['palace', await paint(palace(0, 0, 1, { ...PALACE_LOOK, wave: 0.4 }), PALACE_BOX, k)] as [string, HTMLCanvasElement]),
  ];
}
