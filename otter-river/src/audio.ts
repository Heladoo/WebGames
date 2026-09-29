import type { Settings } from './state';

// Gentle, fully synthesized sound: a soft generative music box over pads,
// filtered-noise river ambience, and plucky pentatonic pickups.

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

const CHORDS = [
  { pad: [48, 55, 64], tones: [72, 76, 79, 84] }, // C
  { pad: [45, 52, 60], tones: [72, 76, 81, 84] }, // Am
  { pad: [41, 48, 57], tones: [72, 77, 81, 84] }, // F
  { pad: [43, 50, 59], tones: [74, 79, 83, 86] }, // G
];
// Two octaves of C major pentatonic for the collect melody.
const PENTA = [67, 69, 72, 74, 76, 79, 81, 84, 86, 88];
// Each full up-and-down walk moves to the next chord colour of the song.
const WALK_SHIFT = [0, -3, 5, 2];

interface ToneOpts {
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  dest?: AudioNode;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private music!: GainNode;
  private sfx!: GainNode;
  private musicIn!: GainNode;
  private nextNote = 0;
  private nextChord = 0;
  private chordIdx = 0;
  private combo = 0;
  private lastCollect = 0;
  private settings: Settings;

  constructor(settings: Settings) {
    this.settings = settings;
  }

  /** Must be called from a user gesture (browser autoplay policy). */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    // a gentle limiter so no sound can ever spike
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -14;
    limiter.knee.value = 12;
    limiter.ratio.value = 6;
    limiter.attack.value = 0.005;
    limiter.release.value = 0.25;
    this.master.connect(limiter);
    limiter.connect(ctx.destination);
    this.music = ctx.createGain();
    this.music.connect(this.master);
    this.sfx = ctx.createGain();
    this.sfx.connect(this.master);

    // Soft echo for the music box.
    this.musicIn = ctx.createGain();
    this.musicIn.connect(this.music);
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.42;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 1800;
    this.musicIn.connect(delay);
    delay.connect(tone);
    tone.connect(fb);
    fb.connect(delay);
    tone.connect(this.music);

