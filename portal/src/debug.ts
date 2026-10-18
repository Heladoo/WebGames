// ?debug=og and ?debug=icon: the link-preview image and the app icon, drawn
// from the shelf itself. scripts/render-art.mjs screenshots them into public/.

import { GAMES, SITE } from './games';

const w = window as unknown as { __ready?: boolean };

async function settle() {
  await Promise.all([...document.images].map((i) => i.decode().catch(() => undefined)));
  await document.fonts?.ready;
  w.__ready = true;
}

export async function render(kind: string) {
  document.body.innerHTML = '';
  document.body.style.cssText = 'margin:0;background:#fff';
  const root = document.createElement('div');
  document.body.appendChild(root);
  if (kind === 'icon') {
    // full-bleed square: Android masks it to a circle or squircle, so the mark stays inside the middle 70%
    root.id = 'icon';
    root.style.cssText = 'width:512px;height:512px;background:#f4ebdd;display:flex;align-items:center;justify-content:center';
    root.innerHTML = '<img src="/logo.svg" alt="" style="width:360px;height:360px;display:block">';
  } else {
    root.id = 'og';
    root.dir = 'rtl';
    root.style.cssText = 'width:1200px;height:630px;background:#f4ebdd;position:relative;overflow:hidden;font-family:Rubik,sans-serif;color:#3a2e2a';
    const boxes = GAMES.slice(0, 3)
      .map((g) => `<div style="width:300px;padding:10px;border-radius:24px;background:#fffdf8;box-shadow:0 5px 0 rgba(80,50,20,.12)">
        <img src="/games/${g.id}.jpg" alt="" style="display:block;width:280px;height:210px;object-fit:cover;border-radius:16px">
        <div style="text-align:center;font-weight:700;font-size:30px;padding:10px 0 4px">${g.name}</div></div>`)
      .join('');
    root.innerHTML = `
      <div style="position:absolute;top:44px;right:64px;display:flex;align-items:center;gap:24px">
        <img src="/logo.svg" alt="" style="width:112px;height:112px">
        <div><div style="font-family:'Secular One',sans-serif;font-size:84px;line-height:1">${SITE.name}</div>
        <div style="font-size:36px;color:#5a4636;margin-top:8px">${SITE.tagline}</div></div></div>
      <div style="position:absolute;left:64px;right:64px;bottom:44px">
        <div style="display:flex;justify-content:center;gap:40px;padding:0 20px">${boxes}</div>
        <div style="height:22px;background:#b9824f;border-bottom:12px solid #8e5c33;border-radius:8px;box-shadow:0 14px 18px -6px rgba(80,50,20,.3)"></div></div>`;
  }
  await settle();
}
