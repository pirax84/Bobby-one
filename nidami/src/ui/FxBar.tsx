import { useState } from "react";
import { useStore, actions } from "../lib/store";
import { FX, FX_KEYS, Fx, playFx } from "../lib/fx";
import { Modal, toast } from "./common";

export const DEFAULT_FAV: Fx[] = ["shake", "confetti", "hearts", "kiss"];
export const favOf = (v?: string): Fx[] => { const l = (v ? v.split(",") : DEFAULT_FAV).filter((k) => k in FX) as Fx[]; return l.length ? l.slice(0, 4) : DEFAULT_FAV; };

/** 4 effets favoris toujours visibles + un bouton « + » pour tous les autres. */
export function FxBar({ convId, compact = false }: { convId: string; compact?: boolean }) {
  const fav = useStore((x) => favOf(x.settings[x.me]?.fxfav)); const fxOn = useStore((x) => x.settings[x.me]?.fx ?? true); const [more, setMore] = useState(false);
  const send = (k: Fx) => { if (!actions.sendFx(convId, k)) return toast("Doucement : un effet toutes les 2 secondes."); playFx(k, fxOn); setMore(false); };
  const lab = (k: Fx) => (compact ? FX[k].label.split(" ")[0] : FX[k].label);
  return <><div className={compact ? "btools" : "row wrap"} style={compact ? undefined : { gap: 6 }}>{fav.map((k) => compact ? <button key={k} type="button" className="bi2" onClick={() => send(k)} aria-label={"Effet " + FX[k].label}>{lab(k)}</button> : <button key={k} className="chip" onClick={() => send(k)}>{lab(k)}</button>)}
    {compact ? <button type="button" className="bi2" onClick={() => setMore(true)} aria-label="Plus d'effets">＋</button> : <button className="chip" onClick={() => setMore(true)} aria-label="Plus d'effets">＋ Plus</button>}</div>
    {more && <Modal title="Tous les effets" onClose={() => setMore(false)}>
      <p className="muted small" style={{ marginTop: 0 }}>Cochez les 4 effets à garder devant ({fav.length}/4). Touchez « Envoyer » pour l'essayer.</p>
      <div className="col" style={{ gap: 4 }}>{FX_KEYS.map((k) => { const on = fav.includes(k); return <div key={k} className="row" style={{ padding: "4px 0", gap: 10 }}>
        <input type="checkbox" checked={on} aria-label={"Garder devant : " + FX[k].label} style={{ width: 22, height: 22 }} onChange={() => { if (!on && fav.length >= 4) return toast("4 au maximum : décochez-en un d'abord."); if (on && fav.length <= 1) return toast("Gardez au moins un effet devant."); actions.setSetting("fxfav", FX_KEYS.filter((x) => (x === k ? !on : fav.includes(x))).join(",")); }} />
        <span className="grow">{FX[k].label}</span><button className="chip" onClick={() => send(k)}>Envoyer</button></div>; })}</div>
    </Modal>}</>;
}
