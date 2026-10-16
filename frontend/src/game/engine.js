Warning: truncated output (original token count: 5550)
Total output lines: 510

import { BALL, SURFACES, SHOTS, DIFFICULTY, STYLES, FORMATS } from "./constants";
import { stepBall, solveShot, isIn, predictIntercept } from "./physics";
import { createScore, awardPoint, currentServer, pointLabels, scoreCall } from "./scoring";
import { audio } from "./audio";
import { recordFrame, startReplay, stepReplay, endReplay } from "./replay";
import { pointerInput, movementDirection } from "./input";
import { ENGINE_TUNING } from "./tuning";

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const blankStats = () => ({ aces: 0, double_faults: 0, winners: 0, errors: 0, perfect_shots: 0, total_shots: 0, longest_rally: 0, points_won: 0 });

export class TennisEngine {
  constructor(cfg, onEvent, { rng = Math.random } = {}) {
    this.cfg = cfg;
    this.onEvent = onEvent || (() => {});
    this.rng = typeof rng === "function" ? rng : Math.random;
    this.surf = SURFACES[cfg.surface];
    this.diff = DIFFICULTY[cfg.difficulty];
    this.style = STYLES[cfg.style];
    this.score = createScore(FORMATS[cfg.format]);
    this.names = [cfg.name, `${this.diff.label} AI`];
    this.stats = [blankStats(), blankStats()];
    this.keys = {};
    this.mouseEnabled = true;
    this.pointerTarget = null;
    this.pointerAim = null;
    this.selectedShot = "flat";
    this.time = 0;
    this.simCarry = 0;
    this.activeSeconds = 0;
    const cap = 100 * clamp(cfg.stamina / 10, 0.1, 1);
    this.p = { x: 0, z: 11.5, vx: 0, vz: 0, cap, stamina: cap, sliding: 0, sdx: 0, sdz: 0, swing: 0, side: 1, buffered: null, sprint: false };
    this.a = { x: 0, z: -11.5, swing: 0, side: 1, plan: null, planT: 0, reactT: 0, homeZ: this.style.homeZ, rolled: false, whiff: false, wild: false, letGo: false };
    this.ball = { x: 0, y: 1, z: 0, vx: 0, vy: 0, vz: 0, spin: 0, netHit: false };
    this.trail = [];
    this.marks = [];
    this.cheer = 0;
    this.faults = 0;
    this.frames = [];
    this.lastPointFrames = [];
    this.rallyLengths = [];
    this.replayFrames = [];
    this.cameraMode = "court";
    this.replays = true;
    this.startedAt = Date.now();
    this.setupPoint();
  }

  emit(e) { this.onEvent(e); }
  random() { return this.rng(); }
  rand(min, max) { return min + this.random() * (max - min); }
  call(text, speak = true) { this.emit({ type: "call", text }); if (speak) audio.say(text); }

  setupPoint() {
    const s = this.score;
    this.server = currentServer(s);
    const deuce = (s.points[0] + s.points[1]) % 2 === 0;
    const sSign = this.server === 0 ? (deuce ? 1 : -1) : (deuce ? -1 : 1);
    this.boxSign = -sSign;
    const p = this.p, a = this.a;
    const previousPosition = { x: p.x, z: p.z };
    if (this.server === 0) { p.x = sSign * 1.0; p.z = 12.2; a.x = this.boxSign * 2.4; a.z = -11.6; }
    else { a.x = sSign * 1.0; a.z = -12.2; p.x = this.boxSign * 2.4; p.z = 11.6; }
    if (this.faults > 0) Object.assign(p, previousPosition);
    p.vx = p.vz = 0; p.sliding = 0; p.buffered = null; p.heldShot = null;
    Object.assign(a, { plan: null, homeZ: this.style.homeZ, rolled: false, whiff: false, wild: false, letGo: false });
    Object.assign(this.ball, { vx: 0, vy: 0, vz: 0, spin: 0, netHit: false, y: 1 });
    this.serveStage = "hold";
    this.aiServeT = this.rand(...ENGINE_TUNING.aiServeDelay);
    this.lastHitter = null;
    this.bounces = 0;
    this.isServe = true;
    this.rally = 0;
    this.trail = [];
    this.frames = [];
    this.bigPoint = null;
    this.state = "serve";
    this.stateT = 0;
    this.pointerTarget = null;
    this.pointerAim = null;
  }

