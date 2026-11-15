import { useEffect, useRef, useState } from "react";
import { t } from "../../i18n";
import { Fan, PlayCard, SUITS, SYM, deck52, shuffle, suitColor, type Card, type Suit } from "./cards";
import { GameShell, win } from "./shell";
import { Rules } from "./Rules";

type G = { h: [Card[], Card[]]; pile: Card[]; stock: Card[]; turn: 0 | 1; suit: Suit; pend: number; skip: boolean; msg: string; pick: Card | null; drew: boolean };
function init(): G {
  let d = shuffle(deck52());
  const h: [Card[], Card[]] = [d.slice(0, 7), d.slice(7, 14)]; d = d.slice(14);
  let i = d.findIndex((c) => c.r !== 8 && c.r !== 7 && c.r !== 1); if (i < 0) i = 0;
  const top = d[i]; d = d.filter((_, k) => k !== i);
  return { h, pile: [top], stock: d, turn: 0, suit: top.s, pend: 0, skip: false, msg: "", pick: null, drew: false };
}
const ok = (c: Card, g: G) => (g.pend > 0 ? c.r === 7 : c.r === 8 || c.s === g.suit || c.r === g.pile[g.pile.length - 1].r);
function drawN(g: G, who: 0 | 1, n: number): G {
  const x: G = { ...g, h: [[...g.h[0]], [...g.h[1]]], stock: [...g.stock], pile: [...g.pile] };
  for (let k = 0; k < n; k++) {
    if (!x.stock.length) { const top = x.pile.pop()!; x.stock = shuffle(x.pile); x.pile = [top]; }
    if (!x.stock.length) break;
    x.h[who].push(x.stock.pop()!);
  }
  return x;
}
function play(g: G, who: 0 | 1, c: Card, suit?: Suit): G {
  const h: [Card[], Card[]] = [[...g.h[0]], [...g.h[1]]]; const k = h[who].findIndex((z) => z.r === c.r && z.s === c.s); h[who].splice(k, 1);
  const x: G = { ...g, h, pile: [...g.pile, c], suit: c.r === 8 ? suit || c.s : c.s, pick: null, drew: false, msg: "" };
  if (c.r === 7) x.pend = g.pend + 2;
  x.turn = (1 - who) as 0 | 1;
  if (c.r === 1) { x.turn = who; x.skip = true; }
  return x;
}

