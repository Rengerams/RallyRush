import { describe, expect, it } from "vitest";
import { BALL, COURT, SHOTS } from "../constants";
import { solveShot } from "../physics";

function netHeightAtCrossing(from, velocity, spin) {
  const timeToNet = Math.abs(from.z / velocity.vz);
  const gravity = BALL.gravity + spin * BALL.magnus;
  return from.y + velocity.vy * timeToNet - 0.5 * gravity * timeToNet ** 2;
}

describe("shot trajectory clearance", () => {
  it.each([
    { name: "baseline contact", from: { x: 0, y: 2.2, z: 11.5 } },
    { name: "near-net contact", from: { x: 0, y: 2.5, z: 1.5 } },
  ])("clears the requested net margin for every shot from $name", ({ from }) => {
    for (const shot of Object.values(SHOTS)) {
      const target = { x: 2.2, z: -shot.depth };
      const velocity = solveShot(from, target, shot.h, shot.spin, shot.clear);
      const expectedClear = Math.min(shot.clear, 0.15 + Math.abs(from.z) * 0.35);

      expect(Number.isFinite(velocity.vx)).toBe(true);
      expect(Number.isFinite(velocity.vy)).toBe(true);
      expect(Number.isFinite(velocity.vz)).toBe(true);
      expect(netHeightAtCrossing(from, velocity, shot.spin)).toBeGreaterThanOrEqual(COURT.netH + expectedClear - 1e-6);
      const flightTime = Math.hypot(target.x - from.x, target.z - from.z) / Math.hypot(velocity.vx, velocity.vz);
      const gravity = BALL.gravity + shot.spin * BALL.magnus;
      expect(from.y + velocity.vy * flightTime - 0.5 * gravity * flightTime ** 2).toBeCloseTo(0, 8);
    }
  });
});
