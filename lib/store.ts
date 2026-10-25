import { create } from "zustand";
import { persist } from "zustand/middleware";
export type View = "home" | "chat" | "text" | "web" | "image" | "qr" | "calls" | "threats" | "family" | "community" | "settings";
export interface Settings { lang: string; notif: boolean; privacy: boolean; theme: "dark" | "light"; security: "Standard" | "Renforcé" | "Maximum"; voice?: boolean; voiceName?: string; deep?: boolean; pitch?: number; rate?: number; country?: string; }
export interface Scan { id: number; kind: "text" | "web" | "image" | "qr" | "call"; label: string; score: number; level: string; at: number; }
export interface Toast { id: number; text: string; tone: "ok" | "warn" | "bad" | "info"; }
interface S {
  view: View; go: (v: View) => void; onboarded: boolean; finish: () => void;
  protectedToday: number; blocked: number; bump: (bad: boolean) => void;
  settings: Settings; set: (p: Partial<Settings>) => void;
  reported: string[]; report: (x: string) => void;
  pending: string | null; ask: (t: string) => void;
  incoming: string | null; setIncoming: (x: string | null) => void;
  history: Scan[]; addScan: (s: Omit<Scan, "id" | "at">) => void; clearHistory: () => void;
  contacts: { n: string; t: string[] }[]; setContacts: (c: { n: string; t: string[] }[]) => void;
  sharedFile: File | null; setSharedFile: (f: File | null) => void;
  toast: Toast | null; notify: (text: string, tone?: Toast["tone"]) => void;
}
let tid = 1;
export const useS = create<S>()(persist((set) => ({
  view: "home", go: (view) => set({ view }), onboarded: false, finish: () => set({ onboarded: true }),
  protectedToday: 0, blocked: 0, bump: (bad) => set((s) => ({ protectedToday: s.protectedToday + 1, blocked: s.blocked + (bad ? 1 : 0) })),
  settings: { lang: "Français", notif: true, privacy: true, theme: "dark", security: "Renforcé", voice: false, deep: true, pitch: 0.75, rate: 0.92 }, set: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
  pending: null, ask: (t) => set({ view: "chat", pending: t }),
  incoming: null, setIncoming: (incoming) => set({ incoming }),
  reported: [], report: (x) => set((s) => ({ reported: [x, ...s.reported] })),
  history: [], addScan: (x) => set((s) => ({ history: [{ ...x, id: Date.now() + Math.random(), at: Date.now() }, ...s.history].slice(0, 12) })), clearHistory: () => set({ history: [] }),
  contacts: [], setContacts: (contacts) => set({ contacts }),
  sharedFile: null, setSharedFile: (sharedFile) => set({ sharedFile }),
  toast: null, notify: (text, tone = "ok") => { const id = tid++; set({ toast: { id, text, tone } }); setTimeout(() => set((s) => (s.toast?.id === id ? { toast: null } : s)), 3800); },
}), { name: "bobby-one", version: 4, migrate: (st: any, v: number) => { let o = st; if (v < 2) o = { ...o, protectedToday: 0, blocked: 0, history: [] }; if (v < 3) o = { ...o, settings: { ...o.settings, voice: false } }; if (v < 4) o = { ...o, settings: { ...o.settings, voiceName: "", pitch: 0.75 } }; return o; }, partialize: (s) => ({ contacts: s.contacts, onboarded: s.onboarded, settings: s.settings, reported: s.reported, protectedToday: s.protectedToday, blocked: s.blocked, history: s.history }) }));
