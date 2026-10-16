import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ShotPad from "../ShotPad";

it("keeps desktop keyboard controls expandable only at desktop widths", () => {
  const html = renderToStaticMarkup(<ShotPad />);

  expect(html).toContain('data-testid="desktop-controls" class="mt-2 hidden border-t border-white/10 pt-2 lg:block"');
  expect(html).toContain("Controls</summary>");
  expect(html).toContain("WASD");
  expect(html).toContain("Enter");
  expect(html).not.toContain('data-testid="desktop-controls" class="sr-only"');
});
