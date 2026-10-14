import { Crown } from "lucide-react";

export default function LegendCard({ active, onToggle }) {
  return (
    <button type="button" data-testid="setup-legend-renffr-toggle" onClick={onToggle}
      className={`relative w-full overflow-hidden rounded-2xl border p-5 text-left transition-[border-color,box-shadow] duration-200 ${active ? "border-[#FFC828] shadow-[0_0_40px_-10px_#FFC828]" : "border-[#FFC828]/25 hover:border-[#FFC828]/60"}`}>
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[#FFC828]/10 blur-2xl" />
      <div className="flex items-center gap-3">
        <Crown className="text-[#FFC828]" size={22} />
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#FFC828]/80">Legend preset</span>
        <span className={`ml-auto rounded-full px-2 py-0.5 font-mono text-[10px] uppercase ${active ? "bg-[#FFC828] text-[#0B0E14]" : "bg-white/5 text-slate-400"}`}>{active ? "Equipped" : "Tap to equip"}</span>
      </div>
      <p className="font-display gold-shimmer mt-3 text-4xl font-black uppercase italic">renffr</p>
      <p className="mt-1 text-sm text-slate-400">Power 10 · Stamina 10 · Accuracy 10 · golden aura on court</p>
    </button>
  );
}
