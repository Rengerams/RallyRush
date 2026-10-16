import { SHOT_BY_KEY } from "./constants";
import { audio } from "./audio";

const KEYMAP = {
  ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right",
  ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down",
  ShiftLeft: "sprint", ShiftRight: "sprint",
};

export function attachPlayKeyboardControls({ engineRef, graphicsReady, pausedRef, introRef, togglePause, noteServeAttempt }, target = window) {
  const down = (event) => {
    const engine = engineRef.current;
    if (!engine || !graphicsReady.current) return;
    const eventTarget = event.target;
    const isEditable = typeof HTMLElement !== "undefined" && eventTarget instanceof HTMLElement &&
      (eventTarget.isContentEditable || eventTarget.matches("input, textarea, select, [role='textbox']"));
    if (isEditable) return;
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
    if (introRef.current || engine.state === "matchOver") return;
    if (event.code === "Escape" || event.code === "KeyP") {
      if (event.repeat) return;
      // Radix handles Escape after the pause dialog opens, so do not resume twice.
      if (event.code === "Escape" && pausedRef.current) return;
      event.preventDefault();
      togglePause();
      return;
    }
    if (pausedRef.current || event.repeat) return;
    audio.unlock();
    if (KEYMAP[event.code]) engine.setKey(KEYMAP[event.code], true);
    if (event.code === "Space") engine.slide();
    if (event.code === "Enter" && engine.state === "replay") engine.endReplay();
    const digit = event.code.startsWith("Digit") ? event.code.slice(5) : event.code.startsWith("Numpad") ? event.code.slice(6) : null;
    if (digit && SHOT_BY_KEY[digit]) {
      noteServeAttempt();
      engine.holdShot(SHOT_BY_KEY[digit]);
    }
  };
  const up = (event) => {
    if (KEYMAP[event.code]) engineRef.current?.setKey(KEYMAP[event.code], false);
    const digit = event.code.replace(/^(Digit|Numpad)/, "");
    if (SHOT_BY_KEY[digit]) engineRef.current?.releaseShot(SHOT_BY_KEY[digit]);
  };
  const blur = () => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.clearInput();
    if (!pausedRef.current && !introRef.current && engine.state !== "matchOver") togglePause();
  };

  target.addEventListener("keydown", down);
  target.addEventListener("keyup", up);
  target.addEventListener("blur", blur);
  return () => {
    target.removeEventListener("keydown", down);
    target.removeEventListener("keyup", up);
    target.removeEventListener("blur", blur);
  };
}
