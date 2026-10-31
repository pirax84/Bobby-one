import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast, MicIcon, Ico, useScrollLock } from "./common";
import { actions } from "../lib/store";
import { FaceHide } from "./Photo";
import { stopPlayer } from "./Links";
import { AudioWave } from "./AudioWave";

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
export function Camera({ onVideo, onPhoto, onAudio, onClose, max = 10, withPhoto = true, startMode = "video" }: { onVideo: (url: string) => void; onPhoto?: (url: string) => void; onAudio?: (url: string) => void; onClose: () => void; max?: number; withPhoto?: boolean; startMode?: "video" | "photo" | "voice" }) {
  const vid = useRef<HTMLVideoElement>(null); const stream = useRef<MediaStream | null>(null); const rec = useRef<MediaRecorder | null>(null); const cancelled = useRef(false);
  const [mode, setMode] = useState<"video" | "photo" | "voice">(startMode === "voice" && onAudio ? "voice" : withPhoto ? (startMode === "voice" ? "video" : startMode) : "video"); const [vsec, setVsec] = useState(0); const vrec = useRef<MediaRecorder | null>(null); const vheld = useRef(false); const vt0 = useRef(0); const viv = useRef<number | undefined>(undefined); const cv = useRef<HTMLCanvasElement>(null); const zRef = useRef(0.3); const [face, setFace] = useState<"user" | "environment">("user"); const [left, setLeft] = useState<number | null>(null); const [ready, setReady] = useState(false);
  useScrollLock();
  const [res, setRes] = useState<{ video?: string; photo?: string; audio?: string } | null>(null); const [fh, setFh] = useState(false);
  useEffect(() => { stopPlayer(); }, []);
  const [zoom, setZoom] = useState(0.3); const hwWide = useRef(false);
  // Zoom arrière (0,6×) : si le téléphone sait élargir l'image par la caméra elle-même, on l'utilise ; sinon l'image reste plein écran comme en 1×.
  useEffect(() => { const tr = stream.current?.getVideoTracks()[0]; const cap = (tr?.getCapabilities?.() || {}) as { zoom?: { min: number; max: number } }; hwWide.current = !!cap.zoom && cap.zoom.min < 0.95; if (!tr || !cap.zoom) return; const z = Math.max(cap.zoom.min, zoom < 1 ? zoom : 1); void tr.applyConstraints({ advanced: [{ zoom: z } as MediaTrackConstraintSet] }).catch(() => {}); }, [zoom, ready]);
  useEffect(() => { zRef.current = zoom; }, [zoom]);
  // Le zoom est fait ici (image redessinée) : il marche sur tous les téléphones, et la vidéo enregistrée est identique à l'aperçu.
  useEffect(() => { if (!ready || res) return; let raf = 0; const W = 540; const H = Math.round((W * Math.max(window.innerHeight, 1)) / Math.max(window.innerWidth, 1) / 2) * 2; const draw = () => { const c = cv.current, v = vid.current; if (c && v && v.videoWidth) { if (c.width !== W || c.height !== H) { c.width = W; c.height = H; } const x = c.getContext("2d")!; const cover = Math.max(W / v.videoWidth, H / v.videoHeight); const z0 = zRef.current; const wide = z0 < 0.45 && !hwWide.current; const f = z0 < 1 ? 1 : z0 === 1 ? (hwWide.current ? 1 : 1.3) : z0 * (hwWide.current ? 1 : 1.3); const sc = wide ? Math.min(W / v.videoWidth, H / v.videoHeight) : cover * f; const w = v.videoWidth * sc, h = v.videoHeight * sc; if (wide) { x.fillStyle = "#0b2c33"; x.fillRect(0, 0, W, H); }
    // Toujours plein écran, sans bande. 0,6× = le plus large possible ; 1× rapproche un peu (sans grand-angle matériel).
    x.save(); x.beginPath(); x.rect(0, 0, W, H); x.clip();
    x.drawImage(v, (W - w) / 2, (H - h) / 2, w, h); x.restore(); } raf = requestAnimationFrame(draw); }; raf = requestAnimationFrame(draw); return () => cancelAnimationFrame(raf); }, [ready, res]);
  const stop = () => stream.current?.getTracks().forEach((tx) => tx.stop());
  useEffect(() => { let dead = false; setReady(false); stop(); if (res) return; (async () => {
    try { const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: face, width: { ideal: 960 }, height: { ideal: 1280 } }, audio: true }); if (dead) { st.getTracks().forEach((tx) => tx.stop()); return; } stream.current = st; if (vid.current) { vid.current.srcObject = st; void vid.current.play().catch(() => {}); } setReady(true); }
    catch { toast(t("Caméra ou micro indisponible ou refusé.")); onClose(); } })(); return () => { dead = true; stop(); }; }, [face, res]);
  const shoot = () => { const c = cv.current; if (!c || !c.width) return; const o = document.createElement("canvas"); o.width = c.width; o.height = c.height; const x = o.getContext("2d")!; if (face === "user") { x.translate(o.width, 0); x.scale(-1, 1); } x.drawImage(c, 0, 0); stop(); setRes({ photo: trimBars(o).toDataURL("image/jpeg", 0.85) }); };
  const toggleRec = () => {
    if (rec.current?.state === "recording") { rec.current.stop(); return; }
    const st = stream.current; const c = cv.current; if (!st || !c) return; const cs = c.captureStream(30); st.getAudioTracks().forEach((tx) => cs.addTrack(tx)); const r = new MediaRecorder(cs, { videoBitsPerSecond: 600000, audioBitsPerSecond: 40000 }); const ch: Blob[] = []; r.ondataavailable = (e) => e.data.size && ch.push(e.data); let n = max; setLeft(n); const iv = setInterval(() => { n--; setLeft(Math.max(n, 0)); }, 1000);
    r.onstop = () => { clearInterval(iv); setLeft(null); stop(); if (cancelled.current) return; const fr = new FileReader(); fr.onload = () => setRes({ video: String(fr.result) }); fr.readAsDataURL(new Blob(ch, { type: (r.mimeType || "video/webm").split(";")[0] })); };
    r.start(250); rec.current = r; setTimeout(() => r.state === "recording" && r.stop(), max * 1000);
  };
  const VMAX = 60;
  const vStart = () => { const st = stream.current; if (!st || !ready) return; const at = st.getAudioTracks(); if (!at.length) return toast(t("Micro indisponible ou refusé.")); vheld.current = true; vt0.current = Date.now(); setVsec(0); const r = new MediaRecorder(new MediaStream(at)); const ch: Blob[] = []; r.ondataavailable = (e) => e.data.size && ch.push(e.data);
    r.onstop = () => { if (viv.current) { clearInterval(viv.current); viv.current = undefined; } setLeft(null); if (cancelled.current) return; if (Date.now() - vt0.current < 600) return toast(t("Maintenez le bouton enfoncé pour parler.")); stop(); const fr = new FileReader(); fr.onload = () => setRes({ audio: String(fr.result) }); fr.readAsDataURL(new Blob(ch, { type: (r.mimeType || "audio/webm").split(";")[0] })); };
    r.start(250); vrec.current = r; setLeft(0); viv.current = window.setInterval(() => setVsec(Math.floor((Date.now() - vt0.current) / 1000)), 250); setTimeout(() => r.state === "recording" && r.stop(), VMAX * 1000); };
  const vEnd = () => { if (!vheld.current) return; vheld.current = false; if (vrec.current?.state === "recording") vrec.current.stop(); vrec.current = null; };
  const close = () => { cancelled.current = true; if (rec.current?.state === "recording") rec.current.stop(); stop(); onClose(); };
  const recording = left !== null; const vm = (n: number) => Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0");
  return createPortal(<div className="cam" role="dialog" aria-label={t("Caméra")}>
    {res ? <>
      {res.audio ? <div className="cam-voice"><div className="cam-vplayer"><AudioWave src={res.audio} autoPlay /></div><p style={{ opacity: .8 }}>{t("Tu peux la réécouter avant d'envoyer")}</p></div> : res.video ? <video key={res.video.length} className="cam-v" src={res.video} controls autoPlay loop playsInline /> : <img className="cam-v" src={res.photo} alt={t("Aperçu")} style={{ objectFit: "contain" }} />}
      <button className="cam-x" onClick={close} aria-label={t("Fermer")}>✕</button>
      {fh && res.photo && <FaceHide src={res.photo} onClose={() => setFh(false)} onDone={(u) => { setRes({ photo: u }); setFh(false); }} />}
      {res.photo && <div style={{ position: "absolute", left: 0, right: 0, bottom: 158, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, zIndex: 3 }}>
        <button className="cam-send" style={{ background: "#fff", color: "#0b2c33", width: "auto", padding: "11px 20px", fontSize: 15 }} onClick={() => setFh(true)}>{t("🙂 Cacher des visages")}</button>
        <button className="cam-send" style={{ width: "auto", padding: "11px 20px", fontSize: 15 }} onClick={() => { actions.updateProfile({ avatar: res.photo! }); toast(t("✅ Photo de profil modifiée !")); close(); }}>{t("👤 Utiliser comme photo de profil")}</button></div>}
      <div className="cam-bar"><button className="cam-r" onClick={() => { setRes(null); cancelled.current = false; }} aria-label={t("Recommencer")}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.6-5.9" /><path d="M20 4v5h-5" /></svg><small>{t("Recommencer")}</small></button>
        <button className="cam-send" onClick={() => (res.audio ? onAudio?.(res.audio) : res.video ? onVideo(res.video) : onPhoto?.(res.photo!))}>{t("Envoyer ➤")}</button>
        <button className="cam-r" onClick={close} aria-label={t("Supprimer")}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16" /><path d="M9 7V4.5h6V7" /><path d="M6.5 7l1 12.5h9l1-12.5" /><path d="M10 11v5M14 11v5" /></svg><small>{t("Supprimer")}</small></button></div></>
    : <>
      <video ref={vid} muted playsInline controls={false} disablePictureInPicture poster="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" style={{ position: "absolute", width: 2, height: 2, opacity: 0, pointerEvents: "none" }} /><canvas ref={cv} className="cam-v live" style={{ transform: face === "user" ? "scaleX(-1)" : undefined, visibility: ready ? "visible" : "hidden" }} />
      <button className="cam-x" onClick={close} aria-label={t("Fermer la caméra")}>✕</button>
      {mode === "voice" && <div className="cam-voice"><MicIcon size={150} /><div className="cam-vtime">{vm(vsec)}</div><div className={"livebars cam" + (recording ? " on" : "")} aria-hidden="true">{Array.from({ length: 15 }, (_, i) => <i key={i} style={{ animationDelay: `${(i % 6) * 0.11}s` }} />)}</div></div>}
      {!recording && mode !== "voice" && <button className="cam-flip" onClick={() => setFace(face === "user" ? "environment" : "user")} aria-label={t("Changer de caméra")}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h12l-3-3M20 16H8l3 3" /></svg></button>}
      {recording && mode !== "voice" && <div className="cam-time">🔴 {max - (left ?? 0)}{" "}{t("s / {max} s", { max })}</div>}
      <div className="cam-bar" style={{ flexDirection: "column", gap: 14 }}>
        {mode !== "voice" && <div className="cam-zoom" role="group" aria-label={t("Zoom")}>{[0.3, 0.6, 1].map((z) => { return <button key={z} className={zoom === z ? "on" : ""} onClick={() => setZoom(z)} aria-label={z === 0.3 ? t("Large") : t("Zoom {z} fois", { z })}>{z === 0.3 ? t("Large") : t("{replace}×", { replace: String(z).replace(".", ",") })}</button>; })}</div>}
        {!recording && (withPhoto || onAudio) && <div className="cam-tabs"><button className={mode === "video" ? "on" : ""} onClick={() => setMode("video")}>{t("Vidéo")}</button>{withPhoto && <button className={mode === "photo" ? "on" : ""} onClick={() => setMode("photo")}>{t("Photo")}</button>}{onAudio && <button className={mode === "voice" ? "on" : ""} onClick={() => setMode("voice")}>{t("Vocal")}</button>}</div>}
        <button className={"cam-shut" + (recording ? " rec" : "") + (mode === "photo" ? " ph" : "")} disabled={!ready} {...(mode === "voice" ? { onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); (e.target as Element).setPointerCapture?.(e.pointerId); vStart(); }, onPointerUp: vEnd, onPointerCancel: vEnd, onContextMenu: (e: React.MouseEvent) => e.preventDefault(), style: { touchAction: "none" as const } } : { onClick: mode === "photo" ? shoot : toggleRec })} aria-label={mode === "photo" ? t("Prendre la photo") : recording ? t("Arrêter") : t("Filmer")}><span /></button>
        <small style={{ color: "#fff", opacity: .8 }}>{mode === "voice" ? t("Maintiens pour parler · relâche pour finir") : mode === "photo" ? t("Touchez pour prendre la photo") : recording ? t("Touchez pour arrêter") : t("Touchez pour filmer ({max} s max)", { max })}</small></div></>}
  </div>, document.body);
}

