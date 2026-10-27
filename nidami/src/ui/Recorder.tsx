import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "./common";

/** Enregistre un selfie vidéo ou un vocal (durée limitée). Rend le résultat en « data URL ». */
export function Recorder({ kind, max = 10, onDone, onCancel, onPhoto }: { kind: "video" | "audio"; max?: number; onDone: (url: string) => void; onCancel: () => void; onPhoto?: (url: string) => void }) {
  const vid = useRef<HTMLVideoElement>(null); const rec = useRef<MediaRecorder | null>(null); const stream = useRef<MediaStream | null>(null); const [left, setLeft] = useState<number | null>(null); const [ready, setReady] = useState(false);
  const stop = () => stream.current?.getTracks().forEach((t) => t.stop());
  useEffect(() => { let dead = false; (async () => {
    try { const st = await navigator.mediaDevices.getUserMedia(kind === "video" ? { video: { facingMode: "user", width: 480, height: 480 }, audio: true } : { audio: true }); if (dead) { st.getTracks().forEach((t) => t.stop()); return; } stream.current = st; if (vid.current) { vid.current.srcObject = st; void vid.current.play().catch(() => {}); } setReady(true); }
    catch { toast(kind === "video" ? "Caméra ou micro indisponible ou refusé." : "Micro indisponible ou refusé."); onCancel(); } })(); return () => { dead = true; stop(); }; }, []);
  const start = () => { const st = stream.current; if (!st) return; const r = new MediaRecorder(st, kind === "video" ? { videoBitsPerSecond: 250000, audioBitsPerSecond: 32000 } : undefined); const ch: Blob[] = []; r.ondataavailable = (e) => ch.push(e.data); let n = max; setLeft(n); const iv = setInterval(() => { n--; setLeft(Math.max(n, 0)); }, 1000);
    r.onstop = () => { clearInterval(iv); stop(); setLeft(null); const fr = new FileReader(); fr.onload = () => onDone(String(fr.result)); fr.readAsDataURL(new Blob(ch, { type: ((r.mimeType || "audio/webm").split(";")[0]) })); };
    r.start(); rec.current = r; setTimeout(() => r.state === "recording" && r.stop(), max * 1000); };
  return <div className="card col" style={{ alignItems: "center", gap: 8 }}>
    {kind === "video" ? <video ref={vid} muted playsInline style={{ width: "100%", maxHeight: 260, borderRadius: 14, background: "#000", transform: "scaleX(-1)", objectFit: "cover" }} /> : <div style={{ fontSize: "3rem" }}>{left !== null ? "🔴" : "🎤"}</div>}
    <div className="row" style={{ gap: 8 }}>
      {left === null ? <button type="button" className="btn" disabled={!ready} onClick={start}>{kind === "video" ? "🎥 Commencer" : "🎤 Commencer"} ({max} s max)</button> : <button type="button" className="btn" style={{ background: "var(--bad)", color: "#fff" }} onClick={() => rec.current?.stop()}>⏹ Terminer · {left} s</button>}
      {onPhoto && left === null && <button type="button" className="btn ghost" disabled={!ready} onClick={() => { const v = vid.current; if (!v || !v.videoWidth) return; const cv = document.createElement("canvas"); const k = Math.min(1, 800 / Math.max(v.videoWidth, v.videoHeight)); cv.width = v.videoWidth * k; cv.height = v.videoHeight * k; const x = cv.getContext("2d")!; x.translate(cv.width, 0); x.scale(-1, 1); x.drawImage(v, 0, 0, cv.width, cv.height); stop(); onPhoto(cv.toDataURL("image/jpeg", 0.8)); }}>📸 Photo</button>}
      <button type="button" className="btn ghost" onClick={() => { rec.current?.state === "recording" && (rec.current.onstop = null, rec.current.stop()); stop(); onCancel(); }}>Annuler</button></div></div>;
}

/** Micro « maintenir pour parler » : on reste appuyé, on lâche, le vocal part. */
export function HoldMic({ onDone, className = "btn", max = 60, children }: { onDone: (url: string) => void; className?: string; max?: number; children: React.ReactNode }) {
  const [on, setOn] = useState(false); const st = useRef<MediaStream | null>(null); const r = useRef<MediaRecorder | null>(null); const held = useRef(false); const t0 = useRef(0);
  const begin = async () => {
    held.current = true; setOn(true); t0.current = Date.now();
    try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); if (!held.current) { s.getTracks().forEach((t) => t.stop()); setOn(false); return; } st.current = s; const rec = new MediaRecorder(s); const ch: Blob[] = []; rec.ondataavailable = (e) => ch.push(e.data);
      rec.onstop = () => { s.getTracks().forEach((t) => t.stop()); setOn(false); if (Date.now() - t0.current < 600) return toast("Maintenez le bouton enfoncé pour parler."); const fr = new FileReader(); fr.onload = () => onDone(String(fr.result)); fr.readAsDataURL(new Blob(ch, { type: ((rec.mimeType || "audio/webm").split(";")[0]) })); };
      rec.start(); r.current = rec; setTimeout(() => rec.state === "recording" && rec.stop(), max * 1000); } catch { held.current = false; setOn(false); toast("Micro indisponible ou refusé."); }
  };
  const end = () => { if (!held.current) return; held.current = false; if (r.current?.state === "recording") r.current.stop(); else if (!st.current) setOn(false); r.current = null; st.current = null; };
  return <button type="button" className={className} aria-label="Maintenir pour enregistrer un vocal" onPointerDown={(e) => { e.preventDefault(); (e.target as Element).setPointerCapture?.(e.pointerId); void begin(); }} onPointerUp={end} onPointerCancel={end} onContextMenu={(e) => e.preventDefault()}
    style={{ touchAction: "none", userSelect: "none", WebkitTouchCallout: "none", ...(on ? { background: "var(--bad)", color: "#fff", transform: "scale(1.12)" } : {}) }}>{on ? <span className="small">🔴 Relâchez pour envoyer</span> : children}</button>;
}

