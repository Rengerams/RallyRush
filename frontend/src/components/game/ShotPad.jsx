import { SHOT_LIST } from "@/game/constants";

export default function ShotPad({ onShot }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#121824] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">Shots</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {SHOT_LIST.map((s) => (
          <button key={s.id} type="button" data-testid={`shot-btn-${s.id}`}
            onPointerDown={(e) => { e.preventDefault(); onShot(s.id); }}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-2.5 py-2 text-left transition-[border-color,background-color] duration-150 hover:border-[#DFFF00]/60 hover:bg-[#DFFF00]/5 active:bg-[#DFFF00]/15">
            <span className="key-cap">{s.key}</span>
            <span className="text-sm font-medium">{s.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-1.5 font-mono text-[11px] text-slate-400">
        <p><span className="key-cap">WASD</span> / arrows · move & aim</p>
        <p><span className="key-cap">Shift</span> sprint · <span className="key-cap">Space</span> slide</p>
        <p><span className="key-cap">Esc</span> pause</p>
      </div>
    </div>
  );
}
