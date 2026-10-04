import { glyph } from './glyphs';
import { speech } from './speech';
import { sfx } from './sfx';
import { anyOverlayOpen } from './ui';

// Finger tracing: each letter of the word gets a dotted guide. The child
// traces the glowing letter; when nearly all of every stroke is covered (and the finger lifts) the
// letter turns solid and its name is spoken. It is generous on purpose,
// and after a while of no progress it shows (and finally does) the stroke.

const NS = 'http://www.w3.org/2000/svg';
const GAP = 22;
const TOL = 14; // how close (in letter units, letters are 100 tall) a touch must be
const STEP = 5; // sample spacing along each stroke
const COLORS = ['#e3685b', '#3f8f8a', '#e8a93c', '#6c7fc4', '#d9788f', '#5f9e6e', '#c98a4b'];

interface Sample { x: number; y: number; hit: boolean }
interface Stroke { el: SVGPathElement; pts: Sample[] }
interface Letter { ch: string; g: SVGGElement; strokes: Stroke[]; done: boolean; x: number }

const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent?: Element) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  parent?.appendChild(e);
  return e;
};

export function traceWord(host: HTMLElement, word: string, onLetter?: (i: number) => void): { done: Promise<void>; cancel: () => void } {
  const letters: Letter[] = [];
  const hasAsc = /[A-Zbdfhklt]/.test(word);
  const hasDesc = /[gjpqy]/.test(word);
  const top = hasAsc ? -16 : 30;
  const bottom = hasDesc ? 150 : 116;
  let width = 0;
  for (const ch of word) width += glyph(ch).w + GAP;
  width -= GAP;

  const svg = el('svg', { viewBox: `-14 ${top} ${width + 28} ${bottom - top}`, class: 'trace-svg' });
  host.appendChild(svg);
  // handwriting lines
  const lines = el('g', { class: 'trace-lines' }, svg);
  for (const [y, cls] of [[0, 'l-top'], [45, 'l-mid'], [100, 'l-base']] as const)
    if (y >= top) el('path', { d: `M-10 ${y} L${width + 10} ${y}`, class: cls }, lines);

  let x = 0;
  [...word].forEach((ch, i) => {
    const gl = glyph(ch);
    const g = el('g', { class: 'trace-letter', transform: `translate(${x} 0)` }, svg);
    const strokes: Stroke[] = gl.strokes.map((d) => {
      el('path', { d, class: 'guide-bg' }, g);
      const p = el('path', { d, class: 'guide', style: `--c:${COLORS[i % COLORS.length]}` }, g);
      const len = p.getTotalLength();
      const pts: Sample[] = [];
      const n = Math.max(2, Math.ceil(len / STEP));
      for (let k = 0; k <= n; k++) {
        const pt = p.getPointAtLength((k / n) * len);
        pts.push({ x: pt.x + x, y: pt.y, hit: false });
      }
      return { el: p, pts };
    });
    letters.push({ ch, g, strokes, done: false, x });
    x += gl.w + GAP;
  });

  const ink = el('g', { class: 'ink' }, svg);
  const startDot = el('circle', { r: 9, class: 'start-dot' }, svg);
  const hintDot = el('circle', { r: 10, class: 'hint-dot' }, svg);

  let cur = 0;
  let inkPath: SVGPathElement | null = null;
  let inkD = '';
  let last: { x: number; y: number } | null = null;
  let lastProgress = performance.now();
  let hints = 0;
  let cancelled = false;
  let resolveDone!: () => void;
  const done = new Promise<void>((r) => (resolveDone = r));

  const nextStroke = () => letters[cur]?.strokes.find((s) => coverage(s) < 0.8);
  const coverage = (s: Stroke) => s.pts.filter((p) => p.hit).length / s.pts.length;

  function focus() {
    letters.forEach((l, i) => l.g.classList.toggle('current', i === cur));
    const s = nextStroke();
    if (s) {
      startDot.setAttribute('cx', String(s.pts[0].x));
      startDot.setAttribute('cy', String(s.pts[0].y));
      startDot.style.display = '';
    } else startDot.style.display = 'none';
  }

  function toSvg(e: PointerEvent) {
    const m = svg.getScreenCTM();
    if (!m) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }

  function mark(p: { x: number; y: number }) {
    const l = letters[cur];
    if (!l) return;
    let any = false;
    for (const s of l.strokes)
      for (const q of s.pts)
        if (!q.hit && (q.x - p.x) ** 2 + (q.y - p.y) ** 2 < TOL * TOL) {
          q.hit = true;
          any = true;
        }
    if (any) {
      lastProgress = performance.now();
      hints = 0;
      focus();
    }
  }

  function check() {
    const l = letters[cur];
    if (!l || l.done) return;
    const all = l.strokes.flatMap((s) => s.pts);
    const total = all.filter((p) => p.hit).length / all.length;
    if (total >= 0.85 && l.strokes.every((s) => coverage(s) >= 0.8)) finishLetter();
  }

  function finishLetter() {
    const l = letters[cur];
    l.done = true;
    l.g.classList.add('done');
    l.g.classList.remove('current');
    ink.querySelectorAll('path').forEach((p) => p.classList.add('fade'));
    setTimeout(() => ink.querySelectorAll('path.fade').forEach((p) => p.remove()), 500);
    inkPath = null;
    sfx.chime(cur);
    speech.letter(l.ch);
    onLetter?.(cur);
    cur++;
    lastProgress = performance.now();
    hints = 0;
    if (cur >= letters.length) {
      startDot.style.display = 'none';
      stop();
      setTimeout(resolveDone, 700);
    } else focus();
  }

  function onDown(e: PointerEvent) {
    e.preventDefault();
    svg.setPointerCapture?.(e.pointerId);
    const p = toSvg(e);
    if (!p) return;
    last = p;
    inkD = `M${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    inkPath = el('path', { d: inkD, class: 'ink-line', style: `--c:${COLORS[cur % COLORS.length]}` }, ink);
    mark(p);
  }
  function onMove(e: PointerEvent) {
    if (!inkPath || !last) return;
    e.preventDefault();
    const p = toSvg(e);
    if (!p) return;
    const dist = Math.hypot(p.x - last.x, p.y - last.y);
    const n = Math.ceil(dist / 4);
    for (let k = 1; k <= n; k++) mark({ x: last.x + ((p.x - last.x) * k) / n, y: last.y + ((p.y - last.y) * k) / n });
    last = p;
    if (inkPath) {
      inkD += ` L${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      inkPath.setAttribute('d', inkD);
    }
  }
  // a letter is only done once the finger lifts, so the child can finish the stroke
  function onUp() {
    inkPath = null;
    last = null;
    check();
  }

  svg.addEventListener('pointerdown', onDown);
  svg.addEventListener('pointermove', onMove);
  svg.addEventListener('pointerup', onUp);
  svg.addEventListener('pointercancel', onUp);

  // hints: a dot glides along the next stroke; after three hints we trace it together
  let hintAnim = 0;
  const timer = window.setInterval(() => {
    if (cancelled || cur >= letters.length) return;
    // no hints while the sticker book or a menu is open, or the page is hidden
    if (anyOverlayOpen() || document.hidden) { lastProgress = performance.now(); return; }
    if (performance.now() - lastProgress < 6000 || hintAnim) return;
    hints++;
    lastProgress = performance.now();
    if (hints > 3) return autoTrace();
    showHint();
  }, 500);

  function glide(s: Stroke, dur: number, onPoint?: (i: number) => void): Promise<void> {
    return new Promise((res) => {
      const t0 = performance.now();
      hintDot.style.display = 'block';
      const tick = (t: number) => {
        if (cancelled) return res();
        const k = Math.min(1, (t - t0) / dur);
        const i = Math.floor(k * (s.pts.length - 1));
        const p = s.pts[i];
        hintDot.setAttribute('cx', String(p.x));
        hintDot.setAttribute('cy', String(p.y));
        onPoint?.(i);
        if (k < 1) hintAnim = requestAnimationFrame(tick);
        else {
          hintDot.style.display = 'none';
          hintAnim = 0;
          res();
        }
      };
      hintAnim = requestAnimationFrame(tick);
    });
  }

  function showHint() {
    const s = nextStroke();
    if (s) glide(s, 1400);
  }

  async function autoTrace() {
    const l = letters[cur];
    if (!l) return;
    for (const s of l.strokes) {
      if (coverage(s) >= 0.8) continue;
      await glide(s, 1100, (i) => {
        s.pts[i].hit = true;
        if (i > 0) s.pts[i - 1].hit = true;
      });
      s.pts.forEach((p) => (p.hit = true));
    }
    if (!cancelled && !l.done) finishLetter();
  }

  function stop() {
    window.clearInterval(timer);
    cancelAnimationFrame(hintAnim);
    hintDot.style.display = 'none';
  }

  focus();
  return {
    done,
    cancel: () => {
      cancelled = true;
      stop();
      resolveDone();
    },
  };
}
