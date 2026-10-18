// Gentle generative music, all made in code, with a different mood for every track. It is built like a small band
// in a warm room:
// - a pad: slow chords (I–vi–IV–V and friends) from softly detuned voices through a lowpass, fading in and out;
// - a soft bass note under each chord;
// - in the races, a quicker tempo (116–128 BPM) with a bouncing bass, a running arpeggio and a soft galloping beat;
// - a melody in short phrases (a motif, its echo, an answer and a resting note) that follows the chords, played on
//   a music box or a kalimba (Karplus–Strong plucks rendered once into buffers) or on soft FM electric-piano bells,
//   with small timing and loudness differences so it sounds played by a person;
// - a nature bed of pink or brown noise (wind, a breeze, a fountain) that rises and falls slowly;
// - a room: a convolution reverb whose impulse is generated noise with a darkening tail;
// - warmth on the mix: a little bass, a gentle high cut, light tape-like saturation, and notes spread left and right.
// Notes are scheduled ahead in audio time, so the same engine can render offline (`renderMusic`, for ?debug=music).
// Envelopes are scheduled ramps; no oscillator ever drives a gain.

import type { TrackId } from './art/tracks';

type Lead = 'musicbox' | 'kalimba' | 'epiano';
type Air = 'wind' | 'breeze' | 'snow' | 'warm' | 'fountain' | null;

interface Mood {
  key: number; // the tonic (MIDI); the melody plays an octave or so above it
  bpm: number;
  chords: number[][]; // each chord as semitones from the key, two bars each
  scale: number[]; // the melody's notes (semitones in an octave)
  lead: Lead;
  answer: Lead; // the instrument of the answering phrase
  air: Air;
  bright: number; // the pad's lowpass cutoff (Hz)
  drive?: boolean; // race music: a bouncing bass, a running arpeggio and a soft galloping beat
}

const MAJ_P = [0, 2, 4, 7, 9];
const MIN_P = [0, 3, 5, 7, 10];
// chords from the major key: I, ii, iii, IV, V, vi (voiced close, around the key)
const I = [0, 4, 7];
const ii = [2, 5, 9];
const iii = [4, 7, 11];
const IV = [5, 9, 12];
const V = [-5, -1, 2];
const vi = [-3, 0, 4];

const MOODS: Record<TrackId | 'menu', Mood> = {
  menu: { key: 67, bpm: 72, chords: [I, vi, IV, V], scale: MAJ_P, lead: 'musicbox', answer: 'epiano', air: null, bright: 900 },
  // the races are quicker and bouncier (owner's request), still soft: a galloping beat under the same instruments
  forest: { key: 65, bpm: 120, chords: [I, IV, vi, V], scale: MAJ_P, lead: 'kalimba', answer: 'musicbox', air: 'wind', bright: 1100, drive: true },
  meadow: { key: 67, bpm: 128, chords: [I, V, vi, IV], scale: MAJ_P, lead: 'kalimba', answer: 'epiano', air: 'breeze', bright: 1300, drive: true },
  snow: { key: 62, bpm: 116, chords: [I, vi, ii, V], scale: MAJ_P, lead: 'musicbox', answer: 'epiano', air: 'snow', bright: 1000, drive: true },
  // a warm minor colour at sunset: i–VI–III–VII
  canyon: { key: 64, bpm: 120, chords: [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]], scale: MIN_P, lead: 'kalimba', answer: 'epiano', air: 'warm', bright: 1000, drive: true },
  garden: { key: 63, bpm: 124, chords: [I, iii, IV, V], scale: MAJ_P, lead: 'epiano', answer: 'musicbox', air: 'fountain', bright: 1100, drive: true },
};

const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
// the melody's range, in semitones above the key: from the key to a twelfth above it
const LO = 0;
const HI = 19;

/** A small seeded random generator, so phrases can repeat and vary. */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ---------------------------------------------------------------- sounds rendered once into buffers

