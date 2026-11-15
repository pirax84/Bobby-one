import { useEffect, useRef, useState } from "react";
import { t } from "../../i18n";
import { PlayCard, deck52, shuffle, type Card } from "./cards";
import { GameShell, win } from "./shell";

type P = { name: string; hand: Card[]; out: boolean };
const pairUp = (h: Card[]): Card[] => { const by = new Map<number, Card[]>(); for (const c of h) by.set(c.r, [...(by.get(c.r) || []), c]); const rest: Card[] = []; by.forEach((l) => { if (l.length % 2) rest.push(l[l.length - 1]); }); return shuffle(rest); };
function init(): P[] { const d = shuffle(deck52().filter((c) => !(c.r === 11 && c.s === "s"))); // on retire le valet de pique : le valet de trèfle devient l'intrus
  const h: Card[][] = [[], [], []]; d.forEach((c, i) => h[i % 3].push(c)); return [{ name: "me", hand: pairUp(h[0]), out: false }, { name: "cpu1", hand: pairUp(h[1]), out: false }, { name: "cpu2", hand: pairUp(h[2]), out: false }]; }

/** Pouilleux : on se débarrasse des paires, puis chacun pioche une carte au hasard chez son voisin. Celui qui garde le valet de trèfle à la fin est le « pouilleux ». */
export function Pouilleux() {
  const [pl, setPl] = useState(init); const [turn, setTurn] = useState(0); const [msg, setMsg] = useState(""); const scored = useRef(false);
  const active = pl.filter((p) => !p.out).length; const over = active <= 1; const iLose = over && pl.findIndex((p) => !p.out) === 0;
  const next = (from: number, arr: P[]) => { let i = (from + 1) % 3; while (arr[i].out) i = (i + 1) % 3; return i; };
  const settle = (arr: P[]): P[] => arr.map((p) => (p.hand.length === 0 && !p.out ? { ...p, out: true } : p));
  const draw = (who: number, idx: number | null) => {
    const arr = pl.map((p) => ({ ...p, hand: [...p.hand] })); const from = next(who, arr);
    const j = idx ?? Math.floor(Math.random() * arr[from].hand.length); const [c] = arr[from].hand.splice(j, 1); arr[who].hand.push(c);
    arr[who].hand = pairUp(arr[who].hand); const done = settle(arr);
    setMsg(who === 0 ? t("Tu as pioché une carte.") : t("L'ordinateur a pioché chez {n}.", { n: from === 0 ? t("toi") : t("l'autre joueur") }));
    setPl(done); setTurn(done.filter((p) => !p.out).length > 1 ? next(who, done) : who);
  };
  useEffect(() => { if (over || turn === 0 || pl[turn].out) return; const id = setTimeout(() => draw(turn, null), 900); return () => clearTimeout(id); }, [turn, over]); // eslint-disable-line
  useEffect(() => { if (over && !iLose && !scored.current) { scored.current = true; win(3); } }, [over, iLose]);
  const again = () => { scored.current = false; setPl(init()); setTurn(0); setMsg(""); };
  const myTurn = turn === 0 && !over && !pl[0].out;
  const target = next(0, pl);
  const status = over ? (iLose ? t("Tu gardes le valet de trèfle : tu es le pouilleux !") : t("🏆 Bravo, tu n'es pas le pouilleux ! (+3 points)")) : pl[0].out ? t("Tu n'as plus de cartes : tu es sauvé !") : myTurn ? t("À toi : pioche une carte cachée chez {n}.", { n: target === 1 ? t("l'ordinateur 1") : t("l'ordinateur 2") }) : (msg ? msg + " " : "") + t("L'ordinateur réfléchit…");
  return (
    <GameShell status={status.trim()} over={over} onAgain={again}>
      {[1, 2].map((k) => <div key={k} className="col" style={{ alignItems: "center", gap: 4, width: "100%" }}><b className="small">{t("Ordinateur {n}", { n: k })}{pl[k].out ? " ✓" : ""}</b>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 4 }}>{pl[k].hand.map((_, i) => <PlayCard key={i} down w={32} onClick={myTurn && target === k ? () => draw(0, i) : undefined} label={t("Carte cachée")} />)}</div></div>)}
      <b className="small">{t("Toi")}</b>
      <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 4 }}>{pl[0].hand.map((c, i) => <PlayCard key={i} c={c} w={46} />)}</div>
    </GameShell>
  );
}
