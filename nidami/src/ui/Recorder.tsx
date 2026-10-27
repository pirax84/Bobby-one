import { useEffect, useRef, useState } from "react";
import { toast } from "./common";

/** Enregistre un selfie vidéo ou un vocal (durée limitée). Rend le résultat en « data URL ». */
export function Recorder({ kind, max = 10, onDone, onCancel }: { kind: "video" | "audio"; max?: number; onDone: (url: string) => void; onCancel: () => void }) {
  const vid = useRef<HTMLVideoElement>(null); const rec = useRef<MediaRecorder | null>(null); const stream = useRef<MediaStream | null>(null); const [left, setLeft] = useState<number | null>(null); const [ready, setReady] = useState(false);
  const stop = () => stream.current?.getTracks().forEach((t) => t.stop());
  useEffect(() => { let dead = false; (async () => {
    try { const st = await navigator.mediaDevices.getUserMedia(kind === "video" ? { video: { facingMode: "user", width: 480, height: 480 }, audio: true } : { audio: true }); if (dead) { st.getTracks().forEach((t) => t.stop()); return; } stream.current = st; if (vid.current) { vid.current.srcObject = st; void vid.current.play().catch(() => {}); } setReady(true); }
    catch { toast(kind === "video" ? "Caméra ou micro indisponible ou refusé." : "Micro indisponible ou refusé."); onCancel(); } })(); return () => { dead = true; stop(); }; }, []);
  const start = () => { const st = stream.current; if (!st) return; const r = new MediaRecorder(st, kind === "video" ? { videoBitsPerSecond: 250000, audioBitsPerSecond: 32000 } : undefined); const ch: Blob[] = []; r.ondataavailable = (e) => ch.push(e.data); let n = max; setLeft(n); const iv = setInterval(() => { n--; setLeft(Math.max(n, 0)); }, 1000);
    r.onstop = () => { clearInterval(iv); stop(); setLeft(null); const fr = new FileReader(); fr.onload = () => onDone(String(fr.result)); fr.readAsDataURL(new Blob(ch, { type: r.mimeType })); };
    r.start(); rec.current = r; setTimeout(() => r.state === "recording" && r.stop(), max * 1000); };
  return <div className="card col" style={{ alignItems: "center", gap: 8 }}>
    {kind === "video" ? <video ref={vid} muted playsInline style={{ width: "100%", maxHeight: 260, borderRadius: 14, background: "#000", transform: "scaleX(-1)", objectFit: "cover" }} /> : <div style={{ fontSize: "3rem" }}>{left !== null ? "🔴" : "🎤"}</div>}
    <div className="row" style={{ gap: 8 }}>
      {left === null ? <button type="button" className="btn" disabled={!ready} onClick={start}>{kind === "video" ? "🎥 Commencer" : "🎤 Commencer"} ({max} s max)</button> : <button type="button" className="btn" style={{ background: "var(--bad)", color: "#fff" }} onClick={() => rec.current?.stop()}>⏹ Terminer · {left} s</button>}
      <button type="button" className="btn ghost" onClick={() => { rec.current?.state === "recording" && (rec.current.onstop = null, rec.current.stop()); stop(); onCancel(); }}>Annuler</button></div></div>;
}

/** Micro « maintenir pour parler » : on reste appuyé, on lâche, le vocal part. */
export function HoldMic({ onDone, className = "btn", max = 60, children }: { onDone: (url: string) => void; className?: string; max?: number; children: React.ReactNode }) {
  const [on, setOn] = useState(false); const st = useRef<MediaStream | null>(null); const r = useRef<MediaRecorder | null>(null); const held = useRef(false); const t0 = useRef(0);
  const begin = async () => {
    held.current = true; setOn(true); t0.current = Date.now();
    try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); if (!held.current) { s.getTracks().forEach((t) => t.stop()); setOn(false); return; } st.current = s; const rec = new MediaRecorder(s); const ch: Blob[] = []; rec.ondataavailable = (e) => ch.push(e.data);
      rec.onstop = () => { s.getTracks().forEach((t) => t.stop()); setOn(false); if (Date.now() - t0.current < 600) return toast("Maintenez le bouton enfoncé pour parler."); const fr = new FileReader(); fr.onload = () => onDone(String(fr.result)); fr.readAsDataURL(new Blob(ch, { type: rec.mimeType })); };
      rec.start(); r.current = rec; setTimeout(() => rec.state === "recording" && rec.stop(), max * 1000); } catch { held.current = false; setOn(false); toast("Micro indisponible ou refusé."); }
  };
  const end = () => { if (!held.current) return; held.current = false; if (r.current?.state === "recording") r.current.stop(); else if (!st.current) setOn(false); r.current = null; st.current = null; };
  return <button type="button" className={className} aria-label="Maintenir pour enregistrer un vocal" onPointerDown={(e) => { e.preventDefault(); (e.target as Element).setPointerCapture?.(e.pointerId); void begin(); }} onPointerUp={end} onPointerCancel={end} onContextMenu={(e) => e.preventDefault()}
    style={{ touchAction: "none", userSelect: "none", WebkitTouchCallout: "none", ...(on ? { background: "var(--bad)", color: "#fff", transform: "scale(1.12)" } : {}) }}>{on ? <span className="small">🔴 Relâchez pour envoyer</span> : children}</button>;
}
