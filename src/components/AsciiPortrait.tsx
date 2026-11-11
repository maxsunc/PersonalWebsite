"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import portrait from "@/data/ascii-portrait.json";
import {
  asciiGlyph,
  phosphorWeight,
  portraitCell,
  portraitRefresh,
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
    let hasHistory = false;
    let lastDraw = start;

    const draw = (timestamp: number, animated: boolean) => {
      if (!width || !height) return;
      const cellWidth = width / portrait.columns;
      const cellHeight = height / portrait.rows;
      const time = (timestamp - start) / 1000;
      const persistence = phosphorWeight(
        timestamp - lastDraw,
        animated && hasHistory,
      );
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "source-over";
      if (persistence > 0) {
        context.globalAlpha = persistence;
        context.drawImage(history, 0, 0, width, height);
        // Weighted addition keeps a still character's brightness stable.
        context.globalCompositeOperation = "lighter";
      }
      context.font = `${cellWidth / 0.6}px "Courier New", monospace`;
      context.textAlign = "center";
      context.textBaseline = "middle";

      for (let row = 0; row < portrait.rows; row++) {
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
          context.globalAlpha = cell.alpha * (1 - persistence);
          context.fillText(
            cell.glyph,
            (column + 0.5 + cell.x) * cellWidth,
            (row + 0.5 + cell.y) * cellHeight,
          );
        }
      }
      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";
      if (historyContext) {
        historyContext.clearRect(0, 0, width, height);
        if (animated) historyContext.drawImage(canvas, 0, 0, width, height);
      }
      hasHistory = animated && historyContext !== null;
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
      } else {
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
    <div className="ascii-portrait-shell">
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
  );
}
