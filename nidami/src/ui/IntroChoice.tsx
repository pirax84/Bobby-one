import { useEffect, useState } from "react";
import { t } from "../i18n";
import { INTRO_KEY } from "./Intro";
import { Switch } from "./common";

export const SPLASH_OFF = "notiif-splash-off";
export const SPLASH_MUTE = "notiif-splash-sound-off";
const lget = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const lset = (k: string, v: string | null) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* rien */ } };
export function SplashToggle() {
  const [on, setOn] = useState(() => lget(SPLASH_OFF) !== "1");
  const [snd, setSnd] = useState(() => lget(SPLASH_MUTE) !== "1");
  return <>
    <label className="row" style={{ padding: "6px 0" }}><div className="grow"><b>{t("Écran d'ouverture animé")}</b><div className="muted small">{t("Les lettres NOTIIF tombent dans l'eau quand vous ouvrez l'appli. Activé par défaut.")}</div></div><Switch on={on} onChange={(v) => { setOn(v); lset(SPLASH_OFF, v ? null : "1"); }} label={t("Écran d'ouverture animé")} /></label>
    {on && <label className="row" style={{ padding: "6px 0" }}><div className="grow"><b>{t("Son de l'écran d'ouverture")}</b><div className="muted small">{t("Le petit son d'eau qui accompagne l'ouverture de l'appli. Activé par défaut.")}</div></div><Switch on={snd} onChange={(v) => { setSnd(v); lset(SPLASH_MUTE, v ? null : "1"); }} label={t("Son de l'écran d'ouverture")} /></label>}
    {on && <div className="muted small" style={{ opacity: .7, paddingBottom: 4 }}>Water drops dripping — Wikimedia Commons, CC BY-SA 3.0</div>}
  </>;
}

/** Petite fenêtre affichée UNE seule fois, à la première ouverture « minimale » : garder ou couper le son. */
export function SplashHint() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (lget("notiif-splash-hint") !== "1" || lget("notiif-splash-hint2-done")) return;
    const a = window.setTimeout(() => setShow(true), 1400);
    const b = window.setTimeout(() => { lset("notiif-splash-hint2-done", "1"); lset("notiif-splash-hint", null); setShow(false); }, 11000);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  if (!show) return null;
  const done = (mute: boolean) => { if (mute) lset(SPLASH_MUTE, "1"); lset("notiif-splash-hint2-done", "1"); lset("notiif-splash-hint", null); setShow(false); };
  return <div role="dialog" aria-label={t("Son d'ouverture")} style={{ position: "fixed", left: 16, right: 16, bottom: "calc(16px + env(safe-area-inset-bottom, 0px))", zIndex: 9990, maxWidth: 420, margin: "0 auto", padding: "16px 18px", borderRadius: 22, background: "#262B86", color: "#F1F3FF", border: "1px solid rgba(142,155,255,.5)", boxShadow: "0 12px 30px rgba(0,0,0,.4)" }}>
    <b style={{ fontSize: 17 }}>{t("Son d'ouverture")}</b>
    <div style={{ fontSize: 13.5, opacity: .85, margin: "4px 0 12px" }}>{t("Un petit son d'eau accompagne l'ouverture de l'appli. Vous pouvez le garder ou le couper.")}</div>
    <div className="row" style={{ gap: 10 }}>
      <button type="button" className="btn grow" style={{ background: "#8E9BFF", color: "#101450" }} onClick={() => done(false)}>{t("Garder le son")}</button>
      <button type="button" className="btn ghost grow" onClick={() => done(true)} style={{ color: "#F1F3FF", background: "transparent", border: "2px solid rgba(142,155,255,.8)" }}>{t("Couper le son")}</button>
    </div>
  </div>;
}

export function IntroChoice() {
  const read = () => { try { return localStorage.getItem(INTRO_KEY) || "auto"; } catch { return "auto"; } };
  const [v, setV] = useState(read);
  const O: [string, string][] = [["auto", t("Automatique")], ["full", t("Toujours complète")], ["off", t("Aucune")]];
  return (<><div className="row" style={{ gap: 6 }}>{O.map(([k, l]) => <button key={k} type="button" className={"chip grow" + (v === k ? " on" : "")} aria-pressed={v === k} onClick={() => { try { localStorage.setItem(INTRO_KEY, k); } catch { /* rien */ } setV(k); if (k === "auto") window.dispatchEvent(new CustomEvent("notiif-intro-preview", { detail: { m: "full" } })); else if (k === "full") window.dispatchEvent(new CustomEvent("notiif-intro-preview", { detail: { m: "full" } })); }}>{l}</button>)}</div>
    <p className="muted small" style={{ margin: 0 }}>{t("Automatique : l'intro complète à chaque ouverture. Toucher un choix vous la montre.")}</p></>);
}
