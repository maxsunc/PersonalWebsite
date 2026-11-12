"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import TelevisionSketch from "@/components/TelevisionSketch";
import portrait from "@/data/ascii-portrait.json";
import {
  asciiGlyph,
  crtWarp,
  crtSnow,
  phosphorWeight,
  portraitCell,
  portraitRefresh,
  portraitStartup,
} from "@/lib/ascii-portrait";

const tones = portrait.tones.flatMap((row) =>
  Array.from(row, (value) => parseInt(value, 16) / 15),
);
const fallback = portrait.tones
  .map((row) =>
    Array.from(row, (value) =>
      asciiGlyph(Math.pow(parseInt(value, 16) / 15, 0.78)),
    ).join(""),
  )
  .join("\n");
const FRAME_INTERVAL = 1000 / 16;

export default function AsciiPortrait() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(false);
  const playbackRef = useRef<(() => void) | null>(null);
  const [paused, setPaused] = useState(false);

  const togglePlayback = () => {
    const next = !paused;
    pausedRef.current = next;
    setPaused(next);
    playbackRef.current?.();
  };

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!root || !canvas || !context) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastFrame = 0;
    let inView = !window.IntersectionObserver;
    const start = performance.now();
    const history = document.createElement("canvas");
    const historyContext = history.getContext("2d");
    const stage = root.closest(".landing-stage");
    const snow = document.createElement("canvas");
    snow.width = 144;
    snow.height = 108;
    const snowContext = snow.getContext("2d");
    const snowPixels = snowContext?.createImageData(snow.width, snow.height);
    let hasHistory = false;
    let startupComplete = motion.matches;
    let lastDraw = start;

    const draw = (timestamp: number, animated: boolean) => {
      if (!width || !height) return;
      // Preserve the face's proportions inside the TV's inset glass screen.
      const portraitWidth = Math.min(width, height * 0.8);
      const portraitHeight = portraitWidth / 0.8;
      const left = (width - portraitWidth) / 2;
      const top = (height - portraitHeight) / 2;
      const cellWidth = portraitWidth / portrait.columns;
      const time = (timestamp - start) / 1000;
      const picture = portraitStartup(
        time,
        animated &&
          !startupComplete &&
          !stage?.classList.contains("intro-skipped"),
      );
      if (picture === 1) startupComplete = true;
      const emission = 0.78 + portraitRefresh(0.5, time, animated) * 0.22;
      root.parentElement?.style.setProperty(
        "--screen-output",
        String(emission),
      );
      const persistence = phosphorWeight(
        timestamp - lastDraw,
        animated && hasHistory && picture === 1,
      );
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "source-over";
      if (picture < 1 && snowContext && snowPixels) {
        const noiseFrame = Math.floor(time * 12);
        for (let row = 0; row < snow.height; row++) {
          for (let column = 0; column < snow.width; column++) {
            const offset = (row * snow.width + column) * 4;
            const level = crtSnow(column, row, noiseFrame);
            snowPixels.data[offset] = level;
            snowPixels.data[offset + 1] = level + 3;
            snowPixels.data[offset + 2] = level;
            snowPixels.data[offset + 3] = 255;
          }
        }
        snowContext.putImageData(snowPixels, 0, 0);
        context.globalAlpha = 1 - picture;
        context.imageSmoothingEnabled = false;
        context.drawImage(snow, 0, 0, width, height);
        context.imageSmoothingEnabled = true;
      }
      if (persistence > 0) {
        context.globalAlpha = persistence;
        context.drawImage(history, 0, 0, width, height);
        // Weighted addition keeps a still character's brightness stable.
        context.globalCompositeOperation = "lighter";
      }
      context.font = `${cellWidth / 0.6}px "Courier New", monospace`;
      context.textAlign = "center";
      context.textBaseline = "middle";

      for (let row = 0; picture > 0 && row < portrait.rows; row++) {
        const refresh = portraitRefresh(
          row / (portrait.rows - 1),
          time,
          animated,
        );
        for (let column = 0; column < portrait.columns; column++) {
          const tone = tones[row * portrait.columns + column];
          const cell = portraitCell(tone, column, row, time, animated, refresh);
          if (cell.glyph === " ") continue;
          context.fillStyle = cell.accent ? "#d6f369" : "#e9e8df";
          context.globalAlpha = cell.alpha * picture * (1 - persistence);
          const position = crtWarp(
            (column + 0.5 + cell.x) / portrait.columns,
            (row + 0.5 + cell.y) / portrait.rows,
          );
          context.fillText(
            cell.glyph,
            left + position.x * portraitWidth,
            top + position.y * portraitHeight,
          );
        }
      }
      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";
      if (historyContext) {
        historyContext.clearRect(0, 0, width, height);
        if (animated && picture === 1)
          historyContext.drawImage(canvas, 0, 0, width, height);
      }
      hasHistory = animated && picture === 1 && historyContext !== null;
      lastDraw = timestamp;
      root.classList.add("is-rendered");
    };

    const tick = (timestamp: number) => {
      if (timestamp - lastFrame >= FRAME_INTERVAL) {
        draw(timestamp, true);
        lastFrame = timestamp;
      }
      frame = window.requestAnimationFrame(tick);
    };

    const syncPlayback = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      if (inView && !document.hidden && !motion.matches && !pausedRef.current) {
        frame = window.requestAnimationFrame(tick);
      } else if (motion.matches || pausedRef.current) {
        draw(start, false);
      }
    };

    const resize = () => {
      // Layout dimensions exclude the scroll-driven transform on the parent.
      width = root.clientWidth;
      height = root.clientHeight;
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      history.width = canvas.width;
      history.height = canvas.height;
      historyContext?.setTransform(scale, 0, 0, scale, 0, 0);
      hasHistory = false;
      const animated = !motion.matches && !pausedRef.current;
      draw(animated ? performance.now() : start, animated);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    const intersectionObserver = window.IntersectionObserver
      ? new IntersectionObserver(([entry]) => {
          inView = entry.isIntersecting;
          syncPlayback();
        })
      : null;
    intersectionObserver?.observe(root);
    playbackRef.current = syncPlayback;
    resize();
    syncPlayback();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", syncPlayback);
    motion.addEventListener("change", syncPlayback);
    return () => {
      playbackRef.current = null;
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver?.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", syncPlayback);
      motion.removeEventListener("change", syncPlayback);
    };
  }, []);

  return (
    <div className="crt-object">
      <div className="ascii-portrait-shell">
        <TelevisionSketch />
        <div
          ref={rootRef}
          className="ascii-portrait"
          role="img"
          aria-label="ASCII portrait of Max Sun"
        >
          <canvas ref={canvasRef} aria-hidden="true" />
          <pre className="ascii-portrait-fallback" aria-hidden="true">
            {fallback}
          </pre>
        </div>
        <span className="crt-power-light" aria-hidden="true" />
        <button
          type="button"
          className="ascii-portrait-toggle"
          onClick={togglePlayback}
          aria-label={
            paused ? "Resume portrait animation" : "Pause portrait animation"
          }
          title={
            paused ? "Resume portrait animation" : "Pause portrait animation"
          }
        >
          {paused ? (
            <Play size={15} aria-hidden="true" />
          ) : (
            <Pause size={15} aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
