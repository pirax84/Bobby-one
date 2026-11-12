import { useEffect, useState } from "react";
/** Petits réglages d'affichage gardés sur l'appareil (bouton du milieu, micro…). */
export const getPref = (k: string, d: string): string => { try { return localStorage.getItem("notiif-" + k) || d; } catch { return d; } };
export const setPref = (k: string, v: string) => { try { localStorage.setItem("notiif-" + k, v); } catch { /* ignoré */ } window.dispatchEvent(new Event("notiif-pref")); };
export function usePref(k: string, d: string): string {
  const [v, set] = useState(getPref(k, d));
  useEffect(() => { const h = () => set(getPref(k, d)); window.addEventListener("notiif-pref", h); return () => window.removeEventListener("notiif-pref", h); }, [k, d]);
  return v;
}
