const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
function compile(relative) {
  return ts.transpileModule(fs.readFileSync(path.join(__dirname, relative), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
}
const layout = {};
vm.runInNewContext(compile("../src/lib/television.ts"), { exports: layout });

async function mountModel({ reduced = false, width = 800, height = 716, failRenderer = false } = {}) {
  const THREE = await import("three");
  const listeners = new Map();
  const documentListeners = new Map();
  const captures = new Set();
  const frames = new Map();
  const signals = [], warnings = [];
  let readySnapshot;
  let frameId = 0, now = 0, antenna, thumb, led, loads = 0;
  const motion = { matches: reduced, addEventListener(_name, fn) { this.listener = fn; }, removeEventListener() { this.listener = undefined; } };
  const document = { hidden: false, addEventListener: (name, fn) => documentListeners.set(name, fn), removeEventListener: (name) => documentListeners.delete(name) };
  const style = () => ({ removeProperty(name) { delete this[name]; } });
  const layoutWrites = [];
  const display = { style: new Proxy(style(), {
    set(target, key, value) { if (key === "width" || key === "height") layoutWrites.push([key, value]); target[key] = value; return true; },
  }), inert: false };
  const inputs = { style: style(), inert: false };
  const range = { style: style() };
  const stage = {
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
    setPointerCapture: (id) => captures.add(id), hasPointerCapture: (id) => captures.has(id),
    releasePointerCapture: (id) => captures.delete(id),
    classList: { add() {}, remove() {} },
  };
  const host = {
    parentElement: stage,
    getBoundingClientRect: () => ({ width, height, left: 0, top: 0 }),
    querySelector: (selector) => selector === ".cabinet-inputs" ? inputs : selector === ".cabinet-volume" ? range : null, querySelectorAll: () => [], prepend() {},
  };
  let renders = 0;
  let resizeCallback;
  let cameraPosition, cameraSpan;
  class Renderer {
    constructor() {
      if (failRenderer) throw new Error("WebGL unavailable");
      this.domElement = { setAttribute() {}, addEventListener() {}, removeEventListener() {}, remove() {} };
    }
    setPixelRatio() {} setSize() {} dispose() {}
    render(_scene, camera) { renders++; cameraPosition = camera.position.toArray(); cameraSpan = (camera.right - camera.left) / camera.zoom; }
  }
  class Loader {
    async loadAsync() {
      loads++;
      const scene = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(14, 9.2, 3.45), new THREE.MeshStandardMaterial());
      body.name = "Cabinet";
      scene.add(body);
      antenna = new THREE.Group(); antenna.name = "Antenna_left";
      scene.add(antenna);
      thumb = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.44, 0.24), new THREE.MeshStandardMaterial());
      thumb.name = "VolumeThumb"; thumb.position.set(5.56, 1.38, 1.36); scene.add(thumb);
      led = new THREE.Mesh(new THREE.SphereGeometry(0.045), new THREE.MeshStandardMaterial({ color: 0x885522, emissiveIntensity: 1.4 }));
      led.name = "StandbyLED"; led.position.set(6.15, -3.65, 1.21); scene.add(led);
      return { scene };
    }
  }
  let refIndex = 0;
  let stateIndex = 0;
  let effectIndex = 0;
  const refs = [], states = [], effects = [], pending = [];
  const React = {
    useRef(current) { const i = refIndex++; return refs[i] ??= { current }; },
    useState(initial) { const i = stateIndex++; if (!(i in states)) states[i] = initial; return [states[i], (value) => { states[i] = value; }]; },
    useEffect(fn, deps) {
      const i = effectIndex++;
      const prior = effects[i];
      if (!prior || deps.some((value, index) => value !== prior.deps[index])) {
        effects[i] = { deps, cleanup: prior?.cleanup };
        pending.push(() => { effects[i].cleanup?.(); effects[i].cleanup = fn(); });
      }
    },
  };
  let ready;
  const readyPromise = new Promise((resolve) => { ready = resolve; });
  const props = { displayRef: { current: display }, onReady: () => {
    readySnapshot = { transform: display.style.transform, width: display.style.width, height: display.style.height, renders };
    ready();
  }, onInterference: (amount) => signals.push(amount), frontView: false };
  const exports = {};
  const jsx = (type, props) => ({ type, props });
  vm.runInNewContext(compile("../src/components/TelevisionModel.tsx"), {
    exports, console: { ...console, warn: (...args) => warnings.push(args) }, performance: { now: () => now },
    document,
    window: { devicePixelRatio: 1, matchMedia: () => motion },
    requestAnimationFrame: (fn) => { frames.set(++frameId, fn); return frameId; },
    cancelAnimationFrame: (id) => frames.delete(id),
    ResizeObserver: class { constructor(callback) { resizeCallback = callback; } observe() {} disconnect() {} },
    require(name) {
      if (name === "react") return React;
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "next/image") return { __esModule: true, default: "image" };
      if (name === "@/lib/television") return layout;
      if (name === "three") return { ...THREE, WebGLRenderer: Renderer };
      if (name === "three/examples/jsm/loaders/GLTFLoader.js") return { GLTFLoader: Loader };
      throw new Error(`Unexpected dependency ${name}`);
    },
  });
  let currentProps = { ...props, volume: 50, powered: true };
  function render(frontView, settings = {}) {
    refIndex = stateIndex = effectIndex = 0;
    currentProps = { ...currentProps, frontView, ...settings };
    exports.default(currentProps);
    refs[0].current = host;
    for (const fn of pending.splice(0)) fn();
  }
  render(false);
  await readyPromise;
  const pointer = (x, y, blocked = false) => ({
    pointerId: 1, button: 0, clientX: x, clientY: y,
    target: { closest: (selector) => blocked === "input" ? (selector.includes("input") ? {} : null) : blocked ? {} : null }, preventDefault() {},
  });
  const step = (elapsed = 16) => { now += elapsed; for (const [id, fn] of [...frames]) { frames.delete(id); fn(now); } };
  return {
    display, inputs, listeners, documentListeners, frames, signals, layoutWrites, range, readySnapshot, warnings,
    get thumbX() { return thumb.position.x; }, get ledIntensity() { return led.material.emissiveIntensity; }, get loads() { return loads; },
    settings(values) { render(currentProps.frontView, values); },
    resize(nextWidth, nextHeight) { width = nextWidth; height = nextHeight; resizeCallback(); },
    get antennaAngle() { return antenna.rotation.z; },
    adjust(delta, reset = false) { refs[2].current("left", delta, 16, reset); },
    step,
    finish() { for (let i = 0; i < 160 && frames.size; i++) step(); assert.equal(frames.size, 0); },
    hide() { document.hidden = true; documentListeners.get("visibilitychange")(); },
    reduce() { motion.matches = true; motion.listener(); },
    get renders() { return renders; }, get cameraPosition() { return cameraPosition; }, get cameraSpan() { return cameraSpan; },
    down(x, y, blocked) { listeners.get("pointerdown")(pointer(x, y, blocked)); },
    move(x, y) { listeners.get("pointermove")(pointer(x, y)); },
    up() { listeners.get("pointerup")(pointer(0, 0)); },
    front(value) { render(value); },
    cleanup() { for (const effect of effects) effect.cleanup?.(); },
  };
}

