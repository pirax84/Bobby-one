import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { t } from "../i18n";
import { useScrollLock, toast } from "./common";

const hasFilter = (g: CanvasRenderingContext2D): boolean => "filter" in g;
const loadImg = (src: string) => new Promise<HTMLImageElement>((ok, ko) => { const im = new Image(); im.onload = () => ok(im); im.onerror = ko; im.src = src; });

// ───────── Cadrage : on déplace et on zoome la photo dans son rectangle
export interface Frame { x: number; y: number; z: number }
export const FRAME0: Frame = { x: 0, y: 0, z: 1 };
const FA = 4 / 5; // le rectangle (largeur / hauteur)

/** Dessine le cadrage choisi dans une vraie image (fond flou de la même photo autour si elle ne remplit pas tout). */
export async function bakeFrame(src: string, f: Frame): Promise<string> {
  if (f.z <= 1.001) return src;
  const im = await loadImg(src); const W = 1080, H = Math.round(W / FA); const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d")!;
  const cover = Math.max(W / im.naturalWidth, H / im.naturalHeight);
  g.save(); if ("filter" in g) g.filter = "blur(24px) brightness(.85)"; g.drawImage(im, W / 2 - (im.naturalWidth * cover * 1.15) / 2, H / 2 - (im.naturalHeight * cover * 1.15) / 2, im.naturalWidth * cover * 1.15, im.naturalHeight * cover * 1.15); g.restore();
  const fit = Math.min(W / im.naturalWidth, H / im.naturalHeight) * f.z; const w = im.naturalWidth * fit, h = im.naturalHeight * fit;
  g.drawImage(im, W / 2 + f.x * W - w / 2, H / 2 + f.y * H - h / 2, w, h);
  return c.toDataURL("image/jpeg", 0.88);
}

export function Framer({ src, frame, onChange }: { src: string; frame: Frame; onChange: (f: Frame) => void }) {
  const box = useRef<HTMLDivElement>(null); const drag = useRef<{ sx: number; sy: number; fx: number; fy: number } | null>(null); const pts = useRef(new Map<number, { x: number; y: number }>()); const pinch = useRef<{ d: number; z: number } | null>(null);
  const clamp = (f: Frame): Frame => { const m = Math.max(0, (f.z - 1) * 0.5 + 0.15); return { z: Math.min(4, Math.max(1, f.z)), x: f.z <= 1 ? 0 : Math.min(m, Math.max(-m, f.x)), y: f.z <= 1 ? 0 : Math.min(m, Math.max(-m, f.y)) }; };
  const down = (e: React.PointerEvent) => { (e.currentTarget as Element).setPointerCapture?.(e.pointerId); pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.current.size === 1) drag.current = { sx: e.clientX, sy: e.clientY, fx: frame.x, fy: frame.y }; else if (pts.current.size === 2) { const [a, b] = [...pts.current.values()]; pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), z: frame.z }; drag.current = null; } };
  const move = (e: React.PointerEvent) => {
    if (!pts.current.has(e.pointerId)) return; pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); const r = box.current!.getBoundingClientRect();
    if (pts.current.size === 2 && pinch.current) { const [a, b] = [...pts.current.values()]; onChange(clamp({ ...frame, z: pinch.current.z * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.current.d) })); }
    else if (drag.current) onChange(clamp({ ...frame, x: drag.current.fx + (e.clientX - drag.current.sx) / r.width, y: drag.current.fy + (e.clientY - drag.current.sy) / r.height }));
  };
  const up = (e: React.PointerEvent) => { pts.current.delete(e.pointerId); pinch.current = null; drag.current = null; if (pts.current.size === 1) { const [p] = [...pts.current.values()]; drag.current = { sx: p.x, sy: p.y, fx: frame.x, fy: frame.y }; } };
  return <div className="col" style={{ gap: 6, alignItems: "center" }}>
    <div ref={box} className="framer" style={{ aspectRatio: String(FA), touchAction: "none" }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} role="img" aria-label={t("Photo : déplace avec le doigt, zoome avec deux doigts")}>
      <img className="fbg" src={src} alt="" draggable={false} />
      <img className="ffg" src={src} alt="" draggable={false} style={{ transform: `translate(${frame.x * 100}%, ${frame.y * 100}%) scale(${frame.z})` }} />
    </div>
    <div className="row" style={{ gap: 8, width: "100%", alignItems: "center" }}><span aria-hidden="true">🔍</span><input type="range" min="1" max="4" step="0.05" value={frame.z} onChange={(e) => onChange(clamp({ ...frame, z: Number(e.target.value) }))} aria-label={t("Zoom")} style={{ flex: 1 }} /><button type="button" className="btn sm" onClick={() => onChange(FRAME0)}>{t("Recentrer")}</button></div>
    <span className="muted small center">{t("Touche et glisse pour déplacer · deux doigts ou la barre pour zoomer")}</span>
  </div>;
}

