/** Effets « décors » réalistes dessinés sur un canvas : neige, feu d'artifice, fantômes, flammes, bulles, fête, fusée, applaudissements, jackpot, explosion. */
export type Scene = "snow" | "fireworks" | "ghost" | "fire" | "bubbles" | "party" | "rocket" | "clap" | "money" | "bomb";
export const SCENES: Scene[] = ["snow", "fireworks", "ghost", "fire", "bubbles", "party", "rocket", "clap", "money", "bomb"];
type P = { x: number; y: number; vx: number; vy: number; life: number; max: number; s: number; r: number; vr: number; c: string; k?: number; h?: number[][] };
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const DUR: Record<Scene, number> = { snow: 7, fireworks: 7.5, ghost: 7, fire: 8.5, bubbles: 7.5, party: 6, rocket: 7, clap: 6, money: 6.5, bomb: 6.2 };

import { blastCollapse } from "./collapse";
import { bdLayers, type BdKind } from "./bdscenes";
/** Effets d'anniversaire réalistes : une ou plusieurs couches sur le même canvas. */
export function bdSceneShow(kinds: BdKind[], durs: Record<string, number>) {
  const box = document.createElement("div"); box.className = "fxbox sc"; box.setAttribute("aria-hidden", "true");
  const cv = document.createElement("canvas"); box.appendChild(cv); const dpr = Math.min(2, window.devicePixelRatio || 1); const W = window.innerWidth, H = window.innerHeight;
  cv.width = W * dpr; cv.height = H * dpr; cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%"; const g = cv.getContext("2d"); if (!g) return; g.scale(dpr, dpr); document.body.appendChild(box);
  const dur = Math.max(...kinds.map((k) => durs[k])); const layers = kinds.flatMap((k) => bdLayers(k, W, H, g, durs[k] || dur));
  const t0 = performance.now(); let last = t0;
  const frame = (now: number) => { if (!box.isConnected) return; const t = Math.max(0, (now - t0) / 1000); const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; g.clearRect(0, 0, W, H); g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
    const fade = t < 0.4 ? t / 0.4 : t > dur - 1 ? Math.max(0, dur - t) : 1; layers.forEach((l) => { g.globalAlpha = 1; l(t, dt, fade); }); if (t < dur) requestAnimationFrame(frame); else box.remove(); };
  requestAnimationFrame(frame);
}
import { noelLayers, NOEL_DUR, type NoelKind } from "./noelscenes";
import { easterLayer, EASTER_DUR } from "./easter";
/** Effets de Noël (deux musiques) et de Pâques : une couche canvas plein écran. */
export function holidayShow(kind: "noel1" | "noel2" | "easter") {
  const box = document.createElement("div"); box.className = "fxbox sc"; box.setAttribute("aria-hidden", "true");
  const cv = document.createElement("canvas"); box.appendChild(cv); const dpr = Math.min(2, window.devicePixelRatio || 1); const W = window.innerWidth, H = window.innerHeight;
  cv.width = W * dpr; cv.height = H * dpr; cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%"; const g = cv.getContext("2d"); if (!g) return; g.scale(dpr, dpr); document.body.appendChild(box);
  const nk: NoelKind = kind === "noel1" ? "n2" : "n7"; const dur = kind === "easter" ? EASTER_DUR : NOEL_DUR[nk]; const layers = kind === "easter" ? [easterLayer(W, H, g)] : noelLayers(nk, W, H, g);
  const t0 = performance.now(); let last = t0;
  const frame = (now: number) => { if (!box.isConnected) return; const t = Math.max(0, (now - t0) / 1000); const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; g.clearRect(0, 0, W, H); g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
    const fade = t < 0.5 ? t / 0.5 : t > dur - 1 ? Math.max(0, dur - t) : 1; layers.forEach((l) => { g.globalAlpha = 1; l(t, dt, fade); }); if (t < dur) requestAnimationFrame(frame); else box.remove(); };
  requestAnimationFrame(frame);
}
export function sceneShow(kind: Scene) {
  const box = document.createElement("div"); box.className = "fxbox sc"; box.setAttribute("aria-hidden", "true");
  const cv = document.createElement("canvas"); box.appendChild(cv);
  const dpr = Math.min(2, window.devicePixelRatio || 1); const W = window.innerWidth, H = window.innerHeight;
  cv.width = W * dpr; cv.height = H * dpr; cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
  const g = cv.getContext("2d"); if (!g) return;
  g.scale(dpr, dpr);
  document.body.appendChild(box);
  const dur = DUR[kind]; const t0 = performance.now(); let last = t0; const st = makeScene(kind, W, H, g);
  const frame = (now: number) => {
    if (!box.isConnected) return;
    const t = Math.max(0, (now - t0) / 1000); const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
    g.clearRect(0, 0, W, H); g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
    const fade = t < 0.5 ? t / 0.5 : t > dur - 0.8 ? Math.max(0, (dur - t) / 0.8) : 1;
    st(t, dt, fade);
    if (t < dur) requestAnimationFrame(frame); else box.remove();
  };
  requestAnimationFrame(frame);
}

type Step = (t: number, dt: number, fade: number) => void;
/** Remet à leur place les éléments « brûlés » (fin de l'effet flammes, ou arrêt anticipé). */
export function fireRestore() {
  document.querySelectorAll<HTMLElement>("[data-fire-target]").forEach((e) => { e.style.maskImage = ""; (e.style as any).webkitMaskImage = ""; });
  document.querySelectorAll<HTMLElement>("[data-burnt]").forEach((e) => { delete e.dataset.burnt; e.style.transition = "opacity .8s"; e.style.opacity = ""; setTimeout(() => { e.style.transition = ""; }, 900); });
}

