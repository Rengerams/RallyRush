import { describe, expect, it } from "vitest";
import { applySetupPreset, SETUP_PRESETS } from "../setupPresets";

describe("quick-play setup presets", () => {
  it("apply match choices without changing player attributes", () => {
    const original = { name: "Ace", power: 8, stamina: 5, accuracy: 5, legend: false, surface: "hard", style: "baseline", difficulty: "medium", format: "standard" };
    const configured = applySetupPreset(original, "clay-grind");

    expect(configured).toMatchObject({ surface: "clay", style: "defensive", difficulty: "hard", format: "standard" });
    expect(configured).toMatchObject({ name: "Ace", power: 8, stamina: 5, accuracy: 5, legend: false });
    expect(original.surface).toBe("hard");
  });

  it("leaves the setup alone for an unknown preset", () => {
    const original = { name: "Ace", power: 8 };
    expect(applySetupPreset(original, "unknown")).toBe(original);
  });

  it("keeps each preset focused on editable match settings", () => {
    expect(SETUP_PRESETS).toHaveLength(3);
    for (const preset of SETUP_PRESETS) expect(Object.keys(preset.values).sort()).toEqual(["difficulty", "format", "style", "surface"]);
  });
});
