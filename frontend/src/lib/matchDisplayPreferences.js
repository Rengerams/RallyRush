const KEY = "rally-rush.match-display-preferences";

export const DEFAULT_MATCH_DISPLAY_PREFERENCES = Object.freeze({
  hudSize: "normal",
  reducedEffects: false,
  reducedMotion: false,
});

export function loadMatchDisplayPreferences(storage = globalThis.localStorage) {
  try {
    const saved = JSON.parse(storage?.getItem(KEY) || "null");
    return {
      hudSize: saved?.hudSize === "large" ? "large" : "normal",
      reducedEffects: saved?.reducedEffects === true,
      reducedMotion: saved?.reducedMotion === true,
    };
  } catch {
    return { ...DEFAULT_MATCH_DISPLAY_PREFERENCES };
  }
}

export function saveMatchDisplayPreferences(preferences, storage = globalThis.localStorage) {
  const normalized = {
    hudSize: preferences?.hudSize === "large" ? "large" : "normal",
    reducedEffects: preferences?.reducedEffects === true,
    reducedMotion: preferences?.reducedMotion === true,
  };
  try {
    storage?.setItem(KEY, JSON.stringify(normalized));
  } catch {
    // Keep preferences available for the current session when storage is unavailable.
  }
  return normalized;
}