  setKey(k, down) {
    this.keys[k] = down;
    // Keyboard steering overrides mouse-follow, but keeps intentional right-click aim.
    if (down && ["left", "right", "up", "down"].includes(k)) this.pointerTarget = null;
  }

  setPointer(point, aiming) { pointerInput(this, point, aiming); }
  clearPointer() { this.pointerTarget = null; this.pointerAim = null; }
  clearInput() { this.keys = {}; this.clearPointer(); this.p.heldShot = null; this.p.buffered = null; }

  holdShot(id) {
    if (!SHOTS[id]) return;
    this.p.heldShot = id;
    this.pressShot(id);
  }

  releaseShot(id) {
    if (this.p.heldShot !== id) return;
    this.p.heldShot = null;
    const buf = this.p.buffered;
    if (this.state !== "rally" || !buf || buf.shot !== id || !buf.prepared) return;
    buf.released = true;
    buf.releaseDistance = Math.hypot(this.ball.x - this.p.x, this.ball.z - this.p.z);
    buf.exp = this.time + ENGINE_TUNING.shotBufferWindow;
    this.attemptPlayerHit();
  }

  slide() {
    const p = this.p;
    const { dx, dz } = this.moveDir();
    if (this.state !== "rally" || p.sliding > 0 || (dx === 0 && dz === 0)) return;
    p.sliding = ENGINE_TUNING.slideDuration; p.sdx = dx; p.sdz = dz;
    p.stamina = Math.max(0, p.stamina - ENGINE_TUNING.slideStaminaCost);
  }

  moveDir() {
    return movementDirection(this);
  }

