import { BALL, COURT } from "./constants";

function netCollision(b, pz) {
  b.z = Math.sign(pz) * 0.06;
  b.vz = -b.vz * 0.12;
  b.vx *= 0.3;
  b.netHit = true;
}

function groundBounce(b, surf) {
  b.y = 0;
  b.vy = -b.vy * BALL.bounce * surf.bounce;
  const f = BALL.friction * surf.friction;
  b.vx *= f;
  b.vz *= f;
  if (b.spin >= 0.8) { b.vz *= 1.08; b.vy *= 1.1; }
  else if (b.spin <= -0.8) { b.vz *= 0.88; b.vy *= 0.65; }
  b.spin *= 0.5;
  if (b.vy < 0.4) b.vy = 0;
}

export function stepBall(b, dt, surf) {
  const g = BALL.gravity + b.spin * BALL.magnus;
  const pz = b.z;
  b.vy -= g * dt;
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  b.z += b.vz * dt;
  let ev = null;
  if (!b.netHit && pz * b.z < 0 && Math.abs(b.x) < COURT.doublesHalfW + 0.9 && b.y < COURT.netH) {
    netCollision(b, pz);
    ev = "net";
  }
  if (b.y <= 0 && b.vy < 0) {
    groundBounce(b, surf);
    ev = ev || "bounce";
  }
  return ev;
}

export function solveShot(from, target, h, spin, minClear) {
  const g = BALL.gravity + spin * BALL.magnus;
  const dx = target.x - from.x;
  const dz = target.z - from.z;
  const dist = Math.hypot(dx, dz);
  const clear = Math.min(minClear, 0.15 + Math.abs(from.z) * 0.35);
  let speed = h;
  let out = null;
  for (let i = 0; i < 30 && speed > h * 0.4; i++) {
    const t = dist / speed;
    const vy = (-from.y + 0.5 * g * t * t) / t;
    out = { vx: dx / t, vy, vz: dz / t };
    const tn = Math.abs(from.z / out.vz);
    const yNet = from.y + vy * tn - 0.5 * g * tn * tn;
    if (yNet >= COURT.netH + clear) return out;
    speed *= 0.93;
  }
  return out;
}

export function isIn(b, side, serveBox) {
  const onSide = side < 0 ? b.z < 0 : b.z > 0;
  if (!onSide) return false;
  if (serveBox) {
    return Math.abs(b.z) <= COURT.serviceLine + 0.05 && Math.abs(b.x) <= COURT.singlesHalfW + 0.05 && b.x * serveBox >= -0.05;
  }
  return Math.abs(b.x) <= COURT.singlesHalfW + 0.05 && Math.abs(b.z) <= COURT.halfLen + 0.05;
}

export function predictIntercept({ ball, ai, speed, reactLeft = 0, surf, volleyOK = false, serveBox = 0, startBounces = 0 }) {
  const b = { ...ball };
  const dt = 1 / 60;
  let bounces = startBounces;
  let firstOut = false;
  let best = null;
  let last = null;
  for (let i = 1; i <= 220; i++) {
    const ev = stepBall(b, dt, surf);
    const t = i * dt;
    if (ev === "net") return { x: ai.x, z: ai.z, firstOut: true };
    if (ev === "bounce") {
      bounces++;
      if (bounces === 1) firstOut = !isIn(b, -1, serveBox);
      if (bounces >= 2) break;
    }
    if (b.z > -0.5) continue;
    const reachable = (bounces >= 1 && b.y < 2.2 && b.y > 0.12) || (volleyOK && bounces === 0 && b.y < 2.3 && b.z > -7);
    if (!reachable) continue;
    last = { x: b.x, z: b.z };
    const need = Math.max(0, Math.hypot(b.x - ai.x, b.z - ai.z) - 1.2);
    if (need / speed <= t - reactLeft) { best = last; break; }
  }
  const r = best || last || { x: ball.x, z: -11 };
  return { ...r, firstOut };
}
