import { Trophy, Loader2, Check, AlertTriangle, RotateCcw, Film } from "lucide-react";
import { MatchStats } from "./MatchStats";

export default function MatchEndModal({ result, names, saveState, onRematch, onLeaderboard, onSetup, onReplay, canReplay, onRetry }) {
  const accuracy = result.stats.total_shots ? Math.round((result.stats.perfect_shots / result.stats.total_shots) * 100) : 0;
  return (
    <div data-testid="match-end-modal" role="dialog" aria-modal="true" aria-labelledby="match-result-title" className="fixed inset-0 z-50 overflow-y-auto bg-[#0B0E14]/85 p-3 backdrop-blur-md sm:p-6">
      <div className="fade-up mx-auto w-full max-w-[500px] rounded-2xl border border-white/10 bg-[#121824] p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3"><Trophy className={result.won ? "text-[#DFFF00]" : "text-slate-500"} size={24} /><p className="font-mono text-[10px] uppercase text-slate-400">Game, set & match</p></div>
          <span data-testid="match-end-duration" className="font-mono text-xs text-slate-400">{Math.floor(result.duration_sec / 60)}:{String(result.duration_sec % 60).padStart(2, "0")}</span>
        </div>
        <h2 id="match-result-title" data-testid="match-end-title" className={`font-display mt-2 text-5xl font-black uppercase italic ${result.won ? "text-[#DFFF00]" : "text-[#E05A47]"}`}>{result.won ? "Victory" : "Defeat"}</h2>
        <p data-testid="match-end-score" className="mt-1 break-words font-mono text-base">{names[0]} {result.sets.map((s) => `${s[0]}-${s[1]}`).join("  ")}</p>
        <div className="my-4 flex flex-wrap items-center justify-between gap-2 border-y border-white/10 py-3">
          <span data-testid="match-end-perfect-percentage" className="font-mono text-xs text-slate-300">{accuracy}% perfect timing</span>
          <button data-testid="match-end-replay-btn" disabled={!canReplay} onClick={onReplay} className="btn-ghost flex items-center gap-2 rounded-full px-3 py-2 text-xs disabled:opacity-40"><Film size={14} />Final point</button>
        </div>
        <MatchStats stats={result.stats} opponentStats={result.opponentStats} names={names} rallyLengths={result.rally_lengths} />
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <p data-testid="match-end-save-status" role="status" className="flex items-center gap-2 font-mono text-xs text-slate-400">
            {saveState === "saving" && <><Loader2 size={14} className="animate-spin" /> Saving match…</>}
            {saveState === "saved" && <><Check size={14} className="text-[#22C55E]" /> Match saved</>}
            {saveState === "error" && <><AlertTriangle size={14} className="text-[#E05A47]" /> Could not save match</>}
          </p>
          {saveState === "error" && <button data-testid="match-end-retry-save-btn" onClick={onRetry} className="btn-ghost flex items-center gap-1 rounded-full px-3 py-1 text-xs"><RotateCcw size={12} />Retry</button>}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <button data-testid="match-end-rematch-btn" onClick={onRematch} className="btn-volt rounded-full py-3 font-display text-lg font-extrabold uppercase">Rematch</button>
          <button data-testid="match-end-leaderboard-btn" onClick={onLeaderboard} className="btn-ghost rounded-full py-3 font-display text-lg font-bold uppercase">Ranks</button>
          <button data-testid="match-end-setup-btn" onClick={onSetup} className="btn-ghost rounded-full py-3 font-display text-lg font-bold uppercase">Setup</button>
        </div>
      </div>
    </div>
  );
}