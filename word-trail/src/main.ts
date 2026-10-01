import '@fontsource/andika/400.css';
import '@fontsource/andika/700.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import './styles.css';
import { heroArt } from './art/characters';
import { AIR, WEAR_SLOT } from './art/wearables';
import { Category, CHEERS, picture, prompt } from './content';
import { Decision, nextDecision } from './director';
import { initMenus } from './menus';
import { addPhoto, checkBadges, makePostcard } from './rewards';
import { Scene } from './scene';
import { sfx } from './sfx';
import { music } from './music';
import { speech } from './speech';
import { load, newTrip, save, SaveData } from './state';
import { tapWord } from './tapLetters';
import { traceWord } from './trace';
import { $, anyOverlayOpen, celebrate, flash, h, ICONS, sleep, toast } from './ui';
import { runDebug } from './debug';
import { installDefs } from './art/paper';

const params = new URLSearchParams(location.search);
const s: SaveData = load();
applyDebugParams();

speech.rate = s.settings.rate;
speech.setVoice(s.settings.voice);
sfx.enabled = s.settings.sound;
music.enabled = s.settings.music;

const scene = new Scene($('scene') as unknown as SVGSVGElement);
const panel = $('panel');
const show = (w: string) => (s.settings.letterCase === 'upper' ? w.toUpperCase() : w);

if (params.get('debug')) {
  runDebug(params.get('debug')!);
  installDefs();
} else {
  boot();
}

function applyDebugParams() {
  const words = Number(params.get('words'));
  if (words > 0) {
    // pretend some words were already learned (to try later levels)
    const all = ['dog', 'cat', 'hat', 'sun', 'bee', 'park', 'cap', 'bow', 'bug', 'egg', 'pie', 'car', 'bus', 'hen', 'fox', 'owl', 'pig', 'rain', 'moon', 'sand', 'sea', 'hill', 'pond', 'farm', 'snow', 'kite', 'ball', 'cake', 'boat', 'bike'];
    for (const w of all.slice(0, words)) s.learned[w] = s.learned[w] ?? 1;
  }
  const hero = params.get('hero');
  if (hero) s.trip.hero = hero;
  for (const k of ['place', 'sky', 'ride'] as const) {
    const v = params.get(k);
    if (v) (s.trip as unknown as Record<string, unknown>)[k] = v;
  }
  for (const c of (params.get('carry') ?? '').split(',').filter(Boolean)) {
    if (AIR.includes(c)) s.trip.air = c;
    else s.trip.carry = c;
  }
  const wear = params.get('wear');
  if (wear) for (const w of wear.split(',')) if (WEAR_SLOT[w]) s.trip.worn[WEAR_SLOT[w]] = w;
  const friends = params.get('friends');
  if (friends) s.trip.friends = friends.split(',').slice(0, 3);
}

// ---------------------------------------------------------------------------

function boot() {
  installDefs();
  // the app never scrolls (a focused or animated element must not nudge it)
  const app = $('app');
  app.addEventListener('scroll', () => { app.scrollTop = 0; app.scrollLeft = 0; });
  $('btn-book').innerHTML = ICONS.book;
  $('btn-camera').innerHTML = ICONS.camera;
  $('btn-parents').insertAdjacentHTML('beforeend', ICONS.gear);
  $('btn-new').innerHTML = ICONS.restart;
  $('btn-new').addEventListener('click', async () => {
    sfx.tap();
    if (await askNewTrip()) startNewTrip();
  });
  $('btn-start').innerHTML = ICONS.play;
  $('title-art').innerHTML = `<svg viewBox="0 -20 200 220">${heroArt((s.trip.hero ?? 'dog') as 'dog', { worn: s.trip.hero ? s.trip.worn : { head: 'hat' } })}</svg>`;

  scene.fit();
  scene.render(s.trip);

  const menus = initMenus(s, { newTrip: startNewTrip });
  $('btn-book').addEventListener('click', () => {
    sfx.tap();
    menus.openBook();
  });
  $('btn-camera').addEventListener('click', () => takePhoto(menus.openPhoto));

  // tap anything on the trail to hear its name
  scene.svg.addEventListener('click', (e) => {
    const w = scene.wordAt(e.target);
    if (!w) return;
    sfx.tap();
    speech.say(w);
    const el = (e.target as Element).closest('[data-word]') as SVGGElement | null;
    el?.classList.remove('boing');
    void el?.getBoundingClientRect();
    el?.classList.add('boing');
  });

  $('btn-start').addEventListener('click', () => {
    speech.unlock();
    sfx.unlock();
    sfx.pop();
    const ctx = sfx.context;
    if (ctx) {
      music.setScene(s.trip.place, s.trip.sky);
      music.start(ctx, ctx.destination);
    }
    $('title').classList.add('hidden');
    $('topbar').classList.remove('hidden');
    run();
  }, { once: true });
}

