import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { ThreeView } from "@/game/three/ThreeView";

export default function GameCanvas({ eng, wrapRef, renderActive = true, reducedEffects = false, onSwing, onRelease, onPointer, onPointerLeave, onQuality, onAvailability }) {
  const ref = useRef(null), viewRef = useRef(null);
  const [error, setError] = useState(null), [retry, setRetry] = useState(0);
  const [pageVisible, setPageVisible] = useState(() => typeof document === "undefined" || document.visibilityState !== "hidden");

  useEffect(() => {
    const updateVisibility = () => setPageVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    let view;
    setError(null);
    try { view = new ThreeView(canvas, eng); }
    catch { setError("3D graphics could not start on this browser."); onAvailability?.(false); return undefined; }
    viewRef.current = view;
    if (reducedEffects) view.reduceEffects();
    onAvailability?.(true);
    const fit = () => {
      const width = wrapRef.current.clientWidth || window.innerWidth;
      const height = wrapRef.current.clientHeight || window.innerHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      view.setSize(width, height);
    };
    fit();
    const resize = new ResizeObserver(fit);
    resize.observe(wrapRef.current);
    window.addEventListener("resize", fit);
    const contextLost = (event) => { event.preventDefault(); onAvailability?.(false); setError("The 3D connection was interrupted. Your match is preserved."); };
    canvas.addEventListener("webglcontextlost", contextLost);
    return () => {
      resize.disconnect(); window.removeEventListener("resize", fit);
      canvas.removeEventListener("webglcontextlost", contextLost); view.dispose(); viewRef.current = null; onAvailability?.(false);
    };
  }, [eng, wrapRef, onQuality, onAvailability, retry]);

  useEffect(() => {
    if (reducedEffects) viewRef.current?.reduceEffects();
    else viewRef.current?.restoreEffects();
  }, [reducedEffects]);

  useEffect(() => {
    if (!renderActive || !pageVisible || error || !viewRef.current) return undefined;
    let raf, frames = 0, checked = false;
    const start = performance.now();
    const loop = () => {
      const elapsed = performance.now() - start;
      if (!checked && elapsed > 1200) frames++;
      if (!checked && elapsed > 4200) {
        checked = true;
        if (frames / ((elapsed - 1200) / 1000) < 24) { viewRef.current?.reduceEffects(); onQuality?.("reduced"); }
      }
      viewRef.current?.render();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [renderActive, pageVisible, error, retry, onQuality]);

  const point = (event) => viewRef.current?.courtPoint(event.clientX, event.clientY);
  return <div className="play-canvas relative h-full w-full" data-testid="3d-game-surface">
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
      className="block touch-none" style={{ cursor: "crosshair" }} />
    {error && <div data-testid="webgl-error" role="alert" className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-[#121824] p-5 text-center">
      <p>{error}</p><button data-testid="webgl-retry-btn" onClick={() => setRetry(n => n + 1)} className="btn-volt flex items-center gap-2 rounded-full px-5 py-3"><RotateCcw size={16} />Retry 3D</button>
    </div>}
  </div>;
}
