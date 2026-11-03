// Gentle synthesized sounds (no files). A water "plop" is a sine whose pitch
// rises fast, like a small bubble ringing; success notes are soft FM bells on
// a pentatonic scale, walking up and down. Everything goes through a small
// generated room reverb and a compressor so nothing can spike.

let ac: AudioContext | null = null;
let master: GainNode | null = null;
let send: GainNode | null = null;
let muted = false;
const VOL = 0.75;

function build(): AudioContext | null {
  if (ac) return ac;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ac = new AC();
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -16; comp.ratio.value = 6; comp.attack.value = 0.004; comp.release.value = 0.2;
  const hs = ac.createBiquadFilter();
  hs.type = 'highshelf'; hs.frequency.value = 6000; hs.gain.value = -6;
  master = ac.createGain();
  master.gain.value = muted ? 0 : VOL;
  master.connect(hs).connect(comp).connect(ac.destination);
  // room
  const len = Math.floor(ac.sampleRate * 2.2);
  const ir = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / ac.sampleRate;
      const k = 0.25 + 0.7 * Math.min(1, t / 1.5); // darker as it fades
      lp += (Math.random() * 2 - 1 - lp) * (1 - k);
      d[i] = lp * Math.exp(-t * 2.8);
    }
  }
  const conv = ac.createConvolver();
  conv.buffer = ir;
  send = ac.createGain();
  send.gain.value = 0.35;
  send.connect(conv).connect(master);
  return ac;
}

/** Call from a user gesture. */
export function unlock() {
  const a = build();
  if (a && a.state === 'suspended') void a.resume();
}

export function setMuted(m: boolean) {
  muted = m;
  if (ac && master) master.gain.setTargetAtTime(m ? 0 : VOL, ac.currentTime, 0.05);
}

document.addEventListener('visibilitychange', () => {
  if (!ac) return;
  if (document.hidden) void ac.suspend(); else void ac.resume();
});

function out(g: AudioNode, wet = 0.6, pan = 0) {
  let node: AudioNode = g;
  if (pan) {
    const p = ac!.createStereoPanner();
    p.pan.value = pan;
    node = g.connect(p);
  }
  node.connect(master!);
  const s = ac!.createGain();
  s.gain.value = wet;
  node.connect(s).connect(send!);
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

let noiseBuf: AudioBuffer | null = null;
/** Pink-ish noise, made once (softer than white noise). */
function noise(a: AudioContext): AudioBuffer {
  if (noiseBuf) return noiseBuf;
  const len = a.sampleRate * 2;
  noiseBuf = a.createBuffer(1, len, a.sampleRate);
  const d = noiseBuf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0527;
    d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
  }
  return noiseBuf;
}

/** A short wet tick: a band of noise, like a fingertip touching water. */
function tick(freq: number, gain: number, dur: number, pan: number) {
  const a = ready(); if (!a) return;
  const t = a.currentTime;
  const src = a.createBufferSource();
  src.buffer = noise(a);
  const bp = a.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 2.5;
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp).connect(g);
  out(g, 0.3, pan);
  src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.02);
}

// the sound of a drop sliding on paper: a noise bed whose loudness and
// brightness follow the drop's speed (it runs silent between drags)
let slideGain: GainNode | null = null, slideBp: BiquadFilterNode | null = null;
function slideNodes(a: AudioContext) {
  if (slideGain) return;
  const src = a.createBufferSource();
  src.buffer = noise(a);
  src.loop = true;
  slideBp = a.createBiquadFilter();
  slideBp.type = 'bandpass'; slideBp.Q.value = 1.2; slideBp.frequency.value = 500;
  const lp = a.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 1800;
  slideGain = a.createGain();
  slideGain.gain.value = 0;
  src.connect(slideBp).connect(lp).connect(slideGain);
  out(slideGain, 0.15);
  src.start();
}

function ready(): AudioContext | null {
  return ac && ac.state === 'running' && !muted ? ac : null;
}

function plop(f0: number, gain: number, when = 0, rise = 2.3, dur = 0.17, pan = 0) {
  const a = ready(); if (!a) return;
  const t = a.currentTime + when;
  const o = a.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f0 * rise, t + dur * 0.4);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  out(g, 0.5, pan);
  o.start(t); o.stop(t + dur + 0.03);
}

function bell(freq: number, gain: number, when = 0, dur = 1.8, pan = 0) {
  const a = ready(); if (!a) return;
  const t = a.currentTime + when;
  const car = a.createOscillator();
  car.frequency.value = freq;
  const mod = a.createOscillator();
  mod.frequency.value = freq * 3.5;
  const mg = a.createGain(); // modulation depth in Hz, drives the carrier's frequency (not a gain)
  mg.gain.setValueAtTime(freq * 1.4, t);
  mg.gain.exponentialRampToValueAtTime(freq * 0.05, t + dur * 0.6);
  mod.connect(mg).connect(car.frequency);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  car.connect(g);
  out(g, 0.9, pan);
  car.start(t); mod.start(t); car.stop(t + dur + 0.05); mod.stop(t + dur + 0.05);
}

function soft(freq: number, gain: number, when: number, dur: number, to?: number) {
  const a = ready(); if (!a) return;
  const t = a.currentTime + when;
  const o = a.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  const lp = a.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 1400;
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(lp).connect(g);
  out(g, 0.7);
  o.start(t); o.stop(t + dur + 0.05);
}

const C5 = 523.25;
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16];
const note = (st: number) => C5 * Math.pow(2, st / 12);
let walk = 0, dir = 1;
function nextNote(): number {
  const f = note(PENTA[walk]);
  walk += dir;
  if (walk >= PENTA.length - 1 || walk <= 0) dir = -dir;
  return f;
}