/** A room: stereo noise with an exponential decay that also darkens as it fades, after a short pre-delay. */
function roomImpulse(ctx: BaseAudioContext, seconds = 3.2): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * seconds);
  const buf = ctx.createBuffer(2, len, sr);
  const pre = Math.floor(sr * 0.022);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let y = 0;
    for (let i = pre; i < len; i++) {
      const t = (i - pre) / sr;
      const a = 0.55 * Math.exp(-t / 0.6) + 0.06; // the lowpass closes over time: the tail gets darker
      y += a * (Math.random() * 2 - 1 - y);
      d[i] = y * Math.exp(-t / 0.85) * (1 - Math.exp(-t / 0.01));
    }
  }
  return buf;
}

/** Pink (1/f, softer than white) or brown (softer still, a deep rumble) noise, looping without a click. */
function noiseLoop(ctx: BaseAudioContext, kind: 'pink' | 'brown', seconds = 6): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * seconds);
  const buf = ctx.createBuffer(2, len, sr);
  const fade = Math.floor(sr * 0.5);
  for (let ch = 0; ch < 2; ch++) {
    const raw = new Float32Array(len + fade);
    // Paul Kellet's pink filter, or integrated (leaky) white noise for brown
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, br = 0;
    for (let i = 0; i < raw.length; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'pink') {
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.016898;
        raw[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      } else {
        br = (br + 0.02 * w) / 1.02;
        raw[i] = br * 3.5;
      }
    }
    // crossfade the extra tail into the start, so the loop has no seam
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = raw[i];
    for (let i = 0; i < fade; i++) {
      const u = i / fade;
      d[i] = raw[len + i] * (1 - u) + raw[i] * u;
    }
  }
  return buf;
}

/**
 * A plucked note. The kalimba is Karplus–Strong: a soft burst of noise in a delay line the length of one period,
 * averaged and fed back, which rings like a struck tine and mellows as it fades. The music box is a bright metal
 * tine: a sine with two quickly fading, slightly out-of-tune partials and a tiny click.
 */
function pluck(ctx: BaseAudioContext, kind: 'kalimba' | 'musicbox', midi: number): AudioBuffer {
  const sr = ctx.sampleRate;
  const f = hz(midi);
  const dur = kind === 'kalimba' ? 2.2 : 2.6;
  const len = Math.floor(sr * dur);
  const buf = ctx.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  if (kind === 'kalimba') {
    const N = Math.max(2, Math.round(sr / f));
    const line = new Float32Array(N);
    // a soft pluck: lowpassed noise, so the attack is round rather than scratchy
    let lp = 0;
    for (let i = 0; i < N; i++) {
      lp += 0.5 * (Math.random() * 2 - 1 - lp);
      line[i] = lp;
    }
    const decay = Math.pow(0.001, 1 / (dur * f)); // about -60 dB by the end
    let prev = 0;
    for (let i = 0; i < len; i++) {
      const j = i % N;
      const cur = line[j];
      const next = 0.5 * (cur + prev) * decay;
      prev = cur;
      line[j] = next;
      // a little of the pure fundamental gives the tine its body
      d[i] = cur * 0.8 + Math.sin((2 * Math.PI * f * i) / sr) * 0.35 * Math.exp(-i / sr / 0.7);
    }
  } else {
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      d[i] =
        Math.sin(2 * Math.PI * f * t) * Math.exp(-t / 1.1) +
        0.22 * Math.sin(2 * Math.PI * f * 2.003 * t) * Math.exp(-t / 0.45) +
        0.1 * Math.sin(2 * Math.PI * f * 4.97 * t) * Math.exp(-t / 0.09) +
        (i < sr * 0.004 ? (Math.random() * 2 - 1) * 0.08 * (1 - t / 0.004) : 0);
    }
  }
  // a 3 ms fade-in, so no pluck clicks, and a normalized peak
  let peak = 0;
  for (let i = 0; i < len; i++) {
    if (i < sr * 0.003) d[i] *= i / (sr * 0.003);
    peak = Math.max(peak, Math.abs(d[i]));
  }
  if (peak > 0) for (let i = 0; i < len; i++) d[i] /= peak;
  return buf;
}

