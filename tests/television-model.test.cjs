const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const vm = require("node:vm");

function compile(relative) {
  return ts.transpileModule(fs.readFileSync(path.join(__dirname, relative), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
}
const layout = {};
vm.runInNewContext(compile("../src/lib/television.ts"), { exports: layout });

function mountControls(overrides = {}) {
  const refs = [];
  const exports = {};
  const jsx = (type, props) => ({ type, props });
  vm.runInNewContext(compile("../src/components/TelevisionModel.tsx"), {
    exports,
    require(name) {
      if (name === "react") return {
        useRef: (current) => { const ref = { current }; refs.push(ref); return ref; },
        useState: (current) => [current, () => {}],
        useEffect: () => {},
      };
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "next/image") return { __esModule: true, default: "image" };
      if (name === "@/lib/television") return layout;
      throw new Error(`Unexpected dependency ${name}`);
    },
  });
  const actions = [];
  const tree = exports.default({ displayRef: { current: null }, onReady() {}, volume: 50, powered: true, frontView: false,
    onToggleView: () => actions.push("view"), onTogglePower: () => actions.push("power"), onVolumeChange: (value) => actions.push(["volume", value]), ...overrides });
  const presses = [];
  refs[1].current = (id, pressed) => presses.push([id, pressed]);
  const inputs = tree.props.children.find((node) => node.props?.className === "cabinet-inputs").props.children.flat();
  const controls = inputs.filter((node) => node.type === "button");
  const slider = inputs.find((node) => node.type === "input");
  const antennas = tree.props.children.find((node) => node.props?.className === "antenna-inputs").props.children;
  const adjustments = [];
  refs[2].current = (...args) => adjustments.push(args);
  return { controls, presses, antennas, adjustments, slider, actions };
}

test("physical view/power/channel controls are native, named buttons", () => {
  const { controls } = mountControls();
  assert.equal(controls.length, 4);
  for (const control of controls) {
    assert.equal(control.type, "button");
    assert.equal(control.props.type, "button");
    assert.ok(control.props["aria-label"]);
  }
});

test("VIEW and POWER trigger their assigned actions and expose their toggle states", () => {
  const { controls, actions } = mountControls();
  const view = controls.find((node) => node.props["data-control"] === "view").props;
  const power = controls.find((node) => node.props["data-control"] === "power").props;
  view.onClick(); power.onClick();
  assert.deepEqual(actions, ["view", "power"]);
  assert.equal(view["aria-label"], "Front view for reading");
  assert.equal(view["aria-pressed"], false);
  assert.equal(power["aria-label"], "Turn TV off");
  const active = mountControls({ frontView: true, powered: false });
  assert.equal(active.controls[2].props["aria-pressed"], true);
  assert.equal(active.controls[2].props["aria-label"], "Return to 3D view");
  assert.equal(active.controls[3].props["aria-label"], "Turn TV on");
});

test("volume uses a controlled native range, not volume buttons", () => {
  const { slider, controls, actions } = mountControls({ volume: 73 });
  assert.equal(slider.props.type, "range");
  assert.equal(slider.props["aria-label"], "Volume");
  assert.equal(slider.props.min, 0); assert.equal(slider.props.max, 100);
  assert.equal(slider.props.step, 1); assert.equal(slider.props.value, 73);
  slider.props.onChange({ currentTarget: { valueAsNumber: 82 } });
  assert.deepEqual(actions, [["volume", 82]]);
  assert.equal(controls.some((node) => node.props["data-control"].startsWith("volume")), false);
});

test("startup disables physical controls, and only power is busy during its transition", () => {
  const loading = mountControls({ controlsDisabled: true });
  assert.ok(loading.controls.every((node) => node.props.disabled));
  assert.equal(loading.slider.props.disabled, true);
  const busy = mountControls({ powerBusy: true });
  assert.equal(busy.controls.find((node) => node.props["data-control"] === "power").props.disabled, true);
  assert.equal(busy.controls.find((node) => node.props["data-control"] === "view").props.disabled, false);
});

test("pointer presses, releases, and cancellation reset the 3D feedback", () => {
  const { controls, presses } = mountControls();
  let captured;
  const props = controls[0].props;
  props.onPointerDown({ pointerId: 7, currentTarget: { setPointerCapture: (id) => { captured = id; } } });
  assert.equal(captured, 7);
  props.onPointerUp();
  props.onPointerCancel();
  props.onLostPointerCapture();
  assert.deepEqual(presses, [["channel-up", true], ["channel-up", false], ["channel-up", false], ["channel-up", false]]);
});

test("antenna dragging adjusts only the antenna and stops when released", () => {
  const { antennas, adjustments } = mountControls();
  assert.equal(antennas.length, 2);
  const props = antennas[0].props;
  assert.equal(props.role, "slider");
  const target = { focus() {}, setPointerCapture() {} };
  props.onPointerDown({ pointerId: 1, clientX: 100, clientY: 100, timeStamp: 0, currentTarget: target, preventDefault() {}, stopPropagation() {} });
  props.onPointerMove({ clientX: 120, clientY: 100, timeStamp: 20, stopPropagation() {} });
  assert.equal(adjustments.length, 1);
  assert.equal(adjustments[0][0], "left");
  assert.ok(Math.abs(adjustments[0][1]) > 0);
  props.onPointerUp();
  props.onPointerMove({ clientX: 140, clientY: 100, timeStamp: 40, stopPropagation() {} });
  assert.equal(adjustments.length, 1);
});

test("antenna arrow keys adjust reception and Home restores the original angle", () => {
  const { antennas, adjustments } = mountControls();
  const props = antennas[1].props;
  const event = (key) => ({ key, currentTarget: { getAttribute: () => "30" }, preventDefault() {}, stopPropagation() {} });
  props.onKeyDown(event("ArrowLeft"));
  props.onKeyDown(event("Home"));
  props.onKeyDown(event("Tab"));
  assert.equal(adjustments.length, 2);
  assert.equal(adjustments[0][0], "right");
  assert.equal(adjustments[0][1], 0.06);
  assert.equal(adjustments[1][1], 0);
  assert.equal(adjustments[1][3], true);
});

test("keyboard controls show the same feedback and reset when focus leaves", () => {
  const { controls, presses } = mountControls();
  const props = controls.find((node) => node.props["data-control"] === "power").props;
  props.onKeyDown({ key: "a" });
  assert.equal(presses.length, 0);
  props.onKeyDown({ key: "Enter" });
  props.onKeyUp();
  props.onKeyDown({ key: " " });
  props.onBlur();
  assert.deepEqual(presses, [["power", true], ["power", false], ["power", true], ["power", false]]);
});
