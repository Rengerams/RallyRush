import * as THREE from "three";
import { COURT } from "../constants";
import { textTexture, plane } from "./parts";

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
  g.fillStyle = "rgba(235,235,235,0.88)";
  g.fillRect(0, 0, 64, 64);
  g.strokeStyle = "rgba(30,30,30,0.55)";
  g.lineWidth = 2;
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
  const tex = textTexture("RENFFR OPEN", { color: "rgba(255,255,255,0.18)" });
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
  const tex = textTexture("RENFFR OPEN  ·  RENFFR OPEN", {
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
  const side = textTexture("renffr edition", {
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
      for (let z = -14; z <= 14 && n < 850; z += 0.55) {
        if (Math.random() < 0.14) continue;
        const pos = new THREE.Vector3(
          side * (9.5 + r * 1.2) + (Math.random() - 0.5) * 0.3,
          h + 0.38, z + (Math.random() - 0.5) * 0.15
        );
        base.push({ pos, ph: Math.random() * 6.28 });
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
      for (let x = -7; x <= 7 && n < 850; x += 0.6) {
        if (Math.random() < 0.18) continue;
        const pos = new THREE.Vector3(
          x + (Math.random() - 0.5) * 0.2,
          h + 0.38, end * (15.5 + r * 1.2)
        );
        base.push({ pos, ph: Math.random() * 6.28 });
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
    850
  );
  const base = [];
  const m4 = new THREE.Matrix4();
  const col = new THREE.Color();

  let n = sideStands(scene, structMat, crowd, base, crowdColors, m4, col, 0);
  n = backStands(scene, structMat, crowd, base, crowdColors, m4, col, n);

  crowd.count = n;
  scene.add(crowd);
  return { crowd, base };
}

/* ── Canopy / roof over stands ─────────────────── */
function canopy(scene) {
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x0d2137 });
  const pillarMat = new THREE.MeshLambertMaterial({ color: 0x37474f });
  [-1, 1].forEach((side) => {
    const roof = new THREE.Mesh(new THREE.BoxGeometry(10, 0.12, 32), roofMat);
    roof.position.set(side * 14.5, 7.2, 0);
    scene.add(roof);
    const edge = new THREE.Mesh(
      new THREE.BoxGeometry(10, 0.2, 0.06),
      new THREE.MeshBasicMaterial({ color: 0x1565c0 })
    );
    edge.position.set(side * 14.5, 7.08, side > 0 ? -16 : 16);
    scene.add(edge);
    for (let z = -14; z <= 14; z += 7) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 7.2), pillarMat);
      p.position.set(side * 18, 3.6, z);
      scene.add(p);
    }
  });
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

/* ── Main build ────────────────────────────────── */
export function buildStadium(scene, surf) {
  scene.add(plane(120, 120, 0x071018, -0.02));
  scene.add(plane(22, 36, surf.outer, 0));
  scene.add(plane(2 * COURT.doublesHalfW, 2 * COURT.halfLen, surf.color, 0.005));
  if (surf.id === "grass" || surf.id === "artificial") {
    for (let z = -COURT.halfLen; z < COURT.halfLen; z += 2.4) {
      const s = plane(2 * COURT.doublesHalfW, 1.2, 0xffffff, 0.007, { transparent: true, opacity: 0.04 });
      s.position.z = z + 0.6;
      scene.add(s);
    }
  }
  lines(scene);
  watermark(scene);
  net(scene);
  boards(scene);
  umpireChair(scene);
  canopy(scene);
  lightPoles(scene);
  return stands(scene);
}
