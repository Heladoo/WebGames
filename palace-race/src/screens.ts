// The screens. No reading is needed anywhere: every choice is a picture, every button an icon, prices and rewards
// are coins with numbers, and "not yet" is a gentle wobble with a coin jar showing how close the child is.

import { ANIMALS, type AnimalId } from './art/animals';
import { BRAIDS, HELMETS, KIDS, SADDLES, type KidId } from './art/riders';
import { TRACKS, TRACK_NAME, STAGE_W, STAGE_H, type TrackId } from './art/tracks';
import { podiumSVG } from './art/podium';
import { paint } from './art/sprite';
import { ICONS } from './art/icons';
import { ITEMS, TRACK_PRICE, TUTORIAL_RACES, itemKey, type ItemKind } from './content';
import { sfx } from './sfx';
import { stats } from './stats';
import { runRace, type RaceResult } from './race/race';
import { animalPic, coinTag, fill, flyCoins, jar, kidPic, skyPic, trackPic } from './ui';
import type { App } from './app';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let counted = false;

function wobble(el: Element) {
  el.classList.remove('wobble');
  void (el as HTMLElement).offsetWidth;
  el.classList.add('wobble');
}

/** "Not yet": a soft sound, a wobble, and a coin jar over the thing for a moment. */
function notYet(el: HTMLElement, have: number, price: number) {
  sfx.notYet();
  wobble(el);
  el.querySelector('.jar-pop')?.remove();
  const j = document.createElement('div');
  j.className = 'jar-pop';
  j.innerHTML = jar(have, price) + coinTag(price);
  el.appendChild(j);
  window.setTimeout(() => j.remove(), 2200);
}

// ---------------------------------------------------------------- title

export function titleScreen(app: App) {
  app.setTrack('menu');
  app.root.innerHTML = `<div class="title"><div class="title-bg slot"></div><div class="title-box"><img class="logo" src="/logo.webp" alt="המרוץ לארמון" width="900" height="740" draggable="false"><button class="round-btn big" id="btn-play" aria-label="לשחק">${ICONS.play}</button></div></div>`;
  app.root.querySelector('#btn-play')!.addEventListener('click', () => {
    sfx.select();
    app.go('map');
  });
  const bg = app.root.querySelector<HTMLElement>('.title-bg')!;
  const w = Math.max(innerWidth, (innerHeight * STAGE_W) / STAGE_H);
  fill(bg, trackPic('forest', w));
  const logo = app.root.querySelector<HTMLImageElement>('img.logo')!;
  void Promise.all([logo.decode().catch(() => {}), document.fonts.ready]).then(() => ((window as unknown as { __ready: boolean }).__ready = true));
}

// ---------------------------------------------------------------- map

export function mapScreen(app: App) {
  app.setTrack('menu');
  const d = app.data;
  app.root.innerHTML = `<section class="screen map"><div class="map-bg slot"></div>${app.topbar()}
    <div class="journey">${TRACKS.map((t, i) => {
      const open = d.unlocked.includes(t);
      return `<button class="track-card ${open ? 'open' : 'locked'}" data-t="${t}" aria-label="${TRACK_NAME[t]}${open ? '' : `: נעול, ${TRACK_PRICE[t]} מטבעות`}">
        <div class="thumb slot"></div>
        <span class="step">${i + 1}</span>
        ${open ? `<span class="badge go">${ICONS.play}</span>` : `<span class="badge lock">${ICONS.lock}</span>${coinTag(TRACK_PRICE[t])}`}
      </button>`;
    }).join('<i class="path"></i>')}<i class="path"></i><div class="goal-palace" aria-hidden="true">${ICONS.palace}</div></div>
  </section>`;
  const el = app.root.firstElementChild as HTMLElement;
  app.wireTopbar(el, 'map');
  const portrait = innerWidth < innerHeight;
  const cardW = portrait ? Math.min(220, (innerWidth - 70) / 2) : Math.min(260, (innerWidth - 48 - 6 * 28 - 96) / 5, (innerHeight - 160) * 0.9);
  fill(el.querySelector('.map-bg')!, skyPic('garden', Math.max(innerWidth, (innerHeight * STAGE_W) / STAGE_H)));
  el.querySelectorAll<HTMLElement>('.track-card').forEach((c) => {
    const t = c.dataset.t as TrackId;
    fill(c.querySelector('.thumb')!, trackPic(t, cardW));
    c.addEventListener('click', async () => {
      if (d.unlocked.includes(t)) {
        sfx.select();
        d.track = t;
        app.save();
        app.go('animal');
        return;
      }
      const price = TRACK_PRICE[t];
      if (d.coins < price) return notYet(c, d.coins, price);
      // open it: the coins fly to the card and the lock opens
      d.coins -= price;
      d.unlocked.push(t);
      app.save();
      await flyCoins(el.querySelector('[data-tb="coins"]')!, c, 8, (i) => sfx.coin(i));
      app.showCoins();
      sfx.open();
      c.classList.remove('locked');
      c.classList.add('open', 'opened');
      c.querySelector('.badge.lock')!.outerHTML = `<span class="badge go">${ICONS.play}</span>`;
      c.querySelector('.coin-tag')?.remove();
    });
  });
  (window as unknown as { __ready: boolean }).__ready = true;
}

