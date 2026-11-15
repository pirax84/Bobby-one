/** Demande l'autorisation de notifications : via l'appli Android si elle est là (le navigateur intégré ne sait pas le faire), sinon via le navigateur. */
export async function askNotifPerm(): Promise<"granted" | "denied" | "unsupported"> {
  const nat = (window as any).CercleNative;
  if (nat?.hasNotifPermission) {
    try {
      if (nat.hasNotifPermission()) return "granted";
      nat.askNotif?.();
      for (let i = 0; i < 40; i++) { await new Promise((r) => setTimeout(r, 400)); if (nat.hasNotifPermission()) return "granted"; }
      return "denied";
    } catch { return "denied"; }
  }
  if (typeof Notification === "undefined") return "unsupported";
  try { const r = Notification.permission === "granted" ? "granted" : await Notification.requestPermission(); return r === "granted" ? "granted" : "denied"; } catch { return "denied"; }
}
