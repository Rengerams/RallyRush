import { SHOT_LIST } from "@/game/constants";

export default function ShotPad({ onShot, selectedShot = "flat", onSelect }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#121824] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">Shots</p>
      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-2 lg:gap-2">
        {SHOT_LIST.map((s) => (
          <button key={s.id} type="button" data-testid={`shot-btn-${s.id}`}
            aria-pressed={selectedShot === s.id} title={`${s.key} · ${s.label}: ${s.desc}`}
            onClick={() => { onSelect?.(s.id); onShot(s.id); }}
            className={`flex items-center gap-1.5 rounded-lg border px-1.5 py-2 text-left lg:gap-2 lg:px-2.5 transition-[border-color,background-color] duration-150 hover:border-[#DFFF00]/60 hover:bg-[#DFFF00]/5 active:bg-[#DFFF00]/15 ${selectedShot === s.id ? "border-[#DFFF00]/60 bg-[#DFFF00]/10" : "border-white/10"}`}>
            <span className="key-cap">{s.key}</span>
            <span className="text-xs font-medium lg:text-sm">{s.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 hidden space-y-1.5 font-mono text-[11px] text-slate-400 lg:block">
        <p><span className="key-cap">WASD</span> / arrows · move & aim</p>
        <p><span className="key-cap">Shift</span> sprint · <span className="key-cap">Space</span> slide</p>
        <p><span className="key-cap">Esc</span> pause</p>
      </div>
    </div>
  );
}
