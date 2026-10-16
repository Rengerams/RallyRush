import { describe, expect, it } from "vitest";
import { animatePlayer } from "../three/animatePlayer";

const makeRotation = () => ({
  x: 0, y: 0, z: 0,
  set(x, y, z) { this.x = x; this.y = y; this.z = z; },
});

function makeLimb() {
  return { shoulder: { rotation: makeRotation() }, elbow: { rotation: makeRotation() }, hand: { rotation: makeRotation() } };
}

function makeMesh() {
  const rig = {
    pelvis: { position: { y: 0, set() {} } },
    torso: { rotation: makeRotation() },
    head: { rotation: { y: 0 } },
    leftArm: makeLimb(),
    rightArm: makeLimb(),
    leftLeg: { hip: { rotation: makeRotation() }, knee: { rotation: makeRotation() }, foot: { rotation: makeRotation() } },
    rightLeg: { hip: { rotation: makeRotation() }, knee: { rotation: makeRotation() }, foot: { rotation: makeRotation() } },
  };
  return { userData: { rig }, position: { set() {} }, rotation: { y: 0 } };
}

const idleEntity = { x: 0, z: 12, vx: 0, vz: 0, swing: 0, side: 1, sliding: 0, sprint: false };

describe("serve animation", () => {
  it("holds a visible toss arm and a cocked racket arm before contact", () => {
    const mesh = makeMesh();
    animatePlayer(mesh, idleEntity, 0, 0, { ball: { x: 0, y: 2.2 }, toss: true, serving: true });

    expect(mesh.userData.rig.leftArm.shoulder.rotation.x).toBeGreaterThan(2.4);
    expect(mesh.userData.rig.rightArm.shoulder.rotation.x).toBeGreaterThan(2.2);
    expect(mesh.userData.rig.rightArm.elbow.rotation.x).toBeGreaterThan(1);
  });

  it("extends the racket arm at serve contact and folds it through afterward", () => {
    const atContact = makeMesh();
    animatePlayer(atContact, { ...idleEntity, swing: 0.25, overhead: true, serveSwing: true }, 0, 0, { ball: { x: 0, y: 2.3 }, toss: false, serving: false });
    const through = makeMesh();
    animatePlayer(through, { ...idleEntity, swing: 0.05, overhead: true, serveSwing: true }, 0, 0, { ball: { x: 0, y: 2 }, toss: false, serving: false });

    expect(atContact.userData.rig.rightArm.shoulder.rotation.x).toBeGreaterThan(2);
    expect(through.userData.rig.rightArm.shoulder.rotation.x).toBeLessThan(atContact.userData.rig.rightArm.shoulder.rotation.x);
    expect(through.userData.rig.rightArm.elbow.rotation.x).toBeGreaterThan(atContact.userData.rig.rightArm.elbow.rotation.x);
  });
});
