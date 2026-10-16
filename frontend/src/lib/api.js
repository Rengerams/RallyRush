import { SETUP_KEY, DEFAULT_SETUP } from "@/game/constants";
import { normalizeDisplayPreferences, normalizeSetup, normalizeStoredMatch, isPlainRecord, validateBackupDisplayPreferences, validateBackupMatch, validateBackupSetup } from "@/lib/gameDataSchemas";
import { getSafeStorage } from "@/lib/safeStorage";

export const MATCHES_KEY = "renffr-tennis-matches";
export const DISPLAY_PREFERENCES_KEY = "rally-rush.match-display-preferences";
export const BACKUP_FORMAT = "rally-rush-local-data";
export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 10_000_000;
export const STORAGE_VERSION_KEY = "rally-rush.storage-version";
const STORAGE_VERSION = 1;
const LEGACY_HISTORY_PREFIX = "renffr-breakdown-";
const RATING_POINTS = Object.freeze({ easy: 10, medium: 20, hard: 35, pro: 60 });
let memorySetupFallback = null;
let memoryMatchesFallback = [];

function readLocalMatches(storage = getSafeStorage()) {
  if (!storage) return memoryMatchesFallback.map((row, index) => normalizeStoredMatch(row, index)).filter(Boolean);
  migrateLocalStorage(storage);
  try {
    const rows = JSON.parse(storage.getItem(MATCHES_KEY) || "[]");
    return Array.isArray(rows) ? rows.map((row, index) => normalizeStoredMatch(row, index)).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function migrateLocalStorage(storage = getSafeStorage()) {
  if (!storage) return;
  try {
    const version = Number.parseInt(storage.getItem(STORAGE_VERSION_KEY) || "0", 10);
    if (Number.isInteger(version) && version >= STORAGE_VERSION) return;
    // Version 1 records the existing setup/match format. Preserve the original
    // bytes so legacy or partially recoverable saves are never rewritten here.
    storage.setItem(STORAGE_VERSION_KEY, String(STORAGE_VERSION));
  } catch {
    // Storage may be disabled or full; callers still use the safe read paths.
  }
}

function saveLocalMatch(payload) {
  const storage = getSafeStorage();
  const rows = readLocalMatches(storage);
  const row = normalizeStoredMatch({
    ...payload,
    id: payload.match_id || `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    created_at: new Date().toISOString(),
    rating_points: payload.won ? (Object.hasOwn(RATING_POINTS, payload.difficulty) ? RATING_POINTS[payload.difficulty] : 0) : 2,
    storage: "local",
  });
  if (!row) throw new Error("The match result could not be saved because its player name is invalid.");
  row.storage = storage ? "local" : "session";
  const index = rows.findIndex((match) => match.match_id && match.match_id === payload.match_id);
  if (index >= 0) rows[index] = { ...rows[index], ...row };
  else rows.unshift(row);
  if (!storage) {
    memoryMatchesFallback = rows;
    return row;
  }
  storage.setItem(MATCHES_KEY, JSON.stringify(rows));
  return row;
}

function fetchLocalMatches(params = {}) {
  const player = typeof params.player === "string" ? params.player.trim().toLowerCase() : "";
  return readLocalMatches().filter((match) => {
    const name = typeof match.player_name === "string" ? match.player_name.trim().toLowerCase() : "";
    return (!player || name === player) && (!params.surface || match.surface === params.surface);
  }).slice(0, Number(params.limit) || 50);
}

function localLeaderboard(mode) {
  const totals = new Map();
  for (const match of readLocalMatches()) {
    if (mode === "legend" ? !match.legend : match.legend) continue;
    const playerName = typeof match.player_name === "string" ? match.player_name.trim() : "";
    if (!playerName) continue;
    const key = playerName.toLowerCase();
    const row = totals.get(key) || {
      player_name: playerName, matches: 0, wins: 0, losses: 0,
      win_pct: 0, rating: 0, best_rally: 0, aces: 0, perfect_shots: 0, legend: !!match.legend,
    };
    row.matches += 1;
    row.wins += Number(!!match.won);
    row.losses = row.matches - row.wins;
    const difficultyPoints = Object.hasOwn(RATING_POINTS, match.difficulty) ? RATING_POINTS[match.difficulty] : 0;
    const ratingPoints = Number.isFinite(match.rating_points) ? match.rating_points : (match.won ? difficultyPoints : 2);
    row.rating += ratingPoints;
    row.best_rally = Math.max(row.best_rally, match.stats?.longest_rally || 0);
    row.aces += match.stats?.aces || 0;
    row.perfect_shots += match.stats?.perfect_shots || 0;
    row.win_pct = Math.round((100 * row.wins / row.matches) * 10) / 10;
    totals.set(key, row);
  }
  return [...totals.values()].sort((a, b) => b.rating - a.rating || b.wins - a.wins).slice(0, 50);
}

export const saveMatch = (payload) => Promise.resolve().then(() => saveLocalMatch(payload));
export const fetchMatches = (params = {}) => Promise.resolve(fetchLocalMatches(params));
export const fetchLeaderboard = (mode = "competitive") => Promise.resolve(localLeaderboard(mode));

export function parseLocalDataBackup(text) {
  if (typeof text !== "string" || new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) {
    throw new Error("Backup file is too large.");
  }
  let data;
  try { data = JSON.parse(text); } catch { throw new Error("This is not valid JSON."); }
  if (!isPlainRecord(data) || data.format !== BACKUP_FORMAT || data.version !== BACKUP_VERSION ||
      !validateBackupSetup(data.setup) || !Array.isArray(data.matches) || data.matches.length > 5000 ||
      !data.matches.every(validateBackupMatch) || !validateBackupDisplayPreferences(data.displayPreferences)) {
    throw new Error("This backup is incomplete or uses an unsupported format.");
  }
  return {
    setup: normalizeSetup(data.setup),
    matches: data.matches.map((match, index) => normalizeStoredMatch(match, index)).filter(Boolean),
    displayPreferences: normalizeDisplayPreferences(data.displayPreferences),
  };
}

export function exportLocalData(storage = getSafeStorage()) {
  if (!storage) throw new Error("Local storage is unavailable.");
  let setup = { ...DEFAULT_SETUP };
  try { setup = normalizeSetup(JSON.parse(storage.getItem(SETUP_KEY) || "{}")); } catch { /* Keep defaults. */ }
  const matches = readLocalMatches(storage).filter(validateBackupMatch);
  let displayPreferences = {};
  try { displayPreferences = JSON.parse(storage.getItem(DISPLAY_PREFERENCES_KEY) || "{}"); } catch { /* Use defaults. */ }
  return JSON.stringify({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    setup,
    matches,
    displayPreferences: normalizeDisplayPreferences(displayPreferences),
  }, null, 2);
}

export function importLocalData(text, storage = getSafeStorage()) {
  if (!storage) throw new Error("Local storage is unavailable.");
  const backup = parseLocalDataBackup(text);
  const keys = [SETUP_KEY, MATCHES_KEY, DISPLAY_PREFERENCES_KEY, STORAGE_VERSION_KEY];
  const before = new Map(keys.map((key) => [key, storage.getItem(key)]));
  try {
    storage.setItem(SETUP_KEY, JSON.stringify(backup.setup));
    storage.setItem(MATCHES_KEY, JSON.stringify(backup.matches));
    storage.setItem(DISPLAY_PREFERENCES_KEY, JSON.stringify(backup.displayPreferences));
    storage.setItem(STORAGE_VERSION_KEY, String(STORAGE_VERSION));
  } catch {
    // Restore the largest value first so it releases quota before setup and
    // preferences are written back. Track and verify every key: a partial
    // rollback must never be reported as a successful restoration.
    let restored = true;
    const restoreOrder = [MATCHES_KEY, SETUP_KEY, DISPLAY_PREFERENCES_KEY, STORAGE_VERSION_KEY];
    for (const key of restoreOrder) {
      const value = before.get(key);
      try {
        if (storage.getItem(key) !== value) {
          if (value === null) storage.removeItem(key);
          else storage.setItem(key, value);
        }
        if (storage.getItem(key) !== value) restored = false;
      } catch { restored = false; }
    }
    if (!restored) throw new Error("The backup could not be saved, and some existing data could not be restored.");
    throw new Error("The backup could not be saved. Your existing data was kept.");
  }
  memorySetupFallback = null;
  return { matchCount: backup.matches.length, setup: backup.setup };
}

export function deleteLocalData(storage = getSafeStorage()) {
  memoryMatchesFallback = [];
  if (!storage) return;
  const keys = [];
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (key && (key === SETUP_KEY || key === MATCHES_KEY || key === DISPLAY_PREFERENCES_KEY || key === STORAGE_VERSION_KEY ||
        key === "rally-rush:first-session-guide:v1" || key === "rally-rush:first-serve-hint:v1" ||
        key.startsWith(LEGACY_HISTORY_PREFIX))) keys.push(key);
  }
  keys.forEach((key) => storage.removeItem(key));
}

export const loadSetup = () => {
  if (memorySetupFallback) return { ...memorySetupFallback };
  const storage = getSafeStorage();
  migrateLocalStorage(storage);
  try { return normalizeSetup(JSON.parse(storage?.getItem(SETUP_KEY) || "{}")); }
  catch { return { ...DEFAULT_SETUP }; }
};
export const storeSetup = (s) => {
  const safeSetup = normalizeSetup(s);
  try {
    const storage = getSafeStorage();
    if (!storage) {
      memorySetupFallback = safeSetup;
      return false;
    }
    storage.setItem(SETUP_KEY, JSON.stringify(safeSetup));
    memorySetupFallback = null;
    return true;
  } catch {
    memorySetupFallback = safeSetup;
    return false;
  }
};
