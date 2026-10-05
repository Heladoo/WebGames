import { C, ell, line, piece, shade } from './art/paper';

// Small shared UI helpers: element lookup, toasts, paper confetti, icons, overlays.

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

// ---------- paper confetti ----------

const PAPER = [C.coral, C.teal, C.mustard, C.indigo, C.rose, C.butter, C.leafLight];
const SHAPES: Record<string, [string, string]> = {
  // [viewBox, path]
  star: ['0 0 24 24', 'M12 1 L15 8.5 L23 9 L17 14.5 L19 22.5 L12 18 L5 22.5 L7 14.5 L1 9 L9 8.5 Z'],
  heart: ['0 0 24 22', 'M12 21 C4 15 0 11 1 6 C2 1 9 0 12 5 C15 0 22 1 23 6 C24 11 20 15 12 21 Z'],
  dot: ['0 0 20 20', 'M10 0 A10 10 0 1 0 10.01 0 Z'],
  flower: ['0 0 24 24', 'M12 2 C15 2 16 6 14 8 C17 6 21 8 20 11 C21 14 17 16 15 14 C17 17 15 21 12 20 C9 21 7 17 9 14 C7 16 3 14 4 11 C3 8 7 6 10 8 C8 6 9 2 12 2 Z'],
  flag: ['0 0 20 24', 'M0 0 L20 0 L10 24 Z'],
  ribbon: ['0 0 12 40', 'M2 0 C12 6 12 12 6 20 C0 28 0 34 10 40 L8 40 C-2 34 -2 27 4 20 C10 12 10 6 0 0 Z'],
};
const SHAPE_KEYS = Object.keys(SHAPES);

function paperPiece(shape: string, color: string, size: number) {
  const [vb, d] = SHAPES[shape];
  const face = (fill: string, cls: string) => `<svg class="${cls}" viewBox="${vb}" aria-hidden="true"><path d="${d}" fill="${fill}"/></svg>`;
  const el = h('i', `pc pc-${shape}`, `<span>${face(color, 'face')}${face(shade(color, -0.22), 'back')}</span>`);
  el.style.setProperty('--s', `${size}px`);
  return el;
}

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Celebrate with paper confetti. 'word' is a small burst (from an element),
 * 'badge' adds paper bunting, and 'party' fills the screen for milestones.
 */
export function celebrate(kind: 'word' | 'badge' | 'party' = 'word', from?: Element | null) {
  const box = h('div', 'confetti-layer');
  const r = from?.getBoundingClientRect();
  const ox = r ? r.left + r.width / 2 : innerWidth / 2;
  const oy = r ? r.top + r.height / 2 : innerHeight * 0.42;
  const n = reduced() ? 8 : kind === 'word' ? 26 : kind === 'badge' ? 44 : 40;
  const add = (x: number, y: number, dx: number, dy: number, fall: number, dur: number, delay: number, rain = false) => {
    const shape = SHAPE_KEYS[Math.floor(Math.random() * SHAPE_KEYS.length)];
    const size = shape === 'ribbon' ? 18 : 20 + Math.random() * 16;
    const p = paperPiece(shape, PAPER[Math.floor(Math.random() * PAPER.length)], size);
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.setProperty('--x', `${dx}px`);
    p.style.setProperty('--y', `${dy}px`);
    p.style.setProperty('--fall', `${fall}px`);
    p.style.setProperty('--dur', `${dur}s`);
    p.style.setProperty('--fl', `${0.8 + Math.random() * 1.1}s`);
    p.style.setProperty('--rx', `${Math.random() * 720 - 360}deg`);
    p.style.setProperty('--rz', `${Math.random() * 540 - 270}deg`);
    p.style.animationDelay = `${delay}s`;
    if (rain) p.classList.add('rain');
    box.appendChild(p);
  };
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.5;
    const d = (kind === 'word' ? 110 : 180) + Math.random() * (kind === 'word' ? 140 : 240);
    add(ox, oy, Math.cos(a) * d, Math.sin(a) * d, 160 + Math.random() * 220, 1.6 + Math.random() * 0.9, Math.random() * 0.12);
  }
  if (kind === 'party' && !reduced())
    for (let i = 0; i < 46; i++)
      add(Math.random() * innerWidth, -40, (Math.random() - 0.5) * 120, 0, innerHeight + 80, 3 + Math.random() * 2.4, Math.random() * 1.6, true);
  if (kind !== 'word') box.appendChild(bunting());
  document.body.appendChild(box);
  setTimeout(() => box.remove(), kind === 'party' ? 6500 : 4200);
}

/** A strand of paper flags that drops in across the top of the screen. */
function bunting() {
  const w = Math.max(360, innerWidth);
  const flags = Math.round(w / 46);
  let s = `<path d="M-10 6 Q${w / 2} 60 ${w + 10} 6" fill="none" stroke="${C.ink}" stroke-width="2"/>`;
  for (let i = 0; i <= flags; i++) {
    const t = i / flags;
    const x = -10 + t * (w + 20);
    const y = 6 + 4 * t * (1 - t) * 54 * 0.98;
    const c = PAPER[i % PAPER.length];
    s += `<path d="M${x - 14} ${y} L${x + 14} ${y} L${x} ${y + 30} Z" fill="${C.shadow}" opacity="0.18" transform="translate(1 2)"/><path d="M${x - 14} ${y} L${x + 14} ${y} L${x} ${y + 30} Z" fill="${c}"/>`;
  }
  const el = h('div', 'bunting', `<svg viewBox="0 0 ${w} 100" preserveAspectRatio="none" aria-hidden="true">${s}</svg>`);
  return el;
}

