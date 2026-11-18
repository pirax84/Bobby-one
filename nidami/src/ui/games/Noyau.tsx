import { useEffect, useRef, useState } from "react";
import { t } from "../../i18n";
import { actions } from "../../lib/store";

/**
 * Noyau : jeu de précision à un seul geste. Des particules tournent autour d'un noyau lumineux ;
 * on touche l'écran quand l'une d'elles passe dans la zone lumineuse (en haut) pour la fondre dans le noyau.
 * Niveaux infinis : chaque niveau demande plus de particules, plus vite, avec une zone plus fine.
 */
const COL = ["#9B87F5", "#2FCDBE", "#E5679C", "#FF8A6B", "#4F7BFF"];
const GATE = -Math.PI / 2;
const TAU = Math.PI * 2;
const norm = (a: number) => { a = ((a + Math.PI) % TAU + TAU) % TAU - Math.PI; return a; };
type Wave = { r: number; life: number; c: string; w: number };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; c: string };
type Part = { a: number; w: number; c: string; fly: number };
const need = (lv: number) => Math.min(30, 6 + lv * 2);
const rings = (lv: number) => Math.min(3, 1 + Math.floor((lv - 1) / 2));
const tol = (lv: number) => Math.max(0.17, 0.46 - lv * 0.018);
const speed = (lv: number) => 1.5 + Math.min(lv - 1, 24) * 0.11;
const bestKey = "notiif-noyau-best";
const readBest = () => { try { return +(localStorage.getItem(bestKey) || "1") || 1; } catch { return 1; } };

