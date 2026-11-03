import { useState } from "react";
import { useStore, actions } from "../lib/store";
import { feedFor, areFriends } from "../lib/engine";
import { Avatar, Modal, toast, ago } from "./common";
import { t } from "../i18n";

/** « Je suis bien arrivé » : un message tout prêt, sans position, envoyé aux proches choisis. */
export function ArrivedModal({ onClose }: { onClose: () => void }) {
  const me = useStore((s) => s.me); const users = useStore((s) => s.users); const social = useStore((s) => s.social);
  const friends = users.filter((u) => u.id !== me && areFriends(social, me, u.id));
  const [sel, setSel] = useState<string[]>([]);
  const toggle = (id: string) => setSel((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const send = () => { for (const id of sel) { const c = actions.startDm(id); if (c) actions.send(c, t("Je suis bien arrivé 💜")); } toast(t("Message envoyé à {n} personne(s).", { n: sel.length })); onClose(); };
  return (<Modal title={t("🏠 Je suis bien arrivé")} onClose={onClose}><div className="col">
    <p className="muted small" style={{ margin: 0 }}>{t("Choisissez qui prévenir. Le message est « Je suis bien arrivé 💜 ». Votre position n'est jamais envoyée.")}</p>
    {!friends.length && <p className="muted">{t("Ajoutez d'abord des amis.")}</p>}
    {friends.map((u) => <label key={u.id} className="row" style={{ gap: 10, alignItems: "center" }}><input type="checkbox" checked={sel.includes(u.id)} onChange={() => toggle(u.id)} style={{ width: 22, height: 22 }} /><Avatar u={u} s={36} /><b>{u.name}</b></label>)}
    <button className="btn" disabled={!sel.length} onClick={send}>{t("Envoyer")}</button></div></Modal>);
}

const DAY = 864e5;
/** « Souvenir du jour » : une publication d'il y a environ un an. */
export function MemoryCard() {
  const me = useStore((s) => s.me); const posts = useStore((s) => s.posts); const social = useStore((s) => s.social); const users = useStore((s) => s.users);
  const key = "notiif-mem-hide-" + new Date().toDateString();
  const [hid, setHid] = useState(() => { try { return !!localStorage.getItem(key); } catch { return false; } }); const [open, setOpen] = useState(false);
  if (hid) return null;
  const t0 = Date.now() - 365 * DAY;
  const p = feedFor(posts, me, Date.now(), social).filter((x) => !x.story && !x.viewSecs && Math.abs(x.createdAt - t0) < 1.5 * DAY && (x.text || x.img))[0];
  if (!p) return null;
  const au = users.find((u) => u.id === p.authorId);
  return (<><div className="card row" style={{ gap: 10, alignItems: "center", padding: "8px 12px" }}><span style={{ fontSize: 24 }}>🕰️</span>
    <div className="grow"><b>{t("Souvenir du jour")}</b><div className="muted small">{t("Il y a un an, avec {name}", { name: au?.name || "" })}</div></div>
    <button className="btn sm" onClick={() => setOpen(true)}>{t("Revoir")}</button>
    <button className="btn ghost sm" aria-label={t("Masquer")} onClick={() => { try { localStorage.setItem(key, "1"); } catch { /* rien */ } setHid(true); }}>✕</button></div>
    {open && <Modal title={t("Souvenir du jour")} onClose={() => setOpen(false)}><div className="col">{p.img && <img src={p.img} alt="" style={{ width: "100%", borderRadius: 12 }} />}{p.text && <p>{p.text}</p>}<div className="muted small">{au?.name} · {ago(p.createdAt)}</div></div></Modal>}</>);
}
