import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETUP, SETUP_KEY } from "@/game/constants";
import { deleteLocalData, fetchLeaderboard, fetchMatches, loadSetup, saveMatch, storeSetup } from "../api";

const MATCHES_KEY = "renffr-tennis-matches";
const values = new Map();

beforeEach(() => {
  values.clear();
  vi.stubGlobal("localStorage", {
    get length() { return values.size; },
    key: (index) => [...values.keys()][index] ?? null,
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("local data validation", () => {
  it("keeps matches in session memory when browser storage is unavailable", async () => {
    vi.stubGlobal("localStorage", null);
    deleteLocalData(null);

    const saved = await saveMatch({
      match_id: "session-match-1", player_name: "Session player", won: true,
      difficulty: "medium", surface: "hard", stats: { aces: 2 },
    });

    expect(saved.storage).toBe("session");
    await expect(fetchMatches({ player: "session player" })).resolves.toMatchObject([
      { match_id: "session-match-1", player_name: "Session player", storage: "session" },
    ]);
    await expect(fetchLeaderboard()).resolves.toMatchObject([
      { player_name: "Session player", matches: 1, wins: 1 },
    ]);
  });

  it.each(["null", "[]", "\"unexpected\"", "42", "true"])("uses defaults for non-object setup JSON (%s)", (raw) => {
    values.set(SETUP_KEY, raw);
    expect(loadSetup()).toEqual(DEFAULT_SETUP);
  });

  it("filters malformed match rows without throwing during player search", async () => {
    values.set(MATCHES_KEY, JSON.stringify([
      null,
      "broken",
      [],
      { player_name: 7, surface: "hard" },
      { player_name: "  Renger ", surface: "hard" },
    ]));

    await expect(fetchMatches({ player: "renger" })).resolves.toMatchObject([
      { player_name: "Renger", surface: "hard", won: false, created_at: "1970-01-01T00:00:00.000Z", stats: { aces: 0 } },
    ]);
  });

  it("skips invalid leaderboard names and keeps unknown difficulty ratings finite", async () => {
    values.set(MATCHES_KEY, JSON.stringify([
      { player_name: "   ", won: true, difficulty: "toString" },
      { player_name: "Renger", won: true, difficulty: "toString", stats: null },
      { player_name: "Renger", won: true, difficulty: "hard", stats: { aces: 2 } },
    ]));

    const [row] = await fetchLeaderboard();
    expect(row.player_name).toBe("Renger");
    expect(row.matches).toBe(2);
    expect(row.rating).toBe(35);
    expect(Number.isFinite(row.rating)).toBe(true);
    expect(row.aces).toBe(2);
  });

  it("rejects inherited property names as setup enum values", () => {
    values.set(SETUP_KEY, JSON.stringify({
      surface: "toString",
      difficulty: "__proto__",
      style: "constructor",
      format: "toString",
    }));

    expect(loadSetup()).toEqual(DEFAULT_SETUP);
  });

  it("keeps setup and lets the player continue when local storage is unavailable or full", () => {
    const setup = { ...DEFAULT_SETUP, name: "Local player" };
    vi.stubGlobal("localStorage", null);
    expect(storeSetup(setup)).toBe(false);
    expect(loadSetup()).toEqual(setup);

    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => { throw new Error("quota exceeded"); },
    });
    expect(storeSetup({ ...setup, name: "Still playable" })).toBe(false);
    expect(loadSetup().name).toBe("Still playable");
  });
});
