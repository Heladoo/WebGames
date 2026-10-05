import { heroArt, HeroId } from './art/characters';
import { friendArt, friendIcon, isFlying } from './art/friends';
import { cloudArt, GROUND, moonArt, PlaceId, placeLayers, rainbowArt, SkyId, skyBands, sunArt, TILE } from './art/places';
import { RIDES } from './art/rides';
import { C, line, piece } from './art/paper';
import type { Trip } from './state';

// The walking scene: one SVG with parallax scenery, the sky, the hero with
// everything it has collected, and friends following behind.

const HERO_SCALE = 0.95;
const H = 450;

export interface View {
  x0: number;
  y0: number;
  w: number;
  h: number;
}

function heroGroup(t: Trip, heroX: number) {
  if (!t.hero) return '';
  const ride = t.ride ? RIDES[t.ride] : null;
  const look = { worn: t.worn, carry: t.carry, air: t.air, seated: !!ride };
  const dy = ride ? ride.dy : 0;
  const s = HERO_SCALE;
  return `<g class="walker${ride ? ' riding' : ''}" transform="translate(${heroX - 100 * s} ${GROUND + 44 - 194 * s}) scale(${s})">
    <g class="bob">
      ${ride ? ride.under : ''}
      <g transform="translate(0 ${dy})" filter="url(#pc)">${heroArt(t.hero as HeroId, look)}</g>
      ${ride ? ride.over : ''}
    </g></g>`;
}

/** Where friend number i (0 = the newest, walking closest) stands. */
function friendSpot(f: string, i: number, heroX: number) {
  const x = heroX - 118 - i * 78;
  const y = isFlying(f) ? GROUND - 70 - (i % 2) * 24 : GROUND + 40 - 96 * 0.8;
  return { x, y };
}

function friendMarkup(t: Trip, f: string, i: number, heroX: number, cls = 'follower', atX?: number) {
  const spot = friendSpot(f, i, heroX);
  const x = atX ?? spot.x, y = spot.y;
  return `<g class="${cls}" data-friend="${f}" style="--d:${i * 0.23}s" transform="translate(${x - 40} ${y}) scale(0.8)">${friendArt(f, t.gear[f])}</g>`;
}

function friendsGroup(t: Trip, heroX: number) {
  return t.friends.slice().reverse().map((f, i) => friendMarkup(t, f, i, heroX)).join(''); // newest walks closest
}

function skyGroup(t: Trip, v: View) {
  const sky = t.sky as SkyId;
  const sx = v.x0 + v.w * 0.8;
  const sy = Math.max(v.y0 + 90, 70);
  let s = skyBands(sky, v.x0, v.y0, v.w);
  if (sky === 'sun' || sky === 'rainbow') s += sunArt(sx, sy);
  if (sky === 'rainbow') s += rainbowArt(v.x0 + v.w * 0.45, GROUND - 20, Math.min(v.w * 0.4, 260));
  if (sky === 'moon') {
    for (let i = 0; i < 40; i++) {
      const x = v.x0 + ((i * 137) % 997) / 997 * v.w;
      const y = v.y0 + ((i * 71) % 613) / 613 * (GROUND - 140 - v.y0);
      s += `<circle class="twinkle" style="--d:${(i % 7) * 0.4}s" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${1.5 + (i % 3)}" fill="#fff8d0"/>`;
    }
    s += moonArt(sx, sy);
  }
  const clouds = sky === 'cloud' || sky === 'rain' ? 7 : sky === 'moon' ? 2 : 3;
  const fill = sky === 'rain' ? '#eef1f2' : sky === 'moon' ? '#7c7cb4' : '#fffdf6';
  s += `<g class="clouds">`;
  for (let i = 0; i < clouds; i++) {
    const x = v.x0 + ((i * 263 + 80) % 1000) / 1000 * v.w;
    const y = Math.max(v.y0 + 60, 40) + (i % 3) * 38;
    s += `<g class="cloud-drift" style="--d:${-i * 9}s">${cloudArt(x, y, 0.7 + (i % 3) * 0.2, fill)}</g>`;
  }
  return s + `</g>`;
}

