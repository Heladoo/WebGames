// One race, from "getting ready" to the finish: paints the pictures (with a hoof-print progress bar), counts down
// 3-2-1 with lights and a horn, then runs the simulation every frame, draws it, keeps the HUD up to date, plays the
// sounds and shows the tutorial hand. Resolves with the result, or null if the child went home from the pause screen.

import { ANIMALS, type AnimalId } from '../art/animals';
import { KID, KIDS, type KidId, type Outfit } from '../art/riders';
import type { Racer } from '../art/podium';
import { ICONS } from '../art/icons';
import type { TrackId } from '../art/tracks';
import { rng } from '../art/paint';
import { ITEMS, raceCoins } from '../content';
import { sfx } from '../sfx';
import { Controls } from './input';
import { Race, STRIDE } from './sim';
import { candyJobs, extraJobs, framesOf, inBatches, paintScale, propJobs, runnerJobs, trackJobs } from './sprites';
import { RaceView, stageLayout, type Pics } from './view';
import type { Layer } from '../art/tracks';

export interface RaceSetup {
  track: TrackId;
  animal: AnimalId;
  kid: KidId;
  outfit: Outfit;
  seed: number;
  tutorial: boolean;
  help: boolean;
  autopilot?: number;
  speed?: number;
  coins: number; // shown in the HUD
}

export interface RaceResult { order: number[]; racers: Racer[]; place: number; candies: number; coins: number }

/** The five racers: the child's, then the other four animals with the other children in random outfits. */
export function racersFor(s: { animal: AnimalId; kid: KidId; outfit: Outfit; seed: number }): Racer[] {
  const r = rng(s.seed * 31 + 5);
  const others = KIDS.filter((k) => k !== s.kid);
  const kids = [...others, others[0]];
  const of = (kind: string) => ITEMS.filter((i) => i.kind === kind).map((i) => i.id);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  return [
    { animal: s.animal, kid: s.kid, outfit: s.outfit },
    ...ANIMALS.filter((a) => a !== s.animal).map((animal, i) => ({
      animal,
      kid: kids[i],
      // the repeated child always looks different from its twin
      outfit: { helmet: (i === 3 ? 'stars' : pick(of('helmet'))) as Outfit['helmet'], braids: (KID[kids[i]].girl ? pick(of('braids')) : 'none') as Outfit['braids'], saddle: pick(of('saddle')) as Outfit['saddle'] },
    })),
  ];
}

const html = (setup: RaceSetup) => `
  <canvas class="stage live" aria-label="המרוץ"></canvas>
  <div class="hud">
    <div class="row">
      <div class="speed"><button class="round-btn" id="btn-pause" aria-label="עצירה">${ICONS.pause}</button><div class="bar" aria-hidden="true"><div class="fill"></div></div></div>
      <div class="place" id="place" aria-live="polite">1</div>
      <div class="pills"><div class="pill" aria-label="ממתקים">${ICONS.candy}<span id="n-candy">0</span></div><div class="pill" aria-label="מטבעות">${ICONS.coin}<span id="n-coins">${setup.coins}</span></div></div>
    </div>
    <div class="progress" aria-hidden="true"><div class="goal">${ICONS.palace}</div></div>
    <div class="pad left"><button class="round-btn" id="btn-far" aria-label="מסלול רחוק">${ICONS.laneFar}</button><button class="round-btn" id="btn-near" aria-label="מסלול קרוב">${ICONS.laneNear}</button></div>
    <div class="pad right"><button class="round-btn" id="btn-jump" aria-label="קפיצה">${ICONS.up}</button><button class="round-btn" id="btn-duck" aria-label="התכופפות">${ICONS.down}</button></div>
    <div class="tutor hidden" id="tutor">${ICONS.hand}</div>
  </div>
  <div class="countdown hidden" id="countdown" aria-hidden="true"><div class="lights"><i></i><i></i><i></i></div><b id="count-n"></b></div>
  <div class="loading" id="loading" aria-label="מתכוננים"><div class="hooves">${'<i></i>'.repeat(8)}</div><div class="load-bar"><div></div></div></div>
  <div class="overlay hidden" id="pause" role="dialog" aria-label="עצירה">
    <div class="card pause-card">
      <div class="row-btns">
        <button class="round-btn huge" id="btn-resume" aria-label="להמשיך">${ICONS.play}</button>
        <button class="round-btn" id="btn-home" aria-label="לבית">${ICONS.home}</button>
        <button class="round-btn" id="btn-sound" aria-label="קול">${ICONS.soundOn}</button>
      </div>
      <p class="note">אין חשבונות, אין פרסומות ואין עוגיות. נספרים רק משחקים וזמן משחק, בלי שום מידע אישי.</p>
    </div>
  </div>`;

