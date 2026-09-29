import { items } from './art/items';
import { worldArt } from './art/world';
import { draw } from './art/sprite';
import { WORLD } from './art/palette';
import { drawOtter, Equipped, IDLE_POSE, Pose } from './otterDraw';

// ?debug=wardrobe — every outfit across several animation poses, to check
// that items stay anchored to the otter in every frame.
export function renderWardrobe(canvas: HTMLCanvasElement) {
  const all = items();
  const bySlot = (s: string) => all.filter((i) => i.slot === s);
  const slots = ['hat', 'eyes', 'ears', 'neck', 'suit', 'held', 'float'] as const;
  const n = Math.max(...slots.map((s) => bySlot(s).length));
  const pets = all.filter((i) => i.pet);
  const outfits: { equipped: Equipped; pets: string[] }[] = [{ equipped: {}, pets: [] }];
  for (let i = 0; i < n; i++) {
    const eq: Equipped = {};
    for (const s of slots) {
      const list = bySlot(s);
      if (s === 'ears' && i % 2 === 0) continue;
      if (s === 'float' && i % 3 === 2) continue;
      eq[s] = list[i % list.length].id;
    }
    const riders = pets.filter((p) => p.pet === 'ride');
    outfits.push({ equipped: eq, pets: [riders[i % riders.length].id] });
  }
  const poses: Pose[] = [
    IDLE_POSE,
    { ...IDLE_POSE, hb: 1, pawL: -1, pawR: -1, footL: 1, footR: -1 },
    { ...IDLE_POSE, lean: 1, pawL: -1, tail: 1, footL: -1, footR: 1 },
    { ...IDLE_POSE, lean: -1, pawR: -1, tail: -1, eyes: 'closed' },
    { ...IDLE_POSE, bob: 1, eyes: 'happy' },
  ];
  const cw = 72;
  const ch = 100;
  const cols = poses.length;
  canvas.width = cw * cols + 120;
  canvas.height = ch * outfits.length;
  canvas.style.width = `${canvas.width * 2}px`;
  canvas.style.height = `${canvas.height * 2}px`;
  document.body.style.overflow = 'auto';
  document.getElementById('app')!.style.position = 'static';
  document.getElementById('stage')!.style.overflow = 'visible';
  canvas.style.position = 'static';
  for (const id of ['title', 'hud', 'dock']) document.getElementById(id)?.classList.add('hidden');
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = WORLD.water;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  outfits.forEach((o, r) => {
    poses.forEach((p, c) => drawOtter(ctx, c * cw + 36, r * ch + 60, p, o, c * 0.7));
  });
  const art = worldArt();
  const x0 = cw * cols + 10;
  const strip = [art.shell, art.goldShell, art.fish, art.pearl, art.frog, art.lilyPad, art.log, ...art.rocks, art.mushroom, art.bush, art.reeds, art.starfish, art.pebbles, art.sandcastle, art.fence, ...art.flowers];
  let yy = 12;
  strip.forEach((s, i) => {
    draw(ctx, s, x0 + 20 + (i % 3) * 34, yy);
    if (i % 3 === 2) yy += 26;
  });
  yy += 30;
  pets.forEach((p, i) => p.frames.forEach((f, j) => draw(ctx, f, x0 + 16 + j * 30, yy + i * 30)));
  yy += pets.length * 30 + 30;
  draw(ctx, art.trees.round, x0 + 24, yy + 30);
  draw(ctx, art.trees.pine, x0 + 60, yy + 30);
  draw(ctx, art.trees.cherry, x0 + 96, yy + 30);
  yy += 60;
  Object.values(art.animals).forEach((frames, i) => frames.forEach((f, j) => draw(ctx, f, x0 + 20 + j * 40, yy + i * 30)));
  yy += Object.keys(art.animals).length * 30 + 10;
  const digits = '0123456789+';
  [...digits].forEach((d, i) => draw(ctx, art.digits[d], x0 + 4 + i * 9, yy));
}
