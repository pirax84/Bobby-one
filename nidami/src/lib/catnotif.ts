import { getState } from "./store";
import { friendCats, catsOf } from "./cats";
/** Notifications selon la catégorie de l'ami : normal, silencieux ou prioritaire (gardé sur l'appareil). */
export type CatMode = "normal" | "silent" | "priority";
const K = "notiif-catnotif";
const load = (): Record<string, CatMode> => { try { return JSON.parse(localStorage.getItem(K) || "{}") || {}; } catch { return {}; } };
export const catMode = (cat: string): CatMode => load()[cat] || "normal";
export function setCatMode(cat: string, m: CatMode) { const o = load(); if (m === "normal") delete o[cat]; else o[cat] = m; try { localStorage.setItem(K, JSON.stringify(o)); } catch { /* ignoré */ } window.dispatchEvent(new Event("notiif-pref")); pushNative(); }
/** Mode d'un ami : prioritaire si une de ses catégories l'est ; silencieux si toutes ses catégories le sont. */
export function friendMode(friend: string): CatMode {
  const s = getState(); const l = friendCats(s.social, s.me, friend); if (!l.length) return "normal"; const o = load(); const ms = l.map((c) => o[c] || "normal");
  return ms.includes("priority") ? "priority" : ms.every((m) => m === "silent") ? "silent" : "normal";
}
/** Donne à l'application Android la liste des amis silencieux (pour l'écran éteint). */
export function pushNative() {
  try { const nat = (window as any).CercleNative; if (!nat?.setPrefs) return; const s = getState(); const mute: string[] = [], prio: string[] = [];
    for (const f of s.social.friends[s.me] || []) { if (!f.startsWith("sb_")) continue; const m = friendMode(f); if (m === "silent") mute.push(f.slice(3)); else if (m === "priority") prio.push(f.slice(3)); }
    nat.setPrefs(mute.join(","), prio.join(",")); } catch { /* ignoré */ }
}
export const allCats = () => { const s = getState(); return catsOf(s.social, s.me); };
