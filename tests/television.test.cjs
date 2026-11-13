const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function compile(relative) {
  return ts.transpileModule(fs.readFileSync(path.join(__dirname, relative), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
}
const data = {};
vm.runInNewContext(compile("../src/data/experience.ts"), { exports: data });
const layout = {};
vm.runInNewContext(compile("../src/lib/television.ts"), { exports: layout });

function startup({ ready = true, reduced = false } = {}) {
  let effect;
  let tuning = false;
  let id = 0;
  const timers = new Map();
  const listeners = new Map();
  const motion = {
    matches: reduced,
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
  };
  const exports = {};
  vm.runInNewContext(compile("../src/hooks/useTelevisionStartup.ts"), {
    exports,
    window: { matchMedia: () => motion },
    setTimeout: (fn, duration) => { assert.equal(duration, 2500); timers.set(++id, fn); return id; },
    clearTimeout: (id) => timers.delete(id),
    require: () => ({ useState: () => [false, (value) => { tuning = value; }], useEffect: (fn) => { effect = fn; } }),
  });
  exports.useTelevisionStartup(ready);
  const cleanup = effect();
  return {
    timers, listeners, cleanup,
    get tuning() { return tuning; },
    finish() { for (const fn of [...timers.values()]) fn(); },
    reduce() { motion.matches = true; listeners.get("change")(); },
  };
}

function walk(node, predicate) {
  if (!node || typeof node !== "object") return [];
  return [...(predicate(node) ? [node] : []), ...[node.props?.children].flat(Infinity).flatMap((child) => walk(child, predicate))];
}
function renderPortfolio() {
  const exports = {};
  const jsx = (type, props) => ({ type, props });
  vm.runInNewContext(compile("../src/components/TelevisionPortfolio.tsx"), {
    exports,
    require(name) {
      if (name === "react") return { useState: (initial) => [initial, () => {}], useRef: (current) => ({ current }), useCallback: (fn) => fn };
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "next/image") return { __esModule: true, default: "image" };
      if (name === "lucide-react") return { ArrowUpRight: "arrow", Pause: "pause", Play: "play" };
      if (name.startsWith("@/components/")) return { __esModule: true, default: name.split("/").pop() };
      if (name === "@/hooks/useTelevisionStartup") return { useTelevisionStartup: () => false };
      if (name === "@/data/experience") return data;
      if (name === "@/data/personal") return { personal: { email: "test@example.com", social: { github: "https://github.com/", linkedin: "https://linkedin.com/" } } };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return exports.default();
}

test("static runs for 2.5 seconds after the cabinet is ready", () => {
  const scene = startup();
  assert.equal(scene.tuning, true);
  assert.equal(scene.timers.size, 1);
  scene.finish();
  assert.equal(scene.tuning, false);
  assert.equal(scene.timers.size, 0);
  scene.cleanup();
  assert.equal(scene.listeners.size, 0);
});

test("model loading cannot consume the timed static sequence", () => {
  const scene = startup({ ready: false });
  assert.equal(scene.tuning, true);
  assert.equal(scene.timers.size, 0);
  scene.cleanup();
});

test("reduced motion bypasses static; a live change cancels it", () => {
  const reduced = startup({ reduced: true });
  assert.equal(reduced.tuning, false);
  assert.equal(reduced.timers.size, 0);
  reduced.cleanup();
  const scene = startup();
  scene.reduce();
  assert.equal(scene.tuning, false);
  assert.equal(scene.timers.size, 0);
  scene.cleanup();
});

test("unmount cancels the startup timer and motion listener", () => {
  const scene = startup();
  scene.cleanup();
  assert.equal(scene.timers.size, 0);
  assert.equal(scene.listeners.size, 0);
});

test("startup overlay contains only static, with no text, logo, or skip button", () => {
  const tree = renderPortfolio();
  const overlay = walk(tree, (node) => node.props?.className === "tuning-overlay")[0];
  assert.equal(overlay.props.children.type, "TelevisionStatic");
  assert.equal(walk(overlay, (node) => node.type === "button").length, 0);
  assert.equal(walk(tree, (node) => node.type === "h1").length, 1);
  assert.equal(walk(tree, (node) => node.props?.className === "experience-item").length, 4);
});

test("responsive camera keeps the entire cabinet and display inside the viewport", () => {
  for (const [width, height] of [[1440, 957], [1024, 681], [390, 446], [320, 366], [700, 465]]) {
    const view = layout.televisionViewport(width, height);
    assert.ok(view.viewWidth >= 14);
    assert.ok(view.viewHeight >= 9.75 * view.cabinetHeight);
    assert.ok(layout.TV_SCREEN.width < view.viewWidth);
    assert.ok(layout.TV_SCREEN.height * view.cabinetHeight < view.viewHeight);
  }
});

test("the real GLB has a separate mesh for every native button target", () => {
  const bytes = fs.readFileSync(path.join(__dirname, "../public/models/retro-tv.glb"));
  assert.equal(bytes.subarray(0, 4).toString(), "glTF");
  const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
  const names = new Set(json.nodes.map((node) => node.name));
  for (const control of layout.TV_CONTROLS) assert.ok(names.has(`Button_${control.id}`), control.id);
  assert.ok(names.has("ScreenGlass"));
  assert.ok(names.has("Cabinet"));
  assert.ok(fs.existsSync(path.join(__dirname, "../public/models/retro-tv-poster.webp")));
});

test("every experience retains its company logo, link, and month-to-month dates", () => {
  for (const experience of data.experiences) {
    assert.ok(fs.existsSync(path.join(__dirname, "../public", experience.logo)));
    assert.match(experience.website, /^https:\/\//);
    assert.match(experience.period, /^[A-Z][a-z]{2} — [A-Z][a-z]{2} 20\d{2}$/);
  }
});
