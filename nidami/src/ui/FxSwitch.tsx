import { useEffect, useState } from "react";
import { playFx, stopFx, playingFx, type Fx } from "../lib/fx";
import { t } from "../i18n";
/** Interrupteur « Tester » : on l'allume, l'effet démarre ; on l'éteint, tout s'arrête (image et son). Il s'éteint seul à la fin de l'effet. */
export function FxSwitch({ k, sound = true }: { k: Fx; sound?: boolean }) {
  const [cur, setCur] = useState(playingFx());
  useEffect(() => { const h = () => setCur(playingFx()); window.addEventListener("notiif-fxstate", h); return () => window.removeEventListener("notiif-fxstate", h); }, []);
  const on = cur === k;
  return <button type="button" role="switch" aria-checked={on} aria-label={t("Tester")} className={"fxsw" + (on ? " on" : "")} onClick={() => (on ? stopFx() : playFx(k, sound))}><i /><span>{t("Tester")}</span></button>;
}
