// Draws a finished bracelet, with its place behind it, into a framed picture for the album.

import { placeById, type Bead } from './content';
import { PHOTO_H, PHOTO_W, photoSVG } from './scene';

const FONT = "'Fredoka', ui-rounded, 'Nunito', system-ui, sans-serif";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

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
  const svg = photoSVG(place, beads);
  const img = await loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
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
  ctx.drawImage(img, pad, pad, iw, ih);
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
