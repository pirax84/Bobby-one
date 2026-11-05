import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { t } from "../i18n";
import { feteUnder, feteOver } from "./fetemotifs";

// Décorations du logo ovale selon la fête (même jour pour tout le monde, d'après la date de l'appareil).
export type Fete = "hal" | "noel" | "val" | "pq" | "ny";
const easter = (y: number) => { const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1; return [mo, da]; };
export function feteOf(d: Date): Fete | null {
  const m = d.getMonth() + 1, j = d.getDate();
  if (m === 10 && j === 31) return "hal";
  if (m === 12 && (j === 24 || j === 25)) return "noel";
  if (m === 2 && j === 14) return "val";
  if ((m === 12 && j === 31) || (m === 1 && j === 1)) return "ny";
  const [em, ej] = easter(d.getFullYear()); if (m === em && j === ej) return "pq";
  return null;
}
export function useFete(): Fete | null {
  const [f, setF] = useState<Fete | null>(() => feteOf(new Date()));
  useEffect(() => { const id = setInterval(() => setF(feteOf(new Date())), 60000); return () => clearInterval(id); }, []);
  return f;
}
// Couleurs réelles des lettres du logo, pour chaque couleur choisie (N, O, T, i, i, F)
const COLS: Record<string, string[]> = {"azur-light": ["#B03FD0", "#E8603B", "#12A596", "#D13F7F", "#E8845A", "#7A63E4"], "azur": ["#C85BE8", "#FF8A6B", "#2FCDBE", "#E5679C", "#FFB59A", "#B9A8FF"], "citron-light": ["#B03FD0", "#E8603B", "#12A596", "#D13F7F", "#E8845A", "#7A63E4"], "citron": ["#C85BE8", "#FF8A6B", "#2FCDBE", "#E5679C", "#FFB59A", "#B9A8FF"], "corail-light": ["#B03FD0", "#2C1711", "#12A596", "#D13F7F", "#E8845A", "#7A63E4"], "corail": ["#C85BE8", "#F3EEFF", "#2FCDBE", "#E5679C", "#FFB59A", "#B9A8FF"], "framboise-light": ["#B03FD0", "#E8603B", "#12A596", "#2C111C", "#E8845A", "#7A63E4"], "framboise": ["#C85BE8", "#FF8A6B", "#2FCDBE", "#F3EEFF", "#FFB59A", "#B9A8FF"], "lavande-light": ["#B03FD0", "#E8603B", "#12A596", "#D13F7F", "#E8845A", "#2A2150"], "lavande": ["#C85BE8", "#FF8A6B", "#2FCDBE", "#E5679C", "#FFB59A", "#F3EEFF"], "miel-light": ["#B03FD0", "#E8603B", "#12A596", "#D13F7F", "#E8845A", "#7A63E4"], "miel": ["#C85BE8", "#FF8A6B", "#2FCDBE", "#E5679C", "#FFB59A", "#B9A8FF"], "ocean-light": ["#B03FD0", "#E8603B", "#12A596", "#D13F7F", "#E8845A", "#7A63E4"], "ocean": ["#C85BE8", "#FF8A6B", "#2FCDBE", "#E5679C", "#FFB59A", "#B9A8FF"], "orchidee-light": ["#26112C", "#E8603B", "#12A596", "#D13F7F", "#E8845A", "#7A63E4"], "orchidee": ["#F3EEFF", "#FF8A6B", "#2FCDBE", "#E5679C", "#FFB59A", "#B9A8FF"], "turquoise-light": ["#B03FD0", "#E8603B", "#0B1F26", "#D13F7F", "#E8845A", "#7A63E4"], "turquoise": ["#C85BE8", "#FF8A6B", "#F3EEFF", "#E5679C", "#FFB59A", "#B9A8FF"]};
const sat = (c: string) => { const n = parseInt(c.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return Math.max(r, g, b) - Math.min(r, g, b) > 60; };
export function FeteOrnaments({ fete, suf, light }: { fete: Fete; suf: string; light: boolean }) {
  const cols = COLS[suf] || COLS.lavande; const pal = cols.filter(sat); const P = (i: number) => pal[i % pal.length];
  const ink = light ? "#2A2150" : "#120F1F"; const wh = light ? "#FFFFFF" : "#F3EEFF"; const skin = light ? "#FBE3D0" : "#FFE6D6";
  const o = P(1), pk = P(3), ma = P(0), tl = P(2), o2 = P(4);
  const pump = (tr: string) => <g transform={tr}><ellipse cx="-11" cy="0" rx="17" ry="20" fill={o} stroke={ink} strokeWidth="3.4" /><ellipse cx="11" cy="0" rx="17" ry="20" fill={o} stroke={ink} strokeWidth="3.4" /><ellipse cx="0" cy="0" rx="12" ry="21" fill={o} stroke={ink} strokeWidth="3.4" /><path d="M-3-20q2-9 8-10" fill="none" stroke={ink} strokeWidth="4.5" strokeLinecap="round" /><path d="M-12-4l5-8 5 8zM3-4l5-8 5 8z" fill={ink} /><path d="M-10 8q10 8 20 0" fill="none" stroke={ink} strokeWidth="3.4" strokeLinecap="round" /></g>;
  const santa = (tr: string, sw: number) => <g transform={tr}><circle cx="0" cy="8" r="44" fill={skin} stroke={ink} strokeWidth={sw} /><path d="M-40 14q-4 50 40 56q44-6 40-56q-14 22-40 22t-40-22z" fill={wh} stroke={ink} strokeWidth={sw} strokeLinejoin="round" /><path d="M-22 26q10-12 22-4q12-8 22 4q-8 8-22 6q-14 2-22-6z" fill={wh} stroke={ink} strokeWidth={sw * 0.8} strokeLinejoin="round" /><circle cx="-15" cy="2" r="5.5" fill={ink} /><circle cx="15" cy="2" r="5.5" fill={ink} /><circle cx="-13.5" cy="0" r="1.8" fill={wh} /><circle cx="16.5" cy="0" r="1.8" fill={wh} /><circle cx="0" cy="15" r="7" fill={o} stroke={ink} strokeWidth={sw * 0.6} /><path d="M-47-18q4-50 47-52q22 0 34 20q10-4 18 0l-4 32z" fill={pk} stroke={ink} strokeWidth={sw} strokeLinejoin="round" /><rect x="-52" y="-24" width="104" height="18" rx="9" fill={wh} stroke={ink} strokeWidth={sw} /><circle cx="62" cy="-48" r="13" fill={wh} stroke={ink} strokeWidth={sw} /></g>;
  const heart = (tr: string, sw: number) => <g transform={tr}><path d="M0 18C-30-4-20-30 0-14C20-30 30-4 0 18z" fill={pk} stroke={ink} strokeWidth={sw} strokeLinejoin="round" /><path d="M-12-6q4-8 9-6" fill="none" stroke={wh} strokeWidth={sw} strokeLinecap="round" opacity=".8" /></g>;
  const egg = (tr: string, sw: number) => <g transform={tr}><ellipse cx="0" cy="0" rx="22" ry="29" fill={ma} stroke={ink} strokeWidth={sw} /><path d="M-21-2q10 8 21 0t21 0" fill="none" stroke={wh} strokeWidth={sw} /><path d="M-19 12q9 7 19 0t19 0" fill="none" stroke={tl} strokeWidth={sw * 0.8} /></g>;
  const chick = (tr: string) => <g transform={tr}><path d="M-28 12q0-34 28-34t28 34q-3 6-28 6t-28-6z" fill={o2} stroke={ink} strokeWidth="5" /><circle cx="-9" cy="-4" r="4" fill={ink} /><circle cx="9" cy="-4" r="4" fill={ink} /><path d="M-6 3l6 8 6-8z" fill={o} stroke={ink} strokeWidth="3" strokeLinejoin="round" /></g>;
  const burst = (x: number, y: number, r: number, c: string) => <g key={x + "-" + y}>{Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return <line key={i} x1={x + Math.cos(a) * r * .45} y1={y + Math.sin(a) * r * .45} x2={x + Math.cos(a) * r} y2={y + Math.sin(a) * r} stroke={c} strokeWidth="7" strokeLinecap="round" />; })}<circle cx={x} cy={y} r="7" fill={c} /></g>;
  const rocket = (x: number, rot: number) => <g transform={`translate(${x} 124) rotate(${rot}) scale(.55)`}><path d="M0-62l16 40h-32z" fill={pk} stroke={ink} strokeWidth="7" strokeLinejoin="round" /><rect x="-16" y="-24" width="32" height="64" rx="6" fill={wh} stroke={ink} strokeWidth="7" /><path d="M-12 40l12 28 12-28z" fill={o2} stroke={ink} strokeWidth="6" strokeLinejoin="round" /></g>;
  let body: ReactNode = null;
  if (fete === "hal") body = <>{pump("translate(646 118) scale(1.55)")}{pump("translate(712 118) scale(1.55)")}{pump("translate(428 202) scale(2.3)")}</>;
  else if (fete === "noel") body = <>{santa("translate(646 122) scale(.5)", 8)}{santa("translate(712 122) scale(.5)", 8)}{santa("translate(428 210) scale(1.3)", 5)}</>;
  else if (fete === "val") body = <>{heart("translate(646 120) scale(1.8) rotate(8)", 4)}{heart("translate(712 120) scale(1.53) rotate(8)", 4)}{heart("translate(428 200) scale(3.4)", 3)}</>;
  else if (fete === "pq") body = <>{egg("translate(646 122) rotate(-10) scale(.9)", 5)}{chick("translate(712 126) scale(.8)")}{egg("translate(428 200) scale(2.3)", 4)}</>;
  else body = <>{rocket(646, -18)}{rocket(712, 22)}{Array.from({ length: 16 }, (_, i) => { const a = i * Math.PI / 8, r = i % 2 ? 52 : 68; return <line key={i} x1={428 + Math.cos(a) * 24} y1={202 + Math.sin(a) * 24} x2={428 + Math.cos(a) * r} y2={202 + Math.sin(a) * r} stroke={P(i)} strokeWidth="9" strokeLinecap="round" />; })}<circle cx="428" cy="202" r="12" fill={P(1)} /></>;
  return <svg className="wmfx" viewBox="0 0 1048 368" aria-hidden="true"><g dangerouslySetInnerHTML={{ __html: feteOver(fete, suf, light) }} />{body}</svg>;
}
export function FeteUnder({ fete, suf, light }: { fete: Fete; suf: string; light: boolean }) {
  return <svg className="wmfx" viewBox="0 0 1048 368" aria-hidden="true" dangerouslySetInnerHTML={{ __html: feteUnder(fete, suf, light) }} />;
}

// Petit message de vœux, juste sous le logo, le jour de la fête
export function FeteBar() {
  const f = useFete(); const [, bump] = useState(0);
  if (!f) return null;
  const key = "notiif-fete-" + f + "-" + new Date().toDateString();
  let off = false; try { off = !!localStorage.getItem(key); } catch { /* ignoré */ }
  if (off) return null;
  const txt = f === "hal" ? t("Joyeux Halloween 🎃") : f === "noel" ? t("Joyeux Noël 🎄") : f === "val" ? t("Bonne Saint-Valentin 💕") : f === "pq" ? t("Joyeuses Pâques 🐣") : t("Bonne année ✨");
  return <div className="fetewrap"><div className="fetebar" role="status"><span>{txt}</span><button type="button" aria-label={t("Fermer le message de fête")} onClick={() => { try { localStorage.setItem(key, "1"); } catch { /* ignoré */ } bump((x) => x + 1); }}>✕</button></div></div>;
}
