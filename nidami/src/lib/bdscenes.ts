/** Décors d'anniversaire réalistes (canvas) : ballons brillants, gâteau avec vraies flammes, cadeaux avec rubans, cupcakes, confettis, étoiles. */
type G = CanvasRenderingContext2D;
type Layer = (t: number, dt: number, f: number) => void;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const HUES = [330, 285, 205, 160, 18, 48, 350, 260];
const EMF = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

function emo(g: G, ch: string, x: number, y: number, s: number, a = 1, rot = 0) { g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(rot); g.font = `${s}px ${EMF}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(ch, 0, 0); g.restore(); }
function glow(g: G, x: number, y: number, r: number, c: string, a: number) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, c); gr.addColorStop(1, "rgba(0,0,0,0)"); g.globalAlpha = a; g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill(); g.globalAlpha = 1; }

/** Ballon de baudruche brillant avec nœud et ficelle. */
function balloon(g: G, x: number, y: number, w: number, hue: number, a: number, t: number, ph: number) {
  const h = w * 1.22; g.save(); g.translate(x, y); g.rotate(Math.sin(t * 1.3 + ph) * 0.07); g.globalAlpha = a;
  g.strokeStyle = "rgba(90,90,100,.65)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, h * 0.52 + 6); g.bezierCurveTo(Math.sin(t * 2 + ph) * 12, h * 0.8, -Math.sin(t * 1.7 + ph) * 14, h * 1.1, Math.sin(t * 1.2 + ph) * 10, h * 1.6); g.stroke();
  const body = () => { g.beginPath(); g.moveTo(0, h * 0.5); g.bezierCurveTo(-w * 0.62, h * 0.28, -w * 0.58, -h * 0.5, 0, -h * 0.5); g.bezierCurveTo(w * 0.58, -h * 0.5, w * 0.62, h * 0.28, 0, h * 0.5); g.closePath(); };
  const gr = g.createRadialGradient(-w * 0.2, -h * 0.22, w * 0.05, 0, 0, h * 0.62); gr.addColorStop(0, `hsl(${hue},90%,78%)`); gr.addColorStop(0.45, `hsl(${hue},82%,52%)`); gr.addColorStop(1, `hsl(${hue},85%,30%)`);
  g.fillStyle = gr; body(); g.fill();
  g.fillStyle = `hsl(${hue},80%,38%)`; g.beginPath(); g.moveTo(0, h * 0.5 - 1); g.lineTo(-5, h * 0.5 + 9); g.lineTo(5, h * 0.5 + 9); g.closePath(); g.fill();
  const sp = g.createRadialGradient(-w * 0.22, -h * 0.28, 0, -w * 0.22, -h * 0.28, w * 0.22); sp.addColorStop(0, "rgba(255,255,255,.95)"); sp.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = sp; g.beginPath(); g.ellipse(-w * 0.22, -h * 0.28, w * 0.1, w * 0.17, -0.5, 0, 6.283); g.fill();
  g.fillStyle = "rgba(255,255,255,.28)"; g.beginPath(); g.ellipse(w * 0.22, h * 0.2, w * 0.05, w * 0.1, 0.5, 0, 6.283); g.fill(); g.restore();
}
/** Cadeau emballé avec ruban et nœud. */
function gift(g: G, x: number, y: number, s: number, hue: number, a: number, rot: number) {
  g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha = a; const hs = s / 2;
  const bx = g.createLinearGradient(-hs, 0, hs, 0); bx.addColorStop(0, `hsl(${hue},75%,55%)`); bx.addColorStop(0.5, `hsl(${hue},80%,62%)`); bx.addColorStop(1, `hsl(${hue},75%,38%)`); g.fillStyle = bx; g.fillRect(-hs, -hs * 0.8, s, s * 0.8 + hs * 0.8 - hs * 0.0);
  g.fillStyle = `hsl(${hue},70%,32%)`; g.fillRect(-hs, -hs * 0.8, s, s * 0.14);
  const rb = g.createLinearGradient(-s * 0.08, 0, s * 0.08, 0); rb.addColorStop(0, "#f6d36a"); rb.addColorStop(0.5, "#fff0b0"); rb.addColorStop(1, "#c9951f"); g.fillStyle = rb; g.fillRect(-s * 0.08, -hs * 0.8, s * 0.16, s * 0.8 + hs * 0.8); g.fillRect(-hs, hs * 0.06, s, s * 0.14);
  for (const sd of [-1, 1]) { g.fillStyle = "#e8b53c"; g.beginPath(); g.moveTo(0, -hs * 0.8); g.bezierCurveTo(sd * s * 0.5, -hs * 1.5, sd * s * 0.55, -hs * 0.55, 0, -hs * 0.8); g.fill(); g.strokeStyle = "rgba(120,80,0,.35)"; g.lineWidth = 1.5; g.stroke(); }
  g.fillStyle = "#c9951f"; g.beginPath(); g.arc(0, -hs * 0.82, s * 0.07, 0, 6.283); g.fill(); g.restore();
}
/** Cupcake avec glaçage en spirale. */
function cupcake(g: G, x: number, y: number, s: number, hue: number, a: number, rot: number) {
  g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha = a; const hs = s / 2;
  const cg = g.createLinearGradient(-hs, 0, hs, 0); cg.addColorStop(0, `hsl(${hue + 20},60%,60%)`); cg.addColorStop(0.5, `hsl(${hue + 20},65%,78%)`); cg.addColorStop(1, `hsl(${hue + 20},60%,45%)`); g.fillStyle = cg; g.beginPath(); g.moveTo(-hs * 0.85, -hs * 0.1); g.lineTo(-hs * 0.6, hs * 0.9); g.lineTo(hs * 0.6, hs * 0.9); g.lineTo(hs * 0.85, -hs * 0.1); g.closePath(); g.fill();
  g.strokeStyle = "rgba(0,0,0,.14)"; g.lineWidth = 1.2; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * hs * 0.24, -hs * 0.1); g.lineTo(i * hs * 0.17, hs * 0.9); g.stroke(); }
  for (let i = 0; i < 3; i++) { const yy = -hs * 0.2 - i * hs * 0.42; const ww = hs * (1.05 - i * 0.3); const fg = g.createRadialGradient(-ww * 0.3, yy - hs * 0.15, 2, 0, yy, ww); fg.addColorStop(0, `hsl(${hue},85%,88%)`); fg.addColorStop(1, `hsl(${hue},70%,62%)`); g.fillStyle = fg; g.beginPath(); g.ellipse(0, yy, ww, hs * 0.3, 0, 0, 6.283); g.fill(); }
  g.fillStyle = "#c4122f"; g.beginPath(); g.arc(0, -hs * 1.35, hs * 0.2, 0, 6.283); g.fill(); g.fillStyle = "rgba(255,255,255,.8)"; g.beginPath(); g.arc(-hs * 0.06, -hs * 1.42, hs * 0.05, 0, 6.283); g.fill();
  for (let i = 0; i < 7; i++) { g.fillStyle = pick(["#fff", "#ffd54a", "#4cc9f0", "#ff4d6d"]); g.fillRect(rnd(-hs * 0.6, hs * 0.6), rnd(-hs * 1.1, -hs * 0.2), 3, 6); } g.restore();
}
/** Étoile dorée brillante. */
function star(g: G, x: number, y: number, r: number, a: number, rot: number, tw: number) {
  g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha = a; const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, "#fff7c2"); gr.addColorStop(0.6, "#ffcf3d"); gr.addColorStop(1, "#d98c0a"); g.fillStyle = gr; g.shadowColor = "rgba(255,220,100,.9)"; g.shadowBlur = r * 0.8;
  g.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.45 : r; const an = (i * Math.PI) / 5 - Math.PI / 2; g.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } g.closePath(); g.fill(); g.shadowBlur = 0; g.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(tw)})`; g.beginPath(); g.arc(-r * 0.15, -r * 0.2, r * 0.12, 0, 6.283); g.fill(); g.restore();
}
type P = { x: number; y: number; vx: number; vy: number; s: number; r: number; vr: number; h: number; k: number; life: number; ph: number };
const mk = (o: Partial<P>): P => ({ x: 0, y: 0, vx: 0, vy: 0, s: 10, r: 0, vr: 0, h: 0, k: 0, life: 0, ph: rnd(0, 6.283), ...o });

