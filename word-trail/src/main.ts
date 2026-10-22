import '@fontsource/andika/400.css';
import '@fontsource/andika/700.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import './styles.css';
import { AIR, WEAR_SLOT } from './art/wearables';
import { ALL_WORDS, Category, CHEERS, picture, prompt } from './content';
import { Decision, nextDecision } from './director';
import { initMenus } from './menus';
import { addPhoto, checkBadges, makePostcard } from './rewards';
import { Scene } from './scene';
import { sfx } from './sfx';
import { music } from './music';
import { stats } from './stats';
import { speech } from './speech';
import { load, newTrip, save, SaveData, stopSaving, type Trip } from './state';
import { takeItem } from './gear';
import { tapWord } from './tapLetters';
import { traceLetterPx, traceWord } from './trace';
import { findWord } from './findWord';
import { spotTargets, spottableWords, spotWord } from './spot';
import { $, anyOverlayOpen, celebrate, fitText, flash, h, ICONS, sleep, toast } from './ui';
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

if (params.get('debug') === 'learn') {
  debugLearn();
} else if (params.get('debug') === 'spot') {
  debugSpot();
} else if (params.get('debug') === 'choose') {
  debugChoose();
} else if (params.get('debug')) {
  runDebug(params.get('debug')!);
  installDefs();
} else {
  boot();
}

function applyDebugParams() {
  // a pretend trip from the URL is played but never saved over the real one
  if (['debug', 'words', 'hero', 'place', 'sky', 'ride', 'carry', 'wear', 'friends'].some((k) => params.has(k))) stopSaving();
  const words = Number(params.get('words'));
  if (words > 0) {
    // pretend some words were already learned (to try later levels), easiest first
    const easy = ['dog', 'cat', 'hat', 'sun', 'bee', 'park', 'cap', 'bow', 'bug', 'car', 'bus', 'hen', 'fox', 'owl', 'pig', 'rain', 'moon', 'sand', 'sea', 'hill', 'pond', 'farm', 'snow', 'kite', 'ball', 'boat', 'bike'];
    const all = [...easy, ...ALL_WORDS.filter((w) => !easy.includes(w))].filter((w) => ALL_WORDS.includes(w));
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
  $('btn-home').innerHTML = ICONS.home;
  // every home button has a picture, for children who can't read yet
  const icon = (id: string, svg: string) => ($(id).querySelector('.home-ic')!.innerHTML = svg);
  icon('btn-start', ICONS.play);
  icon('btn-new-game', ICONS.restart);
  icon('btn-album', ICONS.book);

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

  // the home screen: at the start, and whenever the logo or the house is tapped
  const home = initHome(menus);
  $('btn-home').addEventListener('click', home.open);
  $('corner-logo').addEventListener('click', home.open);
}

/** Sound can only start from a tap; each home button calls this (it is safe to repeat). */
function wakeAudio() {
  speech.unlock();
  sfx.unlock();
  const ctx = sfx.context;
  const out = sfx.output;
  if (ctx && out) {
    music.setScene(s.trip.place, s.trip.sky);
    music.start(ctx, out);
  }
}

function initHome(menus: ReturnType<typeof initMenus>) {
  let started = false;
  const refresh = () => {
    // "Play" for a fresh game, "Continue" (and "New game") once there is a friend on the trail
    const going = started || !!s.trip.hero;
    $('btn-start').querySelector('.home-label')!.textContent = going ? 'Continue' : 'Play';
    $('btn-start').setAttribute('aria-label', going ? 'Continue the game' : 'Play');
    $('btn-new-game').classList.toggle('hidden', !s.trip.hero);
  };
  const close = () => {
    $('title').classList.add('hidden');
    $('topbar').classList.remove('hidden');
    if (started) return;
    started = true;
    // anonymous play statistics: one play, then seconds while the game is on screen
    stats.start();
    window.setInterval(() => { if (!document.hidden) stats.tick(1); }, 1000);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stats.flush(true); });
    window.addEventListener('pagehide', () => stats.flush(true));
    run();
  };
  refresh();
  $('btn-start').addEventListener('click', () => {
    wakeAudio();
    sfx.pop();
    close();
  });
  $('btn-new-game').addEventListener('click', async () => {
    wakeAudio();
    sfx.tap();
    if (!(await askNewTrip())) return;
    startNewTrip();
    close();
  });
  $('btn-album').addEventListener('click', () => {
    wakeAudio();
    sfx.tap();
    menus.openBook('photos');
  });
  return {
    open() {
      sfx.tap();
      refresh();
      $('title').classList.remove('hidden');
      $('topbar').classList.add('hidden');
    },
  };
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
    const mode = pickActivity();
    if (mode === 'spot') {
      // the choice joins the scene first, then: "Where is the cloud?"
      await apply(word, d.cat);
      if (restart) continue;
      await spotRound(word);
    } else {
      await learn(word, mode);
      if (restart) continue;
      await apply(word, d.cat);
    }
    if (restart) continue;
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

