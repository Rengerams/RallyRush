export const TUTORIAL_STORAGE_KEY = "rally-rush:first-session-guide:v1";

export const TUTORIAL_STEPS = [
  {
    title: "Move into position",
    body: "Use W A S D or the arrow keys to move around the court. The on-screen arrows work too.",
    cue: "Move early so you have time to choose a shot.",
  },
  {
    title: "Sprint and slide",
    body: "Hold Shift to sprint when you need extra reach. Press Space to slide into a wide ball.",
    cue: "Sprinting uses stamina, so save it for the chase.",
  },
  {
    title: "Choose a shot",
    body: "Use keys 1–7 or the on-screen shot buttons to choose Flat, Topspin, Slice, Lob, Drop Shot, Serve, or Smash.",
    cue: "The selected shot stays highlighted while you prepare.",
  },
  {
    title: "Time your swing",
    body: "Hold a shot key or shot button to prepare. Release as the ball reaches you; releasing closer to contact gives better timing.",
    cue: "Your timing grade appears after each swing.",
  },
  {
    title: "Follow the score",
    body: "The scoreboard shows points, games, sets, and who serves. Press Esc during a match to pause, then resume whenever you are ready.",
    cue: "You can replay this guide from Setup or the Pause menu.",
  },
];

export function hasCompletedTutorial(storage = globalThis.localStorage) {
  try {
    return storage?.getItem(TUTORIAL_STORAGE_KEY) === "complete";
  } catch {
    return false;
  }
}

export function markTutorialComplete(storage = globalThis.localStorage) {
  try {
    storage?.setItem(TUTORIAL_STORAGE_KEY, "complete");
  } catch {
    // The guide still works when browser storage is unavailable.
  }
}

export function getTutorialTransition(step, action) {
  const current = Number.isInteger(step) ? Math.max(0, Math.min(step, TUTORIAL_STEPS.length - 1)) : 0;
  if (action === "skip") return { step: current, complete: true };
  if (action === "back") return { step: Math.max(0, current - 1), complete: false };
  if (action === "continue") {
    if (current === TUTORIAL_STEPS.length - 1) return { step: current, complete: true };
    return { step: current + 1, complete: false };
  }
  return { step: current, complete: false };
}
