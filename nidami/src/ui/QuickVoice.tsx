import { useRef, useState } from "react";
import { useStore, actions, userOf } from "../lib/store";
import { Modal, Avatar, MicIcon, toast, pressProps } from "./common";
import { HoldMic } from "./Recorder";

/** Vocal rapide : on choisit la personne, on maintient pour parler, on lâche : le vocal part. */
export function QuickVoice({ onClose }: { onClose: () => void }) {
  const s = useStore((x) => x); const me = s.me; const [pick, setPick] = useState<string | null>(null);
  const convs = s.convs.filter((c) => c.memberIds.includes(me) && !c.groupId);
  const name = (id: string) => userOf(s, convs.find((c) => c.id === id)?.memberIds.find((m) => m !== me) || "")?.name || "";
  return <Modal title="Vocal" onClose={onClose}><div className="col" style={{ gap: 10, alignItems: "stretch" }}>
    {!pick && <>{convs.map((c) => { const o = userOf(s, c.memberIds.find((m) => m !== me) || ""); return <button key={c.id} type="button" className="card row" style={{ gap: 12, textAlign: "left" }} onClick={() => setPick(c.id)}><Avatar u={o} s={44} /><b className="grow">{o?.name}</b><MicIcon size={22} /></button>; })}{!convs.length && <p className="muted">Aucune conversation : écrivez d'abord à un ami depuis « Amis ».</p>}</>}
    {pick && <div className="col" style={{ alignItems: "center", gap: 14, padding: "10px 0" }}><b>À {name(pick)}</b>
      <HoldMic className="btn" max={60} onDone={(u) => { actions.send(pick, "", 0, null, undefined, u, false); toast("Vocal envoyé."); onClose(); }}><span style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "6px 10px" }}><MicIcon size={34} />Maintiens pour parler</span></HoldMic>
      <button type="button" className="btn ghost sm" onClick={() => setPick(null)}>Changer de personne</button></div>}
  </div></Modal>;
}

/** Bulle flottante du micro : on la déplace où on veut, on la touche pour envoyer un vocal. */
export function VoiceFab({ onOpen }: { onOpen: () => void }) {
  const [pos, setPos] = useState<{ x: number; y: number }>(() => { try { const p = JSON.parse(localStorage.getItem("notiif-voicefab") || "null"); if (p) return p; } catch { /* rien */ } return { x: Math.max(8, innerWidth - 74), y: Math.max(80, innerHeight - 220) }; });
  const d = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);
  return <button type="button" aria-label="Envoyer un vocal" className="voicefab" style={{ left: pos.x, top: pos.y }}
    onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); d.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y, moved: false }; }}
    onPointerMove={(e) => { const k = d.current; if (!k) return; const nx = Math.min(innerWidth - 64, Math.max(4, e.clientX - k.dx)), ny = Math.min(innerHeight - 64, Math.max(4, e.clientY - k.dy)); if (Math.abs(nx - pos.x) + Math.abs(ny - pos.y) > 4) k.moved = true; setPos({ x: nx, y: ny }); }}
    onPointerUp={() => { const k = d.current; d.current = null; if (!k) return; if (k.moved) { try { localStorage.setItem("notiif-voicefab", JSON.stringify(pos)); } catch { /* rien */ } } else onOpen(); }}><MicIcon size={30} /></button>;
}

/** Petites bulles du haut (avec les stories) : le N+ ou le micro, selon le réglage. */
export function TopNplus() {
  return <div className="story"><button type="button" className="plus topplus" {...pressProps(() => window.dispatchEvent(new CustomEvent("notiif-create", { detail: "ask" })), () => window.dispatchEvent(new CustomEvent("notiif-create", { detail: "selfie" })))} aria-label="Créer : une story ou une publication. Appui long pour un selfie vidéo"><img src="./icon-192.png" alt="" width="52" height="52" /><span className="pbadge">+</span></button><span className="small">Créer</span></div>;
}
export function TopMic() {
  return <div className="story"><button type="button" className="plus topplus topmic" onClick={() => window.dispatchEvent(new Event("notiif-voice"))} aria-label="Envoyer un vocal"><MicIcon size={28} /></button><span className="small">Vocal</span></div>;
}
