import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "./common";
import { stopPlayer } from "./Links";
import { t } from "../i18n";

/** Enregistre un selfie vidéo ou un vocal (durée limitée). Rend le résultat en « data URL ». */
export function Recorder({ kind, max = 10, onDone, onCancel, onPhoto }: { kind: "video" | "audio"; max?: number; onDone: (url: string) => void; onCancel: () => void; onPhoto?: (url: string) => void }) {
  const vid = useRef<HTMLVideoElement>(null); const rec = useRef<MediaRecorder | null>(null); const stream = useRef<MediaStream | null>(null); const [left, setLeft] = useState<number | null>(null); const [ready, setReady] = useState(false);
  const stop = () => stream.current?.getTracks().forEach((tx) => tx.stop());
  useEffect(() => { let dead = false; (async () => {
    try { const st = await navigator.mediaDevices.getUserMedia(kind === "video" ? { video: { facingMode: "user", width: 480, height: 480 }, audio: true } : { audio: true }); if (dead) { st.getTracks().forEach((tx) => tx.stop()); return; } stream.current = st; if (vid.current) { vid.current.srcObject = st; void vid.current.play().catch(() => {}); } setReady(true); }
    catch { toast(kind === "video" ? t("Caméra ou micro indisponible ou refusé.") : t("Micro indisponible ou refusé.")); onCancel(); } })(); return () => { dead = true; stop(); }; }, []);
  const start = () => { const st = stream.current; if (!st) return; const r = new MediaRecorder(st, kind === "video" ? { videoBitsPerSecond: 250000, audioBitsPerSecond: 32000 } : undefined); const ch: Blob[] = []; r.ondataavailable = (e) => ch.push(e.data); let n = max; setLeft(n); const iv = setInterval(() => { n--; setLeft(Math.max(n, 0)); }, 1000);
    r.onstop = () => { clearInterval(iv); stop(); setLeft(null); const fr = new FileReader(); fr.onload = () => onDone(String(fr.result)); fr.readAsDataURL(new Blob(ch, { type: ((r.mimeType || "audio/webm").split(";")[0]) })); };
    r.start(); rec.current = r; setTimeout(() => r.state === "recording" && r.stop(), max * 1000); };
  return <div className="card col" style={{ alignItems: "center", gap: 8 }}>
    {kind === "video" ? <video ref={vid} muted playsInline style={{ width: "100%", maxHeight: 260, borderRadius: 14, background: "#000", transform: "scaleX(-1)", objectFit: "cover" }} /> : <div style={{ fontSize: "3rem" }}>{left !== null ? "🔴" : "🎤"}</div>}
    <div className="row" style={{ gap: 8 }}>
      {left === null ? <button type="button" className="btn" disabled={!ready} onClick={start}>{kind === "video" ? t("🎥 Commencer") : t("🎤 Commencer")}{" "}{t("({max} s max)", { max })}</button> : <button type="button" className="btn" style={{ background: "var(--bad)", color: "#fff" }} onClick={() => rec.current?.stop()}>{t("⏹ Terminer · {left} s", { left })}</button>}
      {onPhoto && left === null && <button type="button" className="btn ghost" disabled={!ready} onClick={() => { const v = vid.current; if (!v || !v.videoWidth) return; const cv = document.createElement("canvas"); const k = Math.min(1, 800 / Math.max(v.videoWidth, v.videoHeight)); cv.width = v.videoWidth * k; cv.height = v.videoHeight * k; const x = cv.getContext("2d")!; x.translate(cv.width, 0); x.scale(-1, 1); x.drawImage(v, 0, 0, cv.width, cv.height); stop(); onPhoto(cv.toDataURL("image/jpeg", 0.8)); }}>{t("📸 Photo")}</button>}
      <button type="button" className="btn ghost" onClick={() => { rec.current?.state === "recording" && (rec.current.onstop = null, rec.current.stop()); stop(); onCancel(); }}>{t("Annuler")}</button></div></div>;
}

