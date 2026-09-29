import { items } from './art/items';
import { worldArt } from './art/world';
import { draw } from './art/sprite';
import { WORLD } from './art/palette';
import { drawOtter, Equipped, IDLE_POSE, Pose } from './otterDraw';

// ?debug=wardrobe — every outfit across several animation poses, to check
// that items stay anchored to the otter in every frame.
export function renderWardrobe(canvas: HTMLCanvasElement) {
  const all = items();
  const bySlot = (s: string) => all.filter((i) => i.slot === s && !i.pet);
  const outfits: Equipped[] = [{}];
  const hats = bySlot('hat');
  const eyes = bySlot('eyes');
  const ears = bySlot('ears');
  const necks = bySlot('neck');
  const suits = bySlot('suit');
  const held = bySlot('held');
  const n = Math.max(hats.length, eyes.length, ears.length, necks.length, suits.length, held.length);
  for (let i = 0; i < n; i++) {
    outfits.push({
      hat: hats[i % hats.length].id,
      eyes: eyes[i % eyes.length].id,
      ears: i % 2 ? ears[i % ears.length].id : undefined,
      neck: necks[i % necks.length].id,
      suit: suits[i % suits.length].id,
      held: held[i % held.length].id,
      pet: i === 1 ? 'crab' : undefined,
    });
  }
  const poses: Pose[] = [
    IDLE_POSE,
    { ...IDLE_POSE, hb: 1, pawL: -1, pawR: -1 },
    { ...IDLE_POSE, lean: 1, pawL: -1, tail: 1 },
    { ...IDLE_POSE, lean: -1, pawR: -1, tail: -1, eyes: 'closed' },
    { ...IDLE_POSE, bob: 1, eyes: 'happy' },
  ];
  const cw = 48;
  const ch = 64;
  canvas.width = cw * poses.length + 70;
  canvas.height = ch * outfits.length;
  canvas.style.width = `${canvas.width * 3}px`;
  canvas.style.height = `${canvas.height * 3}px`;
  document.body.style.overflow = 'auto';
  document.getElementById('title')?.classList.add('hidden');
  document.getElementById('app')!.style.position = 'static';
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = WORLD.water;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  outfits.forEach((eq, r) => {
    poses.forEach((p, c) => drawOtter(ctx, c * cw + 24, r * ch + 44, p, eq, c * 0.7));
  });
  // collectibles + pets strip
  const art = worldArt();
  const x0 = cw * poses.length + 8;
  [art.shell, art.goldShell, art.fish, art.pearl, art.frog, art.lilyPad, art.log, art.rock, art.mushroom, art.bush].forEach(
    (s, i) => draw(ctx, s, x0 + 12 + (i % 2) * 28, 14 + Math.floor(i / 2) * 24),
  );
  all.filter((i) => i.pet).forEach((p, i) => p.frames.forEach((f, j) => draw(ctx, f, x0 + 10 + j * 20, 140 + i * 22)));
  draw(ctx, art.tree, x0 + 30, 260);
  draw(ctx, art.reeds, x0 + 8, 260);
}
