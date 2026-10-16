import { expect, test } from "vitest";
import { TennisEngine } from "../engine";
import { SURFACES, FORMATS, SHOTS } from "../constants";
import { audio } from "../audio";
import { stepBall } from "../physics";
import { createScore, awardPoint, pointLabels } from "../scoring";
import { ENGINE_TUNING } from "../tuning";

const cfg = { name: "Tester", power: 6, stamina: 6, accuracy: 6,
  difficulty: "medium", style: "baseline", surface: "hard", format: "quick" };

function playTimedServe(seed) {
  let state = seed >>> 0;
  const rng = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
  const events = [];
  const e = new TennisEngine({ ...cfg, difficulty: "easy" }, (event) => events.push(event), { rng });
  e.score.gamesPlayed = 0;
  e.setupPoint();
  e.pressShot("flat");
  for (let i = 0; i < 120 && e.ball.y < 2.25; i++) e.update(1 / 120);
  e.pressShot("flat");
  const serve = events.find((event) => event.type === "shot" && event.who === 0);
  return { quality: serve?.quality, velocity: [e.ball.vx, e.ball.vy, e.ball.vz] };
}

test("simulation advances almost equally at 20 and 60 FPS", () => {
  const a = new TennisEngine(cfg), b = new TennisEngine(cfg);
  a.aiServeT = b.aiServeT = 100;
  for (let i = 0; i < 60; i++) a.update(1 / 60);
  for (let i = 0; i < 20; i++) b.update(1 / 20);
  expect(a.time).toBeCloseTo(b.time, 5);
  expect(a.p.x).toBeCloseTo(b.p.x, 5);
});

test("match duration measures real active time rather than scaled physics time", () => {
  const e = new TennisEngine(cfg);
  for (let i = 0; i < 60; i++) e.update(1 / 60);

  expect(e.activeSeconds).toBeCloseTo(1, 2);
  expect(e.time).toBeCloseTo(ENGINE_TUNING.simulationScale, 2);
});

test("match duration counts long active frames while physics catch-up stays capped", () => {
  const e = new TennisEngine(cfg);
  e.update(1);

  expect(e.activeSeconds).toBe(1);
  expect(e.time).toBeLessThanOrEqual(ENGINE_TUNING.maxCatchupSteps * ENGINE_TUNING.physicsStep);
});

test("simulation rejects nonfinite frame intervals", () => {
  const e = new TennisEngine(cfg);
  e.update(NaN); e.update(Infinity); e.update(-1);
  expect(e.time).toBe(0);
});

test("cancelling a held shot clears its pending buffer", () => {
  const e = new TennisEngine(cfg);
  e.state = "rally";
  e.lastHitter = 1;
  e.holdShot("topspin");

  expect(e.p.heldShot).toBe("topspin");
  expect(e.p.buffered?.shot).toBe("topspin");
  e.cancelShot("topspin");
  expect(e.p.heldShot).toBeNull();
  expect(e.p.buffered).toBeNull();
});

test("grass bounce stays lower than hard court and preserves more horizontal speed", () => {
  const before = { x: 0, y: 0.01, z: 4, vx: 1, vy: -5, vz: 12, spin: 0, netHit: false };
  const hard = { ...before }, grass = { ...before };
  stepBall(hard, 0.01, SURFACES.hard);
  stepBall(grass, 0.01, SURFACES.grass);
  expect(grass.vy).toBeLessThan(hard.vy);
  expect(grass.vz).toBeGreaterThan(hard.vz);
});

test("topspin and slice produce distinct deterministic bounces on every surface", () => {
  for (const surface of Object.values(SURFACES)) {
    const ball = (spin) => ({ x: 0, y: 0.01, z: 4, vx: 1, vy: -5, vz: 12, spin, netHit: false });
    const topspin = ball(1), flat = ball(0), slice = ball(-1);
    stepBall(topspin, 0.01, surface);
    stepBall(flat, 0.01, surface);
    stepBall(slice, 0.01, surface);

    expect(topspin.vy).toBeGreaterThan(flat.vy);
    expect(flat.vy).toBeGreaterThan(slice.vy);
    expect(topspin.vz).toBeGreaterThan(flat.vz);
    expect(flat.vz).toBeGreaterThan(slice.vz);
    expect(topspin.spin).toBe(0.5);
    expect(slice.spin).toBe(-0.5);
  }
});

test("player movement scales consistently across all five court surfaces", () => {
  const speeds = Object.values(SURFACES).map((surface) => {
    const e = new TennisEngine({ ...cfg, surface: surface.id });
    e.state = "rally";
    e.setKey("right", true);
    for (let i = 0; i < 90; i++) e.updatePlayer(1 / 120);
    expect(e.p.vx).toBeCloseTo(5.5 * surface.speed, 1);
    return e.p.vx;
  });
  expect(new Set(speeds).size).toBeGreaterThan(1);
});

test("sliding decelerates and stamina recovers more slowly while moving", () => {
  const e = new TennisEngine(cfg);
  e.state = "rally";
  e.p.stamina = 40;
  e.setKey("right", true);
  for (let i = 0; i < 60; i++) e.updatePlayer(1 / 120);
  expect(e.p.stamina).toBeCloseTo(42, 0);

  const runningSpeed = e.p.vx;
  e.slide();
  expect(e.p.stamina).toBeCloseTo(36, 0);
  for (let i = 0; i < 33; i++) e.updatePlayer(1 / 120);
  expect(e.p.vx).toBeLessThan(ENGINE_TUNING.slideSpeed);
  expect(e.p.vx).toBeGreaterThan(0);
  expect(runningSpeed).toBeGreaterThan(0);

  e.setKey("right", false);
  for (let i = 0; i < 120; i++) e.updatePlayer(1 / 120);
  expect(e.p.stamina).toBeGreaterThan(36);
});

