export const TV_SCREEN = { x: -1.05, y: 0.12, z: 1.325, width: 10.4, height: 7.48 } as const;
export const TV_CONTROLS = [
  { id: "channel-up", label: "Channel up", x: 5.10, y: 2.35, width: 0.78, height: 0.58 },
  { id: "channel-down", label: "Channel down", x: 6.02, y: 2.35, width: 0.78, height: 0.58 },
  { id: "volume-up", label: "Volume up", x: 5.10, y: 1.38, width: 0.78, height: 0.58 },
  { id: "volume-down", label: "Volume down", x: 6.02, y: 1.38, width: 0.78, height: 0.58 },
  { id: "menu", label: "Menu", x: 5.56, y: 0.37, width: 1.7, height: 0.5 },
  { id: "power", label: "Power", x: 5.56, y: -3.08, width: 0.9, height: 0.9 },
] as const;
export type TVControl = (typeof TV_CONTROLS)[number]["id"];

/** A taller cabinet on narrow displays keeps all four rows readable without scrolling. */
export function televisionViewport(width: number, height: number) {
  const aspect = Math.max(1, width) / Math.max(1, height);
  const cabinetHeight = aspect < 1 ? 1.72 : 1;
  const viewWidth = Math.max(15.2, 10.1 * cabinetHeight * aspect);
  return { cabinetHeight, viewWidth, viewHeight: viewWidth / aspect };
}
