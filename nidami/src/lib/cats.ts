import { t } from "../i18n";
import type { Social, ID } from "./engine";
/** Catégories de contacts : une liste de départ + celles que chacun invente (« Ma catégorie »). */
export interface Cat { id: string; e: string; n: string; custom?: boolean }
export const DEFAULT_CATS: { id: string; e: string; n: string }[] = [
  { id: "family", e: "👨‍👩‍👧", n: "Famille" }, { id: "cousins", e: "👫", n: "Cousins et cousines" }, { id: "inlaws", e: "💍", n: "Belle-famille" },
  { id: "friends", e: "🧑‍🤝‍🧑", n: "Amis" }, { id: "best", e: "⭐", n: "Meilleurs amis" }, { id: "work", e: "💼", n: "Collègues" },
  { id: "neighbors", e: "🏠", n: "Voisins" }, { id: "school", e: "🎓", n: "École et études" }, { id: "club", e: "⚽", n: "Sport et associations" }, { id: "acq", e: "👋", n: "Connaissances" },
];
export const CAT_EMOJIS = ["🎯", "🎮", "🎭", "🎵", "📚", "✈️", "🍽️", "🐶", "⛪", "🏋️", "🎨", "🌍", "💬", "🛠️", "❤️"];
/** Toutes les catégories d'une personne : celles de départ, puis les siennes. */
export const catsOf = (s: Social, owner: ID): Cat[] => [...DEFAULT_CATS.map((c) => ({ id: c.id, e: c.e, n: t(c.n) })), ...(s.cats?.[owner] || []).map((c) => ({ id: c.id, e: c.e, n: c.n, custom: true }))];
export const friendCats = (s: Social, owner: ID, friend: ID): string[] => s.catOf?.[owner]?.[friend] || [];
