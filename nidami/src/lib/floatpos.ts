import { useEffect, useRef, useState } from "react";

/**
 * Position d'un bouton flottant (bulle des messages, bulle du micro…), gardée en POURCENTAGE de l'écran.
 * Ainsi, quand on tourne le téléphone ou qu'on rétrécit la fenêtre du PC, le bouton reste toujours visible.
 */
type P = { x: number; y: number };
type F = { fx: number; fy: number };
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), Math.max(a, b));
const W = () => (typeof innerWidth === "number" ? innerWidth : 400); const H = () => (typeof innerHeight === "number" ? innerHeight : 800);
const toPx = (f: F, size: number): P => ({ x: clamp(f.fx * (W() - size), 4, W() - size - 4), y: clamp(f.fy * (H() - size), 4, H() - size - 4) });
const toFr = (p: P, size: number): F => ({ fx: clamp(p.x / Math.max(1, W() - size), 0, 1), fy: clamp(p.y / Math.max(1, H() - size), 0, 1) });

function load(key: string, size: number): F | null {
  try {
    const j = JSON.parse(localStorage.getItem(key) || "null");
    if (j && typeof j.fx === "number" && typeof j.fy === "number") return { fx: clamp(j.fx, 0, 1), fy: clamp(j.fy, 0, 1) };
    if (j && typeof j.x === "number" && typeof j.y === "number") return toFr({ x: j.x, y: j.y }, size); // ancien format (pixels)
  } catch { /* ignoré */ }
  return null;
}

/** Renvoie [position en pixels ou null si jamais déplacé, déplacer, enregistrer]. */
export function useFloatPos(key: string, size: number, fallback?: () => P): [P | null, (p: P) => void, () => void] {
  const fr = useRef<F | null>(load(key, size));
  const [pos, setPos] = useState<P | null>(() => fr.current ? toPx(fr.current, size) : fallback ? fallback() : null);
  useEffect(() => {
    const fit = () => { if (fr.current) setPos(toPx(fr.current, size)); else if (fallback) setPos(fallback()); };
    addEventListener("resize", fit); addEventListener("orientationchange", fit);
    return () => { removeEventListener("resize", fit); removeEventListener("orientationchange", fit); };
  }, [key, size]);
  const move = (p: P) => { const q = { x: clamp(p.x, 4, W() - size - 4), y: clamp(p.y, 4, H() - size - 4) }; fr.current = toFr(q, size); setPos(q); };
  const save = () => { if (fr.current) try { localStorage.setItem(key, JSON.stringify(fr.current)); } catch { /* ignoré */ } };
  return [pos, move, save];
}
