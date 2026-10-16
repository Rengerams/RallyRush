import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Scoreboard from "../Scoreboard";

const snap = {
  sets: [1, 0],
  games: [4, 3],
  labels: ["30", "15"],
  setHistory: [[6, 4]],
  server: 0,
  tiebreak: false,
};

describe("match scoreboard", () => {
  it("labels score columns and makes the serving player obvious", () => {
    const html = renderToStaticMarkup(<Scoreboard snap={snap} names={["Renger", "AI"]} />);
    expect(html).toContain("Sets 1–0");
    expect(html).toContain("Games · Points");
    expect(html).toContain("SERVE");
    expect(html).toContain("aria-label=\"Renger, serving\"");
    expect(html).toContain("30");
    expect(html).toContain("4");
  });

  it("keeps the live score available in compact rally mode", () => {
    const html = renderToStaticMarkup(<Scoreboard snap={{ ...snap, tiebreak: true }} names={["Renger", "AI"]} compact />);
    expect(html).toContain("data-compact=\"true\"");
    expect(html).toContain("Tie-break");
    expect(html).toContain("Games · Points");
    expect(html).toContain("data-testid=\"scoreboard-points-0\"");
  });
});
