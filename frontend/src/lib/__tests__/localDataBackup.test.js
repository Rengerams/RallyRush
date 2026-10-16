import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETUP, SETUP_KEY } from "@/game/constants";
import {
  BACKUP_FORMAT, BACKUP_VERSION, DISPLAY_PREFERENCES_KEY, MATCHES_KEY,
  STORAGE_VERSION_KEY, deleteLocalData, exportLocalData, importLocalData, migrateLocalStorage,
} from "../api";

const values = new Map();
const storage = {
  get length() { return values.size; },
  key: (index) => [...values.keys()][index] ?? null,
  getItem: (key) => values.has(key) ? values.get(key) : null,
  setItem: (key, value) => values.set(key, String(value)),
  removeItem: (key) => values.delete(key),
};

const match = {
  match_id: "match-1", player_name: "Renger", won: true, difficulty: "medium",
  ai_style: "baseline", surface: "hard", match_format: "quick", sets: [[3, 1]],
  stats: { aces: 2 }, created_at: "2026-10-16T00:00:00.000Z",
};

beforeEach(() => {
  values.clear();
  vi.stubGlobal("localStorage", storage);
});

describe("local data backup", () => {
  it("exports and restores setup, preferences, and match history", () => {
    values.set(SETUP_KEY, JSON.stringify({ ...DEFAULT_SETUP, name: "Renger" }));
    values.set(MATCHES_KEY, JSON.stringify([match]));
    values.set(DISPLAY_PREFERENCES_KEY, JSON.stringify({ hudSize: "large", reducedEffects: true, reducedMotion: true }));

    const backupText = exportLocalData(storage);
    const backup = JSON.parse(backupText);
    expect(backup).toMatchObject({ format: BACKUP_FORMAT, version: BACKUP_VERSION, matches: [match] });

    values.clear();
    expect(importLocalData(backupText, storage)).toMatchObject({ matchCount: 1, setup: { name: "Renger" } });
    expect(JSON.parse(storage.getItem(MATCHES_KEY))).toEqual([match]);
    expect(JSON.parse(storage.getItem(DISPLAY_PREFERENCES_KEY))).toEqual({ hudSize: "large", reducedEffects: true, reducedMotion: true });
  });

  it.each([
    "not json",
    JSON.stringify({ format: BACKUP_FORMAT, version: 99 }),
    JSON.stringify({ format: BACKUP_FORMAT, version: BACKUP_VERSION, setup: DEFAULT_SETUP, matches: [null] }),
  ])("rejects malformed backups without changing saved data", (text) => {
    values.set(SETUP_KEY, JSON.stringify({ ...DEFAULT_SETUP, name: "Keep me" }));
    values.set(MATCHES_KEY, JSON.stringify([match]));
    const before = new Map(values);

    expect(() => importLocalData(text, storage)).toThrow();
    expect(values).toEqual(before);
  });

  it("rejects an oversized backup before parsing", () => {
    expect(() => importLocalData(" ".repeat(1_000_001), storage)).toThrow(/too large/i);
    expect(values.size).toBe(0);
  });

  it("deletes only Rally Rush keys and legacy history disclosure state", () => {
    values.set(SETUP_KEY, "setup");
    values.set(MATCHES_KEY, "matches");
    values.set(DISPLAY_PREFERENCES_KEY, "prefs");
    values.set("rally-rush:first-session-guide:v1", "complete");
    values.set(STORAGE_VERSION_KEY, "1");
    values.set("renffr-breakdown-match-1", "open");
    values.set("another-app:settings", "keep");

    deleteLocalData(storage);
    expect([...values]).toEqual([["another-app:settings", "keep"]]);
  });

  it("marks existing saves as migrated without rewriting their contents", () => {
    const oldSetup = JSON.stringify({ ...DEFAULT_SETUP, name: "Legacy save" });
    const oldMatches = JSON.stringify([match]);
    values.set(SETUP_KEY, oldSetup);
    values.set(MATCHES_KEY, oldMatches);

    migrateLocalStorage(storage);
    expect(storage.getItem(STORAGE_VERSION_KEY)).toBe("1");
    expect(storage.getItem(SETUP_KEY)).toBe(oldSetup);
    expect(storage.getItem(MATCHES_KEY)).toBe(oldMatches);
  });

  it("rolls back all Rally Rush keys when storage refuses an import", () => {
    values.set(SETUP_KEY, JSON.stringify({ ...DEFAULT_SETUP, name: "Keep me" }));
    values.set(MATCHES_KEY, JSON.stringify([match]));
    const before = new Map(values);
    const backupText = JSON.stringify({
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      setup: { ...DEFAULT_SETUP, name: "Overwrite" },
      matches: [],
      displayPreferences: { hudSize: "normal", reducedEffects: false, reducedMotion: false },
    });
    const blockedStorage = {
      ...storage,
      setItem: (key, value) => {
        if (key === MATCHES_KEY) throw new Error("quota");
        values.set(key, String(value));
      },
    };

    expect(() => importLocalData(backupText, blockedStorage)).toThrow(/existing data was kept/i);
    expect(values).toEqual(before);
  });
});
