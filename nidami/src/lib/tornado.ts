import { pickEls, collapseStop } from "./collapse";
const R = (a: number, b: number) => a + Math.random() * (b - a);
const D = 9.5; // durée totale (s)
let stopper: (() => void) | null = null;
export function tornadoStop() { stopper?.(); stopper = null; collapseStop(); }

function sprite(col: string): HTMLCanvasElement {
  const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d")!; const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, `rgba(${col},1)`); gr.addColorStop(0.45, `rgba(${col},.45)`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
}
/** Tornade : un entonnoir de poussière qui traverse l'écran et aspire les éléments de l'appli, puis tout revient. */
export function tornadoShow() {
  tornadoStop();
  const box = document.createElement("div"); box.className = "fxbox sc"; box.setAttribute("aria-hidden", "true");
  const cv = document.createElement("canvas"); box.appendChild(cv); const dpr = Math.min(2, window.devicePixelRatio || 1); const W = innerWidth, H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr; cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%"; const g = cv.getContext("2d"); if (!g) return; g.scale(dpr, dpr); document.body.appendChild(box);
  const root = document.documentElement; root.classList.add("collapsing");
  const sc = Math.max(0.6, Math.min(1.6, Math.min(W, H) / 700)); const base = H * 0.9, top = H * 0.07, hh = base - top;
  const SP = [sprite("205,198,186"), sprite("140,132,120"), sprite("78,72,66"), sprite("120,100,78")];
  const x0 = -W * 0.12, x1 = W * 1.12; const T0 = 0.5, T1 = D - 1.5; const Tx = (t: number) => x0 + (x1 - x0) * Math.min(1, Math.max(0, (t - T0) / (T1 - T0))) + Math.sin(t * 0.8) * 30 * sc;
  const Rf = (u: number) => (10 + 140 * Math.pow(u, 1.6)) * sc;
  const P = Array.from({ length: 1700 }, () => ({ u: Math.pow(Math.random(), 0.8), a: R(0, 6.283), s: R(8, 26), k: Math.random() < 0.18 ? 3 : Math.random() < 0.5 ? 1 : Math.random() < 0.5 ? 0 : 2, ra: R(0.7, 1.15) }));
  const DB = Array.from({ length: 70 }, () => ({ u: R(0.02, 0.85), a: R(0, 6.283), r: R(1.05, 1.9), k: Math.floor(R(0, 4)), s: R(0.8, 1.6), rot: R(0, 6) }));
  const els = pickEls(); const xs = x1 - x0;
  const E = els.map((e) => { const r = e.getBoundingClientRect(); const ex = r.left + r.width / 2, ey = r.top + r.height / 2; return { e, ex, ey, tc: T0 + ((ex - x0) / xs) * (T1 - T0) - R(0.1, 0.5), th: R(0, 6.283), sp: R(1, 1.5), r0: R(30, 120) * sc, out: R(0, 1) > 0.5 ? 1 : -1, last: "none", rel: null as null | { x: number; y: number; vx: number; vy: number; rot: number; vr: number }, cap: false }; });
  const anims: Animation[] = []; let flash = 0; let bolts: [number, number][] = []; const lights = [2.4, 4.9, 6.6]; let li = 0; let raf = 0; let rebuilt = false; let last = performance.now(); const t0 = last;
  const bolt = (x: number) => { const pts: [number, number][] = [[x, 0]]; let y = 0; let xx = x; while (y < H * 0.5) { y += R(18, 46); xx += R(-26, 26); pts.push([xx, y]); } return pts; };
  const layer = (t: number, back: boolean) => {
    const grow = Math.min(1, Math.max(0, (t - 0.2) / 1.4)) * Math.min(1, Math.max(0, (D - 0.3 - t) / 1.6)); const umin = 1 - grow; const tx = Tx(t);
    const cxu = (u: number) => tx + Math.sin(t * 1.3 - u * 2.6) * 55 * u * sc - u * u * 70 * sc;
    for (const p of P) { if (p.u < umin) continue; const w = 5.5 + 8 * Math.pow(1 - p.u, 2); const a = p.a + w * t * p.ra; const sn = Math.sin(a); if ((sn > 0) === back) continue; const r = Rf(p.u) * (0.85 + 0.3 * Math.sin(p.a * 3 + t));
      const x = cxu(p.u) + Math.cos(a) * r, y = base - p.u * hh + sn * r * 0.2; g.globalAlpha = (sn > 0 ? 0.26 : 0.14) * (0.5 + 0.5 * p.u + 0.3) * Math.min(1, (p.u - umin) * 6 + 0.2); const s = (p.s + 16 * p.u) * sc; g.drawImage(SP[p.k], x - s / 2, y - s / 2, s, s); }
    for (const d of DB) { if (d.u < umin) continue; const w = 4 + 7 * Math.pow(1 - d.u, 2); const a = d.a + w * t; const sn = Math.sin(a); if ((sn > 0) === back) continue; const r = Rf(d.u) * d.r; const x = cxu(d.u) + Math.cos(a) * r, y = base - d.u * hh + sn * r * 0.2;
      g.save(); g.translate(x, y); g.rotate(d.rot + t * (3 + d.k)); g.globalAlpha = 0.95; g.fillStyle = d.k === 0 ? "#6b4a2b" : d.k === 1 ? "#b9b2a2" : d.k === 2 ? "#3f5a2a" : "#2d2a27"; const z = d.s * sc; if (d.k === 0) g.fillRect(-14 * z, -3 * z, 28 * z, 6 * z); else if (d.k === 1) g.fillRect(-6 * z, -8 * z, 12 * z, 16 * z); else { g.beginPath(); g.ellipse(0, 0, 8 * z, 4 * z, 0, 0, 6.283); g.fill(); } g.restore(); }
  };
  const frame = (now: number) => {
    if (!box.isConnected) { return; }
    const t = Math.max(0, (now - t0) / 1000); const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; const f = Math.min(1, t / 0.6) * Math.min(1, Math.max(0, (D - t) / 0.9));
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H); g.globalAlpha = 1;
    // ciel d'orage vert-gris
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "rgba(28,36,34,.82)"); sky.addColorStop(0.55, "rgba(52,62,56,.55)"); sky.addColorStop(1, "rgba(70,66,56,.35)"); g.globalAlpha = f; g.fillStyle = sky; g.fillRect(0, 0, W, H);
    const tx = Tx(t);
    for (let i = 0; i < 9; i++) { const s = (380 + (i % 3) * 140) * sc; g.globalAlpha = 0.55 * f; g.drawImage(SP[2], tx * 0.5 + i * W * 0.14 - W * 0.2 + Math.sin(t * 0.3 + i) * 40 - s / 2, top - s * 0.15 + (i % 2) * 20 - s / 2 + s * 0.2, s * 1.6, s * 0.9); }
    if (li < lights.length && t > lights[li]) { flash = 1; bolts = bolt(R(W * 0.15, W * 0.85)); li++; }
    // vent : traits horizontaux
    g.strokeStyle = "rgba(220,215,200,.14)"; g.lineWidth = 1; for (let i = 0; i < 30; i++) { const y = ((i * 97.3 + t * 40) % H); const x = ((t * (900 + i * 20) + i * 331) % (W + 300)) - 150; g.globalAlpha = f * 0.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 120 * sc, y + 2); g.stroke(); }
    layer(t, true);
    // poussière au sol
    for (let i = 0; i < 26; i++) { const a = i * 0.7 + t * 2.2; const s = (150 + (i % 5) * 40) * sc; g.globalAlpha = 0.16 * f * Math.min(1, Math.max(0, (t - 0.8) / 1)); g.drawImage(SP[i % 2 ? 3 : 1], tx + Math.cos(a) * (60 + (i % 7) * 18) * sc - s / 2, base + Math.sin(a) * 18 - s * 0.45, s, s * 0.7); }
    layer(t, false);
    if (flash > 0) { g.globalAlpha = Math.min(0.55, flash * 0.55) * f; g.fillStyle = "#e8f0ff"; g.fillRect(0, 0, W, H); if (bolts.length && flash > 0.4) { g.globalAlpha = f; g.strokeStyle = "rgba(240,246,255,.95)"; g.lineWidth = 3; g.beginPath(); bolts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); } flash -= dt * 3.2; }
    // éléments de l'appli aspirés
    if (!rebuilt) for (const o of E) {
      const a = t - o.tc; const near = Math.abs(tx - o.ex) < W * 0.3 && a < 0;
      if (a < 0) { if (near) o.e.style.transform = `translate(${R(-2.5, 2.5)}px,${R(-2, 2)}px) rotate(${R(-0.6, 0.6)}deg)`; continue; }
      o.cap = true; const ph = a / 1.7;
      if (ph < 1) { const e = ph * ph; const r = o.r0 * (1 - ph) + (50 + 30 * o.sp) * sc * ph; const th = o.th + a * (3.5 + 6 * ph) * o.sp; const X = tx + Math.cos(th) * r, Y = o.ey + (H * 0.2 - o.ey) * e + Math.sin(th) * r * 0.22; const rot = a * 380 * o.sp * o.out; const s = 1 - 0.5 * e;
        o.last = `translate(${X - o.ex}px,${Y - o.ey}px) rotate(${rot}deg) scale(${s})`; o.e.style.transform = o.last; o.e.style.filter = `brightness(${1 - 0.35 * ph})`;
        if (!o.rel || ph > 0.97) o.rel = { x: X - o.ex, y: Y - o.ey, vx: Math.cos(th + Math.PI / 2) * 700 * o.out + o.out * 300, vy: -R(300, 700), rot, vr: R(300, 700) * o.out }; else { o.rel.x = X - o.ex; o.rel.y = Y - o.ey; o.rel.rot = rot; }
      } else if (o.rel) { const q = o.rel; q.x += q.vx * dt; q.y += q.vy * dt; q.rot += q.vr * dt; o.last = `translate(${q.x}px,${q.y}px) rotate(${q.rot}deg) scale(.5)`; o.e.style.transform = o.last; }
    }
    if (!rebuilt && t > D - 1.7) { rebuilt = true; E.forEach((o) => { if (!o.cap) { o.e.style.transform = ""; return; } const a2 = o.e.animate([{ transform: o.last, filter: "brightness(.6)" }, { transform: "none", filter: "none" }], { duration: 850, delay: R(0, 380), easing: "cubic-bezier(.2,1.2,.4,1)", fill: "both" }); o.e.style.transform = ""; o.e.style.filter = ""; anims.push(a2); }); }
    if (t < D) raf = requestAnimationFrame(frame); else tornadoStop();
  };
  raf = requestAnimationFrame(frame);
  stopper = () => { cancelAnimationFrame(raf); anims.forEach((a) => { try { a.cancel(); } catch { /* ignoré */ } }); E.forEach((o) => { o.e.style.transform = ""; o.e.style.filter = ""; }); box.remove(); root.classList.remove("collapsing"); };
}
