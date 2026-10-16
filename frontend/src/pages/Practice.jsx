import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Pause, Play, RotateCcw } from "lucide-react";
import { TennisEngine } from "@/game/engine";
import { useGameLoop } from "@/game/useGameLoop";
import { useGameKeyboardControls } from "@/game/useGameKeyboardControls";
import { audio } from "@/game/audio";
import { FORMATS } from "@/game/constants";
import { createScore } from "@/game/scoring";
import { loadSetup } from "@/lib/api";
import { loadMatchDisplayPreferences } from "@/lib/matchDisplayPreferences";
import { createTimingDrillState, gradeServeOutcome, isServeLaunchEvent, isTargetHit, PRACTICE_ATTEMPT_COUNT, practiceServer, summarizeTimingAttempts, TIMING_GRADE_ORDER, transitionTimingDrill } from "@/lib/practiceTiming";
import GameCanvas from "@/components/game/GameCanvas";
import DPad from "@/components/game/DPad";
import ShotPad from "@/components/game/ShotPad";

const randomFromSeed = (initialSeed) => {
  let state = initialSeed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
};

const GRADE_LABELS = { perfect: "Perfect", good: "Good", early: "Early", late: "Late", miss: "Miss" };
const TARGET_LANES = ["left", "center", "right"];
const TARGET_X = { left: -3.1, center: 0, right: 3.1 };

