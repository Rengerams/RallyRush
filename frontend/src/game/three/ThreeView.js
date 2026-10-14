import * as THREE from "three";
import { buildStadium } from "./stadium";
import { makePlayer, makeLabel } from "./parts";

const BALL_R = 0.1;

export class ThreeView {
  constructor(canvas, eng) {
    this.eng = eng;
    const dpr = window.devicePixelRatio || 1;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: dpr < 2, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(dpr, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x071222);
    this.scene.fog = new THREE.Fog(0x071222, 35, 80);

    /* 3/4 side-broadcast camera (side + behind player) */
    this.camera = new THREE.PerspectiveCamera(46, 1, 0.1, 200);
    this.camPos = new THREE.Vector3(14, 13, 22);
    this.camLook = new THREE.Vector3(0, 0, -5);

    this.lights();
    this.stadium = buildStadium(this.scene, eng.surf);
    this.actors();
  }

  lights() {
    this.scene.add(new THREE.HemisphereLight(0xb3d9ff, 0x0a1628, 1.4));
    const sun = new THREE.DirectionalLight(0xfff8e7, 2.8);
    sun.position.set(-6, 24, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 20, bottom: -20, near: 1, far: 60 });
    sun.shadow.bias = -0.0004;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0xc5d8ff, 0.6);
    fill.position.set(10, 15, -5);
    this.scene.add(fill);
  }

  actors() {
    this.createPlayers();
    this.createBall();
    this.createEffects();
  }

  createPlayers() {
    const e = this.eng;
    this.pMesh = makePlayer(e.cfg.legend ? 0xffc828 : 0x00e5ff, e.cfg.legend);
    this.pMesh.add(makeLabel(e.names[0], e.cfg.legend ? "#FFC828" : "#F5F5F5"));
    this.aMesh = makePlayer(0xef5350, false);
    this.aMesh.add(makeLabel(e.names[1], "#F5F5F5", 1.8));
    this.scene.add(this.pMesh, this.aMesh);
  }

  createBall() {
    this.ball = new THREE.Mesh(
      new THREE.SphereGeometry(BALL_R, 20, 14),
      new THREE.MeshStandardMaterial({ color: 0xdfff00, emissive: 0x4a5500, roughness: 0.6 })
    );
    this.ball.castShadow = true;
    this.scene.add(this.ball);

    this.shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.16, 20),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4, depthWrite: false })
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.scene.add(this.shadow);

    const tg = new THREE.BufferGeometry();
    tg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(13 * 3), 3));
    this.trail = new THREE.Line(tg, new THREE.LineBasicMaterial({ color: 0xdfff00, transparent: true, opacity: 0.5 }));
    this.trail.frustumCulled = false;
    this.scene.add(this.trail);
  }

  createEffects() {
    this.marks = Array.from({ length: 12 }, () => {
      const m = new THREE.Mesh(
        new THREE.CircleGeometry(0.14, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })
      );
      m.rotation.x = -Math.PI / 2;
      m.scale.set(1.4, 0.8, 1);
      this.scene.add(m);
      return m;
    });

    const ring = (r, color) => {
      const m = new THREE.Mesh(
        new THREE.RingGeometry(r - 0.04, r, 48),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, depthWrite: false })
      );
      m.rotation.x = -Math.PI / 2;
      m.position.y = 0.02;
      this.scene.add(m);
      return m;
    };
    this.reachRing = ring(2.5, 0x00e5ff);
    this.perfectRing = ring(1.04, 0xdfff00);
  }

  setSize(w, h) {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 1 ? 58 : 46;
    this.camera.updateProjectionMatrix();
  }

  pose(mesh, ent, facing, t) {
    mesh.position.set(ent.x, 0, ent.z);
    mesh.rotation.y = facing;
    const prog = ent.swing > 0 ? 1 - ent.swing / 0.25 : 0;
    const arm = mesh.userData.arm;
    arm.rotation.y = ent.swing > 0 ? ent.side * (1.8 - prog * 3.4) : ent.side * 0.9;
    arm.rotation.z = ent.swing > 0 ? 0.3 - prog * 0.5 : -0.2;
    if (mesh.userData.aura) {
      const s = 1 + Math.sin(t * 4) * 0.12;
      mesh.userData.aura.scale.set(s, s, s);
    }
  }

  updateCamera(e) {
    const b = e.ball;
    if (e.state === "replay") {
      this.camPos.lerp(new THREE.Vector3(12, 5, b.z * 0.3 + 14), 0.05);
      this.camLook.lerp(new THREE.Vector3(b.x * 0.3, b.y * 0.3, b.z * 0.5), 0.08);
    } else {
      const tz = b.z * 0.05;
      this.camPos.lerp(new THREE.Vector3(14, 13, 22 + tz), 0.03);
      this.camLook.lerp(new THREE.Vector3(b.x * 0.04, 0, -5 + tz * 0.3), 0.04);
    }
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
  }

  render() {
    const e = this.eng, t = e.time, b = e.ball;
    this.pose(this.pMesh, e.p, 0, t);
    this.pose(this.aMesh, e.a, Math.PI, t);
    this.ball.position.set(b.x, b.y + BALL_R, b.z);
    this.ball.rotation.x -= 0.2;
    this.shadow.position.set(b.x, 0.015, b.z);
    const sh = Math.max(0.3, 1 - b.y * 0.15);
    this.shadow.scale.set(sh, sh, 1);
    this.shadow.material.opacity = 0.45 * sh;

    const pos = this.trail.geometry.attributes.position;
    const tr = e.trail;
    for (let i = 0; i < 13; i++) {
      const p = tr[Math.min(i, tr.length - 1)] || b;
      pos.setXYZ(i, p.x, p.y + BALL_R, p.z);
    }
    pos.needsUpdate = true;
    this.trail.visible = e.state === "rally" || e.state === "replay";

    this.marks.forEach((m, i) => {
      const mk = e.marks[e.marks.length - 1 - i];
      m.material.opacity = mk ? mk.life * 0.4 : 0;
      if (mk) m.position.set(mk.x, 0.016, mk.z);
    });

    const incoming = e.state === "rally" && e.lastHitter === 1 && b.z > -2;
    [this.reachRing, this.perfectRing].forEach((r) => {
      r.visible = incoming;
      r.position.x = e.p.x;
      r.position.z = e.p.z;
    });

    const { crowd, base } = this.stadium;
    if (e.cheer > 0 || this.wasCheer) {
      const m4 = new THREE.Matrix4();
      base.forEach((c, i) => {
        m4.makeTranslation(c.pos.x, c.pos.y + Math.abs(Math.sin(t * 9 + c.ph)) * 0.35 * e.cheer, c.pos.z);
        crowd.setMatrixAt(i, m4);
      });
      crowd.instanceMatrix.needsUpdate = true;
      this.wasCheer = e.cheer > 0;
    }

    this.updateCamera(e);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.scene.traverse((o) => {
      o.geometry?.dispose();
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      mats.forEach((m) => { m.map?.dispose(); m.dispose(); });
    });
    this.renderer.dispose();
  }
}
