import { otterArt, PART } from './art/otter';
import { AnchorName, itemById, ItemDef, Slot } from './art/items';
import { draw } from './art/sprite';

export type Equipped = Partial<Record<Slot, string>>;

export interface Pose {
  bob: number; // whole-otter float offset (px)
  hb: number; // head breathing offset (0/1)
  lean: number; // head lean when steering (-1..1)
  pawL: number;
  pawR: number;
  tail: number; // tail tip sway (-1..1)
  eyes: 'open' | 'closed' | 'happy';
}

export const IDLE_POSE: Pose = { bob: 0, hb: 0, lean: 0, pawL: 0, pawR: 0, tail: 0, eyes: 'open' };

export function anchors(ox: number, oy: number, p: Pose): Record<AnchorName, [number, number]> {
  const y = oy + p.bob;
  const hx = ox + p.lean;
  const hy = y + p.hb;
  return {
    headTop: [hx, hy - 23],
    eyes: [hx, hy - 18],
    ears: [hx, hy - 24],
    neck: [hx, hy - 10],
    body: [ox - 11, y - 13],
    pawR: [ox + 6, y - 8 + p.pawR],
    belly: [ox, y - 1],
  };
}

export function itemFrame(def: ItemDef, t: number) {
  return def.frames[Math.floor(t / def.frameTime) % def.frames.length];
}

/** Draws the otter puppet with its equipped items, layered by z. */
export function drawOtter(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  p: Pose,
  equipped: Equipped,
  t: number,
) {
  const art = otterArt();
  const y = oy + p.bob;
  const hx = ox + p.lean;
  const hy = y + p.hb;
  const layers: { z: number; fn: () => void }[] = [
    {
      z: 0,
      fn: () => {
        draw(ctx, art.tailTop, ox + PART.tailTop.x, y + PART.tailTop.y);
        draw(ctx, art.tailTip, ox + PART.tailTip.x + p.tail, y + PART.tailTip.y);
      },
    },
    { z: 10, fn: () => draw(ctx, art.body, ox + PART.body.x, y + PART.body.y) },
    {
      z: 30,
      fn: () => {
        draw(ctx, art.head, hx + PART.head.x, hy + PART.head.y);
        if (p.eyes !== 'open') {
          draw(ctx, p.eyes === 'closed' ? art.eyesClosed : art.eyesHappy, hx + PART.eyes.x, hy + PART.eyes.y);
        }
      },
    },
    {
      z: 40,
      fn: () => {
        draw(ctx, art.paw, ox + PART.pawL.x, y + PART.pawL.y + p.pawL);
        draw(ctx, art.paw, ox + PART.pawR.x, y + PART.pawR.y + p.pawR);
      },
    },
  ];

  const a = anchors(ox, oy, p);
  for (const id of Object.values(equipped)) {
    const def = itemById(id);
    if (!def || (def.pet && def.pet !== 'ride')) continue;
    const [x, yy] = a[def.anchor];
    layers.push({ z: def.z, fn: () => draw(ctx, itemFrame(def, t), x, yy) });
  }

  layers.sort((l1, l2) => l1.z - l2.z);
  for (const l of layers) l.fn();
}