  pressShot(id) {
    // Replays are dismissed with Enter or the Skip contro…3050 tokens truncated…dt;
      if (a.reactT > 0) { tx = a.x; tz = a.z; }
      else {
        if (!a.plan || this.time - a.planT > 0.12) {
      a.plan = predictIntercept({ ball: b, ai: a, speed, surf: this.surf, volleyOK: a.z > ENGINE_TUNING.aiVolleyPositionZ, serveBox: this.isServe ? this.boxSign : 0, startBounces: this.bounces });
          a.planT = this.time;
          if (a.plan.firstOut && d.smart && this.bounces === 0) a.letGo = true;
        }
        tx = a.plan.x + (a.plan.x >= a.x ? -0.5 : 0.5);
        tz = a.plan.z;
      }
    }
    return { tx, tz, speed, incoming };
  }

  updateBall(dt) {
    const b = this.ball;
    if (this.state === "serve") {
      const s = this.server === 0 ? this.p : this.a;
      if (this.serveStage === "hold") { b.x = s.x + 0.35; b.z = s.z; b.y = 1; b.vx = b.vy = b.vz = 0; return; }
      b.x += b.vx * dt; b.z += b.vz * dt;
      b.vy -= BALL.gravity * dt; b.y += b.vy * dt;
      if (b.y < 0.9 && b.vy < 0) { this.serveStage = "hold"; this.aiServeT = 0.6; }
      return;
    }
    for (let i = 0; i < 2; i++) {
      const ev = stepBall(b, dt / 2, this.surf);
      if (ev) this.handleBallEvent(ev);
    }
    this.trail.push({ x: b.x, y: b.y, z: b.z });
    if (this.trail.length > 12) this.trail.shift();
  }

  handleBallEvent(ev) {
    const b = this.ball;
    if (ev === "net") {
      audio.net();
      if (this.state !== "rally") return;
      if (this.isServe) return this.fault("Net · Fault");
      return this.endPoint(1 - this.lastHitter, "Net", true);
    }
    this.marks.push({ x: b.x, z: b.z, life: 1 });
    audio.bounce();
    if (this.state !== "rally") return;
    const hitter = this.lastHitter;
    if (this.bounces === 0) {
      const box = this.isServe ? this.boxSign : 0;
      if (!isIn(b, hitter === 0 ? -1 : 1, box)) return this.isServe ? this.fault("Fault") : this.endPoint(1 - hitter, "Out", true);
      this.bounces = 1;
      return;
    }
    if (this.isServe) { this.stats[hitter].aces++; return this.endPoint(hitter, "Ace"); }
    this.stats[hitter].winners++;
    this.endPoint(hitter, "Winner");
  }

  fault(text) {
    this.faults++;
    if (this.faults >= 2) { this.stats[this.server].double_faults++; return this.endPoint(1 - this.server, "Double Fault"); }
    this.state = "faultPause";
    this.stateT = 0;
    this.call(text);
  }

  endPoint(winner, reason, error) {
    if (this.state !== "rally" && this.state !== "faultPause") return;
    this.faults = 0;
    const loser = 1 - winner;
    if (error) this.stats[loser].errors++;
    this.stats[winner].points_won++;
    this.rallyLengths.push(this.rally);
    this.record();
    this.lastPointFrames = this.frames.slice();
    this.lastPointLabel = reason === "Winner" ? `${this.rally}-shot winner` : reason;
    for (const st of this.stats) st.longest_rally = Math.max(st.longest_rally, this.rally);
    const events = awardPoint(this.score, winner);
    this.cheer = events.includes("game") ? 1 : 0.6;
    audio.cheer(events.includes("set") ? 1.4 : 0.8);
    const call = scoreCall(this.score, events, this.names, winner);
    this.emit({ type: "call", text: reason, sub: call, winner });
    audio.say(`${reason}. ${call}`);
    this.bigPoint = reason === "Ace" ? "Ace" : this.rally >= 6 ? `${this.rally}-shot rally` : null;
    this.state = events.includes("match") ? "matchPending" : "pointOver";
    if (events.includes("match")) this.matchDuration = Math.round(this.activeSeconds);
    this.stateT = 0;
  }

  record() {
    recordFrame(this);
  }

  startReplay(manual = false) { return startReplay(this, manual); }

  stepReplay(dtReal) { stepReplay(this, dtReal); }

  endReplay() { endReplay(this); }

  finishMatch() {
    if (this.matchEmitted) return;
    this.matchEmitted = true;
    this.state = "matchOver";
    this.emit({ type: "matchEnd", result: this.result() });
  }

  result() {
    return {
      won: this.score.winner === 0,
      sets: this.score.setHistory,
      stats: { ...this.stats[0] },
      opponentStats: { ...this.stats[1] },
      rally_lengths: [...this.rallyLengths],
      duration_sec: this.matchDuration ?? Math.round(this.activeSeconds),
    };
  }

  snapshot() {
    const s = this.score;
    return {
      labels: pointLabels(s), games: [...s.games], sets: [...s.sets], setHistory: s.setHistory.map((x) => [...x]),
      server: currentServer(s), tiebreak: s.tiebreak, stamina: this.p.stamina / this.p.cap, sprint: this.p.sprint,
      state: this.state, serveStage: this.serveStage, rally: this.rally, faults: this.faults,
      selectedShot: this.selectedShot,
      serveHeight: this.state === "serve" && this.serveStage === "toss" ? clamp((this.ball.y - 1) / 1.4, 0, 1) : 0,
      canReplay: this.lastPointFrames.length > 1 && (this.state === "pointOver" || this.state === "matchOver" || (this.state === "serve" && this.serveStage === "hold")),
      replayProgress: this.state === "replay" ? this.replayI / Math.max(1, this.replayFrames.length - 1) : 0,
      replaySpeed: this.replaySpeed,
    };
  }
}
