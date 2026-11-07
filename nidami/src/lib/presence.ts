import { useEffect, useState } from "react";
/** Disponibilité de l'utilisateur (sur cet appareil). La réponse automatique sera envoyée aux autres quand le serveur NOTIIF existera. */
export type Presence = "here" | "busy" | "away" | "later";
export const PRESENCES: [Presence, string, string][] = [["here", "🟢", "Présent"], ["busy", "🔴", "Occupé"], ["away", "⚪", "Pas là"], ["later", "🟡", "Je reviens plus tard"]];
const get = (k: string) => { try { return localStorage.getItem(k) || ""; } catch { return ""; } };
const put = (k: string, v: string) => { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch { /* ignoré */ } window.dispatchEvent(new Event("notiif-presence")); };
export const presenceNow = (): Presence => (["here", "busy", "away", "later"].includes(get("notiif-presence")) ? (get("notiif-presence") as Presence) : "here");
export const autoReplyOn = () => get("notiif-autoreply") === "1";
export const setPresence = (p: Presence) => put("notiif-presence", p === "here" ? "" : p);
export const setAutoReply = (v: boolean) => put("notiif-autoreply", v ? "1" : "");
export function usePresence() {
  const [, bump] = useState(0);
  useEffect(() => { const h = () => bump((n) => n + 1); window.addEventListener("notiif-presence", h); return () => window.removeEventListener("notiif-presence", h); }, []);
  return { presence: presenceNow(), auto: autoReplyOn() };
}
