import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETUP, SETUP_KEY } from "@/game/constants";
import { fetchLeaderboard, fetchMatches, loadSetup } from "../api";

const MATCHES_KEY = "renffr-tennis-matches";
const values = new Map();

beforeEach(() => {
  values.clear();
  vi.stubGlobal("localStorage", {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("local data validation", () => {
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

    await expect(fetchMatches({ player: "renger" })).resolves.toEqual([
      { player_name: "  Renger ", surface: "hard" },
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
});
