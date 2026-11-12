import { useEffect, useState } from "react";
// Verrou NOTIIF : Aucun / Empreinte ou visage (le téléphone ou Windows Hello) / Schéma / Code PIN. Tout reste sur l'appareil.
export type LockMode = "none" | "bio" | "pattern" | "pin";
export interface LockCfg { m: LockMode; h?: string; cid?: string; face?: boolean; after: number; hide: boolean }
const K = "notiif-lock";
export const lockCfg = (): LockCfg => { try { const v = JSON.parse(localStorage.getItem(K) || "null"); if (v && typeof v === "object") return { m: "none", after: 0, hide: true, ...v }; } catch { /* ignoré */ } return { m: "none", after: 0, hide: true }; };
export const saveLock = (c: LockCfg) => { try { localStorage.setItem(K, JSON.stringify(c)); } catch { /* ignoré */ } window.dispatchEvent(new Event("notiif-lock")); };
export async function lockHash(v: string): Promise<string> { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("notiif-lock:" + v)); return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join(""); }
export async function bioAvailable(): Promise<boolean> { try { return !!(window.PublicKeyCredential && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()); } catch { return false; } }
const b64 = (a: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(a))); const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
export async function bioSetup(): Promise<string | null> {
  try { const c = (await navigator.credentials.create({ publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), rp: { name: "NOTIIF" }, user: { id: crypto.getRandomValues(new Uint8Array(16)), name: "notiif", displayName: "NOTIIF" }, pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }], authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" }, timeout: 60000 } })) as PublicKeyCredential | null; return c ? b64(c.rawId) : null; } catch { return null; }
}
export async function bioCheck(cid: string): Promise<boolean> {
  try { const r = await navigator.credentials.get({ publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), allowCredentials: [{ id: unb64(cid), type: "public-key" }], userVerification: "required", timeout: 60000 } }); return !!r; } catch { return false; }
}
let locked = lockCfg().m !== "none"; let hiddenAt = 0;
const fire = () => window.dispatchEvent(new Event("notiif-lockstate"));
export const isLocked = () => locked;
export const unlock = () => { locked = false; fire(); };
export const lockNow = () => { if (lockCfg().m !== "none") { locked = true; fire(); } };
if (typeof document !== "undefined") document.addEventListener("visibilitychange", () => {
  const c = lockCfg(); if (c.m === "none") return;
  if (document.visibilityState === "hidden") hiddenAt = Date.now();
  else if (hiddenAt && (c.after === 0 || Date.now() - hiddenAt >= c.after * 1000)) { locked = true; fire(); }
});
export function useLocked(): boolean { const [v, setV] = useState(locked); useEffect(() => { const h = () => setV(locked); window.addEventListener("notiif-lockstate", h); window.addEventListener("notiif-lock", h); return () => { window.removeEventListener("notiif-lockstate", h); window.removeEventListener("notiif-lock", h); }; }, []); return v; }
