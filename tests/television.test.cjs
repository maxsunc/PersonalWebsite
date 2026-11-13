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
const projectData = {};
vm.runInNewContext(compile("../src/data/projects.ts"), { exports: projectData });

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
function renderPortfolio({ ready = false, tuning = false, front = false, volume = 50, phase = "on", channel = 0, switching = false, onChannel = () => {}, onChannelEnabled = () => {}, onToggle = () => {}, onVolume = () => {}, onPower = () => {} } = {}) {
  const exports = {};
  let stateIndex = 0;
  const jsx = (type, props) => ({ type, props });
  vm.runInNewContext(compile("../src/components/TelevisionPortfolio.tsx"), {
    exports,
    require(name) {
      if (name === "react") return {
        useState: () => { const index = stateIndex++; return [index === 0 ? ready : index === 1 ? front : volume, (value) => { if (index === 1) onToggle(typeof value === "function" ? value(front) : value); if (index === 2) onVolume(value); }]; },
        useRef: (current) => ({ current }), useCallback: (fn) => fn,
      };
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "next/image") return { __esModule: true, default: "image" };
      if (name === "lucide-react") return { ArrowUpRight: "arrow", Maximize2: "maximize", Minimize2: "minimize" };
      if (name.startsWith("@/components/")) return { __esModule: true, default: name.split("/").pop() };
      if (name === "@/lib/television") return layout;
      if (name === "@/hooks/useTelevisionPower") return { TV_POWER_OFF_DURATION: 180, TV_POWER_ON_DURATION: 500,
        useTelevisionPower: () => ({ phase, powered: phase === "on" || phase === "turning-on", transitioning: phase === "turning-off" || phase === "turning-on", togglePower: onPower }) };
      if (name === "@/hooks/useTelevisionStartup") return { useTelevisionStartup: () => tuning };
      if (name === "@/hooks/useTelevisionChannels") return { useTelevisionChannels: (enabled) => { onChannelEnabled(enabled); return { channel, switching, changeChannel: onChannel }; } };
      if (name === "@/hooks/useAntennaInterference") return { useAntennaInterference: () => ({ strength: 0, disturb() {} }) };
      if (name === "@/data/experience") return data;
      if (name === "@/data/projects") return projectData;
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

test("fresh reload hides the entire unprojected stage, then reveals it without a resize or fade", () => {
  const loading = renderPortfolio({ ready: false });
  assert.match(loading.props.className, /\bis-loading\b/);
  const css = fs.readFileSync(path.join(__dirname, "../src/app/globals.css"), "utf8");
  const gate = css.split(".is-loading .television-stage {")[1].split("}")[0];
  assert.match(gate, /opacity: 0/);
  assert.match(gate, /pointer-events: none/);
  assert.doesNotMatch(gate, /display: none|transition|animation/); // preserve geometry for the first draw
  assert.doesNotMatch(renderPortfolio({ ready: true, tuning: true }).props.className, /\bis-loading\b/);
  const noScript = walk(loading, (node) => node.type === "noscript")[0].props.children.props.children;
  assert.match(noScript, /\.is-loading \.television-stage\{opacity:1;pointer-events:auto\}/);
});

test("front view is a physical TV control, with no floating toolbar", () => {
  const tree = renderPortfolio();
  assert.equal(walk(tree, (node) => node.props?.className === "view-controls").length, 0);
  const model = walk(tree, (node) => node.type === "TelevisionModel")[0];
  assert.equal(typeof model.props.onToggleView, "function");
  const display = walk(tree, (node) => node.props?.className === "tv-glass")[0];
  assert.equal(walk(display, (node) => node.type === "button").length, 0);
});

test("physical controls are wired to view, volume, and power state", () => {
  let toggled, volume, power = 0;
  const tree = renderPortfolio({ ready: true, onToggle: (value) => { toggled = value; }, onVolume: (value) => { volume = value; }, onPower: () => { power++; } });
  const model = walk(tree, (node) => node.type === "TelevisionModel")[0].props;
  assert.equal(model.controlsDisabled, false);
  assert.equal(model.volume, 50);
  model.onToggleView(); assert.equal(toggled, true);
  model.onVolumeChange(82); assert.equal(volume, 82);
  model.onVolumeChange(300); assert.equal(volume, 100);
  model.onTogglePower(); assert.equal(power, 1);
  const front = walk(renderPortfolio({ ready: true, front: true }), (node) => node.type === "TelevisionModel")[0].props;
  assert.equal(front.frontView, true);
  assert.equal(front.controlsDisabled, false);
});

test("front view retains the same animated ambient static as normal view", () => {
  for (const front of [false, true]) {
    const tree = renderPortfolio({ ready: true, front });
    const noise = walk(tree, (node) => node.type === "TelevisionNoise")[0];
    assert.equal(noise.props.paused, false);
    assert.equal(walk(tree, (node) => node.props?.className === "tv-tracking").length, 1);
    assert.equal(walk(tree, (node) => node.props?.className === "tv-scanbeam").length, 1);
  }
});

test("physical controls cannot skip static-only startup", () => {
  for (const options of [{ ready: false }, { ready: true, tuning: true }]) {
    const tree = renderPortfolio(options);
    assert.equal(walk(tree, (node) => node.type === "TelevisionModel")[0].props.controlsDisabled, true);
  }
});

test("server-rendered no-JavaScript fallback keeps the contact links accessible", () => {
  const tree = renderPortfolio({ ready: false, tuning: false });
  assert.equal(walk(tree, (node) => node.props?.className === "tv-broadcast")[0].props["aria-hidden"], false);
  assert.equal(walk(tree, (node) => node.props?.className === "tv-picture")[0].props.inert, false);
  assert.ok(walk(tree, (node) => node.type === "noscript").length);
});

test("power hides only the broadcast, disables its links/effects, and preserves volume/view", () => {
  for (const phase of ["turning-off", "off", "turning-on"]) {
    const tree = renderPortfolio({ ready: true, phase, front: true, volume: 78 });
    assert.equal(tree.props["data-power"], phase);
    assert.equal(tree.props.style["--power-duration"], phase === "turning-off" ? "180ms" : "500ms");
    const broadcast = walk(tree, (node) => node.props?.className === "tv-broadcast")[0];
    assert.equal(broadcast.props["aria-hidden"], true);
    assert.equal(walk(broadcast, (node) => node.props?.className === "tv-picture")[0].props.inert, true);
    assert.equal(walk(broadcast, (node) => node.type === "TelevisionNoise")[0].props.paused, true);
    const tuning = walk(broadcast, (node) => node.props?.className === "tuning-overlay")[0];
    assert.equal(tuning.props.children.props.active, phase === "turning-on");
    const model = walk(tree, (node) => node.type === "TelevisionModel")[0].props;
    assert.equal(model.controlsDisabled, false);
    assert.equal(model.frontView, true); assert.equal(model.volume, 78);
    assert.equal(model.powered, phase === "turning-on");
    assert.equal(model.powerBusy, phase !== "off");
  }
});

test("About channel shows the local profile picture, greeting, and concise interests", () => {
  const tree = renderPortfolio({ ready: true, channel: 1 });
  assert.equal(tree.props["data-channel"], "about");
  const photo = walk(tree, (node) => node.props?.className === "about-photo")[0];
  assert.equal(photo.props.alt, "Max Sun");
  assert.ok(fs.existsSync(path.join(__dirname, "../public", photo.props.src)));
  assert.ok(fs.readFileSync(path.join(__dirname, "../scripts/create-tv-channel-images.cjs"), "utf8").includes('["pfp2.png", "profile", 480, 480]'));
  assert.match(walk(tree, (node) => node.type === "h1")[0].props.children[0], /Hi, I’m Max/);
  const bio = walk(tree, (node) => node.props?.className === "about-copy")[0].props.children[1].props.children;
  assert.match(bio, /good food, making games, and watching anime/);
  assert.ok(bio.length < 150);
  assert.equal(walk(tree, (node) => node.props?.className === "experience-item").length, 0);
});

test("Projects channel fits three concise, linked projects with local thumbnails on one screen", () => {
  const tree = renderPortfolio({ ready: true, channel: 2 });
  assert.equal(tree.props["data-channel"], "projects");
  const cards = walk(tree, (node) => node.props?.className === "tv-project");
  assert.equal(cards.length, 3);
  for (const card of cards) {
    const photo = walk(card, (node) => node.type === "image")[0];
    assert.ok(fs.existsSync(path.join(__dirname, "../public", photo.props.src)));
    const link = walk(card, (node) => node.type === "a")[0].props;
    assert.match(link.href, /^https:\/\//);
    assert.equal(link.rel, "noopener noreferrer");
    const description = walk(card, (node) => node.type === "p")[0].props.children;
    assert.ok(description.length < 100);
  }
});

test("channel changes show full-frame static, pause noise/interference, and make picture links inert", () => {
  const actions = [];
  const tree = renderPortfolio({ ready: true, switching: true, onChannel: (direction) => actions.push(direction) });
  assert.match(tree.props.className, /\bis-tuning\b/);
  assert.equal(walk(tree, (node) => node.props?.className === "tv-picture")[0].props.inert, true);
  assert.equal(walk(tree, (node) => node.type === "TelevisionNoise")[0].props.paused, true);
  const overlay = walk(tree, (node) => node.props?.className === "tuning-overlay")[0];
  assert.equal(overlay.props.children.props.active, true);
  assert.equal(walk(tree, (node) => node.props?.role === "status")[0].props.children, "");
  const model = walk(tree, (node) => node.type === "TelevisionModel")[0].props;
  model.onChannelChange(1); model.onChannelChange(-1);
  assert.deepEqual(actions, [1, -1]);
  assert.equal(model.controlsDisabled, false); // rapid taps can select another destination
});

test("channels cannot interrupt initial startup or a power transition", () => {
  for (const options of [{ ready: false }, { ready: true, tuning: true }, ...["off", "turning-off", "turning-on"].map((phase) => ({ ready: true, phase }))]) {
    let enabled;
    renderPortfolio({ ...options, onChannelEnabled: (value) => { enabled = value; } });
    assert.equal(enabled, false);
  }
  const tree = renderPortfolio({ ready: true, channel: 2 });
  assert.equal(walk(tree, (node) => node.props?.role === "status")[0].props.children, "Channel 3: Projects");
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
  assert.ok(names.has("VolumeTrack"));
  assert.ok(names.has("VolumeThumb"));
  assert.ok(!names.has("Button_volume-up"));
  assert.ok(!names.has("Button_volume-down"));
  assert.ok(!names.has("Button_menu"));
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