let restart = false;
function startNewTrip() {
  s.trip = newTrip();
  save(s);
  restart = true;
  speech.stop();
  cancelActivity?.();
  scene.clearSign();
  scene.crossfade(s.trip);
  music.setScene(s.trip.place, s.trip.sky);
  resolveChoice?.(null);
}

/** A big, friendly "start again?" question with a yes and a no button. */
function askNewTrip(): Promise<boolean> {
  return new Promise((resolve) => {
    const o = h('div', 'overlay ask', `<div class="card ask-card">
      <div class="ask-heroes">${['dog', 'cat', 'fox'].map((w) => picture(w)).join('')}</div>
      <h2>Choose a new friend?</h2>
      <div class="row"><button class="ask-yes" aria-label="Yes">${ICONS.check}</button><button class="ask-no" aria-label="No">✕</button></div></div>`);
    $('app').appendChild(o);
    const done = (v: boolean) => { sfx.tap(); o.remove(); resolve(v); };
    o.querySelector('.ask-yes')!.addEventListener('click', () => done(true));
    o.querySelector('.ask-no')!.addEventListener('click', () => done(false));
    o.addEventListener('click', (e) => { if (e.target === o) done(false); });
  });
}

async function run() {
  for (;;) {
    restart = false;
    const d = nextDecision(s);
    s.trip.recent = [...s.trip.recent, ...d.options].slice(-14);
    // walk along the trail until the signpost with the next choice arrives
    if (s.trip.hero) {
      await scene.walkToSign(s.trip.ride ? 145 : 80, anyOverlayOpen);
      if (restart) continue;
    }
    const word = await choose(d);
    scene.clearSign();
    if (restart || !word) continue;
    await learn(word);
    if (restart) continue;
    apply(word, d.cat);
    s.decisions++;
    s.trip.lastCats = [...s.trip.lastCats, d.cat].slice(-6);
    save(s);
    await sleep(1600);
    for (const b of checkBadges(s)) {
      save(s);
      await showBadge(b.label, b.icon, !!b.party);
    }
  }
}

// ---------- 1. choose ----------

let resolveChoice: ((w: string | null) => void) | null = null;

function choose(d: Decision): Promise<string | null> {
  const text = prompt(d.cat, s.trip.hero);
  panel.className = 'panel choose';
  panel.innerHTML = '';
  const head = h('div', 'prompt');
  const again = h('button', 'say-btn', ICONS.speaker);
  again.setAttribute('aria-label', 'Hear it again');
  head.append(again, h('h2', '', text));
  const cards = h('div', `cards n${d.options.length}`);
  panel.append(head, cards);

  let picked: HTMLElement | null = null;
  const readOut = async () => {
    await speech.say(text);
    for (let i = 0; i < d.options.length; i++) {
      await sleep(250);
      if (picked) return;
      await speech.say(i === d.options.length - 1 && d.options.length > 1 ? `or ${d.options[i]}?` : d.options[i], { queue: true });
    }
  };

  return new Promise((resolve) => {
    resolveChoice = resolve;
    const finish = (w: string) => {
      resolveChoice = null;
      sfx.pop();
      panel.classList.add('leaving');
      setTimeout(() => resolve(w), 350);
    };
    for (const w of d.options) {
      const card = h('button', 'choice', `${picture(w)}<span class="word">${show(w)}</span><span class="ok">${ICONS.check}</span>`);
      card.setAttribute('aria-label', w);
      // one tap chooses: the card is marked, its word is said, and we go on
      card.addEventListener('click', () => {
        if (picked) return;
        picked = card;
        card.classList.add('picked');
        cards.classList.add('has-pick');
        sfx.tap();
        speech.say(w);
        setTimeout(() => finish(w), 650);
      });
      cards.appendChild(card);
    }
    again.addEventListener('click', () => {
      if (!picked) readOut();
    });
    // the choice pops out of the signpost on the trail
    const r = scene.signRect();
    if (r) {
      const pr = panel.getBoundingClientRect();
      panel.style.setProperty('--ox', `${r.left + r.width / 2 - (pr.left || 0)}px`);
      panel.style.setProperty('--oy', `${r.top - (pr.top || 0)}px`);
      panel.classList.add('from-sign');
    }
    panel.classList.remove('hidden');
    readOut();
  });
}

// ---------- 2. learn the word ----------

let cancelActivity: (() => void) | null = null;

