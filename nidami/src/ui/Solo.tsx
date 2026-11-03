import { useEffect, useState } from "react";
import { actions, useStore } from "../lib/store";
import { t } from "../i18n";

const L = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const win = (b: string[]) => { for (const [a, c, d] of L) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a]; return b.every(Boolean) ? "draw" : ""; };
/** L'ordinateur : gagne s'il peut, bloque sinon, puis centre/coins/au hasard (battable). */
function bot(b: string[]): number {
  const free = b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  for (const who of ["O", "X"]) for (const i of free) { const c = [...b]; c[i] = who; if (win(c) === who) return i; }
  if (Math.random() < 0.25) return free[Math.floor(Math.random() * free.length)];
  if (b[4] === "") return 4;
  const corners = free.filter((i) => [0, 2, 6, 8].includes(i)); const pool = corners.length ? corners : free;
  return pool[Math.floor(Math.random() * pool.length)];
}
export function MorpionBot() {
  const [b, setB] = useState<string[]>(Array(9).fill("")); const w = win(b); const [scored, setScored] = useState(false);
  useEffect(() => { if (w === "X" && !scored) { setScored(true); actions.addScore(3); } }, [w, scored]);
  const play = (i: number) => { if (b[i] || w) return; const n = [...b]; n[i] = "X"; if (!win(n)) n[bot(n)] = "O"; setB(n); };
  return (<div className="card col" style={{ alignItems: "center" }}><b>{t("Vous (✕) contre l'ordinateur (◯)")}</b>
    <div className="ttt">{b.map((c, i) => <button key={i} onClick={() => play(i)} disabled={!!c || !!w} aria-label={t("Case {v1}", { v1: i + 1 })} style={{ color: c === "X" ? "var(--brand2)" : "var(--warm)" }}>{c === "X" ? "✕" : c === "O" ? "◯" : ""}</button>)}</div>
    <div className={w ? "" : "muted"}>{w ? (w === "draw" ? t("Match nul 🤝") : w === "X" ? t("🏆 Bravo, vous avez gagné ! (+3 points)") : t("L'ordinateur a gagné. Retentez !")) : t("C'est votre tour")}</div>
    <button className="btn" onClick={() => { setB(Array(9).fill("")); setScored(false); }}>{t("Rejouer")}</button></div>);
}

const FACES = ["🌳", "🌸", "🐝", "🍓", "🦋", "🌙", "⭐", "🍀"];
const deal = () => [...FACES, ...FACES].map((f, i) => ({ f, id: i })).sort(() => Math.random() - 0.5);
export function MemoryGame() {
  const [cards, setCards] = useState(deal); const [up, setUp] = useState<number[]>([]); const [done, setDone] = useState<number[]>([]); const [moves, setMoves] = useState(0);
  const finished = done.length === cards.length;
  useEffect(() => { if (finished) actions.addScore(3); }, [finished]);
  useEffect(() => { if (up.length !== 2) return; const [a, c] = up; setMoves((m) => m + 1);
    const id = setTimeout(() => { if (cards[a].f === cards[c].f) setDone((d) => [...d, a, c]); setUp([]); }, 800); return () => clearTimeout(id); }, [up]);
  const flip = (i: number) => { if (up.length >= 2 || up.includes(i) || done.includes(i)) return; setUp([...up, i]); };
  return (<div className="card col" style={{ alignItems: "center" }}><b>{t("Retrouvez les paires")}</b><div className="muted small">{t("Coups : {n}", { n: moves })}</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, width: "100%", maxWidth: 340 }}>{cards.map((c, i) => { const open = up.includes(i) || done.includes(i);
      return <button key={c.id} onClick={() => flip(i)} aria-label={open ? c.f : t("Carte cachée")} style={{ aspectRatio: "1", fontSize: 30, borderRadius: 14, border: "1px solid var(--bd)", background: open ? "var(--card2)" : "linear-gradient(135deg,var(--brand),var(--brand2))", color: "var(--fg)" }}>{open ? c.f : ""}</button>; })}</div>
    {finished && <b>{t("🏆 Bravo, terminé en {n} coups ! (+3 points)", { n: moves })}</b>}
    <button className="btn" onClick={() => { setCards(deal()); setUp([]); setDone([]); setMoves(0); }}>{t("Rejouer")}</button></div>);
}
