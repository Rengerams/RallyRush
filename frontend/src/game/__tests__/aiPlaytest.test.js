import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DIFFICULTY, STYLES } from "../constants";
import { PLAYTEST_PROFILES, simulatePlaytestMatch } from "../aiPlaytest";

const SEEDS = [0x51a7e, 0x23f09b, 0xa11ce, 0x7e115, 0x5eed, 0xc0ffee, 0x13579, 0x24680];
const originalWindow = globalThis.window;

beforeAll(() => { globalThis.window = {}; });
afterAll(() => {
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
});

describe("automated AI playtests", () => {
  it("finishes repeatable matches across difficulty, style, and player skill", () => {
    const report = [];

    for (const difficulty of Object.keys(DIFFICULTY)) {
      for (const style of Object.keys(STYLES)) {
        for (const player of Object.keys(PLAYTEST_PROFILES)) {
          const matches = SEEDS.map((seed) => simulatePlaytestMatch({ seed, difficulty, style, player }));
          for (const result of matches) {
            expect(result.points).toBeGreaterThan(0);
            expect(result.averageRally).toBeGreaterThanOrEqual(1);
            expect(Number.isFinite(result.durationSeconds)).toBe(true);
          }
          report.push({
            difficulty,
            style,
            player,
            wins: matches.filter((match) => match.won).length,
            matches: matches.length,
            winRate: `${Math.round(matches.filter((match) => match.won).length / matches.length * 100)}%`,
            avgRally: (matches.reduce((sum, match) => sum + match.averageRally, 0) / matches.length).toFixed(1),
            aiErrors: matches.reduce((sum, match) => sum + match.aiErrors, 0),
            aiAces: matches.reduce((sum, match) => sum + match.aiAces, 0),
          });
        }
      }
    }

    const repeated = simulatePlaytestMatch({ seed: SEEDS[0], difficulty: "medium", style: "baseline", player: "club" });
    expect(repeated).toEqual(simulatePlaytestMatch({ seed: SEEDS[0], difficulty: "medium", style: "baseline", player: "club" }));
    console.log("\nAI PLAYTEST MATRIX (eight fixed-seed quick matches per row)");
    console.table(report);
  }, 120_000);
});