/** A choice card: the picture and the word. */
function choiceCard(w: string) {
  const card = h('button', 'choice', `${picture(w)}<span class="word">${show(w)}</span><span class="ok">${ICONS.check}</span>`);
  card.setAttribute('aria-label', w);
  return card;
}

/**
 * Long words shrink to fit their card. If that would make them smaller than
 * 18px, the cards go two to a row instead (three long words side by side on
 * a phone are too narrow to read).
 */
function fitChoiceWords() {
  const grid = panel.querySelector<HTMLElement>('.cards');
  if (!grid) return;
  const words = () => [...panel.querySelectorAll<HTMLElement>('.choice')];
  const fitAll = () => {
    for (const c of words()) fitText(c.querySelector('.word')!, c.clientWidth - 8, 16);
    return Math.min(...words().map((c) => parseFloat(getComputedStyle(c.querySelector('.word')!).fontSize)));
  };
  const fit = () => {
    grid.style.removeProperty('--n');
    grid.classList.remove('two-rows');
    if (fitAll() < 18 && words().length > 2) {
      grid.style.setProperty('--n', '2');
      grid.classList.add('two-rows');
      fitAll();
    }
  };
  fit();
  document.fonts?.ready.then(fit);
}

/** ?debug=choose&words=fish,monkey,zebra: the choice panel alone, for layout checks. */
function debugChoose() {
  installDefs();
  debugChrome();
  scene.fit();
  scene.render(s.trip);
  const words = (params.get('words') ?? 'fish,monkey,zebra').split(',').map((w) => w.replace(/[^a-z]/g, '')).filter(Boolean).slice(0, 4);
  panel.className = 'panel choose';
  panel.innerHTML = '';
  const head = h('div', 'prompt');
  head.append(h('button', 'say-btn', ICONS.speaker), h('h2', '', 'Who will come along?'));
  const cards = h('div', `cards n${words.length}`);
  for (const w of words) cards.appendChild(choiceCard(w));
  panel.append(head, cards);
  panel.classList.remove('hidden');
  fitChoiceWords();
}

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
      const card = choiceCard(w);
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
    fitChoiceWords();
    readOut();
  });
}

// ---------- 2. learn the word ----------

let cancelActivity: (() => void) | null = null;

/** Builds the learning panel: picture, big word and the activity area. */
function learnLayout(word: string, mode: Activity) {
  panel.className = 'panel learn';
  panel.innerHTML = '';
  panel.style.setProperty('--n', String(word.length));
  const top = h('div', `learn-top${word.length >= 6 ? ' long' : ''}`);
  const pic = h('button', 'big-pic', picture(word));
  pic.setAttribute('aria-label', `Hear ${word}`);
  const title = h('button', 'big-word', show(word));
  title.setAttribute('aria-label', `Hear ${word}`);
  top.append(pic, title);
  const act = h('div', `activity ${mode}`);
  panel.append(top, act);
  panel.classList.remove('hidden');
  return { pic, title, act };
}

type Activity = 'tap' | 'trace' | 'find';
const tapLevel = (learnedCount: number) => (learnedCount < 3 ? 0 : learnedCount < 8 ? 1 : learnedCount < 16 ? 2 : 3);
/** Find the word: three cards that look clearly different at first, then four that look alike. */
const findLevel = (learnedCount: number) => (learnedCount < 8 ? 0 : learnedCount < 16 ? 1 : 2);

/** Find the word in the activity area; the big word above is shown in full. */
function startFind(act: HTMLElement, title: HTMLElement, word: string, level: number) {
  title.querySelectorAll('span').forEach((sp) => sp.classList.add('lit'));
  const host = h('div', 'find-host');
  act.appendChild(host);
  return findWord(host, word, level, show);
}

/** ?debug=learn&word=rainbow&mode=tap|trace|find&level=0..3: the learning panel alone, for layout checks. */
function debugLearn() {
  installDefs();
  scene.fit();
  scene.render(s.trip);
  const word = (params.get('word') ?? 'rainbow').toLowerCase().replace(/[^a-z]/g, '').slice(0, 10) || 'cat';
  const mode: Activity = params.get('mode') === 'trace' ? 'trace' : params.get('mode') === 'find' ? 'find' : 'tap';
  const level = Math.min(3, Math.max(0, Number(params.get('level')) || 0));
  const { title, act } = learnLayout(word, mode);
  title.innerHTML = [...show(word)].map((c) => `<span>${c}</span>`).join('');
  if (mode === 'find') startFind(act, title, word, level);
  else if (mode !== 'trace' || !fitTrace(act, word)) {
    const slots = h('div', 'slots');
    const bubbles = h('div', 'bubbles');
    act.append(slots, bubbles);
    tapWord(slots, bubbles, word, level, s.settings.letterCase === 'upper');
  }
  debugChrome();
}

