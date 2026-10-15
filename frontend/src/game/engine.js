import { SURFACES, SHOTS, DIFFICULTY, STYLES, FORMATS } from "./constants";
import { stepBall, solveShot, isIn, predictIntercept } from "./physics";
import { createScore, awardPoint, currentServer, pointLabels, scoreCall } from "./scoring";
import { audio } from "./audio";
import { recordFrame, startReplay, stepReplay, endReplay } from "./replay";
import { pointerInput, movementDirection } from "./input";

const SIM = 0.82;
const PHYSICS_STEP = 1 / 120;
const MAX_CATCHUP_STEPS = 30;
const rand = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const blankStats = () => ({ aces: 0, double_faults: 0, winners: 0, errors: 0, perfect_shots: 0, total_shots: 0, longest_rally: 0, points_won: 0 });

export class TennisEngine {
  constructor(cfg, onEvent) {
    this.cfg = cfg;
    this.onEvent = onEvent || (() => {});
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
    this.aiServeT = rand(0.9, 1.5);
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
    buf.exp = this.time + 0.18;
    this.attemptPlayerHit();
  }

  slide() {
    const p = this.p;
    const { dx, dz } = this.moveDir();
    if (this.state !== "rally" || p.sliding > 0 || (dx === 0 && dz === 0)) return;
    p.sliding = 0.55; p.sdx = dx; p.sdz = dz;
    p.stamina = Math.max(0, p.stamina - 6);
  }

  moveDir() {
    return movementDirection(this);
  }

  pressShot(id) {
    // Replays are dismissed with Enter or the Skip control, not an accidental shot key.
    if (this.state === "replay") return;
    if (!SHOTS[id]) return;
    this.selectedShot = id;
    if (this.state === "serve" && this.server === 0) return this.playerServeInput();
    if (this.state !== "rally") return;
    const p = this.p;
    // Preparing a return is not a swing. Animate only at contact (or on a missed tap).
    p.buffered = { shot: id, exp: this.time + 0.18, prepared: p.heldShot === id };
    this.attemptPlayerHit();
  }

  fatigue() { return 1 - this.p.stamina / this.p.cap; }
  power() { return lerp(0.72, 1.14, this.cfg.power / 10) * lerp(1, 0.72, this.fatigue()); }
  accuracy() { return lerp(0.86, 1, this.cfg.accuracy / 10) * lerp(1, 0.75, this.fatigue()); }

  deviate(target, acc, dist) {
    const dev = Math.tan(((1 - acc) * 14 * 2.5 * Math.PI) / 180) * dist;
    target.x += rand(-1, 1) * dev;
    target.z += rand(-1, 1) * dev * 0.8;
  }

  launch(who, shot, target, h, quality) {
    const b = this.ball;
    const side = who === 0 ? -1 : 1;
    target.z = side * Math.max(0.4, Math.abs(target.z));
    Object.assign(b, solveShot(b, target, h, shot.spin, shot.clear), { spin: shot.spin, netHit: false });
    this.lastHitter = who;
    this.bounces = 0;
    this.isServe = shot.id === "serve";
    this.rally++;
    (who === 0 ? this.p : this.a).overhead = ["serve", "smash"].includes(shot.id);
    const st = this.stats[who];
    st.total_shots++;
    if (quality === "perfect") st.perfect_shots++;
    audio.hit(quality === "perfect" ? 1.2 : 0.9);
    if (who === 0) Object.assign(this.a, { plan: null, reactT: 0.42 * this.diff.reaction, rolled: false, whiff: false, wild: false, letGo: false });
    this.emit({ type: "shot", who, shot: shot.label, quality });
  }

