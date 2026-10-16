export default function StaminaBar({ value, sprint }) {
  const pct = Math.round(value * 100);
  const color = value > 0.6 ? "#22C55E" : value > 0.3 ? "#EAB308" : "#E05A47";
  return (
    <div className="rounded-2xl border border-white/10 bg-[#121824] p-4">
      <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-slate-400">
        <span>Stamina {sprint && <span className="text-[#DFFF00]">· sprint</span>}</span>
        <span data-testid="stamina-value">{pct}%</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/5">
        <div data-testid="stamina-bar" className="h-full rounded-full transition-[width,background-color] duration-150" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
