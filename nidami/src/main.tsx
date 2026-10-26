import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
createRoot(document.getElementById("root")!).render(<App />);
if ("serviceWorker" in navigator && location.protocol.startsWith("http") && !/localhost|127\.0\.0\.1/.test(location.hostname)) navigator.serviceWorker.register("./sw.js").catch(() => {});
