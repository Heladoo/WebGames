# Backlog (drop-the-drop)

## Done (owner feedback on the first sample)

- In-scene celebration instead of a card (hopping cups, star stickers, marker writing).
- A table background: oak planks, the black diamond card, plant leaves.
- Two ways to choose a level: the next level (Play / "next"), or the Levels screen with every open level and the next one locked.
- Landscape only, with a "turn the device" picture in portrait.
- A more varied sound when touching a drop, plus a slide sound while dragging.

## Next

- Anonymous play stats (the shared `stats.ts` / `api/stats.js` pattern, prefix `dd:`), plus a note in the UI.

## Next complications (suggested, for the owner to pick)

- **Walls on the paper:** a strip of tape or a wax-crayon line that water will not cross. Drops have to go around it, and narrow gaps let only small drops through, so a big drop must be split to pass.
- **Clear water:** drops of plain water that lighten a colour (red + water = pink, blue + water = light blue). This adds a new kind of colour target without new base colours.
- **Exact amounts with halves:** cups that want 1½ drops, or a "2 red : 1 yellow" mix made from halves, so splitting is used for measuring and not just for sharing.
- **A mystery cup:** the cup shows only its colour as a painted swatch, with no colour hint in its water. The child finds the recipe by mixing.
- **Layer cups:** a tall cup that wants its colours in order (blue, then yellow, then red), poured as stripes.
- **A gentle slope:** part of the paper tilts, and a drop left there slowly slides down until it reaches a flat spot or a bump. It has to be parked or joined quickly, without any danger.

## Oil drops: a design (not built yet)

Oil and water don't mix, and children can see that happen. Oil drops would be a new kind of drop that sits next to the water drops on the paper.

**How oil looks:** a pale golden, very clear body, flatter and wider than water for its volume (low surface tension). It has a softer, broader shine with a thin rainbow sheen along the rim, and almost no caustic. Oil can be dyed too (in real life with oil paint or crayon), so coloured oil drops are possible later.

**How oil moves:**
- It is more viscous: it follows the finger more slowly, stretches into long tails, and settles with a slow, heavy sway instead of a quick wobble.
- Implementation: in `stepDrop`, a lower spring constant for the centre, a longer teardrop target, a lower outline stiffness `K` and coupling `Kn`, and more damping `C`. The physics doesn't change, only the numbers.
- Oil + oil: the drops join like water does, but slowly. The neck spreads over about half a second.
- Oil + water: they never join.
  - A dragged oil drop touching a water drop pushes it gently aside: a soft repulsion between the two outlines.
  - If the child keeps pushing, the oil slides around the water drop, or they stick side by side as a "compound drop" (two outlines touching along a flat seam) that moves together and can be pulled apart again with a tug.
  - The compound drop is the interesting toy: it carries water and oil together into a cup in one move.
- Glitter glue: oil slides over it without picking up glitter (oil and glue don't mix either). This makes a new kind of puzzle: oil can cross the stripe safely.

**Cups with density separation:**
- A new tall "layer cup" takes both water and oil. What is poured in settles by density: water at the bottom in its colour, a golden oil layer floating on top with a wavy line between them, and tiny bubbles rising for a moment after each pour.
- The cup shows what it wants with two dashed rings on the glass (a coloured one low for the water, a golden one high for the oil). Pouring oil first and water second still ends with oil on top, as in real life: the water drop sinks through the oil with a visible "plop" bubble. That is the lesson.
- Variants:
  - a cup that wants only oil (refuses water);
  - a "lava lamp" cup at the end of the oil levels, where coloured oil blobs drift slowly up and down for the celebration.

**Levels (a short arc, after the glitter levels):**
1. Drag an oil drop into an oil cup. It is slow and heavy, and the child just feels it.
2. Oil and water drops side by side: they won't join. Put each in its own cup.
3. A layer cup: one blue water drop and one oil drop, in either order. Watch the water sink below the oil.
4. Join small oil drops into a big one for a layer cup that wants a thick oil layer.
5. Oil crosses the glitter glue safely while water must go around.
6. The compound-drop trick: push oil against water so they stick, and carry both into a layer cup at once.

**Rules to keep:**
- Oil touching water is never a mistake, since nothing mixes; the drops just refuse to join.
- The only new refusals are cups saying "not this kind": a water cup refuses oil and an oil cup refuses water, with the same gentle sway as now.

**Code shape:**
- `Drop.kind: 'water' | 'oil'`.
- The drop's physics constants become a per-kind table.
- `drawDrop` branches on kind for the body and shine.
- `touchCheck` handles oil and water as repulsion and sticking instead of a join.
- Cups get `layers: { water?: CupColor; oilNeed?: number }`.
- `drawCup` draws the layers.
- `fitsACup` and `suggest` learn about kinds.


- A drop pulled very fast could leave a tiny droplet behind (splitting).
- Drops leave a faint damp trail on the paper that fades.
- A toothpick or straw as the drag tool (shown at the finger).
- A gentle tilt of the paper in some levels.
- Background variants per group of levels (a cutting mat, a picnic cloth).
