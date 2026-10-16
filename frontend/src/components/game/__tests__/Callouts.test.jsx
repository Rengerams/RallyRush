import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Callouts from "../Callouts";

describe("shot quality callouts", () => {
  it("renders the early timing grade emitted by the engine", () => {
    const html = renderToStaticMarkup(<Callouts quality={{ id: 1, q: "early" }} />);

    expect(html).toContain("EARLY");
    expect(html).toContain('data-testid="shot-quality"');
  });

  it("ignores an incomplete or unknown quality instead of crashing", () => {
    expect(() => renderToStaticMarkup(<Callouts quality={{ id: 2 }} />)).not.toThrow();
    expect(() => renderToStaticMarkup(<Callouts quality={{ id: 3, q: "unknown" }} />)).not.toThrow();
    expect(renderToStaticMarkup(<Callouts quality={{ id: 2 }} />)).not.toContain('data-testid="shot-quality"');
  });
});
