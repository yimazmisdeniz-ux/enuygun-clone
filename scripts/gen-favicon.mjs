/**
 * Generate Bookera app icons from public/seo/icon.png (512×512) into the Next
 * App Router file-convention locations, so Next auto-emits the correct <head>
 * tags (no manual metadata.icons needed):
 *   src/app/favicon.ico   — multi-size (16/32/48) PNG-encoded ICO, /favicon.ico
 *   src/app/icon.png      — 256×256, modern browsers / search results
 *   src/app/apple-icon.png— 180×180, iOS home screen
 * Also refreshes public/seo/{favicon.ico,icon.png} for any legacy references.
 *
 * Run: node scripts/gen-favicon.mjs
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "public/seo/icon.png");
const APP = path.join(ROOT, "src/app");
const SEO = path.join(ROOT, "public/seo");

if (!fs.existsSync(SRC)) {
  console.error(`Source icon not found: ${SRC}`);
  process.exit(1);
}

/** Pack an array of {size, png} into a valid .ico buffer (PNG-encoded entries). */
function buildIco(entries) {
  const count = entries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  const dir = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  const blobs = [];
  entries.forEach((e, i) => {
    const b = i * 16;
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, b + 0); // width (0 == 256)
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, b + 1); // height
    dir.writeUInt8(0, b + 2); // palette
    dir.writeUInt8(0, b + 3); // reserved
    dir.writeUInt16LE(1, b + 4); // color planes
    dir.writeUInt16LE(32, b + 6); // bits per pixel
    dir.writeUInt32LE(e.png.length, b + 8); // data size
    dir.writeUInt32LE(offset, b + 12); // data offset
    offset += e.png.length;
    blobs.push(e.png);
  });
  return Buffer.concat([header, dir, ...blobs]);
}

const SOURCE = fs.readFileSync(SRC); // read once; avoids same-file in/out

async function pngAt(size) {
  return sharp(SOURCE)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

async function main() {
  // PNG icons (src/app conventions). public/seo/icon.png is the 512 source, kept as-is.
  await sharp(SOURCE).resize(256, 256).png().toFile(path.join(APP, "icon.png"));
  await sharp(SOURCE).resize(180, 180).png().toFile(path.join(APP, "apple-icon.png"));

  // Multi-size ICO for legacy /favicon.ico
  const icoSizes = [16, 32, 48];
  const pngs = await Promise.all(icoSizes.map((s) => pngAt(s)));
  const ico = buildIco(icoSizes.map((size, i) => ({ size, png: pngs[i] })));
  fs.writeFileSync(path.join(APP, "favicon.ico"), ico);
  fs.writeFileSync(path.join(SEO, "favicon.ico"), ico);

  console.log("Generated:");
  console.log("  src/app/favicon.ico (16/32/48)", ico.length, "bytes");
  console.log("  src/app/icon.png (256)");
  console.log("  src/app/apple-icon.png (180)");
  console.log("  public/seo/{icon.png,favicon.ico} refreshed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
