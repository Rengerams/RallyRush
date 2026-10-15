function Row({ name, labels, games, history, serving, idx, legend }) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-3" data-testid={`scoreboard-row-${idx}`}>
      <span className={`h-2 w-2 rounded-full ${serving ? "bg-[#DFFF00] shadow-[0_0_10px_#DFFF00]" : "bg-transparent"}`} data-testid={`scoreboard-server-${idx}`} />
      <span data-testid={`scoreboard-name-${idx}`} className={`font-display min-w-0 flex-1 break-words text-base font-extrabold uppercase ${legend ? "gold-shimmer" : ""}`}>{name}</span>
      {history.map((h, i) => <span key={`set-${i}-${h[0]}-${h[1]}`} className="w-6 text-center font-mono text-sm text-slate-500">{h[idx]}</span>)}
      <span data-testid={`scoreboard-games-${idx}`} className="w-7 text-center font-mono text-lg font-extrabold">{games[idx]}</span>
      <span data-testid={`scoreboard-points-${idx}`} className="w-9 rounded bg-[#DFFF00] py-0.5 text-center font-mono text-lg font-extrabold text-[#0B0E14]">{labels[idx] || "\u00a0"}</span>
    </div>
  );
}

export default function Scoreboard({ snap, names, legend }) {
  if (!snap) return null;
  return (
    <div data-testid="scoreboard" className="overflow-hidden rounded-2xl border border-white/10 bg-[#121824]/90 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
        <span>Rally Rush</span>
        <span>{snap.tiebreak ? "Tie-break" : `Sets ${snap.sets[0]}-${snap.sets[1]}`}</span>
      </div>
      <Row idx={0} name={names[0]} legend={legend} labels={snap.labels} games={snap.games} history={snap.setHistory} serving={snap.server === 0} />
      <div className="h-px bg-white/[0.06]" />
      <Row idx={1} name={names[1]} labels={snap.labels} games={snap.games} history={snap.setHistory} serving={snap.server === 1} />
    </div>
  );
}
