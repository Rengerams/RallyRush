import { describe, expect, it, vi } from "vitest";
import { fitCanvas } from "../GameCanvas";

describe("game canvas sizing", () => {
  it("falls back to viewport dimensions when the wrapper ref is missing", () => {
    const canvas = { style: {} };
    const view = { setSize: vi.fn() };

    expect(() => fitCanvas(canvas, null, view, 1280, 720)).not.toThrow();
    expect(canvas.style).toEqual({ width: "1280px", height: "720px" });
    expect(view.setSize).toHaveBeenCalledWith(1280, 720);
  });
});
