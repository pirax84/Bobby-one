import { AudioWave } from "./AudioWave";
import { useRef, useState } from "react";
import { useStore, actions } from "../lib/store";
import { FX, FX_KEYS, Fx, playFx, playCustom } from "../lib/fx";
import { Modal, toast, fileToDataUrl } from "./common";
import { t } from "../i18n";

export const DEFAULT_FAV: Fx[] = ["shake", "clap", "hearts", "kiss"];
export const favOf = (v?: string): Fx[] => { const l = (v ? v.split(",") : DEFAULT_FAV).filter((k) => k in FX) as Fx[]; return l.length ? l.slice(0, 4) : DEFAULT_FAV; };

/** 4 effets favoris toujours visibles + un bouton « + » pour tous les autres. */
export function FxBar({ convId, compact = false }: { convId: string; compact?: boolean }) {
  const fav = useStore((x) => favOf(x.settings[x.me]?.fxfav)); const fxOn = useStore((x) => x.settings[x.me]?.fx ?? true); const [more, setMore] = useState(false);
  const customs = useStore((x) => cfxOf(x.settings[x.me]?.cfx)); const [mk, setMk] = useState(false);
  const sendC = (c: CFx) => { if (!actions.sendCustomFx(convId, c)) return toast(t("Doucement : un effet par seconde.")); playCustom(c, fxOn); setMore(false); };
  const send = (k: Fx) => { if (!actions.sendFx(convId, k)) return toast(t("Doucement : un effet par seconde.")); playFx(k, fxOn); setMore(false); };
  const lab = (k: Fx) => (compact ? FX[k].label.split(" ")[0] : FX[k].label);
  return <><div className={compact ? "btools" : "row wrap"} style={compact ? undefined : { gap: 6 }}>{fav.map((k) => compact ? <button key={k} type="button" className="bi2" onClick={() => send(k)} aria-label={t("Effet {label}", { label: FX[k].label })}>{lab(k)}</button> : <button key={k} className="chip" onClick={() => send(k)}>{lab(k)}</button>)}
    {customs.map((c) => compact ? <button key={c.id} type="button" className="bi2" onClick={() => sendC(c)} aria-label={t("Effet perso {name}", { name: c.name })}>{c.img ? <img src={c.img} alt="" style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover" }} /> : "🎙"}</button> : <button key={c.id} className="chip" onClick={() => sendC(c)}>{c.img ? <img src={c.img} alt="" style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover", verticalAlign: "middle" }} /> : "🎙"} {c.name}</button>)}
    {compact ? <button type="button" className="bi2" onClick={() => setMore(true)} aria-label={t("Plus d'effets")}>＋</button> : <button className="chip" onClick={() => setMore(true)} aria-label={t("Plus d'effets")}>{t("＋ Plus")}</button>}</div>
    {more && <Modal title={t("Tous les effets")} onClose={() => setMore(false)}>
      <p className="muted small" style={{ marginTop: 0 }}>{t("Cochez les 4 effets à garder devant ({length}/4). Touchez « Envoyer » pour l'essayer.", { length: fav.length })}</p>
      <div className="col" style={{ gap: 4 }}>{FX_KEYS.map((k) => { const on = fav.includes(k); return <div key={k} className="row" style={{ padding: "4px 0", gap: 10 }}>
        <input type="checkbox" checked={on} aria-label={t("Garder devant : {label}", { label: FX[k].label })} style={{ width: 22, height: 22 }} onChange={() => { if (!on && fav.length >= 4) return toast(t("4 au maximum : décochez-en un d'abord.")); if (on && fav.length <= 1) return toast(t("Gardez au moins un effet devant.")); actions.setSetting("fxfav", FX_KEYS.filter((x) => (x === k ? !on : fav.includes(x))).join(",")); }} />
        <span className="grow">{FX[k].label}</span><button className="chip" onClick={() => send(k)}>{t("Envoyer")}</button></div>; })}</div>
      <b style={{ display: "block", marginTop: 14 }}>{t("Mes effets personnalisés")}</b>
      {customs.map((c) => <div key={c.id} className="row" style={{ padding: "4px 0", gap: 10 }}>{c.img ? <img src={c.img} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} /> : <span>🎙</span>}<span className="grow ell">{c.name}</span><button className="chip" onClick={() => sendC(c)}>{t("Envoyer")}</button><button className="chip" aria-label={t("Supprimer {name}", { name: c.name })} onClick={() => actions.setSetting("cfx", JSON.stringify(customs.filter((x) => x.id !== c.id)))}>🗑</button></div>)}
      {mk ? <CustomMaker onDone={() => setMk(false)} /> : <button className="btn ghost" style={{ marginTop: 6 }} onClick={() => setMk(true)}>{t("＋ Créer mon effet (image + ma voix)")}</button>}
    </Modal>}</>;
}

