const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('src/hooks/useTelevisionChannelSound.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
function mount(enabled = true) {
  const exports = {}, effects = [], sounds = [], changes = [], timers = new Map();
  let next = 0;
  vm.runInNewContext(source, { exports,
    require(name) {
      if (name === 'react') return { useRef: (current) => ({ current }), useCallback: fn => fn, useEffect: fn => effects.push(fn) };
      if (name.includes('useTelevisionChannels')) return { CHANNEL_STATIC_DURATION: 350 };
      if (name.includes('television')) return { clampTVVolume: v => Math.max(0, Math.min(100, v)) };
      throw new Error(name);
    },
    Audio: function(src) { this.src = src; this.plays = 0; this.pauses = 0; this.play = () => { this.plays++; return Promise.resolve(); }; this.pause = () => this.pauses++; sounds.push(this); },
    setTimeout: (fn, ms) => { const id = ++next; timers.set(id, { fn, ms }); return id; },
    clearTimeout: id => timers.delete(id),
  });
  const change = exports.useTelevisionChannelSound(enabled, 35, d => changes.push(d));
  const cleanups = effects.map(fn => fn());
  return { change, sounds, changes, timers, cleanup: () => cleanups.forEach(fn => fn?.()) };
}
test('channel static plays at TV volume, restarts on rapid tuning, and stops after 350ms', () => {
  const tv = mount();
  tv.change(1);
  assert.deepEqual(tv.changes, [1]);
  const audio = tv.sounds[0];
  assert.equal(audio.src, '/sfx/staticSfx.mp3'); assert.equal(audio.volume, 0.35);
  audio.currentTime = 0.2;
  tv.change(-1);
  assert.equal(tv.sounds.length, 1); assert.equal(audio.plays, 2); assert.equal(audio.currentTime, 0);
  assert.equal(tv.timers.size, 1);
  const timer = [...tv.timers.values()][0]; assert.equal(timer.ms, 350);
  timer.fn(); assert.equal(tv.timers.size, 0); assert.ok(audio.pauses >= 2);
  tv.cleanup();
});
test('disabled controls do not play audio; unmount stops sound and clears timers', () => {
  const off = mount(false); off.change(1); assert.equal(off.sounds.length, 0); assert.equal(off.changes.length, 0); off.cleanup();
  const tv = mount(); tv.change(1); tv.cleanup();
  assert.equal(tv.timers.size, 0); assert.ok(tv.sounds[0].pauses > 0);
});
