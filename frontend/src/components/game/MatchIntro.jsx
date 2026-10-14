import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown } from "lucide-react";
import { audio } from "@/game/audio";
import { SURFACES, DIFFICULTY, STYLES, FORMATS } from "@/game/constants";

const STEPS = [0, 1900, 3900, 5900];

function Card({ name, sub, color, from, legend, testId }) {
  return (
    <motion.div data-testid={testId} initial={{ x: from * 220, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 120, damping: 16 }}
      className="w-full rounded-2xl border bg-[#121824]/90 p-4 text-center backdrop-blur-xl" style={{ borderColor: color }}>
      {legend && <Crown className="mx-auto text-[#FFC828]" size={20} />}
      <p className={`font-display truncate text-3xl font-black uppercase italic ${legend ? "gold-shimmer" : ""}`} style={legend ? undefined : { color }}>{name}</p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">{sub}</p>
    </motion.div>
  );
}

export default function MatchIntro({ cfg, names, onDone }) {
  const [step, setStep] = useState(0);
  const surf = SURFACES[cfg.surface];

  useEffect(() => {
    audio.unlock();
    audio.fanfare();
    audio.say("Ladies and gentlemen, welcome to the Renffr Open!");
    const timers = [
      setTimeout(() => { setStep(1); audio.sting(); audio.say(`${cfg.name}, versus the ${DIFFICULTY[cfg.difficulty].label} ${STYLES[cfg.style].label} A I`); }, STEPS[1]),
      setTimeout(() => { setStep(2); audio.sting(); audio.say("Quiet please. Play!"); }, STEPS[2]),
      setTimeout(onDone, STEPS[3]),
    ];
    const key = (e) => { if (["Enter", "Escape", "Space"].includes(e.code)) { window.speechSynthesis?.cancel(); onDone(); } };
    window.addEventListener("keydown", key);
    return () => { timers.forEach(clearTimeout); window.removeEventListener("keydown", key); };
  }, [cfg, onDone]);

  return (
    <div data-testid="match-intro" className="absolute inset-0 z-30 flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#0B0E14]/90 p-5">
      <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.5, 0.15] }} transition={{ duration: 1.6 }}
        style={{ background: "radial-gradient(circle at 50% 30%, rgba(223,255,0,0.25), transparent 60%)" }} />
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="welcome" className="relative text-center" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -30 }}>
            <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-[#00F0FF]">Ladies & gentlemen</p>
            <p className="font-display mt-2 text-2xl font-bold uppercase text-slate-300">welcome to the</p>
            <motion.p initial={{ letterSpacing: "0.4em" }} animate={{ letterSpacing: "-0.01em" }} transition={{ duration: 1.2, ease: "easeOut" }}
              className="font-display text-6xl font-black uppercase italic leading-none text-[#DFFF00] sm:text-7xl">Renffr<br />Open</motion.p>
          </motion.div>
        )}
        {step === 1 && (
          <motion.div key="vs" className="relative flex w-full max-w-[300px] flex-col items-center gap-3" exit={{ opacity: 0, scale: 0.9 }}>
            <Card testId="intro-player-card" name={names[0]} legend={cfg.legend} color="#00F0FF" from={-1} sub={`PWR ${cfg.power} · STA ${cfg.stamina} · ACC ${cfg.accuracy}`} />
            <motion.p initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.35 }} className="font-display text-5xl font-black italic text-white">VS</motion.p>
            <Card testId="intro-ai-card" name={names[1]} color="#E05A47" from={1} sub={`${STYLES[cfg.style].label} · ${Math.round(DIFFICULTY[cfg.difficulty].error * 100)}% error`} />
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="play" className="relative text-center" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-400">{surf.label} · {FORMATS[cfg.format].desc}</p>
            <motion.p initial={{ scale: 0.6 }} animate={{ scale: [0.6, 1.15, 1] }} transition={{ duration: 0.6 }} className="font-display mt-3 text-7xl font-black uppercase italic text-white">Play!</motion.p>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#DFFF00]">Quiet please</p>
          </motion.div>
        )}
      </AnimatePresence>
      <button data-testid="intro-skip-btn" onClick={() => { window.speechSynthesis?.cancel(); onDone(); }}
        className="btn-ghost absolute bottom-5 rounded-full bg-[#0B0E14]/70 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em]">Skip intro</button>
    </div>
  );
}