  playerServeInput() {
    const b = this.ball;
    if (this.serveStage === "hold") {
      this.serveStage = "toss";
      Object.assign(b, { x: this.p.x + 0.35, z: this.p.z, vx: this.p.vx, vz: this.p.vz, vy: 5.2 });
      return;
    }
    if (this.serveStage !== "toss") return;
    if (Math.hypot(b.x - this.p.x, b.z - this.p.z) > 2.5) return;
    const quality = b.y >= 2.25 ? "perfect" : b.y >= 1.75 ? "good" : "late";
    this.p.swing = 0.25; this.p.side = 1;
    let force = this.power();
    let acc = this.accuracy() * 0.97;
    if (quality === "perfect") force *= 1.08;
    if (quality === "late" || quality === "early") { force *= 0.88; acc *= 0.9; }
    const wide = this.keys.right ? 1 : this.keys.left ? -1 : 0;
    const tx = wide === 0 ? 2.2 : wide === this.boxSign ? 3.5 : 0.8;
    const target = { x: this.boxSign * tx, z: -SHOTS.serve.depth };
    if (this.pointerAim) target.x = this.boxSign * clamp(Math.abs(this.pointerAim.x), 0.8, 3.5);
    this.deviate(target, acc, 18);
    this.state = "rally";
    this.launch(0, SHOTS.serve, target, SHOTS.serve.h * force, quality);
  }

  attemptPlayerHit() {
    if (this.state !== "rally") return;
    const b = this.ball, p = this.p, buf = p.buffered;
    if (!buf || this.lastHitter === 0 || b.z < 0) return;
    if (this.isServe && this.bounces === 0) return;
    if (b.y > (buf.shot === "smash" ? 3.4 : 2.7)) return;
    const d = Math.hypot(b.x - p.x, b.z - p.z);
    if (d > 2.5) return;
    const approaching = (b.x - p.x) * b.vx + (b.z - p.z) * b.vz < 0;
    if (buf.prepared && !buf.released) return;
    if (buf.prepared && (!approaching || d > 1.04)) return;
    const timingDistance = buf.prepared ? buf.releaseDistance : d;
    const quality = timingDistance <= 0.62 ? "perfect"
      : timingDistance <= 1.04 ? "good"
      : timingDistance <= 1.65 ? "early" : "late";
    if (!buf.prepared && quality === "late" && approaching && this.time < buf.exp - 0.02) return;
    p.buffered = null;
    this.playerHit(buf.shot, quality);
  }

  playerHit(id, quality) {
    const b = this.ball;
    this.p.swing = 0.25;
    this.p.side = b.x >= this.p.x ? 1 : -1;
    let shot = SHOTS[id];
    if ((shot.id === "smash" && b.y < 1.7) || shot.id === "serve") shot = SHOTS.flat;
    let force = this.power();
    let acc = this.accuracy();
    if (quality === "perfect") force *= 1.08;
    if (quality === "late") { force *= 0.88; acc *= 0.9; }
    const aim = this.keys.right ? 1 : this.keys.left ? -1 : 0;
    let tx = aim !== 0 ? aim * 3.3 : clamp(-b.x * 0.35 + rand(-1.4, 1.4), -3, 3);
    if (quality === "perfect") tx *= 1.08;
    const target = { x: tx, z: -shot.depth };
    if (this.pointerAim) target.x = this.pointerAim.x;
    this.deviate(target, acc, Math.hypot(tx - b.x, target.z - b.z));
    this.launch(0, shot, target, shot.h * force, quality);
  }

  aiPickShot() {
    const r = Math.random();
    const b = this.ball;
    if (b.y > 1.8 && b.z > -9 && (this.cfg.style === "aggressive" || r < 0.4)) return SHOTS.smash;
    if (this.p.z < 4.5 && r < 0.42) return SHOTS.lob;
    if (this.p.z > 12.5 && r < 0.22) return SHOTS.dropshot;
    switch (this.cfg.style) {
      case "netrusher": return r > 0.7 ? SHOTS.dropshot : SHOTS.flat;
      case "defensive": return r > 0.5 ? SHOTS.lob : SHOTS.slice;
      case "aggressive": return SHOTS.flat;
      default: return r > 0.5 ? SHOTS.flat : SHOTS.topspin;
    }
  }

