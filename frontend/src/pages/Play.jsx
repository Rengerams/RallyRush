import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pause, Box, Square } from "lucide-react";
import { TennisEngine } from "@/game/engine";
import { audio } from "@/game/audio";
import { SHOT_BY_KEY, SURFACES, DIFFICULTY, STYLES } from "@/game/constants";
import { loadSetup, saveMatch } from "@/lib/api";
import { toast } from "sonner";
import Scoreboard from "@/components/game/Scoreboard";
import ShotPad from "@/components/game/ShotPad";
import DPad from "@/components/game/DPad";
import Callouts from "@/components/game/Callouts";
import StaminaBar from "@/components/game/StaminaBar";
import PauseModal from "@/components/game/PauseModal";
import MatchEndModal from "@/components/game/MatchEndModal";
import MatchIntro from "@/components/game/MatchIntro";
import GameCanvas from "@/components/game/GameCanvas";
import MobileScore from "@/components/game/MobileScore";

const KEYMAP = { ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right", ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ShiftLeft: "sprint", ShiftRight: "sprint" };

export default function Play() {
  const nav = useNavigate();
  const [cfg] = useState(loadSetup);
  const wrapRef = useRef(null);
  const engRef = useRef(null);
  const pausedRef = useRef(false);
  const replaysRef = useRef(true);
  const [snap, setSnap] = useState(null);
  const [call, setCall] = useState(null);
  const [quality, setQuality] = useState(null);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState(null);
  const [saveState, setSaveState] = useState(null);
  const [sound, setSound] = useState(audio.sound);
  const [voice, setVoice] = useState(audio.voice);
  const [seed, setSeed] = useState(0);
  const [replay, setReplay] = useState(null);
  const [replays, setReplays] = useState(true);
  const [intro, setIntro] = useState(true);
  const introRef = useRef(true);
  const manual3d = useRef(false);
  const [mode, setMode] = useState(() => localStorage.getItem("renffr-view") || "3d");

  const onEvent = useCallback((e) => {
    if (e.type === "replay") setReplay(e.on ? e.label : null);
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const eng = useMemo(() => new TennisEngine(cfg, onEvent), [cfg, onEvent, seed]);

  useEffect(() => {
    eng.replays = replaysRef.current;
    engRef.current = eng;
    setReplay(null);
    setResult(null); setSaveState(null); setPaused(false); pausedRef.current = false;
    introRef.current = true; setIntro(true);
    let raf, last = performance.now();
    const loop = (t) => {
      const dt = (t - last) / 1000; last = t;
      if (!pausedRef.current && !introRef.current) eng.update(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const iv = setInterval(() => setSnap(eng.snapshot()), 100);
    return () => { cancelAnimationFrame(raf); clearInterval(iv); };
  }, [eng]);

  useEffect(() => { const t = call && setTimeout(() => setCall(null), 1600); return () => clearTimeout(t); }, [call]);
  useEffect(() => { const t = quality && setTimeout(() => setQuality(null), 650); return () => clearTimeout(t); }, [quality]);

  const togglePause = useCallback(() => { pausedRef.current = !pausedRef.current; setPaused(pausedRef.current); }, []);

  useEffect(() => {
    const down = (e) => {
      const eng = engRef.current;
      if (!eng) return;
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
      if (introRef.current) return;
      if (e.code === "Escape" || e.code === "KeyP") return togglePause();
      if (pausedRef.current || e.repeat) return;
      audio.unlock();
      if (KEYMAP[e.code]) eng.setKey(KEYMAP[e.code], true);
      if (e.code === "Space") eng.slide();
      if (e.code === "Enter" && eng.state === "replay") eng.endReplay();
      const digit = e.code.startsWith("Digit") ? e.code.slice(5) : e.code.startsWith("Numpad") ? e.code.slice(6) : null;
      if (digit && SHOT_BY_KEY[digit]) eng.pressShot(SHOT_BY_KEY[digit]);
    };
    const up = (e) => { if (KEYMAP[e.code]) engRef.current?.setKey(KEYMAP[e.code], false); };
    const blur = () => {
      const eng = engRef.current;
      if (!eng) return;
      eng.keys = {};
      if (!pausedRef.current && !introRef.current && eng.state !== "matchOver") togglePause();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, [togglePause]);


  const endIntro = useCallback(() => { introRef.current = false; setIntro(false); }, []);
  const shot = (id) => {
    if (introRef.current) return; audio.unlock(); engRef.current?.pressShot(id); };
  const names = [cfg.name, `${DIFFICULTY[cfg.difficulty].label} AI`];
  const toggleSound = () => { audio.sound = !audio.sound; setSound(audio.sound); };
  const toggleReplays = () => { replaysRef.current = !replaysRef.current; if (engRef.current) engRef.current.replays = replaysRef.current; setReplays(replaysRef.current); };
  const onSlow = useCallback((why) => {
    localStorage.setItem("renffr-view", "2d");
    setMode("2d");
    toast(why === "slow" ? "Switched to 2D for smoother play" : "3D isn't supported on this device — using 2D", { description: "You can switch back with the 3D button." });
  }, []);
  const toggleMode = () => { const m = mode === "3d" ? "2d" : "3d"; manual3d.current = m === "3d"; localStorage.setItem("renffr-view", m); setMode(m); };
  const toggleVoice = () => { audio.voice = !audio.voice; setVoice(audio.voice); };

  return (
    <main className="mx-auto grid max-w-[1440px] grid-cols-1 gap-4 px-3 py-3 sm:px-4 lg:grid-cols-[280px_minmax(0,1fr)_240px] lg:gap-5 lg:px-8 lg:py-4" data-testid="play-page">
      <aside className="order-3 min-w-0 space-y-4 lg:order-1">
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
      <section ref={wrapRef} className="relative order-1 min-w-0 lg:order-2" data-testid="game-canvas-wrapper">
        <div className="relative mx-auto w-fit max-w-full">
          <GameCanvas key={mode} eng={eng} mode={mode} wrapRef={wrapRef} onTap={() => shot("flat")} onSlow={mode === "3d" && !manual3d.current ? onSlow : undefined} />
          <MobileScore snap={snap} />
          <div className="absolute right-3 top-3 flex gap-2">
            <button data-testid="view-toggle-btn" onClick={toggleMode} title="Switch 2D / 3D" className="flex items-center gap-1.5 rounded-full border border-white/15 bg-[#0B0E14]/70 px-3 py-2 font-mono text-[11px] font-bold backdrop-blur hover:border-[#DFFF00]">
              {mode === "3d" ? <Square size={14} /> : <Box size={14} />} {mode === "3d" ? "2D" : "3D"}
            </button>
            <button data-testid="pause-btn" onClick={togglePause} className="rounded-full border border-white/15 bg-[#0B0E14]/70 p-2 backdrop-blur hover:border-[#DFFF00]">
              <Pause size={16} />
            </button>
          </div>
          <Callouts call={call} quality={quality} />
          {intro && <MatchIntro key={seed} cfg={cfg} names={names} onDone={endIntro} />}
          {replay && !paused && (
            <div data-testid="replay-banner" className="absolute inset-x-0 top-[9%] flex flex-col items-center gap-2">
              <span className="font-display rounded-full bg-[#0B0E14]/80 px-5 py-1 text-2xl font-black uppercase italic text-[#00F0FF]">Instant replay · {replay}</span>
              <button data-testid="replay-skip-btn" onClick={() => engRef.current?.endReplay()} className="btn-ghost rounded-full bg-[#0B0E14]/70 px-4 py-1 font-mono text-[11px] uppercase tracking-[0.2em]">Skip · Enter / any shot key</button>
            </div>
          )}
          {paused && !result && (
            <PauseModal onResume={togglePause} onRestart={() => setSeed((s) => s + 1)} onQuit={() => nav("/setup")}
              sound={sound} voice={voice} onSound={toggleSound} onVoice={toggleVoice} replays={replays} onReplays={toggleReplays} />
          )}
          {result && (
            <MatchEndModal result={result} names={names} saveState={saveState}
              onRematch={() => setSeed((s) => s + 1)} onLeaderboard={() => nav("/leaderboard")} onSetup={() => nav("/setup")} />
          )}
        </div>
      </section>
      <aside className="order-2 min-w-0 space-y-3 lg:order-3 lg:space-y-4">
        <ShotPad onShot={shot} />
        <DPad onKey={(k, d) => engRef.current?.setKey(k, d)} />
      </aside>
    </main>
  );
}
