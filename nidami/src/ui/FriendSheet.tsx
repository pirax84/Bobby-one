import { useEffect, useState } from "react";
import { useStore, actions, userOf } from "../lib/store";
import { friendCats } from "../lib/cats";
import { startCall } from "../lib/call";
import { CatPicker } from "./Cats";
import { Avatar, Ico, MicIcon, toast } from "./common";
import { t, T } from "../i18n";

/** Fiche d'un ami : photo, 4 gros boutons en bas (écrire, appeler, vocal, vidéo), 2 lignes (lien, catégories) et un menu ⋯ (retirer, signaler, bloquer). */
export function FriendSheet({ id, onClose, go, onReport }: { id: string; onClose: () => void; go: (v: string, conv?: string) => void; onReport: (id: string) => void }) {
  const s = useStore((x) => x); const me = s.me; const f = userOf(s, id);
  const [more, setMore] = useState(false); const [sub, setSub] = useState<"" | "tie" | "cats">("");
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && (sub ? setSub("") : more ? setMore(false) : onClose()); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [sub, more, onClose]);
  if (!f) return null;
  const tie = s.social.ties?.[f.id] as "family" | "fav" | undefined;
  const tieLabel = tie === "family" ? "❤ " + t("Famille") : tie === "fav" ? "★ " + t("Favori") : t("Aucun");
  const cats = friendCats(s.social, me, f.id); const catsOn = cats.length;
  const dm = () => { const cid = actions.startDm(f.id); onClose(); go("messages", cid); };
  const visio = () => { const cid = actions.startDm(f.id); const a = new Uint8Array(9); crypto.getRandomValues(a); const url = "https://meet.jit.si/" + t("Cercle") + Array.from(a, (x) => x.toString(36)).join(""); actions.send(cid, t("📹 Je lance une visio : {url}", { url }), 0); window.open(url, "_blank", "noopener"); toast(t("Visio lancée : le lien est envoyé dans la conversation.")); onClose(); };
  const call = () => { onClose(); void startCall(f.id).then((ok) => { if (!ok) toast("Appel impossible : autorise le micro, puis réessaie."); }); };
  return (<div className="overlay fsheet-ov" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="modal fsheet" role="dialog" aria-modal="true" aria-label={f.name}>
    <div className="fs-top"><button className="fs-ib" onClick={() => (sub ? setSub("") : onClose())} aria-label={t("Fermer")}><Ico n="back" s={22} /></button>
      {!sub && <button className="fs-ib" onClick={() => setMore((m) => !m)} aria-label={t("Plus")} aria-expanded={more}><Ico n="more" s={26} /></button>}</div>
    {more && <div className="fs-menu" role="menu">
      <button role="menuitem" onClick={() => { if (confirm(t("Retirer {name} de vos amis ?", { name: f.name }))) { actions.unfriend(f.id); onClose(); } }}>{t("Retirer des amis")}</button>
      <button role="menuitem" onClick={() => { onClose(); onReport(f.id); }}>{t("Signaler")}</button>
      <button role="menuitem" className="bad" onClick={() => { if (confirm(t("Bloquer {name} ? Il ne verra plus vos contenus.", { name: f.name }))) { actions.block(f.id, true); toast(t("Bloqué.")); onClose(); } }}>{t("Bloquer")}</button></div>}
    {sub === "" ? <>
      <div className="fs-id"><Avatar u={f} s={110} /><h2>{f.name}</h2><div className="muted small">@{f.handle}</div></div>
      <div className="fs-rows">
        <button className="fs-row" onClick={() => setSub("tie")}><span>{t("Lien")}</span><span className="fs-pill">{tieLabel} ›</span></button>
        <button className="fs-row" onClick={() => setSub("cats")}><span>{t("Catégories")}</span><span className="fs-pill">{catsOn ? catsOn : t("Aucune")} ›</span></button></div>
      <div className="fs-acts">
        <button onClick={dm}><i><Ico n="chat" s={26} /></i>{t("Écrire")}</button>
        <button onClick={call}><i><Ico n="phone" s={26} /></i>{t("Appeler")}</button>
        <button onClick={dm}><i className="mic"><MicIcon size={26} /></i>{t("Vocal")}</button>
        <button onClick={visio}><i><Ico n="video" s={26} /></i>{t("Vidéo")}</button></div></>
    : sub === "tie" ? <div className="col" style={{ gap: 10 }}><h3>{t("Lien avec {name}", { name: f.name })}</h3><div className="chiprow">{([[undefined, T("Aucun")], ["family", T("Famille")], ["fav", T("Favori")]] as const).map(([k, l]) => <button key={l} className={"chip" + ((tie || undefined) === k ? " on" : "")} onClick={() => { actions.setTie(f.id, k || null); setSub(""); }}>{k === "family" ? "❤ " : k === "fav" ? "★ " : ""}{t(l)}</button>)}</div></div>
    : <div className="col" style={{ gap: 10 }}><h3>{t("Catégories")}</h3><CatPicker value={cats} onChange={(v) => actions.setFriendCats(f.id, v)} /><button className="btn" onClick={() => setSub("")}>OK</button></div>}
  </div></div>);
}
