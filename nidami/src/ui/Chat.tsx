import { useEffect, useRef, useState } from "react";
import { LinkifiedText } from "./Links";
import { createPortal } from "react-dom";
import { useStore, actions, userOf, Msg, Conv } from "../lib/store";
import { areFriends } from "../lib/engine";
import { Avatar, Ico, toast, ago, fileToDataUrl, useNow, EMOJIS, EmojiGrid, lp, ConfirmDel } from "./common";
import { FxBar } from "./FxBar";
import { HoldMic } from "./Recorder";
import { WmImage, VideoWm, useCaptureGuard } from "./Wm";
import { t, T } from "../i18n";

const linkify = (tx: string) => <LinkifiedText text={tx} />;
const visible = (m: Msg, me: string, now: number) => m.from === me || (m.once ? false : m.secs === 0 || (m.reads[me] !== undefined && now < m.reads[me] + m.secs * 1000));
// Message « vu une fois » : plein écran, filigrané ; à la fermeture il disparaît pour ce destinataire.
function OnceViewer({ conv, m, me, name, onClose }: { conv: string; m: Msg; me: string; name: string; onClose: () => void }) {
  const hidden = useCaptureGuard(() => { actions.suspectCapture(null, conv, m.id); toast(t("Capture bloquée : l'auteur sera prévenu.")); }, true);
  const close = () => { actions.closeOnce(conv, m.id); onClose(); };
  return (<div className="viewer protected" role="dialog" aria-label={t("Message vu une fois")}><div className="row" style={{ width: "min(560px,100%)" }}><b className="grow">{t("🔥 Vu une fois")}</b><button className="btn warm sm" onClick={close}>{t("Fermer (il disparaîtra)")}</button></div>
    <div style={{ position: "relative", width: "min(560px,100%)" }}>{m.img && <WmImage src={m.img} label={name} plain={!!m.nowm} alt={t("Photo vue une fois")} />}{m.text && <div className="tbg" style={{ background: "linear-gradient(135deg,#8B5CF6,#3B82F6)" }}>{m.text}</div>}{m.audio && <audio controls src={m.audio} />}{hidden && <div className="shield"><b>{t("Contenu masqué")}<br />{t("Capture ou changement de fenêtre détecté")}</b></div>}</div>
    <p className="muted small center" style={{ maxWidth: 520 }}>{t("Ce message disparaît quand vous fermez. Une photo peut toujours être photographiée avec un autre appareil : merci de respecter la confidentialité.")}</p></div>);
}
export function Messages() {
  const s = useStore((x) => x); const me = s.me; const now = useNow(500); const [sel, setSelRaw] = useState<string | null>(() => (history.state?.conv as string) || null); const setSel = (id: string | null) => { if (id) history.pushState({ v: "messages", conv: id }, ""); setSelRaw(id); }; const closeConv = () => { if (history.state?.conv) history.back(); else setSelRaw(null); }; useEffect(() => { const f = (e: PopStateEvent) => { if (!(e.state && e.state.conv)) setSelRaw(null); }; window.addEventListener("popstate", f); return () => window.removeEventListener("popstate", f); }, []); const [txt, setTxt] = useState(""); const [secs, setSecs] = useState(0); const [once, setOnce] = useState(false); const [openOnce, setOpenOnce] = useState<string | null>(null); const [q, setQ] = useState(""); const [edit, setEdit] = useState<string | null>(null); const [rep, setRep] = useState<Msg | null>(null);
  const [del, setDel] = useState<string | null>(null); const [opt, setOpt] = useState(false);
  const convs = s.convs.filter((c) => c.memberIds.includes(me)).sort((a, b) => (b.msgs.at(-1)?.at || 0) - (a.msgs.at(-1)?.at || 0));
  const c = convs.find((x) => x.id === sel); const img = useRef<HTMLInputElement>(null); const [wm, setWm] = useState(true); const [emo, setEmo] = useState(false); const end = useRef<HTMLDivElement>(null);
  useEffect(() => { if (c) actions.markRead(c.id); }, [sel, c?.msgs.length]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [c?.msgs.length, sel]);
  const title = (x: Conv) => x.title || x.memberIds.filter((m) => m !== me).map((m) => userOf(s, m)?.name).join(", ");
  const unread = (x: Conv) => x.msgs.filter((m) => m.from !== me && m.reads[me] === undefined).length;
  const sendTxt = () => { if (!c) return; if (edit) { actions.editMsg(c.id, edit, txt); setEdit(null); } else actions.send(c.id, txt, secs, null, rep?.id, null, once); setTxt(""); setRep(null); };
  const list = (
    <div className="col" style={{ gap: 8 }}><input className="inp" placeholder={t("🔎 Rechercher dans mes conversations")} value={q} onChange={(e) => setQ(e.target.value)} />
      {convs.filter((x) => !q || title(x).toLowerCase().includes(q.toLowerCase()) || x.msgs.some((m) => visible(m, me, now) && m.text.toLowerCase().includes(q.toLowerCase()))).map((x) => { const last = x.msgs.at(-1); const u = unread(x); return <button key={x.id} className={"card row" + (unread(x) > 0 ? " unread" : "")} style={{ color: "inherit", textAlign: "left" }} onClick={() => setSel(x.id)}>
        {x.groupId ? <div className="av" style={{ width: 44, height: 44, background: "var(--grad)" }}>👥</div> : <Avatar u={userOf(s, x.memberIds.find((m) => m !== me)!)} />}<div className="grow"><b>{title(x)}</b><div className="muted small ell">{last ? ((last.secs || last.once) && last.from !== me ? t("🔒 Message éphémère") : last.audio ? t("🎤 Message vocal") : last.text || t("📷 Photo")) : t("Nouvelle conversation")}</div></div>{u > 0 && <span className="badge">{u}</span>}</button>; })}
      {!convs.length && <p className="muted">{t("Aucune conversation : écrivez à un ami depuis « Amis ».")}</p>}</div>);
  if (!c) return (<div className="col"><h1>{t("Messages")}</h1>{list}</div>);
  const onceMsg = c.msgs.find((m) => m.id === openOnce);
  const fxOn = (s.settings[me]?.fx ?? true);
  const visio = () => { const a = new Uint8Array(9); crypto.getRandomValues(a); const room = t("Cercle") + Array.from(a, (x) => x.toString(36)).join(""); const url = "https://meet.jit.si/" + room; actions.send(c.id, t("📹 Je lance une visio : {url}", { url }), 0); window.open(url, "_blank", "noopener"); toast(t("Visio lancée : le lien est envoyé dans la conversation.")); };
  const pinned = c.msgs.filter((m) => m.pinned && visible(m, me, now));
  return (<div className="col"><div className="row"><button className="btn ghost sm" onClick={closeConv} aria-label={t("Retour")}><Ico n="back" s={16} /></button><h2 className="grow ell">{title(c)}</h2><button className="btn ghost sm" onClick={visio} aria-label={t("Lancer un appel visio")}>{t("📹 Visio")}</button></div>
    {pinned.length > 0 && <div className="card small">📌 {pinned.map((m) => m.text || t("Message")).join(" · ")}</div>}
    <div className="card msgs" role="log" aria-live="polite">{c.msgs.filter((m) => !q || m.text.toLowerCase().includes(q.toLowerCase())).map((m) => { const mine = m.from === me; const ok = visible(m, me, now); const left = m.secs && m.reads[me] !== undefined ? Math.max(0, Math.ceil((m.reads[me] + m.secs * 1000 - now) / 1000)) : 0; const from = userOf(s, m.from); const rp = m.replyTo ? c.msgs.find((x) => x.id === m.replyTo) : null;
      return <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start" }}>{!mine && c.groupId && <span className="muted small">{from?.name}</span>}
        {m.once && !mine ? (m.gone?.[me] !== undefined ? <div className="bubble muted">{t("🔥 Message vu et disparu")}</div> : <button className="bubble" style={{ border: "1px dashed var(--warm)" }} onClick={() => setOpenOnce(m.id)}>{t("🔥 Message à voir une seule fois · toucher pour ouvrir")}</button>) : ok ? <div className={"bubble" + (mine ? " me" : "")} {...(mine ? lp(() => setDel(m.id)) : {})}>{rp && <div className="small" style={{ opacity: .75, borderLeft: "3px solid currentColor", paddingLeft: 6, marginBottom: 4 }}>{rp.text.slice(0, 60)}</div>}{m.img && <div style={{ maxWidth: 240 }}><WmImage src={m.img} label={userOf(s, me)?.name || ""} plain={!!m.nowm} alt={t("Photo")} style={{ borderRadius: 12 }} /></div>}{m.audio && <audio controls src={m.audio} style={{ maxWidth: 220 }} />}{linkify(m.text)}{m.edited && <i className="small">{" "}{t("(modifié)")}</i>}{m.secs > 0 && !mine && <div className="small" style={{ opacity: .8 }}>{t("⏱ {left} s", { left })}</div>}{m.secs > 0 && mine && <div className="small" style={{ opacity: .8 }}>{t("⏱ éphémère {secs} s après lecture", { secs: m.secs })}</div>}{m.once && mine && <div className="small" style={{ opacity: .85 }}>{t("🔥 vue unique ·")}{" "}{Object.keys(m.gone || {}).length ? t("vu ✓") : "pas encore vu"}</div>}</div>
          : m.reads[me] === undefined ? <button className="bubble" style={{ border: "1px dashed var(--brand)" }} onClick={() => actions.openMsg(c.id, m.id)}>{t("🔒 Message éphémère · toucher pour lire ({secs} s)", { secs: m.secs })}</button> : <div className="bubble muted">{t("⌛ Message expiré")}</div>}
        <div className="muted small" style={{ display: "flex", gap: 8 }}>{ago(m.at, now)}{mine && c.memberIds.filter((x) => x !== me).every((x) => m.reads[x] !== undefined) && t(" · ✓✓ lu")}{mine && Object.keys(m.reads).length === 0 && t(" · ✓ envoyé")}
          {ok && <><button style={{ background: "none", border: 0, color: "inherit", padding: 0 }} onClick={() => setRep(m)}>↩︎</button><button style={{ background: "none", border: 0, color: "inherit", padding: 0 }} onClick={() => actions.pinMsg(c.id, m.id)}>📌</button></>}
          {mine && <><button style={{ background: "none", border: 0, color: "inherit", padding: 0 }} onClick={() => { setEdit(m.id); setTxt(m.text); }}>✎</button><button style={{ background: "none", border: 0, color: "inherit", padding: 0 }} onClick={() => actions.deleteMsg(c.id, m.id)}>🗑</button></>}</div></div>; })}
      {!c.msgs.length && <p className="muted center">{t("Dites bonjour 👋")}</p>}<div ref={end} /></div>
    {del && <ConfirmDel what="ce message" onYes={() => actions.deleteMsg(c.id, del)} onClose={() => setDel(null)} />}
    {onceMsg && <OnceViewer conv={c.id} m={onceMsg} me={me} name={userOf(s, me)?.name || ""} onClose={() => setOpenOnce(null)} />}
    {rep && <div className="card small row"><span className="grow ell">↩︎ {rep.text.slice(0, 60)}</span><button className="btn ghost sm" onClick={() => setRep(null)}><Ico n="x" s={14} /></button></div>}
    {opt && <div className="card col" style={{ gap: 10 }}>
      <div className="row"><b className="grow">{t("Options d'envoi")}</b><button type="button" className="btn ghost sm" onClick={() => setOpt(false)} aria-label={t("Fermer les options")}>✕</button></div>
      <div className="col" style={{ gap: 4 }}><span className="muted small">{t("Durée du message")}</span><div className="row wrap" style={{ gap: 6 }}>{[["p", t("♾️ Permanent")], ["o", t("🔥 Vu une fois")], ["10", t("⏱ 10 s")], ["60", t("⏱ 1 min")]].map(([v, l]) => { const on = v === "p" ? !once && secs === 0 : v === "o" ? once : !once && secs === Number(v); return <button type="button" key={v} className={"chip" + (on ? " on" : "")} onClick={() => { setOnce(v === "o"); setSecs(v === "p" || v === "o" ? 0 : Number(v)); }}>{l}</button>; })}</div></div>
      <div className="col" style={{ gap: 4 }}><span className="muted small">{t("Photos")}</span><div className="row wrap" style={{ gap: 6 }}><button type="button" className="chip" onClick={() => { img.current?.click(); }}>{t("📷 Envoyer une photo")}</button><button type="button" className={"chip" + (wm ? " on" : "")} onClick={() => setWm(!wm)} aria-pressed={wm}>{t("🛡 Filigrane")}{" "}{wm ? t("activé") : t("retiré")}</button></div></div>
      <div className="col" style={{ gap: 4 }}><span className="muted small">{t("Effets")}</span><FxBar convId={c.id} /></div>
    </div>}
    {emo && <div className="empanel"><EmojiGrid onPick={(e) => setTxt((tx) => tx + e)} onClose={() => setEmo(false)} /></div>}
    <form className="row" onSubmit={(e) => { e.preventDefault(); sendTxt(); }}>
      <input ref={img} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f && c) { try { actions.send(c.id, "", secs, await fileToDataUrl(f, 800), undefined, null, once, !wm); } catch { toast(t("Image illisible.")); } } e.target.value = ""; }} />
      <button type="button" className={"btn ghost sm" + (opt ? " on" : "")} onClick={() => setOpt(!opt)} aria-label={t("Options : durée, photo, effets")} aria-expanded={opt}>＋{(once || secs > 0) && <span className="small"> ⏱</span>}</button>
      <button type="button" className="btn ghost sm" onClick={() => setEmo(!emo)} aria-label={t("Emojis")}><Ico n="smile" s={18} /></button>
      <input className="inp grow" placeholder={edit ? t("Modifier le message…") : t("Votre message…")} value={txt} onChange={(e) => setTxt(e.target.value)} aria-label={t("Message")} />
      {txt.trim() ? <button className="btn" aria-label={t("Envoyer")}><Ico n="send" s={18} /></button> : <HoldMic className="btn" onDone={(u) => actions.send(c.id, "", secs, null, undefined, u, once)}><Ico n="mic" s={20} /></HoldMic>}</form></div>);
}

