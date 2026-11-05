/** Effets de Noël réalistes (canvas) : 3 décors par musique. */
type G = CanvasRenderingContext2D;
type Layer = (t: number, dt: number, f: number) => void;
export type NoelKind = "n1" | "n2" | "n3" | "n4" | "n5" | "n6" | "n7";
export const NOEL_DUR: Record<string, number> = { n1: 14.3, n2: 14.3, n3: 14.3, n4: 30.6, n5: 30.6, n6: 30.6, n7: 30.6 };
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const EMF = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const emo = (g: G, ch: string, x: number, y: number, s: number, a = 1, rot = 0, flip = 1) => { g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(rot); g.scale(flip, 1); g.font = `${s}px ${EMF}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(ch, 0, 0); g.restore(); };
const glow = (g: G, x: number, y: number, r: number, c: string, a: number) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, c); gr.addColorStop(1, "rgba(0,0,0,0)"); g.globalAlpha = a; g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill(); g.globalAlpha = 1; };
const sky = (g: G, W: number, H: number, c0: string, c1: string, c2: string, a: number) => { const s = g.createLinearGradient(0, 0, 0, H); s.addColorStop(0, c0); s.addColorStop(0.65, c1); s.addColorStop(1, c2); g.globalAlpha = a; g.fillStyle = s; g.fillRect(0, 0, W, H); g.globalAlpha = 1; };
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

/** Neige avec vent : petits flocons flous + grands cristaux. */
function snow(W: number, H: number, g: G, n: number, big: number): Layer {
  const fl = Array.from({ length: n }, () => ({ x: rnd(-60, W + 60), y: rnd(-H, H), d: Math.random(), ph: rnd(0, 6) }));
  const bg = Array.from({ length: big }, () => ({ x: rnd(0, W), y: rnd(-H, 0), s: rnd(10, 26), r: rnd(0, 6), vr: rnd(-1, 1), ph: rnd(0, 6) }));
  const cry = (x: number, y: number, s: number, r: number, a: number) => { g.save(); g.translate(x, y); g.rotate(r); g.globalAlpha = a; g.strokeStyle = "#fff"; g.lineWidth = Math.max(1, s / 9); g.lineCap = "round"; g.shadowColor = "rgba(150,190,255,.9)"; g.shadowBlur = 5; for (let i = 0; i < 6; i++) { g.rotate(1.0472); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -s); g.moveTo(0, -s * 0.55); g.lineTo(s * 0.25, -s * 0.8); g.moveTo(0, -s * 0.55); g.lineTo(-s * 0.25, -s * 0.8); g.stroke(); } g.restore(); };
  return (t, dt, f) => { const wind = 30 + (Math.sin(t * 0.8) * 0.5 + 0.5) * 70;
    for (const p of fl) { p.x += (wind * (0.4 + p.d) + Math.sin(t * 1.6 + p.ph) * 18) * dt; p.y += (40 + p.d * 110) * dt; if (p.y > H + 10) { p.y = -10; p.x = rnd(-60, W); } if (p.x > W + 60) p.x = -60; glow(g, p.x, p.y, 2 + p.d * 7, "rgba(255,255,255,1)", (0.5 + p.d * 0.45) * f); }
    for (const p of bg) { p.x += (wind * 0.8 + Math.sin(t + p.ph) * 25) * dt; p.y += 70 * dt; p.r += p.vr * dt; if (p.y > H + 30) { p.y = -30; p.x = rnd(0, W); } if (p.x > W + 40) p.x = -40; cry(p.x, p.y, p.s, p.r, 0.9 * f); } };
}
function bauble(g: G, x: number, y: number, r: number, hue: number, a = 1) {
  g.save(); g.globalAlpha = a; const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r); gr.addColorStop(0, `hsl(${hue},90%,82%)`); gr.addColorStop(0.5, `hsl(${hue},80%,48%)`); gr.addColorStop(1, `hsl(${hue},85%,22%)`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill();
  g.fillStyle = "#d9b24a"; g.fillRect(x - r * 0.18, y - r * 1.12, r * 0.36, r * 0.2); g.strokeStyle = "#d9b24a"; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y - r * 1.2, r * 0.12, 0, 6.283); g.stroke();
  g.fillStyle = "rgba(255,255,255,.85)"; g.beginPath(); g.ellipse(x - r * 0.38, y - r * 0.4, r * 0.2, r * 0.11, -0.7, 0, 6.283); g.fill(); g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = r * 0.12; g.beginPath(); g.arc(x, y, r * 0.65, 0.3, 1.9); g.stroke(); g.restore();
}
function starShape(g: G, x: number, y: number, r: number, c0: string, c1: string) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.42 : r; const an = (i * Math.PI) / 5 - Math.PI / 2; g.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); } g.closePath(); g.fill(); }

export function noelLayers(k: NoelKind, W: number, H: number, g: G): Layer[] {
  const m = Math.min(W, H); const L: Layer[] = [];
  if (k === "n1") { // Sapin illuminé sous la neige
    const bs = Array.from({ length: 26 }, (_, i) => ({ u: rnd(0.08, 0.92), v: (i + 0.5) / 26, hue: pick([0, 48, 210, 300, 130]) }));
    const lights = Array.from({ length: 46 }, () => ({ u: rnd(0.05, 0.95), v: rnd(0.08, 0.95), hue: pick([0, 48, 200, 320, 120]), ph: rnd(0, 6) }));
    L.push((t, _dt, f) => { sky(g, W, H, "#050b1e", "#0f1d3d", "#27324f", 0.9 * f);
      glow(g, W * 0.78, H * 0.16, m * 0.14, "rgba(255,248,210,1)", 0.9 * f); g.fillStyle = `rgba(255,252,235,${f})`; g.beginPath(); g.arc(W * 0.78, H * 0.16, m * 0.045, 0, 6.283); g.fill();
      const cx = W / 2, base = H - 40, th = Math.min(H * 0.82, W * 0.9), tw = th * 0.62; const gr = ease(t / 2.2); g.save(); g.globalAlpha = f; g.translate(cx, base); g.scale(gr, gr);
      g.fillStyle = "#4a2d17"; g.fillRect(-th * 0.04, -th * 0.07, th * 0.08, th * 0.07);
      for (let i = 0; i < 4; i++) { const y1 = -th * (0.08 + i * 0.2), y0 = y1 - th * 0.3, w = tw * (1 - i * 0.2) / 2; const lg = g.createLinearGradient(-w, 0, w, 0); lg.addColorStop(0, "#0b3b1f"); lg.addColorStop(0.45, "#1f7a3a"); lg.addColorStop(1, "#0a2f18"); g.fillStyle = lg; g.beginPath(); g.moveTo(0, y0); for (let j = 0; j <= 8; j++) { const u = j / 8; g.lineTo(-w * u - (j % 2 ? 0 : 10), y0 + (y1 - y0) * u + (j % 2 ? 4 : 0)); } g.lineTo(-w, y1); g.lineTo(w, y1); for (let j = 8; j >= 0; j--) { const u = j / 8; g.lineTo(w * u + (j % 2 ? 0 : 10), y0 + (y1 - y0) * u + (j % 2 ? 4 : 0)); } g.closePath(); g.fill(); g.fillStyle = "rgba(255,255,255,.5)"; g.beginPath(); g.ellipse(0, y0 + 6, w * 0.2, 5, 0, 0, 6.283); g.fill(); }
      g.strokeStyle = "#e8c35a"; g.lineWidth = 3; for (let i = 0; i < 4; i++) { const y1 = -th * (0.08 + i * 0.2), w = tw * (1 - i * 0.2) / 2 * 0.85; g.beginPath(); g.moveTo(-w, y1 - 10); g.quadraticCurveTo(0, y1 + 28, w, y1 - 10); g.stroke(); }
      bs.forEach((b) => { const y = -th * (0.1 + b.v * 0.78); const w = tw * (1 - (b.v * 0.78 + 0.1) * 1.05) / 2; bauble(g, (b.u - 0.5) * 2 * w * 0.9, y, th * 0.017, b.hue); });
      lights.forEach((l) => { const y = -th * (0.1 + l.v * 0.8); const w = tw * (1 - (l.v * 0.8 + 0.1) * 1.05) / 2; const on = 0.55 + 0.45 * Math.sin(t * 4 + l.ph); glow(g, (l.u - 0.5) * 2 * w * 0.9, y, th * 0.03, `hsl(${l.hue},100%,70%)`, on); });
      const sy = -th * 0.99; glow(g, 0, sy, th * 0.12, "rgba(255,220,120,1)", 0.7 + 0.3 * Math.sin(t * 3)); starShape(g, 0, sy, th * 0.045, "#fff6c0", "#e8a317");
      for (let i = 0; i < 6; i++) { const x = (i - 2.5) * th * 0.12; gift(g, x, -th * 0.015 - (i % 2) * 6, th * (0.07 + (i % 3) * 0.015), [350, 200, 130, 280, 40, 0][i]); }
      g.restore(); });
    L.push(snow(W, H, g, 200, 20));
  } else if (k === "n2") { // Traîneau du Père Noël devant la lune
    const stars = Array.from({ length: 120 }, () => [rnd(0, W), rnd(0, H * 0.8), rnd(0.5, 1.8), rnd(0, 6)]); const sp: { x: number; y: number; l: number }[] = [];
    L.push((t, dt, f) => { sky(g, W, H, "#03061a", "#101f4d", "#3a3f6b", 0.92 * f);
      stars.forEach((s) => { g.fillStyle = `rgba(255,255,255,${(0.4 + 0.6 * Math.sin(t * 2 + s[3]) ** 2) * f})`; g.fillRect(s[0], s[1], s[2], s[2]); });
      const mx = W * 0.5, my = H * 0.42, mr = m * 0.26; glow(g, mx, my, mr * 2.2, "rgba(255,250,215,1)", 0.55 * f); const mg = g.createRadialGradient(mx - mr * 0.2, my - mr * 0.2, mr * 0.1, mx, my, mr); mg.addColorStop(0, "#fffef2"); mg.addColorStop(1, "#ece6c3"); g.globalAlpha = f; g.fillStyle = mg; g.beginPath(); g.arc(mx, my, mr, 0, 6.283); g.fill(); g.fillStyle = "rgba(190,180,140,.35)"; for (const [a, b, r] of [[-0.3, -0.2, 0.15], [0.25, 0.1, 0.2], [-0.1, 0.4, 0.1], [0.4, -0.35, 0.09]]) { g.beginPath(); g.arc(mx + a * mr, my + b * mr, r * mr, 0, 6.283); g.fill(); } g.globalAlpha = 1;
      const u = Math.min(1, t / (NOEL_DUR.n2 - 1)); const x = -200 + u * (W + 400); const y = H * 0.7 - Math.sin(u * Math.PI) * H * 0.38 + Math.sin(t * 3) * 6; const sz = m * 0.1;
      for (let i = 0; i < 4; i++) sp.push({ x: x - 150 - Math.random() * 40, y: y + rnd(-10, 40), l: 0 });
      for (let i = sp.length - 1; i >= 0; i--) { const p = sp[i]; p.l += dt; if (p.l > 1.6) { sp.splice(i, 1); continue; } p.y += 18 * dt; glow(g, p.x, p.y, 7, i % 3 ? "rgba(255,220,120,1)" : "rgba(255,255,255,1)", (1 - p.l / 1.6) * f); }
      g.save(); (g as unknown as { filter: string }).filter = "brightness(0.04)"; g.globalAlpha = 0.95 * f; for (let i = 0; i < 4; i++) emo(g, "🦌", x - (3.4 - i * 0.9) * sz * 1.3, y + Math.sin(t * 7 + i) * 8 - i * 3, sz * 1.2, 1, -0.1, -1); emo(g, "🛷", x, y + sz * 0.1, sz * 2, 1, -0.05, -1); emo(g, "🎅", x + sz * 0.1, y - sz * 0.5, sz * 0.9, 1, 0); g.restore(); });
    L.push(snow(W, H, g, 130, 10));
  } else if (k === "n3") { // Cheminée, bas de Noël et guirlandes
    const em: { x: number; y: number; vy: number; l: number }[] = []; const fp: { x: number; y: number; vx: number; vy: number; l: number; m: number; s: number }[] = [];
    L.push((t, dt, f) => { const fl = 0.85 + 0.15 * Math.sin(t * 17) * Math.sin(t * 7);
      const wall = g.createLinearGradient(0, 0, 0, H); wall.addColorStop(0, "#1a0f0c"); wall.addColorStop(1, "#3a2216"); g.globalAlpha = 0.95 * f; g.fillStyle = wall; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
      const fw = Math.min(W * 0.6, 640), fx = (W - fw) / 2, fh = H * 0.5, fy = H - fh - 20; g.globalAlpha = f; g.fillStyle = "#5a3a28"; g.fillRect(fx - 30, fy - 24, fw + 60, 30); g.fillStyle = "#4a2f20"; g.fillRect(fx - 10, fy + 6, fw + 20, fh + 14);
      const hole = g.createLinearGradient(0, fy + 30, 0, fy + fh); hole.addColorStop(0, "#0b0504"); hole.addColorStop(1, "#1a0905"); g.fillStyle = hole; g.beginPath(); g.moveTo(fx + 30, fy + fh + 20); g.lineTo(fx + 30, fy + 90); g.quadraticCurveTo(fx + fw / 2, fy - 10, fx + fw - 30, fy + 90); g.lineTo(fx + fw - 30, fy + fh + 20); g.fill();
      for (let i = 0; i < 9; i++) fp.push({ x: fx + fw / 2 + rnd(-fw * 0.22, fw * 0.22), y: fy + fh + 10, vx: rnd(-20, 20), vy: -rnd(90, 260) * fl, l: 0, m: rnd(0.6, 1.2), s: rnd(26, 52) });
      g.globalCompositeOperation = "lighter"; for (let i = fp.length - 1; i >= 0; i--) { const p = fp[i]; p.l += dt; if (p.l > p.m) { fp.splice(i, 1); continue; } p.x += (p.vx + Math.sin(t * 6 + i) * 25) * dt; p.y += p.vy * dt; const u = p.l / p.m; const col = u < 0.3 ? "255,235,160" : u < 0.65 ? "255,150,40" : "210,50,10"; const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s); gr.addColorStop(0, `rgba(${col},${0.38 * (1 - u)})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.globalAlpha = f; g.beginPath(); g.arc(p.x, p.y, p.s, 0, 6.283); g.fill(); }
      glow(g, fx + fw / 2, fy + fh * 0.9, fw * 0.9, "rgba(255,120,30,1)", 0.3 * fl * f); g.globalCompositeOperation = "source-over"; g.globalAlpha = f;
      if (Math.random() < 0.5) em.push({ x: fx + fw / 2 + rnd(-fw * 0.2, fw * 0.2), y: fy + fh, vy: -rnd(80, 220), l: 0 }); for (let i = em.length - 1; i >= 0; i--) { const p = em[i]; p.l += dt; p.y += p.vy * dt; p.x += Math.sin(t * 4 + i) * 20 * dt; if (p.l > 2) { em.splice(i, 1); continue; } glow(g, p.x, p.y, 4, "rgba(255,190,80,1)", (1 - p.l / 2) * f); }
      for (let i = 0; i < 4; i++) { const sx = fx + 40 + i * (fw - 80) / 3, sy = fy + 4; g.save(); g.translate(sx, sy); g.rotate(Math.sin(t * 1.5 + i) * 0.05); g.fillStyle = i % 2 ? "#1f7a3a" : "#c4122f"; g.beginPath(); g.moveTo(-14, 0); g.lineTo(14, 0); g.lineTo(14, 60); g.quadraticCurveTo(14, 90, 36, 100); g.quadraticCurveTo(44, 120, 8, 118); g.quadraticCurveTo(-14, 112, -14, 80); g.closePath(); g.fill(); g.fillStyle = "#fff"; g.fillRect(-15, -4, 30, 16); g.restore(); }
      g.strokeStyle = "#1f6a30"; g.lineWidth = 9; g.lineCap = "round"; g.beginPath(); g.moveTo(fx - 30, fy - 26); g.quadraticCurveTo(W / 2, fy + 10, fx + fw + 30, fy - 26); g.stroke();
      for (let i = 0; i < 24; i++) { const u = i / 23; const x = fx - 30 + u * (fw + 60); const y = (1 - u) * (fy - 26) * (1 - u) + 2 * u * (1 - u) * (fy + 10) + u * u * (fy - 26); glow(g, x, y, 13, `hsl(${pick([0, 48, 200, 320])},100%,68%)`, 0.5 + 0.5 * Math.sin(t * 5 + i)); }
      g.globalAlpha = 1; });
    L.push(snow(W, H, g, 60, 6));
  } else if (k === "n4") { // Boules de Noël suspendues
    const hang = Array.from({ length: 16 }, (_, i) => ({ x: (i + 0.5) * W / 16 + rnd(-20, 20), len: rnd(H * 0.2, H * 0.78), r: rnd(m * 0.035, m * 0.075), hue: pick([0, 48, 210, 300, 130, 20]), ph: rnd(0, 6), d: rnd(0, 3) }));
    const fall: { x: number; y: number; vy: number; r: number; hue: number }[] = []; let acc = 0;
    L.push((t, dt, f) => { sky(g, W, H, "#1a0a14", "#2a1220", "#3a1a1c", 0.88 * f); acc += dt * 0.5; while (acc > 1) { acc--; fall.push({ x: rnd(0, W), y: -40, vy: 0, r: rnd(m * 0.03, m * 0.05), hue: pick([0, 48, 210, 300, 130]) }); }
      for (const h of hang) { const u = ease((t - h.d * 0.3) / 1.5); const ang = Math.sin(t * 1.4 + h.ph) * 0.12; const ln = h.len * u; const bx = h.x + Math.sin(ang) * ln, by = Math.cos(ang) * ln; g.strokeStyle = `rgba(230,200,120,${0.7 * f})`; g.lineWidth = 1.5; g.beginPath(); g.moveTo(h.x, 0); g.lineTo(bx, by - h.r * 1.2); g.stroke(); bauble(g, bx, by, h.r, h.hue, f); }
      for (let i = fall.length - 1; i >= 0; i--) { const p = fall[i]; p.vy += 900 * dt; p.y += p.vy * dt; if (p.y > H - p.r) { p.y = H - p.r; p.vy *= -0.55; if (Math.abs(p.vy) < 60) { fall.splice(i, 1); continue; } } bauble(g, p.x, p.y, p.r, p.hue, f); }
      for (const sd of [0, 1]) { g.save(); g.globalAlpha = f; g.translate(sd ? W : 0, 0); g.scale(sd ? -1 : 1, 1); for (let i = 0; i < 90; i++) { const a = rnd(0.1, 1.2), l = rnd(60, 220); g.strokeStyle = `hsl(${rnd(115, 140)},60%,${rnd(14, 30)}%)`; g.lineWidth = 2; g.beginPath(); const sx = rnd(0, 120), sy = rnd(0, 80); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(a) * l, sy + Math.sin(a) * l * 0.8); g.stroke(); } g.restore(); } });
    L.push(snow(W, H, g, 70, 4));
  } else if (k === "n5") { // Aurore boréale sur un village enneigé
    const stars = Array.from({ length: 150 }, () => [rnd(0, W), rnd(0, H * 0.7), rnd(0.5, 1.8), rnd(0, 6)]); const houses = Array.from({ length: 9 }, (_, i) => ({ x: (i + 0.3) * W / 9, w: rnd(60, 110), h: rnd(40, 80), win: Math.random() }));
    const smoke: { x: number; y: number; l: number }[] = []; const shoot: { x: number; y: number; l: number }[] = [];
    L.push((t, dt, f) => { sky(g, W, H, "#020716", "#0a1c3e", "#1b3a55", 0.93 * f);
      stars.forEach((s) => { g.fillStyle = `rgba(255,255,255,${(0.3 + 0.7 * Math.sin(t * 1.5 + s[3]) ** 2) * f})`; g.fillRect(s[0], s[1], s[2], s[2]); });
      g.globalCompositeOperation = "lighter"; for (let b = 0; b < 3; b++) { const col = ["60,255,170", "80,200,255", "170,110,255"][b]; for (let x = 0; x < W; x += 6) { const y = H * (0.18 + b * 0.06) + Math.sin(x * 0.006 + t * 0.6 + b * 2) * H * 0.07 + Math.sin(x * 0.015 - t * 0.9) * 14; const hh = H * (0.16 + 0.05 * Math.sin(x * 0.01 + t + b)); const gr = g.createLinearGradient(0, y - hh, 0, y + hh * 0.3); gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(0.7, `rgba(${col},${0.2 * f})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x, y - hh, 7, hh * 1.3); } } g.globalCompositeOperation = "source-over";
      if (Math.random() < 0.01) shoot.push({ x: rnd(0, W * 0.6), y: rnd(0, H * 0.3), l: 0 }); for (let i = shoot.length - 1; i >= 0; i--) { const s = shoot[i]; s.l += dt; s.x += 700 * dt; s.y += 300 * dt; if (s.l > 0.8) { shoot.splice(i, 1); continue; } g.strokeStyle = `rgba(255,255,255,${(1 - s.l / 0.8) * f})`; g.lineWidth = 2; g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(s.x - 90, s.y - 38); g.stroke(); }
      const gy = H * 0.8; const gg = g.createLinearGradient(0, gy, 0, H); gg.addColorStop(0, "#dfe9f7"); gg.addColorStop(1, "#8fa6c4"); g.globalAlpha = f; g.fillStyle = gg; g.beginPath(); g.moveTo(0, H); g.lineTo(0, gy + 10); for (let x = 0; x <= W; x += 20) g.lineTo(x, gy + Math.sin(x * 0.01) * 12); g.lineTo(W, H); g.fill();
      houses.forEach((h, i) => { const hx = h.x, hy = gy + 10; g.fillStyle = "#1a2236"; g.fillRect(hx, hy - h.h, h.w, h.h); g.fillStyle = "#e9f1ff"; g.beginPath(); g.moveTo(hx - 8, hy - h.h); g.lineTo(hx + h.w / 2, hy - h.h - h.w * 0.35); g.lineTo(hx + h.w + 8, hy - h.h); g.closePath(); g.fill(); g.fillStyle = "#1a2236"; g.fillRect(hx + h.w * 0.75, hy - h.h - h.w * 0.3, 10, 22);
        const lit = h.win > 0.25; if (lit) { glow(g, hx + h.w * 0.3, hy - h.h * 0.5, 36, "rgba(255,200,90,1)", 0.55 * f); g.fillStyle = `rgba(255,214,120,${f})`; g.fillRect(hx + h.w * 0.2, hy - h.h * 0.65, 18, 20); g.fillRect(hx + h.w * 0.55, hy - h.h * 0.65, 18, 20); } if (i % 2 === 0 && Math.random() < 0.06) smoke.push({ x: hx + h.w * 0.75 + 5, y: hy - h.h - h.w * 0.3, l: 0 }); });
      for (let i = smoke.length - 1; i >= 0; i--) { const s = smoke[i]; s.l += dt; s.y -= 28 * dt; s.x += (14 + Math.sin(t + i) * 8) * dt; if (s.l > 4) { smoke.splice(i, 1); continue; } glow(g, s.x, s.y, 10 + s.l * 9, "rgba(200,205,220,1)", 0.3 * (1 - s.l / 4) * f); }
      for (let i = 0; i < 10; i++) { const x = (i + 0.5) * W / 10 + 20, ph = (i % 3) * 18; g.fillStyle = "#0b2a22"; g.beginPath(); g.moveTo(x, gy - 70 - ph); g.lineTo(x - 28, gy + 14); g.lineTo(x + 28, gy + 14); g.fill(); g.fillStyle = "rgba(255,255,255,.75)"; g.beginPath(); g.moveTo(x, gy - 70 - ph); g.lineTo(x - 14, gy - 36 - ph); g.lineTo(x + 14, gy - 36 - ph); g.fill(); } g.globalAlpha = 1; });
    L.push(snow(W, H, g, 160, 8));
  } else if (k === "n7") { L.push(roomScene(W, H, g)); L.push(snow(W, H, g, 0, 0));
  } else { // Guirlandes lumineuses, sucres d'orge et notes de boîte à musique
    const ps: { x: number; y: number; k: number; s: number; r: number; vr: number; vy: number; ph: number }[] = []; let acc = 0; const notes: { x: number; y: number; s: number; ph: number; c: string }[] = []; let nacc = 0;
    const cane = (x: number, y: number, s: number, r: number) => { g.save(); g.translate(x, y); g.rotate(r); g.lineCap = "round"; g.lineWidth = s * 0.22; g.strokeStyle = "#fff"; g.beginPath(); g.moveTo(0, s); g.lineTo(0, -s * 0.2); g.arc(s * 0.3, -s * 0.2, s * 0.3, Math.PI, 0); g.stroke(); g.strokeStyle = "#d1132f"; g.setLineDash([s * 0.18, s * 0.18]); g.stroke(); g.setLineDash([]); g.restore(); };
    L.push((t, dt, f) => { sky(g, W, H, "#10162e", "#1a2145", "#2a2f58", 0.88 * f);
      acc += dt * 3; while (acc > 1) { acc--; ps.push({ x: rnd(0, W), y: -50, k: Math.floor(rnd(0, 6)), s: rnd(m * 0.05, m * 0.1), r: rnd(0, 6), vr: rnd(-1.5, 1.5), vy: rnd(70, 160), ph: rnd(0, 6) }); }
      nacc += dt * 2.2; while (nacc > 1) { nacc--; notes.push({ x: rnd(0, W), y: H + 20, s: rnd(22, 46), ph: rnd(0, 6), c: pick(["#ffe27a", "#ffffff", "#ffb3c8", "#a8e6ff"]) }); }
      for (let i = ps.length - 1; i >= 0; i--) { const p = ps[i]; p.y += p.vy * dt; p.x += Math.sin(t * 1.3 + p.ph) * 26 * dt; p.r += p.vr * dt; if (p.y > H + 80) { ps.splice(i, 1); continue; } g.globalAlpha = f; if (p.k < 2) cane(p.x, p.y, p.s, p.r); else emo(g, ["", "", "🎄", "🎁", "🔔", "⭐"][p.k], p.x, p.y, p.s, f, p.r * 0.2); g.globalAlpha = 1; }
      for (let i = notes.length - 1; i >= 0; i--) { const n = notes[i]; n.y -= 70 * dt; n.x += Math.sin(t * 2 + n.ph) * 24 * dt; if (n.y < -40) { notes.splice(i, 1); continue; } g.fillStyle = n.c; g.globalAlpha = 0.85 * f; g.font = `${n.s}px serif`; g.textAlign = "center"; g.fillText(i % 2 ? "♪" : "♫", n.x, n.y); g.globalAlpha = 1; }
      for (let row = 0; row < 2; row++) { const y0 = row * 46 + 10; g.strokeStyle = `rgba(20,80,40,${f})`; g.lineWidth = 3; g.beginPath(); for (let x = 0; x <= W; x += 10) { const y = y0 + 34 * Math.abs(Math.sin((x / W) * Math.PI * 6)) ** 0.7; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
        for (let x = 20; x < W; x += 34) { const y = y0 + 34 * Math.abs(Math.sin((x / W) * Math.PI * 6)) ** 0.7; const hue = [0, 48, 130, 210, 300][((x / 34) | 0 + row) % 5]; glow(g, x, y + 8, 22, `hsl(${hue},100%,65%)`, (0.5 + 0.5 * Math.sin(t * 4 + x * 0.1 + row)) * f); g.fillStyle = `hsl(${hue},90%,70%)`; g.globalAlpha = f; g.beginPath(); g.ellipse(x, y + 6, 4, 7, 0, 0, 6.283); g.fill(); g.globalAlpha = 1; } } });
    L.push(snow(W, H, g, 90, 10));
  }
  return L;
}

/** Père Noël dessiné (face), avec ses états : marche, sac, verre de lait, salut. */
function santa(g: G, x: number, y: number, S: number, o: { bob?: number; sack?: boolean; drink?: number; wave?: number; flip?: number }) {
  g.save(); g.translate(x, y + (o.bob || 0)); g.scale(S * (o.flip || 1), S);
  const sh = g.createRadialGradient(0, 0, 0, 0, 0, 60); sh.addColorStop(0, "rgba(0,0,0,.35)"); sh.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = sh; g.beginPath(); g.ellipse(0, 0, 60, 12, 0, 0, 6.283); g.fill();
  g.fillStyle = "#14110f"; g.beginPath(); g.roundRect(-30, -22, 24, 22, 6); g.roundRect(6, -22, 24, 22, 6); g.fill();
  const red = g.createLinearGradient(-50, 0, 50, 0); red.addColorStop(0, "#8f0f1a"); red.addColorStop(0.4, "#d9232f"); red.addColorStop(1, "#8f0f1a");
  g.fillStyle = red; g.fillRect(-24, -90, 20, 70); g.fillRect(4, -90, 20, 70);
  g.beginPath(); g.moveTo(-42, -86); g.quadraticCurveTo(-50, -170, 0, -178); g.quadraticCurveTo(50, -170, 42, -86); g.quadraticCurveTo(0, -70, -42, -86); g.fill();
  g.fillStyle = "#f4f1ea"; g.fillRect(-12, -178, 24, 100); g.fillStyle = "#14110f"; g.fillRect(-44, -116, 88, 14); g.fillStyle = "#e8c35a"; g.fillRect(-9, -118, 18, 18); g.fillStyle = "#14110f"; g.fillRect(-5, -114, 10, 10);
  g.fillStyle = "#f4f1ea"; g.beginPath(); g.roundRect(-44, -92, 88, 12, 6); g.fill();
  const arm = (side: number, ang: number, up = false) => { g.save(); g.translate(side * 40, -160); g.rotate(ang); g.fillStyle = red; g.beginPath(); g.roundRect(-9, 0, 18, 66, 9); g.fill(); g.fillStyle = "#f4f1ea"; g.beginPath(); g.roundRect(-11, 56, 22, 12, 6); g.fill(); g.fillStyle = "#14110f"; g.beginPath(); g.arc(0, 76, 11, 0, 6.283); g.fill(); g.restore(); void up; };
  const dr = o.drink || 0; arm(-1, o.wave ? -2.4 + Math.sin(o.wave * 9) * 0.35 : 0.15); arm(1, 0.1 + 2.1 * dr);
  if (o.sack) { g.fillStyle = "#7a5a34"; g.beginPath(); g.ellipse(-62, -60, 38, 46, 0.2, 0, 6.283); g.fill(); g.strokeStyle = "#523a1f"; g.lineWidth = 4; g.beginPath(); g.moveTo(-76, -98); g.quadraticCurveTo(-60, -112, -44, -96); g.stroke(); }
  const skin = "#f2c9a8"; g.fillStyle = skin; g.beginPath(); g.arc(0, -206, 30, 0, 6.283); g.fill(); g.fillStyle = "rgba(240,120,120,.45)"; g.beginPath(); g.arc(-17, -200, 8, 0, 6.283); g.arc(17, -200, 8, 0, 6.283); g.fill();
  g.fillStyle = "#f7f5f0"; g.beginPath(); g.moveTo(-32, -212); g.quadraticCurveTo(-46, -150, 0, -140); g.quadraticCurveTo(46, -150, 32, -212); g.quadraticCurveTo(20, -190, 0, -194); g.quadraticCurveTo(-20, -190, -32, -212); g.fill();
  g.beginPath(); g.ellipse(-12, -196, 14, 7, 0.2, 0, 6.283); g.ellipse(12, -196, 14, 7, -0.2, 0, 6.283); g.fill(); g.fillStyle = "#e8a58a"; g.beginPath(); g.arc(0, -203, 6, 0, 6.283); g.fill();
  g.fillStyle = "#2a2018"; const bl = dr > 0.5 ? 0.2 : 1; g.beginPath(); g.ellipse(-11, -214, 3.2, 3.2 * bl, 0, 0, 6.283); g.ellipse(11, -214, 3.2, 3.2 * bl, 0, 0, 6.283); g.fill(); g.strokeStyle = "#f7f5f0"; g.lineWidth = 4; g.beginPath(); g.moveTo(-18, -224); g.lineTo(-6, -222); g.moveTo(18, -224); g.lineTo(6, -222); g.stroke();
  g.fillStyle = "#d9232f"; g.beginPath(); g.moveTo(-32, -226); g.quadraticCurveTo(-30, -280, 14, -268); g.quadraticCurveTo(40, -300, 48, -250); g.quadraticCurveTo(34, -258, 32, -226); g.closePath(); g.fill(); g.fillStyle = "#f7f5f0"; g.beginPath(); g.roundRect(-36, -236, 72, 16, 8); g.fill(); g.beginPath(); g.arc(48, -250, 11, 0, 6.283); g.fill();
  if (dr) { const aa = 0.1 + 2.1 * dr; g.save(); g.translate(40 - 78 * Math.sin(aa), -160 + 78 * Math.cos(aa)); g.rotate(-0.5 * dr); g.fillStyle = "rgba(235,245,255,.7)"; g.beginPath(); g.moveTo(-10, -30); g.lineTo(10, -30); g.lineTo(8, 0); g.lineTo(-8, 0); g.fill(); g.fillStyle = "#fff"; g.fillRect(-9, -22 + dr * 10, 18, 20 - dr * 10); g.restore(); }
  g.restore();
}
function roomScene(W: number, H: number, g: G): Layer {
  const fl = H * 0.78; const em: { x: number; y: number; l: number; vy: number }[] = []; const dur = NOEL_DUR.n7;
  const lights = Array.from({ length: 38 }, () => ({ u: rnd(0.08, 0.92), v: rnd(0.08, 0.92), hue: pick([0, 48, 200, 320, 120]), ph: rnd(0, 6) }));
  const snowOut = Array.from({ length: 50 }, () => ({ x: rnd(0, 1), y: rnd(0, 1), s: rnd(0.4, 1.2) }));
  const gifts = [[0.36, 330], [0.42, 200], [0.27, 130], [0.46, 40], [0.22, 290]];
  return (t, dt, f) => {
    const m = Math.min(W, H); const wall = g.createLinearGradient(0, 0, 0, fl); wall.addColorStop(0, "#2a1913"); wall.addColorStop(1, "#4d3225"); g.globalAlpha = f; g.fillStyle = wall; g.fillRect(0, 0, W, fl);
    g.fillStyle = "rgba(255,255,255,.03)"; for (let x = 0; x < W; x += 36) g.fillRect(x, 0, 14, fl);
    const fg = g.createLinearGradient(0, fl, 0, H); fg.addColorStop(0, "#6b4426"); fg.addColorStop(1, "#3a2413"); g.fillStyle = fg; g.fillRect(0, fl, W, H - fl); g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 2; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(0, fl + i * (H - fl) / 9); g.lineTo(W, fl + i * (H - fl) / 9); g.stroke(); }
    g.fillStyle = "#e9dfd0"; g.fillRect(0, fl - 10, W, 12);
    const wx = W * 0.6, wy = H * 0.1, ww = W * 0.22, wh = H * 0.4; const ng = g.createLinearGradient(0, wy, 0, wy + wh); ng.addColorStop(0, "#07102b"); ng.addColorStop(1, "#1d3052"); g.fillStyle = ng; g.fillRect(wx, wy, ww, wh); glow(g, wx + ww * 0.75, wy + wh * 0.25, ww * 0.35, "rgba(255,250,215,1)", 0.8);
    g.fillStyle = "#fff"; snowOut.forEach((s) => { const y = (s.y + t * 0.05 * s.s) % 1; g.globalAlpha = f * 0.9; g.fillRect(wx + ((s.x + Math.sin(t + s.y * 9) * 0.01 + 1) % 1) * ww, wy + y * wh, 2 * s.s, 2 * s.s); }); g.globalAlpha = f;
    g.strokeStyle = "#e9dfd0"; g.lineWidth = 8; g.strokeRect(wx, wy, ww, wh); g.beginPath(); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); g.moveTo(wx, wy + wh / 2); g.lineTo(wx + ww, wy + wh / 2); g.lineWidth = 5; g.stroke();
    g.fillStyle = "rgba(255,255,255,.9)"; g.fillRect(wx - 6, wy + wh - 2, ww + 12, 8);
    const px = W * 0.04, pw = W * 0.2, ph = H * 0.42, py = fl - ph; g.fillStyle = "#6b5b52"; g.fillRect(px - 14, py - 20, pw + 28, 24); g.fillStyle = "#4a3b34"; g.fillRect(px, py, pw, ph); g.fillStyle = "#0b0605"; g.fillRect(px + 22, py + 36, pw - 44, ph - 36);
    const flk = 0.85 + 0.15 * Math.sin(t * 15) * Math.sin(t * 6.3); g.globalCompositeOperation = "lighter"; for (let i = 0; i < 4; i++) { const fxp = px + pw / 2 + rnd(-pw * 0.25, pw * 0.25); glow(g, fxp, py + ph - 24 - rnd(0, 40 * flk), 36, i % 2 ? "rgba(255,150,40,1)" : "rgba(255,225,130,1)", 0.45); } glow(g, px + pw / 2, py + ph - 20, pw * 1.6, "rgba(255,120,30,1)", 0.28 * flk); g.globalCompositeOperation = "source-over";
    for (let i = 0; i < 3; i++) { const sx = px + 30 + i * (pw - 60) / 2; g.fillStyle = i % 2 ? "#1f7a3a" : "#c4122f"; g.beginPath(); g.moveTo(sx - 9, py - 20); g.lineTo(sx + 9, py - 20); g.lineTo(sx + 9, py + 20); g.quadraticCurveTo(sx + 9, py + 38, sx + 24, py + 42); g.quadraticCurveTo(sx + 26, py + 54, sx, py + 52); g.quadraticCurveTo(sx - 9, py + 50, sx - 9, py + 30); g.closePath(); g.fill(); g.fillStyle = "#fff"; g.fillRect(sx - 10, py - 22, 20, 9); }
    glow(g, px + pw / 2, fl, W * 0.3, "rgba(255,150,60,1)", 0.12 * flk);
    const tx = W * 0.36, th = H * 0.66, tw = th * 0.56; g.save(); g.translate(tx, fl); const gr = ease(t / 2); g.scale(gr, gr); g.fillStyle = "#4a2d17"; g.fillRect(-th * 0.035, -th * 0.07, th * 0.07, th * 0.07);
    for (let i = 0; i < 4; i++) { const y1 = -th * (0.07 + i * 0.2), y0 = y1 - th * 0.3, w = tw * (1 - i * 0.2) / 2; const lg = g.createLinearGradient(-w, 0, w, 0); lg.addColorStop(0, "#0b3b1f"); lg.addColorStop(0.45, "#1f7a3a"); lg.addColorStop(1, "#0a2f18"); g.fillStyle = lg; g.beginPath(); g.moveTo(0, y0); for (let j = 0; j <= 8; j++) { const u = j / 8; g.lineTo(-w * u - (j % 2 ? 0 : 9), y0 + (y1 - y0) * u + (j % 2 ? 4 : 0)); } g.lineTo(-w, y1); g.lineTo(w, y1); for (let j = 8; j >= 0; j--) { const u = j / 8; g.lineTo(w * u + (j % 2 ? 0 : 9), y0 + (y1 - y0) * u + (j % 2 ? 4 : 0)); } g.closePath(); g.fill(); }
    lights.forEach((l) => { const y = -th * (0.1 + l.v * 0.8); const w = tw * (1 - (l.v * 0.8 + 0.1) * 1.05) / 2; glow(g, (l.u - 0.5) * 2 * w * 0.9, y, th * 0.028, `hsl(${l.hue},100%,70%)`, 0.55 + 0.45 * Math.sin(t * 4 + l.ph)); });
    for (let i = 0; i < 14; i++) { const v = (i + 0.5) / 14; const y = -th * (0.1 + v * 0.78); const w = tw * (1 - (v * 0.78 + 0.1) * 1.05) / 2; bauble(g, (((i * 37) % 10) / 10 - 0.5) * 2 * w * 0.85, y, th * 0.016, [0, 48, 210, 300][i % 4]); }
    glow(g, 0, -th * 0.99, th * 0.1, "rgba(255,220,120,1)", 0.7); starShape(g, 0, -th * 0.99, th * 0.04, "#fff6c0", "#e8a317"); g.restore();
    const wsx = W * 0.62, tby = fl + 6; g.fillStyle = "#6a4528"; g.fillRect(wsx, tby - H * 0.14, W * 0.12, 10); g.fillRect(wsx + 8, tby - H * 0.14, 8, H * 0.14); g.fillRect(wsx + W * 0.12 - 16, tby - H * 0.14, 8, H * 0.14);
    const eaten = t > 17 ? 1 : 0; const milk = t < 13 ? 1 : t < 17 ? 1 - (t - 13) / 4 : 0.02; if (!(t > 13 && t < 17.6)) { const gx = wsx + 20, gy = tby - H * 0.14; g.fillStyle = "rgba(220,235,255,.45)"; g.beginPath(); g.moveTo(gx - 12, gy - 40); g.lineTo(gx + 12, gy - 40); g.lineTo(gx + 9, gy); g.lineTo(gx - 9, gy); g.fill(); g.fillStyle = "#fff"; g.fillRect(gx - 10, gy - 4 - 32 * milk * (t > 17 ? 0.15 : 1), 20, 32 * milk * (t > 17 ? 0.15 : 1)); }
    g.fillStyle = "#f3efe8"; g.beginPath(); g.ellipse(wsx + W * 0.07, tby - H * 0.14 - 4, 34, 8, 0, 0, 6.283); g.fill(); if (!eaten) for (let i = 0; i < 3; i++) { g.fillStyle = "#b9803f"; g.beginPath(); g.arc(wsx + W * 0.07 - 16 + i * 16, tby - H * 0.14 - 12, 11, 0, 6.283); g.fill(); g.fillStyle = "#4a2a14"; g.fillRect(wsx + W * 0.07 - 20 + i * 16, tby - H * 0.14 - 14, 3, 3); g.fillRect(wsx + W * 0.07 - 12 + i * 16, tby - H * 0.14 - 9, 3, 3); }
    gifts.forEach(([u, h], i) => { const at = 7.5 + i * 0.9; if (t > at) { const k = ease((t - at) / 0.4); gift(g, tx + (u - 0.36) * W * 0.9 + (i % 2 ? 40 : -40), fl + 8 - (1 - k) * 40, H * (0.07 + (i % 3) * 0.015), h); } });
    const door = ease((t - 2.4) / 0.6) * (t < 25 ? 1 : 0); void door;
    let sx = W + 80, o: { bob?: number; sack?: boolean; drink?: number; wave?: number; flip?: number } = { flip: -1 }; const S = H * 0.0019;
    if (t > 3 && t < 7.5) { const u = (t - 3) / 4.5; sx = W * 0.95 + (tx + W * 0.1 - W * 0.95) * ease(u); o = { flip: -1, sack: true, bob: Math.abs(Math.sin(t * 7)) * -6 }; }
    else if (t >= 7.5 && t < 10.5) { sx = tx + W * 0.1; o = { flip: -1, sack: t < 9.5, bob: Math.sin(t * 3) * -2 }; }
    else if (t >= 10.5 && t < 13) { const u = (t - 10.5) / 2.5; sx = tx + W * 0.1 + (wsx - 20 - (tx + W * 0.1)) * ease(u); o = { flip: 1, bob: Math.abs(Math.sin(t * 7)) * -6 }; }
    else if (t >= 13 && t < 19) { sx = wsx - 20; o = { flip: 1, drink: t < 14 ? t - 13 : t < 17 ? 1 : Math.max(0, 1 - (t - 17) / 1) }; }
    else if (t >= 19 && t < 22.5) { sx = wsx - 20; o = { flip: 1, wave: t }; }
    else if (t >= 22.5 && t < 27) { const u = (t - 22.5) / 4.5; sx = wsx - 20 + (W + 100 - (wsx - 20)) * ease(u); o = { flip: -1 * -1, bob: Math.abs(Math.sin(t * 7)) * -6 }; }
    if (t > 3 && t < 27) santa(g, sx, fl + (H - fl) * 0.45, S, o);
    if (t > 22 && t < 26) { g.globalAlpha = f * Math.min(1, t - 22); g.font = `${m * 0.05}px serif`; g.fillStyle = "#fff4c8"; g.textAlign = "center"; g.fillText("Ho ! Ho ! Ho !", W * 0.5, H * 0.16); }
    if (Math.random() < 0.4) em.push({ x: px + pw / 2 + rnd(-pw * 0.2, pw * 0.2), y: py + ph - 20, l: 0, vy: -rnd(60, 160) }); for (let i = em.length - 1; i >= 0; i--) { const p = em[i]; p.l += dt; p.y += p.vy * dt; if (p.l > 1.5) { em.splice(i, 1); continue; } glow(g, p.x, p.y, 4, "rgba(255,190,80,1)", (1 - p.l / 1.5) * f); }
    const vg = g.createRadialGradient(W / 2, H / 2, m * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.45)"); g.globalAlpha = f; g.fillStyle = vg; g.fillRect(0, 0, W, H); g.globalAlpha = 1; void dur;
  };
}

function gift(g: G, x: number, y: number, s: number, hue: number) { g.save(); g.translate(x, y); const hs = s / 2; const bx = g.createLinearGradient(-hs, 0, hs, 0); bx.addColorStop(0, `hsl(${hue},75%,52%)`); bx.addColorStop(0.5, `hsl(${hue},80%,62%)`); bx.addColorStop(1, `hsl(${hue},75%,34%)`); g.fillStyle = bx; g.fillRect(-hs, -s, s, s); g.fillStyle = "#f0cf63"; g.fillRect(-s * 0.07, -s, s * 0.14, s); g.fillRect(-hs, -s * 0.55, s, s * 0.12); for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(0, -s); g.bezierCurveTo(sd * s * 0.5, -s * 1.5, sd * s * 0.5, -s * 0.9, 0, -s); g.fill(); } g.restore(); }
