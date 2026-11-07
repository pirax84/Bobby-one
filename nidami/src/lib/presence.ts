import { useEffect, useState } from "react";
/** Disponibilité de l'utilisateur (sur cet appareil). La réponse automatique sera envoyée aux autres quand le serveur NOTIIF existera. */
export type Presence = "here" | "busy" | "away" | "later";
export const PRESENCES: [Presence, string, string][] = [["here", "🟢", "Présent"], ["busy", "🔴", "Occupé"], ["away", "⚪", "Pas là"], ["later", "🟡", "Je reviens plus tard"]];
const get = (k: string) => { try { return localStorage.getItem(k) || ""; } catch { return ""; } };
const put = (k: string, v: string) => { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch { /* ignoré */ } window.dispatchEvent(new Event("notiif-presence")); };
export const presenceNow = (): Presence => (["here", "busy", "away", "later"].includes(get("notiif-presence")) ? (get("notiif-presence") as Presence) : "here");
export type AutoMode = "off" | "away" | "always";
export const autoMode = (): AutoMode => { const v = get("notiif-autoreply"); return v === "always" ? "always" : v === "1" || v === "away" ? "away" : "off"; };
export const autoReplyOn = () => autoMode() !== "off";
export const setAutoMode = (m: AutoMode) => put("notiif-autoreply", m === "off" ? "" : m);
/** Faut-il répondre tout de suite à un effet reçu ? (« Tout le temps » ou « Quand je ne suis pas là ») */
export const shouldAutoReply = () => { const m = autoMode(); return m === "always" || (m === "away" && presenceNow() !== "here"); };
/** Mon propre message d'absence (5 s maximum), gardé sur cet appareil. */
export const absentMsg = () => get("notiif-absent-msg");
export const setAbsentMsg = (d: string) => put("notiif-absent-msg", d);
export const setPresence = (p: Presence) => put("notiif-presence", p === "here" ? "" : p);
export const setAutoReply = (v: boolean) => put("notiif-autoreply", v ? "1" : "");
export function usePresence() {
  const [, bump] = useState(0);
  useEffect(() => { const h = () => bump((n) => n + 1); window.addEventListener("notiif-presence", h); return () => window.removeEventListener("notiif-presence", h); }, []);
  return { presence: presenceNow(), auto: autoReplyOn(), mode: autoMode(), msg: absentMsg() };
}
