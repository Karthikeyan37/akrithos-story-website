# Story artwork brief: "The pile-up"

Six images, one per story step on the home page, plus six matching close-up portraits. Together they tell one story: a person buried in paperwork, an Akrithos agent who has their back, and a clear desk at the end.

**The face carries the story.** Visitors should recognise their own week in this person's expression, moving from overwhelmed to happy. In every image the face must be clearly visible and readable: never covered by hands, papers or the agent, never turned away from the camera.

| Step | They feel | They think (shown on the site) |
|---|---|---|
| 1 | Overwhelmed | "I'll never get through all of this." |
| 2 | Stressed | "Did I just miss that call?" |
| 3 | Relieved | "Finally, some help." |
| 4 | Reassured | "And our data stays with us. Good." |
| 5 | In control | "I only need to check these three." |
| 6 | Happy | "I got my afternoon back." | The site crossfades between them as visitors scroll, pushes in slowly, adds depth and glow, and places labels on top, so the images themselves carry **no text**.

## Delivery

- **Files:** `public/story/step-1.png` to `public/story/step-6.png` (PNG or WebP; I will compress them), and the close-ups `public/story/face-1.png` to `face-6.png` (see the end of this brief).
- **Size:** 2560 × 1440 (16:9), landscape.
- **Layout:** keep the left 45% of every frame as calm, empty dark background: the headline sits there on desktop. All action sits in the right 55%.
- **Edges:** the background is near-black charcoal (#0B0B0C) and fades to pure black at the edges, so the image melts into the page.
- **No** text, letters, numbers, logos, UI, captions or watermarks in the image.

## How to keep all six consistent

1. Generate **step 1** first. Re-roll until you love the person, the desk and the light.
2. For steps 2 to 6, give your image tool step 1 as the **reference image** ("character reference", "style reference" or "image prompt") and reuse the **same seed** if your tool shows one.
3. Paste the **shared description** below at the start of every prompt, then add that step's scene.
4. Keep the camera identical. If one frame drifts (different desk, different person), re-roll that frame rather than accepting it.

## Shared description (paste first in every prompt)

> Cinematic semi-realistic 3D render, premium product-launch quality, like a high-end Octane or Blender Cycles render. A dark, quiet studio office set floating in near-black charcoal space (#0B0B0C) that fades to pure black at the edges. Camera: three-quarter isometric view from the front-right and slightly above, 35mm lens, the same framing in every image. The office worker: a professional in their mid-30s with a warm, expressive, realistic human face, short dark hair, wearing a tailored charcoal suit, white shirt and a burnt-orange tie (#C4572F). Desk: warm natural wood top on dark graphite-steel drawer pedestals with brushed chrome handles, and a black leather office chair. A kraft-paper inbox tray sits on the right end of the desk. Lighting: soft warm key light from the upper left, a subtle ember-orange rim light (#E8714A) from behind, soft contact shadows, gentle volumetric haze. Colour palette: charcoal, warm wood, paper white, burnt orange and soft gold (#D4A35F). All action sits in the right 55% of the frame; the left 45% is empty dark background. No text, no letters, no logos, no UI, no watermark. 16:9.

**The Akrithos agent** (appears from step 3): a calm, tall humanoid figure made of soft translucent amber-gold light (#E8714A blending into #D4A35F), with a smooth, gentle, featureless face, glowing faintly from within. On its chest is a simple glowing emblem: an upward-pointing chevron, like a capital letter A without its crossbar. It feels protective and kind, never scary or robotic.

## The six scenes (add after the shared description)

**Step 1: the problem** (`step-1`)
> The worker sits beside an impossibly tall, leaning tower of paper documents (invoices, forms, printed emails) that towers above their head. Their face is turned towards the camera and clearly visible: brows pulled together, eyes tired and heavy, mouth tense, fingertips pressed to their temples without covering the face. Visibly overwhelmed. A few sheets drift down through the air onto the top of the pile. Crumpled paper balls lie on the desk and the floor.

**Step 2: the pile keeps growing** (`step-2`)
> Same scene, worse: the paper tower is even taller and tilting dangerously. Several sheets have slid off and lie scattered across the floor in front of the desk, lit with a faint orange warning glow to show they were missed. The worker's face, clearly visible, is anxious and drained: wide worried eyes, a tight jaw, glancing at a phone lighting up with a missed call beside them.

**Step 3: an agent has your back** (`step-3`)
> The Akrithos agent now stands right behind the worker's chair, one glowing hand resting reassuringly on the worker's shoulder. The worker turns their face towards the camera and the agent: eyebrows lifting, shoulders dropping, the first real smile of relief. Papers lift off the tower and float into the air, organising themselves into four neat, gently curving streams of glowing gold light around the desk.

**Step 4: your information stays inside** (`step-4`)
> The worker, the agent and the desk sit inside a delicate transparent dome of thin gold geometric lines, like a protective shield. The papers flow in neat golden streams that stay entirely inside the dome; nothing passes through it. The worker's face is calm and reassured: soft eyes, a small confident nod, the agent's hand still on their shoulder.

**Step 5: a person checks what matters** (`step-5`)
> The tall tower is gone. The kraft inbox tray on the right is full of neatly squared documents with a soft gold glow, meaning done. In front of the worker lies a small stack of three or four documents with soft orange highlights; the worker reviews the top one with a pen, face clearly visible: focused, relaxed brow, a quiet confident half-smile. In control. The agent stands at their side, handing them the next document.

**Step 6: your team gets its day back** (`step-6`)
> The desk is completely clear apart from the full inbox tray and a burnt-orange coffee mug. The worker leans back in the chair holding the mug, face to the camera with a genuine, warm, happy smile that reaches the eyes. The agent stands behind them with a hand on their shoulder, glowing a little warmer. The light feels like late afternoon: warm, calm and satisfied.

## The close-up portraits ("face cam")

The site shows the person's face up close next to the scene, so their feeling reads at a glance even on a laptop. Make one portrait per step:

- **Files:** `face-1` to `face-6`, square, 1024 × 1024.
- **Framing:** head and shoulders, face centred and filling about 60% of the frame, looking slightly towards the camera.
- **Same person, suit, tie and lighting** as the scenes (use the step images as reference), against the same dark charcoal background.
- **Expression:** exactly the feeling in the table above for that step.

Prompt to add after the shared description:

> Close-up head-and-shoulders portrait of the same worker, square 1:1, face centred and clearly lit, dark charcoal background. Expression: [Overwhelmed / Stressed / Relieved / Reassured / In control / Happy], shown in the eyes, brows and mouth, natural and believable, not exaggerated. No text, no logos.

## After you add the files

Tell me they are in `public/story/`. I will compress them, switch the story to the artwork (one setting in `src/config/story.ts`), position the labels on each image, and check every step on desktop and phone.

## The person in the 3D story

The home page story is a live 3D office staged like these images. The person in it is cut out of each step's image (with their chair), so their real face and mood show at every step: `public/story/person-1.webp` to `person-6.webp`, made by `node scripts/cut-person.mjs`.

The exact edge of the hair, face and shoulders comes from masks made with **rembg** (an open-source background-removal tool, MIT licence), saved in `scripts/person-mattes/`. They only need making again when a step image changes:

1. Install rembg once, outside the project: `python3 -m venv ~/rembg && ~/rembg/bin/pip install "rembg[cpu]"`.
2. For each changed image, crop the region x 532 to 700, y 160 to 388, enlarge it 4x, and run rembg with the model `isnet-general-use` (saved as `person-N.png`) and with `u2net_human_seg` (saved as `chair-N.png`, which keeps the chair).
3. Run `node scripts/cut-person.mjs`.

If the person sits somewhere else in a new image, the region and the traced outlines in the script need moving too. Sharper images (2048 px wide or more) give a crisper person on large screens.
