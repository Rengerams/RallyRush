import { describe, expect, it } from "vitest";
import { Group, Panel, Separator } from "react-resizable-panels";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../resizable";

describe("resizable panel compatibility", () => {
  it("wraps the exports provided by the installed v4 dependency", () => {
    expect(ResizablePanelGroup).toBeTypeOf("function");
    expect(ResizablePanel).toBe(Panel);
    expect(ResizableHandle).toBeTypeOf("function");
    expect(Group).toBeDefined();
    expect(Separator).toBeDefined();
  });
});
