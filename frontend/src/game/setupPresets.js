export const SETUP_PRESETS = [
  {
    id: "quick-rally",
    label: "Quick Rally",
    detail: "Hard court · easy baseline AI · quick set",
    values: { surface: "hard", style: "baseline", difficulty: "easy", format: "quick" },
  },
  {
    id: "grass-attack",
    label: "Grass Attack",
    detail: "Artificial grass · aggressive AI · quick set",
    values: { surface: "artificial", style: "aggressive", difficulty: "medium", format: "quick" },
  },
  {
    id: "clay-grind",
    label: "Clay Grind",
    detail: "Clay · defensive AI · original rules",
    values: { surface: "clay", style: "defensive", difficulty: "hard", format: "standard" },
  },
];

export function applySetupPreset(config, presetId) {
  const preset = SETUP_PRESETS.find((item) => item.id === presetId);
  return preset ? { ...config, ...preset.values } : config;
}
