import { useEffect, useRef, useState } from "react";
import { useStore, actions, userOf, Msg, Conv } from "../lib/store";
import { areFriends } from "../lib/engine";
import { Avatar, Ico, toast, ago, fileToDataUrl, useNow } from "./common";
import { WmImage, useCaptureGuard } from "./Wm";

const visible = (m: Msg, me: string, now: number) => m.from === me || (m.once ? false : m.secs === 0 || (m.reads[me] !== undefined && now < m.reads[me] + m.secs * 1000));
// Message « vu une fois » : plein écran, filigrané ; à la fermeture il disparaît pour ce destinataire.
function OnceViewer({ conv, m, me, name, onClose }: { conv: string; m: Msg; me: string; name: string; onClose: () => void }) {
  const hidden = useCaptureGuard(() => { actions.suspectCapture(null, conv, m.id); toast("Capture bloquée : l'auteur sera prévenu."); }, true);
  const close = () => { actions.closeOnce(conv, m.id); onClose(); };
  return (<div className="viewer protected" role="dialog" aria-label="Message vu une fois"><div className="row" style={{ width: "min(560px,100%)" }}><b className="grow">🔥 Vu une fois</b><button className="btn warm sm" onClick={close}>Fermer (il disparaîtra)</button></div>
    <div style={{ position: "relative", width: "min(560px,100%)" }}>{m.img && <WmImage src={m.img} label={name} alt="Photo vue une fois" />}{m.text && <div className="tbg" style={{ background: "linear-gradient(135deg,#8B5CF6,#3B82F6)" }}>{m.text}</div>}{m.audio && <audio controls src={m.audio} />}{hidden && <div className="shield"><b>Contenu masqué<br />Capture ou changement de fenêtre détecté</b></div>}</div>
    <p className="muted small center" style={{ maxWidth: 520 }}>Ce message disparaît quand vous fermez. Une photo peut toujours être photographiée avec un autre appareil : merci de respecter la confidentialité.</p></div>);
}
export function Messages() {
  const s = useStore((x) => x); const me = s.me; const now = useNow(500); const [sel, setSel] = useState<string | null>(null); const [txt, setTxt] = useState(""); const [secs, setSecs] = useState(0); const [once, setOnce] = useState(false); const [openOnce, setOpenOnce] = useState<string | null>(null); const [q, setQ] = useState(""); const [edit, setEdit] = useState<string | null>(null); const [rep, setRep] = useState<Msg | null>(null);
  const convs = s.convs.filter((c) => c.memberIds.includes(me)).sort((a, b) => (b.msgs.at(-1)?.at || 0) - (a.msgs.at(-1)?.at || 0));
  const c = convs.find((x) => x.id === sel); const img = useRef<HTMLInputElement>(null); const end = useRef<HTMLDivElement>(null);
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  useEffect(() => { if (c) actions.markRead(c.id); }, [sel, c?.msgs.length]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [c?.msgs.length, sel]);
  const title = (x: Conv) => x.title || x.memberIds.filter((m) => m !== me).map((m) => userOf(s, m)?.name).join(", ");
  const unread = (x: Conv) => x.msgs.filter((m) => m.from !== me && m.reads[me] === undefined).length;
  const sendTxt = () => { if (!c) return; if (edit) { actions.editMsg(c.id, edit, txt); setEdit(null); } else actions.send(c.id, txt, secs, null, rep?.id, null, once); setTxt(""); setRep(null); };
  const voice = async () => {
    if (rec) { rec.stop(); return; }
    try { const st = await navigator.mediaDevices.getUserMedia({ audio: true }); const r = new MediaRecorder(st); const ch: Blob[] = []; r.ondataavailable = (e) => ch.push(e.data);
      r.onstop = () => { st.getTracks().forEach((t) => t.stop()); setRec(null); const fr = new FileReader(); fr.onload = () => c && actions.send(c.id, "", secs, null, undefined, String(fr.result), once); fr.readAsDataURL(new Blob(ch, { type: r.mimeType })); };
      r.start(); setRec(r); setTimeout(() => r.state === "recording" && r.stop(), 60000); } catch { toast("Micro indisponible ou refusé."); }
  };
  const list = (
    <div className="col" style={{ gap: 8 }}><input className="inp" placeholder="🔎 Rechercher dans mes conversations" value={q} onChange={(e) => setQ(e.target.value)} />
      {convs.filter((x) => !q || title(x).toLowerCase().includes(q.toLowerCase()) || x.msgs.some((m) => visible(m, me, now) && m.text.toLowerCase().includes(q.toLowerCase()))).map((x) => { const last = x.msgs.at(-1); const u = unread(x); return <button key={x.id} className="card row" style={{ color: "inherit", textAlign: "left" }} onClick={() => setSel(x.id)}>
        {x.groupId ? <div className="av" style={{ width: 44, height: 44, background: "var(--grad)" }}>👥</div> : <Avatar u={userOf(s, x.memberIds.find((m) => m !== me)!)} />}<div className="grow"><b>{title(x)}</b><div className="muted small ell">{last ? ((last.secs || last.once) && last.from !== me ? "🔒 Message éphémère" : last.audio ? "🎤 Message vocal" : last.text || "📷 Photo") : "Nouvelle conversation"}</div></div>{u > 0 && <span className="badge">{u}</span>}</button>; })}
      {!convs.length && <p className="muted">Aucune conversation : écrivez à un ami depuis « Amis ».</p>}</div>);
  if (!c) return (<div className="col"><h1>Messages</h1>{list}</div>);
  const onceMsg = c.msgs.find((m) => m.id === openOnce);
  const pinned = c.msgs.filter((m) => m.pinned && visible(m, me, now));
  return (<div className="col"><div className="row"><button className="btn ghost sm" onClick={() => setSel(null)} aria-label="Retour"><Ico n="back" s={16} /></button><h2 className="grow ell">{title(c)}</h2><span className="muted small">Démo locale</span></div>
    {pinned.length > 0 && <div className="card small">📌 {pinned.map((m) => m.text || "Message").join(" · ")}</div>}
    <div className="card msgs" role="log" aria-live="polite">{c.msgs.filter((m) => !q || m.text.toLowerCase().includes(q.toLowerCase())).map((m) => { const mine = m.from === me; const ok = visible(m, me, now); const left = m.secs && m.reads[me] !== undefined ? Math.max(0, Math.ceil((m.reads[me] + m.secs * 1000 - now) / 1000)) : 0; const from = userOf(s, m.from); const rp = m.replyTo ? c.msgs.find((x) => x.id === m.replyTo) : null;
      return <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start" }}>{!mine && c.groupId && <span className="muted small">{from?.name}</span>}
        {m.once && !mine ? (m.gone?.[me] !== undefined ? <div className="bubble muted">🔥 Message vu et disparu</div> : <button className="bubble" style={{ border: "1px dashed var(--warm)" }} onClick={() => setOpenOnce(m.id)}>🔥 Message à voir une seule fois · toucher pour ouvrir</button>) : ok ? <div className={"bubble" + (mine ? " me" : "")}>{rp && <div className="small" style={{ opacity: .75, borderLeft: "3px solid currentColor", paddingLeft: 6, marginBottom: 4 }}>{rp.text.slice(0, 60)}</div>}{m.img && <div style={{ maxWidth: 240 }}><WmImage src={m.img} label={userOf(s, me)?.name || ""} alt="Photo" style={{ borderRadius: 12 }} /></div>}{m.audio && <audio controls src={m.audio} style={{ maxWidth: 220 }} />}{m.text}{m.edited && <i className="small"> (modifié)</i>}{m.secs > 0 && !mine && <div className="small" style={{ opacity: .8 }}>⏱ {left} s</div>}{m.secs > 0 && mine && <div className="small" style={{ opacity: .8 }}>⏱ éphémère {m.secs} s après lecture</div>}{m.once && mine && <div className="small" style={{ opacity: .85 }}>🔥 vue unique · {Object.keys(m.gone || {}).length ? "vu ✓" : "pas encore vu"}</div>}</div>
          : m.reads[me] === undefined ? <button className="bubble" style={{ border: "1px dashed var(--brand)" }} onClick={() => actions.openMsg(c.id, m.id)}>🔒 Message éphémère · toucher pour lire ({m.secs} s)</button> : <div className="bubble muted">⌛ Message expiré</div>}
        <div className="muted small" style={{ display: "flex", gap: 8 }}>{ago(m.at, now)}{mine && c.memberIds.filter((x) => x !== me).every((x) => m.reads[x] !== undefined) && " · ✓✓ lu"}{mine && Object.keys(m.reads).length === 0 && " · ✓ envoyé"}
          {ok && <><button style={{ background: "none", border: 0, color: "inherit", padding: 0 }} onClick={() => setRep(m)}>↩︎</button><button style={{ background: "none", border: 0, color: "inherit", padding: 0 }} onClick={() => actions.pinMsg(c.id, m.id)}>📌</button></>}
          {mine && <><button style={{ background: "none", border: 0, color: "inherit", padding: 0 }} onClick={() => { setEdit(m.id); setTxt(m.text); }}>✎</button><button style={{ background: "none", border: 0, color: "inherit", padding: 0 }} onClick={() => actions.deleteMsg(c.id, m.id)}>🗑</button></>}</div></div>; })}
      {!c.msgs.length && <p className="muted center">Dites bonjour 👋</p>}<div ref={end} /></div>
    {onceMsg && <OnceViewer conv={c.id} m={onceMsg} me={me} name={userOf(s, me)?.name || ""} onClose={() => setOpenOnce(null)} />}
    {rep && <div className="card small row"><span className="grow ell">↩︎ {rep.text.slice(0, 60)}</span><button className="btn ghost sm" onClick={() => setRep(null)}><Ico n="x" s={14} /></button></div>}
    <div className="tabs"><span className="muted small" style={{ alignSelf: "center" }}>Durée :</span>{[["p", "♾️ Permanent"], ["o", "🔥 Vu une fois"], ["10", "⏱ 10 s après lecture"], ["60", "⏱ 1 min après lecture"]].map(([v, l]) => { const on = v === "p" ? !once && secs === 0 : v === "o" ? once : !once && secs === Number(v); return <button key={v} className={"chip" + (on ? " on" : "")} onClick={() => { setOnce(v === "o"); setSecs(v === "p" || v === "o" ? 0 : Number(v)); }}>{l}</button>; })}</div>
    <form className="row" onSubmit={(e) => { e.preventDefault(); sendTxt(); }}>
      <input ref={img} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f && c) { try { actions.send(c.id, "", secs, await fileToDataUrl(f, 800), undefined, null, once); } catch { toast("Image illisible."); } } e.target.value = ""; }} />
      <button type="button" className="btn ghost sm" onClick={() => img.current?.click()} aria-label="Photo"><Ico n="img" s={18} /></button>
      <button type="button" className="btn ghost sm" onClick={voice} aria-label="Message vocal" style={rec ? { background: "var(--bad)", color: "#fff" } : undefined}>🎤</button>
      <input className="inp" placeholder={edit ? "Modifier le message…" : "Votre message…"} value={txt} onChange={(e) => setTxt(e.target.value)} aria-label="Message" /><button className="btn" disabled={!txt.trim()} aria-label="Envoyer"><Ico n="send" s={18} /></button></form></div>);
}

