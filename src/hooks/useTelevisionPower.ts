"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type TVPowerPhase = "on" | "turning-off" | "off" | "turning-on";
export const TV_POWER_OFF_DURATION = 180;
export const TV_POWER_ON_DURATION = 500;

/** One bounded CRT collapse per press; power can always be restored. */
export function useTelevisionPower() {
  const [phase, setPhase] = useState<TVPowerPhase>("on");
  const phaseRef = useRef<TVPowerPhase>("on");
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const togglePower = useCallback(() => {
    if (phaseRef.current === "turning-off" || phaseRef.current === "turning-on") return;
    const turningOff = phaseRef.current === "on";
    const finish = () => {
      phaseRef.current = turningOff ? "off" : "on";
      setPhase(phaseRef.current);
      timerRef.current = undefined;
    };
    if (document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { finish(); return; }
    phaseRef.current = turningOff ? "turning-off" : "turning-on";
    setPhase(phaseRef.current);
    timerRef.current = setTimeout(finish, turningOff ? TV_POWER_OFF_DURATION : TV_POWER_ON_DURATION);
  }, []);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const settle = () => {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
      if (phaseRef.current === "turning-off") phaseRef.current = "off";
      else if (phaseRef.current === "turning-on") phaseRef.current = "on";
      else return;
      setPhase(phaseRef.current);
    };
    const onVisibility = () => { if (document.hidden) settle(); };
    const onMotion = () => { if (motion.matches) settle(); };
    document.addEventListener("visibilitychange", onVisibility);
    motion.addEventListener("change", onMotion);
    return () => {
      clearTimeout(timerRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
      motion.removeEventListener("change", onMotion);
    };
  }, []);

  return { phase, powered: phase === "on" || phase === "turning-on", transitioning: phase === "turning-off" || phase === "turning-on", togglePower };
}
