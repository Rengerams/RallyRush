const entityFrame = (p) => ({ x: p.x, z: p.z, vx: p.vx || 0, vz: p.vz || 0, swing: p.swing, side: p.side, sprint: !!p.sprint, sliding: p.sliding || 0, overhead: !!p.overhead });

export function recordFrame(e) {
  const { x, y, z } = e.ball;
  e.frames.push({ t: e.time, b: { x, y, z }, p: entityFrame(e.p), a: entityFrame(e.a), lastHitter: e.lastHitter });
  while (e.frames.length > 1 && e.time - e.frames[0].t > 8) e.frames.shift();
}

export function startReplay(e, manual = false) {
  if (e.state === "replay" || e.lastPointFrames.length < 2) return false;
  if (manual && !["serve", "pointOver", "matchOver"].includes(e.state)) return false;
  if (manual && e.state === "serve" && e.serveStage !== "hold") return false;
  e.replayReturn = manual ? "restore" : e.score.winner !== null ? "finishMatch" : "nextPoint";
  if (manual && e.state === "pointOver") e.bigPoint = null;
  e.liveFrame = { state: e.state, stateT: e.stateT, ball: { ...e.ball }, p: { ...e.p }, a: { ...e.a }, trail: [...e.trail] };
  e.replayFrames = e.lastPointFrames;
  e.replayTime = e.replayFrames[0].t;
  e.replayI = 0;
  e.replaySpeed = 1;
  e.replayPaused = false;
  e.clearPointer();
  e.state = "replay";
  e.emit({ type: "replay", on: true, label: e.lastPointLabel || "Last point" });
  return true;
}

export function stepReplay(e, delta) {
  if (e.replayPaused) return;
  const frames = e.replayFrames, end = frames[frames.length - 1].t;
  e.replayTime += Math.min(delta, 0.1) * e.replaySpeed;
  if (e.replayTime >= end) return endReplay(e);
  while (e.replayI < frames.length - 2 && frames[e.replayI + 1].t <= e.replayTime) e.replayI++;
  const a = frames[e.replayI], b = frames[e.replayI + 1];
  const blend = Math.min(1, (e.replayTime - a.t) / Math.max(0.00001, b.t - a.t));
  [[e.ball, "b"], [e.p, "p"], [e.a, "a"]].forEach(([target, key]) => {
    Object.assign(target, a[key]);
    for (const axis of ["x", "y", "z"]) {
      if (a[key][axis] !== undefined) target[axis] = a[key][axis] + (b[key][axis] - a[key][axis]) * blend;
    }
  });
  e.trail = frames.slice(Math.max(0, e.replayI - 12), e.replayI + 1).map(f => f.b);
}

export function endReplay(e) {
  if (e.state !== "replay") return;
  e.emit({ type: "replay", on: false });
  const live = e.liveFrame;
  Object.assign(e.ball, live.ball); Object.assign(e.p, live.p); Object.assign(e.a, live.a);
  e.trail = live.trail;
  if (e.replayReturn === "restore") { e.state = live.state; e.stateT = live.stateT; }
  else if (e.replayReturn === "finishMatch") e.finishMatch();
  else e.setupPoint();
  e.clearInput();
}