// ---------------------------------------------------------------- choosing the animal and the rider

function chooser(app: App, kind: 'animal' | 'kid') {
  const d = app.data;
  const items: string[] = kind === 'animal' ? ANIMALS : KIDS;
  app.root.innerHTML = `<section class="screen choose ${kind}">${app.topbar()}
    <div class="choices">${items.map((id) => `<button class="choice" data-id="${id}" aria-label="${id}" aria-pressed="false"><div class="slot"></div><span class="badge chosen">${ICONS.check}</span></button>`).join('')}</div>
    <button class="round-btn big go" id="btn-next" aria-label="${kind === 'animal' ? 'בוחרים רוכב' : 'למרוץ'}">${ICONS.play}</button>
  </section>`;
  const el = app.root.firstElementChild as HTMLElement;
  app.wireTopbar(el, kind);
  const portrait = innerWidth < innerHeight;
  const w = kind === 'animal' ? Math.min(270, (innerWidth - 90) / (portrait ? 2.2 : 5.7), innerHeight * (portrait ? 0.3 : 0.5)) : Math.min(190, (innerWidth - 70) / (portrait ? 2.4 : 4.6), innerHeight * (portrait ? 0.24 : 0.36));
  const draw = (b: HTMLElement, happy: boolean) => {
    const id = b.dataset.id!;
    const slot = b.querySelector<HTMLElement>('.slot')!;
    fill(slot, kind === 'animal' ? animalPic(id as AnimalId, d.outfit.saddle, happy ? 'happy' : 'stand', w) : kidPic(id as KidId, d.outfit, happy ? 'clap0' : 'stand', w));
  };
  const mark = () =>
    el.querySelectorAll<HTMLElement>('.choice').forEach((b) => {
      const on = b.dataset.id === (kind === 'animal' ? d.animal : d.kid);
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    });
  el.querySelectorAll<HTMLElement>('.choice').forEach((b) => {
    draw(b, false);
    b.addEventListener('click', () => {
      sfx.select();
      const prev = el.querySelector<HTMLElement>('.choice.on');
      if (kind === 'animal') d.animal = b.dataset.id as AnimalId;
      else d.kid = b.dataset.id as KidId;
      app.save();
      mark();
      if (prev && prev !== b) draw(prev, false);
      draw(b, true);
      wobble(b);
    });
  });
  mark();
  draw(el.querySelector<HTMLElement>('.choice.on')!, true);
  el.querySelector('#btn-next')!.addEventListener('click', () => {
    sfx.select();
    app.go(kind === 'animal' ? 'kid' : 'race');
  });
  (window as unknown as { __ready: boolean }).__ready = true;
}

export const animalScreen = (app: App) => chooser(app, 'animal');
export const kidScreen = (app: App) => chooser(app, 'kid');

// ---------------------------------------------------------------- shop

let shopTab: ItemKind = 'helmet';

