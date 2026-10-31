import { ReactNode, useEffect, useState } from "react";
import { useStore, type User } from "../lib/store";
import { t, T, locale } from "../i18n";

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
  mic: "M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM6 11a6 6 0 0 0 12 0M12 17v4M9 21h6",
  smile: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8.5 14a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01",
  video: "M3 7h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H3zM16 11l5-3v8l-5-3",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
  pin: "M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  apps: "M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z",
  back: "M15 5l-7 7 7 7",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3",
};
export const Ico = ({ n, s = 22 }: { n: string; s?: number }) => (
  <svg className={n === "back" ? "ico-flip" : undefined} width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={P[n] || P.more} /></svg>
);
/** Bulle de BD dessinée à la main : l'aperçu de la story remplit toute la forme, avec un contour aux couleurs de l'application. */
export function Wreath({ img, video, bg, icon }: { img?: string | null; video?: string | null; bg?: string; icon?: string }) {
  return <><svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true"><clipPath id="bubbleclip" clipPathUnits="objectBoundingBox"><path transform="scale(0.01)" d="M17 12C40 5 70 5 86 13C97 22 96 55 89 70C85 79 70 81 62 80C57 81 57 88 64 95C53 91 47 85 44 80C29 81 13 78 8 66C2 50 6 22 17 12Z" /></clipPath></svg>
    <span className="wmedia" style={{ background: bg || "var(--grad)" }}>{img ? <img src={img} alt="" /> : video ? <video src={video} muted playsInline preload="metadata" /> : icon ? <span className="wicon">{icon}</span> : null}</span>
    <svg className="wreathsvg" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="wg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--brand)" /><stop offset="1" stopColor="var(--brand2)" /></linearGradient></defs>
      <g className="wl" fill="none" strokeLinecap="round" strokeLinejoin="round"><path strokeWidth="4.2" d="M17 12C40 5 70 5 86 13C97 22 96 55 89 70C85 79 70 81 62 80C57 81 57 88 64 95C53 91 47 85 44 80C29 81 13 78 8 66C2 50 6 22 17 12Z" /><path strokeWidth="1.8" opacity=".75" d="M19 9C42 3 72 4 88 11C99 21 99 56 91 72C86 82 71 83 63 82" /></g></svg></>;
}
export const Logo = ({ s = 44 }: { s?: number }) => <img src={s > 96 ? "./logo-512.png" : "./logo-192.png"} width={s} height={s} alt={t("Logo NOTIIF")} style={{ borderRadius: s * 0.24 }} />;

const SHAPES: Record<string, string> = { puffy: "M50.0 0.0C57.6 -0.0 65.3 10.9 72.9 16.4C80.5 22.0 93.3 25.9 95.7 33.2C98.0 40.4 90.0 51.1 87.1 60.1C84.2 69.0 84.4 82.3 78.2 86.8C72.0 91.3 59.4 87.0 50.0 87.0C40.6 87.0 28.0 91.3 21.8 86.8C15.6 82.3 15.8 69.0 12.9 60.1C10.0 51.1 2.0 40.4 4.3 33.2C6.7 25.9 19.5 22.0 27.1 16.4C34.7 10.9 42.4 0.0 50.0 0.0Z", star: "M50.0 0.0C55.5 -0.0 58.2 23.4 66.5 29.3C74.7 35.3 97.8 30.7 99.5 35.9C101.2 41.1 79.8 51.0 76.6 60.7C73.5 70.3 85.0 90.8 80.6 94.1C76.1 97.3 60.2 80.0 50.0 80.0C39.8 80.0 23.9 97.3 19.4 94.1C15.0 90.8 26.5 70.3 23.4 60.7C20.2 51.0 -1.2 41.1 0.5 35.9C2.2 30.7 25.3 35.3 33.5 29.3C41.8 23.4 44.5 0.0 50.0 0.0Z", heart: "M50 82C14 58 5 44 5 30C5 14 18 6 30 6C40 6 47 11 50 19C53 11 60 6 70 6C82 6 95 14 95 30C95 44 86 58 50 82Z", hex: "M50 4L92 26L92 68L50 90L8 68L8 26Z" };
/** Photo de profil en forme : étoile arrondie pour moi, cœur pour la famille, étoile pour les favoris, hexagone pour les autres. */
export function Avatar({ u, s = 44 }: { u?: User; s?: number }) {
  const me = useStore((x) => x.me); const isFriend = useStore((x) => !!u && (x.social.friends[x.me] || []).includes(u.id)); const tie = useStore((x) => (u ? x.social.ties?.[u.id] : undefined));
  if (!u) return <div className="av" style={{ width: s, height: s, background: "#555" }}>?</div>;
  const vis = u.avatarVis || "friends"; const show = !!u.avatar && (u.id === me || vis === "all" || (vis === "friends" && isFriend));
  const shape = u.id === me ? "puffy" : tie === "family" ? "heart" : tie === "fav" ? "star" : "hex";
  const g = u.id === me || tie === "family" ? "ga" : tie === "fav" ? "gb" : isFriend ? "gc" : "gd"; const d = SHAPES[shape];
  return <span className="avs" style={{ width: s, height: s }} aria-label={u.name} role="img"><svg viewBox="-4 -4 108 108" width={s} height={s} aria-hidden="true">
    <path d={d} fill={`url(#${g})`} />
    {show ? <image href={u.avatar!} x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" clipPath={`url(#clip-${shape})`} /> : <text x="50" y={shape === "star" ? 62 : 58} textAnchor="middle" fontSize="36" fontWeight="800" fill="#fff" fontFamily="system-ui,sans-serif">{u.name.slice(0, 1).toUpperCase()}</text>}
    <path d={d} fill="none" stroke="var(--ink)" strokeWidth={s < 40 ? 7 : 6} strokeLinejoin="round" /></svg></span>;
}
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  return (<div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="modal" role="dialog" aria-modal="true" aria-label={title}>
    <div className="row" style={{ marginBottom: 12 }}><h2 className="grow" style={{ fontSize: "1.2rem" }}>{title}</h2><button className="btn ghost sm" onClick={onClose} aria-label={t("Fermer")}><Ico n="x" s={18} /></button></div>{children}</div></div>);
}
let toastSet: ((s: string) => void) | null = null;
export const toast = (s: string) => toastSet?.(s);
export function ToastHost() { const [m, setM] = useState(""); useEffect(() => { toastSet = (s) => { setM(s); setTimeout(() => setM((x) => (x === s ? "" : x)), 3500); }; return () => { toastSet = null; }; }, []); return m ? <div className="toast" role="status">{m}</div> : null; }

