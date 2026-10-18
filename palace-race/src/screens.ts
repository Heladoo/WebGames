// The screens. No reading is needed anywhere: every choice is a picture, every button an icon, prices and rewards
// are coins or medals with numbers, and "not yet" is a gentle wobble with a coin jar (shop) or medal pips (map).

import { ANIMALS, ANIMAL_NAME, type AnimalId } from './art/animals';
import { HAIRS, HELMETS, KIDS, KID_NAME, SADDLES, type KidId } from './art/riders';
import { TRACKS, TRACK_NAME, STAGE_W, STAGE_H, type TrackId } from './art/tracks';
import { podiumSVG } from './art/podium';
import { paint } from './art/sprite';
import { ICONS } from './art/icons';
import { ITEMS, ITEM_NAME, TRACK_MEDALS, TUTORIAL_RACES, isMedal, itemKey, openTracks, type ItemKind } from './content';
import { sfx } from './sfx';
import { stats } from './stats';
import { runRace, type RaceResult } from './race/race';
import { animalPic, coinTag, fill, flyCoins, jar, kidPic, mapPic, trackPic } from './ui';
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

/** Medal pips: how many medals a track needs, the ones already won filled in. */
const medalPips = (have: number, need: number) =>
  `<span class="pips" role="img" aria-label="${Math.min(have, need)} מתוך ${need} מדליות">${Array.from({ length: need }, (_, i) => (i < have ? ICONS.medal : ICONS.medalEmpty)).join('')}</span>`;

export function mapScreen(app: App) {
  app.setTrack('menu');
  const d = app.data;
  app.root.innerHTML = `<section class="screen map"><div class="map-bg slot"></div>${app.topbar()}
    <div class="journey">${TRACKS.map((t, i) => {
      const open = d.unlocked.includes(t);
      return `<button class="track-card ${open ? 'open' : 'locked'}" data-t="${t}" aria-label="${TRACK_NAME[t]}${open ? '' : `: נפתח אחרי ${TRACK_MEDALS[t]} מדליות`}">
        <div class="thumb slot"></div>
        <span class="step">${i + 1}</span>
        ${open ? `<span class="badge go">${ICONS.play}</span>` : `<span class="badge lock">${ICONS.lock}</span>${medalPips(d.medals, TRACK_MEDALS[t])}`}
      </button>`;
    }).join('<i class="path"></i>')}<i class="path"></i><div class="goal-palace" aria-hidden="true">${ICONS.palace}</div></div>
  </section>`;
  const el = app.root.firstElementChild as HTMLElement;
  app.wireTopbar(el, 'map');
  const portrait = innerWidth < innerHeight;
  const cardW = portrait ? Math.min(220, (innerWidth - 70) / 2) : Math.min(260, (innerWidth - 48 - 6 * 28 - 96) / 5, (innerHeight - 160) * 0.9);
  fill(el.querySelector('.map-bg')!, mapPic(Math.max(innerWidth, (innerHeight * STAGE_W) / STAGE_H)));
  el.querySelectorAll<HTMLElement>('.track-card').forEach((c) => {
    const t = c.dataset.t as TrackId;
    fill(c.querySelector('.thumb')!, trackPic(t, cardW));
    // the pips shrink to stay within their card
    const pips = c.querySelector<HTMLElement>('.pips');
    if (pips) pips.style.setProperty('--pip', `${Math.min(24, (cardW - 14) / TRACK_MEDALS[t])}px`);
    c.addEventListener('click', () => {
      if (!d.unlocked.includes(t)) {
        // not yet: the medal pips show how many more medals open it
        sfx.notYet();
        wobble(c);
        wobble(c.querySelector('.pips')!);
        return;
      }
      sfx.select();
      d.track = t;
      app.save();
      app.go('animal');
    });
  });
  // a track that opened in the last race opens here with a little celebration
  const fresh = el.querySelector<HTMLElement>(`.track-card[data-t="${app.fresh}"]`);
  if (fresh) {
    fresh.classList.add('opened');
    sfx.open();
    app.fresh = null;
  }
  (window as unknown as { __ready: boolean }).__ready = true;
}