  aiHit() {
    const a = this.a, p = this.p, d = this.diff;
    const shot = this.aiPickShot();
    const quality = Math.random() < d.perfect ? "perfect" : "good";
    a.swing = 0.25; a.side = this.ball.x >= a.x ? -1 : 1;
    const predictedX = clamp(p.x + p.vx * 0.42, -3.5, 3.5);
    const targetOpenSide = predictedX >= 0 ? -1 : 1;
    const tx = Math.random() < 0.72
      ? targetOpenSide * rand(1.8, 3.4)
      : clamp(predictedX * 0.45 + rand(-0.6, 0.6), -1.4, 1.4);
    const shortBall = p.z > 12.5 && shot.id !== "lob" && Math.random() < 0.35;
    const target = { x: tx, z: shortBall ? Math.min(shot.depth, 5.4) : shot.depth };
    this.deviate(target, d.acc, 20);
    if (a.wild) { target.x += rand(-1, 1) * 3; target.z += rand(-0.5, 1) * 3; }
    if (this.cfg.style === "netrusher") a.homeZ = shot.id !== "lob" && Math.random() < 0.6 ? -4.5 : this.style.homeZ;
    this.launch(1, shot, target, shot.h * d.power * (quality === "perfect" ? 1.08 : 1), quality);
  }

  aiServe() {
    const d = this.diff;
    const quality = Math.random() < d.perfect ? "perfect" : "good";
    this.a.swing = 0.25;
    const target = { x: this.boxSign * rand(1.0, 3.6), z: SHOTS.serve.depth };
    this.deviate(target, d.acc * 0.97, 18);
    if (Math.random() < d.error * 0.5) { target.x += rand(-1, 1) * 2; target.z += rand(0, 2); }
    this.state = "rally";
    this.launch(1, SHOTS.serve, target, SHOTS.serve.h * d.power * 0.95 * (quality === "perfect" ? 1.06 : 1), quality);
  }

  update(dtReal) {
    if (!Number.isFinite(dtReal) || dtReal <= 0 || this.state === "matchOver") return;
    if (this.state === "replay") return this.stepReplay(dtReal);
    this.simCarry += Math.min(dtReal, 0.25) * SIM;
    let steps = 0;
    while (this.simCarry >= PHYSICS_STEP && steps < MAX_CATCHUP_STEPS) {
      this.simCarry -= PHYSICS_STEP;
      this.advance(PHYSICS_STEP);
      steps++;
      if (this.state === "replay" || this.state === "matchOver") {
        this.simCarry = 0;
        break;
      }
    }
    if (steps >= MAX_CATCHUP_STEPS) this.simCarry = Math.min(this.simCarry, PHYSICS_STEP);
  }

  advance(dt) {
    this.time += dt;
    this.activeSeconds += dt;
    this.stateT += dt;
    this.cheer = Math.max(0, this.cheer - dt * 0.6);
    this.marks = this.marks.filter((m) => (m.life -= dt * 0.25) > 0);
    this.updatePlayer(dt);
    this.updateAI(dt);
    this.updateBall(dt);
    if (this.state === "rally") this.record();
    if (this.state === "pointOver" && this.stateT > 1.8) {
      if (this.bigPoint && this.replays && this.lastPointFrames.length > 2) this.startReplay();
      else this.setupPoint();
    }
    if (this.state === "faultPause" && this.stateT > 1.1) this.setupPoint();
    if (this.state === "matchPending" && this.stateT > 2.2) {
      if (this.replays && this.lastPointFrames.length > 2) this.startReplay();
      else this.finishMatch();
    }
  }

  updatePlayer(dt) {
    const p = this.p;
    p.swing = Math.max(0, p.swing - dt);
    if (!["serve", "rally", "pointOver", "faultPause"].includes(this.state)) { p.vx = p.vz = 0; return; }
    if (p.heldShot && this.state === "rally" && this.lastHitter === 1) {
      p.buffered = { shot: p.heldShot, exp: this.time + 0.18, prepared: true };
    }
    if (p.buffered) {
      this.attemptPlayerHit();
      if (p.buffered && this.time > p.buffered.exp) {
        p.buffered = null;
        p.swing = 0.25;
        p.side = this.ball.x >= p.x ? 1 : -1;
        this.emit({ type: "shot", who: 0, quality: "miss" });
      }
    }
    const { dx, dz } = this.moveDir();
    const moving = dx !== 0 || dz !== 0;
    p.sprint = moving && this.keys.sprint && p.stamina > 0.5 && p.sliding <= 0;
    p.stamina = clamp(p.stamina + (p.sprint ? -15 : 10) * dt, 0, p.cap);
    if (p.sliding > 0) p.sliding -= dt;
    const speed = 5.5 * this.surf.speed * lerp(1, 0.72, this.fatigue()) * (p.sprint ? 1.48 : 1);
    const tvx = p.sliding > 0 ? p.sdx * 9.5 : dx * speed;
    const tvz = p.sliding > 0 ? p.sdz * 9.5 : dz * speed;
    const rate = (tvx * tvx + tvz * tvz > p.vx * p.vx + p.vz * p.vz ? 28 : 34) * dt;
    const ddx = tvx - p.vx, ddz = tvz - p.vz;
    const dm = Math.hypot(ddx, ddz);
    if (dm <= rate) { p.vx = tvx; p.vz = tvz; } else { p.vx += (ddx / dm) * rate; p.vz += (ddz / dm) * rate; }
    p.x = clamp(p.x + p.vx * dt, -7, 7);
    p.z = clamp(p.z + p.vz * dt, 0.7, 14.6);
  }

