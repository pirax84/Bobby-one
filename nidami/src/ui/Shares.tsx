import { useState } from "react";
import { useStore, actions, userOf } from "../lib/store";
import { Avatar, toast, ago } from "./common";
import { t } from "../i18n";
import { qrSvg } from "../lib/qr";
import { usePref, setPref } from "../lib/uipref";

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

/** Mes règles de partage + lien et QR pour inviter. */
function Rules() {
  const s = useStore((x) => x); const me = s.me; const rule = usePref("share-rule", "ask"); const ex = (usePref("share-except", "") || "").split(",").filter(Boolean);
  const friends = (s.social.friends[me] || []).map((i) => userOf(s, i)!).filter(Boolean);
  const link = location.origin + location.pathname; const [qr, setQr] = useState(false);
  const R: [string, string, string][] = [["ask", t("Toujours me demander"), t("Chaque partage attend votre accord.")], ["close", t("Mes proches peuvent partager"), t("Seulement ceux que vous avez mis en proches ou famille.")], ["none", t("Personne ne peut partager"), t("Toutes les demandes sont refusées.")], ["all-but", t("Tout le monde sauf…"), t("Tous les amis, sauf ceux que vous cochez.")]];
  const tog = (id: string) => setPref("share-except", (ex.includes(id) ? ex.filter((x) => x !== id) : [...ex, id]).join(","));
  return <div className="card col" style={{ gap: 8 }}><h3>{t("Mes règles de partage")}</h3>
    <div className="col" style={{ gap: 6 }} role="radiogroup" aria-label={t("Mes règles de partage")}>{R.map(([k, l, d]) => <button key={k} type="button" role="radio" aria-checked={rule === k} className={"chip" + (rule === k ? " on" : "")} style={{ textAlign: "left", display: "block", whiteSpace: "normal" }} onClick={() => setPref("share-rule", k)}><b>{l}</b><span className="muted small" style={{ display: "block" }}>{d}</span></button>)}</div>
    {rule === "all-but" && <div className="row wrap" style={{ gap: 6 }}>{friends.map((f) => <button key={f.id} type="button" aria-pressed={ex.includes(f.id)} className={"chip" + (ex.includes(f.id) ? " on" : "")} onClick={() => tog(f.id)}>{ex.includes(f.id) ? "🚫 " : ""}{f.name}</button>)}{!friends.length && <span className="muted small">{t("Aucun ami pour l'instant.")}</span>}</div>}
    <b>{t("Inviter quelqu'un")}</b>
    <div className="row wrap" style={{ gap: 6 }}><button type="button" className="chip" onClick={async () => { try { if (navigator.share) await navigator.share({ title: "NOTIIF", url: link }); else { await navigator.clipboard.writeText(link); toast(t("Lien copié.")); } } catch { /* annulé */ } }}>{t("🔗 Partager le lien")}</button><button type="button" className="chip" aria-pressed={qr} onClick={() => setQr(!qr)}>{t("▦ Afficher le QR code")}</button></div>
    {qr && <div style={{ background: "#fff", padding: 8, borderRadius: 12, alignSelf: "center" }} aria-label={t("QR code")} dangerouslySetInnerHTML={{ __html: qrSvg(link) }} />}
  </div>;
}
export function Shares() {
  const s = useStore((x) => x); const me = s.me; const nm = (id: string) => userOf(s, id)?.name || "?";
  const incoming = s.shares.filter((h) => h.authorId === me && h.status === "pending");
  const active = s.shares.filter((h) => h.authorId === me && h.status === "approved");
  const mine = s.shares.filter((h) => h.requesterId === me);
  const label = (id: string) => { const p = s.posts.find((x) => x.id === id); return p ? (p.kind === "photo" ? "📷 " : "✉️ ") + (p.text.slice(0, 40) || t("Photo")) : t("contenu supprimé"); };
  return (<div className="col"><h1>{t("Partages")}</h1>
    <p className="muted small">{t("Personne ne peut republier votre contenu sans votre accord. Et même après accord,")}{" "}<b>{t("vous gardez le contrôle total")}</b>{" "}{t(": si vous retirez un partage ou supprimez votre publication, elle disparaît chez tous ceux avec qui elle avait été partagée.")}</p>
    <Rules />
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
