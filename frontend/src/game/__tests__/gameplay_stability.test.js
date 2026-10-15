import { TennisEngine } from "../engine";
import { SURFACES, FORMATS } from "../constants";
import { stepBall } from "../physics";
import { createScore, awardPoint } from "../scoring";

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