  updateAI(dt) {
    const a = this.a, b = this.ball, d = this.diff;
    a.swing = Math.max(0, a.swing - dt);
    a.vx = a.vz = 0;
    if (!["serve", "rally"].includes(this.state)) return;
    if (this.state === "serve") return this.updateAIServe(dt);
    const { tx, tz, speed, incoming } = this.aiComputeTarget(dt);
    const ddx = tx - a.x, ddz = tz - a.z;
    const dm = Math.hypot(ddx, ddz);
    const step = speed * dt;
    if (dm > 0.02) {
      a.vx = (ddx / dm) * Math.min(step, dm) / dt; a.vz = (ddz / dm) * Math.min(step, dm) / dt;
      a.x += a.vx * dt; a.z += a.vz * dt;
    }
    a.x = clamp(a.x, -7, 7);
    a.z = clamp(a.z, -14.6, -0.7);
    if (!incoming || a.reactT > 0 || a.letGo || a.whiff || b.z >= 0) return;
    if (this.isServe && this.bounces === 0) return;
    if (this.bounces === 0 && a.z < -6.5) return;
    if (b.y > 2.6 || Math.hypot(b.x - a.x, b.z - a.z) > 1.7) return;
    if (!a.rolled) {
      a.rolled = true;
      if (Math.random() < d.error) { if (Math.random() < 0.5) { a.whiff = true; a.swing = 0.25; return; } a.wild = true; }
    }
    this.aiHit();
  }

  updateAIServe(dt) {
    const a = this.a, b = this.ball;
    if (this.server !== 1) return;
    this.aiServeT -= dt;
    if (this.serveStage === "hold" && this.aiServeT <= 0) { this.serveStage = "toss"; b.vy = 5.2; }
    if (this.serveStage === "toss" && b.vy < 0 && b.y <= 2.4) this.aiServe();
  }

  aiComputeTarget(dt) {
    const a = this.a, b = this.ball, d = this.diff;
    const speed = 5 * d.move * this.surf.speed;
    const incoming = this.state === "rally" && this.lastHitter === 0;
    let tx = clamp(-b.x * 0.15, -2, 2);
    let tz = a.homeZ;
    if (incoming) {
      a.reactT -= dt;
      if (a.reactT > 0) { tx = a.x; tz = a.z; }
      else {
        if (!a.plan || this.time - a.planT > 0.12) {
          a.plan = predictIntercept({ ball: b, ai: a, speed, surf: this.surf, volleyOK: a.z > -6.5, serveBox: this.isServe ? this.boxSign : 0, startBounces: this.bounces });
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
      b.vy -= 9.81 * dt; b.y += b.vy * dt;
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
      server: this.server, tiebreak: s.tiebreak, stamina: this.p.stamina / this.p.cap, sprint: this.p.sprint,
      state: this.state, serveStage: this.serveStage, rally: this.rally, faults: this.faults,
      selectedShot: this.selectedShot,
      serveHeight: this.state === "serve" && this.serveStage === "toss" ? clamp((this.ball.y - 1) / 1.4, 0, 1) : 0,
      canReplay: this.lastPointFrames.length > 1 && (this.state === "pointOver" || this.state === "matchOver" || (this.state === "serve" && this.serveStage === "hold")),
      replayProgress: this.state === "replay" ? this.replayI / Math.max(1, this.replayFrames.length - 1) : 0,
      replaySpeed: this.replaySpeed,
    };
  }
}
