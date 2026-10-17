// Gentle generative music, a different mood for every track: a music-box melody that wanders up and down a
// pentatonic scale over a soft, slowly changing pad, with a lowpass echo for room. Everything is synthesized; the
// pad's swell is scheduled ramps (an oscillator never drives a gain).

import type { TrackId } from './art/tracks';

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const MAJ = [0, 2, 4, 7, 9];
const MIN = [0, 3, 5, 7, 10];

interface Mood { root: number; scale: number[]; tempo: number; timbre: 'bell' | 'flute' | 'pluck'; chords: number[] }

const MOODS: Record<TrackId | 'menu', Mood> = {
  menu: { root: 67, scale: MAJ, tempo: 0.62, timbre: 'bell', chords: [0, 5, 7, 5] },
  forest: { root: 69, scale: MAJ, tempo: 0.42, timbre: 'flute', chords: [0, 5, 7, 0] },
  meadow: { root: 72, scale: MAJ, tempo: 0.38, timbre: 'pluck', chords: [0, 7, 5, 7] },
  snow: { root: 76, scale: MAJ, tempo: 0.48, timbre: 'bell', chords: [0, 5, 9, 7] },
  canyon: { root: 64, scale: MIN, tempo: 0.42, timbre: 'pluck', chords: [0, 8, 5, 7] },
  garden: { root: 72, scale: MAJ, tempo: 0.36, timbre: 'bell', chords: [0, 5, 7, 9] },
};

class Music {
  enabled = true;
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private notes!: GainNode;
  private mood: Mood = MOODS.menu;
  private step = 4;
  private beat = 0;
  private padOsc: OscillatorNode[] = [];
  private padGain!: GainNode;

  start(ctx: AudioContext, out: AudioNode) {
    if (this.ctx) return;
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(out);
    this.notes = ctx.createGain();
    this.notes.gain.value = 0.5;
    const echo = ctx.createDelay(1);
    echo.delayTime.value = 0.36;
    const fb = ctx.createGain();
    fb.gain.value = 0.28;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 2000;
    this.notes.connect(this.master);
    this.notes.connect(echo);
    echo.connect(tone).connect(fb).connect(echo);
    tone.connect(this.master);
    // the pad: three soft detuned triangles through a lowpass
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 700;
    this.padGain = ctx.createGain();
    this.padGain.gain.value = 0.05;
    lp.connect(this.padGain).connect(this.master);
    for (let i = 0; i < 3; i++) {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.detune.value = (i - 1) * 6;
      o.connect(lp);
      o.start();
      this.padOsc.push(o);
    }
    this.setOn(this.enabled);
    this.chord();
    this.schedule();
  }

  setOn(on: boolean) {
    this.enabled = on;
    if (this.ctx) this.master.gain.setTargetAtTime(on && !document.hidden ? 0.42 : 0, this.ctx.currentTime, 0.4);
  }

  /** Match the music to the track (or 'menu'). */
  setTrack(t: TrackId | 'menu') {
    const m = MOODS[t] ?? MOODS.menu;
    if (m === this.mood) return;
    this.mood = m;
    this.beat = 0;
    this.chord();
  }

  private chord() {
    const c = this.ctx;
    if (!c) return;
    const m = this.mood;
    const root = m.root - 24 + m.chords[Math.floor(this.beat / 8) % m.chords.length];
    const notes = [root, root + (m.scale === MIN ? 3 : 4), root + 7];
    const t = c.currentTime;
    this.padOsc.forEach((o, i) => o.frequency.setTargetAtTime(midi(notes[i] + 12), t, 0.6));
    // a gentle swell at each chord change
    this.padGain.gain.cancelScheduledValues(t);
    this.padGain.gain.setTargetAtTime(0.03, t, 0.3);
    this.padGain.gain.setTargetAtTime(0.06, t + 0.6, 1.2);
  }

  private schedule() {
    const c = this.ctx;
    if (!c) return;
    const m = this.mood;
    this.beat++;
    if (this.beat % 8 === 0) this.chord();
    if (Math.random() > 0.18) {
      this.step = Math.max(0, Math.min(10, this.step + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)]));
      const note = m.root - 12 + Math.floor(this.step / 5) * 12 + m.scale[this.step % 5];
      this.play(midi(note), m.timbre);
    }
    window.setTimeout(() => this.schedule(), m.tempo * (this.beat % 2 ? 0.8 : 1.2) * 1000);
  }

  private play(freq: number, timbre: Mood['timbre']) {
    const c = this.ctx!;
    if (!this.enabled || document.hidden) return;
    const t = c.currentTime + 0.02;
    const g = c.createGain();
    const o = c.createOscillator();
    let dur = 1.2;
    let peak = 0.14;
    if (timbre === 'bell') {
      o.type = 'sine';
      const o2 = c.createOscillator();
      o2.frequency.value = freq * 2.01;
      const g2 = c.createGain();
      g2.gain.setValueAtTime(0, t);
      g2.gain.linearRampToValueAtTime(0.04, t + 0.01);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      o2.connect(g2).connect(this.notes);
      o2.start(t);
      o2.stop(t + 0.9);
      dur = 1.6;
    } else if (timbre === 'flute') {
      o.type = 'triangle';
      dur = 0.9;
      peak = 0.12;
    } else {
      o.type = 'triangle';
      dur = 0.6;
      peak = 0.13;
    }
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + (timbre === 'flute' ? 0.08 : 0.01));
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.notes);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
}

export const music = new Music();
