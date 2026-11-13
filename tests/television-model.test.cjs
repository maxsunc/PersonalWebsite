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

function mountControls() {
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
  const tree = exports.default({ displayRef: { current: null }, onReady() {} });
  const presses = [];
  refs[1].current = (id, pressed) => presses.push([id, pressed]);
  const controls = tree.props.children.find((node) => node.props?.className === "cabinet-inputs").props.children;
  return { controls, presses };
}

test("all six physical controls are native, named buttons, not invisible canvas-only interactions", () => {
  const { controls } = mountControls();
  assert.equal(controls.length, 6);
  for (const control of controls) {
    assert.equal(control.type, "button");
    assert.equal(control.props.type, "button");
    assert.match(control.props["aria-label"], /not assigned yet/);
  }
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

test("keyboard controls show the same feedback and reset when focus leaves", () => {
  const { controls, presses } = mountControls();
  const props = controls[5].props;
  props.onKeyDown({ key: "a" });
  assert.equal(presses.length, 0);
  props.onKeyDown({ key: "Enter" });
  props.onKeyUp();
  props.onKeyDown({ key: " " });
  props.onBlur();
  assert.deepEqual(presses, [["power", true], ["power", false], ["power", true], ["power", false]]);
});