function balloonsLayer(W: number, H: number, g: G, rate: number, s0: number, s1: number, until: number): Layer {
  const bs: P[] = []; let acc = 0; for (let i = 0; i < Math.round(rate * 3); i++) bs.push(mk({ x: rnd(0, W), y: rnd(H * 0.1, H), vy: -rnd(55, 120), s: rnd(s0, s1), h: pick(HUES) }));
  return (t, dt, f) => { if (t < until) { acc += dt * rate; while (acc > 1) { acc--; bs.push(mk({ x: rnd(0, W), y: H + 120, vy: -rnd(55, 120), s: rnd(s0, s1), h: pick(HUES) })); } }
    for (let i = bs.length - 1; i >= 0; i--) { const b = bs[i]; b.y += b.vy * dt; b.x += Math.sin(t * 1.1 + b.ph) * 22 * dt; if (b.y < -b.s * 2.2) { bs.splice(i, 1); continue; } balloon(g, b.x, b.y, b.s, b.h, f, t, b.ph); } };
}
function confettiLayer(W: number, H: number, g: G, rate: number, until: number): Layer {
  const ps: P[] = []; let acc = 0; const cols = ["#ff4d6d", "#ffd23f", "#3ddc97", "#4cc9f0", "#b388ff", "#ff9f1c", "#fff"];
  return (t, dt, f) => { if (t < until) { acc += dt * rate; while (acc > 1) { acc--; ps.push(mk({ x: rnd(0, W), y: -20, vy: rnd(60, 160), s: rnd(7, 13), r: rnd(0, 6), vr: rnd(-7, 7), h: Math.floor(rnd(0, 7)), k: Math.random() < 0.2 ? 1 : 0 })); } }
    for (let i = ps.length - 1; i >= 0; i--) { const p = ps[i]; p.y += p.vy * dt; p.x += Math.sin(t * 2 + p.ph) * 40 * dt; p.r += p.vr * dt; if (p.y > H + 20) { ps.splice(i, 1); continue; }
      g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.scale(1, Math.cos(p.r * 1.9)); g.fillStyle = cols[p.h]; g.globalAlpha = f; if (p.k) g.fillRect(-p.s * 2, -1.5, p.s * 4, 3); else g.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66); g.restore(); } };
}
function cannonLayer(W: number, H: number, g: G, times: number[], n: number): Layer {
  const ps: P[] = []; let ti = 0; const cols = ["#ff4d6d", "#ffd23f", "#3ddc97", "#4cc9f0", "#b388ff", "#ff9f1c", "#fff"];
  return (t, dt, f) => { while (ti < times.length && t > times[ti]) { for (const side of [0, 1]) for (let i = 0; i < n; i++) { const a = (side ? -2.3 : -0.84) + rnd(-0.5, 0.5), sp = rnd(500, 1250); ps.push(mk({ x: side ? W - 20 : 20, y: H - 30, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, s: rnd(6, 13), r: rnd(0, 6), vr: rnd(-9, 9), h: Math.floor(rnd(0, 7)), k: Math.random() < 0.25 ? 1 : 0 })); } ti++; }
    for (let i = ps.length - 1; i >= 0; i--) { const p = ps[i]; p.vx *= Math.pow(0.18, dt); p.vy = p.vy * Math.pow(0.35, dt) + 500 * dt; p.x += p.vx * dt + Math.sin(t * 5 + p.ph) * 30 * dt; p.y += p.vy * dt; p.r += p.vr * dt; if (p.y > H + 30) { ps.splice(i, 1); continue; }
      g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.scale(1, Math.cos(p.r * 1.7)); g.fillStyle = cols[p.h]; g.globalAlpha = f; if (p.k) g.fillRect(-p.s * 2.2, -1.5, p.s * 4.4, 3); else g.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66); g.restore(); } };
}
/** Objets qui tombent et rebondissent sur le bas de l'écran. */
function dropLayer(W: number, H: number, g: G, rate: number, s0: number, s1: number, until: number, draw: (g: G, p: P, t: number) => void, bounce = 0.45): Layer {
  const ps: P[] = []; let acc = 0;
  return (t, dt, f) => { if (t < until) { acc += dt * rate; while (acc > 1) { acc--; ps.push(mk({ x: rnd(20, W - 20), y: -60, vy: rnd(40, 200), s: rnd(s0, s1), h: pick(HUES), r: rnd(-0.5, 0.5), vr: rnd(-1.5, 1.5), k: Math.floor(rnd(0, 6)) })); } }
    for (let i = ps.length - 1; i >= 0; i--) { const p = ps[i]; p.vy += 900 * dt; p.y += p.vy * dt; p.x += p.vx * dt; p.r += p.vr * dt; const fl = H - p.s * 0.45; if (p.y > fl) { p.y = fl; if (Math.abs(p.vy) > 160) { p.vy *= -bounce; p.vx = rnd(-120, 120); p.vr = rnd(-3, 3); } else { p.vy = 0; p.vr *= 0.9; p.vx *= 0.9; p.life += dt; } } if (p.life > 1.6 || p.x < -80 || p.x > W + 80) { ps.splice(i, 1); continue; }
      g.globalAlpha = f * Math.min(1, (1.6 - p.life) * 2); draw(g, p, t); g.globalAlpha = 1; } };
}
function risingStars(W: number, H: number, g: G, rate: number, s0: number, s1: number, until: number): Layer {
  const ps: P[] = []; let acc = 0;
  return (t, dt, f) => { if (t < until) { acc += dt * rate; while (acc > 1) { acc--; ps.push(mk({ x: rnd(0, W), y: -30, vy: rnd(70, 190), s: rnd(s0, s1), r: rnd(0, 6), vr: rnd(-3, 3) })); } }
    for (let i = ps.length - 1; i >= 0; i--) { const p = ps[i]; p.y += p.vy * dt; p.x += Math.sin(t * 2 + p.ph) * 30 * dt; p.r += p.vr * dt; if (p.y > H + 40) { ps.splice(i, 1); continue; } star(g, p.x, p.y, p.s, f, p.r, t * 6 + p.ph); } };
}
function emojiLayer(W: number, H: number, g: G, list: string[], rate: number, s0: number, s1: number, from: number, until: number): Layer {
  const ps: P[] = []; let acc = 0;
  return (t, dt, f) => { if (t > from && t < until) { acc += dt * rate; while (acc > 1) { acc--; ps.push(mk({ x: rnd(0, W), y: -50, vy: rnd(70, 200), s: rnd(s0, s1), r: rnd(-0.6, 0.6), vr: rnd(-1, 1), k: Math.floor(rnd(0, list.length)) })); } }
    for (let i = ps.length - 1; i >= 0; i--) { const p = ps[i]; p.y += p.vy * dt; p.x += Math.sin(t * 1.6 + p.ph) * 26 * dt; p.r += p.vr * dt; if (p.y > H + 60) { ps.splice(i, 1); continue; } emo(g, list[p.k], p.x, p.y, p.s, f, p.r); } };
}

