// Gentle generative background music with nature sounds that match the place
// and the sky. Everything is synthesized (no audio files). The music ducks
// under the voice so words stay clear.

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

interface Mood {
  root: number; // midi note of the key
  scale: number[]; // pentatonic steps
  tempo: number; // seconds between notes (on average)
  timbre: 'bell' | 'flute' | 'pluck' | 'marimba';
  nature: ('birds' | 'waves' | 'wind' | 'frogs' | 'brook')[];
}

const MAJ = [0, 2, 4, 7, 9];
const MIN = [0, 3, 5, 7, 10];

const MOODS: Record<string, Mood> = {
  park: { root: 72, scale: MAJ, tempo: 0.9, timbre: 'bell', nature: ['birds'] },
  farm: { root: 67, scale: MAJ, tempo: 0.8, timbre: 'pluck', nature: ['birds'] },
  woods: { root: 69, scale: MIN, tempo: 1.1, timbre: 'flute', nature: ['birds', 'brook'] },
  snow: { root: 76, scale: MAJ, tempo: 1.4, timbre: 'bell', nature: ['wind'] },
  sand: { root: 62, scale: [0, 2, 5, 7, 9], tempo: 1.1, timbre: 'pluck', nature: ['wind'] },
  sea: { root: 65, scale: MAJ, tempo: 1.3, timbre: 'marimba', nature: ['waves'] },
  hill: { root: 65, scale: MAJ, tempo: 1, timbre: 'flute', nature: ['wind', 'birds'] },
  pond: { root: 64, scale: MAJ, tempo: 1.1, timbre: 'marimba', nature: ['frogs', 'brook'] },
};

class Music {
  enabled = true;
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private notes!: GainNode;
  private nature!: GainNode;
  private echo!: DelayNode;
  private noise!: AudioBuffer;
  private mood: Mood = MOODS.park;
  private night = false;
  private rain = false;
  private loops: { stop: () => void }[] = [];
  private step = 2;

  start(ctx: AudioContext, out: AudioNode) {
    if (this.ctx) return;
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(out);
    this.notes = ctx.createGain();
    this.notes.gain.value = 0.55;
    this.nature = ctx.createGain();
    this.nature.gain.value = 0.8;
    // a soft echo gives the notes some room
    this.echo = ctx.createDelay(1);
    this.echo.delayTime.value = 0.42;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 2200;
    this.notes.connect(this.master);
    this.notes.connect(this.echo);
    this.echo.connect(tone).connect(fb).connect(this.echo);
    tone.connect(this.master);
    this.nature.connect(this.master);
    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.setOn(this.enabled);
    this.buildNature();
    this.schedule();
    // duck under the voice
    window.setInterval(() => {
      if (!this.ctx) return;
      const speaking = typeof speechSynthesis !== 'undefined' && speechSynthesis.speaking;
      const target = !this.enabled || document.hidden ? 0 : speaking ? 0.32 : 1;
      this.master.gain.setTargetAtTime(target * 0.5, this.ctx.currentTime, speaking ? 0.08 : 0.6);
    }, 200);
  }

  setOn(on: boolean) {
    this.enabled = on;
    if (this.ctx) this.master.gain.setTargetAtTime(on ? 0.5 : 0, this.ctx.currentTime, 0.4);
  }

  /** Match the music and nature sounds to where we are and what the sky is doing. */
  setScene(place: string, sky: string) {
    const mood = MOODS[place] ?? MOODS.park;
    const night = sky === 'moon';
    const rain = sky === 'rain';
    if (mood === this.mood && night === this.night && rain === this.rain) return;
    this.mood = mood;
    this.night = night;
    this.rain = rain;
    if (this.ctx) this.buildNature();
  }

  // ---------- melody ----------

