import * as THREE from "three";
import { addMesh, contour, ellipsoid, joint, fabricTexture, makeRacket } from "./anatomy";
import { textTexture } from "./parts";

function materials(color, opponent) {
  const weave = fabricTexture();
  const cloth = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, bumpMap: weave, bumpScale: 0.0015 });
  return {
    shirt: cloth(color), shorts: cloth(opponent ? 0xf1eee7 : 0x17202b), white: cloth(0xf4f3ed),
    skin: new THREE.MeshStandardMaterial({ color: opponent ? 0x9e6647 : 0xc58d6b, roughness: 0.7 }),
    hair: new THREE.MeshStandardMaterial({ color: opponent ? 0x161310 : 0x30221b, roughness: 0.95 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x20262b, roughness: 0.6 }),
    eye: new THREE.MeshStandardMaterial({ color: 0x2a201b, roughness: 0.3 }),
    accent: new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.25 }),
  };
}

function head(parent, m) {
  const group = joint(parent, [0, 0.58, 0]);
  contour(group, [[-0.03, 0.065, 0.066], [0.05, 0.07, 0.07], [0.085, 0.062, 0.066]], m.skin);
  contour(group, [[0.05, 0.035, 0.05, 0, -0.009], [0.08, 0.074, 0.072, 0, -0.018], [0.13, 0.1, 0.09], [0.2, 0.107, 0.096], [0.27, 0.093, 0.086], [0.31, 0.06, 0.06], [0.32, 0.001, 0.001]], m.skin, 28);
  // Brow, cheeks, bridge, nostrils and inset eyes survive the replay close-up.
  [-1, 1].forEach(s => {
    ellipsoid(group, m.skin, [s * 0.105, 0.166, 0], [0.022, 0.035, 0.02]);
    ellipsoid(group, m.skin, [s * 0.05, 0.144, -0.066], [0.037, 0.025, 0.025]);
    ellipsoid(group, m.white, [s * 0.042, 0.194, -0.085], [0.021, 0.01, 0.006]);
    ellipsoid(group, m.eye, [s * 0.042, 0.194, -0.091], [0.007, 0.008, 0.002]);
    const brow = ellipsoid(group, m.hair, [s * 0.043, 0.211, -0.085], [0.025, 0.004, 0.005]);
    brow.rotation.z = s * 0.12;
    ellipsoid(group, m.skin, [s * 0.012, 0.157, -0.098], [0.01, 0.009, 0.012]);
  });
  ellipsoid(group, m.skin, [0, 0.175, -0.1], [0.012, 0.029, 0.022]);
  ellipsoid(group, m.skin, [0, 0.149, -0.11], [0.019, 0.013, 0.015]);
  ellipsoid(group, m.hair, [0, 0.113, -0.087], [0.03, 0.002, 0.002]);
  const hair = addMesh(group, new THREE.SphereGeometry(1, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.56), m.hair, [0, 0.234, 0.011]);
  hair.scale.set(0.108, 0.099, 0.098);
  const band = addMesh(group, new THREE.CylinderGeometry(0.11, 0.11, 0.029, 32, 1, true), m.white, [0, 0.233, 0.006]);
  band.scale.z = 0.93;
  return group;
}

function arm(parent, side, m) {
  const shoulder = joint(parent, [side * 0.215, 0.485, 0]);
  ellipsoid(shoulder, m.shirt, [0, -0.035, 0], [0.108, 0.115, 0.106]);
  contour(shoulder, [[-0.295, 0.047, 0.05], [-0.2, 0.062, 0.066], [-0.12, 0.071, 0.069], [-0.065, 0.075, 0.071]], m.skin);
  contour(shoulder, [[-0.145, 0.08, 0.077], [-0.075, 0.097, 0.091], [0, 0.088, 0.085]], m.shirt);
  const elbow = joint(shoulder, [0, -0.285, 0]);
  ellipsoid(elbow, m.skin, [0, 0, 0], [0.051, 0.056, 0.054]);
  contour(elbow, [[-0.26, 0.027, 0.031], [-0.19, 0.036, 0.038], [-0.07, 0.052, 0.052], [0, 0.049, 0.05]], m.skin);
  addMesh(elbow, new THREE.CylinderGeometry(0.038, 0.035, 0.065, 16), m.white, [0, -0.205, 0]);
  const hand = joint(elbow, [0, -0.285, 0]);
  ellipsoid(hand, m.skin, [0, -0.01, 0], [0.038, 0.055, 0.024]);
  for (let i = 0; i < 4; i++) ellipsoid(hand, m.skin, [-0.025 + i * 0.016, -0.056, -0.012], [0.009, 0.03, 0.012], 8);
  ellipsoid(hand, m.skin, [side * 0.033, -0.018, -0.017], [0.014, 0.033, 0.014]);
  return { shoulder, elbow, hand };
}

