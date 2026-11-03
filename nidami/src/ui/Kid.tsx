import { useState } from "react";
import { t } from "../i18n";
import { toast } from "./common";

const K = "notiif-kid-hash";
export const kidOn = () => { try { return !!localStorage.getItem(K); } catch { return false; } };
async function hash(pin: string) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("notiif:" + pin)); return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join(""); }
const ok = async (pin: string) => { try { return (await hash(pin)) === localStorage.getItem(K); } catch { return false; } };

/** Écran de code : protège Paramètres, Profil et Amis quand le contrôle parental est actif. */
export function PinGate({ onOk }: { onOk: () => void }) {
  const [pin, setPin] = useState(""); const [err, setErr] = useState(false);
  return (<div className="card col center" style={{ alignItems: "center", gap: 12 }}><div style={{ fontSize: 48 }}>🔒</div><h3>{t("Réservé aux parents")}</h3><p className="muted small" style={{ margin: 0 }}>{t("Entrez le code parent à 4 chiffres.")}</p>
    <input className="inp" inputMode="numeric" type="password" maxLength={4} value={pin} aria-label={t("Code parent")} onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setErr(false); }} style={{ textAlign: "center", letterSpacing: 8, maxWidth: 160 }} />
    {err && <div role="alert" style={{ color: "var(--warm)" }}>{t("Code incorrect.")}</div>}
    <button className="btn" onClick={async () => { if (await ok(pin)) onOk(); else { setErr(true); setPin(""); } }}>{t("Débloquer")}</button></div>);
}
/** Carte dans Paramètres : activer / couper le contrôle parental. */
export function KidCard() {
  const [on, setOn] = useState(kidOn()); const [pin, setPin] = useState(""); const [old, setOld] = useState("");
  return (<div className="card col"><h3>{t("👨‍👩‍👧 Contrôle parental")}</h3>
    <p className="muted small" style={{ margin: 0 }}>{t("Un code à 4 chiffres protège Paramètres, Profil et Amis sur ce téléphone. Un enfant ne peut plus ajouter de contacts ni changer les réglages. Ce contrôle agit sur cet appareil seulement.")}</p>
    {on ? <><input className="inp" inputMode="numeric" type="password" maxLength={4} placeholder={t("Code parent")} value={old} onChange={(e) => setOld(e.target.value.replace(/\D/g, ""))} aria-label={t("Code parent")} />
      <button className="btn danger" onClick={async () => { if (await ok(old)) { try { localStorage.removeItem(K); } catch { /* rien */ } setOn(false); setOld(""); toast(t("Contrôle parental coupé.")); } else toast(t("Code incorrect.")); }}>{t("Couper le contrôle parental")}</button></>
      : <><input className="inp" inputMode="numeric" type="password" maxLength={4} placeholder={t("Choisissez 4 chiffres")} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} aria-label={t("Nouveau code parent")} />
        <button className="btn" disabled={pin.length !== 4} onClick={async () => { try { localStorage.setItem(K, await hash(pin)); setOn(true); setPin(""); toast(t("Contrôle parental activé. Retenez bien le code.")); } catch { toast(t("Impossible d'enregistrer le code.")); } }}>{t("Activer")}</button></>}</div>);
}
