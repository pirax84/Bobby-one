import { CALL_TONES, playOne, stopSounds, playCallRing, playNotifSound, FX, FX_ALL, TONES, TONE_IDS, VIB_LEVELS, SHAKE_SNDS, playFx, stopFx, playTone, vibrate, notifSound, popNotes, type Fx } from "../lib/fx";
import { BrandWm, navItems } from "../App";
import { ACCENTS } from "../lib/theme";
import { useStore } from "../lib/store";
import { useRef } from "react";
import { FxSwitch } from "./FxSwitch";
import { PresenceBar } from "./Chat";
import { ServerCard } from "./ServerCard";
import { useDev, setDevClient, setDevFete, setDevBday, setDevDate, setDevNoFete, setDevPreview, setFeteFx, setFeteAuto, feteFx, feteAuto, devChoices, APP_VERSION, devIsOff, devToggleHidden, customSounds, addCustomSound, removeCustomSound, sndMapOf, setSndMap, devResetAll, exportConfig, importConfig } from "../lib/dev";
import { feteOf, type Fete } from "../lib/fetes";
import { toast, isPC } from "./common";
import { t } from "../i18n";
import { DEV_COLORS, DEV_FONTS, DEV_BGS, getDevLook, setDevLook, resetDevLook } from "../lib/devlook";
import { usePref } from "../lib/uipref";

const FETES: [Fete, string][] = [["hal", "🎃 Halloween"], ["noel", "🎄 Noël"], ["val", "💕 Saint-Valentin"]];
const play = (f: string) => playFx(feteFx(f) as Fx, true);


const Sw = ({ on, set, label }: { on: boolean; set: (v: boolean) => void; label: string }) => <input type="checkbox" checked={on} style={{ width: 22, height: 22 }} onChange={(e) => set(e.target.checked)} aria-label={label} />;
const playUrl = (u: string) => playOne(u, () => toast(t("Ce son ne peut pas être joué.")));

/** Sections de l'appli : cacher ou remettre. */
function DevNav() {
  useDev(); const list = navItems(true).filter(([k]) => k !== "home" && k !== "settings");
  return <div className="card col" style={{ gap: 6 }}><h3>{t("🧩 Sections de l'application")}</h3>
    <p className="muted small" style={{ margin: 0 }}>{t("Décochez une section pour la faire disparaître tout de suite (menu, barre du bas, « Plus »). Recochez-la pour la remettre. Seul votre appareil change.")}</p>
    {list.map(([k, l]) => <label key={k} className="row" style={{ gap: 8, padding: "4px 0" }}><span className="grow">{l}</span><Sw on={!devIsOff("nav", k)} set={() => devToggleHidden("nav", k)} label={l} /></label>)}</div>;
}

/** Galerie : tous les logos et images de l'appli, tels qu'ils s'affichent. */
function DevLogos() {
  const acc = useStore((x) => x.settings[x.me]?.accent) || ACCENTS[0].id; const light = document.documentElement.dataset.theme === "light";
  const L: [Fete | "none", string][] = [["none", "Logo normal"], ["hal", "🎃 Halloween"], ["noel", "🎄 Noël"], ["val", "💕 Saint-Valentin"]];
  return <div className="card col" style={{ gap: 10 }}><h3>{t("🖼 Logos et images")}</h3>
    <p className="muted small" style={{ margin: 0 }}>{t("Touchez un logo pour voir son effet. Le bouton « En haut » le met sur l'appli tout de suite.")}</p>
    {L.map(([f, l]) => <div key={f} className="col" style={{ gap: 6, alignItems: "center", padding: "6px 0", borderTop: "1px solid var(--line, #ddd)" }}><b>{t(l)}</b><BrandWm id={acc} light={light} sound big force={f} />
      <button type="button" className="chip" onClick={() => { setDevNoFete(f === "none"); setDevDate(""); setDevFete(f === "none" ? "" : f); }}>{t("⬆ En haut")}</button></div>)}
    <div className="col" style={{ gap: 6, alignItems: "center", padding: "6px 0", borderTop: "1px solid var(--line, #ddd)" }}><b>{t("🎂 Anniversaire")}</b><BrandWm id={acc} light={light} sound big bdText={t("Joyeux anniversaire")} /></div>
    <b>{t("Couleurs du logo")}</b>
    <div className="col" style={{ gap: 8, alignItems: "center" }}>{ACCENTS.map((a) => <BrandWm key={a.id} id={a.id} light={light} sound={false} force="none" />)}</div>
    <b>{t("Icônes de l'application")}</b>
    <div className="row wrap" style={{ gap: 10 }}>{["icon-192.png", "icon-512.png", "icon-maskable.png", "logo-192.png", "badge-96.png", "favicon-48.png"].map((n) => <img key={n} src={"./" + n} alt={n} width={72} height={72} style={{ borderRadius: 14, background: "#8884" }} />)}</div></div>;
}

