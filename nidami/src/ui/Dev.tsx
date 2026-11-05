import { FX, FX_ALL, playFx, stopFx, type Fx } from "../lib/fx";
import { useDev, setDevClient, setDevFete, setDevUnlocked, setDevBday, setDevDate, setDevNoFete, setDevPreview, setFeteFx, setFeteAuto, feteFx, feteAuto, devChoices, APP_VERSION } from "../lib/dev";
import { feteOf, type Fete } from "../lib/fetes";
import { toast, isPC } from "./common";
import { t } from "../i18n";

const FETES: [Fete, string][] = [["hal", "🎃 Halloween"], ["noel", "🎄 Noël"], ["val", "💕 Saint-Valentin"], ["pq", "🐣 Pâques"], ["ny", "🎆 Nouvel An"]];
const play = (f: string) => playFx(feteFx(f) as Fx, true);

/** Aperçu client à côté (PC) : l'appli telle que la voit un client, à la date simulée. */
export function ClientPreview() {
  const d = useDev(); if (!d.active || !d.preview || !isPC()) return null;
  const q = new URLSearchParams({ client: "1" }); if (d.fete && !d.noFete) q.set("fete", d.fete); if (d.date && !d.noFete) q.set("date", d.date); if (d.bday) q.set("bday", "1");
  const src = location.pathname + "?" + q.toString();
  return <div style={{ position: "fixed", right: 14, bottom: 14, width: 372, height: "min(760px, 84vh)", zIndex: 150, borderRadius: 30, border: "6px solid #2A2150", background: "#fff", boxShadow: "0 12px 40px rgba(0,0,0,.35)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
    <div className="row" style={{ background: "#2A2150", color: "#fff", padding: "2px 10px 6px", fontSize: 12, gap: 6 }}><b className="grow">{t("👁 Vue client")}</b><button type="button" onClick={() => setDevPreview(false)} aria-label={t("Fermer l'aperçu client")} style={{ background: "none", border: 0, color: "#fff", cursor: "pointer", fontSize: 16 }}>✕</button></div>
    <iframe key={src} src={src} title={t("Vue client")} style={{ border: 0, width: "100%", flex: 1 }} /></div>;
}

/** Page « Mode développeur » : tout voir en avance, sans changer ce que voient les clients. */
export function DevPanel() {
  const d = useDev(); const pc = isPC();
  const pickFete = (f: Fete | "") => { setDevNoFete(false); setDevDate(""); setDevFete(f); if (f) setTimeout(() => play(f), 400); };
  const pickDate = (v: string) => { setDevNoFete(false); setDevFete(""); setDevDate(v); const [y, m, j] = v.split("-").map(Number); const f = v ? feteOf(new Date(y, m - 1, j, 12)) : null; if (f) setTimeout(() => play(f), 400); else if (v) toast(t("Ce jour-là, il n'y a pas de fête dans l'application.")); };
  const cur = d.fete || (d.date ? (() => { const [y, m, j] = d.date.split("-").map(Number); return feteOf(new Date(y, m - 1, j, 12)); })() : null);
  const info = [[t("Version"), APP_VERSION], [t("Appareil"), pc ? t("Ordinateur") : t("Téléphone")], [t("Fête simulée"), d.noFete ? t("coupée") : cur ? FETES.find((x) => x[0] === cur)?.[1] || cur : t("aucune (vraie date)")]];
  return <>
    <div className="card col" style={{ gap: 8 }}><h3>{t("👁 Voir comme un client")}</h3>
      <p className="muted small" style={{ margin: 0 }}>{pc ? t("Un cadre à droite montre l'appli telle que la voit un client, avec la fête choisie. Vous changez un réglage ici, le cadre se met à jour tout seul.") : t("Pour montrer l'application à quelqu'un : il ne verra ni ce mode, ni les fêtes simulées. Pour revenir ici, touchez 7 fois la version en bas de Paramètres.")}</p>
      {pc && <button className="btn" onClick={() => setDevPreview(!d.preview)}>{d.preview ? t("Fermer le cadre client") : t("Ouvrir le cadre client à droite")}</button>}
      <button className={"btn" + (pc ? " ghost" : "")} onClick={() => { setDevClient(true); toast(t("Version client activée.")); history.back(); }}>{t("Passer en version client (tout l'écran)")}</button></div>
    <div className="card col" style={{ gap: 8 }}><h3>{t("🎄 Fêtes et dates")}</h3>
      <p className="muted small" style={{ margin: 0 }}>{t("Choisissez une fête ou une date : le logo, le message de vœux et l'effet changent tout de suite. L'effet de la fête se joue aussitôt.")}</p>
      <div className="row wrap" style={{ gap: 6 }}><button type="button" className={"chip" + (!d.fete && !d.date && !d.noFete ? " on" : "")} onClick={() => { setDevNoFete(false); setDevDate(""); setDevFete(""); }}>{t("📅 Vraie date")}</button>
        {FETES.map(([k, l]) => <button key={k} type="button" className={"chip" + (d.fete === k ? " on" : "")} onClick={() => pickFete(k)}>{t(l)}</button>)}</div>
      <label className="col" style={{ gap: 4 }}><b>{t("📆 Ou choisir une date")}</b><input type="date" className="inp" value={d.date} onChange={(e) => pickDate(e.target.value)} aria-label={t("📆 Ou choisir une date")} /></label>
      <label className="row" style={{ gap: 8 }}><span className="grow"><b>{t("🎂 C'est mon anniversaire")}</b><span className="muted small" style={{ display: "block" }}>{t("Le logo prend sa décoration d'anniversaire.")}</span></span><input type="checkbox" checked={d.bday} style={{ width: 22, height: 22 }} onChange={(e) => setDevBday(e.target.checked)} aria-label={t("🎂 C'est mon anniversaire")} /></label>
      <label className="row" style={{ gap: 8 }}><span className="grow"><b>{t("🚫 Couper les fêtes")}</b><span className="muted small" style={{ display: "block" }}>{t("Voir le logo normal, sans décoration ni message de vœux.")}</span></span><input type="checkbox" checked={d.noFete} style={{ width: 22, height: 22 }} onChange={(e) => setDevNoFete(e.target.checked)} aria-label={t("🚫 Couper les fêtes")} /></label></div>
    <div className="card col" style={{ gap: 10 }}><h3>{t("🎵 Effet et musique de chaque fête")}</h3>
      <p className="muted small" style={{ margin: 0 }}>{t("Pour chaque fête, choisissez l'effet (et sa musique) joué quand on touche le logo. « À l'ouverture » le joue aussi tout seul, une fois par jour, au démarrage de l'appli ce jour-là.")}</p>
      {FETES.map(([k, l]) => <div key={k} className="col" style={{ gap: 6, padding: "6px 0", borderTop: "1px solid var(--line, #ddd)" }}><b>{t(l)}</b>
        <select className="inp" value={feteFx(k)} onChange={(e) => { setFeteFx(k, e.target.value); const v = e.target.value; setTimeout(() => playFx(v as Fx, true), 50); }} aria-label={t("Effet pour {fete}", { fete: t(l) })}>{FX_ALL.map((x) => <option key={x} value={x}>{FX[x].label}</option>)}</select>
        <div className="row" style={{ gap: 8 }}><button type="button" className="chip" onClick={() => play(k)}>{t("▶ Tester")}</button><label className="row grow" style={{ gap: 8, justifyContent: "flex-end" }}><span className="small">{t("À l'ouverture")}</span><input type="checkbox" checked={feteAuto(k)} style={{ width: 22, height: 22 }} onChange={(e) => setFeteAuto(k, e.target.checked)} aria-label={t("À l'ouverture")} /></label></div></div>)}
      <button className="btn ghost" onClick={async () => { try { await navigator.clipboard.writeText(devChoices()); toast(t("Choix copiés : collez-les dans la conversation pour les rendre définitifs.")); } catch { toast(t("Copie impossible.")); } }}>{t("📋 Copier mes choix (pour les rendre définitifs)")}</button>
      <p className="muted small" style={{ margin: 0 }}>{t("Vos choix ne changent que votre appareil. Envoyez-les-moi pour qu'ils deviennent ceux de tous les clients.")}</p></div>
    <div className="card col" style={{ gap: 8 }}><h3>{t("✨ Tester les effets")}</h3>
      <p className="muted small" style={{ margin: 0 }}>{t("Touchez un effet pour le voir et l'entendre. Un nouvel effet arrête le précédent.")}</p>
      <div className="row wrap" style={{ gap: 6 }}>{FX_ALL.map((k) => <button key={k} type="button" className="chip" onClick={() => playFx(k, true)}>{FX[k].label}</button>)}</div>
      <button className="btn ghost" onClick={() => stopFx()}>{t("⏹ Tout arrêter")}</button></div>
    <div className="card col" style={{ gap: 8 }}><h3>{t("🛠 Outils")}</h3>
      <button className="btn ghost" onClick={() => window.dispatchEvent(new CustomEvent("notiif-intro-preview", { detail: { m: "full" } }))}>{t("▶ Voir l'introduction maintenant")}</button>
      <button className="btn ghost" onClick={() => window.dispatchEvent(new Event("notiif-guide"))}>{t("▶ Voir le guide maintenant")}</button>
      <button className="btn ghost" onClick={() => { try { Object.keys(localStorage).filter((k) => k.startsWith("notiif-auto-") || k.startsWith("notiif-fete-")).forEach((k) => localStorage.removeItem(k)); } catch { /* ignoré */ } window.dispatchEvent(new Event("notiif-dev")); toast(t("Messages de fête et effets du jour remis à zéro.")); }}>{t("Remontrer les messages de fête fermés")}</button>
      <button className="btn ghost" onClick={async () => { const txt = ["NOTIIF " + APP_VERSION, pc ? "PC" : "Téléphone", navigator.userAgent, innerWidth + "x" + innerHeight, document.documentElement.dataset.theme || ""].join("\n"); try { await navigator.clipboard.writeText(txt); toast(t("Infos copiées : collez-les dans la conversation.")); } catch { toast(t("Copie impossible.")); } }}>{t("📋 Copier les infos pour le support")}</button></div>
    <div className="card col" style={{ gap: 6 }}><h3>{t("ℹ️ Informations")}</h3>
      {info.map(([a, b]) => <div key={a} className="row"><span className="grow muted">{a}</span><b>{b}</b></div>)}</div>
    <div className="card col" style={{ gap: 8 }}><h3>{t("🔄 Remettre à zéro")}</h3>
      <button className="btn ghost" onClick={() => { setDevFete(""); setDevBday(false); setDevDate(""); setDevNoFete(false); toast(t("Date réelle rétablie.")); }}>{t("Revenir à la vraie date")}</button>
      <button className="btn ghost" onClick={() => { setDevFete(""); setDevPreview(false); setDevUnlocked(false); toast(t("Mode développeur désactivé.")); history.back(); }}>{t("Désactiver le mode développeur")}</button></div>
  </>;
}
