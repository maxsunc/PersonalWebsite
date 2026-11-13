const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const source = fs.readFileSync(path.join(__dirname, "../src/components/TelevisionPortfolio.tsx"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
const experiences = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src/data/experience.ts"), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const data = {};
vm.runInNewContext(experiences, { exports: data });

function mount(reducedMotion = false) {
  let effect;
  let tuning = false;
  let effectsPaused = false;
  let stateIndex = 0;
  let focused = false;
  let id = 0;
  const timers = new Map();
  const listeners = new Map();
  const refs = [];
  const document = { activeElement: null };
  const motion = {
    matches: reducedMotion,
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
  };
  const jsx = (type, props) => ({ type, props });
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, document,
    window: { matchMedia: () => motion },
    setTimeout: (fn, duration) => {
      assert.equal(duration, 1600);
      timers.set(++id, fn);
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
    require: (name) => {
      if (name === "react") return {
        useState: (initial) => {
          const index = stateIndex++;
          return [initial, (next) => { if (index === 0) tuning = next; else effectsPaused = next; }];
        },
        useRef: (current) => { const ref = { current }; refs.push(ref); return ref; },
        useCallback: (fn) => fn,
        useEffect: (fn) => { effect = fn; },
      };
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "next/image") return { __esModule: true, default: "image" };
      if (name === "lucide-react") return { ArrowUpRight: "arrow", RotateCcw: "replay", Pause: "pause", Play: "play" };
      if (name === "@/components/TelevisionCabinet") return { __esModule: true, default: "cabinet" };
      if (name === "@/components/TelevisionNoise") return { __esModule: true, default: "noise" };
      if (name === "@/data/experience") return data;
      if (name === "@/data/personal") return { personal: { email: "test@example.com", social: { github: "https://github.com/", linkedin: "https://linkedin.com/" } } };
      throw new Error(`Unexpected dependency ${name}`);
    },
  });
  const tree = exports.default();
  refs[1].current = { focus: () => { focused = true; } };
  refs[2].current = {};
  const cleanup = effect();
  function find(node, predicate) {
    if (!node || typeof node !== "object") return;
    if (predicate(node)) return node;
    for (const child of [node.props?.children].flat(Infinity)) {
      const result = find(child, predicate);
      if (result) return result;
    }
  }
  return {
    tree, timers, listeners, cleanup,
    get tuning() { return tuning; },
    get focused() { return focused; },
    get effectsPaused() { return effectsPaused; },
    pauseEffects() { find(tree, (node) => node.props?.className === "effects-button").props.onClick(); },
    finish() { for (const fn of [...timers.values()]) fn(); },
    skip() { document.activeElement = refs[2].current; find(tree, (node) => node.props?.ref === refs[2]).props.onClick(); },
    replay() { find(tree, (node) => node.props?.ref === refs[1]).props.onClick(); },
    reduceMotion() { motion.matches = true; listeners.get("change")(); },
  };
}

test("TV tunes once on mount, then clears static and its timer", () => {
  const scene = mount();
  assert.equal(scene.tuning, true);
  assert.equal(scene.timers.size, 1);
  scene.finish();
  assert.equal(scene.tuning, false);
  assert.equal(scene.timers.size, 0);
  scene.cleanup();
  assert.equal(scene.listeners.size, 0);
});

test("skip clears startup and restores keyboard focus outside the overlay", () => {
  const scene = mount();
  scene.skip();
  assert.equal(scene.tuning, false);
  assert.equal(scene.timers.size, 0);
  assert.equal(scene.focused, true);
  scene.cleanup();
});

test("retuning replaces rather than stacks timers; unmount cancels pending startup", () => {
  const scene = mount();
  scene.replay();
  scene.replay();
  assert.equal(scene.timers.size, 1);
  scene.cleanup();
  assert.equal(scene.timers.size, 0);
  assert.equal(scene.listeners.size, 0);
});

test("reduced motion bypasses intro and replay entirely", () => {
  const scene = mount(true);
  scene.replay();
  assert.equal(scene.tuning, false);
  assert.equal(scene.timers.size, 0);
  scene.cleanup();
});

test("enabling reduced motion during static immediately reveals the content", () => {
  const scene = mount();
  scene.reduceMotion();
  assert.equal(scene.tuning, false);
  assert.equal(scene.timers.size, 0);
  scene.cleanup();
});

test("ambient effects can be paused without interrupting the startup", () => {
  const scene = mount();
  scene.pauseEffects();
  assert.equal(scene.effectsPaused, true);
  assert.equal(scene.tuning, true);
  assert.equal(scene.timers.size, 1);
  scene.cleanup();
});

test("every experience has a local logo and a secure company website", () => {
  assert.equal(data.experiences.length, 4);
  for (const experience of data.experiences) {
    assert.ok(fs.existsSync(path.join(__dirname, "../public", experience.logo)));
    assert.match(experience.website, /^https:\/\//);
    assert.ok(["square", "bag", "wordmark"].includes(experience.logoStyle));
  }
});