// ───────── Cacher des visages (flou ou smiley)
interface Face { x: number; y: number; r: number; on: boolean } // x, y, r : fractions de la largeur de la photo

type Box = { x: number; y: number; width: number; height: number };
const mk = (b: Box, im: HTMLImageElement): Face => ({ x: (b.x + b.width / 2) / im.naturalWidth, y: (b.y + b.height / 2) / im.naturalWidth, r: Math.max(b.width, b.height) * 0.62 / im.naturalWidth, on: false });
let mp: Promise<{ detect: (i: HTMLImageElement) => { detections: { boundingBox?: { originX: number; originY: number; width: number; height: number } }[] } }> | null = null;
/** Détecteur de secours (MediaPipe, chargé seulement à la demande) quand le navigateur n'en a pas. */
function loadMp() {
  if (!mp) mp = (async () => {
    const base = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
    const mod = await import(/* @vite-ignore */ base + "/vision_bundle.mjs");
    const fs = await mod.FilesetResolver.forVisionTasks(base + "/wasm");
    return mod.FaceDetector.createFromOptions(fs, { baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite" }, runningMode: "IMAGE", minDetectionConfidence: 0.35 });
  })();
  return mp;
}
const timeout = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<T>((_, ko) => setTimeout(() => ko(new Error("lent")), ms))]);
async function detect(im: HTMLImageElement): Promise<Face[]> {
  try {
    const FD = (window as unknown as { FaceDetector?: new (o?: object) => { detect: (i: CanvasImageSource) => Promise<{ boundingBox: DOMRectReadOnly }[]> } }).FaceDetector;
    if (FD) { const res = await new FD({ fastMode: false, maxDetectedFaces: 12 }).detect(im); if (res.length) return res.map((f) => mk(f.boundingBox, im)); }
  } catch { /* on essaie l'autre détecteur */ }
  try {
    const det = await timeout(loadMp(), 25000); const r = det.detect(im);
    return r.detections.filter((d) => d.boundingBox).map((d) => mk({ x: d.boundingBox!.originX, y: d.boundingBox!.originY, width: d.boundingBox!.width, height: d.boundingBox!.height }, im));
  } catch { mp = null; return []; }
}

