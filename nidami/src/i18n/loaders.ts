import { LANGS } from "./langs";

type Dict = Record<string, string>;
/** Un fichier par langue, chargé seulement quand on en a besoin (le français est la langue source, sans fichier à charger). */
const LOADERS: Record<string, () => Promise<{ default: Dict }>> = {
  "en": () => import("../locales/en.json"),
  "zh-CN": () => import("../locales/zh-CN.json"),
  "es": () => import("../locales/es.json"),
  "ar": () => import("../locales/ar.json"),
  "hi": () => import("../locales/hi.json"),
  "pt": () => import("../locales/pt.json"),
  "ru": () => import("../locales/ru.json"),
  "ja": () => import("../locales/ja.json"),
  "de": () => import("../locales/de.json"),
  "tr": () => import("../locales/tr.json"),
  "id": () => import("../locales/id.json"),
  "it": () => import("../locales/it.json"),
  "nl": () => import("../locales/nl.json"),
  "pl": () => import("../locales/pl.json"),
  "sv": () => import("../locales/sv.json"),
  "da": () => import("../locales/da.json"),
  "fi": () => import("../locales/fi.json"),
  "el": () => import("../locales/el.json"),
  "cs": () => import("../locales/cs.json"),
  "hu": () => import("../locales/hu.json"),
  "ro": () => import("../locales/ro.json"),
  "bg": () => import("../locales/bg.json"),
  "hr": () => import("../locales/hr.json"),
  "sk": () => import("../locales/sk.json"),
  "sl": () => import("../locales/sl.json"),
  "lv": () => import("../locales/lv.json"),
  "lt": () => import("../locales/lt.json"),
  "et": () => import("../locales/et.json"),
  "mt": () => import("../locales/mt.json"),
  "ga": () => import("../locales/ga.json"),
};
export { LOADERS };
