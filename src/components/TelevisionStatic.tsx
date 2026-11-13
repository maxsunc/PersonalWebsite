"use client";

import { useEffect, useRef } from "react";

/** Startup is only analog snow: no captions, logos, progress UI, or controls. */
export default function TelevisionStatic({ active, abrupt = false }: { active: boolean; abrupt?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !context) return;
    const pixels = context.createImageData(canvas.width, canvas.height);
    let frame = 0;
    let previous = -Infinity;
    const draw = (time: number) => {
      if (time - previous >= 1000 / (abrupt ? 30 : 18)) {
        previous = time;
        for (let row = 0; row < canvas.height; row++) {
          const band = Math.sin(row * 0.09 + time * (abrupt ? 0.022 : 0.006)) * (abrupt ? 44 : 20);
          for (let column = 0; column < canvas.width; column++) {
            const offset = (row * canvas.width + column) * 4;
            const tone = Math.random() * 195 + band;
            pixels.data[offset] = tone;
            pixels.data[offset + 1] = tone + 3;
            pixels.data[offset + 2] = tone;
            pixels.data[offset + 3] = 255;
          }
        }
        context.putImageData(pixels, 0, 0);
      }
      frame = requestAnimationFrame(draw);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) frame = requestAnimationFrame(draw);
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [active, abrupt]);

  return <canvas ref={canvasRef} width={320} height={240} aria-hidden="true" />;
}