function weather(t: Trip, v: View) {
  let s = '';
  if (t.sky === 'rain') {
    s += `<g class="rain">`;
    for (let i = 0; i < 70; i++) {
      const x = v.x0 + ((i * 97) % 1000) / 1000 * v.w;
      const y = v.y0 + ((i * 53) % 700) / 700 * v.h;
      s += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} l-4 14" stroke="#7fa9d8" stroke-width="3" stroke-linecap="round" opacity="0.7"/>`;
    }
    s += `</g>`;
  }
  if (t.place === 'snow') {
    s += `<g class="snowfall">`;
    for (let i = 0; i < 50; i++) {
      const x = v.x0 + ((i * 131) % 1000) / 1000 * v.w;
      const y = v.y0 + ((i * 79) % 700) / 700 * v.h;
      s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${2 + (i % 3)}" fill="#fff" opacity="0.9"/>`;
    }
    s += `</g>`;
  }
  if (t.sky === 'moon') {
    s += `<defs><linearGradient id="night-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2150" stop-opacity="0"/><stop offset="1" stop-color="#1c2150" stop-opacity="0.34"/></linearGradient></defs>
      <rect x="${v.x0 - 10}" y="${GROUND - 200}" width="${v.w + 20}" height="${v.h + 200}" fill="url(#night-g)" pointer-events="none"/>`;
    for (let i = 0; i < 12; i++) {
      const x = v.x0 + ((i * 173) % 1000) / 1000 * v.w;
      const y = GROUND - 30 - ((i * 37) % 120);
      s += `<circle class="firefly" style="--d:${(i % 5) * 0.6}s" cx="${x.toFixed(0)}" cy="${y}" r="3.5" fill="#fff6a0"/>`;
    }
  }
  return s;
}

function layer(content: string, cls: string, v: View) {
  const first = Math.floor(v.x0 / TILE) - 1;
  const last = Math.ceil((v.x0 + v.w) / TILE) + 1;
  let s = '';
  for (let i = first; i <= last; i++) s += `<g transform="translate(${i * TILE} 0)">${content}</g>`;
  return `<g class="layer ${cls}">${s}</g>`;
}

/** The whole scene as an SVG string (used on screen and for postcards). */
export function sceneMarkup(t: Trip, v: View, heroX: number): string {
  const l = placeLayers(t.place as PlaceId);
  return `${skyGroup(t, v)}
    <g class="land">${layer(l.far, 'far', v)}${layer(l.mid, 'mid', v)}${layer(l.ground, 'ground', v)}</g>
    ${weather(t, v)}
    ${t.ride === 'boat' ? water(v) : ''}
    <g class="party">${friendsGroup(t, heroX)}${heroGroup(t, heroX)}</g>`;
}

/** A band of water along the trail, so a boat has something to float on. */
function water(v: View) {
  const x0 = v.x0 - 40, x1 = v.x0 + v.w + 40;
  let waves = '';
  for (let x = x0; x < x1 + 60; x += 30) waves += ` q7.5 -6 15 0 t15 0`;
  return `<g class="water">${piece(`M${x0} ${GROUND + 18} L${x1} ${GROUND + 18} L${x1} ${GROUND + 66} L${x0} ${GROUND + 66} Z`, '#8ecfd6', { lift: 1.2 })}
    <g class="waves">${line(`M${x0} ${GROUND + 30}${waves}`, '#fffdf6', 2.4, 'opacity="0.7"')}${line(`M${x0 + 12} ${GROUND + 50}${waves}`, '#fffdf6', 2.4, 'opacity="0.5"')}</g></g>`;
}

/** The signpost where the next choice waits. */
function signArt() {
  return `<g data-sign="">
    ${piece('M-5 -84 L5 -84 L5 4 L-5 4 Z', C.bark, { lift: 1.4 })}
    ${piece('M-38 -128 C-38 -134 -34 -138 -28 -138 L28 -138 C34 -138 38 -134 38 -128 L38 -92 C38 -86 34 -82 28 -82 L-28 -82 C-34 -82 -38 -86 -38 -92 Z', C.butter, { lift: 2.2 })}
    ${piece('M-30 -130 L30 -130 L30 -90 L-30 -90 Z', C.white, { lift: 0.6 })}
    ${piece('M-9 -118 C-9 -128 9 -128 9 -118 C9 -111 2 -110 2 -104 L-2 -104 C-2 -112 4 -113 4 -118 C4 -122 -4 -122 -4 -118 Z M-2.5 -99 L2.5 -99 L2.5 -94 L-2.5 -94 Z', C.coral, { lift: 0.5 })}</g>`;
}

