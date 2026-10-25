export type PermState = "granted" | "denied" | "default" | "unsupported";
export const notifState = (): PermState => (typeof Notification === "undefined" ? "unsupported" : (Notification.permission as PermState));
export async function askNotif(): Promise<PermState> { if (typeof Notification === "undefined") return "unsupported"; try { return (await Notification.requestPermission()) as PermState; } catch { return "denied"; } }
export async function askMic(): Promise<PermState> {
  try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); s.getTracks().forEach((t) => t.stop()); return "granted"; } catch (e: any) { return e?.name === "NotAllowedError" ? "denied" : "unsupported"; }
}
export function alertDanger(body: string) {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const opts: any = { body, icon: "/icon-192.png", badge: "/icon-192.png", tag: "bobby-alert", vibrate: [200, 100, 200] };
    if ("serviceWorker" in navigator) navigator.serviceWorker.ready.then((r) => r.showNotification("Bobby : attention, danger", opts)).catch(() => new Notification("Bobby : attention, danger", opts));
    else new Notification("Bobby : attention, danger", opts);
  } catch {}
}
