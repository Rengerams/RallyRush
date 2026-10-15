import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pause, Camera, Film, MousePointer2 } from "lucide-react";
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
import { ServeIndicator } from "@/components/game/ServeIndicator";

const KEYMAP = { ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right", ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ShiftLeft: "sprint", ShiftRight: "sprint" };

export default function Play() {
  const nav = useNavigate();
  const [cfg] = useState(loadSetup);
  const wrapRef = useRef(null);
  const engRef = useRef(null);
  const matchIdRef = useRef(null);
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
  const [cameraMode, setCameraMode] = useState("court");
  const [intro, setIntro] = useState(true);
  const introRef = useRef(true);
  const [mouseEnabled, setMouseEnabled] = useState(true);
  const graphicsReady = useRef(false);

  const persistResult = useCallback((r) => {
    const matchId = matchIdRef.current || (matchIdRef.current =
      globalThis.crypto?.randomUUID?.() || `match_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    setSaveState("saving");
    saveMatch({
      match_id: matchId,
      player_name: cfg.name, won: r.won, difficulty: cfg.difficulty, ai_style: cfg.style, surface: cfg.surface,
      match_format: cfg.format, sets: r.sets, duration_sec: r.duration_sec, legend: !!cfg.legend,
      stats: r.stats, opponent_points: r.opponentStats.points_won, opponent_stats: r.opponentStats, rally_lengths: r.rally_lengths,
    }).then(() => {
      if (matchIdRef.current === matchId) setSaveState("saved");
    }).catch(() => {
      if (matchIdRef.current === matchId) setSaveState("error");
    });
  }, [cfg]);

  const onEvent = useCallback((e) => {
    if (e.type === "replay") setReplay(e.on ? e.label : null);
    if (e.type === "call") setCall({ ...e, id: Math.random() });
    if (e.type === "shot" && e.who === 0) setQuality({ q: e.quality, id: Math.random() });
    if (e.type === "matchEnd") {
      setResult(e.result);
      persistResult(e.result);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- state setters (setReplay, setCall, etc.) and module-level saveMatch are stable references
  }, [persistResult]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const eng = useMemo(() => new TennisEngine(cfg, onEvent), [cfg, onEvent, seed]);

  useEffect(() => { eng.cameraMode = cameraMode; }, [eng, cameraMode]);
  useEffect(() => { eng.mouseEnabled = mouseEnabled; if (!mouseEnabled) eng.clearPointer(); }, [eng, mouseEnabled]);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- refs (engRef, pausedRef, introRef) and globals (cancelAnimationFrame) are stable
  useEffect(() => {
    eng.replays = replaysRef.current;
    engRef.current = eng;
    matchIdRef.current = null;
    setReplay(null);
    setResult(null); setSaveState(null); setPaused(false); pausedRef.current = false;
    introRef.current = true; setIntro(true);
    let raf, last = performance.now();
    const loop = (t) => {
      const dt = (t - last) / 1000; last = t;
      if (!pausedRef.current && !introRef.current && graphicsReady.current) eng.update(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const iv = setInterval(() => setSnap(eng.snapshot()), 100);
    return () => { cancelAnimationFrame(raf); clearInterval(iv); };
  }, [eng]);

  useEffect(() => { const t = call && setTimeout(() => setCall(null), 1600); return () => clearTimeout(t); }, [call]);
  useEffect(() => { const t = quality && setTimeout(() => setQuality(null), 650); return () => clearTimeout(t); }, [quality]);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- pausedRef is a ref, setPaused is a stable setter
  const togglePause = useCallback(() => {
    pausedRef.current = !pausedRef.current;
    engRef.current?.clearInput();
    setPaused(pausedRef.current);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- engRef, pausedRef, introRef are refs; audio, KEYMAP, SHOT_BY_KEY are module constants
  useEffect(() => {
    const down = (e) => {
      const eng = engRef.current;
      if (!eng || !graphicsReady.current) return;
      const target = e.target;
      const isEditable = target instanceof HTMLElement &&
        (target.isContentEditable || target.matches("input, textarea, select, [role='textbox']"));
      if (isEditable) return;
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
      if (introRef.current) return;
      if (eng.state === "matchOver") return;
      if (e.code === "Escape" || e.code === "KeyP") {
        if (e.repeat) return;
        e.preventDefault();
        togglePause();
        return;
      }
      if (pausedRef.current || e.repeat) return;
      audio.unlock();
      if (KEYMAP[e.code]) eng.setKey(KEYMAP[e.code], true);
      if (e.code === "Space") eng.slide();
      if (e.code === "Enter" && eng.state === "replay") eng.endReplay();
      const digit = e.code.startsWith("Digit") ? e.code.slice(5) : e.code.startsWith("Numpad") ? e.code.slice(6) : null;
      if (digit && SHOT_BY_KEY[digit]) eng.holdShot(SHOT_BY_KEY[digit]);
    };
    const up = (e) => {
      if (KEYMAP[e.code]) engRef.current?.setKey(KEYMAP[e.code], false);
      const digit = e.code.replace(/^(Digit|Numpad)/, "");
      if (SHOT_BY_KEY[digit]) engRef.current?.releaseShot(SHOT_BY_KEY[digit]);
    };
    const blur = () => {
      const eng = engRef.current;
      if (!eng) return;
      eng.clearInput();
      if (!pausedRef.current && !introRef.current && eng.state !== "matchOver") togglePause();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, [togglePause]);


  // eslint-disable-next-line react-hooks/exhaustive-deps -- introRef is a ref, setIntro is a stable setter
  const endIntro = useCallback(() => { introRef.current = false; setIntro(false); }, []);
  const shot = (id) => {
    if (introRef.current || pausedRef.current || !graphicsReady.current) return;
    audio.unlock();
    engRef.current?.pressShot(id);
  };
  const hold = (id) => {
    if (introRef.current || pausedRef.current || !graphicsReady.current) return;
    audio.unlock();
    engRef.current?.holdShot(id);
  };
  const release = (id) => engRef.current?.releaseShot(id);
  const names = [cfg.name, `${DIFFICULTY[cfg.difficulty].label} AI`];
  const toggleSound = () => { audio.sound = !audio.sound; setSound(audio.sound); };
  const toggleReplays = () => { replaysRef.current = !replaysRef.current; if (engRef.current) engRef.current.replays = replaysRef.current; setReplays(replaysRef.current); };
  const onQuality = useCallback(() => toast("3D effects reduced for smoother play", { id: "3d-quality" }), []);
  const onAvailability = useCallback(ready => { graphicsReady.current = ready; }, []);
  const pointerMove = (point, aiming) => { if (!pausedRef.current && !introRef.current && graphicsReady.current) engRef.current?.setPointer(point, aiming); };
  const mouseSwing = () => {
    if (pausedRef.current || introRef.current || !graphicsReady.current) return;
    audio.unlock(); eng.holdShot(eng.selectedShot);
  };
  const toggleVoice = () => { audio.voice = !audio.voice; setVoice(audio.voice); };

  return (
    <main className="mx-auto grid max-w-[1840px] grid-cols-1 gap-4 px-3 py-3 sm:px-4 lg:grid-cols-[210px_minmax(0,1fr)_190px] lg:gap-4 lg:px-6 lg:py-4" data-testid="play-page">
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
              {snap.serveStage === "hold" ? "Ready to serve" : "Ball in the air"}{snap.faults ? " · 2nd serve" : ""}
            </p>
          )}
        </div>
      </aside>
      <section ref={wrapRef} className="relative order-1 min-w-0 lg:order-2" data-testid="game-canvas-wrapper">
        <div className="relative mx-auto w-fit max-w-full">
          <GameCanvas eng={eng} wrapRef={wrapRef} onSwing={mouseSwing} onRelease={() => eng.releaseShot(eng.p.heldShot)} onPointer={pointerMove} onPointerLeave={() => eng.clearPointer()} onQuality={onQuality} onAvailability={onAvailability} />
          <div className="flex flex-wrap items-center justify-between gap-2 py-2 lg:absolute lg:bottom-3 lg:right-3 lg:py-0">
            <MobileScore snap={snap} />
            {!intro && !paused && <ServeIndicator snap={snap} />}
          </div>
          <div className="absolute inset-x-2 top-2 flex flex-wrap justify-end gap-1.5 sm:inset-x-3 sm:top-3 sm:gap-2">
            <button data-testid="camera-toggle-btn" onClick={() => { eng.clearPointer(); setCameraMode(c => c === "court" ? "broadcast" : "court"); }} title="Change gameplay camera" className="btn-ghost flex items-center gap-1.5 rounded-full bg-[#0B0E14]/85 px-3 py-2 font-mono text-[10px]"><Camera size={14} /><span>{cameraMode === "court" ? "Court" : "Broadcast"}</span></button>
            <button data-testid="mouse-control-toggle" aria-pressed={mouseEnabled} onClick={() => setMouseEnabled(v => !v)} title="Mouse: move · hold right button: aim · left button: hit / prepare" aria-label="Mouse movement" className={`btn-ghost flex items-center gap-1.5 rounded-full bg-[#0B0E14]/85 px-3 py-2 font-mono text-[10px] ${mouseEnabled ? "text-[#DFFF00]" : "text-slate-400"}`}><MousePointer2 size={14} />Mouse {mouseEnabled ? "on" : "off"}</button>
            <button data-testid="replay-last-point-btn" disabled={!snap?.canReplay || paused || intro} onClick={() => engRef.current?.startReplay(true)} title="Replay last point" aria-label="Replay last point" className="btn-ghost rounded-full bg-[#0B0E14]/85 p-2 disabled:opacity-30"><Film size={14} /></button>
            <button data-testid="pause-btn" aria-label="Pause match" onClick={togglePause} className="rounded-full border border-white/15 bg-[#0B0E14]/70 p-2 backdrop-blur hover:border-[#DFFF00]">
              <Pause size={16} />
            </button>
          </div>
          <Callouts call={call} quality={quality} />
          {intro && <MatchIntro key={seed} cfg={cfg} names={names} onDone={endIntro} />}
          {replay && !paused && (
            <div data-testid="replay-banner" className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap items-center justify-between gap-2 border border-white/10 bg-[#0B0E14]/90 px-3 py-2">
              <span className="font-display text-base font-black uppercase italic text-[#00F0FF]">Replay · {replay}</span>
              <span data-testid="replay-speed" className="font-mono text-[10px] text-white">{snap?.replaySpeed ?? 0.65}×</span>
              <button data-testid="replay-skip-btn" onClick={() => engRef.current?.endReplay()} className="btn-ghost pointer-events-auto rounded-full px-3 py-1 font-mono text-[10px]">Skip</button>
              <div data-testid="replay-progress" role="progressbar" aria-valuenow={Math.round((snap?.replayProgress || 0) * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Replay progress" className="h-0.5 w-full bg-white/15"><div className="h-full bg-[#00F0FF]" style={{ width: `${(snap?.replayProgress || 0) * 100}%` }} /></div>
            </div>
          )}
          {paused && (!result || replay) && (
            <PauseModal onResume={togglePause} onRestart={() => setSeed((s) => s + 1)} onQuit={() => nav("/setup")}
              sound={sound} voice={voice} onSound={toggleSound} onVoice={toggleVoice} replays={replays} onReplays={toggleReplays} />
          )}
          {result && !replay && (
            <MatchEndModal result={result} names={names} saveState={saveState}
              canReplay={snap?.canReplay} onReplay={() => engRef.current?.startReplay(true)} onRetry={() => persistResult(result)}
              onRematch={() => setSeed((s) => s + 1)} onLeaderboard={() => nav("/leaderboard")} onSetup={() => nav("/setup")} />
          )}
        </div>
      </section>
      <aside className="order-2 min-w-0 space-y-3 lg:order-3 lg:space-y-4">
        <ShotPad onShot={shot} onHold={hold} onRelease={release} selectedShot={snap?.selectedShot} onSelect={id => { eng.selectedShot = id; }} />
        <DPad onKey={(k, d) => { if (!pausedRef.current && !introRef.current) engRef.current?.setKey(k, d); }} />
      </aside>
    </main>
  );
}
