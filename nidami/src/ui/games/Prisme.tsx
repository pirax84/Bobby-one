import { useEffect, useRef, useState, type ReactElement } from "react";
import { t } from "../../i18n";
import { actions, useStore } from "../../lib/store";

/**
 * Prisme : jeu d'association de gemmes (façon match‑3) avec réactions en chaîne.
 * 3 difficultés, 5 000 niveaux générés par une graine (même niveau = même départ pour tous),
 * jokers, cadeau du jour, pseudo, classement et défis asynchrones contre des joueurs de démonstration.
 * Tout est enregistré dans le téléphone (aucun serveur).
 */
const COL = ["#9B87F5", "#2FCDBE", "#E5679C", "#FF8A6B", "#4F7BFF", "#C9B8FF"];
const TAU = Math.PI * 2;
const MAXLV = 5000;
type Sp = "" | "h" | "v" | "b" | "r";
type Gem = { id: number; k: number; sp: Sp; x: number; y: number; vy: number; f: boolean; dy: number; pop: number };
type Part = { x: number; y: number; vx: number; vy: number; l: number; c: string; s: number };
type Txt = { x: number; y: number; s: string; l: number };
type Goal = { k: "score" | "collect" | "ice"; n: number; c: number };
type Spec = { level: number; mode: number; size: number; ncol: number; moves: number; goal: Goal; ice: number[]; seed: number };
type Save = { name: string; coins: number; hammer: number; shuffle: number; extra: number; lives: number; lifeTs: number; prog: number[]; stars: Record<string, number>; best: number; total: number; lastDaily: string; streak: number; sound: boolean; mode: number };
type Board = { n: number; g: (Gem | null)[][]; ice: boolean[][]; sel: [number, number] | null; cur: [number, number]; busy: boolean; moves: number; score: number; got: number; over: "" | "win" | "lose" | "end"; spec: Spec; parts: Part[]; txt: Txt[]; shake: number; id: number; hammer: boolean; combo: number; msg: string; stars: number; gain: number };

const KEY = "notiif-prisme-v1";
const LIFE_MS = 5 * 60000;
const COST = { hammer: 40, shuffle: 30, extra: 50 } as const;
const MODES = [{ size: 6, col: 4, moves: 26, d: 0.85 }, { size: 7, col: 5, moves: 22, d: 1 }, { size: 8, col: 6, moves: 20, d: 1.2 }];
const DAYS = [{ coins: 30 }, { hammer: 1 }, { coins: 50 }, { shuffle: 1 }, { lives: 1 }, { coins: 80, extra: 1 }, { coins: 120, hammer: 1, shuffle: 1, lives: 2 }] as { coins?: number; hammer?: number; shuffle?: number; extra?: number; lives?: number }[];
const OPP: [string, number][] = [["Léa", 0.8], ["Hugo", 0.62], ["Nina", 0.95], ["Tom", 0.5], ["Sacha", 0.72], ["Inès", 0.88], ["Malo", 0.4], ["Zoé", 0.66]];

const rngOf = (a: number) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
const today = () => new Date().toLocaleDateString("sv");
const dayDiff = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
const def = (name: string): Save => ({ name, coins: 50, hammer: 2, shuffle: 2, extra: 1, lives: 5, lifeTs: Date.now(), prog: [1, 1, 1], stars: {}, best: 0, total: 0, lastDaily: "", streak: 0, sound: true, mode: 1 });
function load(name: string): Save {
  try { const r = localStorage.getItem(KEY); if (r) { const s = { ...def(name), ...JSON.parse(r) } as Save; if (!s.name) s.name = name; return s; } } catch { /* rien */ }
  return def(name);
}
function regen(s: Save) {
  if (s.lives >= 5) { s.lives = 5; s.lifeTs = Date.now(); return; }
  const n = Math.floor((Date.now() - s.lifeTs) / LIFE_MS); if (n > 0) { s.lives = Math.min(5, s.lives + n); s.lifeTs += n * LIFE_MS; if (s.lives >= 5) s.lifeTs = Date.now(); }
}

/** Niveau 1 à 5000 : tout est calculé à partir du numéro et de la difficulté (aucun niveau écrit à la main). */
export function levelSpec(level: number, mode: number): Spec {
  const seed = level * 7919 + mode * 104729 + 12345; const rnd = rngOf(seed); const M = MODES[mode];
  const p = Math.min(1, (level - 1) / 600); const ease = level % 10 === 0 ? 0.8 : level % 25 === 0 ? 1.15 : 1;
  const moves = Math.max(12, Math.round(M.moves * (1 - 0.1 * p) + Math.floor(rnd() * 3)));
  const kinds: Goal["k"][] = level < 4 ? ["score"] : level < 8 ? ["score", "collect"] : ["score", "collect", "ice"]; const k = kinds[Math.floor(rnd() * kinds.length)];
  const cells = M.size * M.size; let goal: Goal; let ice: number[] = [];
  if (k === "score") goal = { k, n: Math.round((moves * (55 + 55 * p) * M.d * ease) / 50) * 50, c: 0 };
  else if (k === "collect") goal = { k, c: Math.floor(rnd() * M.col), n: Math.max(8, Math.round(moves * (6 / M.col) * (0.55 + 0.5 * p) * M.d * ease)) };
  else {
    const n = Math.max(4, Math.min(Math.floor(cells * 0.7), Math.round(cells * (0.18 + 0.3 * p) * M.d * ease))); const all = Array.from({ length: cells }, (_, i) => i);
    for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
    ice = all.slice(0, n); goal = { k, n, c: 0 };
  }
  return { level, mode, size: M.size, ncol: M.col, moves, goal, ice, seed };
}
const oppLevel = (i: number) => Math.floor(6 + i * 13 + OPP[i][1] * 40 + Math.max(0, dayDiff("2026-11-01", today())) * OPP[i][1] * 1.6);
const oppScore = (i: number, sp: Spec) => { const p = Math.min(1, (sp.level - 1) / 600); return Math.round((sp.moves * (45 + 55 * p) * (0.6 + OPP[i][1] * 0.6)) / 10) * 10; };

