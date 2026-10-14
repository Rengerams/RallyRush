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

export function makeLabel(text, color, scale = 1) {
  const tex = textTexture(text.toUpperCase(), { w: 512, h: 96, font: "800 64px 'JetBrains Mono', monospace", color });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(2.4 * scale, 0.45 * scale, 1);
  s.position.y = 2.2 + 0.25 * scale;
  return s;
}