export function flash() {
  const f = $('flash');
  f.classList.remove('on');
  void f.offsetWidth;
  f.classList.add('on');
}

const icon = (inner: string) => `<svg viewBox="0 0 64 64" aria-hidden="true">${inner}</svg>`;

export const ICONS = {
  book: icon(`${piece('M8 14 C20 8 28 12 32 16 L32 54 C28 48 20 46 8 50 Z', C.rose, { lift: 1.6 })}
    ${piece('M56 14 C44 8 36 12 32 16 L32 54 C36 48 44 46 56 50 Z', shade(C.rose, 0.25), { lift: 1.6 })}
    ${piece('M44 20 L46.4 25 L51.8 25.7 L47.8 29.5 L48.8 34.9 L44 32.3 L39.2 34.9 L40.2 29.5 L36.2 25.7 L41.6 25 Z', C.mustard, { lift: 0.8 })}`),
  camera: icon(`${piece('M20 18 L24 11 L40 11 L44 18 Z', shade(C.teal, -0.15), { lift: 1 })}
    ${piece('M8 24 C8 20 11 18 15 18 L49 18 C53 18 56 20 56 24 L56 46 C56 50 53 52 49 52 L15 52 C11 52 8 50 8 46 Z', C.teal, { lift: 1.8 })}
    ${piece(ell(32, 35, 11, 11), C.white, { lift: 1 })}${piece(ell(32, 35, 6, 6), C.ink, { lift: 0 })}${piece(ell(47, 25, 3, 3), C.coral, { lift: 0.5 })}`),
  gear: icon(`${piece('M32 8 l5 6 7-2 1 7 7 3-3 7 4 6-6 4 0 7-7 0-4 6-6-4-6 4-4-6-7 0 0-7-6-4 4-6-3-7 7-3 1-7 7 2 Z', '#d9d0c2', { lift: 1.4 })}${piece(ell(32, 34, 7, 7), C.cream, { lift: 0.6 })}`),
  play: icon(piece('M24 14 C24 12 26 11 28 12 L50 30 C52 31 52 33 50 34 L28 52 C26 53 24 52 24 50 Z', C.white, { lift: 1.6 })),
  speaker: icon(`${piece('M10 26 L20 26 L32 16 L32 48 L20 38 L10 38 Z', C.white, { lift: 1.2 })}
    ${line('M40 24 Q46 32 40 40 M46 18 Q56 32 46 46', C.white, 4)}`),
  check: icon(line('M16 34 L28 46 L50 20', C.white, 8)),
  /** start over: a paper circle arrow around a little paw */
  restart: icon(`${line('M50 34 A18 18 0 1 1 42 18', C.coral, 6)}${piece('M38 8 L50 16 L38 25 Z', C.coral, { lift: 1 })}
    ${piece(ell(32, 37, 6, 5), C.bark, { lift: 0.6 })}${piece(`${ell(25, 29, 2.6, 3.2)} ${ell(30, 26, 2.6, 3.2)} ${ell(35, 26, 2.6, 3.2)} ${ell(40, 29, 2.6, 3.2)}`, C.bark, { lift: 0.5 })}`),
  /** a big paper starburst that spins behind a new badge */
  burst: `<svg viewBox="-50 -50 100 100" aria-hidden="true">${piece(Array.from({ length: 16 }, (_, i) => {
    const a = (i * Math.PI) / 8, b = a + Math.PI / 16;
    return `${i ? 'L' : 'M'}${(Math.cos(a) * 48).toFixed(1)} ${(Math.sin(a) * 48).toFixed(1)} L${(Math.cos(b) * 34).toFixed(1)} ${(Math.sin(b) * 34).toFixed(1)}`;
  }).join(' ') + ' Z', C.butter, { lift: 2 })}${piece(ell(0, 0, 30, 30), shade(C.butter, 0.35), { lift: 1 })}</svg>`,
};

/**
 * A button that acts only when pressed and held (a ring fills up meanwhile),
 * so little fingers don't trigger it by accident. A short tap calls onTap; a
 * keyboard press acts at once.
 */
export function holdButton(el: HTMLElement, ms: number, onHold: () => void, onTap?: () => void) {
  let timer = 0;
  el.style.setProperty('--hold', `${ms}ms`);
  const cancel = () => {
    clearTimeout(timer);
    el.classList.remove('holding');
  };
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    el.classList.add('holding');
    timer = window.setTimeout(() => {
      el.classList.remove('holding');
      onHold();
    }, ms);
  });
  el.addEventListener('pointerup', () => {
    if (el.classList.contains('holding')) onTap?.();
    cancel();
  });
  el.addEventListener('pointerleave', cancel);
  el.addEventListener('pointercancel', cancel);
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  el.addEventListener('click', (e) => {
    if (e.detail === 0) onHold(); // Enter or Space
  });
}

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
