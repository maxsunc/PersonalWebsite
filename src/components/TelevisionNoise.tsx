"use client";

import { useEffect, useRef } from "react";

/** Faint, coarse phosphor noise. Stops scheduling frames when paused or hidden. */
export default function TelevisionNoise({ paused }: { paused: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !context) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pixels = context.createImageData(canvas.width, canvas.height);
    let frame = 0;
    let previous = -Infinity;

    const paint = () => {
      for (let i = 0; i < pixels.data.length; i += 4) {
        const level = Math.random() * 255;
        pixels.data[i] = level;
        pixels.data[i + 1] = level;
        pixels.data[i + 2] = level;
        pixels.data[i + 3] = 255;
      }
      context.putImageData(pixels, 0, 0);
    };
    const draw = (time: number) => {
      if (time - previous >= 1000 / 12) {
        previous = time;
        paint();
      }
      frame = requestAnimationFrame(draw);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      if (!paused && !motion.matches && !document.hidden) {
        frame = requestAnimationFrame(draw);
      }
    };
    paint();
    sync();
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      cancelAnimationFrame(frame);
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [paused]);

  return <canvas ref={canvasRef} className="phosphor-noise" width={240} height={160} aria-hidden="true" />;
}