// ---------- spot it: "Where is the cloud?" ----------

const PLURAL = ['boots', 'glasses', 'shoes', 'socks'];
const whereIs = (w: string) => `Where ${PLURAL.includes(w) ? 'are' : 'is'} the ${w}?`;

/** The small question bubble: the word's picture, "Where is the CLOUD?" and a tapping finger. */
function spotBubble(word: string) {
  panel.className = 'panel spot';
  panel.style.removeProperty('--n');
  panel.innerHTML = '';
  const pic = h('button', 'spot-pic', picture(word));
  pic.setAttribute('aria-label', whereIs(word));
  const text = h('div', 'spot-text', `<span class="spot-where">Where ${PLURAL.includes(word) ? 'are' : 'is'} the</span>
    <span class="spot-line"><b class="spot-word">${[...show(word)].map((c) => `<span>${c}</span>`).join('')}</b><b class="spot-qm">?</b></span>`);
  const finger = h('span', 'spot-finger', ICONS.finger);
  finger.setAttribute('aria-hidden', 'true');
  panel.append(pic, text, finger);
  panel.classList.remove('hidden');
  pic.addEventListener('click', () => speech.say(whereIs(word)));
  // the bubble may be as wide as the screen allows; the word shrinks to fit beside the picture and finger
  const line = text.querySelector('.spot-line') as HTMLElement;
  const fit = () => fitText(line, Math.min(460, innerWidth - 24) - 150, 20);
  fit();
  document.fonts?.ready.then(fit);
  return { word: text.querySelector('.spot-word') as HTMLElement };
}

/**
 * Asks for the chosen thing in the scene. When it can't be tapped (a place,
 * the rain, or it is out of view) another thing on screen is asked instead.
 */
async function spotRound(chosen: string) {
  await sleep(700); // let the new thing pop in first
  let word = chosen;
  let ui = spotBubble(word);
  await sleep(450); // the bubble settles in place before we look at what it covers
  if (!spotTargets(scene.svg, word).length) {
    const others = spottableWords(scene.svg).filter((w) => w !== chosen);
    if (!others.length) {
      // nothing to spot: practise the letters instead
      await learn(chosen, 'tap');
      return;
    }
    word = others[Math.floor(Math.random() * others.length)];
    ui = spotBubble(word);
  }
  const ask = () => speech.say(whereIs(word));
  ask();
  const task = spotWord(scene.svg, word, { onHint: ask });
  cancelActivity = task.cancel;
  const hit = await task.done;
  cancelActivity = null;
  if (restart) return;

  for (const w of new Set([word, chosen])) s.learned[w] = (s.learned[w] ?? 0) + 1;
  for (const ch of word) if (!s.letters.includes(ch)) s.letters.push(ch);
  s.rounds++;
  save(s);
  sfx.success();
  celebrate('word', hit);
  const spans = [...ui.word.querySelectorAll('span')];
  spans.forEach((sp) => sp.classList.add('lit'));
  await speech.spell(word, (i) => spans.forEach((sp, k) => sp.classList.toggle('saying', k === i || i === -1)));
  spans.forEach((sp) => sp.classList.remove('saying'));
  await speech.say(CHEERS[Math.floor(Math.random() * CHEERS.length)], { queue: true, pitch: 1.25 });
  panel.classList.add('leaving');
  await sleep(350);
  panel.classList.add('hidden');
}

/** ?debug=spot&word=cloud&hint=ms (+ scene parameters): the spot question alone, for tests. */
function debugSpot() {
  installDefs();
  debugChrome();
  scene.fit();
  scene.render(s.trip);
  const word = (params.get('word') ?? 'dog').toLowerCase().replace(/[^a-z]/g, '').slice(0, 10);
  const state = { done: false, word, targets: [] as { x: number; y: number; w: number; h: number }[] };
  (window as unknown as { __spot: typeof state }).__spot = state;
  requestAnimationFrame(() => {
    spotBubble(word);
    // measure once the bubble has settled in place
    setTimeout(() => {
      state.targets = spotTargets(scene.svg, word).map((e) => {
        const r = e.getBoundingClientRect();
        return { x: r.left, y: r.top, w: r.width, h: r.height };
      });
      spotWord(scene.svg, word, { hintAfter: Number(params.get('hint')) || 7000 }).done.then(() => (state.done = true));
    }, 450);
  });
}

