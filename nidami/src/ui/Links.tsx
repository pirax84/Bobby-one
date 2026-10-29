import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Ico } from "./common";

/** Accepte « exemple.fr/page » ou « https://… » ; refuse tout ce qui n'est pas http(s). */
export function safeUrl(raw: string): string | null {
  let t = raw.trim(); if (!t || /\s/.test(t) || t.length > 1000) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(t)) t = "https://" + t;
  try { const u = new URL(t); if (u.protocol !== "https:" && u.protocol !== "http:") return null; if (!u.hostname.includes(".")) return null; return u.toString(); } catch { return null; }
}

const NAMES: [RegExp, string, string][] = [
  [/(^|\.)(youtube\.com|youtu\.be)$/, "YouTube", "▶️"], [/(^|\.)(facebook\.com|fb\.watch|fb\.com)$/, "Facebook", "📘"], [/(^|\.)instagram\.com$/, "Instagram", "📸"],
  [/(^|\.)tiktok\.com$/, "TikTok", "🎵"], [/(^|\.)(x\.com|twitter\.com)$/, "X", "✖️"], [/(^|\.)snapchat\.com$/, "Snapchat", "👻"], [/(^|\.)linkedin\.com$/, "LinkedIn", "💼"],
  [/(^|\.)twitch\.tv$/, "Twitch", "🎮"], [/(^|\.)leboncoin\.fr$/, "Leboncoin", "🛒"], [/(^|\.)vinted\.(fr|com)$/, "Vinted", "👗"], [/(^|\.)spotify\.com$/, "Spotify", "🎧"],
  [/(^|\.)(dailymotion\.com|dai\.ly)$/, "Dailymotion", "🎬"], [/(^|\.)vimeo\.com$/, "Vimeo", "🎬"], [/(^|\.)pinterest\.[a-z.]+$/, "Pinterest", "📌"], [/(^|\.)reddit\.com$/, "Reddit", "👽"],
  [/(^|\.)soundcloud\.com$/, "SoundCloud", "🔊"], [/(^|\.)deezer\.com$/, "Deezer", "🎶"], [/(^|\.)music\.apple\.com$/, "Apple Music", "🎼"], [/(^|\.)wikipedia\.org$/, "Wikipédia", "📖"], [/(^|\.)(wa\.me|whatsapp\.com)$/, "WhatsApp", "💬"], [/(^|\.)t\.me$/, "Telegram", "✈️"],
  [/(^|\.)amazon\.[a-z.]+$/, "Amazon", "📦"], [/(^|\.)(google\.[a-z.]+\/maps|maps\.app\.goo\.gl)$/, "Google Maps", "🗺️"],
];
export function providerOf(url: string): { name: string; icon: string; host: string } {
  try { const u = new URL(url); const host = u.hostname.replace(/^(www\.|m\.|mobile\.)/, ""); const hit = NAMES.find(([re]) => re.test(host)); return { name: hit ? hit[1] : host, icon: hit ? hit[2] : "🌐", host }; } catch { return { name: "Lien", icon: "🔗", host: "" }; }
}