export default function Practice() {
  const savedSetup = useMemo(loadSetup, []);
  const displayPrefs = useMemo(loadMatchDisplayPreferences, []);
  const cfg = useMemo(() => ({ ...savedSetup, difficulty: "easy", format: "quick" }), [savedSetup]);
  const engineRef = useRef(null);
  const wrapRef = useRef(null);
  const serveGradeRef = useRef(null);
  const graphicsReady = useRef(false);
  const pausedRef = useRef(true);
  const startedRef = useRef(false);
  const pendingRef = useRef(false);
  const drillRef = useRef(createTimingDrillState());
  const [drill, setDrill] = useState(drillRef.current);
  const [mode, setMode] = useState("return");
  const [targetLane, setTargetLane] = useState("center");
  const targetLaneRef = useRef(targetLane);
  targetLaneRef.current = targetLane;
  const [lastGrade, setLastGrade] = useState(null);
  const [lastTargetHit, setLastTargetHit] = useState(null);
  const [snap, setSnap] = useState(null);
  const [quality, setQuality] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = displayPrefs.reducedMotion ? "true" : "false";
    return () => { delete document.documentElement.dataset.reducedMotion; };
  }, [displayPrefs.reducedMotion]);

  const sendDrillEvent = useCallback((event) => {
    const next = transitionTimingDrill(drillRef.current, event);
    drillRef.current = next;
    startedRef.current = next.started;
    pausedRef.current = next.paused;
    pendingRef.current = next.pending;
    setDrill(next);
    return next;
  }, []);

  const resetPoint = useCallback((resetSession = false) => {
    if (resetSession) {
      sendDrillEvent({ type: "start" });
    } else {
      sendDrillEvent({ type: "next" });
    }
    const engine = engineRef.current;
    if (!engine) return;
    engine.clearInput();
    engine.score = createScore(FORMATS.quick);
    engine.score.gamesPlayed = practiceServer(mode);
    engine.stats = [
      { aces: 0, double_faults: 0, winners: 0, errors: 0, perfect_shots: 0, total_shots: 0, longest_rally: 0, points_won: 0 },
      { aces: 0, double_faults: 0, winners: 0, errors: 0, perfect_shots: 0, total_shots: 0, longest_rally: 0, points_won: 0 },
    ];
    engine.rallyLengths = [];
    engine.lastPointFrames = [];
    engine.replayFrames = [];
    engine.faults = 0;
    engine.p.stamina = engine.p.cap;
    engine.setupPoint();
    if (mode === "target") engine.pointerAim = { x: TARGET_X[targetLaneRef.current], z: -8 };
    serveGradeRef.current = null;
    setLastGrade(null);
    setLastTargetHit(null);
  }, [mode, sendDrillEvent]);

  const finishAttempt = useCallback((grade, targetHit) => {
    const previousLength = drillRef.current.attempts.length;
    const next = sendDrillEvent({ type: "grade", grade, targetHit });
    if (next.attempts.length > previousLength) {
      setLastGrade(next.attempts.at(-1));
      if (typeof targetHit === "boolean") setLastTargetHit(targetHit);
    }
  }, [sendDrillEvent]);

  const onEngineEvent = useCallback((event) => {
    if (mode === "serve") {
      if (isServeLaunchEvent(event)) serveGradeRef.current = event.quality;
      if (event.type === "shot" && event.who === 1 && serveGradeRef.current) {
        const grade = serveGradeRef.current;
        serveGradeRef.current = null;
        finishAttempt(gradeServeOutcome(grade));
      }
      if (event.type === "call" && event.winner === undefined && /fault/i.test(event.text)) {
        serveGradeRef.current = null;
        finishAttempt(gradeServeOutcome(null, true));
      }
      if (event.type === "call" && event.winner !== undefined) {
        const grade = gradeServeOutcome(serveGradeRef.current);
        serveGradeRef.current = null;
        finishAttempt(grade);
      }
      return;
    }
    if (mode === "target") {
      if (event.type === "shot" && event.who === 0) serveGradeRef.current = event.quality;
      if (event.type === "bounce" && event.who === 0 && serveGradeRef.current) {
        const grade = serveGradeRef.current;
        serveGradeRef.current = null;
        finishAttempt(grade, event.in && isTargetHit(event.x, targetLaneRef.current));
      }
      if (event.type === "call" && event.winner !== undefined) {
        const grade = serveGradeRef.current;
        serveGradeRef.current = null;
        if (event.winner === 0 && !grade) resetPoint();
        else finishAttempt(grade || "miss", false);
      }
      return;
    }
    if (event.type === "shot" && event.who === 0) finishAttempt(event.quality);
    if (event.type === "call" && event.winner !== undefined) {
      window.setTimeout(() => {
        if (pendingRef.current) return;
        if (event.winner === 1) finishAttempt("miss");
        else resetPoint();
      }, 0);
    }
  }, [finishAttempt, mode, resetPoint]);

  const engine = useMemo(() => {
    const next = new TennisEngine(cfg, onEngineEvent, { rng: randomFromSeed(0x51a7e), audio });
    next.score.gamesPlayed = practiceServer(mode);
    next.setupPoint();
    next.replays = false;
    return next;
  }, [cfg, mode, onEngineEvent]);

  useEffect(() => {
    engineRef.current = engine;
  }, [engine]);

  const canUpdate = useCallback(() => startedRef.current && !pausedRef.current && graphicsReady.current, []);
  useGameLoop(engine, canUpdate, setSnap);

  const togglePause = useCallback(() => {
    if (!startedRef.current || pendingRef.current) return;
    sendDrillEvent({ type: pausedRef.current ? "resume" : "pause" });
    engineRef.current?.clearInput();
  }, [sendDrillEvent]);

  const keyboardIntroRef = useMemo(() => ({ current: false }), []);
  const noteServeAttempt = useCallback(() => {}, []);
  useGameKeyboardControls({ engineRef, graphicsReady, pausedRef, introRef: keyboardIntroRef, togglePause, noteServeAttempt });

  const start = () => {
    audio.unlock();
    resetPoint(true);
  };
  const hold = (shot) => {
    if (!startedRef.current || pausedRef.current || pendingRef.current || !graphicsReady.current) return;
    audio.unlock();
    engineRef.current?.holdShot(shot);
  };
  const release = (shot) => engineRef.current?.releaseShot(shot);
  const press = (shot) => {
    if (!startedRef.current || pausedRef.current || pendingRef.current || !graphicsReady.current) return;
    audio.unlock();
    engineRef.current?.pressShot(shot);
  };
  const pointerMove = (point, aiming) => {
    if (startedRef.current && !pausedRef.current && !pendingRef.current && graphicsReady.current) engineRef.current?.setPointer(point, aiming);
  };
  const onAvailability = useCallback((ready) => { graphicsReady.current = ready; }, []);
  const onQuality = useCallback(() => setQuality(true), []);
  const mouseSwing = () => {
    if (!startedRef.current || pausedRef.current || pendingRef.current || !graphicsReady.current) return;
    audio.unlock();
    const active = engineRef.current;
    active?.holdShot(active.selectedShot);
  };

  const { started, paused, attempts } = drill;
  const count = attempts.length;
  const summary = count === PRACTICE_ATTEMPT_COUNT ? summarizeTimingAttempts(attempts) : null;
  const gradeTone = lastGrade === "perfect" ? "text-[#DFFF00]" : lastGrade === "good" ? "text-[#00F0FF]" : "text-white";
  const summaryTip = mode === "serve" && summary
    ? summary.counts.miss + summary.counts.late >= 5
      ? "Wait for the toss to rise near its peak before striking. Faults count as misses."
      : summary.counts.perfect + summary.counts.good >= 5
        ? "Your serve timing is consistent. Keep the toss smooth and strike near its peak."
        : "Try pressing a little closer to the top of the toss to improve your serve timing."
    : mode === "target" && summary
      ? drill.targetAttempts > 0 && drill.targetHits >= Math.ceil(drill.targetAttempts / 2)
        ? "You hit your chosen lane consistently. Try another shot type and target."
        : "Aim for the selected lane and keep the shot inside the court."
      : summary?.tip;
  const serveHint = !snap || snap.state !== "serve"
    ? "Serve complete. Review your timing, then continue."
    : snap.serveStage === "hold"
      ? "Press any shot once to toss; press again near the peak to serve."
      : `Toss in the air${snap.faults ? " · second serve" : ""} — press near the peak.`;

  const changeTargetLane = (lane) => {
    targetLaneRef.current = lane;
    setTargetLane(lane);
    if (mode === "target" && engineRef.current) engineRef.current.pointerAim = { x: TARGET_X[lane], z: -8 };
  };

  return (
    <main className="play-page fixed inset-0 z-30 h-[100dvh] w-screen overflow-hidden bg-[#0B0E14]" data-testid="practice-page" data-hud-size={displayPrefs.hudSize}>
      <section ref={wrapRef} className="absolute inset-0">
        <GameCanvas eng={engine} wrapRef={wrapRef} reducedEffects={displayPrefs.reducedEffects} reducedMotion={displayPrefs.reducedMotion} renderActive={started && !paused && !summary}
          onSwing={mouseSwing} onRelease={() => engineRef.current?.releaseShot(engineRef.current?.p.heldShot)}
          onPointer={pointerMove} onPointerLeave={() => engineRef.current?.clearPointer()}
          onAvailability={onAvailability} onQuality={onQuality} />

        <section aria-label="Timing drill status" className="absolute left-2 top-2 z-20 max-w-[min(22rem,calc(100vw-4.5rem))] rounded-xl border border-white/10 bg-[#0B0E14]/90 p-3 font-mono backdrop-blur sm:left-4 sm:top-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#00F0FF]">Practice · {mode === "serve" ? "Serve timing" : "Return timing"}</p>
          <p className="mt-1 text-sm font-bold text-white">{summary ? "Session complete" : `${mode === "serve" ? "Serve" : "Attempt"} ${Math.min(count + 1, PRACTICE_ATTEMPT_COUNT)} of ${PRACTICE_ATTEMPT_COUNT}`}</p>
          <p className="mt-1 text-[11px] leading-snug text-slate-300">{mode === "serve" ? serveHint : mode === "target" ? `An easy AI serves. Aim for the ${targetLane} lane using the target buttons, then return with any shot type.` : "An easy AI serves. Move to the ball, hold a shot, then release close to contact."}</p>
          <p data-testid="practice-progress" className="mt-2 text-xs text-slate-200">Perfect {attempts.filter((grade) => grade === "perfect").length} · Good {attempts.filter((grade) => grade === "good").length} · Early {attempts.filter((grade) => grade === "early").length} · Late {attempts.filter((grade) => grade === "late").length} · Miss {attempts.filter((grade) => grade === "miss").length}</p>
        </section>

        <div className="absolute right-2 top-2 z-20 flex gap-2 sm:right-4 sm:top-4">
          {started && !summary && !pendingRef.current && <button type="button" data-testid="practice-pause" aria-label={paused ? "Resume practice" : "Pause practice"} onClick={togglePause} className="btn-ghost rounded-full bg-[#0B0E14]/90 p-2">{paused ? <Play size={16} /> : <Pause size={16} />}</button>}
          <Link to="/setup" data-testid="practice-setup-link" className="btn-ghost flex items-center gap-1 rounded-full bg-[#0B0E14]/90 px-3 py-2 font-mono text-[10px] uppercase"><ArrowLeft size={14} /> Setup</Link>
        </div>

        {quality && <p className="pointer-events-none absolute left-1/2 top-1/3 z-20 -translate-x-1/2 rounded-lg bg-[#0B0E14]/85 px-3 py-2 font-mono text-xs text-white">3D effects reduced for smoother play</p>}

        {started && mode === "target" && !summary && !pendingRef.current && <div role="group" aria-label="Target lane" className="absolute bottom-[8.5rem] left-1/2 z-20 flex -translate-x-1/2 gap-1 rounded-full border border-white/10 bg-[#0B0E14]/90 p-1 backdrop-blur">
          {TARGET_LANES.map((lane) => <button key={lane} type="button" data-testid={`practice-target-${lane}`} aria-pressed={targetLane === lane} onClick={() => changeTargetLane(lane)} className={`rounded-full px-3 py-2 font-mono text-[10px] font-bold uppercase ${targetLane === lane ? "bg-[#DFFF00]/15 text-[#DFFF00]" : "text-slate-300"}`}>{lane}</button>)}
        </div>}

        {!started && <div className="absolute inset-0 z-30 grid place-items-center bg-[#05080d]/55 p-4">
          <section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121824] p-6 shadow-2xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#00F0FF]">Practice · 10 {mode === "serve" ? "serves" : mode === "target" ? "target shots" : "returns"}</p>
            <h1 className="font-display mt-2 text-4xl font-black uppercase italic text-white">{mode === "serve" ? "Find your serve" : mode === "target" ? "Hit your target" : "Find your timing"}</h1>
            <div className="mt-4 grid grid-cols-3 gap-1" role="group" aria-label="Practice drill">
              <button type="button" data-testid="practice-mode-return" aria-pressed={mode === "return"} onClick={() => setMode("return")} className={`rounded-full border px-2 py-2 font-mono text-[9px] font-bold uppercase ${mode === "return" ? "border-[#DFFF00] bg-[#DFFF00]/10 text-[#DFFF00]" : "border-white/15 text-slate-300"}`}>Return</button>
              <button type="button" data-testid="practice-mode-serve" aria-pressed={mode === "serve"} onClick={() => setMode("serve")} className={`rounded-full border px-2 py-2 font-mono text-[9px] font-bold uppercase ${mode === "serve" ? "border-[#DFFF00] bg-[#DFFF00]/10 text-[#DFFF00]" : "border-white/15 text-slate-300"}`}>Serve</button>
              <button type="button" data-testid="practice-mode-target" aria-pressed={mode === "target"} onClick={() => setMode("target")} className={`rounded-full border px-2 py-2 font-mono text-[9px] font-bold uppercase ${mode === "target" ? "border-[#DFFF00] bg-[#DFFF00]/10 text-[#DFFF00]" : "border-white/15 text-slate-300"}`}>Targets</button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-200">{mode === "serve" ? "Press any shot once to toss the ball, then press again near its peak. A fault counts as a miss and gives clear feedback before the next serve." : mode === "target" ? "Choose a left, center, or right target lane. Move to the incoming ball, select any existing shot, and try to land inside your chosen lane." : "The AI sends one ball at a time. Use movement controls to reach it, hold any shot to prepare, then release near contact. Your timing grade appears after each return."}</p>
            <p className="mt-2 font-mono text-[10px] text-slate-400">Practice scores never affect match records.</p>
            <button type="button" data-testid="practice-start" onClick={start} className="btn-volt mt-5 w-full rounded-full py-3 font-display text-lg font-bold uppercase">Start {mode === "serve" ? "serve" : mode === "target" ? "target" : "return"} drill</button>
          </section>
        </div>}

        {started && !summary && pendingRef.current && lastGrade && <div className="absolute inset-0 z-30 grid place-items-center bg-[#05080d]/55 p-4">
          <section className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#121824] p-6 text-center shadow-2xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#00F0FF]">Attempt {count} of {PRACTICE_ATTEMPT_COUNT}</p>
            <h2 data-testid="practice-last-grade" className={`font-display mt-2 text-5xl font-black uppercase italic ${gradeTone}`}>{GRADE_LABELS[lastGrade]}</h2>
          <p className="mt-2 text-sm text-slate-300">{mode === "serve" && lastGrade === "miss" ? "Fault. Wait for the toss, then strike closer to its peak on the next serve." : mode === "target" ? lastTargetHit ? "Target hit. Choose another lane or shot type and keep practicing." : "Missed the target. Aim for your chosen lane and keep the shot inside the court." : "Release the shot closer to the ball to improve your timing grade."}</p>
            <button type="button" data-testid="practice-next" onClick={() => resetPoint()} className="btn-volt mt-5 w-full rounded-full py-3 font-display text-lg font-bold uppercase">Next {mode === "serve" ? "serve" : mode === "target" ? "shot" : "return"}</button>
          </section>
        </div>}

        {summary && <div className="absolute inset-0 z-40 grid place-items-center overflow-y-auto bg-[#05080d]/80 p-4">
          <section data-testid="practice-summary" className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121824] p-6 shadow-2xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#00F0FF]">{mode === "serve" ? "Serve" : mode === "target" ? "Target" : "Return"} timing summary</p>
            <h2 className="font-display mt-2 text-4xl font-black uppercase italic text-white">10 {mode === "serve" ? "serves" : mode === "target" ? "shots" : "returns"}</h2>
            <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {TIMING_GRADE_ORDER.map((grade) => <div key={grade} className="rounded-lg border border-white/10 bg-black/20 p-2 text-center">
                <dt className="font-mono text-[9px] uppercase text-slate-300">{GRADE_LABELS[grade]}</dt>
                <dd data-testid={`practice-count-${grade}`} className="mt-1 text-xl font-bold text-white">{summary.counts[grade]}</dd>
              </div>)}
            </dl>
            {mode === "target" && <p data-testid="practice-target-hits" className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3 text-center font-mono text-sm text-slate-100">Target hits: {drill.targetHits} / {drill.targetAttempts}</p>}
            <p data-testid="practice-tip" className="mt-4 rounded-xl border border-[#DFFF00]/20 bg-[#DFFF00]/5 p-3 text-sm leading-relaxed text-slate-100">{summaryTip}</p>
            <div className="mt-5 flex gap-2">
              <button type="button" data-testid="practice-retry" onClick={start} className="btn-volt flex flex-1 items-center justify-center gap-2 rounded-full py-3 font-bold uppercase"><RotateCcw size={15} /> Try again</button>
              <Link to="/setup" className="btn-ghost flex flex-1 items-center justify-center rounded-full py-3 font-bold uppercase">Setup</Link>
            </div>
          </section>
        </div>}

        {started && !summary && <div className="play-controls absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-2 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-6 sm:gap-4 sm:px-4 sm:pb-4">
          <DPad onKey={(key, down) => { if (!pausedRef.current && !pendingRef.current) engineRef.current?.setKey(key, down); }} />
          <ShotPad onShot={press} onHold={hold} onRelease={release} onCancel={id => engineRef.current?.cancelShot(id)} selectedShot={snap?.selectedShot} onSelect={(id) => { engine.selectedShot = id; }} prepareDelayMs={displayPrefs.shotHoldMs} />
        </div>}
      </section>
    </main>
  );
}
