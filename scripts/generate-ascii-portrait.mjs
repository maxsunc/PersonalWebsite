import sharp from "sharp";
import { writeFile } from "node:fs/promises";

// Match the landing's 4:5 frame, correcting for a monospace glyph's 0.6 aspect.
const columns = 96;
const rows = 72;
const source = new URL("../public/images/pfp2.png", import.meta.url);
const output = new URL("../src/data/ascii-portrait.json", import.meta.url);
const pixels = await sharp(source.pathname)
  .resize(480, 600, { fit: "cover", position: "centre" })
  .grayscale()
  .normalize()
  .resize(columns, rows, { fit: "fill" })
  .raw()
  .toBuffer();

const tones = Array.from({ length: rows }, (_, row) =>
  Array.from({ length: columns }, (_, column) => {
    const brightness = pixels[row * columns + column] / 255;
    return Math.round(brightness * 15).toString(16);
  }).join(""),
);

await writeFile(
  output,
  `${JSON.stringify({ columns, rows, tones }, null, 2)}\n`,
);
console.log(
  `Generated ${columns} × ${rows} portrait tones; source image unchanged.`,
);
