/** Effet de Pâques réaliste (canvas) : prairie fleurie, lapins qui sautent, œufs peints, poussins, papillons. */
type G = CanvasRenderingContext2D;
export const EASTER_DUR = 9;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const EMF = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const glow = (g: G, x: number, y: number, r: number, c: string, a: number) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, c); gr.addColorStop(1, "rgba(255,255,255,0)"); g.globalAlpha = a; g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill(); g.globalAlpha = 1; };

function egg(g: G, x: number, y: number, s: number, hue: number, kind: number, rot: number) {
  g.save(); g.translate(x, y); g.rotate(rot); const w = s * 0.38, h = s * 0.5;
  const path = () => { g.beginPath(); g.moveTo(0, -h); g.bezierCurveTo(w * 1.1, -h * 0.9, w * 1.1, h, 0, h); g.bezierCurveTo(-w * 1.1, h, -w * 1.1, -h * 0.9, 0, -h); g.closePath(); };
  const gr = g.createRadialGradient(-w * 0.3, -h * 0.35, 2, 0, 0, h * 1.1); gr.addColorStop(0, `hsl(${hue},85%,86%)`); gr.addColorStop(0.6, `hsl(${hue},75%,62%)`); gr.addColorStop(1, `hsl(${hue},70%,40%)`);
  g.fillStyle = gr; path(); g.fill(); g.save(); path(); g.clip();
  g.strokeStyle = `hsl(${(hue + 180) % 360},80%,92%)`; g.fillStyle = g.strokeStyle; g.lineWidth = s * 0.06;
  if (kind === 0) { for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(-w * 1.3, i * h * 0.3); g.lineTo(w * 1.3, i * h * 0.3); g.stroke(); } }
  else if (kind === 1) { g.beginPath(); for (let i = -6; i <= 6; i++) g.lineTo(i * w * 0.2, h * 0.15 + (i % 2 ? -1 : 1) * h * 0.12); g.stroke(); g.beginPath(); for (let i = -6; i <= 6; i++) g.lineTo(i * w * 0.2, -h * 0.35 + (i % 2 ? -1 : 1) * h * 0.1); g.stroke(); }
  else if (kind === 2) { for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(((i * 53) % 10 - 5) * w * 0.17, ((i * 37) % 10 - 5) * h * 0.17, s * 0.045, 0, 6.283); g.fill(); } }
  else { g.beginPath(); g.arc(0, 0, h * 0.28, 0, 6.283); g.stroke(); g.beginPath(); g.arc(0, 0, h * 0.5, 0, 6.283); g.stroke(); }
  g.restore(); g.fillStyle = "rgba(255,255,255,.7)"; g.beginPath(); g.ellipse(-w * 0.4, -h * 0.4, w * 0.16, h * 0.25, 0.3, 0, 6.283); g.fill(); g.restore();
}
function bunny(g: G, x: number, y: number, s: number, air: number, dir: number, t: number, tone: number) {
  g.save(); g.translate(x, y); g.scale(dir * s, s); g.rotate(-air * 0.35); g.scale(1 + air * 0.12, 1 - air * 0.08);
  const fur = tone ? ["#e9dccb", "#a88a6d"] : ["#ffffff", "#cfd3dc"]; const fg = g.createLinearGradient(0, -30, 0, 26); fg.addColorStop(0, fur[0]); fg.addColorStop(1, fur[1]);
  g.fillStyle = "rgba(0,0,0,.18)"; g.beginPath(); g.ellipse(0, 30 + air * 30, 40 - air * 12, 7, 0, 0, 6.283); g.fill();
  g.fillStyle = fg; g.beginPath(); g.ellipse(-4, 4, 36, 25, 0, 0, 6.283); g.fill(); g.beginPath(); g.ellipse(-20, 8, 22, 20, 0, 0, 6.283); g.fill(); g.beginPath(); g.ellipse(-22, 26, 19, 7, 0, 0, 6.283); g.fill();
  g.beginPath(); g.arc(-40, 2, 9, 0, 6.283); g.fillStyle = "#fff"; g.fill();
  g.fillStyle = fg; g.beginPath(); g.ellipse(26, -14, 17, 15, 0, 0, 6.283); g.fill(); g.beginPath(); g.ellipse(20, 12, 8, 18, 0.3 + air * 0.6, 0, 6.283); g.fill();
  const ear = Math.sin(t * 12) * 0.04 * air;
  for (const [ex, er] of [[18, -0.25], [30, 0.1]] as const) { g.save(); g.translate(ex, -26); g.rotate(er + ear - air * 0.5); g.fillStyle = fg; g.beginPath(); g.ellipse(0, -22, 7, 24, 0, 0, 6.283); g.fill(); g.fillStyle = "#f6b3c1"; g.beginPath(); g.ellipse(0, -22, 3.6, 18, 0, 0, 6.283); g.fill(); g.restore(); }
  g.fillStyle = "#231a1a"; g.beginPath(); g.arc(33, -18, 2.6, 0, 6.283); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(33.8, -18.8, 0.9, 0, 6.283); g.fill();
  g.fillStyle = "#e88aa0"; g.beginPath(); g.ellipse(42, -13, 3.2, 2.4, 0, 0, 6.283); g.fill(); g.strokeStyle = "rgba(60,40,40,.5)"; g.lineWidth = 1; g.beginPath(); g.moveTo(40, -10); g.lineTo(46, -8); g.moveTo(40, -9); g.lineTo(45, -5); g.stroke();
  g.restore();
}
function flower(g: G, x: number, y: number, s: number, hue: number, kind: number, sway: number) {
  g.save(); g.translate(x, y); g.rotate(sway); g.strokeStyle = "#2f8a3c"; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -s * 1.5); g.stroke();
  g.fillStyle = "#3da34a"; g.beginPath(); g.ellipse(-8, -s * 0.6, 9, 3.5, -0.6, 0, 6.283); g.fill();
  g.translate(0, -s * 1.5);
  if (kind) { for (let i = 0; i < 8; i++) { g.rotate(0.785); g.fillStyle = "#fff"; g.beginPath(); g.ellipse(0, -s * 0.28, s * 0.1, s * 0.28, 0, 0, 6.283); g.fill(); } g.fillStyle = "#f6c21d"; g.beginPath(); g.arc(0, 0, s * 0.18, 0, 6.283); g.fill(); }
  else { const gr = g.createLinearGradient(0, -s * 0.4, 0, s * 0.2); gr.addColorStop(0, `hsl(${hue},90%,70%)`); gr.addColorStop(1, `hsl(${hue},85%,45%)`); g.fillStyle = gr; g.beginPath(); g.moveTo(-s * 0.22, 0); g.quadraticCurveTo(-s * 0.3, -s * 0.5, -s * 0.12, -s * 0.5); g.lineTo(0, -s * 0.22); g.lineTo(s * 0.12, -s * 0.5); g.quadraticCurveTo(s * 0.3, -s * 0.5, s * 0.22, 0); g.quadraticCurveTo(0, s * 0.18, -s * 0.22, 0); g.fill(); }
  g.restore();
}
export function easterLayer(W: number, H: number, g: G): (t: number, dt: number, f: number) => void {
  const m = Math.min(W, H); const hill = (x: number, k: number) => H * (0.78 - k * 0.1) + Math.sin(x * 0.004 + k * 2) * H * 0.04 + Math.sin(x * 0.011 + k) * H * 0.012;
  const flw = Array.from({ length: 42 }, () => { const x = rnd(0, W); return { x, y: hill(x, 0) + rnd(10, H * 0.2), s: rnd(m * 0.045, m * 0.09), hue: pick([350, 300, 45, 20, 270]), kind: Math.random() < 0.4 ? 1 : 0, ph: rnd(0, 6) }; }).sort((a, b) => a.y - b.y);
  const clouds = Array.from({ length: 5 }, () => ({ x: rnd(0, W), y: rnd(H * 0.05, H * 0.35), s: rnd(60, 130), v: rnd(8, 22) }));
  const bun = [0, 1, 2].map((i) => ({ x: -100 - i * W * 0.28, v: W / 5.5, tone: i % 2, ph: i * 0.9, y: 0 }));
  const eggs: { x: number; y: number; vy: number; s: number; hue: number; kind: number; r: number; vr: number; rest: number; floor: number }[] = []; let acc = 0;
  const fly = Array.from({ length: 5 }, () => ({ x: rnd(0, W), y: rnd(H * 0.3, H * 0.7), hue: pick([30, 280, 200, 340]), ph: rnd(0, 6), v: rnd(30, 70) }));
  return (t, dt, f) => {
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#9fd3f5"); sky.addColorStop(0.6, "#dff1fb"); sky.addColorStop(1, "#fff6d8"); g.globalAlpha = f; g.fillStyle = sky; g.fillRect(0, 0, W, H);
    glow(g, W * 0.82, H * 0.14, m * 0.35, "rgba(255,244,190,1)", 0.9 * f); g.globalAlpha = f; g.fillStyle = "#fff6c0"; g.beginPath(); g.arc(W * 0.82, H * 0.14, m * 0.07, 0, 6.283); g.fill();
    for (const c of clouds) { c.x += c.v * dt; if (c.x > W + 200) c.x = -200; g.fillStyle = "rgba(255,255,255,.9)"; for (const [dx, dy, r] of [[0, 0, 1], [0.7, 0.2, 0.8], [-0.7, 0.25, 0.75], [0.2, -0.35, 0.8]]) { g.beginPath(); g.arc(c.x + dx * c.s, c.y + dy * c.s * 0.5, c.s * 0.5 * r, 0, 6.283); g.fill(); } }
    for (let k = 1; k >= 0; k--) { const hg = g.createLinearGradient(0, H * 0.6, 0, H); hg.addColorStop(0, k ? "#8fd36b" : "#6cc04a"); hg.addColorStop(1, k ? "#5aa83e" : "#3f8f2f"); g.fillStyle = hg; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 12) g.lineTo(x, hill(x, k)); g.lineTo(W, H); g.fill(); }
    g.strokeStyle = "rgba(40,120,40,.5)"; g.lineWidth = 1.5; for (let i = 0; i < 160; i++) { const x = (i * 97) % W, y = hill(x, 0) + ((i * 53) % (H * 0.2)); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(t * 2 + i) * 3, y - 10); g.stroke(); }
    for (const fl of flw) flower(g, fl.x, fl.y, fl.s * Math.min(1, t / 1.2), fl.hue, fl.kind, Math.sin(t * 1.6 + fl.ph) * 0.08);
    acc += dt * (t < 6 ? 5 : 0); while (acc > 1) { acc--; eggs.push({ x: rnd(0, W), y: -40, vy: 0, s: rnd(m * 0.07, m * 0.12), hue: pick([340, 200, 50, 130, 280, 20]), kind: Math.floor(rnd(0, 4)), r: rnd(-0.5, 0.5), vr: rnd(-3, 3), rest: 0, floor: hill(rnd(0, W), 0) + rnd(30, H * 0.17) }); }
    for (let i = eggs.length - 1; i >= 0; i--) { const e = eggs[i]; e.vy += 900 * dt; e.y += e.vy * dt; e.r += e.vr * dt; if (e.y > e.floor) { e.y = e.floor; if (Math.abs(e.vy) > 120) { e.vy *= -0.4; e.vr *= 0.5; } else { e.vy = 0; e.vr = 0; e.rest += dt; } } if (e.rest > 2.5 && t > EASTER_DUR - 1.5) { eggs.splice(i, 1); continue; } g.globalAlpha = f; egg(g, e.x, e.y, e.s, e.hue, e.kind, e.r); }
    for (const b of bun) { b.x += b.v * dt; if (b.x > W + 120) b.x = -120; const cyc = ((t + b.ph) * 1.3) % 1; const air = Math.sin(cyc * Math.PI); const hh = air * H * 0.12; const by = hill(b.x, 0) + H * 0.12 + (b.ph * 20 % 30); g.globalAlpha = f; bunny(g, b.x, by - hh, m * 0.0034, air, 1, t, b.tone); }
    for (let i = 0; i < 3; i++) { const cx = ((t * 40 + i * W * 0.4) % (W + 100)) - 50; const air = Math.abs(Math.sin(t * 5 + i)); g.globalAlpha = f; g.font = `${m * 0.06}px ${EMF}`; g.textAlign = "center"; g.fillText("🐥", cx, hill(cx, 0) + H * 0.19 - air * 30); }
    for (const b of fly) { b.x += b.v * dt; b.y += Math.sin(t * 2 + b.ph) * 30 * dt; if (b.x > W + 30) b.x = -30; const fl = Math.abs(Math.sin(t * 14 + b.ph)); g.save(); g.translate(b.x, b.y); g.globalAlpha = f; g.fillStyle = `hsl(${b.hue},85%,62%)`; g.beginPath(); g.ellipse(-7 * fl, -3, 8 * fl + 1, 11, -0.4, 0, 6.283); g.ellipse(7 * fl, -3, 8 * fl + 1, 11, 0.4, 0, 6.283); g.fill(); g.fillStyle = "#3a2a2a"; g.fillRect(-1, -7, 2, 14); g.restore(); }
    g.globalAlpha = 1;
  };
}