async function learn(word: string) {
  const learnedCount = Object.keys(s.learned).length;
  const mode = s.settings.activity === 'mix' ? (s.rounds % 2 === 1 && word.length <= 5 ? 'trace' : 'tap') : s.settings.activity;
  panel.className = 'panel learn';
  panel.innerHTML = '';
  const top = h('div', 'learn-top');
  const pic = h('button', 'big-pic', picture(word));
  pic.setAttribute('aria-label', `Hear ${word}`);
  const title = h('button', 'big-word', show(word));
  title.setAttribute('aria-label', `Hear ${word}`);
  top.append(pic, title);
  const act = h('div', `activity ${mode}`);
  panel.append(top, act);
  panel.classList.remove('hidden');
  const sayWord = () => speech.say(word, { pitch: 1.15 });
  pic.addEventListener('click', sayWord);
  title.addEventListener('click', sayWord);

  await sleep(200);
  await sayWord();
  await sleep(400);
  if (restart) return;

  const markLetter = (i: number) => {
    const ch = word[i];
    if (!s.letters.includes(ch)) s.letters.push(ch);
    const spans = title.querySelectorAll('span');
    spans[i]?.classList.add('lit');
  };
  title.innerHTML = [...show(word)].map((c) => `<span>${c}</span>`).join('');

  let task: { done: Promise<void>; cancel: () => void };
  if (mode === 'trace') {
    speech.say('Trace the letters!', { queue: true });
    const host = h('div', 'trace-host');
    act.appendChild(host);
    task = traceWord(host, show(word), markLetter);
  } else {
    speech.say('Tap the letters!', { queue: true });
    const slots = h('div', 'slots');
    const bubbles = h('div', 'bubbles');
    act.append(slots, bubbles);
    const level = learnedCount < 3 ? 0 : learnedCount < 8 ? 1 : learnedCount < 16 ? 2 : 3;
    task = tapWord(slots, bubbles, word, level, s.settings.letterCase === 'upper', markLetter);
  }
  cancelActivity = task.cancel;
  await task.done;
  cancelActivity = null;
  if (restart) return;

  s.learned[word] = (s.learned[word] ?? 0) + 1;
  s.rounds++;
  save(s);
  sfx.success();
  celebrate('word', title);
  const spans = [...title.querySelectorAll('span')];
  await speech.spell(word, (i) => {
    spans.forEach((sp, k) => sp.classList.toggle('saying', k === i || i === -1));
  });
  spans.forEach((sp) => sp.classList.remove('saying'));
  title.classList.add('cheer');
  await speech.say(CHEERS[Math.floor(Math.random() * CHEERS.length)], { queue: true, pitch: 1.25 });
  panel.classList.add('leaving');
  await sleep(350);
  panel.classList.add('hidden');
}

// ---------- 3. the choice joins the trip ----------

function apply(word: string, cat: Category) {
  const t = s.trip;
  let fade = false;
  switch (cat) {
    case 'hero': t.hero = word; break;
    case 'wear': t.worn[WEAR_SLOT[word]] = word; break;
    case 'place':
      t.place = word;
      if (!s.places.includes(word)) s.places.push(word);
      // a ride lasts until we arrive somewhere new (and a boat needs the sea)
      t.ride = null;
      fade = true;
      break;
    case 'friend':
      t.friends.push(word);
      if (t.friends.length > 3) t.friends.shift(); // at most three friends walk along
      break;
    case 'sky': t.sky = word; fade = true; break;
    case 'carry':
      if (AIR.includes(word)) t.air = word;
      else t.carry = word;
      break;
    case 'ride': t.ride = word; break;
  }
  if (fade) scene.crossfade(t);
  else scene.render(t);
  music.setScene(t.place, t.sky);
  scene.sparkle();
  sfx.chime(4);
}

/** Badges are celebrated with pictures and confetti only (no speech). */
async function showBadge(label: string, icon: string, party: boolean) {
  sfx.success();
  const b = h('div', 'badge-pop', `<div class="badge-star">${ICONS.burst}</div><div class="medal">${picture(icon)}</div><b>${label}</b>`);
  document.body.appendChild(b);
  celebrate(party ? 'party' : 'badge', b.querySelector('.medal'));
  await sleep(party ? 3200 : 2400);
  b.classList.add('out');
  await sleep(400);
  b.remove();
}

// ---------- photos ----------

let snapping = false;
async function takePhoto(open: (p: { id: string; png: string; caption: string; at: number }) => void) {
  if (snapping) return;
  snapping = true;
  sfx.unlock();
  sfx.shutter();
  flash();
  try {
    await document.fonts?.ready;
    const { png, caption } = await makePostcard(s.trip);
    const p = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, png, caption, at: Date.now() };
    await addPhoto(p);
    toast(`<img src="${png}" alt=""/><span>Saved in your photos!</span>`, 7000, () => open(p));
  } catch {
    toast('Oops, the photo did not work.');
  } finally {
    snapping = false;
  }
}