  private schedule() {
    const c = this.ctx;
    if (!c) return;
    const m = this.mood;
    const slow = this.night ? 1.5 : 1;
    // a gentle random walk over two octaves of the scale, with rests
    if (Math.random() > 0.22) {
      this.step = Math.max(0, Math.min(9, this.step + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)]));
      const note = m.root - 12 + Math.floor(this.step / 5) * 12 + m.scale[this.step % 5] - (this.night ? 5 : 0);
      this.play(midi(note), m.timbre);
      if (Math.random() < 0.18) this.play(midi(note - 12), m.timbre, 0.5);
    }
    const next = m.tempo * slow * (0.6 + Math.random() * 0.9);
    window.setTimeout(() => this.schedule(), next * 1000);
  }

  private play(freq: number, timbre: Mood['timbre'], vol = 1) {
    const c = this.ctx!;
    const t = c.currentTime + 0.02;
    const g = c.createGain();
    const o = c.createOscillator();
    let dur = 1.6;
    let peak = 0.16 * vol;
    if (timbre === 'bell') {
      o.type = 'sine';
      const o2 = c.createOscillator();
      o2.frequency.value = freq * 2.01;
      const g2 = c.createGain();
      g2.gain.value = 0.25;
      o2.connect(g2).connect(g);
      o2.start(t);
      o2.stop(t + 2.2);
      dur = 2.2;
    } else if (timbre === 'flute') {
      o.type = 'sine';
      const lfo = c.createOscillator();
      const depth = c.createGain();
      lfo.frequency.value = 5;
      depth.gain.value = freq * 0.006;
      lfo.connect(depth).connect(o.frequency);
      lfo.start(t);
      lfo.stop(t + 1.8);
      dur = 1.4;
      peak *= 0.8;
    } else if (timbre === 'pluck') {
      o.type = 'triangle';
      dur = 0.9;
    } else {
      o.type = 'sine';
      dur = 0.7;
      peak *= 1.2;
    }
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + (timbre === 'flute' ? 0.12 : 0.01));
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g).connect(this.notes);
    o.start(t);
    o.stop(t + dur + 0.1);
  }

  // ---------- nature ----------

  private buildNature() {
    const c = this.ctx!;
    this.loops.forEach((l) => l.stop());
    this.loops = [];
    const kinds = new Set<string>(this.mood.nature);
    if (this.night) {
      kinds.delete('birds');
      kinds.add('crickets');
    }
    if (this.rain) {
      kinds.delete('birds');
      kinds.add('rain');
    }
    for (const k of kinds) {
      if (k === 'waves') this.loops.push(this.noiseBed(500, 0.5, 0.1, 0.09));
      if (k === 'wind') this.loops.push(this.noiseBed(700, 1.2, 0.07, 0.05));
      if (k === 'brook') this.loops.push(this.noiseBed(2400, 4, 0.9, 0.025, 'bandpass'));
      if (k === 'rain') this.loops.push(this.noiseBed(3500, 0, 0, 0.05, 'highpass'));
      if (k === 'birds') this.loops.push(this.every(2.5, 6, () => this.chirp()));
      if (k === 'frogs') this.loops.push(this.every(3, 7, () => this.ribbit()));
      if (k === 'crickets') this.loops.push(this.every(0.9, 1.6, () => this.cricket()));
    }
    void c;
  }

  /** Filtered noise whose loudness swells slowly (waves, wind, water, rain). */
  private noiseBed(freq: number, q: number, swell: number, vol: number, type: BiquadFilterType = 'lowpass') {
    const c = this.ctx!;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = c.createGain();
    g.gain.value = 0;
    g.gain.setTargetAtTime(vol, c.currentTime, 1.5);
    let lfo: OscillatorNode | null = null;
    if (swell > 0) {
      lfo = c.createOscillator();
      lfo.frequency.value = swell;
      const depth = c.createGain();
      depth.gain.value = vol * 0.8;
      lfo.connect(depth).connect(g.gain);
      lfo.start();
    }
    src.connect(f).connect(g).connect(this.nature);
    src.start();
    return {
      stop: () => {
        g.gain.setTargetAtTime(0, c.currentTime, 0.6);
        setTimeout(() => { src.stop(); lfo?.stop(); }, 3000);
      },
    };
  }

  private every(min: number, max: number, fn: () => void) {
    let id = 0;
    const go = () => {
      id = window.setTimeout(() => { fn(); go(); }, (min + Math.random() * (max - min)) * 1000);
    };
    go();
    return { stop: () => clearTimeout(id) };
  }

  private blip(f0: number, f1: number, dur: number, vol: number, type: OscillatorType = 'sine', at = 0) {
    const c = this.ctx!;
    const t = c.currentTime + at;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    o.connect(g).connect(this.nature);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private chirp() {
    const base = 2600 + Math.random() * 1600;
    const n = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) this.blip(base, base * (Math.random() < 0.5 ? 1.35 : 0.75), 0.09, 0.025, 'sine', i * 0.13);
  }

  private ribbit() {
    for (let i = 0; i < 2; i++) this.blip(180, 120, 0.12, 0.03, 'square', i * 0.16);
  }

  private cricket() {
    for (let i = 0; i < 3; i++) this.blip(4400, 4300, 0.03, 0.01, 'sine', i * 0.06);
  }
}

export const music = new Music();
