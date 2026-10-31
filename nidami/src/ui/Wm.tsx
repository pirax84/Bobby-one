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
export function VideoWm({ src, label, poster = false, bare = false, plain = false, onEnded, onTime }: { src: string; label: string; poster?: boolean; bare?: boolean; plain?: boolean; onEnded?: () => void; onTime?: (cur: number, dur: number) => void }) {
  const wm = `${label} · NOTIIF · ${new Date().toLocaleDateString(locale())}`;
  const vid = useRef<HTMLVideoElement>(null); const [started, setStarted] = useState(false); const [playing, setPlaying] = useState(false); const [cur, setCur] = useState(0); const [dur, setDur] = useState(0); const [barOn, setBarOn] = useState(true); const hide = useRef<number | undefined>(undefined);
  const flash = () => { setBarOn(true); clearTimeout(hide.current); hide.current = window.setTimeout(() => setBarOn(false), 2200); }; useEffect(() => () => clearTimeout(hide.current), []);
  const custom = !poster && !bare; const mmss = (n: number) => { const m = Math.floor(n / 60), x = Math.floor(n % 60); return `${m}:${x < 10 ? "0" : ""}${x}`; };
  const toggle = () => { const v = vid.current; if (!v) return; if (v.paused) { setStarted(true); void v.play().catch(() => {}); flash(); } else { v.pause(); clearTimeout(hide.current); setBarOn(true); } };
  const tap = () => { const v = vid.current; if (!v) return; if (!v.paused && !barOn) flash(); else toggle(); };
  const jump = (d: number) => { const v = vid.current; if (v) v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + d)); };
  return <div className="vwrap protected" onContextMenu={(e) => e.preventDefault()}>
    <video ref={vid} src={custom ? src + "#t=0.1" : src} controls={false} autoPlay={bare} muted={poster} playsInline preload={bare ? "auto" : "metadata"} onClick={custom ? (e) => { e.stopPropagation(); tap(); } : undefined}
      onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onLoadedMetadata={(e) => setDur(e.currentTarget.duration || 0)}
      onEnded={() => { setPlaying(false); onEnded?.(); }} onTimeUpdate={(e) => { setCur(e.currentTarget.currentTime); onTime?.(e.currentTarget.currentTime, e.currentTarget.duration); }} controlsList="nodownload noremoteplayback" disablePictureInPicture onContextMenu={(e) => e.preventDefault()} />
    {custom && started && <div className={"vbar" + (barOn ? "" : " off")} onClick={(e) => { e.stopPropagation(); flash(); }} onPointerDown={(e) => e.stopPropagation()}>
      <button type="button" onClick={() => { jump(-10); flash(); }} aria-label="−10 s"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg></button>
      <button type="button" onClick={() => { toggle(); }} aria-label={playing ? "⏸" : "▶"}>{playing ? (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 5v14M16 5v14" /></svg>) : (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4l13 8-13 8z" fill="currentColor" /></svg>)}</button>
      <button type="button" onClick={() => { jump(10); flash(); }} aria-label="+10 s"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v5h-5" /></svg></button>
      <input type="range" min={0} max={dur || 1} step={0.1} value={Math.min(cur, dur || 1)} onChange={(e) => { const v = vid.current; if (v) v.currentTime = Number(e.target.value); flash(); }} aria-label="0:00" />
      <span>{mmss(cur)}</span></div>}
    {!plain && <div className="vwm" aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <span key={i}>{wm}</span>)}</div>}</div>;
}
