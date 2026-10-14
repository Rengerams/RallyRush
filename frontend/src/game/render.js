import { COURT } from "./constants";

const CROWD = Array.from({ length: 140 }, (_, i) => ({
  side: i % 2 ? 1 : -1, row: Math.floor(Math.random() * 3), z: -15 + Math.random() * 30,
  hue: ["#E05A47", "#DFFF00", "#00F0FF", "#F1F5F9", "#94A3B8", "#F59E0B"][i % 6], ph: Math.random() * 6.28,
}));

function court(ctx, P, S, surf) {
  const [ox, oy] = P(-8.2, -15.3);
  ctx.fillStyle = surf.outer;
  ctx.fillRect(ox, oy, 16.4 * S, 30.6 * S);
  const [ix, iy] = P(-COURT.doublesHalfW, -COURT.halfLen);
  ctx.fillStyle = surf.color;
  ctx.fillRect(ix, iy, 2 * COURT.doublesHalfW * S, 2 * COURT.halfLen * S);
  if (surf.id === "grass") {
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    for (let z = -COURT.halfLen; z < COURT.halfLen; z += 2.4) ctx.fillRect(ix, P(0, z)[1], 2 * COURT.doublesHalfW * S, 1.2 * S);
  }
}

function watermark(ctx, P, S) {
  ctx.save();
  ctx.font = `900 ${S * 1.15}px "Barlow Condensed", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.13)";
  const [bx, by] = P(0, 13.6);
  ctx.fillText("RENFFR OPEN", bx, by);
  const [tx, ty] = P(0, -13.6);
  ctx.translate(tx, ty);
  ctx.rotate(Math.PI);
  ctx.fillText("RENFFR OPEN", 0, 0);
  ctx.restore();
}

function lines(ctx, P, S) {
  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.lineWidth = Math.max(1.5, S * 0.07);
  const seg = (x1, z1, x2, z2) => { const a = P(x1, z1), b = P(x2, z2); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); };
  const { doublesHalfW: D, singlesHalfW: W, halfLen: L, serviceLine: SL } = COURT;
  const [ix, iy] = P(-D, -L);
  ctx.strokeRect(ix, iy, 2 * D * S, 2 * L * S);
  seg(-W, -L, -W, L); seg(W, -L, W, L);
  seg(-W, -SL, W, -SL); seg(-W, SL, W, SL);
  seg(0, -SL, 0, SL);
  seg(0, -L, 0, -L + 0.3); seg(0, L, 0, L - 0.3);
}

function net(ctx, P, S) {
  const a = P(-6.4, 0), b = P(6.4, 0);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(a[0], a[1], b[0] - a[0], S * 0.5);
  ctx.strokeStyle = "rgba(20,20,20,0.9)";
  ctx.lineWidth = S * 0.18;
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  ctx.strokeStyle = "#F1F5F9";
  ctx.lineWidth = S * 0.07;
  ctx.beginPath(); ctx.moveTo(a[0], a[1] - S * 0.05); ctx.lineTo(b[0], b[1] - S * 0.05); ctx.stroke();
  ctx.fillStyle = "#0B0E14";
  [a, b].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, S * 0.16, 0, 6.28); ctx.fill(); });
}

function crowd(ctx, W, H, S, t, cheer) {
  const cy = H / 2;
  CROWD.forEach((c) => {
    const x = W / 2 + c.side * (8.9 + c.row * 0.7) * S;
    if (x < 0 || x > W) return;
    const bob = cheer > 0 ? Math.abs(Math.sin(t * 9 + c.ph)) * S * 0.3 * cheer : 0;
    ctx.fillStyle = c.hue;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(x, cy + c.z * S - bob, S * 0.22, 0, 6.28);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function player(ctx, P, S, e, color, up, label, legend, t) {
  const [x, y] = P(e.x, e.z);
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath(); ctx.ellipse(x + S * 0.15, y + S * 0.18, S * 0.5, S * 0.36, 0, 0, 6.28); ctx.fill();
  if (legend) {
    const r = S * (0.95 + Math.sin(t * 4) * 0.12);
    const g = ctx.createRadialGradient(x, y, S * 0.2, x, y, r);
    g.addColorStop(0, "rgba(255,200,40,0.55)"); g.addColorStop(1, "rgba(255,200,40,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill();
  }
  const dir = up ? -1 : 1;
  const prog = e.swing > 0 ? 1 - e.swing / 0.25 : 0;
  const base = up ? -Math.PI / 2 : Math.PI / 2;
  const ang = base + e.side * (e.swing > 0 ? 1.6 - prog * 3.0 : 1.2) * (up ? 1 : -1);
  const hx = x + Math.cos(ang) * S * 0.95, hy = y + Math.sin(ang) * S * 0.95;
  ctx.strokeStyle = "#0B0E14"; ctx.lineWidth = S * 0.09;
  ctx.beginPath(); ctx.moveTo(x + Math.cos(ang) * S * 0.35, y + Math.sin(ang) * S * 0.35); ctx.lineTo(hx, hy); ctx.stroke();
  ctx.strokeStyle = "#F1F5F9"; ctx.lineWidth = S * 0.06;
  ctx.beginPath(); ctx.ellipse(hx, hy, S * 0.26, S * 0.2, ang, 0, 6.28); ctx.stroke();
  ctx.fillStyle = color; ctx.strokeStyle = "#0B0E14"; ctx.lineWidth = S * 0.06;
  ctx.beginPath(); ctx.arc(x, y, S * 0.42, 0, 6.28); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#F1D7B5";
  ctx.beginPath(); ctx.arc(x, y + dir * S * 0.12, S * 0.2, 0, 6.28); ctx.fill();
  ctx.font = `700 ${Math.max(10, S * 0.48)}px "JetBrains Mono", monospace`;
  ctx.textAlign = "center";
  ctx.fillStyle = legend ? "#FFC828" : "rgba(241,245,249,0.85)";
  ctx.fillText(label, x, y + (up ? S * 1.2 : -S * 0.85));
}

function ball(ctx, P, S, eng) {
  const b = eng.ball;
  eng.trail.forEach((p, i) => {
    const [tx, ty] = P(p.x, p.z - p.y * 0.6);
    ctx.fillStyle = `rgba(223,255,0,${(i / eng.trail.length) * 0.35})`;
    ctx.beginPath(); ctx.arc(tx, ty, S * 0.12, 0, 6.28); ctx.fill();
  });
  const [sx, sy] = P(b.x, b.z);
  const sh = Math.max(0.35, 1 - b.y * 0.15);
  ctx.fillStyle = `rgba(0,0,0,${0.35 * sh})`;
  ctx.beginPath(); ctx.ellipse(sx, sy, S * 0.18 * sh, S * 0.12 * sh, 0, 0, 6.28); ctx.fill();
  const [bx, by] = P(b.x, b.z - b.y * 0.6);
  ctx.fillStyle = "#DFFF00"; ctx.strokeStyle = "rgba(11,14,20,0.6)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(bx, by, S * (0.17 + b.y * 0.015), 0, 6.28); ctx.fill(); ctx.stroke();
}

export function render(ctx, eng, W, H) {
  const S = Math.min(W / 19.5, H / 31.5);
  const P = (x, z) => [W / 2 + x * S, H / 2 + z * S];
  ctx.fillStyle = "#0B0E14";
  ctx.fillRect(0, 0, W, H);
  crowd(ctx, W, H, S, eng.time, eng.cheer);
  court(ctx, P, S, eng.surf);
  watermark(ctx, P, S);
  lines(ctx, P, S);
  eng.marks.forEach((m) => {
    const [x, y] = P(m.x, m.z);
    ctx.fillStyle = `rgba(255,255,255,${m.life * 0.35})`;
    ctx.beginPath(); ctx.ellipse(x, y, S * 0.2, S * 0.12, 0, 0, 6.28); ctx.fill();
  });
  const b = eng.ball;
  if (eng.state === "rally" && eng.lastHitter === 1 && b.z > -2) {
    const [px, py] = P(eng.p.x, eng.p.z);
    ctx.strokeStyle = "rgba(0,240,255,0.25)"; ctx.lineWidth = 1.5; ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.arc(px, py, S * 2.5, 0, 6.28); ctx.stroke();
    ctx.strokeStyle = "rgba(223,255,0,0.35)";
    ctx.beginPath(); ctx.arc(px, py, S * 1.04, 0, 6.28); ctx.stroke();
    ctx.setLineDash([]);
  }
  const ballFar = b.z < 0;
  if (ballFar) ball(ctx, P, S, eng);
  player(ctx, P, S, eng.a, "#E05A47", false, eng.names[1], false, eng.time);
  net(ctx, P, S);
  player(ctx, P, S, eng.p, eng.cfg.legend ? "#FFC828" : "#00F0FF", true, eng.names[0], eng.cfg.legend, eng.time);
  if (!ballFar) ball(ctx, P, S, eng);
}
