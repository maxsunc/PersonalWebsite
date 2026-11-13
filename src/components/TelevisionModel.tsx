"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from "react";
import type { Color, Group, Mesh, MeshStandardMaterial, Object3D, WebGLRenderer } from "three";
import {
  TV_ANTENNAS, TV_CONTROLS, TV_REST_POSE, TV_SCREEN, TV_VOLUME, antennaAngle,
  antennaDisruption, dampTVValue, fitTVProjection, isTVScreenVisible, nearestTVYaw, orbitTVPose,
  televisionPlaneTransform, televisionScreenLayout, televisionScreenTransform, televisionViewport,
  televisionVolumePosition, tvViewProgress, TV_VIEW_DURATION, type TVAntenna, type TVControl,
} from "@/lib/television";

type Props = {
  displayRef: RefObject<HTMLDivElement | null>;
  onReady: () => void;
  onInterference: (strength: number) => void;
  frontView: boolean;
  volume: number;
  powered: boolean;
  powerBusy: boolean;
  controlsDisabled: boolean;
  onToggleView: () => void;
  onTogglePower: () => void;
  onVolumeChange: (value: number) => void;
  onChannelChange: (direction: -1 | 1) => void;
};
type AntennaDrag = { id: TVAntenna; x: number; y: number; time: number };

