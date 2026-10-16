import { describe, expect, it } from "vitest";
import { createTimingDrillState, gradeServeOutcome, isServeLaunchEvent, isTargetHit, PRACTICE_ATTEMPT_COUNT, summarizeTimingAttempts, TIMING_GRADE_ORDER, transitionTimingDrill } from "../practiceTiming";

describe("timing drill summary", () => {
  it("scores legal serves by timing and faults as misses", () => {
    expect(gradeServeOutcome("perfect")).toBe("perfect");
    expect(gradeServeOutcome("good")).toBe("good");
    expect(gradeServeOutcome("late")).toBe("late");
    expect(gradeServeOutcome("perfect", true)).toBe("miss");
    expect(gradeServeOutcome(undefined)).toBe("miss");
  });

  it("uses only the actual serve launch and ignores later rally shots", () => {
    expect(isServeLaunchEvent({ type: "shot", who: 0, shot: "Serve" })).toBe(true);
    expect(isServeLaunchEvent({ type: "shot", who: 0, shot: "Flat" })).toBe(false);
    expect(isServeLaunchEvent({ type: "shot", who: 1, shot: "Serve" })).toBe(false);
  });

  it("checks target lanes using the actual landing position", () => {
    expect(isTargetHit(-1.2, "left")).toBe(true);
    expect(isTargetHit(0, "center")).toBe(true);
    expect(isTargetHit(1.2, "right")).toBe(true);
    expect(isTargetHit(2, "left")).toBe(false);
    expect(isTargetHit(Number.NaN, "center")).toBe(false);
  });

  it("counts grades in the match engine's order and gives a focused tip", () => {
    const summary = summarizeTimingAttempts(["miss", "late", "good", "perfect", "early"]);
    expect(PRACTICE_ATTEMPT_COUNT).toBe(10);
    expect(TIMING_GRADE_ORDER).toEqual(["perfect", "good", "early", "late", "miss"]);
    expect(summary).toEqual({
      total: 5,
      counts: { perfect: 1, good: 1, early: 1, late: 1, miss: 1 },
      tip: "Release closer to contact to move an early or late swing toward Good.",
    });
  });

  it("keeps invalid grades visible as misses and handles an empty session", () => {
    expect(summarizeTimingAttempts(["unknown"]).counts.miss).toBe(1);
    expect(summarizeTimingAttempts([])).toMatchObject({ total: 0, tip: "Complete a return to see your timing feedback." });
  });

  it("allows one grade per return, waits for Next, and locks after ten returns", () => {
    let state = createTimingDrillState();
    state = transitionTimingDrill(state, { type: "start" });
    expect(state).toMatchObject({ started: true, paused: false, pending: false, attempts: [] });

    state = transitionTimingDrill(state, { type: "grade", grade: "good" });
    expect(state).toMatchObject({ paused: true, pending: true, attempts: ["good"] });
    expect(transitionTimingDrill(state, { type: "grade", grade: "perfect" })).toBe(state);
    state = transitionTimingDrill(state, { type: "next" });
    expect(state).toMatchObject({ paused: false, pending: false, attempts: ["good"] });

    for (let i = 1; i < PRACTICE_ATTEMPT_COUNT; i++) {
      state = transitionTimingDrill(state, { type: "grade", grade: "perfect" });
      if (i < PRACTICE_ATTEMPT_COUNT - 1) state = transitionTimingDrill(state, { type: "next" });
    }
    expect(state.attempts).toHaveLength(PRACTICE_ATTEMPT_COUNT);
    expect(state.pending).toBe(true);
    expect(transitionTimingDrill(state, { type: "next" })).toBe(state);
    expect(transitionTimingDrill(state, { type: "grade", grade: "late" })).toBe(state);
    expect(summarizeTimingAttempts(state.attempts).counts.perfect).toBe(9);
  });

  it("ignores grades while paused and turns unknown drill grades into misses", () => {
    let state = transitionTimingDrill(createTimingDrillState(), { type: "start" });
    state = transitionTimingDrill(state, { type: "pause" });
    expect(transitionTimingDrill(state, { type: "grade", grade: "good" })).toBe(state);
    state = transitionTimingDrill(state, { type: "resume" });
    state = transitionTimingDrill(state, { type: "grade", grade: "unknown" });
    expect(state.attempts).toEqual(["miss"]);
  });

  it("tracks target attempts separately from timing grades", () => {
    let state = transitionTimingDrill(createTimingDrillState(), { type: "start" });
    state = transitionTimingDrill(state, { type: "grade", grade: "good", targetHit: true });
    expect(state).toMatchObject({ attempts: ["good"], targetAttempts: 1, targetHits: 1 });
    state = transitionTimingDrill(state, { type: "next" });
    state = transitionTimingDrill(state, { type: "grade", grade: "late", targetHit: false });
    expect(state).toMatchObject({ attempts: ["good", "late"], targetAttempts: 2, targetHits: 1 });
  });
});
