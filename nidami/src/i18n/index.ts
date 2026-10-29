import { createElement, Fragment, useSyncExternalStore, type ReactNode } from "react";
import { LANGS } from "./langs";
import { LOADERS } from "./loaders";
export { LANGS } from "./langs";
export type { Lang } from "./langs";

/**
 * Traduction : la clé est le texte français d'origine. Si une traduction manque, le français s'affiche (jamais un code technique).
 * Variables : t("Bonjour {name}", { name }) · Pluriels : t("{n, plural, one{# ami} other{# amis}}", { n }).
 */
type Vars = Record<string, unknown>;
const KEY = "notiif-lang";
let cur = "fr"; let dict: Record<string, string> = {}; const subs = new Set<() => void>(); const missing = new Set<string>();

const find = (c: string) => LANGS.find((l) => l.code.toLowerCase() === c.toLowerCase());
const saved = (): string | null => { try { const v = localStorage.getItem(KEY); return v && find(v) ? find(v)!.code : null; } catch { return null; } };

/** Langue choisie à la main > langue de l'appareil ou du navigateur > français. */
export function detectLang(): string {
  const s = saved(); if (s) return s;
  const list = typeof navigator !== "undefined" ? (navigator.languages?.length ? navigator.languages : [navigator.language]) : [];
  for (const raw of list) { if (!raw) continue; const c = raw.toLowerCase(); const ex = find(c); if (ex) return ex.code; if (c.startsWith("zh")) return "zh-CN"; const b = find(c.split("-")[0]); if (b) return b.code; }
  return "fr";
}

async function load(code: string): Promise<Record<string, string>> { if (code === "fr") return {}; try { return (await LOADERS[code]()).default; } catch { return {}; } }
function apply(code: string) {
  const l = find(code)!; const r = document.documentElement; r.lang = l.code; r.dir = l.dir;
  try { document.title = t("NOTIIF — Votre cercle. Vos moments."); } catch { /* ignoré */ }
}

/** Active une langue tout de suite. manual = choix de l'utilisateur : il est mémorisé et reste prioritaire. */
export async function setLang(code: string, manual = true) {
  const l = find(code); if (!l) return;
  const d = await load(l.code); dict = d; cur = l.code; missing.clear();
  if (manual) { try { localStorage.setItem(KEY, l.code); } catch { /* ignoré */ } }
  apply(l.code); subs.forEach((f) => f());
}
export const initLang = () => setLang(detectLang(), false);
export const currentLang = () => cur;
export const isManual = () => saved() !== null;
export const locale = () => find(cur)?.intl || "fr-FR";
export const missingKeys = () => [...missing];

const plural = (s: string, v: Vars) => s.replace(/\{(\w+),\s*plural,\s*((?:\w+\{[^{}]*\}\s*)+)\}/g, (_m, name: string, body: string) => {
  const n = Number(v[name]); const forms: Record<string, string> = {}; body.replace(/(\w+)\{([^{}]*)\}/g, (_x, k: string, txt: string) => (forms[k] = txt, ""));
  let cat = "other"; try { cat = new Intl.PluralRules(locale()).select(n); } catch { /* garde other */ }
  const exact = forms["=" + n]; return (exact ?? forms[cat] ?? forms.other ?? "").replace(/#/g, String(n));
});
export function fmt(s: string, v?: Vars) { if (!v) return s; return plural(s, v).replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k] ?? "") : m)); }

export function t(src: string, v?: Vars): string {
  if (!/[A-Za-zÀ-ɏ]/.test(src)) return fmt(src, v);
  let s = dict[src]; if (s === undefined || s === "") { s = src; if (cur !== "fr") missing.add(src); }
  return fmt(s, v);
}
/** Comme t(), mais les variables peuvent être des éléments React (un bouton, un lien…). */
export function tn(src: string, v: Record<string, ReactNode>): ReactNode {
  let s = dict[src]; if (s === undefined || s === "") { s = src; if (cur !== "fr") missing.add(src); }
  const parts = s.split(/(\{\w+\})/g).map((p, i) => { const m = /^\{(\w+)\}$/.exec(p); return m && m[1] in v ? createElement(Fragment, { key: i }, v[m[1]]) : p; });
  return createElement(Fragment, null, ...parts);
}
/** Marqueur pour un texte défini hors d'un composant : il reste en français ici, et on écrit t(texte) à l'endroit où il s'affiche. */
export const T = (s: string) => s;

const sub = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const useLang = () => useSyncExternalStore(sub, () => cur);