const mix = (h: string, t: number, to = 255) => { const n = parseInt(h.slice(1), 16); const f = (v: number) => Math.round(v + (to - v) * t); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
function path(x: CanvasRenderingContext2D, k: number, cx: number, cy: number, R: number) {
  x.beginPath();
  if (k === 0) x.arc(cx, cy, R, 0, TAU);
  else if (k === 1) { x.moveTo(cx, cy - R * 1.1); x.lineTo(cx + R, cy); x.lineTo(cx, cy + R * 1.1); x.lineTo(cx - R, cy); x.closePath(); }
  else if (k === 2) { x.moveTo(cx, cy - R * 1.05); x.lineTo(cx + R, cy + R * 0.8); x.lineTo(cx - R, cy + R * 0.8); x.closePath(); }
  else if (k === 3) { const r = R * 0.3, a = R * 0.92; x.moveTo(cx - a + r, cy - a); x.arcTo(cx + a, cy - a, cx + a, cy + a, r); x.arcTo(cx + a, cy + a, cx - a, cy + a, r); x.arcTo(cx - a, cy + a, cx - a, cy - a, r); x.arcTo(cx - a, cy - a, cx + a, cy - a, r); x.closePath(); }
  else if (k === 4) { for (let i = 0; i < 6; i++) { const a = (TAU / 6) * i - Math.PI / 2; const px = cx + Math.cos(a) * R * 1.05, py = cy + Math.sin(a) * R * 1.05; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.closePath(); }
  else { for (let i = 0; i < 10; i++) { const a = (Math.PI / 5) * i - Math.PI / 2; const rr = i % 2 ? R * 0.5 : R * 1.12; const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.closePath(); }
}
function drawGem(x: CanvasRenderingContext2D, k: number, sp: Sp, cx: number, cy: number, R: number, alpha = 1) {
  x.globalAlpha = alpha;
  if (sp === "r") {
    for (let i = 0; i < 6; i++) { x.fillStyle = COL[i]; x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, R * 1.05, (TAU / 6) * i, (TAU / 6) * (i + 1)); x.closePath(); x.fill(); }
    x.strokeStyle = "#fff"; x.lineWidth = R * 0.18; x.beginPath(); x.arc(cx, cy, R * 1.05, 0, TAU); x.stroke(); x.fillStyle = "#fff"; x.beginPath(); x.arc(cx, cy, R * 0.28, 0, TAU); x.fill(); x.globalAlpha = 1; return;
  }
  const c = COL[k]; path(x, k, cx, cy, R); const g = x.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R * 1.25); g.addColorStop(0, mix(c, 0.65)); g.addColorStop(0.45, c); g.addColorStop(1, mix(c, 0.38, 0)); x.fillStyle = g; x.fill();
  x.lineWidth = Math.max(1.5, R * 0.1); x.strokeStyle = "rgba(255,255,255,.55)"; x.stroke();
  x.fillStyle = "rgba(255,255,255,.55)"; x.beginPath(); x.ellipse(cx - R * 0.32, cy - R * 0.38, R * 0.22, R * 0.12, -0.7, 0, TAU); x.fill();
  if (sp) {
    x.strokeStyle = "#fff"; x.fillStyle = "#fff"; x.lineWidth = R * 0.14; x.lineCap = "round";
    if (sp === "h") { x.beginPath(); x.moveTo(cx - R * 0.7, cy); x.lineTo(cx + R * 0.7, cy); x.moveTo(cx - R * 0.45, cy - R * 0.25); x.lineTo(cx - R * 0.7, cy); x.lineTo(cx - R * 0.45, cy + R * 0.25); x.moveTo(cx + R * 0.45, cy - R * 0.25); x.lineTo(cx + R * 0.7, cy); x.lineTo(cx + R * 0.45, cy + R * 0.25); x.stroke(); }
    else if (sp === "v") { x.beginPath(); x.moveTo(cx, cy - R * 0.7); x.lineTo(cx, cy + R * 0.7); x.moveTo(cx - R * 0.25, cy - R * 0.45); x.lineTo(cx, cy - R * 0.7); x.lineTo(cx + R * 0.25, cy - R * 0.45); x.moveTo(cx - R * 0.25, cy + R * 0.45); x.lineTo(cx, cy + R * 0.7); x.lineTo(cx + R * 0.25, cy + R * 0.45); x.stroke(); }
    else { x.beginPath(); x.arc(cx, cy, R * 0.55, 0, TAU); x.stroke(); x.beginPath(); x.arc(cx, cy, R * 0.16, 0, TAU); x.fill(); }
  }
  x.globalAlpha = 1;
}
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const kx = (r: number, c: number) => r * 100 + c;

function Stars({ n, s = 16 }: { n: number; s?: number }) {
  return <span role="img" aria-label={t("{n} étoiles sur 3", { n })} style={{ display: "inline-flex", gap: 2 }}>{[0, 1, 2].map((i) => <svg key={i} width={s} height={s} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3 7 7.5.6-5.7 4.9 1.8 7.4L12 18l-6.6 3.9 1.8-7.4L1.5 9.6 9 9z" fill={i < n ? "#FF8A6B" : "none"} stroke={i < n ? "#FF8A6B" : "currentColor"} strokeWidth="1.6" opacity={i < n ? 1 : 0.35} /></svg>)}</span>;
}
const Coin = ({ s = 16 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#FF8A6B" /><circle cx="12" cy="12" r="6.5" fill="none" stroke="#fff" strokeWidth="1.6" opacity=".8" /></svg>;
const Life = ({ s = 16 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21C4 15 2.5 9.5 6 6.5c3-2.4 5 0 6 2 1-2 3-4.4 6-2 3.500 3 2 8.500-6 14.500z" fill="#E5679C" /></svg>;
const IC: Record<string, ReactElement> = {
  hammer: <><path d="M14 4l6 6-3 3-6-6z" /><path d="M11.500 8.500L4 16l4 4 7.500-7.500" /></>,
  shuffle: <><path d="M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4" /><path d="M18 4l3 3-3 3M18 14l3 3-3 3" /></>,
  extra: <path d="M12 5v14M5 12h14" />,
  sound: <><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16 9a4 4 0 010 6M18.500 6.500a8 8 0 010 11" /></>,
  mute: <><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M17 9l5 6M22 9l-5 6" /></>,
  back: <path d="M15 5l-7 7 7 7" />,
};
const Ic = ({ n, s = 22 }: { n: string; s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{IC[n]}</svg>;
const Gm = ({ k, s = 22 }: { k: number; s?: number }) => {
  const R = 9; const pts = (() => { const o: string[] = []; if (k === 1) return "12,1 21,12 12,23 3,12"; if (k === 2) return "12,2 22,20 2,20"; if (k === 4) for (let i = 0; i < 6; i++) { const a = (TAU / 6) * i - Math.PI / 2; o.push(`${12 + Math.cos(a) * 10},${12 + Math.sin(a) * 10}`); } if (k === 5) for (let i = 0; i < 10; i++) { const a = (Math.PI / 5) * i - Math.PI / 2; const r = i % 2 ? 5 : 11; o.push(`${12 + Math.cos(a) * r},${12 + Math.sin(a) * r}`); } return o.join(" "); })();
  return <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true">{k === 0 ? <circle cx="12" cy="12" r={R + 1} fill={COL[0]} /> : k === 3 ? <rect x="3" y="3" width="18" height="18" rx="5" fill={COL[3]} /> : <polygon points={pts} fill={COL[k]} />}</svg>;
};
const Av = ({ i, s = 36, me = false }: { i: number; s?: number; me?: boolean }) => <span aria-hidden="true" style={{ width: s, height: s, borderRadius: "50%", background: me ? "linear-gradient(135deg,#9B87F5,#E5679C)" : COL[i % 5], display: "inline-grid", placeItems: "center", color: "#150C3A", fontWeight: 800, flex: "none" }}>{me ? "★" : OPP[i][0][0]}</span>;

/* ---------------------------------------------------------------- plateau de jeu */
type PlayProps = { sv: () => Save; commit: (p: Partial<Save>) => void; spec: Spec; opp: number; onBack: () => void; onNext: (n: number) => void; onRetry: () => void };
function Play({ sv, commit, spec, opp, onBack, onNext, onRetry }: PlayProps) {
  const cv = useRef<HTMLCanvasElement>(null); const box = useRef<HTMLDivElement>(null); const api = useRef<{ run: (k: "hammer" | "shuffle" | "extra") => void } | null>(null);
  const [ui, setUi] = useState({ moves: spec.moves, score: 0, got: 0, over: "" as Board["over"], msg: "", combo: 0, stars: 0, gain: 0, hammer: false });
  const chall = opp >= 0; const oppSc = chall ? oppScore(opp, spec) : 0;
  const sfxOn = () => sv().sound;
  useEffect(() => {
    const canvas = cv.current!; const x = canvas.getContext("2d")!; const n = spec.size; const rnd = rngOf(spec.seed + 99);
    const B: Board = { n, g: [], ice: Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => spec.ice.includes(r * n + c))), sel: null, cur: [0, 0], busy: false, moves: spec.moves, score: 0, got: 0, over: "", spec, parts: [], txt: [], shake: 0, id: 1, hammer: false, combo: 0, msg: "", stars: 0, gain: 0 };
    let au: AudioContext | null = null; let dead = false; let W = 300;
    const sync = () => setUi({ moves: B.moves, score: B.score, got: B.got, over: B.over, msg: B.msg, combo: B.combo, stars: B.stars, gain: B.gain, hammer: B.hammer });
    const flash = (m: string) => { B.msg = m; sync(); setTimeout(() => { if (B.msg === m) { B.msg = ""; sync(); } }, 1800); };
    const tone = (f: number, d: number, type: OscillatorType = "sine", vol = 0.12, slide = 0) => {
      if (!sfxOn()) return;
      try {
        if (!au) au = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const a = au; if (a.state === "suspended") void a.resume(); const o = a.createOscillator(), g = a.createGain(); const t0 = a.currentTime;
        o.type = type; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t0 + d);
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d); o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + d + 0.02);
      } catch { /* pas de son */ }
    };
    const SC = [0, 2, 4, 7, 9]; const note = (i: number) => 261.63 * Math.pow(2, (SC[i % 5] + 12 * Math.floor(i / 5)) / 12);
    const buzz = (p: number | number[]) => { try { if (sfxOn()) navigator.vibrate?.(p); } catch { /* rien */ } };
    const mk = (k: number, r: number, c: number, from = 0): Gem => ({ id: B.id++, k, sp: "", x: c, y: r - from, vy: 0, f: true, dy: 0, pop: 0 });
    const rk = () => Math.floor(rnd() * spec.ncol);
    const colorAt = (r: number, c: number) => { const q = B.g[r]?.[c]; return q && q.sp !== "r" ? q.k : -2; };
    const hasMatchAt = (r: number, c: number) => { const k = colorAt(r, c); if (k < 0) return false; let h = 1, v = 1; for (let i = c - 1; i >= 0 && colorAt(r, i) === k; i--) h++; for (let i = c + 1; i < n && colorAt(r, i) === k; i++) h++; for (let i = r - 1; i >= 0 && colorAt(i, c) === k; i--) v++; for (let i = r + 1; i < n && colorAt(i, c) === k; i++) v++; return h >= 3 || v >= 3; };
    const swapRaw = (a: [number, number], b: [number, number]) => { const t0 = B.g[a[0]][a[1]]; B.g[a[0]][a[1]] = B.g[b[0]][b[1]]; B.g[b[0]][b[1]] = t0; };
    const hasMove = () => {
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const q = B.g[r][c]; if (!q) continue; if (q.sp) return true;
        for (const [dr, dc] of [[0, 1], [1, 0]]) { const r2 = r + dr, c2 = c + dc; if (r2 >= n || c2 >= n) continue; swapRaw([r, c], [r2, c2]); const ok = hasMatchAt(r, c) || hasMatchAt(r2, c2); swapRaw([r, c], [r2, c2]); if (ok) return true; }
      }
      return false;
    };
    const anyMatch = () => { for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (hasMatchAt(r, c)) return true; return false; };
    const fill = () => { do { B.g = Array.from({ length: n }, () => Array(n).fill(null)); for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { let k = rk(), t = 0; B.g[r][c] = mk(k, r, c); while (hasMatchAt(r, c) && t++ < 20) { k = rk(); B.g[r][c] = mk(k, r, c); } const q = B.g[r][c]!; q.y = r; q.f = false; } } while (!hasMove() || anyMatch()); };
    fill();
    const reshuffle = async () => {
      const gs: Gem[] = []; B.g.forEach((row) => row.forEach((q) => q && gs.push(q))); let tries = 0;
      do { for (let i = gs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [gs[i], gs[j]] = [gs[j], gs[i]]; } let i = 0; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { B.g[r][c] = gs[i++]; } tries++; } while ((anyMatch() || !hasMove()) && tries < 80);
      B.g.forEach((row) => row.forEach((q) => { if (q) q.f = false; })); [0, 4, 7].forEach((s, i) => setTimeout(() => tone(330 * Math.pow(2, s / 12), 0.15, "triangle", 0.09), i * 70)); await sleep(350);
    };
    const settle = () => new Promise<void>((res) => { const t0 = performance.now(); const chk = () => { let ok = true; for (let r = 0; r < n && ok; r++) for (let c = 0; c < n; c++) { const q = B.g[r][c]; if (q && (Math.abs(q.x - c) > 0.03 || Math.abs(q.y - r) > 0.03)) { ok = false; break; } } if (ok || performance.now() - t0 > 1300 || dead) res(); else requestAnimationFrame(chk); }; chk(); });
    /* motifs trouvés + gemmes spéciales à créer */
    const findMatches = (piv: [number, number][]) => {
      const rem = new Set<number>(); const made = new Map<number, Sp>(); const runs: { cells: number[]; dir: "h" | "v" }[] = [];
      const kk = (r: number, c: number) => { const q = B.g[r][c]; return q && q.sp !== "r" && q.dy === 0 ? q.k : -1; };
      for (let r = 0; r < n; r++) { let c = 0; while (c < n) { const k = kk(r, c); let e = c + 1; if (k >= 0) while (e < n && kk(r, e) === k) e++; if (k >= 0 && e - c >= 3) runs.push({ cells: Array.from({ length: e - c }, (_, i) => kx(r, c + i)), dir: "h" }); c = e; } }
      for (let c = 0; c < n; c++) { let r = 0; while (r < n) { const k = kk(r, c); let e = r + 1; if (k >= 0) while (e < n && kk(e, c) === k) e++; if (k >= 0 && e - r >= 3) runs.push({ cells: Array.from({ length: e - r }, (_, i) => kx(r + i, c)), dir: "v" }); r = e; } }
      const cnt = new Map<number, number>(); runs.forEach((ru) => ru.cells.forEach((q) => { rem.add(q); cnt.set(q, (cnt.get(q) || 0) + 1); }));
      const pivot = (ru: { cells: number[] }) => { for (const [r, c] of piv) if (ru.cells.includes(kx(r, c))) return kx(r, c); return ru.cells[Math.floor(ru.cells.length / 2)]; };
      runs.forEach((ru) => { if (ru.cells.length >= 5) made.set(pivot(ru), "r"); else if (ru.cells.length === 4 && !made.has(pivot(ru))) made.set(pivot(ru), ru.dir === "h" ? "v" : "h"); });
      cnt.forEach((v, q) => { if (v >= 2 && !made.has(q)) made.set(q, "b"); });
      return { rem, made };
    };
    const expand = (rem: Set<number>) => {
      const q = [...rem]; const add = (r: number, c: number) => { if (r < 0 || c < 0 || r >= n || c >= n) return; const z = kx(r, c); if (!rem.has(z)) { rem.add(z); q.push(z); } };
      while (q.length) {
        const z = q.pop()!; const r = Math.floor(z / 100), c = z % 100; const gm = B.g[r][c]; if (!gm) continue;
        if (gm.sp === "h") for (let i = 0; i < n; i++) add(r, i);
        else if (gm.sp === "v") for (let i = 0; i < n; i++) add(i, c);
        else if (gm.sp === "b") { for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) if (Math.abs(dr) + Math.abs(dc) <= 2) add(r + dr, c + dc); }
        else if (gm.sp === "r") { const cnt = Array(6).fill(0); B.g.forEach((row) => row.forEach((o) => { if (o && o.sp !== "r") cnt[o.k]++; })); const best = cnt.indexOf(Math.max(...cnt)); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (B.g[i][j]?.k === best && B.g[i][j]!.sp !== "r") add(i, j); }
      }
    };
    const goalMet = () => (spec.goal.k === "score" ? B.score >= spec.goal.n : B.got >= spec.goal.n);
    const cascade = async (forced: Set<number> | null, piv: [number, number][]) => {
      let combo = 0;
      for (;;) {
        let rem: Set<number>; let made = new Map<number, Sp>();
        if (forced) { rem = forced; forced = null; } else { const m = findMatches(piv); if (!m.rem.size) break; rem = m.rem; made = m.made; piv = []; }
        combo++; B.combo = combo; expand(rem); made.forEach((_, z) => { if (!rem.has(z)) rem.delete(z); });
        let pts = 0, cx = 0, cy = 0, cc = 0;
        rem.forEach((z) => { const r = Math.floor(z / 100), c = z % 100; const gm = B.g[r][c]; if (!gm) return; cx += c; cy += r; cc++; if (B.ice[r][c]) { B.ice[r][c] = false; if (spec.goal.k === "ice") B.got++; } if (spec.goal.k === "collect" && gm.sp !== "r" && gm.k === spec.goal.c) B.got++; });
        const kept = new Set<number>(made.keys()); const size = rem.size; pts = (size * 10 + Math.min(5, Math.max(0, size - 3)) * 15) * Math.min(combo, 5); B.score += pts;
        rem.forEach((z) => { const r = Math.floor(z / 100), c = z % 100; const gm = B.g[r][c]; if (!gm) return; if (kept.has(z)) { gm.sp = made.get(z)!; gm.pop = 1; return; } gm.dy = 0.001; for (let i = 0; i < 5; i++) B.parts.push({ x: c + 0.5, y: r + 0.5, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.7) * 6, l: 1, c: gm.sp === "r" ? COL[i] : COL[gm.k], s: 0.06 + Math.random() * 0.06 }); });
        B.txt.push({ x: cc ? cx / cc + 0.5 : 3, y: cc ? cy / cc + 0.5 : 3, s: (combo > 1 ? "×" + combo + "  " : "") + "+" + pts, l: 1 });
        tone(note(combo - 1 + (size > 3 ? 1 : 0)), 0.22, "triangle", 0.13); if (made.size) tone(note(combo + 4), 0.3, "sine", 0.1); if (size > 5 || combo > 2) buzz(combo > 2 ? [15, 20, 25] : 12);
        if (combo >= 3) B.shake = Math.min(1, 0.25 * combo); sync(); await sleep(240);
        rem.forEach((z) => { const r = Math.floor(z / 100), c = z % 100; const gm = B.g[r][c]; if (gm && gm.dy > 0) B.g[r][c] = null; });
        for (let c = 0; c < n; c++) { let w = n - 1; for (let r = n - 1; r >= 0; r--) { const gm = B.g[r][c]; if (gm) { if (r !== w) { B.g[w][c] = gm; B.g[r][c] = null; gm.f = true; } w--; } } for (let r = w; r >= 0; r--) B.g[r][c] = mk(rk(), r, c, w - r + 1); }
        await settle();
      }
      B.combo = 0;
    };
    const finish = () => {
      if (B.over) return; const s = sv(); const chal = opp >= 0;
      if (chal) {
        B.over = "end"; const win = B.score >= oppSc; B.gain = win ? 25 : 5; commit({ coins: s.coins + B.gain }); if (win) actions.addScore(1);
      } else if (goalMet()) {
        B.over = "win"; const ratio = B.moves / spec.moves; B.stars = ratio >= 0.4 ? 3 : ratio >= 0.15 ? 2 : 1; B.gain = 10 + B.stars * 5; const sk = spec.mode + "-" + spec.level; const prog = [...s.prog]; prog[spec.mode] = Math.max(prog[spec.mode], Math.min(MAXLV, spec.level + 1));
        commit({ coins: s.coins + B.gain, prog, stars: { ...s.stars, [sk]: Math.max(s.stars[sk] || 0, B.stars) }, best: Math.max(s.best, spec.level), total: s.total + B.score }); actions.addScore(B.stars);
        [0, 4, 7, 12].forEach((st, i) => setTimeout(() => tone(392 * Math.pow(2, st / 12), 0.35, "triangle", 0.13), i * 100)); buzz([20, 40, 60]);
        for (let i = 0; i < 40; i++) B.parts.push({ x: Math.random() * n, y: n * 0.9, vx: (Math.random() - 0.5) * 5, vy: -4 - Math.random() * 6, l: 1.4, c: COL[i % 6], s: 0.08 });
      } else { B.over = "lose"; const lives = Math.max(0, s.lives - 1); commit({ lives, lifeTs: s.lives >= 5 ? Date.now() : s.lifeTs }); tone(220, 0.5, "sawtooth", 0.08, -90); buzz(80); }
      sync();
    };
    const after = async () => {
      if (!hasMove() && !B.over) { B.msg = t("Plus de coups possibles : mélange automatique"); sync(); await reshuffle(); B.msg = ""; }
      if (opp >= 0) { if (B.moves <= 0) finish(); } else if (goalMet()) finish(); else if (B.moves <= 0) finish();
      B.busy = false; sync();
    };
    const swapCells = async (a: [number, number], b: [number, number]) => {
      if (B.busy || B.over) return; B.busy = true; B.sel = null; const ga = B.g[a[0]][a[1]], gb = B.g[b[0]][b[1]]; if (!ga || !gb) { B.busy = false; return; }
      swapRaw(a, b); ga.f = false; gb.f = false; tone(520, 0.07, "sine", 0.08); await sleep(170);
      let forced: Set<number> | null = null;
      if (ga.sp === "r" || gb.sp === "r") {
        forced = new Set([kx(b[0], b[1]), kx(a[0], a[1])]);
        const target = ga.sp === "r" && gb.sp === "r" ? -1 : ga.sp === "r" ? gb.k : ga.k;
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { const q = B.g[r][c]; if (q && (target === -1 || (q.k === target && q.sp !== "r"))) forced.add(kx(r, c)); }
      } else if (ga.sp || gb.sp) { forced = new Set(); if (ga.sp) forced.add(kx(b[0], b[1])); if (gb.sp) forced.add(kx(a[0], a[1])); }
      if (!forced) { const m = findMatches([a, b]); if (!m.rem.size) { swapRaw(a, b); ga.f = false; gb.f = false; tone(180, 0.15, "square", 0.05); await sleep(170); B.busy = false; return; } }
      B.moves--; sync(); await cascade(forced, [a, b]); await after();
    };
    const useHammer = async (r: number, c: number) => {
      if (!B.g[r][c] || B.busy || B.over) return; if (!pay("hammer")) { B.hammer = false; sync(); return; }
      B.hammer = false; B.msg = ""; B.busy = true; tone(140, 0.2, "square", 0.1, -60); buzz(30); B.shake = 0.5; await cascade(new Set([kx(r, c)]), []); await after();
    };
    const pay = (k: "hammer" | "shuffle" | "extra") => { const s = sv(); if (s[k] > 0) { commit({ [k]: s[k] - 1 } as Partial<Save>); return true; } if (s.coins >= COST[k]) { commit({ coins: s.coins - COST[k] }); return true; } flash(t("Pas assez de pièces")); return false; };
    api.current = {
      run: async (k) => {
        if (k === "hammer") { if (B.busy || B.over) return; B.hammer = !B.hammer; B.msg = B.hammer ? t("Touche une gemme pour la casser") : ""; sync(); return; }
        if (k === "extra") { if (B.busy || (B.over && B.over !== "lose")) return; if (!pay("extra")) return; if (B.over === "lose") { B.over = ""; const s = sv(); commit({ lives: Math.min(5, s.lives + 1) }); } B.moves += 5; tone(660, 0.2, "triangle", 0.1); sync(); return; }
        if (B.busy || B.over) return; if (!pay("shuffle")) return; B.busy = true; await reshuffle(); B.busy = false; sync();
      },
    };
    /* dessin */
    const size = () => { const w = box.current?.clientWidth || 300; W = w; const d = Math.min(2, window.devicePixelRatio || 1); canvas.width = Math.round(w * d); canvas.height = Math.round(w * d); canvas.style.height = w + "px"; x.setTransform(d, 0, 0, d, 0, 0); };
    size(); const ro = new ResizeObserver(size); if (box.current) ro.observe(box.current);
    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; const cell = W / n;
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const q = B.g[r][c]; if (!q) continue; q.x += (c - q.x) * Math.min(1, dt * 18);
        if (q.f && q.y < r - 0.001) { q.vy += 60 * dt; q.y = Math.min(r, q.y + q.vy * dt); if (q.y >= r) { q.vy = 0; q.f = false; } } else { q.y += (r - q.y) * Math.min(1, dt * 18); q.vy = 0; }
        if (q.dy > 0) q.dy = Math.min(1, q.dy + dt * 5); if (q.pop > 0) q.pop = Math.max(0, q.pop - dt * 3);
      }
      x.clearRect(0, 0, W, W); x.save(); if (B.shake > 0) { B.shake = Math.max(0, B.shake - dt * 2.5); x.translate((Math.random() - 0.5) * B.shake * 8, (Math.random() - 0.5) * B.shake * 8); }
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        x.fillStyle = (r + c) % 2 ? "rgba(255,255,255,.05)" : "rgba(255,255,255,.09)"; x.beginPath(); x.roundRect ? x.roundRect(c * cell + 1.5, r * cell + 1.5, cell - 3, cell - 3, cell * 0.2) : x.rect(c * cell + 1.5, r * cell + 1.5, cell - 3, cell - 3); x.fill();
        if (B.ice[r][c]) { x.fillStyle = "rgba(201,184,255,.42)"; x.strokeStyle = "rgba(255,255,255,.85)"; x.lineWidth = 2; x.beginPath(); x.roundRect ? x.roundRect(c * cell + 2.5, r * cell + 2.5, cell - 5, cell - 5, cell * 0.2) : x.rect(c * cell + 2.5, r * cell + 2.5, cell - 5, cell - 5); x.fill(); x.stroke(); x.strokeStyle = "rgba(255,255,255,.5)"; x.beginPath(); x.moveTo(c * cell + cell * 0.2, r * cell + cell * 0.32); x.lineTo(c * cell + cell * 0.45, r * cell + cell * 0.18); x.stroke(); }
      }
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const q = B.g[r][c]; if (!q) continue; const sc = (q.dy > 0 ? 1 - q.dy : 1) * (1 + q.pop * 0.35); const R = cell * 0.36 * sc; const cx = (q.x + 0.5) * cell, cy = (q.y + 0.5) * cell;
        if (q.sp) { x.fillStyle = "rgba(255,255,255,.18)"; x.beginPath(); x.arc(cx, cy, cell * 0.46 * (1 + Math.sin(now / 250) * 0.04), 0, TAU); x.fill(); }
        drawGem(x, q.k, q.sp, cx, cy, R, q.dy > 0 ? 1 - q.dy : 1);
      }
      if (B.sel) { x.strokeStyle = "#fff"; x.lineWidth = 3; x.beginPath(); x.roundRect ? x.roundRect(B.sel[1] * cell + 2, B.sel[0] * cell + 2, cell - 4, cell - 4, cell * 0.22) : x.rect(B.sel[1] * cell + 2, B.sel[0] * cell + 2, cell - 4, cell - 4); x.stroke(); }
      if (document.activeElement === canvas) { x.strokeStyle = "#2FCDBE"; x.setLineDash([5, 4]); x.lineWidth = 2; x.strokeRect(B.cur[1] * cell + 3, B.cur[0] * cell + 3, cell - 6, cell - 6); x.setLineDash([]); }
      B.parts = B.parts.filter((p) => p.l > 0); for (const p of B.parts) { p.l -= dt * 1.6; p.vy += 12 * dt; p.x += p.vx * dt; p.y += p.vy * dt; x.globalAlpha = Math.max(0, p.l); x.fillStyle = p.c; x.beginPath(); x.arc(p.x * cell, p.y * cell, p.s * cell, 0, TAU); x.fill(); } x.globalAlpha = 1;
      B.txt = B.txt.filter((p) => p.l > 0); for (const p of B.txt) { p.l -= dt * 0.9; p.y -= dt * 0.7; x.globalAlpha = Math.min(1, p.l * 2); x.font = `800 ${cell * 0.34}px system-ui,sans-serif`; x.textAlign = "center"; x.lineWidth = 4; x.strokeStyle = "rgba(21,12,58,.8)"; x.strokeText(p.s, p.x * cell, p.y * cell); x.fillStyle = "#fff"; x.fillText(p.s, p.x * cell, p.y * cell); } x.globalAlpha = 1;
      x.restore(); raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    /* gestes */
    let down: { r: number; c: number; px: number; py: number } | null = null;
    const cellOf = (e: PointerEvent) => { const rc = canvas.getBoundingClientRect(); const cell = rc.width / n; return { r: Math.min(n - 1, Math.max(0, Math.floor((e.clientY - rc.top) / cell))), c: Math.min(n - 1, Math.max(0, Math.floor((e.clientX - rc.left) / cell))), cell }; };
    const pd = (e: PointerEvent) => {
      e.preventDefault(); if (B.busy || B.over) return; const { r, c } = cellOf(e); B.cur = [r, c];
      if (B.hammer) { void useHammer(r, c); return; }
      if (B.sel && Math.abs(B.sel[0] - r) + Math.abs(B.sel[1] - c) === 1) { const a = B.sel; down = null; void swapCells(a, [r, c]); return; }
      B.sel = [r, c]; down = { r, c, px: e.clientX, py: e.clientY };
    };
    const pm = (e: PointerEvent) => {
      if (!down || B.busy || B.over) return; const { cell } = cellOf(e); const dx = e.clientX - down.px, dy = e.clientY - down.py; if (Math.max(Math.abs(dx), Math.abs(dy)) < cell * 0.4) return;
      const t0: [number, number] = [down.r, down.c]; const t1: [number, number] = Math.abs(dx) > Math.abs(dy) ? [down.r, down.c + Math.sign(dx)] : [down.r + Math.sign(dy), down.c]; down = null;
      if (t1[0] >= 0 && t1[1] >= 0 && t1[0] < n && t1[1] < n) void swapCells(t0, t1);
    };
    const pu = () => { down = null; };
    const kd = (e: KeyboardEvent) => {
      const d: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (B.busy || B.over) return; if (B.hammer) { void useHammer(B.cur[0], B.cur[1]); return; } B.sel = B.sel ? null : [B.cur[0], B.cur[1]]; return; }
      const m = d[e.key]; if (!m) return; e.preventDefault(); if (B.busy || B.over) return; const nr = B.cur[0] + m[0], nc = B.cur[1] + m[1]; if (nr < 0 || nc < 0 || nr >= n || nc >= n) return;
      if (B.sel) { const a = B.sel; B.cur = [nr, nc]; void swapCells(a, [nr, nc]); } else B.cur = [nr, nc];
    };
    canvas.addEventListener("pointerdown", pd); canvas.addEventListener("pointermove", pm); window.addEventListener("pointerup", pu); canvas.addEventListener("keydown", kd);
    sync();
    return () => { dead = true; cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener("pointerdown", pd); canvas.removeEventListener("pointermove", pm); window.removeEventListener("pointerup", pu); canvas.removeEventListener("keydown", kd); try { au?.close(); } catch { /* rien */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = sv(); const g = spec.goal; const pct = Math.min(100, ((g.k === "score" ? ui.score : ui.got) / g.n) * 100);
  const goalTxt = g.k === "score" ? t("Atteins {n} points", { n: g.n }) : g.k === "collect" ? t("Ramasse {n} gemmes", { n: g.n }) : t("Casse {n} blocs de glace", { n: g.n });
  const jb = (k: "hammer" | "shuffle" | "extra", label: string) => <button type="button" className="btn ghost" aria-pressed={k === "hammer" ? ui.hammer : undefined} aria-label={label + (s[k] > 0 ? " : " + s[k] : " : " + t("Acheter pour {n} pièces", { n: COST[k] }))} onClick={() => api.current?.run(k)} style={{ flexDirection: "column", gap: 2, padding: "8px 6px", minWidth: 72, position: "relative", ...(ui.hammer && k === "hammer" ? { outline: "2px solid var(--brand2)" } : {}) }}>
    <Ic n={k} /><small style={{ fontWeight: 700 }}>{label}</small>{s[k] > 0 ? <span style={{ position: "absolute", top: -6, right: -4, background: "var(--brand)", color: "var(--on)", borderRadius: 99, minWidth: 22, height: 22, display: "grid", placeItems: "center", fontSize: ".75rem", fontWeight: 800 }}>{s[k]}</span> : <span style={{ display: "inline-flex", gap: 3, alignItems: "center", fontSize: ".75rem" }}><Coin s={12} />{COST[k]}</span>}</button>;
  return (
    <div className="card col" style={{ alignItems: "center", gap: 10, background: "linear-gradient(160deg,#2A1F5C,#150F33)", color: "#fff" }}>
      <div className="row" style={{ width: "100%", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <button type="button" className="btn ghost sm" onClick={onBack} aria-label={t("Retour")} style={{ minWidth: 44 }}><Ic n="back" s={18} /></button>
        <div style={{ textAlign: "center", flex: 1, minWidth: 0 }}><b>{t("Niveau {n}", { n: spec.level })}</b><div style={{ fontSize: ".78rem", opacity: .8 }}>{[t("Facile"), t("Normal"), t("Difficile")][spec.mode]}{chall ? " · " + t("Défi contre {name}", { name: OPP[opp][0] }) : ""}</div></div>
        <button type="button" className="btn ghost sm" aria-label={s.sound ? t("Son activé") : t("Son coupé")} onClick={() => commit({ sound: !s.sound })} style={{ minWidth: 44 }}><Ic n={s.sound ? "sound" : "mute"} s={18} /></button>
      </div>
      <div className="row" style={{ width: "100%", justifyContent: "space-between", alignItems: "center", gap: 8, fontWeight: 700 }}>
        <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>{g.k === "collect" && <Gm k={g.c} />}{chall ? OPP[opp][0] + " : " + oppSc : goalTxt}</span>
        <span role="status" aria-live="polite" style={{ color: "#8BE3F0", minWidth: 70, textAlign: "center" }}>{ui.combo > 1 ? t("Combo ×{n}", { n: ui.combo }) : ""}</span>
        <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><span style={{ display: "inline-flex", gap: 3, alignItems: "center" }} role="img" aria-label={t("Vies : {n}", { n: s.lives })}><Life />{s.lives}</span></span>
      </div>
      {!chall && <div aria-hidden="true" style={{ width: "100%", height: 8, borderRadius: 99, background: "rgba(255,255,255,.14)", overflow: "hidden" }}><div style={{ width: pct + "%", height: "100%", background: "linear-gradient(90deg,#2FCDBE,#9B87F5,#E5679C)", transition: "width .3s" }} /></div>}
      <div className="row" style={{ width: "100%", justifyContent: "space-between", fontWeight: 800 }}><span role="status" aria-live="polite">{t("Coups : {n}", { n: ui.moves })}</span><span>{t("Score : {n}", { n: ui.score })}</span></div>
      <div ref={box} style={{ position: "relative", width: "min(100%, 440px)", aspectRatio: "1 / 1", borderRadius: 20, overflow: "hidden", touchAction: "none", userSelect: "none", background: "rgba(0,0,0,.25)" }}>
        <canvas ref={cv} tabIndex={0} role="application" aria-label={t("Zone de jeu : glisse une gemme pour la déplacer")} style={{ display: "block", width: "100%", touchAction: "none" }} />
        {ui.msg && !ui.over && <div role="status" style={{ position: "absolute", left: 10, right: 10, top: 10, textAlign: "center", background: "rgba(21,12,58,.85)", borderRadius: 14, padding: "8px 10px", fontWeight: 700, pointerEvents: "none" }}>{ui.msg}</div>}
        {ui.over && <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, background: "rgba(18,12,46,.82)", textAlign: "center", padding: 16 }} role="dialog" aria-live="assertive">
          {ui.over === "win" && <><b style={{ fontSize: "1.3rem" }}>{t("Niveau {n} réussi !", { n: spec.level })}</b><Stars n={ui.stars} s={34} /><span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><Coin />{t("+{n} pièces", { n: ui.gain })}</span>
            <div className="row" style={{ gap: 8, flexWrap: "wrap", justifyContent: "center" }}><button type="button" className="btn" onClick={() => onNext(spec.level + 1)} disabled={spec.level >= MAXLV}>{t("Niveau suivant")}</button><button type="button" className="btn ghost" onClick={onBack}>{t("Carte des niveaux")}</button></div></>}
          {ui.over === "lose" && <><b style={{ fontSize: "1.2rem" }}>{t("Raté ! Il n'y a plus de coups.")}</b><div className="row" style={{ gap: 8, flexWrap: "wrap", justifyContent: "center" }}><button type="button" className="btn" onClick={() => api.current?.run("extra")}>{t("+5 coups")}</button><button type="button" className="btn ghost" onClick={onRetry}>{t("Rejouer")}</button></div></>}
          {ui.over === "end" && <><b style={{ fontSize: "1.2rem" }}>{ui.score >= oppSc ? t("Tu as gagné contre {name} ! {a} à {b}", { name: OPP[opp][0], a: ui.score, b: oppSc }) : t("Tu as perdu contre {name}. {a} à {b}", { name: OPP[opp][0], a: ui.score, b: oppSc })}</b><span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><Coin />{t("+{n} pièces", { n: ui.gain })}</span><div className="row" style={{ gap: 8, flexWrap: "wrap", justifyContent: "center" }}><button type="button" className="btn" onClick={onRetry}>{t("Rejouer")}</button><button type="button" className="btn ghost" onClick={onBack}>{t("Retour")}</button></div></>}
        </div>}
      </div>
      <div className="row" style={{ gap: 8, justifyContent: "center", flexWrap: "wrap" }}>{jb("hammer", t("Marteau"))}{jb("shuffle", t("Mélange"))}{jb("extra", t("+5 coups"))}</div>
    </div>
  );
}

/* ---------------------------------------------------------------- écrans autour du jeu */
export function Prisme() {
  const me = useStore((s) => s.users.find((u) => u.id === s.me)?.name || "");
  const S = useRef<Save>(load(me)); regen(S.current); const [, force] = useState(0); const re = () => force((v) => v + 1);
  const commit = (p: Partial<Save>) => { Object.assign(S.current, p); try { localStorage.setItem(KEY, JSON.stringify(S.current)); } catch { /* rien */ } re(); };
  const sv = () => S.current;
  const [view, setView] = useState<"home" | "map" | "play" | "rank">("home"); const [lvl, setLvl] = useState(1); const [opp, setOpp] = useState(-1); const [att, setAtt] = useState(0);
  const [page, setPage] = useState(0); const [name, setName] = useState(S.current.name); const [tab, setTab] = useState<"lv" | "sc">("lv"); const [gift, setGift] = useState(false); const [jump, setJump] = useState(""); const [note, setNote] = useState("");
  useEffect(() => { const i = setInterval(() => { regen(S.current); re(); }, 20000); return () => clearInterval(i); }, []);
  useEffect(() => { if (S.current.lastDaily !== today()) setGift(true); }, []);
  const s = S.current; const mode = s.mode; const cur = s.prog[mode];
  const start = (n: number, o = -1) => { regen(s); if (o < 0 && s.lives <= 0) { setNote(t("Plus de vies. Prochaine vie dans {m} min", { m: Math.max(1, Math.ceil((LIFE_MS - (Date.now() - s.lifeTs)) / 60000)) })); setView("home"); return; } setNote(""); setLvl(Math.max(1, Math.min(MAXLV, n))); setOpp(o); setAtt((a) => a + 1); setView("play"); };
  const claim = () => {
    const t0 = today(); const streak = s.lastDaily && dayDiff(s.lastDaily, t0) === 1 ? s.streak + 1 : 1; const rw = DAYS[(streak - 1) % 7];
    commit({ lastDaily: t0, streak, coins: s.coins + (rw.coins || 0), hammer: s.hammer + (rw.hammer || 0), shuffle: s.shuffle + (rw.shuffle || 0), extra: s.extra + (rw.extra || 0), lives: Math.min(9, s.lives + (rw.lives || 0)) });
  };
  const rewardLines = (rw: (typeof DAYS)[0]) => [rw.coins ? t("+{n} pièces", { n: rw.coins }) : "", rw.hammer ? t("+1 marteau") : "", rw.shuffle ? t("+1 mélange") : "", rw.extra ? t("+1 coups bonus") : "", rw.lives ? t("Vies : +{n}", { n: rw.lives }) : ""].filter(Boolean);
  const claimed = s.lastDaily === today(); const dIdx = claimed ? (s.streak - 1) % 7 : (s.lastDaily && dayDiff(s.lastDaily, today()) === 1 ? s.streak % 7 : 0);
  const modes = [t("Facile"), t("Normal"), t("Difficile")];

  const head = <div className="row" style={{ gap: 10, alignItems: "center", flexWrap: "wrap" }}>
    {view !== "home" && <button type="button" className="btn ghost sm" aria-label={t("Retour")} style={{ minWidth: 44 }} onClick={() => setView("home")}><Ic n="back" s={18} /></button>}
    <span style={{ display: "inline-flex", gap: 5, alignItems: "center", fontWeight: 800 }} role="img" aria-label={t("Pièces : {n}", { n: s.coins })}><Coin s={18} />{s.coins}</span>
    <span style={{ display: "inline-flex", gap: 5, alignItems: "center", fontWeight: 800 }} role="img" aria-label={t("Vies : {n}", { n: s.lives })}><Life s={18} />{s.lives}</span>
    <span className="grow" /><span className="muted small">{s.name || me}</span></div>;

  if (view === "play") return <Play key={att} sv={sv} commit={commit} spec={levelSpec(lvl, mode)} opp={opp} onBack={() => setView(opp >= 0 ? "rank" : "map")} onNext={(n) => start(n)} onRetry={() => start(lvl, opp)} />;

  if (view === "map") {
    const a = page * 50 + 1, b = Math.min(MAXLV, a + 49);
    const goto = () => { const n = Math.max(1, Math.min(MAXLV, parseInt(jump, 10) || 1)); setPage(Math.floor((n - 1) / 50)); start(n); };
    return <div className="col" style={{ gap: 12 }}>{head}<h2 style={{ margin: 0 }}>{t("Carte des niveaux")}</h2>
      <div className="row" style={{ gap: 6 }}>{modes.map((m, i) => <button key={i} type="button" className="chip" aria-pressed={mode === i} style={mode === i ? { background: "var(--brand)", color: "var(--on)" } : undefined} onClick={() => { commit({ mode: i }); setPage(Math.floor((s.prog[i] - 1) / 50)); }}>{m}</button>)}</div>
      <div className="row" style={{ gap: 8, alignItems: "center" }}>
        <button type="button" className="btn ghost sm" aria-label={t("Page précédente")} disabled={page === 0} onClick={() => setPage(page - 1)}>‹</button>
        <b className="grow" style={{ textAlign: "center" }}>{t("Niveaux {a} à {b}", { a, b })}</b>
        <button type="button" className="btn ghost sm" aria-label={t("Page suivante")} disabled={b >= MAXLV} onClick={() => setPage(page + 1)}>›</button></div>
      <div className="row" style={{ gap: 8 }}><input className="inp" inputMode="numeric" value={jump} onChange={(e) => setJump(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder={"1 – " + MAXLV} aria-label={t("Aller au niveau")} /><button type="button" className="btn" onClick={goto}>{t("Aller au niveau")}</button></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>{Array.from({ length: b - a + 1 }, (_, i) => a + i).map((n) => {
        const st = s.stars[mode + "-" + n] || 0; const here = OPP.map((_, j) => j).filter((j) => oppLevel(j) === n); const isCur = n === cur;
        return <button key={n} type="button" className="gcard" aria-label={t("Niveau {n}", { n }) + (here.length ? " · " + here.map((j) => t("{name} est ici", { name: OPP[j][0] })).join(", ") : "")} onClick={() => start(n)} style={{ minHeight: 64, padding: "6px 2px", gap: 2, ...(isCur ? { outline: "2px solid var(--brand2)" } : {}) }}>
          <b>{n}</b><Stars n={st} s={11} /><span style={{ display: "flex", gap: 2, height: 14 }}>{here.map((j) => <Av key={j} i={j} s={14} />)}</span></button>; })}</div>
</div>;
  }

  if (view === "rank") {
    const reached = Math.max(...s.prog);
    const rows = [{ i: -1, name: s.name || me, lv: reached, sc: s.total }, ...OPP.map((o, i) => ({ i, name: o[0], lv: oppLevel(i), sc: oppLevel(i) * Math.round(900 + o[1] * 600) }))].sort((p, q) => (tab === "lv" ? q.lv - p.lv || q.sc - p.sc : q.sc - p.sc));
    return <div className="col" style={{ gap: 12 }}>{head}<h2 style={{ margin: 0 }}>{t("Classement")}</h2>
      <div className="row" style={{ gap: 6 }}><button type="button" className="chip" aria-pressed={tab === "lv"} style={tab === "lv" ? { background: "var(--brand)", color: "var(--on)" } : undefined} onClick={() => setTab("lv")}>{t("Par niveau")}</button><button type="button" className="chip" aria-pressed={tab === "sc"} style={tab === "sc" ? { background: "var(--brand)", color: "var(--on)" } : undefined} onClick={() => setTab("sc")}>{t("Par score")}</button></div>
      <div className="col" style={{ gap: 8 }}>{rows.map((r, k) => <div key={r.i} className="card row" style={{ gap: 10, alignItems: "center", padding: 10, ...(r.i < 0 ? { outline: "2px solid var(--brand2)" } : {}) }}>
        <b style={{ width: 24, textAlign: "center" }}>{k + 1}</b><Av i={Math.max(0, r.i)} me={r.i < 0} />
        <div className="grow" style={{ minWidth: 0 }}><b>{r.i < 0 ? r.name + " · " + t("Toi") : r.name}</b><div className="muted small">{t("Niveau {n}", { n: r.lv })} · {t("Score : {n}", { n: r.sc })}</div></div>
        {r.i >= 0 && <button type="button" className="btn ghost sm" aria-label={t("Défier") + " " + r.name} onClick={() => start(cur, r.i)}>{t("Défier")}</button>}</div>)}</div>
      <div className="muted small" style={{ textAlign: "center" }}>{t("Joueurs de démonstration : ils jouent sur ton téléphone, sans serveur.")}</div></div>;
  }

  return <div className="col" style={{ gap: 12 }}>{head}
    <div className="card col" style={{ gap: 8 }}><label className="small muted" htmlFor="pz-name">{t("Ton pseudo")}</label>
      <div className="row" style={{ gap: 8 }}><input id="pz-name" className="inp" maxLength={16} value={name} onChange={(e) => setName(e.target.value)} /><button type="button" className="btn" onClick={() => { const v = name.trim().slice(0, 16); if (v) { commit({ name: v }); setNote(t("Pseudo enregistré.")); } }}>{t("Enregistrer le pseudo")}</button></div></div>
    <div className="row" style={{ gap: 6 }}>{modes.map((m, i) => <button key={i} type="button" className="chip" aria-pressed={mode === i} style={mode === i ? { background: "var(--brand)", color: "var(--on)" } : undefined} onClick={() => commit({ mode: i })}>{m}</button>)}</div>
    <button type="button" className="btn" style={{ minHeight: 56, fontSize: "1.1rem" }} onClick={() => start(cur)}>{t("Jouer le niveau {n}", { n: cur })}</button>
    {note && <div role="status" className="muted small" style={{ textAlign: "center" }}>{note}</div>}
    {s.lives <= 0 && <button type="button" className="btn ghost" onClick={() => { if (s.coins >= 60) { commit({ coins: s.coins - 60, lives: 1 }); setNote(""); } else setNote(t("Pas assez de pièces")); }}><Life />{t("Acheter pour {n} pièces", { n: 60 })}</button>}
    <div className="row" style={{ gap: 8, flexWrap: "wrap" }}><button type="button" className="btn ghost grow" onClick={() => { setPage(Math.floor((cur - 1) / 50)); setView("map"); }}>{t("Carte des niveaux")}</button><button type="button" className="btn ghost grow" onClick={() => setView("rank")}>{t("Classement")}</button><button type="button" className="btn ghost grow" onClick={() => setGift(true)}>{t("Cadeau du jour")}</button></div>
    {gift && <div role="dialog" aria-label={t("Cadeau du jour")} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(10,6,28,.7)", display: "grid", placeItems: "center", padding: 16 }}><div className="card col" style={{ maxWidth: 360, width: "100%", gap: 12, alignItems: "center", textAlign: "center" }}>
      <b style={{ fontSize: "1.2rem" }}>{t("Cadeau du jour")}</b><span className="muted small">{t("Jour {n} de connexion", { n: (claimed ? s.streak : (s.lastDaily && dayDiff(s.lastDaily, today()) === 1 ? s.streak + 1 : 1)) })}</span>
      <div style={{ display: "flex", gap: 6 }}>{DAYS.map((_, i) => <span key={i} aria-hidden="true" style={{ width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center", fontWeight: 800, fontSize: ".8rem", background: i < dIdx || (claimed && i === dIdx) ? "var(--brand)" : "var(--card2)", color: i < dIdx || (claimed && i === dIdx) ? "var(--on)" : "var(--fg)", outline: i === dIdx ? "2px solid var(--brand2)" : "none" }}>{i + 1}</span>)}</div>
      <div className="col" style={{ gap: 2, fontWeight: 700 }}>{rewardLines(DAYS[dIdx]).map((l) => <span key={l}>{l}</span>)}</div>
      {claimed ? <span className="muted small">{t("Reviens demain pour un nouveau cadeau !")}</span> : <button type="button" className="btn" onClick={claim}>{t("Récupérer")}</button>}
      <button type="button" className="btn ghost" onClick={() => setGift(false)}>{t("Fermer")}</button></div></div>}
    <div className="card row" style={{ gap: 12, justifyContent: "space-around", flexWrap: "wrap" }}>{(["hammer", "shuffle", "extra"] as const).map((k) => <span key={k} style={{ display: "inline-flex", gap: 6, alignItems: "center", fontWeight: 700 }}><Ic n={k} />{s[k]}</span>)}</div>
    <div className="muted small" style={{ textAlign: "center" }}>{t("Aligne 3 gemmes ou plus. Glisse une gemme pour l'échanger avec sa voisine.")}</div>
  </div>;
}
