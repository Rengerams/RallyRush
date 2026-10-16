import { useEffect } from "react";
import { attachPlayKeyboardControls } from "./playKeyboardControls";

export function useGameKeyboardControls({ engineRef, graphicsReady, pausedRef, introRef, togglePause, noteServeAttempt }) {
  useEffect(() => attachPlayKeyboardControls({
    engineRef,
    graphicsReady,
    pausedRef,
    introRef,
    togglePause,
    noteServeAttempt,
  }), [engineRef, graphicsReady, pausedRef, introRef, togglePause, noteServeAttempt]);
}
