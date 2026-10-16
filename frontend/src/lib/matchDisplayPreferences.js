import { getSafeStorage } from "@/lib/safeStorage";
import { normalizeDisplayPreferences } from "@/lib/gameDataSchemas";

const KEY = "rally-rush.match-display-preferences";

export const DEFAULT_MATCH_DISPLAY_PREFERENCES = Object.freeze({
  hudSize: "normal",
  reducedEffects: false,
  reducedMotion: false,
  shotHoldMs: 150,
});

export function loadMatchDisplayPreferences(storage = getSafeStorage()) {
  try {
    const saved = JSON.parse(storage?.getItem(KEY) || "null");
    return normalizeDisplayPreferences(saved);
  } catch {
    return { ...DEFAULT_MATCH_DISPLAY_PREFERENCES };
  }
}

export function saveMatchDisplayPreferences(preferences, storage = getSafeStorage()) {
  const normalized = normalizeDisplayPreferences(preferences);
  try {
    storage?.setItem(KEY, JSON.stringify(normalized));
  } catch {
    // Keep preferences available for the current session when storage is unavailable.
  }
  return normalized;
}
