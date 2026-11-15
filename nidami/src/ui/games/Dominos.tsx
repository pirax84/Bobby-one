import { useEffect, useRef, useState } from "react";
import { t } from "../../i18n";
import { shuffle } from "./cards";
import { GameShell, win } from "./shell";

type T = [number, number];
const PIPS: Record<number, [number, number][]> = { 0: [], 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]] };
const sum = (h: T[]) => h.reduce((s, x) => s + x[0] + x[1], 0);

/** Une pièce de domino (horizontale ou verticale). */
function Piece({ a, b, vertical, w = 26, onClick, dim, sel }: { a: number; b: number; vertical?: boolean; w?: number; onClick?: () => void; dim?: boolean; sel?: boolean }) {
  const half = (v: number, ox: number, oy: number) => PIPS[v].map(([x, y], i) => <circle key={ox + "-" + oy + "-" + i} cx={ox + 5 + x * 7.5} cy={oy + 5 + y * 7.5} r="2.2" fill="#2A2442" />);
  const body = <svg width={vertical ? w : w * 2} height={vertical ? w * 2 : w} viewBox={vertical ? "0 0 20 40" : "0 0 40 20"} aria-hidden="true">
    <rect x=".8" y=".8" width={vertical ? 18.4 : 38.4} height={vertical ? 38.4 : 18.4} rx="4" fill="#fff" stroke={sel ? "var(--brand)" : "rgba(0,0,0,.25)"} strokeWidth={sel ? 2 : 1} />
    {vertical ? <><path d="M3 20h14" stroke="#9B87F5" strokeWidth="1.2" />{half(a, 0, 0)}{half(b, 0, 20)}</> : <><path d="M20 3v14" stroke="#9B87F5" strokeWidth="1.2" />{half(a, 0, 0)}{half(b, 20, 0)}</>}
  </svg>;
  const lab = a + "-" + b;
  return onClick ? <button type="button" onClick={onClick} aria-label={lab} style={{ background: "none", border: 0, padding: 2, opacity: dim ? 0.45 : 1, transform: sel ? "translateY(-8px)" : undefined, transition: "transform .15s", filter: "drop-shadow(0 2px 4px rgba(0,0,0,.35))" }}>{body}</button> : <span role="img" aria-label={lab} style={{ padding: 1, filter: "drop-shadow(0 2px 3px rgba(0,0,0,.3))", display: "inline-flex" }}>{body}</span>;
}

type S = { me: T[]; cpu: T[]; yard: T[]; chain: T[]; turn: "me" | "cpu"; passes: number; msg: string; over: "" | "me" | "cpu" | "draw" };
function init(): S {
  const all: T[] = []; for (let i = 0; i <= 6; i++) for (let j = i; j <= 6; j++) all.push([i, j]);
  const d = shuffle(all); const me = d.slice(0, 7), cpu = d.slice(7, 14), yard = d.slice(14);
  const best = (h: T[]) => Math.max(-1, ...h.filter((x) => x[0] === x[1]).map((x) => x[0] * 2 + 100), ...h.map((x) => x[0] + x[1]));
  const first: "me" | "cpu" = best(me) >= best(cpu) ? "me" : "cpu";
  return { me, cpu, yard, chain: [], turn: first, passes: 0, msg: "", over: "" };
}
const ends = (c: T[]): [number, number] => [c[0][0], c[c.length - 1][1]];
const canL = (c: T[], x: T) => c.length === 0 || x[0] === ends(c)[0] || x[1] === ends(c)[0];
const canR = (c: T[], x: T) => c.length === 0 || x[0] === ends(c)[1] || x[1] === ends(c)[1];
const put = (c: T[], x: T, left: boolean): T[] => { if (!c.length) return [x]; if (left) { const e = ends(c)[0]; return [x[1] === e ? x : [x[1], x[0]], ...c]; } const e = ends(c)[1]; return [...c, x[0] === e ? x : [x[1], x[0]]]; };
const playable = (c: T[], h: T[]) => h.filter((x) => canL(c, x) || canR(c, x));

