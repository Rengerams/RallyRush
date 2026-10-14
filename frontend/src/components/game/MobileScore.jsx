export default function MobileScore({ snap }) {
  if (!snap) return null;
  const cell = (i, label) => (
    <span className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${snap.server === i ? "bg-[#DFFF00]" : "bg-white/20"}`} />
      {label}
      <b className="text-white">{snap.games[i]}</b>
      <b className="rounded bg-[#DFFF00] px-1 text-[#0B0E14]">{snap.labels[i] || "–"}</b>
    </span>
  );
  return (
    <div data-testid="mobile-score" className="absolute left-3 top-3 flex gap-3 rounded-full border border-white/10 bg-[#0B0E14]/75 px-3 py-1.5 font-mono text-[11px] text-slate-300 backdrop-blur lg:hidden">
      {cell(0, "YOU")}
      {cell(1, "AI")}
    </div>
  );
}