/** Apparence : 100 couleurs, 50 polices, 12 fonds (choix du mode développeur, sur cet appareil). */
function DevLook() {
  usePref("x", ""); const d = getDevLook();
  return <div className="card col" style={{ gap: 8 }}><h3>{t("🎨 Apparence (développeur)")}</h3>
    <p className="muted small" style={{ margin: 0 }}>{t("Ces choix s'ajoutent aux couleurs de l'application. « Normal » remet l'origine.")}</p>
    <b>{t("Couleur")} · 100</b>
    <div className="row wrap" style={{ gap: 6 }}>{DEV_COLORS.map((c) => <button key={c.id} type="button" aria-label={c.hex} aria-pressed={d.color === c.id} onClick={() => setDevLook({ color: c.id })} style={{ width: 28, height: 28, borderRadius: 9, border: d.color === c.id ? "3px solid var(--fg)" : "1px solid var(--bd)", background: c.hex, padding: 0 }}>{d.color === c.id ? "✓" : ""}</button>)}</div>
    <b>{t("Police")} · 50</b>
    <div className="row wrap" style={{ gap: 6 }}>{DEV_FONTS.map(([n, f]) => <button key={n} type="button" className={"chip" + ((d.font || "Normale") === n ? " on" : "")} style={{ fontFamily: f.split(";")[0] || undefined }} onClick={() => setDevLook({ font: n })}>{n}</button>)}</div>
    <b>{t("Fond")} · 12</b>
    <div className="row wrap" style={{ gap: 6 }}>{DEV_BGS.map(([n, a]) => <button key={n} type="button" className={"chip" + ((d.bg || "Normal") === n ? " on" : "")} onClick={() => setDevLook({ bg: n })}><span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 5, marginRight: 6, verticalAlign: "middle", background: a || "var(--bg)", border: "1px solid var(--bd)" }} />{n}</button>)}</div>
    <button type="button" className="chip" onClick={() => { resetDevLook(); toast(t("Apparence remise à zéro.")); }}>{t("↺ Tout remettre normal")}</button>
  </div>;
}