/** Soft saturation: tanh, scaled so quiet sounds pass unchanged and peaks round off. */
function warmCurve(drive = 1.6): Float32Array<ArrayBuffer> {
  const n = 1024;
  const c = new Float32Array(new ArrayBuffer(n * 4));
  const k = Math.tanh(drive);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    c[i] = Math.tanh(drive * x) / k;
  }
  return c;
}

// ---------------------------------------------------------------- the engine

class Engine {
  private ctx: BaseAudioContext;
  private input: GainNode; // notes go here (dry and to the room)
  private padBus: BiquadFilterNode;
  private airBus: GainNode;
  private plucks = new Map<string, AudioBuffer>();
  private pink: AudioBuffer;
  private brown: AudioBuffer;
  private air: { src: AudioBufferSourceNode; gain: GainNode; mood: Air; next: number } | null = null;
  private pads: { gains: GainNode[]; oscs: OscillatorNode[] }[] = [];
  mood: Mood;
  private next = 0; // audio time of the next eighth note
  private eighth = 0; // eighth notes since the mood began
  private pending: Mood | null = null;
  private prevNote: number;
  private r = rng(7);
  private motif: { at: number; step: number; len: number }[] = [];
  enabled = true;
  /** The melody's notes, when rendering offline (for checks). */
  log: [number, number, Lead][] | null = null;

  constructor(ctx: BaseAudioContext, out: AudioNode, mood: Mood) {
    this.ctx = ctx;
    this.mood = mood;
    this.prevNote = mood.key + 12;
    // the warm mix: a little bass, a gentle high cut, light saturation
    const low = ctx.createBiquadFilter();
    low.type = 'lowshelf';
    low.frequency.value = 220;
    low.gain.value = 2.5;
    const high = ctx.createBiquadFilter();
    high.type = 'highshelf';
    high.frequency.value = 4200;
    high.gain.value = -4;
    const cut = ctx.createBiquadFilter();
    cut.type = 'lowpass';
    cut.frequency.value = 9000;
    cut.Q.value = 0.5;
    const sat = ctx.createWaveShaper();
    sat.curve = warmCurve();
    sat.oversample = '2x';
    const mix = ctx.createGain();
    mix.gain.value = 0.9;
    mix.connect(low).connect(high).connect(cut).connect(sat).connect(out);
    // the room
    const room = ctx.createConvolver();
    room.buffer = roomImpulse(ctx);
    const wet = ctx.createGain();
    wet.gain.value = 0.42;
    room.connect(wet).connect(mix);
    this.input = ctx.createGain();
    this.input.gain.value = 0.8;
    this.input.connect(mix);
    this.input.connect(room);
    // the pad has its own lowpass, and more of it goes to the room
    this.padBus = ctx.createBiquadFilter();
    this.padBus.type = 'lowpass';
    this.padBus.frequency.value = mood.bright;
    this.padBus.Q.value = 0.6;
    const padDry = ctx.createGain();
    padDry.gain.value = 0.7;
    const padWet = ctx.createGain();
    padWet.gain.value = 0.6;
    this.padBus.connect(padDry).connect(mix);
    this.padBus.connect(padWet).connect(room);
    // the nature bed, mostly dry, a little in the room
    this.airBus = ctx.createGain();
    this.airBus.gain.value = 1;
    this.airBus.connect(mix);
    const airWet = ctx.createGain();
    airWet.gain.value = 0.25;
    this.airBus.connect(airWet).connect(room);
    this.pink = noiseLoop(ctx, 'pink');
    this.brown = noiseLoop(ctx, 'brown');
  }

  get now() {
    return this.ctx.currentTime;
  }

