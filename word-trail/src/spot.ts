import { ALL_WORDS } from './content';
import { sfx } from './sfx';
import { anyOverlayOpen, ICONS } from './ui';

// Spot it: a small question ("Where is the cloud?") waits at the top, and the
// child taps the thing in the scene. The question bubble is small so the
// scene stays in view, a finger taps in the bubble to show what to do, and
// after a quiet while a glowing ring and a pointing finger show the answer.

type Box = { x: number; y: number; w: number; h: number };
const rect = (e: Element): Box => {
  const r = e.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
};
const inside = (px: number, py: number, b: Box) => px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;

/** What covers the scene: the question bubble, the top buttons and the corner logo. */
function covers(): Box[] {
  return ['#panel:not(.hidden)', '#topbar:not(.hidden)', '#corner-logo'].map((q) => document.querySelector(q)).filter((e): e is Element => !!e).map(rect).filter((b) => b.w > 0);
}

/** How much of a box is on screen (0–1). */
const onScreen = (b: Box) => {
  const w = Math.max(0, Math.min(b.x + b.w, innerWidth) - Math.max(b.x, 0));
  const h = Math.max(0, Math.min(b.y + b.h, innerHeight) - Math.max(b.y, 0));
  return (w * h) / Math.max(1, b.w * b.h);
};

/**
 * Copies of `word` in the scene that a child can see and tap (on screen, not
 * under the bubble or the buttons), the most fully visible first.
 */
export function spotTargets(svg: SVGSVGElement, word: string): Element[] {
  const cover = covers();
  return [...svg.querySelectorAll(`[data-word="${word}"]`)].filter((e) => {
    if (e.closest('.scene-old, .farewell')) return false;
    const b = rect(e);
    if (b.w < 4 || b.h < 4) return false;
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    if (cx < 0 || cy < 0 || cx > innerWidth || cy > innerHeight) return false;
    return !cover.some((c) => inside(cx, cy, c));
  }).sort((a, b) => onScreen(rect(b)) - onScreen(rect(a)));
}

/** Words of the word bank that can be spotted in the scene right now. */
export function spottableWords(svg: SVGSVGElement): string[] {
  const words = new Set([...svg.querySelectorAll('[data-word]')].map((e) => e.getAttribute('data-word')!));
  return [...words].filter((w) => ALL_WORDS.includes(w) && spotTargets(svg, w).length > 0);
}

/** A tap target a little bigger than the drawing, so small things are easy to hit. */
function padded(b: Box): Box {
  const pad = Math.max(18, Math.min(b.w, b.h) * 0.2);
  return { x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2 };
}

export interface SpotOptions {
  hintAfter?: number; // ms of no success before the ring and pointing finger appear
  onHint?: (n: number) => void; // say the question again
}

/**
 * Waits for a tap on `word` in the scene. Taps elsewhere are left to the
 * scene's own "say what I tapped" handler.
 */
export function spotWord(svg: SVGSVGElement, word: string, o: SpotOptions = {}): { done: Promise<Element>; cancel: () => void } {
  const hintAfter = o.hintAfter ?? 7000;
  let resolveDone!: (e: Element) => void;
  const done = new Promise<Element>((r) => (resolveDone = r));
  let finished = false;
  let hints = 0;
  let idle = performance.now();
  let ring: HTMLElement | null = null;
  let pointer: HTMLElement | null = null;
  let raf = 0;

  const targets = () => spotTargets(svg, word);

  // keep the ring on the target (clouds drift, friends hop)
  const follow = () => {
    const t = targets()[0];
    if (t && ring && pointer) {
      const b = padded(rect(t));
      Object.assign(ring.style, { left: `${b.x}px`, top: `${b.y}px`, width: `${b.w}px`, height: `${b.h}px` });
      Object.assign(pointer.style, { left: `${b.x + b.w * 0.62}px`, top: `${b.y + b.h * 0.62}px` });
    }
    raf = requestAnimationFrame(follow);
  };

  const showHint = () => {
    hints++;
    o.onHint?.(hints);
    if (!ring) {
      ring = document.createElement('div');
      ring.className = 'spot-ring';
      pointer = document.createElement('div');
      pointer.className = 'spot-point';
      pointer.innerHTML = ICONS.finger;
      document.getElementById('app')!.append(ring, pointer);
      follow();
    }
  };

  const timer = window.setInterval(() => {
    if (finished) return;
    if (anyOverlayOpen() || document.hidden) { idle = performance.now(); return; }
    if (performance.now() - idle >= hintAfter) {
      idle = performance.now();
      showHint();
    }
  }, 250);

  const onTap = (e: MouseEvent) => {
    if (finished) return;
    idle = performance.now();
    const hit = targets().find((t) => inside(e.clientX, e.clientY, padded(rect(t))));
    if (!hit) return; // the scene says the name of whatever was tapped
    e.stopPropagation();
    finished = true;
    sfx.chime(5);
    ring?.classList.add('found');
    stop(false);
    resolveDone(hit);
  };
  svg.addEventListener('click', onTap, true);

  const stop = (removeRing = true) => {
    window.clearInterval(timer);
    svg.removeEventListener('click', onTap, true);
    if (removeRing) {
      cancelAnimationFrame(raf);
      ring?.remove();
      pointer?.remove();
    } else {
      // let the found ring glow a moment, then go
      pointer?.remove();
      setTimeout(() => {
        cancelAnimationFrame(raf);
        ring?.remove();
      }, 900);
    }
  };

  return {
    done,
    cancel: () => {
      finished = true;
      stop();
    },
  };
}
