const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function animatePlayer(mesh, entity, facing, time, context) {
  const rig = mesh.userData.rig;
  if (!rig) return;
  const { pelvis, torso, head, leftArm, rightArm, leftLeg, rightLeg } = rig;
  const speed = Math.hypot(entity.vx || 0, entity.vz || 0);
  const run = clamp(speed / 5, 0, 1), cycle = time * (entity.sprint ? 15 : 11);
  const stride = Math.sin(cycle) * run;
  // The swing timer starts at contact, so the racket reaches its stroke pose on the same frame as the hit.
  const swing = entity.swing > 0
    ? Math.cos(clamp((1 - entity.swing / 0.25) * Math.PI / 2, 0, Math.PI / 2))
    : 0;
  const backhand = entity.side === -1;
  const turn = (entity.side || 1) * swing;
  mesh.position.set(entity.x, 0, entity.z);
  mesh.rotation.y = facing + clamp((entity.vx || 0) * 0.03, -0.2, 0.2);
  pelvis.position.y = 0.94 + Math.abs(Math.sin(cycle)) * run * 0.035 - (entity.sliding > 0 ? 0.1 : 0);
  torso.rotation.set(-0.1 - run * 0.09, turn * 0.62, stride * 0.035);
  head.rotation.y = clamp((context.ball.x - entity.x) * 0.06, -0.4, 0.4) - turn * 0.3;
  [leftLeg, rightLeg].forEach((leg, i) => {
    const step = stride * (i ? -1 : 1);
    leg.hip.rotation.set(0.1 + step * 0.64, 0, i ? 0.12 : -0.12);
    leg.knee.rotation.x = -0.2 - Math.max(0, step) * 0.7;
    leg.foot.rotation.x = -step * 0.25;
  });
  leftArm.shoulder.rotation.set(0.22 - stride * 0.38, -0.15 - turn * 0.4 - (backhand ? swing * 0.28 : 0), -0.16);
  leftArm.elbow.rotation.x = 0.75 + run * 0.2 - (backhand ? swing * 0.22 : 0);
  rightArm.shoulder.rotation.set(
    0.3 + stride * 0.28 + swing * (backhand ? 0.25 : 0.55),
    turn * 1.1,
    0.24 + swing * (backhand ? -0.12 : 0.3)
  );
  rightArm.elbow.rotation.x = 0.95 - swing * (backhand ? 0.22 : 0.4);
  rightArm.hand.rotation.set(-0.15, 0, -0.2 + turn * 0.35);
  if (context.serving && context.toss) {
    const tossRise = clamp((context.ball.y - 1) / 1.38, 0, 1);
    leftArm.shoulder.rotation.set(2.35 + tossRise * 0.22, -0.08, -0.12);
    leftArm.elbow.rotation.x = 0.12 + tossRise * 0.08;
    rightArm.shoulder.rotation.set(2.2 + tossRise * 0.12, -0.28, 0.48);
    rightArm.elbow.rotation.x = 1.22 - tossRise * 0.18;
    torso.rotation.set(-0.16, -0.48, stride * 0.035);
    pelvis.position.y -= Math.sin(tossRise * Math.PI) * 0.045;
  }
  if (entity.overhead && swing && entity.serveSwing) {
    // At contact the racket arm is extended above the shoulder; it then folds
    // across the body in a short overhead follow-through.
    rightArm.shoulder.rotation.set(-1.08 + swing * 3.25, 0.18, 0.22 + swing * 0.22);
    rightArm.elbow.rotation.x = 0.88 - swing * 0.72;
    leftArm.shoulder.rotation.set(0.55 + swing * 0.75, -0.12, -0.2);
    leftArm.elbow.rotation.x = 0.55;
    torso.rotation.set(-0.12 - swing * 0.22, 0.42 - swing * 0.9, stride * 0.035);
    pelvis.position.y += swing * 0.035;
  } else if (entity.overhead && swing) {
    rightArm.shoulder.rotation.x = -2.7 + swing * 4;
    rightArm.elbow.rotation.x = 0.2;
  }
}
