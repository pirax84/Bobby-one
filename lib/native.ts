// Pont vers la vraie application Android (coque Kotlin). Dans un navigateur ce pont n'existe pas : tout reste caché.
export interface CallEntry { number: string; name?: string; type: "in" | "out" | "missed" | "rejected"; date: number }
export interface SmsEntry { address: string; body: string; date: number }
export interface NotifEntry { cat: "email" | "whatsapp" | "telegram" | "sms" | "other"; app: string; title: string; text: string; date: number }
export interface ScreenEntry { number: string; action: "rejected" | "silenced"; reason: string; date: number }
export type NPerm = "calls" | "sms" | "contacts" | "mic" | "geo" | "notif" | "notifaccess" | "screening";
const B = (): any => (typeof window === "undefined" ? null : (window as any)._BobbyBridge || null);
export const isApp = () => !!B();
export const hasNative = isApp;
const J = <T,>(s: any, d: T): T => { try { const v = JSON.parse(String(s)); return v ?? d; } catch { return d; } };
const call = (f: string, ...a: any[]) => { try { const b = B(); return b && b[f] ? b[f](...a) : undefined; } catch { return undefined; } };
export const has = (p: NPerm): boolean => !!call("has", p);
// Demande l'autorisation puis attend la réponse de l'utilisateur (Android répond en différé).
export async function ensure(p: NPerm, ms = 120000): Promise<boolean> {
  if (has(p)) return true; call("ask", p);
  const end = Date.now() + ms;
  while (Date.now() < end) { await new Promise((r) => setTimeout(r, 400)); if (has(p)) return true; if (document.visibilityState === "visible" && p !== "notifaccess" && p !== "screening" && Date.now() > end - ms + 8000 && !has(p)) { /* on laisse un peu de temps à la boîte de dialogue */ } }
  return has(p);
}
export const getCallLog = async (n = 150): Promise<CallEntry[]> => J(call("callLog", n), []);
export const getSms = async (n = 150): Promise<SmsEntry[]> => J(call("sms", n), []);
export const getContacts = async (): Promise<{ n: string; t: string[] }[]> => J(call("contacts"), []);
export const getNotifs = (): NotifEntry[] => J(call("notifs"), []);
export const getScreened = (): ScreenEntry[] => J(call("screened"), []);
export const clearNotifs = () => call("clearNotifs");
export const setBlocklist = (l: string[]) => call("setBlocklist", JSON.stringify(l));
export const nNotify = (title: string, text: string) => call("notify", title, text);
export const nShare = (text: string) => call("share", text);
export const openAppSettings = () => call("openAppSettings");
export function takeSharedImage(): File | null {
  const d = String(call("takeSharedImage") || ""); const m = d.match(/^data:([^;]+);base64,(.*)$/); if (!m) return null;
  try { const bin = atob(m[2]); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new File([u], "partage", { type: m[1] }); } catch { return null; }
}
// Micro : reconnaissance vocale Android (le WebView n'a pas celle de Chrome).
export function nListen(lang: string, done: (t: string) => void, fail: (e: string) => void, end?: () => void) {
  const w = window as any;
  w.__bobbyListen = (text: string, err: string) => { w.__bobbyListen = null; if (err) fail(err); else if (text) done(text); end?.(); };
  call("listen", lang);
  return { stop: () => call("stopListen"), abort: () => call("stopListen") };
}
// Dans l'application, le bouton « Partager » du site ouvre le partage d'Android.
if (typeof window !== "undefined" && B() && !(navigator as any).share) {
  try { (navigator as any).share = (d: { text?: string; url?: string; title?: string }) => { nShare([d.text, d.url].filter(Boolean).join(" ")); return Promise.resolve(); }; } catch {}
}
