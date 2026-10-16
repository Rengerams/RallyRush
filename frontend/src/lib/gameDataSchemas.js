import { DEFAULT_SETUP, SURFACES, DIFFICULTY, STYLES, FORMATS } from "@/game/constants";

export const MATCH_STAT_FIELDS = Object.freeze([
  "aces", "winners", "errors", "double_faults", "perfect_shots", "total_shots", "longest_rally", "points_won",
]);
const RATING_POINTS = Object.freeze({ easy: 10, medium: 20, hard: 35, pro: 60 });

export function isPlainRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeSetup(raw) {
  const source = isPlainRecord(raw) ? raw : {};
  const setup = { ...DEFAULT_SETUP, ...source };
  if (typeof setup.name !== "string" || !setup.name.trim() || setup.name.length > 24) setup.name = DEFAULT_SETUP.name;
  for (const attr of ["power", "stamina", "accuracy"]) {
    if (!Number.isInteger(setup[attr]) || setup[attr] < 1 || setup[attr] > 10) setup[attr] = DEFAULT_SETUP[attr];
  }
  if (typeof setup.legend !== "boolean") setup.legend = false;
  if (!setup.legend && setup.power + setup.stamina + setup.accuracy > 18) {
    setup.power = 6; setup.stamina = 6; setup.accuracy = 6;
  }
  if (!Object.hasOwn(SURFACES, setup.surface)) setup.surface = DEFAULT_SETUP.surface;
  if (!Object.hasOwn(DIFFICULTY, setup.difficulty)) setup.difficulty = DEFAULT_SETUP.difficulty;
  if (!Object.hasOwn(STYLES, setup.style)) setup.style = DEFAULT_SETUP.style;
  if (!Object.hasOwn(FORMATS, setup.format)) setup.format = DEFAULT_SETUP.format;
  return setup;
}

export function normalizeDisplayPreferences(value) {
  const source = isPlainRecord(value) ? value : {};
  const requestedHoldMs = Number.isFinite(source.shotHoldMs) ? Math.round(source.shotHoldMs / 25) * 25 : 150;
  return {
    hudSize: source.hudSize === "large" ? "large" : "normal",
    reducedEffects: source.reducedEffects === true,
    reducedMotion: source.reducedMotion === true,
    shotHoldMs: Math.max(100, Math.min(250, requestedHoldMs)),
  };
}

function normalizeStats(value) {
  if (!isPlainRecord(value)) return null;
  return Object.fromEntries(MATCH_STAT_FIELDS.map((key) => [
    key,
    Number.isSafeInteger(value[key]) && value[key] >= 0 && value[key] <= 1_000_000 ? value[key] : 0,
  ]));
}

function validSets(value) {
  return Array.isArray(value) && value.length <= 100 && value.every((set) =>
    Array.isArray(set) && set.length === 2 && set.every((score) => Number.isInteger(score) && score >= 0 && score <= 99));
}

export function normalizeStoredMatch(value, index = 0) {
  if (!isPlainRecord(value) || typeof value.player_name !== "string" || !value.player_name.trim()) return null;
  const validDate = typeof value.created_at === "string" && Number.isFinite(Date.parse(value.created_at));
  const matchId = typeof value.match_id === "string" && value.match_id.length <= 160 ? value.match_id : null;
  const id = typeof value.id === "string" && value.id.length <= 160 ? value.id : matchId || `local-history-${index}`;
  return {
    id,
    match_id: matchId,
    player_name: value.player_name.trim().slice(0, 48),
    won: value.won === true,
    difficulty: Object.hasOwn(DIFFICULTY, value.difficulty) ? value.difficulty : DEFAULT_SETUP.difficulty,
    ai_style: Object.hasOwn(STYLES, value.ai_style) ? value.ai_style : DEFAULT_SETUP.style,
    surface: Object.hasOwn(SURFACES, value.surface) ? value.surface : DEFAULT_SETUP.surface,
    match_format: Object.hasOwn(FORMATS, value.match_format) ? value.match_format : DEFAULT_SETUP.format,
    sets: validSets(value.sets) ? value.sets.map((set) => [...set]) : [],
    duration_sec: Number.isFinite(value.duration_sec) && value.duration_sec >= 0 && value.duration_sec <= 86_400 ? value.duration_sec : 0,
    created_at: validDate ? value.created_at : new Date(0).toISOString(),
    legend: value.legend === true,
    stats: normalizeStats(value.stats) || Object.fromEntries(MATCH_STAT_FIELDS.map((key) => [key, 0])),
    opponent_stats: normalizeStats(value.opponent_stats),
    rally_lengths: Array.isArray(value.rally_lengths) && value.rally_lengths.length <= 100_000 &&
      value.rally_lengths.every((length) => Number.isSafeInteger(length) && length >= 0 && length <= 1_000_000)
      ? [...value.rally_lengths] : [],
    rating_points: Number.isFinite(value.rating_points) && value.rating_points >= 0 && value.rating_points <= 1_000_000
      ? value.rating_points : value.won === true
        ? (Object.hasOwn(RATING_POINTS, value.difficulty) ? RATING_POINTS[value.difficulty] : 0) : 2,
    storage: "local",
  };
}

