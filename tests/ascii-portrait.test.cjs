const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

// Exercise the same TypeScript math used by the renderer, without a DOM or
// another runtime dependency. Works on the project's Node 20+ build setup.
const source = fs.readFileSync(
  path.join(__dirname, "../src/lib/ascii-portrait.ts"),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const exportsForTest = {};
vm.runInNewContext(compiled, { exports: exportsForTest });
const { ASCII_RAMP, asciiGlyph, portraitNoise, portraitCell } = exportsForTest;
const portrait = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../src/data/ascii-portrait.json"),
    "utf8",
  ),
);

test("portrait data is a complete 96 × 72 luminance map", () => {
  assert.equal(portrait.columns, 96);
  assert.equal(portrait.rows, 72);
  assert.equal(portrait.tones.length, portrait.rows);
  for (const row of portrait.tones) {
    assert.equal(row.length, portrait.columns);
    assert.match(row, /^[0-9a-f]+$/);
  }
  assert.equal(new Set(portrait.tones.join("")).size, 16);
});

test("glyph selection clamps both ends of the luminance ramp", () => {
  assert.equal(asciiGlyph(-1), " ");
  assert.equal(asciiGlyph(2), "@");
  for (let step = 0; step <= 100; step++) {
    assert.ok(ASCII_RAMP.includes(asciiGlyph(step / 100, 0.04)));
  }
});

test("noise is deterministic and bounded", () => {
  for (let seed = 0; seed < 1000; seed++) {
    const noise = portraitNoise(seed);
    assert.equal(noise, portraitNoise(seed));
    assert.ok(noise >= 0 && noise <= 1);
  }
  assert.notEqual(portraitNoise(1), portraitNoise(2));
});

test("reduced-motion cells do not change with time or drift", () => {
  const first = portraitCell(0.6, 30, 40, 0, false);
  const later = portraitCell(0.6, 30, 40, 100, false);
  assert.deepEqual(first, later);
  assert.equal(first.x, 0);
  assert.equal(first.y, 0);
});

test("animated cells drift gently while preserving brightness and glyph bounds", () => {
  const first = portraitCell(0.6, 30, 40, 0, true);
  const later = portraitCell(0.6, 30, 40, 2, true);
  assert.notEqual(first.x, later.x);
  assert.notEqual(first.y, later.y);
  for (let step = 0; step < 500; step++) {
    const cell = portraitCell(
      (step % 16) / 15,
      step % 96,
      step % 72,
      step / 10,
      true,
    );
    assert.ok(Math.abs(cell.x) <= 0.35);
    assert.ok(Math.abs(cell.y) <= 0.15);
    assert.ok(cell.alpha >= 0 && cell.alpha <= 1);
    assert.ok(ASCII_RAMP.includes(cell.glyph));
  }
  assert.equal(first.alpha, later.alpha);
});
