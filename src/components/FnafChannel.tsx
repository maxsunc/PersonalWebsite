"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Load on first tune-in, then preserve the runtime until the page is closed. */
export default function FnafChannel({ volume, active }: { volume: number; active: boolean }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [started, setStarted] = useState(false);
  useEffect(() => { if (active) setStarted(true); }, [active]);
  const audibleVolume = active ? volume : 0;
  const syncVolume = useCallback(() => {
    frame.current?.contentWindow?.postMessage({ type: "fnaf-volume", volume: audibleVolume }, window.location.origin);
  }, [audibleVolume]);

  useEffect(syncVolume, [syncVolume]);

  if (!started) return null;

  return <iframe ref={frame} className="fnaf-frame" src="/games/fnaf1/index.html"
    style={{ display: active ? "block" : "none" }} aria-hidden={!active} tabIndex={active ? 0 : -1}
    title="Five Nights at Freddy’s 1" onLoad={syncVolume} allow="autoplay" />;
}
