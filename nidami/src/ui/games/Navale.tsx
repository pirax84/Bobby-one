import { useEffect, useRef, useState } from "react";
import { t } from "../../i18n";
import { GameShell, win } from "./shell";

const N = 10; const FLEET = [5, 4, 3, 3, 2];
type Ship = { cells: number[] };
type Side = { ships: Ship[]; shots: Record<number, "hit" | "miss"> };
const place = (): Ship[] => { const taken = new Set<number>(); const ships: Ship[] = [];
  for (const len of FLEET) for (let tries = 0; tries < 500; tries++) { const h = Math.random() < 0.5; const r = Math.floor(Math.random() * (h ? N : N - len + 1)), c = Math.floor(Math.random() * (h ? N - len + 1 : N)); const cells = Array.from({ length: len }, (_, i) => (h ? r * N + c + i : (r + i) * N + c)); if (cells.some((x) => taken.has(x))) continue; cells.forEach((x) => taken.add(x)); ships.push({ cells }); break; }
  return ships; };
const fresh = (): { me: Side; cpu: Side } => ({ me: { ships: place(), shots: {} }, cpu: { ships: place(), shots: {} } });
const sunk = (s: Side, sh: Ship) => sh.cells.every((c) => s.shots[c] === "hit");
const allSunk = (s: Side) => s.ships.every((sh) => sunk(s, sh));
const shipAt = (s: Side, i: number) => s.ships.find((sh) => sh.cells.includes(i));
function cpuShot(side: Side): number { // l'ordinateur : il achève un bateau touché, sinon tire en damier
  const hits = Object.keys(side.shots).map(Number).filter((i) => side.shots[i] === "hit" && !sunk(side, shipAt(side, i)!));
  const free = (i: number) => i >= 0 && i < N * N && !(i in side.shots);
  const cand: number[] = [];
  for (const i of hits) { const r = Math.floor(i / N), c = i % N; for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const rr = r + dr, cc = c + dc; if (rr < 0 || rr >= N || cc < 0 || cc >= N) continue; const j = rr * N + cc; if (!free(j)) continue; const aligned = hits.length < 2 || hits.some((h) => h !== i && (Math.floor(h / N) === r ? dr === 0 : h % N === c ? dc === 0 : false)); if (aligned) cand.push(j); } }
  if (cand.length) return cand[Math.floor(Math.random() * cand.length)];
  const all = Array.from({ length: N * N }, (_, i) => i).filter(free); const par = all.filter((i) => (Math.floor(i / N) + (i % N)) % 2 === 0);
  const pool = par.length ? par : all; return pool[Math.floor(Math.random() * pool.length)];
}

