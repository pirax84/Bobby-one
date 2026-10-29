import { useState } from "react";
import { useStore, actions, userOf } from "../lib/store";
import { Avatar, toast, ago } from "./common";
import { t } from "../i18n";

function Approve({ id }: { id: string }) {
  const [hours, setHours] = useState(0); const [secs, setSecs] = useState<number | undefined>(undefined); const [open, setOpen] = useState(false);
  const H: [number, string][] = [[0, t("Jusqu'à ce que je le retire")], [1, "1 heure"], [24, "24 heures"], [168, "7 jours"]];
  const S: [number | undefined, string][] = [[undefined, t("Comme l'original")], [5, "5 s"], [10, "10 s"], [30, "30 s"], [60, "1 min"]];
  return <div className="col" style={{ gap: 8 }}>
    {open && <div className="card col" style={{ gap: 8 }}><b className="small">{t("Combien de temps le partage reste-t-il visible ?")}</b><div className="tabs wrap">{H.map(([k, l]) => <button key={k} className={"chip" + (hours === k ? " on" : "")} onClick={() => setHours(k)}>{l}</button>)}</div>
      <b className="small">{t("Temps de consultation par personne")}</b><div className="tabs wrap">{S.map(([k, l]) => <button key={l} className={"chip" + (secs === k ? " on" : "")} onClick={() => setSecs(k)}>{l}</button>)}</div>
      <p className="muted small" style={{ margin: 0 }}>{t("🔒 Ce contenu ne peut pas être republié ailleurs : il porte un filigrane, les captures d'écran sont bloquées (application Android) et tout nouveau partage demande votre accord. Vous pouvez le retirer à tout moment.")}</p></div>}
    <div className="row"><button className="btn sm" onClick={() => { if (!open) { setOpen(true); return; } actions.answerShare(id, true, { secs, hours: hours || undefined }); toast(t("Partage autorisé. Vous pouvez le retirer quand vous voulez.")); }}>{open ? t("Confirmer l'autorisation") : t("Autoriser…")}</button><button className="btn ghost sm" onClick={() => actions.answerShare(id, false)}>{t("Refuser")}</button></div></div>;
}
export function Shares() {
  const s = useStore((x) => x); const me = s.me; const nm = (id: string) => userOf(s, id)?.name || "?";
  const incoming = s.shares.filter((h) => h.authorId === me && h.status === "pending");
  const active = s.shares.filter((h) => h.authorId === me && h.status === "approved");
  const mine = s.shares.filter((h) => h.requesterId === me);
  const label = (id: string) => { const p = s.posts.find((x) => x.id === id); return p ? (p.kind === "photo" ? "📷 " : "✉️ ") + (p.text.slice(0, 40) || t("Photo")) : t("contenu supprimé"); };
  return (<div className="col"><h1>{t("Partages")}</h1>
    <p className="muted small">{t("Personne ne peut republier votre contenu sans votre accord. Et même après accord,")}{" "}<b>{t("vous gardez le contrôle total")}</b>{" "}{t(": si vous retirez un partage ou supprimez votre publication, elle disparaît chez tous ceux avec qui elle avait été partagée.")}</p>
    <div className="card col"><h3>{t("Demandes à traiter ({length})", { length: incoming.length })}</h3>
      {incoming.map((h) => <div key={h.id} className="col" style={{ gap: 6 }}><div className="row"><Avatar u={userOf(s, h.requesterId)} s={36} /><div className="grow"><b>{nm(h.requesterId)}</b>{" "}{t("voudrait partager")}{" "}<b>{label(h.postId)}</b><div className="muted small">{t("avec {join} · {ago}", { join: h.audienceIds.map(nm).join(", "), ago: ago(h.at) })}</div>{h.note && <div className="small">« {h.note} »</div>}</div></div>
        <Approve id={h.id} /></div>)}
      {!incoming.length && <p className="muted small">{t("Aucune demande en attente.")}</p>}</div>
    <div className="card col"><h3>{t("Partages que j'ai autorisés ({length})", { length: active.length })}</h3>
      {active.map((h) => <div key={h.id} className="row"><div className="grow"><b>{label(h.postId)}</b><div className="muted small">{t("partagé par {nm} avec {join}", { nm: nm(h.requesterId), join: h.audienceIds.map(nm).join(", ") })}</div></div><button className="btn danger sm" onClick={() => { if (confirm(t("Retirer ce partage ? Il disparaîtra chez tout le monde."))) { actions.revokeShare(h.id); toast(t("Partage retiré partout.")); } }}>{t("Retirer partout")}</button></div>)}
      {!active.length && <p className="muted small">{t("Aucun partage actif.")}</p>}</div>
    <div className="card col"><h3>{t("Mes demandes et mes partages ({length})", { length: mine.length })}</h3>
      {mine.map((h) => <div key={h.id} className="row"><div className="grow"><b>{label(h.postId)}</b>{" "}{t("de {nm}", { nm: nm(h.authorId) })}<div className="muted small">{t("{v1} · avec {join}", { v1: { pending: "⏳ en attente de l'auteur", approved: "✅ autorisé", denied: "❌ refusé", revoked: "🚫 retiré par l'auteur" }[h.status], join: h.audienceIds.map(nm).join(", ") })}</div></div>{h.status === "approved" && <button className="btn ghost sm" onClick={() => actions.revokeShare(h.id)}>{t("Arrêter")}</button>}</div>)}
      {!mine.length && <p className="muted small">{t("Vous n'avez rien demandé à partager.")}</p>}</div></div>);
}