// ───────── Jeux : Morpion à deux (chacun joue depuis son profil) + Quiz solo
const QUIZ: [string, string[], number][] = [
  ["Combien de côtés a un hexagone ?", ["5", "6", "7", "8"], 1], ["Quelle est la capitale de l'Italie ?", ["Milan", "Naples", "Rome", "Turin"], 2], ["Quel animal est le plus rapide sur terre ?", ["Lion", "Guépard", "Cheval", "Antilope"], 1],
  ["Combien y a-t-il de minutes dans une heure et demie ?", ["60", "75", "90", "100"], 2], ["Quelle planète est la plus proche du Soleil ?", ["Vénus", "Mars", "Terre", "Mercure"], 3], ["Quel fruit donne le cidre ?", ["Poire", "Pomme", "Raisin", "Cerise"], 1],
  ["Combien de joueurs dans une équipe de football sur le terrain ?", ["9", "10", "11", "12"], 2], ["De quelle couleur est le mélange du bleu et du jaune ?", ["Vert", "Orange", "Violet", "Marron"], 0], ["Quel est le plus grand océan ?", ["Atlantique", "Indien", "Arctique", "Pacifique"], 3], ["Combien de jours en février d'une année bissextile ?", ["28", "29", "30", "31"], 1],
];
export function Games() {
  const s = useStore((x) => x); const me = s.me; const [tab, setTab] = useState("morpion"); const friends = (s.social.friends[me] || []).map((i) => userOf(s, i)!).filter(Boolean);
  const games = s.games.filter((g) => g.xId === me || g.oId === me);
  const [qi, setQi] = useState(0); const [pts, setPts] = useState(0); const [ans, setAns] = useState<number | null>(null); const [done, setDone] = useState(false);
  const board = (g: (typeof games)[0]) => { const mine = (g.turn === "X" ? g.xId : g.oId) === me; const w = g.winner; const nm = (id: string) => userOf(s, id)?.name;
    return <div key={g.id} className="card col" style={{ alignItems: "center" }}><b>{nm(g.xId)} (✕) contre {nm(g.oId)} (◯)</b>
      <div className="ttt">{g.board.map((c, i) => <button key={i} onClick={() => actions.play(g.id, i)} disabled={!!c || !!w || !mine} aria-label={"Case " + (i + 1)} style={{ color: c === "X" ? "var(--brand2)" : "var(--warm)" }}>{c === "X" ? "✕" : c === "O" ? "◯" : ""}</button>)}</div>
      <div className={w ? "" : "muted"}>{w ? (w === "draw" ? "Match nul 🤝" : `🏆 ${nm(w === "X" ? g.xId : g.oId)} a gagné !`) : mine ? "C'est votre tour" : `Au tour de ${nm(g.turn === "X" ? g.xId : g.oId)} (changez de membre dans Paramètres pour jouer à sa place en démo)`}</div></div>; };
  const q = QUIZ[qi];
  return (<div className="col"><h1>Jeux</h1><div className="tabs"><button className={"chip" + (tab === "morpion" ? " on" : "")} onClick={() => setTab("morpion")}>⭕ Morpion à deux</button><button className={"chip" + (tab === "quiz" ? " on" : "")} onClick={() => setTab("quiz")}>🧠 Quiz</button><button className="chip" disabled>♟️ Échecs · bientôt</button><button className="chip" disabled>🃏 Rami · bientôt</button></div>
    {tab === "morpion" && <><div className="card col"><b>Inviter un ami</b><div className="tabs" style={{ flexWrap: "wrap" }}>{friends.map((f) => <button key={f.id} className="chip" onClick={() => { if (areFriends(s.social, me, f.id)) { actions.newGame(f.id); toast(`Partie lancée avec ${f.name}.`); } }}>{f.name}</button>)}</div></div>{games.map(board)}{!games.length && <p className="muted">Aucune partie. Invitez un ami ci-dessus.</p>}</>}
    {tab === "quiz" && <div className="card col">{done ? <div className="center col"><h2>Bravo ! {pts}/{QUIZ.length}</h2><div className="muted">Votre total : {s.scores[me] || 0} points</div><button className="btn" onClick={() => { setQi(0); setPts(0); setDone(false); setAns(null); }}>Rejouer</button></div> : <>
      <div className="muted small">Question {qi + 1}/{QUIZ.length} · Score {pts}</div><h3>{q[0]}</h3>{q[1].map((o, i) => <button key={i} className="btn ghost" disabled={ans !== null} onClick={() => { setAns(i); if (i === q[2]) { setPts(pts + 1); actions.addScore(1); } }} style={ans !== null ? { background: i === q[2] ? "rgba(52,211,153,.3)" : i === ans ? "rgba(251,113,133,.3)" : undefined } : undefined}>{o}</button>)}
      {ans !== null && <button className="btn" onClick={() => { if (qi + 1 < QUIZ.length) { setQi(qi + 1); setAns(null); } else setDone(true); }}>{qi + 1 < QUIZ.length ? "Suivante" : "Terminer"}</button>}</>}</div>}
  </div>);
}

