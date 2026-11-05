/** Effets « décors » réalistes dessinés sur un canvas : neige, feu d'artifice, fantômes, flammes, bulles, fête, fusée, applaudissements, jackpot, explosion. */
export type Scene = "snow" | "fireworks" | "ghost" | "fire" | "bubbles" | "party" | "rocket" | "clap" | "money" | "bomb";
export const SCENES: Scene[] = ["snow", "fireworks", "ghost", "fire", "bubbles", "party", "rocket", "clap", "money", "bomb"];
type P = { x: number; y: number; vx: number; vy: number; life: number; max: number; s: number; r: number; vr: number; c: string; k?: number; h?: number[][] };
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const DUR: Record<Scene, number> = { snow: 7, fireworks: 7.5, ghost: 7, fire: 6.5, bubbles: 7.5, party: 6, rocket: 6, clap: 6, money: 6.5, bomb: 5.5 };

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
        g.save(); g.translate(x, y); g.globalAlpha = a; const gr = g.createLinearGradient(0, -s, 0, s * 1.1); gr.addColorStop(0, "rgba(255,255,255,.95)"); gr.addColorStop(1, "rgba(220,235,255,.25)"); g.fillStyle = gr; g.shadowColor = "rgba(200,225,255,.9)"; g.shadowBlur = s * 0.35;
        g.beginPath(); g.moveTo(-s * 0.5, s * 0.9); g.lineTo(-s * 0.5, -s * 0.1); g.bezierCurveTo(-s * 0.5, -s * 0.85, s * 0.5, -s * 0.85, s * 0.5, -s * 0.1); g.lineTo(s * 0.5, s * 0.9);
        for (let i = 4; i >= 0; i--) { const px = -s * 0.5 + (i * s) / 5 + s * 0.1; g.quadraticCurveTo(px + s * 0.1, s * (0.75 + 0.18 * Math.sin(t * 5 + ph + i)), px - s * 0.1, s * 0.9); }
        g.closePath(); g.fill(); g.shadowBlur = 0; g.fillStyle = "rgba(20,25,50,.85)"; g.beginPath(); g.ellipse(-s * 0.17, -s * 0.12, s * 0.07, s * 0.11, 0, 0, 6.283); g.ellipse(s * 0.17, -s * 0.12, s * 0.07, s * 0.11, 0, 0, 6.283); g.fill();
        g.beginPath(); g.ellipse(0, s * 0.15, s * 0.1, s * 0.15, 0, 0, 6.283); g.fill(); g.restore();
      };
      const l: P[] = []; for (let i = 0; i < 22; i++) l.push({ x: rnd(0, W), y: rnd(H * 0.2, H + 100), vx: rnd(-15, 15), vy: -rnd(25, 70), life: 0, max: 0, s: rnd(30, 80), r: rnd(0, 6), vr: 0, c: "", k: rnd(0.25, 0.55) });
      return (t, dt, f) => {
        dim(g, W, H, "#0a0c24", 0.55 * f);
        for (const p of l) { p.x += p.vx * dt + Math.sin(t * 1.4 + p.r) * 25 * dt; p.y += p.vy * dt; if (p.y < -120) { p.y = H + 100; p.x = rnd(0, W); } gh(p.x, p.y, p.s, (p.k as number) * f, t, p.r); }
        const bs = Math.min(W, H) * 0.5; const bx = W * (0.5 + 0.28 * Math.sin(t * 0.8)); const by = H * 0.5 + Math.sin(t * 1.6) * 30; gh(bx, by, bs * Math.min(1, t / 1.2), 0.38 * f * (0.8 + 0.2 * Math.sin(t * 3)), t, 1);
      };
    }
    case "fire": {
      const ps: P[] = []; const em: P[] = [];
      return (t, dt, f) => {
        dim(g, W, H, "#1a0500", 0.65 * f);
        const grow = Math.min(1, t / 3.2); const n = Math.floor(14 + grow * 40);
        for (let i = 0; i < n; i++) { const x = rnd(-0.05, 1.05) * W; const hmax = H * (0.25 + grow * 0.85) * (0.55 + 0.45 * Math.sin(x / W * 5 + t * 2) ** 2 + rnd(0, 0.3)); ps.push({ x, y: H + 20, vx: rnd(-25, 25), vy: -rnd(0.6, 1.1) * hmax / 1.4, life: 0, max: rnd(0.9, 1.6), s: rnd(40, 100) * (0.6 + grow * 0.7), r: 0, vr: 0, c: "" }); }
        if (Math.random() < 0.8) em.push({ x: rnd(0, W), y: H, vx: rnd(-40, 60), vy: -rnd(150, 420), life: 0, max: rnd(1.2, 2.4), s: rnd(1, 3), r: 0, vr: 0, c: "" });
        g.globalCompositeOperation = "lighter";
        for (let i = ps.length - 1; i >= 0; i--) { const p = ps[i]; p.life += dt; if (p.life > p.max) { ps.splice(i, 1); continue; } p.x += (p.vx + Math.sin(t * 3 + p.x * 0.02) * 40) * dt; p.y += p.vy * dt; const u = p.life / p.max;
          const col = u < 0.25 ? "255,240,170" : u < 0.55 ? "255,170,40" : "230,60,10"; const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * (1 - u * 0.5)); gr.addColorStop(0, `rgba(${col},${0.55 * (1 - u)})`); gr.addColorStop(1, `rgba(${col},0)`); g.globalAlpha = f; g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, p.s, 0, 6.283); g.fill(); }
        g.globalAlpha = 1;
        for (let i = em.length - 1; i >= 0; i--) { const p = em[i]; p.life += dt; if (p.life > p.max) { em.splice(i, 1); continue; } p.x += (p.vx + Math.sin(t * 4 + i) * 40) * dt; p.y += p.vy * dt; glow(g, p.x, p.y, p.s * 4, "#ffb347", (1 - p.life / p.max) * f); }
        g.globalCompositeOperation = "source-over";
        const hg = g.createLinearGradient(0, H * 0.6, 0, H); hg.addColorStop(0, "rgba(255,80,0,0)"); hg.addColorStop(1, `rgba(255,120,20,${0.35 * grow})`); g.globalAlpha = f; g.fillStyle = hg; g.fillRect(0, H * 0.6, W, H * 0.4); g.globalAlpha = 1;
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
      const ps: P[] = []; let boom = false; const cx = W / 2;
      return (t, dt, f) => {
        dim(g, W, H, "#080b24", 0.55 * f);
        const lift = Math.max(0, t - 0.8); const y = H - 70 - (lift * lift * 330) - (t < 0.8 ? 0 : 0); const x = cx + (t < 0.8 ? Math.sin(t * 60) * 2 : Math.sin(t * 3) * 6);
        if (y > -140) { for (let i = 0; i < 6; i++) ps.push({ x: x + rnd(-8, 8), y: y + 70, vx: rnd(-50, 50), vy: rnd(120, 320), life: 0, max: rnd(0.7, 1.5), s: rnd(14, 34), r: 0, vr: 0, c: "", k: 0 }); }
        else if (!boom) { boom = true; for (let i = 0; i < 160; i++) { const a = rnd(0, 6.283), sp = rnd(80, 480); ps.push({ x: cx, y: 90, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: rnd(1.4, 2.4), s: rnd(2, 4), r: 0, vr: 0, c: pick(["#ffd24a", "#ff7a59", "#7ee8ff", "#fff"]), k: 1 }); } }
        g.globalCompositeOperation = "lighter";
        for (let i = ps.length - 1; i >= 0; i--) { const p = ps[i]; p.life += dt; if (p.life > p.max) { ps.splice(i, 1); continue; } const u = p.life / p.max; if (p.k) { p.vx *= Math.pow(0.2, dt); p.vy = p.vy * Math.pow(0.2, dt) + 160 * dt; } p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.k) glow(g, p.x, p.y, p.s * 4, p.c, (1 - u) * f); else glow(g, p.x, p.y, p.s * (1 + u * 1.6), u < 0.3 ? "rgba(255,200,90,1)" : "rgba(210,215,235,1)", (u < 0.3 ? 0.8 : 0.35) * (1 - u) * f); }
        g.globalCompositeOperation = "source-over";
        if (y > -140) { g.save(); g.translate(x, y); g.globalAlpha = f; g.shadowColor = "rgba(255,160,60,.9)"; g.shadowBlur = 25; g.fillStyle = "#ff9a3c"; g.beginPath(); g.moveTo(-14, 52); g.quadraticCurveTo(0, 130 + Math.sin(t * 50) * 14, 14, 52); g.fill(); g.shadowBlur = 0;
          g.fillStyle = "#e84a5f"; g.beginPath(); g.moveTo(-22, 58); g.lineTo(-38, 78); g.lineTo(-18, 44); g.fill(); g.beginPath(); g.moveTo(22, 58); g.lineTo(38, 78); g.lineTo(18, 44); g.fill();
          g.fillStyle = "#f4f6ff"; g.beginPath(); g.moveTo(0, -78); g.bezierCurveTo(30, -40, 24, 30, 18, 58); g.lineTo(-18, 58); g.bezierCurveTo(-24, 30, -30, -40, 0, -78); g.fill();
          g.fillStyle = "#e84a5f"; g.beginPath(); g.moveTo(0, -78); g.bezierCurveTo(14, -62, 20, -48, 22, -40); g.lineTo(-22, -40); g.bezierCurveTo(-20, -48, -14, -62, 0, -78); g.fill();
          g.fillStyle = "#3a86ff"; g.beginPath(); g.arc(0, -8, 11, 0, 6.283); g.fill(); g.strokeStyle = "#cfd8ee"; g.lineWidth = 3; g.stroke(); g.restore(); }
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
        if (t < 0.9) { dim(g, W, H, "#10080a", 0.3 * f); emo(g, "💣", cx, cy - 20, 130, 1, Math.sin(t * 20) * 0.08); const fx = cx + 36, fy = cy - 92; glow(g, fx + rnd(-3, 3), fy + rnd(-3, 3), 26, "rgba(255,200,60,1)", 0.9); return; }
        if (!boom) { boom = true; flash = 1; document.documentElement.classList.remove("shake"); void document.documentElement.offsetWidth; document.documentElement.classList.add("shake"); setTimeout(() => document.documentElement.classList.remove("shake"), 1500);
          for (let i = 0; i < 160; i++) { const a = rnd(0, 6.283), sp = Math.pow(Math.random(), 0.6) * 520; ps.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: rnd(0.8, 1.8), s: rnd(40, 110), r: 0, vr: 0, c: "", k: 0 }); }
          for (let i = 0; i < 90; i++) { const a = rnd(0, 6.283), sp = rnd(250, 900); deb.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 250, life: 0, max: rnd(2.5, 4), s: rnd(5, 20), r: rnd(0, 6), vr: rnd(-12, 12), c: pick(["#5b534e", "#7a6f67", "#3d3835", "#8a7a6a", "#2c2826"]), k: Math.floor(rnd(0, 3)) }); }
          for (let i = 0; i < 60; i++) ps.push({ x: cx + rnd(-60, 60), y: cy + rnd(-40, 40), vx: rnd(-120, 120), vy: -rnd(30, 160), life: 0, max: rnd(2, 3.5), s: rnd(60, 140), r: 0, vr: 0, c: "", k: 1 }); }
        const u0 = t - 0.9; dim(g, W, H, "#140a08", 0.45 * f);
        if (flash > 0) { dim(g, W, H, "#fff4d0", flash * 0.9 * f); flash -= dt * 2.5; }
        ring += dt * 1500; g.strokeStyle = `rgba(255,230,190,${Math.max(0, 0.7 - u0 * 1.3) * f})`; g.lineWidth = 10 - Math.min(8, u0 * 12); g.beginPath(); g.arc(cx, cy, ring, 0, 6.283); g.stroke();
        for (const p of ps) { p.life += dt; if (p.life > p.max) continue; const u = p.life / p.max; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(0.25, dt); p.vy *= Math.pow(0.25, dt);
          if (p.k === 0) { g.globalCompositeOperation = "lighter"; const col = u < 0.3 ? "255,230,150" : u < 0.6 ? "255,130,30" : "200,50,10"; const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * (0.6 + u)); gr.addColorStop(0, `rgba(${col},${0.7 * (1 - u)})`); gr.addColorStop(1, `rgba(${col},0)`); g.globalAlpha = f; g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, p.s * (0.6 + u), 0, 6.283); g.fill(); g.globalCompositeOperation = "source-over"; }
          else { p.vy -= 10 * dt; const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * (0.8 + u * 1.2)); gr.addColorStop(0, `rgba(60,55,52,${0.55 * (1 - u)})`); gr.addColorStop(1, "rgba(60,55,52,0)"); g.globalAlpha = f; g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, p.s * (0.8 + u * 1.2), 0, 6.283); g.fill(); } }
        g.globalAlpha = 1;
        for (const p of deb) { p.life += dt; if (p.life > p.max) continue; p.vy += 900 * dt; p.vx *= Math.pow(0.5, dt); p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; if (p.y > H - 8 && p.vy > 0) { p.y = H - 8; p.vy *= -0.3; p.vx *= 0.6; p.vr *= 0.4; }
          g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.globalAlpha = f * Math.min(1, (p.max - p.life) * 2); g.beginPath(); if (p.k === 0) { g.moveTo(-p.s, -p.s * 0.4); g.lineTo(p.s * 0.8, -p.s * 0.7); g.lineTo(p.s, p.s * 0.5); g.lineTo(-p.s * 0.3, p.s * 0.8); } else if (p.k === 1) { g.moveTo(0, -p.s); g.lineTo(p.s, p.s * 0.6); g.lineTo(-p.s * 0.8, p.s * 0.7); } else { g.rect(-p.s * 0.6, -p.s * 0.4, p.s * 1.2, p.s * 0.8); } g.fill(); g.restore(); }
      };
    }
  }
}
