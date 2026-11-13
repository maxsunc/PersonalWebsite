// Small, local derivatives of the existing profile/project assets for the CRT.
// Run from the repository root: node scripts/create-tv-channel-images.cjs
const path = require("node:path");
const fs = require("node:fs/promises");
const sharp = require("sharp");
const root = path.resolve(__dirname, "..");
const output = path.join(root, "public/images/television");
(async () => {
  await fs.mkdir(output, { recursive: true });
  for (const [source, name, width, height] of [
    ["pfp2.png", "profile", 480, 480],
    ["towlogo.jpg", "tower-of-wizard", 360, 225],
    ["logo.png", "odm-gear", 360, 225],
    ["boxhead.jpg", "boxhead-ar", 360, 225],
  ]) {
    await sharp(path.join(root, "public/images", source)).resize(width, height, { fit: "cover" })
      .webp({ quality: 84 }).toFile(path.join(output, `${name}.webp`));
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
