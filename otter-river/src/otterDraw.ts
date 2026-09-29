import { otterArt, PART } from './art/otter';
import { AnchorName, itemById, ItemDef, Slot } from './art/items';
import { draw } from './art/sprite';
import { PALETTE } from './art/palette';

export type Equipped = Partial<Record<Exclude<Slot, 'pet'>, string>>;

export interface Outfit {
  equipped: Equipped;
  pets: string[];
}

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
    headTop: [hx, hy - 36],
    eyes: [hx, hy - 28],
    ears: [hx, hy - 30],
    neck: [hx, hy - 16],
    perch: [hx + 10, hy - 35],
    body: [ox + PART.body.x, y + PART.body.y],
    pawR: [ox + 8, y - 8 + p.pawR],
    belly: [ox, y + 3],
    lap: [ox, y + 14],
    float: [ox, y + 3],
  };
}

export function itemFrame(def: ItemDef, t: number) {
  return def.frames[Math.floor(t / def.frameTime) % def.frames.length];
}

/** Where a held balloon floats this frame (relative to the paw). */
export function balloonPos(paw: [number, number], t: number): [number, number] {
  return [paw[0] + 7 + Math.round(Math.sin(t * 0.8) * 2), paw[1] - 34 + Math.round(Math.sin(t * 1.1 + 1) * 1.5)];
}

/** Draws the otter puppet with its equipped items and riding friends, layered by z. */
export function drawOtter(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  p: Pose,
  outfit: Outfit,
  t: number,
  ghost?: ItemDef, // try-on preview drawn semi-transparent
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
  const add = (def: ItemDef, alpha = 1) => {
    const [x, yy] = a[def.anchor];
    layers.push({
      z: def.z,
      fn: () => {
        ctx.globalAlpha = alpha;
        if (def.special === 'balloon') {
          const [bx, by] = balloonPos(a.pawR, t);
          ctx.fillStyle = PALETTE.M;
          const steps = Math.abs(by - yy);
          for (let i = 0; i <= steps; i++) {
            const k = i / steps;
            const sx = Math.round(x + (bx - x) * k + Math.sin(k * Math.PI * 2 + t * 2) * 1.2);
            ctx.fillRect(sx, Math.round(yy + (by - yy) * k), 1, 1);
          }
          draw(ctx, itemFrame(def, t), bx, by);
        } else {
          draw(ctx, itemFrame(def, t), x, yy);
        }
        ctx.globalAlpha = 1;
      },
    });
  };

  for (const [slot, id] of Object.entries(outfit.equipped)) {
    if (ghost && ghost.slot === slot) continue;
    const def = itemById(id);
    if (def) add(def);
  }
  for (const id of outfit.pets) {
    const def = itemById(id);
    if (def?.pet === 'ride') add(def);
  }
  if (ghost && (ghost.slot !== 'pet' || ghost.pet === 'ride')) add(ghost, 0.6);

  layers.sort((l1, l2) => l1.z - l2.z);
  for (const l of layers) l.fn();
}
