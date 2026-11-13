const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src/lib/television.ts"), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const layout = {};
vm.runInNewContext(code, { exports: layout });

test("orbit allows complete turns and views of the back without flipping at the poles", () => {
  assert.ok(layout.TV_REST_POSE.yaw > 0.2);
  const extreme = layout.orbitTVPose(100, -100);
  assert.equal(extreme.yaw, 100);
  assert.ok(extreme.pitch > -Math.PI / 2);
  assert.equal(layout.orbitTVPose(Math.PI, 0).yaw, Math.PI);
  assert.equal(layout.isTVScreenVisible(0, 0), true);
  assert.equal(layout.isTVScreenVisible(Math.PI, 0), false);
  assert.equal(layout.isTVScreenVisible(Math.PI / 2, 0), true);
  assert.equal(layout.isTVScreenVisible(Math.PI * 2, 0), true);
});

test("screen stays on at shallow and exact side angles, including steep pitch and multiple turns", () => {
  for (const pitch of [0, 0.14, 1.3, Math.PI / 2 - 0.04]) {
    for (const turns of [-14, 0, 14]) {
      for (const degrees of [-90, -89.99, -85, 0, 85, 89.99, 90]) {
        assert.equal(layout.isTVScreenVisible(turns * Math.PI * 2 + degrees * Math.PI / 180, pitch), true);
      }
      for (const degrees of [-180, -95, -90.01, 90.01, 95, 180]) {
        assert.equal(layout.isTVScreenVisible(turns * Math.PI * 2 + degrees * Math.PI / 180, pitch), false);
      }
    }
  }
});

test("view transitions ease at both ends and take the shortest arc after multiple turns", () => {
  assert.equal(layout.tvViewProgress(0), 0);
  assert.equal(layout.tvViewProgress(layout.TV_VIEW_DURATION), 1);
  assert.equal(layout.tvViewProgress(layout.TV_VIEW_DURATION / 2), 0.5);
  assert.ok(layout.tvViewProgress(16) < 0.001);
  assert.ok(layout.tvViewProgress(500) > layout.tvViewProgress(200));
  const manyTurns = Math.PI * 14 + 0.28;
  const front = layout.nearestTVYaw(manyTurns, 0);
  assert.ok(Math.abs(front - manyTurns) < Math.PI);
  assert.ok(Math.abs(Math.sin(front)) < 1e-10);
  assert.ok(Math.abs(layout.nearestTVYaw(front, manyTurns) - manyTurns) < 1e-10);
});

test("front view uses a closer, body-centered composition for reading", () => {
  const orbit = layout.televisionViewport(1000, 800);
  const front = layout.televisionViewport(1000, 800, true);
  assert.ok(front.viewWidth < orbit.viewWidth);
  assert.ok(front.viewHeight < orbit.viewHeight);
  assert.equal(layout.televisionViewport(1200, 1600).cabinetHeight, 1);
  assert.equal(layout.televisionViewport(390, 260).cabinetHeight, 1.72);
});

test("volume is bounded and maps precisely to the physical slider travel", () => {
  assert.equal(layout.clampTVVolume(-20), 0);
  assert.equal(layout.clampTVVolume(200), 100);
  assert.equal(layout.clampTVVolume(NaN), 50);
  assert.equal(layout.televisionVolumePosition(0), layout.TV_VOLUME.minX);
  assert.equal(layout.televisionVolumePosition(100), layout.TV_VOLUME.maxX);
  assert.ok(Math.abs(layout.televisionVolumePosition(50) - layout.TV_VOLUME.x) < 1e-10);
});

test("antenna joints have hard stops; moving against a stop creates no interference", () => {
  assert.equal(layout.antennaAngle(0, 100), layout.ANTENNA_LIMIT);
  assert.equal(layout.antennaAngle(0, -100), -layout.ANTENNA_LIMIT);
  const current = layout.ANTENNA_LIMIT;
  const next = layout.antennaAngle(current, 0.1);
  assert.equal(layout.antennaDisruption(next - current, 16), 0);
});

test("faster antenna movement produces stronger, bounded disruption", () => {
  assert.equal(layout.antennaDisruption(0, 20), 0);
  const slow = layout.antennaDisruption(0.06, 200);
  const fast = layout.antennaDisruption(0.06, 16);
  assert.ok(fast > slow);
  assert.ok(slow > 0 && fast <= 1);
  const extreme = layout.antennaDisruption(100, 0);
  assert.ok(extreme > fast && extreme <= 0.85);
});

test("gentle motion has no minimum flash and equal speeds give equal disruption", () => {
  assert.equal(layout.antennaDisruption(0, 16), 0);
  assert.ok(layout.antennaDisruption(0.0001, 16) < 0.005);
  assert.ok(Math.abs(layout.antennaDisruption(0.01, 10) - layout.antennaDisruption(0.02, 20)) < 1e-10);
});

test("antenna easing is monotonic and independent of display frame rate", () => {
  const once = layout.dampTVValue(0, 0.6, 32, 85);
  const twice = layout.dampTVValue(layout.dampTVValue(0, 0.6, 16, 85), 0.6, 16, 85);
  assert.ok(once > 0 && once < 0.6);
  assert.ok(Math.abs(once - twice) < 1e-10);
});

