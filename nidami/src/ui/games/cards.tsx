import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { t } from "../../i18n";
import { useLookCtx, type Look } from "./cardlook";

export type Suit = "s" | "c" | "h" | "d";
export type Card = { r: number; s: Suit }; // r : 1=As, 2..10, 11=Valet, 12=Dame, 13=Roi
export const SUITS: Suit[] = ["s", "c", "h", "d"];
export const SYM: Record<Suit, string> = { s: "♠", c: "♣", h: "♥", d: "♦" };
export const rankLabel = (r: number) => (r === 0 ? "★" : r === 1 ? "A" : r === 11 ? "V" : r === 12 ? "D" : r === 13 ? "R" : String(r));
export const suitColor = (s: Suit, r = 1) => (r === 0 ? "#9B87F5" : s === "h" || s === "d" ? "#D9548C" : "#2A2442");
export const deck52 = (): Card[] => SUITS.flatMap((s) => Array.from({ length: 13 }, (_, i) => ({ r: i + 1, s })));
export function shuffle<T>(a: T[]): T[] { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }


const NB = "#291E5B";
const FOUR: Record<Suit, string> = { s: "#3A45B8", h: "#C23AB0", c: "#0C9AA6", d: "#E2733F" };
const FOUR_D: Record<Suit, string> = { s: "#8FA0FF", h: "#FF8AEA", c: "#4FE0D0", d: "#FFAA7A" };
export function inkOf(s: Suit | undefined, r: number, face: string, four: boolean): string {
  if (r === 0 || !s) return face === "C" ? "#C9B8FF" : "#7C5CE0";
  if (four) return (face === "C" ? FOUR_D : FOUR)[s];
  const red = s === "h" || s === "d";
  return face === "C" ? (red ? "#FF8FB5" : "#F1EEFF") : (red ? "#D9548C" : "#2A2442");
}
function faceBg(face: string, w: number): { bg: string; deco: ReactNode; bd: string; dark?: boolean } {
  const ab: CSSProperties = { position: "absolute" };
  const lat = "repeating-linear-gradient(45deg,rgba(41,30,91,.06) 0 2px,transparent 2px 6px),repeating-linear-gradient(-45deg,rgba(41,30,91,.06) 0 2px,transparent 2px 6px)";
  if (face === "B") return { bg: "#FFFFFF", bd: "rgba(41,30,91,.25)", deco: <><span style={{ ...ab, left: 0, right: 0, top: 0, height: w * 0.1, background: "linear-gradient(90deg,#9B87F5,#3FB9C9)" }} /><span style={{ ...ab, left: 0, right: 0, bottom: 0, height: w * 0.1, background: "linear-gradient(90deg,#3FB9C9,#9B87F5)" }} /></> };
  if (face === "C") return { bg: "linear-gradient(160deg,#3A2C86,#1E1648)", bd: "rgba(201,184,255,.5)", dark: true, deco: null };
  if (face === "D") return { bg: "#FFFFFF", bd: "rgba(41,30,91,.25)", deco: <><span style={{ ...ab, inset: 0, background: lat }} /><span style={{ ...ab, left: "50%", top: "50%", width: w * 0.62, height: w * 0.62, marginLeft: -w * 0.31, marginTop: -w * 0.31, borderRadius: "50%", background: "#fff", border: "1.5px solid rgba(41,30,91,.25)" }} /></> };
  if (face === "E") return { bg: "#E9F3FB", bd: "rgba(41,30,91,.25)", deco: <><span style={{ ...ab, inset: 0, background: lat }} /><span style={{ ...ab, left: "50%", top: "50%", width: w * 0.5, height: w * 0.5, marginLeft: -w * 0.25, marginTop: -w * 0.25, transform: "rotate(45deg)", background: "#fff", border: "1.5px solid rgba(41,30,91,.25)" }} /></> };
  if (face === "F") return { bg: "#FFFFFF", bd: "rgba(41,30,91,.25)", deco: <>{[0.78, 0.56, 0.34].map((k) => <span key={k} style={{ ...ab, left: "50%", top: "50%", width: w * k, height: w * k, marginLeft: -w * k / 2, marginTop: -w * k / 2, borderRadius: "50%", border: "1.5px solid rgba(63,185,201,.35)" }} />)}</> };
  return { bg: "#FBF7EC", bd: "rgba(41,30,91,.3)", deco: <span style={{ ...ab, inset: w * 0.05, border: "1px solid rgba(41,30,91,.25)", borderRadius: w * 0.08 }} /> };
}
export function BackArt({ n, w }: { n: number; w: number }) {
  const ab: CSSProperties = { position: "absolute" }; const h = Math.round(w * 1.42);
  const stripes = "repeating-linear-gradient(45deg,rgba(255,255,255,.12) 0 3px,transparent 3px 7px)";
  const fr = <span style={{ ...ab, inset: w * 0.07, borderRadius: w * 0.07, border: "1.5px solid rgba(255,255,255,.55)" }} />;
  const nimg = (sz: number, x = "50%", y = "50%") => <img src="./n-white.png" alt="" draggable={false} style={{ ...ab, left: x, top: y, width: sz, height: sz, marginLeft: -sz / 2, marginTop: -sz / 2, objectFit: "contain" }} />;
  const bg = n === 3 ? "linear-gradient(145deg,#9B87F5,#3FB9C9)" : n === 5 ? "radial-gradient(circle at 50% 50%,#4B3AA8,#1A1245)" : n === 6 ? "linear-gradient(160deg,#3F46A0,#1B2A6B)" : "linear-gradient(145deg,#3A2C86,#1E1648)";
  return <span style={{ ...ab, inset: 0, background: bg, borderRadius: "inherit" }}>
    {n === 1 && <>{fr}<span style={{ ...ab, inset: w * 0.12, background: stripes }} />{[[0.2, 0.15], [0.8, 0.15], [0.2, 0.85], [0.8, 0.85]].map((p, i) => <span key={i}>{nimg(w * 0.16, p[0] * 100 + "%", p[1] * 100 + "%")}</span>)}{nimg(w * 0.34)}</>}
    {n === 2 && <>{fr}{nimg(w * 0.46)}</>}
    {n === 3 && <><span style={{ ...ab, inset: 0, background: stripes }} /><span style={{ ...ab, left: "50%", top: "50%", width: w * 0.52, height: w * 0.52, marginLeft: -w * 0.26, marginTop: -w * 0.26, borderRadius: "50%", background: "#fff" }} /><img src="./n-nuit.png" alt="" draggable={false} style={{ ...ab, left: "50%", top: "50%", width: w * 0.32, height: w * 0.32, marginLeft: -w * 0.16, marginTop: -w * 0.16, objectFit: "contain" }} /></>}
    {n === 4 && <>{fr}<span style={{ ...ab, inset: w * 0.12, opacity: 0.2, backgroundImage: "url(./n-white.png)", backgroundSize: w * 0.2 + "px", backgroundRepeat: "repeat" }} /><span style={{ ...ab, left: "50%", top: "50%", width: w * 0.5, height: w * 0.5, marginLeft: -w * 0.25, marginTop: -w * 0.25, borderRadius: "50%", background: NB, border: "1.5px solid rgba(255,255,255,.6)" }} />{nimg(w * 0.34)}</>}
    {n === 5 && <>{[0.85, 0.62, 0.4].map((k) => <span key={k} style={{ ...ab, left: "50%", top: "50%", width: w * k, height: w * k * 1.2, marginLeft: -w * k / 2, marginTop: -w * k * 0.6, borderRadius: "50%", border: "1.5px solid rgba(201,184,255,.4)" }} />)}{nimg(w * 0.34)}</>}
    {n === 6 && <><span style={{ ...ab, inset: 0, background: "repeating-linear-gradient(45deg,rgba(255,255,255,.1) 0 2px,transparent 2px 7px),repeating-linear-gradient(-45deg,rgba(255,255,255,.1) 0 2px,transparent 2px 7px)" }} />{fr}<span style={{ ...ab, left: "50%", top: "50%", width: w * 0.5, height: w * 0.5, marginLeft: -w * 0.25, marginTop: -w * 0.25, transform: "rotate(45deg)", background: "rgba(21,15,51,.55)", border: "1.5px solid rgba(255,255,255,.55)" }} />{nimg(w * 0.3)}</>}
    <span style={{ ...ab, height: h }} />
  </span>;
}
type CoreP = { w: number; face: string; backN: number; four: boolean; down?: boolean; corner?: string; sym?: string; s?: Suit; r?: number; ink?: string; centre?: ReactNode; onClick?: () => void; dim?: boolean; sel?: boolean; label: string; tag?: string; hRatio?: number };
/** Carte : 4 indices dans les coins (valeur + couleur), pastille N au centre, 6 modèles de face (A à F), 6 dos. */
export function CardCore(p: CoreP) {
  const { w } = p; const h = Math.round(w * (p.hRatio || 1.42)); const rad = Math.round(w * 0.12);
  const fb = faceBg(p.face, w);
  const ink = p.ink || "#2A2442";
  const st: CSSProperties = { display: "block", width: w, height: h, borderRadius: rad, position: "relative", flex: "none", padding: 0, overflow: "hidden", border: p.sel ? "2.5px solid var(--brand)" : "1px solid " + (p.down ? "rgba(255,255,255,.5)" : fb.bd), boxShadow: p.sel ? "0 10px 22px rgba(20,10,60,.55)" : "0 3px 8px rgba(10,5,40,.4)", filter: p.dim ? "brightness(.72) saturate(.55)" : undefined, cursor: p.onClick ? "pointer" : "default", transform: p.sel ? "translateY(-12px) scale(1.04)" : undefined, transition: "transform .18s, box-shadow .18s", background: p.down ? "#291E5B" : fb.bg, color: ink, fontFamily: "system-ui,-apple-system,'Segoe UI',sans-serif", fontWeight: 800 };
  const fs = Math.max(8, Math.round(w * 0.26)), fs2 = Math.max(7, Math.round(w * 0.22));
  const corner = (rot: boolean): CSSProperties => ({ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1, ...(rot ? { right: Math.round(w * 0.07), bottom: Math.round(w * 0.05), transform: "rotate(180deg)" } : { left: Math.round(w * 0.07), top: Math.round(w * 0.05) }), minWidth: fs });
  const idx = (rot: boolean) => <span style={corner(rot)}><span style={{ fontSize: fs }}>{p.corner}</span>{p.sym ? <span style={{ fontSize: fs2, marginTop: 1 }}>{p.sym}</span> : null}</span>;
  const nsz = Math.round(w * 0.36);
  const cen = p.centre !== undefined ? p.centre : <img src={fb.dark ? "./n-white.png" : "./n-nuit.png"} alt="" draggable={false} style={{ position: "absolute", left: "50%", top: "50%", width: nsz, height: nsz, marginLeft: -nsz / 2, marginTop: -nsz / 2, objectFit: "contain", opacity: p.face === "A" || p.face === "B" ? 0.9 : 1 }} />;
  const inner = p.down ? <BackArt n={p.backN} w={w} /> : <>{fb.deco}{cen}{idx(false)}{idx(true)}
    <span style={{ position: "absolute", right: Math.round(w * 0.07), top: Math.round(w * 0.05), display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1, minWidth: fs }}><span style={{ fontSize: fs }}>{p.corner}</span>{p.sym ? <span style={{ fontSize: fs2, marginTop: 1 }}>{p.sym}</span> : null}</span>
    <span style={{ position: "absolute", left: Math.round(w * 0.07), bottom: Math.round(w * 0.05), display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1, transform: "rotate(180deg)", minWidth: fs }}><span style={{ fontSize: fs }}>{p.corner}</span>{p.sym ? <span style={{ fontSize: fs2, marginTop: 1 }}>{p.sym}</span> : null}</span></>;
  const tg = p.tag && <i style={{ position: "absolute", bottom: 3, left: 3, fontStyle: "normal", fontSize: 10, background: "var(--brand)", color: "var(--on)", borderRadius: 8, padding: "1px 5px", zIndex: 2 }}>{p.tag}</i>;
  return p.onClick ? <button type="button" aria-label={p.label} onClick={p.onClick} style={st}>{inner}{tg}</button> : <span role="img" aria-label={p.label} style={st}>{inner}{tg}</span>;
}
/** Carte standard : le modèle de face, le dos et l'option 4 couleurs viennent des réglages du jeu en cours (ou de `look` pour un aperçu). */
export function PlayCard({ c, down, w = 52, onClick, dim, sel, label, tag, look }: { c?: Card; down?: boolean; w?: number; onClick?: () => void; dim?: boolean; sel?: boolean; label?: string; tag?: string; look?: Partial<Look> }) {
  const ctx = useLookCtx(); const lk = { ...ctx.look, ...look };
  const back = down || !c;
  const aria = label || (back ? "?" : c!.r === 0 ? "Joker" : rankLabel(c!.r) + SYM[c!.s]);
  return <CardCore w={w} face={lk.face} backN={lk.back} four={lk.four} down={back} corner={c ? rankLabel(c.r) : ""} sym={c && c.r !== 0 ? SYM[c.s] : ""} s={c?.s} r={c?.r} ink={c ? inkOf(c.s, c.r, lk.face, lk.four) : undefined} onClick={onClick} dim={dim} sel={sel} label={aria} tag={tag} />;
}

