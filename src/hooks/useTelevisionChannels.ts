"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TV_CHANNELS } from "@/lib/television";

export const CHANNEL_STATIC_DURATION = 350;
const FNAF_CHANNEL = TV_CHANNELS.findIndex(channel => channel.id === "fnaf");
const REGULAR_CHANNELS = TV_CHANNELS.flatMap((channel, index) => channel.id === "fnaf" ? [] : [index]);

/** Keep the old picture under snow until the latest requested channel is tuned. */
export function useTelevisionChannels(enabled: boolean) {
  const [channel, setChannel] = useState(0);
  const [switching, setSwitching] = useState(false);
  const currentRef = useRef(0);
  const targetRef = useRef(0);
  const returnChannelRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const settle = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = undefined;
    currentRef.current = targetRef.current;
    setChannel(currentRef.current);
    setSwitching(false);
  }, []);
  const tune = useCallback((target: number) => {
    targetRef.current = target;
    clearTimeout(timerRef.current);
    if (document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { settle(); return; }
    setSwitching(true);
    timerRef.current = setTimeout(settle, CHANNEL_STATIC_DURATION);
  }, [settle]);
  const changeChannel = useCallback((direction: -1 | 1) => {
    if (!enabled || (direction !== -1 && direction !== 1)) return;
    // Either button leaves FNAF for the last watched normal channel. Repeated
    // presses during that exit keep the same destination, rather than cycling.
    if (currentRef.current === FNAF_CHANNEL || targetRef.current === FNAF_CHANNEL) {
      tune(returnChannelRef.current);
      return;
    }
    const index = REGULAR_CHANNELS.indexOf(targetRef.current);
    tune(REGULAR_CHANNELS[(index + direction + REGULAR_CHANNELS.length) % REGULAR_CHANNELS.length]);
  }, [enabled, tune]);
  const enterFnaf = useCallback(() => {
    if (!enabled || currentRef.current === FNAF_CHANNEL || targetRef.current === FNAF_CHANNEL) return;
    returnChannelRef.current = currentRef.current;
    tune(FNAF_CHANNEL);
  }, [enabled, tune]);

  useEffect(() => {
    // Power-off/startup cancel an unfinished tune; never change a hidden TV's channel.
    if (!enabled) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
      targetRef.current = currentRef.current;
      setSwitching(false);
    }
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onVisibility = () => { if (document.hidden) settle(); };
    const onMotion = () => { if (motion.matches) settle(); };
    document.addEventListener("visibilitychange", onVisibility);
    motion.addEventListener("change", onMotion);
    return () => {
      clearTimeout(timerRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
      motion.removeEventListener("change", onMotion);
    };
  }, [enabled, settle]);

  return { channel, switching, changeChannel, enterFnaf };
}
