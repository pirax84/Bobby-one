import { ReactNode, useEffect, useState } from "react";
import { useStore, type User } from "../lib/store";

const P: Record<string, string> = {
  home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  users: "M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0zM4 21c0-4 3.6-7 8-7s8 3 8 7",
  group: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20c0-3.5 3-6 7-6s7 2.5 7 6M17 5a3 3 0 0 1 0 6M19 14c2 .6 3 2.5 3 5",
  chat: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z",
  game: "M6 8h12a4 4 0 0 1 4 4v3a3 3 0 0 1-5.4 1.8L15 15H9l-1.6 1.8A3 3 0 0 1 2 15v-3a4 4 0 0 1 4-4zM8 10.5v3M6.5 12h3M16 11h.01M18 13h.01",
  cal: "M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM3 9h18M8 2v4M16 2v4",
  img: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3 16l5-5 5 5 3-3 5 5M9 9.5h.01",
  bell: "M6 17V11a6 6 0 1 1 12 0v6l2 2H4zM10 21a2 2 0 0 0 4 0",
  user: "M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM4 21c0-4.4 3.6-7 8-7s8 2.6 8 7",
  cog: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  plus: "M12 5v14M5 12h14",
  x: "M6 6l12 12M18 6L6 18",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  lock: "M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM8 11V8a4 4 0 0 1 8 0v3",
  send: "M3 11l18-8-8 18-2-8z",
  video: "M3 7h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H3zM16 11l5-3v8l-5-3",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
  pin: "M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  back: "M15 5l-7 7 7 7",
};
export const Ico = ({ n, s = 22 }: { n: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={P[n] || P.more} /></svg>
);
export const Logo = ({ s = 44 }: { s?: number }) => <img src="./icon.svg" width={s} height={s} alt="Logo" style={{ borderRadius: s * 0.24 }} />;

export function Avatar({ u, s = 44 }: { u?: User; s?: number }) {
  const me = useStore((x) => x.me); const isFriend = useStore((x) => !!u && (x.social.friends[x.me] || []).includes(u.id));
  if (!u) return <div className="av" style={{ width: s, height: s, background: "#555" }}>?</div>;
  const vis = u.avatarVis || "friends"; const show = !!u.avatar && (u.id === me || vis === "all" || (vis === "friends" && isFriend));
  const st: React.CSSProperties = show ? { backgroundImage: `url(${u.avatar})` } : { background: `linear-gradient(135deg,hsl(${u.hue} 80% 62%),hsl(${(u.hue + 50) % 360} 75% 48%))` };
  return <div className="av" style={{ width: s, height: s, fontSize: s * 0.42, ...st }} aria-label={u.name}>{show ? "" : u.name.slice(0, 1).toUpperCase()}</div>;
}
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  return (<div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="modal" role="dialog" aria-modal="true" aria-label={title}>
    <div className="row" style={{ marginBottom: 12 }}><h2 className="grow" style={{ fontSize: "1.2rem" }}>{title}</h2><button className="btn ghost sm" onClick={onClose} aria-label="Fermer"><Ico n="x" s={18} /></button></div>{children}</div></div>);
}
let toastSet: ((s: string) => void) | null = null;
export const toast = (s: string) => toastSet?.(s);
export function ToastHost() { const [m, setM] = useState(""); useEffect(() => { toastSet = (s) => { setM(s); setTimeout(() => setM((x) => (x === s ? "" : x)), 3500); }; return () => { toastSet = null; }; }, []); return m ? <div className="toast" role="status">{m}</div> : null; }

export function ago(t: number, n = Date.now()) { const d = Math.max(0, n - t) / 1000; if (d < 60) return "à l'instant"; if (d < 3600) return `il y a ${Math.floor(d / 60)} min`; if (d < 86400) return `il y a ${Math.floor(d / 3600)} h`; return new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }); }
// Réduit la photo avant de la garder (légère, rapide à charger).
export function fileToDataUrl(f: File, max = 960, q = 0.74): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onerror = () => rej(new Error("lecture")); r.onload = () => { const im = new Image(); im.onerror = () => rej(new Error("image")); im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext("2d")!.drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", q)); }; im.src = String(r.result); }; r.readAsDataURL(f); });
}
export const BG = ["linear-gradient(135deg,#8B5CF6,#3B82F6)", "linear-gradient(135deg,#FF9A5A,#F43F5E)", "linear-gradient(135deg,#10B981,#0EA5E9)", "linear-gradient(135deg,#F472B6,#8B5CF6)", "linear-gradient(135deg,#F59E0B,#EF4444)"];
export const EMOJIS = ["❤️", "😂", "😮", "😢", "👏", "🔥"];
export const EMOJI_GROUPS: [string, string[]][] = [
  ["Visages", ["😀", "😃", "😄", "😁", "😆", "🥹", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😍", "🥰", "😘", "😋", "😛", "😜", "🤪", "🤗", "🤭", "🤔", "😎", "🤩", "🥳", "😏", "😌", "😴", "😢", "😭", "🥺", "😮", "😱", "😡", "🤯", "🥶", "🥵", "🤒", "🤮"]],
  ["Mains", ["👍", "👎", "👏", "🙌", "🙏", "🤝", "💪", "✌️", "🤞", "👌", "🤟", "🫶", "👋", "🤙", "☝️", "🫡"]],
  ["Cœurs", ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💖", "💗", "💕", "💞", "💝", "💘", "💔", "✨", "💯"]],
  ["Fête et nature", ["🎉", "🎂", "🎁", "🎈", "🍾", "🥂", "🍕", "🍔", "🍟", "🍰", "☕", "🍷", "🌞", "🌈", "🌸", "🌳", "🐶", "🐱", "🦋", "🐻", "⚽", "🎶", "📸", "🏖️", "🚗", "✈️", "🏡", "🔥", "⭐", "🌙"]],
];
export function EmojiGrid({ onPick }: { onPick: (e: string) => void }) {
  return <div className="egrid">{EMOJI_GROUPS.map(([t, l]) => <div key={t}><div className="muted small" style={{ margin: "6px 2px" }}>{t}</div><div className="erow">{l.map((e) => <button type="button" key={e} onClick={() => onPick(e)} aria-label={e}>{e}</button>)}</div></div>)}</div>;
}
export function useNow(ms = 1000) { const [t, setT] = useState(Date.now()); useEffect(() => { const i = setInterval(() => setT(Date.now()), ms); return () => clearInterval(i); }, [ms]); return t; }

/** Interrupteur (à la place des cases à cocher). */
export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className={"switch" + (on ? " on" : "")} onClick={() => onChange(!on)}><span /></button>;
}
