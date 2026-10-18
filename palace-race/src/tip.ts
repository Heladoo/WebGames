// Tooltips for every button, for grown-ups and children who are starting to read: a small bubble with the button's
// label (its aria-label). It shows after a moment of hovering with a mouse, when a button gets keyboard focus, or
// during a long touch outside the race (a short tap never shows it). One bubble for the whole page.

const DELAY = 450;
const TOUCH_DELAY = 550;

export function tooltips() {
  const tip = document.createElement('div');
  tip.className = 'tip';
  tip.setAttribute('aria-hidden', 'true');
  document.body.appendChild(tip);
  let timer = 0;
  let on: HTMLElement | null = null;

  const target = (e: Event) => (e.target as Element | null)?.closest?.<HTMLElement>('button[aria-label], [role="tab"][aria-label]') ?? null;
  const hide = () => {
    clearTimeout(timer);
    on = null;
    tip.classList.remove('show');
  };
  const show = (el: HTMLElement) => {
    if (!el.isConnected) return;
    const text = el.getAttribute('aria-label') ?? '';
    if (!text) return;
    tip.textContent = text;
    const r = el.getBoundingClientRect();
    tip.classList.add('show');
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    // above the button, or below it near the top of the screen; always inside the screen
    const below = r.top - h - 10 < 4;
    tip.classList.toggle('below', below);
    tip.style.left = `${Math.max(6, Math.min(innerWidth - w - 6, r.left + r.width / 2 - w / 2))}px`;
    tip.style.top = `${below ? r.bottom + 10 : r.top - h - 10}px`;
    tip.style.setProperty('--arrow', `${Math.max(12, Math.min(w - 12, r.left + r.width / 2 - parseFloat(tip.style.left)))}px`);
  };
  const soon = (el: HTMLElement, ms: number) => {
    if (on === el) return;
    hide();
    on = el;
    timer = window.setTimeout(() => show(el), ms);
  };

  addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const el = target(e);
    if (el) soon(el, DELAY);
    else hide();
  });
  addEventListener('pointerdown', (e) => {
    hide();
    const el = target(e);
    if (e.pointerType === 'touch' && el && !el.closest('.race')) soon(el, TOUCH_DELAY);
  });
  addEventListener('pointerup', (e) => {
    if (e.pointerType !== 'mouse') hide();
  });
  addEventListener('pointercancel', hide);
  addEventListener('focusin', (e) => {
    const el = target(e);
    if (el && el.matches(':focus-visible')) soon(el, 150);
  });
  addEventListener('focusout', hide);
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hide();
  });
  addEventListener('scroll', hide, true);
  addEventListener('resize', hide);
  // a screen change removes the button under the bubble
  new MutationObserver(() => {
    if (on && !on.isConnected) hide();
  }).observe(document.body, { childList: true, subtree: true });
}
