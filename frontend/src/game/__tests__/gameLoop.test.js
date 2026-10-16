import { describe, expect, it, vi } from "vitest";
import { startGameLoop } from "../gameLoop";

describe("shared game loop lifecycle", () => {
  it("updates only while active, publishes snapshots, and cancels scheduled work", () => {
    const engine = { update: vi.fn(), snapshot: vi.fn(() => ({ frame: 1 })) };
    const canUpdate = vi.fn(() => false);
    const onSnapshot = vi.fn();
    const frames = [];
    const cancelFrame = vi.fn();
    const clearTimer = vi.fn();
    let timerCallback;
    const cleanup = startGameLoop({
      engine, canUpdate, onSnapshot, now: () => 0,
      requestFrame: (callback) => { frames.push(callback); return frames.length; },
      cancelFrame,
      setTimer: (callback, delay) => { timerCallback = callback; expect(delay).toBe(100); return 42; },
      clearTimer,
    });

    frames[0](16);
    expect(engine.update).not.toHaveBeenCalled();
    canUpdate.mockReturnValue(true);
    frames[1](32);
    expect(engine.update).toHaveBeenCalledWith(0.016);
    timerCallback();
    expect(onSnapshot).toHaveBeenCalledWith({ frame: 1 });

    cleanup();
    expect(cancelFrame).toHaveBeenCalledWith(3);
    expect(clearTimer).toHaveBeenCalledWith(42);
  });
});
