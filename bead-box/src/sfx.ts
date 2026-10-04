// Gentle synthesized sound effects, and the one shared audio context: everything (music, effects) goes
// through a master gain and a limiter, so no sound can ever spike.

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// Placing notes walk up and down a pentatonic scale and change key each lap, so a bracelet makes a little tune.
const PENTA = [67, 69, 72, 74, 76, 79, 81, 84, 86, 88];
const SHIFT = [0, -3, 5, 2];

class Sfx {
  enabled = true;
  volume = 0.8;
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private out!: GainNode;
  private walk = 0;
  private dir = 1;
  private lap = 0;
  private last = 0;

  /** The shared audio context (after the first tap). */
  get context() {
    return this.ctx;
  }

  /** Where music should connect (the master, before the limiter). */
  get bus(): AudioNode {
    return this.master;
  }

  /** Must be called from a tap or key press. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      const limiter = this.ctx.createDynamicsCompressor();
      limiter.threshold.value = -14;
      limiter.knee.value = 12;
      limiter.ratio.value = 6;
      limiter.attack.value = 0.005;
      limiter.release.value = 0.25;
      limiter.connect(this.ctx.destination);
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(limiter);
      this.out = this.ctx.createGain();
      this.out.gain.value = 0.35;
      this.out.connect(this.master);
    } catch {
      this.ctx = null;
    }
  }

  suspend() {
    if (this.ctx && this.ctx.state === 'running') void this.ctx.suspend();
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.ctx) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  private tone(freq: number, at: number, dur: number, type: OscillatorType = 'sine', gain = 0.5) {
    const c = this.ctx;
    if (!c || !this.enabled) return;
    const t = c.currentTime + at;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.out);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  /** A soft click for choosing a tab or a color. */
  tap() {
    this.tone(midi(79), 0, 0.1, 'triangle', 0.25);
  }

  /** The two-note chime that stands in for a voice when the device has none. */
  wordChime() {
    this.tone(midi(76), 0, 0.3, 'sine', 0.3);
    this.tone(midi(81), 0.12, 0.4, 'sine', 0.3);
  }

  /** The bead lands: a small click plus the next note of the walking tune. */
  place() {
    const c = this.ctx;
    if (!c) return;
    const now = c.currentTime;
    if (now - this.last > 1.6) {
      this.walk = 0;
      this.dir = 1;
    }
    this.last = now;
    const root = SHIFT[this.lap % SHIFT.length];
    const note = PENTA[this.walk] + root;
    this.tone(midi(note), 0.02, 0.7, 'sine', 0.34);
    this.tone(midi(note + 12), 0.03, 0.4, 'sine', 0.07);
    this.tone(midi(60), 0, 0.06, 'triangle', 0.18);
    this.walk += this.dir;
    if (this.walk >= PENTA.length - 1) this.dir = -1;
    if (this.walk <= 0 && this.dir === -1) {
      this.dir = 1;
      this.lap++;
    }
  }

  /** A bracelet is finished. */
  success() {
    [72, 76, 79, 84, 88, 91].forEach((m, i) => this.tone(midi(m), i * 0.1, 0.8, 'triangle', 0.28));
  }

  shutter() {
    const c = this.ctx;
    if (!c || !this.enabled) return;
    const len = Math.floor(c.sampleRate * 0.08);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource();
    const g = c.createGain();
    g.gain.value = 0.3;
    s.buffer = buf;
    s.connect(g).connect(this.out);
    s.start();
    this.tone(midi(88), 0.06, 0.2, 'sine', 0.15);
  }
}

export const sfx = new Sfx();
