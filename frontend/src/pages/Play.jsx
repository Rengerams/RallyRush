import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pause } from "lucide-react";
import { TennisEngine } from "@/game/engine";
import { render } from "@/game/render";
import { audio } from "@/game/audio";
import { SHOT_BY_KEY, SURFACES, DIFFICULTY, STYLES } from "@/game/constants";
import { loadSetup, saveMatch } from "@/lib/api";
import Scoreboard from "@/components/game/Scoreboard";
import ShotPad from "@/components/game/ShotPad";
import DPad from "@/components/game/DPad";
import Callouts from "@/components/game/Callouts";
import StaminaBar from "@/components/game/StaminaBar";
import PauseModal from "@/components/game/PauseModal";
import MatchEndModal from "@/components/game/MatchEndModal";

const KEYMAP = { ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right", ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ShiftLeft: "sprint", ShiftRight: "sprint" };

export default function Play() {
  const nav = useNavigate();
  const [cfg] = useState(loadSetup);
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const engRef = useRef(null);
  const pausedRef = useRef(false);
  const [snap, setSnap] = useState(null);
  const [call, setCall] = useState(null);
  const [quality, setQuality] = useState(null);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState(null);
  const [saveState, setSaveState] = useState(null);
  const [sound, setSound] = useState(audio.sound);
  const [voice, setVoice] = useState(audio.voice);
  const [seed, setSeed] = useState(0);

  const onEvent = useCallback((e) => {
    if (e.type === "call") setCall({ ...e, id: Math.random() });
    if (e.type === "shot" && e.who === 0) setQuality({ q: e.quality, id: Math.random() });
    if (e.type === "matchEnd") {
      setResult(e.result);
      setSaveState("saving");
      saveMatch({
        player_name: cfg.name, won: e.result.won, difficulty: cfg.difficulty, ai_style: cfg.style, surface: cfg.surface,
        match_format: cfg.format, sets: e.result.sets, duration_sec: e.result.duration_sec, legend: !!cfg.legend,
        stats: e.result.stats, opponent_points: e.result.opponentStats.points_won,
      }).then(() => setSaveState("saved")).catch(() => setSaveState("error"));
    }
  }, [cfg]);

  useEffect(() => {
    const eng = new TennisEngine(cfg, onEvent);
    engRef.current = eng;
    setResult(null); setSaveState(null); setPaused(false); pausedRef.current = false;
    let raf, last = performance.now();
    const loop = (t) => {
      const dt = (t - last) / 1000; last = t;
      if (!pausedRef.current) eng.update(dt);
      const c = canvasRef.current;
      if (c) render(c.getContext("2d"), eng, c.width, c.height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const iv = setInterval(() => setSnap(eng.snapshot()), 100);
    return () => { cancelAnimationFrame(raf); clearInterval(iv); };
  }, [cfg, onEvent, seed]);

  useEffect(() => { const t = call && setTimeout(() => setCall(null), 1600); return () => clearTimeout(t); }, [call]);
  useEffect(() => { const t = quality && setTimeout(() => setQuality(null), 650); return () => clearTimeout(t); }, [quality]);

  const togglePause = useCallback(() => { pausedRef.current = !pausedRef.current; setPaused(pausedRef.current); }, []);

  useEffect(() => {
    const down = (e) => {
      const eng = engRef.current;
      if (!eng) return;
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
      if (e.code === "Escape" || e.code === "KeyP") return togglePause();
      if (pausedRef.current || e.repeat) return;
      audio.unlock();
      if (KEYMAP[e.code]) eng.setKey(KEYMAP[e.code], true);
      if (e.code === "Space") eng.slide();
      const digit = e.code.startsWith("Digit") ? e.code.slice(5) : e.code.startsWith("Numpad") ? e.code.slice(6) : null;
      if (digit && SHOT_BY_KEY[digit]) eng.pressShot(SHOT_BY_KEY[digit]);
    };
    const up = (e) => { if (KEYMAP[e.code]) engRef.current?.setKey(KEYMAP[e.code], false); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [togglePause]);

  useEffect(() => {
    const fit = () => {
      const c = canvasRef.current, w = wrapRef.current;
      if (!c || !w) return;
      const h = Math.min(window.innerHeight - 110, 900);
      const width = Math.min(w.clientWidth, h * 0.62);
      const dpr = window.devicePixelRatio || 1;
      c.style.width = `${width}px`; c.style.height = `${h}px`;
      c.width = width * dpr; c.height = h * dpr;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const shot = (id) => { audio.unlock(); engRef.current?.pressShot(id); };
  const names = engRef.current?.names || [cfg.name, "AI"];
  const toggleSound = () => { audio.sound = !audio.sound; setSound(audio.sound); };
  const toggleVoice = () => { audio.voice = !audio.voice; setVoice(audio.voice); };

  return (
    <main className="mx-auto grid max-w-[1440px] gap-5 px-4 py-4 lg:grid-cols-[300px_1fr_260px] lg:px-8" data-testid="play-page">
      <aside className="order-2 space-y-4 lg:order-1">
        <Scoreboard snap={snap} names={names} legend={cfg.legend} />
        <StaminaBar value={snap?.stamina ?? 1} sprint={snap?.sprint} />
        <div className="rounded-2xl border border-white/10 bg-[#121824] p-4 font-mono text-xs text-slate-400">
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Match info</p>
          <p className="mt-2">Surface · <span className="text-white">{SURFACES[cfg.surface].label}</span></p>
          <p>Opponent · <span className="text-white">{DIFFICULTY[cfg.difficulty].label} {STYLES[cfg.style].label}</span></p>
          <p>Rally · <span data-testid="rally-count" className="text-[#DFFF00]">{snap?.rally ?? 0}</span></p>
          {snap?.state === "serve" && snap.server === 0 && (
            <p data-testid="serve-hint" className="mt-3 rounded-lg bg-[#DFFF00]/10 px-3 py-2 text-[#DFFF00]">
              {snap.serveStage === "hold" ? "Press any shot key to toss" : "Strike at the top of the toss!"}{snap.faults ? " · 2nd serve" : ""}
            </p>
          )}
        </div>
      </aside>
      <section ref={wrapRef} className="relative order-1 flex justify-center lg:order-2" data-testid="game-canvas-wrapper">
        <div className="relative">
          <canvas ref={canvasRef} data-testid="game-canvas" className="block rounded-2xl border border-white/10" />
          <button data-testid="pause-btn" onClick={togglePause} className="absolute right-3 top-3 rounded-full border border-white/15 bg-[#0B0E14]/70 p-2 backdrop-blur hover:border-[#DFFF00]">
            <Pause size={16} />
          </button>
          <Callouts call={call} quality={quality} />
          {paused && !result && (
            <PauseModal onResume={togglePause} onRestart={() => setSeed((s) => s + 1)} onQuit={() => nav("/setup")}
              sound={sound} voice={voice} onSound={toggleSound} onVoice={toggleVoice} />
          )}
          {result && (
            <MatchEndModal result={result} names={names} saveState={saveState}
              onRematch={() => setSeed((s) => s + 1)} onLeaderboard={() => nav("/leaderboard")} onSetup={() => nav("/setup")} />
          )}
        </div>
      </section>
      <aside className="order-3 space-y-4">
        <ShotPad onShot={shot} />
        <DPad onKey={(k, d) => engRef.current?.setKey(k, d)} />
      </aside>
    </main>
  );
}
