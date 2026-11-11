import { serverLive } from "./auth";
import { getSess, listFriends, allMessages, sendMessage } from "./server";
import { actions, setSbOut } from "./store";

/** Relie le serveur à l'écran Messages : amis réels, messages et effets reçus d'un autre appareil. Actif seulement dans la version développeur, avec un compte connecté. */
let timer: ReturnType<typeof setInterval> | null = null; let busy = false; let primed = false;
const pull = async () => {
  const s = getSess(); if (!s || busy || document.visibilityState === "hidden") return; busy = true;
  try { const [fr, msgs] = await Promise.all([listFriends(), allMessages()]); actions.sbMerge({ prime: !primed, uid: s.uid, fr: fr.map((f) => ({ id: f.id, name: f.name })), msgs }); primed = true; } finally { busy = false; }
};
export function startSync() {
  if (!serverLive() || timer) return;
  setSbOut((convId, body, fx, id) => { const to = convId.replace(/^sbc_/, ""); void sendMessage(to, body, fx, id); });
  void pull(); timer = setInterval(() => void pull(), 3000);
}
export function stopSync() { if (timer) clearInterval(timer); timer = null; setSbOut(null); }
