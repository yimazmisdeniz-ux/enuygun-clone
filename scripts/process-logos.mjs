// Trim the staged Bookera wordmarks (1536×1024 with large whitespace margins)
// into tight, deploy-ready logo assets, and build a brand favicon/monogram.
//
//   logo1.png (navy wordmark)  → public/bookera-navy.png   (light backgrounds)
//   logo2.png (white wordmark) → public/bookera-white.png  (dark backgrounds)
//   public/seo/icon.png        → blue tile + white "B" monogram (cropped from logo2)
//
// Run:  node scripts/process-logos.mjs
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TARGET_H = 120; // crisp at the 20–24px render heights (≈5–6× DPR headroom)

async function trimWordmark(srcName, outName) {
  const src = join(root, srcName);
  const out = join(root, "public", outName);
  const img = sharp(src).trim({ threshold: 12 });
  // Normalize to a fixed height; width scales with the trimmed aspect ratio.
  const buf = await img.resize({ height: TARGET_H }).png().toBuffer();
  const meta = await sharp(buf).metadata();
  await sharp(buf).toFile(out);
  console.log(`${outName}: ${meta.width}×${meta.height}  (aspect ${(meta.width / meta.height).toFixed(3)})`);
  return meta;
}

async function buildMonogram() {
  // Crop the leading "B" glyph from the trimmed white wordmark and center it on
  // a rounded royal-blue tile — a clean, legible favicon/app icon.
  const trimmed = await sharp(join(root, "logo2.png")).trim({ threshold: 12 }).png().toBuffer();
  const m = await sharp(trimmed).metadata();
  // The "B" occupies roughly the first square of the wordmark height.
  const glyphW = Math.min(m.width, Math.round(m.height * 0.62));
  const glyph = await sharp(trimmed)
    .extract({ left: 0, top: 0, width: glyphW, height: m.height })
    .resize({ height: 300, fit: "inside" })
    .png()
    .toBuffer();

  const SIZE = 512;
  const tile = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
       <rect width="${SIZE}" height="${SIZE}" rx="112" fill="#012B9A"/>
     </svg>`
  );
  const out = join(root, "public", "seo", "icon.png");
  await sharp(tile)
    .composite([{ input: glyph, gravity: "center" }])
    .png()
    .toFile(out);
  console.log(`seo/icon.png: ${SIZE}×${SIZE}  (monogram tile)`);
}

await trimWordmark("logo1.png", "bookera-navy.png");
await trimWordmark("logo2.png", "bookera-white.png");
await buildMonogram();
console.log("✓ logos processed");
