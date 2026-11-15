import { useEffect, useMemo, useRef, useState } from "react";
import { t } from "../../i18n";
import { GameShell, win } from "./shell";

const N = 10;
type Bd = number[][]; // 1 pion à toi, 2 dame à toi, -1 pion ordinateur, -2 dame ordinateur
type Mv = { from: [number, number]; to: [number, number]; caps: [number, number][] };
const D: [number, number][] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const inb = (r: number, c: number) => r >= 0 && r < N && c >= 0 && c < N;
const start = (): Bd => Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, c) => ((r + c) % 2 === 1 ? (r < 4 ? -1 : r > 5 ? 1 : 0) : 0)));
const side = (v: number) => (v > 0 ? 1 : v < 0 ? -1 : 0);

function seqs(b: Bd, r0: number, c0: number, p: number): Mv[] {
  const piece = b[r0][c0]; const king = Math.abs(piece) === 2; const out: Mv[] = [];
  const bb = b.map((x) => [...x]); bb[r0][c0] = 0;
  const rec = (r: number, c: number, caps: [number, number][]) => {
    let any = false;
    for (const [dr, dc] of D) {
      let rr = r + dr, cc = c + dc;
      if (king) while (inb(rr, cc) && bb[rr][cc] === 0) { rr += dr; cc += dc; }
      if (!inb(rr, cc) || side(bb[rr][cc]) !== -p || caps.some(([x, y]) => x === rr && y === cc)) continue;
      const er = rr, ec = cc; let lr = rr + dr, lc = cc + dc;
      while (inb(lr, lc) && bb[lr][lc] === 0) {
        any = true; const nc: [number, number][] = [...caps, [er, ec]];
        // pièce capturée : reste sur le plateau (bloque) jusqu'à la fin du coup
        const keep = bb[er][ec]; bb[er][ec] = 99 * -p;
        rec(lr, lc, nc); bb[er][ec] = keep;
        if (!king) break; lr += dr; lc += dc;
      }
    }
    if (!any && caps.length) out.push({ from: [r0, c0], to: [r, c], caps });
  };
  rec(r0, c0, []); return out;
}
function movesFor(b: Bd, p: number): Mv[] {
  let caps: Mv[] = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (side(b[r][c]) === p) caps.push(...seqs(b, r, c, p));
  if (caps.length) { const m = Math.max(...caps.map((x) => x.caps.length)); return caps.filter((x) => x.caps.length === m); }
  const out: Mv[] = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (side(b[r][c]) !== p) continue; const king = Math.abs(b[r][c]) === 2;
    for (const [dr, dc] of D) {
      if (!king && dr !== -p) continue;
      let rr = r + dr, cc = c + dc;
      while (inb(rr, cc) && b[rr][cc] === 0) { out.push({ from: [r, c], to: [rr, cc], caps: [] }); if (!king) break; rr += dr; cc += dc; }
    }
  }
  return out;
}
function apply(b: Bd, m: Mv): Bd {
  const n = b.map((x) => [...x]); const v = n[m.from[0]][m.from[1]]; n[m.from[0]][m.from[1]] = 0;
  for (const [r, c] of m.caps) n[r][c] = 0;
  let nv = v; if (Math.abs(v) === 1 && ((v === 1 && m.to[0] === 0) || (v === -1 && m.to[0] === N - 1))) nv = v * 2;
  n[m.to[0]][m.to[1]] = nv; return n;
}
const evalB = (b: Bd) => { let s = 0; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const v = b[r][c]; if (!v) continue; const a = Math.abs(v); const base = a === 2 ? 320 : 100 + (v < 0 ? r : N - 1 - r) * 4; s += (v < 0 ? 1 : -1) * base; } return s; };
function ab(b: Bd, d: number, alpha: number, beta: number, p: number): number {
  const ms = movesFor(b, p); if (!ms.length) return p === -1 ? -100000 - d : 100000 + d; if (d === 0) return evalB(b);
  if (p === -1) { let v = -Infinity; for (const m of ms) { v = Math.max(v, ab(apply(b, m), d - 1, alpha, beta, 1)); alpha = Math.max(alpha, v); if (alpha >= beta) break; } return v; }
  let v = Infinity; for (const m of ms) { v = Math.min(v, ab(apply(b, m), d - 1, alpha, beta, -1)); beta = Math.min(beta, v); if (alpha >= beta) break; } return v;
}
const pick = (b: Bd): Mv | null => { const ms = movesFor(b, -1); if (!ms.length) return null; let bm = ms[0], bv = -Infinity; for (const m of ms.sort(() => Math.random() - 0.5)) { const v = ab(apply(b, m), 4, -Infinity, Infinity, 1); if (v > bv) { bv = v; bm = m; } } return bm; };

