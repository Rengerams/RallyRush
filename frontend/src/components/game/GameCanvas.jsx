import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { ThreeView } from "@/game/three/ThreeView";

export default function GameCanvas({ eng, wrapRef, onSwing, onRelease, onPointer, onPointerLeave, onQuality, onAvailability }) {
  const ref = useRef(null), viewRef = useRef(null);
  const [error, setError] = useState(null), [retry, setRetry] = useState(0);

  useEffect(() => {
    const canvas = ref.current;
    let view, raf, frames = 0, checked = false;
    setError(null);
    try { view = new ThreeView(canvas, eng); }
    catch { setError("3D graphics could not start on this browser."); onAvailability?.(false); return undefined; }
    viewRef.current = view;
    onAvailability?.(true);
    const fit = () => {
      const width = wrapRef.current.clientWidth;
      const mobile = window.innerWidth < 1024;
      const maxH = Math.max(300, window.innerHeight - (mobile ? 230 : 145));
      const height = Math.min(maxH, width * (mobile ? 0.95 : 0.68));
      canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
      view.setSize(width, height);
    };
    fit();
    const resize = new ResizeObserver(fit);
    resize.observe(wrapRef.current);
    window.addEventListener("resize", fit);
    const contextLost = (event) => { event.preventDefault(); cancelAnimationFrame(raf); onAvailability?.(false); setError("The 3D connection was interrupted. Your match is preserved."); };
    canvas.addEventListener("webglcontextlost", contextLost);
    const start = performance.now();
    const loop = () => {
      const elapsed = performance.now() - start;
      if (!checked && elapsed > 1200) frames++;
      if (!checked && elapsed > 4200) {
        checked = true;
        if (frames / ((elapsed - 1200) / 1000) < 24) { view.reduceEffects(); onQuality?.("reduced"); }
      }
      view.render();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf); resize.disconnect(); window.removeEventListener("resize", fit);
      canvas.removeEventListener("webglcontextlost", contextLost); view.dispose(); viewRef.current = null; onAvailability?.(false);
    };
  }, [eng, wrapRef, onQuality, onAvailability, retry]);

  const point = (event) => viewRef.current?.courtPoint(event.clientX, event.clientY);
  return <div className="relative" data-testid="3d-game-surface">
    <canvas key={retry} ref={ref} data-testid="game-canvas" data-view-mode="3d" aria-label="3D tennis court"
      onPointerMove={e => { if (e.pointerType === "mouse") onPointer?.(point(e), !!(e.buttons & 2)); }}
      onPointerLeave={() => { onPointerLeave?.(); onRelease?.(); }}
      onContextMenu={e => e.preventDefault()}
      onPointerDown={e => {
        e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
        if (e.button === 2) onPointer?.(point(e), true);
        if (e.button === 0) onSwing?.();
      }}
      onPointerUp={e => { if (e.button === 0) onRelease?.(); if (e.button === 2) onPointerLeave?.(); }}
      onPointerCancel={() => { onPointerLeave?.(); onRelease?.(); }}
      onLostPointerCapture={() => onRelease?.()}
      className="block touch-none rounded-xl border border-white/10" style={{ cursor: "crosshair" }} />
    {error && <div data-testid="webgl-error" role="alert" className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-[#121824] p-5 text-center">
      <p>{error}</p><button data-testid="webgl-retry-btn" onClick={() => setRetry(n => n + 1)} className="btn-volt flex items-center gap-2 rounded-full px-5 py-3"><RotateCcw size={16} />Retry 3D</button>
    </div>}
  </div>;
}