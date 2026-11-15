import { useEffect, useRef, useState } from "react";
import { t } from "../../i18n";
import { GameShell, win } from "./shell";

const W = 7, H = 6;
type B = number[][]; // [col][row] : 0 vide, 1 toi, 2 ordinateur ; row 0 = bas
const empty = (): B => Array.from({ length: W }, () => Array(H).fill(0));
const drop = (b: B, c: number, p: number): B | null => { const r = b[c].indexOf(0); if (r < 0) return null; const n = b.map((x) => [...x]); n[c][r] = p; return n; };
const lines = (() => { const L: [number, number][][] = []; for (let c = 0; c < W; c++) for (let r = 0; r < H; r++) for (const [dc, dr] of [[1, 0], [0, 1], [1, 1], [1, -1]]) { const l: [number, number][] = []; for (let k = 0; k < 4; k++) l.push([c + dc * k, r + dr * k]); if (l.every(([x, y]) => x >= 0 && x < W && y >= 0 && y < H)) L.push(l); } return L; })();
const winner = (b: B): { p: number; cells: [number, number][] } | null => { for (const l of lines) { const v = b[l[0][0]][l[0][1]]; if (v && l.every(([c, r]) => b[c][r] === v)) return { p: v, cells: l }; } return null; };
const full = (b: B) => b.every((c) => c[H - 1] !== 0);
const score = (b: B) => { let s = 0; for (const l of lines) { let a = 0, o = 0; for (const [c, r] of l) { if (b[c][r] === 2) a++; else if (b[c][r] === 1) o++; } if (a && !o) s += [0, 1, 4, 25][a] || 0; if (o && !a) s -= [0, 1, 4, 25][o] || 0; } for (let r = 0; r < H; r++) { if (b[3][r] === 2) s += 3; if (b[3][r] === 1) s -= 3; } return s; };
const order = [3, 2, 4, 1, 5, 0, 6];
function search(b: B, depth: number, alpha: number, beta: number, max: boolean): number {
  const w = winner(b); if (w) return w.p === 2 ? 100000 + depth : -100000 - depth; if (full(b) || depth === 0) return score(b);
  if (max) { let v = -Infinity; for (const c of order) { const n = drop(b, c, 2); if (!n) continue; v = Math.max(v, search(n, depth - 1, alpha, beta, false)); alpha = Math.max(alpha, v); if (alpha >= beta) break; } return v; }
  let v = Infinity; for (const c of order) { const n = drop(b, c, 1); if (!n) continue; v = Math.min(v, search(n, depth - 1, alpha, beta, true)); beta = Math.min(beta, v); if (alpha >= beta) break; } return v;
}
const best = (b: B) => { let bc = order.find((c) => b[c][H - 1] === 0)!, bv = -Infinity; for (const c of order) { const n = drop(b, c, 2); if (!n) continue; const v = search(n, 5, -Infinity, Infinity, false); if (v > bv) { bv = v; bc = c; } } return bc; };

/** Aligne 4 : lâche tes jetons, le premier à en aligner 4 (ligne, colonne ou diagonale) gagne. */
export function Aligne4() {
  const [b, setB] = useState(empty); const [turn, setTurn] = useState<1 | 2>(1); const scored = useRef(false);
  const w = winner(b); const draw = !w && full(b); const over = !!w || draw;
  useEffect(() => { if (turn !== 2 || over) return; const id = setTimeout(() => { const c = best(b); const n = drop(b, c, 2); if (n) { setB(n); setTurn(1); } }, 450); return () => clearTimeout(id); }, [turn, b, over]);
  useEffect(() => { if (w?.p === 1 && !scored.current) { scored.current = true; win(3); } }, [w?.p]);
  const play = (c: number) => { if (turn !== 1 || over) return; const n = drop(b, c, 1); if (n) { setB(n); setTurn(2); } };
  const again = () => { scored.current = false; setB(empty()); setTurn(1); };
  const status = w ? (w.p === 1 ? t("🏆 Bravo, tu as gagné ! (+3 points)") : t("L'ordinateur a gagné cette partie.")) : draw ? t("Match nul 🤝") : turn === 1 ? t("C'est ton tour : choisis une colonne.") : t("L'ordinateur réfléchit…");
  const hit = (c: number, r: number) => w?.cells.some(([x, y]) => x === c && y === r);
  return (
    <GameShell status={status} over={over} onAgain={again}>
      <div role="group" aria-label={t("Grille de 7 colonnes")} style={{ display: "grid", gridTemplateColumns: `repeat(${W},1fr)`, gap: 6, padding: 10, borderRadius: 18, background: "linear-gradient(135deg,#4F7BFF,#6E58D8)", width: "100%", maxWidth: 360 }}>
        {Array.from({ length: W }, (_, c) => (
          <button key={c} type="button" aria-label={t("Colonne {n}", { n: c + 1 })} onClick={() => play(c)} disabled={turn !== 1 || over || b[c][H - 1] !== 0} style={{ display: "flex", flexDirection: "column-reverse", gap: 6, background: "none", border: 0, padding: 0 }}>
            {Array.from({ length: H }, (_, r) => { const v = b[c][r]; return <span key={r} style={{ aspectRatio: "1", borderRadius: "50%", background: v === 1 ? "#FFC2CE" : v === 2 ? "#B9F0E4" : "rgba(255,255,255,.18)", boxShadow: hit(c, r) ? "0 0 0 3px #fff" : "inset 0 2px 4px rgba(0,0,0,.25)", display: "block" }} />; })}
          </button>))}
      </div>
      <div className="muted small" style={{ display: "flex", gap: 14 }}><span><i style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: "#FFC2CE", marginInlineEnd: 6 }} />{t("Toi")}</span><span><i style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: "#B9F0E4", marginInlineEnd: 6 }} />{t("Ordinateur")}</span></div>
    </GameShell>
  );
}
