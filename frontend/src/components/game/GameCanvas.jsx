import { useEffect, useRef } from "react";
import { render } from "@/game/render";
import { ThreeView } from "@/game/three/ThreeView";

function size(mode, wrapW) {
  const mobile = window.innerWidth < 1024;
  const maxH = mobile ? Math.max(360, window.innerHeight - 300) : Math.min(window.innerHeight - 110, 900);
  if (mode === "3d") return [wrapW, Math.min(maxH, mobile ? wrapW * 0.85 : wrapW * 0.62)];
  const w = Math.min(wrapW, maxH * 0.62);
  return [w, w / 0.62];
}

export default function GameCanvas({ eng, mode, wrapRef, onTap, onSlow }) {
  const ref = useRef(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- ThreeView, render, size are module constants; cancelAnimationFrame/requestAnimationFrame are globals
  useEffect(() => {
    const c = ref.current;
    let view = null;
    if (mode === "3d") {
      try { view = new ThreeView(c, eng); } catch { onSlow?.("unsupported"); return undefined; }
    }
    const fit = () => {
      const [w, h] = size(view ? "3d" : "2d", wrapRef.current?.clientWidth || 600);
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      if (view) view.setSize(w, h);
      else { const dpr = window.devicePixelRatio || 1; c.width = w * dpr; c.height = h * dpr; }
    };
    fit();
    window.addEventListener("resize", fit);
    let raf;
    const ctx = view ? null : c.getContext("2d");
    const t0 = performance.now();
    let frames = 0;
    let checked = false;
    const loop = () => {
      if (view && !checked) {
        const el = performance.now() - t0;
        if (el > 1200) frames++;
        if (el > 3200) { checked = true; if (frames / 2 < 8) { onSlow?.("slow"); return; } }
      }
      if (view) view.render();
      else render(ctx, eng, c.width, c.height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", fit); view?.dispose(); };
  }, [eng, mode, wrapRef, onSlow]);

  return (
    <canvas ref={ref} data-testid="game-canvas" data-view-mode={mode}
      onPointerDown={(e) => { if (e.pointerType === "touch") onTap?.(); }}
      className="block touch-none rounded-2xl border border-white/10" />
  );
}
