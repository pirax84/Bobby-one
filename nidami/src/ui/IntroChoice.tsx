import { useState } from "react";
import { t } from "../i18n";
import { INTRO_KEY } from "./Intro";
import { Switch } from "./common";

export const SPLASH_OFF = "notiif-splash-off";
export function SplashToggle() {
  const read = () => { try { return localStorage.getItem(SPLASH_OFF) !== "1"; } catch { return true; } };
  const [on, setOn] = useState(read);
  return <label className="row" style={{ padding: "6px 0" }}><div className="grow"><b>{t("Écran d'ouverture animé")}</b><div className="muted small">{t("Les lettres NOTIIF tombent dans l'eau quand vous ouvrez l'appli. Activé par défaut.")}</div></div><Switch on={on} onChange={(v) => { setOn(v); try { if (v) localStorage.removeItem(SPLASH_OFF); else localStorage.setItem(SPLASH_OFF, "1"); } catch { /* rien */ } }} label={t("Écran d'ouverture animé")} /></label>;
}

export function IntroChoice() {
  const read = () => { try { return localStorage.getItem(INTRO_KEY) || "auto"; } catch { return "auto"; } };
  const [v, setV] = useState(read);
  const O: [string, string][] = [["auto", t("Automatique")], ["full", t("Toujours complète")], ["off", t("Aucune")]];
  return (<><div className="row" style={{ gap: 6 }}>{O.map(([k, l]) => <button key={k} type="button" className={"chip grow" + (v === k ? " on" : "")} aria-pressed={v === k} onClick={() => { try { localStorage.setItem(INTRO_KEY, k); } catch { /* rien */ } setV(k); if (k === "auto") window.dispatchEvent(new CustomEvent("notiif-intro-preview", { detail: { m: "full" } })); else if (k === "full") window.dispatchEvent(new CustomEvent("notiif-intro-preview", { detail: { m: "full" } })); }}>{l}</button>)}</div>
    <p className="muted small" style={{ margin: 0 }}>{t("Automatique : l'intro complète à chaque ouverture. Toucher un choix vous la montre.")}</p></>);
}
