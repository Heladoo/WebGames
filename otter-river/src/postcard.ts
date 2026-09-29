// Turns a low-res game frame into a framed pixel postcard.

export function makePostcard(src: HTMLCanvasElement, caption: string, date: Date): HTMLCanvasElement {
  const k = Math.max(1, Math.min(4, Math.floor(720 / src.width)));
  const pad = 14;
  const foot = 46;
  const c = document.createElement('canvas');
  c.width = src.width * k + pad * 2;
  c.height = src.height * k + pad + foot;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#fff6e6';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#4b3040';
  ctx.fillRect(pad - 3, pad - 3, src.width * k + 6, src.height * k + 6);
  ctx.drawImage(src, pad, pad, src.width * k, src.height * k);
  // stamp-like dotted border
  ctx.fillStyle = '#ffd6c9';
  for (let x = 4; x < c.width - 4; x += 8) { ctx.fillRect(x, 3, 4, 3); ctx.fillRect(x, c.height - 6, 4, 3); }
  for (let y = 4; y < c.height - 4; y += 8) { ctx.fillRect(3, y, 3, 4); ctx.fillRect(c.width - 6, y, 3, 4); }
  ctx.fillStyle = '#4b3040';
  ctx.font = "700 20px 'Pixelify Sans', ui-rounded, sans-serif";
  ctx.textBaseline = 'middle';
  ctx.fillText(caption, pad, src.height * k + pad + foot / 2);
  ctx.font = "400 15px 'Pixelify Sans', ui-rounded, sans-serif";
  const d = `🦦 Otter River · ${date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  ctx.fillStyle = '#d8709e';
  ctx.fillText(d, c.width - pad - ctx.measureText(d).width, src.height * k + pad + foot / 2);
  return c;
}
