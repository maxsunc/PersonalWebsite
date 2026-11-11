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

export function portraitCell(
  tone: number,
  column: number,
  row: number,
  time: number,
  animated: boolean,
) {
  const seed = column + row * 4099;
  const phase = animated ? Math.floor(time * 5) : 0;
  const noise = portraitNoise(seed + phase * 92821);
  const variation = animated ? (noise - 0.5) * 0.07 : 0;
  return {
    glyph: asciiGlyph(Math.pow(tone, 0.78), variation),
    alpha: 0.35 + tone * 0.6,
    accent: tone > 0.4 && noise > 0.985,
    x: animated ? Math.sin(row * 0.17 + time * 0.65) * 0.35 : 0,
    y: animated ? Math.cos(column * 0.13 + time * 0.45) * 0.15 : 0,
  };
}
