import { serverLive, SB_URL, SB_KEY } from "./auth";
import { dbg, tKinds, getSess, listFriends, allMessages, sendMessage, getMedia, sendTyping, typingNow, heartbeat, heartbeatAway, peersNow, setReaction, allReactions } from "./server";
import { setPeers } from "./peers";
import { pushNative } from "./catnotif";
import { presenceNow } from "./presence";
import { soundTyping } from "./fx";
import { actions, setSbOut, setSbReact, getState } from "./store";

/** Relie le serveur à l'écran Messages : amis réels, messages et effets reçus d'un autre appareil. Actif seulement dans la version développeur, avec un compte connecté. */
let timer: ReturnType<typeof setInterval> | null = null; let busy = false; let primed = false;
let lastTok = "";
/** Dans l'application Android : donne la session au service de veille (notifications écran éteint). */
function toNative(s: { access: string; refresh: string; uid: string }) {
  const nat = (window as any).CercleNative; if (!nat?.setSession || s.access === lastTok) return; lastTok = s.access;
  try { nat.setSession(SB_URL, SB_KEY, s.access, s.refresh, s.uid); pushNative();
    if (!localStorage.getItem("notiif-nat-ask")) { localStorage.setItem("notiif-nat-ask", "1"); nat.askNotif?.(); setTimeout(() => nat.askBattery?.(), 2500); } } catch { /* ignoré */ }
}
const pull = async () => {
  const t00 = Date.now(); const s = getSess(); if (s) toNative(s); if (!s || busy || document.visibilityState === "hidden") return; busy = true;
  try { const [fr, msgs, rxs] = await Promise.all([listFriends(), allMessages(), allReactions()]);
    const have = new Set<string>(); for (const c of getState().convs) for (const m of c.msgs) have.add(m.id);
    for (const m of msgs) if (m.media_kind && !have.has(m.id)) { if (m.sender === s.uid) { m.media_kind = null; continue; } const d = await getMedia(m.id); if (d) m.media = d; else m.media_kind = null; } actions.sbMerge({ prime: !primed, uid: s.uid, fr: fr.map((f) => ({ id: f.id, name: f.name })), msgs }); if (rxs) actions.sbReactions(rxs, s.uid); primed = true; dbg.pull = Math.round(Date.now() - t00) + " ms"; if (Date.now() - lastPeers > 2500) { lastPeers = Date.now(); void peersNow().then(setPeers); } } finally { busy = false; }
};
let lastPeers = 0; const lastPing: Record<string, number> = {}; const heard = new Map<string, number>();
let activeConv = ""; export const setActiveConv = (id: string) => { activeConv = id; };
/** Appelé quand j'écris / j'enregistre dans une conversation du serveur : prévient l'ami (au plus toutes les 2,5 s). */
export function typingPing(convId: string, kind: "text" | "audio" | "video" = "text") { if (!convId.startsWith("sbc_") || Date.now() - (lastPing[kind] || 0) < 2500) return; lastPing[kind] = Date.now(); void sendTyping(convId.slice(4), kind); }
/** Pendant un enregistrement (vocal ou vidéo) : signal répété toutes les 2 s. Renvoie la fonction qui l'arrête. */
export function recordLoop(kind: "audio" | "video"): () => void { const id = activeConv; if (!id) return () => {}; typingPing(id, kind); const iv = setInterval(() => typingPing(id, kind), 2000); return () => clearInterval(iv); }
const watchTyping = async () => {
  if (!getSess() || document.visibilityState === "hidden") return;
  const ids = await typingNow(); if (!ids.length) return;
  actions.sbTyping(ids, tKinds);
  for (const id of ids) { const l = heard.get(id) || 0; if (Date.now() - l > 9000) soundTyping(); heard.set(id, Date.now()); }
};
export function startSync() {
  if (!serverLive() || timer) return;
  setSbOut((convId, body, fx, id, media) => { const to = convId.replace(/^sbc_/, ""); void sendMessage(to, body, fx, id, media); });
  setSbReact((id, e) => { void setReaction(id, e); });
  void pull(); timer = setInterval(() => void pull(), 1000); setInterval(() => void watchTyping(), 1000); const hb = () => { if (!getSess()) return; pushNative(); if (document.visibilityState === "hidden") heartbeatAway(); else void heartbeat(presenceNow()); }; hb(); setInterval(hb, 8000); document.addEventListener("visibilitychange", hb); window.addEventListener("pagehide", () => heartbeatAway());
}
export function stopSync() { if (timer) clearInterval(timer); timer = null; setSbOut(null); }