export function validateBackupMatch(match) {
  if (!isPlainRecord(match) || typeof match.player_name !== "string" ||
      !match.player_name.trim() || match.player_name.length > 48 || typeof match.won !== "boolean") return false;
  if (match.difficulty != null && !Object.hasOwn(DIFFICULTY, match.difficulty)) return false;
  if (match.surface != null && !Object.hasOwn(SURFACES, match.surface)) return false;
  if (match.ai_style != null && !Object.hasOwn(STYLES, match.ai_style)) return false;
  if (match.match_format != null && !Object.hasOwn(FORMATS, match.match_format)) return false;
  const isValidStats = (stats) => stats == null || (isPlainRecord(stats) &&
    MATCH_STAT_FIELDS.every((key) => !Object.hasOwn(stats, key) ||
      (Number.isSafeInteger(stats[key]) && stats[key] >= 0 && stats[key] <= 1_000_000)));
  if (!isValidStats(match.stats) || !isValidStats(match.opponent_stats)) return false;
  if (match.opponent_stats != null && (!isPlainRecord(match.opponent_stats) || !Object.hasOwn(DIFFICULTY, match.difficulty))) return false;
  if (match.sets != null && !validSets(match.sets)) return false;
  if (match.match_id != null && (typeof match.match_id !== "string" || match.match_id.length > 160)) return false;
  if (match.id != null && (typeof match.id !== "string" || match.id.length > 160)) return false;
  if (match.created_at != null && (typeof match.created_at !== "string" || !Number.isFinite(Date.parse(match.created_at)))) return false;
  if (match.duration_sec != null && (!Number.isFinite(match.duration_sec) || match.duration_sec < 0 || match.duration_sec > 86_400)) return false;
  if (match.rating_points != null && (!Number.isFinite(match.rating_points) || match.rating_points < 0 || match.rating_points > 1_000_000)) return false;
  if (match.legend != null && typeof match.legend !== "boolean") return false;
  if (match.rally_lengths != null && (!Array.isArray(match.rally_lengths) || match.rally_lengths.length > 100_000 ||
      match.rally_lengths.some((length) => !Number.isSafeInteger(length) || length < 0 || length > 1_000_000))) return false;
  try { JSON.stringify(match); return true; } catch { return false; }
}

export function validateBackupSetup(setup) {
  return isPlainRecord(setup) && typeof setup.name === "string" && setup.name.trim().length > 0 && setup.name.length <= 24 &&
    typeof setup.legend === "boolean" && [setup.power, setup.stamina, setup.accuracy].every((value) => Number.isInteger(value) && value >= 1 && value <= 10) &&
    (setup.legend || setup.power + setup.stamina + setup.accuracy <= 18) &&
    Object.hasOwn(SURFACES, setup.surface) && Object.hasOwn(DIFFICULTY, setup.difficulty) &&
    Object.hasOwn(STYLES, setup.style) && Object.hasOwn(FORMATS, setup.format);
}

export function validateBackupDisplayPreferences(value) {
  return isPlainRecord(value) && (value.hudSize === "normal" || value.hudSize === "large") &&
    typeof value.reducedEffects === "boolean" && typeof value.reducedMotion === "boolean" &&
    (value.shotHoldMs == null || (Number.isInteger(value.shotHoldMs) && value.shotHoldMs >= 100 && value.shotHoldMs <= 250 && value.shotHoldMs % 25 === 0));
}