  /** Schedule everything up to `until` (audio time). */
  run(until: number) {
    if (this.next < this.now) this.next = this.now + 0.05;
    while (this.next < until) {
      const per = 60 / this.mood.bpm / 2;
      const inBar = this.eighth % 8;
      if (inBar === 0 && this.pending) {
        this.mood = this.pending;
        this.pending = null;
        this.eighth = 0;
        this.motif = [];
        this.padBus.frequency.setTargetAtTime(this.mood.bright, this.next, 1);
      }
      this.eighthNote(this.next, per);
      this.next += per;
      this.eighth++;
    }
    this.airFollow(until);
  }

  setMood(m: Mood) {
    if (m !== this.mood) this.pending = m;
  }

  // -------------------------------------------------------------- what plays on each eighth note

  private eighthNote(t: number, per: number) {
    const m = this.mood;
    const bar = Math.floor(this.eighth / 8);
    const inBar = this.eighth % 8;
    const chord = m.chords[Math.floor(bar / 2) % m.chords.length];
    if (!this.enabled) return;
    if (inBar === 0 && bar % 2 === 0) this.padChord(t, chord, per * 16);
    if (m.drive) this.drive(t, chord, inBar, per);
    else if (inBar === 0) this.bass(t, chord, per * 8);
    // phrases of four bars: a motif, the motif again (moved to the new chord), an answer on another instrument, rest
    const phraseBar = bar % 4;
    if (inBar === 0 && phraseBar === 0) this.motif = this.newMotif();
    if (phraseBar === 3) {
      // the phrase ends on a long chord note, then rests
      if (inBar === 0) this.note(t, this.nearest(chord.map((c) => m.key + 12 + c)), 'musicbox', 0.55, per * 6);
      return;
    }
    const lead = phraseBar === 2 ? m.answer : m.lead;
    for (const n of this.motif) {
      if (n.at !== inBar) continue;
      // strong beats land on chord notes, the others step through the scale
      const target = n.at % 4 === 0 ? this.nearest(chord.map((c) => m.key + 12 + c), this.prevNote + n.step) : this.scaleStep(this.prevNote, n.step);
      this.note(t, target, lead, phraseBar === 2 ? 0.6 : 0.75, per * n.len);
    }
  }

  /** A short rhythm with steps up and down: three to five notes in a bar, some long, some short. */
  private newMotif() {
    const rhythms = [
      [0, 2, 4, 6],
      [0, 3, 4, 6],
      [0, 2, 3, 4],
      [0, 4, 5, 6],
      [0, 1, 2, 4],
      [0, 3, 6],
    ];
    const rh = rhythms[Math.floor(this.r() * rhythms.length)];
    // a gentle contour that turns around, so the tune never climbs forever
    const up = this.prevNote < this.mood.key + LO + 5 ? 1 : this.prevNote > this.mood.key + HI - 5 ? -1 : this.r() < 0.5 ? 1 : -1;
    return rh.map((at, i) => ({ at, step: i === 0 ? 0 : (i === rh.length - 1 ? -up : up) * (this.r() < 0.7 ? 1 : 2), len: (rh[i + 1] ?? 8) - at }));
  }

  private scaleNotes() {
    const m = this.mood;
    const out: number[] = [];
    for (let o = 0; o < 3; o++) for (const s of m.scale) out.push(m.key + o * 12 + s);
    return out.filter((n) => n >= LO + m.key && n <= HI + m.key);
  }

  private scaleStep(from: number, step: number) {
    const sc = this.scaleNotes();
    let i = sc.reduce((b, n, j) => (Math.abs(n - from) < Math.abs(sc[b] - from) ? j : b), 0);
    i = Math.max(0, Math.min(sc.length - 1, i + step));
    return sc[i];
  }

  /** The chord note (in any octave in range) closest to `near`. */
  private nearest(chord: number[], near = this.prevNote) {
    let best = chord[0];
    for (const c of chord) for (const o of [-12, 0, 12]) {
      const n = c + o;
      if (n < this.mood.key + LO || n > this.mood.key + HI) continue;
      if (Math.abs(n - near) < Math.abs(best - near)) best = n;
    }
    return best;
  }

