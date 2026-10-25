export type PermState = "granted" | "denied" | "default" | "unsupported";
export const notifState = (): PermState => isApp() ? (nHas("notif") ? "granted" : "default") : (typeof Notification === "undefined" ? "unsupported" : (Notification.permission as PermState));
export async function askNotif(): Promise<PermState> { if (isApp()) return (await nEnsure("notif", 60000)) ? "granted" : "denied"; if (typeof Notification === "undefined") return "unsupported"; try { return (await Notification.requestPermission()) as PermState; } catch { return "denied"; } }
export async function askMic(): Promise<PermState> {
  if (isApp()) return (await nEnsure("mic", 60000)) ? "granted" : "denied";
  try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); s.getTracks().forEach((t) => t.stop()); return "granted"; } catch (e: any) { return e?.name === "NotAllowedError" ? "denied" : "unsupported"; }
}
import { useS } from "./store";
import { isApp, has as nHas, ensure as nEnsure, nNotify } from "./native";
const ghostOn = () => useS.getState().settings.ghost !== false;
// Retire de la barre du haut toutes les notifications de Bobby déjà affichées.
export async function clearBobbyNotifications() {
  if (isApp()) return;
  try { if (!("serviceWorker" in navigator)) return; const r = await navigator.serviceWorker.ready; const l = await r.getNotifications(); l.forEach((n) => n.close()); } catch {}
}
export function alertDanger(body: string) {
  try {
    if (isApp()) { if (nHas("notif")) nNotify("Bobby : attention, danger", body); return; }
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const opts: any = { body, icon: "/icon-192.png", badge: "/badge-96.png", tag: "bobby-alert", vibrate: [200, 100, 200] };
    if ("serviceWorker" in navigator) navigator.serviceWorker.ready.then((r) => { r.showNotification("Bobby : attention, danger", opts); if (ghostOn()) setTimeout(() => clearBobbyNotifications(), 10000); }).catch(() => new Notification("Bobby : attention, danger", opts));
    else new Notification("Bobby : attention, danger", opts);
  } catch {}
}

// Demande d'un coup les autorisations utiles (notifications, position, micro). Chaque refus est sans conséquence.
export async function askAll(): Promise<{ notif: PermState; geo: PermState; mic: PermState; country?: string }> {
  const notif = notifState() === "granted" ? "granted" : await askNotif();
  let geo: PermState = "default"; let country: string | undefined;
  try { const { locate } = await import("./country"); country = await locate(); geo = "granted"; } catch (e: any) { geo = e?.message === "denied" ? "denied" : "default"; }
  const mic = await askMic();
  useS.getState().set({ geoOn: true, micOn: true, ...(country ? { country } : {}) });
  if (notif === "granted") useS.getState().set({ notif: true });
  return { notif, geo, mic, country };
}