// ---------------------------------------------------------------- choosing the animal and the rider

function chooser(app: App, kind: 'animal' | 'kid') {
  const d = app.data;
  const items: string[] = kind === 'animal' ? ANIMALS : KIDS;
  app.root.innerHTML = `<section class="screen choose ${kind}">${app.topbar()}
    <div class="choices">${items.map((id) => `<button class="choice" data-id="${id}" aria-label="${kind === 'animal' ? ANIMAL_NAME[id as AnimalId] : KID_NAME[id as KidId]}" aria-pressed="false"><div class="slot"></div><span class="badge chosen">${ICONS.check}</span></button>`).join('')}</div>
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
      <div class="tabs" role="tablist">${(['helmet', 'hair', 'saddle'] as ItemKind[]).map((k) => `<button class="round-btn tab" role="tab" data-k="${k}" aria-label="${k === 'helmet' ? 'קסדות' : k === 'hair' ? 'תסרוקות' : 'אוכפים'}">${ICONS[k]}</button>`).join('')}</div>
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
    const ids: string[] = shopTab === 'helmet' ? HELMETS : shopTab === 'hair' ? HAIRS : SADDLES;
    const items = ITEMS.filter((i) => i.kind === shopTab).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    const worn = d.outfit[shopTab];
    list.innerHTML = items
      .map((it) => {
        const owned = d.owned.includes(itemKey(it));
        return `<button class="item ${owned ? 'owned' : ''} ${worn === it.id ? 'on' : ''}" data-id="${it.id}" aria-label="${ITEM_NAME[it.kind][it.id]}${owned ? '' : `: ${it.price} מטבעות`}" aria-pressed="${worn === it.id}"><div class="slot"></div>${worn === it.id ? `<span class="badge chosen">${ICONS.check}</span>` : owned ? '' : coinTag(it.price)}</button>`;
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
  // the coins and medals are saved straight away, before any celebration
  const before = { coins: d.coins, medals: d.medals };
  d.coins += res.coins;
  d.races++;
  if (res.place === 1) d.wins++;
  if (isMedal(res.place)) d.medals++;
  const opened = openTracks(d.medals).filter((t) => !d.unlocked.includes(t));
  d.unlocked.push(...opened);
  app.fresh = opened[0] ?? null;
  app.save();
  ceremony(app, res, before, app.fresh);
}

function ceremony(app: App, res: RaceResult, before: { coins: number; medals: number }, opened: TrackId | null) {
  app.setTrack('menu');
  (window as unknown as { __ready: boolean }).__ready = false;
  const d = app.data;
  const medal = isMedal(res.place);
  app.root.innerHTML = `<section class="screen ceremony">
    <canvas class="podium" aria-label="טקס המנצחים"></canvas>
    <canvas class="podium clap" aria-hidden="true"></canvas>
    <div class="confetti" aria-hidden="true"></div>
    ${opened ? `<button class="card new-track hidden" id="c-new" aria-label="מסלול חדש נפתח: ${TRACK_NAME[opened]}"><div class="thumb slot"></div><span class="badge go">${ICONS.play}</span><span class="new-star">${ICONS.unlock}</span></button>` : ''}
    <div class="card reward hidden">
      <div class="medal p${res.place}" aria-label="מקום ${res.place}">${res.place <= 3 ? res.place : ICONS.trophy.replace('class="icon"', 'class="icon star"')}</div>
      <div class="sum medals" aria-label="${d.medals} מדליות">${ICONS.medal}<b id="medals">${before.medals}</b>${medal ? '<i class="plus">+1</i>' : ''}</div>
      <div class="sum coins" aria-label="${d.coins} מטבעות">${ICONS.coin}<b id="sum">${before.coins}</b><i class="plus">+${res.coins}</i></div>
      <div class="row-btns">
        <button class="round-btn big" id="c-map" aria-label="למפה">${ICONS.home}</button>
        <button class="round-btn" id="c-shop" aria-label="חנות">${ICONS.shop}</button>
        <button class="round-btn" id="c-share" aria-label="לשתף את התמונה">${ICONS.share}</button>
      </div>
    </div>
  </section>`;
  const el = app.root.firstElementChild as HTMLElement;
  const [cv, cv2] = el.querySelectorAll<HTMLCanvasElement>('canvas');
  const k = Math.min(1.6, (Math.max(innerWidth, (innerHeight * STAGE_W) / STAGE_H) / STAGE_W) * Math.min(2, devicePixelRatio || 1));
  const put = (c: HTMLCanvasElement, pic: HTMLCanvasElement) => {
    c.width = pic.width;
    c.height = pic.height;
    c.getContext('2d')!.drawImage(pic, 0, 0);
  };
  let clapping = 0;
  void paint(podiumSVG(res.racers, 0), { x: 0, y: 0, w: STAGE_W, h: STAGE_H }, k).then(async (pic) => {
    put(cv, pic);
    cv.classList.add('ready');
    sfx.clap(2.5);
    if (!reduced()) confetti(el.querySelector('.confetti')!);
    window.setTimeout(() => showReward(), 1300);
    // the other half of the clap, painted next; then the two pictures take turns (still under reduced motion)
    put(cv2, await paint(podiumSVG(res.racers, 1), { x: 0, y: 0, w: STAGE_W, h: STAGE_H }, k));
    if (reduced() || !el.isConnected) return;
    let n = 0;
    clapping = window.setInterval(() => {
      if (!el.isConnected) return clearInterval(clapping);
      // clap for a few seconds, rest a moment, clap again
      const on = n++ % 24 < 14;
      cv2.classList.toggle('ready', on && n % 2 === 0);
    }, 260);
  });
  // the coins won rise into the total, and a medal joins the medals
  const countUp = (box: HTMLElement, from: number, to: number, each: (n: number) => void) =>
    new Promise<void>((done) => {
      const b = box.querySelector('b')!;
      box.classList.add('merging');
      let n = from;
      const step = Math.max(1, Math.round((to - from) / 20));
      if (from >= to) return done();
      const t = window.setInterval(() => {
        n = Math.min(to, n + step);
        b.textContent = String(n);
        each(n);
        if (n >= to) {
          clearInterval(t);
          box.classList.remove('merging');
          box.classList.add('merged');
          done();
        }
      }, 70);
    });
  const showReward = async () => {
    el.querySelector('.reward')!.classList.remove('hidden');
    await new Promise((r) => window.setTimeout(r, 500));
    await countUp(el.querySelector('.sum.coins')!, before.coins, d.coins, (n) => sfx.coin(n));
    if (medal) {
      await countUp(el.querySelector('.sum.medals')!, before.medals, d.medals, () => {});
      sfx.open();
    }
    if (opened) {
      const c = el.querySelector<HTMLElement>('#c-new')!;
      fill(c.querySelector('.thumb')!, trackPic(opened, Math.min(190, innerWidth * 0.22, innerHeight * 0.3)));
      c.classList.remove('hidden');
      sfx.open();
    }
    (window as unknown as { __ready: boolean }).__ready = true;
  };
  const leave = () => clearInterval(clapping);
  el.querySelector('#c-new')?.addEventListener('click', () => {
    sfx.select();
    leave();
    app.go('map');
  });
  el.querySelector('#c-map')!.addEventListener('click', () => {
    sfx.tap();
    leave();
    app.go('map');
  });
  el.querySelector('#c-shop')!.addEventListener('click', () => {
    sfx.tap();
    leave();
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
