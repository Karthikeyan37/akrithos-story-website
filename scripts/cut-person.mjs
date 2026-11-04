/**
 * Cuts the person (with their chair) out of each story image, for the 3D story (src/components/world/engine.ts).
 *
 * The exact edge comes from masks made by a background-removal model (rembg, MIT licence), kept in
 * scripts/person-mattes/: `person-N.png` (isnet-general-use: clean hair, face and shoulders) and `chair-N.png`
 * (u2net_human_seg: also keeps the chair). They were made from the region x 532..700, y 160..388 of each 1017 × 572
 * image, enlarged 4x. The outlines below were traced on a 3x zoom of the region x 500..730, y 130..430 ("grid" units);
 * they only keep the desk, the pile and the mug out. The edge takes its colour from the person, not from the wall
 * behind, so there is no dark outline; the right side and the bottom fade softly (rounded corners, no straight line).
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
const REGION = { left: 532, top: 160, width: 168, height: 228 };
const SCALE = 2;
// Grid units to cut-out pixels.
const px = ([gx, gy]) => [((500 + gx / 3 - REGION.left) * SCALE).toFixed(1), ((130 + gy / 3 - REGION.top) * SCALE).toFixed(1)];
const SOURCES = { 1: 1, 2: 1, 3: 3, 4: 4, 5: 5, 6: 6 };
const w = REGION.width * SCALE, h = REGION.height * SCALE, n = w * h;
const clamp = (x) => Math.max(0, Math.min(1, x));
const blur3 = async (buf, sigma) => sharp(buf, { raw: { width: w, height: h, channels: 3 } }).blur(sigma).raw().toBuffer();
const shape = async (pts, sigma) => sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><polygon points="${pts.map((p) => px(p).join(",")).join(" ")}" fill="#fff"/></svg>`)).blur(sigma).toColourspace("b-w").extractChannel(0).raw().toBuffer();
const matte = async (file) => sharp(file).extractChannel(0).resize(w, h, { kernel: "lanczos3" }).raw().toBuffer();
// The chair's back, to the left of the person: the only part taken from the second mask.
const CHAIR_ZONE = [[96, 436], [300, 340], [322, 400], [290, 560], [250, 775], [150, 768], [105, 708]];

for (const [step, src] of Object.entries(SOURCES)) {
  const [person, chairMatte, bound, chairZone] = await Promise.all([
    matte(`scripts/person-mattes/person-${src}.png`),
    matte(`scripts/person-mattes/chair-${src}.png`),
    shape(OUTLINES[src], 6), // the traced outline, softened: keeps the desk, pile and mug out
    shape(CHAIR_ZONE, 3),
  ]);
  const image = await sharp(`public/story/step-${src}.webp`).extract(REGION).resize(w, h, { kernel: "lanczos3" }).removeAlpha().raw().toBuffer();

  // How solid each pixel is: the person, plus the chair, inside the outline, with the soft fade on the right and bottom.
  const a = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i % w) / w, y = Math.floor(i / w) / h;
    const d = Math.pow(Math.pow(Math.abs(x - 0.45) / 0.55, 4) + Math.pow(Math.max(0, y - 0.45) / 0.5, 4), 0.25);
    const f = 1 - clamp((d - 0.86) / 0.13);
    const fade = f * f * (3 - 2 * f);
    // Faint, unsure parts of the masks (bits of the paper pile, glints on the wall) are dropped; the edges stay soft.
    const sure = (v) => clamp((v / 255 - 0.3) / 0.45);
    const body = Math.max(sure(person[i]), sure(chairMatte[i]) * (chairZone[i] / 255));
    a[i] = body * clamp((bound[i] / 255 - 0.2) / 0.5) * fade;
  }

  // Clean edge colours: where the person is surely solid, keep their colours; at the soft edge, borrow the nearest
  // solid colours (hair, skin, suit, chair) instead of the dark wall that was behind them.
  const prem = Buffer.alloc(n * 3), weight = Buffer.alloc(n * 3), own = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const k = clamp((a[i] - 0.7) / 0.25);
    own[i] = k;
    for (let c = 0; c < 3; c++) { prem[i * 3 + c] = Math.round(image[i * 3 + c] * k); weight[i * 3 + c] = Math.round(k * 255); }
  }
  const [premB, weightB, premF, weightF] = await Promise.all([blur3(prem, 4), blur3(weight, 4), blur3(prem, 14), blur3(weight, 14)]);
  const out = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    const k = own[i], near = weightB[i * 3], far = weightF[i * 3];
    for (let c = 0; c < 3; c++) {
      const self = image[i * 3 + c];
      const bled = near > 10 ? Math.min(255, (premB[i * 3 + c] / near) * 255) : far > 1 ? Math.min(255, (premF[i * 3 + c] / far) * 255) : self;
      out[i * 4 + c] = Math.round(self * k + bled * (1 - k));
    }
    out[i * 4 + 3] = Math.round(a[i] * 255);
  }
  await sharp(out, { raw: { width: w, height: h, channels: 4 } }).webp({ quality: 90, alphaQuality: 95 }).toFile(`public/story/person-${step}.webp`);
  console.log(`person-${step}.webp`);
}
