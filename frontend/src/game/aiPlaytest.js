import { FORMATS } from "./constants";
import { TennisEngine } from "./engine";
import { ENGINE_TUNING } from "./tuning";
import { predictIntercept } from "./physics";

const FRAME = 1 / 60;
const SHOT = "flat";

export const PLAYTEST_PROFILES = Object.freeze({
  beginner: Object.freeze({ reaction: 0.32, releaseDistance: 0.96, serveContactHeight: 1.9 }),
  club: Object.freeze({ reaction: 0.2, releaseDistance: 0.72, serveContactHeight: 2.15 }),
  sharp: Object.freeze({ reaction: 0.1, releaseDistance: 0.52, serveContactHeight: 2.3 }),
});

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function moveToward(engine, target) {
  const dx = target.x - engine.p.x;
  const dz = target.z - engine.p.z;
  engine.setKey("left", dx < -0.18);
  engine.setKey("right", dx > 0.18);
  engine.setKey("up", dz < -0.18);
  engine.setKey("down", dz > 0.18);
  engine.setKey("sprint", Math.hypot(dx, dz) > 1.5 && engine.p.stamina > engine.p.cap * 0.2);
}

function predictPlayerIntercept(engine) {
  // The shared predictor models the AI on the negative half of the court.
  // Mirror the ball and the player position to reuse the same trajectory logic.
  const mirroredBall = { ...engine.ball, z: -engine.ball.z, vz: -engine.ball.vz };
  const moveSpeed = ENGINE_TUNING.playerMoveSpeed * engine.surf.speed * (1 - 0.28 * engine.fatigue());
  const intercept = predictIntercept({
    ball: mirroredBall,
    ai: { x: engine.p.x, z: -engine.p.z },
    speed: moveSpeed,
    reactLeft: 0,
    surf: engine.surf,
    volleyOK: true,
    serveBox: engine.isServe ? engine.boxSign : 0,
    startBounces: engine.bounces,
  });
  return { x: intercept.x, z: -intercept.z };
}

function drivePlayer(engine, profile, bot) {
  if (engine.state === "serve" && engine.server === 0) {
    engine.clearInput();
    if (engine.serveStage === "hold") {
      engine.pressShot(SHOT);
      bot.incomingRally = null;
    } else if (engine.ball.vy < 0 && engine.ball.y >= profile.serveContactHeight) {
      engine.pressShot(SHOT);
    }
    return;
  }

  if (engine.state !== "rally" || engine.lastHitter !== 1) {
    engine.setKey("left", false);
    engine.setKey("right", false);
    engine.setKey("up", false);
    engine.setKey("down", false);
    engine.setKey("sprint", false);
    bot.incomingRally = null;
    bot.nextPlanAt = engine.time;
    return;
  }

  if (bot.incomingRally !== engine.rally) {
    bot.incomingRally = engine.rally;
    bot.reactionUntil = engine.time + profile.reaction;
    bot.target = { x: engine.p.x, z: engine.p.z };
    bot.nextPlanAt = bot.reactionUntil;
  }

  if (engine.time >= bot.reactionUntil && engine.time >= bot.nextPlanAt) {
    bot.target = predictPlayerIntercept(engine);
    bot.nextPlanAt = engine.time + 0.08;
  }
  moveToward(engine, bot.target);

  if (engine.p.heldShot !== SHOT) engine.holdShot(SHOT);
  const distance = Math.hypot(engine.ball.x - engine.p.x, engine.ball.z - engine.p.z);
  const approaching = (engine.ball.x - engine.p.x) * engine.ball.vx + (engine.ball.z - engine.p.z) * engine.ball.vz < 0;
  const canReturnServe = !engine.isServe || engine.bounces > 0;
  if (canReturnServe && engine.ball.y <= 2.7 && distance <= profile.releaseDistance && approaching) {
    engine.releaseShot(SHOT);
  }
}

export function simulatePlaytestMatch({ seed, difficulty, style, surface = "hard", player = "club", maxFrames = 180_000 }) {
  const profile = PLAYTEST_PROFILES[player];
  if (!profile) throw new Error(`Unknown playtest profile: ${player}`);
  const config = {
    name: `Playtest ${player}`,
    power: 6,
    stamina: 7,
    accuracy: 6,
    difficulty,
    style,
    surface,
    format: "quick",
  };
  const engine = new TennisEngine(config, undefined, { rng: seededRandom(seed) });
  engine.score.fmt = FORMATS.quick;
  engine.replays = false;
  const bot = { incomingRally: null, reactionUntil: 0, nextPlanAt: 0, target: { x: 0, z: 11.5 } };

  for (let frame = 0; frame < maxFrames && engine.state !== "matchOver"; frame++) {
    drivePlayer(engine, profile, bot);
    engine.update(FRAME);
  }

  if (engine.state !== "matchOver") {
    throw new Error(`Playtest timed out: ${difficulty}/${style}/${player}, seed ${seed}, score ${engine.score.games.join("-")}`);
  }

  const result = engine.result();
  return {
    seed,
    difficulty,
    style,
    surface,
    player,
    won: result.won,
    durationSeconds: result.duration_sec,
    points: result.stats.points_won + result.opponentStats.points_won,
    playerPoints: result.stats.points_won,
    aiPoints: result.opponentStats.points_won,
    averageRally: result.rally_lengths.length
      ? result.rally_lengths.reduce((sum, length) => sum + length, 0) / result.rally_lengths.length
      : 0,
    longestRally: Math.max(0, ...result.rally_lengths),
    playerErrors: result.stats.errors + result.stats.double_faults,
    aiErrors: result.opponentStats.errors + result.opponentStats.double_faults,
    playerAces: result.stats.aces,
    aiAces: result.opponentStats.aces,
  };
}
