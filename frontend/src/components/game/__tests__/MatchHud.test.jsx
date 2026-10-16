import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import MatchHud from "../MatchHud";

const cfg = { legend: false, surface: "hard", difficulty: "medium", style: "baseline" };
const snap = {
  sets: [1, 0], games: [3, 2], labels: ["30", "15"], setHistory: [[6, 4]],
  server: 0, tiebreak: false, state: "rally", stamina: 0.7, sprint: false,
};

describe("match HUD presentation", () => {
  it("keeps the score compact in rallies and expands it between points", () => {
    const render = (state) => renderToStaticMarkup(<MatchHud snap={{ ...snap, state }} cfg={cfg} names={["Renger", "Medium AI"]} />);
    expect(render("rally")).toContain('data-compact="true"');
    expect(render("pointOver")).toContain('data-compact="false"');
  });

  it("shows control context and first-serve guidance when relevant", () => {
    const html = renderToStaticMarkup(<MatchHud
      snap={{ ...snap, state: "serve", serveStage: "hold", faults: 0 }} cfg={cfg} names={["Renger", "Medium AI"]}
      mouseEnabled touchControls intro={false} paused={false} firstServeAttempted={false}
    />);
    expect(html).toContain("pointer-control-hint");
    expect(html).toContain("touch-control-hint");
    expect(html).toContain("serve-hint");
  });
});
