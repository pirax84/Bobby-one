import { useState } from "react";
import { t } from "../i18n";
import { INTRO_KEY } from "./Intro";

export function IntroChoice() {
  const read = () => { try { return localStorage.getItem(INTRO_KEY) || "auto"; } catch { return "auto"; } };
  const [v, setV] = useState(read);
  const O: [string, string][] = [["auto", t("Automatique")], ["full", t("Toujours complète")], ["off", t("Aucune")]];
  return (<><div className="row" style={{ gap: 6 }}>{O.map(([k, l]) => <button key={k} type="button" className={"chip grow" + (v === k ? " on" : "")} aria-pressed={v === k} onClick={() => { try { localStorage.setItem(INTRO_KEY, k); } catch { /* rien */ } setV(k); if (k === "auto") window.dispatchEvent(new CustomEvent("notiif-intro-preview", { detail: { m: "full" } })); else if (k === "full") window.dispatchEvent(new CustomEvent("notiif-intro-preview", { detail: { m: "full" } })); }}>{l}</button>)}</div>
    <p className="muted small" style={{ margin: 0 }}>{t("Automatique : l'intro complète à chaque ouverture. Toucher un choix vous la montre.")}</p></>);
}
