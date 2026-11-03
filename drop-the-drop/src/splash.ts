// Pressing a button splashes it: the jelly button squashes, bursts into
// droplets of its own colour, and only then does the next screen open (a
// quarter of a second later). It works for every splashable button without
// changing their handlers: a capture-phase click listener holds the click,
// plays the splash, then clicks the button again for real.

import { sfx } from './sfx';

const SPLASHABLE = 'button.home-btn, button.level-tile, #btn-home, #btn-restart, #btn-pick-back';
const DELAY = 0.23; // seconds before the button's own action runs
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

interface Bit { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number; c: string; ring?: boolean }

let canvas: HTMLCanvasElement | null = null;
let bits: Bit[] = [];
let running = false;
let last = 0;

function ensureCanvas(): HTMLCanvasElement {
  if (canvas) return canvas;
  canvas = document.createElement('canvas');
  canvas.id = 'splash';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  return canvas;
}

function frame(now: number) {
  const cv = ensureCanvas();
  const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
  last = now;
  const dpr = Math.min(2, devicePixelRatio || 1);
  if (cv.width !== Math.round(innerWidth * dpr) || cv.height !== Math.round(innerHeight * dpr)) {
    cv.width = Math.round(innerWidth * dpr);
    cv.height = Math.round(innerHeight * dpr);
  }
  const g = cv.getContext('2d')!;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, innerWidth, innerHeight);
  for (const b of bits) {
    b.life -= dt;
    if (b.ring) { b.r += dt * 260; continue; }
    b.vy += 900 * dt;
    b.vx *= 0.985;
    b.x += b.vx * dt; b.y += b.vy * dt;
  }
  bits = bits.filter((b) => b.life > 0);
  for (const b of bits) {
    const a = Math.min(1, (b.life / b.max) * 1.5);
    if (b.ring) {
      g.beginPath();
      g.ellipse(b.x, b.y, b.r, b.r * 0.55, 0, 0, Math.PI * 2);
      g.strokeStyle = `rgba(255,255,255,${0.8 * a})`;
      g.lineWidth = 3;
      g.stroke();
      continue;
    }
    // a little drop: stretched along its flight, with a shine
    const sp = Math.hypot(b.vx, b.vy), ang = Math.atan2(b.vy, b.vx);
    g.save();
    g.translate(b.x, b.y);
    g.rotate(ang);
    g.scale(1 + Math.min(0.8, sp / 900), 1 - Math.min(0.3, sp / 2500));
    g.globalAlpha = a;
    const gr = g.createRadialGradient(-b.r * 0.3, -b.r * 0.35, 0, 0, 0, b.r);
    gr.addColorStop(0, '#ffffff');
    gr.addColorStop(0.35, b.c);
    gr.addColorStop(1, b.c);
    g.beginPath();
    g.arc(0, 0, b.r, 0, Math.PI * 2);
    g.fillStyle = gr;
    g.fill();
    g.restore();
  }
  if (bits.length) requestAnimationFrame(frame);
  else { running = false; last = 0; g.clearRect(0, 0, innerWidth, innerHeight); }
}

/** Burst a button into droplets of its colour. */
export function splash(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const cols = [cs.getPropertyValue('--j2').trim() || '#2f9cf0', cs.getPropertyValue('--j1').trim() || '#7fd6ff', cs.getPropertyValue('--j3').trim() || '#1668c9'];
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const n = reduced ? 8 : 26;
  for (let i = 0; i < n; i++) {
    // start on the button's edge and fly outward, a little upward
    const a = Math.random() * Math.PI * 2;
    const ex = Math.cos(a) * r.width * 0.5, ey = Math.sin(a) * r.height * 0.5;
    const s = 220 + Math.random() * 260;
    const dx = ex / (r.width * 0.5), dy = ey / (r.height * 0.5);
    bits.push({
      x: cx + ex, y: cy + ey, vx: dx * s * 1.1, vy: dy * s * 0.8 - 180 - Math.random() * 120,
      r: 3 + Math.random() * 5, life: 0.55 + Math.random() * 0.25, max: 0.8, c: cols[i % 3],
    });
  }
  for (let i = 0; i < 4 && !reduced; i++) {
    bits.push({ x: cx + (Math.random() - 0.5) * r.width * 0.4, y: cy, vx: (Math.random() - 0.5) * 160, vy: -260 - Math.random() * 120, r: 8 + Math.random() * 3, life: 0.7, max: 0.7, c: cols[0] });
  }
  bits.push({ x: cx, y: cy, vx: 0, vy: 0, r: Math.max(r.width, r.height) * 0.35, life: 0.35, max: 0.35, c: '', ring: true });
  el.classList.remove('pop');
  void el.offsetWidth; // restart the animation
  el.classList.add('pop');
  setTimeout(() => el.classList.remove('pop'), 450);
  sfx.splash();
  if (!running) { running = true; requestAnimationFrame(frame); }
}

/** Hold clicks on splashable buttons until their splash has played. */
export function initSplash() {
  document.addEventListener('click', (e) => {
    const b = (e.target as Element | null)?.closest<HTMLButtonElement>(SPLASHABLE);
    if (!b || b.disabled || b.dataset.splashed) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    if (b.dataset.splashing) return; // a second tap while it splashes
    b.dataset.splashing = '1';
    splash(b);
    setTimeout(() => {
      delete b.dataset.splashing;
      b.dataset.splashed = '1';
      b.click();
      delete b.dataset.splashed;
    }, reduced ? 0 : DELAY * 1000);
  }, true);
}