export function ago(tx: number, n = Date.now()) { const d = Math.max(0, n - tx) / 1000; if (d < 60) return t("à l'instant"); if (d < 3600) return t("il y a {n} min", { n: Math.floor(d / 60) }); if (d < 86400) return t("il y a {n} h", { n: Math.floor(d / 3600) }); return new Date(tx).toLocaleDateString(locale(), { day: "numeric", month: "short" }); }
// Réduit la photo avant de la garder (légère, rapide à charger).
export function fileToDataUrl(f: File, max = 960, q = 0.74): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onerror = () => rej(new Error("lecture")); r.onload = () => { const im = new Image(); im.onerror = () => rej(new Error("image")); im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext("2d")!.drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", q)); }; im.src = String(r.result); }; r.readAsDataURL(f); });
}
export const BG = ["linear-gradient(135deg,#8B5CF6,#3B82F6)", "linear-gradient(135deg,#FF9A5A,#F43F5E)", "linear-gradient(135deg,#2FCDBE,#0EA5E9)", "linear-gradient(135deg,#F472B6,#8B5CF6)", "linear-gradient(135deg,#F59E0B,#EF4444)"];
export const EMOJIS = ["❤️", "😂", "😮", "😢", "👏", "🔥"];
export const EMOJI_GROUPS: [string, string[]][] = [
  [T("Visages"), ["😀", "😃", "😄", "😁", "😆", "🥹", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😍", "🥰", "😘", "😋", "😛", "😜", "🤪", "🤗", "🤭", "🤔", "😎", "🤩", "🥳", "😏", "😌", "😴", "😢", "😭", "🥺", "😮", "😱", "😡", "🤯", "🥶", "🥵", "🤒", "🤮"]],
  [T("Mains"), ["👍", "👎", "👏", "🙌", "🙏", "🤝", "💪", "✌️", "🤞", "👌", "🤟", "🫶", "👋", "🤙", "☝️", "🫡"]],
  [T("Cœurs"), ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💖", "💗", "💕", "💞", "💝", "💘", "💔", "✨", "💯"]],
  [T("Fête et nature"), ["🎉", "🎂", "🎁", "🎈", "🍾", "🥂", "🍕", "🍔", "🍟", "🍰", "☕", "🍷", "🌞", "🌈", "🌸", "🌳", "🐶", "🐱", "🦋", "🐻", "⚽", "🎶", "📸", "🏖️", "🚗", "✈️", "🏡", "🔥", "⭐", "🌙"]],
  [T("Animaux"), ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🦆", "🦉", "🦋", "🐝", "🐞", "🐢", "🐍", "🐙", "🐠", "🐬", "🐳", "🦄"]],
  [T("Nourriture"), ["🍎", "🍌", "🍇", "🍓", "🍑", "🍍", "🥑", "🍅", "🥕", "🌽", "🥐", "🍞", "🧀", "🍳", "🍗", "🍝", "🍣", "🍩", "🍪", "🍫", "🍦", "🥤", "🍺", "🍹"]],
  [T("Sport et loisirs"), ["⚽", "🏀", "🏈", "🎾", "🏐", "🏓", "🥊", "🏊", "🚴", "🎮", "🎯", "🎲", "🎸", "🎤", "🎧", "🎬", "🎨", "📚", "🧩", "🏆"]],
  [T("Voyages"), ["🚗", "🚕", "🚌", "🚲", "🛵", "🚆", "✈️", "🚀", "⛵", "🏖️", "🏔️", "🌋", "🏕️", "🗼", "🏰", "🌍", "🗺️", "🌅", "🌃", "🏠"]],
  [T("Objets"), ["📱", "💻", "📷", "🎥", "💡", "🔑", "🎁", "💰", "💎", "⏰", "🔔", "📌", "✏️", "📖", "🧸", "🛒", "💊", "🔧", "🧭", "🕯️"]],
  [T("Symboles"), ["✅", "❌", "❗", "❓", "💤", "💥", "💫", "🔥", "⭐", "🌟", "⚡", "☀️", "🌙", "☁️", "❄️", "🌈", "♻️", "➕", "➖", "🔴", "🟢", "🔵", "⚠️", "🚫"]],
];
export function EmojiGrid({ onPick, onClose }: { onPick: (e: string) => void; onClose?: () => void }) {
  return <div className="egrid">{onClose && <div style={{ position: "sticky", top: 0, display: "flex", justifyContent: "flex-end", zIndex: 1 }}><button type="button" className="btn ghost sm" onClick={onClose} aria-label={t("Fermer les emojis")} style={{ background: "var(--card)" }}>✕</button></div>}{EMOJI_GROUPS.map(([tx, l]) => <div key={tx}><div className="muted small" style={{ margin: "6px 2px" }}>{t(tx)}</div><div className="erow">{l.map((e) => <button type="button" key={e} onClick={() => onPick(e)} aria-label={e}>{e}</button>)}</div></div>)}</div>;
}
export function useNow(ms = 1000) { const [tx, setT] = useState(Date.now()); useEffect(() => { const i = setInterval(() => setT(Date.now()), ms); return () => clearInterval(i); }, [ms]); return tx; }

/** Interrupteur (à la place des cases à cocher). */
export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className={"switch" + (on ? " on" : "")} onClick={() => onChange(!on)}><span /></button>;
}

/** Appui long (ou clic droit) : renvoie les gestes à poser sur un élément. */
const lpTimer: { t?: number } = {};
export function lp(onLong: () => void) {
  const stop = () => { if (lpTimer.t) { clearTimeout(lpTimer.t); lpTimer.t = undefined; } };
  return {
    onPointerDown: () => { stop(); lpTimer.t = window.setTimeout(() => { lpTimer.t = undefined; onLong(); }, 550); },
    onPointerUp: stop, onPointerLeave: stop, onPointerCancel: stop, onPointerMove: stop,
    onContextMenu: (e: { preventDefault: () => void }) => { e.preventDefault(); stop(); onLong(); },
    style: { WebkitTouchCallout: "none", userSelect: "none" } as const,
  };
}
/** Fenêtre « Supprimer ? » */
export function ConfirmDel({ what, onYes, onClose }: { what: string; onYes: () => void; onClose: () => void }) {
  return <Modal title={t("Supprimer {what} ?", { what })} onClose={onClose}><p className="muted">{t("Cette action est définitive.")}</p><div className="row" style={{ gap: 8 }}><button className="btn ghost grow" onClick={onClose}>{t("Garder")}</button><button className="btn grow" style={{ background: "var(--bad)", color: "#fff" }} onClick={() => { onYes(); onClose(); }}>{t("🗑 Supprimer")}</button></div></Modal>;
}

/** Bouton qui réagit à un appui simple (clic) ET à un appui long. */
const pressState: { t?: number; fired: boolean } = { fired: false };
export function pressProps(onShort: () => void, onLong: () => void) {
  const st = pressState; const stop = () => { if (st.t) { clearTimeout(st.t); st.t = undefined; } };
  return {
    onPointerDown: () => { st.fired = false; stop(); st.t = window.setTimeout(() => { st.t = undefined; st.fired = true; onLong(); }, 550); },
    onPointerUp: stop, onPointerLeave: stop, onPointerCancel: stop,
    onClick: () => { if (st.fired) { st.fired = false; return; } onShort(); },
    onContextMenu: (e: { preventDefault: () => void }) => { e.preventDefault(); },
    style: { WebkitTouchCallout: "none", userSelect: "none" } as const,
  };
}
