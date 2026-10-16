import { DIFFICULTY, STYLES, SURFACES } from "@/game/constants";
import Scoreboard from "./Scoreboard";
import StaminaBar from "./StaminaBar";
import { ServeIndicator } from "./ServeIndicator";

export default function MatchHud({ snap, cfg, names, mouseEnabled, touchControls, intro, paused, firstServeAttempted }) {
  return (
    <div className="play-hud-corner absolute left-2 top-2 z-20 flex w-[min(22rem,calc(100vw-1rem))] flex-col gap-2 sm:left-4 sm:top-4 sm:w-[min(22rem,calc(100vw-2rem))]">
      <Scoreboard snap={snap} names={names} legend={cfg.legend} compact={snap?.state === "rally"} />
      <StaminaBar value={snap?.stamina ?? 1} sprint={snap?.sprint} />
      <details className="rounded-xl border border-white/10 bg-[#0B0E14]/80 px-3 py-2 font-mono text-[10px] text-slate-300 backdrop-blur-md">
        <summary className="cursor-pointer font-semibold uppercase tracking-wider text-[#00F0FF] outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]">Match details and controls</summary>
        <div className="mt-2 grid gap-1 sm:grid-cols-2">
          <p>Surface · <span className="text-white">{SURFACES[cfg.surface].label}</span></p>
          <p>Opponent · <span className="text-white">{DIFFICULTY[cfg.difficulty].label} {STYLES[cfg.style].label}</span></p>
          <p>Rally · <span data-testid="rally-count" className="text-[#DFFF00]">{snap?.rally ?? 0}</span></p>
          <p data-testid="keyboard-control-hint">Keyboard · WASD/arrows move · 1–7 hold/release a shot · Shift sprint · Space slide · Esc pause</p>
          {mouseEnabled && <p data-testid="pointer-control-hint">Mouse · move to run · right-click to aim · hold/release left-click to swing</p>}
          {touchControls
            ? <p data-testid="touch-control-hint" className="text-[#DFFF00]">Touch · arrows move · hold/release a shot button · swipe the shot strip sideways to reach Serve</p>
            : <p data-testid="onscreen-control-hint">On-screen arrows move · hold/release a shot button</p>}
          <p>Enter · skip replay</p>
          {snap?.state === "serve" && snap.server === 0 && (
            <p data-testid="serve-hint" className="text-[#DFFF00]">
              {snap.serveStage === "hold" ? "Ready to serve" : "Ball in the air"}{snap.faults ? " · 2nd serve" : ""}
            </p>
          )}
        </div>
      </details>
      {!intro && !paused && <ServeIndicator snap={snap} showFirstServeHint={!firstServeAttempted} />}
    </div>
  );
}
