import type { CSSProperties, ReactNode } from "react";

export type Suit = "s" | "c" | "h" | "d";
export type Card = { r: number; s: Suit }; // r : 1=As, 2..10, 11=Valet, 12=Dame, 13=Roi
export const SUITS: Suit[] = ["s", "c", "h", "d"];
export const SYM: Record<Suit, string> = { s: "♠", c: "♣", h: "♥", d: "♦" };
export const rankLabel = (r: number) => (r === 1 ? "A" : r === 11 ? "V" : r === 12 ? "D" : r === 13 ? "R" : String(r));
export const suitColor = (s: Suit) => (s === "h" || s === "d" ? "#E5679C" : "#2A2442");
export const deck52 = (): Card[] => SUITS.flatMap((s) => Array.from({ length: 13 }, (_, i) => ({ r: i + 1, s })));
export function shuffle<T>(a: T[]): T[] { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

/** Vraie carte à jouer : coin haut-gauche + grand symbole, aux couleurs de l'appli (cœurs/carreaux en rose). */
export function PlayCard({ c, down, w = 52, onClick, dim, sel, label, tag }: { c?: Card; down?: boolean; w?: number; onClick?: () => void; dim?: boolean; sel?: boolean; label?: string; tag?: string }) {
  const h = Math.round(w * 1.4);
  const st: CSSProperties = { width: w, height: h, borderRadius: Math.round(w * 0.16), position: "relative", flex: "none", padding: 0, border: sel ? "2.5px solid var(--brand)" : "1px solid rgba(0,0,0,.15)", boxShadow: "0 3px 8px rgba(0,0,0,.28)", opacity: dim ? 0.45 : 1, cursor: onClick ? "pointer" : "default", transform: sel ? "translateY(-10px)" : undefined, transition: "transform .15s", background: down || !c ? "linear-gradient(135deg,var(--brand),var(--brand2))" : "#fff", color: c ? suitColor(c.s) : "#fff", fontFamily: "Georgia,serif", fontWeight: 900 };
  const inner: ReactNode = down || !c
    ? <span style={{ position: "absolute", inset: Math.round(w * 0.1), borderRadius: Math.round(w * 0.1), border: "2px solid rgba(255,255,255,.55)" }} />
    : <><span style={{ position: "absolute", left: Math.round(w * 0.1), top: Math.round(w * 0.05), fontSize: Math.round(w * 0.3), lineHeight: 1.05, textAlign: "center" }}>{rankLabel(c.r)}<br />{SYM[c.s]}</span><span style={{ position: "absolute", right: Math.round(w * 0.1), bottom: Math.round(w * 0.02), fontSize: Math.round(w * 0.52) }}>{SYM[c.s]}</span></>;
  const aria = label || (down || !c ? "?" : rankLabel(c.r) + SYM[c.s]);
  return onClick ? <button type="button" aria-label={aria} onClick={onClick} style={st}>{inner}{tag && <i style={{ position: "absolute", top: -8, right: -6, fontStyle: "normal", fontSize: 10, background: "var(--brand)", color: "#fff", borderRadius: 8, padding: "1px 5px" }}>{tag}</i>}</button> : <span role="img" aria-label={aria} style={st}>{inner}</span>;
}
