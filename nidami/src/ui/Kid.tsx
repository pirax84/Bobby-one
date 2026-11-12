import { useState } from "react";
import { t } from "../i18n";
import { toast, isPC, Modal } from "./common";

const K = "notiif-kid-hash";
export const kidOn = () => { try { return !!localStorage.getItem(K); } catch { return false; } };
async function hash(pin: string) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("notiif:" + pin)); return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join(""); }
/** Enregistre le code parental choisi à l'inscription d'un mineur. */
export const setKidCode = async (pin: string) => { try { localStorage.setItem(K, await hash(pin)); return true; } catch { return false; } };
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
/** Page d'explication simple destinée aux parents. */
function ParentsInfo({ onClose }: { onClose: () => void }) {
  const H = ({ children }: { children: string }) => <h4 style={{ margin: "14px 0 4px" }}>{children}</h4>;
  return <Modal title={t("👨‍👩‍👧 Pour les parents")} onClose={onClose}><div className="col" style={{ gap: 6, lineHeight: 1.5 }}>
    <p style={{ margin: 0 }}>{t("NOTIIF est un réseau privé pour la famille et les amis. Voici, simplement, ce qu'il fait et ce qu'il ne fait pas.")}</p>
    <H>{t("Qui peut parler à votre enfant ?")}</H>
    <p style={{ margin: 0 }}>{t("Seulement les personnes qu'il a ajoutées lui-même, avec un code ou un QR code. Il n'y a ni annuaire public ni inconnus qui écrivent. On peut bloquer ou signaler un contact à tout moment.")}</p>
    <H>{t("Le code parental")}</H>
    <p style={{ margin: 0 }}>{t("Un code à 4 chiffres protège Paramètres, Profil et Amis : sans le code, un enfant ne peut pas ajouter de contacts ni changer les réglages. Ce code agit sur cet appareil seulement.")}</p>
    <H>{t("Photos et vidéos éphémères")}</H>
    <p style={{ margin: 0 }}>{t("Une photo ou une vidéo peut disparaître après quelques secondes. Attention : rien n'empêche de la photographier avec un autre appareil. Le nom de la personne est écrit discrètement sur la photo (filigrane) pour décourager le partage.")}</p>
    <H>{t("Vos données")}</H>
    <p style={{ margin: 0 }}>{t("Chaque personne ne voit que ce qui la concerne. Il n'y a ni publicité ni vente de données.")}</p>
    <H>{t("Ce que nous vous conseillons")}</H>
    <p style={{ margin: 0 }}>{t("Ajoutez ensemble les premiers contacts, parlez de ce qu'on partage en ligne, et gardez le code parental pour vous.")}</p>
  </div></Modal>;
}

export function KidCard() {
  const [info, setInfo] = useState(false);
  const [on, setOn] = useState(kidOn()); const [pin, setPin] = useState(""); const [old, setOld] = useState("");
  return (<div className="card col"><h3>{t("👨‍👩‍👧 Contrôle parental")}</h3>
    <p className="muted small" style={{ margin: 0 }}>{(isPC() ? t("Un code à 4 chiffres protège Paramètres, Profil et Amis sur cet ordinateur. Un enfant ne peut plus ajouter de contacts ni changer les réglages. Ce contrôle agit sur cet appareil seulement.") : t("Un code à 4 chiffres protège Paramètres, Profil et Amis sur ce téléphone. Un enfant ne peut plus ajouter de contacts ni changer les réglages. Ce contrôle agit sur cet appareil seulement."))}</p>
    {on ? <><input className="inp" inputMode="numeric" type="password" maxLength={4} placeholder={t("Code parent")} value={old} onChange={(e) => setOld(e.target.value.replace(/\D/g, ""))} aria-label={t("Code parent")} />
      <button className="btn danger" onClick={async () => { if (await ok(old)) { try { localStorage.removeItem(K); } catch { /* rien */ } setOn(false); setOld(""); toast(t("Contrôle parental coupé.")); } else toast(t("Code incorrect.")); }}>{t("Couper le contrôle parental")}</button></>
      : <><input className="inp" inputMode="numeric" type="password" maxLength={4} placeholder={t("Choisissez 4 chiffres")} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} aria-label={t("Nouveau code parent")} />
        <button className="btn" disabled={pin.length !== 4} onClick={async () => { try { localStorage.setItem(K, await hash(pin)); setOn(true); setPin(""); toast(t("Contrôle parental activé. Retenez bien le code.")); } catch { toast(t("Impossible d'enregistrer le code.")); } }}>{t("Activer")}</button></>}
    <button type="button" className="btn ghost" onClick={() => setInfo(true)}>{t("ℹ️ Pour les parents : ce qu'il faut savoir")}</button>{info && <ParentsInfo onClose={() => setInfo(false)} />}</div>);
}
