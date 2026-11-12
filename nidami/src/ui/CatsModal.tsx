import { useState } from "react";
import { useStore, actions } from "../lib/store";
import { catsOf, friendCats, CAT_EMOJIS } from "../lib/cats";
import { catMode, setCatMode, type CatMode } from "../lib/catnotif";
import { usePref } from "../lib/uipref";
import { Modal } from "./common";

/** « ⋯ » : mes catégories d'amis, et ce que chacune fait côté notifications. */
export function CatsModal({ onClose }: { onClose: () => void }) {
  const s = useStore((x) => x); const me = s.me; usePref("x", ""); const [add, setAdd] = useState(false); const [name, setName] = useState(""); const [em, setEm] = useState(CAT_EMOJIS[0]);
  const friends = s.social.friends[me] || []; const cats = catsOf(s.social, me);
  const MODES: [CatMode, string][] = [["normal", "Normal"], ["silent", "🔕 Silencieux"], ["priority", "🔔 Prioritaire"]];
  return <Modal title="Mes catégories" onClose={onClose}><div className="col" style={{ gap: 10 }}>
    <span className="muted small">Pour chaque catégorie, choisis les notifications : normal, silencieux (aucun son) ou prioritaire (son et vibration plus marqués).</span>
    {cats.map((c) => { const n = friends.filter((f) => friendCats(s.social, me, f).includes(c.id)).length; const cur = catMode(c.id);
      return <div key={c.id} className="card col" style={{ gap: 6, padding: 10 }}><div className="row" style={{ gap: 8 }}><span style={{ fontSize: 22 }}>{c.e}</span><b className="grow">{c.n}</b><span className="muted small">{n}</span>{c.custom && <button type="button" className="btn ghost sm" aria-label="Supprimer la catégorie" onClick={() => { if (confirm("Supprimer cette catégorie ? Les amis restent dans ta liste.")) actions.removeCat(c.id); }}>🗑</button>}</div>
        <div className="row wrap" style={{ gap: 6 }} role="radiogroup" aria-label={"Notifications : " + c.n}>{MODES.map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={cur === k} className={"chip" + (cur === k ? " on" : "")} onClick={() => setCatMode(c.id, k)}>{l}</button>)}</div></div>; })}
    {!add ? <button type="button" className="btn ghost" onClick={() => setAdd(true)}>➕ Nouvelle catégorie</button> : <div className="card col" style={{ gap: 8, padding: 10 }}>
      <input className="inp" placeholder="Nom (ex. Voisins du village)" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="row wrap" style={{ gap: 6 }}>{CAT_EMOJIS.map((e) => <button key={e} type="button" className={"chip" + (em === e ? " on" : "")} onClick={() => setEm(e)}>{e}</button>)}</div>
      <button type="button" className="btn" disabled={!name.trim()} onClick={() => { actions.addCat(name, em); setName(""); setAdd(false); }}>Créer</button></div>}
    <span className="muted small">Pour mettre un ami dans une catégorie : touche son nom dans la liste, puis « Catégories ».</span>
  </div></Modal>;
}
