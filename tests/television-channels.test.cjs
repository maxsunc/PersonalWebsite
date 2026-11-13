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
const code = compile("../src/hooks/useTelevisionChannels.ts");

function mount({ enabled = true, reduced = false, hidden = false } = {}) {
  const states = [], refs = [], effects = [], callbacks = [], pending = [];
  let si, ri, ei, ci, dirty, hook, time = 0, id = 0;
  const timers = new Map(), listeners = new Map();
  const motion = { matches: reduced, addEventListener: (_, fn) => listeners.set("motion", fn), removeEventListener: () => listeners.delete("motion") };
  const document = { hidden, addEventListener: (_, fn) => listeners.set("visibility", fn), removeEventListener: () => listeners.delete("visibility") };
  const changed = (a, b) => !a || a.some((value, index) => value !== b[index]);
  const React = {
    useState(initial) {
      const i = si++;
      if (!(i in states)) states[i] = initial;
      return [states[i], (value) => {
        const next = typeof value === "function" ? value(states[i]) : value;
        if (!Object.is(next, states[i])) { states[i] = next; dirty = true; }
      }];
    },
    useRef(current) { const i = ri++; return refs[i] ??= { current }; },
    useCallback(fn, deps) { const i = ci++; if (changed(callbacks[i]?.deps, deps)) callbacks[i] = { fn, deps }; return callbacks[i].fn; },
    useEffect(fn, deps) {
      const i = ei++;
      if (changed(effects[i]?.deps, deps)) {
        const cleanup = effects[i]?.cleanup;
        effects[i] = { deps };
        pending.push(() => { cleanup?.(); effects[i].cleanup = fn(); });
      }
    },
  };
  const exports = {};
  vm.runInNewContext(code, {
    exports, document, window: { matchMedia: () => motion },
    setTimeout: (fn, delay) => { timers.set(++id, { fn, at: time + delay }); return id; },
    clearTimeout: (id) => timers.delete(id),
    require: (name) => name === "react" ? React : layout,
  });
  function render() {
    do {
      dirty = false; si = ri = ei = ci = 0;
      hook = exports.useTelevisionChannels(enabled);
      for (const fn of pending.splice(0)) fn();
    } while (dirty);
  }
  render();
  return {
    timers, listeners,
    get channel() { return hook.channel; }, get switching() { return hook.switching; },
    change(direction) { hook.changeChannel(direction); render(); },
    advance(ms) { time += ms; for (const [id, timer] of [...timers]) if (timer.at <= time) { timers.delete(id); timer.fn(); } render(); },
    enable(value) { enabled = value; render(); },
    hide() { document.hidden = true; listeners.get("visibility")(); render(); },
    reduce() { motion.matches = true; listeners.get("motion")(); render(); },
    cleanup() { for (const effect of effects) effect.cleanup?.(); },
  };
}

test("channel + and − cycle circularly through Portfolio, About, Projects, FNAF in both directions", () => {
  const tv = mount();
  assert.equal(tv.channel, 0);
  for (const expected of [1, 2, 3, 0, 1]) { tv.change(1); tv.advance(350); assert.equal(tv.channel, expected); }
  for (const expected of [0, 3, 2, 1, 0]) { tv.change(-1); tv.advance(350); assert.equal(tv.channel, expected); }
  assert.equal(layout.TV_CHANNELS.length, 4);
  tv.cleanup();
});

test("switching immediately shows snow, but keeps the old picture until 350ms completes", () => {
  const tv = mount();
  tv.change(1);
  assert.equal(tv.switching, true); assert.equal(tv.channel, 0);
  tv.advance(349); assert.equal(tv.channel, 0); assert.equal(tv.switching, true);
  tv.advance(1); assert.equal(tv.channel, 1); assert.equal(tv.switching, false);
  assert.equal(tv.timers.size, 0);
  tv.cleanup();
});

test("rapid presses accumulate from the requested channel and restart one static interval", () => {
  const tv = mount();
  tv.change(1); tv.advance(100); tv.change(1);
  assert.equal(tv.timers.size, 1);
  tv.advance(250); assert.equal(tv.channel, 0); assert.equal(tv.switching, true);
  tv.advance(100); assert.equal(tv.channel, 2); assert.equal(tv.switching, false);
  tv.change(1); tv.change(-1); tv.advance(350); assert.equal(tv.channel, 2);
  tv.cleanup();
});

test("startup/off ignores channel presses; powering off cancels pending tuning and remembers the last channel", () => {
  const tv = mount({ enabled: false });
  tv.change(1); assert.equal(tv.timers.size, 0); assert.equal(tv.channel, 0);
  tv.enable(true); tv.change(1); tv.advance(350); assert.equal(tv.channel, 1);
  tv.change(1); tv.enable(false);
  assert.equal(tv.switching, false); assert.equal(tv.timers.size, 0);
  tv.advance(1000); assert.equal(tv.channel, 1);
  tv.enable(true); tv.change(1); tv.advance(350); assert.equal(tv.channel, 2);
  tv.cleanup();
});

test("reduced motion and hidden tabs switch without snow or deferred timers", () => {
  for (const options of [{ reduced: true }, { hidden: true }]) {
    const tv = mount(options);
    tv.change(-1); assert.equal(tv.channel, 3); assert.equal(tv.switching, false);
    assert.equal(tv.timers.size, 0); tv.cleanup();
  }
  for (const event of ["hide", "reduce"]) {
    const tv = mount(); tv.change(1); tv[event]();
    assert.equal(tv.channel, 1); assert.equal(tv.switching, false);
    assert.equal(tv.timers.size, 0); tv.cleanup();
  }
});

test("invalid directions do nothing and unmount removes the tuning timer/listeners", () => {
  const tv = mount();
  for (const direction of [0, 2, NaN, undefined]) tv.change(direction);
  assert.equal(tv.timers.size, 0); assert.equal(tv.channel, 0);
  tv.change(1); tv.cleanup();
  assert.equal(tv.timers.size, 0); assert.equal(tv.listeners.size, 0);
});
