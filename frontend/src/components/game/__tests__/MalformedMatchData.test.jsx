import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { getMatchAccuracy } from "../MatchEndModal";
import { MatchStats } from "../MatchStats";
import { MatchCard } from "@/pages/History";

it("renders history rows with missing stats and incomplete metadata", () => {
  const html = renderToStaticMarkup(<MatchCard m={{
    id: "legacy",
    won: false,
    player_name: "Renger",
    surface: "unknown",
    difficulty: "unknown",
    ai_style: "unknown",
    match_format: "unknown",
    sets: null,
    stats: null,
    created_at: "2026-01-01T00:00:00.000Z",
  }} />);

  expect(html).toContain("Unknown surface");
  expect(html).toContain("Aces");
  expect(html).toContain(">0</b>");
});

it("renders match statistics when stat objects and rally data are missing", () => {
  const html = renderToStaticMarkup(
    <MatchStats stats={null} opponentStats={null} names={null} rallyLengths={null} />,
  );

  expect(html).toContain("Player");
  expect(html).toContain("Opponent");
  expect(html).toContain("Average —");
});

it("calculates match accuracy safely when result statistics are missing", () => {
  expect(getMatchAccuracy({ won: true })).toBe(0);
  expect(getMatchAccuracy({ stats: null })).toBe(0);
  expect(getMatchAccuracy({ stats: { total_shots: 10, perfect_shots: 4 } })).toBe(40);
  expect(getMatchAccuracy({ stats: { total_shots: "invalid", perfect_shots: 4 } })).toBe(0);
});
