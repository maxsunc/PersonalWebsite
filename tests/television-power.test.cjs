const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src/hooks/useTelevisionPower.ts"), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
function mount({ reduced = false, hidden = false } = {}) {
  let phase = "on", effect, id = 0;
  const timers = new Map(), listeners = new Map();
  const motion = { matches: reduced, addEventListener: (_, fn) => listeners.set("motion", fn), removeEventListener: () => listeners.delete("motion") };
  const document = { hidden, addEventListener: (_, fn) => listeners.set("visibility", fn), removeEventListener: () => listeners.delete("visibility") };
  const exports = {};
  vm.runInNewContext(code, {
    exports, document, window: { matchMedia: () => motion },
    setTimeout: (fn, delay) => { timers.set(++id, { fn, delay }); return id; },
    clearTimeout: (id) => timers.delete(id),
    require: () => ({ useRef: (current) => ({ current }), useState: () => [phase, (value) => { phase = value; }], useCallback: (fn) => fn, useEffect: (fn) => { effect = fn; } }),
  });
  const hook = exports.useTelevisionPower();
  const cleanup = effect();
  return {
    toggle: hook.togglePower, timers, listeners, cleanup,
    get phase() { return phase; },
    finish() { for (const [id, { fn }] of [...timers]) { timers.delete(id); fn(); } },
    hide() { document.hidden = true; listeners.get("visibility")(); },
    reduce() { motion.matches = true; listeners.get("motion")(); },
  };
}

test("power collapses the picture once, stays off, and powers back on", () => {
  const tv = mount();
  assert.equal(tv.phase, "on");
  tv.toggle();
  assert.equal(tv.phase, "turning-off");
  assert.equal([...tv.timers.values()][0].delay, 180);
  tv.toggle(); tv.toggle();
  assert.equal(tv.timers.size, 1); // no repeated flashes or overlapping timers
  tv.finish();
  assert.equal(tv.phase, "off");
  assert.equal(tv.timers.size, 0);
  tv.toggle();
  assert.equal(tv.phase, "turning-on");
  assert.equal([...tv.timers.values()][0].delay, 500);
  tv.toggle();
  assert.equal(tv.timers.size, 1);
  tv.finish();
  assert.equal(tv.phase, "on");
  tv.cleanup();
});

test("reduced motion and hidden tabs switch power without flashing", () => {
  for (const options of [{ reduced: true }, { hidden: true }]) {
    const tv = mount(options);
    tv.toggle(); assert.equal(tv.phase, "off");
    tv.toggle(); assert.equal(tv.phase, "on");
    assert.equal(tv.timers.size, 0);
    tv.cleanup();
  }
});

test("live visibility/motion changes settle either power transition immediately", () => {
  for (const event of ["hide", "reduce"]) {
    for (const turningOn of [false, true]) {
      const tv = mount();
      tv.toggle();
      if (turningOn) { tv.finish(); tv.toggle(); }
      tv[event]();
      assert.equal(tv.phase, turningOn ? "on" : "off");
      assert.equal(tv.timers.size, 0);
      tv.cleanup();
    }
  }
});

test("shutdown snaps through a line and dot instead of smoothly squeezing the picture", () => {
  const css = fs.readFileSync(path.join(__dirname, "../src/app/globals.css"), "utf8");
  for (const selector of ["tv-broadcast", "crt-flash"]) {
    const rule = css.split(`.tv-room[data-power="turning-off"] .${selector} {`)[1].split("}")[0];
    assert.match(rule, /steps\(1, end\)/);
    assert.doesNotMatch(rule, /ease/);
  }
  const frames = css.split("@keyframes crt-power-off {")[1].split("\n}")[0];
  assert.match(frames, /10% \{ transform: scale\(1, 0\.006\)/);
  assert.match(frames, /65% \{ transform: scale\(0\.014, 0\.006\)/);
  assert.match(frames, /100% .*opacity: 0/);
});

test("power-on starts at full size with the intro static, never a scale-up animation", () => {
  const css = fs.readFileSync(path.join(__dirname, "../src/app/globals.css"), "utf8");
  const rule = css.split('.tv-room[data-power="turning-on"] .tv-broadcast {')[1].split("}")[0];
  assert.match(rule, /animation: none/);
  assert.match(rule, /transform: none/);
  assert.match(rule, /opacity: 1/);
  assert.match(rule, /visibility: visible/);
  assert.doesNotMatch(css, /@keyframes crt-power-on/);
  const overlay = css.split(".is-loading .tuning-overlay, .is-tuning .tuning-overlay {")[1].split("}")[0];
  assert.match(overlay, /opacity: 1/);
  assert.match(overlay, /transition: none/); // static appears immediately, like the intro
});

test("unmount clears the power timer and every listener", () => {
  const tv = mount(); tv.toggle(); tv.cleanup();
  assert.equal(tv.timers.size, 0);
  assert.equal(tv.listeners.size, 0);
});
