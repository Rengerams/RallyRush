import { getSafeStorage } from "@/lib/safeStorage";

export const FIRST_SERVE_HINT_KEY = "rally-rush:first-serve-hint:v1";

export function hasSeenFirstServeHint(storage = getSafeStorage()) {
  try {
    return storage?.getItem(FIRST_SERVE_HINT_KEY) === "seen";
  } catch {
    return false;
  }
}

export function markFirstServeHintSeen(storage = getSafeStorage()) {
  try {
    storage?.setItem(FIRST_SERVE_HINT_KEY, "seen");
  } catch {
    // The hint remains available when storage is unavailable.
  }
}