export default function TelevisionModel({ displayRef, onReady, onInterference, frontView,
  volume = 50, powered = true, powerBusy = false, controlsDisabled = false,
  onToggleView, onTogglePower, onVolumeChange, onChannelChange }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const pressRef = useRef<(id: TVControl, pressed: boolean) => void>(() => {});
  const adjustRef = useRef<(id: TVAntenna, delta: number, elapsed: number, reset?: boolean) => void>(() => {});
  const antennaDragRef = useRef<AntennaDrag | null>(null);
  const signalRef = useRef(onInterference);
  const frontRef = useRef(frontView);
  const changeViewRef = useRef<() => void>(() => {});
  const settingsRef = useRef({ volume, powered });
  const refreshControlsRef = useRef<() => void>(() => {});
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { signalRef.current = onInterference; }, [onInterference]);
  useEffect(() => { frontRef.current = frontView; changeViewRef.current(); }, [frontView]);
  useEffect(() => { settingsRef.current = { volume, powered }; refreshControlsRef.current(); }, [volume, powered]);

  useEffect(() => {
    const host = hostRef.current;
    const display = displayRef.current;
    const stage = host?.parentElement;
    if (!host || !display || !stage) return;
    let disposed = false;
    let renderer: WebGLRenderer | undefined;
    let model: Group | undefined;
    let observer: ResizeObserver | undefined;
    let detachContext: (() => void) | undefined;
    let detachInteraction: (() => void) | undefined;
    let live = false;
    let stopAntennaMotion = () => {};
    let stopViewMotion = () => {};
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
      const camera = new THREE.OrthographicCamera(-8.1, 8.1, 7.25, -7.25, 0.1, 100);
      const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
      let explorePose: { yaw: number; pitch: number } = { ...TV_REST_POSE };
      let pose = frontRef.current ? { yaw: 0, pitch: 0 } : { ...explorePose };
      let viewBlend = frontRef.current ? 1 : 0;
      let viewFrame = 0;
      let settleView = () => {};
      stopViewMotion = () => {
        if (viewFrame) cancelAnimationFrame(viewFrame);
        viewFrame = 0;
      };
      let size = { width: 0, height: 0 };
      let displayCabinetHeight = 0;
      let drag: { x: number; y: number; yaw: number; pitch: number } | null = null;
      const antennaTargets = new Map<TVAntenna, number>();
      let antennaFrame = 0;
      let antennaPrevious = 0;
      stopAntennaMotion = () => {
        if (antennaFrame) cancelAnimationFrame(antennaFrame);
        antennaFrame = 0; antennaPrevious = 0;
        antennaTargets.clear();
      };
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

      // Orthographic projection gives an exact affine transform for the real
      // HTML screen, even while the camera orbits. Links never drift off glass.
      const draw = () => {
        if (disposed) return;
        const { width, height } = host.getBoundingClientRect();
        if (!width || !height) return;
        const orbitViewport = televisionViewport(width, height);
        const readingViewport = televisionViewport(width, height, true);
        const viewport = {
          cabinetHeight: orbitViewport.cabinetHeight,
          viewWidth: THREE.MathUtils.lerp(orbitViewport.viewWidth, readingViewport.viewWidth, viewBlend),
          viewHeight: THREE.MathUtils.lerp(orbitViewport.viewHeight, readingViewport.viewHeight, viewBlend),
        };
        // Keep the rendered fallback centered at its original camera composition
        // now that both viewing modes share one fixed-size canvas.
        const poster = host.querySelector<HTMLImageElement>(".cabinet-poster");
        if (poster) {
          poster.style.width = `${16.2 / orbitViewport.viewWidth * width}px`;
          poster.style.height = `${14.5 * viewport.cabinetHeight / orbitViewport.viewHeight * height}px`;
          poster.style.left = poster.style.top = "50%";
          poster.style.transform = "translate(-50%, -50%)";
        }
        camera.left = -viewport.viewWidth / 2;
        camera.right = viewport.viewWidth / 2;
        camera.top = viewport.viewHeight / 2;
        camera.bottom = -viewport.viewHeight / 2;
        camera.updateProjectionMatrix();
        const targetY = (1 - viewBlend) * 1.2 * viewport.cabinetHeight;
        const radius = 23;
        camera.position.set(
          Math.sin(pose.yaw) * Math.cos(pose.pitch) * radius,
          targetY + Math.sin(pose.pitch) * radius,
          Math.cos(pose.yaw) * Math.cos(pose.pitch) * radius,
        );
        camera.lookAt(0, targetY, 0);
        camera.updateMatrixWorld();
        if (model) {
          const thumb = model.getObjectByName("VolumeThumb");
          if (thumb) thumb.position.x = televisionVolumePosition(settingsRef.current.volume);
          const led = model.getObjectByName("StandbyLED");
          if (led) for (const { material, color } of buttonMaterials.get(led) ?? []) {
            material.color.copy(color).multiplyScalar(settingsRef.current.powered ? 1 : 0.12);
            material.emissiveIntensity = settingsRef.current.powered ? 1.4 : 0;
          }
          model.scale.y = viewport.cabinetHeight; model.updateMatrixWorld(true);
        }
        camera.zoom = 1;
        camera.updateProjectionMatrix();
        if (model && viewBlend < 1) {
          // Fit the whole cabinet at ANY orbit angle, including the underside/back.
          const bounds = new THREE.Box3().setFromObject(model);
          const corners = [];
          for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
            corners.push(new THREE.Vector3(x, y, z).project(camera));
          }
          camera.zoom = THREE.MathUtils.lerp(fitTVProjection(corners), 1, viewBlend);
          camera.updateProjectionMatrix();
        }
        const screenVisible = isTVScreenVisible(pose.yaw, pose.pitch);
        display.style.visibility = screenVisible ? "visible" : "hidden";
        display.inert = !screenVisible;
        const inputs = host.querySelector<HTMLElement>(".cabinet-inputs");
        if (inputs) { inputs.style.visibility = screenVisible ? "visible" : "hidden"; inputs.inert = !screenVisible; }
        const projectWorld = (point: InstanceType<typeof THREE.Vector3>) => {
          point.project(camera);
          return { x: (point.x + 1) * width / 2, y: (1 - point.y) * height / 2 };
        };
        const project = (x: number, y: number, z: number) => projectWorld(new THREE.Vector3(x, y * viewport.cabinetHeight, z));
        const screen = TV_SCREEN;
        const tl = project(screen.x - screen.width / 2, screen.y + screen.height / 2, screen.z);
        const tr = project(screen.x + screen.width / 2, screen.y + screen.height / 2, screen.z);
        const bl = project(screen.x - screen.width / 2, screen.y - screen.height / 2, screen.z);
        // Layout is a fixed screen-local canvas. Camera motion changes ONLY
        // its transform, never its CSS dimensions, fonts, or layout breakpoint.
        if (displayCabinetHeight !== viewport.cabinetHeight) {
          const layout = televisionScreenLayout(viewport.cabinetHeight);
          display.style.width = `${layout.width}px`;
          display.style.height = `${layout.height}px`;
          displayCabinetHeight = viewport.cabinetHeight;
        }
        display.style.transform = `matrix(${televisionScreenTransform(tl, tr, bl, viewport.cabinetHeight).join(",")})`;
        host.querySelectorAll<HTMLButtonElement>("[data-control]").forEach((button) => {
          const control = TV_CONTROLS.find((item) => item.id === button.dataset.control)!;
          const center = project(control.x, control.y, 1.4);
          button.style.left = `${center.x}px`;
          button.style.top = `${center.y}px`;
          button.style.width = `${Math.max(26, control.width / viewport.viewWidth * width * camera.zoom)}px`;
          button.style.height = `${Math.max(26, control.height * viewport.cabinetHeight / viewport.viewHeight * height * camera.zoom)}px`;
        });
        const range = host.querySelector<HTMLInputElement>(".cabinet-volume");
        if (range) {
          const v = TV_VOLUME;
          const tl = project(v.x - v.width / 2, v.y + v.height / 2, v.z);
          const tr = project(v.x + v.width / 2, v.y + v.height / 2, v.z);
          const bl = project(v.x - v.width / 2, v.y - v.height / 2, v.z);
          const layout = { width: 172, height: 52 };
          range.style.width = `${layout.width}px`; range.style.height = `${layout.height}px`;
          range.style.transform = `matrix(${televisionPlaneTransform(tl, tr, bl, layout).join(",")})`;
        }
        host.querySelectorAll<HTMLElement>("[data-antenna]").forEach((handle) => {
          const id = handle.dataset.antenna!;
          const pivot = model?.getObjectByName(`Antenna_${id}`);
          const tip = model?.getObjectByName(`AntennaTip_${id}`);
          if (!pivot || !tip) return;
          const a = projectWorld(pivot.getWorldPosition(new THREE.Vector3()));
          const b = projectWorld(tip.getWorldPosition(new THREE.Vector3()));
          const length = Math.hypot(b.x - a.x, b.y - a.y);
          handle.style.left = `${(a.x + b.x) / 2}px`;
          handle.style.top = `${(a.y + b.y) / 2}px`;
          handle.style.width = `${length + 22}px`;
          handle.style.transform = `translate(-50%,-50%) rotate(${Math.atan2(b.y - a.y, b.x - a.x)}rad)`;
          handle.setAttribute("aria-valuenow", String(Math.round(pivot.rotation.z * 180 / Math.PI)));
        });
        if (renderer && (size.width !== width || size.height !== height)) renderer.setSize(width, height, false);
        size = { width, height };
        renderer?.render(scene, camera);
      };

      refreshControlsRef.current = draw;

      // Direct click-and-drag orbit: no hover motion, damping, or snap-back.
      // Pointer capture keeps rotating even after the cursor leaves the cabinet.
      const onMove = (event: globalThis.PointerEvent) => {
        if (!drag || !live || !model || frontRef.current || viewFrame || antennaDragRef.current) return;
        const rect = host.getBoundingClientRect();
        pose = orbitTVPose(
          drag.yaw - (event.clientX - drag.x) / Math.max(1, rect.width) * Math.PI * 2,
          drag.pitch + (event.clientY - drag.y) / Math.max(1, rect.height) * Math.PI,
        );
        explorePose = { ...pose };
        draw();
      };
      const onDown = (event: globalThis.PointerEvent) => {
        if (!live || frontRef.current || viewFrame || event.button !== 0 || (event.target as Element).closest("a,button,input,[data-antenna]")) return;
        event.preventDefault();
        drag = { x: event.clientX, y: event.clientY, yaw: pose.yaw, pitch: pose.pitch };
        stage.setPointerCapture(event.pointerId);
        stage.classList.add("is-dragging");
      };
      const onUp = (event: globalThis.PointerEvent) => {
        drag = null;
        stage.classList.remove("is-dragging");
        if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      };
      const onVisibility = () => {
        drag = null; antennaDragRef.current = null; stage.classList.remove("is-dragging");
        if (document.hidden) { stopAntennaMotion(); if (viewFrame) settleView(); }
        else draw();
      };
      const onMotion = () => {
        if (!motion.matches) return;
        for (const [id, target] of antennaTargets) {
          const pivot = model?.getObjectByName(`Antenna_${id}`);
          if (pivot) pivot.rotation.z = target;
        }
        stopAntennaMotion(); if (viewFrame) settleView(); draw();
      };
      changeViewRef.current = () => {
        drag = null;
        stage.classList.remove("is-dragging");
        stopViewMotion();
        const from = { ...pose, blend: viewBlend };
        const to = {
          yaw: nearestTVYaw(pose.yaw, frontRef.current ? 0 : explorePose.yaw),
          pitch: frontRef.current ? 0 : explorePose.pitch,
          blend: frontRef.current ? 1 : 0,
        };
        const apply = (progress: number) => {
          pose = { yaw: THREE.MathUtils.lerp(from.yaw, to.yaw, progress), pitch: THREE.MathUtils.lerp(from.pitch, to.pitch, progress) };
          viewBlend = THREE.MathUtils.lerp(from.blend, to.blend, progress);
          draw();
        };
        settleView = () => { stopViewMotion(); apply(1); };
        if (motion.matches || document.hidden || !live) { settleView(); return; }
        const started = performance.now();
        const animate = (time: number) => {
          viewFrame = 0;
          if (disposed || !live) return;
          if (document.hidden) { settleView(); return; }
          apply(tvViewProgress(time - started));
          if (time - started < TV_VIEW_DURATION) viewFrame = requestAnimationFrame(animate);
        };
        viewFrame = requestAnimationFrame(animate);
      };
      stage.addEventListener("pointermove", onMove);
      stage.addEventListener("pointerdown", onDown);
      stage.addEventListener("pointerup", onUp);
      stage.addEventListener("pointercancel", onUp);
      stage.addEventListener("lostpointercapture", onUp);
      document.addEventListener("visibilitychange", onVisibility);
      motion.addEventListener("change", onMotion);
      detachInteraction = () => {
        stage.removeEventListener("pointermove", onMove);
        stage.removeEventListener("pointerdown", onDown);
        stage.removeEventListener("pointerup", onUp);
        stage.removeEventListener("pointercancel", onUp);
        stage.removeEventListener("lostpointercapture", onUp);
        document.removeEventListener("visibilitychange", onVisibility);
        motion.removeEventListener("change", onMotion);
        stage.classList.remove("is-dragging");
      };
      observer = new ResizeObserver(draw);
      observer.observe(host);
      draw();
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.domElement.setAttribute("aria-hidden", "true");
        renderer.domElement.className = "cabinet-canvas";
        host.prepend(renderer.domElement);
        // draw() ran before the canvas existed; force its first resize.
        size = { width: 0, height: 0 };
        const contextLost = (event: Event) => {
          event.preventDefault();
          live = false;
          stopAntennaMotion(); stopViewMotion();
          if (!disposed) { viewBlend = 0; pose = { ...TV_REST_POSE }; setLoaded(false); draw(); }
        };
        const contextRestored = () => {
          if (disposed || !model) return;
          live = true; size = { width: 0, height: 0 };
          pose = frontRef.current ? { yaw: 0, pitch: 0 } : { ...explorePose };
          viewBlend = frontRef.current ? 1 : 0;
          draw(); setLoaded(true);
        };
        renderer.domElement.addEventListener("webglcontextlost", contextLost);
        renderer.domElement.addEventListener("webglcontextrestored", contextRestored);
        detachContext = () => {
          renderer?.domElement.removeEventListener("webglcontextlost", contextLost);
          renderer?.domElement.removeEventListener("webglcontextrestored", contextRestored);
        };
        const gltf = await new GLTFLoader().loadAsync("/models/retro-tv.glb");
        if (disposed) { releaseModel(gltf.scene); return; }
        model = gltf.scene;
        scene.add(model);
        model.traverse((object) => {
          originalPositions.set(object, object.position.z);
          if (!object.name.startsWith("Button_") && object.name !== "StandbyLED") return;
          const mesh = object as Mesh;
          if (!mesh.material) return;
          const materials = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map((material) => material.clone() as MeshStandardMaterial);
          mesh.material = materials.length === 1 ? materials[0] : materials;
          buttonMaterials.set(object, materials.map((material) => ({ material, color: material.color.clone() })));
        });
        pressRef.current = (id, pressed) => {
          const button = model?.getObjectByName(`Button_${id}`);
          if (!button || !live) return;
          button.position.z = originalPositions.get(button)! - (pressed ? 0.075 : 0);
          button.scale.setScalar(pressed ? 0.965 : 1);
          for (const { material, color } of buttonMaterials.get(button) ?? []) material.color.copy(color).multiplyScalar(pressed ? 0.65 : 1);
          draw();
        };
        const animateAntennas = (time: number) => {
          antennaFrame = 0;
          if (disposed || !live || document.hidden) return;
          const elapsed = antennaPrevious ? Math.max(1, Math.min(64, time - antennaPrevious)) : 16;
          antennaPrevious = time;
          let disruption = 0;
          for (const [id, target] of antennaTargets) {
            const pivot = model?.getObjectByName(`Antenna_${id}`);
            if (!pivot) { antennaTargets.delete(id); continue; }
            const previous = pivot.rotation.z;
            const eased = dampTVValue(previous, target, elapsed, 85);
            pivot.rotation.z = Math.abs(target - eased) < 0.00015 ? target : eased;
            disruption = Math.max(disruption, antennaDisruption(pivot.rotation.z - previous, elapsed));
            if (pivot.rotation.z === target) antennaTargets.delete(id);
          }
          draw();
          if (disruption && !motion.matches) signalRef.current(disruption);
          if (antennaTargets.size) antennaFrame = requestAnimationFrame(animateAntennas);
          else antennaPrevious = 0;
        };
        adjustRef.current = (id, delta, _elapsed, reset = false) => {
          const pivot = model?.getObjectByName(`Antenna_${id}`);
          if (!pivot || !live || document.hidden) return;
          const next = reset ? 0 : antennaAngle(antennaTargets.get(id) ?? pivot.rotation.z, delta);
          if (motion.matches) { pivot.rotation.z = next; draw(); return; }
          if (next === pivot.rotation.z && !antennaTargets.has(id)) return;
          antennaTargets.set(id, next);
          if (!antennaFrame) antennaFrame = requestAnimationFrame(animateAntennas);
        };
        live = true;
        draw();
        setLoaded(true);
      } catch (error) {
        console.warn("3D television unavailable; using the rendered cabinet.", error);
        renderer?.domElement.remove(); renderer?.dispose(); renderer = undefined;
      }
      if (!disposed) onReady();
    };
    void start().catch((error) => {
      console.warn("Television renderer failed to load.", error);
      if (!disposed) onReady();
    });
    return () => {
      disposed = true;
      stopAntennaMotion(); stopViewMotion();
      observer?.disconnect(); detachContext?.(); detachInteraction?.();
      changeViewRef.current = () => {}; refreshControlsRef.current = () => {};
      pressRef.current = () => {}; adjustRef.current = () => {}; antennaDragRef.current = null;
      if (model) releaseModel(model);
      renderer?.dispose(); renderer?.domElement.remove();
      display.style.removeProperty("transform"); display.style.removeProperty("width"); display.style.removeProperty("height");
      display.style.removeProperty("visibility"); display.inert = false;
    };
  }, [displayRef, onReady]);

  const beginAntenna = (event: PointerEvent<HTMLDivElement>, id: TVAntenna) => {
    event.preventDefault(); event.stopPropagation();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    antennaDragRef.current = { id, x: event.clientX, y: event.clientY, time: event.timeStamp };
  };
  const moveAntenna = (event: PointerEvent<HTMLDivElement>) => {
    const drag = antennaDragRef.current;
    if (!drag) return;
    event.stopPropagation();
    const rect = hostRef.current?.getBoundingClientRect();
    const delta = (event.clientX - drag.x) / Math.max(320, rect?.width ?? 800) * 2.4
      - (event.clientY - drag.y) / Math.max(320, rect?.height ?? 716) * 1.2;
    adjustRef.current(drag.id, -delta, event.timeStamp - drag.time);
    antennaDragRef.current = { id: drag.id, x: event.clientX, y: event.clientY, time: event.timeStamp };
  };
  const endAntenna = () => { antennaDragRef.current = null; };
  const keyAntenna = (event: KeyboardEvent<HTMLDivElement>, id: TVAntenna) => {
    const delta = event.key === "ArrowLeft" || event.key === "ArrowUp" ? 0.06 : event.key === "ArrowRight" || event.key === "ArrowDown" ? -0.06 : 0;
    if (!delta && event.key !== "Home") return;
    event.preventDefault(); event.stopPropagation();
    adjustRef.current(id, delta, 90, event.key === "Home");
  };

  return (
    <div ref={hostRef} className={`television-model ${loaded ? "model-loaded" : ""}`}>
      <Image className="cabinet-poster" src="/models/retro-tv-poster.webp" alt="" fill priority sizes="100vw" aria-hidden="true" />
      <div className="cabinet-inputs" role="group" aria-label="TV controls">
        {TV_CONTROLS.map((control) => (
          <button key={control.id} type="button" data-control={control.id} className={`cabinet-button cabinet-button-${control.id}`}
            aria-label={control.id === "view" ? (frontView ? "Return to 3D view" : "Front view for reading") : control.id === "power" ? (powered ? "Turn TV off" : "Turn TV on") : control.id === "channel-up" ? "Next channel" : "Previous channel"}
            title={control.id === "view" ? "Front view / 3D view" : control.id === "power" ? (powered ? "Turn TV off" : "Turn TV on") : control.id === "channel-up" ? "Next channel (+)" : "Previous channel (−)"}
            aria-pressed={control.id === "view" ? frontView : control.id === "power" ? powered : undefined}
            aria-controls={control.id === "view" ? "television-stage" : undefined}
            disabled={controlsDisabled || (control.id === "power" && powerBusy) || (control.id.startsWith("channel-") && (!powered || powerBusy))}
            onClick={control.id === "view" ? onToggleView : control.id === "power" ? onTogglePower : () => onChannelChange(control.id === "channel-up" ? 1 : -1)}
            onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); pressRef.current(control.id, true); }}
            onPointerUp={() => pressRef.current(control.id, false)} onPointerCancel={() => pressRef.current(control.id, false)}
            onLostPointerCapture={() => pressRef.current(control.id, false)}
            onKeyDown={(event) => { if (event.key === " " || event.key === "Enter") pressRef.current(control.id, true); }}
            onKeyUp={() => pressRef.current(control.id, false)} onBlur={() => pressRef.current(control.id, false)} />
        ))}
        <input type="range" className="cabinet-volume" aria-label="Volume" aria-valuetext={`${volume}%`}
          min={0} max={100} step={1} value={volume} disabled={controlsDisabled} title={`Volume: ${volume}%`}
          onChange={(event) => onVolumeChange(event.currentTarget.valueAsNumber)} />
      </div>
      <div className="antenna-inputs">
        {TV_ANTENNAS.map((antenna) => (
          <div key={antenna.id} data-antenna={antenna.id} className="antenna-handle" role="slider" tabIndex={loaded ? 0 : -1}
            aria-label={antenna.label} aria-valuemin={-39} aria-valuemax={39} aria-valuenow={0} aria-orientation="horizontal"
            title="Drag the antenna to adjust reception" onPointerDown={(event) => beginAntenna(event, antenna.id)}
            onPointerMove={moveAntenna} onPointerUp={endAntenna} onPointerCancel={endAntenna} onLostPointerCapture={endAntenna}
            onKeyDown={(event) => keyAntenna(event, antenna.id)} />
        ))}
      </div>
    </div>
  );
}
