import { createRoot } from "react-dom/client";
import App from "./App";
import { Intro } from "./ui/Intro";
import "./styles.css";
import { initLang } from "./i18n";
import { devUnlocked, setPublicConfig } from "./lib/dev";
/** L'appli officielle lit les choix publiés (config.json) ; la version développeur lit les siens. */
const loadConfig = async () => { if (devUnlocked()) return; try { const c = new AbortController(); const id = setTimeout(() => c.abort(), 2500); const r = await fetch("./config.json", { cache: "no-store", signal: c.signal }); clearTimeout(id); if (r.ok) { const o = await r.json(); if (o && typeof o === "object") setPublicConfig(o); } } catch { /* pas de config : réglages d'origine */ } };
const DevTag = () => <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", zIndex: 9000, background: "#2A2150", color: "#fff", font: "700 11px system-ui,sans-serif", padding: "2px 12px", borderRadius: "0 0 10px 10px", pointerEvents: "none" }}>🛠 DEV</div>;
// La langue est chargée avant l'affichage : pas de flash de français pour les autres langues.
Promise.all([initLang().catch(() => {}), loadConfig()]).finally(() => createRoot(document.getElementById("root")!).render(<><App /><Intro />{devUnlocked() && <DevTag />}</>));
if ("serviceWorker" in navigator && location.protocol.startsWith("http") && !/localhost|127\.0\.0\.1/.test(location.hostname)) { const had = !!navigator.serviceWorker.controller; let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (had && !reloaded) { reloaded = true; try { sessionStorage.setItem("notiif-upd-reload", "1"); } catch { /* rien */ } location.reload(); } });
  navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" }).then((r) => { void r.update(); }).catch(() => {}); }

// Appui long sur une image, une photo ou une vidéo : pas de menu « télécharger / chercher avec Google ».
document.addEventListener("contextmenu", (e) => { const el = e.target as Element | null; if (el && el.closest && el.closest("img,canvas,video,svg,.protected,.avs,.wreath")) e.preventDefault(); }, true);
document.addEventListener("dragstart", (e) => { const el = e.target as Element | null; if (el && (el.tagName === "IMG" || el.tagName === "CANVAS")) e.preventDefault(); }, true);
