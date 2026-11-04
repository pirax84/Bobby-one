import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

/** Effets « éphémères » : la photo se fissure puis tombe en morceaux ; le texte et le son s'effacent de gauche à droite. */
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (seed: number) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const clamp = (x: number) => Math.max(0, Math.min(1, x));

/** Avancement de l'effet : 0 pendant la phase « claire », puis monte jusqu'à 1 à la fin. */
export function useEffectK(start: number, total: number, clear: number) {
  const calc = () => clamp((Date.now() - start - clear) / Math.max(1, total - clear));
  const [k, setK] = useState(calc);
  useEffect(() => { let raf = 0; const f = () => { const v = calc(); setK(v); if (v < 1) raf = requestAnimationFrame(f); }; f(); return () => cancelAnimationFrame(raf); }, [start, total, clear]);
  return k;
}

type Pt = [number, number];
interface Geo { tiles: { poly: Pt[]; cx: number; cy: number; tf: number; dx: number; rot: number }[]; segs: { a: Pt; b: Pt; d: number; w: number }[]; imp: Pt; maxd: number }
function makeGeo(id: string, W: number, H: number): Geo {
  const r = rng(hash(id)); const N = 15; const RR = [0, 22, 55, 100, 165, 255, 390, 600].map((x) => x * Math.max(W, H) / 440);
  const imp: Pt = [W * (.35 + r() * .3), H * (.35 + r() * .3)];
  const ang = Array.from({ length: N }, (_, i) => i * 2 * Math.PI / N + (r() - .5) * .35);
  const P: Pt[][] = RR.map((rad, k) => ang.map((a) => { const rr = k === 0 ? 0 : rad * (1 + (r() - .5) * .35); return [imp[0] + rr * Math.cos(a), imp[1] + rr * Math.sin(a)] as Pt; }));
  const tiles: Geo["tiles"] = []; const segs: Geo["segs"] = [];
  const add = (poly: Pt[]) => { const cx = poly.reduce((u, p) => u + p[0], 0) / poly.length, cy = poly.reduce((u, p) => u + p[1], 0) / poly.length; tiles.push({ poly, cx, cy, tf: .4 + r() * .5, dx: (r() - .5) * 50, rot: (r() - .5) * 120 }); };
  for (let k = 0; k < RR.length - 1; k++) for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    if (k === 0) add([P[0][i], P[1][i], P[1][j]]);
    else { const q = [P[k][i], P[k][j], P[k + 1][j], P[k + 1][i]]; const x = r(); if (x < .35) { add([q[0], q[1], q[2]]); add([q[0], q[2], q[3]]); } else if (x < .55) { add([q[0], q[1], q[3]]); add([q[1], q[2], q[3]]); } else add(q); }
  }
  const sg = (a: Pt, b: Pt) => { const d = Math.hypot((a[0] + b[0]) / 2 - imp[0], (a[1] + b[1]) / 2 - imp[1]); segs.push({ a, b, d, w: d < 120 ? 2.2 : 1.3 }); };
  for (let k = 0; k < RR.length - 1; k++) for (let i = 0; i < N; i++) { sg(P[k][i], P[k + 1][i]); if (k > 0 && r() < .8) sg(P[k][i], P[k][(i + 1) % N]); }
  const maxd = Math.max(...segs.map((s) => s.d), 1);
  return { tiles, segs, imp, maxd };
}

function Crack({ id, src, k, children }: { id: string; src: string; k: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null); const [sz, setSz] = useState<[number, number]>([0, 0]);
  useLayoutEffect(() => { const el = ref.current; if (el) setSz([el.offsetWidth, el.offsetHeight]); }, []);
  const [W, H] = sz; const geo = useMemo(() => (W > 0 ? makeGeo(id, W, H) : null), [id, W, H]);
  const reveal = clamp(k / .34) * (geo ? geo.maxd : 1); const fade = 1 - clamp((k - .62) / .2);
  return <div ref={ref} style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
    <div style={{ visibility: k > 0 ? "hidden" : "visible" }}>{children}</div>
    {k > 0 && k < 1 && geo && <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 12 }} aria-hidden="true">
      {geo.tiles.map((t, i) => { const u = clamp((k - t.tf) / .14); return <div key={i} style={{ position: "absolute", inset: 0, backgroundImage: "url(" + src + ")", backgroundSize: "cover", backgroundPosition: "center", clipPath: "polygon(" + t.poly.map((p) => p[0].toFixed(1) + "px " + p[1].toFixed(1) + "px").join(",") + ")", transformOrigin: t.cx + "px " + t.cy + "px", transform: u > 0 ? "translate(" + t.dx * u + "px," + (u * u * (H * 1.3 + 90)) + "px) rotate(" + t.rot * u + "deg)" : undefined, opacity: 1 - clamp((u - .6) / .4) }} />; })}
      <svg viewBox={"0 0 " + W + " " + H} width={W} height={H} style={{ position: "absolute", inset: 0, opacity: fade }}>
        {geo.segs.map((s, i) => s.d <= reveal && <line key={i} x1={s.a[0]} y1={s.a[1]} x2={s.b[0]} y2={s.b[1]} stroke="#fff" strokeWidth={s.w} strokeLinecap="round" opacity=".92" />)}
        {k < .5 && <circle cx={geo.imp[0]} cy={geo.imp[1]} r="4" fill="#fff" />}
      </svg></div>}
  </div>;
}

function Mask({ k, children }: { k: number; children: ReactNode }) {
  if (k >= 1) return null; if (k <= 0) return <>{children}</>;
  const q = k * 114 - 14; const g = "linear-gradient(90deg,transparent 0%,transparent " + q + "%,#000 " + (q + 14) + "%)";
  return <div style={{ WebkitMaskImage: g, maskImage: g }}>{children}</div>;
}

export function Eph({ kind, id, src, start, total, clear, children }: { kind: "photo" | "mask"; id: string; src?: string; start: number; total: number; clear: number; children: ReactNode }) {
  const k = useEffectK(start, total, clear);
  return kind === "photo" && src ? <Crack id={id} src={src} k={k}>{children}</Crack> : <Mask k={k}>{children}</Mask>;
}
