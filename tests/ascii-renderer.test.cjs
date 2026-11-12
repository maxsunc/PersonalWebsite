const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function compile(file) {
  return ts.transpileModule(
    fs.readFileSync(path.join(__dirname, "..", file), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    },
  ).outputText;
}
const math = {};
vm.runInNewContext(compile("src/lib/ascii-portrait.ts"), { exports: math });
const portrait = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../src/data/ascii-portrait.json"),
    "utf8",
  ),
);
const renderer = compile("src/components/AsciiPortrait.tsx");

function mount(reducedMotion = false) {
  const frames = new Map();
  const listeners = new Map();
  const refs = [];
  const counts = { snow: 0, glyphs: 0, blends: 0, snapshots: 0 };
  let index = 0,
    id = 0,
    now = 0,
    effect,
    paused = false,
    observer,
    skipped = false,
    created = 0;
  const motion = {
    matches: reducedMotion,
    addEventListener: (_, fn) => listeners.set("motion", fn),
    removeEventListener: () => listeners.delete("motion"),
  };
  function context(kind) {
    return {
      clearRect() {},
      setTransform() {},
      fillText(glyph, x, y) {
        assert.ok(Number.isFinite(x) && Number.isFinite(y));
        assert.ok(this.globalAlpha >= 0 && this.globalAlpha <= 1);
        counts.glyphs++;
      },
      createImageData: (width, height) => ({
        data: new Uint8ClampedArray(width * height * 4),
      }),
      putImageData() {},
      drawImage(source) {
        if (kind === "history") counts.snapshots++;
        else if (source.kind === "snow") counts.snow++;
        else if (source.kind === "history") counts.blends++;
      },
    };
  }
  const displayContext = context("display");
  const display = { kind: "display", getContext: () => displayContext };
  const root = {
    clientWidth: 287,
    clientHeight: 231,
    classList: { add() {} },
    closest: () => ({ classList: { contains: () => skipped } }),
    parentElement: {
      style: {
        setProperty(_, value) {
          assert.ok(+value >= 0.78 && +value <= 1);
        },
      },
    },
  };
  const document = {
    hidden: false,
    createElement() {
      const kind = created++ === 0 ? "history" : "snow";
      const ctx = context(kind);
      return { kind, getContext: () => ctx };
    },
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
  };
  class IntersectionObserver {
    constructor(fn) {
      observer = fn;
    }
    observe() {}
    disconnect() {}
  }
  class ResizeObserver {
    observe() {}
    disconnect() {}
  }
  const window = {
    devicePixelRatio: 3,
    IntersectionObserver,
    matchMedia: () => motion,
    requestAnimationFrame: (fn) => {
      frames.set(++id, fn);
      return id;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
  };
  const jsx = (type, props) => ({ type, props });
  const exported = {};
  vm.runInNewContext(renderer, {
    exports: exported,
    window,
    document,
    IntersectionObserver,
    ResizeObserver,
    performance: { now: () => now },
    require(name) {
      if (name === "react")
        return {
          useRef(value) {
            const i = index++;
            return refs[i] || (refs[i] = { current: value });
          },
          useState: () => [
            paused,
            (value) => {
              paused = value;
            },
          ],
          useEffect: (fn) => {
            effect ??= fn;
          },
        };
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "lucide-react") return { Pause: "pause", Play: "play" };
      if (name === "@/data/ascii-portrait.json") return portrait;
      if (name === "@/lib/ascii-portrait") return math;
      if (name === "@/components/TelevisionSketch")
        return { default: "sketch", __esModule: true };
      throw new Error(`Unexpected dependency ${name}`);
    },
  });
  const render = () => {
    index = 0;
    return exported.default();
  };
  let tree = render();
  const children = tree.props.children.props.children;
  const screen = children.find(
    (child) => child.props.className === "ascii-portrait",
  );
  screen.props.ref.current = root;
  screen.props.children.find(
    (child) => child.type === "canvas",
  ).props.ref.current = display;
  const cleanup = effect();
  return {
    counts,
    frames,
    display,
    visible(value) {
      observer([{ isIntersecting: value }]);
    },
    skip() {
      skipped = true;
    },
    step(time) {
      now = time;
      const [id, fn] = frames.entries().next().value;
      frames.delete(id);
      fn(time);
    },
    toggle() {
      tree.props.children.props.children
        .find((child) => child.type === "button")
        .props.onClick();
      tree = render();
    },
    hidden(value) {
      document.hidden = value;
      listeners.get("visibilitychange")();
    },
    cleanup() {
      cleanup();
      assert.equal(frames.size, 0);
      assert.equal(listeners.size, 0);
    },
  };
}

test("renderer starts with snow, crossfades, and only retains tuned portrait history", () => {
  const scene = mount();
  assert.ok(scene.counts.snow > 0);
  assert.equal(scene.counts.glyphs, 0);
  assert.equal(scene.display.width, 574); // DPR is capped at two.
  scene.visible(true);
  scene.step(1500);
  assert.ok(scene.counts.glyphs > 0);
  assert.equal(scene.counts.snapshots, 0);
  const noiseFrames = scene.counts.snow;
  scene.step(2200);
  scene.step(2300);
  assert.equal(scene.counts.snow, noiseFrames);
  assert.ok(scene.counts.snapshots > 0 && scene.counts.blends > 0);
  scene.cleanup();
});

test("pausing during startup shows the face and resuming never replays snow", () => {
  const scene = mount();
  scene.visible(true);
  scene.step(100);
  scene.toggle();
  assert.equal(scene.frames.size, 0);
  assert.ok(scene.counts.glyphs > 0);
  const noiseFrames = scene.counts.snow;
  scene.toggle();
  scene.step(200);
  assert.equal(scene.counts.snow, noiseFrames);
  scene.cleanup();
});

test("early scroll bypasses snow and hidden/offscreen playback leaves no active frames", () => {
  const scene = mount();
  scene.visible(true);
  scene.skip();
  const noiseFrames = scene.counts.snow;
  scene.step(100);
  assert.equal(scene.counts.snow, noiseFrames);
  assert.ok(scene.counts.glyphs > 0);
  scene.hidden(true);
  assert.equal(scene.frames.size, 0);
  scene.hidden(false);
  scene.step(3000);
  assert.equal(scene.counts.snow, noiseFrames);
  scene.visible(false);
  assert.equal(scene.frames.size, 0);
  scene.cleanup();
});

test("reduced motion draws the face immediately without snow or animation", () => {
  const scene = mount(true);
  scene.visible(true);
  assert.equal(scene.counts.snow, 0);
  assert.ok(scene.counts.glyphs > 0);
  assert.equal(scene.frames.size, 0);
  scene.cleanup();
});
