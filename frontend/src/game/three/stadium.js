import * as THREE from "three";
import { COURT } from "../constants";
import { textTexture, plane } from "./parts";
import { addOfficials } from "./officials";

/* ── Court lines (white, slightly raised) ──────── */
function lines(scene) {
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const { doublesHalfW: D, singlesHalfW: W, halfLen: L, serviceLine: SL } = COURT;
  const lw = 0.06;
  const seg = (x1, z1, x2, z2) => {
    const w = Math.abs(x2 - x1) || lw;
    const d = Math.abs(z2 - z1) || lw;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set((x1 + x2) / 2, 0.013, (z1 + z2) / 2);
    scene.add(m);
  };
  seg(-D, -L, D, -L); seg(-D, L, D, L);
  seg(-D, -L, -D, L); seg(D, -L, D, L);
  seg(-W, -L, -W, L); seg(W, -L, W, L);
  seg(-W, -SL, W, -SL); seg(-W, SL, W, SL);
  seg(0, -SL, 0, SL);
  seg(0, -L, 0, -L + 0.3); seg(0, L, 0, L - 0.3);
}

/* ── Net with posts and tape ───────────────────── */
function net(scene) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  g.clearRect(0, 0, 64, 64);
  g.strokeStyle = "rgba(22,28,32,0.85)";
  g.lineWidth = 1.2;
  for (let i = 0; i <= 64; i += 10) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 64);
    g.moveTo(0, i); g.lineTo(64, i); g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(64, 5);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(12.8, COURT.netH),
    new THREE.MeshStandardMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, alphaTest: 0.1 })
  );
  mesh.position.y = COURT.netH / 2;
  mesh.castShadow = true;
  scene.add(mesh);
  const tape = new THREE.Mesh(
    new THREE.BoxGeometry(12.8, 0.07, 0.03),
    new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.3 })
  );
  tape.position.y = COURT.netH;
  scene.add(tape);
  [-6.4, 6.4].forEach((x) => {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1.07),
      new THREE.MeshStandardMaterial({ color: 0x263238, metalness: 0.6, roughness: 0.3 })
    );
    post.position.set(x, 0.535, 0);
    post.castShadow = true;
    scene.add(post);
  });
}

/* ── Umpire chair ──────────────────────────────── */
function umpireChair(scene) {
  const metal = new THREE.MeshStandardMaterial({ color: 0x78909c, metalness: 0.7, roughness: 0.3 });
  const seat = new THREE.MeshStandardMaterial({ color: 0x1a237e, roughness: 0.6 });
  const grp = new THREE.Group();
  [[-0.22, -0.18], [0.22, -0.18], [-0.22, 0.18], [0.22, 0.18]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.6), metal);
    leg.position.set(x, 1.3, z);
    grp.add(leg);
  });
  const seatPad = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.45), seat);
  seatPad.position.set(0, 2.4, 0);
  grp.add(seatPad);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.05), seat);
  back.position.set(0, 2.7, -0.2);
  grp.add(back);
  const shade = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.03, 0.7), seat);
  shade.position.set(0, 3.1, 0);
  grp.add(shade);
  [0.7, 1.4].forEach((y) => {
    const step = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.25), metal);
    step.position.set(0, y, 0.3);
    grp.add(step);
  });
  grp.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  grp.position.set(-7.5, 0, 0);
  scene.add(grp);
}

/* ── Watermark on court ────────────────────────── */
function watermark(scene) {
  const tex = textTexture("RALLY RUSH", { color: "rgba(255,255,255,0.18)" });
  [13.2, -13.2].forEach((z) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 1.4),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
    );
    m.rotation.x = -Math.PI / 2;
    if (z < 0) m.rotation.z = Math.PI;
    m.position.set(0, 0.014, z);
    scene.add(m);
  });
}

