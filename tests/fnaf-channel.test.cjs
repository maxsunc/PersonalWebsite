const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const runtime = fs.readFileSync('public/games/fnaf1/src/Runtime.js', 'utf8');
function method(name) {
  const match = runtime.match(new RegExp(name + ':\\s*function \\(([^)]*)\\)\\s*\\{([\\s\\S]*?)\\n\\t\\t\\},'));
  assert.ok(match, name);
  return vm.runInNewContext('(function (' + match[1] + ') {' + match[2] + '})', { window: { scrollX: 0, scrollY: 0 } });
}
function app(scale = 1) {
  return { canvas: { width: 1280 * scale, height: 720 * scale,
    getBoundingClientRect: () => ({ left: 0, top: 60, right: 640, bottom: 420, width: 640, height: 360 }) },
    scaleX: scale, scaleY: scale, xMouseOffset: 0, yMouseOffset: 0, run: null, subApps: [], touchable: true };
}
test('FNAF mouse coordinates follow CSS-scaled, letterboxed canvas, including zero coordinates', () => {
  for (const scale of [1, 0.5, 2]) {
    const game = app(scale);
    method('mouseMove').call(game, { clientX: 320, clientY: 240 }, game.canvas, false);
    assert.equal(game.mouseX, 640); assert.equal(game.mouseY, 360);
    method('mouseMove').call(game, { clientX: 0, clientY: 60 }, game.canvas, false);
    assert.equal(game.mouseX, 0); assert.equal(game.mouseY, 0);
  }
});
test('FNAF touch and synthetic mouse-touch coordinates match the displayed canvas', () => {
  for (const scale of [1, 0.5, 2]) {
    for (const touch of [{ clientX: 320, clientY: 240 }, { pageX: 320, pageY: 240 }]) {
      assert.equal(method('getTouchX').call(app(scale), touch), 640);
      assert.equal(method('getTouchY').call(app(scale), touch), 360);
    }
  }
});
test('TV master volume scales both audio backends and cannot be overridden by game volume', () => {
  const scope = { tvVolume: 0.5 };
  const match = runtime.match(/setVolume: function \(v\)\s*\{([\s\S]*?)\n\t\t\},/);
  const setVolume = vm.runInNewContext('(function(v) {' + match[1] + '})', { __scope: scope });
  for (const sound of [{ sound: {} }, { source: {}, gain: { gain: {} } }, { source: { gain: {} } }]) {
    const output = () => sound.sound ? sound.sound.volume : sound.gain ? sound.gain.gain.value : sound.source.gain.value;
    scope.tvVolume = 0.5;
    setVolume.call(sound, 80); assert.equal(output(), 0.4);
    scope.tvVolume = 0;
    setVolume.call(sound, 100); assert.equal(output(), 0);
    scope.tvVolume = 0.25;
    setVolume.call(sound, sound.volume); assert.equal(output(), 0.25);
  }
});

test('image preloader uses neutral progress bar without skipping loading or sound activation', () => {
  assert.match(runtime, /this\.preloader = this\.preloaderType == 0 \? new CPreloaderDefault\(this\) : new CPreloaderFrame\(this\)/);
});
