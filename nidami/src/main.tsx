import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import { initLang } from "./i18n";
// La langue est chargée avant l'affichage : pas de flash de français pour les autres langues.
initLang().catch(() => {}).finally(() => createRoot(document.getElementById("root")!).render(<App />));
if ("serviceWorker" in navigator && location.protocol.startsWith("http") && !/localhost|127\.0\.0\.1/.test(location.hostname)) navigator.serviceWorker.register("./sw.js").catch(() => {});