/** Dominos (double-six, 2 joueurs) : pose une pièce dont un côté correspond à un bout de la chaîne ; sinon pioche. Le premier sans pièces gagne. */
export function Dominos() {
  const [s, setS] = useState(init); const [sel, setSel] = useState<number | null>(null); const scored = useRef(false);
  const finish = (n: S): S => { if (n.me.length === 0) return { ...n, over: "me" }; if (n.cpu.length === 0) return { ...n, over: "cpu" }; if (n.passes >= 2) { const a = sum(n.me), b = sum(n.cpu); return { ...n, over: a < b ? "me" : b < a ? "cpu" : "draw" }; } return n; };
  const playMe = (i: number, left: boolean) => { const x = s.me[i]; setSel(null); setS((p) => finish({ ...p, me: p.me.filter((_, k) => k !== i), chain: put(p.chain, x, left), turn: "cpu", passes: 0, msg: "" })); };
  const clickTile = (i: number) => { if (s.turn !== "me" || s.over) return; const x = s.me[i], l = canL(s.chain, x), r = canR(s.chain, x); if (!l && !r) return; if (l && r && s.chain.length && ends(s.chain)[0] !== ends(s.chain)[1]) return setSel(sel === i ? null : i); playMe(i, l); };
  const draw = () => setS((p) => { if (!p.yard.length) return p; const [x, ...rest] = p.yard; return { ...p, me: [...p.me, x], yard: rest, msg: t("Tu pioches une pièce.") }; });
  const pass = () => setS((p) => finish({ ...p, turn: "cpu", passes: p.passes + 1, msg: t("Tu passes ton tour.") }));
  useEffect(() => { if (s.turn !== "cpu" || s.over) return; const id = setTimeout(() => setS((p) => {
    let cpu = [...p.cpu], yard = [...p.yard]; let pl = playable(p.chain, cpu);
    while (!pl.length && yard.length) { cpu.push(yard.shift()!); pl = playable(p.chain, cpu); }
    if (!pl.length) return finish({ ...p, cpu, yard, turn: "me", passes: p.passes + 1, msg: t("L'ordinateur passe son tour.") });
    const x = pl.sort((a, b) => b[0] + b[1] - (a[0] + a[1]))[0]; const l = canL(p.chain, x) && (!canR(p.chain, x) || Math.random() < 0.5);
    return finish({ ...p, cpu: cpu.filter((y) => y !== x), yard, chain: put(p.chain, x, l), turn: "me", passes: 0, msg: "" });
  }), 800); return () => clearTimeout(id); }, [s.turn, s.over, s.chain.length, s.cpu.length]);
  useEffect(() => { if (s.over === "me" && !scored.current) { scored.current = true; win(4); } }, [s.over]);
  const again = () => { scored.current = false; setS(init()); setSel(null); };
  const can = playable(s.chain, s.me).length > 0;
  const status = s.over ? (s.over === "me" ? t("🏆 Bravo, tu as gagné ! (+4 points)") : s.over === "cpu" ? t("L'ordinateur a gagné cette partie.") : t("Match nul 🤝")) : s.turn === "cpu" ? (s.msg ? s.msg + " " : "") + t("L'ordinateur réfléchit…") : (s.msg ? s.msg + " " : "") + (can ? t("À toi : choisis une pièce qui va avec un bout.") : s.yard.length ? t("Tu ne peux pas jouer : pioche une pièce.") : t("Plus de pioche : tu passes."));
  return (
    <GameShell status={status.trim()} over={!!s.over} onAgain={again}>
      <div className="muted small">{t("L'ordinateur a {n} pièces · Pioche : {m}", { n: s.cpu.length, m: s.yard.length })}</div>
      <div role="group" aria-label={t("Chaîne de dominos")} style={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", justifyContent: "center", minHeight: 70, padding: 8, borderRadius: 16, background: "rgba(127,127,127,.12)", width: "100%" }}>
        {s.chain.length === 0 ? <span className="muted small">{t("Pose la première pièce.")}</span> : s.chain.map((x, i) => <Piece key={i} a={x[0]} b={x[1]} vertical={x[0] === x[1]} w={x[0] === x[1] ? 20 : 20} />)}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>{s.me.map((x, i) => <Piece key={i + "" + x} a={x[0]} b={x[1]} vertical w={24} sel={sel === i} dim={s.turn !== "me" || (!canL(s.chain, x) && !canR(s.chain, x))} onClick={() => clickTile(i)} />)}</div>
      {sel !== null && <div className="row" style={{ gap: 8 }}><button type="button" className="btn ghost" onClick={() => playMe(sel, true)}>{t("À gauche")}</button><button type="button" className="btn" onClick={() => playMe(sel, false)}>{t("À droite")}</button></div>}
      {!s.over && s.turn === "me" && !can && (s.yard.length ? <button type="button" className="btn" onClick={draw}>{t("Piocher")}</button> : <button type="button" className="btn" onClick={pass}>{t("Passer")}</button>)}
    </GameShell>
  );
}