  // -------------------------------------------------------------- instruments

  private note(t: number, midi: number, lead: Lead, vel: number, len: number) {
    this.prevNote = midi;
    this.log?.push([t, midi, lead]);
    const c = this.ctx;
    // played by a person: a little early or late, a little louder or softer, a little left or right
    const at = Math.max(this.now, t + (this.r() - 0.5) * 0.024);
    const v = vel * (0.78 + this.r() * 0.22);
    const g = c.createGain();
    const pan = c.createStereoPanner ? c.createStereoPanner() : null;
    if (pan) {
      pan.pan.value = (this.r() - 0.5) * 0.7;
      g.connect(pan).connect(this.input);
    } else g.connect(this.input);
    if (lead === 'epiano') {
      // FM: a sine whose frequency is wobbled by another sine; the wobble fades, so it starts bright and mellows
      const car = c.createOscillator();
      const mod = c.createOscillator();
      const depth = c.createGain();
      const tine = c.createOscillator();
      const tineDepth = c.createGain();
      const f = hz(midi);
      car.frequency.value = f;
      mod.frequency.value = f;
      tine.frequency.value = f * 3.5;
      depth.gain.setValueAtTime(f * 1.1, at);
      depth.gain.exponentialRampToValueAtTime(f * 0.08, at + 1.4);
      tineDepth.gain.setValueAtTime(f * 0.9, at);
      tineDepth.gain.exponentialRampToValueAtTime(1, at + 0.12);
      mod.connect(depth).connect(car.frequency);
      tine.connect(tineDepth).connect(car.frequency);
      car.connect(g);
      const end = at + Math.max(1.6, len + 1);
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(0.2 * v, at + 0.006);
      g.gain.exponentialRampToValueAtTime(0.09 * v, at + 0.4);
      g.gain.exponentialRampToValueAtTime(0.0005, end);
      for (const o of [car, mod, tine]) {
        o.start(at);
        o.stop(end + 0.05);
      }
      return;
    }
    const key = `${lead}:${midi}`;
    let buf = this.plucks.get(key);
    if (!buf) this.plucks.set(key, (buf = pluck(c, lead, midi)));
    const src = c.createBufferSource();
    src.buffer = buf;
    src.connect(g);
    g.gain.value = (lead === 'musicbox' ? 0.17 : 0.24) * v;
    src.start(at);
  }

