// Draws a finished bracelet, with its place behind it, into a framed picture for the album.

import { placeById, type Bead } from './content';
import { PHOTO_H, PHOTO_W, scenePicture, wristPicture } from './scene';
import { wristBeads, wristLayerSVG } from './art/wrist';
import { svgToCanvas } from './raster';

const FONT = "'Fredoka', ui-rounded, 'Nunito', system-ui, sans-serif";

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const captionFor = (place: string) => `${placeById(place).name} bracelet`;

export async function makePhoto(place: string, beads: (Bead | null)[]): Promise<{ png: string; caption: string }> {
  // the scenery and the arm are painted pictures; the bracelet is drawn fresh round the wrist, its far half behind the arm
  const parts = wristBeads(beads);
  const [scene, arm, back, front] = await Promise.all([
    scenePicture(place, 2),
    wristPicture(2),
    svgToCanvas(wristLayerSVG(parts.back), PHOTO_W * 2, PHOTO_H * 2),
    svgToCanvas(wristLayerSVG(parts.front), PHOTO_W * 2, PHOTO_H * 2),
  ]);
  try {
    await document.fonts?.load(`600 40px Fredoka`);
  } catch {
    // fall back to the system font
  }
  const k = 1.5; // output pixels per scene unit
  const iw = Math.round(PHOTO_W * k);
  const ih = Math.round(PHOTO_H * k);
  const pad = 30;
  const foot = 96;
  const c = document.createElement('canvas');
  c.width = iw + pad * 2;
  c.height = ih + pad + foot;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff8ec';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.save();
  roundRect(ctx, pad, pad, iw, ih, 30);
  ctx.clip();
  ctx.drawImage(scene.canvas, pad, pad, iw, ih);
  ctx.drawImage(back, pad, pad, iw, ih);
  ctx.drawImage(arm.canvas, pad, pad, iw, ih);
  ctx.drawImage(front, pad, pad, iw, ih);
  ctx.restore();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#ffffff';
  roundRect(ctx, pad, pad, iw, ih, 30);
  ctx.stroke();
  const text = captionFor(place);
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#2f4a7a';
  let size = 42;
  do {
    ctx.font = `600 ${size}px ${FONT}`;
    size -= 2;
  } while (ctx.measureText(text).width > iw - 230 && size > 20);
  ctx.fillText(text, pad + 8, ih + pad + foot / 2);
  ctx.font = `500 26px ${FONT}`;
  ctx.fillStyle = '#4a90e2';
  const brand = 'Bead Box';
  ctx.fillText(brand, c.width - pad - 8 - ctx.measureText(brand).width, ih + pad + foot / 2);
  return { png: c.toDataURL('image/png'), caption: text };
}