export function shopScreen(app: App) {
  const d = app.data;
  app.root.innerHTML = `<section class="screen shop">${app.topbar({ shop: false })}
    <div class="shop-body">
      <div class="tabs" role="tablist">${(['helmet', 'braids', 'saddle'] as ItemKind[]).map((k) => `<button class="round-btn tab" role="tab" data-k="${k}" aria-label="${k === 'helmet' ? 'קסדות' : k === 'braids' ? 'צמות' : 'אוכפים'}">${ICONS[k]}</button>`).join('')}</div>
      <div class="preview slot"></div>
      <div class="items"></div>
    </div>
    <button class="round-btn big done" id="btn-done" aria-label="סיימתי">${ICONS.check}</button>
  </section>`;
  const el = app.root.firstElementChild as HTMLElement;
  app.wireTopbar(el, 'shop');
  const portrait = innerWidth < innerHeight;
  const preview = el.querySelector<HTMLElement>('.preview')!;
  const list = el.querySelector<HTMLElement>('.items')!;
  const showPreview = () => {
    const pw = Math.min(portrait ? innerWidth * 0.62 : innerHeight * 0.55, 380);
    fill(preview, shopTab === 'saddle' ? animalPic(d.animal, d.outfit.saddle, 'happy', pw * 1.3) : kidPic(d.kid, d.outfit, 'clap0', pw * 0.55));
  };
  const render = () => {
    el.querySelectorAll<HTMLElement>('.tab').forEach((t) => {
      t.classList.toggle('on', t.dataset.k === shopTab);
      t.setAttribute('aria-selected', String(t.dataset.k === shopTab));
    });
    const ids: string[] = shopTab === 'helmet' ? HELMETS : shopTab === 'braids' ? BRAIDS : SADDLES;
    const items = ITEMS.filter((i) => i.kind === shopTab).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    const worn = d.outfit[shopTab];
    list.innerHTML = items
      .map((it) => {
        const owned = d.owned.includes(itemKey(it));
        return `<button class="item ${owned ? 'owned' : ''} ${worn === it.id ? 'on' : ''}" data-id="${it.id}" aria-label="${it.id}${owned ? '' : `: ${it.price} מטבעות`}" aria-pressed="${worn === it.id}"><div class="slot"></div>${worn === it.id ? `<span class="badge chosen">${ICONS.check}</span>` : owned ? '' : coinTag(it.price)}</button>`;
      })
      .join('');
    const iw = portrait ? Math.min(120, innerWidth / 3.6) : Math.min(130, innerHeight / 4.2);
    list.querySelectorAll<HTMLElement>('.item').forEach((b) => {
      const id = b.dataset.id!;
      const o = { ...d.outfit, [shopTab]: id };
      fill(b.querySelector('.slot')!, shopTab === 'saddle' ? animalPic(d.animal, id as never, 'stand', iw * 1.25) : kidPic(d.kid, o, 'stand', iw, true));
      b.addEventListener('click', async () => {
        const it = items.find((i) => i.id === id)!;
        const key = itemKey(it);
        if (!d.owned.includes(key)) {
          if (d.coins < it.price) return notYet(b, d.coins, it.price);
          // pay and put it on in one save, then the coins fly
          d.coins -= it.price;
          d.owned.push(key);
          (d.outfit as unknown as Record<string, string>)[shopTab] = id;
          app.save();
          await flyCoins(el.querySelector('[data-tb="coins"]')!, b, 6, (i) => sfx.coin(i));
          app.showCoins();
          sfx.open();
        } else {
          sfx.select();
          (d.outfit as unknown as Record<string, string>)[shopTab] = id;
          app.save();
        }
        render();
        showPreview();
      });
    });
  };
  el.querySelectorAll<HTMLElement>('.tab').forEach((t) =>
    t.addEventListener('click', () => {
      sfx.tap();
      shopTab = t.dataset.k as ItemKind;
      render();
      showPreview();
    }),
  );
  el.querySelector('#btn-done')!.addEventListener('click', () => {
    sfx.select();
    app.go(app.back === 'shop' ? 'map' : app.back);
  });
  render();
  showPreview();
  (window as unknown as { __ready: boolean }).__ready = true;
}

// ---------------------------------------------------------------- the race and the ceremony

