import { describe, expect, it } from "vitest";
import {
  DEFAULT_MATCH_DISPLAY_PREFERENCES,
  loadMatchDisplayPreferences,
  saveMatchDisplayPreferences,
} from "../matchDisplayPreferences";

function makeStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe("match display preferences", () => {
  it("returns accessible defaults when nothing has been saved", () => {
    expect(loadMatchDisplayPreferences(makeStorage())).toEqual(DEFAULT_MATCH_DISPLAY_PREFERENCES);
  });

  it("persists the chosen HUD, motion, and effects preferences", () => {
    const storage = makeStorage();
    const saved = saveMatchDisplayPreferences({ hudSize: "large", reducedMotion: true, reducedEffects: true }, storage);
    expect(saved).toEqual({ hudSize: "large", reducedMotion: true, reducedEffects: true });
    expect(loadMatchDisplayPreferences(storage)).toEqual(saved);
  });

  it("normalizes unknown or malformed preference values", () => {
    const storage = makeStorage({
      "rally-rush.match-display-preferences": JSON.stringify({ hudSize: "giant", reducedMotion: "yes", reducedEffects: 1 }),
    });
    expect(loadMatchDisplayPreferences(storage)).toEqual(DEFAULT_MATCH_DISPLAY_PREFERENCES);
    const invalid = makeStorage({ "rally-rush.match-display-preferences": "not-json" });
    expect(loadMatchDisplayPreferences(invalid)).toEqual(DEFAULT_MATCH_DISPLAY_PREFERENCES);
  });

  it("continues with defaults if storage is unavailable", () => {
    const brokenStorage = { getItem() { throw new Error("storage blocked"); }, setItem() { throw new Error("storage blocked"); } };
    expect(loadMatchDisplayPreferences(brokenStorage)).toEqual(DEFAULT_MATCH_DISPLAY_PREFERENCES);
    expect(saveMatchDisplayPreferences({ hudSize: "large" }, brokenStorage)).toEqual({
      ...DEFAULT_MATCH_DISPLAY_PREFERENCES,
      hudSize: "large",
    });
  });
});
