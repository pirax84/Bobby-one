import { FX, FX_ALL, playFx, stopFx } from "../lib/fx";
import { useDev, setDevClient, setDevFete, setDevUnlocked, setDevBday, setDevDate, APP_VERSION } from "../lib/dev";
import type { Fete } from "../lib/fetes";
import { toast, isPC } from "./common";
import { t } from "../i18n";

const FETES: [Fete | "", string][] = [["", "📅 Vraie date"], ["hal", "🎃 Halloween"], ["noel", "🎄 Noël"], ["val", "💕 Saint-Valentin"], ["pq", "🐣 Pâques"], ["ny", "🎆 Nouvel An"]];
const FETE_FX: Record<string, string> = { hal: "ghost", noel: "noel1", val: "hearts", pq: "easter", ny: "fireworks" };

/** Page « Mode développeur » : tout voir en avance, sans changer ce que voient les clients. */
export function DevPanel() {
  const d = useDev(); const fxOn = true;
  const info = [[t("Version"), APP_VERSION], [t("Appareil"), isPC() ? t("Ordinateur") : t("Téléphone")], [t("Fête simulée"), d.fete ? FETES.find((x) => x[0] === d.fete)?.[1] || d.fete : t("aucune (vraie date)")]];
  return <>
    <div className="card col" style={{ gap: 8 }}><h3>{t("👤 Voir comme un client")}</h3>
      <p className="muted small" style={{ margin: 0 }}>{t("Pour montrer l'application à quelqu'un : il ne verra ni ce mode, ni les fêtes simulées. Pour revenir ici, touchez 7 fois la version en bas de Paramètres.")}</p>
      <button className="btn" onClick={() => { setDevClient(true); toast(t("Version client activée.")); history.back(); }}>{t("Passer en version client")}</button></div>
    <div className="card col" style={{ gap: 8 }}><h3>{t("🎄 Simuler une fête")}</h3>
      <p className="muted small" style={{ margin: 0 }}>{t("Choisissez une fête : le logo, le message de vœux et l'effet quand on touche le logo changent tout de suite. Allez à l'accueil pour les voir.")}</p>
      <div className="row wrap" style={{ gap: 6 }}>{FETES.map(([k, l]) => <button key={k} type="button" className={"chip" + ((d.fete || "") === k ? " on" : "")} onClick={() => setDevFete(k)}>{t(l)}</button>)}</div>
      <label className="row" style={{ gap: 8 }}><span className="grow"><b>{t("🎂 C'est mon anniversaire")}</b><span className="muted small" style={{ display: "block" }}>{t("Le logo prend sa décoration d'anniversaire.")}</span></span><input type="checkbox" checked={d.bday} style={{ width: 22, height: 22 }} onChange={(e) => setDevBday(e.target.checked)} aria-label={t("🎂 C'est mon anniversaire")} /></label>
      <label className="col" style={{ gap: 4 }}><b>{t("📆 Choisir une date")}</b><input type="date" className="inp" value={d.date} onChange={(e) => { setDevDate(e.target.value); setDevFete(""); }} aria-label={t("📆 Choisir une date")} /><span className="muted small">{t("L'appli réagit comme ce jour-là (fête du jour). Ex. 25 décembre, 31 octobre, 14 février.")}</span></label>
      {d.fete && <button className="btn ghost" onClick={() => playFx(FETE_FX[d.fete as string] as never, fxOn)}>{t("▶ Voir l'effet de cette fête")}</button>}</div>
    <div className="card col" style={{ gap: 8 }}><h3>{t("✨ Tester les effets")}</h3>
      <p className="muted small" style={{ margin: 0 }}>{t("Touchez un effet pour le voir et l'entendre. Un nouvel effet arrête le précédent.")}</p>
      <div className="row wrap" style={{ gap: 6 }}>{FX_ALL.map((k) => <button key={k} type="button" className="chip" onClick={() => playFx(k, fxOn)}>{FX[k].label}</button>)}</div>
      <button className="btn ghost" onClick={() => stopFx()}>{t("⏹ Tout arrêter")}</button></div>
    <div className="card col" style={{ gap: 6 }}><h3>{t("ℹ️ Informations")}</h3>
      {info.map(([a, b]) => <div key={a} className="row"><span className="grow muted">{a}</span><b>{b}</b></div>)}</div>
    <div className="card col" style={{ gap: 8 }}><h3>{t("🔄 Remettre à zéro")}</h3>
      <button className="btn ghost" onClick={() => { try { localStorage.removeItem("notiif-intro-seen"); localStorage.removeItem("notiif-intro-day"); localStorage.removeItem("notiif-guide-seen"); } catch { /* ignoré */ } toast(t("Au prochain démarrage, l'introduction et le guide reviendront.")); }}>{t("Revoir l'introduction et le guide")}</button>
      <button className="btn ghost" onClick={async () => { const txt = ["NOTIIF " + APP_VERSION, isPC() ? "PC" : "Téléphone", navigator.userAgent, innerWidth + "x" + innerHeight, document.documentElement.dataset.theme || ""].join("\n"); try { await navigator.clipboard.writeText(txt); toast(t("Infos copiées : collez-les dans la conversation.")); } catch { toast(t("Copie impossible.")); } }}>{t("📋 Copier les infos pour le support")}</button>
      <button className="btn ghost" onClick={() => { setDevFete(""); setDevBday(false); setDevDate(""); toast(t("Date réelle rétablie.")); }}>{t("Revenir à la vraie date")}</button>
      <button className="btn ghost" onClick={() => { setDevFete(""); setDevUnlocked(false); toast(t("Mode développeur désactivé.")); history.back(); }}>{t("Désactiver le mode développeur")}</button></div>
  </>;
}
