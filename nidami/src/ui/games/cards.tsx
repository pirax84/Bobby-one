import type { CSSProperties, ReactNode } from "react";

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

/** Main en éventail : les cartes se chevauchent, celle qu'on touche ressort ; au-delà de 10 cartes, deux rangées. */
export function Fan({ items, w, max = 330 }: { items: ReactNode[]; w: number; max?: number }) {
  const row = (its: ReactNode[], k: number) => { const n = its.length; const step = n > 1 ? Math.min(w * 0.78, (max - w) / (n - 1)) : 0;
    return <div key={k} style={{ display: "flex", justifyContent: "center", padding: "14px 0 2px", width: "100%" }}>{its.map((it, i) => <div key={i} style={{ marginLeft: i ? -(w - step) : 0, zIndex: i, position: "relative", flex: "none" }}>{it}</div>)}</div>; };
  if (items.length <= 10) return row(items, 0);
  const h = Math.ceil(items.length / 2);
  return <div style={{ width: "100%" }}>{row(items.slice(0, h), 0)}{row(items.slice(h), 1)}</div>;
}
