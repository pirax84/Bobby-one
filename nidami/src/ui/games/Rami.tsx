import { useEffect, useMemo, useRef, useState } from "react";
import { t } from "../../i18n";
import { Fan, PlayCard, SUITS, shuffle, type Card, type Suit } from "./cards";
import { GameShell, win } from "./shell";
import { setLook, useLook } from "./cardlook";
import { Rules } from "./Rules";

type RC = Card & { id: number; as?: number };
type Meld = { cards: RC[]; kind: "set" | "run" };
type SM = Meld & { pts: number };
type Mode = "off" | "perso";
type G = { stock: RC[]; disc: RC[]; bottom: RC | null; hand: [RC[], RC[]]; melds: Meld[]; opened: [boolean, boolean]; sm: SM[]; turn: 0 | 1; phase: "draw" | "play"; msg: string; over: 0 | 1 | null; turns: [number, number]; took: boolean; mode: Mode };

const rv = (r: number) => (r === 1 ? 11 : r >= 10 ? 10 : r);
const pv = (p: number) => (p === 14 ? 11 : p >= 10 ? 10 : p);
/** Vérifie qu'un groupe de cartes forme un brelan/carré ou une suite (As haut ou bas, jamais en boucle) ; renvoie la combinaison rangée et sa valeur. */
function check(cards: RC[]): (Meld & { pts: number }) | null {
  const n = cards.length; if (n < 3) return null;
  const non = cards.filter((c) => c.r !== 0); const jk = cards.filter((c) => c.r === 0);
  if (non.length < 2) return null;
  if (non.every((c) => c.r === non[0].r) && n <= 4 && new Set(non.map((c) => c.s)).size === non.length) {
    return { kind: "set", cards: [...non, ...jk.map((j) => ({ ...j, as: non[0].r }))], pts: rv(non[0].r) * n };
  }
  if (non.every((c) => c.s === non[0].s) && new Set(non.map((c) => c.r)).size === non.length && n <= 14) {
    let best: (Meld & { pts: number }) | null = null;
    for (let st = 1; st + n - 1 <= 14; st++) {
      const slot: (RC | null)[] = Array(n).fill(null); let good = true;
      for (const c of non) { const cand = c.r === 1 ? [1, 14] : [c.r]; const p = cand.find((q) => q >= st && q < st + n && !slot[q - st]); if (p === undefined) { good = false; break; } slot[p - st] = c; }
      if (!good) continue;
      let ji = 0; let pts = 0;
      const out = slot.map((c, i) => { const p = st + i; pts += pv(p); return c || { ...jk[ji++], as: p > 13 ? 1 : p }; }) as RC[];
      if (!best || pts > best.pts) best = { kind: "run", cards: out, pts };
    }
    return best;
  }
  return null;
}
const cardVal = (c: RC) => (c.r === 0 ? 20 : rv(c.r));
/** Meilleur ensemble de combinaisons disjointes dans une main (par points ou par nombre de cartes). */
function bestMelds(hand: RC[], byCards: boolean, must?: number): { melds: Meld[]; pts: number; used: number; ok: boolean } {
  const n = hand.length; const byLow: { mask: number; m: Meld & { pts: number } }[][] = Array.from({ length: n }, () => []);
  const idx: number[][] = [];
  for (let mask = 7; mask < 1 << n; mask++) {
    let bits = 0, m = mask; while (m) { bits += m & 1; m >>= 1; } if (bits < 3) continue;
    const ids: number[] = []; for (let i = 0; i < n; i++) if (mask & (1 << i)) ids.push(i);
    const g = ids.map((i) => hand[i]); const non = g.filter((c) => c.r !== 0);
    if (non.length < 2) continue; if (!(non.every((c) => c.r === non[0].r) || non.every((c) => c.s === non[0].s))) continue;
    const r = check(g); if (r) { byLow[ids[0]].push({ mask, m: r }); idx.push(ids); }
  }
  const memo = new Map<number, { v: number; list: Meld[]; pts: number; used: number }>();
  const rec = (rem: number): { v: number; list: Meld[]; pts: number; used: number } => {
    if (!rem) return { v: 0, list: [], pts: 0, used: 0 };
    const hit = memo.get(rem); if (hit) return hit;
    let i = 0; while (!(rem & (1 << i))) i++;
    let best = hand[i].id === must ? { v: -Infinity, list: [] as Meld[], pts: 0, used: 0 } : rec(rem & ~(1 << i));
    for (const { mask, m } of byLow[i]) if ((mask & rem) === mask) { const s = rec(rem & ~mask); if (s.v === -Infinity) continue; let used = s.used + m.cards.length; const v = byCards ? used * 1000 + s.pts + m.pts : s.pts + m.pts; if (v > best.v) best = { v, list: [...s.list, m], pts: s.pts + m.pts, used }; }
    memo.set(rem, best); return best;
  };
  const r = rec((1 << n) - 1); return r.v === -Infinity ? { melds: [], pts: 0, used: 0, ok: false } : { melds: r.list, pts: r.pts, used: r.used, ok: true };
}
function deal(mode: Mode): G {
  const ds: RC[] = []; let id = 0;
  for (let k = 0; k < 2; k++) for (const s of SUITS) for (let r = 1; r <= 13; r++) ds.push({ r, s, id: id++ });
  for (let k = 0; k < 4; k++) ds.push({ r: 0, s: "s", id: id++ });
  const d = shuffle(ds); const n = mode === "perso" ? 14 : 13; const bottom = mode === "perso" ? d.pop()! : null;
  return { hand: [d.slice(0, n), d.slice(n, 2 * n)], disc: [d[2 * n]], stock: d.slice(2 * n + 1), bottom, melds: [], opened: [false, false], sm: [], turn: 0, phase: "draw", msg: "", over: null, turns: [0, 0], took: false, mode };
}
const sortHand = (h: RC[]) => [...h].sort((a, b) => (a.r === 0 ? 1 : b.r === 0 ? -1 : 0) || SUITS.indexOf(a.s) - SUITS.indexOf(b.s) || a.r - b.r);
function takeStock(g: G): { g: G; c: RC } {
  let stock = [...g.stock]; let disc = [...g.disc];
  if (!stock.length) { const top = disc.pop()!; stock = shuffle(disc); disc = [top]; }
  const c = stock.pop()!; return { g: { ...g, stock, disc }, c };
}
/** « Finir sec » : toute la main (plus la carte du fond) se pose d'un seul coup, avec au moins 51 points si on n'est pas encore ouvert. */
const secOk = (hand: RC[], c: RC, opened: boolean) => { const all = [...hand, c]; const r = bestMelds(all, true); return r.ok && r.used === all.length && (opened || r.pts >= 51); };
const canOpenWith = (hand: RC[], c: RC) => { const r = bestMelds([...hand, c], false, c.id); return r.ok && r.pts >= 51; };
function tryAdd(m: Meld, extra: RC[]): Meld | null { const r = check([...m.cards.map((c) => (c.r === 0 ? { ...c, as: undefined } : c)), ...extra]); return r ? { kind: r.kind, cards: r.cards } : null; }

