import { useEffect, useState } from "react";
import { actions } from "../lib/store";
import { PROVIDERS, serverOn, oauthUrl, emailSignUp, emailLogin, type Prov } from "../lib/auth";
import { Logo, Modal, toast } from "./common";
import { LegalView } from "./Legal";

// L'événement d'installation arrive tôt : on l'écoute dès le chargement du fichier.
let deferred: any = null; const subs = new Set<() => void>();
if (typeof window !== "undefined") { window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; subs.forEach((f) => f()); }); window.addEventListener("appinstalled", () => { deferred = null; subs.forEach((f) => f()); }); }
const standalone = () => typeof window !== "undefined" && (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true);
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

function InstallStep({ onSkip }: { onSkip: () => void }) {
  const [, force] = useState(0); useEffect(() => { const f = () => force((n) => n + 1); subs.add(f); return () => { subs.delete(f); }; }, []);
  const ios = isIOS();
  return (<div className="card col center" style={{ alignItems: "center", gap: 16, padding: 28 }}>
    <Logo s={112} /><h1 style={{ fontSize: "1.9rem", letterSpacing: "-.03em" }}>Votre cercle.<br />Vos moments.</h1>
    <p className="muted" style={{ margin: 0 }}>Installez l'application sur cet appareil : une vraie icône, sans barre de navigateur.</p>
    {deferred && <button className="btn" style={{ width: "100%" }} onClick={async () => { deferred.prompt(); try { await deferred.userChoice; } catch { /* ignoré */ } deferred = null; subs.forEach((f) => f()); }}>Installer l'application</button>}
    {ios && !deferred && <div className="card col" style={{ textAlign: "left", width: "100%", gap: 8 }}><b>Sur iPhone et iPad (2 gestes) :</b><div>1. Touchez le bouton <b>Partager</b> ⬆️ en bas de Safari.</div><div>2. Choisissez <b>« Sur l'écran d'accueil »</b>, puis <b>Ajouter</b>.</div><div className="muted small">Apple n'autorise pas l'installation en un seul bouton.</div></div>}
    {!ios && !deferred && <div className="muted small">Si le bouton n'apparaît pas : ouvrez le menu du navigateur (⋮) puis « Installer l'application » ou « Ajouter à l'écran d'accueil ».</div>}
    <button className="btn ghost" style={{ width: "100%" }} onClick={onSkip}>Continuer dans le navigateur</button>
  </div>);
}

function ProvBtn({ p, onSoon }: { p: Prov; onSoon: (p: Prov) => void }) {
  return <button type="button" className="prov" onClick={() => { if (!serverOn()) { onSoon({ ...p, soon: "Cette connexion s'active quand le serveur sera relié (voir le guide)." }); return; } if (p.soon || !p.sb) { onSoon(p); return; } location.href = oauthUrl(p.sb); }}><span className="pb">{p.badge}</span><span className="grow">{p.label}</span></button>;
}

function SignUp() {
  const [mode, setMode] = useState<"new" | "old">("new"); const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [ok, setOk] = useState(false);
  const [legal, setLegal] = useState(false); const [info, setInfo] = useState(""); const [busy, setBusy] = useState(false); const on = serverOn();
  const legalBtn = <button type="button" style={{ background: "none", border: 0, padding: 0, color: "var(--brand2)", textDecoration: "underline" }} onClick={() => setLegal(true)}>conditions d'utilisation et la politique de confidentialité</button>;
  const submit = async (e: React.FormEvent) => { e.preventDefault(); if (!ok) return; setBusy(true);
    const r = mode === "new" ? await emailSignUp(email.trim(), pw, name.trim() || email.split("@")[0]) : await emailLogin(email.trim(), pw); setBusy(false); setInfo(r.msg); if (r.who) actions.start(r.who.name); };
  return (<div className="card col center" style={{ alignItems: "center", gap: 14, padding: 26 }}>
    <Logo s={84} /><h1 style={{ fontSize: "1.6rem", letterSpacing: "-.03em" }}>{mode === "new" ? "Créer mon compte" : "Me connecter"}</h1>
    <div className="col" style={{ width: "100%", gap: 8 }}>{PROVIDERS.map((p) => <ProvBtn key={p.id} p={p} onSoon={(q) => setInfo(q.soon || "")} />)}</div>
    <div className="muted small">— ou —</div>
    {on ? <form className="col" style={{ width: "100%" }} onSubmit={submit}>
      {mode === "new" && <input className="inp" placeholder="Votre prénom ou pseudo" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} aria-label="Prénom" />}
      <input className="inp" type="email" placeholder="Votre e-mail" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="E-mail" required />
      <input className="inp" type="password" placeholder="Mot de passe (8 caractères minimum)" value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} aria-label="Mot de passe" required />
      <label className="row small muted" style={{ textAlign: "left", alignItems: "flex-start" }}><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} style={{ width: 22, height: 22, marginTop: 2 }} /><span>J'ai 15 ans ou plus et j'accepte les {legalBtn}.</span></label>
      <button className="btn" disabled={!ok || busy || pw.length < 8 || !email}>{mode === "new" ? "Créer mon compte" : "Me connecter"}</button>
      <button type="button" className="btn ghost" onClick={() => { setMode(mode === "new" ? "old" : "new"); setInfo(""); }}>{mode === "new" ? "J'ai déjà un compte" : "Je n'ai pas encore de compte"}</button></form>
    : <form className="col" style={{ width: "100%" }} onSubmit={(e) => { e.preventDefault(); if (name.trim() && ok) actions.start(name); }}>
      <div className="card" style={{ textAlign: "left", fontSize: ".9rem" }}><b>🧪 Mode démo</b><div className="muted small">Les vrais comptes (e-mail, Google, Apple, Facebook, FranceConnect…) demandent un serveur, qui n'est pas encore relié. En attendant, vous pouvez essayer l'application sur cet appareil avec des amis fictifs.</div></div>
      <input className="inp" placeholder="Votre prénom ou pseudo (démo)" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} aria-label="Prénom" />
      <label className="row small muted" style={{ textAlign: "left", alignItems: "flex-start" }}><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} style={{ width: 22, height: 22, marginTop: 2 }} /><span>J'ai 15 ans ou plus et j'accepte les {legalBtn}.</span></label>
      <button className="btn" disabled={!name.trim() || !ok}>Essayer en mode démo</button></form>}
    {info && <div className="small" role="status" style={{ color: "var(--warm)", textAlign: "left" }}>{info}</div>}
    {legal && <Modal title="Documents juridiques" onClose={() => setLegal(false)}><div style={{ textAlign: "left" }}><LegalView /></div></Modal>}
  </div>);
}

export function Onboarding() {
  const [skip, setSkip] = useState(() => { try { return sessionStorage.getItem("skip-install") === "1"; } catch { return false; } });
  const [, force] = useState(0); useEffect(() => { const f = () => force((n) => n + 1); subs.add(f); return () => { subs.delete(f); }; }, []);
  const canInstall = !standalone() && !skip && (!!deferred || isIOS());
  return <div className="hero">{canInstall ? <InstallStep onSkip={() => { try { sessionStorage.setItem("skip-install", "1"); } catch { /* ignoré */ } setSkip(true); toast("Vous pourrez installer plus tard : menu du navigateur."); }} /> : <SignUp />}</div>;
}
