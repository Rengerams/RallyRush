import { describe, expect, it } from "vitest";
import { createTimingDrillState, PRACTICE_ATTEMPT_COUNT, summarizeTimingAttempts, TIMING_GRADE_ORDER, transitionTimingDrill } from "../practiceTiming";

describe("timing drill summary", () => {
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
});
