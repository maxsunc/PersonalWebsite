"use client";

import { useEffect, useState } from "react";

export const STATIC_DURATION = 2500;

/** The timed static sequence starts only once the cabinet (or fallback) is ready. */
export function useTelevisionStartup(modelReady: boolean) {
  const [tuning, setTuning] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = () => {
      clearTimeout(timer);
      setTuning(false);
    };
    const onMotionChange = () => { if (motion.matches) stop(); };
    if (motion.matches) stop();
    else {
      setTuning(true);
      if (modelReady) timer = setTimeout(stop, STATIC_DURATION);
    }
    motion.addEventListener("change", onMotionChange);
    return () => {
      clearTimeout(timer);
      motion.removeEventListener("change", onMotionChange);
    };
  }, [modelReady]);

  return tuning;
}