// touching drops: never the same sound twice in a row
let lastPick = 0, pickStep = 0, pickDir = 1;
const COLOR_TUNE = (p: [number, number, number]) => {
  const s = p[0] + p[1] + p[2] || 1;
  return 1 + (p[1] / s) * 0.12 - (p[2] / s) * 0.08; // yellow a bit brighter, blue a bit deeper
};

export const sfx = {
  /** a drop drips onto the paper */
  drip(i: number) { plop(780 + (i % 4) * 90, 0.09, 0, 2.0); },
  /** touching a drop to move it: pitch from its size and colour, walking a scale, with a wet tick */
  pick(vol: number, pig: [number, number, number]) {
    const a = ready(); if (!a) return;
    const now = a.currentTime;
    // quick touches walk up and down the scale; a pause starts somewhere new
    if (now - lastPick > 1.2) pickStep = Math.floor(rand(0, 4));
    else {
      pickStep += pickDir * (Math.random() < 0.3 ? 2 : 1);
      if (pickStep >= 5 || pickStep <= 0) { pickDir = -pickDir; pickStep = Math.max(0, Math.min(5, pickStep)); }
    }
    lastPick = now;
    const base = (820 / Math.pow(vol, 0.35)) * COLOR_TUNE(pig);
    const f = base * Math.pow(2, [0, 2, 4, 7, 9, 12][pickStep] / 12) * rand(0.985, 1.015);
    const pan = rand(-0.35, 0.35);
    plop(f, rand(0.045, 0.07), 0, rand(1.3, 1.9), rand(0.09, 0.15), pan);
    if (Math.random() < 0.5) plop(f * 1.5, rand(0.012, 0.025), rand(0.03, 0.06), 1.4, 0.08, -pan);
    tick(rand(1800, 3400), rand(0.02, 0.04), rand(0.02, 0.04), pan);
  },
  /** a drop let go settles on the paper */
  settle(vol: number) { plop((300 / Math.sqrt(vol)) * rand(0.92, 1.08), 0.035, 0, rand(1.25, 1.5), 0.14, rand(-0.2, 0.2)); },
  /** sliding: call every frame with the drop's speed (world units per second), 0 to stop */
  slide(speed: number, vol = 1) {
    const a = ready();
    if (!a) return;
    slideNodes(a);
    const t = a.currentTime;
    const v = Math.min(1, speed / 90);
    slideGain!.gain.setTargetAtTime(v * v * 0.05 * Math.min(1.4, Math.sqrt(vol)), t, 0.06);
    slideBp!.frequency.setTargetAtTime(380 + v * 900 / Math.sqrt(vol), t, 0.08);
  },
  /** two drops join; when two colours mix, a second bell adds a little magic */
  merge(vol: number, mixed = false) {
    plop((560 / Math.sqrt(vol)) * rand(0.95, 1.05), 0.2, 0, rand(2, 2.6));
    const f = nextNote();
    bell(f, 0.05, 0.03, 1.4, rand(-0.3, 0.3));
    if (mixed) { bell(f * 1.5, 0.04, 0.12, 1.6, 0.3); bell(f * 2, 0.03, 0.22, 1.8, -0.3); }
  },
  /** a drop goes into the right cup; a full cup rings a chord */
  cup(i: number, full: boolean) {
    plop(300, 0.2, 0, 2.6);
    const base = [0, 4, 7][i % 3];
    bell(note(base), 0.08, 0.05, 2.2);
    if (full) {
      bell(note(base + 7), 0.06, 0.16, 2.2);
      bell(note(base + 12), 0.05, 0.28, 2.4);
    }
  },
  /** a cup gently says "not this one" */
  refuse() {
    soft(392, 0.07, 0, 0.22);
    soft(330, 0.07, 0.2, 0.3);
  },
  /** a mix that no cup wants: a soft "oh" */
  oops() {
    plop(420, 0.14, 0, 2);
    soft(440, 0.06, 0.15, 0.7, 330);
  },
  /** a drop splits in two: a falling plop for each half, a little apart, and a soft bell */
  split(vol: number) {
    const f = (620 / Math.sqrt(vol)) * rand(0.95, 1.05);
    plop(f * 1.6, 0.14, 0, 0.62, 0.16, -0.3);
    plop(f * 1.75, 0.12, 0.06, 0.6, 0.16, 0.3);
    bell(nextNote() * 2, 0.035, 0.08, 1.2);
  },
  /** a small drop cannot split: a tiny wobble sound */
  noSplit() { plop(700, 0.04, 0, 1.15, 0.08); plop(640, 0.035, 0.09, 1.1, 0.08); },
  /** a cup hops in the celebration */
  hop(i: number) { plop(500 + i * 120, 0.1, 0, 2.4, 0.15, [-0.4, 0, 0.4][i % 3]); },
  /** a star sticker pops on */
  sticker(i: number) {
    plop(700, 0.08, 0, 1.8, 0.1, [0.4, 0, -0.4][i]);
    bell(note([12, 16, 19][i]), 0.06, 0.02, 1.6, [0.4, 0, -0.4][i]);
  },
  /** the level is done */
  win() {
    [0, 4, 7, 12, 16, 19, 24].forEach((st, i) => bell(note(st), 0.07, i * 0.12, 2.4));
    const a = ready(); if (!a) return;
    const t = a.currentTime;
    for (const st of [-12, -5, 0, 4]) {
      for (const det of [-6, 6]) {
        const o = a.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = note(st) / 2;
        o.detune.value = det;
        const lp = a.createBiquadFilter();
        lp.type = 'lowpass'; lp.frequency.value = 900;
        const g = a.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.012, t + 0.5);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
        o.connect(lp).connect(g);
        out(g, 1);
        o.start(t); o.stop(t + 3.3);
      }
    }
  },
};
