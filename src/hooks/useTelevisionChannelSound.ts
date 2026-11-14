"use client";

import { useCallback, useEffect, useRef } from "react";
import { CHANNEL_STATIC_DURATION } from "@/hooks/useTelevisionChannels";
import { clampTVVolume } from "@/lib/television";

export function useTelevisionChannelSound(enabled: boolean, volume: number, changeChannel: (direction: -1 | 1) => void) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const stop = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = undefined;
    audioRef.current?.pause();
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = clampTVVolume(volume) / 100;
  }, [volume]);

  useEffect(() => {
    if (!enabled) stop();
    return stop;
  }, [enabled, stop]);

  return useCallback((direction: -1 | 1) => {
    if (!enabled || (direction !== -1 && direction !== 1)) return;
    changeChannel(direction);
    stop();
    const audio = audioRef.current ?? (audioRef.current = new Audio("/sfx/staticSfx.mp3"));
    audio.volume = clampTVVolume(volume) / 100;
    audio.currentTime = 0;
    // Start inside the button gesture; blocked/unavailable audio must not break tuning.
    void audio.play().catch(() => {});
    timerRef.current = setTimeout(stop, CHANNEL_STATIC_DURATION);
  }, [enabled, volume, changeChannel, stop]);
}
