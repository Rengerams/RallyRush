const BASE_ASPECT = 16 / 9;
const BASE_FOV = 46;
const MIN_WIDE_FOV = 34;
const BASE_HEIGHT = 720;
const MAX_DESKTOP_ZOOM = 0.08;
const HEIGHT_ZOOM_END_ASPECT = 2.1;

export function getCameraFovForAspect(aspect) {
  if (!Number.isFinite(aspect) || aspect <= 0) return BASE_FOV;
  if (aspect < 1) return 58;
  if (aspect <= BASE_ASPECT) return BASE_FOV;

  // Keep horizontal coverage close to the 16:9 composition while using the
  // extra width of ultrawide screens to make the court larger vertically.
  const baseHalfFov = (BASE_FOV * Math.PI) / 360;
  const halfFov = Math.atan(Math.tan(baseHalfFov) * BASE_ASPECT / aspect);
  return Math.max(MIN_WIDE_FOV, (halfFov * 360) / Math.PI);
}

export function getCameraDistanceScale(aspect, height) {
  if (!Number.isFinite(aspect) || aspect <= 0 || !Number.isFinite(height) || height <= BASE_HEIGHT) return 1;
  const heightProgress = Math.min((height - BASE_HEIGHT) / BASE_HEIGHT, 1);
  const aspectProgress = Math.max(0, Math.min((aspect - BASE_ASPECT) / (HEIGHT_ZOOM_END_ASPECT - BASE_ASPECT), 1));
  const smoothAspectFade = aspectProgress * aspectProgress * (3 - 2 * aspectProgress);
  const zoomFade = 1 - smoothAspectFade;
  return 1 - MAX_DESKTOP_ZOOM * heightProgress * zoomFade;
}
