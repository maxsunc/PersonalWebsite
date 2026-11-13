"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type RefObject } from "react";
import type { Color, Group, Mesh, MeshStandardMaterial, Object3D, WebGLRenderer } from "three";
import { TV_CONTROLS, TV_SCREEN, televisionViewport, type TVControl } from "@/lib/television";

type Props = { displayRef: RefObject<HTMLDivElement | null>; onReady: () => void };

export default function TelevisionModel({ displayRef, onReady }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const pressRef = useRef<(id: TVControl, pressed: boolean) => void>(() => {});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    const display = displayRef.current;
    if (!host || !display) return;
    let disposed = false;
    let renderer: WebGLRenderer | undefined;
    let model: Group | undefined;
    let observer: ResizeObserver | undefined;
    let detachContext: (() => void) | undefined;
    const originalPositions = new Map<Object3D, number>();
    const buttonMaterials = new Map<Object3D, { material: MeshStandardMaterial; color: Color }[]>();

    const releaseModel = (root: Object3D) => {
      root.traverse((object) => {
        const mesh = object as Mesh;
        mesh.geometry?.dispose();
        if (mesh.material) {
          for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) material.dispose();
        }
      });
    };

    const start = async () => {
      const [THREE, { GLTFLoader }] = await Promise.all([
        import("three"), import("three/examples/jsm/loaders/GLTFLoader.js"),
      ]);
      if (disposed) return;
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-7.6, 7.6, 5.05, -5.05, 0.1, 100);
      camera.position.set(0.4, 0.2, 21);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();
      scene.add(new THREE.HemisphereLight(0xe9eddd, 0x22271c, 2.4));
      const key = new THREE.DirectionalLight(0xffeed5, 4.5);
      key.position.set(-5, 7, 10);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xb9d2e8, 2);
      fill.position.set(7, 2, 6);
      scene.add(fill);
      const rim = new THREE.DirectionalLight(0xc4df9b, 2.5);
      rim.position.set(0, 8, -2);
      scene.add(rim);

      // Layout uses the same camera as WebGL, so the real DOM screen is flush
      // with the glass plane rather than an approximate percentage overlay.
      const resize = () => {
        const { width, height } = host.getBoundingClientRect();
        if (!width || !height) return;
        const viewport = televisionViewport(width, height);
        camera.left = -viewport.viewWidth / 2;
        camera.right = viewport.viewWidth / 2;
        camera.top = viewport.viewHeight / 2;
        camera.bottom = -viewport.viewHeight / 2;
        camera.updateProjectionMatrix();
        if (model) model.scale.y = viewport.cabinetHeight;
        const project = (x: number, y: number, z: number) => {
          const point = new THREE.Vector3(x, y * viewport.cabinetHeight, z).project(camera);
          return { x: (point.x + 1) * width / 2, y: (1 - point.y) * height / 2 };
        };
        const screen = TV_SCREEN;
        const tl = project(screen.x - screen.width / 2, screen.y + screen.height / 2, screen.z);
        const tr = project(screen.x + screen.width / 2, screen.y + screen.height / 2, screen.z);
        const bl = project(screen.x - screen.width / 2, screen.y - screen.height / 2, screen.z);
        const w = Math.hypot(tr.x - tl.x, tr.y - tl.y);
        const h = Math.hypot(bl.x - tl.x, bl.y - tl.y);
        display.style.width = `${w}px`;
        display.style.height = `${h}px`;
        display.style.transform = `matrix(${(tr.x - tl.x) / w},${(tr.y - tl.y) / w},${(bl.x - tl.x) / h},${(bl.y - tl.y) / h},${tl.x},${tl.y})`;
        host.querySelectorAll<HTMLButtonElement>("[data-control]").forEach((button) => {
          const control = TV_CONTROLS.find((item) => item.id === button.dataset.control)!;
          const center = project(control.x, control.y, 1.4);
          button.style.left = `${center.x}px`;
          button.style.top = `${center.y}px`;
          button.style.width = `${Math.max(26, control.width / viewport.viewWidth * width)}px`;
          button.style.height = `${Math.max(26, control.height * viewport.cabinetHeight / viewport.viewHeight * height)}px`;
        });
        renderer?.setSize(width, height, false);
        renderer?.render(scene, camera);
      };
      // Even if WebGL is unavailable, keep the real content and poster usable.
      observer = new ResizeObserver(resize);
      observer.observe(host);
      resize();
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.domElement.setAttribute("aria-hidden", "true");
        renderer.domElement.className = "cabinet-canvas";
        host.prepend(renderer.domElement);
        const contextLost = (event: Event) => {
          event.preventDefault();
          if (!disposed) setLoaded(false);
        };
        renderer.domElement.addEventListener("webglcontextlost", contextLost);
        detachContext = () => renderer?.domElement.removeEventListener("webglcontextlost", contextLost);
        const gltf = await new GLTFLoader().loadAsync("/models/retro-tv.glb");
        if (disposed) { releaseModel(gltf.scene); return; }
        model = gltf.scene;
        scene.add(model);
        model.traverse((object) => {
          originalPositions.set(object, object.position.z);
          if (!object.name.startsWith("Button_")) return;
          const mesh = object as Mesh;
          if (!mesh.material) return;
          const materials = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map((material) => material.clone() as MeshStandardMaterial);
          mesh.material = materials.length === 1 ? materials[0] : materials;
          buttonMaterials.set(object, materials.map((material) => ({ material, color: material.color.clone() })));
        });
        pressRef.current = (id, pressed) => {
          const button = model?.getObjectByName(`Button_${id}`);
          if (!button) return;
          button.position.z = originalPositions.get(button)! - (pressed ? 0.075 : 0);
          button.scale.setScalar(pressed ? 0.965 : 1);
          for (const { material, color } of buttonMaterials.get(button) ?? []) {
            material.color.copy(color).multiplyScalar(pressed ? 0.65 : 1);
          }
          renderer?.render(scene, camera);
        };
        resize();
        setLoaded(true);
      } catch (error) {
        console.warn("3D television unavailable; using the rendered cabinet.", error);
        renderer?.domElement.remove();
        renderer?.dispose();
        renderer = undefined;
      }
      if (!disposed) onReady();
    };
    void start().catch((error) => {
      console.warn("Television renderer failed to load.", error);
      if (!disposed) onReady();
    });
    return () => {
      disposed = true;
      observer?.disconnect();
      detachContext?.();
      pressRef.current = () => {};
      if (model) releaseModel(model);
      renderer?.dispose();
      renderer?.domElement.remove();
      display.style.removeProperty("transform");
      display.style.removeProperty("width");
      display.style.removeProperty("height");
    };
  }, [displayRef, onReady]);

  return (
    <div ref={hostRef} className={`television-model ${loaded ? "model-loaded" : ""}`}>
      <Image className="cabinet-poster" src="/models/retro-tv-poster.webp" alt="" fill priority sizes="100vw" aria-hidden="true" />
      <div className="cabinet-inputs" role="group" aria-label="TV buttons; functions coming soon">
        {TV_CONTROLS.map((control) => (
          <button
            key={control.id} type="button" data-control={control.id}
            className={`cabinet-button cabinet-button-${control.id}`}
            aria-label={`${control.label} (not assigned yet)`}
            title={`${control.label} — not assigned yet`}
            onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); pressRef.current(control.id, true); }}
            onPointerUp={() => pressRef.current(control.id, false)}
            onPointerCancel={() => pressRef.current(control.id, false)}
            onLostPointerCapture={() => pressRef.current(control.id, false)}
            onKeyDown={(event) => { if (event.key === " " || event.key === "Enter") pressRef.current(control.id, true); }}
            onKeyUp={() => pressRef.current(control.id, false)}
            onBlur={() => pressRef.current(control.id, false)}
          />
        ))}
      </div>
    </div>
  );
}