/** Dames (règles françaises, plateau de 10 × 10) : prise obligatoire, la prise qui prend le plus de pions est obligatoire, dame qui vole de loin. */
export function Dames() {
  const [b, setB] = useState(start); const [turn, setTurn] = useState<1 | -1>(1); const [sel, setSel] = useState<[number, number] | null>(null);
  const [quiet, setQuiet] = useState(0); const scored = useRef(false);
  const myMoves = useMemo(() => (turn === 1 ? movesFor(b, 1) : []), [b, turn]);
  const cpuMoves = useMemo(() => (turn === -1 ? movesFor(b, -1) : []), [b, turn]);
  const noMe = turn === 1 && myMoves.length === 0, noCpu = turn === -1 && cpuMoves.length === 0;
  const draw = quiet >= 50; const over = noMe || noCpu || draw; const iWin = noCpu;
  const go = (m: Mv) => { const n = apply(b, m); const man = Math.abs(b[m.from[0]][m.from[1]]) === 1; setQuiet(m.caps.length || man ? 0 : quiet + 1); setB(n); setSel(null); setTurn((x) => (x === 1 ? -1 : 1)); };
  useEffect(() => { if (turn !== -1 || over) return; const id = setTimeout(() => { const m = pick(b); if (m) go(m); }, 500); return () => clearTimeout(id); }, [turn, over]); // eslint-disable-line
  useEffect(() => { if (iWin && !scored.current) { scored.current = true; win(5); } }, [iWin]);
  const dests = sel ? myMoves.filter((m) => m.from[0] === sel[0] && m.from[1] === sel[1]) : [];
  const click = (r: number, c: number) => {
    if (turn !== 1 || over) return;
    const m = dests.find((x) => x.to[0] === r && x.to[1] === c); if (m) return go(m);
    if (b[r][c] > 0 && myMoves.some((x) => x.from[0] === r && x.from[1] === c)) setSel([r, c]); else setSel(null);
  };
  const again = () => { scored.current = false; setB(start()); setTurn(1); setSel(null); setQuiet(0); };
  const forced = turn === 1 && myMoves.length > 0 && myMoves[0].caps.length > 0;
  const status = iWin ? t("🏆 Bravo, tu as gagné ! (+5 points)") : noMe ? t("L'ordinateur a gagné cette partie.") : draw ? t("Match nul 🤝") : turn === 1 ? (forced ? t("Tu dois prendre un pion (prise obligatoire).") : t("C'est ton tour : touche un de tes pions.")) : t("L'ordinateur réfléchit…");
  return (
    <GameShell status={status} over={over} onAgain={again}>
      <div role="grid" aria-label={t("Plateau de dames")} style={{ display: "grid", gridTemplateColumns: `repeat(${N},1fr)`, width: "100%", maxWidth: 380, borderRadius: 10, overflow: "hidden", border: "3px solid #6E58D8" }}>
        {b.flatMap((row, r) => row.map((v, c) => {
          const dark = (r + c) % 2 === 1; const isD = dests.some((m) => m.to[0] === r && m.to[1] === c); const isSel = sel && sel[0] === r && sel[1] === c;
          return (
            <button key={r + "-" + c} type="button" role="gridcell" onClick={() => click(r, c)} aria-label={v ? (v > 0 ? t("Ton pion") : t("Pion de l'ordinateur")) : isD ? t("Case possible") : t("Case")} style={{ aspectRatio: "1", padding: 0, border: 0, background: dark ? "#6E58D8" : "#F1EDFF", display: "grid", placeItems: "center", position: "relative", outline: isSel ? "3px solid #fff" : "none", outlineOffset: -3 }}>
              {isD && <span style={{ width: "34%", height: "34%", borderRadius: "50%", background: "rgba(255,255,255,.75)" }} />}
              {v !== 0 && <span style={{ width: "76%", height: "76%", borderRadius: "50%", background: v > 0 ? "#B9F0E4" : "#FFC2CE", boxShadow: "0 2px 4px rgba(0,0,0,.45), inset 0 -3px 0 rgba(0,0,0,.18)", display: "grid", placeItems: "center" }}>{Math.abs(v) === 2 && <span style={{ width: "52%", height: "52%", borderRadius: "50%", border: "3px solid #2A2442" }} />}</span>}
            </button>);
        }))}
      </div>
      <div className="muted small" style={{ display: "flex", gap: 14 }}><span><i style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: "#B9F0E4", marginInlineEnd: 6 }} />{t("Toi")}</span><span><i style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: "#FFC2CE", marginInlineEnd: 6 }} />{t("Ordinateur")}</span></div>
    </GameShell>
  );
}