    this.startRiver();
    this.apply(this.settings, true);
    this.nextNote = ctx.currentTime + 0.8;
    this.nextChord = ctx.currentTime + 0.2;
  }

  apply(s: Settings, instant = false) {
    this.settings = s;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const ramp = instant ? 0.01 : 0.4;
    this.master.gain.setTargetAtTime(s.muted ? 0 : s.volume, t, ramp);
    this.music.gain.setTargetAtTime(s.music ? 0.55 : 0, t, ramp);
    this.sfx.gain.setTargetAtTime(s.sfx ? 1 : 0, t, ramp);
  }

  suspend() {
    void this.ctx?.suspend();
  }

  resume() {
    if (this.ctx?.state === 'suspended') void this.ctx.resume();
  }

  private rainGain: GainNode | null = null;

  private startRiver() {
    const ctx = this.ctx!;
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02; // brown noise
      data[i] = last * 3.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoAmt = ctx.createGain();
    lfoAmt.gain.value = 160;
    lfo.connect(lfoAmt);
    lfoAmt.connect(lp.frequency);
    const g = ctx.createGain();
    g.gain.value = 0.12;
    src.connect(lp);
    lp.connect(g);
    g.connect(this.sfx);
    src.start();
    lfo.start();

    // rain: brighter noise, silent until it rains
    const rsrc = ctx.createBufferSource();
    rsrc.buffer = buf;
    rsrc.loop = true;
    rsrc.playbackRate.value = 2.7;
    const hp = ctx.createBiquadFilter();
    hp.type = 'bandpass';
    hp.frequency.value = 1800;
    hp.Q.value = 0.4;
    this.rainGain = ctx.createGain();
    this.rainGain.gain.value = 0;
    rsrc.connect(hp);
    hp.connect(this.rainGain);
    this.rainGain.connect(this.sfx);
    rsrc.start();

    // ambience beds made from the same noise: wind, waves, rushing water
    const bed = (rate: number, type: BiquadFilterType, freq: number, q: number) => {
      const src2 = ctx.createBufferSource();
      src2.buffer = buf;
      src2.loop = true;
      src2.playbackRate.value = rate;
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      const gn = ctx.createGain();
      gn.gain.value = 0;
      src2.connect(f);
      f.connect(gn);
      gn.connect(this.sfx);
      src2.start(ctx.currentTime + Math.random());
      return gn;
    };
    this.windGain = bed(1.3, 'bandpass', 520, 0.8);
    this.waveGain = bed(0.8, 'lowpass', 650, 0.5);
    this.rushGain = bed(2.2, 'bandpass', 1300, 0.45);
  }

  private windGain: GainNode | null = null;
  private waveGain: GainNode | null = null;
  private rushGain: GainNode | null = null;
  private amb = { birds: 0, frogs: 0, crickets: 0 };
  private nextCritter = 0;

  /**
   * Scene soundscape: called every frame with what the world looks like.
   * Wind in the woods, waves at the cove, birds by day, frogs in the marsh,
   * crickets at night, rushing water near a beaver dam.
   */
  ambience(a: { biome: string; night: number; rain: number; dam: number; t: number }) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.windGain) return;
    const now = ctx.currentTime;
    const day = 1 - a.night;
    const gust = 0.55 + 0.45 * Math.sin(a.t * 0.23) * Math.sin(a.t * 0.61 + 1);
    const wind = (a.biome === 'forest' ? 0.11 : a.biome === 'blossom' ? 0.05 : 0.025) * gust + a.rain * 0.04;
    this.windGain.gain.setTargetAtTime(wind, now, 0.6);
    const swell = 0.5 + 0.5 * Math.sin(a.t * 0.75);
    this.waveGain!.gain.setTargetAtTime(a.biome === 'cove' ? 0.05 + 0.08 * swell : 0, now, 0.5);
    this.rushGain!.gain.setTargetAtTime(a.dam * a.dam * 0.14, now, 0.4);
    this.amb.birds = (a.biome === 'meadow' || a.biome === 'blossom' || a.biome === 'forest' ? 1 : 0.3) * day * (1 - a.rain);
    this.amb.frogs = (a.biome === 'marsh' ? 1 : 0.15) * (0.4 + 0.6 * a.night);
    this.amb.crickets = a.night * (1 - a.rain * 0.7);

    if (now < this.nextCritter) return;
    this.nextCritter = now + 0.6 + Math.random() * 1.6;
    const r = Math.random();
    if (r < this.amb.birds * 0.5) this.birdsong(now);
    else if (r < 0.5 + this.amb.frogs * 0.3 && Math.random() < this.amb.frogs) this.croak(now);
    else if (Math.random() < this.amb.crickets) this.cricket(now);
  }

  private birdsong(t: number) {
    const ctx = this.ctx!;
    const n = 2 + Math.floor(Math.random() * 4);
    const base = 2300 + Math.random() * 1400;
    for (let i = 0; i < n; i++) {
      const at = t + i * (0.09 + Math.random() * 0.05);
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(base * (0.9 + Math.random() * 0.2), at);
      o.frequency.exponentialRampToValueAtTime(base * (1.2 + Math.random() * 0.4), at + 0.07);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(0.018, at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.08);
      o.connect(g);
      g.connect(this.sfx);
      o.start(at);
      o.stop(at + 0.1);
    }
  }

  /** A soft two-pulse "rib-bit": low sine through a lowpass, no audio-rate gain modulation. */
  private croak(t: number) {
    const ctx = this.ctx!;
    const base = 130 + Math.random() * 40;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    lp.connect(this.sfx);
    for (const [dt, len] of [[0, 0.09], [0.14, 0.12]]) {
      const at = t + dt;
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(base * 1.15, at);
      o.frequency.exponentialRampToValueAtTime(base, at + len);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(0.02, at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, at + len);
      o.connect(g);
      g.connect(lp);
      o.start(at);
      o.stop(at + len + 0.02);
    }
  }

  private cricket(t: number) {
    const ctx = this.ctx!;
    for (let k = 0; k < 3; k++) {
      const at = t + k * 0.12;
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = 4300 + Math.random() * 300;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      for (let i = 0; i < 4; i++) {
        g.gain.linearRampToValueAtTime(0.006, at + i * 0.025 + 0.008);
        g.gain.linearRampToValueAtTime(0.0001, at + i * 0.025 + 0.02);
      }
      o.connect(g);
      g.connect(this.sfx);
      o.start(at);
      o.stop(at + 0.12);
    }
  }

  /** Soft two-note chime for "NEW" news. */
  chime() {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    this.tone(midi(84), t, 0.5, { gain: 0.04 });
    this.tone(midi(91), t + 0.12, 0.8, { gain: 0.035 });
  }

  /** Camera shutter: a soft click and a sparkle. */
  shutter() {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    this.tone(1400, t, 0.05, { type: 'triangle', gain: 0.02 });
    this.tone(800, t + 0.05, 0.06, { type: 'triangle', gain: 0.015 });
    [88, 91, 96].forEach((m, i) => this.tone(midi(m), t + 0.12 + i * 0.06, 0.4, { gain: 0.025 }));
  }

  private tone(freq: number, time: number, dur: number, o: ToneOpts = {}) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = o.type ?? 'sine';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    const peak = o.gain ?? 0.1;
    const attack = o.attack ?? 0.008;
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(peak, time + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(g);
    g.connect(o.dest ?? this.sfx);
    osc.start(time);
    osc.stop(time + dur + 0.05);
    return osc;
  }

  /** Called every frame; schedules the generative music a little ahead. */
  tick() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    if (this.nextChord < now + 0.3) {
      const chord = CHORDS[this.chordIdx % CHORDS.length];
      for (const m of chord.pad) {
        this.tone(midi(m), this.nextChord, 9.5, { gain: 0.035, attack: 2.5, dest: this.musicIn });
      }
      this.nextChord += 8;
      this.chordIdx++;
    }
    if (this.nextNote < now + 0.3) {
      const chord = CHORDS[(this.chordIdx + CHORDS.length - 1) % CHORDS.length];
      const m = chord.tones[Math.floor(Math.random() * chord.tones.length)];
      this.tone(midi(m), this.nextNote, 1.8, { type: 'triangle', gain: 0.05, dest: this.musicIn });
      this.tone(midi(m + 12), this.nextNote, 0.9, { gain: 0.015, dest: this.musicIn });
      const beats = [0.86, 0.86, 1.72, 1.72, 2.58];
      this.nextNote += beats[Math.floor(Math.random() * beats.length)];
    }
  }

  /** Pitch for the n-th pickup of a streak: climbs, turns, descends, then shifts key. */
  private walkNote(n: number) {
    const period = (PENTA.length - 1) * 2;
    const k = n % period;
    const idx = k < PENTA.length ? k : period - k;
    const shift = WALK_SHIFT[Math.floor(n / period) % WALK_SHIFT.length];
    return PENTA[idx] + shift;
  }

  resetStreak() {
    this.combo = -1;
  }

  collect(value: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    this.combo = t - this.lastCollect < 1.6 ? this.combo + 1 : 0;
    this.lastCollect = t;
    const m = this.walkNote(this.combo);
    if (this.combo > 0 && this.combo % 10 === 0) {
      [0, 4, 7, 12].forEach((d, i) => this.tone(midi(m + d + 12), t + 0.12 + i * 0.07, 0.6, { gain: 0.035 }));
    }
    this.tone(midi(m), t, 0.45, { type: 'triangle', gain: 0.09 });
    this.tone(midi(m + 12), t, 0.25, { gain: 0.03 });
    if (value >= 5) {
      this.tone(midi(m + 7), t + 0.09, 0.6, { type: 'triangle', gain: 0.07 });
      this.tone(midi(m + 12), t + 0.18, 0.8, { type: 'sine', gain: 0.06 });
    }
  }

  /** Soft "not yet" sound for a purchase you can't afford. */
  deny() {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    this.tone(midi(55), t, 0.25, { type: 'triangle', gain: 0.09 });
    this.tone(midi(50), t + 0.13, 0.4, { type: 'triangle', gain: 0.09 });
    this.bump();
  }

  /** Rain ambience (0..1). */
  weather(rain: number) {
    if (!this.ctx || !this.rainGain) return;
    this.rainGain.gain.setTargetAtTime(rain * 0.1, this.ctx.currentTime, 0.8);
  }

  bump() {
    const ctx = this.ctx;
    if (!ctx) return;
    this.combo = -1;
    const t = ctx.currentTime;
    const osc = this.tone(260, t, 0.35, { gain: 0.1 });
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.3);
  }

  buy() {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    [72, 76, 79, 84].forEach((m, i) => this.tone(midi(m), t + i * 0.09, 0.7, { type: 'triangle', gain: 0.08 }));
  }

  equip() {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    this.tone(midi(79), t, 0.3, { type: 'triangle', gain: 0.06 });
    this.tone(midi(84), t + 0.07, 0.4, { type: 'triangle', gain: 0.06 });
  }

  click() {
    const ctx = this.ctx;
    if (!ctx) return;
    this.tone(midi(88), ctx.currentTime, 0.08, { gain: 0.03 });
  }
}
