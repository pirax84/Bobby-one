import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useStore, actions } from "../lib/store";
import { Avatar, Ico, toast } from "./common";
import { t } from "../i18n";

/** Recherche : une pastille (ordinateur) ou une loupe (téléphone) ; au toucher, un petit volet s'ouvre dessous, sans quitter la page. */
export function SearchTop({ go, openConv, variant = "pill" }: { go: (v: string) => void; openConv: (id: string) => void; variant?: "pill" | "icon" }) {
  const [open, setOpen] = useState(false); const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null); const btn = useRef<HTMLButtonElement>(null);
  const openIt = () => { const r = btn.current?.getBoundingClientRect(); const W = window.innerWidth; const width = Math.min(440, W - 16); const left = variant === "pill" && r ? Math.min(Math.max(8, r.left + r.width / 2 - width / 2), W - width - 8) : W - width - 8; setBox({ top: (r?.bottom || 56) + 8, left, width }); history.pushState({ ...(history.state || {}), srch: 1 }, ""); setOpen(true); };
  const close = () => { if (history.state?.srch) history.back(); else setOpen(false); };
  useEffect(() => { if (!open) return; const f = () => setOpen(false); window.addEventListener("popstate", f); return () => window.removeEventListener("popstate", f); }, [open]);
  return (<>{variant === "icon"
    ? <button ref={btn} type="button" className="topb" onClick={openIt} aria-label={t("Rechercher")}><Ico n="search" s={20} /></button>
    : <button ref={btn} type="button" className="srch" onClick={openIt} aria-label={t("Rechercher")}><Ico n="search" s={18} /><span className="srcht">{t("Rechercher")}</span></button>}
    {open && box && <SearchPage box={box} onClose={close} go={(v) => { setOpen(false); go(v); }} openConv={(id) => { setOpen(false); openConv(id); }} />}</>);
}

function SearchPage({ box, onClose, go, openConv }: { box: { top: number; left: number; width: number }; onClose: () => void; go: (v: string) => void; openConv: (id: string) => void }) {
  const s = useStore((x) => x); const me = s.me; const [q, setQ] = useState(""); const inp = useRef<HTMLInputElement>(null);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  const tx = q.trim().toLowerCase().replace(/^@/, ""); const on = tx.length >= 2; const has = (x?: string) => !!x && x.toLowerCase().includes(tx);
  const friendIds = s.social.friends[me] || [];
  const friends = on ? s.users.filter((u) => friendIds.includes(u.id) && (has(u.name) || has(u.handle))) : [];
  const people = on ? actions.searchUsers(q).filter((u) => !friendIds.includes(u.id)) : [];
  const groups = on ? s.social.groups.filter((g) => g.memberIds.includes(me) && has(g.name)) : [];
  const convOfGroup = (gid: string) => s.convs.find((c) => c.groupId === gid && c.memberIds.includes(me));
  // Messages : jamais les messages éphémères ou à voir une fois.
  const msgs = on ? s.convs.filter((c) => c.memberIds.includes(me)).flatMap((c) => c.msgs.filter((m) => !m.secs && !m.once && has(m.text)).map((m) => ({ c, m }))).sort((a, b) => b.m.at - a.m.at).slice(0, 8) : [];
  const posts = on ? s.posts.filter((p) => (p.authorId === me || p.recipients.includes(me)) && !(p.viewSecs > 0 || p.story) && (has(p.text) || p.comments.some((c) => has(c.text)))).slice(0, 8) : [];
  const nameOf = (id: string) => s.users.find((u) => u.id === id)?.name || "";
  const convTitle = (c: (typeof s.convs)[number]) => c.title || c.memberIds.filter((m) => m !== me).map(nameOf).join(", ");
  const none = on && !friends.length && !people.length && !groups.length && !msgs.length && !posts.length;
  const H = ({ children }: { children: string }) => <div className="muted small" style={{ margin: "10px 2px 4px", fontWeight: 700 }}>{children}</div>;
  return createPortal(<><div className="sbackdrop" onMouseDown={onClose} onTouchStart={onClose} />
    <div className="spanel" role="dialog" aria-label={t("Rechercher")} style={{ top: box.top, left: box.left, width: box.width }}>
    <div className="row" style={{ gap: 6 }}><input ref={inp} className="inp grow" type="search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Rechercher")} aria-label={t("Rechercher")} /><button className="btn ghost sm" onClick={onClose} aria-label={t("Fermer")}><Ico n="x" s={16} /></button></div>
    <div className="sbody">
      {!on && <p className="muted center" style={{ marginTop: 24 }}>{t("Écrivez au moins 2 lettres.")}</p>}
      {friends.length > 0 && <><H>{t("Mes amis")}</H>{friends.map((u) => <button key={u.id} type="button" className="brow" onClick={() => { const id = actions.startDm(u.id); if (id) openConv(id); }}><Avatar u={u} s={38} /><span className="grow"><b>{u.name}</b><span className="muted small" style={{ display: "block" }}>@{u.handle}</span></span></button>)}</>}
      {people.length > 0 && <><H>{t("Nouvelles personnes")}</H>{people.map((u) => <div key={u.id} className="row" style={{ padding: "6px 0", alignItems: "center", gap: 10 }}><Avatar u={u} s={38} /><div className="grow"><b>{u.name}</b><div className="muted small">@{u.handle}</div></div><button className="btn sm" onClick={() => toast(actions.requestFriend(u.id).msg)}>{t("Ajouter")}</button></div>)}</>}
      {groups.length > 0 && <><H>{t("Groupes")}</H>{groups.map((g) => { const c = convOfGroup(g.id); return <button key={g.id} type="button" className="brow" onClick={() => (c ? openConv(c.id) : go("groups"))}><span className="av" style={{ width: 38, height: 38, background: "var(--grad)" }}>{g.emoji || "👥"}</span><span className="grow"><b>{g.name}</b></span></button>; })}</>}
      {msgs.length > 0 && <><H>{t("Messages")}</H>{msgs.map(({ c, m }) => <button key={m.id} type="button" className="brow" onClick={() => openConv(c.id)}><span className="grow"><b>{convTitle(c)}</b><span className="muted small ell" style={{ display: "block" }}>{nameOf(m.from)} : {m.text}</span></span></button>)}</>}
      {posts.length > 0 && <><H>{t("Publications")}</H>{posts.map((p) => <button key={p.id} type="button" className="brow" onClick={() => go("home")}><Avatar u={s.users.find((u) => u.id === p.authorId)} s={38} /><span className="grow"><b>{nameOf(p.authorId)}</b><span className="muted small ell" style={{ display: "block" }}>{p.text || p.comments.find((c) => has(c.text))?.text}</span></span></button>)}</>}
      {none && <p className="muted center" style={{ marginTop: 24 }}>{t("Aucun résultat.")}</p>}
    </div></div></>, document.body);
}
