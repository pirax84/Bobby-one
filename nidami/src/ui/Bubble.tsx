import { useEffect, useRef, useState } from "react";
import { useStore, actions, userOf, Conv } from "../lib/store";
import { Avatar, Ico, useNow, EmojiGrid, toast, lp, ConfirmDel } from "./common";
import { FxBar } from "./FxBar";
import { HoldMic } from "./Recorder";
import { AudioWave } from "./AudioWave";
import { t } from "../i18n";

/** Bulle de messages flottante (comme Messenger) : touchez-la pour lire et répondre sans quitter la page. */
export function ChatBubble({ openFull }: { openFull: (convId: string) => void }) {
  const s = useStore((x) => x); const me = s.me; const now = useNow(1000);
  const convs = s.convs.filter((c) => c.memberIds.includes(me)).sort((a, b) => (b.msgs.at(-1)?.at || 0) - (a.msgs.at(-1)?.at || 0));
  const unread = (c: Conv) => c.msgs.filter((m) => m.from !== me && m.reads[me] === undefined).length;
  const total = convs.reduce((a, c) => a + unread(c), 0);
  const [tab, setTab] = useState<"conv" | "amis" | "groupes">("conv"); const swipe = useRef<number | null>(null); const friends = (s.social.friends[me] || []).map((id) => userOf(s, id)).filter(Boolean) as NonNullable<ReturnType<typeof userOf>>[]; const [del, setDel] = useState<string | null>(null); const [open, setOpen] = useState(false); const [sel, setSel] = useState<string | null>(null); const [txt, setTxt] = useState("");
  const [pop, setPop] = useState<{ id: string; who: string; text: string } | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(() => { try { const j = JSON.parse(localStorage.getItem("notiif-bubble") || "null"); return j && typeof j.x === "number" && typeof j.y === "number" ? j : null; } catch { return null; } }); const posRef = useRef(pos); const drag = useRef<{ dx: number; dy: number; sx: number; sy: number; moved: boolean } | null>(null);
  const prev = useRef(total); const end = useRef<HTMLDivElement>(null);
  const groups = s.social.groups.filter((g) => g.memberIds.includes(me) && convs.some((x) => x.groupId === g.id));
  const groupUnread = groups.reduce((a, g) => a + (convs.filter((x) => x.groupId === g.id).reduce((b, x) => b + unread(x), 0)), 0);
  const title = (c: Conv) => c.title || c.memberIds.filter((m) => m !== me).map((m) => userOf(s, m)?.name).join(", ");
  const c = convs.find((x) => x.id === sel);
  // Petite info qui apparaît quand un nouveau message arrive.
  useEffect(() => {
    if (total > prev.current && !open) { const cv = convs.find((x) => unread(x) > 0); const m = cv?.msgs.filter((y) => y.from !== me).at(-1); if (cv && m) { setPop({ id: cv.id, who: userOf(s, m.from)?.name || "", text: m.secs || m.once ? t("🔒 Message éphémère") : m.audio ? t("🎤 Message vocal") : m.text || t("📷 Photo") }); const tx = setTimeout(() => setPop(null), 6000); prev.current = total; return () => clearTimeout(tx); } }
    prev.current = total;
  }, [total]);
  useEffect(() => { if (c && open) actions.markRead(c.id); end.current?.scrollIntoView({ block: "end" }); }, [sel, open, c?.msgs.length]);
  const [emo, setEmo] = useState(false);
  const send = () => { if (c && txt.trim()) { actions.send(c.id, txt, 0); setTxt(""); } };
  if (!convs.length && !friends.length) return null;
  const vis = (m: Conv["msgs"][number]) => m.from === me || (!m.once && (m.secs === 0 || (m.reads[me] !== undefined && now < m.reads[me] + m.secs * 1000)));
  return (<>
    {pop && !open && <button className="bpop" onClick={() => { setSel(pop.id); setOpen(true); setPop(null); }}><b>{pop.who}</b><span className="ell">{pop.text}</span></button>}
    {open && <div className="bpanel" role="dialog" aria-label={t("Messages rapides")} onTouchStart={(e) => { swipe.current = e.touches[0].clientX; }} onTouchEnd={(e) => { const x0 = swipe.current; swipe.current = null; if (x0 === null || c) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) < 60) return; const order = ["conv", "amis", "groupes"] as const; const i = order.indexOf(tab); const j = dx < 0 ? Math.min(2, i + 1) : Math.max(0, i - 1); setTab(order[j]); }}>
      <div className="bhead">{c && <button className="bi" onClick={() => setSel(null)} aria-label={t("Retour à la liste")}><Ico n="back" s={18} /></button>}<b className="grow ell">{c ? title(c) : t("Messages")}</b>{c && <button className="bi" onClick={() => { setOpen(false); openFull(c.id); }} aria-label={t("Ouvrir en grand")}>⤢</button>}<button className="bi" onClick={() => setOpen(false)} aria-label={t("Fermer")}><Ico n="x" s={18} /></button></div>
      {!c && <div className="btabs" role="tablist">{([["conv", "💬", t("Discussions")], ["amis", "👤", t("Amis")], ["groupes", "👥", t("Groupes")]] as const).map(([k, ic, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}><b>{ic}</b>{l}{k === "groupes" && groupUnread > 0 && <span className="badge" style={{ marginLeft: 6 }}>{groupUnread}</span>}</button>)}</div>}
      {!c && tab === "groupes" ? <div className="blist">{groups.map((g) => { const cv = convs.find((x) => x.groupId === g.id); const last = cv?.msgs.at(-1); const u = cv ? unread(cv) : 0; return <button key={g.id} className="brow" onClick={() => { if (cv) setSel(cv.id); }}><span className="av" style={{ width: 38, height: 38, background: "var(--grad)" }}>{g.emoji || "👥"}</span><span className="grow"><b>{g.name}</b><span className="muted small ell" style={{ display: "block" }}>{last ? ((last.secs || last.once) && last.from !== me ? t("🔒 Message éphémère") : last.audio ? t("🎤 Message vocal") : last.text || t("📷 Photo")) : t("{n, plural, one{# membre} other{# membres}}", { n: g.memberIds.length })}</span></span>{u > 0 && <span className="badge">{u}</span>}</button>; })}{!groups.length && <p className="muted center">{t("Créez un groupe pour la famille, les vacances, les soirées…")}</p>}</div>
      : !c && tab === "amis" ? <div className="blist">{friends.map((f) => <button key={f.id} className="brow" onClick={() => { const id = actions.startDm(f.id); if (id) { setSel(id); setTab("conv"); } }}><Avatar u={f} s={38} /><span className="grow"><b>{f.name}</b><span className="muted small ell" style={{ display: "block" }}>{t("Écrire un message")}</span></span></button>)}{!friends.length && <p className="muted center">{t("Pas encore d'amis. Ajoutez-en dans l'onglet Amis.")}</p>}</div>
      : !c ? <div className="blist">{convs.map((x) => { const last = x.msgs.at(-1); const u = unread(x); return <button key={x.id} className="brow" onClick={() => setSel(x.id)}>{x.groupId ? <span className="av" style={{ width: 38, height: 38, background: "var(--grad)" }}>👥</span> : <Avatar u={userOf(s, x.memberIds.find((m) => m !== me)!)} s={38} />}<span className="grow"><b>{title(x)}</b><span className="muted small ell" style={{ display: "block" }}>{last ? ((last.secs || last.once) && last.from !== me ? t("🔒 Message éphémère") : last.audio ? t("🎤 Message vocal") : last.text || t("📷 Photo")) : t("Nouvelle conversation")}</span></span>{u > 0 && <span className="badge">{u}</span>}</button>; })}{!convs.length && <p className="muted center">{t("Aucune conversation. Choisissez un ami dans « Mes amis ».")}</p>}</div>
        : <><div className="bmsgs">{c.msgs.slice(-30).map((m) => <div key={m.id} className={"bmsg" + (m.from === me ? " me" : "")} {...(m.from === me ? lp(() => setDel(m.id)) : {})}>{vis(m) ? (m.img ? t("📷 Photo") : m.audio ? <AudioWave src={m.audio} mine={m.from === me} /> : m.text) : <button className="linkish" onClick={() => { setOpen(false); openFull(c.id); }}>🔒 {m.once ? t("Vu une fois") : t("Message éphémère")}{" "}{t("· ouvrir en grand")}</button>}</div>)}<div ref={end} /></div>
          {del && sel && <ConfirmDel what={t("ce message")} onYes={() => actions.deleteMsg(sel, del)} onClose={() => setDel(null)} />}
          {emo && <div className="empanel" style={{ margin: "0 8px", maxHeight: 150 }}><EmojiGrid onPick={(e) => setTxt((tx) => tx + e)} onClose={() => setEmo(false)} /></div>}
          <FxBar convId={c.id} compact />
          <form className="bform" onSubmit={(e) => { e.preventDefault(); send(); }}><button type="button" className="bi2" onClick={() => setEmo(!emo)} aria-label={t("Emojis")}><Ico n="smile" s={18} /></button><HoldMic className="btn sm" onDone={(u) => actions.send(c.id, "", 0, null, undefined, u, false)}><Ico n="mic" s={18} /></HoldMic><input className="inp sm" placeholder={t("Votre message…")} value={txt} onChange={(e) => setTxt(e.target.value)} aria-label={t("Message rapide")} autoFocus /><button className="btn sm" disabled={!txt.trim()} aria-label={t("Envoyer")}><Ico n="send" s={16} /></button></form></>}
    </div>}
    {!open && <button className="bfab" style={pos ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto", touchAction: "none" } : { touchAction: "none" }}
      onPointerDown={(e) => { const r = e.currentTarget.getBoundingClientRect(); drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top, sx: e.clientX, sy: e.clientY, moved: false }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignoré */ } }}
      onPointerMove={(e) => { const d = drag.current; if (!d) return; if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 8) return; d.moved = true; const p = { x: Math.min(Math.max(4, e.clientX - d.dx), window.innerWidth - 56), y: Math.min(Math.max(4, e.clientY - d.dy), window.innerHeight - 56) }; posRef.current = p; setPos(p); }}
      onPointerUp={() => { const d = drag.current; drag.current = null; if (d?.moved) { try { localStorage.setItem("notiif-bubble", JSON.stringify(posRef.current)); } catch { /* ignoré */ } } else { setOpen(true); setPop(null); } }}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true); setPop(null); } }}
      aria-label={t("Messages") + (total ? ` (${total} non lus)` : "")}><Ico n="chat" s={26} />{total > 0 && <span className="badge" style={{ position: "absolute", top: -4, right: -4 }}>{total}</span>}</button>}
  </>);
}
