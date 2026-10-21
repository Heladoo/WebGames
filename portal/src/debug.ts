// ?debug=og: the link-preview image, drawn from the logo and the shelf pictures.
// scripts/render-art.mjs screenshots it into public/og-image.png.

import { GAMES } from './games';

const w = window as unknown as { __ready?: boolean };

export async function render() {
  document.body.innerHTML = '';
  document.body.style.cssText = 'margin:0;background:#fef7e5';
  const root = document.createElement('div');
  root.id = 'og';
  root.dir = 'rtl';
  root.style.cssText = 'width:1200px;height:630px;background:#fef7e5;position:relative;overflow:hidden;font-family:Rubik,sans-serif;color:#3a2e2a';
  // tiles sized to fit one row, whatever the number of games
  const gap = 20;
  const img = Math.min(222, Math.floor((1112 - gap * (GAMES.length - 1)) / GAMES.length) - 16);
  const tiles = GAMES.map(
    (g) => `<div style="padding:8px;border-radius:20px;background:#fff;box-shadow:0 4px 0 rgba(80,50,20,.12)">
      <img src="/games/${g.id}.jpg" alt="" style="display:block;width:${img}px;height:${img}px;object-fit:cover;border-radius:13px"></div>`,
  ).join('');
  root.innerHTML = `
    <img src="/logo.webp" alt="" style="position:absolute;top:12px;left:50%;transform:translateX(-50%);height:410px">
    <div style="position:absolute;left:44px;right:44px;bottom:30px">
      <div style="display:flex;justify-content:center;gap:${gap}px;padding:0 16px">${tiles}</div>
      <div style="height:18px;background:#b9824f;border-bottom:10px solid #8e5c33;border-radius:7px;box-shadow:0 12px 16px -6px rgba(80,50,20,.3)"></div></div>`;
  document.body.appendChild(root);
  await Promise.all([...document.images].map((i) => i.decode().catch(() => undefined)));
  await document.fonts?.ready;
  w.__ready = true;
}
