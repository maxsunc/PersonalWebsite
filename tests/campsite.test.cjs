const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('src/lib/campsite.ts', 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
}).outputText;
async function loadModule() {
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const { RectAreaLightUniformsLib } = await import('three/examples/jsm/lights/RectAreaLightUniformsLib.js');
  const television = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/television.ts', 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  }).outputText, { exports: television });
  const bytes = fs.readFileSync('public/models/campsite.glb');
  const asset = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  const exports = {};
  vm.runInNewContext(source, { exports, require(name) {
    if (name === 'three') return THREE;
    if (name === './television') return television;
    if (name.includes('RectAreaLightUniformsLib')) return { RectAreaLightUniformsLib };
    if (name.includes('GLTFLoader')) return { GLTFLoader: class { async loadAsync(url) { assert.equal(url, '/models/campsite.glb'); return asset; } } };
    throw new Error(name);
  } });
  return { THREE, asset, ...exports };
}
test('camera-following sky covers every tested zoom/aspect without near/far clipping or depth occlusion', async () => {
  const { THREE, createNightSky } = await loadModule();
  const sky = createNightSky();
  const camera = new THREE.OrthographicCamera(-8, 8, 7, -7, .1, 100);
  for (const span of [16, 60, 200, 1200]) {
    for (const yaw of [0, 1.5, Math.PI, -6]) {
      camera.left = -span / 2; camera.right = span / 2;
      camera.position.set(Math.sin(yaw) * 10000, 25, Math.cos(yaw) * 10000);
      camera.lookAt(0,0,0); camera.updateMatrixWorld();
      sky.syncCamera(camera);
      assert.ok(sky.object.position.equals(camera.position));
      const radius = 160 * sky.object.scale.x;
      const corner = Math.hypot(span, 14) / 2;
      assert.ok(radius > corner);
      assert.ok(camera.far > radius * 2);
      assert.equal(sky.object.material.side, THREE.BackSide);
      assert.equal(sky.object.material.depthWrite, false);
      assert.equal(sky.object.material.depthTest, false);
      assert.equal(sky.object.frustumCulled, false);
    }
  }
  sky.dispose();
});
test('Blender campsite has broad terrain, grass, fire and stump; no bedroom or duplicate TV', async () => {
  const { THREE, asset } = await loadModule();
  const terrain = asset.scene.getObjectByName('Terrain'); assert.ok(terrain);
  const bounds = new THREE.Box3().setFromObject(terrain);
  assert.ok(bounds.max.x - bounds.min.x >= 220);
  assert.ok(asset.scene.children.some(o => o.name.startsWith('FieldGrass')));
  assert.equal(asset.scene.children.filter(o => o.name.startsWith('CampFlame')).length, 7);
  assert.ok(asset.scene.children.some(o => o.name.includes('heartwood')));
  assert.ok(asset.scene.children.every(o => !o.name.startsWith('Room_') && !o.name.startsWith('PreviewTV_')));
  assert.ok(fs.statSync('public/models/campsite.glb').size < 5 * 1024 * 1024);
});
test('screen is a front-facing soft area emitter, lights both layers, scales on mobile and follows power', async () => {
  const { THREE, createCampsite } = await loadModule();
  const scene = new THREE.Scene();
  const camp = await createCampsite(scene);
  const light = scene.getObjectByName('TVScreenLight');
  assert.equal(light.isRectAreaLight, true);
  assert.equal(light.width, 10.4); assert.equal(light.height, 7.48);
  assert.ok(light.intensity > 0);
  assert.ok(light.color.g > light.color.r && light.color.r > light.color.b, 'muted green phosphor tint, not blue');
  assert.ok(light.layers.isEnabled(0)); assert.ok(light.layers.isEnabled(1));
  assert.ok(light.position.z > 1.325);
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(light.quaternion);
  assert.ok(forward.z > .99);
  const edges = ['top', 'bottom', 'left', 'right'].map(name => scene.getObjectByName(`TVScreenSpill_${name}`));
  for (const edge of edges) {
    assert.equal(edge.isRectAreaLight, true);
    assert.ok(edge.color.equals(light.color));
    assert.ok(edge.width * edge.height < 2, 'small-area spill does not overpower the main screen');
    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(edge.quaternion);
    assert.ok(direction.z < -.5, 'spill points back towards the bezel');
    assert.ok(edge.layers.isEnabled(0));
  }
  assert.ok(new THREE.Vector3(0, 0, -1).applyQuaternion(edges[0].quaternion).y > .5);
  assert.ok(new THREE.Vector3(0, 0, -1).applyQuaternion(edges[1].quaternion).y < -.5);
  assert.ok(new THREE.Vector3(0, 0, -1).applyQuaternion(edges[2].quaternion).x < -.5);
  assert.ok(new THREE.Vector3(0, 0, -1).applyQuaternion(edges[3].quaternion).x > .5);
  camp.setHeight(1.72); assert.equal(light.height, 7.48 * 1.72);
  assert.equal(edges[2].height, 7.48 * 1.72);
  camp.update(0, 0, 1, true); assert.equal(light.height, 7.48);
  assert.equal(edges[2].height, 7.48);
  camp.setPowered(false); assert.equal(light.visible, false);
  assert.ok(edges.every(edge => !edge.visible));
  camp.update(2, .03, 1, false); assert.equal(light.visible, false);
  assert.ok(edges.every(edge => !edge.visible));
  camp.setPowered(true); assert.equal(light.visible, true);
  assert.ok(edges.every(edge => edge.visible));
  camp.dispose(); assert.equal(scene.getObjectByName('TVScreenLight'), undefined);
});
test('real shadow-casting fire lights TV and landscape, flickers, rests for reduced motion, and cleans up', async () => {
  const { THREE, createCampsite } = await loadModule();
  const scene = new THREE.Scene();
  const oldFog = new THREE.Fog(0x222222, 1, 90); scene.fog = oldFog;
  const camp = await createCampsite(scene);
  const fire = scene.getObjectByName('CampfireLight');
  assert.equal(fire.isPointLight, true); assert.equal(fire.castShadow, true);
  assert.ok(fire.layers.isEnabled(0)); assert.ok(fire.layers.isEnabled(1));
  assert.ok(fire.shadow.camera.layers.isEnabled(1));
  const terrain = scene.getObjectByName('Terrain'); assert.equal(terrain.receiveShadow, true);
  const shader = { uniforms: {}, vertexShader: '#include <common>\n#include <worldpos_vertex>', fragmentShader: '#include <common>\n#include <dithering_fragment>' };
  terrain.material.onBeforeCompile(shader);
  assert.match(shader.fragmentShader, /ahead >= 100\.0/);
  assert.match(shader.fragmentShader, /smoothstep\(60\.0,100\.0,ahead\)/);
  assert.match(shader.vertexShader, /campWorldPosition =/);
  fire.shadow.needsUpdate = false;
  camp.invalidateShadows(); assert.equal(fire.shadow.needsUpdate, true);
  assert.equal(fire.shadow.autoUpdate, false);
  camp.update(1, .03, 1.72, false); const first = fire.intensity;
  camp.update(2, .03, 1.72, false); assert.notEqual(fire.intensity, first);
  assert.equal(scene.getObjectByName('NightCampsite').scale.y, 1.72);
  camp.update(3, 0, 1, true); assert.equal(fire.intensity, 800);
  assert.equal(scene.getObjectByName('CampfireSparks').visible, false);
  const camera = new THREE.OrthographicCamera(); camera.position.set(50,8,0); camp.syncCamera(camera);
  assert.equal(shader.uniforms.campHorizonDirection.value.x, 1);
  assert.equal(shader.uniforms.campHorizonDirection.value.z, 0);
  assert.ok(scene.getObjectByName('DistantNightSky').position.equals(camera.position));
  camp.dispose(); assert.equal(scene.children.length, 0); assert.equal(scene.fog, oldFog);
});
