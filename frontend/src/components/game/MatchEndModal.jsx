import * as Dialog from "@radix-ui/react-dialog";
import { Trophy, Loader2, Check, AlertTriangle, RotateCcw, Film } from "lucide-react";
import { MatchStats } from "./MatchStats";

export function getMatchAccuracy(result) {
  const stats = result?.stats && typeof result.stats === "object" && !Array.isArray(result.stats) ? result.stats : {};
  const totalShots = Number(stats.total_shots);
  if (!Number.isFinite(totalShots) || totalShots <= 0) return 0;
  const perfectShots = Number(stats.perfect_shots) || 0;
  return Math.round((perfectShots / totalShots) * 100);
}

export function getCoachingNote(result) {
  const stats = result?.stats && typeof result.stats === "object" && !Array.isArray(result.stats) ? result.stats : {};
  const shots = Number(stats.total_shots) || 0;
  const perfect = Number(stats.perfect_shots) || 0;
  const errors = Number(stats.errors) || 0;
  const winners = Number(stats.winners) || 0;
  if (shots < 5) return "Play a few more rallies to get a useful timing and consistency tip.";
  if (perfect / shots < 0.35) return `Timing focus: ${perfect} of ${shots} shots had perfect timing. Try the Timing Practice drill before your next match.`;
  if (errors >= 3 && errors > winners) return `Consistency focus: you made ${errors} errors and hit ${winners} winners. Try using a higher-margin shot and aim away from the lines.`;
  return `Good contact: ${perfect} of ${shots} shots were perfectly timed, with ${errors} errors and ${winners} winners. Keep varying your placement.`;
}

export default function MatchEndModal({ result, names, saveState, onRematch, onLeaderboard, onSetup, onReplay, canReplay, onRetry }) {
  const stats = result.stats && typeof result.stats === "object" && !Array.isArray(result.stats) ? result.stats : {};
  const accuracy = getMatchAccuracy(result);
  return (
    <Dialog.Root open>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#0B0E14]/85 backdrop-blur-md" />
        <Dialog.Content data-testid="match-end-modal" aria-describedby="match-end-description" className="fixed inset-x-3 top-1/2 z-50 max-h-[calc(100dvh-1.5rem)] w-auto max-w-[500px] -translate-y-1/2 overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-[#121824] p-5 outline-none fade-up sm:left-1/2 sm:right-auto sm:w-full sm:-translate-x-1/2 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3"><Trophy className={result.won ? "text-[#DFFF00]" : "text-slate-400"} size={24} /><p className="font-mono text-[10px] uppercase text-slate-400">Game, set & match</p></div>
            <span data-testid="match-end-duration" className="font-mono text-xs text-slate-400">{Math.floor(result.duration_sec / 60)}:{String(result.duration_sec % 60).padStart(2, "0")}</span>
          </div>
          <Dialog.Title id="match-result-title" data-testid="match-end-title" className={`font-display mt-2 text-5xl font-black uppercase italic ${result.won ? "text-[#DFFF00]" : "text-[#E05A47]"}`}>{result.won ? "Victory" : "Defeat"}</Dialog.Title>
          <Dialog.Description id="match-end-description" className="sr-only">{result.won ? "You won the match." : "You lost the match."} Review your score and statistics, then choose what to do next.</Dialog.Description>
          <p data-testid="match-end-score" className="mt-1 break-words font-mono text-base">{names[0]} {result.sets.map((s) => `${s[0]}-${s[1]}`).join("  ")}</p>
          <div className="my-4 flex flex-wrap items-center justify-between gap-2 border-y border-white/10 py-3">
            <span data-testid="match-end-perfect-percentage" className="font-mono text-xs text-slate-300">{accuracy}% perfect timing</span>
            <button data-testid="match-end-replay-btn" disabled={!canReplay} onClick={onReplay} className="btn-ghost flex items-center gap-2 rounded-full px-3 py-2 text-xs disabled:opacity-40"><Film size={14} />Final point</button>
          </div>
          <MatchStats stats={stats} opponentStats={result.opponentStats} names={names} rallyLengths={result.rally_lengths} />
          <section data-testid="match-coaching-note" aria-label="Post-match coaching" className="mt-4 rounded-xl border border-[#00F0FF]/20 bg-[#00F0FF]/5 p-3">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#00F0FF]">Coach’s note</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-200">{getCoachingNote(result)}</p>
          </section>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <output data-testid="match-end-save-status" className="flex items-center gap-2 font-mono text-xs text-slate-400">
              {saveState === "saving" && <><Loader2 size={14} className="animate-spin" /> Saving match…</>}
              {saveState === "saved" && <><Check size={14} className="text-[#22C55E]" /> Match saved</>}
              {saveState === "saved-local" && <><Check size={14} className="text-[#22C55E]" /> Match saved on this device</>}
              {saveState === "error" && <><AlertTriangle size={14} className="text-[#E05A47]" /> Could not save match</>}
            </output>
            {saveState === "error" && <button data-testid="match-end-retry-save-btn" onClick={onRetry} className="btn-ghost flex items-center gap-1 rounded-full px-3 py-1 text-xs"><RotateCcw size={12} />Retry</button>}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-1.5 sm:gap-2">
            <button data-testid="match-end-rematch-btn" onClick={onRematch} className="btn-volt rounded-full py-3 font-display text-base font-extrabold uppercase sm:text-lg">Rematch</button>
            <button data-testid="match-end-leaderboard-btn" onClick={onLeaderboard} className="btn-ghost rounded-full py-3 font-display text-base font-bold uppercase sm:text-lg">Ranks</button>
            <button data-testid="match-end-setup-btn" onClick={onSetup} className="btn-ghost rounded-full py-3 font-display text-lg font-bold uppercase">Setup</button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
