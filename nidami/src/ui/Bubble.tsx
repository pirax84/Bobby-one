import { useEffect, useRef, useState } from "react";
import { useStore, actions, userOf, Conv } from "../lib/store";
import { Avatar, Ico, useNow, EmojiGrid, toast, lp, ConfirmDel } from "./common";
import { FxBar } from "./FxBar";
import { HoldMic } from "./Recorder";

/** Bulle de messages flottante (comme Messenger) : touchez-la pour lire et répondre sans quitter la page. */
export function ChatBubble({ openFull }: { openFull: (convId: string) => void }) {
  const s = useStore((x) => x); const me = s.me; const now = useNow(1000);
  const convs = s.convs.filter((c) => c.memberIds.includes(me)).sort((a, b) => (b.msgs.at(-1)?.at || 0) - (a.msgs.at(-1)?.at || 0));
  const unread = (c: Conv) => c.msgs.filter((m) => m.from !== me && m.reads[me] === undefined).length;
  const total = convs.reduce((a, c) => a + unread(c), 0);
  const [tab, setTab] = useState<"conv" | "amis">("conv"); const friends = (s.social.friends[me] || []).map((id) => userOf(s, id)).filter(Boolean) as NonNullable<ReturnType<typeof userOf>>[]; const [del, setDel] = useState<string | null>(null); const [open, setOpen] = useState(false); const [sel, setSel] = useState<string | null>(null); const [txt, setTxt] = useState("");
  const [pop, setPop] = useState<{ id: string; who: string; text: string } | null>(null);
  const prev = useRef(total); const end = useRef<HTMLDivElement>(null);
  const title = (c: Conv) => c.title || c.memberIds.filter((m) => m !== me).map((m) => userOf(s, m)?.name).join(", ");
  const c = convs.find((x) => x.id === sel);
  // Petite info qui apparaît quand un nouveau message arrive.
  useEffect(() => {
    if (total > prev.current && !open) { const cv = convs.find((x) => unread(x) > 0); const m = cv?.msgs.filter((y) => y.from !== me).at(-1); if (cv && m) { setPop({ id: cv.id, who: userOf(s, m.from)?.name || "", text: m.secs || m.once ? "🔒 Message éphémère" : m.audio ? "🎤 Message vocal" : m.text || "📷 Photo" }); const t = setTimeout(() => setPop(null), 6000); prev.current = total; return () => clearTimeout(t); } }
    prev.current = total;
  }, [total]);
  useEffect(() => { if (c && open) actions.markRead(c.id); end.current?.scrollIntoView({ block: "end" }); }, [sel, open, c?.msgs.length]);
  const [emo, setEmo] = useState(false);
  const send = () => { if (c && txt.trim()) { actions.send(c.id, txt, 0); setTxt(""); } };
  if (!convs.length && !friends.length) return null;
  const vis = (m: Conv["msgs"][number]) => m.from === me || (!m.once && (m.secs === 0 || (m.reads[me] !== undefined && now < m.reads[me] + m.secs * 1000)));
  return (<>
    {pop && !open && <button className="bpop" onClick={() => { setSel(pop.id); setOpen(true); setPop(null); }}><b>{pop.who}</b><span className="ell">{pop.text}</span></button>}
    {open && <div className="bpanel" role="dialog" aria-label="Messages rapides">
      <div className="bhead">{c && <button className="bi" onClick={() => setSel(null)} aria-label="Retour à la liste"><Ico n="back" s={18} /></button>}<b className="grow ell">{c ? title(c) : "Messages"}</b>{c && <button className="bi" onClick={() => { setOpen(false); openFull(c.id); }} aria-label="Ouvrir en grand">⤢</button>}<button className="bi" onClick={() => setOpen(false)} aria-label="Fermer"><Ico n="x" s={18} /></button></div>
      {!c && <div className="row" style={{ gap: 6, padding: "8px 10px 0" }}><button type="button" className={"chip" + (tab === "conv" ? " on" : "")} onClick={() => setTab("conv")}>💬 Conversations</button><button type="button" className={"chip" + (tab === "amis" ? " on" : "")} onClick={() => setTab("amis")}>👥 Mes amis</button></div>}
      {!c && tab === "amis" ? <div className="blist">{friends.map((f) => <button key={f.id} className="brow" onClick={() => { const id = actions.startDm(f.id); if (id) { setSel(id); setTab("conv"); } }}><Avatar u={f} s={38} /><span className="grow"><b>{f.name}</b><span className="muted small ell" style={{ display: "block" }}>Écrire un message</span></span></button>)}{!friends.length && <p className="muted center">Pas encore d'amis. Ajoutez-en dans l'onglet Amis.</p>}</div>
      : !c ? <div className="blist">{convs.map((x) => { const last = x.msgs.at(-1); const u = unread(x); return <button key={x.id} className="brow" onClick={() => setSel(x.id)}>{x.groupId ? <span className="av" style={{ width: 38, height: 38, background: "var(--grad)" }}>👥</span> : <Avatar u={userOf(s, x.memberIds.find((m) => m !== me)!)} s={38} />}<span className="grow"><b>{title(x)}</b><span className="muted small ell" style={{ display: "block" }}>{last ? ((last.secs || last.once) && last.from !== me ? "🔒 Message éphémère" : last.audio ? "🎤 Message vocal" : last.text || "📷 Photo") : "Nouvelle conversation"}</span></span>{u > 0 && <span className="badge">{u}</span>}</button>; })}{!convs.length && <p className="muted center">Aucune conversation. Choisissez un ami dans « Mes amis ».</p>}</div>
        : <><div className="bmsgs">{c.msgs.slice(-30).map((m) => <div key={m.id} className={"bmsg" + (m.from === me ? " me" : "")} {...(m.from === me ? lp(() => setDel(m.id)) : {})}>{vis(m) ? (m.img ? "📷 Photo" : m.audio ? <audio controls src={m.audio} style={{ maxWidth: 200 }} /> : m.text) : <button className="linkish" onClick={() => { setOpen(false); openFull(c.id); }}>🔒 {m.once ? "Vu une fois" : "Message éphémère"} · ouvrir en grand</button>}</div>)}<div ref={end} /></div>
          {del && sel && <ConfirmDel what="ce message" onYes={() => actions.deleteMsg(sel, del)} onClose={() => setDel(null)} />}
          {emo && <div className="empanel" style={{ margin: "0 8px", maxHeight: 150 }}><EmojiGrid onPick={(e) => setTxt((t) => t + e)} onClose={() => setEmo(false)} /></div>}
          <FxBar convId={c.id} compact />
          <form className="bform" onSubmit={(e) => { e.preventDefault(); send(); }}><button type="button" className="bi2" onClick={() => setEmo(!emo)} aria-label="Emojis"><Ico n="smile" s={18} /></button><HoldMic className="btn sm" onDone={(u) => actions.send(c.id, "", 0, null, undefined, u, false)}><Ico n="mic" s={18} /></HoldMic><input className="inp sm" placeholder="Votre message…" value={txt} onChange={(e) => setTxt(e.target.value)} aria-label="Message rapide" autoFocus /><button className="btn sm" disabled={!txt.trim()} aria-label="Envoyer"><Ico n="send" s={16} /></button></form></>}
    </div>}
    {!open && <button className="bfab" onClick={() => { setOpen(true); setPop(null); }} aria-label={"Messages" + (total ? ` (${total} non lus)` : "")}><Ico n="chat" s={26} />{total > 0 && <span className="badge" style={{ position: "absolute", top: -4, right: -4 }}>{total}</span>}</button>}
  </>);
}
