// Logos de NOTIIF classés par usage et par thème (images dans public/logos). Le choix du développeur est gardé sur cet appareil.
export const LOGO_USES: [string, string, number, number][] = [["phone", "Icône du téléphone", 100, 56], ["notif", "Notification (barre du haut)", 10, 40], ["top", "Logo en haut de l'appli", 50, 56], ["big", "Grand logo du milieu", 50, 72], ["tab", "Onglet du navigateur (PC)", 50, 40]];
export const LOGO_THEMES: [string, string][] = [["normal", "Couleurs normales"], ["halloween", "🎃 Halloween"], ["noel", "🎄 Noël"], ["valentin", "💕 Saint-Valentin"], ["anniv", "🎂 Anniversaire et fête"]];
const K = "notiif-logopick";
const base = () => (import.meta.env.BASE_URL || "./");
export const logoUrl = (use: string, theme: string, n: number) => `${base()}logos/${use}/${theme}/${String(n).padStart(2, "0")}.webp`;
export const getPicks = (): Record<string, number> => { try { return JSON.parse(localStorage.getItem(K) || "{}"); } catch { return {}; } };
export function setPick(use: string, theme: string, n: number) { const p = getPicks(); if (n) p[use + ":" + theme] = n; else delete p[use + ":" + theme]; try { localStorage.setItem(K, JSON.stringify(p)); } catch { /* ignoré */ } applyLogos(); window.dispatchEvent(new Event("notiif-pref")); }
/** Thème de logo actif d'après la fête en cours (null = couleurs normales). */
let curTheme = "normal";
export function setLogoTheme(t: string) { if (t !== curTheme) { curTheme = t; applyLogos(); } }
export function pickFor(use: string, theme = curTheme): number { return getPicks()[use + ":" + theme] || 0; }
/** Met le logo choisi dans l'onglet du navigateur. */
export function applyLogos() {
  const n = pickFor("tab"); const links = Array.from(document.querySelectorAll('link[rel~="icon"]')) as HTMLLinkElement[];
  if (!links.length) return;
  for (const l of links) { if (!l.dataset.orig) l.dataset.orig = l.href; if (n) { l.href = logoUrl("tab", curTheme, n); l.type = "image/webp"; } else { l.href = l.dataset.orig; } }
}
