import { describe, expect, it } from "vitest";
import { getTutorialTransition, hasCompletedTutorial, markTutorialComplete, TUTORIAL_STORAGE_KEY, TUTORIAL_STEPS } from "../tutorial";

describe("first-session guide", () => {
  it("moves forward one step at a time and finishes on the final step", () => {
    expect(getTutorialTransition(0, "continue")).toEqual({ step: 1, complete: false });
    expect(getTutorialTransition(TUTORIAL_STEPS.length - 1, "continue")).toEqual({ step: TUTORIAL_STEPS.length - 1, complete: true });
  });

  it("moves back without going before the first step", () => {
    expect(getTutorialTransition(0, "back")).toEqual({ step: 0, complete: false });
    expect(getTutorialTransition(2, "back")).toEqual({ step: 1, complete: false });
  });

  it("lets a player skip at any step", () => {
    expect(getTutorialTransition(3, "skip")).toEqual({ step: 3, complete: true });
  });

  it("remembers completion locally without requiring storage", () => {
    const values = new Map();
    const storage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    };
    expect(hasCompletedTutorial(storage)).toBe(false);
    markTutorialComplete(storage);
    expect(values.get(TUTORIAL_STORAGE_KEY)).toBe("complete");
    expect(hasCompletedTutorial(storage)).toBe(true);
    expect(hasCompletedTutorial(null)).toBe(false);
  });
});
