import * as THREE from "three";

// Contoured cross-sections keep the silhouette anatomical rather than capsule-shaped.
export function contour(parent, sections, material, segments = 20) {
  const points = [], uv = [], indices = [];
  sections.forEach(([y, rx, rz, cx = 0, cz = 0], row) => {
    for (let i = 0; i <= segments; i++) {
      const angle = i / segments * Math.PI * 2;
      points.push(cx + Math.cos(angle) * rx, y, cz + Math.sin(angle) * rz);
      uv.push(i / segments, row / (sections.length - 1));
      if (row && i < segments) {
        const a = (row - 1) * (segments + 1) + i, b = row * (segments + 1) + i;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return addMesh(parent, geo, material);
}

export function addMesh(parent, geometry, material, position = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function ellipsoid(parent, material, position, scale, detail = 16) {
  const mesh = addMesh(parent, new THREE.SphereGeometry(1, detail, 12), material, position);
  mesh.scale.set(...scale);
  return mesh;
}

export function joint(parent, position) {
  const group = new THREE.Group();
  group.position.set(...position);
  parent.add(group);
  return group;
}

export function fabricTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#bcbcbc"; ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 128; i += 2) {
    ctx.fillStyle = i % 4 ? "#aaaaaa" : "#d4d4d4";
    ctx.fillRect(i, 0, 1, 128); ctx.fillRect(0, i, 128, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 5);
  return tex;
}

export function makeRacket(materials) {
  const group = new THREE.Group();
  const { dark, white, accent } = materials;
  addMesh(group, new THREE.CylinderGeometry(0.024, 0.026, 0.2, 12), dark, [0, 0.04, 0]);
  for (let i = 0; i < 7; i++) {
    const wrap = addMesh(group, new THREE.TorusGeometry(0.025, 0.002, 4, 12), white, [0, -0.045 + i * 0.026, 0]);
    wrap.rotation.x = Math.PI / 2;
  }
  [-1, 1].forEach(s => {
    const neck = addMesh(group, new THREE.CylinderGeometry(0.011, 0.014, 0.22, 8), accent, [s * 0.047, 0.22, 0]);
    neck.rotation.z = -s * 0.42;
  });
  const hoop = addMesh(group, new THREE.TorusGeometry(0.17, 0.014, 8, 40), accent, [0, 0.46, 0]);
  hoop.scale.y = 1.3;
  const stringPoints = [];
  for (let n = -7; n <= 7; n++) {
    const v = n / 8, extent = Math.sqrt(1 - v * v);
    stringPoints.push(v * 0.158, 0.46 - extent * 0.207, 0, v * 0.158, 0.46 + extent * 0.207, 0);
    stringPoints.push(-extent * 0.158, 0.46 + v * 0.207, 0, extent * 0.158, 0.46 + v * 0.207, 0);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(stringPoints, 3));
  group.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xeeeece, transparent: true, opacity: 0.7 })));
  return group;
}