/** Micro « maintenir pour parler » : on reste appuyé, on lâche, le vocal part. */
export function HoldMic({ onDone, className = "btn", max = 60, children }: { onDone: (url: string) => void; className?: string; max?: number; children: React.ReactNode }) {
  const [on, setOn] = useState(false); const st = useRef<MediaStream | null>(null); const r = useRef<MediaRecorder | null>(null); const held = useRef(false); const t0 = useRef(0);
  const begin = async () => {
    stopPlayer(); held.current = true; setOn(true); t0.current = Date.now();
    try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); if (!held.current) { s.getTracks().forEach((tx) => tx.stop()); setOn(false); return; } st.current = s; const rec = new MediaRecorder(s); const ch: Blob[] = []; rec.ondataavailable = (e) => ch.push(e.data);
      rec.onstop = () => { s.getTracks().forEach((tx) => tx.stop()); setOn(false); if (Date.now() - t0.current < 600) return toast(t("Maintenez le bouton enfoncé pour parler.")); const fr = new FileReader(); fr.onload = () => onDone(String(fr.result)); fr.readAsDataURL(new Blob(ch, { type: ((rec.mimeType || "audio/webm").split(";")[0]) })); };
      rec.start(); r.current = rec; setTimeout(() => rec.state === "recording" && rec.stop(), max * 1000); } catch { held.current = false; setOn(false); toast(t("Micro indisponible ou refusé.")); }
  };
  const end = () => { if (!held.current) return; held.current = false; if (r.current?.state === "recording") r.current.stop(); else if (!st.current) setOn(false); r.current = null; st.current = null; };
  return <button type="button" className={className} aria-label={t("Maintenir pour enregistrer un vocal")} onPointerDown={(e) => { e.preventDefault(); (e.target as Element).setPointerCapture?.(e.pointerId); void begin(); }} onPointerUp={end} onPointerCancel={end} onContextMenu={(e) => e.preventDefault()}
    style={{ touchAction: "none", userSelect: "none", WebkitTouchCallout: "none", ...(on ? { background: "var(--bad)", color: "#fff", transform: "scale(1.12)" } : {}) }}>{on ? <span className="small">{t("🔴 Relâchez pour envoyer")}</span> : children}</button>;
}