export function Noyau() {
  const cv = useRef<HTMLCanvasElement>(null); const box = useRef<HTMLDivElement>(null);
  const [ui, setUi] = useState({ level: 1, combo: 0, gauge: 0, lives: 3, state: "idle" as "idle" | "play" | "over", banner: "", best: readBest() });
  const G = useRef({ level: 1, combo: 0, gauge: 0, lives: 3, state: "idle" as "idle" | "play" | "over", parts: [] as Part[], waves: [] as Wave[], sparks: [] as Spark[], shake: 0, flash: 0, pulse: 0, bannerT: 0, banner: "", t0: 0, scored: false });
  const au = useRef<AudioContext | null>(null);

  const tone = (f: number, d: number, type: OscillatorType = "sine", vol = 0.14, slide = 0) => {
    try {
      if (!au.current) au.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const a = au.current; if (a.state === "suspended") void a.resume(); const o = a.createOscillator(), g = a.createGain(); const n = a.currentTime;
      o.type = type; o.frequency.setValueAtTime(f, n); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), n + d);
      g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(vol, n + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, n + d); o.connect(g); g.connect(a.destination); o.start(n); o.stop(n + d + 0.02);
    } catch { /* pas de son */ }
  };
  const SCALE = [0, 2, 4, 7, 9];
  const note = (i: number) => 261.63 * Math.pow(2, (SCALE[i % 5] + 12 * Math.floor(i / 5)) / 12);
  const buzz = (p: number | number[]) => { try { navigator.vibrate?.(p); } catch { /* rien */ } };

  const spawn = (lv: number, keepAway = true): Part[] => Array.from({ length: rings(lv) }, (_, i) => ({ a: GATE + Math.PI * (0.6 + Math.random() * 0.8) * (keepAway ? 1 : 0.3), w: (i % 2 ? -1 : 1) * speed(lv) * (1 + i * 0.22), c: COL[(i + lv) % 5], fly: 0 }));
  const begin = () => {
    const g = G.current; g.level = 1; g.combo = 0; g.gauge = 0; g.lives = 3; g.state = "play"; g.parts = spawn(1); g.waves = []; g.sparks = []; g.scored = false; g.banner = ""; g.bannerT = 0;
    setUi((u) => ({ ...u, level: 1, combo: 0, gauge: 0, lives: 3, state: "play", banner: "" })); tone(392, 0.18, "triangle", 0.12);
  };
  const levelUp = () => {
    const g = G.current; g.level++; g.gauge = 0; g.lives = Math.min(3, g.lives + 1); g.parts = spawn(g.level); g.flash = 1; g.banner = t("Niveau {n} réussi !", { n: g.level - 1 }); g.bannerT = 1.4;
    for (let i = 0; i < 4; i++) g.waves.push({ r: 0.06 + i * 0.05, life: 1, c: COL[i % 5], w: 5 });
    [0, 4, 7, 12].forEach((s, i) => setTimeout(() => tone(392 * Math.pow(2, s / 12), 0.35, "triangle", 0.13), i * 90)); buzz([20, 40, 60]);
    if (g.level > readBest()) { try { localStorage.setItem(bestKey, String(g.level)); } catch { /* rien */ } }
    setUi((u) => ({ ...u, level: g.level, gauge: 0, lives: g.lives, banner: g.banner, best: Math.max(u.best, g.level) }));
  };
  const tap = () => {
    const g = G.current; if (g.state === "idle") { begin(); return; } if (g.state !== "play") return;
    const L = tol(g.level); let bi = -1, bd = 9;
    g.parts.forEach((p, i) => { if (p.fly > 0) return; const d = Math.abs(norm(p.a - GATE)); if (d < bd) { bd = d; bi = i; } });
    if (bi >= 0 && bd <= L) {
      const p = g.parts[bi]; const perfect = bd < L * 0.35; p.fly = 0.0001; g.combo++; g.gauge++; g.pulse = 1;
      g.waves.push({ r: 0.1, life: 1, c: p.c, w: perfect ? 6 : 3 }); if (perfect) g.waves.push({ r: 0.1, life: 1, c: "#fff", w: 2 });
      for (let k = 0; k < (perfect ? 18 : 10); k++) { const an = Math.random() * TAU, sp = 0.15 + Math.random() * 0.45; g.sparks.push({ x: 0, y: 0, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, life: 1, c: Math.random() < 0.5 ? p.c : "#fff" }); }
      tone(note(Math.min(14, g.combo - 1)), 0.28, "sine", 0.16); if (perfect) tone(note(Math.min(14, g.combo - 1)) * 2, 0.2, "triangle", 0.06); buzz(perfect ? 22 : 12);
      if (g.gauge >= need(g.level)) levelUp();
      else { setUi((u) => ({ ...u, combo: g.combo, gauge: g.gauge })); if (perfect) { g.banner = t("Parfait !"); g.bannerT = 0.5; } }
    } else {
      g.combo = 0; g.lives--; g.shake = 1; g.gauge = Math.max(0, g.gauge - 1); tone(180, 0.3, "sawtooth", 0.1, -90); buzz([40, 30, 40]);
      if (g.lives <= 0) {
        g.state = "over"; if (g.level > 1 && !g.scored) { g.scored = true; actions.addScore(g.level - 1); }
        try { if (g.level > readBest()) localStorage.setItem(bestKey, String(g.level)); } catch { /* rien */ }
        setUi((u) => ({ ...u, combo: 0, lives: 0, state: "over", gauge: g.gauge, best: Math.max(u.best, g.level) }));
      } else setUi((u) => ({ ...u, combo: 0, lives: g.lives, gauge: g.gauge }));
    }
  };

  useEffect(() => {
    const c = cv.current!, b = box.current!; const x = c.getContext("2d")!; let raf = 0, last = performance.now(); const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fit = () => { const r = b.getBoundingClientRect(); const d = Math.min(2, window.devicePixelRatio || 1); c.width = Math.round(r.width * d); c.height = Math.round(r.height * d); };
    fit(); const ro = new ResizeObserver(fit); ro.observe(b);
    G.current.parts = spawn(1, false);
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; const g = G.current; const W = c.width, H = c.height, S = Math.min(W, H), cx = W / 2, cy = H / 2;
      const bg = x.createRadialGradient(cx, cy, 0, cx, cy, S * 0.75); bg.addColorStop(0, "#2A1F5C"); bg.addColorStop(1, "#120C2E"); x.fillStyle = bg; x.fillRect(0, 0, W, H);
      x.save(); if (g.shake > 0 && !reduce) { x.translate((Math.random() - 0.5) * S * 0.03 * g.shake, (Math.random() - 0.5) * S * 0.03 * g.shake); g.shake = Math.max(0, g.shake - dt * 3); }
      const R = (i: number) => S * (0.2 + 0.13 * i + (rings(g.level) === 1 ? 0.1 : 0));
      // anneaux
      for (let i = 0; i < rings(g.level); i++) { x.beginPath(); x.arc(cx, cy, R(i), 0, TAU); x.strokeStyle = "rgba(190,200,255,.28)"; x.lineWidth = S * 0.006; x.setLineDash([S * 0.02, S * 0.02]); x.lineDashOffset = -now / 60 * (i % 2 ? -1 : 1); x.stroke(); x.setLineDash([]); }
      // zone lumineuse (porte)
      const top = R(rings(g.level) - 1) + S * 0.07, bot = R(0) - S * 0.07; const gw = tol(g.level) * R(rings(g.level) - 1) * 1.0;
      const gg = x.createLinearGradient(cx, cy - top, cx, cy - bot); gg.addColorStop(0, "rgba(139,227,240,.0)"); gg.addColorStop(0.5, "rgba(139,227,240,.55)"); gg.addColorStop(1, "rgba(139,227,240,.0)");
      x.fillStyle = gg; x.fillRect(cx - gw, cy - top, gw * 2, top - bot); x.fillStyle = "rgba(255,255,255,.85)"; x.fillRect(cx - S * 0.003, cy - top, S * 0.006, top - bot);
      // noyau
      g.pulse = Math.max(0, g.pulse - dt * 4); const cr = S * (0.085 + g.pulse * 0.025 + Math.sin(now / 500) * 0.004); const fill = Math.min(1, g.gauge / need(g.level));
      const gl = x.createRadialGradient(cx, cy, 0, cx, cy, cr * 3.2); gl.addColorStop(0, `rgba(229,103,156,${0.55 + fill * 0.35})`); gl.addColorStop(0.45, `rgba(155,135,245,${0.25 + fill * 0.2})`); gl.addColorStop(1, "rgba(155,135,245,0)"); x.fillStyle = gl; x.beginPath(); x.arc(cx, cy, cr * 3.2, 0, TAU); x.fill();
      const nc = x.createRadialGradient(cx - cr * 0.3, cy - cr * 0.3, cr * 0.1, cx, cy, cr); nc.addColorStop(0, "#fff"); nc.addColorStop(0.35, "#FFB4D4"); nc.addColorStop(1, "#9B87F5"); x.fillStyle = nc; x.beginPath(); x.arc(cx, cy, cr, 0, TAU); x.fill();
      x.beginPath(); x.arc(cx, cy, cr * 1.35, -Math.PI / 2, -Math.PI / 2 + TAU * fill); x.strokeStyle = "#2FCDBE"; x.lineWidth = S * 0.014; x.lineCap = "round"; x.stroke();
      // vagues
      g.waves = g.waves.filter((w) => w.life > 0); for (const w of g.waves) { w.life -= dt * 1.6; w.r += dt * 0.55; x.beginPath(); x.arc(cx, cy, w.r * S, 0, TAU); x.strokeStyle = w.c; x.globalAlpha = Math.max(0, w.life) * 0.8; x.lineWidth = S * 0.004 * w.w; x.stroke(); x.globalAlpha = 1; }
      // particules
      g.parts.forEach((p, i) => {
        const r = R(Math.min(i, rings(g.level) - 1));
        if (p.fly > 0) { p.fly += dt * 5; const k = Math.min(1, p.fly); const rr = r * (1 - k); const px = cx + Math.cos(p.a) * rr, py = cy + Math.sin(p.a) * rr; x.fillStyle = p.c; x.beginPath(); x.arc(px, py, S * 0.03 * (1 - k * 0.5), 0, TAU); x.fill(); if (k >= 1) { const sp = spawn(g.level)[i]; if (sp) { sp.a = GATE + Math.PI * (0.7 + Math.random() * 0.6); g.parts[i] = sp; } } return; }
        if (g.state === "play" || g.state === "idle") p.a += p.w * dt * (g.state === "idle" ? 0.5 : 1);
        const px = cx + Math.cos(p.a) * r, py = cy + Math.sin(p.a) * r; const near = Math.abs(norm(p.a - GATE)) <= tol(g.level);
        for (let k = 1; k < 9; k++) { const ta = p.a - Math.sign(p.w) * k * 0.045; x.globalAlpha = 0.5 - k * 0.055; x.fillStyle = p.c; x.beginPath(); x.arc(cx + Math.cos(ta) * r, cy + Math.sin(ta) * r, S * 0.024 * (1 - k * 0.07), 0, TAU); x.fill(); } x.globalAlpha = 1;
        const pg = x.createRadialGradient(px, py, 0, px, py, S * 0.06); pg.addColorStop(0, p.c + "cc"); pg.addColorStop(1, p.c + "00"); x.fillStyle = pg; x.beginPath(); x.arc(px, py, S * 0.06, 0, TAU); x.fill();
        x.fillStyle = near ? "#fff" : p.c; x.beginPath(); x.arc(px, py, S * 0.03, 0, TAU); x.fill();
      });
      // étincelles
      g.sparks = g.sparks.filter((s) => s.life > 0); for (const s of g.sparks) { s.life -= dt * 1.5; s.x += s.vx * dt; s.y += s.vy * dt; x.globalAlpha = Math.max(0, s.life); x.fillStyle = s.c; x.beginPath(); x.arc(cx + s.x * S, cy + s.y * S, S * 0.008, 0, TAU); x.fill(); } x.globalAlpha = 1;
      if (g.flash > 0) { g.flash = Math.max(0, g.flash - dt * 2); x.fillStyle = `rgba(255,255,255,${g.flash * 0.25})`; x.fillRect(0, 0, W, H); }
      x.restore();
      if (g.bannerT > 0) { g.bannerT -= dt; const al = Math.min(1, g.bannerT * 3); x.globalAlpha = al; x.fillStyle = "#fff"; x.font = `800 ${S * 0.07}px system-ui,sans-serif`; x.textAlign = "center"; x.fillText(g.banner, cx, cy - S * 0.36); x.globalAlpha = 1; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => { cancelAnimationFrame(raf); ro.disconnect(); try { au.current?.close(); } catch { /* rien */ } au.current = null; };
  }, []);

  const lives = Array.from({ length: 3 }, (_, i) => <span key={i} aria-hidden="true" style={{ color: i < ui.lives ? "#E5679C" : "rgba(255,255,255,.25)", fontSize: 18 }}>●</span>);
  return (
    <div className="card col" style={{ alignItems: "center", gap: 10, background: "linear-gradient(160deg,#2A1F5C,#150F33)", color: "#fff" }}>
      <div className="row" style={{ width: "100%", justifyContent: "space-between", alignItems: "center" }}>
        <b style={{ fontSize: "1.1rem" }}>{t("Niveau {n}", { n: ui.level })}</b>
        <span role="status" aria-live="polite" style={{ fontWeight: 800, color: "#8BE3F0", minWidth: 90, textAlign: "center" }}>{ui.combo > 1 ? t("Combo ×{n}", { n: ui.combo }) : ""}</span>
        <span role="img" aria-label={t("Vies : {n}", { n: ui.lives })}>{lives}</span>
      </div>
      <div aria-hidden="true" style={{ width: "100%", height: 8, borderRadius: 99, background: "rgba(255,255,255,.14)", overflow: "hidden" }}><div style={{ width: Math.min(100, ui.gauge / need(ui.level) * 100) + "%", height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#2FCDBE,#9B87F5,#E5679C)", transition: "width .2s" }} /></div>
      <div ref={box} style={{ position: "relative", width: "min(100%, 420px)", aspectRatio: "1 / 1.15", borderRadius: 22, overflow: "hidden", touchAction: "none", userSelect: "none" }}>
        <canvas ref={cv} role="button" tabIndex={0} aria-label={t("Zone de jeu : touche pour envoyer la particule dans le noyau")} onPointerDown={(e) => { e.preventDefault(); tap(); }} onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); tap(); } }} style={{ width: "100%", height: "100%", display: "block", cursor: "pointer" }} />
        {ui.state === "idle" && <div style={{ position: "absolute", left: 0, right: 0, bottom: 14, textAlign: "center", pointerEvents: "none", fontWeight: 800 }}>{t("Touche pour commencer")}</div>}
        {ui.state === "over" && <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "rgba(18,12,46,.78)", textAlign: "center", padding: 16 }}>
          <b style={{ fontSize: "1.2rem" }}>{t("Perdu ! Tu as atteint le niveau {n}.", { n: ui.level })}</b><span style={{ opacity: .8 }}>{t("Meilleur niveau : {n}", { n: ui.best })}</span>
          <button type="button" className="btn" onClick={begin}>{t("Rejouer")}</button></div>}
      </div>
      <small style={{ opacity: .8, textAlign: "center" }}>{t("Touche l'écran quand la particule passe dans la zone lumineuse.")}</small>
    </div>
  );
}
