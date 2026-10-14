import { Trophy, Loader2, Check, AlertTriangle } from "lucide-react";

const STAT_ROWS = [
  ["aces", "Aces"], ["winners", "Winners"], ["errors", "Errors"], ["double_faults", "Double faults"],
  ["perfect_shots", "Perfect shots"], ["longest_rally", "Longest rally"], ["points_won", "Points won"],
];

export default function MatchEndModal({ result, names, saveState, onRematch, onLeaderboard, onSetup }) {
  const accuracy = result.stats.total_shots ? Math.round((result.stats.perfect_shots / result.stats.total_shots) * 100) : 0;
  return (
    <div data-testid="match-end-modal" className="absolute inset-0 z-30 flex items-center justify-center bg-[#0B0E14]/75 p-4 backdrop-blur-md">
      <div className="fade-up w-full max-w-[440px] rounded-2xl border border-white/10 bg-[#121824] p-6">
        <div className="flex items-center gap-3">
          <Trophy className={result.won ? "text-[#DFFF00]" : "text-slate-500"} size={30} />
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-400">Game, set & match</p>
        </div>
        <h2 data-testid="match-end-title" className={`font-display mt-2 text-6xl font-black uppercase italic ${result.won ? "text-[#DFFF00]" : "text-[#E05A47]"}`}>
          {result.won ? "Victory" : "Defeat"}
        </h2>
        <p data-testid="match-end-score" className="mt-1 font-mono text-lg">
          {names[0]} {result.sets.map((s) => `${s[0]}-${s[1]}`).join("  ")}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/[0.06]">
          {STAT_ROWS.map(([k, l]) => (
            <div key={k} className="bg-[#121824] px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">{l}</p>
              <p data-testid={`match-end-stat-${k}`} className="font-display text-2xl font-extrabold">{result.stats[k]}</p>
            </div>
          ))}
          <div className="bg-[#121824] px-3 py-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Perfect %</p>
            <p className="font-display text-2xl font-extrabold">{accuracy}%</p>
          </div>
        </div>
        <p data-testid="match-end-save-status" className="mt-4 flex items-center gap-2 font-mono text-xs text-slate-400">
          {saveState === "saving" && <><Loader2 size={14} className="animate-spin" /> Saving to leaderboard…</>}
          {saveState === "saved" && <><Check size={14} className="text-[#22C55E]" /> Saved to leaderboard</>}
          {saveState === "error" && <><AlertTriangle size={14} className="text-[#E05A47]" /> Could not save match</>}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <button data-testid="match-end-rematch-btn" onClick={onRematch} className="btn-volt rounded-full py-3 font-display text-lg font-extrabold uppercase">Rematch</button>
          <button data-testid="match-end-leaderboard-btn" onClick={onLeaderboard} className="btn-ghost rounded-full py-3 font-display text-lg font-bold uppercase">Ranks</button>
          <button data-testid="match-end-setup-btn" onClick={onSetup} className="btn-ghost rounded-full py-3 font-display text-lg font-bold uppercase">Setup</button>
        </div>
      </div>
    </div>
  );
}
