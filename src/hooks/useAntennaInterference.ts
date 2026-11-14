"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dampTVValue } from "@/lib/television";

export const INTERFERENCE_HOLD = 100;

/** A velocity-driven envelope: gentle attack, continuous tracking, soft recovery. */
export function useAntennaInterference(paused: boolean) {
  const [strength, setStrength] = useState(0);
  const frameRef = useRef<number | undefined>(undefined);
  const envelopeRef = useRef({ current: 0, target: 0, inputTime: 0, previous: 0 });
  const disturb = useCallback((amount: number) => {
    if (paused || document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !Number.isFinite(amount)) return;
    const envelope = envelopeRef.current;
    envelope.target = Math.max(0, Math.min(0.85, amount));
    envelope.inputTime = performance.now();
    if (frameRef.current !== undefined) return;
    envelope.previous = envelope.inputTime;
    const tick = (time: number) => {
      frameRef.current = undefined;
      const elapsed = Math.max(0, Math.min(64, time - envelope.previous));
      envelope.previous = time;
      const expired = time - envelope.inputTime >= INTERFERENCE_HOLD;
      const target = expired ? 0 : envelope.target;
      envelope.current = dampTVValue(envelope.current, target, elapsed, target > envelope.current ? 110 : 240);
      if (expired && envelope.current < 0.0005) {
        envelope.current = 0;
        setStrength(0);
        return;
      }
      setStrength(envelope.current);
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  }, [paused]);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stop = () => {
      if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
      frameRef.current = undefined;
      envelopeRef.current.current = envelopeRef.current.target = 0;
    };
    const clear = () => { stop(); setStrength(0); };
    const onMotion = () => { if (motion.matches) clear(); };
    const onVisibility = () => { if (document.hidden) clear(); };
    if (paused) clear();
    motion.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      motion.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [paused]);

  return { strength, disturb };
}
