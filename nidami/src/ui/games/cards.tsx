import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { t } from "../../i18n";

export type Suit = "s" | "c" | "h" | "d";
export type Card = { r: number; s: Suit }; // r : 1=As, 2..10, 11=Valet, 12=Dame, 13=Roi
export const SUITS: Suit[] = ["s", "c", "h", "d"];
export const SYM: Record<Suit, string> = { s: "♠", c: "♣", h: "♥", d: "♦" };
export const rankLabel = (r: number) => (r === 0 ? "★" : r === 1 ? "A" : r === 11 ? "V" : r === 12 ? "D" : r === 13 ? "R" : String(r));
export const suitColor = (s: Suit, r = 1) => (r === 0 ? "#9B87F5" : s === "h" || s === "d" ? "#E5679C" : "#2A2442");
export const deck52 = (): Card[] => SUITS.flatMap((s) => Array.from({ length: 13 }, (_, i) => ({ r: i + 1, s })));
export function shuffle<T>(a: T[]): T[] { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

/** Carte moderne : coins très arrondis, dégradé doux, indice en haut à gauche, gros symbole, ombre colorée ; dos aux couleurs de l'appli. */
export function PlayCard({ c, down, w = 52, onClick, dim, sel, label, tag }: { c?: Card; down?: boolean; w?: number; onClick?: () => void; dim?: boolean; sel?: boolean; label?: string; tag?: string }) {
  const h = Math.round(w * 1.42); const rad = Math.round(w * 0.2);
  const back = down || !c;
  const st: CSSProperties = { display: "block", width: w, height: h, borderRadius: rad, position: "relative", flex: "none", padding: 0, overflow: "hidden", border: sel ? "2.5px solid #fff" : "1px solid rgba(255,255,255,.55)", boxShadow: sel ? "0 10px 22px rgba(60,40,140,.55), 0 0 0 2px var(--brand)" : "0 4px 10px rgba(30,20,80,.35), inset 0 1px 0 rgba(255,255,255,.8)", filter: dim ? "brightness(.72) saturate(.55)" : undefined, cursor: onClick ? "pointer" : "default", transform: sel ? "translateY(-12px) scale(1.04)" : undefined, transition: "transform .18s, box-shadow .18s", background: back ? "linear-gradient(145deg,#8E7BF0 0%,#6C58D8 55%,#3FB9C9 130%)" : "linear-gradient(160deg,#FFFFFF 0%,#F3EFFF 100%)", color: c ? suitColor(c.s, c.r) : "#fff", fontFamily: "system-ui,-apple-system,'Segoe UI',sans-serif", fontWeight: 800 };
  const inner: ReactNode = back
    ? <><span style={{ position: "absolute", inset: Math.round(w * 0.09), borderRadius: Math.round(w * 0.13), border: "1.5px solid rgba(255,255,255,.5)", background: "repeating-linear-gradient(45deg,rgba(255,255,255,.14) 0 3px,transparent 3px 7px)" }} /><span style={{ position: "absolute", left: "50%", top: "50%", width: w * 0.34, height: w * 0.34, marginLeft: -w * 0.17, marginTop: -w * 0.17, borderRadius: "50%", background: "rgba(255,255,255,.85)" }} /></>
    : <><span style={{ position: "absolute", left: Math.round(w * 0.11), top: Math.round(w * 0.07), fontSize: Math.round(w * 0.31), lineHeight: 1, textAlign: "center", letterSpacing: -0.5 }}>{rankLabel(c!.r)}<br /><span style={{ fontSize: Math.round(w * 0.26) }}>{c!.r === 0 ? "" : SYM[c!.s]}</span></span><span style={{ position: "absolute", right: Math.round(w * 0.08), bottom: Math.round(w * 0.04), fontSize: Math.round(w * 0.56), lineHeight: 1, opacity: 0.95 }}>{c!.r === 0 ? "★" : SYM[c!.s]}</span></>;
  const aria = label || (back ? "?" : c!.r === 0 ? "Joker" : rankLabel(c!.r) + SYM[c!.s]);
  const tg = tag && <i style={{ position: "absolute", bottom: 3, left: 3, fontStyle: "normal", fontSize: 10, background: "var(--brand)", color: "#fff", borderRadius: 8, padding: "1px 5px" }}>{tag}</i>;
  return onClick ? <button type="button" aria-label={aria} onClick={onClick} style={st}>{inner}{tg}</button> : <span role="img" aria-label={aria} style={st}>{inner}{tg}</span>;
}

export type FanItem = { k: string | number; s: number; r: number; node: ReactNode };
/** Main en arc (forme de banane) : cartes côte à côte, on peut les déplacer au doigt ou les classer par couleur / par valeur. */
export function Fan({ items, w, max = 280 }: { items: FanItem[]; w: number; max?: number }) {
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
    return <div key={ri} style={{ position: "relative", width: max, maxWidth: "100%", height: H + 34, margin: "0 auto", touchAction: "none" }}>
      {its.map((it, i) => { const p = place(i); const d = drag && drag.k === it.k ? drag.dx : 0;
        return <div key={it.k} style={{ position: "absolute", left: p.x, bottom: p.dy, zIndex: d ? 99 : i, transformOrigin: "50% 190%", transform: d ? `translate(${d}px,-16px) scale(1.06)` : `rotate(${p.rot}deg)`, transition: d ? "none" : "transform .2s, left .2s", cursor: "grab", touchAction: "none" }}
          onClickCapture={(e) => { if (was.current) { e.stopPropagation(); e.preventDefault(); was.current = false; } }}
          onPointerDown={(e) => { const sx = e.clientX; const el = e.currentTarget; let on = false; const mv = (ev: PointerEvent) => { const dx = ev.clientX - sx; if (!on && Math.abs(dx) > 8) { on = true; try { el.setPointerCapture(e.pointerId); } catch { /* ignoré */ } } if (on) setDrag({ k: it.k, dx }); };
            const up = (ev: PointerEvent) => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); if (on) { was.current = true; setTimeout(() => { was.current = false; }, 60); const to = Math.max(0, Math.min(n - 1, Math.round(i + (ev.clientX - sx) / step))); if (to !== i) move(it.k, to); } setDrag(null); };
            window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up); }}>{it.node}</div>; })}
    </div>;
  };
  const bt: CSSProperties = { fontSize: 12, padding: "4px 10px" };
  return <div style={{ width: "100%", paddingTop: 8 }}>{chunks.map((c, i) => row(c, i))}
    <div className="row" style={{ gap: 8, justifyContent: "center", marginTop: 4 }}><button type="button" className="btn ghost sm" style={bt} onClick={() => sortBy("s")}>{t("Par couleur")}</button><button type="button" className="btn ghost sm" style={bt} onClick={() => sortBy("r")}>{t("Par valeur")}</button></div>
  </div>;
}
