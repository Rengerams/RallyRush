export const PRACTICE_ATTEMPT_COUNT = 10;
export const TIMING_GRADE_ORDER = ["perfect", "good", "early", "late", "miss"];

export function gradeServeOutcome(quality, fault = false) {
  return !fault && TIMING_GRADE_ORDER.includes(quality) && quality !== "miss" ? quality : "miss";
}

export function isServeLaunchEvent(event) {
  return event?.type === "shot" && event.who === 0 && event.shot === "Serve";
}

export function practiceServer(mode) {
  return mode === "serve" ? 0 : 1;
}

export function isTargetHit(x, lane) {
  if (!Number.isFinite(x)) return false;
  if (lane === "left") return x <= -1.1;
  if (lane === "right") return x >= 1.1;
  return lane === "center" && Math.abs(x) < 1.1;
}

export function createTimingDrillState() {
  return { started: false, paused: true, pending: false, attempts: [], targetAttempts: 0, targetHits: 0 };
}

export function transitionTimingDrill(state, event) {
  switch (event.type) {
    case "start":
      return { started: true, paused: false, pending: false, attempts: [], targetAttempts: 0, targetHits: 0 };
    case "pause":
      return state.started && !state.paused && !state.pending ? { ...state, paused: true } : state;
    case "resume":
      return state.started && state.paused && !state.pending && state.attempts.length < PRACTICE_ATTEMPT_COUNT
        ? { ...state, paused: false } : state;
    case "grade": {
      if (!state.started || state.paused || state.pending || state.attempts.length >= PRACTICE_ATTEMPT_COUNT) return state;
      const grade = TIMING_GRADE_ORDER.includes(event.grade) ? event.grade : "miss";
      return {
        ...state,
        paused: true,
        pending: true,
        attempts: [...state.attempts, grade],
        targetAttempts: state.targetAttempts + (typeof event.targetHit === "boolean" ? 1 : 0),
        targetHits: state.targetHits + (event.targetHit === true ? 1 : 0),
      };
    }
    case "next":
      return state.pending && state.attempts.length < PRACTICE_ATTEMPT_COUNT
        ? { ...state, paused: false, pending: false } : state;
    default:
      return state;
  }
}

export function summarizeTimingAttempts(attempts = []) {
  const counts = Object.fromEntries(TIMING_GRADE_ORDER.map((grade) => [grade, 0]));
  for (const attempt of attempts) {
    const grade = TIMING_GRADE_ORDER.includes(attempt) ? attempt : "miss";
    counts[grade]++;
  }

  const total = TIMING_GRADE_ORDER.reduce((sum, grade) => sum + counts[grade], 0);
  const tip = total === 0
    ? "Complete a return to see your timing feedback."
    : counts.miss + counts.late >= Math.ceil(total / 2)
    ? "Wait a little longer before releasing; the ball should be close to your player."
    : counts.perfect + counts.good >= Math.ceil(total / 2)
      ? "Your timing is consistent. Try changing the shot type and target next."
      : "Release closer to contact to move an early or late swing toward Good.";

  return { total, counts, tip };
}
