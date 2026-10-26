import { useStore, actions, userOf } from "../lib/store";
import { Avatar, toast, ago } from "./common";

export function Shares() {
  const s = useStore((x) => x); const me = s.me; const nm = (id: string) => userOf(s, id)?.name || "?";
  const incoming = s.shares.filter((h) => h.authorId === me && h.status === "pending");
  const active = s.shares.filter((h) => h.authorId === me && h.status === "approved");
  const mine = s.shares.filter((h) => h.requesterId === me);
  const label = (id: string) => { const p = s.posts.find((x) => x.id === id); return p ? (p.kind === "photo" ? "📷 " : "✉️ ") + (p.text.slice(0, 40) || "Photo") : "contenu supprimé"; };
  return (<div className="col"><h1>Partages</h1>
    <p className="muted small">Personne ne peut republier votre contenu sans votre accord. Et même après accord, <b>vous gardez le contrôle total</b> : si vous retirez un partage ou supprimez votre publication, elle disparaît chez tous ceux avec qui elle avait été partagée.</p>
    <div className="card col"><h3>Demandes à traiter ({incoming.length})</h3>
      {incoming.map((h) => <div key={h.id} className="col" style={{ gap: 6 }}><div className="row"><Avatar u={userOf(s, h.requesterId)} s={36} /><div className="grow"><b>{nm(h.requesterId)}</b> voudrait partager <b>{label(h.postId)}</b><div className="muted small">avec {h.audienceIds.map(nm).join(", ")} · {ago(h.at)}</div>{h.note && <div className="small">« {h.note} »</div>}</div></div>
        <div className="row"><button className="btn sm" onClick={() => { actions.answerShare(h.id, true); toast("Partage autorisé. Vous pouvez le retirer quand vous voulez."); }}>Autoriser</button><button className="btn ghost sm" onClick={() => actions.answerShare(h.id, false)}>Refuser</button></div></div>)}
      {!incoming.length && <p className="muted small">Aucune demande en attente.</p>}</div>
    <div className="card col"><h3>Partages que j'ai autorisés ({active.length})</h3>
      {active.map((h) => <div key={h.id} className="row"><div className="grow"><b>{label(h.postId)}</b><div className="muted small">partagé par {nm(h.requesterId)} avec {h.audienceIds.map(nm).join(", ")}</div></div><button className="btn danger sm" onClick={() => { if (confirm("Retirer ce partage ? Il disparaîtra chez tout le monde.")) { actions.revokeShare(h.id); toast("Partage retiré partout."); } }}>Retirer partout</button></div>)}
      {!active.length && <p className="muted small">Aucun partage actif.</p>}</div>
    <div className="card col"><h3>Mes demandes et mes partages ({mine.length})</h3>
      {mine.map((h) => <div key={h.id} className="row"><div className="grow"><b>{label(h.postId)}</b> de {nm(h.authorId)}<div className="muted small">{{ pending: "⏳ en attente de l'auteur", approved: "✅ autorisé", denied: "❌ refusé", revoked: "🚫 retiré par l'auteur" }[h.status]} · avec {h.audienceIds.map(nm).join(", ")}</div></div>{h.status === "approved" && <button className="btn ghost sm" onClick={() => actions.revokeShare(h.id)}>Arrêter</button>}</div>)}
      {!mine.length && <p className="muted small">Vous n'avez rien demandé à partager.</p>}</div></div>);
}
