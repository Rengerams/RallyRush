import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import ShotPad from "@/components/game/ShotPad";
import PauseModal from "@/components/game/PauseModal";
import MatchEndModal from "@/components/game/MatchEndModal";
import { attachPlayKeyboardControls } from "@/game/playKeyboardControls";
import { TennisEngine } from "@/game/engine";
import { DEFAULT_SETUP } from "@/game/constants";
import { audio } from "@/game/audio";
import "@/index.css";

audio.sound = false;
audio.voice = false;

function Fixture() {
  const mode = new URLSearchParams(location.search).get("mode");
  const [events, setEvents] = useState([]);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [selected, setSelected] = useState("flat");
  const [prefs, setPrefs] = useState({ hudSize: "normal", reducedMotion: true, reducedEffects: false, shotHoldMs: 150 });
  const log = useCallback((...event) => setEvents((current) => [...current, event]), []);
  const engineRef = useRef(null);

  if (!engineRef.current) {
    const engine = new TennisEngine(DEFAULT_SETUP, (event) => {
      if (event.type === "shot") log("contact", event.quality);
    });
    // A deterministic incoming ball in contact range; no RAF or GPU is required.
    engine.state = "rally";
    engine.lastHitter = 1;
    engine.isServe = false;
    Object.assign(engine.ball, { x: engine.p.x + 0.4, y: 1, z: engine.p.z, vx: -1, vz: 0 });
    engineRef.current = engine;
  }

  const togglePause = useCallback(() => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    engineRef.current.clearInput();
    log("pause", pausedRef.current);
  }, [log]);

  useEffect(() => attachPlayKeyboardControls({
    engineRef,
    graphicsReady: { current: true },
    pausedRef,
    introRef: { current: false },
    togglePause,
    noteServeAttempt: () => {},
  }), [togglePause]);

  const engine = engineRef.current;
  const result = {
    won: true,
    duration_sec: 120,
    sets: [[3, 1]],
    stats: { aces: 2 },
    opponentStats: { aces: 1 },
    rally_lengths: [1, 3, 6, 10],
  };

  return (
    <main className="p-4">
      <button data-testid="pause-trigger" onClick={togglePause}>Pause fixture</button>
      <output data-testid="events">{JSON.stringify(events)}</output>
      <output data-testid="engine-input">{engine.p.heldShot || "none"}</output>
      <div className="mt-4 flex max-w-xl">
        <ShotPad
          selectedShot={selected}
          prepareDelayMs={150}
          onSelect={setSelected}
          onHold={(id) => { engine.holdShot(id); log("hold", id); }}
          onRelease={(id) => { engine.releaseShot(id); log("release", id); }}
          onCancel={(id) => { engine.cancelShot(id); log("cancel", id); }}
          onShot={(id) => { engine.pressShot(id); log("tap", id); }}
        />
      </div>
      {paused && (
        <PauseModal
          onResume={togglePause}
          onRestart={() => log("restart")}
          onQuit={() => log("quit")}
          sound={false}
          voice={false}
          onSound={() => log("sound")}
          onVoice={() => log("voice")}
          replays
          onReplays={() => log("replays")}
          displayPrefs={prefs}
          onDisplayPrefChange={(key, value) => setPrefs((current) => ({ ...current, [key]: value }))}
        />
      )}
      {mode === "result" && (
        <MatchEndModal
          result={result}
          names={["Player", "AI"]}
          saveState="saved-local"
          onRematch={() => log("rematch")}
          onLeaderboard={() => log("leaderboard")}
          onSetup={() => log("setup")}
        />
      )}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<Fixture />);