/** Grand gâteau dessiné : plateau, 2 étages, glaçage, fraises, bougies avec vraies flammes. blow = 0..1 (souffle), out = bougies éteintes. */
function bigCake(g: G, cx: number, cy: number, S: number, t: number, flameOn: (i: number) => number, smoke: (i: number, x: number, y: number) => void) {
  g.save(); g.translate(cx, cy); g.scale(S / 400, S / 400); g.translate(-200, -200);
  const pl = g.createLinearGradient(0, 330, 0, 390); pl.addColorStop(0, "#f4f6fb"); pl.addColorStop(1, "#8d96ab"); g.fillStyle = pl; g.beginPath(); g.ellipse(200, 360, 190, 30, 0, 0, 6.283); g.fill(); g.fillStyle = "rgba(0,0,0,.18)"; g.beginPath(); g.ellipse(200, 350, 150, 22, 0, 0, 6.283); g.fill();
  const tier = (x0: number, w: number, y0: number, h: number, c1: string, c2: string, c3: string) => { const gr = g.createLinearGradient(x0, 0, x0 + w, 0); gr.addColorStop(0, c3); gr.addColorStop(0.3, c1); gr.addColorStop(0.7, c2); gr.addColorStop(1, c3); g.fillStyle = gr; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0, y0 + h); g.ellipse(x0 + w / 2, y0 + h, w / 2, 24, 0, Math.PI, 0, true); g.lineTo(x0 + w, y0); g.closePath(); g.fill();
    const tp = g.createRadialGradient(x0 + w * 0.4, y0 - 6, 4, x0 + w / 2, y0, w / 2); tp.addColorStop(0, "#fffafc"); tp.addColorStop(1, "#f6cfe0"); g.fillStyle = tp; g.beginPath(); g.ellipse(x0 + w / 2, y0, w / 2, 24, 0, 0, 6.283); g.fill();
    g.fillStyle = "#fff"; for (let i = 0; i <= 9; i++) { const bx = x0 + 8 + (i / 9) * (w - 16); g.beginPath(); g.ellipse(bx, y0 + 18 + (i % 2) * 3, 17, 13, 0, 0, 6.283); g.fill(); }
    g.fillStyle = "#fffafc"; for (let i = 0; i < 6; i++) { const dx = x0 + 22 + i * (w - 44) / 5; g.beginPath(); g.moveTo(dx - 9, y0 + 14); g.lineTo(dx + 9, y0 + 14); g.lineTo(dx + 9, y0 + 30 + (i % 3) * 14); g.arc(dx, y0 + 30 + (i % 3) * 14, 9, 0, Math.PI); g.closePath(); g.fill(); } };
  tier(40, 320, 250, 90, "#f7a6c8", "#e9709f", "#b54478"); tier(95, 210, 160, 86, "#d9a0f0", "#b36bd8", "#80409e");
  for (const [bx, by] of [[70, 262], [330, 262], [200, 286]] as const) berry(g, bx, by, 1);
  [130, 165, 200, 235, 270].forEach((x, i) => { const cg = g.createLinearGradient(x - 7, 0, x + 7, 0); cg.addColorStop(0, ["#fff", "#7fd0ff", "#fff", "#ffb3d1", "#fff"][i]); cg.addColorStop(1, "#c9c9d9"); g.fillStyle = cg; g.fillRect(x - 7, 92, 14, 68); g.fillStyle = "rgba(220,60,100,.5)"; for (let j = 0; j < 4; j++) { g.beginPath(); g.moveTo(x - 7, 100 + j * 16); g.lineTo(x + 7, 92 + j * 16 + 8); g.lineTo(x + 7, 100 + j * 16 + 8); g.lineTo(x - 7, 108 + j * 16); g.fill(); }
    g.strokeStyle = "#333"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, 92); g.lineTo(x, 84); g.stroke();
    const on = flameOn(i); if (on > 0.02) { const fl = 1 + 0.18 * Math.sin(t * 22 + i * 2) + 0.1 * Math.sin(t * 37 + i); const lean = (1 - on) * -0 + Math.sin(t * 9 + i) * 2; glow(g, x, 66, 46 * on, "rgba(255,190,90,1)", 0.5 * on);
      g.save(); g.translate(x, 84); g.scale(on, on * fl); g.rotate(lean * 0.03); const fg = g.createLinearGradient(0, 0, 0, -44); fg.addColorStop(0, "rgba(80,120,255,.9)"); fg.addColorStop(0.15, "rgba(255,255,230,1)"); fg.addColorStop(0.5, "rgba(255,200,70,.95)"); fg.addColorStop(1, "rgba(255,110,20,0)"); g.fillStyle = fg; g.beginPath(); g.moveTo(0, 2); g.bezierCurveTo(-11, -12, -8, -30, 0, -46); g.bezierCurveTo(8, -30, 11, -12, 0, 2); g.fill(); g.restore(); } else smoke(i, x, 84); });
  g.restore();
}
function berry(g: G, x: number, y: number, s: number) { g.save(); g.translate(x, y); g.scale(s, s); const gr = g.createRadialGradient(-5, -6, 2, 0, 0, 20); gr.addColorStop(0, "#ff6b6b"); gr.addColorStop(1, "#a50f26"); g.fillStyle = gr; g.beginPath(); g.moveTo(0, -14); g.bezierCurveTo(-18, -12, -16, 12, 0, 20); g.bezierCurveTo(16, 12, 18, -12, 0, -14); g.fill(); g.fillStyle = "rgba(255,230,160,.9)"; for (const [a, b] of [[-6, -2], [5, 0], [-2, 8], [6, 9], [-8, 7]]) g.fillRect(a, b, 1.6, 2.6); g.fillStyle = "#2f9e44"; g.beginPath(); g.moveTo(0, -14); g.lineTo(-9, -20); g.lineTo(-3, -13); g.lineTo(0, -22); g.lineTo(3, -13); g.lineTo(9, -20); g.closePath(); g.fill(); g.restore(); }

