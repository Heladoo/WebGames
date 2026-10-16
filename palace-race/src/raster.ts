// Paint an SVG once into a canvas (and a cached picture URL). Scenes use many shapes and filters, which would be
// slow to redraw every frame, so they are drawn here once and shown as an ordinary image.

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('could not draw the picture'));
    img.src = src;
  });
}

export async function svgToCanvas(svg: string, w: number, h: number): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = await loadImage(url);
    const c = document.createElement('canvas');
    c.width = Math.round(w);
    c.height = Math.round(h);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    return c;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const canvasURL = (c: HTMLCanvasElement, type = 'image/jpeg', q = 0.92): Promise<string> =>
  new Promise((res) => c.toBlob((b) => res(b ? URL.createObjectURL(b) : c.toDataURL(type, q)), type, q));
