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
const {
  ASCII_RAMP,
  CRT_REFRESH_SECONDS,
  asciiGlyph,
  crtWarp,
  crtSnow,
  portraitStartup,
  phosphorWeight,
  portraitNoise,
  portraitCell,
  portraitRefresh,
} = exportsForTest;
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

test("refresh band travels upward and wraps outside the visible frame", () => {
  const peakTime = (row) => ((1.16 - row) / 1.32) * CRT_REFRESH_SECONDS;
  assert.ok(peakTime(0.75) < peakTime(0.25));
  assert.ok(portraitRefresh(0.75, peakTime(0.75), true) > 0.99);
  assert.ok(portraitRefresh(0.25, peakTime(0.25), true) > 0.99);
  assert.equal(portraitRefresh(0.25, peakTime(0.75), true), 0);
  for (let step = 0; step <= 100; step++) {
    const row = step / 100;
    assert.ok(
      Math.abs(
        portraitRefresh(row, 0, true) -
          portraitRefresh(row, CRT_REFRESH_SECONDS - 0.00001, true),
      ) < 0.0002,
    );
    assert.equal(
      portraitRefresh(row, CRT_REFRESH_SECONDS, true),
      portraitRefresh(row, 0, true),
    );
    assert.equal(portraitRefresh(row, peakTime(row), false), 0);
    const strength = portraitRefresh(row, 4, true);
    assert.ok(strength >= 0 && strength <= 1);
  }
});

test("refresh brightens, densifies, and distorts glyphs but never affects a still portrait", () => {
  for (let step = 0; step <= 15; step++) {
    const tone = step / 15;
    const base = portraitCell(tone, 30, 40, 2, true, 0);
    const refreshed = portraitCell(tone, 30, 40, 2, true, 1);
    assert.ok(refreshed.alpha >= base.alpha);
    assert.ok(refreshed.alpha - base.alpha <= 0.12 + Number.EPSILON);
    assert.ok(refreshed.alpha <= 0.98);
    assert.ok(
      ASCII_RAMP.indexOf(refreshed.glyph) >= ASCII_RAMP.indexOf(base.glyph),
    );
    assert.notEqual(refreshed.x, base.x);
    assert.ok(Math.abs(refreshed.x) <= 1.4);
    assert.deepEqual(
      portraitCell(tone, 30, 40, 2, false, 1),
      portraitCell(tone, 30, 40, 2, false, 0),
    );
  }
});

test("refresh passes are evenly spaced every 2.4 seconds", () => {
  assert.equal(CRT_REFRESH_SECONDS / 2, 2.4);
  for (let step = 0; step < 100; step++) {
    const row = step / 100;
    const time = step / 17;
    assert.ok(
      Math.abs(
        portraitRefresh(row, time, true) -
          portraitRefresh(row, time + 2.4, true),
      ) < 1e-12,
    );
  }
});

test("CRT curvature preserves the center and keeps screen coordinates in bounds", () => {
  assert.equal(crtWarp(0.5, 0.5).x, 0.5);
  assert.equal(crtWarp(0.5, 0.5).y, 0.5);
  assert.ok(crtWarp(0, 0).x > 0);
  assert.ok(crtWarp(1, 1).x < 1);
  for (let row = 0; row <= 20; row++) {
    for (let column = 0; column <= 20; column++) {
      const point = crtWarp(column / 20, row / 20);
      assert.ok(point.x >= 0 && point.x <= 1);
      assert.ok(point.y >= 0 && point.y <= 1);
    }
  }
});

test("startup holds static then smoothly crossfades to the portrait", () => {
  assert.equal(portraitStartup(0, true), 0);
  assert.equal(portraitStartup(0.9, true), 0);
  assert.ok(Math.abs(portraitStartup(1.5, true) - 0.5) < 1e-12);
  assert.equal(portraitStartup(2.1, true), 1);
  assert.equal(portraitStartup(10, true), 1);
  let previous = 0;
  for (let step = 0; step <= 300; step++) {
    const blend = portraitStartup(step / 100, true);
    assert.ok(blend >= previous && blend <= 1);
    assert.equal(portraitStartup(step / 100, false), 1);
    previous = blend;
  }
});

test("TV snow changes locally without large overall brightness jumps", () => {
  const means = [0, 0];
  for (let row = 0; row < 108; row++) {
    for (let column = 0; column < 144; column++) {
      for (let frame = 0; frame < 2; frame++) {
        const level = crtSnow(column, row, frame);
        assert.ok(Number.isInteger(level) && level >= 28 && level <= 140);
        assert.equal(level, crtSnow(column, row, frame));
        means[frame] += level / (144 * 108);
      }
    }
  }
  assert.notEqual(crtSnow(30, 40, 0), crtSnow(30, 40, 1));
  assert.ok(Math.abs(means[0] - means[1]) < 2);
});

test("phosphor trails are faint, decay with time, and vanish when still", () => {
  assert.equal(phosphorWeight(0, true), 0.18);
  assert.equal(phosphorWeight(-10, true), 0.18);
  assert.equal(phosphorWeight(63, false), 0);
  assert.ok(phosphorWeight(63, true) > phosphorWeight(126, true));
  assert.ok(phosphorWeight(250, true) < 0.002);
  for (let elapsed = 0; elapsed < 1000; elapsed++) {
    const weight = phosphorWeight(elapsed, true);
    assert.ok(weight >= 0 && weight <= 0.18);
    // History and current glyph weights sum to one: no accumulating glow.
    assert.equal(weight + (1 - weight), 1);
  }
});