/** Rami à 2 joueurs : 13 cartes, 2 jeux + 4 jokers, ouverture à 51 points, on peut compléter toutes les combinaisons posées. */
export function Rami() {
  const [mode, setMode] = useState<Mode | "">(""); const lk = useLook("rami");
  if (!lk.asked) return <div className="card col" style={{ gap: 10 }}>
    <b>{t("Tu veux de l'aide ?")}</b>
    <span className="small muted">{t("Les suites et les brelans seront entourés dans ta main pour t'aider à apprendre.")}</span>
    <button type="button" className="btn" onClick={() => setLook("rami", { aid: true, asked: true })}>{t("Oui, avec l'aide")}</button>
    <button type="button" className="btn ghost" onClick={() => setLook("rami", { aid: false, asked: true })}>{t("Non, jeu classique")}</button>
    <span className="small muted">{t("Tu peux changer ça à tout moment dans les réglages.")}</span>
  </div>;
  if (!mode) return <div className="card col" style={{ gap: 8 }}>
    <button type="button" className="btn" onClick={() => setMode("off")}>{t("Règles officielles")}</button>
    <span className="small muted">{t("Le Rami que tout le monde connaît : 13 cartes, ouverture à 51 points.")}</span>
    <button type="button" className="btn ghost" onClick={() => setMode("perso")}>{t("Règles personnalisées")}</button>
    <span className="small muted">{t("14 cartes, une carte du fond visible qui se prend seulement en finissant d'un coup, défausse à ramasser pour sortir.")}</span>
  </div>;
  return <RamiGame key={mode} mode={mode} />;
}
function RamiGame({ mode }: { mode: Mode }) {
  const [g, setG] = useState(() => deal(mode)); const [sel, setSel] = useState<number[]>([]); const scored = useRef(false);
  const over = g.over !== null;
  useEffect(() => { if (g.over === 0 && !scored.current) { scored.current = true; win(5); } }, [g.over]);
  useEffect(() => {
    if (g.turn !== 1 || over) return;
    const id = setTimeout(() => setG((p) => (p.turn === 1 && p.over === null ? cpuTurn(p) : p)), 1400);
    return () => clearTimeout(id);
  }, [g.turn, over]);
  const lk = useLook("rami");
  const grp = useMemo(() => { const m = new Map<number, { g: number; gl: string }>(); if (!lk.aid) return m; bestMelds(g.hand[0], true).melds.forEach((x, i) => x.cards.forEach((c) => m.set(c.id, { g: i % 4, gl: x.kind === "run" ? t("Suite") : x.cards.length >= 4 ? t("Carré") : t("Brelan") }))); return m; }, [lk.aid, g.hand]); // eslint-disable-line
  const meld = g.melds; const mine = g.turn === 0 && !over; const hand = sortHand(g.hand[0]);
  const stagedMelds = g.sm; const stagedTotal = stagedMelds.reduce((a, m) => a + m.pts, 0);
  const setSm = (x: G, sm: SM[], msg: string) => setG({ ...x, sm, msg });
  const toggle = (id: number) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const selCards = () => g.hand[0].filter((c) => sel.includes(c.id));
  const drawStock = () => { if (!mine || g.phase !== "draw") return; const { g: x, c } = takeStock(g); x.hand = [[...x.hand[0], c], x.hand[1]]; setG({ ...x, phase: "play", msg: "", took: false }); };
  const drawDisc = () => {
    if (!mine || g.phase !== "draw" || !g.disc.length) return; const c = g.disc[g.disc.length - 1];
    if (mode === "perso" && !g.opened[0]) {
      if (g.turns[0] === 0) return setG({ ...g, msg: t("Au premier tour, tu ne peux pas ramasser la défausse.") });
      if (!canOpenWith(g.hand[0], c)) return setG({ ...g, msg: t("Pour ramasser la défausse, tu dois pouvoir sortir (51 points) avec cette carte.") });
    }
    setG({ ...g, disc: g.disc.slice(0, -1), hand: [[...g.hand[0], c], g.hand[1]], phase: "play", msg: "", took: mode === "perso" && !g.opened[0] });
  };
  const fond = () => {
    if (!mine || g.phase !== "draw" || !g.bottom) return;
    if (!secOk(g.hand[0], g.bottom, g.opened[0])) return setG({ ...g, msg: t("Cette carte ne se prend que si tu finis d'un seul coup (51 points minimum).") });
    setG({ ...g, hand: [[], g.hand[1]], bottom: null, over: 0, msg: "" });
  };
  const lay = () => {
    const cs = selCards(); const r = check(cs); if (!r) return setG({ ...g, msg: t("Cette combinaison n'est pas valable.") });
    const hnew: [RC[], RC[]] = [g.hand[0].filter((c) => !sel.includes(c.id)), g.hand[1]]; setSel([]);
    if (g.opened[0]) { const x = { ...g, hand: hnew, melds: [...g.melds, { kind: r.kind, cards: r.cards }], msg: "" }; return setG(x.hand[0].length === 0 ? { ...x, over: 0 } : x); }
    const sm: SM[] = [...stagedMelds, r]; const tot = sm.reduce((a, m) => a + m.pts, 0);
    if (tot >= 51) { const x = { ...g, hand: hnew, opened: [true, g.opened[1]] as [boolean, boolean], melds: [...g.melds, ...sm.map((m) => ({ kind: m.kind, cards: m.cards }))], msg: t("Ouverture réussie !"), sm: [], took: false } as G; return setG(x.hand[0].length === 0 ? { ...x, over: 0 } : x); }
    setSm({ ...g, hand: hnew }, sm, t("Ouverture : {n} / 51 points", { n: tot }));
  };
  const cancelStage = () => { const back = stagedMelds.flatMap((m) => m.cards.map((c) => (c.r === 0 ? { ...c, as: undefined } : c))); setSm({ ...g, hand: [[...g.hand[0], ...back], g.hand[1]] }, [], ""); };
  const addTo = (i: number) => {
    if (!mine || g.phase !== "play" || !g.opened[0] || !sel.length) return;
    const cs = selCards(); const m = g.melds[i]; let nm = tryAdd(m, cs); let hnew = g.hand[0].filter((c) => !sel.includes(c.id));
    if (!nm && cs.length === 1 && cs[0].r !== 0) { const j = m.cards.findIndex((c) => c.r === 0); if (j >= 0) { const swapped = m.cards.map((c, k) => (k === j ? cs[0] : c)); const r = check(swapped.map((c) => (c.r === 0 ? { ...c, as: undefined } : c))); if (r && r.cards.every((c) => c.r !== 0 || true)) { nm = { kind: r.kind, cards: r.cards }; hnew = [...hnew, { ...m.cards[j], as: undefined }]; } } }
    if (!nm) return setG({ ...g, msg: t("Cette carte ne va pas ici.") });
    const melds = g.melds.map((x, k) => (k === i ? nm! : x)); setSel([]); const x = { ...g, melds, hand: [hnew, g.hand[1]] as [RC[], RC[]], msg: "" };
    setG(hnew.length === 0 ? { ...x, over: 0 } : x);
  };
  const discard = () => {
    if (!mine || g.phase !== "play") return; if (stagedMelds.length) return setG({ ...g, msg: t("Pose 51 points ou annule avant de défausser.") });
    if (g.took && !g.opened[0]) return setG({ ...g, msg: t("Tu as ramassé la défausse : tu dois sortir (poser 51 points).") });
    if (sel.length !== 1) return setG({ ...g, msg: t("Choisis une seule carte à défausser.") });
    const c = g.hand[0].find((z) => z.id === sel[0])!; const h = g.hand[0].filter((z) => z.id !== c.id); setSel([]);
    const x: G = { ...g, hand: [h, g.hand[1]], disc: [...g.disc, c.r === 0 ? { ...c, as: undefined } : c], turn: 1, phase: "draw", msg: "", took: false, turns: [g.turns[0] + 1, g.turns[1]] };
    setG(h.length === 0 ? { ...x, over: 0 } : x);
  };
  const again = () => { scored.current = false; setSel([]); setG(deal(mode)); };
    const status = over ? (g.over === 0 ? t("🏆 Bravo, tu as gagné ! (+5 points)") : t("L'ordinateur a gagné cette partie.") + " " + t("Il te restait {n} points.", { n: g.hand[0].reduce((a, c) => a + cardVal(c), 0) })) : mine ? (g.msg ? g.msg + " " : "") + (g.phase === "draw" ? t("À toi : pioche ou prends la défausse.") : g.opened[0] ? t("Pose des combinaisons, complète celles de la table, puis défausse une carte.") : t("Pose des combinaisons (51 points pour ouvrir), puis défausse une carte.")) : (g.msg ? g.msg + " " : "") + t("L'ordinateur réfléchit…");
  const top = g.disc[g.disc.length - 1];
  const fondOk = useMemo(() => !!g.bottom && mine && g.phase === "draw" && secOk(g.hand[0], g.bottom, g.opened[0]), [g.bottom, g.hand, g.phase, g.turn, g.opened]); // eslint-disable-line
  return (
    <GameShell felt game="rami" status={status.trim()} over={over} onAgain={again}>
      <div className="small muted">{t("L'ordinateur a {n} cartes", { n: g.hand[1].length })}{g.opened[1] ? " · ✓" : ""}</div>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <PlayCard down w={44} label={t("Pioche")} onClick={mine && g.phase === "draw" ? drawStock : undefined} />
        {g.bottom && <PlayCard c={g.bottom} w={44} label={t("Carte du fond")} tag={t("Fond")} onClick={mine && g.phase === "draw" ? fond : undefined} dim={mine && g.phase === "draw" && !fondOk} />}
        {top ? <PlayCard c={top} w={48} label={t("Défausse")} onClick={mine && g.phase === "draw" ? drawDisc : undefined} /> : <span />}
      </div>
      <div className="col" style={{ width: "100%", gap: 6 }}>
        {meld.map((m, i) => <div key={i} role="group" aria-label={t("Combinaison {n}", { n: i + 1 })} onClick={() => addTo(i)} style={{ display: "flex", flexWrap: "wrap", gap: 2, padding: 4, borderRadius: 10, border: "1px dashed rgba(255,255,255,.4)", background: "rgba(255,255,255,.07)", cursor: sel.length && g.opened[0] ? "pointer" : "default" }}>{m.cards.map((c, k) => <PlayCard key={k} c={c.r === 0 && c.as ? { r: c.as, s: SUITS[0] as Suit } : c} w={26} tag={c.r === 0 ? "★" : undefined} />)}</div>)}
        {stagedMelds.length > 0 && <div className="small">{t("Ouverture : {n} / 51 points", { n: stagedTotal })} <button type="button" className="btn ghost sm" onClick={cancelStage}>{t("Annuler")}</button></div>}
      </div>
      <Fan w={44} items={hand.map((c) => ({ k: c.id, s: c.r === 0 ? 9 : SUITS.indexOf(c.s), r: c.r === 1 ? 1 : c.r, g: grp.get(c.id)?.g, gl: grp.get(c.id)?.gl, node: <PlayCard c={c} w={44} sel={sel.includes(c.id)} onClick={mine && g.phase === "play" ? () => toggle(c.id) : undefined} /> }))} />
      {mine && g.phase === "play" && <div className="row" style={{ gap: 8 }}><button type="button" className="btn" disabled={sel.length < 3} onClick={lay}>{t("Poser")}</button><button type="button" className="btn ghost" disabled={sel.length !== 1} onClick={discard}>{t("Défausser")}</button></div>}
      <Rules text={mode === "perso" ? t("Chacun a 14 cartes. Celui qui commence pioche la 15e carte. Au fond de la pioche, une carte est retournée et visible : on ne peut la prendre que si on finit d'un seul coup (toutes ses cartes posées, 51 points minimum). Sinon on joue normalement et on défausse, cartes visibles.\nAu premier tour, on ne peut pas ramasser la défausse. Dès le deuxième tour, on peut la ramasser, mais alors il faut obligatoirement sortir (poser au moins 51 points avec cette carte).\nCombinaison : suite de 3 cartes ou plus de la même couleur, ou brelan/carré de même valeur et de couleurs différentes. Le joker remplace n'importe quelle carte. Après ouverture, on complète les combinaisons de la table. Le premier sans carte gagne.") : t("Chacun a 13 cartes. À ton tour : pioche (ou prends la défausse), pose des combinaisons si tu veux, puis défausse une carte.\nCombinaison : suite de 3 cartes ou plus de la même couleur (l'As est bas ou haut, sans boucle), ou brelan/carré de même valeur et de couleurs différentes. Le joker remplace n'importe quelle carte.\nOuverture : ta première pose doit valoir au moins 51 points (As = 11, figures = 10, As de la suite A-2-3 = 1). Ensuite tu peux compléter toutes les combinaisons de la table et remplacer un joker par la carte qu'il représente.\nLe premier sans carte gagne.")} />
    </GameShell>
  );
}

