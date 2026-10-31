import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import { initLang } from "./i18n";
// La langue est chargée avant l'affichage : pas de flash de français pour les autres langues.
initLang().catch(() => {}).finally(() => createRoot(document.getElementById("root")!).render(<App />));
if ("serviceWorker" in navigator && location.protocol.startsWith("http") && !/localhost|127\.0\.0\.1/.test(location.hostname)) { const had = !!navigator.serviceWorker.controller; let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (had && !reloaded) { reloaded = true; location.reload(); } });
  navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" }).then((r) => { void r.update(); }).catch(() => {}); }

// Appui long sur une image, une photo ou une vidéo : pas de menu « télécharger / chercher avec Google ».
document.addEventListener("contextmenu", (e) => { const el = e.target as Element | null; if (el && el.closest && el.closest("img,canvas,video,svg,.protected,.avs,.wreath")) e.preventDefault(); }, true);
document.addEventListener("dragstart", (e) => { const el = e.target as Element | null; if (el && (el.tagName === "IMG" || el.tagName === "CANVAS")) e.preventDefault(); }, true);
