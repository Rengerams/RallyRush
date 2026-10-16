export const FIRST_SERVE_HINT_KEY = "rally-rush:first-serve-hint:v1";

export function hasSeenFirstServeHint(storage = globalThis.localStorage) {
  try {
    return storage?.getItem(FIRST_SERVE_HINT_KEY) === "seen";
  } catch {
    return false;
  }
}

export function markFirstServeHintSeen(storage = globalThis.localStorage) {
  try {
    storage?.setItem(FIRST_SERVE_HINT_KEY, "seen");
  } catch {
    // The hint remains available when storage is unavailable.
  }
}
