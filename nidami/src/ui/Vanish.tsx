import { useEffect, useRef, useState, type ReactNode } from "react";
import { sceneShow } from "../lib/scenes";
import { fogShow } from "../lib/fog";

/** Effets « éphémères » : la photo se fissure puis tombe en morceaux ; le texte et le son s'effacent de gauche à droite. */
const clamp = (x: number) => Math.max(0, Math.min(1, x));

/** Avancement de l'effet : 0 pendant la phase « claire », puis monte jusqu'à 1 à la fin. */
export function useEffectK(start: number, total: number, clear: number) {
  const calc = () => clamp((Date.now() - start - clear) / Math.max(1, total - clear));
  const [k, setK] = useState(calc);
  useEffect(() => { let raf = 0; const f = () => { const v = calc(); setK(v); if (v < 1) raf = requestAnimationFrame(f); }; f(); return () => cancelAnimationFrame(raf); }, [start, total, clear]);
  return k;
}

function Mask({ k, children }: { k: number; children: ReactNode }) {
  if (k >= 1) return null; if (k <= 0) return <>{children}</>;
  const q = k * 114 - 14; const g = "linear-gradient(90deg,transparent 0%,transparent " + q + "%,#000 " + (q + 14) + "%)";
  return <div style={{ WebkitMaskImage: g, maskImage: g }}>{children}</div>;
}

/** Photo qui brûle : exactement le même feu réaliste que l'effet « Flammes » des messages (la photo est consumée par morceaux). */
function Burn({ k, children }: { k: number; children: ReactNode }) {
  const t0 = useRef(0); const [, force] = useState(0);
  if (k > 0 && !t0.current) t0.current = Date.now();
  useEffect(() => { if (k > 0 && t0.current && !started.has(t0.current)) { started.add(t0.current); sceneShow("fire"); const id = setTimeout(() => force((x) => x + 1), 5900); return () => clearTimeout(id); } }, [k > 0]);
  if (t0.current && Date.now() - t0.current > 5800) return null;
  return <div data-fire-target="1" style={{ position: "relative", borderRadius: 14, overflow: "hidden" }}>{children}</div>;
}
const started = new Set<number>();

/** Vidéo qui disparaît dans le brouillard : le même brouillard réaliste que l'effet des messages ; l'image se floute puis s'efface. */
function Fog({ k, children }: { k: number; children: ReactNode }) {
  const t0 = useRef(0); const [, force] = useState(0);
  if (k > 0 && !t0.current) t0.current = Date.now();
  useEffect(() => { if (k > 0 && t0.current && !started.has(t0.current)) { started.add(t0.current); fogShow(); const id = setInterval(() => force((x) => x + 1), 100); setTimeout(() => clearInterval(id), 8000); return () => clearInterval(id); } }, [k > 0]);
  const t = t0.current ? (Date.now() - t0.current) / 1000 : 0;
  if (t0.current && t > 7.2) return null;
  const e = clamp(t / 5.5); const gone = clamp((t - 5.2) / 2);
  return <div style={{ filter: "blur(" + (e * e * 14).toFixed(1) + "px) brightness(" + (1 + e * .3).toFixed(2) + ") saturate(" + (1 - e * .5).toFixed(2) + ")", opacity: 1 - gone, borderRadius: 14, overflow: "hidden" }}>{children}</div>;
}

export function Eph({ kind, id, src, start, total, clear, children }: { kind: "photo" | "mask" | "burn" | "fog"; id: string; src?: string; start: number; total: number; clear: number; children: ReactNode }) {
  const k = useEffectK(start, total, clear);
  return kind === "fog" ? <Fog k={k}>{children}</Fog> : kind === "burn" || kind === "photo" ? <Burn k={k}>{children}</Burn> : <Mask k={k}>{children}</Mask>;
}
