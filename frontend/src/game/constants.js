export const COURT = { halfLen: 11.885, singlesHalfW: 4.115, doublesHalfW: 5.485, serviceLine: 6.4, netH: 0.914 };

// Values ported from CourtSurface.cs
export const SURFACES = {
  hard: { id: "hard", label: "Hard Court", sub: "Balanced pace & bounce", bounce: 0.9, friction: 0.95, speed: 1.0, color: "#1565C0", outer: "#0D47A1" },
  clay: { id: "clay", label: "Clay", sub: "Slow, grinding rallies", bounce: 0.95, friction: 0.82, speed: 0.85, color: "#C85A32", outer: "#9E4526" },
  grass: { id: "grass", label: "Grass", sub: "Fast skid, low bounce", bounce: 0.73, friction: 1.0, speed: 0.9, color: "#2F7A45", outer: "#1F5A33" },
  artificial: { id: "artificial", label: "Kunstgras", sub: "Fast, low bounce, all-season", bounce: 0.76, friction: 0.99, speed: 1.05, color: "#388E3C", outer: "#2E7D32" },
  smashcourt: { id: "smashcourt", label: "Smashcourt", sub: "Medium pace, clay-like feel", bounce: 0.88, friction: 0.86, speed: 0.88, color: "#D84315", outer: "#BF360C" },
};

export const BALL = { gravity: 9.81, bounce: 0.8, friction: 0.9, magnus: 3.2 };

// Shot types from ShotMechanics.cs (keys 1-7)
export const SHOTS = {
  flat: { id: "flat", key: "1", label: "Flat", h: 22, depth: 9.6, spin: 0, clear: 0.15, desc: "Fast & direct" },
  topspin: { id: "topspin", key: "2", label: "Topspin", h: 19, depth: 10.1, spin: 1, clear: 0.6, desc: "Dips, kicks high" },
  slice: { id: "slice", key: "3", label: "Slice", h: 16, depth: 8.8, spin: -1, clear: 0.25, desc: "Low skidding bounce" },
  lob: { id: "lob", key: "4", label: "Lob", h: 10, depth: 10.3, spin: 0.3, clear: 3.4, desc: "High over the net-rusher" },
  dropshot: { id: "dropshot", key: "5", label: "Drop Shot", h: 7, depth: 3.2, spin: -1, clear: 0.35, desc: "Soft, dies short" },
  serve: { id: "serve", key: "6", label: "Serve", h: 27, depth: 5.6, spin: 0.3, clear: 0.12, desc: "Toss, then strike" },
  smash: { id: "smash", key: "7", label: "Smash", h: 30, depth: 8.2, spin: 0, clear: 0.05, desc: "Crush high balls" },
};
export const SHOT_LIST = Object.values(SHOTS);
export const SHOT_BY_KEY = Object.fromEntries(SHOT_LIST.map((s) => [s.key, s.id]));

// AIDifficulty.cs multipliers + derived accuracy
export const DIFFICULTY = {
  easy: { id: "easy", label: "Easy", reaction: 1.5, error: 0.4, power: 0.8, move: 0.7, acc: 0.86, perfect: 0.05, smart: false },
  medium: { id: "medium", label: "Medium", reaction: 1.0, error: 0.2, power: 1.0, move: 1.0, acc: 0.9, perfect: 0.15, smart: false },
  hard: { id: "hard", label: "Hard", reaction: 0.7, error: 0.1, power: 1.1, move: 1.1, acc: 0.93, perfect: 0.3, smart: true },
  pro: { id: "pro", label: "Pro", reaction: 0.4, error: 0.05, power: 1.2, move: 1.2, acc: 0.96, perfect: 0.5, smart: true },
};

export const STYLES = {
  baseline: { id: "baseline", label: "Baseline", desc: "Flat & topspin from the back", homeZ: -11.6 },
  netrusher: { id: "netrusher", label: "Net Rusher", desc: "Charges the net, drop shots", homeZ: -11 },
  defensive: { id: "defensive", label: "Defensive", desc: "Lobs & slices, retrieves all", homeZ: -12.6 },
  aggressive: { id: "aggressive", label: "Aggressive", desc: "Big flat hits & smashes", homeZ: -10.6 },
};

export const FORMATS = {
  quick: { id: "quick", label: "Quick Set", desc: "1 set · first to 3 games", games: 3, setsToWin: 1 },
  standard: { id: "standard", label: "Original Rules", desc: "Best of 3 sets · 6 games", games: 6, setsToWin: 2 },
};

export const LEGEND = { name: "renffr", power: 10, stamina: 10, accuracy: 10 };
export const ATTR_BUDGET = 18;
export const SETUP_KEY = "renffr-tennis-setup";

export const DEFAULT_SETUP = {
  name: "Player", power: 6, stamina: 6, accuracy: 6, legend: false,
  difficulty: "medium", style: "baseline", surface: "hard", format: "quick",
};
