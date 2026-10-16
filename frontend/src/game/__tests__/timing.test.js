import { describe, expect, it } from "vitest";
import { gradeTimingDistance } from "../timing";
import { ENGINE_TUNING } from "../tuning";

describe("shared swing timing grades", () => {
  it("uses the same contact-distance thresholds as match play", () => {
    expect(gradeTimingDistance(ENGINE_TUNING.perfectTimingDistance)).toBe("perfect");
    expect(gradeTimingDistance(ENGINE_TUNING.perfectTimingDistance + 0.01)).toBe("good");
    expect(gradeTimingDistance(ENGINE_TUNING.goodTimingDistance)).toBe("good");
    expect(gradeTimingDistance(ENGINE_TUNING.goodTimingDistance + 0.01)).toBe("early");
    expect(gradeTimingDistance(ENGINE_TUNING.lateTimingDistance)).toBe("early");
    expect(gradeTimingDistance(ENGINE_TUNING.lateTimingDistance + 0.01)).toBe("late");
  });

  it("treats invalid contact distances as a miss-side late grade", () => {
    expect(gradeTimingDistance(Number.NaN)).toBe("late");
    expect(gradeTimingDistance(-1)).toBe("late");
  });
});
