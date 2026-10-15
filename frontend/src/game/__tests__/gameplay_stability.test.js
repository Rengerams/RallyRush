import { describe, expect, test, vi } from "vitest";
import { TennisEngine } from "../engine";
import { SURFACES, FORMATS, SHOTS } from "../constants";
import { stepBall } from "../physics";
import { createScore, awardPoint, pointLabels } from "../scoring";

const cfg = { name: "Tester", power: 6, stamina: 6, accuracy: 6,
  difficulty: "medium", style: "baseline", surface: "hard", format: "quick" };

test("simulation advances almost equally at 20 and 60 FPS", () => {
  const a = new TennisEngine(cfg), b = new TennisEngine(cfg);
  a.aiServeT = b.aiServeT = 100;
  for (let i = 0; i < 60; i++) a.update(1 / 60);
  for (let i = 0; i < 20; i++) b.update(1 / 20);
  expect(a.time).toBeCloseTo(b.time, 5);
  expect(a.p.x).toBeCloseTo(b.p.x, 5);
});

test("simulation rejects nonfinite frame intervals", () => {
  const e = new TennisEngine(cfg);
  e.update(NaN); e.update(Infinity); e.update(-1);
  expect(e.time).toBe(0);
});

test("grass bounce stays lower than hard court and preserves more horizontal speed", () => {
  const before = { x: 0, y: 0.01, z: 4, vx: 1, vy: -5, vz: 12, spin: 0, netHit: false };
  const hard = { ...before }, grass = { ...before };
  stepBall(hard, 0.01, SURFACES.hard);
  stepBall(grass, 0.01, SURFACES.grass);
  expect(grass.vy).toBeLessThan(hard.vy);
  expect(grass.vz).toBeGreaterThan(hard.vz);
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
  const e = new TennisEngine(cfg);
  const random = vi.spyOn(Math, "random").mockReturnValue(0.1);
  e.p.z = 3.5;
  expect(e.aiPickShot()).toBe(SHOTS.lob);
  e.p.z = 13;
  expect(e.aiPickShot()).toBe(SHOTS.dropshot);
  random.mockRestore();
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

test("advantage scoreboard shows forty on the other side", () => {
  const s = createScore(FORMATS.standard);
  s.points = [3, 3];
  expect(pointLabels(s)).toEqual(["40", "40"]);
  awardPoint(s, 0);
  expect(pointLabels(s)).toEqual(["AD", "40"]);
  awardPoint(s, 1);
  expect(pointLabels(s)).toEqual(["40", "40"]);
});