function dim(g: CanvasRenderingContext2D, W: number, H: number, c: string, a: number) { g.globalAlpha = a; g.fillStyle = c; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
function glow(g: CanvasRenderingContext2D, x: number, y: number, r: number, c: string, a: number) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, c); gr.addColorStop(1, "rgba(0,0,0,0)"); g.globalAlpha = a; g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill(); g.globalAlpha = 1; }
function emo(g: CanvasRenderingContext2D, ch: string, x: number, y: number, s: number, a = 1, rot = 0, sx = 1) { g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(rot); g.scale(sx, 1); g.font = `${s}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(ch, 0, 0); g.restore(); }

function makeScene(kind: Scene, W: number, H: number, g: CanvasRenderingContext2D): Step {
  switch (kind) {
    case "snow": {
      const fl: P[] = []; for (let i = 0; i < 260; i++) { const d = Math.random(); fl.push({ x: rnd(-100, W + 100), y: rnd(-H, H), vx: 0, vy: 40 + d * 120, life: 0, max: 0, s: 1.5 + d * 4.5, r: rnd(0, 6), vr: rnd(-1, 1), c: "", k: d }); }
      const big: P[] = []; for (let i = 0; i < 28; i++) big.push({ x: rnd(0, W), y: rnd(-H, 0), vx: 0, vy: rnd(50, 110), life: 0, max: 0, s: rnd(14, 34), r: rnd(0, 6), vr: rnd(-1.2, 1.2), c: "", k: rnd(0, 6) });
      const crystal = (x: number, y: number, s: number, r: number, a: number) => { g.save(); g.translate(x, y); g.rotate(r); g.globalAlpha = a; g.strokeStyle = "#fff"; g.lineWidth = Math.max(1.2, s / 9); g.lineCap = "round"; g.shadowColor = "rgba(120,160,255,.9)"; g.shadowBlur = 6; for (let i = 0; i < 6; i++) { g.rotate(1.0472); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -s); g.moveTo(0, -s * 0.55); g.lineTo(s * 0.25, -s * 0.8); g.moveTo(0, -s * 0.55); g.lineTo(-s * 0.25, -s * 0.8); g.moveTo(0, -s * 0.3); g.lineTo(s * 0.18, -s * 0.5); g.moveTo(0, -s * 0.3); g.lineTo(-s * 0.18, -s * 0.5); g.stroke(); } g.restore(); };
      return (t, dt, f) => {
        dim(g, W, H, "#0f1d3a", 0.38 * f);
        const wind = (Math.sin(t * 0.9) * 0.5 + 0.5) * 90 + (Math.sin(t * 2.3) > 0.7 ? 120 : 0) + 30;
        for (const p of fl) { p.x += (wind * (0.4 + (p.k as number)) + Math.sin(t * 1.7 + p.r * 3) * 22) * dt; p.y += p.vy * dt; if (p.y > H + 10) { p.y = -10; p.x = rnd(-100, W); } if (p.x > W + 60) p.x = -60;
          glow(g, p.x, p.y, p.s * 1.8, "rgba(255,255,255,1)", (0.55 + (p.k as number) * 0.4) * f); }
        for (const p of big) { p.x += (wind * 0.8 + Math.sin(t * 1.3 + (p.k as number)) * 30) * dt; p.y += p.vy * dt; p.r += p.vr * dt; if (p.y > H + 40) { p.y = -40; p.x = rnd(0, W); } if (p.x > W + 60) p.x = -60; crystal(p.x, p.y, p.s, p.r, 0.9 * f); }
        const gr = g.createLinearGradient(0, H * 0.85, 0, H); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(255,255,255,.55)"); g.globalAlpha = Math.min(1, t / 3) * f; g.fillStyle = gr; g.fillRect(0, H * 0.85, W, H * 0.15); g.globalAlpha = 1;
      };
    }
    case "fireworks": {
      const ps: P[] = []; const shells: { t: number; x: number; y: number; type: number; c: string; fired: boolean; sx: number }[] = [];
      const cols = ["#ff5a5a", "#ffd24a", "#6ee7ff", "#b983ff", "#7dff9a", "#ff8ad8", "#ffa043", "#ffffff"];
      for (let i = 0; i < 9; i++) shells.push({ t: 0.2 + i * 0.7 + rnd(0, 0.3), x: rnd(0.15, 0.85) * W, y: rnd(0.15, 0.45) * H, type: i % 4, c: pick(cols), fired: false, sx: 0 });
      const rockets: { x: number; y: number; ty: number; vy: number; i: number; tr: number[][] }[] = [];
      let flash = 0;
      const burst = (x: number, y: number, type: number, c: string) => {
        flash = 0.35; const n = type === 3 ? 90 : 170; const c2 = pick(cols);
        for (let i = 0; i < n; i++) { const a = type === 1 ? (i / n) * 6.283 : rnd(0, 6.283); const sp = type === 1 ? 260 : type === 2 ? rnd(80, 330) : rnd(60, 360); ps.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: type === 2 ? rnd(2.2, 3.2) : rnd(1.3, 2.2), s: rnd(1.6, 3), r: 0, vr: 0, c: type === 3 && i % 2 ? c2 : c, k: type, h: [] }); }
        for (let i = 0; i < 25; i++) ps.push({ x, y, vx: rnd(-90, 90), vy: rnd(-90, 90), life: 0, max: rnd(0.3, 0.8), s: 2.4, r: 0, vr: 0, c: "#fff", k: 9, h: [] });
      };
      return (t, dt, f) => {
        dim(g, W, H, "#050816", 0.8 * f); if (flash > 0) { dim(g, W, H, "#ffffff", flash * 0.4 * f); flash -= dt * 1.6; }
        for (const s of shells) if (!s.fired && t > s.t) { s.fired = true; rockets.push({ x: rnd(0.3, 0.7) * W, y: H, ty: s.y, vy: -(H - s.y) / 0.75, i: shells.indexOf(s), tr: [] }); }
        g.globalCompositeOperation = "lighter";
        for (let i = rockets.length - 1; i >= 0; i--) { const r = rockets[i]; const s = shells[r.i]; r.x += (s.x - r.x) * dt * 2.2; r.y += r.vy * dt; r.tr.push([r.x, r.y]); if (r.tr.length > 14) r.tr.shift(); g.strokeStyle = "rgba(255,220,150,.9)"; g.lineWidth = 2.5; g.beginPath(); r.tr.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); glow(g, r.x, r.y, 14, "#ffd9a0", 0.9);
          if (r.y <= r.ty) { burst(r.x, r.y, s.type, s.c); rockets.splice(i, 1); } }
        for (let i = ps.length - 1; i >= 0; i--) { const p = ps[i]; p.life += dt; if (p.life > p.max) { ps.splice(i, 1); continue; } const drag = Math.pow(0.12, dt); p.vx *= drag; p.vy = p.vy * drag + (p.k === 2 ? 70 : 110) * dt; p.x += p.vx * dt; p.y += p.vy * dt; const a = 1 - p.life / p.max;
          (p.h as number[][]).push([p.x, p.y]); if ((p.h as number[][]).length > (p.k === 2 ? 14 : 8)) (p.h as number[][]).shift();
          g.strokeStyle = p.c; g.globalAlpha = a * f; g.lineWidth = p.s; g.lineCap = "round"; g.beginPath(); (p.h as number[][]).forEach((q, j) => (j ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke(); glow(g, p.x, p.y, p.s * 4, p.c, a * 0.8 * f); }
        g.globalCompositeOperation = "source-over";
      };
    }
    case "ghost": {
      const gh = (x: number, y: number, s: number, a: number, t: number, ph: number) => {
        const r = s * 0.28; g.save(); g.translate(x, y); g.shadowColor = "rgba(190,215,255,.9)"; g.shadowBlur = s * 0.25;
        const N = 28; const L: number[][] = [], R: number[][] = [];
        for (let i = 0; i <= N; i++) { const u = i / N; const cy = -s * 0.1 + u * s * 1.15; const w = r * (1.15 - 0.75 * Math.pow(u, 1.4)) + Math.sin(t * 4 + ph + u * 9) * r * 0.08 * u; const c = Math.sin(t * 1.8 + ph + u * 3.2) * r * 0.55 * u * u; L.push([c - w, cy]); R.push([c + w, cy]); }
        const gr = g.createLinearGradient(0, -s * 0.4, 0, s * 1.05); gr.addColorStop(0, `rgba(245,250,255,${0.95 * a})`); gr.addColorStop(0.45, `rgba(225,238,255,${0.6 * a})`); gr.addColorStop(1, "rgba(210,225,255,0)"); g.fillStyle = gr;
        g.beginPath(); g.moveTo(0, -s * 0.5 - r * 0.2); g.bezierCurveTo(r * 1.05, -s * 0.5 - r * 0.2, r * 1.1, -s * 0.1 - r * 0.1, R[0][0], R[0][1]); R.forEach((p) => g.lineTo(p[0], p[1])); for (let i = N; i >= 0; i--) g.lineTo(L[i][0], L[i][1]); g.bezierCurveTo(-r * 1.1, -s * 0.1 - r * 0.1, -r * 1.05, -s * 0.5 - r * 0.2, 0, -s * 0.5 - r * 0.2); g.closePath(); g.fill(); g.shadowBlur = 0;
        for (const sd of [-1, 1]) { g.strokeStyle = `rgba(235,245,255,${0.5 * a})`; g.lineCap = "round"; g.lineWidth = r * 0.16; g.beginPath(); g.moveTo(sd * r * 0.9, -s * 0.05); g.quadraticCurveTo(sd * r * 1.5, s * 0.1 + Math.sin(t * 3 + ph + sd) * r * 0.3, sd * r * 1.6, s * 0.3 + Math.sin(t * 2.4 + sd) * r * 0.3); g.stroke(); }
        const eye = (ex: number) => { const eg = g.createRadialGradient(ex, -s * 0.38, 0, ex, -s * 0.38, r * 0.4); eg.addColorStop(0, `rgba(5,8,25,${0.95 * a})`); eg.addColorStop(1, "rgba(5,8,25,0)"); g.fillStyle = eg; g.beginPath(); g.ellipse(ex, -s * 0.36, r * 0.3, r * 0.45, 0, 0, 6.283); g.fill(); };
        eye(-r * 0.42); eye(r * 0.42);
        const mg = g.createRadialGradient(0, -s * 0.17, 0, 0, -s * 0.17, r * 0.5); mg.addColorStop(0, `rgba(5,8,25,${0.9 * a})`); mg.addColorStop(1, "rgba(5,8,25,0)"); g.fillStyle = mg; g.beginPath(); g.ellipse(0, -s * 0.15, r * 0.22, r * (0.4 + 0.12 * Math.sin(t * 3 + ph)), 0, 0, 6.283); g.fill(); g.restore();
      };
      const l: P[] = []; for (let i = 0; i < 16; i++) l.push({ x: rnd(0, W), y: rnd(H * 0.2, H + 100), vx: rnd(-15, 15), vy: -rnd(25, 60), life: 0, max: 0, s: rnd(90, 190), r: rnd(0, 6), vr: 0, c: "", k: rnd(0.3, 0.6) });
      const fog: P[] = []; for (let i = 0; i < 14; i++) fog.push({ x: rnd(0, W), y: H * rnd(0.55, 1.05), vx: rnd(10, 40), vy: 0, life: 0, max: 0, s: rnd(160, 340), r: rnd(0, 6), vr: 0, c: "" });
      return (t, dt, f) => {
        dim(g, W, H, "#070a1f", 0.6 * f);
        for (const p of fog) { p.x += p.vx * dt; if (p.x > W + 300) p.x = -300; glow(g, p.x, p.y + Math.sin(t + p.r) * 12, p.s, "rgba(190,205,235,1)", 0.16 * f); }
        for (const p of l) { p.x += p.vx * dt + Math.sin(t * 1.2 + p.r) * 22 * dt; p.y += p.vy * dt; if (p.y < -p.s) { p.y = H + p.s; p.x = rnd(0, W); } gh(p.x, p.y, p.s, (p.k as number) * f, t, p.r); }
        const bs = Math.min(W, H) * 0.75; const bx = W * (0.5 + 0.22 * Math.sin(t * 0.7)); const by = H * 0.52 + Math.sin(t * 1.3) * 25; gh(bx, by, bs * Math.min(1, t / 1.5), 0.8 * f * (0.85 + 0.15 * Math.sin(t * 2.5)), t, 1);
      };
    }
    case "fire": {
      // Vrai incendie : le feu part du bas, gagne l'écran ; chaque élément noircit et se consume depuis un point d'allumage (bord incandescent),
      // des flammes montent du bord, de la fumée s'élève, puis des cendres et des braises retombent.
      const SEL = ".msg, .bubble, h1, h2, h3, p, .btn, .chip, .navbtn, .avatar, button, input, li";
      type B = { el: HTMLElement | null; m?: { g: CanvasRenderingContext2D; ox: number; oy: number }; x: number; y: number; w: number; h: number; t0: number; D: number; px: number; py: number; sd: number; maxR: number; done: boolean };
      const items: B[] = Array.from(document.querySelectorAll<HTMLElement>(SEL)).map((el) => ({ el, r: el.getBoundingClientRect() })).filter(({ r }) => r.width > 24 && r.height > 12 && r.height < 120 && r.width * r.height < W * H * 0.09 && r.bottom > 0 && r.top < H && r.right > 0 && r.left < W).slice(0, 90)
        .map(({ el, r }) => { const cy = r.top + r.height / 2; return { el, x: r.left, y: r.top, w: r.width, h: r.height, t0: (1 - Math.min(1, Math.max(0, cy / H))) * 3.6 + rnd(0, 0.5), D: Math.min(2.1, Math.max(0.8, r.width / 300 + r.height / 380)), px: r.left + rnd(0.15, 0.85) * r.width, py: r.top + r.height * rnd(0.65, 1), sd: rnd(0, 100), maxR: Math.hypot(r.width, r.height) * 1.0, done: false }; });
      const targets: { el: HTMLElement; c: HTMLCanvasElement }[] = [];
      document.querySelectorAll<HTMLElement>("[data-fire-target]").forEach((el) => {
        const r = el.getBoundingClientRect(); if (r.width < 20 || r.height < 20) return;
        const c = document.createElement("canvas"); c.width = Math.ceil(r.width); c.height = Math.ceil(r.height); const mg = c.getContext("2d"); if (!mg) return;
        mg.fillStyle = "#000"; mg.fillRect(0, 0, c.width, c.height); targets.push({ el, c });
        const cs = 56; for (let y = 0; y < r.height; y += cs) for (let x = 0; x < r.width; x += cs) {
          const w = Math.min(cs, r.width - x), h = Math.min(cs, r.height - y); const cy = y + h / 2;
          items.push({ el: null, m: { g: mg, ox: r.left, oy: r.top }, x: r.left + x, y: r.top + y, w, h, t0: 0.3 + (1 - cy / r.height) * 3.4 + rnd(0, 0.5), D: rnd(0.9, 1.4), px: r.left + x + rnd(0.2, 0.8) * w, py: r.top + y + h * rnd(0.5, 1), sd: rnd(0, 100), maxR: Math.hypot(w, h) * 1.05, done: false });
        }
      });
      let fr = 0;
      const fl: P[] = []; const sm: P[] = []; const ash: P[] = [];
      const blob = (cx: number, cy: number, R: number, sd: number, t: number, G: CanvasRenderingContext2D = g) => { G.beginPath(); const n = 28; for (let i = 0; i <= n; i++) { const a = (i / n) * 6.2832; const k = 0.78 + 0.2 * Math.sin(a * 3 + sd) + 0.12 * Math.sin(a * 7 + sd * 2 + t * 3); const rr = R * Math.max(0.45, k); const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.9; if (i) G.lineTo(x, y); else G.moveTo(x, y); } G.closePath(); };
      const N = Math.max(8, Math.round(W / 110));
      const tg = Array.from({ length: N }, (_, i) => ({ x: ((i + 0.5) / N) * W + rnd(-25, 25), w: rnd(0.95, 1.6) * (W / N) * 1.25, h: rnd(0.5, 1) * H * 0.2, ph: rnd(0, 6.28), sp: rnd(1.4, 2.8) }));
      const noise = (t: number, ph: number) => Math.sin(t + ph) * 0.5 + Math.sin(t * 2.31 + ph * 1.7) * 0.3 + Math.sin(t * 4.13 + ph * 0.6) * 0.2;
      const LAY = [{ w: 1, h: 1, st: [[0, "rgba(255,95,10,.8)"], [0.5, "rgba(215,40,5,.5)"], [1, "rgba(120,10,0,0)"]] }, { w: 0.66, h: 0.72, st: [[0, "rgba(255,175,45,.9)"], [0.55, "rgba(255,115,12,.5)"], [1, "rgba(255,60,0,0)"]] }, { w: 0.36, h: 0.44, st: [[0, "rgba(255,250,215,.95)"], [0.55, "rgba(255,215,100,.5)"], [1, "rgba(255,160,40,0)"]] }] as const;
      const tongue = (x: number, w: number, h: number, sway: number, st: readonly (readonly [number, string])[]) => {
        const base = H + 14, top = base - h; g.beginPath(); g.moveTo(x - w / 2, base);
        g.bezierCurveTo(x - w * 0.6 + sway * 0.15, base - h * 0.32, x - w * 0.22 + sway * 0.7, base - h * 0.7, x + sway, top);
        g.bezierCurveTo(x + w * 0.22 + sway * 0.7, base - h * 0.7, x + w * 0.6 + sway * 0.15, base - h * 0.32, x + w / 2, base); g.closePath();
        const gr = g.createLinearGradient(0, base, 0, top); for (const [o, c] of st) gr.addColorStop(o, c); g.fillStyle = gr; g.fill();
      };
      setTimeout(fireRestore, (DUR.fire + 0.2) * 1000);
      return (t, dt, f) => {
        dim(g, W, H, "#140300", 0.38 * f);
        // 1) élément noirci avec bord incandescent
        for (const b of items) {
          if (t < b.t0) continue; const p = Math.min(1, (t - b.t0) / b.D); const R = Math.pow(p, 0.85) * b.maxR;
          if (!b.done && p >= 1) { b.done = true; if (b.el) { b.el.dataset.burnt = "1"; b.el.style.transition = "none"; b.el.style.opacity = "0"; } if (b.m) { b.m.g.save(); b.m.g.globalCompositeOperation = "destination-out"; b.m.g.fillStyle = "#000"; b.m.g.fillRect(b.x - b.m.ox - 1, b.y - b.m.oy - 1, b.w + 2, b.h + 2); b.m.g.restore(); }
            const n = Math.min(46, Math.round((b.w * b.h) / 900) + 6); for (let i = 0; i < n; i++) ash.push({ x: rnd(b.x, b.x + b.w), y: rnd(b.y, b.y + b.h), vx: rnd(-22, 22), vy: rnd(15, 90), life: 0, max: rnd(1.4, 3), s: rnd(1.5, 5.5), r: rnd(0, 6), vr: rnd(-4, 4), c: "", k: Math.random() < 0.35 ? 1 : 0 });
            for (let i = 0; i < 6; i++) sm.push({ x: rnd(b.x, b.x + b.w), y: b.y + b.h * rnd(0.2, 0.8), vx: rnd(-10, 25), vy: -rnd(30, 70), life: 0, max: rnd(1.6, 2.8), s: rnd(14, 34), r: 0, vr: 0, c: "" }); }
          if (b.m && !b.done) { const G = b.m.g; G.save(); G.globalCompositeOperation = "destination-out"; G.translate(-b.m.ox, -b.m.oy); G.beginPath(); G.rect(b.x, b.y, b.w, b.h); G.clip(); blob(b.px, b.py, R * 0.92, b.sd, t, G); G.fillStyle = "#000"; G.fill(); G.restore(); }
          const alive = b.done ? 1 - (t - b.t0 - b.D) / 0.5 : 1; if (alive <= 0) continue;
          g.save(); g.beginPath(); g.rect(b.x, b.y, b.w, b.h); g.clip();
          blob(b.px, b.py, R, b.sd, t); g.globalAlpha = 0.94 * alive * f; g.fillStyle = "#120a07"; g.fill();
          g.globalCompositeOperation = "lighter"; g.globalAlpha = f * alive; g.strokeStyle = "rgba(255,110,15,.32)"; g.lineWidth = 18; g.stroke(); g.strokeStyle = "rgba(255,170,40,.75)"; g.lineWidth = 7; g.stroke(); g.strokeStyle = "rgba(255,235,150,.95)"; g.lineWidth = 2.2; g.stroke();
          g.restore();
          if (!b.done) { const n = Math.ceil(dt * 70 * Math.min(3.5, b.w / 110 + 0.8)); for (let i = 0; i < n; i++) { const a = rnd(3.3, 6.1); const x = b.px + Math.cos(a) * R * 0.82, y = b.py + Math.sin(a) * R * 0.74; if (x < b.x || x > b.x + b.w || y < b.y || y > b.y + b.h) continue; fl.push({ x, y, vx: rnd(-18, 18), vy: -rnd(70, 190), life: 0, max: rnd(0.45, 0.95), s: rnd(9, 22), r: 0, vr: 0, c: "" }); if (Math.random() < 0.35) sm.push({ x, y: y - 6, vx: rnd(-8, 22), vy: -rnd(35, 80), life: 0, max: rnd(1.4, 2.4), s: rnd(10, 22), r: 0, vr: 0, c: "" }); } }
        }
        if (++fr % 3 === 0) for (const T of targets) { const u = "url(" + T.c.toDataURL() + ")"; const st = T.el.style as CSSStyleDeclaration & { webkitMaskImage: string }; st.webkitMaskImage = u; st.maskImage = u; st.maskSize = "100% 100%"; (st as any).webkitMaskSize = "100% 100%"; }
        // 2) fumée
        g.globalCompositeOperation = "source-over";
        for (let i = sm.length - 1; i >= 0; i--) { const p = sm[i]; p.life += dt; if (p.life > p.max) { sm.splice(i, 1); continue; } p.x += (p.vx + Math.sin(t * 1.6 + i) * 14) * dt; p.y += p.vy * dt; const u = p.life / p.max; const r = p.s * (1 + u * 2.3);
          const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, r); gr.addColorStop(0, `rgba(78,72,68,${0.22 * (1 - u) * Math.min(1, u * 6 + 0.3)})`); gr.addColorStop(1, "rgba(78,72,68,0)"); g.globalAlpha = f; g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, r, 0, 6.283); g.fill(); }
        // 3) flammes du bord
        g.globalCompositeOperation = "lighter";
        for (let i = fl.length - 1; i >= 0; i--) { const p = fl[i]; p.life += dt; if (p.life > p.max) { fl.splice(i, 1); continue; } p.x += (p.vx + Math.sin(t * 9 + i) * 22) * dt; p.y += p.vy * dt; const u = p.life / p.max; const r = p.s * (1 - u * 0.65);
          const col = u < 0.25 ? "255,215,110" : u < 0.65 ? "255,150,30" : "220,50,8"; const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, r); gr.addColorStop(0, `rgba(${col},${0.7 * (1 - u * 0.7)})`); gr.addColorStop(1, `rgba(${col},0)`); g.globalAlpha = f; g.fillStyle = gr; g.save(); g.translate(p.x, p.y); g.scale(0.55, 1.7); g.translate(-p.x, -p.y - r * 0.5); g.beginPath(); g.arc(p.x, p.y, r, 0, 6.283); g.fill(); g.restore(); }
        // 4) braise de fond (le foyer en bas de l'écran)
        const grow = Math.min(1, t / 2.2);
        g.globalAlpha = f; const hg = g.createLinearGradient(0, H * 0.7, 0, H); hg.addColorStop(0, "rgba(255,90,0,0)"); hg.addColorStop(1, `rgba(255,130,25,${0.4 * grow})`); g.fillStyle = hg; g.fillRect(0, H * 0.7, W, H * 0.3);
        for (const L of LAY) for (const q of tg) { const flk = 0.78 + 0.22 * noise(t * q.sp * 2.2, q.ph + 3); tongue(q.x + noise(t * 0.8, q.ph) * 14, q.w * L.w, q.h * grow * flk * L.h, noise(t * q.sp, q.ph) * q.w * 0.5, L.st as readonly (readonly [number, string])[]); }
        // 5) cendres et braises qui retombent
        for (let i = ash.length - 1; i >= 0; i--) { const p = ash[i]; p.life += dt; if (p.life > p.max) { ash.splice(i, 1); continue; } p.x += (p.vx + Math.sin(t * 2 + i) * 18) * dt; p.y += p.vy * dt; p.vy += 25 * dt; p.r += p.vr * dt; const u = p.life / p.max;
          g.globalCompositeOperation = "source-over"; g.globalAlpha = f * (1 - u * u); g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = "#1c1612"; g.fillRect(-p.s, -p.s * 0.5, p.s * 2, p.s); g.restore();
          if (p.k && u < 0.45) { g.globalCompositeOperation = "lighter"; glow(g, p.x, p.y, p.s * 3.2, "#ff9a2e", f * (1 - u / 0.45) * 0.9); } }
        g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
      };
    }
    case "bubbles": {
      const bs: P[] = []; for (let i = 0; i < 34; i++) bs.push({ x: rnd(0, W), y: rnd(H * 0.2, H + 300), vx: 0, vy: -rnd(30, 90), life: rnd(0, 6), max: rnd(5, 9), s: rnd(18, 90), r: rnd(0, 6), vr: 0, c: "" });
      const foam: { x: number; y: number; s: number; d: number }[] = []; for (let i = 0; i < 170; i++) foam.push({ x: rnd(-20, W + 20), y: H - Math.abs(rnd(-1, 1)) * rnd(0, 150) + 20, s: rnd(14, 46), d: rnd(0, 4) });
      const bub = (x: number, y: number, r: number, a: number, hue: number) => {
        const gr = g.createRadialGradient(x - r * 0.25, y - r * 0.25, r * 0.1, x, y, r); gr.addColorStop(0, "rgba(255,255,255,.04)"); gr.addColorStop(0.75, `hsla(${hue},90%,80%,.1)`); gr.addColorStop(0.92, `hsla(${hue + 70},95%,75%,.35)`); gr.addColorStop(1, `hsla(${hue + 140},95%,75%,.6)`);
        g.globalAlpha = a; g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill(); g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1.2; g.stroke();
        g.fillStyle = "rgba(255,255,255,.9)"; g.beginPath(); g.ellipse(x - r * 0.42, y - r * 0.45, r * 0.22, r * 0.12, -0.7, 0, 6.283); g.fill(); g.fillStyle = "rgba(255,255,255,.4)"; g.beginPath(); g.ellipse(x + r * 0.4, y + r * 0.45, r * 0.1, r * 0.05, -0.7, 0, 6.283); g.fill(); g.globalAlpha = 1;
      };
      return (t, dt, f) => {
        dim(g, W, H, "#7aa6d8", 0.18 * f);
        for (const p of bs) { p.life += dt; p.x += Math.sin(t * 1.3 + p.r) * 30 * dt; p.y += p.vy * dt; if (p.life > p.max || p.y < -100) { p.life = 0; p.y = H + 100; p.x = rnd(0, W); } const pop = p.max - p.life < 0.12; bub(p.x, p.y, p.s * (pop ? 1.15 : 1), f * (pop ? 0.4 : 1) * Math.min(1, p.life * 2), (p.r * 60) % 360); }
        const gr = Math.min(1, t / 2.5);
        for (const b of foam) { const y = H + 30 - (H + 30 - b.y) * gr; bub(b.x, y, b.s * (0.5 + 0.5 * gr), f * 0.9, (b.d * 90) % 360); }
      };
    }
    case "party": {
      const ps: P[] = []; const cols = ["#ff4d6d", "#ffd23f", "#3ddc97", "#4cc9f0", "#b388ff", "#ff9f1c", "#ffffff"];
      const pop = (side: number) => { const x = side ? W - 30 : 30; const y = H - 40; const base = side ? -2.3 : -0.84; for (let i = 0; i < 90; i++) { const a = base + rnd(-0.5, 0.5); const sp = rnd(500, 1250); ps.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: rnd(3, 5), s: rnd(6, 13), r: rnd(0, 6), vr: rnd(-9, 9), c: pick(cols), k: Math.random() < 0.25 ? 1 : 0 }); } };
      const pops = [0.1, 0.1, 0.9, 0.9, 1.8, 1.8, 2.8, 2.8, 3.6, 3.6]; let pi = 0;
      return (t, dt, f) => {
        while (pi < pops.length && t > pops[pi]) { pop(pi % 2); pi++; }
        for (let i = ps.length - 1; i >= 0; i--) { const p = ps[i]; p.life += dt; if (p.life > p.max || p.y > H + 30) { ps.splice(i, 1); continue; } p.vx *= Math.pow(0.18, dt); p.vy = p.vy * Math.pow(0.35, dt) + 520 * dt; p.x += p.vx * dt + Math.sin(t * 5 + p.r) * 30 * dt; p.y += p.vy * dt; p.r += p.vr * dt;
          g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.scale(1, Math.cos(p.r * 1.7)); g.fillStyle = p.c; g.globalAlpha = f * Math.min(1, (p.max - p.life) * 2); if (p.k) { g.fillRect(-p.s * 2.2, -1.5, p.s * 4.4, 3); } else g.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66); g.restore(); }
        const sh = Math.sin(t * 40) * (pops.some((x) => t > x && t < x + 0.15) ? 4 : 0);
        emo(g, "🎉", 46 + sh, H - 46, 84, f, 0.8); g.save(); g.scale(-1, 1); emo(g, "🎉", -(W - 46) + sh, H - 46, 84, f, 0.8); g.restore();
      };
    }
    case "rocket": {
      const ps: P[] = []; const stars: number[][] = []; for (let i = 0; i < 90; i++) stars.push([rnd(0, W), rnd(0, H), rnd(0.5, 1.8)]); const cx = W / 2;
      return (t, dt, f) => {
        const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#02030c"); sky.addColorStop(0.7, "#14204a"); sky.addColorStop(1, "#3a2c4a"); g.globalAlpha = 0.85 * f; g.fillStyle = sky; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
        stars.forEach((s2) => { g.fillStyle = `rgba(255,255,255,${0.4 + 0.5 * Math.sin(t * 3 + s2[0]) ** 2})`; g.globalAlpha = f; g.fillRect(s2[0], (s2[1] + t * 40 * s2[2]) % H, s2[2], s2[2]); }); g.globalAlpha = 1;
        const lift = Math.max(0, t - 1.4); const y = H - 120 - lift * lift * 140; const sh = t < 1.4 ? Math.sin(t * 70) * (1 + t * 2) : Math.sin(t * 35) * 2; const x = cx + sh; const on = t > 0.6;
        if (on && y > -220) { for (let i = 0; i < 9; i++) ps.push({ x: x + rnd(-10, 10), y: y + 150, vx: rnd(-60, 60), vy: rnd(200, 520), life: 0, max: rnd(0.5, 1.2), s: rnd(14, 38), r: 0, vr: 0, c: "", k: 0 }); if (t < 3.5) for (let i = 0; i < 5; i++) { const sd = i % 2 ? 1 : -1; ps.push({ x: cx + sd * rnd(10, 40), y: H - 40, vx: sd * rnd(150, 520), vy: -rnd(0, 60), life: 0, max: rnd(1.5, 3), s: rnd(50, 120), r: 0, vr: 0, c: "", k: 1 }); } }
        for (let i = ps.length - 1; i >= 0; i--) { const p = ps[i]; p.life += dt; if (p.life > p.max) { ps.splice(i, 1); continue; } const u = p.life / p.max; p.x += p.vx * dt; p.y += p.vy * dt; if (p.k) { p.vx *= Math.pow(0.4, dt); p.vy -= 20 * dt; glow(g, p.x, p.y, p.s * (0.7 + u), "rgba(215,215,225,1)", 0.5 * (1 - u) * f); } }
        g.globalCompositeOperation = "lighter";
        for (const p of ps) if (!p.k) { const u = p.life / p.max; glow(g, p.x, p.y, p.s * (0.8 + u), u < 0.35 ? "rgba(255,210,110,1)" : u < 0.7 ? "rgba(255,120,30,1)" : "rgba(170,60,20,1)", 0.7 * (1 - u) * f); }
        g.globalCompositeOperation = "source-over";
        if (y > -220) { g.save(); g.translate(x, y); g.globalAlpha = f;
          if (on) { const fl = 1 + 0.12 * Math.sin(t * 60); const fg = g.createLinearGradient(0, 90, 0, 90 + 190 * fl); fg.addColorStop(0, "rgba(255,255,230,1)"); fg.addColorStop(0.25, "rgba(255,200,80,.95)"); fg.addColorStop(0.7, "rgba(255,90,20,.6)"); fg.addColorStop(1, "rgba(255,60,10,0)"); g.fillStyle = fg; g.shadowColor = "rgba(255,150,50,1)"; g.shadowBlur = 40; g.beginPath(); g.moveTo(-20, 90); g.quadraticCurveTo(-26, 90 + 110 * fl, 0, 90 + 190 * fl); g.quadraticCurveTo(26, 90 + 110 * fl, 20, 90); g.fill(); g.shadowBlur = 0; }
          const metal = (x0: number, x1: number, c0: string, c1: string, c2: string) => { const m = g.createLinearGradient(x0, 0, x1, 0); m.addColorStop(0, c0); m.addColorStop(0.35, c1); m.addColorStop(1, c2); return m; };
          g.fillStyle = metal(-60, -30, "#8a1f1f", "#d94040", "#7a1515"); g.beginPath(); g.moveTo(-34, 30); g.lineTo(-62, 100); g.lineTo(-34, 90); g.fill(); g.beginPath(); g.moveTo(34, 30); g.lineTo(62, 100); g.lineTo(34, 90); g.fill();
          g.fillStyle = metal(-30, 30, "#b9c0d0", "#ffffff", "#7d869c"); g.beginPath(); g.moveTo(0, -150); g.bezierCurveTo(38, -110, 34, -50, 32, -30); g.lineTo(32, 88); g.lineTo(-32, 88); g.lineTo(-32, -30); g.bezierCurveTo(-34, -50, -38, -110, 0, -150); g.fill();
          g.fillStyle = metal(-32, 32, "#8a1f1f", "#e04848", "#6a1010"); g.beginPath(); g.moveTo(0, -150); g.bezierCurveTo(20, -128, 28, -100, 32, -80); g.lineTo(-32, -80); g.bezierCurveTo(-28, -100, -20, -128, 0, -150); g.fill();
          g.fillStyle = "#2a3248"; g.fillRect(-32, 50, 64, 8); g.fillRect(-32, 70, 64, 4);
          const wg = g.createRadialGradient(-4, -36, 2, 0, -30, 17); wg.addColorStop(0, "#bfe3ff"); wg.addColorStop(1, "#27508f"); g.fillStyle = wg; g.beginPath(); g.arc(0, -30, 16, 0, 6.283); g.fill(); g.strokeStyle = "#5b6580"; g.lineWidth = 4; g.stroke();
          g.fillStyle = "rgba(255,255,255,.55)"; g.beginPath(); g.ellipse(-6, -36, 5, 3, -0.6, 0, 6.283); g.fill();
          g.fillStyle = "#3b4357"; g.beginPath(); g.moveTo(-22, 88); g.lineTo(22, 88); g.lineTo(16, 102); g.lineTo(-16, 102); g.fill(); g.restore(); }
        if (t < 3.2) { const gg = g.createLinearGradient(0, H - 30, 0, H); gg.addColorStop(0, "rgba(60,50,60,0)"); gg.addColorStop(1, `rgba(60,50,60,${0.9 * f})`); g.fillStyle = gg; g.fillRect(0, H - 30, W, 30); }
      };
    }
    case "clap": {
      const hs: P[] = []; for (let i = 0; i < 70; i++) hs.push({ x: rnd(0, W), y: rnd(-H * 1.2, -20), vx: 0, vy: rnd(90, 210), life: 0, max: 0, s: rnd(34, 90), r: rnd(0, 6), vr: 0, c: "", k: rnd(0, 6) });
      return (t, dt, f) => {
        for (const p of hs) { p.y += p.vy * dt; p.x += Math.sin(t * 1.5 + (p.k as number)) * 14 * dt; if (p.y > H + 60) { if (t < 3.5) { p.y = -60; p.x = rnd(0, W); } } const beat = 1 + 0.16 * Math.max(0, Math.sin(t * 11 + (p.k as number) * 2)); emo(g, "👏", p.x, p.y, p.s * beat, f); }
      };
    }
    case "money": {
      const cs: P[] = []; const M = { x: W / 2, y: Math.min(190, H * 0.28) };
      const spawn = (k: number, fromMachine: boolean) => { const x = fromMachine ? M.x + rnd(-40, 40) : rnd(0, W); const y = fromMachine ? M.y + 60 : -30; cs.push({ x, y, vx: fromMachine ? rnd(-380, 380) : rnd(-30, 30), vy: fromMachine ? -rnd(150, 480) : rnd(60, 160), life: 0, max: 8, s: k ? rnd(46, 66) : rnd(22, 36), r: rnd(0, 6), vr: rnd(2, 8), c: "", k, h: [[rnd(0, 6)]] }); };
      let acc = 0;
      return (t, dt, f) => {
        dim(g, W, H, "#1a1030", 0.4 * f);
        acc += dt * (t < 0.4 ? 0 : t < 4 ? 70 : 20); while (acc > 1) { acc--; spawn(Math.random() < 0.3 ? 1 : 0, Math.random() < 0.7); }
        for (let i = cs.length - 1; i >= 0; i--) { const p = cs[i]; p.life += dt; p.vy += 780 * dt; p.vx *= Math.pow(0.6, dt); p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; if (p.y > H + 80) { cs.splice(i, 1); continue; }
          g.save(); g.translate(p.x, p.y); g.globalAlpha = f;
          if (p.k) { g.rotate(Math.sin(p.r) * 0.5); g.scale(1, 0.6 + 0.4 * Math.cos(p.r * 1.3)); g.fillStyle = "#58b368"; g.fillRect(-p.s, -p.s * 0.45, p.s * 2, p.s * 0.9); g.strokeStyle = "#d9f5df"; g.lineWidth = 2; g.strokeRect(-p.s + 5, -p.s * 0.45 + 5, p.s * 2 - 10, p.s * 0.9 - 10); g.fillStyle = "#e9fbed"; g.font = `bold ${p.s * 0.8}px sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("€", 0, 2); }
          else { g.scale(Math.cos(p.r), 1); const gr = g.createRadialGradient(-p.s * 0.3, -p.s * 0.3, 2, 0, 0, p.s); gr.addColorStop(0, "#fff3a0"); gr.addColorStop(0.6, "#f5b82e"); gr.addColorStop(1, "#b97a10"); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, p.s, 0, 6.283); g.fill(); g.strokeStyle = "#a76b0c"; g.lineWidth = 2.5; g.stroke(); g.fillStyle = "#a76b0c"; g.font = `bold ${p.s * 1.1}px sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("€", 0, 2); }
          g.restore(); }
        const sc = t < 0.4 ? t / 0.4 : 1; emo(g, "🎰", M.x, M.y + Math.sin(t * 30) * (t < 4 ? 3 : 0), 150 * sc, f);
        glow(g, M.x, M.y, 170, "rgba(255,210,80,1)", 0.25 * f * (0.6 + 0.4 * Math.sin(t * 10)));
      };
    }
    case "bomb": {
      const ps: P[] = []; const deb: P[] = []; const cx = W / 2, cy = H * 0.55; let boom = false; let flash = 0; let ring = 0;
      return (t, dt, f) => {
        if (t < 0.12) { dim(g, W, H, "#10080a", 0.3 * f); emo(g, "💣", cx, cy - 20, 130, 1, Math.sin(t * 20) * 0.08); const fx = cx + 36, fy = cy - 92; glow(g, fx + rnd(-3, 3), fy + rnd(-3, 3), 26, "rgba(255,200,60,1)", 0.9); return; }
        if (!boom) { boom = true; flash = 1; blastCollapse(cx, cy); document.documentElement.classList.remove("shake"); void document.documentElement.offsetWidth; document.documentElement.classList.add("shake"); setTimeout(() => document.documentElement.classList.remove("shake"), 1500);
          for (let i = 0; i < 260; i++) { const a = rnd(0, 6.283), sp = Math.pow(Math.random(), 0.6) * 900; ps.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: rnd(0.9, 2), s: rnd(90, 230), r: 0, vr: 0, c: "", k: 0 }); }
          for (let i = 0; i < 90; i++) { const a = rnd(0, 6.283), sp = rnd(250, 900); deb.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 250, life: 0, max: rnd(2.5, 4), s: rnd(5, 20), r: rnd(0, 6), vr: rnd(-12, 12), c: pick(["#5b534e", "#7a6f67", "#3d3835", "#8a7a6a", "#2c2826"]), k: Math.floor(rnd(0, 3)) }); }
          for (let i = 0; i < 60; i++) ps.push({ x: cx + rnd(-60, 60), y: cy + rnd(-40, 40), vx: rnd(-120, 120), vy: -rnd(30, 160), life: 0, max: rnd(2, 3.5), s: rnd(60, 140), r: 0, vr: 0, c: "", k: 1 }); }
        const u0 = t - 0.12; dim(g, W, H, "#140a08", 0.45 * f);
        if (flash > 0) { dim(g, W, H, "#fff4d0", flash * 0.9 * f); flash -= dt * 2.5; }
        ring += dt * 2600; g.strokeStyle = `rgba(255,230,190,${Math.max(0, 0.7 - u0 * 1.3) * f})`; g.lineWidth = 10 - Math.min(8, u0 * 12); g.beginPath(); g.arc(cx, cy, ring, 0, 6.283); g.stroke();
        for (const p of ps) { p.life += dt; if (p.life > p.max) continue; const u = p.life / p.max; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(0.25, dt); p.vy *= Math.pow(0.25, dt);
          if (p.k === 0) { g.globalCompositeOperation = "lighter"; const col = u < 0.3 ? "255,230,150" : u < 0.6 ? "255,130,30" : "200,50,10"; const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * (0.6 + u)); gr.addColorStop(0, `rgba(${col},${0.7 * (1 - u)})`); gr.addColorStop(1, `rgba(${col},0)`); g.globalAlpha = f; g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, p.s * (0.6 + u), 0, 6.283); g.fill(); g.globalCompositeOperation = "source-over"; }
          else { p.vy -= 10 * dt; const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * (0.8 + u * 1.2)); gr.addColorStop(0, `rgba(60,55,52,${0.32 * (1 - u)})`); gr.addColorStop(1, "rgba(60,55,52,0)"); g.globalAlpha = f; g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, p.s * (0.8 + u * 1.2), 0, 6.283); g.fill(); } }
        g.globalAlpha = 1;
        for (const p of deb) { p.life += dt; if (p.life > p.max) continue; p.vy += 900 * dt; p.vx *= Math.pow(0.5, dt); p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; if (p.y > H - 8 && p.vy > 0) { p.y = H - 8; p.vy *= -0.3; p.vx *= 0.6; p.vr *= 0.4; }
          g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.globalAlpha = f * Math.min(1, (p.max - p.life) * 2); g.beginPath(); if (p.k === 0) { g.moveTo(-p.s, -p.s * 0.4); g.lineTo(p.s * 0.8, -p.s * 0.7); g.lineTo(p.s, p.s * 0.5); g.lineTo(-p.s * 0.3, p.s * 0.8); } else if (p.k === 1) { g.moveTo(0, -p.s); g.lineTo(p.s, p.s * 0.6); g.lineTo(-p.s * 0.8, p.s * 0.7); } else { g.rect(-p.s * 0.6, -p.s * 0.4, p.s * 1.2, p.s * 0.8); } g.fill(); g.restore(); }
      };
    }
  }
}