function leg(parent, side, m) {
  const hip = joint(parent, [side * 0.105, 0, 0]);
  contour(hip, [[-0.43, 0.06, 0.068], [-0.32, 0.075, 0.083], [-0.17, 0.097, 0.098], [0, 0.108, 0.105]], m.skin);
  contour(hip, [[-0.27, 0.105, 0.11], [-0.19, 0.116, 0.118], [-0.02, 0.117, 0.12], [0.025, 0.105, 0.11]], m.shorts);
  const knee = joint(hip, [0, -0.415, 0]);
  ellipsoid(knee, m.skin, [0, 0, -0.01], [0.062, 0.065, 0.073]);
  contour(knee, [[-0.39, 0.035, 0.04], [-0.29, 0.043, 0.046], [-0.16, 0.066, 0.074, 0, 0.015], [-0.05, 0.061, 0.064], [0, 0.056, 0.062]], m.skin);
  contour(knee, [[-0.41, 0.042, 0.049], [-0.24, 0.05, 0.053], [-0.215, 0.052, 0.055]], m.white);
  const foot = joint(knee, [0, -0.385, 0]);
  ellipsoid(foot, m.white, [0, -0.032, -0.043], [0.065, 0.071, 0.132]);
  ellipsoid(foot, m.dark, [0, -0.079, -0.052], [0.069, 0.025, 0.136]);
  ellipsoid(foot, m.accent, [side * 0.059, -0.028, -0.05], [0.006, 0.02, 0.075]);
  for (let i = 0; i < 4; i++) {
    const lace = addMesh(foot, new THREE.BoxGeometry(0.055, 0.004, 0.006), m.dark, [0, 0.026 - i * 0.006, -0.038 - i * 0.02]);
    lace.rotation.z = (i % 2 ? -1 : 1) * 0.14;
  }
  return { hip, knee, foot };
}

export function createAthlete(color, legend, opponent = false) {
  const model = new THREE.Group(), m = materials(color, opponent);
  const pelvis = joint(model, [0, 0.96, 0]);
  const torso = joint(pelvis, [0, 0, 0]);
  contour(torso, [[-0.07, 0.198, 0.116], [0.04, 0.182, 0.108], [0.2, 0.18, 0.104], [0.36, 0.222, 0.122], [0.47, 0.243, 0.117], [0.52, 0.204, 0.098], [0.58, 0.071, 0.066]], m.shirt, 28);
  contour(torso, [[0.565, 0.076, 0.071], [0.59, 0.074, 0.07]], m.white);
  const logoMat = new THREE.MeshBasicMaterial({ map: textTexture("R /", { w: 128, h: 64, font: "900 48px sans-serif" }), transparent: true, side: THREE.DoubleSide });
  addMesh(torso, new THREE.PlaneGeometry(0.09, 0.045), logoMat, [0.12, 0.425, -0.11]).rotation.y = Math.PI;
  const back = new THREE.MeshBasicMaterial({ map: textTexture(legend ? "RENFFR" : "OPEN", { w: 256, h: 64, font: "700 46px sans-serif" }), transparent: true });
  addMesh(torso, new THREE.PlaneGeometry(0.25, 0.06), back, [0, 0.38, 0.125]);
  const leftArm = arm(torso, -1, m), rightArm = arm(torso, 1, m);
  const leftLeg = leg(pelvis, -1, m), rightLeg = leg(pelvis, 1, m);
  const racket = makeRacket(m);
  racket.position.set(0, -0.042, -0.005);
  racket.rotation.z = Math.PI;
  rightArm.hand.add(racket);
  model.userData.rig = { pelvis, torso, head: head(torso, m), leftArm, rightArm, leftLeg, rightLeg };
  model.userData.modelKind = "articulated-athlete";
  return model;
}