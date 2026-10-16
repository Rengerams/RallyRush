import { getSafeStorage } from "@/lib/safeStorage";

const KEY = "rally-rush.match-display-preferences";

export const DEFAULT_MATCH_DISPLAY_PREFERENCES = Object.freeze({
  hudSize: "normal",
  reducedEffects: false,
  reducedMotion: false,
  shotHoldMs: 150,
});

function normalizeShotHoldMs(value) {
  if (!Number.isFinite(value)) return DEFAULT_MATCH_DISPLAY_PREFERENCES.shotHoldMs;
  return Math.max(100, Math.min(250, Math.round(value / 25) * 25));
}

export function loadMatchDisplayPreferences(storage = getSafeStorage()) {
  try {
    const saved = JSON.parse(storage?.getItem(KEY) || "null");
    return {
      hudSize: saved?.hudSize === "large" ? "large" : "normal",
      reducedEffects: saved?.reducedEffects === true,
      reducedMotion: saved?.reducedMotion === true,
      shotHoldMs: normalizeShotHoldMs(saved?.shotHoldMs),
    };
  } catch {
    return { ...DEFAULT_MATCH_DISPLAY_PREFERENCES };
  }
}

export function saveMatchDisplayPreferences(preferences, storage = getSafeStorage()) {
  const normalized = {
    hudSize: preferences?.hudSize === "large" ? "large" : "normal",
    reducedEffects: preferences?.reducedEffects === true,
    reducedMotion: preferences?.reducedMotion === true,
    shotHoldMs: normalizeShotHoldMs(preferences?.shotHoldMs),
  };
  try {
    storage?.setItem(KEY, JSON.stringify(normalized));
  } catch {
    // Keep preferences available for the current session when storage is unavailable.
  }
  return normalized;
}
