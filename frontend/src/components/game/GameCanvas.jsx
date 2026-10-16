import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

export default function GameCanvas({ eng, wrapRef, renderActive = true, reducedEffects = false, reducedMotion = false, onSwing, onRelease, onPointer, onPointerLeave, onQuality, onAvailability }) {
  const ref = useRef(null), viewRef = useRef(null);
  const [error, setError] = useState(null), [retry, setRetry] = useState(0), [viewGeneration, setViewGeneration] = useState(0), [loading, setLoading] = useState(true);
  const [pageVisible, setPageVisible] = useState(() => typeof document === "undefined" || document.visibilityState !== "hidden");

  useEffect(() => {
    const updateVisibility = () => setPageVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    let view, resize, contextLost;
    let cancelled = false;
    setError(null);
    setLoading(true);
    const fit = () => {
      const width = wrapRef.current.clientWidth || window.innerWidth;
      const height = wrapRef.current.clientHeight || window.innerHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      view.setSize(width, height);
    };

    import("@/game/three/ThreeView").then(({ ThreeView }) => {
      if (cancelled) return;
      try {
        view = new ThreeView(canvas, eng);
        if (cancelled) { view.dispose(); return; }
        viewRef.current = view;
        view.setReducedMotion(Boolean(reducedMotion || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches));
        if (reducedEffects) view.reduceEffects();
        onAvailability?.(true);
        fit();
        resize = new ResizeObserver(fit);
        resize.observe(wrapRef.current);
        window.addEventListener("resize", fit);
        contextLost = (event) => { event.preventDefault(); onAvailability?.(false); setError("The 3D connection was interrupted. Your match is preserved."); };
        canvas.addEventListener("webglcontextlost", contextLost);
        setViewGeneration((generation) => generation + 1);
        setLoading(false);
      } catch {
        setError("3D graphics could not start on this browser.");
        setLoading(false);
        onAvailability?.(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setError("3D graphics could not start on this browser.");
        setLoading(false);
        onAvailability?.(false);
      }
    });

    return () => {
      cancelled = true;
      resize?.disconnect();
      window.removeEventListener("resize", fit);
      if (contextLost) canvas.removeEventListener("webglcontextlost", contextLost);
      view?.dispose();
      if (viewRef.current === view) viewRef.current = null;
      onAvailability?.(false);
    };
  }, [eng, wrapRef, onQuality, onAvailability, retry]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return undefined;
    const preference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const syncMotion = () => view.setReducedMotion(Boolean(reducedMotion || preference?.matches));
    syncMotion();
    preference?.addEventListener?.("change", syncMotion);
    return () => preference?.removeEventListener?.("change", syncMotion);
  }, [eng, reducedMotion, retry, viewGeneration]);

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
  }, [renderActive, pageVisible, error, retry, onQuality, viewGeneration]);

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
    {loading && !error && <div data-testid="game-canvas-loading" role="status" className="absolute inset-0 z-30 flex items-center justify-center bg-[#071222] font-mono text-sm text-slate-300">Loading court…</div>}
    {error && <div data-testid="webgl-error" role="alert" className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-[#121824] p-5 text-center">
      <p>{error}</p><button data-testid="webgl-retry-btn" onClick={() => setRetry(n => n + 1)} className="btn-volt flex items-center gap-2 rounded-full px-5 py-3"><RotateCcw size={16} />Retry 3D</button>
    </div>}
  </div>;
}
