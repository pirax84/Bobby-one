import { useEffect, useRef, useState } from "react";
import { useStore, userOf } from "../lib/store";
import { Avatar } from "./common";
import { actions } from "../lib/store";
import { t } from "../i18n";
import { callState, onCall, accept, decline, end, toggleMute, toggleCam, streams } from "../lib/call";

/** Écran d'appel : sonnerie, appel en cours, raccrocher. */
export function CallLayer() {
  const [, bump] = useState(0); useEffect(() => onCall(() => bump((x) => x + 1)), []);
  const c = callState(); const s = useStore((x) => x); const u = userOf(s, "sb_" + c.peer);
  const [sec, setSec] = useState(0); useEffect(() => { if (c.phase !== "live") return; const i = setInterval(() => setSec(Math.floor((Date.now() - c.since) / 1000)), 500); return () => clearInterval(i); }, [c.phase, c.since]);
  const rv = useRef<HTMLVideoElement>(null); const lv = useRef<HTMLVideoElement>(null);
  useEffect(() => { const { local, remote } = streams(); if (rv.current && remote && rv.current.srcObject !== remote) { rv.current.srcObject = remote; void rv.current.play().catch(() => {}); } if (lv.current && local && lv.current.srcObject !== local) { lv.current.srcObject = local; void lv.current.play().catch(() => {}); } });
  if (c.phase === "idle") return null;
  const mm = Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
  const label = c.phase === "ringing-in" ? "t'appelle…" : c.phase === "ringing-out" ? "Appel en cours…" : c.phase === "connecting" ? "Connexion…" : mm;
  return <div className="calllayer" role="dialog" aria-label="Appel"><div className="callbox">
    {c.video && c.phase !== "ringing-in" ? <div style={{ position: "relative", width: "100%", maxWidth: 420 }}><video ref={rv} playsInline autoPlay style={{ width: "100%", borderRadius: 18, background: "#000", maxHeight: "55vh", objectFit: "cover" }} /><video ref={lv} playsInline autoPlay muted style={{ position: "absolute", right: 8, bottom: 8, width: "28%", borderRadius: 12, background: "#111", objectFit: "cover", border: "2px solid #fff" }} /></div> : <Avatar u={u} s={96} />}<b style={{ fontSize: "1.4rem" }}>{u?.name || "Un ami"}</b><span className="muted">{label}</span>
    {c.phase === "ringing-in" ? <><div className="row" style={{ gap: 28, marginTop: 20 }}><button type="button" className="callbtn bad" onClick={decline} aria-label="Refuser">✕</button><button type="button" className="callbtn ok" onClick={() => void accept()} aria-label="Répondre">📞</button></div><button type="button" className="btn ghost" style={{ marginTop: 14 }} onClick={() => { const id = "sbc_" + c.peer; decline(); try { actions.send(id, t("📞 Je te rappelle plus tard")); } catch { /* ignoré */ } }}>{t("Je te rappelle plus tard")}</button></>
      : <div className="row" style={{ gap: 28, marginTop: 20 }}>{c.video && <button type="button" className={"callbtn" + (!c.cam ? " on" : "")} onClick={toggleCam} aria-label={t("Couper la caméra")}>{c.cam ? "📹" : "🚫"}</button>}{c.phase === "live" && <button type="button" className={"callbtn" + (c.muted ? " on" : "")} onClick={toggleMute} aria-label="Couper le micro">{c.muted ? "🔇" : "🎙"}</button>}<button type="button" className="callbtn bad" onClick={() => end(true)} aria-label="Raccrocher">✕</button></div>}
  </div></div>;
}