export type BdKind = "bd1" | "bd2" | "bd3" | "bd4" | "bd5" | "bd6";
export function bdLayers(k: BdKind, W: number, H: number, g: G, dur: number): Layer[] {
  const L: Layer[] = []; const m = Math.min(W, H);
  const gifts = (rate: number, s0: number, s1: number, until: number) => dropLayer(W, H, g, rate, s0, s1, until, (gg, p) => gift(gg, p.x, p.y, p.s, p.h, 1, p.r));
  const cups = (rate: number, s0: number, s1: number, until: number) => dropLayer(W, H, g, rate, s0, s1, until, (gg, p) => (p.k % 2 ? cupcake(gg, p.x, p.y, p.s, p.h, 1, p.r) : emo(gg, pick(["🍰", "🍩", "🎂", "🧁", "🥧", "🍪"]), p.x, p.y, p.s, 1, p.r)), 0.35);
  if (k === "bd1") { L.push(balloonsLayer(W, H, g, 4.2, m * 0.1, m * 0.2, dur - 8)); L.push(confettiLayer(W, H, g, 10, dur - 6)); }
  else if (k === "bd2") {
    L.push((t, dt, f) => { const sc = Math.min(1, t / 0.8); const bob = 1 + 0.04 * Math.sin(t * 4); emo(g, "🎂", W / 2, H * 0.5, m * 0.55 * sc * bob, f, Math.sin(t * 2) * 0.05); });
    L.push(confettiLayer(W, H, g, 22, dur - 5)); L.push(cannonLayer(W, H, g, Array.from({ length: 12 }, (_, i) => 0.6 + i * 5), 40)); L.push(balloonsLayer(W, H, g, 0.9, m * 0.1, m * 0.16, dur - 8)); L.push(emojiLayer(W, H, g, ["🎉", "🎊"], 1.2, 40, 70, 1, dur - 6));
  } else if (k === "bd3") { L.push(gifts(2.8, m * 0.11, m * 0.2, dur - 6)); L.push(emojiLayer(W, H, g, ["🧸", "🎀", "🎈"], 0.9, 50, 90, 1, dur - 6)); L.push(confettiLayer(W, H, g, 8, dur - 5)); }
  else if (k === "bd4") {
    const Wt = dur * 0.45; const smokes: P[] = []; const out = [0, 0, 0, 0, 0].map((_, i) => Wt + 0.1 + i * 0.16);
    const wind: P[] = []; let wacc = 0;
    L.push((t, dt, f) => {
      g.save(); g.globalAlpha = f; const sc = Math.min(1, t / 0.9); const cs = m * 0.95 * sc; const cxp = W / 2, cyp = H * 0.52;
      const tx = (i: number) => cxp + (-70 + i * 35) * (cs / 400) * 1; void tx;
      bigCake(g, cxp, cyp, cs, t, (i) => { if (t < out[i]) { const bend = t > Wt ? Math.max(0, 1 - (t - Wt) * 3) : 1; return bend; } return Math.max(0, 1 - (t - out[i]) * 8) * 0; }, (i, x, y) => { if (t > out[i] && t < out[i] + 4 && Math.random() < 0.5) smokes.push(mk({ x: cxp + (x - 200) * (cs / 400), y: cyp + (y - 200) * (cs / 400), vx: rnd(-8, 8), vy: -rnd(30, 60), s: rnd(5, 9), life: 0 })); });
      g.restore();
      if (t > Wt - 0.2 && t < Wt + 1.4) { wacc += dt * 120; while (wacc > 1) { wacc--; wind.push(mk({ x: -40, y: cyp - cs * 0.28 + rnd(-cs * 0.12, cs * 0.12), vx: rnd(900, 1600), vy: rnd(-40, 40), s: rnd(60, 180) })); } }
      for (let i = wind.length - 1; i >= 0; i--) { const p = wind[i]; p.life += dt; p.x += p.vx * dt; if (p.x > W + 100) { wind.splice(i, 1); continue; } g.strokeStyle = `rgba(255,255,255,${0.35 * f})`; g.lineWidth = 2; g.beginPath(); g.moveTo(p.x - p.s, p.y); g.bezierCurveTo(p.x - p.s * 0.6, p.y - 10, p.x - p.s * 0.3, p.y + 10, p.x, p.y); g.stroke(); }
      for (let i = smokes.length - 1; i >= 0; i--) { const p = smokes[i]; p.life += dt; if (p.life > 3.5) { smokes.splice(i, 1); continue; } p.x += (p.vx + Math.sin(t * 3 + p.ph) * 14) * dt; p.y += p.vy * dt; p.s += dt * 9; glow(g, p.x, p.y, p.s, "rgba(190,190,200,1)", 0.35 * (1 - p.life / 3.5) * f); }
    });
    L.push(cannonLayer(W, H, g, [Wt + 1.2, Wt + 1.3, Wt + 6], 45)); L.push(confettiLayer(W, H, g, 0, 0)); L.push((() => { const b = balloonsLayer(W, H, g, 1.6, m * 0.1, m * 0.18, dur - 6); return (t: number, dt: number, f: number) => { if (t > Wt + 1) b(t, dt, f); }; })());
  } else if (k === "bd5") { L.push(cups(3.2, m * 0.1, m * 0.17, dur - 6)); L.push(risingStars(W, H, g, 4, 14, 32, dur - 6)); }
  else {
    L.push(balloonsLayer(W, H, g, 2.2, m * 0.07, m * 0.12, dur - 8)); L.push(confettiLayer(W, H, g, 26, dur - 5)); L.push(gifts(1.4, m * 0.07, m * 0.12, dur - 6)); L.push(cups(1.8, m * 0.07, m * 0.12, dur - 6)); L.push(risingStars(W, H, g, 3, 10, 22, dur - 6)); L.push(cannonLayer(W, H, g, Array.from({ length: 8 }, (_, i) => 1.5 + i * 7), 22));
  }
  return L;
}
