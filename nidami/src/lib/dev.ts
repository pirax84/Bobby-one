import { useEffect, useState } from "react";
import type { Fete } from "./fetes";
/** Mode développeur : caché, réservé au créateur. Rien de tout ça n'apparaît chez les clients. */
const get = (k: string) => { try { return localStorage.getItem(k) || ""; } catch { return ""; } };
const set = (k: string, v: string) => { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch { /* ignoré */ } window.dispatchEvent(new Event("notiif-dev")); };
export const devUnlocked = () => get("notiif-dev") === "1";
export const devClient = () => get("notiif-dev-client") === "1";
/** Mode développeur actif = débloqué et pas en train de « voir comme un client ». */
export const devActive = () => devUnlocked() && !devClient();
export const devFete = (): Fete | null => (devActive() ? ((get("notiif-dev-fete") as Fete) || null) : null);
export const setDevUnlocked = (v: boolean) => set("notiif-dev", v ? "1" : "");
export const setDevClient = (v: boolean) => set("notiif-dev-client", v ? "1" : "");
export const setDevFete = (f: Fete | "") => set("notiif-dev-fete", f);
/** Re-dessine le composant quand le mode développeur change. */
export function useDev() {
  const [, bump] = useState(0);
  useEffect(() => { const h = () => bump((n) => n + 1); window.addEventListener("notiif-dev", h); return () => window.removeEventListener("notiif-dev", h); }, []);
  return { unlocked: devUnlocked(), client: devClient(), active: devActive(), fete: devFete() };
}
