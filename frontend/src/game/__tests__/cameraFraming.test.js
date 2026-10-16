import { describe, expect, it } from "vitest";
import { getCameraDistanceScale, getCameraFovForAspect } from "../three/cameraFraming";

const horizontalFov = (verticalFov, aspect) => 2 * Math.atan(Math.tan((verticalFov * Math.PI) / 360) * aspect);

describe("responsive match camera framing", () => {
  it("keeps the current landscape composition at and below 16:9", () => {
    expect(getCameraFovForAspect(16 / 9)).toBe(46);
    expect(getCameraFovForAspect(4 / 3)).toBe(46);
  });

  it("uses ultrawide width to enlarge the court without narrowing horizontal coverage", () => {
    const aspect = 21 / 9;
    const fov = getCameraFovForAspect(aspect);
    expect(fov).toBeLessThan(46);
    expect(fov).toBeGreaterThanOrEqual(34);
    expect(horizontalFov(fov, aspect)).toBeCloseTo(horizontalFov(46, 16 / 9), 5);
  });

  it("keeps a wider field of view on portrait screens and handles invalid dimensions", () => {
    expect(getCameraFovForAspect(9 / 16)).toBe(58);
    expect(getCameraFovForAspect(0)).toBe(46);
    expect(getCameraFovForAspect(Number.NaN)).toBe(46);
  });

  it("gently enlarges the court in taller desktop windows while keeping 720p and ultrawide framing safe", () => {
    expect(getCameraDistanceScale(16 / 9, 720)).toBe(1);
    expect(getCameraDistanceScale(16 / 9, 1080)).toBeCloseTo(0.96);
    expect(getCameraDistanceScale(16 / 9, 1440)).toBeCloseTo(0.92);
    const atSixteenNine = getCameraDistanceScale(2560 / 1440, 1440);
    const justAboveSixteenNine = getCameraDistanceScale(2561 / 1440, 1440);
    expect(atSixteenNine).toBeCloseTo(0.92);
    expect(justAboveSixteenNine).toBeGreaterThan(atSixteenNine);
    expect(justAboveSixteenNine).toBeCloseTo(atSixteenNine, 3);
    expect(getCameraDistanceScale(21 / 9, 1440)).toBe(1);
    expect(getCameraDistanceScale(2.1, 1440)).toBe(1);
    expect(getCameraDistanceScale(9 / 16, 1440)).toBeCloseTo(0.92);
  });
});