/** Effets : montrer / cacher, couper le son, remplacer le son. */
function DevEffects() {
  useDev(); const cs = customSounds();
  return <div className="card col" style={{ gap: 6 }}><h3>{t("✨ Effets (voir, cacher, son)")}</h3>
    <p className="muted small" style={{ margin: 0 }}>{t("▶ pour tester. « Visible » : l'effet apparaît dans les listes d'effets. « Son » : coupé ou joué. Vous pouvez aussi remplacer son son par un des vôtres.")}</p>
    {FX_ALL.map((k) => <div key={k} className="col" style={{ gap: 4, padding: "6px 0", borderTop: "1px solid var(--line, #ddd)" }}>
      <div className="row" style={{ gap: 8 }}><span className="grow">{FX[k].label}</span><FxSwitch k={k} sound /></div>
      <div className="row wrap" style={{ gap: 12 }}><label className="row" style={{ gap: 6 }}><span className="small">{t("Visible")}</span><Sw on={!devIsOff("fx", k)} set={() => devToggleHidden("fx", k)} label={t("Visible")} /></label>
        <label className="row" style={{ gap: 6 }}><span className="small">{t("Son")}</span><Sw on={!devIsOff("mute", k)} set={() => devToggleHidden("mute", k)} label={t("Son")} /></label>
        {cs.length > 0 && <select className="inp" style={{ maxWidth: 180 }} value={sndMapOf(k)} onChange={(e) => setSndMap(k, e.target.value)} aria-label={t("Son de remplacement")}><option value="">{t("Son d'origine")}</option>{cs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}</div></div>)}</div>;
}

/** Sons : ceux de l'appli, et les vôtres (ajouter, écouter, supprimer). */
function DevSounds() {
  useDev(); const pick = useRef<HTMLInputElement>(null); const cs = customSounds();
  const files = Array.from(new Set([...FX_ALL.map((k) => FX[k].file).filter(Boolean) as string[], ...SHAKE_SNDS.map((x) => x[2])]));
  const add = (fl?: File) => { if (!fl) return; if (fl.size > 1_500_000) { toast(t("Fichier trop gros (1,5 Mo maximum).")); return; } const r = new FileReader(); r.onload = () => { const ok = addCustomSound(fl.name.replace(/\.[^.]+$/, ""), String(r.result)); toast(ok ? t("Son ajouté.") : t("Plus de place pour ce son.")); }; r.readAsDataURL(fl); };
  return <div className="card col" style={{ gap: 8 }}><h3>{t("🔊 Mes sons")}</h3>
    <p className="muted small" style={{ margin: 0 }}>{t("Ajoutez vos propres sons (1,5 Mo maximum chacun), écoutez-les, supprimez-les. Ensuite, choisissez-les dans « Effets ».")}</p>
    <input ref={pick} type="file" accept="audio/*" hidden onChange={(e) => { add(e.target.files?.[0]); e.target.value = ""; }} />
    <button className="btn" onClick={() => pick.current?.click()}>{t("➕ Ajouter un son")}</button>
    <button type="button" className="btn ghost" onClick={() => stopSounds()}>⏹ Arrêter le son</button>
    {cs.map((c) => <div key={c.id} className="row" style={{ gap: 8 }}><span className="grow ell">{c.name}</span><button type="button" className="chip" onClick={() => playUrl(c.data)} aria-label={t("▶ Tester")}>▶</button><button type="button" className="chip" onClick={() => removeCustomSound(c.id)} aria-label={t("Supprimer {name}", { name: c.name })}>🗑</button></div>)}
    <b className="small">{t("Sons de l'application")}</b>
    {files.map((u) => <div key={u} className="row" style={{ gap: 8 }}><span className="grow ell small">{u.replace("./sounds/", "")}</span><button type="button" className="chip" onClick={() => playUrl(u)} aria-label={t("▶ Tester")}>▶</button></div>)}</div>;
}

/** Notifications et sonneries. */
function DevNotifs() {
  useDev();
  const T = (id: string, l: string, fn: () => void) => <div key={id} className="row" style={{ gap: 8 }}><span className="grow">{l}</span><button type="button" className="chip" onClick={fn} aria-label={t("▶ Tester")}>▶</button></div>;
  return <><div className="card col" style={{ gap: 6 }}><h3>{t("🟢 Ma disponibilité")}</h3><PresenceBar /></div><div className="card col" style={{ gap: 6 }}><h3>{t("🔔 Notifications et sonneries")}</h3>
    <p className="muted small" style={{ margin: 0 }}>{t("Écoutez chaque son de notification. « Son » coupé = il ne sonne plus sur cet appareil.")}</p>
    {T("n1", t("Message envoyé (début)"), () => popNotes(6, 0.3))}{T("n2", t("Message parti (fin)"), () => popNotes(3, 0.3))}
    {T("n3", t("Message vocal"), () => notifSound.vocal())}{T("n4", t("Story"), () => notifSound.story())}{T("n5", t("Réaction"), () => notifSound.reaction())}{T("n6", t("Appel"), () => notifSound.appel())}
    <b className="small">Sonnerie d'appel</b>
    <div className="row" style={{ gap: 8 }}><select className="inp grow" aria-label="Sonnerie d'appel" value={sndMapOf("appel") || CALL_TONES[0][0]} onChange={(e) => { setSndMap("appel", e.target.value); }}>{CALL_TONES.map(([id, l]) => <option key={id} value={id}>{l}</option>)}{customSounds().map((c) => <option key={c.id} value={c.id}>{c.name} (le mien)</option>)}</select><button type="button" className="chip" onClick={() => playCallRing()} aria-label="Écouter">▶</button></div>
    <b className="small">Son des notifications</b>
    <div className="row" style={{ gap: 8 }}><select className="inp grow" aria-label="Son des notifications" value={sndMapOf("notif")} onChange={(e) => { setSndMap("notif", e.target.value); }}><option value="">Pop NOTIIF (d'origine)</option>{customSounds().map((c) => <option key={c.id} value={c.id}>{c.name} (le mien)</option>)}</select><button type="button" className="chip" onClick={() => playNotifSound()} aria-label="Écouter">▶</button></div>
    <button type="button" className="btn ghost" onClick={() => { stopSounds(); stopFx(); }}>⏹ Arrêter les sons</button>
    <p className="muted small" style={{ margin: 0 }}>Pour ajouter ou supprimer tes propres sons, utilise la carte « 🔊 Mes sons » plus bas.</p>
    <b className="small">{t("Vibrations")}</b>
    <div className="row wrap" style={{ gap: 6 }}>{VIB_LEVELS.map((v) => <button key={v.id} type="button" className="chip" onClick={() => vibrate(v.id)}>{v.label}</button>)}</div>
    <b className="small">{t("Messages à l'écran")}</b>
    <button className="btn ghost" onClick={() => toast(t("🔔 Ceci est une notification de test."))}>{t("Afficher une notification de test")}</button></div></>;
}

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
      <p className="muted small" style={{ margin: 0 }}>{t("Pour chaque fête, choisissez l'effet (et sa musique) joué quand on touche le logo.")}</p>
      {FETES.map(([k, l]) => <div key={k} className="col" style={{ gap: 6, padding: "6px 0", borderTop: "1px solid var(--line, #ddd)" }}><b>{t(l)}</b>
        <select className="inp" value={feteFx(k)} onChange={(e) => { setFeteFx(k, e.target.value); const v = e.target.value; setTimeout(() => playFx(v as Fx, true), 50); }} aria-label={t("Effet pour {fete}", { fete: t(l) })}>{FX_ALL.map((x) => <option key={x} value={x}>{FX[x].label}</option>)}</select>
        <div className="row" style={{ gap: 8 }}><button type="button" className="chip" onClick={() => play(k)}>{t("▶ Tester")}</button></div></div>)}
      <button className="btn ghost" onClick={async () => { try { await navigator.clipboard.writeText(devChoices()); toast(t("Choix copiés : collez-les dans la conversation pour les rendre définitifs.")); } catch { toast(t("Copie impossible.")); } }}>{t("📋 Copier mes choix (pour les rendre définitifs)")}</button>
      <p className="muted small" style={{ margin: 0 }}>{t("Vos choix ne changent que votre appareil. Envoyez-les-moi pour qu'ils deviennent ceux de tous les clients.")}</p></div>
    <DevNav /><DevLook /><DevLogos /><DevEffects /><DevSounds /><DevNotifs />
    <div className="card col" style={{ gap: 8 }}><h3>{t("✨ Tester les effets")}</h3>
      <p className="muted small" style={{ margin: 0 }}>{t("Touchez un effet pour le voir et l'entendre. Un nouvel effet arrête le précédent.")}</p>
      <div className="row wrap" style={{ gap: 6 }}>{FX_ALL.map((k) => <button key={k} type="button" className="chip" onClick={() => playFx(k, true)}>{FX[k].label}</button>)}</div>
      <button className="btn ghost" onClick={() => stopFx()}>{t("⏹ Tout arrêter")}</button></div>
    <div className="card col" style={{ gap: 8 }}><h3>{t("🛠 Outils")}</h3>
      <button className="btn ghost" onClick={() => window.dispatchEvent(new Event("notiif-guide"))}>{t("▶ Voir le guide maintenant")}</button>
      <button className="btn ghost" onClick={() => { try { Object.keys(localStorage).filter((k) => /^(dev:)?notiif-(auto|fete)-/.test(k)).forEach((k) => localStorage.removeItem(k)); } catch { /* ignoré */ } window.dispatchEvent(new Event("notiif-dev")); toast(t("Messages de fête et effets du jour remis à zéro.")); }}>{t("Remontrer les messages de fête fermés")}</button>
      <button className="btn ghost" onClick={async () => { const txt = ["NOTIIF " + APP_VERSION, pc ? "PC" : "Téléphone", navigator.userAgent, innerWidth + "x" + innerHeight, document.documentElement.dataset.theme || ""].join("\n"); try { await navigator.clipboard.writeText(txt); toast(t("Infos copiées : collez-les dans la conversation.")); } catch { toast(t("Copie impossible.")); } }}>{t("📋 Copier les infos pour le support")}</button></div>
    <div className="card col" style={{ gap: 6 }}><h3>{t("ℹ️ Informations")}</h3>
      {info.map(([a, b]) => <div key={a} className="row"><span className="grow muted">{a}</span><b>{b}</b></div>)}</div>
    <ServerCard />
    <div className="card col" style={{ gap: 8 }}><h3>{t("📤 Publier mes choix pour tout le monde")}</h3>
      <p className="muted small" style={{ margin: 0 }}>{t("Tes choix (effets cachés, sons coupés ou remplacés, sections cachées, effet des fêtes) restent sur cet appareil. Pour que l'appli officielle, y compris sur Android, les utilise : enregistre le fichier et envoie-le moi.")}</p>
      <button className="btn" onClick={() => { const b = new Blob([exportConfig()], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "config.json"; a.click(); toast(t("Fichier config.json enregistré.")); }}>{t("📤 Enregistrer config.json")}</button>
      <label className="btn ghost" style={{ textAlign: "center" }}>{t("📥 Reprendre un config.json")}<input type="file" accept="application/json,.json" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; f.text().then((tx) => toast(importConfig(tx) ? t("Choix repris.") : t("Fichier non valable."))).catch(() => toast(t("Fichier non valable."))); }} /></label></div>
    <div className="card col" style={{ gap: 8 }}><h3>{t("🔄 Remettre à zéro")}</h3>
      <button className="btn ghost" onClick={() => { setDevFete(""); setDevBday(false); setDevDate(""); setDevNoFete(false); toast(t("Date réelle rétablie.")); }}>{t("Revenir à la vraie date")}</button>
      <button className="btn ghost" onClick={() => { devResetAll(); toast(t("Tout est remis comme au départ (sections, effets, sons).")); }}>{t("Tout remettre comme au départ")}</button>
      <button className="btn ghost" onClick={() => { location.href = "./"; }}>{t("↩ Ouvrir l'appli officielle")}</button></div>
  </>;
}