// ───────── Jeux : Morpion à deux (chacun joue depuis son profil) + Quiz solo
const QUIZ: [string, string[], number][] = [
  [T("Combien de côtés a un hexagone ?"), ["5", "6", "7", "8"], 1], [T("Quelle est la capitale de l'Italie ?"), [T("Milan"), T("Naples"), T("Rome"), T("Turin")], 2], [T("Quel animal est le plus rapide sur terre ?"), [T("Lion"), T("Guépard"), T("Cheval"), T("Antilope")], 1],
  [T("Combien y a-t-il de minutes dans une heure et demie ?"), ["60", "75", "90", "100"], 2], [T("Quelle planète est la plus proche du Soleil ?"), [T("Vénus"), T("Mars"), T("Terre"), T("Mercure")], 3], [T("Quel fruit donne le cidre ?"), [T("Poire"), T("Pomme"), T("Raisin"), T("Cerise")], 1],
  [T("Combien de joueurs dans une équipe de football sur le terrain ?"), ["9", "10", "11", "12"], 2], [T("De quelle couleur est le mélange du bleu et du jaune ?"), [T("Vert"), T("Orange"), T("Violet"), T("Marron")], 0], [T("Quel est le plus grand océan ?"), [T("Atlantique"), T("Indien"), T("Arctique"), T("Pacifique")], 3], [T("Combien de jours en février d'une année bissextile ?"), ["28", "29", "30", "31"], 1],
];
export function Games() {
  const s = useStore((x) => x); const me = s.me; const [tab, setTab] = useState("morpion"); const friends = (s.social.friends[me] || []).map((i) => userOf(s, i)!).filter(Boolean);
  const games = s.games.filter((g) => g.xId === me || g.oId === me);
  const [qi, setQi] = useState(0); const [pts, setPts] = useState(0); const [ans, setAns] = useState<number | null>(null); const [done, setDone] = useState(false);
  const board = (g: (typeof games)[0]) => { const mine = (g.turn === "X" ? g.xId : g.oId) === me; const w = g.winner; const nm = (id: string) => userOf(s, id)?.name;
    return <div key={g.id} className="card col" style={{ alignItems: "center" }}><b>{t("{nm} (✕) contre {nm2} (◯)", { nm: nm(g.xId), nm2: nm(g.oId) })}</b>
      <div className="ttt">{g.board.map((c, i) => <button key={i} onClick={() => actions.play(g.id, i)} disabled={!!c || !!w || !mine} aria-label={t("Case {v1}", { v1: (i + 1) })} style={{ color: c === "X" ? "var(--brand2)" : "var(--warm)" }}>{c === "X" ? "✕" : c === "O" ? "◯" : ""}</button>)}</div>
      <div className={w ? "" : "muted"}>{w ? (w === "draw" ? t("Match nul 🤝") : t("🏆 {name} a gagné !", { name: nm(w === "X" ? g.xId : g.oId) })) : mine ? t("C'est votre tour") : t("Au tour de {name} (changez de membre dans Paramètres pour jouer à sa place en démo)", { name: nm(g.turn === "X" ? g.xId : g.oId) })}</div></div>; };
  const q = QUIZ[qi];
  return (<div className="col"><h1>{t("Jeux")}</h1><div className="tabs"><button className={"chip" + (tab === "morpion" ? " on" : "")} onClick={() => setTab("morpion")}>{t("⭕ Morpion à deux")}</button><button className={"chip" + (tab === "quiz" ? " on" : "")} onClick={() => setTab("quiz")}>{t("🧠 Quiz")}</button><button className="chip" disabled>{t("♟️ Échecs · bientôt")}</button><button className="chip" disabled>{t("🃏 Rami · bientôt")}</button></div>
    {tab === "morpion" && <><div className="card col"><b>{t("Inviter un ami")}</b><div className="tabs" style={{ flexWrap: "wrap" }}>{friends.map((f) => <button key={f.id} className="chip" onClick={() => { if (areFriends(s.social, me, f.id)) { actions.newGame(f.id); toast(t("Partie lancée avec {name}.", { name: f.name })); } }}>{f.name}</button>)}</div></div>{games.map(board)}{!games.length && <p className="muted">{t("Aucune partie. Invitez un ami ci-dessus.")}</p>}</>}
    {tab === "quiz" && <div className="card col">{done ? <div className="center col"><h2>{t("Bravo ! {pts}/{length}", { pts, length: QUIZ.length })}</h2><div className="muted">{t("Votre total :")}{" "}{s.scores[me] || 0}{" "}{t("points")}</div><button className="btn" onClick={() => { setQi(0); setPts(0); setDone(false); setAns(null); }}>{t("Rejouer")}</button></div> : <>
      <div className="muted small">{t("Question {v1}/{length} · Score {pts}", { v1: qi + 1, length: QUIZ.length, pts })}</div><h3>{t(q[0])}</h3>{q[1].map((o, i) => <button key={i} className="btn ghost" disabled={ans !== null} onClick={() => { setAns(i); if (i === q[2]) { setPts(pts + 1); actions.addScore(1); } }} style={ans !== null ? { background: i === q[2] ? "rgba(52,211,153,.3)" : i === ans ? "rgba(251,113,133,.3)" : undefined } : undefined}>{t(o)}</button>)}
      {ans !== null && <button className="btn" onClick={() => { if (qi + 1 < QUIZ.length) { setQi(qi + 1); setAns(null); } else setDone(true); }}>{qi + 1 < QUIZ.length ? t("Suivante") : t("Terminer")}</button>}</>}</div>}
  </div>);
}

