import { useEffect, useMemo, useRef, useState } from "react";
import { t } from "../i18n";

let current: HTMLAudioElement | null = null;
const bars = (src: string, n: number) => { let h = 2166136261; for (let i = 0; i < Math.min(src.length, 400); i += 3) { h ^= src.charCodeAt(i); h = Math.imul(h, 16777619); } const out: number[] = []; for (let i = 0; i < n; i++) { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; out.push(0.25 + ((h >>> 0) % 1000) / 1000 * 0.75); } return out; };
const mm = (n: number) => (isFinite(n) ? Math.floor(n / 60) + ":" + String(Math.floor(n % 60)).padStart(2, "0") : "0:00");

/** Message vocal : bouton lecture + onde en barres qui se remplit. */
export function AudioWave({ src, autoPlay = false, mine = false, onEnded, onTime, onLevel }: { src: string; autoPlay?: boolean; mine?: boolean; onEnded?: () => void; onTime?: (cur: number, dur: number) => void; onLevel?: (level: number) => void }) {
  const au = useRef<HTMLAudioElement>(null); const [play, setPlay] = useState(false); const [cur, setCur] = useState(0); const [dur, setDur] = useState(0); const B = useMemo(() => bars(src, 34), [src]);
  // Niveau sonore en direct (pour animer le micro quand ça parle).
  const ac = useRef<{ ctx: AudioContext; an: AnalyserNode } | null>(null);
  useEffect(() => { if (!onLevel || !play) { if (!play) onLevel?.(0); return; } const a = au.current; if (!a) return; let raf = 0; let dead = false;
    try { if (!ac.current) { const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext); const ctx = new Ctx(); const src2 = ctx.createMediaElementSource(a); const an = ctx.createAnalyser(); an.fftSize = 256; src2.connect(an); an.connect(ctx.destination); ac.current = { ctx, an }; } void ac.current.ctx.resume(); } catch { return; }
    const buf = new Uint8Array(ac.current!.an.frequencyBinCount); const loop = () => { if (dead) return; ac.current!.an.getByteTimeDomainData(buf); let sum = 0; for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; } onLevel(Math.min(1, Math.sqrt(sum / buf.length) * 4)); raf = requestAnimationFrame(loop); }; loop();
    return () => { dead = true; cancelAnimationFrame(raf); }; }, [play, onLevel]);
  useEffect(() => { if (autoPlay) void au.current?.play().catch(() => {}); }, [autoPlay]);
  const toggle = () => { const a = au.current; if (!a) return; if (a.paused) { if (current && current !== a) current.pause(); current = a; void a.play().catch(() => {}); } else a.pause(); };
  const seek = (e: React.MouseEvent<HTMLDivElement>) => { e.stopPropagation(); const a = au.current; if (!a || !isFinite(a.duration)) return; const r = e.currentTarget.getBoundingClientRect(); a.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * a.duration; };
  const p = dur ? cur / dur : 0;
  return (<div className={"awave" + (mine ? " mine" : "")} onClick={(e) => e.stopPropagation()}>
    <audio ref={au} src={src} preload="metadata" onPlay={() => setPlay(true)} onPause={() => setPlay(false)} onEnded={() => { setPlay(false); setCur(0); onEnded?.(); }} onLoadedMetadata={(e) => { const d = e.currentTarget.duration; if (isFinite(d)) setDur(d); }} onDurationChange={(e) => { const d = e.currentTarget.duration; if (isFinite(d)) setDur(d); }} onTimeUpdate={(e) => { setCur(e.currentTarget.currentTime); onTime?.(e.currentTarget.currentTime, e.currentTarget.duration); }} />
    <button type="button" className="awplay" onClick={toggle} aria-label={play ? t("Pause") : t("Lecture")}>{play ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.5" /><rect x="14" y="5" width="4" height="14" rx="1.5" /></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.9l10-6.5a1 1 0 0 0 0-1.8l-10-6.5A1 1 0 0 0 8 5.5z" /></svg>}</button>
    <div className="awbars" onClick={seek} role="slider" aria-label={t("Position")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p * 100)}>{B.map((h, i) => <i key={i} className={i / B.length <= p ? "on" : ""} style={{ height: `${Math.round(h * 100)}%` }} />)}</div>
    <small className="awtime">{mm(play || cur ? cur : dur)}</small></div>);
}
