// Turning drawings into pictures. Characters are drawn in local coordinates (the ground at y = 0, the body centred
// on x = 0) and painted once into a canvas per pose, so the race only copies pictures.

import { svgToCanvas } from '../raster';

/** The box every runner is drawn in (local units). */
export const RUNNER_BOX = { x: -230, y: -430, w: 480, h: 450 };

export const svgDoc = (inner: string, box: { x: number; y: number; w: number; h: number }, scale = 1) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.x} ${box.y} ${box.w} ${box.h}" width="${Math.round(box.w * scale)}" height="${Math.round(box.h * scale)}">${inner}</svg>`;

export function paint(inner: string, box: { x: number; y: number; w: number; h: number }, scale = 1): Promise<HTMLCanvasElement> {
  return svgToCanvas(svgDoc(inner, box, scale), box.w * scale, box.h * scale);
}

/** How big a runner is drawn on the 1600 x 900 stage in the near lane (lanes further back use `LANE_SCALE`). */
export const RUNNER_DRAW = 0.86;
