import { INK } from './art/palette';

// Small shared UI helpers: element lookup, toasts, confetti, icons, overlays.

export const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function h(tag: string, cls = '', html = ''): HTMLElement {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

let toastTimer = 0;
export function toast(html: string, ms = 2600, onClick?: () => void) {
  const t = $('toast');
  t.innerHTML = html;
  t.classList.add('show');
  t.onclick = onClick ? () => { t.classList.remove('show'); onClick(); } : null;
  t.classList.toggle('clickable', !!onClick);
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t.classList.remove('show'), ms);
}

const CONFETTI = ['#ff8fb0', '#7fc8f0', '#9ed98b', '#ffd45c', '#b8a3f0', '#ff9f7a'];
export function confetti(n = 36) {
  const box = h('div', 'confetti');
  for (let i = 0; i < n; i++) {
    const p = h('i');
    const a = Math.random() * Math.PI * 2;
    const d = 120 + Math.random() * 260;
    p.style.setProperty('--x', `${Math.cos(a) * d}px`);
    p.style.setProperty('--y', `${Math.sin(a) * d - 120}px`);
    p.style.setProperty('--r', `${Math.random() * 720 - 360}deg`);
    p.style.background = CONFETTI[i % CONFETTI.length];
    p.style.animationDelay = `${Math.random() * 0.12}s`;
    if (i % 3 === 0) p.style.borderRadius = '50%';
    box.appendChild(p);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 1800);
}

export function flash() {
  const f = $('flash');
  f.classList.remove('on');
  void f.offsetWidth;
  f.classList.add('on');
}

const icon = (inner: string) => `<svg viewBox="0 0 64 64" aria-hidden="true">${inner}</svg>`;
const S = `stroke="${INK}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;

export const ICONS = {
  book: icon(`<path d="M8 14 Q20 8 32 16 Q44 8 56 14 L56 52 Q44 46 32 54 Q20 46 8 52 Z" fill="#ffd9e3" ${S}/><path d="M32 16 L32 54" ${S}/>
    <path d="M44 22 l2.4 5 5.4 .7 -4 3.8 1 5.4 -4.8 -2.6 -4.8 2.6 1 -5.4 -4 -3.8 5.4 -.7 Z" fill="#ffd45c" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`),
  camera: icon(`<rect x="8" y="18" width="48" height="34" rx="9" fill="#9fd4f0" ${S}/><path d="M22 18 L26 11 L38 11 L42 18" fill="#9fd4f0" ${S}/>
    <circle cx="32" cy="35" r="10" fill="#fff" ${S}/><circle cx="32" cy="35" r="4" fill="${INK}"/><circle cx="47" cy="25" r="2.5" fill="#ff8fb0"/>`),
  gear: icon(`<g fill="#e3dcef" ${S}><path d="M32 8 l5 6 7-2 1 7 7 3-3 7 4 6-6 4 0 7-7 0-4 6-6-4-6 4-4-6-7 0 0-7-6-4 4-6-3-7 7-3 1-7 7 2 Z"/></g><circle cx="32" cy="34" r="7" fill="#fff" ${S}/>`),
  play: icon(`<path d="M24 16 L50 32 L24 48 Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>`),
  speaker: icon(`<path d="M10 26 L20 26 L32 16 L32 48 L20 38 L10 38 Z" fill="#fff" ${S}/><path d="M40 24 Q46 32 40 40 M46 18 Q56 32 46 46" fill="none" ${S}/>`),
  check: icon(`<path d="M16 34 L28 46 L50 20" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`),
};

/** Open an overlay; resolves when it is closed. */
export function openOverlay(id: string): Promise<void> {
  const o = $(id);
  o.classList.remove('hidden');
  return new Promise((res) => {
    const close = () => {
      o.classList.add('hidden');
      o.removeEventListener('click', onClick);
      res();
    };
    const onClick = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t === o || t.closest('[data-close]')) close();
    };
    o.addEventListener('click', onClick);
  });
}

export const anyOverlayOpen = () => [...document.querySelectorAll('.overlay')].some((o) => o.id !== 'title' && !o.classList.contains('hidden'));