function cpuTurn(p: G): G {
  let g: G = { ...p, turns: [p.turns[0], p.turns[1] + 1], hand: [p.hand[0], [...p.hand[1]]], melds: p.melds.map((m) => ({ ...m, cards: [...m.cards] })), opened: [...p.opened] as [boolean, boolean] };
  const hand = g.hand[1];
  // 1. pioche ou défausse
  const top = g.disc[g.disc.length - 1]; let took = "";
  if (g.bottom && secOk(hand, g.bottom, g.opened[1])) return { ...g, hand: [g.hand[0], []], bottom: null, over: 1, msg: "" };
  const base = bestMelds(hand, false).pts;
  const perso = g.mode === "perso";
  const allowed = !perso || g.opened[1] ? true : p.turns[1] > 0 && canOpenWith(hand, top);
  if (top && top.r !== 0 && allowed && (perso && !g.opened[1] ? true : bestMelds([...hand, top], false).pts > base)) { g.disc = g.disc.slice(0, -1); hand.push(top); took = t("L'ordinateur a pris la défausse."); }
  else { const r = takeStock(g); g = { ...r.g, hand: [g.hand[0], hand] }; hand.push(r.c); took = t("L'ordinateur a pioché une carte."); }
  // 2. pose
  let cur = hand;
  const lays = bestMelds(cur, false);
  if (g.opened[1] || lays.pts >= 51) {
    const bc = g.opened[1] ? bestMelds(cur, true) : lays;
    if (bc.melds.length) { const used = new Set(bc.melds.flatMap((m) => m.cards.map((c) => c.id))); cur = cur.filter((c) => !used.has(c.id)); g.melds.push(...bc.melds.map((m) => ({ kind: m.kind, cards: m.cards }))); g.opened[1] = true; }
  }
  // 3. compléter
  if (g.opened[1]) {
    let changed = true;
    while (changed && cur.length) {
      changed = false;
      for (const c of [...cur].sort((a, b) => (a.r === 0 ? 1 : 0) - (b.r === 0 ? 1 : 0))) {
        const i = g.melds.findIndex((m) => tryAdd(m, [c])); if (i >= 0) { g.melds[i] = tryAdd(g.melds[i], [c])!; cur = cur.filter((z) => z.id !== c.id); changed = true; break; }
      }
    }
  }
  if (!cur.length) return { ...g, hand: [g.hand[0], cur], over: 1, msg: "" };
  // 4. défausse la carte la moins utile
  const use = (c: RC) => cur.filter((z) => z.id !== c.id && ((z.r === c.r && z.s !== c.s) || (z.s === c.s && Math.abs(z.r - c.r) <= 2 && z.r !== c.r))).length;
  const cand = cur.filter((c) => c.r !== 0); const pick = (cand.length ? cand : cur).sort((a, b) => use(a) - use(b) || cardVal(b) - cardVal(a))[0];
  cur = cur.filter((c) => c.id !== pick.id);
  if (!cur.length) return { ...g, hand: [g.hand[0], cur], disc: [...g.disc, pick], over: 1, msg: "" };
  return { ...g, hand: [g.hand[0], cur], disc: [...g.disc, pick], turn: 0, phase: "draw", msg: took };
}