test("all actual model geometry stays in frame throughout camera and antenna travel", async () => {
  const THREE = await import("three");
  const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
  const bytes = fs.readFileSync(path.join(__dirname, "../public/models/retro-tv.glb"));
  const { scene } = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
  assert.equal(scene.getObjectByName("VolumeThumbGrip").parent.name, "VolumeThumb");
  for (const id of ["left", "right"]) {
    assert.ok(scene.getObjectByName(`Antenna_${id}`));
    assert.equal(scene.getObjectByName(`AntennaTip_${id}`).parent.name, `Antenna_${id}`);
  }
  for (const [width, height] of [[1620, 1450], [1400, 920], [390, 600], [390, 832], [700, 1080], [650, 300]]) {
    const view = layout.televisionViewport(width, height);
    scene.scale.y = view.cabinetHeight;
    const screenLayout = layout.televisionScreenLayout(view.cabinetHeight);
    assert.equal(screenLayout.width, 640);
    assert.ok(Math.abs(screenLayout.height / screenLayout.width - layout.TV_SCREEN.height * view.cabinetHeight / layout.TV_SCREEN.width) < 1e-10);
    for (const yaw of [-Math.PI, -Math.PI / 2, 0, 0.28, Math.PI / 2, Math.PI, Math.PI * 2]) for (const pitch of [-1.4, 0, 0.14, 1.4]) for (const angle of [-0.68, 0, 0.68]) {
      const camera = new THREE.OrthographicCamera(-view.viewWidth / 2, view.viewWidth / 2, view.viewHeight / 2, -view.viewHeight / 2, 0.1, 100);
      const targetY = 1.2 * view.cabinetHeight;
      camera.position.set(Math.sin(yaw) * Math.cos(pitch) * 23, targetY + Math.sin(pitch) * 23, Math.cos(yaw) * Math.cos(pitch) * 23);
      camera.lookAt(0, targetY, 0);
      camera.updateMatrixWorld();
      scene.getObjectByName("Antenna_left").rotation.z = angle;
      scene.getObjectByName("Antenna_right").rotation.z = -angle;
      scene.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(scene);
      const corners = [];
      for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
        corners.push(new THREE.Vector3(x, y, z).project(camera));
      }
      camera.zoom = layout.fitTVProjection(corners);
      camera.updateProjectionMatrix();
      scene.traverse((mesh) => {
        if (!mesh.isMesh) return;
        mesh.geometry.computeBoundingBox();
        const box = mesh.geometry.boundingBox;
        for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
          const p = new THREE.Vector3(x, y, z).applyMatrix4(mesh.matrixWorld).project(camera);
          assert.ok(Math.abs(p.x) <= 1.001 && Math.abs(p.y) <= 1.001, `${mesh.name}: ${p.x}, ${p.y}`);
        }
      });
      const s = layout.TV_SCREEN;
      const project = (x, y) => new THREE.Vector3(x, y * view.cabinetHeight, s.z).project(camera);
      const tl = project(s.x - s.width / 2, s.y + s.height / 2);
      const tr = project(s.x + s.width / 2, s.y + s.height / 2);
      const bl = project(s.x - s.width / 2, s.y - s.height / 2);
      const br = project(s.x + s.width / 2, s.y - s.height / 2);
      // The fixed logical canvas must stay glued to all four actual GLB
      // screen corners, including edge-on/back-facing projections.
      const [a, b, c, d, e, f] = layout.televisionScreenTransform(tl, tr, bl, view.cabinetHeight);
      assert.ok([a, b, c, d, e, f].every(Number.isFinite));
      for (const [u, v, expected] of [[0, 0, tl], [screenLayout.width, 0, tr], [0, screenLayout.height, bl], [screenLayout.width, screenLayout.height, br]]) {
        assert.ok(Math.abs(a * u + c * v + e - expected.x) < 1e-10);
        assert.ok(Math.abs(b * u + d * v + f - expected.y) < 1e-10);
      }
      const volume = layout.TV_VOLUME;
      const vp = (x, y) => new THREE.Vector3(x, y * view.cabinetHeight, volume.z).project(camera);
      const rangeMatrix = layout.televisionPlaneTransform(
        vp(volume.x - volume.width / 2, volume.y + volume.height / 2),
        vp(volume.x + volume.width / 2, volume.y + volume.height / 2),
        vp(volume.x - volume.width / 2, volume.y - volume.height / 2), { width: 172, height: 52 });
      for (const value of [0, 50, 100]) {
        // The invisible native thumb is 44 logical px wide: its center travels
        // from u=22 to u=150, matching the 3D thumb's actual x limits.
        const u = 22 + 128 * value / 100;
        const expected = vp(layout.televisionVolumePosition(value), volume.y);
        const [a, b, c, d, e, f] = rangeMatrix;
        assert.ok(Math.abs(a * u + c * 26 + e - expected.x) < 1e-10);
        assert.ok(Math.abs(b * u + d * 26 + f - expected.y) < 1e-10);
      }
    }
  }
});
