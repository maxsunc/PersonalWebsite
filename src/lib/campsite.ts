import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { TV_SCREEN } from "./television";

/** Camera-relative, back-faced sky: translation/zoom can never exit the star field. */
export function createNightSky() {
  const geometry = new THREE.SphereGeometry(160, 48, 24);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, depthTest: false, toneMapped: false, fog: false,
    vertexShader: `
      varying vec3 skyDirection;
      void main() {
        skyDirection = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying vec3 skyDirection;
      // Integer avalanche hash (WebGL2): avoids the diagonal patterns and
      // precision banding that float-only hashes produce in dense star fields.
      float hash(vec2 p) {
        uvec2 cell = uvec2(ivec2(floor(p)));
        uint n = (cell.x * 1597334677u) ^ (cell.y * 3812015801u);
        n = (n ^ (n >> 16u)) * 2246822519u;
        n = (n ^ (n >> 13u)) * 3266489917u;
        n ^= n >> 16u;
        return float(n >> 8u) / 16777216.0;
      }
      float noise(vec2 p) {
        vec2 cell = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(cell), hash(cell + vec2(1.,0.)), f.x),
                   mix(hash(cell + vec2(0.,1.)), hash(cell + 1.), f.x), f.y);
      }
      vec3 stars(vec2 uv, vec2 grid, float density, float gain) {
        vec2 cell = floor(uv * grid);
        vec2 local = fract(uv * grid);
        vec2 center = .3 + .4 * vec2(hash(cell + 19.7), hash(cell + 83.1));
        vec2 footprint = max(fwidth(uv * grid), vec2(.00001));
        float rarity = pow(hash(cell + 41.9), 7.0);
        // Tiny Gaussian point-spread functions, not filled circles. The cap is
        // in drawing-buffer pixels, so zooming in cannot turn stars into discs.
        float angularSize = mix(.009, .04, rarity);
        float sigma = clamp(angularSize / sqrt(footprint.x * footprint.y), .48, 1.0);
        // Keep the entire three-sigma profile inside its jittered cell. This
        // prevents derivative streaks and square edges at cell boundaries.
        sigma = min(sigma, .1 / max(footprint.x, footprint.y));
        vec2 offset = (local - center) / footprint / sigma;
        float r2 = dot(offset, offset);
        float core = exp(-.5 * r2) * (1.0 - smoothstep(4.0, 9.0, r2));
        float brightness = mix(.055, 1.15, rarity) * gain;
        // Mostly off-white, with restrained warm/cool stellar temperatures.
        vec3 temperature = mix(vec3(1.,.80,.62), vec3(.68,.82,1.), hash(cell + 57.3));
        float resolved = 1.0 - smoothstep(.35, .85, max(footprint.x, footprint.y));
        return temperature * core * brightness * step(1.0 - density, hash(cell)) * resolved;
      }
      void main() {
        vec3 dir = normalize(skyDirection);
        float elevation = smoothstep(-.15, .8, dir.y);
        vec3 color = mix(vec3(.003,.006,.014), vec3(.001,.002,.007), elevation);
        vec2 uv = vec2(atan(dir.z,dir.x)/6.2831853+.5, asin(clamp(dir.y,-1.,1.))/3.14159265+.5);
        // Very faint, irregular galactic haze rather than a flat blue stripe.
        float dust = noise(dir.xz * 16.) * .6 + noise(dir.xz * 43.) * .3 + noise(dir.xz * 110.) * .1;
        float band = exp(-pow((dir.y + dir.x*.28 - .36 + (dust-.5)*.12)*7.0, 2.0));
        color += vec3(.0025,.0028,.0035) * band * dust;
        // A sparse, brighter population over many fine, faint background stars.
        vec3 star = stars(uv, vec2(2200.,1100.), .33, 1.0)
                  + stars(uv + vec2(.137,.291), vec2(6500.,3250.), .50, .18);
        color += star * smoothstep(-.45,-.08,dir.y);
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(geometry, material);
  sky.name = "DistantNightSky";
  sky.layers.set(1); sky.renderOrder = -1000; sky.frustumCulled = false;
  return {
    object: sky,
    syncCamera(camera: THREE.OrthographicCamera) {
      sky.position.copy(camera.position);
      // Also cover unusually wide/tall viewports without exposing the sphere edge.
      const span = Math.hypot(camera.right - camera.left, camera.top - camera.bottom) / camera.zoom;
      const radius = Math.max(160, span);
      sky.scale.setScalar(radius / 160);
      const far = Math.max(1000, radius * 2 + 100);
      if (camera.far !== far) { camera.far = far; camera.updateProjectionMatrix(); }
    },
    dispose() { geometry.dispose(); material.dispose(); },
  };
}

/** Optional environment; load failure must not prevent the TV from working. */
export async function createCampsite(scene: THREE.Scene) {
  const { scene: model } = await new GLTFLoader().loadAsync("/models/campsite.glb");
  const root = new THREE.Group(); root.name = "NightCampsite"; root.add(model); scene.add(root);
  const sky = createNightSky(); scene.add(sky.object);
  const originalFog = scene.fog;
  scene.fog = new THREE.FogExp2(0x070e1d, .0025);
  const ambient = new THREE.HemisphereLight(0x819dc9, 0x171305, .28);
  ambient.name = "NightAmbient"; root.add(ambient);
  const moon = new THREE.DirectionalLight(0x9cbcff, .65);
  moon.position.set(12, 25, -14); root.add(moon);
  const fire = new THREE.PointLight(0xff802d, 800, 55, 2);
  fire.name = "CampfireLight"; fire.position.set(-13, -4.6, 4);
  fire.castShadow = true;
  // Only flames/sparks move continuously, and neither casts shadows. Cache the
  // expensive six-face shadow map until an actual solid object changes.
  fire.shadow.autoUpdate = false; fire.shadow.needsUpdate = true;
  fire.shadow.mapSize.set(1024, 1024);
  fire.shadow.camera.near = .4; fire.shadow.camera.far = 60;
  fire.shadow.bias = -.0002; fire.shadow.normalBias = .08;
  root.add(fire);
  const lantern = new THREE.PointLight(0xffbc69, 20, 14, 2);
  lantern.position.set(9, -6.1, 4); root.add(lantern);
  // A real rectangular emitter matching the glass, rather than a decorative
  // glow overlay. Its front hemisphere lights nearby grass, rocks and wood.
  // Three.js area lights are soft but do not support shadow maps.
  RectAreaLightUniformsLib.init();
  // Match the desaturated green phosphor of the HTML CRT instead of casting
  // blue light that looks disconnected from the picture.
  const phosphorColor = 0xc3deb0;
  const screenLight = new THREE.RectAreaLight(phosphorColor, 3, TV_SCREEN.width, TV_SCREEN.height);
  screenLight.name = "TVScreenLight";
  screenLight.position.set(TV_SCREEN.x, TV_SCREEN.y, TV_SCREEN.z + .12);
  screenLight.rotation.y = Math.PI; // RectAreaLight emits along local -Z; the screen faces +Z.
  root.add(screenLight);
  // The main emitter faces outwards, so it cannot illuminate the recessed rim
  // behind its plane. Thin, low-flux emitters tip back towards each bezel edge,
  // giving a continuous soft spill rather than a neon outline or point hotspots.
  const edgeLights = [
    { name: "top", x: TV_SCREEN.x, y: TV_SCREEN.y + TV_SCREEN.height / 2 - .08, width: TV_SCREEN.width, height: .12, dx: 0, dy: 1 },
    { name: "bottom", x: TV_SCREEN.x, y: TV_SCREEN.y - TV_SCREEN.height / 2 + .08, width: TV_SCREEN.width, height: .12, dx: 0, dy: -1 },
    { name: "left", x: TV_SCREEN.x - TV_SCREEN.width / 2 + .08, y: TV_SCREEN.y, width: .12, height: TV_SCREEN.height, dx: -1, dy: 0 },
    { name: "right", x: TV_SCREEN.x + TV_SCREEN.width / 2 - .08, y: TV_SCREEN.y, width: .12, height: TV_SCREEN.height, dx: 1, dy: 0 },
  ].map(edge => {
    const light = new THREE.RectAreaLight(phosphorColor, 3, edge.width, edge.height);
    light.name = `TVScreenSpill_${edge.name}`;
    light.position.set(edge.x, edge.y, TV_SCREEN.z + .20);
    light.lookAt(edge.x + edge.dx * .5, edge.y + edge.dy * .5, TV_SCREEN.z - .3);
    root.add(light);
    return light;
  });
  const screenLights = [screenLight, ...edgeLights];
  const screenLightHeights = screenLights.map(light => light.height);
  const setHeight = (height: number) => {
    // Area-light dimensions are independent of Object3D scaling in Three.js.
    screenLights.forEach((light, i) => { light.height = screenLightHeights[i] * height; });
    if (root.scale.y !== height) { root.scale.y = height; fire.shadow.needsUpdate = true; }
  };
  // Both the TV (layer 0) and landscape (layer 1) receive the real lighting.
  root.traverse(object => object.layers.set(1));
  for (const light of [ambient, moon, fire, lantern, ...screenLights]) light.layers.enable(0);
  fire.shadow.camera.layers.enable(1);
  // An orthographic camera has parallel rays: an endless plane would cover
  // the entire sky. Fade only the far half of the field to a camera-relative
  // horizon; keep the foreground broad so it never reveals a platform edge.
  const horizonDirection = new THREE.Vector3(0, 0, 1);
  const terrain = model.getObjectByName("Terrain") as THREE.Mesh | undefined;
  if (terrain) {
    const material = (terrain.material as THREE.MeshStandardMaterial).clone();
    terrain.material = material;
    material.onBeforeCompile = shader => {
      shader.uniforms.campHorizonDirection = { value: horizonDirection };
      shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 campWorldPosition;")
        .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\ncampWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 campWorldPosition;\nuniform vec3 campHorizonDirection;")
        .replace("#include <dithering_fragment>", `
          float ahead = -dot(campWorldPosition.xz, campHorizonDirection.xz);
          if (ahead >= 100.0) discard;
          gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(.039,.070,.123), smoothstep(60.0,100.0,ahead));
          #include <dithering_fragment>`);
    };
    material.customProgramCacheKey = () => "campsite-horizon-v1";
  }
  const flames: { object: THREE.Mesh; height: number; lean: number }[] = [];
  model.traverse(object => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.receiveShadow = true;
    mesh.castShadow = !mesh.name.startsWith("FieldGrass") && mesh.name !== "Terrain";
    if (mesh.name.startsWith("CampFlame")) {
      mesh.castShadow = false; mesh.receiveShadow = false;
      flames.push({ object: mesh, height: mesh.scale.y, lean: mesh.rotation.z });
      for (const mat of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        mat.side = THREE.DoubleSide;
        const standard = mat as THREE.MeshStandardMaterial;
        standard.emissiveIntensity = 2.5;
      }
    }
    if (mesh.name.startsWith("FieldGrass")) {
      for (const mat of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) mat.side = THREE.DoubleSide;
    }
  });
  // Slowly rising sparks are separate from the stars; the stars themselves stay fixed.
  const count = 26, positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = -13 + Math.sin(i * 7) * .7;
    positions[i * 3 + 1] = -6 + i / count * 7;
    positions[i * 3 + 2] = 4 + Math.cos(i * 3) * .6;
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const sparks = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xffab4a, size: 1.8, sizeAttenuation: false, transparent: true, opacity: .8, depthWrite: false, blending: THREE.AdditiveBlending }));
  sparks.name = "CampfireSparks"; sparks.layers.set(1); root.add(sparks);
  return {
    invalidateShadows() { fire.shadow.needsUpdate = true; },
    setPowered(powered: boolean) { screenLights.forEach(light => { light.visible = powered; }); },
    setHeight,
    syncCamera(camera: THREE.OrthographicCamera) {
      sky.syncCamera(camera);
      horizonDirection.set(camera.position.x, 0, camera.position.z).normalize();
    },
    update(time: number, elapsed: number, height: number, still: boolean) {
      setHeight(height);
      sparks.visible = !still;
      fire.intensity = still ? 800 : 800 + Math.sin(time * 5.7) * 80 + Math.sin(time * 9.3) * 45;
      flames.forEach(({ object, height: original, lean }, i) => {
        object.scale.y = still ? original : original * (1 + Math.sin(time * 5 + i * 2) * .14);
        object.rotation.z = still ? lean : lean + Math.sin(time * 2.8 + i) * .06;
      });
      if (still) return;
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] += elapsed * (.9 + (i % 4) * .2);
        positions[i * 3] += Math.sin(time + i) * elapsed * .12;
        if (positions[i * 3 + 1] > 1) { positions[i * 3 + 1] = -6; positions[i * 3] = -13 + Math.sin(i * 7) * .7; }
      }
      geometry.attributes.position.needsUpdate = true;
    },
    dispose() {
      scene.remove(root, sky.object); sky.dispose(); scene.fog = originalFog;
      fire.shadow.map?.dispose();
      root.traverse(object => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        if (mesh.material) for (const mat of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) mat.dispose();
      });
    },
  };
}
