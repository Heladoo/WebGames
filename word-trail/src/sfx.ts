// Gentle synthesized sound effects (kept quiet so the voice stays clear).

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

class Sfx {
  enabled = true;
  private ctx: AudioContext | null = null;
  private out!: GainNode;

  /** The shared audio context (after the first tap). */
  get context() {
    return this.ctx;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      this.out = this.ctx.createGain();
      this.out.gain.value = 0.35;
      this.out.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
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

  pop() {
    this.tone(midi(84), 0, 0.12, 'sine', 0.35);
    this.tone(midi(91), 0.04, 0.1, 'sine', 0.2);
  }

  tap() {
    this.tone(midi(79), 0, 0.1, 'triangle', 0.25);
  }

  /** a soft, low "boop" for a letter tapped out of order: never a harsh buzzer */
  soft() {
    this.tone(midi(60), 0, 0.18, 'sine', 0.25);
  }

  chime(step = 0) {
    const scale = [72, 74, 76, 79, 81, 84, 86, 88];
    this.tone(midi(scale[step % scale.length]), 0, 0.5, 'sine', 0.35);
    this.tone(midi(scale[step % scale.length] + 12), 0.02, 0.4, 'sine', 0.08);
  }

  success() {
    [72, 76, 79, 84, 88].forEach((m, i) => this.tone(midi(m), i * 0.09, 0.6, 'triangle', 0.3));
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