  /** A slow chord: two softly detuned voices per note through the pad's lowpass, fading in over the old one. */
  private padChord(t: number, chord: number[], len: number) {
    const c = this.ctx;
    const m = this.mood;
    // let the last chord fade out under the new one
    for (const p of this.pads) for (const g of p.gains) {
      g.gain.cancelScheduledValues(t);
      g.gain.setTargetAtTime(0, t, 0.9);
    }
    for (const p of this.pads) for (const o of p.oscs) o.stop(t + 5);
    this.pads = [];
    const voice = { gains: [] as GainNode[], oscs: [] as OscillatorNode[] };
    chord.forEach((s, i) => {
      for (const det of [-7, 7]) {
        const o = c.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = hz(m.key - 12 + s);
        o.detune.value = det + (this.r() - 0.5) * 4;
        const g = c.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.02, t + 1.6);
        g.gain.setTargetAtTime(0.016, t + 1.6, len / 2);
        const pan = c.createStereoPanner ? c.createStereoPanner() : null;
        if (pan) {
          pan.pan.value = (i - 1) * 0.35 + det * 0.02;
          o.connect(g).connect(pan).connect(this.padBus);
        } else o.connect(g).connect(this.padBus);
        o.start(t);
        voice.gains.push(g);
        voice.oscs.push(o);
      }
    });
    this.pads.push(voice);
  }

  /** A soft round bass note: the chord's root, low. */
  private bass(t: number, chord: number[], len: number, up = 0, level = 1) {
    const c = this.ctx;
    const root = this.mood.key - 24 + ((chord[0] % 12) + 12) % 12 + up;
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.value = hz(root);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.04 * level, t + (up || level < 1 ? 0.02 : 0.08));
    g.gain.exponentialRampToValueAtTime(0.018 * level, t + len * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0005, t + len + 0.4);
    o.connect(g).connect(this.input);
    o.start(t);
    o.stop(t + len + 0.5);
  }

  /**
   * Race music's engine room, on every eighth note: the bass bounces root–fifth on the beats, a quiet kalimba
   * arpeggio runs through the chord, and a soft beat gallops (a round low thump on 1 and 3, a pink-noise shaker on
   * every eighth with a gallop accent). Gentle levels, so it pushes along without getting loud.
   */
  private drive(t: number, chord: number[], inBar: number, per: number) {
    const c = this.ctx;
    const root = ((chord[0] % 12) + 12) % 12;
    if (inBar % 2 === 0) this.bass(t, chord, per * 2, inBar % 4 === 2 ? 7 : 0, 0.6);
    // the arpeggio: up and down the chord, under the melody (dipping an octave lower in the second half of the bar)
    const order = [0, 1, 2, 1];
    const n = this.mood.key + chord[order[inBar % 4]] - (inBar % 8 >= 4 ? 12 : 0);
    const key = `kalimba:${n}`;
    let buf = this.plucks.get(key);
    if (!buf) this.plucks.set(key, (buf = pluck(c, 'kalimba', n)));
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    const at = Math.max(this.now, t + (this.r() - 0.5) * 0.01);
    g.gain.setValueAtTime((inBar % 2 ? 0.035 : 0.05) * (0.85 + this.r() * 0.15), at);
    g.gain.setTargetAtTime(0, at + per * 1.6, 0.12);
    const pan = c.createStereoPanner ? c.createStereoPanner() : null;
    if (pan) {
      pan.pan.value = inBar % 2 ? 0.3 : -0.3;
      src.connect(g).connect(pan).connect(this.input);
    } else src.connect(g).connect(this.input);
    src.start(at);
    src.stop(at + per * 2.5);
    // the beat: a round thump (a falling sine) on 1 and 3
    if (inBar % 4 === 0) {
      const o = c.createOscillator();
      o.frequency.setValueAtTime(hz(this.mood.key - 36 + root) * 2, t);
      o.frequency.exponentialRampToValueAtTime(hz(this.mood.key - 36 + root), t + 0.12);
      const k = c.createGain();
      k.gain.setValueAtTime(0, t);
      k.gain.linearRampToValueAtTime(0.09, t + 0.008);
      k.gain.exponentialRampToValueAtTime(0.0005, t + 0.35);
      o.connect(k).connect(this.input);
      o.start(t);
      o.stop(t + 0.4);
    }
    // a shaker on every eighth: soft pink-noise taps, a little louder on the gallop's "da-da-DUM"
    const sh = c.createBufferSource();
    sh.buffer = this.pink;
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 5000;
    const sg = c.createGain();
    const accent = [0.5, 0.35, 0.4, 0.75, 0.5, 0.35, 0.4, 0.75][inBar];
    const st = Math.max(this.now, t + (this.r() - 0.5) * 0.008);
    sg.gain.setValueAtTime(0, st);
    sg.gain.linearRampToValueAtTime(0.11 * accent, st + 0.004);
    sg.gain.exponentialRampToValueAtTime(0.0005, st + 0.07);
    sh.connect(hp).connect(sg).connect(this.input);
    sh.start(st, this.r() * 4);
    sh.stop(st + 0.1);
  }

  // -------------------------------------------------------------- the nature bed

  private airFollow(until: number) {
    const want = this.enabled ? this.mood.air : null;
    if (this.air && this.air.mood !== want) {
      const old = this.air;
      old.gain.gain.cancelScheduledValues(this.now);
      old.gain.gain.setTargetAtTime(0, this.now, 0.8);
      old.src.stop(this.now + 4);
      this.air = null;
    }
    if (!this.air && want) {
      const c = this.ctx;
      const src = c.createBufferSource();
      src.buffer = want === 'fountain' || want === 'breeze' ? this.pink : this.brown;
      src.loop = true;
      const f = c.createBiquadFilter();
      const f2 = c.createBiquadFilter();
      f2.type = 'lowpass';
      if (want === 'fountain') {
        // a little fountain: pink noise, the low rumble taken out
        f.type = 'highpass';
        f.frequency.value = 900;
        f2.frequency.value = 5200;
      } else if (want === 'breeze') {
        f.type = 'bandpass';
        f.frequency.value = 700;
        f.Q.value = 0.4;
        f2.frequency.value = 2400;
      } else {
        // wind from brown noise: a soft, deep whoosh
        f.type = 'lowpass';
        f.frequency.value = want === 'snow' ? 520 : want === 'warm' ? 380 : 450;
        f2.frequency.value = 1400;
      }
      const gain = c.createGain();
      gain.gain.value = 0;
      src.connect(f).connect(f2).connect(gain).connect(this.airBus);
      src.start(this.now, Math.random() * 3);
      this.air = { src, gain, mood: want, next: this.now };
    }
    // gusts: the level drifts to a new value every few seconds
    const a = this.air;
    while (a && a.next < until) {
      const base = a.mood === 'fountain' ? 0.05 : a.mood === 'breeze' ? 0.035 : 0.06;
      const lvl = base * (a.mood === 'fountain' ? 0.85 + this.r() * 0.3 : 0.4 + this.r() * 0.9);
      a.gain.gain.setTargetAtTime(lvl, a.next, 1.4);
      a.next += 2.5 + this.r() * 3;
    }
  }
}

