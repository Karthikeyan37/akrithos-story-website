/**
 * Cuts the person (with their chair) out of each story image, for the 3D story (src/components/world/engine.ts).
 * Outlines were traced on a 3x zoom of the region x 500..730, y 130..430 of the 1017 × 572 images ("grid" units);
 * the cut-outs cover x 532..700, y 180..388 and are saved at twice that size with soft edges (and a soft fade at the
 * bottom, where the desk meets them), as WebP with transparency.
 * Run: node scripts/cut-person.mjs
 */
import sharp from "sharp";

const BOTTOM = [[598, 662], [565, 700], [560, 742], [465, 742], [455, 752], [250, 762], [150, 756], [118, 705]];
const CHAIR = [[105, 440], [300, 345]];
const OUTLINES = {
  1: [...CHAIR, [345, 338], [346, 280], [378, 205], [440, 172], [510, 170], [560, 205], [568, 250], [580, 295], [592, 340], [594, 440], [585, 480], [598, 520], ...BOTTOM],
  3: [[105, 440], [250, 380], [300, 368], [298, 330], [283, 295], [262, 240], [268, 175], [300, 135], [350, 115], [420, 118], [455, 155], [472, 200], [480, 260], [478, 320], [462, 360], [480, 392], [540, 420], [590, 465], [598, 500], ...BOTTOM],
  4: [...CHAIR, [340, 340], [335, 270], [355, 195], [420, 152], [500, 152], [545, 200], [553, 260], [552, 320], [540, 400], [560, 445], [598, 470], ...BOTTOM],
  5: [...CHAIR, [345, 338], [330, 250], [345, 175], [420, 135], [500, 135], [530, 170], [538, 230], [538, 335], [560, 420], [610, 460], [690, 500], [690, 580], [600, 610], [632, 700], [630, 745], [560, 742], [465, 742], [455, 752], [270, 770], [150, 756], [118, 705]],
  6: [...CHAIR, [345, 338], [330, 250], [350, 170], [420, 130], [500, 130], [540, 180], [550, 250], [552, 330], [540, 400], [565, 425], [598, 445], ...BOTTOM],
};
const REGION = { left: 532, top: 180, width: 168, height: 208 };
const SCALE = 2;
// Grid units to cut-out pixels.
const px = ([gx, gy]) => [((500 + gx / 3 - REGION.left) * SCALE).toFixed(1), ((130 + gy / 3 - REGION.top) * SCALE).toFixed(1)];

const SOURCES = { 1: 1, 2: 1, 3: 3, 4: 4, 5: 5, 6: 6 };
for (const [step, src] of Object.entries(SOURCES)) {
  const w = REGION.width * SCALE, h = REGION.height * SCALE;
  const points = OUTLINES[src].map((p) => px(p).join(",")).join(" ");
  // The outline, fading out over the bottom (where the desk meets it) and the right side (where the image's own pile
  // cut the person off), so it melts into the scene instead of ending on a hard line.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0.78" stop-color="#fff"/><stop offset="0.97" stop-color="#000"/></linearGradient><linearGradient id="r" x1="0" y1="0" x2="1" y2="0"><stop offset="${src === "5" ? 0.95 : 0.84}" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient><mask id="m"><rect width="${w}" height="${h}" fill="url(#f)"/></mask><mask id="n"><rect width="${w}" height="${h}" fill="url(#r)"/></mask></defs><g mask="url(#n)"><polygon points="${points}" fill="#fff" mask="url(#m)"/></g></svg>`;
  // Soft edges, pulled slightly inside the outline so none of the wall behind shows around the person.
  const soft = await sharp(Buffer.from(svg)).blur(3).toColourspace("b-w").png().toBuffer();
  const mask = await sharp(soft).linear(1.8, -0.55 * 255).png().toBuffer();
  await sharp(`public/story/step-${src}.webp`)
    .extract(REGION)
    .resize(w, h, { kernel: "lanczos3" })
    .ensureAlpha()
    .composite([{ input: mask, blend: "dest-in" }])
    .webp({ quality: 88, alphaQuality: 90 })
    .toFile(`public/story/person-${step}.webp`);
  console.log(`person-${step}.webp`);
}