export function Media() {
  const s = useStore((x) => x); const me = s.me; const mine = s.posts.filter((p) => p.authorId === me && p.img && !p.story);
  const shared = s.posts.filter((p) => p.authorId !== me && p.img && !p.purged && p.viewSecs === 0 && p.recipients.includes(me));
  const G = ({ l }: { l: typeof mine }) => <div className="grid2">{l.map((p) => <figure key={p.id} className="card" style={{ margin: 0, padding: 8 }}><div className="protected"><WmImage src={p.img!} label={userOf(s, me)?.name || ""} alt={p.text || "Photo"} style={{ aspectRatio: "1", objectFit: "cover" }} /></div><figcaption className="muted small">{p.viewSecs ? `⏱ ${p.viewSecs} s` : "♾️"} · {userOf(s, p.authorId)?.name}</figcaption></figure>)}</div>;
  return (<div className="col"><h1>Photos</h1><h3>Mes photos</h3>{mine.length ? <G l={mine} /> : <p className="muted">Vos photos publiées apparaîtront ici.</p>}<h3>Partagées avec moi (permanentes)</h3>{shared.length ? <G l={shared} /> : <p className="muted">Rien pour l'instant.</p>}<p className="muted small">Albums et vidéos : bientôt.</p></div>);
}
export function Soon({ title, icon, why }: { title: string; icon: string; why: string }) {
  return <div className="col"><h1>{title}</h1><div className="card center col" style={{ alignItems: "center", padding: 34 }}><div style={{ fontSize: "3rem" }}>{icon}</div><h3>Bientôt disponible</h3><p className="muted" style={{ maxWidth: 420 }}>{why}</p></div></div>;
}
