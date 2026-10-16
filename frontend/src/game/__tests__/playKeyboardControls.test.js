import { describe, expect, it, vi } from "vitest";
import { attachPlayKeyboardControls } from "../playKeyboardControls";

function createEventTarget() {
  const handlers = new Map();
  return {
    addEventListener: (type, listener) => handlers.set(type, listener),
    removeEventListener: (type) => handlers.delete(type),
    dispatch: (type, event) => handlers.get(type)?.({ target: null, repeat: false, preventDefault: vi.fn(), ...event }),
    handlers,
  };
}

describe("play keyboard controls", () => {
  it("routes movement, held shots, pause, and cleanup through the engine refs", () => {
    const target = createEventTarget();
    const engine = {
      state: "rally",
      setKey: vi.fn(), holdShot: vi.fn(), releaseShot: vi.fn(), clearInput: vi.fn(),
    };
    const engineRef = { current: engine };
    const pausedRef = { current: false };
    const togglePause = vi.fn();
    const noteServeAttempt = vi.fn();
    const detach = attachPlayKeyboardControls({
      engineRef, graphicsReady: { current: true }, pausedRef, introRef: { current: false }, togglePause, noteServeAttempt,
    }, target);

    target.dispatch("keydown", { code: "ArrowRight" });
    target.dispatch("keyup", { code: "ArrowRight" });
    target.dispatch("keydown", { code: "Digit2" });
    target.dispatch("keyup", { code: "Digit2" });
    target.dispatch("keydown", { code: "Escape" });

    expect(engine.setKey).toHaveBeenNthCalledWith(1, "right", true);
    expect(engine.setKey).toHaveBeenNthCalledWith(2, "right", false);
    expect(engine.holdShot).toHaveBeenCalledWith("topspin");
    expect(engine.releaseShot).toHaveBeenCalledWith("topspin");
    expect(noteServeAttempt).toHaveBeenCalledOnce();
    expect(togglePause).toHaveBeenCalledOnce();

    detach();
    expect(target.handlers.size).toBe(0);
  });

  it("clears stuck input and pauses when the game window loses focus", () => {
    const target = createEventTarget();
    const engine = { state: "rally", clearInput: vi.fn() };
    const togglePause = vi.fn();
    attachPlayKeyboardControls({
      engineRef: { current: engine }, graphicsReady: { current: true }, pausedRef: { current: false },
      introRef: { current: false }, togglePause, noteServeAttempt: vi.fn(),
    }, target);

    target.dispatch("blur", {});

    expect(engine.clearInput).toHaveBeenCalledOnce();
    expect(togglePause).toHaveBeenCalledOnce();
  });

  it("leaves keyboard shortcuts inside dialogs to the dialog", () => {
    const target = createEventTarget();
    const engine = { state: "rally", setKey: vi.fn(), holdShot: vi.fn(), releaseShot: vi.fn() };
    const togglePause = vi.fn();
    attachPlayKeyboardControls({
      engineRef: { current: engine }, graphicsReady: { current: true }, pausedRef: { current: true },
      introRef: { current: false }, togglePause, noteServeAttempt: vi.fn(),
    }, target);
    const dialogButton = { closest: vi.fn(() => ({})) };

    target.dispatch("keydown", { target: dialogButton, code: "KeyP" });
    target.dispatch("keydown", { target: dialogButton, code: "ArrowDown" });
    target.dispatch("keyup", { target: dialogButton, code: "ArrowDown" });

    expect(togglePause).not.toHaveBeenCalled();
    expect(engine.setKey).not.toHaveBeenCalled();
    expect(engine.holdShot).not.toHaveBeenCalled();
    expect(engine.releaseShot).not.toHaveBeenCalled();
  });
});
