import { useEffect, useRef, useState } from "react";
import { t } from "../../i18n";
import { PlayCard, deck52, shuffle, type Card } from "./cards";
import { GameShell, win } from "./shell";

const val = (c: Card) => (c.r === 1 ? 14 : c.r);
type S = { me: Card[]; cpu: Card[]; tableMe: Card[]; tableCpu: Card[]; msg: string; over: boolean; won: boolean; pot: Card[] };
const fresh = (): S => { const d = shuffle(deck52()); return { me: d.slice(0, 26), cpu: d.slice(26), tableMe: [], tableCpu: [], msg: "", over: false, won: false, pot: [] }; };

/** Bataille : chacun retourne sa carte du dessus, la plus forte gagne les deux. Égalité = « bataille » (une carte cachée, une carte visible). */
export function Bataille() {
  const [s, setS] = useState(fresh);
  const scored = useRef(false);
  const play = () => setS((p) => {
    if (p.over) return p;
    const me = [...p.me], cpu = [...p.cpu]; let pot = [...p.pot]; const tm: Card[] = [], tc: Card[] = [];
    const battle = (n: number, hidden: boolean): { res: "me" | "cpu" | "end-me" | "end-cpu" } | null => {
      if (me.length < n) return { res: "end-me" }; if (cpu.length < n) return { res: "end-cpu" };
      for (let i = 0; i < n; i++) { const a = me.shift()!, b = cpu.shift()!; pot.push(a, b); if (i === n - 1) { tm.push(a); tc.push(b); } }
      void hidden; return null;
    };
    let r = battle(1, false); let msg = "";
    const last = () => ({ a: tm[tm.length - 1], b: tc[tc.length - 1] });
    let guard = 0;
    while (!r && guard++ < 10) {
      const { a, b } = last();
      if (val(a) > val(b)) { r = { res: "me" }; msg = t("Tu gagnes ce tour !"); }
      else if (val(a) < val(b)) { r = { res: "cpu" }; msg = t("L'ordinateur gagne ce tour."); }
      else { msg = t("Bataille !"); if (me.length < 2) { r = { res: "end-me" }; break; } if (cpu.length < 2) { r = { res: "end-cpu" }; break; } const x = me.shift()!, y = cpu.shift()!; pot.push(x, y); const rr = battle(1, false); if (rr) r = rr; }
    }
    if (r?.res === "me") me.push(...shuffle(pot)), pot = [];
    else if (r?.res === "cpu") cpu.push(...shuffle(pot)), pot = [];
    const endMe = r?.res === "end-me" || me.length === 0, endCpu = r?.res === "end-cpu" || cpu.length === 0;
    const over = endMe || endCpu;
    const won = over && !endMe;
    return { me, cpu, tableMe: tm, tableCpu: tc, pot, msg: over ? (won ? t("🏆 Bravo, tu as gagné toutes les cartes ! (+3 points)") : t("L'ordinateur a gagné cette partie.")) : msg, over, won };
  });
  useEffect(() => { if (s.over && s.won && !scored.current) { scored.current = true; win(3); } }, [s.over, s.won]);
  const again = () => { scored.current = false; setS(fresh()); };
  const status = s.msg || t("Appuie sur « Retourner » pour jouer.");
  return (
    <GameShell felt status={status} over={s.over} onAgain={again}>
      <div className="row" style={{ width: "100%", justifyContent: "space-around", alignItems: "center" }}>
        <div className="col" style={{ alignItems: "center", gap: 6 }}><b>{t("Ordinateur")}</b><PlayCard c={s.tableCpu[s.tableCpu.length - 1]} down={!s.tableCpu.length} w={64} /><span className="muted small">{t("{n} cartes", { n: s.cpu.length })}</span></div>
        <div className="col" style={{ alignItems: "center", gap: 6 }}><b>{t("Toi")}</b><PlayCard c={s.tableMe[s.tableMe.length - 1]} down={!s.tableMe.length} w={64} /><span className="muted small">{t("{n} cartes", { n: s.me.length })}</span></div>
      </div>
      {!s.over && <button type="button" className="btn" onClick={play} style={{ minWidth: 180 }}>{t("Retourner")}</button>}
    </GameShell>
  );
}
