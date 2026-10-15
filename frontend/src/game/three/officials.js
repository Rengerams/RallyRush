import * as THREE from "three";

const UP = new THREE.Vector3(0, 1, 0);

function addLimb(parent, start, end, material, radius = 0.055) {
  const from = new THREE.Vector3(...start);
  const to = new THREE.Vector3(...end);
  const direction = to.clone().sub(from);
  const length = direction.length();
  const mesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(radius, Math.max(0.02, length - radius * 2), 2, 6),
    material
  );
  mesh.position.copy(from.add(to).multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(UP, direction.normalize());
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function makeOfficial({ chair = false } = {}) {
  const person = new THREE.Group();
  const jacket = new THREE.MeshStandardMaterial({ color: chair ? 0x17364d : 0x203442, roughness: 0.82 });
  const trousers = new THREE.MeshStandardMaterial({ color: 0x17232d, roughness: 0.9 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xb77955, roughness: 0.75 });
  const hair = new THREE.MeshStandardMaterial({ color: 0x202126, roughness: 0.95 });
  const shirt = new THREE.MeshStandardMaterial({ color: 0xdfff00, roughness: 0.78 });
  const shoe = new THREE.MeshStandardMaterial({ color: 0x111820, roughness: 0.6 });

  const torsoY = chair ? 0.62 : 1.02;
  const headY = chair ? 1.18 : 1.55;
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, chair ? 0.38 : 0.48, 2, 8), jacket);
  torso.position.y = torsoY;
  torso.castShadow = true;
  person.add(torso);

  const vest = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.026), shirt);
  vest.position.set(0, torsoY + 0.06, -0.18);
  person.add(vest);
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.018), new THREE.MeshBasicMaterial({ color: 0xeaf7ff }));
  badge.position.set(0.07, torsoY + 0.1, -0.202);
  person.add(badge);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.12, 8), skin);
  neck.position.y = headY - 0.19;
  person.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), skin);
  head.position.y = headY;
  head.castShadow = true;
  person.add(head);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.045, 10), hair);
  cap.position.y = headY + 0.12;
  person.add(cap);
  const brim = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.025, 0.15), hair);
  brim.position.set(0, headY + 0.09, -0.08);
  person.add(brim);

  if (chair) {
    addLimb(person, [-0.19, 0.88, 0], [-0.27, 0.55, -0.22], jacket);
    addLimb(person, [0.19, 0.88, 0], [0.27, 0.55, -0.22], jacket);
    addLimb(person, [-0.1, 0.4, 0], [-0.1, 0.2, -0.38], trousers, 0.07);
    addLimb(person, [0.1, 0.4, 0], [0.1, 0.2, -0.38], trousers, 0.07);
    addLimb(person, [-0.1, 0.2, -0.38], [-0.1, -0.68, -0.48], trousers, 0.06);
    addLimb(person, [0.1, 0.2, -0.38], [0.1, -0.68, -0.48], trousers, 0.06);
    [-0.1, 0.1].forEach((x) => {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.24), shoe);
      foot.position.set(x, -0.71, -0.53);
      person.add(foot);
    });
  } else {
    addLimb(person, [-0.2, 1.22, 0], [-0.27, 0.77, -0.06], jacket);
    addLimb(person, [0.2, 1.22, 0], [0.27, 0.77, -0.06], jacket);
    addLimb(person, [-0.1, 0.66, 0], [-0.11, 0.12, 0.02], trousers, 0.07);
    addLimb(person, [0.1, 0.66, 0], [0.11, 0.12, 0.02], trousers, 0.07);
    [-0.11, 0.11].forEach((x) => {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.24), shoe);
      foot.position.set(x, 0.08, -0.05);
      person.add(foot);
    });
  }

  person.traverse((part) => { if (part.isMesh) part.castShadow = true; });
  return person;
}

export function addOfficials(scene) {
  const chairOfficial = makeOfficial({ chair: true });
  chairOfficial.position.set(-7.5, 2.42, 0);
  chairOfficial.rotation.y = -Math.PI / 2;
  scene.add(chairOfficial);

  const positions = [
    [-6.2, -12.3], [6.2, -12.3], [-6.2, 12.3], [6.2, 12.3],
    [-6.3, -5.8], [6.3, -5.8], [-6.3, 5.8], [6.3, 5.8],
  ];
  positions.forEach(([x, z]) => {
    const judge = makeOfficial();
    judge.position.set(x, 0, z);
    const towardCourt = new THREE.Vector3(-x, 0, -z).normalize();
    judge.rotation.y = Math.atan2(-towardCourt.x, -towardCourt.z);
    scene.add(judge);
  });
}
