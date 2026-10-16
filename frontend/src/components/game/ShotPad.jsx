import { useRef } from "react";
import { SHOT_LIST } from "@/game/constants";

export default function ShotPad({ onShot, onHold, onRelease, selectedShot = "flat", onSelect }) {
  const touchGesture = useRef(null);
  return (
    <div className="play-shotpad rounded-xl border border-white/10 bg-[#0B0E14]/80 p-2 backdrop-blur-md">
      <p className="sr-only">Shots</p>
      <div className="play-shot-buttons mt-1 flex gap-1.5" aria-label="Shot selection">
        {SHOT_LIST.map((s) => (
          <button key={s.id} type="button" data-testid={`shot-btn-${s.id}`}
            aria-label={`${s.label} shot, key ${s.key}. ${s.desc}`}
            aria-pressed={selectedShot === s.id} title={`${s.key} · ${s.label}: ${s.desc}`}
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              onSelect?.(s.id);
              if (e.pointerType === "touch") {
                const target = e.currentTarget;
                const gesture = { id: e.pointerId, x: e.clientX, y: e.clientY, target, holding: false, panning: false, timer: null };
                touchGesture.current = gesture;
                gesture.timer = setTimeout(() => {
                  if (touchGesture.current !== gesture || gesture.panning) return;
                  gesture.holding = true;
                  try { target.setPointerCapture(gesture.id); } catch {}
                  onHold?.(s.id);
                }, 140);
                return;
              }
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              onHold?.(s.id);
            }}
            onPointerMove={(e) => {
              const gesture = touchGesture.current;
              if (!gesture || gesture.id !== e.pointerId || gesture.holding) return;
              const dx = Math.abs(e.clientX - gesture.x), dy = Math.abs(e.clientY - gesture.y);
              if (dx > 8 && dx > dy) {
                gesture.panning = true;
                clearTimeout(gesture.timer);
              }
            }}
            onPointerUp={(e) => {
              const gesture = touchGesture.current;
              if (gesture?.id === e.pointerId) {
                clearTimeout(gesture.timer);
                touchGesture.current = null;
                if (gesture.panning) return;
                if (gesture.holding) onRelease?.(s.id);
                else onShot?.(s.id);
                return;
              }
              onRelease?.(s.id);
            }}
            onPointerCancel={(e) => {
              const gesture = touchGesture.current;
              if (gesture?.id === e.pointerId) {
                clearTimeout(gesture.timer);
                touchGesture.current = null;
                if (gesture.holding) onRelease?.(s.id);
                return;
              }
              onRelease?.(s.id);
            }}
            onLostPointerCapture={(e) => {
              const gesture = touchGesture.current;
              if (gesture?.id === e.pointerId) {
                clearTimeout(gesture.timer);
                touchGesture.current = null;
                if (gesture.holding) onRelease?.(s.id);
              } else onRelease?.(s.id);
            }}
            onClick={(e) => {
              // Pointer input already fired on press; keep keyboard/screen-reader clicks usable.
              if (e.detail === 0) { onSelect?.(s.id); onShot?.(s.id); }
            }}
            className={`play-shot-button touch-pan-x flex min-h-11 items-center gap-2 rounded-lg border px-2 py-2 text-left transition-[border-color,background-color] duration-150 hover:border-[#DFFF00]/60 hover:bg-[#DFFF00]/5 active:bg-[#DFFF00]/15 ${selectedShot === s.id ? "border-[#DFFF00]/60 bg-[#DFFF00]/10" : "border-white/10"}`}>
            <span className="key-cap">{s.key}</span>
            <span className="text-[13px] font-semibold leading-tight text-slate-100">{s.label}</span>
          </button>
        ))}
      </div>
      <p className="sr-only">Select a shot, then release the button near contact. Keyboard: hold 1 through 7 and release to swing.</p>
      <details data-testid="desktop-controls" className="mt-2 border-t border-white/10 pt-2">
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
