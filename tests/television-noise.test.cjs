const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src/components/TelevisionNoise.tsx"), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function mount({ paused = false, reduced = false } = {}) {
  let effect;
  let id = 0;
  let paints = 0;
  const frames = new Map();
  const listeners = new Map();
  const motion = {
    matches: reduced,
    addEventListener: (_, fn) => listeners.set("motion", fn),
    removeEventListener: () => listeners.delete("motion"),
  };
  const document = {
    hidden: false,
    addEventListener: (_, fn) => listeners.set("visibility", fn),
    removeEventListener: () => listeners.delete("visibility"),
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, document,
    window: { matchMedia: () => motion },
    requestAnimationFrame: (fn) => { frames.set(++id, fn); return id; },
    cancelAnimationFrame: (id) => frames.delete(id),
    require(name) {
      if (name === "react") return {
        useRef: (current) => ({ current }),
        useEffect: (fn) => { effect = fn; },
      };
      if (name === "react/jsx-runtime") return { jsx: (type, props) => ({ type, props }) };
      throw new Error(`Unexpected dependency ${name}`);
    },
  });
  const tree = exports.default({ paused });
  tree.props.ref.current = {
    width: 240, height: 160,
    getContext: () => ({
      createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
      putImageData: () => { paints++; },
    }),
  };
  const cleanup = effect();
  return {
    frames, listeners, cleanup,
    get paints() { return paints; },
    frame(time) {
      for (const [id, fn] of [...frames]) { frames.delete(id); fn(time); }
    },
    hide(hidden) { document.hidden = hidden; listeners.get("visibility")(); },
    reduce(matches) { motion.matches = matches; listeners.get("motion")(); },
  };
}

test("ambient noise paints at a capped rate and releases frames/listeners on unmount", () => {
  const scene = mount();
  assert.equal(scene.frames.size, 1);
  scene.frame(0);
  const initial = scene.paints;
  scene.frame(16);
  assert.equal(scene.paints, initial);
  scene.frame(90);
  assert.equal(scene.paints, initial + 1);
  scene.cleanup();
  assert.equal(scene.frames.size, 0);
  assert.equal(scene.listeners.size, 0);
});

test("hidden tabs and live reduced-motion changes stop the ambient loop", () => {
  const scene = mount();
  scene.hide(true);
  assert.equal(scene.frames.size, 0);
  scene.hide(false);
  assert.equal(scene.frames.size, 1);
  scene.reduce(true);
  assert.equal(scene.frames.size, 0);
  scene.reduce(false);
  assert.equal(scene.frames.size, 1);
  scene.cleanup();
});

test("paused or reduced-motion screens retain only a still texture", () => {
  for (const options of [{ paused: true }, { reduced: true }]) {
    const scene = mount(options);
    assert.equal(scene.paints, 1);
    assert.equal(scene.frames.size, 0);
    scene.cleanup();
    assert.equal(scene.listeners.size, 0);
  }
});
