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

function out(g: GainNode, wet = 0.6) {
  g.connect(master!);
  const s = ac!.createGain();
  s.gain.value = wet;
  g.connect(s).connect(send!);
}

function ready(): AudioContext | null {
  return ac && ac.state === 'running' && !muted ? ac : null;
}

function plop(f0: number, gain: number, when = 0, rise = 2.3) {
  const a = ready(); if (!a) return;
  const t = a.currentTime + when;
  const o = a.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f0 * rise, t + 0.07);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
  o.connect(g);
  out(g, 0.5);
  o.start(t); o.stop(t + 0.2);
}

function bell(freq: number, gain: number, when = 0, dur = 1.8) {
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
  out(g, 0.9);
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

export const sfx = {
  /** a drop drips onto the paper */
  drip(i: number) { plop(780 + (i % 4) * 90, 0.09, 0, 2.0); },
  /** touching a drop to move it */
  pick() { plop(950, 0.035, 0, 1.6); },
  /** two drops of one colour join */
  merge(vol: number) {
    plop(560 / Math.sqrt(vol), 0.2);
    bell(nextNote(), 0.05, 0.03, 1.4);
  },
  /** a drop goes into the right cup */
  cup(i: number) {
    plop(300, 0.2, 0, 2.6);
    const base = [0, 4, 7][i % 3];
    bell(note(base), 0.08, 0.05, 2.2);
    bell(note(base + 7), 0.06, 0.16, 2.2);
    bell(note(base + 12), 0.05, 0.28, 2.4);
  },
  /** a cup gently says "not this one" */
  refuse() {
    soft(392, 0.07, 0, 0.22);
    soft(330, 0.07, 0.2, 0.3);
  },
  /** two colours touched where they should not: a soft "oh" */
  oops() {
    plop(420, 0.14, 0, 2);
    soft(440, 0.06, 0.15, 0.7, 330);
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
