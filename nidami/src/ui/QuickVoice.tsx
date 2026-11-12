import { useRef, useState } from "react";
import { useStore, actions, userOf } from "../lib/store";
import { Avatar, MicIcon, toast, pressProps } from "./common";
import { HoldMic } from "./Recorder";

/** Vocal rapide : petit bandeau en bas. On choisit la personne, on maintient le micro ; gauche = annuler, haut = verrouiller. */
export function QuickVoice({ onClose }: { onClose: () => void }) {
  const s = useStore((x) => x); const me = s.me;
  const convs = s.convs.filter((c) => c.memberIds.includes(me) && !c.groupId);
  const [pick, setPick] = useState<string>(() => { let l = ""; try { l = localStorage.getItem("notiif-qv-last") || ""; } catch { /* rien */ } return convs.some((c) => c.id === l) ? l : (convs[0]?.id || ""); });
  const verify = (() => { try { return localStorage.getItem("notiif-qv-verify") === "1"; } catch { return false; } })();
  const other = (id: string) => userOf(s, convs.find((c) => c.id === id)?.memberIds.find((m) => m !== me) || "");
  const choose = (id: string) => { setPick(id); try { localStorage.setItem("notiif-qv-last", id); } catch { /* rien */ } };
  return <div className="qvback" onClick={onClose}><div className="qvdock" role="dialog" aria-label="Vocal" onClick={(e) => e.stopPropagation()}>
    {!convs.length ? <p className="muted center" style={{ margin: 0 }}>Aucune conversation : écrivez d'abord à un ami depuis « Amis ».</p> : <>
      <div className="qvstrip">{convs.map((c) => { const o = other(c.id); return <button key={c.id} type="button" className={"qvpick" + (c.id === pick ? " sel" : "")} onClick={() => choose(c.id)}><Avatar u={o} s={42} /><span>{o?.name?.split(" ")[0]}</span></button>; })}</div>
      <p className="muted small center" style={{ margin: "8px 0 4px" }}>Pour <b>{other(pick)?.name}</b> · maintiens le micro</p>
      <div style={{ display: "flex", justifyContent: "center" }}><HoldMic className="btn" max={60} verify={verify} onDone={(u) => { actions.send(pick, "", 0, null, undefined, u, false); toast("Vocal envoyé."); onClose(); }}><span style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "6px 14px" }}><MicIcon size={34} />Maintiens pour parler</span></HoldMic></div>
</>}
  </div></div>;
}

/** Bulle flottante du micro : on la déplace où on veut, on la touche pour envoyer un vocal. */
export function VoiceFab({ onOpen, kind = "voice" }: { onOpen: () => void; kind?: "voice" | "media" }) {
  const [pos, setPos] = useState<{ x: number; y: number }>(() => { try { const p = JSON.parse(localStorage.getItem("notiif-fab-" + kind) || "null"); if (p) return p; } catch { /* rien */ } return { x: Math.max(8, innerWidth - 74), y: Math.max(80, innerHeight - 220) }; });
  const d = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);
  return <button type="button" aria-label={kind === "media" ? "Photo ou vidéo" : "Envoyer un vocal"} className={"voicefab" + (kind === "media" ? " mediafab" : "")} style={{ left: pos.x, top: pos.y }}
    onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); d.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y, moved: false }; }}
    onPointerMove={(e) => { const k = d.current; if (!k) return; const nx = Math.min(innerWidth - 64, Math.max(4, e.clientX - k.dx)), ny = Math.min(innerHeight - 64, Math.max(4, e.clientY - k.dy)); if (Math.abs(nx - pos.x) + Math.abs(ny - pos.y) > 4) k.moved = true; setPos({ x: nx, y: ny }); }}
    onPointerUp={() => { const k = d.current; d.current = null; if (!k) return; if (k.moved) { try { localStorage.setItem("notiif-fab-" + kind, JSON.stringify(pos)); } catch { /* rien */ } } else onOpen(); }}>{kind === "media" ? <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l1.6-2.2h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13.4" r="3.6" /><circle cx="17.6" cy="10.6" r=".6" fill="currentColor" /></svg> : <MicIcon size={30} />}</button>;
}

/** Petites bulles du haut (avec les stories) : le N+ ou le micro, selon le réglage. */
export function TopNplus() {
  return <div className="story"><button type="button" className="plus topplus" {...pressProps(() => window.dispatchEvent(new CustomEvent("notiif-create", { detail: "ask" })), () => window.dispatchEvent(new CustomEvent("notiif-create", { detail: "selfie" })))} aria-label="Créer : une story ou une publication. Appui long pour un selfie vidéo"><img src="./icon-192.png" alt="" width="52" height="52" /><span className="pbadge">+</span></button><span className="small">Créer</span></div>;
}
export function TopMic() {
  return <div className="story"><button type="button" className="plus topplus topmic" onClick={() => window.dispatchEvent(new Event("notiif-voice"))} aria-label="Envoyer un vocal"><MicIcon size={28} /></button><span className="small">Vocal</span></div>;
}