/** Caméra plein écran : vidéo (appui pour démarrer / arrêter) ou photo, puis aperçu avec Envoyer / Recommencer / Supprimer. */
export function Camera({ onVideo, onPhoto, onClose, max = 10, withPhoto = true, startMode = "video" }: { onVideo: (url: string) => void; onPhoto?: (url: string) => void; onClose: () => void; max?: number; withPhoto?: boolean; startMode?: "video" | "photo" }) {
  const vid = useRef<HTMLVideoElement>(null); const stream = useRef<MediaStream | null>(null); const rec = useRef<MediaRecorder | null>(null); const cancelled = useRef(false);
  const [mode, setMode] = useState<"video" | "photo">(withPhoto ? startMode : "video"); const cv = useRef<HTMLCanvasElement>(null); const zRef = useRef(1); const [face, setFace] = useState<"user" | "environment">("user"); const [left, setLeft] = useState<number | null>(null); const [ready, setReady] = useState(false);
  const [res, setRes] = useState<{ video?: string; photo?: string } | null>(null);
  useEffect(() => { stopPlayer(); }, []);
  const [zoom, setZoom] = useState(1);
  useEffect(() => { zRef.current = zoom; }, [zoom]);
  // Le zoom est fait ici (image redessinée) : il marche sur tous les téléphones, et la vidéo enregistrée est identique à l'aperçu.
  useEffect(() => { if (!ready || res) return; let raf = 0; const W = 540; const H = Math.round((W * Math.max(window.innerHeight, 1)) / Math.max(window.innerWidth, 1) / 2) * 2; const draw = () => { const c = cv.current, v = vid.current; if (c && v && v.videoWidth) { if (c.width !== W || c.height !== H) { c.width = W; c.height = H; } const x = c.getContext("2d")!; const cover = Math.max(W / v.videoWidth, H / v.videoHeight); const f = zRef.current; const w = v.videoWidth * cover * f, h = v.videoHeight * cover * f;
    // 1× : la vidéo remplit tout l'écran (comme Snap ou TikTok). En dessous de 1×, on voit toute l'image, le reste est rempli par un fond flou.
    x.save(); x.beginPath(); x.rect(0, 0, W, H); x.clip();
    if (f < 1) { x.filter = "blur(14px)"; x.drawImage(v, (W - v.videoWidth * cover) / 2, (H - v.videoHeight * cover) / 2, v.videoWidth * cover, v.videoHeight * cover); x.filter = "none"; x.fillStyle = "rgba(0,0,0,.25)"; x.fillRect(0, 0, W, H); }
    x.drawImage(v, (W - w) / 2, (H - h) / 2, w, h); x.restore(); } raf = requestAnimationFrame(draw); }; raf = requestAnimationFrame(draw); return () => cancelAnimationFrame(raf); }, [ready, res]);
  const stop = () => stream.current?.getTracks().forEach((tx) => tx.stop());
  useEffect(() => { let dead = false; setReady(false); stop(); if (res) return; (async () => {
    try { const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: face, width: { ideal: 960 }, height: { ideal: 1280 } }, audio: true }); if (dead) { st.getTracks().forEach((tx) => tx.stop()); return; } stream.current = st; if (vid.current) { vid.current.srcObject = st; void vid.current.play().catch(() => {}); } setReady(true); }
    catch { toast(t("Caméra ou micro indisponible ou refusé.")); onClose(); } })(); return () => { dead = true; stop(); }; }, [face, res]);
  const shoot = () => { const c = cv.current; if (!c || !c.width) return; const o = document.createElement("canvas"); o.width = c.width; o.height = c.height; const x = o.getContext("2d")!; if (face === "user") { x.translate(o.width, 0); x.scale(-1, 1); } x.drawImage(c, 0, 0); stop(); setRes({ photo: o.toDataURL("image/jpeg", 0.82) }); };
  const toggleRec = () => {
    if (rec.current?.state === "recording") { rec.current.stop(); return; }
    const st = stream.current; const c = cv.current; if (!st || !c) return; const cs = c.captureStream(30); st.getAudioTracks().forEach((tx) => cs.addTrack(tx)); const r = new MediaRecorder(cs, { videoBitsPerSecond: 600000, audioBitsPerSecond: 40000 }); const ch: Blob[] = []; r.ondataavailable = (e) => e.data.size && ch.push(e.data); let n = max; setLeft(n); const iv = setInterval(() => { n--; setLeft(Math.max(n, 0)); }, 1000);
    r.onstop = () => { clearInterval(iv); setLeft(null); stop(); if (cancelled.current) return; const fr = new FileReader(); fr.onload = () => setRes({ video: String(fr.result) }); fr.readAsDataURL(new Blob(ch, { type: (r.mimeType || "video/webm").split(";")[0] })); };
    r.start(250); rec.current = r; setTimeout(() => r.state === "recording" && r.stop(), max * 1000);
  };
  const close = () => { cancelled.current = true; if (rec.current?.state === "recording") rec.current.stop(); stop(); onClose(); };
  const recording = left !== null;
  return createPortal(<div className="cam" role="dialog" aria-label={t("Caméra")}>
    {res ? <>
      {res.video ? <video key={res.video.length} className="cam-v" src={res.video} controls autoPlay loop playsInline /> : <img className="cam-v" src={res.photo} alt={t("Aperçu")} style={{ objectFit: "contain" }} />}
      <button className="cam-x" onClick={close} aria-label={t("Fermer")}>✕</button>
      <div className="cam-bar"><button className="cam-r" onClick={() => { setRes(null); cancelled.current = false; }} aria-label={t("Recommencer")}>🔁<small>{t("Recommencer")}</small></button>
        <button className="cam-send" onClick={() => (res.video ? onVideo(res.video) : onPhoto?.(res.photo!))}>{t("Envoyer ➤")}</button>
        <button className="cam-r" onClick={close} aria-label={t("Supprimer")}>🗑<small>{t("Supprimer")}</small></button></div></>
    : <>
      <video ref={vid} muted playsInline controls={false} disablePictureInPicture poster="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" style={{ position: "absolute", width: 2, height: 2, opacity: 0, pointerEvents: "none" }} /><canvas ref={cv} className="cam-v live" style={{ transform: face === "user" ? "scaleX(-1)" : undefined, visibility: ready ? "visible" : "hidden" }} />
      <button className="cam-x" onClick={close} aria-label={t("Fermer la caméra")}>✕</button>
      {!recording && <button className="cam-flip" onClick={() => setFace(face === "user" ? "environment" : "user")} aria-label={t("Changer de caméra")}>🔄</button>}
      {recording && <div className="cam-time">🔴 {max - (left ?? 0)}{" "}{t("s / {max} s", { max })}</div>}
      <div className="cam-bar" style={{ flexDirection: "column", gap: 14 }}>
        <div className="cam-zoom" role="group" aria-label={t("Zoom")}>{[0.6, 1, 3].map((z) => { return <button key={z} className={zoom === z ? "on" : ""} onClick={() => setZoom(z)} aria-label={t("Zoom {z} fois", { z })}>{t("{replace}×", { replace: String(z).replace(".", ",") })}</button>; })}</div>
        {!recording && withPhoto && <div className="cam-tabs"><button className={mode === "video" ? "on" : ""} onClick={() => setMode("video")}>{t("Vidéo")}</button><button className={mode === "photo" ? "on" : ""} onClick={() => setMode("photo")}>{t("Photo")}</button></div>}
        <button className={"cam-shut" + (recording ? " rec" : "") + (mode === "photo" ? " ph" : "")} disabled={!ready} onClick={mode === "photo" ? shoot : toggleRec} aria-label={mode === "photo" ? t("Prendre la photo") : recording ? t("Arrêter") : t("Filmer")}><span /></button>
        <small style={{ color: "#fff", opacity: .8 }}>{mode === "photo" ? t("Touchez pour prendre la photo") : recording ? t("Touchez pour arrêter") : t("Touchez pour filmer ({max} s max)", { max })}</small></div></>}
  </div>, document.body);
}

