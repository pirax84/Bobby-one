import { useEffect, useMemo, useRef, useState } from "react";
import { t } from "../../i18n";
import { CardCore, Fan, SUITS, SYM, inkOf, shuffle, suitColor, type Suit } from "./cards";
import { useLook, useLookCtx } from "./cardlook";
import { GameShell, win } from "./shell";
import { Rules } from "./Rules";

type TC = { s: Suit | "t" | "x"; r: number }; // s : couleur, "t" atout (1-21), "x" excuse
const same = (a: TC, b: TC) => a.s === b.s && a.r === b.r;
const isOud = (c: TC) => c.s === "x" || (c.s === "t" && (c.r === 1 || c.r === 21));
const u = (c: TC) => (isOud(c) ? 9 : c.s !== "t" && c.s !== "x" ? (c.r === 14 ? 9 : c.r === 13 ? 7 : c.r === 12 ? 5 : c.r === 11 ? 3 : 1) : 1);
const lab = (c: TC) => (c.s === "x" ? "★" : c.s === "t" ? String(c.r) : c.r === 14 ? "R" : c.r === 13 ? "D" : c.r === 12 ? "C" : c.r === 11 ? "V" : String(c.r));
const BIDS = ["", "Petite", "Garde", "Garde sans", "Garde contre"]; const MULT = [0, 1, 2, 4, 6];
const NEED = [56, 51, 41, 36];
type Play = { seat: number; card: TC };
type G = {
  hands: TC[][]; chien: TC[]; dealer: number; phase: "bid" | "chien" | "play" | "end"; bidder: number; best: number; taker: number; bids: number[]; trick: Play[]; turn: number;
  pile: [TC[], TC[]]; adj: [number, number]; tricks: [number, number]; ecart: TC[]; pog: { seat: number; v: number } | null; petit: number; msg: string; n: number; xseat: number;
};
const side = (g: { taker: number }, seat: number) => (seat === g.taker ? 0 : 1);
function deal(dealer: number): G {
  const d: TC[] = [{ s: "x", r: 0 }]; for (let r = 1; r <= 21; r++) d.push({ s: "t", r }); for (const s of SUITS) for (let r = 1; r <= 14; r++) d.push({ s, r });
  const sh = shuffle(d); const hands = [0, 1, 2, 3].map((i) => sh.slice(i * 18, i * 18 + 18)); const first = (dealer + 1) % 4;
  return { hands, chien: sh.slice(72), dealer, phase: "bid", bidder: first, best: 0, taker: -1, bids: [-1, -1, -1, -1], trick: [], turn: first, pile: [[], []], adj: [0, 0], tricks: [0, 0], ecart: [], pog: null, petit: -1, msg: "", n: 0, xseat: -1 };
}
function winnerOf(trick: Play[]): Play {
  const cs = trick.filter((p) => p.card.s !== "x"); const led = cs[0].card.s; const tr = cs.filter((p) => p.card.s === "t");
  const pool = tr.length ? tr : cs.filter((p) => p.card.s === led); return pool.reduce((b, p) => (p.card.r > b.card.r ? p : b));
}
function legal(hand: TC[], trick: Play[]): TC[] {
  const ex = hand.filter((c) => c.s === "x"); const cs = trick.filter((p) => p.card.s !== "x");
  if (!cs.length) return hand;
  const led = cs[0].card.s; const best = winnerOf(trick); const topT = Math.max(0, ...cs.filter((p) => p.card.s === "t").map((p) => p.card.r));
  const suit = hand.filter((c) => c.s === led); const trs = hand.filter((c) => c.s === "t");
  if (led === "t") { if (!trs.length) return hand; const hi = trs.filter((c) => c.r > topT); return [...(hi.length ? hi : trs), ...ex]; }
  void best;
  if (suit.length) return [...suit, ...ex];
  if (trs.length) { const hi = trs.filter((c) => c.r > topT); return [...(hi.length ? hi : trs), ...ex]; }
  return hand;
}
const strength = (h: TC[]) => h.filter((c) => c.s === "t").length * 1.2 + h.filter((c) => c.s === "t" && c.r >= 15).length * 2 + h.filter(isOud).length * 4 + h.filter((c) => c.s !== "t" && c.s !== "x" && c.r === 14).length * 2 + h.filter((c) => c.s !== "t" && c.s !== "x" && c.r === 13).length;
function ecartFor(hand: TC[], hidden = false): TC[] { // choix de l'écart (6 cartes)
  void hidden;
  const ok = (c: TC) => c.s !== "t" && c.s !== "x" && c.r !== 14; const cnt: Record<string, number> = {}; hand.forEach((c) => { if (ok(c)) cnt[c.s] = (cnt[c.s] || 0) + 1; });
  let pool = hand.filter(ok); if (pool.length < 6) pool = [...pool, ...hand.filter((c) => c.s === "t" && !isOud(c)).sort((a, b) => a.r - b.r)];
  return pool.sort((a, b) => (a.s === "t" ? 1 : 0) - (b.s === "t" ? 1 : 0) || u(a) - u(b) || (cnt[a.s] || 0) - (cnt[b.s] || 0)).slice(0, 6);
}
function cpuPick(g: G, seat: number): TC {
  const h = g.hands[seat]; const L = legal(h, g.trick); if (L.length === 1) return L[0];
  const tk = seat === g.taker; const nx = L.filter((c) => c.s !== "x"); const pool = nx.length ? nx : L;
  const low = (a: TC, b: TC) => u(a) - u(b) || (a.s === "t" ? 1 : 0) - (b.s === "t" ? 1 : 0) || a.r - b.r;
  if (!g.trick.length) {
    const trs = pool.filter((c) => c.s === "t").sort((a, b) => b.r - a.r);
    if (tk && trs.length >= 5) return trs.find((c) => c.r !== 1) || trs[0];
    const kings = pool.filter((c) => c.s !== "t" && c.r === 14); if (kings.length) return kings[0];
    const cnt: Record<string, number> = {}; h.forEach((c) => { cnt[c.s] = (cnt[c.s] || 0) + 1; });
    const ns = pool.filter((c) => c.s !== "t").sort((a, b) => (cnt[a.s] || 0) - (cnt[b.s] || 0) || a.r - b.r); if (ns.length) return ns[0];
    return [...pool].sort((a, b) => a.r - b.r).find((c) => c.r !== 1) || pool[0];
  }
  const w = winnerOf(g.trick); const mate = side(g, w.seat) === side(g, seat); const gain = g.trick.reduce((a, p) => a + u(p.card), 0);
  if (mate) { const give = pool.filter((c) => !isOud(c)).sort((a, b) => u(b) - u(a)); return give.length ? give[0] : [...pool].sort(low)[0]; }
  const wins = pool.filter((c) => winnerOf([...g.trick, { seat, card: c }]).seat === seat).sort((a, b) => (a.s === "t" ? 1 : 0) - (b.s === "t" ? 1 : 0) || a.r - b.r);
  if (wins.length && (gain >= 5 || g.trick.length === 3 || !wins[0].s.includes("t"))) return wins[0];
  const ex = L.find((c) => c.s === "x"); const dump = [...pool].filter((c) => !isOud(c)).sort(low);
  if (ex && (!dump.length || u(dump[0]) >= 5)) return ex;
  return dump.length ? dump[0] : [...pool].sort(low)[0];
}
function play(g: G, seat: number, c: TC): G {
  const hands = g.hands.map((h, i) => (i === seat ? h.filter((x) => !same(x, c)) : h)); let pog = g.pog; let msg = "";
  if (g.hands[seat].length === 18 && !pog) { const n = g.hands[seat].filter((x) => x.s === "t").length; if (n >= 10) { const v = n >= 15 ? 40 : n >= 13 ? 30 : 20; pog = { seat, v }; msg = t("Poignée annoncée ({n} atouts) : +{v}", { n, v }); } }
  return { ...g, hands, trick: [...g.trick, { seat, card: c }], turn: (seat + 1) % 4, pog, msg, xseat: c.s === "x" ? seat : g.xseat };
}
function endTrick(g: G): G {
  const w = winnerOf(g.trick); const ws = side(g, w.seat); const last = g.hands[0].length === 0;
  const pile: [TC[], TC[]] = [[...g.pile[0]], [...g.pile[1]]]; const adj = [...g.adj] as [number, number]; const exP = g.trick.find((p) => p.card.s === "x");
  for (const p of g.trick) { if (p.card.s === "x" && !last) continue; pile[ws].push(p.card); }
  if (exP && !last) { const os = side(g, exP.seat); pile[os].push(exP.card); if (os !== ws) { adj[ws] += 1; adj[os] -= 1; } }
  const tricks = [...g.tricks] as [number, number]; tricks[ws]++;
  let petit = g.petit; if (last) { const pp = g.trick.find((p) => p.card.s === "t" && p.card.r === 1); if (pp && side(g, pp.seat) === ws) petit = ws; }
  const n: G = { ...g, pile, adj, tricks, trick: [], turn: w.seat, petit, msg: "", n: g.n + 1 };
  return last ? { ...n, phase: "end" } : n;
}
function result(g: G) {
  const mult = MULT[g.best]; let tp = g.pile[0].reduce((a, c) => a + u(c), 0) + g.adj[0]; const bouts = g.pile[0].filter(isOud).length;
  tp += g.ecart.reduce((a, c) => a + u(c), 0) * (g.best === 4 ? 0 : 1); // l'écart compte pour le preneur
  const need = NEED[bouts] * 2; const diff = tp - need; const ok = diff >= 0; const d = Math.round(Math.abs(diff) / 2);
  let raw = (25 + d) * mult * (ok ? 1 : -1);
  if (g.petit >= 0) raw += (g.petit === 0 ? 1 : -1) * 10 * mult;
  if (g.pog) raw += (ok ? 1 : -1) * g.pog.v;
  if (g.tricks[0] === 18) raw += 200;
  const iTake = g.taker === 0; const mine = iTake ? 3 * raw : -raw; const iWin = iTake ? raw > 0 : raw < 0;
  return { ok, bouts, tp: tp / 2, need: need / 2, mine, iWin };
}