export class Scene {
  readonly svg: SVGSVGElement;
  private trip: Trip | null = null;
  view: View = { x0: 0, y0: 0, w: 800, h: H };
  heroX = 400;

  constructor(svg: SVGSVGElement) {
    this.svg = svg;
    window.addEventListener('resize', () => this.fit());
  }

  fit() {
    const r = this.svg.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    const aspect = r.width / Math.max(1, r.height);
    const portrait = aspect < 0.8;
    const w = Math.max(portrait ? 330 : 420, Math.min(1600, H * aspect));
    const h = w / aspect;
    // on tall screens, zoom in a little and show more ground under the trail
    const below = portrait ? Math.min(60, h * 0.07) : 0;
    const heroFrac = aspect < 1 ? 0.64 : 0.58;
    const x0 = this.heroX - w * heroFrac;
    const v = { x0: Math.round(x0), y0: Math.round(H + below - h), w: Math.round(w), h: Math.round(h) };
    const changed = v.w !== this.view.w || v.h !== this.view.h;
    this.view = v;
    this.svg.setAttribute('viewBox', `${v.x0} ${v.y0} ${v.w} ${v.h}`);
    if (changed && this.trip) this.render(this.trip);
  }

  render(t: Trip) {
    this.trip = t;
    const scroll = this.scroll();
    this.svg.innerHTML = sceneMarkup(t, this.view, this.heroX);
    this.setScroll(this.svg, scroll);
    if (this.sign) this.svg.querySelector('.party')?.before(this.sign.el);
  }

  /**
   * How far each scenery layer has scrolled (0–1 of a tile). New markup would
   * restart the scroll at 0, so the hero would always stop in front of the same
   * tree; the scroll carries over instead (and starts at a random spot).
   */
  private scroll(root: Element = this.svg): number[] {
    return ['far', 'mid', 'ground'].map((k) => {
      const a = root.querySelector(`.layer.${k}`)?.getAnimations()[0];
      return a ? a.effect?.getComputedTiming().progress ?? 0 : Math.random();
    });
  }

  private setScroll(root: Element, scroll: number[]) {
    ['far', 'mid', 'ground'].forEach((k, i) => {
      const a = root.querySelector(`.layer.${k}`)?.getAnimations()[0];
      const d = Number(a?.effect?.getComputedTiming().duration) || 0;
      if (a && d) a.currentTime = scroll[i] * d;
    });
  }

  private sign: { el: SVGGElement; x: number } | null = null;

