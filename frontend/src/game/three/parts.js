import * as THREE from "three";

export function textTexture(text, { w = 1024, h = 160, font = "900 120px 'Barlow Condensed', sans-serif", color = "#ffffff", bg = null } = {}) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  g.font = font;
  g.fillStyle = color;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, w / 2, h / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function plane(w, d, color, y = 0, opts = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...opts }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  m.receiveShadow = true;
  return m;
}

export function makePlayer(color, legend) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: legend ? 0.5 : 0.15, emissive: legend ? 0x553a00 : 0x000000 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xf1d7b5, roughness: 0.65 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.6 });
  const legs = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.6, 4, 10), dark);
  legs.position.y = 0.48;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.27, 0.5, 4, 12), mat);
  body.position.y = 1.15;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), skin);
  head.position.y = 1.72;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  cap.position.y = 1.76;
  [legs, body, head, cap].forEach((m) => { m.castShadow = true; g.add(m); });
  const arm = new THREE.Group();
  arm.position.set(0, 1.3, 0);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.55), dark);
  handle.rotation.z = Math.PI / 2;
  handle.position.x = 0.55;
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.022, 8, 24), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.4, roughness: 0.3 }));
  frame.scale.set(1.25, 1, 1);
  frame.position.x = 0.98;
  frame.rotation.y = Math.PI / 2;
  const strings = new THREE.Mesh(new THREE.CircleGeometry(0.16, 20), new THREE.MeshBasicMaterial({ color: 0xdfff00, transparent: true, opacity: 0.25, side: THREE.DoubleSide }));
  strings.scale.set(1.25, 1, 1);
  strings.position.copy(frame.position);
  strings.rotation.y = Math.PI / 2;
  [handle, frame].forEach((m) => { m.castShadow = true; arm.add(m); });
  arm.add(strings);
  g.add(arm);
  g.userData.arm = arm;
  if (legend) {
    const aura = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.8, 40), new THREE.MeshBasicMaterial({ color: 0xffc828, transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.02;
    g.add(aura);
    g.userData.aura = aura;
  }
  return g;
}

export function makeLabel(text, color, scale = 1) {
  const tex = textTexture(text.toUpperCase(), { w: 512, h: 96, font: "800 64px 'JetBrains Mono', monospace", color });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(2.4 * scale, 0.45 * scale, 1);
  s.position.y = 2.2 + 0.25 * scale;
  return s;
}
