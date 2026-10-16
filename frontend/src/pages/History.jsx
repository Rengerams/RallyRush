import { useEffect, useState } from "react";
import { fetchMatches } from "@/lib/api";
import { SURFACES, DIFFICULTY, STYLES, FORMATS } from "@/game/constants";
import { MatchStats } from "@/components/game/MatchStats";

export function MatchCard({ m, i = 0 }) {
  const surf = SURFACES[m.surface] || { label: "Unknown surface", color: "transparent" };
  const stats = m.stats && typeof m.stats === "object" && !Array.isArray(m.stats) ? m.stats : {};
  const difficulty = DIFFICULTY[m.difficulty]?.label || "Unknown";
  const style = STYLES[m.ai_style]?.label || "Unknown";
  const format = FORMATS[m.match_format]?.label || "Unknown";
  const storageKey = `renffr-breakdown-${m.id}`;
  const [expanded, setExpanded] = useState(() => {
    try { return localStorage.getItem(storageKey) === "open"; } catch { return false; }
  });
  const rememberExpanded = event => {
    const open = event.currentTarget.open;
    setExpanded(open);
    try { if (open) localStorage.setItem(storageKey, "open"); else localStorage.removeItem(storageKey); } catch { /* Storage may be disabled. */ }
  };
  return (
    <div data-testid={`history-match-${i}`} className="fade-up flex flex-wrap items-center gap-5 rounded-2xl border border-white/10 bg-[#121824] p-5" style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}>
      <span className={`font-display w-24 text-3xl font-black uppercase italic ${m.won ? "text-[#DFFF00]" : "text-[#E05A47]"}`}>{m.won ? "Win" : "Loss"}</span>
      <div className="min-w-[160px] flex-1">
        <p className="font-display text-2xl font-extrabold uppercase">{m.player_name}</p>
        <p className="font-mono text-xs text-slate-500">vs {difficulty} {style} · {format}</p>
      </div>
      <p className="font-mono text-xl font-bold">{(Array.isArray(m.sets) ? m.sets.filter((set) => Array.isArray(set) && set.length >= 2) : []).map((set) => `${set[0]}-${set[1]}`).join("  ")}</p>
      <span className="flex items-center gap-2 font-mono text-xs text-slate-400"><span className="h-3 w-3 rounded-full" style={{ background: surf.color }} />{surf.label}</span>
      <div className="flex gap-4 font-mono text-xs text-slate-400">
        <span>Aces <b className="text-white">{stats.aces ?? 0}</b></span>
        <span>Rally <b className="text-white">{stats.longest_rally ?? 0}</b></span>
        <span>Perfect <b className="text-white">{stats.perfect_shots ?? 0}</b></span>
      </div>
      <span className="font-mono text-[11px] text-slate-500">{new Date(m.created_at).toLocaleString()}</span>
      {m.opponent_stats && <details data-testid={`history-stats-${i}`} open={expanded} onToggle={rememberExpanded} className="w-full border-t border-white/10 pt-3">
        <summary data-testid={`history-stats-toggle-${i}`} className="cursor-pointer font-mono text-xs text-[#00F0FF]">Match breakdown</summary>
        <div className="mt-5 max-w-xl"><MatchStats stats={stats} opponentStats={m.opponent_stats} names={[m.player_name, `${DIFFICULTY[m.difficulty].label} AI`]} rallyLengths={m.rally_lengths} prefix={`history-${m.id}`} /></div>
      </details>}
    </div>
  );
}

export default function History() {
  const [player, setPlayer] = useState("");
  const [surface, setSurface] = useState("");
  const [rows, setRows] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchMatches({ player: player || undefined, surface: surface || undefined }).then(setRows).catch(() => setRows([]));
    }, 250);
    return () => clearTimeout(t);
  }, [player, surface]);

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-10 lg:px-10">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#00F0FF]">Archive</p>
      <h1 className="font-display mt-2 text-5xl font-black uppercase italic sm:text-6xl">Match history</h1>
      <div className="mt-8 flex flex-wrap gap-3">
        <input data-testid="history-player-filter" placeholder="Filter by player" value={player} onChange={(e) => setPlayer(e.target.value)}
          className="rounded-full border border-white/10 bg-[#121824] px-5 py-2.5 font-mono text-sm outline-none transition-colors focus:border-[#DFFF00]" />
        {[[ "", "All"], ...Object.values(SURFACES).map((s) => [s.id, s.label])].map(([id, label]) => (
          <button key={id || "all"} data-testid={`history-surface-${id || "all"}`} onClick={() => setSurface(id)}
            className={`rounded-full px-4 py-2 font-mono text-xs uppercase tracking-[0.15em] transition-colors ${surface === id ? "bg-[#DFFF00] text-[#0B0E14]" : "btn-ghost text-slate-300"}`}>{label}</button>
        ))}
      </div>
      <div className="mt-8 space-y-3">
        {rows === null && <p className="text-slate-500">Loading…</p>}
        {rows?.length === 0 && <p data-testid="history-empty" className="text-slate-500">No matches found.</p>}
        {rows?.map((m, i) => <MatchCard key={m.id} m={m} i={i} />)}
      </div>
    </main>
  );
}
