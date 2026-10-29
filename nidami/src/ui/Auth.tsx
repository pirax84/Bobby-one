import { useEffect, useState } from "react";
import { actions } from "../lib/store";
import { PROVIDERS, serverOn, oauthUrl, emailSignUp, emailLogin, type Prov } from "../lib/auth";
import { Logo, Modal, toast, Switch } from "./common";
import { LegalView } from "./Legal";
import { t, tn } from "../i18n";

// L'événement d'installation arrive tôt : on l'écoute dès le chargement du fichier.
let deferred: any = null; const subs = new Set<() => void>();
if (typeof window !== "undefined") { window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; subs.forEach((f) => f()); }); window.addEventListener("appinstalled", () => { deferred = null; subs.forEach((f) => f()); }); }
const APK = "https://github.com/pirax84/Bobby-one/releases/download/notiif-android-latest/notiif.apk";
const isApp = () => /CercleApp/.test(navigator.userAgent);
const isAndroid = () => /Android/.test(navigator.userAgent);
const standalone = () => typeof window !== "undefined" && (isApp() || window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true);
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/** Carte « Installer » réutilisable (réglages) : même logique que l'écran d'accueil. */
export function InstallCard() {
  const [, force] = useState(0); useEffect(() => { const f = () => force((n) => n + 1); subs.add(f); return () => { subs.delete(f); }; }, []);
  if (standalone()) return <div className="card"><b>{t("✅ Application installée")}</b><div className="muted small">{t("Vous l'utilisez déjà comme une vraie application.")}</div></div>;
  return <div className="card col"><h3>{t("📲 Installer l'application")}</h3>
    {deferred ? <button className="btn" onClick={async () => { deferred.prompt(); try { await deferred.userChoice; } catch { /* ignoré */ } deferred = null; subs.forEach((f) => f()); }}>{t("Installer sur cet appareil")}</button>
      : isAndroid() ? <a className="btn" href={APK} style={{ textDecoration: "none" }}>{t("Télécharger l'application Android")}</a>
      : isIOS() ? <div className="small">{t("Sur iPhone et iPad : touchez")}{" "}<b>{t("Partager")}</b>{" "}{t("⬆️ puis")}{" "}<b>{t("« Sur l'écran d'accueil »")}</b>.</div>
      : <div className="small muted">{t("Ouvrez le menu du navigateur (⋮) puis « Installer l'application » ou « Ajouter à l'écran d'accueil ».")}</div>}</div>;
}
function InstallStep({ onSkip }: { onSkip: () => void }) {
  const [, force] = useState(0); useEffect(() => { const f = () => force((n) => n + 1); subs.add(f); return () => { subs.delete(f); }; }, []);
  const ios = isIOS();
  const point = (e: string, tx: string, d: string) => <div className="row" style={{ gap: 12, textAlign: "left", alignItems: "flex-start" }}><span style={{ fontSize: "1.5rem", lineHeight: 1.2 }}>{e}</span><div><b>{tx}</b><div className="muted small">{d}</div></div></div>;
  return (<div className="card col center" style={{ alignItems: "center", gap: 16, padding: 28 }}>
    <Logo s={150} /><h1 style={{ fontSize: "1.5rem", letterSpacing: "-.03em" }}>{t("Votre cercle.")}<br />{t("Vos moments.")}</h1>
    <p className="muted" style={{ margin: 0 }}>{t("Le réseau privé de vos proches : famille, amis, collègues, équipe, troupe ou club. Sans publicité, sans inconnus, sans partage vers l'extérieur.")}</p>
    <div className="col" style={{ gap: 12, width: "100%" }}>
      {point("📸", t("Partagez avec qui vous voulez"), t("Photos, vidéos et textes, seulement pour les personnes que vous choisissez."))}
      {point("✨", t("Des stories qui disparaissent"), t("24 heures, ou quelques secondes pour une photo éphémère."))}
      {point("💬", t("Messages, vocaux et effets"), t("Discutez en groupe ou en privé, et envoyez des effets avec du son."))}
    </div>
    <button className="btn" style={{ width: "100%" }} onClick={onSkip}>{t("Entrer dans NOTIIF")}</button>
    <div className="col" style={{ width: "100%", gap: 8, paddingTop: 6, borderTop: "1px solid var(--bd)" }}>
      <div className="muted small">{t("Pour avoir NOTIIF comme une vraie application sur votre téléphone :")}</div>
      {deferred && <button className="btn ghost" style={{ width: "100%" }} onClick={async () => { deferred.prompt(); try { await deferred.userChoice; } catch { /* ignoré */ } deferred = null; subs.forEach((f) => f()); }}>{t("Installer l'application")}</button>}
      {isAndroid() && <a className="btn ghost" style={{ width: "100%", textDecoration: "none" }} href={APK}>{t("Télécharger l'application Android")}</a>}
      {ios && !deferred && <div className="small" style={{ textAlign: "left" }}>{t("Sur iPhone et iPad : touchez")}{" "}<b>{t("Partager")}</b>{" "}{t("⬆️ puis")}{" "}<b>{t("« Sur l'écran d'accueil »")}</b>.</div>}
      {!ios && !deferred && !isAndroid() && <div className="muted small">{t("Ouvrez le menu du navigateur (⋮) puis « Installer l'application » ou « Ajouter à l'écran d'accueil ».")}</div>}
    </div>
  </div>);
}

