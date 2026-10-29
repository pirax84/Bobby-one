import { useEffect, useRef, useState } from "react";
import { t, locale } from "../i18n";

// Image dessinée dans un <canvas> avec un filigrane « incrusté » dans les pixels : si quelqu'un l'enregistre ou la
// copie, le filigrane (nom du destinataire + date) est dedans. Il dissuade et permet de retrouver la source d'une fuite.
// Il n'empêche PAS une capture d'écran ou une photo de l'écran.
export function WmImage({ src, label, alt, className = "photo", style, plain = false }: { src: string; label: string; alt: string; plain?: boolean; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLCanvasElement>(null); const [ratio, setRatio] = useState(4 / 3);
  useEffect(() => {
    const im = new Image(); let dead = false;
    im.onload = () => { if (dead || !ref.current) return; const c = ref.current; const W = Math.min(1000, im.naturalWidth), H = Math.round(W * im.naturalHeight / im.naturalWidth); c.width = W; c.height = H; setRatio(W / H);
      const g = c.getContext("2d")!; g.drawImage(im, 0, 0, W, H); if (plain) return; const t = `${label} · NOTIIF · ${new Date().toLocaleDateString(locale())}`; const fs = Math.max(12, Math.round(W / 46));
      g.save(); g.rotate(-Math.PI / 7); g.font = `700 ${fs}px system-ui,sans-serif`; g.textBaseline = "middle";
      const step = fs * 4.2, tw = g.measureText(t).width + fs * 3;
      for (let y = -W; y < H + W; y += step) for (let x = -W, k = 0; x < W * 2; x += tw, k++) { const xx = x + ((y / step) % 2 ? tw / 2 : 0); g.fillStyle = "rgba(0,0,0,.28)"; g.fillText(t, xx + 1.5, y + 1.5); g.fillStyle = "rgba(255,255,255,.34)"; g.fillText(t, xx, y); }
      g.restore(); };
    im.src = src; return () => { dead = true; };
  }, [src, label, plain]);
  return <canvas ref={ref} className={className} style={{ aspectRatio: String(ratio), height: "auto", ...style }} role="img" aria-label={alt} onContextMenu={(e) => e.preventDefault()} draggable={false} />;
}

// Mesures « raisonnables » contre les captures, côté navigateur. Elles ne sont PAS infaillibles (voir CGU art. 6).
export function useCaptureGuard(onSuspect: () => void, active: boolean) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (!active) return;
    const hide = () => setHidden(true), show = () => setHidden(false); let last = 0;
    const vis = () => (document.hidden ? hide() : show());
    const key = (e: KeyboardEvent) => { const k = e.key.toLowerCase(); if (k === "printscreen" || (e.metaKey && e.shiftKey && ["3", "4", "5", "s"].includes(k)) || (e.ctrlKey && (k === "p" || k === "s")) || (e.metaKey && ["p", "s"].includes(k))) { e.preventDefault(); hide(); if (Date.now() - last > 1500) { last = Date.now(); onSuspect(); } navigator.clipboard?.writeText(t("Capture bloquée par NOTIIF")).catch(() => {}); setTimeout(show, 2500); } };
    document.addEventListener("visibilitychange", vis); window.addEventListener("blur", hide); window.addEventListener("focus", show); window.addEventListener("keydown", key); window.addEventListener("keyup", key);
    return () => { document.removeEventListener("visibilitychange", vis); window.removeEventListener("blur", hide); window.removeEventListener("focus", show); window.removeEventListener("keydown", key); window.removeEventListener("keyup", key); };
  }, [active]);
  return hidden;
}

/** Vidéo avec filigrane par-dessus (nom du spectateur + date). Pas de bouton de téléchargement ; ce n'est pas une protection absolue. */
export function VideoWm({ src, label, poster = false, bare = false, onEnded, onTime }: { src: string; label: string; poster?: boolean; bare?: boolean; onEnded?: () => void; onTime?: (cur: number, dur: number) => void }) {
  const t = `${label} · NOTIIF · ${new Date().toLocaleDateString(locale())}`;
  return <div className="vwrap protected" onContextMenu={(e) => e.preventDefault()}>
    <video src={src} controls={!poster && !bare} autoPlay={bare} muted={poster} playsInline preload={bare ? "auto" : "metadata"} onEnded={onEnded} onTimeUpdate={(e) => onTime?.(e.currentTarget.currentTime, e.currentTarget.duration)} controlsList="nodownload noremoteplayback" disablePictureInPicture onContextMenu={(e) => e.preventDefault()} />
    <div className="vwm" aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <span key={i}>{t}</span>)}</div></div>;
}
