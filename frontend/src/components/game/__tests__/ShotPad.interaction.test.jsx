// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import ShotPad from "../ShotPad";

afterEach(() => { cleanup(); vi.useRealTimers(); });

beforeAll(() => {
  if (!window.PointerEvent) {
    window.PointerEvent = class PointerEvent extends MouseEvent {
      constructor(type, init = {}) {
        super(type, init);
        Object.defineProperties(this, {
          pointerId: { value: init.pointerId ?? 1 },
          pointerType: { value: init.pointerType ?? "mouse" },
        });
      }
    };
  }
});

describe("ShotPad touch interactions", () => {
  it("fires a tap on release without starting a prepared hold", () => {
    const onShot = vi.fn();
    const onHold = vi.fn();
    const onRelease = vi.fn();
    render(<ShotPad onShot={onShot} onHold={onHold} onRelease={onRelease} />);
    const button = screen.getByTestId("shot-btn-flat");

    fireEvent.pointerDown(button, { pointerId: 7, pointerType: "touch", button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(button, { pointerId: 7, pointerType: "touch", button: 0, clientX: 10, clientY: 10 });

    expect(onShot).toHaveBeenCalledWith("flat");
    expect(onHold).not.toHaveBeenCalled();
    expect(onRelease).not.toHaveBeenCalled();
  });

  it("turns a held touch into a prepared swing and releases it on pointer-up", () => {
    vi.useFakeTimers();
    const onHold = vi.fn();
    const onRelease = vi.fn();
    render(<ShotPad onHold={onHold} onRelease={onRelease} prepareDelayMs={125} />);
    const button = screen.getByTestId("shot-btn-flat");

    fireEvent.pointerDown(button, { pointerId: 8, pointerType: "touch", button: 0, clientX: 10, clientY: 10 });
    act(() => { vi.advanceTimersByTime(125); });
    expect(onHold).toHaveBeenCalledWith("flat");
    fireEvent.pointerUp(button, { pointerId: 8, pointerType: "touch", button: 0, clientX: 10, clientY: 10 });
    expect(onRelease).toHaveBeenCalledWith("flat");
  });

  it("cancels the pending hold and shot when a touch is cancelled", () => {
    vi.useFakeTimers();
    const onShot = vi.fn();
    const onHold = vi.fn();
    const onRelease = vi.fn();
    render(<ShotPad onShot={onShot} onHold={onHold} onRelease={onRelease} prepareDelayMs={125} />);
    const button = screen.getByTestId("shot-btn-flat");

    fireEvent.pointerDown(button, { pointerId: 9, pointerType: "touch", button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerCancel(button, { pointerId: 9, pointerType: "touch" });
    act(() => { vi.advanceTimersByTime(125); });

    expect(onShot).not.toHaveBeenCalled();
    expect(onHold).not.toHaveBeenCalled();
    expect(onRelease).not.toHaveBeenCalled();
  });

  it("cancels a prepared hold without treating it as a release", () => {
    vi.useFakeTimers();
    const onHold = vi.fn();
    const onRelease = vi.fn();
    const onCancel = vi.fn();
    render(<ShotPad onHold={onHold} onRelease={onRelease} onCancel={onCancel} prepareDelayMs={125} />);
    const button = screen.getByTestId("shot-btn-flat");

    fireEvent.pointerDown(button, { pointerId: 11, pointerType: "touch", button: 0, clientX: 10, clientY: 10 });
    act(() => { vi.advanceTimersByTime(125); });
    fireEvent.pointerCancel(button, { pointerId: 11, pointerType: "touch" });

    expect(onHold).toHaveBeenCalledWith("flat");
    expect(onCancel).toHaveBeenCalledWith("flat");
    expect(onRelease).not.toHaveBeenCalled();
  });

  it("lets a horizontal touch swipe pan without firing a shot", () => {
    const onShot = vi.fn();
    const onHold = vi.fn();
    const onRelease = vi.fn();
    render(<ShotPad onShot={onShot} onHold={onHold} onRelease={onRelease} />);
    const button = screen.getByTestId("shot-btn-flat");

    fireEvent.pointerDown(button, { pointerId: 10, pointerType: "touch", button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(button, { pointerId: 10, pointerType: "touch", clientX: 30, clientY: 12 });
    fireEvent.pointerUp(button, { pointerId: 10, pointerType: "touch", clientX: 30, clientY: 12 });

    expect(onShot).not.toHaveBeenCalled();
    expect(onHold).not.toHaveBeenCalled();
    expect(onRelease).not.toHaveBeenCalled();
  });
});
