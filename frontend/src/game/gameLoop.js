export function startGameLoop({
  engine,
  canUpdate,
  onSnapshot,
  requestFrame = globalThis.requestAnimationFrame?.bind(globalThis),
  cancelFrame = globalThis.cancelAnimationFrame?.bind(globalThis),
  setTimer = globalThis.setInterval?.bind(globalThis),
  clearTimer = globalThis.clearInterval?.bind(globalThis),
  visibilityTarget = globalThis.document,
  now = () => globalThis.performance?.now?.() ?? Date.now(),
}) {
  if (!engine || typeof requestFrame !== "function" || typeof cancelFrame !== "function") return () => {};
  let last = now();
  let frameId;
  const resetFrameBaseline = () => { last = now(); };
  visibilityTarget?.addEventListener?.("visibilitychange", resetFrameBaseline);
  const loop = (timestamp) => {
    const current = Number.isFinite(timestamp) ? timestamp : now();
    const dt = (current - last) / 1000;
    last = current;
    if (canUpdate()) engine.update(dt);
    frameId = requestFrame(loop);
  };
  frameId = requestFrame(loop);
  const timerId = typeof setTimer === "function" ? setTimer(() => onSnapshot(engine.snapshot()), 100) : null;

  return () => {
    cancelFrame(frameId);
    visibilityTarget?.removeEventListener?.("visibilitychange", resetFrameBaseline);
    if (timerId !== null && typeof clearTimer === "function") clearTimer(timerId);
  };
}
