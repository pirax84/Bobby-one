import { useEffect, useState } from "react";
import type { Fete } from "./fetes";
/** Mode développeur : caché, réservé au créateur. Rien de tout ça n'apparaît chez les clients. */
const get = (k: string) => { try { return localStorage.getItem(k) || ""; } catch { return ""; } };
const set = (k: string, v: string) => { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch { /* ignoré */ } window.dispatchEvent(new Event("notiif-dev")); };
export const APP_VERSION = "v154";
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
export const FETE_FX_DEFAULT: Record<string, string> = { hal: "ghost", noel: "noel1", val: "hearts", pq: "easter", ny: "fireworks" };
const readJson = (k: string): Record<string, unknown> => { try { const v = JSON.parse(get(k) || "{}"); return v && typeof v === "object" ? v : {}; } catch { return {}; } };
export const feteFx = (f: string): string => { if (!asClientFrame && devUnlocked()) { const o = readJson("notiif-dev-fx")[f]; if (typeof o === "string" && o) return o; } return FETE_FX_DEFAULT[f]; };
export const setFeteFx = (f: string, k: string) => { const o = readJson("notiif-dev-fx"); o[f] = k; set("notiif-dev-fx", JSON.stringify(o)); };
export const feteAuto = (f: string): boolean => !asClientFrame && devUnlocked() && readJson("notiif-dev-auto")[f] === true;
export const setFeteAuto = (f: string, v: boolean) => { const o = readJson("notiif-dev-auto"); o[f] = v; set("notiif-dev-auto", JSON.stringify(o)); };
export const devChoices = () => JSON.stringify({ effets: Object.fromEntries(Object.keys(FETE_FX_DEFAULT).map((f) => [f, feteFx(f)])), auto: Object.fromEntries(Object.keys(FETE_FX_DEFAULT).map((f) => [f, feteAuto(f)])) }, null, 1);

/** Re-dessine le composant quand le mode développeur change. */
export function useDev() {
  const [, bump] = useState(0);
  useEffect(() => { const h = () => bump((n) => n + 1); window.addEventListener("notiif-dev", h); return () => window.removeEventListener("notiif-dev", h); }, []);
  return { unlocked: devUnlocked(), client: devClient(), active: devActive(), fete: devFete(), bday: devBday(), date: get("notiif-dev-date"), noFete: devNoFete(), preview: devPreview() };
}