/** Adresse « intégrable » (affichable dans l'application) pour les sites qui l'autorisent ; sinon null. */
export function embedOf(url: string): string | null {
  try {
    const u = new URL(url); const h = u.hostname.replace(/^(www\.|m\.|mobile\.)/, ""); const p = u.pathname; const q = u.searchParams; const par = location.hostname || "localhost"; let m: RegExpExecArray | null;
    if (h === "youtube.com" || h === "music.youtube.com") { const list = q.get("list"); if (p === "/playlist" && list) return `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(list)}`; const id = q.get("v") || /^\/(?:shorts|live|embed)\/([\w-]{6,})/.exec(p)?.[1]; return id ? `https://www.youtube-nocookie.com/embed/${id}${list ? "?list=" + encodeURIComponent(list) : ""}` : null; }
    if (h === "youtu.be") { const id = p.slice(1).split("/")[0]; return id ? `https://www.youtube-nocookie.com/embed/${id}` : null; }
    if (h === "vimeo.com" && (m = /^\/(\d+)/.exec(p))) return `https://player.vimeo.com/video/${m[1]}`;
    if (h === "dailymotion.com" && (m = /\/video\/([a-z0-9]+)/i.exec(p))) return `https://www.dailymotion.com/embed/video/${m[1]}`;
    if (h === "dai.ly") { const id = p.slice(1); return id ? `https://www.dailymotion.com/embed/video/${id}` : null; }
    if (h === "twitch.tv") { if ((m = /^\/videos\/(\d+)/.exec(p))) return `https://player.twitch.tv/?video=v${m[1]}&parent=${par}`; if ((m = /\/clip\/([\w-]+)/.exec(p))) return `https://clips.twitch.tv/embed?clip=${m[1]}&parent=${par}`; if ((m = /^\/(\w+)\/?$/.exec(p))) return `https://player.twitch.tv/?channel=${m[1]}&parent=${par}`; return null; }
    if (h === "clips.twitch.tv" && (m = /^\/([\w-]+)/.exec(p))) return `https://clips.twitch.tv/embed?clip=${m[1]}&parent=${par}`;
    if (h === "tiktok.com" && (m = /\/video\/(\d+)/.exec(p))) return `https://www.tiktok.com/embed/v2/${m[1]}`;
    if (h === "instagram.com" && (m = /^\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([\w-]+)/.exec(p))) return `https://www.instagram.com/${m[1] === "reels" ? "reel" : m[1]}/${m[2]}/embed/`;
    if (h === "facebook.com" || h === "fb.watch") { const vid = h === "fb.watch" || /\/(videos|watch|reel)\b/.test(p); return `https://www.facebook.com/plugins/${vid ? "video" : "post"}.php?href=${encodeURIComponent(url)}&show_text=${vid ? "false" : "true"}&width=560`; }
    if ((h === "x.com" || h === "twitter.com") && (m = /\/status\/(\d+)/.exec(p))) return `https://platform.twitter.com/embed/Tweet.html?id=${m[1]}&dnt=true`;
    if (h === "open.spotify.com" && (m = /^\/(?:intl-[a-z]+\/)?(track|album|playlist|episode|show|artist)\/(\w+)/.exec(p))) return `https://open.spotify.com/embed/${m[1]}/${m[2]}`;
    if (h === "deezer.com" && (m = /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(track|album|playlist|artist|show|episode)\/(\d+)/.exec(p))) return `https://widget.deezer.com/widget/auto/${m[1]}/${m[2]}`;
    if (h === "music.apple.com" && p.length > 3) return `https://embed.music.apple.com${p}${u.search}`;
    if (h === "soundcloud.com" && p.split("/").length >= 3) return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false`;
  } catch { /* lien invalide */ }
  return null;
}

/** Ouvre le lien le mieux possible : intégré dans l'application, sinon visionneuse de l'application Android, sinon nouvel onglet. */
function openOutside(url: string) {
  const nat = (window as unknown as { CercleNative?: { openLink?: (u: string) => void } }).CercleNative;
  if (nat?.openLink) { try { nat.openLink(url); return; } catch { /* repli */ } }
  window.open(url, "_blank", "noopener,noreferrer");
}

/** Musique : Spotify, Deezer, Apple Music, SoundCloud, YouTube Music et playlists YouTube. */
export function isMusic(url: string): boolean {
  try { const u = new URL(url); const h = u.hostname.replace(/^(www\.|m\.|mobile\.)/, ""); if (/^(open\.spotify\.com|deezer\.com|music\.apple\.com|soundcloud\.com|music\.youtube\.com)$/.test(h)) return !!embedOf(url); if (h === "youtube.com" && u.searchParams.get("list")) return !!embedOf(url); } catch { /* pas de musique */ }
  return false;
}

// ── Lecteur flottant : la musique continue quand on change de page ; une seule source à la fois ; jamais de lecture automatique.
type Player = { url: string; emb: string; name: string; icon: string; big: boolean; audio: boolean } | null;
let player: Player = null; const subs = new Set<() => void>(); const setPlayer = (p: Player) => { player = p; subs.forEach((f) => f()); };
export function stopPlayer() { if (player) setPlayer(null); }
export function playMusic(url: string): boolean { const emb = embedOf(url); if (!emb) return false; const pv = providerOf(url); setPlayer({ url, emb, name: pv.name, icon: pv.icon, big: false, audio: isMusic(url) && !/youtube/.test(emb) }); return true; }
export function MiniPlayer() {
  const p = useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => player);
  if (!p) return null;
  return <div className={"mplayer" + (p.big ? " big" : "")} role="region" aria-label={"Lecteur " + p.name}>
    <div className="mhead"><span style={{ fontSize: "1.2rem" }}>{p.icon}</span><b className="grow ell">{p.name}</b><button className="topb" style={{ width: 34, height: 34 }} onClick={() => setPlayer({ ...p, big: !p.big })} aria-label={p.big ? "Réduire" : "Agrandir"}>{p.big ? "⌄" : "⤢"}</button><button className="topb" style={{ width: 34, height: 34 }} onClick={() => setPlayer(null)} aria-label="Arrêter la musique">✕</button></div>
    <iframe key={p.emb} src={p.emb} title={p.name} className={p.audio ? "ia" : "iv"} allow="autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-popups allow-presentation allow-forms" />
  </div>;
}

export function LinkViewer({ url, onClose }: { url: string; onClose: () => void }) {
  const pv = providerOf(url); const emb = embedOf(url);
  useEffect(() => { history.pushState({ ...(history.state || {}), link: 1 }, ""); const f = () => onClose(); window.addEventListener("popstate", f); return () => window.removeEventListener("popstate", f); }, []);
  const close = () => { if (history.state?.link) history.back(); else onClose(); };
  return createPortal(<div className="linkv" role="dialog" aria-modal="true" aria-label={"Lien " + pv.name}>
    <div className="dhead"><button className="btn ghost sm" onClick={close} aria-label="Fermer" style={{ minWidth: 44 }}><Ico n="back" s={18} /></button><span style={{ fontSize: "1.3rem" }}>{pv.icon}</span><b className="grow ell">{pv.name}</b>{emb && <button className="btn ghost sm" onClick={() => { if (playMusic(url)) onClose(); }} aria-label="Réduire et continuer d'écouter">⌄ Réduire</button>}<button className="btn ghost sm" onClick={() => openOutside(url)} aria-label="Ouvrir à part">↗</button></div>
    <div className="linkb">{emb ? <iframe src={emb} title={pv.name} allow="autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-popups allow-presentation allow-forms" /> : <div className="col center" style={{ alignItems: "center", gap: 12, padding: 24 }}><p className="muted">Ce site ne peut pas s'afficher à l'intérieur de NOTIIF.</p><button className="btn" onClick={() => openOutside(url)}>Ouvrir {pv.name}</button></div>}</div>
  </div>, document.body);
}

/** Carte d'un lien partagé. */
export function LinkCard({ url }: { url: string }) {
  const [open, setOpen] = useState(false); const pv = providerOf(url); const emb = embedOf(url);
  let shown = pv.host; try { const u = new URL(url); shown = pv.host + (u.pathname.length > 1 ? u.pathname : ""); } catch { /* garde l'hôte */ }
  const music = isMusic(url); const go = (e: { stopPropagation: () => void }) => { e.stopPropagation(); if (music) playMusic(url); else if (emb) setOpen(true); else openOutside(url); };
  return (<><button type="button" className="lcard" onClick={go} aria-label={"Ouvrir le lien " + pv.name}><span className="lic">{pv.icon}</span><span className="grow" style={{ minWidth: 0, textAlign: "left" }}><b>{pv.name}</b><span className="muted small ell" style={{ display: "block" }}>{shown}</span><span className="small" style={{ color: "var(--brand)" }}>{music ? "🎧 Écouter dans NOTIIF (vous seul l'entendez)" : emb ? "▶ Voir ici, dans NOTIIF" : "Ouvrir le lien"}</span></span></button>{open && <LinkViewer url={url} onClose={() => setOpen(false)} />}</>);
}

/** Dans un message : les adresses deviennent touchables (ouvertes dans l'application) et la première affiche sa carte. */
export function LinkifiedText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g); const first = parts.find((x, i) => i % 2 && safeUrl(x));
  return <>{parts.map((x, i) => (i % 2 && safeUrl(x) ? <InLink key={i} url={safeUrl(x)!} label={x.replace(/^https?:\/\//, "")} /> : x))}{first && <LinkCard url={safeUrl(first)!} />}</>;
}
function InLink({ url, label }: { url: string; label: string }) {
  const [open, setOpen] = useState(false); const emb = embedOf(url);
  return <><a href={url} onClick={(e) => { e.preventDefault(); if (isMusic(url)) playMusic(url); else if (emb) setOpen(true); else openOutside(url); }} style={{ color: "inherit", textDecoration: "underline", wordBreak: "break-all" }}>{label}</a>{open && <LinkViewer url={url} onClose={() => setOpen(false)} />}</>;
}
