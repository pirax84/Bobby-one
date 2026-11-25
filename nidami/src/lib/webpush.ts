import { SB_URL, SB_KEY } from "./auth";
import { getSess, req } from "./server";

/**
 * Ordinateur : abonnement aux notifications du navigateur (Web Push), pour être prévenu même NOTIIF fermé.
 * Ne fait rien dans l'appli Android (elle a ses propres notifications) ni si la fonction « notiif-web »
 * n'est pas encore installée sur le serveur : dans ce cas, les notifications marchent quand NOTIIF est ouvert.
 */
let state: "" | "on" | "off" | "na" = ""; let lastTry = 0;
const b64ToBytes = (b: string) => { const p = "=".repeat((4 - (b.length % 4)) % 4); const r = atob((b + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(r, (c) => c.charCodeAt(0)); };
const supported = () => !(window as any).CercleNative && typeof Notification !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;

export async function syncWebPush(want: boolean) {
  if (!supported() || state === "na") return; const s = getSess(); if (!s) return;
  if (want && Notification.permission !== "granted") return;
  const goal = want ? "on" : "off"; if (state === goal || Date.now() - lastTry < 60000) return; lastTry = Date.now();
  try {
    const reg = await navigator.serviceWorker.ready; let sub = await reg.pushManager.getSubscription();
    if (!want) { if (sub) { await req("DELETE", "/rest/v1/web_push_subs?endpoint=eq." + encodeURIComponent(sub.endpoint)); await sub.unsubscribe(); } state = "off"; return; }
    if (!sub) {
      const r = await fetch(SB_URL + "/functions/v1/notiif-web", { headers: { apikey: SB_KEY, Authorization: "Bearer " + s.access } });
      if (!r.ok) { if (r.status === 404) state = "na"; return; } // fonction pas encore installée sur le serveur
      const { publicKey } = await r.json(); if (!publicKey) return;
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(publicKey) });
    }
    const w = await req("POST", "/rest/v1/web_push_subs?on_conflict=endpoint", { endpoint: sub.endpoint, user_id: s.uid, sub: sub.toJSON() }, "resolution=merge-duplicates,return=minimal");
    if (w.ok) state = "on"; else if (w.status === 404) state = "na";
  } catch { /* on réessaiera plus tard */ }
}