test("quick set completes after a 2-game margin", () => {
  const s = createScore(FORMATS.quick);
  for (let game = 0; game < 3; game++)
    for (let point = 0; point < 4; point++) awardPoint(s, 0);
  expect(s.winner).toBe(0);
  expect(s.setHistory).toEqual([[3, 0]]);
});

test("tie-break rotates serving and finishes only with 2-point margin", () => {
  const s = createScore(FORMATS.quick);
  s.games = [3, 3]; s.tiebreak = true;
  for (let i = 0; i < 6; i++) { awardPoint(s, 0); awardPoint(s, 1); }
  expect(s.winner).toBeNull();
  awardPoint(s, 0); awardPoint(s, 0);
  expect(s.winner).toBe(0);
});

test("snapshot announces the next server immediately after a game-ending point", () => {
  const e = new TennisEngine(cfg);
  e.score.points = [3, 0];
  e.state = "rally";

  awardPoint(e.score, 0);

  expect(e.server).toBe(0);
  expect(e.snapshot().server).toBe(1);
});

test("snapshot announces a tie-break service rotation immediately", () => {
  const e = new TennisEngine(cfg);
  e.score.tiebreak = true;
  e.score.tbStarter = 0;
  e.score.points = [0, 0];
  e.server = 0;
  e.state = "rally";

  awardPoint(e.score, 0);

  expect(e.server).toBe(0);
  expect(e.snapshot().server).toBe(1);
});

test("a prepared return waits for release and rewards a well-timed swing", () => {
  const e = new TennisEngine(cfg);
  e.state = "rally";
  e.isServe = false;
  e.lastHitter = 1;
  e.ball.x = e.p.x;
  e.ball.y = 1.2;
  e.ball.z = e.p.z - 0.5;
  e.ball.vz = 4;
  e.p.swing = 0;

  e.holdShot("flat");
  expect(e.p.heldShot).toBe("flat");
  e.attemptPlayerHit();
  expect(e.p.swing).toBe(0);
  expect(e.lastHitter).toBe(1);

  e.releaseShot("flat");
  expect(e.p.heldShot).toBeNull();
  expect(e.lastHitter).toBe(0);
  expect(e.p.swing).toBeGreaterThan(0);
});

test("an early prepared swing expires without auto-hitting", () => {
  const events = [];
  const e = new TennisEngine(cfg, (event) => events.push(event));
  e.state = "rally";
  e.isServe = false;
  e.lastHitter = 1;
  e.ball.x = e.p.x;
  e.ball.y = 1.2;
  e.ball.z = e.p.z - 2.4;
  e.ball.vz = 4;

  e.holdShot("flat");
  e.releaseShot("flat");
  expect(e.lastHitter).toBe(1);

  e.time += 0.3;
  e.updatePlayer(0.001);
  expect(e.lastHitter).toBe(1);
  expect(e.p.buffered).toBeNull();
  expect(events.some((event) => event.type === "shot" && event.quality === "miss")).toBe(true);
});

test("the AI changes tactics when the player rushes the net or stays deep", () => {
  const e = new TennisEngine(cfg, undefined, { rng: () => 0.1 });
  e.p.z = 3.5;
  expect(e.aiPickShot()).toBe(SHOTS.lob);
  e.p.z = 13;
  expect(e.aiPickShot()).toBe(SHOTS.dropshot);
});

test("a mistimed tap expires and reports a miss without hitting the ball", () => {
  const events = [];
  const e = new TennisEngine(cfg, (event) => events.push(event));
  e.state = "rally";
  e.isServe = false;
  e.lastHitter = 1;
  e.ball.z = 2;
  e.pressShot("flat");
  expect(e.p.swing).toBe(0);
  // Advance only the input logic; keep the ball far from the player.
  e.time += 0.3;
  e.updatePlayer(0.001);
  expect(e.p.buffered).toBeNull();
  expect(events.some((event) => event.type === "shot" && event.quality === "miss")).toBe(true);
  expect(e.lastHitter).toBe(1);
});

test("a timed player serve has repeatable quality and trajectory for a fixed seed", () => {
  const first = playTimedServe(0x52a7e);
  expect(first.quality).toBe("perfect");
  expect(first.velocity.every(Number.isFinite)).toBe(true);
  expect(first).toEqual(playTimedServe(0x52a7e));
});

test("player bounce events expose the actual landing lane", () => {
  const events = [];
  const sound = audio.sound;
  audio.sound = false;
  try {
    const e = new TennisEngine(cfg, (event) => events.push(event));
    e.state = "rally";
    e.lastHitter = 0;
    e.isServe = false;
    e.ball.x = 0;
    e.ball.z = -8;
    e.handleBallEvent("bounce");
    expect(events.find((event) => event.type === "bounce")).toMatchObject({ who: 0, x: 0, z: -8, in: true });
  } finally {
    audio.sound = sound;
  }
});

test("advantage scoreboard shows forty on the other side", () => {
  const s = createScore(FORMATS.standard);
  s.points = [3, 3];
  expect(pointLabels(s)).toEqual(["40", "40"]);
  awardPoint(s, 0);
  expect(pointLabels(s)).toEqual(["AD", "40"]);
  awardPoint(s, 1);
  expect(pointLabels(s)).toEqual(["40", "40"]);
});
