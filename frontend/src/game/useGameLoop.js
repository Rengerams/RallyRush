import { useEffect } from "react";
import { startGameLoop } from "./gameLoop";

export function useGameLoop(engine, canUpdate, onSnapshot) {
  useEffect(() => startGameLoop({ engine, canUpdate, onSnapshot }), [engine, canUpdate, onSnapshot]);
}
