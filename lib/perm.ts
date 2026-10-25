export type PermState = "granted" | "denied" | "default" | "unsupported";
export const notifState = (): PermState => (typeof Notification === "undefined" ? "unsupported" : (Notification.permission as PermState));
export async function askNotif(): Promise<PermState> { if (typeof Notification === "undefined") return "unsupported"; try { return (await Notification.requestPermission()) as PermState; } catch { return "denied"; } }
export async function askMic(): Promise<PermState> {
  try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); s.getTracks().forEach((t) => t.stop()); return "granted"; } catch (e: any) { return e?.name === "NotAllowedError" ? "denied" : "unsupported"; }
}
import { useS } from "./store";
const ghostOn = () => useS.getState().settings.ghost !== false;
// Retire de la barre du haut toutes les notifications de Bobby déjà affichées.
export async function clearBobbyNotifications() {
  try { if (!("serviceWorker" in navigator)) return; const r = await navigator.serviceWorker.ready; const l = await r.getNotifications(); l.forEach((n) => n.close()); } catch {}
}
export function alertDanger(body: string) {
  try {
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
  if (country) useS.getState().set({ country });
  if (notif === "granted") useS.getState().set({ notif: true });
  return { notif, geo, mic, country };
}
