import { useEffect, useState } from "react";
import type { Fete } from "./fetes";
/** Mode développeur : caché, réservé au créateur. Rien de tout ça n'apparaît chez les clients. */
const get = (k: string) => { try { return localStorage.getItem(k) || ""; } catch { return ""; } };
const set = (k: string, v: string) => { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch { /* ignoré */ } window.dispatchEvent(new Event("notiif-dev")); };
export const APP_VERSION = "v164";
/** Cadre « aperçu client » : l'appli reçoit la fête simulée dans l'adresse et ignore tout le reste du mode développeur. */
const url = (() => { try { return new URLSearchParams(location.search); } catch { return new URLSearchParams(); } })();
export const asClientFrame = url.get("client") === "1";
export const devUnlocked = () => !asClientFrame && get("notiif-dev") === "1";
export const devClient = () => get("notiif-dev-client") === "1";
/** Mode développeur actif = débloqué et pas en train de « voir comme un client ». */
export const devActive = () => devUnlocked() && !devClient();
export const devFete = (): Fete | null => asClientFrame ? ((url.get("fete") as Fete) || null) : devActive() && get("notiif-dev-nofete") !== "1" ? ((get("notiif-dev-fete") as Fete) || null) : null;
export const devNoFete = () => devActive() && get("notiif-dev-nofete") === "1";
export const devBday = () => asClientFrame ? url.get("bday") === "1" : devActive() && get("notiif-dev-bday") === "1";
const parseDate = (v: string) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null; const [y, m, j] = v.split("-").map(Number); return new Date(y, m - 1, j, 12); };
export const devDate = (): Date | null => asClientFrame ? parseDate(url.get("date") || "") : devActive() && get("notiif-dev-nofete") !== "1" ? parseDate(get("notiif-dev-date")) : null;
export const setDevBday = (v: boolean) => set("notiif-dev-bday", v ? "1" : "");
export const setDevDate = (v: string) => set("notiif-dev-date", v);
export const setDevNoFete = (v: boolean) => set("notiif-dev-nofete", v ? "1" : "");
export const setDevUnlocked = (v: boolean) => set("notiif-dev", v ? "1" : "");
export const setDevClient = (v: boolean) => set("notiif-dev-client", v ? "1" : "");
export const setDevFete = (f: Fete | "") => set("notiif-dev-fete", f);
export const setDevPreview = (v: boolean) => set("notiif-dev-preview", v ? "1" : "");
export const devPreview = () => get("notiif-dev-preview") === "1";

/** Effet joué quand on touche le logo, pour chaque fête (modifiable en mode développeur). */
export const FETE_FX_DEFAULT: Record<string, string> = { hal: "ghost", noel: "noelv1", val: "hearts", pq: "easter", ny: "fireworks" };
const readJson = (k: string): Record<string, unknown> => { try { const v = JSON.parse(get(k) || "{}"); return v && typeof v === "object" ? v : {}; } catch { return {}; } };
export const feteFx = (f: string): string => { if (!asClientFrame && devUnlocked()) { const o = readJson("notiif-dev-fx")[f]; if (typeof o === "string" && o) return o; } return FETE_FX_DEFAULT[f]; };
export const setFeteFx = (f: string, k: string) => { const o = readJson("notiif-dev-fx"); o[f] = k; set("notiif-dev-fx", JSON.stringify(o)); };
/** Le jour de la fête, l'effet se joue tout seul à la première ouverture de la journée (sauf si on l'a coupé en mode développeur). */
export const feteAuto = (f: string): boolean => asClientFrame || !(devUnlocked() && readJson("notiif-dev-auto")[f] === false);
export const setFeteAuto = (f: string, v: boolean) => { const o = readJson("notiif-dev-auto"); o[f] = v; set("notiif-dev-auto", JSON.stringify(o)); };
export const devChoices = () => JSON.stringify({ effets: Object.fromEntries(Object.keys(FETE_FX_DEFAULT).map((f) => [f, feteFx(f)])), auto: Object.fromEntries(Object.keys(FETE_FX_DEFAULT).map((f) => [f, feteAuto(f)])) }, null, 1);

/** Listes de choses cachées (sections, effets, sons coupés) : seulement en mode développeur, sur cet appareil. */
const listGet = (g: string): string[] => { try { const v = JSON.parse(get("notiif-dev-l-" + g) || "[]"); return Array.isArray(v) ? v.map(String) : []; } catch { return []; } };
export const devHidden = (g: string, id: string) => devActive() && listGet(g).includes(id);
export const devIsOff = (g: string, id: string) => listGet(g).includes(id);
export const devToggleHidden = (g: string, id: string) => { const l = listGet(g); const i = l.indexOf(id); if (i >= 0) l.splice(i, 1); else l.push(id); set("notiif-dev-l-" + g, l.length ? JSON.stringify(l) : ""); };
export const devHiddenCount = () => ["nav", "fx", "mute"].reduce((n, g) => n + listGet(g).length, 0);
export interface CSound { id: string; name: string; data: string }
export const customSounds = (): CSound[] => { try { const v = JSON.parse(get("notiif-dev-sounds") || "[]"); return Array.isArray(v) ? v : []; } catch { return []; } };
export const addCustomSound = (name: string, data: string): boolean => { const l = customSounds(); l.push({ id: "s" + Date.now().toString(36), name, data }); try { localStorage.setItem("notiif-dev-sounds", JSON.stringify(l)); window.dispatchEvent(new Event("notiif-dev")); return true; } catch { return false; } };
export const removeCustomSound = (id: string) => { set("notiif-dev-sounds", JSON.stringify(customSounds().filter((x) => x.id !== id))); const m = readJson("notiif-dev-sndmap"); for (const k of Object.keys(m)) if (m[k] === id) delete m[k]; set("notiif-dev-sndmap", JSON.stringify(m)); };
export const soundFor = (k: string): CSound | null => { if (!devActive()) return null; const id = readJson("notiif-dev-sndmap")[k]; return customSounds().find((x) => x.id === id) || null; };
export const sndMapOf = (k: string): string => { const v = readJson("notiif-dev-sndmap")[k]; return typeof v === "string" ? v : ""; };
export const setSndMap = (k: string, id: string) => { const m = readJson("notiif-dev-sndmap"); if (id) m[k] = id; else delete m[k]; set("notiif-dev-sndmap", JSON.stringify(m)); };
export const devResetAll = () => { ["nav", "fx", "mute"].forEach((g) => set("notiif-dev-l-" + g, "")); set("notiif-dev-sndmap", ""); set("notiif-dev-fx", ""); set("notiif-dev-auto", ""); };

/** Re-dessine le composant quand le mode développeur change. */
export function useDev() {
  const [, bump] = useState(0);
  useEffect(() => { const h = () => bump((n) => n + 1); window.addEventListener("notiif-dev", h); return () => window.removeEventListener("notiif-dev", h); }, []);
  return { unlocked: devUnlocked(), client: devClient(), active: devActive(), fete: devFete(), bday: devBday(), date: get("notiif-dev-date"), noFete: devNoFete(), preview: devPreview(), hidden: devHiddenCount(), sounds: customSounds().length };
}