/** Dessine les visages choisis dans la photo : flou réel ou smiley par-dessus un flou. */
export async function hideFaces(src: string, faces: Face[], mode: "blur" | "smiley"): Promise<string> {
  const im = await loadImg(src); const W = im.naturalWidth, H = im.naturalHeight; const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d")!; g.drawImage(im, 0, 0);
  for (const f of faces.filter((x) => x.on)) {
    const cx = f.x * W, cy = f.y * W, r = f.r * W * 1.12;
    g.save(); g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.clip();
    if (hasFilter(g)) { g.filter = `blur(${Math.max(8, r * 0.45)}px)`; g.drawImage(im, 0, 0); g.filter = "none"; }
    else { const s = document.createElement("canvas"); const k = Math.max(4, Math.round(r / 5)); s.width = k; s.height = k; s.getContext("2d")!.drawImage(im, cx - r, cy - r, r * 2, r * 2, 0, 0, k, k); g.imageSmoothingEnabled = true; g.drawImage(s, 0, 0, k, k, cx - r, cy - r, r * 2, r * 2); }
    g.restore();
    if (mode === "smiley") { g.save(); g.font = `${Math.round(r * 2.1)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("😀", cx, cy + r * 0.08); g.restore(); }
  }
  return c.toDataURL("image/jpeg", 0.9);
}

export function FaceHide({ src, onDone, onClose }: { src: string; onDone: (u: string) => void; onClose: () => void }) {
  useScrollLock();
  const [faces, setFaces] = useState<Face[]>([]); const [mode, setMode] = useState<"blur" | "smiley">("blur"); const [sel, setSel] = useState<number | null>(null); const [busy, setBusy] = useState(true); const [auto, setAuto] = useState(true);
  const [ratio, setRatio] = useState(1); const box = useRef<HTMLDivElement>(null); const drag = useRef<{ i: number; dx: number; dy: number; moved: boolean } | null>(null);
  useEffect(() => { let dead = false; loadImg(src).then(async (im) => { if (dead) return; setRatio(im.naturalHeight / im.naturalWidth); const f = await detect(im); if (dead) return; setFaces(f); setAuto(f.length > 0); setBusy(false); }).catch(() => setBusy(false)); return () => { dead = true; }; }, [src]);
  const toRel = (e: React.PointerEvent) => { const r = box.current!.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.width }; };
  const add = () => { setFaces((f) => [...f, { x: 0.5, y: Math.min(0.5, ratio / 2), r: 0.1, on: true }]); setSel(faces.length); };
  const down = (i: number) => (e: React.PointerEvent) => { e.stopPropagation(); (e.currentTarget as Element).setPointerCapture?.(e.pointerId); const p = toRel(e); drag.current = { i, dx: faces[i].x - p.x, dy: faces[i].y - p.y, moved: false }; };
  const move = (e: React.PointerEvent) => { const d = drag.current; if (!d) return; const p = toRel(e); const nx = p.x + d.dx, ny = p.y + d.dy; if (!d.moved && Math.hypot(nx - faces[d.i].x, ny - faces[d.i].y) < 0.01) return; d.moved = true; setFaces((f) => f.map((x, k) => (k === d.i ? { ...x, x: Math.min(1, Math.max(0, nx)), y: Math.min(ratio, Math.max(0, ny)) } : x))); };
  const up = () => { const d = drag.current; drag.current = null; if (d && !d.moved) { setFaces((f) => f.map((x, k) => (k === d.i ? { ...x, on: !x.on } : x))); setSel(d.i); } };
  const apply = async () => { setBusy(true); try { onDone(await hideFaces(src, faces, mode)); } catch { toast(t("Impossible de modifier cette photo.")); setBusy(false); } };
  const count = faces.filter((f) => f.on).length;
  return createPortal(<div className="cam fhscreen" style={{ justifyContent: "flex-start", overflow: "auto", padding: 14, gap: 12 }} role="dialog" aria-label={t("Cacher des visages")}>
    <div className="row" style={{ width: "min(520px,100%)", gap: 8 }}><b className="grow" style={{ color: "#fff", fontSize: "1.1rem" }}>{t("🙂 Cacher des visages")}</b><button className="fhb" style={{ padding: "6px 12px" }} onClick={onClose} aria-label={t("Fermer")}>✕</button></div>
    <p style={{ color: "#fff", opacity: .85, margin: 0, width: "min(520px,100%)", fontSize: ".9rem" }}>{busy ? t("Recherche des visages…") : auto ? t("Touche un visage pour le cacher ou le montrer. Rond turquoise = caché.") : t("Aucun visage trouvé automatiquement : ajoute un rond et place-le sur le visage.")}</p>
    <div ref={box} className="fhbox" style={{ aspectRatio: `${1} / ${ratio}`, width: "min(520px,100%)" }} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <img src={src} alt="" draggable={false} style={{ width: "100%", height: "100%", display: "block", userSelect: "none" }} />
      {faces.map((f, i) => <button key={i} type="button" className={"fhc" + (f.on ? " on" : "") + (sel === i ? " sel" : "")} aria-pressed={f.on} aria-label={t("Visage {n}", { n: i + 1 })} onPointerDown={down(i)} style={{ left: `${(f.x - f.r) * 100}%`, top: `${((f.y - f.r) / ratio) * 100}%`, width: `${f.r * 200}%`, height: `${(f.r * 2 / ratio) * 100}%`, touchAction: "none" }}>{f.on && mode === "smiley" ? "😀" : ""}</button>)}
    </div>
    {sel !== null && faces[sel] && <div className="row" style={{ width: "min(520px,100%)", gap: 8, color: "#fff", alignItems: "center" }}><span>{t("Taille")}</span><input type="range" min="0.03" max="0.35" step="0.005" value={faces[sel].r} onChange={(e) => setFaces((f) => f.map((x, k) => (k === sel ? { ...x, r: Number(e.target.value) } : x)))} style={{ flex: 1 }} aria-label={t("Taille")} /><button className="fhb" style={{ padding: "8px 12px" }} onClick={() => { setFaces((f) => f.filter((_, k) => k !== sel)); setSel(null); }}>{t("Supprimer")}</button></div>}
    <div className="row" style={{ width: "min(520px,100%)", gap: 8 }}>
      <button className={"fhb" + (mode === "blur" ? " on" : "")} style={{ flex: 1 }} onClick={() => setMode("blur")}>{t("💧 Flou")}</button>
      <button className={"fhb" + (mode === "smiley" ? " on" : "")} style={{ flex: 1 }} onClick={() => setMode("smiley")}>{t("😀 Smiley")}</button></div>
    <button className="fhb" style={{ width: "min(520px,100%)" }} onClick={add}>{t("➕ Ajouter un rond à la main")}</button>
    <button className="btn" style={{ width: "min(520px,100%)" }} disabled={busy || count === 0} onClick={apply}>{count ? t("{n, plural, one{Cacher # visage} other{Cacher # visages}}", { n: count }) : t("Choisis au moins un visage")}</button>
  </div>, document.body);
}
