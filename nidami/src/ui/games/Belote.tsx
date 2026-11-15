import { useEffect, useMemo, useRef, useState } from "react";
import { t } from "../../i18n";
import { Fan, PlayCard, SUITS, SYM, shuffle, suitColor, type Card, type Suit } from "./cards";
import { GameShell, win } from "./shell";
import { Rules } from "./Rules";

const RANKS = [7, 8, 9, 10, 11, 12, 13, 1];
const TORD = [11, 9, 1, 10, 13, 12, 8, 7]; const PORD = [1, 10, 13, 12, 11, 9, 8, 7];
const TPTS: Record<number, number> = { 11: 20, 9: 14, 1: 11, 10: 10, 13: 4, 12: 3, 8: 0, 7: 0 }; const PPTS: Record<number, number> = { 1: 11, 10: 10, 13: 4, 12: 3, 11: 2, 9: 0, 8: 0, 7: 0 };
const pts = (c: Card, tr: Suit) => (c.s === tr ? TPTS[c.r] : PPTS[c.r]);
const order = (c: Card, tr: Suit) => (c.s === tr ? TORD : PORD).indexOf(c.r);
const same = (a: Card, b: Card) => a.r === b.r && a.s === b.s;
type Play = { seat: number; card: Card };
type G = {
  hands: Card[][]; turned: Card; stock: Card[]; dealer: number; phase: "bid1" | "bid2" | "play" | "end"; bidder: number; trump: Suit | null; taker: number;
  trick: Play[]; turn: number; won: [number, number]; tricks: [number, number]; belote: number; bel: [number, number]; msg: string; last: Play[];
};
const team = (s: number) => s % 2;
function deal(dealer: number): G {
  const d = shuffle(SUITS.flatMap((s) => RANKS.map((r) => ({ r, s })))); const hands = [0, 1, 2, 3].map((i) => d.slice(i * 5, i * 5 + 5));
  return { hands, turned: d[20], stock: d.slice(21), dealer, phase: "bid1", bidder: (dealer + 1) % 4, trump: null, taker: -1, trick: [], turn: (dealer + 1) % 4, won: [0, 0], tricks: [0, 0], belote: -1, bel: [0, 0], msg: "", last: [] };
}
function take(g: G, seat: number, trump: Suit): G {
  const hands = g.hands.map((h) => [...h]); const st = [...g.stock]; hands[seat].push(g.turned);
  for (let k = 0; k < 4; k++) { const i = (g.dealer + 1 + k) % 4; const n = i === seat ? 2 : 3; for (let j = 0; j < n; j++) hands[i].push(st.pop()!); }
  const belote = hands.findIndex((h) => h.some((c) => c.s === trump && c.r === 13) && h.some((c) => c.s === trump && c.r === 12));
  return { ...g, hands, stock: st, trump, taker: seat, phase: "play", belote, trick: [], turn: (g.dealer + 1) % 4, msg: "" };
}
function winner(trick: Play[], tr: Suit): Play {
  const led = trick[0].card.s; const cand = trick.filter((p) => p.card.s === tr); const pool = cand.length ? cand : trick.filter((p) => p.card.s === led);
  return pool.reduce((b, p) => (order(p.card, tr) < order(b.card, tr) ? p : b));
}
function legal(hand: Card[], trick: Play[], tr: Suit, seat: number): Card[] {
  if (!trick.length) return hand; const led = trick[0].card.s; const suit = hand.filter((c) => c.s === led);
  const top = winner(trick, tr);
  if (suit.length) { if (led === tr) { const hi = suit.filter((c) => order(c, tr) < order(top.card, tr)); return hi.length ? hi : suit; } return suit; }
  if (team(top.seat) === team(seat)) return hand;
  const trs = hand.filter((c) => c.s === tr); if (!trs.length) return hand;
  if (top.card.s === tr) { const hi = trs.filter((c) => order(c, tr) < order(top.card, tr)); return hi.length ? hi : trs; }
  return trs;
}
const handScore = (h: Card[], s: Suit) => h.reduce((a, c) => a + (c.s === s ? TPTS[c.r] + (c.r === 11 || c.r === 9 ? 2 : 0) : c.r === 1 ? 6 : 0), 0) + (h.filter((c) => c.s === s).length >= 3 ? 6 : 0);
function cpuPick(g: G, seat: number): Card {
  const tr = g.trump!; const L = legal(g.hands[seat], g.trick, tr, seat); if (L.length === 1) return L[0];
  const cheap = (a: Card, b: Card) => pts(a, tr) - pts(b, tr) || order(b, tr) - order(a, tr);
  if (!g.trick.length) {
    const mine = team(seat) === team(g.taker);
    if (mine) { const t2 = L.filter((c) => c.s === tr).sort((a, b) => order(a, tr) - order(b, tr)); if (t2.length && (t2[0].r === 11 || t2.length >= 3)) return t2[0]; }
    const aces = L.filter((c) => c.r === 1 && c.s !== tr); if (aces.length) return aces[0];
    const pl = L.filter((c) => c.s !== tr); return [...(pl.length ? pl : L)].sort(cheap)[0];
  }
  const top = winner(g.trick, tr); const partner = team(top.seat) === team(seat);
  if (partner) { const nt = L.filter((c) => c.s !== tr); return [...(nt.length ? nt : L)].sort((a, b) => pts(b, tr) - pts(a, tr))[0]; }
  const beats = L.filter((c) => { const t3 = [...g.trick, { seat, card: c }]; return winner(t3, tr).seat === seat; });
  if (beats.length) return [...beats].sort((a, b) => order(b, tr) - order(a, tr))[0];
  return [...L].sort(cheap)[0];
}
/** Belote classique à 4 (toi + ton partenaire contre 2 adversaires) : 32 cartes, prise au retourné puis à la couleur de son choix, atout, belote-rebelote, dix de der, capot. */
export function Belote() {
  const [g, setG] = useState(() => deal(Math.floor(Math.random() * 4))); const scored = useRef(false);
  const mine = g.turn === 0;
  useEffect(() => { // enchères des ordinateurs
    if ((g.phase !== "bid1" && g.phase !== "bid2") || g.bidder === 0) return;
    const id = setTimeout(() => setG((p) => {
      if ((p.phase !== "bid1" && p.phase !== "bid2") || p.bidder === 0) return p;
      const h = p.hands[p.bidder];
      if (p.phase === "bid1") { if (handScore([...h, p.turned], p.turned.s) >= 44) return take({ ...p, msg: "" }, p.bidder, p.turned.s); }
      else { const best = SUITS.filter((s) => s !== p.turned.s).map((s) => ({ s, v: handScore(h, s) })).sort((a, b) => b.v - a.v)[0]; if (best.v >= 38) return take(p, p.bidder, best.s); }
      return nextBid(p);
    }), 900);
    return () => clearTimeout(id);
  }, [g.phase, g.bidder]);
  useEffect(() => { // jeu des ordinateurs
    if (g.phase !== "play" || g.trick.length >= 4 || g.turn === 0) return;
    const id = setTimeout(() => setG((p) => (p.phase === "play" && p.turn !== 0 && p.trick.length < 4 ? playCard(p, p.turn, cpuPick(p, p.turn)) : p)), 850);
    return () => clearTimeout(id);
  }, [g.phase, g.turn, g.trick.length]);
  useEffect(() => { // fin de pli
    if (g.phase !== "play" || g.trick.length < 4) return;
    const id = setTimeout(() => setG((p) => (p.trick.length === 4 ? endTrick(p) : p)), 1300);
    return () => clearTimeout(id);
  }, [g.phase, g.trick.length]);
  const res = useMemo(() => (g.phase === "end" ? result(g) : null), [g]);
  useEffect(() => { if (res && res.iWin && !scored.current) { scored.current = true; win(4); } }, [res]);
  const L = g.phase === "play" && mine && g.trick.length < 4 ? legal(g.hands[0], g.trick, g.trump!, 0) : [];
  const names = [t("Toi"), t("Adversaire de gauche"), t("Partenaire"), t("Adversaire de droite")];
  const status = g.phase === "bid1" ? (g.bidder === 0 ? t("À toi : prends-tu à {n} ?", { n: SYM[g.turned.s] }) : t("{n} réfléchit…", { n: names[g.bidder] }))
    : g.phase === "bid2" ? (g.bidder === 0 ? t("À toi : choisis un atout ou passe.") : t("{n} réfléchit…", { n: names[g.bidder] }))
    : g.phase === "play" ? (g.msg ? g.msg + " " : "") + (mine && g.trick.length < 4 ? t("À toi de jouer.") : t("{n} réfléchit…", { n: names[g.turn] }))
    : res ? res.text : "";
  const again = () => { scored.current = false; setG(deal((g.dealer + 1) % 4)); };
  const bid = (s: Suit | null) => setG((p) => (s ? take(p, 0, s) : nextBid(p)));
  const tap = (c: Card) => { if (L.some((x) => same(x, c))) setG((p) => playCard(p, 0, c)); };
  return (
    <GameShell felt status={status.trim()} over={g.phase === "end"} onAgain={again}>
      <div className="small muted" aria-live="polite">{g.trump ? <>{t("Atout")} <b style={{ color: suitColor(g.trump), fontSize: 18 }}>{SYM[g.trump]}</b> · {t("Preneur")} : {names[g.taker]} · </> : null}{t("Nous")} {g.won[0]} · {t("Eux")} {g.won[1]}</div>
      <div style={{ display: "flex", gap: 8, width: "100%", justifyContent: "space-around", alignItems: "flex-start" }}>
        {[1, 2, 3].map((s) => <div key={s} className="col small" style={{ alignItems: "center", gap: 2 }}><b>{names[s]}</b><span className="muted">{t("{n} cartes", { n: g.hands[s].length })}</span></div>)}
      </div>
      {(g.phase === "bid1" || g.phase === "bid2") && <div className="row" style={{ gap: 10, alignItems: "center" }}>{g.phase === "bid1" && <PlayCard c={g.turned} w={50} />}</div>}
      {g.phase === "play" || g.phase === "end" ? <div style={{ display: "flex", gap: 6, minHeight: 74, justifyContent: "center" }}>{g.trick.map((p) => <div key={p.seat} className="col small" style={{ alignItems: "center", gap: 2 }}><PlayCard c={p.card} w={44} /><span className="muted">{names[p.seat]}</span></div>)}</div> : null}
      {g.phase === "bid1" && g.bidder === 0 && <div className="row" style={{ gap: 8 }}><button type="button" className="btn" onClick={() => bid(g.turned.s)}>{t("Je prends")}</button><button type="button" className="btn ghost" onClick={() => bid(null)}>{t("Je passe")}</button></div>}
      {g.phase === "bid2" && g.bidder === 0 && <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>{SUITS.filter((s) => s !== g.turned.s).map((s) => <button key={s} type="button" className="btn ghost" aria-label={SYM[s]} style={{ fontSize: 24, color: suitColor(s) }} onClick={() => bid(s)}>{SYM[s]}</button>)}<button type="button" className="btn ghost" onClick={() => bid(null)}>{t("Je passe")}</button></div>}
      <Fan w={48} items={[...g.hands[0]].sort((a, b) => SUITS.indexOf(a.s) - SUITS.indexOf(b.s) || (g.trump ? order(a, g.trump) - order(b, g.trump) : PORD.indexOf(a.r) - PORD.indexOf(b.r))).map((c, i) => <PlayCard key={i} c={c} w={48} dim={g.phase === "play" && mine && !L.some((x) => same(x, c))} onClick={g.phase === "play" ? () => tap(c) : undefined} />)} />
      <Rules text={t("Belote à 4 : toi et ton partenaire (en face) contre les 2 adversaires. 32 cartes, 8 par joueur.\nPrise : on retourne une carte. Chacun à son tour peut la prendre (sa couleur devient l'atout). Si personne ne la prend, un deuxième tour permet de choisir une autre couleur. Si tout le monde passe, on redonne.\nAtout : Valet 20, 9 14, As 11, 10 10, Roi 4, Dame 3. Autres couleurs : As 11, 10 10, Roi 4, Dame 3, Valet 2.\nIl faut fournir la couleur demandée ; sinon couper à l'atout (monter si possible), sauf si ton partenaire est maître. À l'atout, il faut monter si on peut.\nBelote-rebelote : Roi + Dame d'atout = 20 points. Dix de der : +10 au dernier pli. Capot (tous les plis) : +90.\nLe preneur doit marquer plus que les adversaires, sinon il est « dedans » : les adversaires marquent 162.")} />
    </GameShell>
  );
}
function nextBid(p: G): G {
  const nb = (p.bidder + 1) % 4;
  if (nb === (p.dealer + 1) % 4) { if (p.phase === "bid1") return { ...p, phase: "bid2", bidder: nb, turn: nb, msg: "" }; return { ...deal((p.dealer + 1) % 4), msg: "" }; }
  return { ...p, bidder: nb };
}
function playCard(p: G, seat: number, c: Card): G {
  const hands = p.hands.map((h, i) => (i === seat ? h.filter((x) => !same(x, c)) : h)); const tr = p.trump!; let msg = "";
  let bel = p.bel; if (p.belote === seat && c.s === tr && (c.r === 13 || c.r === 12)) { const other = p.hands[seat].some((x) => x.s === tr && x.r === (c.r === 13 ? 12 : 13)); msg = other ? t("Belote !") : t("Rebelote ! (+20)"); if (!other) { bel = [...p.bel] as [number, number]; bel[team(seat)] += 20; } }
  return { ...p, hands, trick: [...p.trick, { seat, card: c }], turn: (seat + 1) % 4, bel, msg };
}
function endTrick(p: G): G {
  const tr = p.trump!; const w = winner(p.trick, tr); const gain = p.trick.reduce((a, x) => a + pts(x.card, tr), 0); const lastTrick = p.hands[0].length === 0;
  const won = [...p.won] as [number, number]; won[team(w.seat)] += gain + (lastTrick ? 10 : 0); const tricks = [...p.tricks] as [number, number]; tricks[team(w.seat)]++;
  const n: G = { ...p, won, tricks, last: p.trick, trick: [], turn: w.seat, msg: lastTrick ? t("Dix de der : +10") : "" };
  return lastTrick ? { ...n, phase: "end" } : n;
}
function result(g: G): { text: string; iWin: boolean } {
  const tk = team(g.taker); let sc: [number, number] = [g.won[0] + g.bel[0], g.won[1] + g.bel[1]];
  const capot = g.tricks[tk] === 8; const capotDef = g.tricks[1 - tk] === 8;
  if (capot) sc[tk] += 90;
  let inside = false;
  if (!capot && sc[tk] <= sc[1 - tk]) { inside = true; const bel = [...g.bel]; sc = [0, 0]; sc[1 - tk] = 162 + bel[1 - tk]; sc[tk] = bel[tk]; }
  void capotDef;
  const iWin = sc[0] > sc[1];
  const base = t("Nous {a} · Eux {b}", { a: sc[0], b: sc[1] }) + (inside ? " · " + t("Le preneur est dedans !") : capot ? " · " + t("Capot !") : "");
  return { iWin, text: (iWin ? t("🏆 Bravo, vous avez gagné ! (+4 points)") : t("Vous avez perdu cette donne.")) + " " + base };
}
