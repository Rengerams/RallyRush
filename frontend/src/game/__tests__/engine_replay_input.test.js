import { TennisEngine } from "../engine";
import { movementDirection, pointerInput } from "../input";
import { recordFrame, startReplay, endReplay } from "../replay";

const cfg = {
  name: "Tester",
  power: 6,
  stamina: 6,
  accuracy: 6,
  legend: false,
  difficulty: "medium",
  style: "baseline",
  surface: "hard",
  format: "quick",
};

// Module: movement and pointer input rules
describe("input movement and aiming", () => {
  test("keyboard movement overrides pointer target direction", () => {
    const e = new TennisEngine(cfg);
    e.pointerTarget = { x: -5, z: 14 };
    e.keys.right = true;
    const dir = movementDirection(e);
    expect(dir.dx).toBeGreaterThan(0);
    expect(Math.abs(dir.dz)).toBeLessThan(0.001);
  });

  test("pointer movement clamps to own court while not aiming", () => {
    const e = new TennisEngine(cfg);
    pointerInput(e, { x: 2, z: -5 }, false);
    expect(e.pointerTarget.z).toBeGreaterThanOrEqual(0.7);
    expect(e.pointerAim).toBeNull();
  });

  test("right-button aiming clears move target and sets shot target", () => {
    const e = new TennisEngine(cfg);
    e.selectedShot = "flat";
    pointerInput(e, { x: 2.2, z: 3 }, true);
    expect(e.pointerTarget).toBeNull();
    expect(e.pointerAim).toBeTruthy();
    expect(e.pointerAim.z).toBeLessThan(0);
  });
});

test("right-mouse aiming works even when mouse-follow is switched off", () => {
  const e = new TennisEngine(cfg);
  e.mouseEnabled = false;
  pointerInput(e, { x: 2, z: 10 }, false);
  expect(e.pointerTarget).toBeNull();
  pointerInput(e, { x: 2.5, z: -5 }, true);
  expect(e.pointerAim).toBeTruthy();
  expect(e.pointerAim.x).toBeCloseTo(e.boxSign * 2.5);
});

test("WASD steering cancels mouse-follow destination but preserves right-click aim", () => {
  const e = new TennisEngine(cfg);
  e.pointerTarget = { x: 3, z: 13 };
  e.pointerAim = { x: -2, z: -9 };
  e.setKey("left", true);
  expect(e.pointerTarget).toBeNull();
  expect(e.pointerAim).toEqual({ x: -2, z: -9 });
});

test("shot keys cannot silently skip an active replay", () => {
  const e = new TennisEngine(cfg);
  e.state = "replay";
  e.pressShot("flat");
  expect(e.state).toBe("replay");
});

// Module: engine update guard behavior
describe("engine update guards", () => {
  test("update ignores non-positive dt", () => {
    const e = new TennisEngine(cfg);
    const before = { t: e.time, state_t: e.stateT, x: e.p.x, z: e.p.z };
    e.update(0);
    e.update(-0.1);
    expect(e.time).toBe(before.t);
    expect(e.stateT).toBe(before.state_t);
    expect(e.p.x).toBe(before.x);
    expect(e.p.z).toBe(before.z);
  });

  test("second serve keeps player repositioned location", () => {
    const e = new TennisEngine(cfg);
    e.p.x = -2.3;
    e.p.z = 13.7;
    e.faults = 1;
    e.setupPoint();
    expect(e.p.x).toBeCloseTo(-2.3);
    expect(e.p.z).toBeCloseTo(13.7);
  });

  test("movement remains enabled in serve, faultPause and pointOver", () => {
    const e = new TennisEngine(cfg);
    e.keys.right = true;

    e.state = "serve";
    const x0 = e.p.x;
    e.update(0.016);
    const x1 = e.p.x;

    e.state = "faultPause";
    e.update(0.016);
    const x2 = e.p.x;

    e.state = "pointOver";
    e.update(0.016);
    const x3 = e.p.x;

    expect(x1).toBeGreaterThan(x0);
    expect(x2).toBeGreaterThan(x1);
    expect(x3).toBeGreaterThan(x2);
  });
});

// Module: replay lifecycle and restore behavior
describe("replay controls", () => {
  test("manual replay is blocked during rally", () => {
    const e = new TennisEngine(cfg);
    e.state = "rally";
    e.lastPointFrames = [{ t: 0, b: { x: 0, y: 1, z: 0 }, p: { x: 0, z: 10 }, a: { x: 0, z: -10 } }, { t: 0.1, b: { x: 0, y: 1, z: 1 }, p: { x: 0, z: 10 }, a: { x: 0, z: -10 } }];
    expect(startReplay(e, true)).toBe(false);
  });

  test("manual replay starts from pointOver and restores live state", () => {
    const e = new TennisEngine(cfg);
    e.state = "pointOver";
    e.stateT = 0.8;
    recordFrame(e);
    e.time += 0.2;
    e.ball.z = 1.4;
    recordFrame(e);
    e.lastPointFrames = [...e.frames];

    const started = startReplay(e, true);
    expect(started).toBe(true);
    expect(e.state).toBe("replay");

    endReplay(e);
    expect(e.state).toBe("pointOver");
    expect(e.stateT).toBeCloseTo(0.8);
  });
});
