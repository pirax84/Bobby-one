import { serverLive, SB_URL, SB_KEY } from "./auth";
import { getSess, listFriends, allMessages, sendMessage } from "./server";
import { actions, setSbOut } from "./store";

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
  try { const [fr, msgs] = await Promise.all([listFriends(), allMessages()]); actions.sbMerge({ prime: !primed, uid: s.uid, fr: fr.map((f) => ({ id: f.id, name: f.name })), msgs }); primed = true; } finally { busy = false; }
};
export function startSync() {
  if (!serverLive() || timer) return;
  setSbOut((convId, body, fx, id) => { const to = convId.replace(/^sbc_/, ""); void sendMessage(to, body, fx, id); });
  void pull(); timer = setInterval(() => void pull(), 3000);
}
export function stopSync() { if (timer) clearInterval(timer); timer = null; setSbOut(null); }
