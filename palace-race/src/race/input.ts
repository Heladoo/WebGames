// The controls, gathered into one small queue the race reads every frame:
//   keyboard   ↑ / W / Space jump, ↓ / S duck, ← / A far lane, → / D near lane, Esc / P pause
//   buttons    the round on-screen buttons react on pointerdown (no click delay)
//   swipes     on the stage: up jumps, down ducks, left and right change lane

import type { Input } from './sim';

export class Controls {
  private q: Input = {};
  private off: (() => void)[] = [];
  onPause: () => void = () => {};
  onAny: () => void = () => {};

  constructor(stage: HTMLElement, buttons: { jump: HTMLElement; duck: HTMLElement; far: HTMLElement; near: HTMLElement }) {
    const key = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w' || k === ' ') this.press('jump');
      else if (k === 'arrowdown' || k === 's') this.press('duck');
      else if (k === 'arrowleft' || k === 'a') this.press('far');
      else if (k === 'arrowright' || k === 'd') this.press('near');
      else if (k === 'escape' || k === 'p') this.onPause();
      else return;
      e.preventDefault();
    };
    addEventListener('keydown', key);
    this.off.push(() => removeEventListener('keydown', key));
    const bind = (el: HTMLElement, what: 'jump' | 'duck' | 'far' | 'near') => {
      const h = (e: PointerEvent) => {
        e.preventDefault();
        this.press(what);
        el.classList.add('pressed');
        window.setTimeout(() => el.classList.remove('pressed'), 160);
      };
      el.addEventListener('pointerdown', h);
      // keyboard users on the buttons themselves
      el.addEventListener('click', (e) => {
        if ((e as MouseEvent).detail === 0) this.press(what);
      });
      this.off.push(() => el.removeEventListener('pointerdown', h));
    };
    bind(buttons.jump, 'jump');
    bind(buttons.duck, 'duck');
    bind(buttons.far, 'far');
    bind(buttons.near, 'near');
    let start: { x: number; y: number } | null = null;
    const down = (e: PointerEvent) => (start = { x: e.clientX, y: e.clientY });
    const up = (e: PointerEvent) => {
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      start = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
      if (Math.abs(dy) > Math.abs(dx)) this.press(dy < 0 ? 'jump' : 'duck');
      else this.press(dx < 0 ? 'far' : 'near');
    };
    stage.addEventListener('pointerdown', down);
    stage.addEventListener('pointerup', up);
    this.off.push(() => {
      stage.removeEventListener('pointerdown', down);
      stage.removeEventListener('pointerup', up);
    });
  }

  press(what: 'jump' | 'duck' | 'far' | 'near') {
    if (what === 'jump') this.q.jump = true;
    else if (what === 'duck') this.q.duck = true;
    else this.q.lane = what === 'far' ? -1 : 1;
    this.onAny();
  }

  take(): Input {
    const q = this.q;
    this.q = {};
    return q;
  }

  destroy() {
    this.off.forEach((f) => f());
  }
}