export interface CFx { id: string; name: string; img?: string; audio?: string }
export const cfxOf = (v?: string): CFx[] => { try { const l = JSON.parse(v || "[]"); return Array.isArray(l) ? l.slice(0, 6) : []; } catch { return []; } };
const MAXREC = 3;

/** Créer un effet personnalisé : une petite image + un son enregistré (3 secondes maximum). */
export function CustomMaker({ onDone }: { onDone: () => void }) {
  const list = useStore((x) => cfxOf(x.settings[x.me]?.cfx)); const [name, setName] = useState(""); const [img, setImg] = useState<string | undefined>(); const [audio, setAudio] = useState<string | undefined>(); const [left, setLeft] = useState(0);
  const rec = useRef<MediaRecorder | null>(null); const pick = useRef<HTMLInputElement>(null); const snd = useRef<HTMLInputElement>(null);
  const record = async () => {
    if (rec.current) { rec.current.stop(); return; }
    try { const st = await navigator.mediaDevices.getUserMedia({ audio: true }); const r = new MediaRecorder(st); const ch: Blob[] = []; r.ondataavailable = (e) => ch.push(e.data); let n = MAXREC; setLeft(n); const iv = setInterval(() => { n--; setLeft(Math.max(n, 0)); }, 1000);
      r.onstop = () => { clearInterval(iv); st.getTracks().forEach((tx) => tx.stop()); rec.current = null; setLeft(0); const fr = new FileReader(); fr.onload = () => setAudio(String(fr.result)); fr.readAsDataURL(new Blob(ch, { type: ((r.mimeType || "audio/webm").split(";")[0]) })); };
      r.start(); rec.current = r; setTimeout(() => r.state === "recording" && r.stop(), MAXREC * 1000); } catch { toast(t("Micro indisponible ou refusé.")); }
  };
  const save = () => { if (!name.trim()) return toast(t("Donnez un nom à votre effet.")); if (!audio && !img) return toast(t("Ajoutez une image ou un son.")); if (list.length >= 6) return toast(t("6 effets personnalisés au maximum.")); actions.setSetting("cfx", JSON.stringify([...list, { id: "c" + Date.now().toString(36), name: name.trim().slice(0, 20), img, audio }])); toast(t("Effet ajouté.")); onDone(); };
  return <div className="col" style={{ gap: 8 }}>
    <input className="inp" placeholder={t("Nom de l'effet (ex. Mon rire)")} value={name} maxLength={20} onChange={(e) => setName(e.target.value)} aria-label={t("Nom de l'effet")} />
    <div className="row" style={{ gap: 8 }}>
      <input ref={pick} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { setImg(await fileToDataUrl(f, 120, 0.7)); } catch { toast(t("Image illisible.")); } } e.target.value = ""; }} />
      <button type="button" className="chip" onClick={() => pick.current?.click()}>{img ? <img src={img} alt="" style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover", verticalAlign: "middle" }} /> : "🖼"}{" "}{t("Image")}</button>
      <button type="button" className="chip" onClick={record} style={left ? { background: "var(--bad)", color: "#fff" } : undefined}>🎙 {left ? t("Enregistrement… {left} s (toucher pour finir)", { left }) : audio ? t("Réenregistrer") : t("Enregistrer (3 s max)")}</button></div>
    <input ref={snd} type="file" accept="audio/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; if (f.size > 450000) return toast(t("Son trop lourd (450 Ko maximum, environ 10 secondes).")); const fr = new FileReader(); fr.onload = () => setAudio(String(fr.result)); fr.readAsDataURL(f); }} />
    <button type="button" className="chip" style={{ alignSelf: "flex-start" }} onClick={() => snd.current?.click()}>{t("📁 Choisir un fichier son")}</button>
    {audio && <AudioWave src={audio} />}
    <div className="row" style={{ gap: 8 }}><button type="button" className="btn ghost grow" onClick={() => playCustom({ img, audio, name })}>{t("▶ Essayer")}</button><button type="button" className="btn grow" onClick={save}>{t("Ajouter")}</button></div></div>;
}