/** 8 américain (règles courantes) : même couleur ou même valeur ; 8 = joker (choisis la couleur) ; 7 = +2 cumulable ; As = l'autre passe. */
export function Huit() {
  const [g, setG] = useState(init); const scored = useRef(false);
  const over = g.h[0].length === 0 || g.h[1].length === 0; const iWin = g.h[0].length === 0;
  useEffect(() => { if (over && iWin && !scored.current) { scored.current = true; win(4); } }, [over, iWin]);
  useEffect(() => {
    if (g.turn !== 1 || over) return;
    const id = setTimeout(() => setG((p) => {
      if (p.turn !== 1) return p; const hand = p.h[1]; const pl = hand.filter((c) => ok(c, p));
      if (!pl.length) { if (p.pend > 0) return { ...drawN(p, 1, p.pend), pend: 0, turn: 0, msg: t("L'ordinateur pioche {n} cartes.", { n: p.pend }) }; if (p.drew) return { ...p, turn: 0, drew: false, msg: t("L'ordinateur passe son tour.") }; return { ...drawN(p, 1, 1), drew: true, msg: t("L'ordinateur pioche une carte.") }; }
      const few = p.h[0].length <= 2;
      const pri = (c: Card) => (c.r === 8 ? -5 : c.r === 7 ? (few ? 6 : 2) : c.r === 1 ? (few ? 5 : 1) : 3) + hand.filter((z) => z.s === c.s).length * 0.1;
      const c = [...pl].sort((a, b) => pri(b) - pri(a))[0];
      const cnt: Record<string, number> = {}; hand.forEach((z) => { if (z !== c) cnt[z.s] = (cnt[z.s] || 0) + 1; });
      const best = (SUITS.slice().sort((a, b) => (cnt[b] || 0) - (cnt[a] || 0))[0]) as Suit;
      const n = play(p, 1, c, best); n.msg = c.r === 8 ? t("L'ordinateur choisit {n}.", { n: SYM[best] }) : c.r === 1 ? t("Tu passes ton tour.") : "";
      return n;
    }), 950);
    return () => clearTimeout(id);
  }, [g.turn, g.drew, g.skip, g.h, over]);
  useEffect(() => { if (g.skip && !over) { const id = setTimeout(() => setG((p) => ({ ...p, skip: false })), 100); return () => clearTimeout(id); } }, [g.skip, over]);
  const mine = g.turn === 0 && !over; const can = g.h[0].filter((c) => ok(c, g)); const top = g.pile[g.pile.length - 1];
  const tap = (c: Card) => { if (!mine || !ok(c, g)) return; if (c.r === 8) setG({ ...g, pick: c }); else setG(play(g, 0, c)); };
  const drawBtn = () => { if (g.pend > 0) setG({ ...drawN(g, 0, g.pend), pend: 0, turn: 1, msg: t("Tu as pioché une carte.") }); else { const n = drawN(g, 0, 1); const c = n.h[0][n.h[0].length - 1]; setG({ ...n, drew: true, msg: ok(c, n) ? t("Tu as pioché une carte.") : "" }); if (!ok(c, n)) setTimeout(() => setG((p) => ({ ...p, turn: 1, drew: false })), 700); } };
  const status = over ? (iWin ? t("🏆 Bravo, tu as gagné ! (+4 points)") : t("L'ordinateur a gagné cette partie.")) : mine ? (g.pend > 0 ? t("Tu dois piocher {n} cartes ou répondre par un 7.", { n: g.pend }) : can.length ? t("À toi : joue une carte de la même couleur ou valeur.") : t("Tu ne peux pas jouer : pioche une carte.")) : (g.msg ? g.msg + " " : "") + t("L'ordinateur réfléchit…");
  const again = () => { scored.current = false; setG(init()); };
  return (
    <GameShell felt game="huit" status={(g.msg && mine ? g.msg + " " : "") + status} over={over} onAgain={again}>
      <div className="small muted">{t("L'ordinateur a {n} cartes", { n: g.h[1].length })}</div>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <PlayCard down w={50} label={t("Pioche")} />
        <PlayCard c={top} w={56} />
        <b style={{ fontSize: 30, color: suitColor(g.suit) }} aria-label={t("Couleur demandée")}>{SYM[g.suit]}</b>
      </div>
      {g.pick && <div className="row" style={{ gap: 8 }}>{SUITS.map((s) => <button key={s} className="btn ghost" aria-label={SYM[s]} style={{ fontSize: 26, color: suitColor(s) }} onClick={() => setG(play(g, 0, g.pick!, s))}>{SYM[s]}</button>)}</div>}
      {mine && !g.pick && (g.pend > 0 || !can.length) && <button type="button" className="btn" onClick={drawBtn}>{t("Piocher")}</button>}
      <Fan w={52} items={g.h[0].map((c) => ({ k: c.s + c.r, s: SUITS.indexOf(c.s), r: c.r, node: <PlayCard c={c} w={52} dim={mine && !ok(c, g)} onClick={() => tap(c)} /> }))} />
      <Rules text={t("Pose une carte de la même couleur ou de la même valeur que celle du dessus.\n8 : se joue sur tout, tu choisis la couleur.\n7 : l'adversaire pioche 2 cartes (il peut répondre par un autre 7 : +2 de plus).\nAs : l'adversaire passe son tour.\nSi tu ne peux pas jouer, tu pioches une carte. Le premier sans carte gagne.")} />
    </GameShell>
  );
}