export async function raceScreen(app: App) {
  const d = app.data;
  app.setTrack(d.track);
  // tests drive the real game with window.__drive = { autopilot, speed }
  const drive = (window as unknown as { __drive?: { autopilot?: number; speed?: number } }).__drive ?? {};
  const res = await runRace(
    app.root,
    { track: d.track, animal: d.animal, kid: d.kid, outfit: d.outfit, seed: Math.floor(Math.random() * 1e6), tutorial: d.races < TUTORIAL_RACES, help: d.settings.help, coins: d.coins, ...drive },
    {
      onSoundToggle: () => {
        d.settings.sound = !(d.settings.sound || d.settings.music);
        d.settings.music = d.settings.sound;
        app.applySettings();
        app.save();
        return d.settings.sound;
      },
      soundOn: () => d.settings.sound || d.settings.music,
      onStart: () => {
        if (!counted) stats.start();
        counted = true;
      },
      tick: (dt) => stats.tick(dt),
    },
  );
  if (!res) return app.go('map');
  // the coins are saved straight away, before any celebration
  d.coins += res.coins;
  d.races++;
  if (res.place === 1) d.wins++;
  app.save();
  ceremony(app, res);
}

function ceremony(app: App, res: RaceResult) {
  app.setTrack('menu');
  app.root.innerHTML = `<section class="screen ceremony">
    <canvas class="podium" aria-label="טקס המנצחים"></canvas>
    <div class="confetti" aria-hidden="true"></div>
    <div class="card reward hidden">
      <div class="medal p${res.place}">${res.place <= 3 ? res.place : ICONS.trophy.replace('class="icon"', 'class="icon star"')}</div>
      <div class="sum">${ICONS.coin}<b id="sum">0</b></div>
      <div class="row-btns">
        <button class="round-btn big" id="c-again" aria-label="עוד מרוץ">${ICONS.again}</button>
        <button class="round-btn" id="c-map" aria-label="למפה">${ICONS.home}</button>
        <button class="round-btn" id="c-shop" aria-label="חנות">${ICONS.shop}</button>
        <button class="round-btn" id="c-share" aria-label="לשתף את התמונה">${ICONS.share}</button>
      </div>
    </div>
  </section>`;
  const el = app.root.firstElementChild as HTMLElement;
  const cv = el.querySelector<HTMLCanvasElement>('canvas')!;
  const k = Math.min(1.6, (Math.max(innerWidth, (innerHeight * STAGE_W) / STAGE_H) / STAGE_W) * Math.min(2, devicePixelRatio || 1));
  void paint(podiumSVG(res.racers), { x: 0, y: 0, w: STAGE_W, h: STAGE_H }, k).then((pic) => {
    cv.width = pic.width;
    cv.height = pic.height;
    cv.getContext('2d')!.drawImage(pic, 0, 0);
    cv.classList.add('ready');
    sfx.clap(2.5);
    if (!reduced()) confetti(el.querySelector('.confetti')!);
    window.setTimeout(() => showReward(), 1300);
  });
  const showReward = () => {
    const card = el.querySelector<HTMLElement>('.reward')!;
    card.classList.remove('hidden');
    const sum = el.querySelector<HTMLElement>('#sum')!;
    let n = 0;
    const step = Math.max(1, Math.round(res.coins / 20));
    const t = window.setInterval(() => {
      n = Math.min(res.coins, n + step);
      sum.textContent = String(n);
      sfx.coin(n);
      if (n >= res.coins) {
        clearInterval(t);
        (window as unknown as { __ready: boolean }).__ready = true;
      }
    }, 70);
  };
  el.querySelector('#c-again')!.addEventListener('click', () => {
    sfx.select();
    app.go('race');
  });
  el.querySelector('#c-map')!.addEventListener('click', () => {
    sfx.tap();
    app.go('map');
  });
  el.querySelector('#c-shop')!.addEventListener('click', () => {
    sfx.tap();
    app.back = 'map';
    app.go('shop');
  });
  el.querySelector('#c-share')!.addEventListener('click', () => {
    sfx.tap();
    cv.toBlob(async (b) => {
      if (!b) return;
      const file = new File([b], 'palace-race.png', { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      try {
        if (nav.canShare?.({ files: [file] })) return await nav.share({ files: [file] });
      } catch {
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'palace-race.png';
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }, 'image/png');
  });
}

function confetti(box: HTMLElement) {
  const cols = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#b197fc', '#ff8fc8'];
  for (let i = 0; i < 70; i++) {
    const p = document.createElement('i');
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = cols[i % cols.length];
    p.style.animationDelay = `${Math.random() * 2.5}s`;
    p.style.animationDuration = `${3 + Math.random() * 2.5}s`;
    p.style.setProperty('--x', `${(Math.random() - 0.5) * 120}px`);
    box.appendChild(p);
  }
}