/* ── Advertising boards ────────────────────────── */
function boards(scene) {
  const tex = textTexture("RALLY RUSH  ·  ARCADE TENNIS", {
    w: 2048, h: 128,
    font: "italic 900 96px 'Barlow Condensed', sans-serif",
    color: "#0D47A1", bg: "#FFD600"
  });
  [-16, 16].forEach((z) => {
    const mats = [0, 0, 0, 0, 1, 1].map((i) =>
      i ? new THREE.MeshBasicMaterial({ map: tex })
        : new THREE.MeshStandardMaterial({ color: 0x0d1b2a })
    );
    const b = new THREE.Mesh(new THREE.BoxGeometry(20, 0.9, 0.2), mats);
    b.position.set(0, 0.45, z);
    scene.add(b);
  });
  const side = textTexture("ARCADE TENNIS", {
    w: 1024, h: 128,
    font: "800 80px 'JetBrains Mono', monospace",
    color: "#FFD600", bg: "#0D47A1"
  });
  [-8.8, 8.8].forEach((x) => {
    const b = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 0.8),
      new THREE.MeshBasicMaterial({ map: side })
    );
    b.position.set(x, 0.4, 7);
    b.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
    scene.add(b);
    const b2 = b.clone();
    b2.position.z = -7;
    scene.add(b2);
  });
}

const CROWD_LIMIT = 1200;

/* ── Stands + crowd ────────────────────────────── */
function sideStands(scene, structMat, crowd, base, crowdColors, m4, col, startN) {
  let n = startN;
  [-1, 1].forEach((side) => {
    for (let r = 0; r < 7; r++) {
      const h = 0.6 + r * 0.6;
      const step = new THREE.Mesh(new THREE.BoxGeometry(1.2, h, 30), structMat);
      step.position.set(side * (9.5 + r * 1.2), h / 2, 0);
      step.receiveShadow = true;
      scene.add(step);
      const seatStrip = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.08, 29.5),
        new THREE.MeshLambertMaterial({ color: new THREE.Color().setHSL(0.6, 0.55, 0.17 + r * 0.022) })
      );
      seatStrip.position.set(side * (9.5 + r * 1.2), h + 0.04, 0);
      scene.add(seatStrip);
      for (let z = -14; z <= 14 && n < CROWD_LIMIT; z += 0.5) {
        if (Math.random() < 0.14) continue;
        const pos = new THREE.Vector3(
          side * (9.5 + r * 1.2) + (Math.random() - 0.5) * 0.3,
          h + 0.38, z + (Math.random() - 0.5) * 0.15
        );
        base.push({ pos, ph: Math.random() * 6.28, headScale: 0.085 + ((n * 17) % 5) * 0.008 });
        m4.makeTranslation(pos.x, pos.y, pos.z);
        crowd.setMatrixAt(n, m4);
        crowd.setColorAt(n, col.setHex(crowdColors[n % crowdColors.length]));
        n++;
      }
    }
  });
  return n;
}

function backStands(scene, structMat, crowd, base, crowdColors, m4, col, startN) {
  let n = startN;
  [-1, 1].forEach((end) => {
    for (let r = 0; r < 4; r++) {
      const h = 0.6 + r * 0.6;
      const step = new THREE.Mesh(new THREE.BoxGeometry(16, h, 1.2), structMat);
      step.position.set(0, h / 2, end * (15.5 + r * 1.2));
      step.receiveShadow = true;
      scene.add(step);
      for (let x = -7; x <= 7 && n < CROWD_LIMIT; x += 0.5) {
        if (Math.random() < 0.18) continue;
        const pos = new THREE.Vector3(
          x + (Math.random() - 0.5) * 0.2,
          h + 0.38, end * (15.5 + r * 1.2)
        );
        base.push({ pos, ph: Math.random() * 6.28, headScale: 0.085 + ((n * 17) % 5) * 0.008 });
        m4.makeTranslation(pos.x, pos.y, pos.z);
        crowd.setMatrixAt(n, m4);
        crowd.setColorAt(n, col.setHex(crowdColors[n % crowdColors.length]));
        n++;
      }
    }
  });
  return n;
}

