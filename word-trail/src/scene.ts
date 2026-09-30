import { heroArt, HeroId } from './art/characters';
import { friendArt, isFlying } from './art/friends';
import { cloudArt, GROUND, moonArt, PlaceId, placeLayers, rainbowArt, SkyId, skyColors, sunArt, TILE } from './art/places';
import { RIDES } from './art/rides';
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
  const ride = t.ride && t.rideLeft > 0 ? RIDES[t.ride] : null;
  const look = { worn: t.worn, carry: t.carry, seated: !!ride };
  const dy = ride ? ride.dy : 0;
  const s = HERO_SCALE;
  return `<g class="walker${ride ? ' riding' : ''}" transform="translate(${heroX - 100 * s} ${GROUND + 44 - 194 * s}) scale(${s})">
    <g class="bob">
      ${ride ? ride.under : ''}
      <g transform="translate(0 ${dy})">${heroArt(t.hero as HeroId, look)}</g>
      ${ride ? ride.over : ''}
    </g></g>`;
}

function friendsGroup(t: Trip, heroX: number) {
  const out: string[] = [];
  const list = t.friends.slice().reverse(); // newest walks closest
  list.forEach((f, i) => {
    const x = heroX - 118 - i * 78;
    const fly = isFlying(f);
    const y = fly ? GROUND - 70 - (i % 2) * 24 : GROUND + 40 - 96 * 0.8;
    out.push(`<g class="follower" style="--d:${i * 0.23}s" transform="translate(${x - 40} ${y}) scale(0.8)">${friendArt(f)}</g>`);
  });
  return out.join('');
}

function skyGroup(t: Trip, v: View) {
  const sky = t.sky as SkyId;
  const [top, bottom] = skyColors(sky);
  const sx = v.x0 + v.w * 0.8;
  const sy = Math.max(v.y0 + 90, 70);
  let s = `<defs><linearGradient id="sky-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs>
    <rect x="${v.x0 - 10}" y="${v.y0 - 10}" width="${v.w + 20}" height="${GROUND - v.y0 + 20}" fill="url(#sky-g)"/>`;
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
  const fill = sky === 'rain' ? '#e9eef5' : sky === 'moon' ? '#8c8ac0' : '#fff';
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
    <g class="party">${friendsGroup(t, heroX)}${heroGroup(t, heroX)}</g>`;
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
    this.svg.innerHTML = sceneMarkup(t, this.view, this.heroX);
  }

  /** Fade from the old scenery into the new one (a new place or sky). */
  crossfade(t: Trip) {
    const old = this.svg.cloneNode(true) as SVGSVGElement;
    old.classList.add('scene-old');
    old.removeAttribute('id');
    this.svg.parentElement?.insertBefore(old, this.svg.nextSibling);
    this.render(t);
    requestAnimationFrame(() => requestAnimationFrame(() => old.classList.add('gone')));
    setTimeout(() => old.remove(), 1500);
  }

  setWalking(on: boolean) {
    this.svg.classList.toggle('walking', on);
  }

  /** Little sparkles around a spot of the hero (a new item "pops" on). */
  sparkle() {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'sparkles');
    const cx = this.heroX;
    const cy = GROUND - 80;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const r = 70 + (i % 3) * 18;
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
