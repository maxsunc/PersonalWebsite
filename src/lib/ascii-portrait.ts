export const ASCII_RAMP = " .,:;i1tfLCG08@";

export function asciiGlyph(tone: number, variation = 0) {
  const level = Math.max(0, Math.min(1, tone + variation));
  return ASCII_RAMP[Math.round(level * (ASCII_RAMP.length - 1))];
}

export function portraitNoise(seed: number) {
  let value = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  value ^= value >>> 13;
  return (value >>> 0) / 0xffffffff;
}

// The band starts and ends beyond the frame, so wrapping never flashes an edge.
export const CRT_REFRESH_SECONDS = 9;

export function portraitRefresh(row: number, time: number, animated: boolean) {
  if (!animated) return 0;
  const phase =
    ((time % CRT_REFRESH_SECONDS) + CRT_REFRESH_SECONDS) % CRT_REFRESH_SECONDS;
  const center = 1.16 - (phase / CRT_REFRESH_SECONDS) * 1.32;
  const distance = Math.abs(row - center);
  return distance >= 0.14 ? 0 : (1 + Math.cos((distance / 0.14) * Math.PI)) / 2;
}

export function phosphorWeight(elapsedMs: number, animated: boolean) {
  if (!animated) return 0;
  // A faint previous frame, decaying with real time rather than frame count.
  return Math.min(0.18, Math.exp(-Math.max(0, elapsedMs) / 38));
}

export function portraitCell(
  tone: number,
  column: number,
  row: number,
  time: number,
  animated: boolean,
  refresh = 0,
) {
  const band = animated ? Math.max(0, Math.min(1, refresh)) : 0;
  const seed = column + row * 4099;
  const phase = animated ? Math.floor(time * 5) : 0;
  const noise = portraitNoise(seed + phase * 92821);
  const variation = animated ? (noise - 0.5) * (0.07 + band * 0.04) : 0;
  return {
    glyph: asciiGlyph(Math.pow(tone, 0.78), variation),
    alpha: Math.min(0.98, 0.35 + tone * 0.6 + band * 0.065),
    accent: tone > 0.4 && noise > 0.985,
    x: animated ? Math.sin(row * 0.17 + time * 0.65) * 0.35 : 0,
    y: animated ? Math.cos(column * 0.13 + time * 0.45) * 0.15 : 0,
  };
}
