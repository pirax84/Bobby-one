import { useEffect, useState } from "react";
/** Disponibilité de l'utilisateur (sur cet appareil). La réponse automatique sera envoyée aux autres quand le serveur NOTIIF existera. */
export type Presence = "here" | "busy" | "away" | "later";
export const PRESENCES: [Presence, string, string][] = [["here", "🟢", "Présent"], ["busy", "🔴", "Occupé"], ["away", "⚪", "Pas là"], ["later", "🟡", "Je reviens plus tard"]];
const get = (k: string) => { try { return localStorage.getItem(k) || ""; } catch { return ""; } };
const put = (k: string, v: string) => { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch { /* ignoré */ } window.dispatchEvent(new Event("notiif-presence")); };
/** Au bout de 2 heures, la disponibilité revient toute seule sur « Présent ». */
const PRES_MAX = 2 * 3600 * 1000;
export const presenceNow = (): Presence => { const v = get("notiif-presence"); if (!["here", "busy", "away", "later"].includes(v)) return "here"; const at = +get("notiif-presence-at") || 0; if (at && Date.now() - at > PRES_MAX) { try { localStorage.removeItem("notiif-presence"); localStorage.removeItem("notiif-presence-at"); } catch { /* ignoré */ } return "here"; } return v as Presence; };
export type AutoMode = "off" | "away" | "always";
export const autoMode = (): AutoMode => { const v = get("notiif-autoreply"); return v === "always" ? "always" : v === "1" || v === "away" ? "away" : "off"; };
export const autoReplyOn = () => autoMode() !== "off";
export const setAutoMode = (m: AutoMode) => put("notiif-autoreply", m === "off" ? "" : m);
/** Faut-il répondre tout de suite à un effet reçu ? (« Tout le temps » ou « Quand je ne suis pas là ») */
export const shouldAutoReply = () => { const m = autoMode(); return m === "always" || (m === "away" && presenceNow() !== "here"); };
/** Mon propre message d'absence (5 s maximum), gardé sur cet appareil. */
export const absentMsg = () => get("notiif-absent-msg");
export const setAbsentMsg = (d: string) => put("notiif-absent-msg", d);
export const setPresence = (p: Presence) => { try { if (p === "here") localStorage.removeItem("notiif-presence-at"); else localStorage.setItem("notiif-presence-at", String(Date.now())); } catch { /* ignoré */ } put("notiif-presence", p === "here" ? "" : p); };
export const setAutoReply = (v: boolean) => put("notiif-autoreply", v ? "1" : "");
export function usePresence() {
  const [, bump] = useState(0);
  useEffect(() => { const h = () => bump((n) => n + 1); window.addEventListener("notiif-presence", h); return () => window.removeEventListener("notiif-presence", h); }, []);
  return { presence: presenceNow(), auto: autoReplyOn(), mode: autoMode(), msg: absentMsg() };
}