/** Bataille navale (10 × 10, flotte de 5 bateaux). Touche une case de la mer ennemie ; le premier qui coule toute la flotte gagne. */
export function Navale() {
  const [g, setG] = useState(fresh); const [phase, setPhase] = useState<"place" | "play">("place"); const [turn, setTurn] = useState<"me" | "cpu">("me"); const [msg, setMsg] = useState(""); const scored = useRef(false);
  const meOver = allSunk(g.cpu), cpuOver = allSunk(g.me); const over = meOver || cpuOver;
  const shoot = (who: "me" | "cpu", i: number) => {
    const target = who === "me" ? g.cpu : g.me; if (i in target.shots) return;
    const sh = shipAt(target, i); const nt: Side = { ...target, shots: { ...target.shots, [i]: sh ? "hit" : "miss" } };
    const s2 = sh && sunk(nt, sh);
    setMsg(who === "me" ? (s2 ? t("Coulé ! Tu as coulé un bateau.") : sh ? t("Touché !") : t("Raté… dans l'eau.")) : (s2 ? t("L'ordinateur a coulé un de tes bateaux.") : sh ? t("L'ordinateur a touché un de tes bateaux.") : t("L'ordinateur a raté.")));
    setG((p) => (who === "me" ? { ...p, cpu: nt } : { ...p, me: nt }));
    if (!(sh && allSunk(nt))) setTurn(who === "me" ? "cpu" : "me");
  };
  useEffect(() => { if (phase !== "play" || turn !== "cpu" || over) return; const id = setTimeout(() => shoot("cpu", cpuShot(g.me)), 700); return () => clearTimeout(id); }, [turn, phase, over, g.me]); // eslint-disable-line
  useEffect(() => { if (meOver && !scored.current) { scored.current = true; win(5); } }, [meOver]);
  const again = () => { scored.current = false; setG(fresh()); setPhase("place"); setTurn("me"); setMsg(""); };
  const cell = (side: Side, i: number, hidden: boolean, big: boolean) => { const s = side.shots[i]; const sh = shipAt(side, i); const show = !hidden && !!sh;
    const sunkIt = sh && sunk(side, sh);
    return <span key={i} style={{ aspectRatio: "1", borderRadius: big ? 4 : 2, background: sunkIt && s ? "#FFC2CE" : s === "hit" ? "#FF8A6B" : show ? "#B9F0E4" : "rgba(255,255,255,.14)", display: "grid", placeItems: "center", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.18)" }}>{s === "miss" && <i style={{ width: "30%", height: "30%", borderRadius: "50%", background: "#fff", opacity: 0.85 }} />}{s === "hit" && <i style={{ width: "46%", height: "46%", borderRadius: "50%", background: "#2A2442" }} />}</span>; };
  const status = over ? (meOver ? t("🏆 Bravo, tu as coulé toute la flotte ! (+5 points)") : t("L'ordinateur a coulé toute ta flotte.")) : phase === "place" ? t("Voici ta flotte. Change-la si tu veux, puis lance la partie.") : turn === "me" ? (msg ? msg + " " : "") + t("À toi : touche une case de la mer ennemie.") : msg + " " + t("L'ordinateur réfléchit…");
  return (
    <GameShell status={status.trim()} over={over} onAgain={again}>
      {phase === "place" ? <>
        <div role="img" aria-label={t("Ta flotte")} style={{ display: "grid", gridTemplateColumns: `repeat(${N},1fr)`, gap: 2, padding: 6, borderRadius: 12, background: "linear-gradient(135deg,#2BB8D8,#4F7BFF)", width: "100%", maxWidth: 340 }}>{Array.from({ length: N * N }, (_, i) => cell(g.me, i, false, true))}</div>
        <div className="row" style={{ gap: 8 }}><button type="button" className="btn ghost" onClick={() => setG((p) => ({ ...p, me: { ships: place(), shots: {} } }))}>{t("Mélanger ma flotte")}</button><button type="button" className="btn" onClick={() => setPhase("play")}>{t("Lancer la partie")}</button></div>
      </> : <>
        <b className="small">{t("Mer de l'ordinateur")}</b>
        <div role="grid" aria-label={t("Mer de l'ordinateur")} style={{ display: "grid", gridTemplateColumns: `repeat(${N},1fr)`, gap: 2, padding: 6, borderRadius: 12, background: "linear-gradient(135deg,#2BB8D8,#4F7BFF)", width: "100%", maxWidth: 340 }}>
          {Array.from({ length: N * N }, (_, i) => <button key={i} type="button" role="gridcell" aria-label={t("Case {n}", { n: i + 1 })} disabled={turn !== "me" || over || i in g.cpu.shots} onClick={() => shoot("me", i)} style={{ padding: 0, border: 0, background: "none", display: "block" }}>{cell(g.cpu, i, !over, true)}</button>)}
        </div>
        <b className="small">{t("Ta flotte")}</b>
        <div role="img" aria-label={t("Ta flotte")} style={{ display: "grid", gridTemplateColumns: `repeat(${N},1fr)`, gap: 1, padding: 4, borderRadius: 8, background: "linear-gradient(135deg,#2BB8D8,#4F7BFF)", width: 150 }}>{Array.from({ length: N * N }, (_, i) => cell(g.me, i, false, false))}</div>
      </>}
    </GameShell>
  );
}