/** Grand micro rond : on reste appuyé pour parler, on lâche pour terminer. */
export function VoicePad({ onDone, max = 60 }: { onDone: (url: string) => void; max?: number }) {
  const [on, setOn] = useState(false); const [sec, setSec] = useState(0); const r = useRef<MediaRecorder | null>(null); const held = useRef(false); const t0 = useRef(0); const iv = useRef<number | undefined>(undefined);
  const clear = () => { if (iv.current) { clearInterval(iv.current); iv.current = undefined; } };
  const begin = async () => {
    stopPlayer(); held.current = true; setOn(true); setSec(0); t0.current = Date.now();
    try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); if (!held.current) { s.getTracks().forEach((tx) => tx.stop()); setOn(false); return; }
      const rec = new MediaRecorder(s); const ch: Blob[] = []; rec.ondataavailable = (e) => e.data.size && ch.push(e.data);
      rec.onstop = () => { clear(); s.getTracks().forEach((tx) => tx.stop()); setOn(false); if (Date.now() - t0.current < 600) return toast(t("Maintenez le micro enfoncé pour parler.")); const fr = new FileReader(); fr.onload = () => onDone(String(fr.result)); fr.readAsDataURL(new Blob(ch, { type: (rec.mimeType || "audio/webm").split(";")[0] })); };
      rec.start(250); r.current = rec; iv.current = window.setInterval(() => setSec(Math.floor((Date.now() - t0.current) / 1000)), 250); setTimeout(() => rec.state === "recording" && rec.stop(), max * 1000);
    } catch { held.current = false; setOn(false); toast(t("Micro indisponible ou refusé.")); }
  };
  const end = () => { if (!held.current) return; held.current = false; if (r.current?.state === "recording") r.current.stop(); else setOn(false); r.current = null; };
  const mm = (n: number) => Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0");
  return (<div className="col" style={{ alignItems: "center", gap: 10, padding: "14px 0" }}>
    <button type="button" className={"voice-mic" + (on ? " on" : "")} aria-label={t("Maintenir pour enregistrer un vocal")} onPointerDown={(e) => { e.preventDefault(); (e.target as Element).setPointerCapture?.(e.pointerId); void begin(); }} onPointerUp={end} onPointerCancel={end} onContextMenu={(e) => e.preventDefault()}>🎤</button>
    <div className="muted small center" aria-live="polite">{on ? t("🔴 {mm} · relâchez pour terminer", { mm: mm(sec) }) : t("Restez appuyé sur le micro pour parler ({max} s max)", { max })}</div></div>);
}