export type FanItem = { k: string | number; s: number; r: number; node: ReactNode; g?: number; gl?: string };
const GCOL = ["#19E3F2", "#FF7BE5", "#7FA8FF", "#C9B8FF"];
/** Main en arc (forme de banane) : cartes côte à côte, on peut les déplacer au doigt ou les classer par couleur / par valeur. */
export function Fan({ items, w, max = 280 }: { items: FanItem[]; w: number; max?: number }) {
  const { look } = useLookCtx(); const anyG = look.aid && items.some((x) => x.g !== undefined);
  const [ord, setOrd] = useState<(string | number)[]>([]);
  const [drag, setDrag] = useState<{ k: string | number; dx: number } | null>(null);
  const was = useRef(false);
  const byK = new Map(items.map((x) => [x.k, x]));
  const eff = [...ord.filter((k) => byK.has(k)), ...items.filter((x) => !ord.includes(x.k)).map((x) => x.k)];
  const list = eff.map((k) => byK.get(k)!);
  const sortBy = (mode: "s" | "r") => setOrd([...list].sort((a, b) => mode === "s" ? a.s - b.s || a.r - b.r : a.r - b.r || a.s - b.s).map((x) => x.k));
  const chunks: FanItem[][] = list.length <= 16 ? [list] : [list.slice(0, Math.ceil(list.length / 2)), list.slice(Math.ceil(list.length / 2))];
  const H = Math.round(w * 1.42);
  const row = (its: FanItem[], ri: number) => {
    const n = its.length; const step = n > 1 ? Math.min(w * 0.8, (max - w) / (n - 1)) : 0; const x0 = (max - w - (n - 1) * step) / 2;
    const span = Math.min(18, 4 + n * 1.3);
    const place = (i: number) => { const t = n > 1 ? (i - (n - 1) / 2) / ((n - 1) / 2) : 0; return { x: x0 + i * step, rot: t * span, dy: 12 - t * t * 12 }; };
    const move = (k: string | number, to: number) => { const ks = its.map((x) => x.k); const from = ks.indexOf(k); ks.splice(from, 1); ks.splice(to, 0, k); const other = list.filter((x) => !ks.includes(x.k)).map((x) => x.k); setOrd(ri === 0 ? [...ks, ...other] : [...other, ...ks]); };
    return <div key={ri} style={{ position: "relative", width: max, maxWidth: "100%", height: H + 34 + (anyG && look.words ? 24 : 0), margin: "0 auto", touchAction: "none" }}>
      {its.map((it, i) => { const p = place(i); const d = drag && drag.k === it.k ? drag.dx : 0;
        const gi = look.aid ? it.g : undefined; const gc = gi !== undefined ? GCOL[gi % GCOL.length] : "";
        const gs: CSSProperties = gi !== undefined ? (look.style === "leve" ? { boxShadow: `0 0 0 3px ${gc}, 0 8px 14px rgba(0,0,0,.5)` } : look.style === "sombre" ? { boxShadow: `0 0 0 3px ${gc}, 0 0 14px 4px ${gc}` } : { boxShadow: `0 0 0 3px #fff, 0 0 0 6px ${gc}` }) : (anyG && look.style === "sombre" ? { filter: "brightness(.55) saturate(.6)" } : {});
        const lift = gi !== undefined && look.style === "leve" && !d ? " translateY(-16px)" : "";
        return <div key={it.k} style={{ position: "absolute", left: p.x, bottom: p.dy + (anyG && look.words ? 24 : 0), zIndex: d ? 99 : i, borderRadius: Math.round(w * 0.12), ...gs, transformOrigin: "50% 190%", transform: d ? `translate(${d}px,-16px) scale(1.06)` : `rotate(${p.rot}deg)` + lift, transition: d ? "none" : "transform .2s, left .2s", cursor: "grab", touchAction: "none" }}
          onClickCapture={(e) => { if (was.current) { e.stopPropagation(); e.preventDefault(); was.current = false; } }}
          onPointerDown={(e) => { const sx = e.clientX; const el = e.currentTarget; let on = false; const mv = (ev: PointerEvent) => { const dx = ev.clientX - sx; if (!on && Math.abs(dx) > 8) { on = true; try { el.setPointerCapture(e.pointerId); } catch { /* ignoré */ } } if (on) setDrag({ k: it.k, dx }); };
            const up = (ev: PointerEvent) => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); if (on) { was.current = true; setTimeout(() => { was.current = false; }, 60); const to = Math.max(0, Math.min(n - 1, Math.round(i + (ev.clientX - sx) / step))); if (to !== i) move(it.k, to); } setDrag(null); };
            window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up); }}>{it.node}</div>; })}
      {anyG && look.words && its.map((it, i) => { if (it.g === undefined || !it.gl || (i > 0 && its[i - 1].g === it.g)) return null; let j = i; while (j + 1 < n && its[j + 1].g === it.g) j++; const cx = x0 + ((i + j) / 2) * step + w / 2; return <span key={"w" + i} style={{ position: "absolute", left: cx, bottom: 0, transform: "translateX(-50%)", background: GCOL[it.g % GCOL.length], color: "#150F33", fontWeight: 800, fontSize: 12, borderRadius: 10, padding: "1px 9px", whiteSpace: "nowrap" }}>{it.gl}</span>; })}
    </div>;
  };
  const bt: CSSProperties = { fontSize: 12, padding: "4px 10px" };
  return <div style={{ width: "100%", paddingTop: 8 }}>{chunks.map((c, i) => row(c, i))}
    <div className="row" style={{ gap: 8, justifyContent: "center", marginTop: 4 }}><button type="button" className="btn ghost sm" style={bt} onClick={() => sortBy("s")}>{t("Par couleur")}</button><button type="button" className="btn ghost sm" style={bt} onClick={() => sortBy("r")}>{t("Par valeur")}</button></div>
  </div>;
}
