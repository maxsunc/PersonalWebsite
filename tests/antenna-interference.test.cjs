const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
function compile(relative) {
  return ts.transpileModule(fs.readFileSync(path.join(__dirname, relative), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
}
const layout = {};
vm.runInNewContext(compile("../src/lib/television.ts"), { exports: layout });
const code = compile("../src/hooks/useAntennaInterference.ts");

function mount({ paused = false, reduced = false, hidden = false } = {}) {
  let effect;
  let strength = 0;
  let now = 0;
  let id = 0;
  const frames = new Map();
  const listeners = new Map();
  const motion = { matches: reduced, addEventListener: (_, fn) => listeners.set("motion", fn), removeEventListener: () => listeners.delete("motion") };
  const document = { hidden, addEventListener: (_, fn) => listeners.set("visibility", fn), removeEventListener: () => listeners.delete("visibility") };
  const exports = {};
  vm.runInNewContext(code, {
    exports, document, performance: { now: () => now },
    window: { matchMedia: () => motion },
    requestAnimationFrame: (fn) => { frames.set(++id, fn); return id; },
    cancelAnimationFrame: (id) => frames.delete(id),
    require: (name) => name === "@/lib/television" ? layout : ({
      useState: () => [0, (value) => { strength = typeof value === "function" ? value(strength) : value; }],
      useRef: (current) => ({ current }), useCallback: (fn) => fn, useEffect: (fn) => { effect = fn; },
    }),
  });
  const hook = exports.useAntennaInterference(paused);
  const cleanup = effect();
  const step = (elapsed = 16) => {
    now += elapsed;
    for (const [id, fn] of [...frames]) { frames.delete(id); fn(now); }
  };
  return {
    frames, listeners, cleanup, disturb: hook.disturb, step,
    get strength() { return strength; },
    sustain(amount, count = 60) { for (let i = 0; i < count; i++) { hook.disturb(amount); step(); } },
    finish() { for (let i = 0; i < 300 && frames.size; i++) step(); assert.equal(frames.size, 0); },
    hide() { document.hidden = true; listeners.get("visibility")(); },
    reduce() { motion.matches = true; listeners.get("motion")(); },
  };
}

test("reception ramps in instead of jumping, remains capped, and fades smoothly to zero", () => {
  const scene = mount();
  scene.disturb(2);
  assert.equal(scene.strength, 0);
  scene.step();
  assert.ok(scene.strength > 0 && scene.strength < 0.15);
  scene.sustain(2);
  assert.ok(scene.strength > 0.8 && scene.strength <= 0.85);
  assert.equal(scene.frames.size, 1);
  scene.step(110);
  const falling = scene.strength;
  assert.ok(falling > 0 && falling < 0.8);
  scene.step();
  assert.ok(scene.strength > 0 && scene.strength < falling);
  scene.finish();
  assert.equal(scene.strength, 0);
  scene.cleanup();
  assert.equal(scene.listeners.size, 0);
});

test("slower movement lowers reception disruption during a drag, not just after release", () => {
  const scene = mount();
  scene.sustain(0.8);
  const hard = scene.strength;
  scene.disturb(0.08); scene.step();
  assert.ok(scene.strength < hard && scene.strength > 0.08);
  scene.sustain(0.08, 100);
  assert.ok(scene.strength >= 0.08 && scene.strength < 0.085);
  scene.cleanup();
});

test("paused, hidden, and reduced-motion displays do not flash", () => {
  for (const options of [{ paused: true }, { hidden: true }, { reduced: true }]) {
    const scene = mount(options);
    scene.disturb(1);
    assert.equal(scene.strength, 0);
    assert.equal(scene.frames.size, 0);
    scene.cleanup();
  }
});

test("visibility and motion preference changes cancel reception animation immediately", () => {
  for (const change of ["hide", "reduce"]) {
    const scene = mount();
    scene.sustain(0.8);
    scene[change]();
    assert.equal(scene.strength, 0);
    assert.equal(scene.frames.size, 0);
    scene.cleanup();
  }
});

test("nonfinite input is ignored and unmount leaves no animation frames or listeners", () => {
  const scene = mount();
  scene.disturb(NaN); scene.disturb(Infinity);
  assert.equal(scene.frames.size, 0);
  scene.disturb(0.5);
  scene.cleanup();
  assert.equal(scene.frames.size, 0);
  assert.equal(scene.listeners.size, 0);
});
