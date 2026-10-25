import { create } from "zustand";
import { persist } from "zustand/middleware";
export type View = "home" | "chat" | "text" | "web" | "image" | "qr" | "calls" | "threats" | "family" | "community" | "settings";
export interface Settings { lang: string; notif: boolean; privacy: boolean; theme: "dark" | "light"; security: "Standard" | "Renforcé" | "Maximum"; voice?: boolean; voiceName?: string; deep?: boolean; }
interface S {
  view: View; go: (v: View) => void; onboarded: boolean; finish: () => void;
  protectedToday: number; blocked: number; bump: (bad: boolean) => void;
  settings: Settings; set: (p: Partial<Settings>) => void;
  reported: string[]; report: (x: string) => void;
}
export const useS = create<S>()(persist((set) => ({
  view: "home", go: (view) => set({ view }), onboarded: false, finish: () => set({ onboarded: true }),
  protectedToday: 27, blocked: 6, bump: (bad) => set((s) => ({ protectedToday: s.protectedToday + 1, blocked: s.blocked + (bad ? 1 : 0) })),
  settings: { lang: "Français", notif: true, privacy: true, theme: "dark", security: "Renforcé", voice: true }, set: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
  reported: [], report: (x) => set((s) => ({ reported: [x, ...s.reported] })),
}), { name: "bobby-one", partialize: (s) => ({ onboarded: s.onboarded, settings: s.settings, reported: s.reported, protectedToday: s.protectedToday, blocked: s.blocked }) }));
