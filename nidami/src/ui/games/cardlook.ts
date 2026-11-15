import { createContext, useContext, useEffect, useState } from "react";

export type GameKey = "belote" | "rami" | "tarot" | "huit" | "pouilleux" | "bataille";
export type Look = { face: string; back: number; aid: boolean; style: "epais" | "leve" | "sombre"; words: boolean; four: boolean; asked: boolean };
export const FACES = ["A", "B", "C", "D", "E", "F"];
export const DEF_FACE: Record<GameKey, string> = { belote: "A", rami: "D", huit: "B", pouilleux: "C", tarot: "E", bataille: "F" };
export const DEF_BACK: Record<GameKey, number> = { belote: 1, rami: 4, huit: 3, pouilleux: 2, tarot: 5, bataille: 6 };
export const HAS_AID: GameKey[] = ["rami", "belote", "tarot"];
export const defLook = (g: GameKey): Look => ({ face: DEF_FACE[g], back: DEF_BACK[g], aid: g === "rami", style: "epais", words: false, four: false, asked: false });

export function getLook(g: GameKey): Look {
  try { const s = localStorage.getItem("notiif-look-" + g); if (s) return { ...defLook(g), ...JSON.parse(s) }; } catch { /* ignoré */ }
  return defLook(g);
}
export function setLook(g: GameKey, p: Partial<Look>) {
  try { localStorage.setItem("notiif-look-" + g, JSON.stringify({ ...getLook(g), ...p })); } catch { /* ignoré */ }
  window.dispatchEvent(new Event("notiif-look"));
}
export function useLook(g: GameKey): Look {
  const [l, setL] = useState(() => getLook(g));
  useEffect(() => { const f = () => setL(getLook(g)); window.addEventListener("notiif-look", f); return () => window.removeEventListener("notiif-look", f); }, [g]);
  return l;
}
export const LookCtx = createContext<{ game: GameKey; look: Look }>({ game: "rami", look: defLook("rami") });
export const useLookCtx = () => useContext(LookCtx);
