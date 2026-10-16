function Row({ name, labels, games, history, serving, idx, legend, compact }) {
  return (
    <div className={`scoreboard-row flex min-w-0 items-center gap-1.5 ${compact ? "px-2 py-1" : "px-3 py-2"}`} data-testid={`scoreboard-row-${idx}`} role="group" aria-label={`${name}${serving ? ", serving" : ""}`}>
      <span aria-label={serving ? "Serving" : undefined} className={`h-1.5 w-1.5 shrink-0 rounded-full ${serving ? "bg-[#DFFF00] shadow-[0_0_10px_#DFFF00]" : "bg-transparent"}`} data-testid={`scoreboard-server-${idx}`} />
      {serving && <span className="shrink-0 rounded bg-[#DFFF00]/15 px-1 font-mono text-[8px] font-bold text-[#DFFF00]" aria-hidden="true">SERVE</span>}
      <span data-testid={`scoreboard-name-${idx}`} className={`font-display min-w-0 flex-1 truncate text-sm font-extrabold uppercase ${legend ? "gold-shimmer" : ""}`}>{name}</span>
      {history.map((h, i) => <span key={`set-${i}-${h[0]}-${h[1]}`} aria-label={`Set ${i + 1}: ${h[0]}-${h[1]}`} className="w-5 shrink-0 text-center font-mono text-[10px] text-slate-500">{h[idx]}</span>)}
      <span data-testid={`scoreboard-games-${idx}`} aria-label={`Games: ${games[idx]}`} className="w-6 shrink-0 text-center font-mono text-sm font-bold">{games[idx]}</span>
      <span data-testid={`scoreboard-points-${idx}`} aria-label={`Points: ${labels[idx] || "0"}`} className="w-8 shrink-0 rounded bg-[#DFFF00] py-0.5 text-center font-mono text-sm font-extrabold text-[#0B0E14]">{labels[idx] || "0"}</span>
    </div>
  );
}

export default function Scoreboard({ snap, names, legend, compact = false }) {
  if (!snap) return null;
  return (
    <div data-testid="scoreboard" data-compact={compact} role="group" aria-label="Match score" className={`scoreboard-card overflow-hidden rounded-xl border border-white/15 bg-[#0B0E14]/85 shadow-lg backdrop-blur-md ${compact ? "scoreboard-card--compact" : ""}`}>
      <div className={`flex items-center justify-between border-b border-white/10 font-mono uppercase tracking-wider text-slate-300 ${compact ? "px-2 py-1 text-[9px]" : "px-3 py-1.5 text-[10px]"}`}>
        <span>Sets {snap.sets[0]}–{snap.sets[1]}</span>
        {snap.tiebreak && <span className="text-[#DFFF00]">Tie-break</span>}
        <span className="text-slate-300">Games · Points</span>
      </div>
      <Row idx={0} name={names[0]} legend={legend} labels={snap.labels} games={snap.games} history={snap.setHistory} serving={snap.server === 0} compact={compact} />
      <div className="mx-2 h-px bg-white/10" />
      <Row idx={1} name={names[1]} labels={snap.labels} games={snap.games} history={snap.setHistory} serving={snap.server === 1} compact={compact} />
    </div>
  );
}