test("startup readiness follows the first exact screen projection and rendered cabinet", async () => {
  for (const failRenderer of [false, true]) {
    const model = await mountModel({ failRenderer });
    assert.match(model.readySnapshot.transform, /^matrix\(/);
    assert.equal(model.readySnapshot.width, "640px");
    assert.ok(parseFloat(model.readySnapshot.height) > 0);
    assert.equal(model.display.style.visibility, "visible");
    if (failRenderer) {
      assert.equal(model.readySnapshot.renders, 0);
      assert.equal(model.warnings.length, 1);
    } else {
      assert.ok(model.readySnapshot.renders > 0);
      assert.equal(model.warnings.length, 0);
    }
    model.cleanup();
  }
});

test("native pointer handlers really orbit to the back, hold on release, and ignore hover", async () => {
  const model = await mountModel();
  const initialRenders = model.renders;
  model.move(500, 100);
  assert.equal(model.renders, initialRenders);
  model.down(100, 100);
  model.move(500, 100); // half the 800px cabinet width = a half turn
  assert.equal(model.display.style.visibility, "hidden");
  assert.equal(model.display.inert, true);
  assert.equal(model.inputs.style.visibility, "hidden");
  assert.ok(model.cameraPosition[2] < 0);
  model.up();
  const backPosition = [...model.cameraPosition];
  model.move(700, 300);
  assert.deepEqual(model.cameraPosition, backPosition);
  model.cleanup();
  assert.equal(model.listeners.size, 0);
  assert.equal(model.documentListeners.size, 0);
});

test("side-view dragging keeps the screen visible and interactive until actually behind it", async () => {
  const model = await mountModel();
  for (const degrees of [80, 85, 89.99, 90, 91, 89, -85, -90, -91, -89]) {
    const yaw = degrees * Math.PI / 180;
    const current = Math.atan2(model.cameraPosition[0], model.cameraPosition[2]);
    model.down(100, 100);
    model.move(100 + (current - yaw) / (Math.PI * 2) * 800, 100);
    model.up();
    const visible = Math.abs(degrees) <= 90;
    assert.equal(model.display.style.visibility, visible ? "visible" : "hidden", `yaw ${degrees}`);
    assert.equal(model.display.inert, !visible);
    assert.equal(model.inputs.inert, !visible);
  }
  model.cleanup();
});

test("front-view toggle centers and locks the camera, then restores the orbit angle", async () => {
  const model = await mountModel();
  model.down(100, 100); model.move(500, 100); model.up();
  const backPosition = [...model.cameraPosition];
  model.front(true);
  assert.deepEqual(model.cameraPosition, backPosition); // no jump on toggle
  const backSpan = model.cameraSpan;
  model.step(32);
  assert.notDeepEqual(model.cameraPosition, backPosition);
  assert.ok(model.cameraPosition[2] < 0); // begin from the actual rear-facing pose
  assert.ok(Math.abs(model.cameraSpan - backSpan) < 0.1);
  model.finish();
  assert.equal(model.display.style.visibility, "visible");
  assert.equal(model.display.inert, false);
  assert.deepEqual(model.cameraPosition, [0, 0, 23]);
  model.down(100, 100); model.move(500, 100); model.up();
  assert.deepEqual(model.cameraPosition, [0, 0, 23]);
  model.front(false);
  assert.deepEqual(model.cameraPosition, [0, 0, 23]);
  model.step(320);
  assert.notDeepEqual(model.cameraPosition, [0, 0, 23]);
  assert.notDeepEqual(model.cameraPosition, backPosition);
  model.finish();
  assert.deepEqual(model.cameraPosition, backPosition);
  assert.equal(model.display.style.visibility, "hidden");
  model.cleanup();
});

test("screen layout never resizes or changes breakpoint during orbit, view transitions, or antenna motion", async () => {
  for (const device of [{ width: 800, height: 716 }, { width: 390, height: 832 }]) {
    const model = await mountModel(device);
    const dimensions = [model.display.style.width, model.display.style.height];
    assert.equal(dimensions[0], "640px");
    assert.equal(model.layoutWrites.length, 2);
    const originalTransform = model.display.style.transform;
    model.down(100, 100); model.move(280, 240); model.up();
    assert.notEqual(model.display.style.transform, originalTransform);
    const unchanged = () => {
      assert.deepEqual([model.display.style.width, model.display.style.height], dimensions);
      assert.equal(model.layoutWrites.length, 2);
      const matrix = model.display.style.transform.slice(7, -1).split(",").map(Number);
      assert.equal(matrix.length, 6);
      assert.ok(matrix.every(Number.isFinite));
    };
    unchanged();
    model.front(true);
    for (let i = 0; i < 45; i++) { model.step(); unchanged(); }
    model.front(false); model.finish(); unchanged();
    model.adjust(0.6); model.finish(); unchanged();
    model.resize(device.width, device.height + 100); unchanged();
    model.cleanup();
  }
});

test("only an actual device-width breakpoint can change the screen aspect ratio", async () => {
  const model = await mountModel();
  const desktopHeight = model.display.style.height;
  model.resize(760, 900);
  assert.equal(model.display.style.height, desktopHeight);
  assert.equal(model.layoutWrites.length, 2);
  model.resize(390, 832);
  assert.equal(model.display.style.width, "640px");
  assert.ok(parseFloat(model.display.style.height) > parseFloat(desktopHeight));
  assert.equal(model.layoutWrites.length, 4);
  model.cleanup();
});

test("rapid view reversals continue from the current pose and preserve the saved angle", async () => {
  const model = await mountModel();
  model.down(100, 100); model.move(380, 160); model.up();
  const original = [...model.cameraPosition];
  model.front(true); model.step(240);
  const midway = [...model.cameraPosition];
  model.front(false);
  assert.deepEqual(model.cameraPosition, midway);
  assert.equal(model.frames.size, 1);
  model.finish();
  for (let i = 0; i < 3; i++) assert.ok(Math.abs(model.cameraPosition[i] - original[i]) < 1e-10);
  model.down(100, 100); model.move(200, 100); model.up();
  const latest = [...model.cameraPosition];
  model.hide();
  assert.deepEqual(model.cameraPosition, latest); // no stale transition endpoint
  model.cleanup();
});

test("view transitions respect reduced motion, settle in hidden tabs, and clean up", async () => {
  for (const stop of ["hide", "reduce", "cleanup"]) {
    const model = await mountModel();
    model.front(true); model.step(100);
    assert.equal(model.frames.size, 1);
    model[stop]();
    assert.equal(model.frames.size, 0);
    if (stop !== "cleanup") {
      assert.deepEqual(model.cameraPosition, [0, 0, 23]);
      model.cleanup();
    }
  }
  const reduced = await mountModel({ reduced: true });
  reduced.front(true);
  assert.equal(reduced.frames.size, 0);
  assert.deepEqual(reduced.cameraPosition, [0, 0, 23]);
  reduced.cleanup();
});

test("volume and power update their 3D parts without reloading or changing screen layout", async () => {
  const model = await mountModel();
  model.settings({ volume: 0 }); assert.equal(model.thumbX, layout.TV_VOLUME.minX);
  model.settings({ volume: 100 }); assert.equal(model.thumbX, layout.TV_VOLUME.maxX);
  model.settings({ powered: false }); assert.equal(model.ledIntensity, 0);
  model.settings({ powered: true }); assert.equal(model.ledIntensity, 1.4);
  assert.equal(model.loads, 1);
  assert.equal(model.layoutWrites.length, 2);
  const matrix = model.range.style.transform;
  model.down(100, 100); model.move(220, 150); model.up();
  assert.notEqual(model.range.style.transform, matrix);
  assert.equal(model.range.style.width, "172px");
  assert.equal(model.range.style.height, "52px");
  const position = [...model.cameraPosition];
  model.down(100, 100, "input"); model.move(500, 100); model.up();
  assert.deepEqual(model.cameraPosition, position); // native range never starts orbit
  model.cleanup();
});

test("links and physical controls do not accidentally start a cabinet drag", async () => {
  const model = await mountModel();
  const before = [...model.cameraPosition];
  model.down(100, 100, true); model.move(500, 100); model.up();
  assert.deepEqual(model.cameraPosition, before);
  model.cleanup();
});

test("antenna meshes ease toward accumulated targets and stop rendering after settling", async () => {
  const model = await mountModel();
  model.adjust(0.3);
  assert.equal(model.antennaAngle, 0);
  assert.equal(model.frames.size, 1);
  model.step();
  assert.ok(model.antennaAngle > 0 && model.antennaAngle < 0.1);
  model.adjust(0.3); // accumulate against the target, not the lagging mesh
  for (let i = 0; i < 80 && model.frames.size; i++) model.step();
  assert.equal(model.antennaAngle, 0.6);
  assert.equal(model.frames.size, 0);
  assert.ok(model.signals[0] > model.signals.at(-1));
  model.adjust(10);
  for (let i = 0; i < 80 && model.frames.size; i++) model.step();
  assert.equal(model.antennaAngle, 0.68);
  const count = model.signals.length;
  model.adjust(10); model.step();
  assert.equal(model.signals.length, count); // no interference against a hard stop
  model.cleanup();
});

test("hidden tabs, reduced motion, and unmount cancel antenna animation", async () => {
  for (const stop of ["hide", "reduce", "cleanup"]) {
    const model = await mountModel();
    model.adjust(0.5); model.step();
    assert.equal(model.frames.size, 1);
    model[stop]();
    assert.equal(model.frames.size, 0);
    if (stop !== "cleanup") model.cleanup();
  }
  const model = await mountModel({ reduced: true });
  model.adjust(0.3);
  assert.equal(model.antennaAngle, 0.3);
  assert.equal(model.frames.size, 0);
  assert.equal(model.signals.length, 0);
  model.cleanup();
});
