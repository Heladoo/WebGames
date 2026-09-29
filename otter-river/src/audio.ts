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
const PENTA = [72, 74, 76, 79, 81, 84, 86, 88, 91];

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
    this.master.connect(ctx.destination);
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

  collect(value: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    this.combo = t - this.lastCollect < 1.4 ? this.combo + 1 : 0;
    this.lastCollect = t;
    const m = PENTA[Math.min(this.combo, PENTA.length - 1)];
    this.tone(midi(m), t, 0.45, { type: 'triangle', gain: 0.09 });
    this.tone(midi(m + 12), t, 0.25, { gain: 0.03 });
    if (value >= 5) {
      this.tone(midi(m + 7), t + 0.09, 0.6, { type: 'triangle', gain: 0.07 });
      this.tone(midi(m + 12), t + 0.18, 0.8, { type: 'sine', gain: 0.06 });
    }
  }

  bump() {
    const ctx = this.ctx;
    if (!ctx) return;
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