export interface RaceHooks { onSoundToggle: () => boolean; soundOn: () => boolean; onStart?: () => void; tick?: (dt: number) => void }

export async function runRace(root: HTMLElement, setup: RaceSetup, hooks: RaceHooks): Promise<RaceResult | null> {
  root.innerHTML = `<div class="race" id="race">${html(setup)}</div>`;
  const el = root.querySelector<HTMLElement>('#race')!;
  const $ = <T extends HTMLElement>(id: string) => el.querySelector<T>('#' + id)!;
  const racers = racersFor(setup);
  const race = new Race({ track: setup.track, seed: setup.seed, tutorial: setup.tutorial, help: setup.help, autopilot: setup.autopilot });
  const w = window as unknown as Record<string, unknown>;
  w.game = race;

  // paint everything for this screen size, with a hoof-print progress bar
  const cv = el.querySelector<HTMLCanvasElement>('canvas')!;
  const r0 = cv.getBoundingClientRect();
  const k = paintScale(stageLayout(r0.width, r0.height).s);
  const bar = el.querySelector<HTMLElement>('.load-bar div')!;
  const runnerJ = racers.map((rc) => runnerJobs(rc.animal, rc.kid, rc.outfit, k));
  const trackJ = trackJobs(setup.track, k);
  const propJ = propJobs(setup.track, k);
  const candyJ = candyJobs(k);
  const extraJ = extraJobs(k);
  const all: (() => Promise<unknown>)[] = [...trackJ, ...runnerJ.flat(), ...propJ, ...candyJ, ...extraJ];
  const pics = await inBatches(all, (d, n) => (bar.style.width = `${Math.round((d / n) * 100)}%`));
  let i = 0;
  const take = (n: number) => pics.slice(i, (i += n));
  const P: Pics = {
    layers: Object.fromEntries(take(trackJ.length) as [Layer, HTMLCanvasElement][]) as Record<Layer, HTMLCanvasElement>,
    runners: runnerJ.map((j) => framesOf(take(j.length) as HTMLCanvasElement[])),
    props: take(propJ.length) as Pics['props'],
    candies: Object.fromEntries(take(candyJ.length) as [string, HTMLCanvasElement][]),
    extra: Object.fromEntries(take(extraJ.length) as [string, HTMLCanvasElement][]),
  };
  $('loading').classList.add('hidden');
  const view = new RaceView(cv, race, P, setup.track);
  view.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // the HUD
  const fill = el.querySelector<HTMLElement>('.speed .fill')!;
  const place = $('place');
  const nCandy = $('n-candy');
  const prog = el.querySelector<HTMLElement>('.progress')!;
  const dots = race.runners.map((ru) => {
    const d = document.createElement('div');
    d.className = 'dot' + (ru.id === race.player ? ' me' : '');
    d.style.background = KID[racers[ru.id].kid].helmet;
    prog.appendChild(d);
    return d;
  });
  // the child's dot on top
  prog.appendChild(dots[0]);
  const btn = { jump: $('btn-jump'), duck: $('btn-duck'), far: $('btn-far'), near: $('btn-near') };
  const controls = new Controls(cv, btn);
  const tutor = $('tutor');

  let paused = false;
  const pauseBox = $('pause');
  const soundBtn = $('btn-sound');
  const showSound = () => {
    const on = hooks.soundOn();
    soundBtn.innerHTML = on ? ICONS.soundOn : ICONS.soundOff;
    soundBtn.setAttribute('aria-label', on ? 'להשתיק' : 'להשמיע');
  };
  const setPaused = (p: boolean) => {
    paused = p;
    pauseBox.classList.toggle('hidden', !p);
    showSound();
  };
  controls.onPause = () => setPaused(!paused);
  $('btn-pause').addEventListener('click', () => {
    sfx.tap();
    setPaused(true);
  });
  $('btn-resume').addEventListener('click', () => {
    sfx.tap();
    setPaused(false);
  });
  soundBtn.addEventListener('click', () => {
    hooks.onSoundToggle();
    showSound();
  });
  const onHide = () => {
    if (document.hidden && race.started && !race.done) setPaused(true);
  };
  document.addEventListener('visibilitychange', onHide);
  const onResize = () => view.layout();
  addEventListener('resize', onResize);

  return new Promise<RaceResult | null>((resolve) => {
    let raf = 0;
    let last = performance.now();
    let ending = 0;
    let stride = 0;
    let lastPlace = 0;
    const finish = (res: RaceResult | null) => {
      cancelAnimationFrame(raf);
      controls.destroy();
      document.removeEventListener('visibilitychange', onHide);
      removeEventListener('resize', onResize);
      resolve(res);
    };
    $('btn-home').addEventListener('click', () => {
      sfx.tap();
      finish(null);
    });

    const speed = setup.speed ?? 1;
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!paused) {
        // several small steps when the debug speed-up is on
        const total = dt * speed;
        const n = Math.max(1, Math.ceil(total / 0.033));
        for (let s = 0; s < n; s++) race.step(total / n, s === 0 ? controls.take() : {});
        for (const e of race.events) {
          view.onEvent(e);
          if (e.id !== race.player) continue;
          if (e.type === 'candy') sfx.candy();
          else if (e.type === 'bump') sfx.bump();
          else if (e.type === 'jump') sfx.jump();
          else if (e.type === 'duck') sfx.duck();
          else if (e.type === 'lane') sfx.lane();
          else if (e.type === 'dash') sfx.dash();
          else if (e.type === 'finish') sfx.fanfare();
        }
        race.events = [];
        // soft hoof beats for the child's runner
        const me = race.me;
        if (race.started && me.air < 0 && me.speed > 60) {
          stride += (me.speed * total) / STRIDE;
          if (stride >= 0.5) {
            stride -= 0.5;
            sfx.hoof(0.8);
          }
        }
        if (race.started && !race.done) hooks.tick?.(dt);
      }
      view.draw(paused ? 0 : dt * speed);

      // HUD
      const me = race.me;
      fill.style.width = `${Math.round((me.dash > 0 ? 1 : me.bar) * 100)}%`;
      fill.classList.toggle('dash', me.dash > 0);
      const places = race.places();
      const pl = places[race.player];
      if (pl !== lastPlace) {
        lastPlace = pl;
        place.textContent = String(pl);
        place.className = `place p${pl}`;
        place.setAttribute('aria-label', `מקום ${pl}`);
      }
      nCandy.textContent = String(me.candies);
      race.runners.forEach((ru, j) => (dots[j].style.left = `${Math.min(100, Math.max(0, (ru.x / race.course.length) * 100))}%`));
      // the tutorial hand points at the button to press
      const h = race.hint;
      tutor.classList.toggle('hidden', !h);
      btn.jump.classList.toggle('glow', !!h && h.act === 'jump');
      btn.duck.classList.toggle('glow', !!h && h.act === 'duck');
      if (h) {
        const b = (h.act === 'jump' ? btn.jump : btn.duck).getBoundingClientRect();
        tutor.style.left = `${b.left - 56}px`;
        tutor.style.top = `${b.top + b.height * 0.3}px`;
      }

      if (race.done && !ending) ending = now;
      if (ending && now - ending > 1400) {
        const order = race.order;
        const placeN = order.indexOf(race.player) + 1;
        finish({ order, racers: order.map((id) => racers[id]), place: placeN, candies: me.candies, coins: raceCoins(placeN, me.candies) });
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // 3, 2, 1, go
    const cd = $('countdown');
    const lights = [...cd.querySelectorAll('i')];
    const num = $('count-n');
    cd.classList.remove('hidden');
    const steps = [3, 2, 1, 0];
    const gap = setup.speed && setup.speed > 1 ? 150 : 800;
    steps.forEach((n, j) =>
      window.setTimeout(() => {
        if (n > 0) {
          lights[3 - n].classList.add('on');
          num.textContent = String(n);
          sfx.count(n);
        } else {
          cd.classList.add('go');
          num.innerHTML = ICONS.play;
          sfx.go();
          race.started = true;
          hooks.onStart?.();
          window.setTimeout(() => cd.classList.add('hidden'), 700);
        }
      }, 300 + j * gap),
    );
  });
}
