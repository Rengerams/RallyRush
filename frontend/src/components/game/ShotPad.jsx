import { SHOT_LIST } from "@/game/constants";

export default function ShotPad({ onShot, onHold, onRelease, selectedShot = "flat", onSelect }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#121824] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">Shots</p>
      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-2 lg:gap-2">
        {SHOT_LIST.map((s) => (
          <button key={s.id} type="button" data-testid={`shot-btn-${s.id}`}
            aria-pressed={selectedShot === s.id} title={`${s.key} · ${s.label}: ${s.desc}`}
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              onSelect?.(s.id);
              onHold?.(s.id);
            }}
            onPointerUp={() => onRelease?.(s.id)}
            onPointerCancel={() => onRelease?.(s.id)}
            onLostPointerCapture={() => onRelease?.(s.id)}
            onClick={(e) => {
              // Pointer input already fired on press; keep keyboard/screen-reader clicks usable.
              if (e.detail === 0) { onSelect?.(s.id); onShot?.(s.id); }
            }}
            className={`touch-none flex min-h-11 items-center gap-2 rounded-lg border px-2 py-2 text-left transition-[border-color,background-color] duration-150 hover:border-[#DFFF00]/60 hover:bg-[#DFFF00]/5 active:bg-[#DFFF00]/15 ${selectedShot === s.id ? "border-[#DFFF00]/60 bg-[#DFFF00]/10" : "border-white/10"}`}>
            <span className="key-cap">{s.key}</span>
            <span className="text-[13px] font-semibold leading-tight text-slate-100">{s.label}</span>
          </button>
        ))}
      </div>
      <p className="mt-3 hidden font-mono text-[11px] leading-relaxed text-slate-300 lg:block">WASD move · 1–7 hit · Shift sprint</p>
      <details data-testid="desktop-controls" className="mt-2 hidden border-t border-white/10 pt-2 lg:block">
        <summary className="cursor-pointer font-mono text-xs font-semibold text-[#00F0FF] outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]">Controls</summary>
        <div aria-label="Desktop controls" className="mt-2 space-y-2 font-mono text-[11px] leading-relaxed text-slate-300">
          <p><span className="key-cap">WASD</span> / arrows · move</p>
          <p><span className="key-cap">1–7</span> hold to prepare · release near contact to swing</p>
          <p>Mouse: move to run when enabled · hold right button to aim · release left button near contact</p>
          <p><span className="key-cap">Shift</span> sprint · <span className="key-cap">Space</span> slide</p>
          <p><span className="key-cap">Esc</span> / <span className="key-cap">P</span> pause · <span className="key-cap">Enter</span> skip replay</p>
        </div>
      </details>
    </div>
  );
}
