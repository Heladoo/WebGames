// Gentle synthesized sound effects, and the one shared audio context: everything (music, effects) goes through a
// master gain and a limiter, so no sound can ever spike. Nothing here sounds like an error: a stumble is a soft
// "boing", a locked track a soft two-note "hmm". Envelopes are scheduled ramps; no oscillator ever drives a gain.

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// candies walk up and down a pentatonic scale and change key each lap, so collecting them makes a little tune
const PENTA = [72, 74, 76, 79, 81, 84, 86, 88, 91];
const SHIFT = [0, 2, -3, 5];

class Sfx {
  enabled = true;
  volume = 0.8;
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private out!: GainNode;
  private noise!: AudioBuffer;
  private pink!: AudioBuffer;
  private walk = 0;
  private dir = 1;
  private lap = 0;
  private last = 0;

  get context() {
    return this.ctx;
  }

  /** Where music connects (the master, before the limiter). */
  get bus(): AudioNode | null {
    return this.ctx ? this.master : null;
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
      const len = Math.floor(this.ctx.sampleRate * 1);
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      // pink noise (softer, like air) for the whooshes; white stays for crisp hooves and claps
      this.pink = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const pk = this.pink.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < len; i++) {
        const w = d[i];
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.016898;
        pk[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.2;
        b6 = w * 0.115926;
      }
    } catch {
      this.ctx = null;
    }
  }

  suspend() {
    if (this.ctx && this.ctx.state === 'running') void this.ctx.suspend();
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.ctx) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  private tone(freq: number, at: number, dur: number, type: OscillatorType = 'sine', gain = 0.5, slideTo?: number) {
    const c = this.ctx;
    if (!c || !this.enabled) return;
    const t = c.currentTime + at;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.out);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  /** A short burst of filtered noise (hooves, whooshes, claps). */
  private hiss(at: number, dur: number, freq: number, gain: number, q = 1, sweepTo?: number, pink = false) {
    const c = this.ctx;
    if (!c || !this.enabled) return;
    const t = c.currentTime + at;
    const src = c.createBufferSource();
    src.buffer = pink ? this.pink : this.noise;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(freq, t);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(this.out);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  tap() {
    this.tone(midi(79), 0, 0.1, 'triangle', 0.25);
  }

  /** Choosing an animal or a child: a bright little up-chime. */
  select() {
    this.tone(midi(76), 0, 0.25, 'sine', 0.3);
    this.tone(midi(83), 0.08, 0.35, 'sine', 0.28);
  }

  /** A soft "not yet" (a locked track or not enough coins): two low gentle notes, never a buzz. */
  notYet() {
    this.tone(midi(67), 0, 0.22, 'sine', 0.2);
    this.tone(midi(64), 0.14, 0.3, 'sine', 0.18);
  }

  hoof(near = 1) {
    this.hiss(0, 0.06, 900, 0.07 * near, 2.5);
    this.tone(midi(43), 0, 0.06, 'sine', 0.06 * near);
  }

  candy() {
    const c = this.ctx;
    if (!c) return;
    const now = c.currentTime;
    if (now - this.last > 2.5) {
      this.walk = 0;
      this.dir = 1;
    }
    this.last = now;
    const note = PENTA[this.walk] + SHIFT[this.lap % SHIFT.length];
    this.tone(midi(note), 0, 0.45, 'sine', 0.3);
    this.tone(midi(note + 12), 0.01, 0.25, 'sine', 0.08);
    this.walk += this.dir;
    if (this.walk >= PENTA.length - 1) this.dir = -1;
    if (this.walk <= 0 && this.dir === -1) {
      this.dir = 1;
      this.lap++;
    }
  }

  /** A full rainbow bar: a sparkling run up. */
  dash() {
    [72, 76, 79, 84, 88, 91, 96].forEach((m, i) => this.tone(midi(m), i * 0.05, 0.4, 'triangle', 0.18));
  }

  jump() {
    this.hiss(0, 0.32, 500, 0.22, 1.2, 1800, true);
    this.tone(midi(67), 0, 0.25, 'sine', 0.12, midi(79));
  }

  duck() {
    this.hiss(0, 0.25, 1400, 0.17, 1.2, 500, true);
  }

  lane() {
    this.hiss(0, 0.12, 1100, 0.1, 1.5, undefined, true);
  }

  /** A stumble: a soft, round "boing", a little funny, never alarming. */
  bump() {
    this.tone(midi(60), 0, 0.35, 'sine', 0.3, midi(52));
    this.tone(midi(72), 0.12, 0.25, 'sine', 0.12, midi(67));
  }

  count(n: number) {
    this.tone(midi(n > 0 ? 72 : 84), 0, n > 0 ? 0.25 : 0.6, 'triangle', 0.25);
  }

  /** The race starts: a small horn call. */
  go() {
    [72, 76, 79, 84].forEach((m, i) => this.tone(midi(m), i * 0.09, 0.5, 'sawtooth', 0.06));
    [72, 76, 79, 84].forEach((m, i) => this.tone(midi(m), i * 0.09, 0.5, 'triangle', 0.18));
  }

  /** The finish: a happy fanfare. */
  fanfare() {
    const seq = [72, 72, 72, 77, 81, 79, 84];
    const at = [0, 0.14, 0.28, 0.45, 0.7, 0.9, 1.1];
    seq.forEach((m, i) => {
      this.tone(midi(m), at[i], 0.45, 'triangle', 0.22);
      this.tone(midi(m - 12), at[i], 0.45, 'sine', 0.1);
    });
  }

  /** A crowd of small hands clapping. */
  clap(seconds = 2) {
    for (let i = 0; i < seconds * 14; i++) this.hiss(i / 14 + Math.random() * 0.05, 0.05, 1400 + Math.random() * 900, 0.1, 0.8);
  }

  coin(i = 0) {
    this.tone(midi(88 + (i % 3) * 2), 0, 0.18, 'square', 0.05);
    this.tone(midi(95 + (i % 3) * 2), 0.05, 0.25, 'sine', 0.12);
  }

  /** A new track opens, or a new item is bought. */
  open() {
    [79, 83, 86, 91].forEach((m, i) => this.tone(midi(m), i * 0.08, 0.5, 'sine', 0.2));
  }
}

export const sfx = new Sfx();
