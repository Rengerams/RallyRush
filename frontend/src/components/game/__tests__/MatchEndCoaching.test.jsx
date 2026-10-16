import { describe, expect, it } from "vitest";
import { getCoachingNote } from "../MatchEndModal";

describe("post-match coaching", () => {
  it("suggests timing practice when perfect contacts are uncommon", () => {
    expect(getCoachingNote({ stats: { total_shots: 12, perfect_shots: 2 } })).toContain("Timing Practice");
  });

  it("suggests more margin when errors exceed winners", () => {
    expect(getCoachingNote({ stats: { total_shots: 12, perfect_shots: 8, errors: 5, winners: 2 } })).toContain("higher-margin shot");
  });

  it("avoids drawing conclusions from a tiny sample", () => {
    expect(getCoachingNote({ stats: { total_shots: 3, perfect_shots: 0 } })).toContain("Play a few more rallies");
  });
});
