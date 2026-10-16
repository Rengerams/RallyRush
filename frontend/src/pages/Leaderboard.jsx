import { useEffect, useState } from "react";
import { Crown, Medal } from "lucide-react";
import { fetchLeaderboard } from "@/lib/api";

function HallOfFame({ row }) {
  return (
    <div data-testid="leaderboard-hall-of-fame" className="relative overflow-hidden rounded-3xl border border-[#FFC828]/30 bg-[#FFC828]/[0.04] p-7 lg:p-10">
      <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-[#FFC828]/10 blur-3xl" />
      <div className="flex flex-wrap items-center gap-6">
        <Crown className="text-[#FFC828]" size={56} />
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#FFC828]/80">Local leader</p>
          <p className="font-display gold-shimmer text-6xl font-black uppercase italic lg:text-7xl">{row.player_name}</p>
        </div>
        <div className="ml-auto flex gap-8 font-mono text-sm">
          <div><p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Wins</p><p className="font-display text-4xl font-black">{row.wins}</p></div>
          <div><p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Rating</p><p className="font-display text-4xl font-black text-[#FFC828]">{row.rating}</p></div>
        </div>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const [rows, setRows] = useState(null);
  const [mode, setMode] = useState("competitive");
  useEffect(() => {
    setRows(null);
    fetchLeaderboard(mode).then(setRows).catch(() => setRows([]));
  }, [mode]);

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-10 lg:px-10">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#00F0FF]">Local rankings · this device</p>
      <h1 className="font-display mt-2 mb-8 text-5xl font-black uppercase italic sm:text-6xl">Leaderboard</h1>
      <div role="group" aria-label="Leaderboard mode" className="mb-6 flex flex-wrap gap-2">
        <button type="button" data-testid="leaderboard-competitive-tab" aria-pressed={mode === "competitive"} onClick={() => setMode("competitive")} className={`rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-wider transition ${mode === "competitive" ? "border-[#DFFF00]/60 bg-[#DFFF00]/10 text-[#DFFF00]" : "border-white/15 text-slate-400 hover:border-white/30"}`}>Competitive</button>
        <button type="button" data-testid="leaderboard-legend-tab" aria-pressed={mode === "legend"} onClick={() => setMode("legend")} className={`rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-wider transition ${mode === "legend" ? "border-[#FFC828]/60 bg-[#FFC828]/10 text-[#FFC828]" : "border-white/15 text-slate-400 hover:border-white/30"}`}>Legend</button>
      </div>
      {mode === "competitive" && rows?.length > 0 && <HallOfFame row={rows[0]} />}
      <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10">
        <table data-testid="leaderboard-table" className="w-full min-w-[720px] text-left">
          <thead className="bg-[#121824] font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">
            <tr>{["#", "Player", "Rating", "W-L", "Win %", "Best rally", "Aces", "Perfect"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows === null && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">Loading…</td></tr>}
            {rows?.length === 0 && <tr><td colSpan={8} data-testid="leaderboard-empty" className="px-4 py-10 text-center text-slate-400">No matches yet. Be the first champion.</td></tr>}
            {rows?.map((r, i) => (
              <tr key={r.player_name} data-testid={`leaderboard-row-${i}`} className="border-t border-white/[0.06] transition-colors hover:bg-white/[0.03]">
                <td className="px-4 py-3 font-display text-2xl font-black text-slate-400">{i < 3 ? <Medal size={20} className={["text-[#FFC828]", "text-slate-300", "text-[#E05A47]"][i]} /> : i + 1}</td>
                <td className="px-4 py-3 font-display text-xl font-extrabold uppercase">{r.player_name}{r.legend && <Crown size={14} className="ml-2 inline text-[#FFC828]" />}</td>
                <td className="px-4 py-3 font-mono font-bold text-[#DFFF00]">{r.rating}</td>
                <td className="px-4 py-3 font-mono">{r.wins}-{r.losses}</td>
                <td className="px-4 py-3 font-mono">{r.win_pct}%</td>
                <td className="px-4 py-3 font-mono">{r.best_rally}</td>
                <td className="px-4 py-3 font-mono">{r.aces}</td>
                <td className="px-4 py-3 font-mono">{r.perfect_shots}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
