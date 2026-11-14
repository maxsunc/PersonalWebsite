const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const compiled = ts.transpileModule(
  fs.readFileSync(
    path.join(__dirname, "../src/components/LandingStory.tsx"),
    "utf8",
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  },
).outputText;

function mount(reducedMotion = false) {
  let effect;
  let top = 0;
  const frames = new Map();
  const timers = new Map();
  const listeners = new Map();
  const classes = new Set();
  let id = 0;
  const motion = {
    matches: reducedMotion,
    addEventListener: (_, fn) => listeners.set("motion", fn),
    removeEventListener: () => listeners.delete("motion"),
  };
  const window = {
    innerHeight: 1000,
    matchMedia: () => motion,
    requestAnimationFrame: (fn) => {
      frames.set(++id, fn);
      return id;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
    setTimeout: (fn, delay) => {
      assert.equal(delay, 3000);
      timers.set(++id, fn);
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
  };
  const jsx = (type, props) => ({ type, props });
  const exported = {};
  vm.runInNewContext(compiled, {
    exports: exported,
    window,
    require(name) {
      if (name === "react")
        return {
          useRef: (value) => ({ current: value }),
          useEffect: (fn) => {
            effect = fn;
          },
        };
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "lucide-react") return { ArrowDown: "arrow" };
      if (name === "@/components/AsciiPortrait")
        return { default: "portrait", __esModule: true };
      throw new Error(`Unexpected dependency ${name}`);
    },
  });
  const tree = exported.default({ links: [] });
  const stage = tree.props.children;
  const nav = { inert: true, setAttribute() {} };
  const arrow = { inert: true, setAttribute() {} };
  tree.props.ref.current = {
    offsetHeight: 1900,
    getBoundingClientRect: () => ({ top }),
  };
  stage.props.ref.current = {
    style: { setProperty() {} },
    classList: {
      add: (name) => classes.add(name),
      toggle: (name, on) => (on ? classes.add(name) : classes.delete(name)),
    },
  };
  stage.props.children.find((child) => child.type === "nav").props.ref.current =
    nav;
  stage.props.children.find(
    (child) => child.type === "button",
  ).props.ref.current = arrow;
  const cleanup = effect();
  const flush = () => {
    for (const [id, fn] of [...frames]) {
      frames.delete(id);
      fn();
    }
  };
  return {
    nav,
    arrow,
    classes,
    frames,
    timers,
    listeners,
    cleanup,
    finish() {
      for (const [id, fn] of [...timers]) {
        timers.delete(id);
        fn();
      }
      flush();
    },
    scrollTo(next) {
      top = next;
      listeners.get("scroll")();
      flush();
    },
  };
}

test("scroll cue waits until the TV and headline entrance is ready", () => {
  const scene = mount();
  assert.equal(scene.arrow.inert, true);
  assert.equal(scene.classes.has("is-intro-ready"), false);
  scene.finish();
  assert.equal(scene.arrow.inert, false);
  assert.equal(scene.classes.has("is-intro-ready"), true);
  scene.cleanup();
  assert.equal(scene.frames.size, 0);
  assert.equal(scene.listeners.size, 0);
});

test("early native scrolling skips startup and keeps navigation usable", () => {
  const scene = mount();
  scene.scrollTo(-150);
  assert.equal(scene.classes.has("intro-skipped"), true);
  assert.equal(scene.classes.has("is-intro-ready"), true);
  scene.scrollTo(-700);
  assert.equal(scene.nav.inert, false);
  assert.equal(scene.arrow.inert, true);
  scene.cleanup();
  assert.equal(scene.timers.size, 0);
});

test("reduced motion skips startup and reveals navigation immediately", () => {
  const scene = mount(true);
  assert.equal(scene.classes.has("intro-skipped"), true);
  assert.equal(scene.classes.has("is-intro-ready"), true);
  assert.equal(scene.nav.inert, false);
  assert.equal(scene.arrow.inert, true);
  scene.cleanup();
  assert.equal(scene.timers.size, 0);
});
