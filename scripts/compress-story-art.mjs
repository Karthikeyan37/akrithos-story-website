/**
 * Compresses the story artwork (docs/STORY-ART.md) into the files the site loads: public/story/step-1.webp to
 * step-6.webp at up to 2560 × 1440 (16:9, never enlarged), and the close-ups face-1.webp to face-6.webp at 512 × 512 when present.
 * Usage: node scripts/compress-story-art.mjs <folder with the images> (PNG, JPEG or WebP; may be public/story itself).
 */
import { readdirSync, mkdirSync } from "node:fs";
import { join, parse, resolve } from "node:path";
import sharp from "sharp";

const from = resolve(process.argv[2] ?? "public/story");
const to = resolve("public/story");
mkdirSync(to, { recursive: true });
const all = readdirSync(from);
const steps = all.filter((f) => /^step-[1-6]\.(png|jpe?g|webp)$/i.test(f));
const faces = all.filter((f) => /^face-[1-6]\.(png|jpe?g|webp)$/i.test(f));
if (steps.length !== 6) throw new Error(`Expected step-1 to step-6 in ${from}, found: ${steps.join(", ") || "none"}`);
if (faces.length && faces.length !== 6) throw new Error(`Expected face-1 to face-6 in ${from}, found: ${faces.join(", ")}`);
for (const f of [...steps, ...faces].sort()) {
  const out = join(to, `${parse(f).name}.webp`);
  const input = await sharp(join(from, f)).toBuffer(); // read fully first, so a file can be replaced in place
  // Scenes become 16:9, at most 2560 wide; smaller images are cropped to 16:9 but never enlarged (that only adds blur).
  const { width = 2560, height = 1440 } = await sharp(input).metadata();
  const w = Math.min(2560, width, Math.round((height * 16) / 9));
  const sized = f.startsWith("face-") ? sharp(input).resize(512, 512, { fit: "cover", position: "attention", withoutEnlargement: true }) : sharp(input).resize(w, Math.round((w * 9) / 16), { fit: "cover", position: "right" });
  const info = await sized.webp({ quality: 80, effort: 5 }).toFile(out);
  console.log(`${f} -> ${out} (${Math.round(info.size / 1024)} KB)`);
}
