export const TV_SCREEN = { x: -1.05, y: 0.12, z: 1.325, width: 10.4, height: 7.48 } as const;
// A fixed logical screen, not the camera's projected bounding rectangle. Keep
// the normal view's compact, single-column layout in every camera/view mode.
export const TV_DISPLAY_WIDTH = 640;
export function televisionScreenLayout(cabinetHeight: number) {
  return { width: TV_DISPLAY_WIDTH, height: TV_DISPLAY_WIDTH * TV_SCREEN.height * cabinetHeight / TV_SCREEN.width };
}
type ScreenPoint = { x: number; y: number };
export function televisionScreenTransform(tl: ScreenPoint, tr: ScreenPoint, bl: ScreenPoint, cabinetHeight: number) {
  return televisionPlaneTransform(tl, tr, bl, televisionScreenLayout(cabinetHeight));
}
export function televisionPlaneTransform(tl: ScreenPoint, tr: ScreenPoint, bl: ScreenPoint, { width, height }: { width: number; height: number }) {
  return [
    (tr.x - tl.x) / width, (tr.y - tl.y) / width,
    (bl.x - tl.x) / height, (bl.y - tl.y) / height,
    tl.x, tl.y,
  ];
}
export const TV_CONTROLS = [
  { id: "channel-up", label: "Channel up", x: 5.10, y: 2.35, width: 0.78, height: 0.58 },
  { id: "channel-down", label: "Channel down", x: 6.02, y: 2.35, width: 0.78, height: 0.58 },
  { id: "view", label: "Front view", x: 5.56, y: 0.37, width: 1.7, height: 0.5 },
  { id: "power", label: "Power", x: 5.56, y: -3.08, width: 0.9, height: 0.9 },
] as const;
export type TVControl = (typeof TV_CONTROLS)[number]["id"];
export const TV_VOLUME = { x: 5.56, y: 1.38, z: 1.50, width: 1.72, height: 0.52, minX: 4.92, maxX: 6.20 } as const;
export function clampTVVolume(value: number) {
  return Number.isFinite(value) ? Math.round(Math.max(0, Math.min(100, value))) : 50;
}
export function televisionVolumePosition(value: number) {
  return TV_VOLUME.minX + (TV_VOLUME.maxX - TV_VOLUME.minX) * clampTVVolume(value) / 100;
}
export const TV_ANTENNAS = [
  { id: "left", label: "Left antenna" },
  { id: "right", label: "Right antenna" },
] as const;
export type TVAntenna = (typeof TV_ANTENNAS)[number]["id"];
export const TV_REST_POSE = { yaw: 0.28, pitch: 0.14 } as const;
export const ANTENNA_LIMIT = 0.68;
export const TV_VIEW_DURATION = 650;

/** Travel to an equivalent angle by the shortest arc, even after many turns. */
export function nearestTVYaw(current: number, target: number) {
  return current + Math.atan2(Math.sin(target - current), Math.cos(target - current));
}
export function tvViewProgress(elapsedMs: number) {
  const t = Math.max(0, Math.min(1, elapsedMs / TV_VIEW_DURATION));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function orbitTVPose(yaw: number, pitch: number) {
  // Yaw is deliberately unbounded: repeated drags can travel all the way around.
  return { yaw, pitch: Math.max(-Math.PI / 2 + 0.04, Math.min(Math.PI / 2 - 0.04, pitch)) };
}
export function isTVScreenVisible(yaw: number, pitch: number) {
  // Cull only the back face, not shallow front/side views. The tiny tolerance
  // keeps exact edge-on angles stable across floating-point/full-turn error.
  return Math.cos(yaw) * Math.cos(pitch) >= -1e-10;
}
export function fitTVProjection(points: { x: number; y: number }[]) {
  const extent = points.reduce((max, point) => Math.max(max, Math.abs(point.x), Math.abs(point.y)), 0);
  return Math.min(1, 0.94 / Math.max(0.001, extent));
}
export function antennaAngle(angle: number, delta: number) {
  return Math.max(-ANTENNA_LIMIT, Math.min(ANTENNA_LIMIT, angle + delta));
}
/** Frame-rate-independent easing, shared by the antenna and reception envelope. */
export function dampTVValue(current: number, target: number, elapsedMs: number, responseMs: number) {
  return current + (target - current) * (1 - Math.exp(-Math.max(0, elapsedMs) / responseMs));
}
/** Actual angular speed drives reception: no minimum flash or event-size bias. */
export function antennaDisruption(delta: number, elapsedMs: number) {
  const speed = Math.abs(delta) * 1000 / Math.max(1, elapsedMs);
  return 0.85 * speed / (speed + 1.8);
}

/** A taller cabinet on narrow displays keeps all four rows readable without scrolling. */
export function televisionViewport(width: number, height: number, frontView = false) {
  const aspect = Math.max(1, width) / Math.max(1, height);
  // Canvas height changes framing, never the cabinet's physical proportions.
  const cabinetHeight = width <= 680 ? 1.72 : 1;
  const viewWidth = frontView
    ? Math.max(15.2, 10.1 * cabinetHeight * aspect)
    : Math.max(16.2, 14.5 * cabinetHeight * aspect);
  return { cabinetHeight, viewWidth, viewHeight: viewWidth / aspect };
}
