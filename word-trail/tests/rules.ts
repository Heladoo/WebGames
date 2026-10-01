import type { Box, RigCase } from '../src/rig';

// Rules for how a character's parts relate to each other. Each rule returns
// a readable message when it is broken. Characters face right in a 3/4 view.

const cx = (b: Box) => b.x + b.w / 2;
const cy = (b: Box) => b.y + b.h / 2;
const right = (b: Box) => b.x + b.w;
const bottom = (b: Box) => b.y + b.h;
const area = (b: Box) => b.w * b.h;
const dist = (a: Box, b: Box) => Math.hypot(cx(a) - cx(b), cy(a) - cy(b));
const overlaps = (a: Box, b: Box, tol = 0) =>
  a.x <= right(b) + tol && b.x <= right(a) + tol && a.y <= bottom(b) + tol && b.y <= bottom(a) + tol;
const f = (n: number) => n.toFixed(1);

export const GROUND_Y = 192;

export function checkCase(c: RigCase): string[] {
  const errors: string[] = [];
  const fail = (msg: string) => errors.push(`${c.id}: ${msg}`);
  const p = c.parts;
  const { head, body, muzzle, nose, eyeNear, eyeFar, cheek } = p;
  if (!head || !body || !eyeNear || !eyeFar) {
    fail('is missing one of head, body, eyeNear or eyeFar');
    return errors;
  }

  // ---- facing (3/4 view to the right) ----
  if (muzzle && cx(muzzle) <= cx(head)) fail(`snout (x ${f(cx(muzzle))}) must be right of the head centre (x ${f(cx(head))})`);
  if (nose) {
    const group = [head, muzzle, p.earNear, p.earFar, eyeNear, eyeFar].filter(Boolean) as Box[];
    const edge = Math.max(...group.map(right));
    if (right(nose) < edge - 0.5) fail(`nose must be the rightmost point of the head (nose ${f(right(nose))} < ${f(edge)})`);
  }

  // ---- eyes ----
  if (cx(eyeFar) <= cx(eyeNear)) fail('far eye must be right of the near eye (towards the snout)');
  const ratio = area(eyeFar) / area(eyeNear);
  if (ratio < 0.6 || ratio > 0.95) fail(`far eye must be smaller than the near eye (area ratio ${ratio.toFixed(2)}, want 0.60–0.95)`);
  if (muzzle && dist(eyeFar, muzzle) >= dist(eyeNear, muzzle)) fail('far eye must be closer to the snout than the near eye');
  for (const [name, e] of [['near eye', eyeNear], ['far eye', eyeFar]] as const) {
    if (e.x < head.x - 1 || right(e) > right(head) + 1 || e.y < head.y - 1 || bottom(e) > bottom(head) + 1) fail(`${name} must be inside the head`);
    if (muzzle && cy(e) >= muzzle.y) fail(`${name} must be above the snout`);
    if (!c.eyesOnTop && cy(e) < head.y + head.h / 3) fail(`${name} is too high (in the top third of the head)`);
  }
  if (Math.abs(cy(eyeNear) - cy(eyeFar)) > head.h * 0.08) fail('eyes must sit on one eye line');
  if (cheek) {
    if (cy(cheek) <= Math.max(cy(eyeNear), cy(eyeFar))) fail('cheek must be below the eyes');
    if (cx(cheek) <= cx(eyeNear)) fail('cheek must be in front of (right of) the near eye');
  }

  // ---- body structure ----
  if (!overlaps(head, body)) fail('head must connect to the body (neck)');
  if (p.tail) {
    if (cx(p.tail) >= cx(body)) fail('tail must be at the back (left of the body centre)');
    if (!overlaps(p.tail, body, 2)) fail('tail must attach to the body');
  }
  for (const ear of ['earNear', 'earFar'] as const)
    if (p[ear] && !overlaps(p[ear], head, 2)) fail(`${ear} must touch the head`);
  if (p.earNear && cx(p.earNear) > cx(head)) fail('near ear must be on the back half of the head');

  const legs = Object.entries(p).filter(([k]) => k.startsWith('leg'));
  if (!c.ride) {
    if (!legs.length) fail('has no legs');
    for (const [k, b] of legs) {
      if (Math.abs(bottom(b) - GROUND_Y) > 3) fail(`${k} must stand on the ground (bottom ${f(bottom(b))}, want ${GROUND_Y}±3)`);
      if (k.startsWith('legFront') && cx(b) <= cx(body)) fail(`${k} must be under the front half of the body`);
      if (k.startsWith('legBack') && cx(b) >= cx(body)) fail(`${k} must be under the back half of the body`);
      if (!overlaps(b, body, 2)) fail(`${k} must attach to the body`);
    }
    for (const [k, b] of legs.filter(([k]) => k.endsWith('Near'))) {
      const far = p[k.replace('Near', 'Far')];
      if (far && b.order < far.order) fail(`${k} must be drawn in front of the far leg`);
    }
  } else if (legs.length) fail('a seated rider must not show legs');

  // ---- items ----
  const one = (name: string) => c.items[name]?.[0];
  const w = c.wear;
  if (w === 'hat' || w === 'cap' || w === 'crown') {
    const it = one(w);
    if (!it) fail(`${w} not drawn`);
    else {
      if (Math.abs(cx(it) - cx(head)) > head.w * 0.25) fail(`${w} must be centred over the head`);
      if (bottom(it) < head.y || bottom(it) > head.y + head.h * 0.35) fail(`${w} must rest on top of the head (bottom ${f(bottom(it))}, head top ${f(head.y)})`);
    }
  }
  if (w === 'bow') {
    const it = one('bow');
    if (!it || !overlaps(it, head, 2) || cy(it) > cy(head)) fail('bow must sit on the upper half of the head');
  }
  if (w === 'glasses') {
    const n = one('glasses-near'), fr = one('glasses-far');
    if (!n || dist(n, eyeNear) > 6) fail('near lens must be centred on the near eye');
    if (!fr || dist(fr, eyeFar) > 6) fail('far lens must be centred on the far eye');
  }
  if (w === 'scarf') {
    const it = one('scarf');
    if (!it || !overlaps(it, head) || !overlaps(it, body)) fail('scarf must wrap the neck (touch both head and body)');
  }
  if (w === 'boots') {
    const boots = c.items.boots ?? [];
    for (const [k, b] of legs) {
      const ok = boots.some((bt) => bottom(bt) >= bottom(b) - 1 && bt.x <= cx(b) && cx(b) <= right(bt));
      if (!ok) fail(`${k} needs a boot on its foot`);
    }
  }
  if (w === 'bag' || w === 'cape') {
    const it = one(w);
    if (!it || cx(it) >= cx(body) || !overlaps(it, body)) fail(`${w} must sit on the back`);
  }
  if (c.carry) {
    const it = one('carry');
    const [ax, ay] = c.anchors.back;
    if (!it || ax < it.x - 4 || ax > right(it) + 4 || ay < it.y - 4 || ay > bottom(it) + 4) fail(`${c.carry} must rest on the back`);
  }
  if (c.ride) {
    const v = one('vehicle');
    if (!v || !overlaps(v, body)) fail(`must sit in the ${c.ride}`);
    const wheels = c.items.vehicle ? Object.entries(c.parts).filter(([k]) => k === 'wheel').map(([, b]) => b) : [];
    const low = wheels.length ? Math.max(...wheels.map(bottom)) : v ? bottom(v) : 0;
    if (low < GROUND_Y - 6 || low > GROUND_Y + 14) fail(`${c.ride} must stand on the ground (bottom ${f(low)})`);
  }
  return errors;
}