// ---------------------------------------------------------------- the music player the game uses

class Music {
  enabled = true;
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private engine: Engine | null = null;
  private mood: Mood = MOODS.menu;
  private timer = 0;

  start(ctx: AudioContext, out: AudioNode) {
    if (this.ctx) return;
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(out);
    this.engine = new Engine(ctx, this.master, this.mood);
    this.setOn(this.enabled);
    // schedule a little ahead in audio time; timers only top the queue up
    const tick = () => this.engine?.run(ctx.currentTime + 1.2);
    tick();
    this.timer = window.setInterval(tick, 250);
  }

  setOn(on: boolean) {
    this.enabled = on;
    if (!this.ctx || !this.engine) return;
    this.engine.enabled = on;
    this.master.gain.setTargetAtTime(on ? 0.5 : 0, this.ctx.currentTime, 0.5);
  }

  /** Match the music to the track (or 'menu'); it changes at the start of the next bar. */
  setTrack(t: TrackId | 'menu') {
    this.mood = MOODS[t] ?? MOODS.menu;
    this.engine?.setMood(this.mood);
  }

  stop() {
    clearInterval(this.timer);
  }
}

export const music = new Music();

/** Render some seconds of a mood offline (for ?debug=music: listening and level checks). */
export async function renderMusic(mood: TrackId | 'menu', seconds: number, sampleRate = 44100): Promise<{ buf: AudioBuffer; notes: [number, number, Lead][] }> {
  const ctx = new OfflineAudioContext(2, Math.floor(seconds * sampleRate), sampleRate);
  const master = ctx.createGain();
  master.gain.value = 0.5;
  // the same limiter as the game's
  const lim = ctx.createDynamicsCompressor();
  lim.threshold.value = -14;
  lim.knee.value = 12;
  lim.ratio.value = 6;
  lim.attack.value = 0.005;
  lim.release.value = 0.25;
  master.connect(lim).connect(ctx.destination);
  const e = new Engine(ctx, master, MOODS[mood]);
  e.log = [];
  e.run(seconds);
  return { buf: await ctx.startRendering(), notes: e.log };
}

export const MOOD_IDS = Object.keys(MOODS) as (TrackId | 'menu')[];
