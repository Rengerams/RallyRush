import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pause, Play as PlayIcon, Camera, Film, MousePointer2 } from "lucide-react";
import { TennisEngine } from "@/game/engine";
import { attachPlayKeyboardControls } from "@/game/playKeyboardControls";
import { audio } from "@/game/audio";
import { DIFFICULTY } from "@/game/constants";
import { loadSetup, saveMatch } from "@/lib/api";
import { loadMatchDisplayPreferences, saveMatchDisplayPreferences } from "@/lib/matchDisplayPreferences";
import { toast } from "sonner";
import MatchHud from "@/components/game/MatchHud";
import ShotPad from "@/components/game/ShotPad";
import DPad from "@/components/game/DPad";
import Callouts from "@/components/game/Callouts";
import PauseModal from "@/components/game/PauseModal";
import MatchEndModal from "@/components/game/MatchEndModal";
import MatchIntro from "@/components/game/MatchIntro";
import GameCanvas from "@/components/game/GameCanvas";

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
  const [displayPrefs, setDisplayPrefs] = useState(loadMatchDisplayPreferences);
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
  const [mouseEnabled, setMouseEnabled] = useState(false);
  const [touchControls, setTouchControls] = useState(() => typeof window !== "undefined" && (window.matchMedia?.("(pointer: coarse)").matches || (navigator.maxTouchPoints || 0) > 0));
  const [firstServeAttempted, setFirstServeAttempted] = useState(false);
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
    }).then((saved) => {
      if (matchIdRef.current === matchId) setSaveState(saved.storage === "local" ? "saved-local" : "saved");
    }).catch(() => {
      if (matchIdRef.current === matchId) {
        setSaveState("error");
        toast.error("Match could not be saved. Check available storage and try again.", { id: "match-save-error" });
      }
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

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const coarse = window.matchMedia("(pointer: coarse)");
    const update = () => setTouchControls(coarse.matches || (navigator.maxTouchPoints || 0) > 0);
    update();
    coarse.addEventListener?.("change", update);
    return () => coarse.removeEventListener?.("change", update);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- refs (engRef, pausedRef, introRef) and globals (cancelAnimationFrame) are stable
  useEffect(() => {
    eng.replays = replaysRef.current;
    engRef.current = eng;
    matchIdRef.current = null;
    setFirstServeAttempted(false);
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
  useEffect(() => {
    audio.setMusicActive(!intro && !paused && !replay && !result);
  }, [intro, paused, replay, result]);
  useEffect(() => () => audio.setMusicActive(false), []);
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = displayPrefs.reducedMotion ? "true" : "false";
    return () => { delete document.documentElement.dataset.reducedMotion; };
  }, [displayPrefs.reducedMotion]);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- pausedRef is a ref, setPaused is a stable setter
  const togglePause = useCallback(() => {
    pausedRef.current = !pausedRef.current;
    engRef.current?.clearInput();
    setPaused(pausedRef.current);
  }, []);
  const noteServeAttempt = useCallback(() => {
    const active = engRef.current;
    if (active?.state === "serve" && active.server === 0 && active.serveStage === "toss") {
      setFirstServeAttempted(true);
    }
  }, []);

  useEffect(() => {
    return attachPlayKeyboardControls({
      engineRef: engRef,
      graphicsReady,
      pausedRef,
      introRef,
      togglePause,
      noteServeAttempt,
    });
  }, [togglePause, noteServeAttempt]);


  // eslint-disable-next-line react-hooks/exhaustive-deps -- introRef is a ref, setIntro is a stable setter
  const endIntro = useCallback(() => { introRef.current = false; setIntro(false); }, []);
  const shot = (id) => {
    if (introRef.current || pausedRef.current || !graphicsReady.current) return;
    noteServeAttempt();
    audio.unlock();
    engRef.current?.pressShot(id);
  };
  const hold = (id) => {
    if (introRef.current || pausedRef.current || !graphicsReady.current) return;
    noteServeAttempt();
    audio.unlock();
    engRef.current?.holdShot(id);
  };
  const release = (id) => engRef.current?.releaseShot(id);
  const names = [cfg.name, `${DIFFICULTY[cfg.difficulty].label} AI`];
  const toggleSound = () => { audio.setSound(!audio.sound); setSound(audio.sound); };
  const toggleReplays = () => { replaysRef.current = !replaysRef.current; if (engRef.current) engRef.current.replays = replaysRef.current; setReplays(replaysRef.current); };
  const onQuality = useCallback(() => toast("3D effects reduced for smoother play", { id: "3d-quality" }), []);
  const onAvailability = useCallback(ready => { graphicsReady.current = ready; }, []);
  const pointerMove = (point, aiming) => { if (!pausedRef.current && !introRef.current && graphicsReady.current) engRef.current?.setPointer(point, aiming); };
  const mouseSwing = () => {
    if (pausedRef.current || introRef.current || !graphicsReady.current) return;
    noteServeAttempt();
    audio.unlock(); eng.holdShot(eng.selectedShot);
  };
  const toggleVoice = () => { audio.voice = !audio.voice; setVoice(audio.voice); };
  const updateDisplayPref = (key, value) => setDisplayPrefs(current => saveMatchDisplayPreferences({ ...current, [key]: value }));

  return (
    <main className="play-page fixed inset-0 z-30 h-[100dvh] w-screen overflow-hidden bg-[#0B0E14]" data-testid="play-page" data-hud-size={displayPrefs.hudSize}>
      <section ref={wrapRef} className="absolute inset-0" data-testid="game-canvas-wrapper">
        <GameCanvas eng={eng} reducedEffects={displayPrefs.reducedEffects} reducedMotion={displayPrefs.reducedMotion} wrapRef={wrapRef} renderActive={!intro && !paused && (!result || Boolean(replay))} onSwing={mouseSwing} onRelease={() => eng.releaseShot(eng.p.heldShot)} onPointer={pointerMove} onPointerLeave={() => eng.clearPointer()} onQuality={onQuality} onAvailability={onAvailability} />
        <MatchHud snap={snap} cfg={cfg} names={names} mouseEnabled={mouseEnabled} touchControls={touchControls}
          intro={intro} paused={paused} firstServeAttempted={firstServeAttempted} />

        <div className="absolute right-2 top-2 z-20 flex flex-wrap justify-end gap-1.5 sm:right-4 sm:top-4 sm:gap-2">
          <button data-testid="camera-toggle-btn" onClick={() => { eng.clearPointer(); setCameraMode(c => c === "court" ? "broadcast" : "court"); }} title="Change gameplay camera" className="btn-ghost flex items-center gap-1.5 rounded-full bg-[#0B0E14]/85 px-2.5 py-2 font-mono text-[10px]"><Camera size={14} /><span>{cameraMode === "court" ? "Court" : "Broadcast"}</span></button>
          <button data-testid="mouse-control-toggle" aria-pressed={mouseEnabled} onClick={() => setMouseEnabled(v => !v)} title="Mouse movement optional · hold right button to aim · hold left button to prepare a shot" aria-label="Mouse movement" className={`btn-ghost flex items-center gap-1.5 rounded-full bg-[#0B0E14]/85 px-2.5 py-2 font-mono text-[10px] ${mouseEnabled ? "text-[#DFFF00]" : "text-slate-400"}`}><MousePointer2 size={14} /><span className="hidden sm:inline">Mouse {mouseEnabled ? "on" : "off"}</span></button>
          <button data-testid="replay-last-point-btn" disabled={!snap?.canReplay || paused || intro} onClick={() => engRef.current?.startReplay(true)} title="Replay last point" aria-label="Replay last point" className="btn-ghost rounded-full bg-[#0B0E14]/85 p-2 disabled:opacity-30"><Film size={14} /></button>
          <button data-testid="pause-btn" aria-label="Pause match" onClick={togglePause} className="rounded-full border border-white/15 bg-[#0B0E14]/85 p-2 backdrop-blur hover:border-[#DFFF00]"><Pause size={16} /></button>
        </div>

        <Callouts call={call} quality={quality} />
        {intro && <MatchIntro key={seed} cfg={cfg} names={names} onDone={endIntro} />}
        {replay && !paused && (
          <div data-testid="replay-banner" className="pointer-events-none absolute inset-x-3 bottom-24 z-20 flex flex-wrap items-center justify-between gap-2 border border-white/10 bg-[#0B0E14]/90 px-3 py-2 sm:bottom-20">
            <span data-testid="replay-outcome" className="font-display text-base font-black uppercase italic text-[#00F0FF]">Replay · {replay}</span>
            <button data-testid="replay-pause-btn" aria-label={snap?.replayPaused ? "Resume replay" : "Pause replay"} onClick={() => { if (engRef.current) engRef.current.replayPaused = !engRef.current.replayPaused; }} className="btn-ghost pointer-events-auto rounded-full p-2">{snap?.replayPaused ? <PlayIcon size={14} /> : <Pause size={14} />}</button>
            <button data-testid="replay-speed-btn" aria-label={`Replay speed ${snap?.replaySpeed ?? 1} times; change speed`} onClick={() => { if (engRef.current) engRef.current.replaySpeed = ({ 0.5: 1, 1: 1.5, 1.5: 0.5 })[engRef.current.replaySpeed] ?? 1; }} className="btn-ghost pointer-events-auto rounded-full px-3 py-1 font-mono text-[10px]">{snap?.replaySpeed ?? 1}×</button>
            <button data-testid="replay-skip-btn" onClick={() => engRef.current?.endReplay()} className="btn-ghost pointer-events-auto rounded-full px-3 py-1 font-mono text-[10px]">Skip</button>
            <div data-testid="replay-progress" role="progressbar" aria-valuenow={Math.round((snap?.replayProgress || 0) * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Replay progress" className="h-0.5 w-full bg-white/15"><div className="h-full bg-[#00F0FF]" style={{ width: `${(snap?.replayProgress || 0) * 100}%` }} /></div>
          </div>
        )}
        {paused && (!result || replay) && (
          <PauseModal onResume={togglePause} onRestart={() => setSeed((s) => s + 1)} onQuit={() => nav("/setup")}
            sound={sound} voice={voice} onSound={toggleSound} onVoice={toggleVoice} replays={replays} onReplays={toggleReplays} displayPrefs={displayPrefs} onDisplayPrefChange={updateDisplayPref} />
        )}
        {result && !replay && (
          <MatchEndModal result={result} names={names} saveState={saveState}
            canReplay={snap?.canReplay} onReplay={() => engRef.current?.startReplay(true)} onRetry={() => persistResult(result)}
            onRematch={() => setSeed((s) => s + 1)} onLeaderboard={() => nav("/leaderboard")} onSetup={() => nav("/setup")} />
        )}
        <div className="play-controls absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-2 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-6 sm:gap-4 sm:px-4 sm:pb-4">
          <DPad onKey={(k, d) => { if (!pausedRef.current && !introRef.current) engRef.current?.setKey(k, d); }} />
          <ShotPad onShot={shot} onHold={hold} onRelease={release} selectedShot={snap?.selectedShot} onSelect={id => { eng.selectedShot = id; }} />
        </div>
      </section>
    </main>
  );
}