function ProvBtn({ p, onSoon }: { p: Prov; onSoon: (p: Prov) => void }) {
  return <button type="button" className="prov" onClick={() => { if (!serverOn()) { onSoon({ ...p, soon: t("Cette connexion s'active quand le serveur sera relié (voir le guide).") }); return; } if (p.soon || !p.sb) { onSoon(p); return; } location.href = oauthUrl(p.sb); }}><span className="pb">{p.badge}</span><span className="grow">{p.label}</span></button>;
}

function SignUp() {
  const [mode, setMode] = useState<"new" | "old">("new"); const [name, setName] = useState(""); const [pseudo, setPseudo] = useState(""); const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [ok, setOk] = useState(false);
  const [legal, setLegal] = useState(false); const [info, setInfo] = useState(""); const [prov, setProv] = useState<Prov | null>(null); const [busy, setBusy] = useState(false); const on = serverOn();
  const legalBtn = <button type="button" style={{ background: "none", border: 0, padding: 0, color: "var(--brand2)", textDecoration: "underline" }} onClick={() => setLegal(true)}>{t("conditions d'utilisation et la politique de confidentialité")}</button>;
  const submit = async (e: React.FormEvent) => { e.preventDefault(); if (!ok) return; setBusy(true);
    const r = mode === "new" ? await emailSignUp(email.trim(), pw, name.trim() || email.split("@")[0]) : await emailLogin(email.trim(), pw); setBusy(false); setInfo(r.msg); if (r.who) actions.start(r.who.name, "", pseudo); };
  return (<div className="card col center" style={{ alignItems: "center", gap: 14, padding: 26 }}>
    <Logo s={110} /><h1 style={{ fontSize: "1.6rem", letterSpacing: "-.03em" }}>{mode === "new" ? t("Créer mon compte") : t("Me connecter")}</h1>
    <div className="col" style={{ width: "100%", gap: 8 }}>{PROVIDERS.map((p) => <ProvBtn key={p.id} p={p} onSoon={(q) => setProv(q)} />)}</div>
    <div className="muted small">{t("— ou —")}</div>
    {on ? <form className="col" style={{ width: "100%" }} onSubmit={submit}>
      {mode === "new" && <input className="inp" placeholder={t("Votre prénom ou pseudo")} value={name} onChange={(e) => setName(e.target.value)} maxLength={30} aria-label={t("Prénom")} />}{mode === "new" && <input className="inp" placeholder={t("Pseudo @ (facultatif) : modifiable une seule fois, payant")} value={pseudo} onChange={(e) => setPseudo(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, "").slice(0, 20))} aria-label={t("Pseudo")} />}
      <input className="inp" type="email" placeholder={t("Votre e-mail")} value={email} onChange={(e) => setEmail(e.target.value)} aria-label="E-mail" required />
      <input className="inp" type="password" placeholder={t("Mot de passe (8 caractères minimum)")} value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} aria-label={t("Mot de passe")} required />
      <label className="row small muted" style={{ textAlign: "left", alignItems: "flex-start" }}><Switch on={ok} onChange={setOk} label={t("J'accepte les conditions")} /><span>{tn("J'ai 15 ans ou plus et j'accepte les {legalBtn}.", { legalBtn })}</span></label>
      <button className="btn" disabled={!ok || busy || pw.length < 8 || !email}>{mode === "new" ? t("Créer mon compte") : t("Me connecter")}</button>
      <button type="button" className="btn ghost" onClick={() => { setMode(mode === "new" ? "old" : "new"); setInfo(""); }}>{mode === "new" ? t("J'ai déjà un compte") : t("Je n'ai pas encore de compte")}</button></form>
    : <form className="col" style={{ width: "100%" }} onSubmit={(e) => { e.preventDefault(); if (!name.trim()) { setInfo(t("Écrivez d'abord votre prénom ou pseudo ci-dessus.")); toast(t("Écrivez d'abord votre prénom ou pseudo.")); return; } if (!ok) { setInfo(t("Cochez la case « J'ai 15 ans ou plus » pour continuer.")); toast(t("Cochez la case des conditions.")); return; } actions.start(name, "", pseudo); }}>
      <div className="card" style={{ textAlign: "left", fontSize: ".9rem" }}><b>{t("🧪 Mode démo")}</b><div className="muted small">{t("Les vrais comptes (e-mail, Google, Apple, Facebook, FranceConnect…) demandent un serveur, qui n'est pas encore relié. En attendant, vous pouvez essayer l'application sur cet appareil avec des amis fictifs.")}</div></div>
      <input className="inp" placeholder={t("Votre prénom ou pseudo (démo)")} value={name} onChange={(e) => setName(e.target.value)} maxLength={30} aria-label={t("Prénom")} />
      <input className="inp" placeholder={t("Pseudo @ (facultatif) : modifiable une seule fois, payant")} value={pseudo} onChange={(e) => setPseudo(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, "").slice(0, 20))} aria-label={t("Pseudo")} />
      <label className="row small muted" style={{ textAlign: "left", alignItems: "flex-start" }}><Switch on={ok} onChange={setOk} label={t("J'accepte les conditions")} /><span>{tn("J'ai 15 ans ou plus et j'accepte les {legalBtn}.", { legalBtn })}</span></label>
      <button className="btn">{t("Essayer en mode démo")}</button>{info && <div className="small" role="status" style={{ color: "var(--warm)", textAlign: "left" }}>{info}</div>}</form>}
    {on && info && <div className="small" role="status" style={{ color: "var(--warm)", textAlign: "left" }}>{info}</div>}
    {prov && <Modal title={prov.label} onClose={() => setProv(null)}><div className="col"><p style={{ margin: 0 }}>{prov.soon}</p><p className="muted small" style={{ margin: 0 }}>{t("Pour l'instant, vous pouvez essayer l'application en mode démo, sur cet appareil, avec des amis fictifs.")}</p><button className="btn" onClick={() => setProv(null)}>{t("Compris, j'essaie en mode démo")}</button></div></Modal>}
    {legal && <Modal title={t("Documents juridiques")} onClose={() => setLegal(false)}><div style={{ textAlign: "left" }}><LegalView /></div></Modal>}
  </div>);
}

const seenInstall = () => { try { return sessionStorage.getItem("install-seen") === "1"; } catch { return false; } };
/** La page de présentation s'affiche à chaque nouvelle ouverture dans le navigateur (pas dans l'application installée). */
export const needInstall = () => !standalone() && !seenInstall();
export function Onboarding({ started = false }: { started?: boolean }) {
  const [, force] = useState(0); useEffect(() => { const f = () => force((n) => n + 1); subs.add(f); return () => { subs.delete(f); }; }, []);
  const [skipped, setSkipped] = useState(false);
  const canInstall = needInstall() && !skipped;
  return <div className="hero">{canInstall ? <InstallStep onSkip={() => { try { sessionStorage.setItem("install-seen", "1"); } catch { /* ignoré */ } setSkipped(true); if (started) setTimeout(() => location.reload(), 0); }} /> : <SignUp />}</div>;
}