/** Caméra plein écran : vidéo (appui pour démarrer / arrêter) ou photo, puis aperçu avec Envoyer / Recommencer / Supprimer. */
export function Camera({ onVideo, onPhoto, onClose, max = 10, withPhoto = true }: { onVideo: (url: string) => void; onPhoto?: (url: string) => void; onClose: () => void; max?: number; withPhoto?: boolean }) {
  const vid = useRef<HTMLVideoElement>(null); const stream = useRef<MediaStream | null>(null); const rec = useRef<MediaRecorder | null>(null); const cancelled = useRef(false);
  const [mode, setMode] = useState<"video" | "photo">("video"); const [face, setFace] = useState<"user" | "environment">("user"); const [left, setLeft] = useState<number | null>(null); const [ready, setReady] = useState(false);
  const [res, setRes] = useState<{ video?: string; photo?: string } | null>(null);
  const stop = () => stream.current?.getTracks().forEach((t) => t.stop());
  useEffect(() => { let dead = false; setReady(false); stop(); if (res) return; (async () => {
    try { const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: face, width: { ideal: 720 }, height: { ideal: 1280 } }, audio: true }); if (dead) { st.getTracks().forEach((t) => t.stop()); return; } stream.current = st; if (vid.current) { vid.current.srcObject = st; void vid.current.play().catch(() => {}); } setReady(true); }
    catch { toast("Caméra ou micro indisponible ou refusé."); onClose(); } })(); return () => { dead = true; stop(); }; }, [face, res]);
  const shoot = () => { const v = vid.current; if (!v || !v.videoWidth) return; const cv = document.createElement("canvas"); const k = Math.min(1, 900 / Math.max(v.videoWidth, v.videoHeight)); cv.width = v.videoWidth * k; cv.height = v.videoHeight * k; const x = cv.getContext("2d")!; if (face === "user") { x.translate(cv.width, 0); x.scale(-1, 1); } x.drawImage(v, 0, 0, cv.width, cv.height); stop(); setRes({ photo: cv.toDataURL("image/jpeg", 0.82) }); };
  const toggleRec = () => {
    if (rec.current?.state === "recording") { rec.current.stop(); return; }
    const st = stream.current; if (!st) return; const r = new MediaRecorder(st, { videoBitsPerSecond: 350000, audioBitsPerSecond: 40000 }); const ch: Blob[] = []; r.ondataavailable = (e) => e.data.size && ch.push(e.data); let n = max; setLeft(n); const iv = setInterval(() => { n--; setLeft(Math.max(n, 0)); }, 1000);
    r.onstop = () => { clearInterval(iv); setLeft(null); stop(); if (cancelled.current) return; const fr = new FileReader(); fr.onload = () => setRes({ video: String(fr.result) }); fr.readAsDataURL(new Blob(ch, { type: (r.mimeType || "video/webm").split(";")[0] })); };
    r.start(250); rec.current = r; setTimeout(() => r.state === "recording" && r.stop(), max * 1000);
  };
  const close = () => { cancelled.current = true; if (rec.current?.state === "recording") rec.current.stop(); stop(); onClose(); };
  const recording = left !== null;
  return createPortal(<div className="cam" role="dialog" aria-label="Caméra">
    {res ? <>
      {res.video ? <video key={res.video.length} className="cam-v" src={res.video} controls autoPlay loop playsInline /> : <img className="cam-v" src={res.photo} alt="Aperçu" style={{ objectFit: "contain" }} />}
      <button className="cam-x" onClick={close} aria-label="Fermer">✕</button>
      <div className="cam-bar"><button className="cam-r" onClick={() => { setRes(null); cancelled.current = false; }} aria-label="Recommencer">🔁<small>Recommencer</small></button>
        <button className="cam-send" onClick={() => (res.video ? onVideo(res.video) : onPhoto?.(res.photo!))}>Envoyer ➤</button>
        <button className="cam-r" onClick={close} aria-label="Supprimer">🗑<small>Supprimer</small></button></div></>
    : <>
      <video ref={vid} className="cam-v" muted playsInline style={{ transform: face === "user" ? "scaleX(-1)" : undefined }} />
      <button className="cam-x" onClick={close} aria-label="Fermer la caméra">✕</button>
      {!recording && <button className="cam-flip" onClick={() => setFace(face === "user" ? "environment" : "user")} aria-label="Changer de caméra">🔄</button>}
      {recording && <div className="cam-time">🔴 {max - (left ?? 0)} s / {max} s</div>}
      <div className="cam-bar" style={{ flexDirection: "column", gap: 14 }}>
        {!recording && withPhoto && <div className="cam-tabs"><button className={mode === "video" ? "on" : ""} onClick={() => setMode("video")}>Vidéo</button><button className={mode === "photo" ? "on" : ""} onClick={() => setMode("photo")}>Photo</button></div>}
        <button className={"cam-shut" + (recording ? " rec" : "") + (mode === "photo" ? " ph" : "")} disabled={!ready} onClick={mode === "photo" ? shoot : toggleRec} aria-label={mode === "photo" ? "Prendre la photo" : recording ? "Arrêter" : "Filmer"}><span /></button>
        <small style={{ color: "#fff", opacity: .8 }}>{mode === "photo" ? "Touchez pour prendre la photo" : recording ? "Touchez pour arrêter" : `Touchez pour filmer (${max} s max)`}</small></div></>}
  </div>, document.body);
}