function stands(scene) {
  const structMat = new THREE.MeshLambertMaterial({ color: 0x0d1b2a });
  const crowdColors = [0x1565c0, 0xffd600, 0x00e5ff, 0xeceff1, 0x90a4ae, 0xff8f00, 0xef5350, 0x66bb6a];
  const crowd = new THREE.InstancedMesh(
    new THREE.CapsuleGeometry(0.2, 0.32, 1, 5),
    new THREE.MeshLambertMaterial(),
    CROWD_LIMIT
  );
  const crowdHeads = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.12, 8, 6),
    new THREE.MeshLambertMaterial(),
    CROWD_LIMIT
  );
  const skinColors = [0xf0c8a0, 0xdba37a, 0xb97a55, 0x80543c, 0xe1b88f];
  const base = [];
  const m4 = new THREE.Matrix4();
  const col = new THREE.Color();

  let n = sideStands(scene, structMat, crowd, base, crowdColors, m4, col, 0);
  n = backStands(scene, structMat, crowd, base, crowdColors, m4, col, n);

  crowd.count = n;
  crowdHeads.count = n;
  base.forEach(({ pos, ph }, i) => {
    const headScale = base[i].headScale;
    const headY = pos.y + 0.49;
    m4.makeScale(headScale, headScale * 1.08, headScale);
    m4.setPosition(pos.x, headY, pos.z);
    crowdHeads.setMatrixAt(i, m4);
    crowdHeads.setColorAt(i, col.setHex(skinColors[(i * 7 + Math.floor(ph)) % skinColors.length]));
  });
  crowd.instanceMatrix.needsUpdate = true;
  crowdHeads.instanceMatrix.needsUpdate = true;
  scene.add(crowd, crowdHeads);
  return { crowd, crowdHeads, base };
}

/* ── Canopy / roof over stands ─────────────────── */
function canopy(scene) {
  // Only the far grandstand has a roof. Side roofs intersect gameplay camera sightlines.
  const roof = new THREE.Mesh(new THREE.BoxGeometry(21, 0.15, 4), new THREE.MeshLambertMaterial({ color: 0x233b49 }));
  roof.position.set(0, 6, -22);
  scene.add(roof);
}

/* ── Stadium lights (visual) ───────────────────── */
function lightPoles(scene) {
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x455a64 });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xfffde7 });
  [[-18, -16], [-18, 16], [18, -16], [18, 16]].forEach(([x, z]) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 12), poleMat);
    pole.position.set(x, 6, z);
    scene.add(pole);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.8), glowMat);
    lamp.position.set(x, 12, z);
    scene.add(lamp);
  });
}

/* ── Procedural court surface ───────────────────── */
function courtSurface(scene, surf) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  const base = new THREE.Color(surf.color);
  const bands = surf.id === "grass" || surf.id === "artificial" ? 0.045 : 0.022;

  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 16; i++) {
    const shade = base.clone().multiplyScalar(i % 2 ? 1 + bands : 1 - bands);
    ctx.fillStyle = `#${shade.getHexString()}`;
    ctx.fillRect(0, i * 64, canvas.width, 64);
  }

  // Fine, repeatable surface grain keeps the court from reading as a flat color.
  let seed = 173;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 900; i++) {
    const light = random() > 0.5;
    ctx.fillStyle = light ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.035)";
    const size = surf.id === "clay" ? 1 + random() * 2 : 1;
    ctx.fillRect(random() * canvas.width, random() * canvas.height, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const surface = new THREE.Mesh(
    new THREE.PlaneGeometry(2 * COURT.doublesHalfW, 2 * COURT.halfLen),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.88 })
  );
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = 0.005;
  surface.receiveShadow = true;
  scene.add(surface);
}

/* ── Main build ────────────────────────────────── */
export function buildStadium(scene, surf) {
  scene.add(plane(120, 120, 0x071018, -0.02));
  scene.add(plane(22, 36, surf.outer, 0));
  courtSurface(scene, surf);
  lines(scene);
  watermark(scene);
  net(scene);
  boards(scene);
  umpireChair(scene);
  addOfficials(scene);
  canopy(scene);
  lightPoles(scene);
  return stands(scene);
}