function TCard({ c, w = 38, sel, dim, onClick, label }: { c?: TC; w?: number; sel?: boolean; dim?: boolean; onClick?: () => void; label?: string }) {
  const { look } = useLookCtx(); const isS = !!c && c.s !== "t" && c.s !== "x";
  const aria = label || (!c ? "?" : c.s === "x" ? t("Excuse") : c.s === "t" ? t("Atout {n}", { n: c.r }) : lab(c) + SYM[c.s as Suit]);
  return <CardCore w={w} hRatio={1.5} face={look.face} backN={look.back} four={look.four} down={!c} corner={c ? (c.s === "x" ? "★" : lab(c)) : ""} sym={isS ? SYM[c!.s as Suit] : ""} ink={!c ? undefined : isS ? inkOf(c.s as Suit, c.r, look.face, look.four) : look.face === "C" ? "#C9B8FF" : "#3B2F7A"} onClick={onClick} dim={dim} sel={sel} label={aria} />;
}

/** Tarot français à 4 : 78 cartes, enchères (petite, garde, garde sans, garde contre), chien et écart, Excuse, poignée, petit au bout. */
export function Tarot() {
  const [g, setG] = useState(() => deal(Math.floor(Math.random() * 4))); const scored = useRef(false); const [sel, setSel] = useState<TC[]>([]);
  const lk = useLook("tarot");
  const names = [t("Toi"), t("Joueur de gauche"), t("Joueur en face"), t("Joueur de droite")];
  useEffect(() => {
    if (g.phase !== "bid" || g.bidder === 0) return;
    const id = setTimeout(() => setG((p) => (p.phase === "bid" && p.bidder !== 0 ? nextBid(p, p.bidder, cpuBid(p)) : p)), 800);
    return () => clearTimeout(id);
  }, [g.phase, g.bidder]);
  useEffect(() => {
    if (g.phase !== "chien" || g.taker === 0) return;
    const id = setTimeout(() => setG((p) => (p.phase === "chien" && p.taker !== 0 ? startPlay(p, p.taker, ecartFor([...p.hands[p.taker], ...p.chien])) : p)), 1800);
    return () => clearTimeout(id);
  }, [g.phase, g.taker]);
  useEffect(() => {
    if (g.phase !== "play" || g.trick.length >= 4 || g.turn === 0) return;
    const id = setTimeout(() => setG((p) => (p.phase === "play" && p.turn !== 0 && p.trick.length < 4 ? play(p, p.turn, cpuPick(p, p.turn)) : p)), 800);
    return () => clearTimeout(id);
  }, [g.phase, g.turn, g.trick.length]);
  useEffect(() => {
    if (g.phase !== "play" || g.trick.length < 4) return;
    const id = setTimeout(() => setG((p) => (p.trick.length === 4 ? endTrick(p) : p)), 1300);
    return () => clearTimeout(id);
  }, [g.phase, g.trick.length]);
  const res = useMemo(() => (g.phase === "end" ? result(g) : null), [g]);
  useEffect(() => { if (res && res.iWin && !scored.current) { scored.current = true; win(5); } }, [res]);
  const mine = g.turn === 0 && g.phase === "play" && g.trick.length < 4; const L = mine ? legal(g.hands[0], g.trick) : [];
  const all0 = g.phase === "chien" && g.taker === 0 ? [...g.hands[0], ...g.chien] : g.hands[0];
  const nonT = all0.filter((c) => c.s !== "t" && c.s !== "x" && c.r !== 14).length; const canPick = (c: TC) => !isOud(c) && c.r !== 14 || false;
  const pickable = (c: TC) => (c.s === "x" || c.r === 14 && c.s !== "t" ? false : c.s === "t" ? !isOud(c) && nonT < 6 : true);
  void canPick;
  const status = g.phase === "bid" ? (g.bidder === 0 ? t("À toi : choisis ton enchère ou passe.") : t("{n} réfléchit…", { n: names[g.bidder] }) + (g.best ? " · " + t(BIDS[g.best]) : ""))
    : g.phase === "chien" ? (g.taker === 0 ? t("Tu as pris : écarte 6 cartes (ni Roi, ni bout, atouts seulement si tu n'as pas le choix).") : t("{n} prend avec « {b} » et fait son écart…", { n: names[g.taker], b: t(BIDS[g.best]) }))
    : g.phase === "play" ? (g.msg ? g.msg + " " : "") + (mine ? t("À toi de jouer.") : t("{n} réfléchit…", { n: names[g.turn] }))
    : res ? (res.iWin ? t("🏆 Bravo, tu as gagné ! (+5 points)") : t("Tu as perdu cette donne.")) + " " + t("Le preneur a {a} points avec {b} bout(s) (il en fallait {c}). Ta marque : {m}", { a: res.tp, b: res.bouts, c: res.need, m: res.mine }) : "";
  const again = () => { scored.current = false; setSel([]); setG(deal((g.dealer + 1) % 4)); };
  const bid = (b: number) => setG((p) => nextBid(p, 0, b));
  const toggle = (c: TC) => setSel((s) => (s.some((x) => same(x, c)) ? s.filter((x) => !same(x, c)) : s.length < 6 ? [...s, c] : s));
  const sorted = (h: TC[]) => [...h].sort((a, b) => ["x", "t", ...SUITS].indexOf(a.s) - ["x", "t", ...SUITS].indexOf(b.s) || a.r - b.r);
  const showChien = g.phase === "chien" && g.best <= 2;
  return (
    <GameShell felt game="tarot" status={status.trim()} over={g.phase === "end"} onAgain={again}>
      {g.phase !== "bid" && <div className="small muted">{t("Preneur")} : {names[g.taker]} · {t(BIDS[g.best])}{g.phase === "play" ? ` · ${t("Plis")} ${g.tricks[0]} / ${g.tricks[1]}` : ""}</div>}
      <div style={{ display: "flex", gap: 8, width: "100%", justifyContent: "space-around" }}>{[1, 2, 3].map((s) => <div key={s} className="col small" style={{ alignItems: "center", gap: 2 }}><b>{names[s]}</b><span className="muted">{g.phase === "bid" && g.bids[s] >= 0 ? (g.bids[s] ? t(BIDS[g.bids[s]]) : t("Passe")) : t("{n} cartes", { n: g.hands[s].length })}</span></div>)}</div>
      {showChien && <div className="col" style={{ alignItems: "center", gap: 4 }}><b className="small">{t("Chien")}</b><div style={{ display: "flex", gap: 3 }}>{g.chien.map((c, i) => <TCard key={i} c={c} w={32} />)}</div></div>}
      {g.phase === "play" || g.phase === "end" ? <div style={{ display: "flex", gap: 6, minHeight: 80, justifyContent: "center" }}>{g.trick.map((p) => <div key={p.seat} className="col small" style={{ alignItems: "center", gap: 2 }}><TCard c={p.card} w={40} /><span className="muted">{names[p.seat]}</span></div>)}</div> : null}
      {g.phase === "bid" && g.bidder === 0 && <div className="row" style={{ gap: 6, flexWrap: "wrap", justifyContent: "center" }}><button type="button" className="btn ghost" onClick={() => bid(0)}>{t("Passe")}</button>{[1, 2, 3, 4].map((b) => <button key={b} type="button" className="btn" disabled={b <= g.best} onClick={() => bid(b)}>{t(BIDS[b])}</button>)}</div>}
      {g.phase === "chien" && g.taker === 0 && <div className="row" style={{ gap: 8, alignItems: "center" }}><span className="small">{t("Écart : {n} / 6", { n: sel.length })}</span><button type="button" className="btn" disabled={sel.length !== 6} onClick={() => { setG((p) => startPlay(p, 0, sel)); setSel([]); }}>{t("Écarter")}</button></div>}
      <Fan w={38} max={272} items={sorted(all0).map((c) => {
        const inChien = g.phase === "chien" && g.taker === 0;
        return { k: c.s + c.r, s: ["x", "t", ...SUITS].indexOf(c.s), r: c.r, g: lk.aid && c.s === "t" && all0.filter((x) => x.s === "t").length >= 10 ? 0 : undefined, gl: t("Poignée"), node: <TCard c={c} w={38} sel={sel.some((x) => same(x, c))} dim={inChien ? !pickable(c) : mine && !L.some((x) => same(x, c))} onClick={inChien ? (pickable(c) ? () => toggle(c) : undefined) : mine && L.some((x) => same(x, c)) ? () => setG((p) => play(p, 0, c)) : undefined} /> };
      })} />
      <Rules text={t("Tarot à 4 : 78 cartes (56 de couleur, 21 atouts, l'Excuse). Chacun reçoit 18 cartes, 6 forment le chien.\nEnchères : Passe, Petite, Garde, Garde sans (le chien n'est pas vu), Garde contre (le chien va aux défenseurs). Le preneur joue seul contre trois.\nAvec Petite ou Garde, le preneur prend le chien puis écarte 6 cartes (ni Roi, ni bout ; atouts seulement si nécessaire).\nIl faut fournir la couleur demandée ; sinon couper à l'atout (monter si possible). À l'atout, on monte si on peut. L'Excuse se joue quand on veut et ne gagne jamais le pli.\nLes bouts sont le 21, le 1 (petit) et l'Excuse. Points à faire : 56 avec 0 bout, 51 avec 1, 41 avec 2, 36 avec 3.\nBonus : petit au bout (le 1 gagne le dernier pli), poignée (10, 13 ou 15 atouts : 20, 30, 40), chelem (tous les plis : +200).")} />
    </GameShell>
  );
}
function cpuBid(g: G): number { const s = strength(g.hands[g.bidder]); const b = s >= 38 ? 3 : s >= 31 ? 2 : s >= 25 ? 1 : 0; return b > g.best ? b : 0; }
function nextBid(p: G, seat: number, b: number): G {
  const bids = [...p.bids]; bids[seat] = b; const best = b > p.best ? b : p.best; const taker = b > p.best ? seat : p.taker;
  const nb = (seat + 1) % 4; const done = bids.every((x) => x >= 0);
  if (!done) return { ...p, bids, best, taker, bidder: nb, turn: nb };
  if (!best) return deal((p.dealer + 1) % 4);
  // garde sans / contre : le chien n'est pas vu
  if (best >= 3) { const pile: [TC[], TC[]] = [[...p.pile[0]], [...p.pile[1]]]; if (best === 3) pile[0].push(...p.chien); else pile[1].push(...p.chien); const n = { ...p, bids, best, taker, pile, ecart: [] as TC[] }; return { ...n, phase: "play", trick: [], turn: (p.dealer + 1) % 4 }; }
  return { ...p, bids, best, taker, phase: "chien" };
}
function startPlay(p: G, seat: number, ecart: TC[]): G {
  const all = [...p.hands[seat], ...p.chien]; const hand = all.filter((c) => !ecart.some((e) => same(e, c)));
  const hands = p.hands.map((h, i) => (i === seat ? hand : h)); const pile: [TC[], TC[]] = [[...p.pile[0], ...ecart], [...p.pile[1]]];
  return { ...p, hands, pile, ecart: [], phase: "play", turn: (p.dealer + 1) % 4, trick: [] };
}
