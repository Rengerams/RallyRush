import { SETUP_KEY, DEFAULT_SETUP, SURFACES, DIFFICULTY, STYLES, FORMATS } from "@/game/constants";

const MATCHES_KEY = "renffr-tennis-matches";
const RATING_POINTS = { easy: 10, medium: 20, hard: 35, pro: 60 };

function readLocalMatches() {
  try {
    const rows = JSON.parse(localStorage.getItem(MATCHES_KEY) || "[]");
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function saveLocalMatch(payload) {
  const rows = readLocalMatches();
  const row = {
    ...payload,
    id: payload.match_id || `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    created_at: new Date().toISOString(),
    rating_points: payload.won ? RATING_POINTS[payload.difficulty] : 2,
    storage: "local",
  };
  const index = rows.findIndex((match) => match.match_id && match.match_id === payload.match_id);
  if (index >= 0) rows[index] = { ...rows[index], ...row };
  else rows.unshift(row);
  localStorage.setItem(MATCHES_KEY, JSON.stringify(rows));
  return row;
}

function fetchLocalMatches(params = {}) {
  const player = params.player?.trim().toLowerCase();
  return readLocalMatches().filter((match) =>
    (!player || match.player_name.toLowerCase() === player) &&
    (!params.surface || match.surface === params.surface)
  ).slice(0, Number(params.limit) || 50);
}

function localLeaderboard(mode) {
  const totals = new Map();
  for (const match of readLocalMatches()) {
    if (mode === "legend" ? !match.legend : match.legend) continue;
    const key = match.player_name.trim().toLowerCase();
    const row = totals.get(key) || {
      player_name: match.player_name, matches: 0, wins: 0, losses: 0,
      win_pct: 0, rating: 0, best_rally: 0, aces: 0, perfect_shots: 0, legend: !!match.legend,
    };
    row.matches += 1;
    row.wins += Number(!!match.won);
    row.losses = row.matches - row.wins;
    row.rating += match.rating_points || (match.won ? RATING_POINTS[match.difficulty] : 2);
    row.best_rally = Math.max(row.best_rally, match.stats?.longest_rally || 0);
    row.aces += match.stats?.aces || 0;
    row.perfect_shots += match.stats?.perfect_shots || 0;
    row.win_pct = Math.round((100 * row.wins / row.matches) * 10) / 10;
    totals.set(key, row);
  }
  return [...totals.values()].sort((a, b) => b.rating - a.rating || b.wins - a.wins).slice(0, 50);
}

export const saveMatch = (payload) => Promise.resolve(saveLocalMatch(payload));
export const fetchMatches = (params = {}) => Promise.resolve(fetchLocalMatches(params));
export const fetchLeaderboard = (mode = "competitive") => Promise.resolve(localLeaderboard(mode));

function validateSetup(raw) {
  const s = { ...DEFAULT_SETUP, ...raw };
  if (typeof s.name !== "string" || !s.name.trim() || s.name.length > 24) s.name = DEFAULT_SETUP.name;
  for (const attr of ["power", "stamina", "accuracy"]) {
    if (!Number.isInteger(s[attr]) || s[attr] < 1 || s[attr] > 10) s[attr] = DEFAULT_SETUP[attr];
  }
  if (typeof s.legend !== "boolean") s.legend = false;
  if (!s.legend && s.power + s.stamina + s.accuracy > 18) {
    s.power = 6; s.stamina = 6; s.accuracy = 6;
  }
  if (!SURFACES[s.surface]) s.surface = DEFAULT_SETUP.surface;
  if (!DIFFICULTY[s.difficulty]) s.difficulty = DEFAULT_SETUP.difficulty;
  if (!STYLES[s.style]) s.style = DEFAULT_SETUP.style;
  if (!FORMATS[s.format]) s.format = DEFAULT_SETUP.format;
  return s;
}

export const loadSetup = () => {
  try { return validateSetup(JSON.parse(localStorage.getItem(SETUP_KEY) || "{}")); }
  catch { return { ...DEFAULT_SETUP }; }
};
export const storeSetup = (s) => localStorage.setItem(SETUP_KEY, JSON.stringify(s));
