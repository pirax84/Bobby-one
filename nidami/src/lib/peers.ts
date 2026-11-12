import { useEffect, useState } from "react";
/** État de présence des amis du serveur (vert = connecté, orange = plus tard, rouge = occupé, gris = absent / déconnecté). */
export type Peer = "here" | "later" | "busy" | "away";
export const PEER: Record<Peer, { c: string; dark: string; label: string }> = {
  here: { c: "#16a34a", dark: "#22c55e", label: "Connecté" },
  later: { c: "#d97706", dark: "#f59e0b", label: "Je reviens plus tard" },
  busy: { c: "#dc2626", dark: "#ef4444", label: "Occupé" },
  away: { c: "#8b90a0", dark: "#b8bcc6", label: "Absent / déconnecté" },
};
const m = new Map<string, Peer>();
export function setPeers(o: Record<string, Peer>) {
  let ch = false; for (const [k, v] of Object.entries(o)) if (m.get(k) !== v) { m.set(k, v); ch = true; }
  if (ch) window.dispatchEvent(new Event("notiif-peers"));
}
export const peerColor = (p: Peer) => ((document.documentElement.dataset.theme || "dark") === "light" ? PEER[p].c : PEER[p].dark);
export function usePeer(id?: string): Peer | undefined {
  const [, bump] = useState(0);
  useEffect(() => { const h = () => bump((n) => n + 1); window.addEventListener("notiif-peers", h); return () => window.removeEventListener("notiif-peers", h); }, []);
  return id ? m.get(id) : undefined;
}
