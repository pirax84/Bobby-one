import { useEffect, useState } from "react";
import { actions } from "../lib/store";
import { PROVIDERS, serverOn, oauthUrl, emailSignUp, emailLogin, type Prov } from "../lib/auth";
import { Logo, Modal, toast, Switch, DobFields, ageFrom, fileToDataUrl } from "./common";
import { setKidCode } from "./Kid";
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

const COUNTRY_CODES = "FR BE CH LU MC CA US GB IE DE AT IT ES PT NL DK SE NO FI IS PL CZ SK HU RO BG GR HR SI RS BA ME MK AL XK LT LV EE UA MD BY RU TR CY MT MA DZ TN EG SN CI CM CD MG RE MQ GP GF NC PF HT MU BJ BF ML NE TG GA CG LB IL JO SA AE QA KW IN PK BD LK CN JP KR VN TH PH ID MY SG AU NZ BR AR CL CO PE MX UY VE EC DO CU".split(" ");
const Eye = ({ off }: { off: boolean }) => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />{off && <path d="M4 4l16 16" />}</svg>;
/** Champ mot de passe avec l'œil pour voir ou cacher ce qu'on écrit. */
function PwField({ value, onChange, label, hint, tone, autoComplete }: { value: string; onChange: (v: string) => void; label: string; hint?: string; tone?: boolean; autoComplete?: string }) {
  const [show, setShow] = useState(false);
  return <label className="col" style={{ gap: 3, textAlign: "left" }}><span className="muted small">{label}</span>
    <span className="row" style={{ position: "relative" }}><input className="inp" type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} autoComplete={autoComplete || "new-password"} style={{ paddingRight: 48, borderColor: tone ? "var(--brand)" : undefined, borderWidth: tone ? 2 : undefined }} />
      <button type="button" aria-label={show ? t("Cacher le mot de passe") : t("Voir le mot de passe")} aria-pressed={show} onClick={() => setShow(!show)} style={{ position: "absolute", right: 6, background: "none", border: 0, color: "var(--brand2)", padding: 8, display: "flex" }}><Eye off={!show} /></button></span>
    {hint && <span className="small" style={{ color: tone ? "var(--brand2)" : undefined }}>{hint}</span>}</label>;
}
function Fld({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) { return <label className="col" style={{ gap: 3, textAlign: "left" }}><span className="muted small">{label}</span>{children}{hint && <span className="muted small">{hint}</span>}</label>; }

function SignUp() {
  const [mode, setMode] = useState<"new" | "old">("new"); const [step, setStep] = useState(1);
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [pw2, setPw2] = useState("");
  const [name, setName] = useState(""); const [last, setLast] = useState(""); const [pseudo, setPseudo] = useState(""); const [dob, setDob] = useState<[string, string, string]>(["", "", ""]);
  const [country, setCountry] = useState(""); const [city, setCity] = useState(""); const [phone, setPhone] = useState(""); const [photo, setPhoto] = useState<string | undefined>();
  const [ok, setOk] = useState(false); const [kid, setKid] = useState(""); const [kid2, setKid2] = useState("");
  const [legal, setLegal] = useState(false); const [info, setInfo] = useState(""); const [prov, setProv] = useState<Prov | null>(null); const [busy, setBusy] = useState(false); const on = serverOn(); void PROVIDERS; void ProvBtn;
  const age = ageFrom(dob[0], dob[1], dob[2]); const minor = age !== null && age < 18;
  const dobMsg = () => age === null ? t("Indiquez votre date de naissance complète (jour, mois, année) : c'est obligatoire.") : age < 15 ? t("NOTIIF est réservé aux personnes de 15 ans ou plus. Vous pourrez nous rejoindre plus tard.") : "";
  const countries = (() => { try { const dn = new Intl.DisplayNames([document.documentElement.lang || "fr"], { type: "region" }); return COUNTRY_CODES.map((c) => ({ c, n: dn.of(c) || c })).sort((x, y) => x.n.localeCompare(y.n)); } catch { return COUNTRY_CODES.map((c) => ({ c, n: c })); } })();
  const same = pw2.length > 0 && pw === pw2;
  const mailOk = /^\S+@\S+\.\S+$/.test(email.trim());
  const okStep = (n: number) => n === 1 ? mailOk && pw.length >= 8 && same : n === 2 ? !!name.trim() && !!last.trim() && !dobMsg() : n === 3 ? !!country && !!city.trim() : ok && (!minor || (kid.length === 4 && kid === kid2));
  const why = (n: number) => n === 1 ? (!mailOk ? t("Écrivez une adresse e-mail valide.") : pw.length < 8 ? t("Le mot de passe doit avoir 8 caractères ou plus.") : t("Les deux mots de passe ne sont pas pareils.")) : n === 2 ? (!name.trim() || !last.trim() ? t("Écrivez votre prénom et votre nom de famille.") : dobMsg()) : n === 3 ? t("Choisissez votre pays et écrivez votre ville.") : !ok ? t("Cochez la case des conditions.") : t("Choisissez un code parental à 4 chiffres, écrit deux fois pareil.");
  const extra = () => ({ lastName: last.trim(), country, city: city.trim(), phone: phone.trim(), pseudo });
  const saveAll = async () => { actions.updateProfile({ birthday: String(dob[1]).padStart(2, "0") + "-" + String(dob[0]).padStart(2, "0"), byear: +dob[2], lastName: last.trim().slice(0, 40), country, city: city.trim().slice(0, 60), phone: phone.trim().slice(0, 25), ...(photo ? { avatar: photo } : {}) }); if (minor) await setKidCode(kid); };
  const legalBtn = <button type="button" style={{ background: "none", border: 0, padding: 0, color: "var(--brand2)", textDecoration: "underline" }} onClick={() => setLegal(true)}>{t("conditions d'utilisation et la politique de confidentialité")}</button>;
  const next = () => { if (!okStep(step)) { setInfo(why(step)); return; } setInfo(""); if (step < 4) setStep(step + 1); else void finish(); };
  const finish = async () => { setBusy(true);
    if (!on) { actions.start((name.trim() + " " + last.trim()).slice(0, 30), "", pseudo); await saveAll(); setBusy(false); return; }
    const r = await emailSignUp(email.trim(), pw, (name.trim() + " " + last.trim()).slice(0, 30), extra()); setBusy(false); setInfo(r.msg); if (r.who) { actions.start(r.who.name, "", pseudo); await saveAll(); } };
  const login = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); const r = await emailLogin(email.trim(), pw); setBusy(false); setInfo(r.msg); if (r.who) actions.start(r.who.name, "", ""); };
  const pickPhoto = async (f?: File) => { if (!f) return; try { setPhoto(await fileToDataUrl(f, 240, 0.8)); } catch { toast(t("Image illisible.")); } };
  const titles = ["", t("Ton compte"), t("Ton nom"), t("Où tu habites"), t("Presque fini")];
  return (<div className="card col center" style={{ alignItems: "center", gap: 12, padding: 26 }}>
    <Logo s={mode === "new" ? 84 : 110} /><h1 style={{ fontSize: "1.5rem", letterSpacing: "-.03em" }}>{mode === "new" ? t("Créer mon compte") : t("Me connecter")}</h1>
    {(window as any).__NOTIIF_DEV__ === true && <><button type="button" className="btn" style={{ width: "100%" }} onClick={() => { actions.start("Créateur", "", ""); actions.updateProfile({ birthday: "01-01", byear: 1990 }); }}>{"🛠 Entrer en mode test (sans compte)"}</button>
      <div className="muted small">{"— ou me connecter avec un vrai compte —"}</div></>}
    {mode === "old" ? (on ? <form className="col" style={{ width: "100%" }} onSubmit={login}>
        <Fld label={t("Adresse e-mail")}><input className="inp" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="E-mail" autoComplete="email" required /></Fld>
        <PwField label={t("Mot de passe")} value={pw} onChange={setPw} autoComplete="current-password" />
        <button className="btn" disabled={busy || pw.length < 8 || !email}>{t("Me connecter")}</button>
        <button type="button" className="btn ghost" onClick={() => { setMode("new"); setInfo(""); }}>{t("Je n'ai pas encore de compte")}</button></form>
      : <div className="col" style={{ width: "100%" }}><p className="muted small" style={{ margin: 0 }}>{t("Les vrais comptes demandent un serveur, qui n'est pas encore relié.")}</p><button type="button" className="btn ghost" onClick={() => { setMode("new"); setInfo(""); }}>{t("Je n'ai pas encore de compte")}</button></div>)
    : <form className="col" style={{ width: "100%" }} onSubmit={(e) => { e.preventDefault(); next(); }} noValidate>
      <div className="row" style={{ gap: 4 }} role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step}>{[1, 2, 3, 4].map((i) => <div key={i} className="grow" style={{ height: 4, borderRadius: 2, background: i <= step ? "var(--brand)" : "var(--bd)" }} />)}</div>
      <div style={{ textAlign: "left" }}><b style={{ fontSize: "1.1rem" }}>{titles[step]}</b><div className="muted small">{tn("Étape {n} sur 4", { n: step })}</div></div>
      {!on && step === 1 && <div className="card" style={{ textAlign: "left", fontSize: ".9rem" }}><b>{t("🧪 Mode démo")}</b><div className="muted small">{t("Les vrais comptes (e-mail, Google, Apple, Facebook, FranceConnect…) demandent un serveur, qui n'est pas encore relié. En attendant, vous pouvez essayer l'application sur cet appareil avec des amis fictifs.")}</div></div>}
      {step === 1 && <>
        <Fld label={t("Adresse e-mail")} hint={t("Pour retrouver ton compte")}><input className="inp" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="E-mail" autoComplete="email" /></Fld>
        <PwField label={t("Mot de passe")} value={pw} onChange={setPw} hint={t("8 caractères ou plus")} />
        <PwField label={t("Écris-le encore une fois")} value={pw2} onChange={setPw2} tone={pw2.length > 0} hint={pw2.length === 0 ? undefined : same ? t("✓ Les deux sont pareils") : t("✗ Ce n'est pas pareil, regarde bien")} />
        <div className="muted small" style={{ textAlign: "left" }}>{t("Ta langue : tu peux la changer quand tu veux, avec le bouton en haut.")}</div></>}
      {step === 2 && <>
        <Fld label={t("Prénom")} hint={t("Ton vrai prénom")}><input className="inp" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} autoComplete="given-name" /></Fld>
        <Fld label={t("Nom de famille")} hint={t("Ton vrai nom de famille")}><input className="inp" value={last} onChange={(e) => setLast(e.target.value)} maxLength={40} autoComplete="family-name" /></Fld>
        <Fld label={t("Pseudo (public)")} hint={t("Vu par ceux qui ne sont pas tes amis")}><input className="inp" value={pseudo} onChange={(e) => setPseudo(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, "").slice(0, 20))} /></Fld>
        <div className="col" style={{ gap: 3, textAlign: "left" }}><span className="muted small">{t("Date de naissance")}</span><DobFields d={dob[0]} m={dob[1]} y={dob[2]} onChange={(d, m, y) => setDob([d, m, y])} /><span className="muted small">{t("Pour fêter ton anniversaire")}</span></div></>}
      {step === 3 && <>
        <Fld label={t("Pays")}><select className="inp" value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="country"><option value="">{t("Choisir…")}</option>{countries.map((c) => <option key={c.c} value={c.c}>{c.n}</option>)}</select></Fld>
        <Fld label={t("Ville")}><input className="inp" value={city} onChange={(e) => setCity(e.target.value)} maxLength={60} autoComplete="address-level2" /></Fld>
        <Fld label={t("Numéro de téléphone (facultatif)")} hint={t("Pour que tes amis te retrouvent")}><input className="inp" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9+ ]/g, "").slice(0, 20))} autoComplete="tel" /></Fld>
        <div className="card small" style={{ textAlign: "left" }}>{t("Seuls tes amis voient ta ville. Ton téléphone et ton e-mail restent privés.")}</div></>}
      {step === 4 && <>
        <Fld label={t("Photo de profil (facultatif)")} hint={t("Tu peux le faire plus tard")}><span className="row" style={{ gap: 10 }}>{photo && <img src={photo} alt="" style={{ width: 44, height: 44, borderRadius: "30%", objectFit: "cover" }} />}<input type="file" accept="image/*" aria-label={t("Photo de profil")} onChange={(e) => { void pickPhoto(e.target.files?.[0]); e.target.value = ""; }} /></span></Fld>
        {minor && <div className="col" style={{ gap: 8, textAlign: "left" }}><div className="card small">{t("Moins de 18 ans ? Un parent choisit le code parental ici.")}</div>
          <Fld label={t("Code parental (4 chiffres)")}><input className="inp" inputMode="numeric" type="password" maxLength={4} value={kid} onChange={(e) => setKid(e.target.value.replace(/\D/g, ""))} autoComplete="off" /></Fld>
          <Fld label={t("Écris-le encore une fois")}><input className="inp" inputMode="numeric" type="password" maxLength={4} value={kid2} onChange={(e) => setKid2(e.target.value.replace(/\D/g, ""))} autoComplete="off" /></Fld></div>}
        <label className="row small muted" style={{ textAlign: "left", alignItems: "flex-start" }}><Switch on={ok} onChange={setOk} label={t("J'accepte les conditions")} /><span>{tn("J'ai 15 ans ou plus et j'accepte les {legalBtn}.", { legalBtn })}</span></label></>}
      {info && <div className="small" role="status" style={{ color: "var(--warm)", textAlign: "left" }}>{info}</div>}
      <div className="row" style={{ gap: 8 }}>{step > 1 && <button type="button" className="btn ghost grow" onClick={() => { setStep(step - 1); setInfo(""); }}>{t("Retour")}</button>}
        <button className="btn grow" disabled={busy || !okStep(step)}>{step < 4 ? t("Continuer") : on ? t("Créer mon compte") : t("Essayer en mode démo")}</button></div>
      <button type="button" className="btn ghost" onClick={() => { setMode("old"); setInfo(""); }}>{t("J'ai déjà un compte")}</button></form>}
    {mode === "old" && info && <div className="small" role="status" style={{ color: "var(--warm)", textAlign: "left" }}>{info}</div>}
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
