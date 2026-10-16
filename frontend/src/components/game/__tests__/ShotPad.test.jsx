import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ShotPad from "../ShotPad";

it("keeps desktop keyboard controls visible and expandable", () => {
  const html = renderToStaticMarkup(<ShotPad />);

  expect(html).toContain('data-testid="desktop-controls"');
  expect(html).toContain("Controls</summary>");
  expect(html).toContain("WASD");
  expect(html).toContain("Enter");
  expect(html).not.toContain('data-testid="desktop-controls" class="sr-only"');
});
