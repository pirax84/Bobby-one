import { useState } from "react";
import { useStore } from "../lib/store";
import { createGroup } from "../lib/server";
import { refreshGroups } from "../lib/sync";
import { Modal, Avatar, toast } from "./common";

/** Nouveau groupe de discussion entre vrais comptes : on choisit un nom et des amis. */
export function NewGroup({ onClose }: { onClose: () => void }) {
  const s = useStore((x) => x); const friends = (s.social.friends[s.me] || []).filter((f) => f.startsWith("sb_")).map((f) => s.users.find((u) => u.id === f)!).filter(Boolean);
  const [name, setName] = useState(""); const [sel, setSel] = useState<string[]>([]); const [busy, setBusy] = useState(false);
  const go = async () => { setBusy(true); const id = await createGroup(name.trim(), sel.map((x) => x.slice(3))); setBusy(false); if (!id) return toast("Impossible de créer le groupe. Réessaie."); refreshGroups(); toast("Groupe créé ✅"); onClose(); };
  return <Modal title="Nouveau groupe" onClose={onClose}><div className="col" style={{ gap: 10 }}>
    <input className="inp" placeholder="Nom du groupe (ex. Famille)" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
    <span className="muted small">Choisis au moins 2 amis :</span>
    {friends.map((f) => <label key={f.id} className="row" style={{ gap: 10, padding: "4px 0" }}><input type="checkbox" style={{ width: 22, height: 22 }} checked={sel.includes(f.id)} onChange={() => setSel(sel.includes(f.id) ? sel.filter((x) => x !== f.id) : [...sel, f.id])} /><Avatar u={f} s={36} /><b className="grow">{f.name}</b></label>)}
    {!friends.length && <p className="muted small">Pas encore d'amis avec un vrai compte.</p>}
    <button type="button" className="btn" disabled={busy || !name.trim() || sel.length < 2} onClick={go}>{busy ? "Création…" : "Créer le groupe"}</button>
  </div></Modal>;
}
