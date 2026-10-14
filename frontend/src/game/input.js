import { SHOTS } from "./constants";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function pointerInput(engine, point, aiming = false) {
  if (!engine.mouseEnabled || !point || !["serve", "rally", "pointOver", "faultPause"].includes(engine.state)) return;
  if (!aiming) {
    engine.pointerTarget = { x: clamp(point.x, -7, 7), z: clamp(point.z, 0.7, 14.6) };
    engine.pointerAim = null;
  } else {
    engine.pointerTarget = null;
    const serving = engine.state === "serve" && engine.server === 0;
    const x = serving ? engine.boxSign * clamp(Math.abs(point.x), 0.8, 3.5) : clamp(point.x, -3.6, 3.6);
    engine.pointerAim = { x, z: -(serving ? SHOTS.serve.depth : SHOTS[engine.selectedShot].depth) };
  }
}

export function movementDirection(engine) {
  const { keys, pointerTarget, p } = engine;
  let dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  let dz = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
  if (dx || dz) {
    const distance = Math.hypot(dx, dz);
    return { dx: dx / distance, dz: dz / distance };
  }
  if (!pointerTarget) return { dx: 0, dz: 0 };
  dx = pointerTarget.x - p.x; dz = pointerTarget.z - p.z;
  const distance = Math.hypot(dx, dz);
  if (distance < 0.08) return { dx: 0, dz: 0 };
  // Ease into the destination instead of overshooting/oscillating around the cursor.
  const speed = Math.min(1, distance / 0.65);
  return { dx: dx / distance * speed, dz: dz / distance * speed };
}