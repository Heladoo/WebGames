// A small wrapper around the browser's built-in voice (Web Speech API).

const PREFERRED = ['Samantha', 'Google US English', 'Natural', 'Karen', 'Moira', 'Serena', 'Female', 'Zira', 'Aria', 'Jenny'];

// Some voices read a lone letter as a word ("a" as "uh"), so a few are spelled out.
const LETTER_SAY: Record<string, string> = { a: 'ay', z: 'zee' };

class Speech {
  rate = 0.8;
  voiceName = '';
  private voice: SpeechSynthesisVoice | null = null;
  private synth: SpeechSynthesis | null = typeof speechSynthesis !== 'undefined' ? speechSynthesis : null;
  private listeners: (() => void)[] = [];

  constructor() {
    if (!this.synth) return;
    this.pickVoice();
    this.synth.addEventListener?.('voiceschanged', () => {
      this.pickVoice();
      this.listeners.forEach((f) => f());
    });
  }

  get available() {
    return !!this.synth;
  }

  onVoices(f: () => void) {
    this.listeners.push(f);
  }

  voices(): SpeechSynthesisVoice[] {
    return (this.synth?.getVoices() ?? []).filter((v) => /^en([-_]|$)/i.test(v.lang));
  }

  pickVoice() {
    const list = this.voices();
    const byName = list.find((v) => v.name === this.voiceName);
    if (byName) return (this.voice = byName);
    const us = list.filter((v) => /en[-_]US/i.test(v.lang));
    const pool = us.length ? us : list;
    for (const p of PREFERRED) {
      const v = pool.find((x) => x.name.includes(p));
      if (v) return (this.voice = v);
    }
    this.voice = pool.find((v) => v.localService) ?? pool[0] ?? null;
    return this.voice;
  }

  setVoice(name: string) {
    this.voiceName = name;
    this.pickVoice();
  }

  /** iOS only allows speech after a tap: call this from the first tap. */
  unlock() {
    if (!this.synth) return;
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    this.synth.speak(u);
  }

  stop() {
    this.synth?.cancel();
  }

  /** Speak now, interrupting whatever is being said. */
  say(text: string, opts: { rate?: number; pitch?: number; queue?: boolean } = {}): Promise<void> {
    const synth = this.synth;
    if (!synth || !text) return Promise.resolve();
    if (!opts.queue) synth.cancel();
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      if (this.voice) u.voice = this.voice;
      u.lang = this.voice?.lang ?? 'en-US';
      u.rate = (opts.rate ?? 1) * this.rate;
      u.pitch = opts.pitch ?? 1.1;
      let done = false;
      const finish = () => {
        if (!done) {
          done = true;
          resolve();
        }
      };
      u.onend = finish;
      u.onerror = finish;
      // never hang the game if a voice forgets to report that it finished
      setTimeout(finish, 1200 + text.length * 160 / u.rate);
      synth.speak(u);
    });
  }

  letter(ch: string, queue = false) {
    const l = ch.toLowerCase();
    return this.say(LETTER_SAY[l] ?? l.toUpperCase(), { queue, rate: 0.95 });
  }

  /** "d, o, g... dog!" */
  async spell(word: string) {
    for (const ch of word) await this.letter(ch, true);
    await this.say(word + '!', { queue: true, pitch: 1.2 });
  }
}

export const speech = new Speech();