export function PhotoView({ id, onClose }: { id: string; onClose: () => void }) {
  const p = useStore((x) => x.posts.find((y) => y.id === id)); const me = useStore((x) => x.me); const users = useStore((x) => x.users);
  const hidden = useCaptureGuard(() => { actions.suspectCapture(id); toast(t("Capture bloquée : l'auteur sera prévenu.")); }, true);
  useEffect(() => { const f = () => onClose(); window.addEventListener("popstate", f); return () => window.removeEventListener("popstate", f); }, []);
  const close = () => { if (history.state?.photo) history.back(); else onClose(); };
  if (!p || (!p.img && !p.video)) return null; const u = users.find((x) => x.id === p.authorId); const mine = p.authorId === me; const my = p.reactions[me];
  return createPortal(<div className="detail" role="dialog" aria-label={t("Photo")}><div className="dhead"><button className="btn ghost sm" onClick={close} aria-label={t("Retour")} style={{ minWidth: 44 }}><Ico n="back" s={18} /></button><Avatar u={u} s={34} /><b className="grow ell">{u?.name}</b>{mine && <button className="btn danger sm" onClick={() => { if (confirm(t("Supprimer partout, y compris chez ceux qui l'ont reçue ?"))) { actions.deletePost(id); close(); } }}>{t("Supprimer")}</button>}</div>
    <div className={"dbody protected" + (hidden ? " blur" : "")} style={{ textAlign: "center" }}>{p.video ? <VideoWm src={p.video} label={users.find((x) => x.id === me)?.name || ""} /> : <WmImage src={p.img!} label={users.find((x) => x.id === me)?.name || ""} alt={p.text || t("Photo")} style={{ borderRadius: 18 }} />}{p.text && <p>{p.text}</p>}
      <div className="row wrap" style={{ justifyContent: "center", gap: 8 }}>{EMOJIS.map((e) => <button key={e} className={"react" + (my === e ? " on" : "")} onClick={() => actions.react(id, e)} aria-label={t("Réagir {e}", { e })}>{e}</button>)}</div>
      <p className="muted small">{t("🔒 Photo protégée : filigrane à votre nom, captures d'écran bloquées dans l'application Android, partage seulement avec l'accord de l'auteur.")}</p></div></div>, document.body);
}
export function Soon({ title, icon, why }: { title: string; icon: string; why: string }) {
  return <div className="col"><h1>{title}</h1><div className="card center col" style={{ alignItems: "center", padding: 34 }}><div style={{ fontSize: "3rem" }}>{icon}</div><h3>{t("Bientôt disponible")}</h3><p className="muted" style={{ maxWidth: 420 }}>{why}</p></div></div>;
}