/** The top buttons and logo on debug pages. */
function debugChrome() {
  $('btn-book').innerHTML = ICONS.book;
  $('btn-camera').innerHTML = ICONS.camera;
  $('btn-parents').insertAdjacentHTML('beforeend', ICONS.gear);
  $('btn-home').innerHTML = ICONS.home;
  $('topbar').classList.remove('hidden');
  $('title').classList.add('hidden');
}

/**
 * Sets up tracing in the activity area, or returns null (and leaves the area
 * ready for tapping) when the word is too long for the screen: on a phone a
 * long word would make tiny trace letters.
 */
function fitTrace(act: HTMLElement, word: string, onLetter?: (i: number) => void) {
  const host = h('div', 'trace-host');
  act.appendChild(host);
  const task = traceWord(host, show(word), onLetter);
  // capitals under 75 CSS px are too fiddly for small fingers
  if (traceLetterPx(host) >= 75) return task;
  task.cancel();
  host.remove();
  act.className = 'activity tap';
  return null;
}

/** Which activity comes next: mixed play takes turns between tap, trace, find and spot. */
function pickActivity(): Activity | 'spot' {
  const a = s.settings.activity;
  return a === 'mix' ? (['tap', 'trace', 'find', 'spot'] as const)[s.rounds % 4] : a;
}

async function learn(word: string, mode: Activity) {
  const learnedCount = Object.keys(s.learned).length;
  const { pic, title, act } = learnLayout(word, mode);
  const traceTask = mode === 'trace' ? fitTrace(act, word, (i) => markLetter(i)) : null;
  cancelActivity = traceTask?.cancel ?? null;
  const sayWord = () => speech.say(word, { pitch: 1.15 });
  pic.addEventListener('click', sayWord);
  title.addEventListener('click', sayWord);

  await sleep(200);
  await sayWord();
  await sleep(400);
  if (restart) {
    traceTask?.cancel();
    return;
  }

  const markLetter = (i: number) => {
    const ch = word[i];
    if (!s.letters.includes(ch)) s.letters.push(ch);
    const spans = title.querySelectorAll('span');
    spans[i]?.classList.add('lit');
  };
  title.innerHTML = [...show(word)].map((c) => `<span>${c}</span>`).join('');

  let task: { done: Promise<void>; cancel: () => void };
  if (traceTask) {
    speech.say('Trace the letters!', { queue: true });
    task = traceTask;
  } else if (mode === 'find') {
    speech.say('Find the word!', { queue: true });
    task = startFind(act, title, word, findLevel(learnedCount));
  } else {
    speech.say('Tap the letters!', { queue: true });
    const slots = h('div', 'slots');
    const bubbles = h('div', 'bubbles');
    act.append(slots, bubbles);
    task = tapWord(slots, bubbles, word, tapLevel(learnedCount), s.settings.letterCase === 'upper', markLetter);
  }
  cancelActivity = task.cancel;
  await task.done;
  cancelActivity = null;
  if (restart) return;
  if (mode === 'find') [...word].forEach((_, i) => markLetter(i)); // the word is spelled out next

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

async function apply(word: string, cat: Category) {
  const t = s.trip;
  const before: Trip = structuredClone(t);
  let fade = false;
  let bye: string | null = null; // a friend who has to go home
  let handedTo: string | null = null; // a friend who got the hero's old item
  switch (cat) {
    case 'hero': t.hero = word; break;
    case 'wear':
    case 'carry':
      // the old item isn't lost: a friend who can wear it takes it
      handedTo = takeItem(t, word).to;
      break;
    case 'place':
      t.place = word;
      if (!s.places.includes(word)) s.places.push(word);
      // a ride lasts until we arrive somewhere new (and a boat needs the sea)
      t.ride = null;
      fade = true;
      break;
    case 'friend':
      t.friends.push(word);
      if (t.friends.length > 3) {
        // at most three friends walk along: the one who came first says goodbye
        bye = t.friends.shift()!;
        delete t.gear[bye];
      }
      break;
    case 'sky': t.sky = word; fade = true; break;
    case 'ride': t.ride = word; break;
  }
  if (bye) {
    // the friend who leaves says goodbye first, while the others keep their
    // places; then the new friend joins (otherwise someone stands where it waves)
    scene.render({ ...before, friends: before.friends.filter((f) => f !== bye) });
    scene.farewell(before, bye, `Bye bye, ${bye}!`);
    sfx.soft();
    await speech.say(`Bye bye, ${bye}!`, { queue: true });
    await sleep(1600);
  }
  if (fade) scene.crossfade(t);
  else scene.render(t);
  music.setScene(t.place, t.sky);
  scene.sparkle(cat === 'friend' ? word : undefined);
  sfx.chime(4);
  if (handedTo) setTimeout(() => { scene.sparkle(handedTo!); sfx.chime(6); }, 500);
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
