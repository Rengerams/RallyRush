import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ShotPad from "../ShotPad";

it("keeps the shot pad compact and leaves full control guidance in the match HUD", () => {
  const html = renderToStaticMarkup(<ShotPad />);

  expect(html).not.toContain('data-testid="desktop-controls"');
  expect(html).not.toContain("Controls</summary>");
  expect(html).toContain('data-testid="touch-shot-hint"');
  expect(html).toContain("hold briefly, then release near contact");
  expect(html).toContain("Swipe sideways to reach Serve");
});