  /**
   * A signpost comes along the trail (moving with the ground) and the
   * promise resolves when it reaches the hero, where the next choice waits.
   */
  walkToSign(speed: number, isPaused: () => boolean): Promise<void> {
    this.clearSign();
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGGElement;
    el.setAttribute('class', 'signpost');
    el.innerHTML = signArt();
    const stop = Math.min(this.heroX + 150, this.view.x0 + this.view.w - 44);
    const start = Math.max(this.view.x0 + this.view.w + 60, stop + 360);
    this.sign = { el, x: start };
    this.svg.querySelector('.party')?.before(el);
    this.setWalking(true);
    return new Promise((resolve) => {
      let last = performance.now();
      const tick = (now: number) => {
        const sign = this.sign;
        if (!sign || sign.el !== el) return resolve();
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        if (!isPaused()) sign.x = Math.max(stop, sign.x - speed * dt);
        el.setAttribute('transform', `translate(${sign.x.toFixed(1)} ${GROUND + 34})`);
        if (sign.x <= stop) {
          this.setWalking(false);
          el.classList.add('arrived');
          return resolve();
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /** Where the signpost is on screen (the choice pops out of it). */
  signRect(): DOMRect | null {
    return this.sign?.el.querySelector('[data-sign] path:last-child')?.getBoundingClientRect() ?? null;
  }

  clearSign() {
    if (!this.sign) return;
    const el = this.sign.el;
    this.sign = null;
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 500);
  }

  /** Fade from the old scenery into the new one (a new place or sky). */
  crossfade(t: Trip) {
    const scroll = this.scroll();
    const old = this.svg.cloneNode(true) as SVGSVGElement;
    old.classList.add('scene-old');
    old.removeAttribute('id');
    this.svg.parentElement?.insertBefore(old, this.svg.nextSibling);
    this.setScroll(old, scroll);
    this.render(t);
    requestAnimationFrame(() => requestAnimationFrame(() => old.classList.add('gone')));
    setTimeout(() => old.remove(), 1500);
  }

  setWalking(on: boolean) {
    this.svg.classList.toggle('walking', on);
  }

  /**
   * A friend who has to leave (a fourth one joined) waves goodbye from its own
   * spot and walks off the way the trail came. Call it after rendering the trip
   * without that friend and before the new one joins, so nobody stands in its
   * place. The paper bubble floats above everyone (inside the view, with the
   * friend's picture), so on a phone, where the last friend is out of view, the
   * child still sees who says goodbye.
   */
  farewell(before: Trip, f: string, text: string) {
    const i = before.friends.length - 1 - before.friends.indexOf(f);
    const spot = friendSpot(f, i, this.heroX);
    const w = 52 + text.length * 11;
    const h = 44;
    const v = this.view;
    const bx = Math.max(v.x0 + 10, Math.min(spot.x - w / 2, v.x0 + v.w - w - 10));
    const by = GROUND - 215;
    // the tail points down towards the friend
    const tx = Math.min(Math.max(spot.x, bx + 26), bx + w - 26);
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'farewell');
    g.innerHTML = `<g class="farewell-walk">${friendMarkup(before, f, i, this.heroX, 'leaver')}</g>
      <g class="bye-bubble" style="transform-origin:${tx}px ${by + h + 10}px">
        ${piece(`M${bx + 14} ${by} H${bx + w - 14} A14 14 0 0 1 ${bx + w} ${by + 14} V${by + h - 14} A14 14 0 0 1 ${bx + w - 14} ${by + h} H${tx + 8} L${tx} ${by + h + 12} L${tx - 8} ${by + h} H${bx + 14} A14 14 0 0 1 ${bx} ${by + h - 14} V${by + 14} A14 14 0 0 1 ${bx + 14} ${by} Z`, '#fffdf8', { lift: 1.4 })}
        <g transform="translate(${bx + 6} ${by + 4}) scale(0.18)">${friendIcon(f)}</g>
        <text x="${bx + 44 + (w - 44) / 2}" y="${by + h / 2 + 1}" text-anchor="middle" dominant-baseline="middle" class="bye-text">${text}</text></g>`;
    this.svg.querySelector('.party')?.appendChild(g);
    setTimeout(() => g.remove(), 3600);
  }

  /** Little sparkles around the hero (a new item "pops" on), or around a friend. */
  sparkle(friend?: string) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'sparkles');
    const t = this.trip;
    const fi = friend && t ? t.friends.length - 1 - t.friends.indexOf(friend) : -1;
    const spot = friend && t && fi >= 0 ? friendSpot(friend, fi, this.heroX) : null;
    const cx = spot ? spot.x : this.heroX;
    const cy = spot ? spot.y + 40 : GROUND - 80;
    const k = spot ? 0.55 : 1;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const r = (70 + (i % 3) * 18) * k;
      g.innerHTML += `<path style="--dx:${(Math.cos(a) * r).toFixed(0)}px;--dy:${(Math.sin(a) * r).toFixed(0)}px" transform="translate(${cx} ${cy})" d="M0 -9 L2.5 -2.5 L9 0 L2.5 2.5 L0 9 L-2.5 2.5 L-9 0 L-2.5 -2.5 Z" fill="${['#ffd45c', '#ff8fb0', '#7fc8f0'][i % 3]}"/>`;
    }
    this.svg.appendChild(g);
    setTimeout(() => g.remove(), 1200);
  }

  /** The nearest thing with a word under a tap, if any. */
  wordAt(target: EventTarget | null): string | null {
    const e = (target as Element | null)?.closest?.('[data-word]');
    return e?.getAttribute('data-word') ?? null;
  }
}
