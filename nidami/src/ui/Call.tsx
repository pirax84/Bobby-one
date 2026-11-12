import { useEffect, useState } from "react";
import { useStore, userOf } from "../lib/store";
import { Avatar } from "./common";
import { callState, onCall, accept, decline, end, toggleMute } from "../lib/call";

/** Écran d'appel : sonnerie, appel en cours, raccrocher. */
export function CallLayer() {
  const [, bump] = useState(0); useEffect(() => onCall(() => bump((x) => x + 1)), []);
  const c = callState(); const s = useStore((x) => x); const u = userOf(s, "sb_" + c.peer);
  const [sec, setSec] = useState(0); useEffect(() => { if (c.phase !== "live") return; const i = setInterval(() => setSec(Math.floor((Date.now() - c.since) / 1000)), 500); return () => clearInterval(i); }, [c.phase, c.since]);
  if (c.phase === "idle") return null;
  const mm = Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
  const label = c.phase === "ringing-in" ? "t'appelle…" : c.phase === "ringing-out" ? "Appel en cours…" : c.phase === "connecting" ? "Connexion…" : mm;
  return <div className="calllayer" role="dialog" aria-label="Appel"><div className="callbox">
    <Avatar u={u} s={96} /><b style={{ fontSize: "1.4rem" }}>{u?.name || "Un ami"}</b><span className="muted">{label}</span>
    {c.phase === "ringing-in" ? <div className="row" style={{ gap: 28, marginTop: 20 }}><button type="button" className="callbtn bad" onClick={decline} aria-label="Refuser">✕</button><button type="button" className="callbtn ok" onClick={() => void accept()} aria-label="Répondre">📞</button></div>
      : <div className="row" style={{ gap: 28, marginTop: 20 }}>{c.phase === "live" && <button type="button" className={"callbtn" + (c.muted ? " on" : "")} onClick={toggleMute} aria-label="Couper le micro">{c.muted ? "🔇" : "🎙"}</button>}<button type="button" className="callbtn bad" onClick={() => end(true)} aria-label="Raccrocher">✕</button></div>}
  </div></div>;
}
