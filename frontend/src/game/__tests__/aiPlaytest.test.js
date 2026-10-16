import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ATTR_BUDGET, DIFFICULTY, STYLES, SURFACES } from "../constants";
import { PLAYTEST_BUILD, PLAYTEST_PROFILES, simulatePlaytestMatch } from "../aiPlaytest";

const SEEDS = [0x51a7e, 0x23f09b, 0xa11ce, 0x7e115, 0x5eed, 0xc0ffee, 0x13579, 0x24680];
const originalWindow = globalThis.window;

beforeAll(() => { globalThis.window = {}; });
afterAll(() => {
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
});

describe("automated AI playtests", () => {
  it("finishes repeatable matches across difficulty, style, and player skill", () => {
    expect(PLAYTEST_BUILD.power + PLAYTEST_BUILD.stamina + PLAYTEST_BUILD.accuracy).toBe(ATTR_BUDGET);
    const totals = Object.fromEntries(Object.keys(DIFFICULTY).map((difficulty) => [difficulty,
      Object.fromEntries(Object.keys(PLAYTEST_PROFILES).map((player) => [player, { wins: 0, matches: 0, matchupRates: [] }]))]));

    for (const difficulty of Object.keys(DIFFICULTY)) {
      for (const style of Object.keys(STYLES)) {
        for (const surface of Object.keys(SURFACES)) {
          for (const player of Object.keys(PLAYTEST_PROFILES)) {
            const matches = SEEDS.map((seed) => simulatePlaytestMatch({ seed, difficulty, style, surface, player }));
            for (const result of matches) {
              expect(result.points).toBeGreaterThan(0);
              expect(result.averageRally).toBeGreaterThanOrEqual(1);
              expect(Number.isFinite(result.durationSeconds)).toBe(true);
            }
            const wins = matches.filter((match) => match.won).length;
            const total = totals[difficulty][player];
            total.wins += wins;
            total.matches += matches.length;
            total.matchupRates.push(wins / matches.length);
          }
        }
      }
    }

    for (const player of Object.keys(PLAYTEST_PROFILES)) {
      const easy = totals.easy[player].wins;
      const medium = totals.medium[player].wins;
      const hard = totals.hard[player].wins;
      const pro = totals.pro[player].wins;
      const tolerance = Math.ceil(totals.easy[player].matches * 0.05);
      expect(easy + tolerance).toBeGreaterThanOrEqual(medium);
      expect(medium + tolerance).toBeGreaterThanOrEqual(hard);
      expect(hard + tolerance).toBeGreaterThanOrEqual(pro);
    }

    const repeated = simulatePlaytestMatch({ seed: SEEDS[0], difficulty: "medium", style: "baseline", surface: "hard", player: "club" });
    expect(repeated).toEqual(simulatePlaytestMatch({ seed: SEEDS[0], difficulty: "medium", style: "baseline", surface: "hard", player: "club" }));
    const report = Object.entries(totals).flatMap(([difficulty, players]) => Object.entries(players).map(([player, result]) => ({
      difficulty,
      player,
      wins: result.wins,
      matches: result.matches,
      winRate: `${Math.round(result.wins / result.matches * 100)}%`,
      styleSurfaceRange: `${Math.round(Math.min(...result.matchupRates) * 100)}–${Math.round(Math.max(...result.matchupRates) * 100)}%`,
    })));
    console.log("\nAI PLAYTEST MATRIX (eight fixed-seed quick matches per style/surface matchup)");
    console.table(report);
  }, 300_000);
});