/** Bouton micro + bouton d'envoi : identiques partout (conversation en grand et bulle). */
export function MicBtn({ onDone }: { onDone: (url: string) => void }) { return <HoldMic className="btn micbtn" onDone={onDone}><Ico n="mic" s={20} /></HoldMic>; }

/** Enlève les bandes pleines (mode « Large ») autour d'une photo : la photo finit sans contour, prête à être recadrée dans sa forme. */
function trimBars(src: HTMLCanvasElement): HTMLCanvasElement {
  try {
    const w = src.width, h = src.height; const d = src.getContext("2d")!.getImageData(0, 0, w, h).data;
    const bar = (i: number) => Math.abs(d[i] - 11) < 9 && Math.abs(d[i + 1] - 44) < 9 && Math.abs(d[i + 2] - 51) < 9;
    const rowBar = (y: number) => { for (let xx = 0; xx < w; xx += 6) if (!bar((y * w + xx) * 4)) return false; return true; };
    let t = 0, b = h - 1; while (t < h - 40 && rowBar(t)) t++; while (b > t + 40 && rowBar(b)) b--;
    const colBar = (xx: number) => { for (let y = t; y <= b; y += 6) if (!bar((y * w + xx) * 4)) return false; return true; };
    let l = 0, r = w - 1; while (l < w - 40 && colBar(l)) l++; while (r > l + 40 && colBar(r)) r--;
    if (t === 0 && l === 0 && b === h - 1 && r === w - 1) return src;
    const o = document.createElement("canvas"); o.width = r - l + 1; o.height = b - t + 1; o.getContext("2d")!.drawImage(src, l, t, o.width, o.height, 0, 0, o.width, o.height); return o;
  } catch { return src; }
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
    <button type="button" className={"voice-mic" + (on ? " on" : "")} aria-label={t("Maintenir pour enregistrer un vocal")} onPointerDown={(e) => { e.preventDefault(); (e.target as Element).setPointerCapture?.(e.pointerId); void begin(); }} onPointerUp={end} onPointerCancel={end} onContextMenu={(e) => e.preventDefault()}><MicIcon size={64} /></button>
    <div className={"livebars" + (on ? " on" : "")} aria-hidden="true">{Array.from({ length: 13 }, (_, i) => <i key={i} style={{ animationDelay: `${(i % 6) * 0.11}s` }} />)}</div>
    <div className="muted small center" aria-live="polite">{on ? t("🔴 {mm} · relâchez pour terminer", { mm: mm(sec) }) : t("Restez appuyé sur le micro pour parler ({max} s max)", { max })}</div></div>);
}
