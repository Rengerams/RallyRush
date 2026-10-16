import * as THREE from "three";
import { buildStadium } from "./stadium";
import { makeLabel } from "./parts";
import { createAthlete } from "./player";
import { animatePlayer } from "./animatePlayer";
import { getCameraDistanceScale, getCameraFovForAspect } from "./cameraFraming";

const BALL_R = 0.125;

export class ThreeView {
  constructor(canvas, eng) {
    this.eng = eng;
    this.reducedMotion = false;
    const dpr = window.devicePixelRatio || 1;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: dpr < 2, powerPreference: "high-performance" });
    this.defaultPixelRatio = Math.min(dpr, 1.5);
    this.renderer.setPixelRatio(this.defaultPixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x071222);
    this.scene.fog = new THREE.Fog(0x071222, 35, 80);

    /* 3/4 side-broadcast camera (side + behind player) */
    this.camera = new THREE.PerspectiveCamera(46, 1, 0.1, 200);
    this.camPos = new THREE.Vector3(0, 19, 26);
    this.camLook = new THREE.Vector3(0, 0, -1);
    this.cameraTarget = new THREE.Vector3();
    this.lookTarget = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.pointerNDC = new THREE.Vector2();
    this.pointerWorld = new THREE.Vector3();

    this.lights();
    this.stadium = buildStadium(this.scene, eng.surf);
    this.actors();
  }

  lights() {
    this.scene.add(new THREE.HemisphereLight(0xdceeff, 0x536057, 1.6));
    const sun = new THREE.DirectionalLight(0xfff8e7, 2.4);
    sun.position.set(-6, 24, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
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
    this.pMesh = createAthlete(e.cfg.legend ? 0xffc828 : 0x21bbce, e.cfg.legend);
    this.pMesh.add(makeLabel(e.names[0], e.cfg.legend ? "#FFC828" : "#F5F5F5"));
    this.aMesh = createAthlete(0xe84f49, false, true);
    this.aMesh.add(makeLabel(e.names[1], "#F5F5F5"));
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
    this.destinationRing = ring(0.28, 0xffffff);
    this.aimRing = ring(0.38, 0xdfff00);
  }

  courtPoint(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointerNDC.set((clientX - rect.left) / rect.width * 2 - 1, -(clientY - rect.top) / rect.height * 2 + 1);
    this.raycaster.setFromCamera(this.pointerNDC, this.camera);
    const hit = this.raycaster.ray.intersectPlane(this.groundPlane, this.pointerWorld);
    if (!hit || Math.abs(hit.x) > 9 || Math.abs(hit.z) > 17) return null;
    return { x: hit.x, z: hit.z };
  }

  reduceEffects() {
    this.renderer.setPixelRatio(1);
    this.renderer.shadowMap.enabled = false;
    this.reducedEffects = true;
  }

  setReducedMotion(enabled) {
    this.reducedMotion = Boolean(enabled);
  }

  restoreEffects() {
    this.renderer.setPixelRatio(this.defaultPixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.reducedEffects = false;
  }

  setSize(w, h) {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.viewportHeight = h;
    this.camera.fov = getCameraFovForAspect(this.camera.aspect);
    this.camera.updateProjectionMatrix();
  }

  updateCamera(e) {
    const b = e.ball;
    const aspectOffset = this.camera.aspect < 1.25 ? 4 : 0;
    if (e.state === "replay") {
      const last = e.replayFrames[e.replayFrames.length - 1];
      const hitter = last?.lastHitter === 1 ? e.a : e.p;
      const side = hitter.z > 0 ? 1 : -1;
      const radius = Math.max(2.8, Math.hypot(b.x - hitter.x, b.z - hitter.z, b.y - 1) / 2 + 1.5);
      const halfFov = THREE.MathUtils.degToRad(this.camera.fov / 2);
      const narrowFov = Math.min(halfFov, Math.atan(Math.tan(halfFov) * this.camera.aspect));
      const distance = radius / Math.sin(narrowFov) * 1.12;
      this.lookTarget.set((hitter.x + b.x) / 2, Math.max(0.9, b.y / 2), (hitter.z + b.z) / 2);
      this.cameraTarget.copy(this.lookTarget).addScaledVector(new THREE.Vector3(0.58, 0.52, side * 0.63).normalize(), distance);
    } else {
      // Stable elevated baseline view: court-aligned controls, no ball-following drift.
      const angled = e.cameraMode === "broadcast";
      this.cameraTarget.set(angled ? 9 : 0, 19 + aspectOffset, 26 + aspectOffset);
      this.lookTarget.set(0, 0, -1);
      const distanceScale = getCameraDistanceScale(this.camera.aspect, this.viewportHeight);
      this.cameraTarget.lerp(this.lookTarget, 1 - distanceScale);
    }
    // Snap back from the cinematic angle: no obscured opening serve after a replay.
    const transition = this.wasReplay && e.state !== "replay" ? 1 : 0.08;
    this.camPos.lerp(this.cameraTarget, transition);
    this.camLook.lerp(this.lookTarget, transition);
    this.wasReplay = e.state === "replay";
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
  }

  render() {
    const e = this.eng, t = e.time, b = e.ball;
    const poseTime = e.state === "replay" ? e.replayTime : t;
    const context = { ball: b, toss: e.serveStage === "toss" };
    animatePlayer(this.pMesh, e.p, 0, poseTime, { ...context, serving: e.state === "serve" && e.server === 0 });
    animatePlayer(this.aMesh, e.a, Math.PI, poseTime, { ...context, serving: e.state === "serve" && e.server === 1 });
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
    [[this.destinationRing, e.pointerTarget], [this.aimRing, e.pointerAim]].forEach(([ring, target]) => {
      ring.visible = !!target && ["serve", "rally"].includes(e.state);
      if (target) ring.position.set(target.x, 0.023, target.z);
    });

    const { crowd, crowdHeads, base } = this.stadium;
    const animateCrowd = !this.reducedMotion && (e.cheer > 0 || this.wasCheer);
    const settleCrowd = this.reducedMotion && this.wasCheer;
    if (!this.reducedEffects && (animateCrowd || settleCrowd)) {
      const m4 = new THREE.Matrix4();
      const cheer = this.reducedMotion ? 0 : e.cheer;
      base.forEach((c, i) => {
        const lift = Math.abs(Math.sin(t * 9 + c.ph)) * 0.35 * cheer;
        m4.makeTranslation(c.pos.x, c.pos.y + lift, c.pos.z);
        crowd.setMatrixAt(i, m4);
        m4.makeScale(c.headScale, c.headScale * 1.08, c.headScale);
        m4.setPosition(c.pos.x, c.pos.y + 0.49 + lift, c.pos.z);
        crowdHeads.setMatrixAt(i, m4);
      });
      crowd.instanceMatrix.needsUpdate = true;
      crowdHeads.instanceMatrix.needsUpdate = true;
      this.wasCheer = !this.reducedMotion && e.cheer > 0;
    }

    this.updateCamera(e);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.scene.traverse((o) => {
      o.geometry?.dispose();
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      mats.forEach((m) => { m.map?.dispose(); m.bumpMap?.dispose(); m.dispose(); });
    });
    this.renderer.dispose();
  }
}
