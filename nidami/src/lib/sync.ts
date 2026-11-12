import { serverLive, SB_URL, SB_KEY } from "./auth";
import { getSess, listFriends, allMessages, sendMessage, getMedia, sendTyping, typingNow, heartbeat, heartbeatAway, peersNow } from "./server";
import { setPeers } from "./peers";
import { presenceNow } from "./presence";
import { soundTyping } from "./fx";
import { actions, setSbOut, getState } from "./store";

/** Relie le serveur à l'écran Messages : amis réels, messages et effets reçus d'un autre appareil. Actif seulement dans la version développeur, avec un compte connecté. */
let timer: ReturnType<typeof setInterval> | null = null; let busy = false; let primed = false;
let lastTok = "";
/** Dans l'application Android : donne la session au service de veille (notifications écran éteint). */
function toNative(s: { access: string; refresh: string; uid: string }) {
  const nat = (window as any).CercleNative; if (!nat?.setSession || s.access === lastTok) return; lastTok = s.access;
  try { nat.setSession(SB_URL, SB_KEY, s.access, s.refresh, s.uid);
    if (!localStorage.getItem("notiif-nat-ask")) { localStorage.setItem("notiif-nat-ask", "1"); nat.askNotif?.(); setTimeout(() => nat.askBattery?.(), 2500); } } catch { /* ignoré */ }
}
const pull = async () => {
  const s = getSess(); if (s) toNative(s); if (!s || busy || document.visibilityState === "hidden") return; busy = true;
  try { const [fr, msgs] = await Promise.all([listFriends(), allMessages()]);
    const have = new Set<string>(); for (const c of getState().convs) for (const m of c.msgs) have.add(m.id);
    for (const m of msgs) if (m.media_kind && !have.has(m.id)) { if (m.sender === s.uid) { m.media_kind = null; continue; } const d = await getMedia(m.id); if (d) m.media = d; else m.media_kind = null; } actions.sbMerge({ prime: !primed, uid: s.uid, fr: fr.map((f) => ({ id: f.id, name: f.name })), msgs }); primed = true; setPeers(await peersNow()); } finally { busy = false; }
};
let lastPing = 0; const heard = new Map<string, number>();
/** Appelé quand j'écris dans une conversation du serveur : prévient l'ami (au plus toutes les 2,5 s). */
export function typingPing(convId: string) { if (!convId.startsWith("sbc_") || Date.now() - lastPing < 2500) return; lastPing = Date.now(); void sendTyping(convId.slice(4)); }
const watchTyping = async () => {
  if (!getSess() || document.visibilityState === "hidden") return;
  const ids = await typingNow(); if (!ids.length) return;
  actions.sbTyping(ids);
  for (const id of ids) { const l = heard.get(id) || 0; if (Date.now() - l > 9000) soundTyping(); heard.set(id, Date.now()); }
};
export function startSync() {
  if (!serverLive() || timer) return;
  setSbOut((convId, body, fx, id, media) => { const to = convId.replace(/^sbc_/, ""); void sendMessage(to, body, fx, id, media); });
  void pull(); timer = setInterval(() => void pull(), 3000); setInterval(() => void watchTyping(), 1800); const hb = () => { if (!getSess()) return; if (document.visibilityState === "hidden") heartbeatAway(); else void heartbeat(presenceNow()); }; hb(); setInterval(hb, 8000); document.addEventListener("visibilitychange", hb); window.addEventListener("pagehide", () => heartbeatAway());
}
export function stopSync() { if (timer) clearInterval(timer); timer = null; setSbOut(null); }
