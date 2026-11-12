import { useEffect, useState } from "react";
import { playFx, stopFx, playingFx, type Fx } from "../lib/fx";
import { t } from "../i18n";
let testing = false;
/** Gros bouton rond ■ : reste visible par-dessus l'effet pendant un essai (jamais pour un effet reçu). */
export function FxStopFloat() {
  const [cur, setCur] = useState(playingFx());
  useEffect(() => { const h = () => { const c = playingFx(); if (!c) testing = false; setCur(c); }; window.addEventListener("notiif-fxstate", h); const esc = (e: KeyboardEvent) => { if (e.key === "Escape" && testing) { testing = false; stopFx(); } }; window.addEventListener("keydown", esc); return () => { window.removeEventListener("notiif-fxstate", h); window.removeEventListener("keydown", esc); }; }, []);
  if (!cur || !testing) return null;
  return <div className="fxstopf"><button type="button" onClick={() => { testing = false; stopFx(); }} aria-label={t("Arrêter l'essai")}><i /></button><span>{t("Arrêter l'essai")}</span></div>;
}
/** Interrupteur « Tester » : on l'allume, l'effet démarre ; on l'éteint, tout s'arrête (image et son). Il s'éteint seul à la fin de l'effet. */
export function FxSwitch({ k, sound = true }: { k: Fx; sound?: boolean }) {
  const [cur, setCur] = useState(playingFx());
  useEffect(() => { const h = () => setCur(playingFx()); window.addEventListener("notiif-fxstate", h); return () => window.removeEventListener("notiif-fxstate", h); }, []);
  const on = cur === k;
  return <button type="button" role="switch" aria-checked={on} aria-label={t("Tester")} className={"fxsw" + (on ? " on" : "")} onClick={() => { if (on) { testing = false; stopFx(); } else { testing = true; playFx(k, sound); } }}><i /><span>{t("Tester")}</span></button>;
}
