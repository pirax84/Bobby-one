import { BRAND } from "./lib/brand";
import { applyTheme, accentOf } from "./lib/theme";
import { useEffect, useRef, useState } from "react";
import { useStore, actions, userOf, getSaveWarn } from "./lib/store";
import { micText, Avatar, Ico, Logo, ToastHost, Modal, toast, pressProps, Switch, isBirthday } from "./ui/common";
import { Home, QuickCompose } from "./ui/Home";
import { VoiceHome } from "./ui/VoiceChat";
import { Friends, Groups, Events, Profile, Notifs, Settings } from "./ui/Social";
import { Messages, Games, Soon } from "./ui/Chat";
import { Media } from "./ui/Albums";
import { LegalView } from "./ui/Legal";
import { Shares } from "./ui/Shares";
import { Onboarding, needInstall } from "./ui/Auth";
import { ChatBubble } from "./ui/Bubble";
import { SearchTop } from "./ui/Search";
import { MiniPlayer } from "./ui/Links";
import { playFx, playCustom, Fx, playTone, vibrate, popNotes, soundEnd, sfx } from "./lib/fx";
import { sessionFromReturn } from "./lib/auth";
import { t, locale, useLang } from "./i18n";
import { ArrivedModal } from "./ui/Extras";
import { Guide } from "./ui/Guide";
import { kidOn, PinGate } from "./ui/Kid";

type V = "voice" | "home" | "friends" | "groups" | "messages" | "calls" | "media" | "games" | "events" | "notifs" | "profile" | "shares" | "legal" | "settings";
export const navItems = (): [V, string, string][] => [["home", t("Accueil"), "home"], ["friends", t("Amis"), "users"], ["groups", t("Groupes"), "group"], ["messages", t("Messages"), "chat"], ["voice", t("Vocal"), "voice"], ["calls", t("Appels"), "phone"], ["notifs", t("Notifications"), "bell"], ["media", t("Photos"), "img"], ["games", t("Jeux"), "game"], ["events", t("Événements"), "cal"], ["shares", t("Partages"), "send"], ["profile", t("Profil"), "user"], ["legal", t("Légal"), "lock"], ["settings", t("Paramètres"), "cog"]];


function SideBdays({ go }: { go: (k: V) => void }) {
  const users = useStore((x) => x.users); const me = useStore((x) => x.me); const fr = useStore((x) => x.social.friends[x.me] || []);
  const l = Object.values(users).filter((u) => u.id !== me && fr.includes(u.id) && u.birthday).map((u) => { let d = -1; for (let i = 0; i < 31; i++) if (isBirthday(u.birthday, i)) { d = i; break; } return { u, d }; }).filter((x) => x.d >= 0).sort((a, b) => a.d - b.d).slice(0, 4);
  if (!l.length) return null;
  return <div className="sidebd" aria-label={t("Prochains anniversaires")}><b className="small">{t("🎂 Anniversaires")}</b>{l.map(({ u, d }) => <button key={u.id} type="button" className="sidebdr" onClick={() => go("friends")}><Avatar u={u} s={28} /><span className="grow ell">{u.name}</span><small>{d === 0 ? t("Aujourd'hui") : d === 1 ? t("Demain") : t("dans {n} j", { n: d })}</small></button>)}</div>;
}

const BALLS: [string, string][] = [["#2A1F5C", "#9B87F5"], ["#0E4A4A", "#2FCDBE"], ["#5A1B38", "#E5679C"], ["#16296B", "#4F7BFF"]];
function Balloon({ i, x }: { i: number; x: number }) { const [c, h] = BALLS[i % 4]; return <g transform={`translate(${x} 0)`}><path d="M0 40 q-5 16 1 32" stroke="currentColor" strokeWidth="1.2" fill="none" opacity=".7" /><ellipse cx="0" cy="22" rx="13" ry="17" fill={c} stroke={h} strokeWidth="1.5" className="bdball" /><path d="M-6 12 q3-6 8-7" stroke={h} strokeWidth="2.2" fill="none" strokeLinecap="round" /><path d="M-2 39 l2 4 2-4z" fill={c} /></g>; }
/** Le jour d'un anniversaire : le logo (intact) reçoit des ballons, un « Joyeux anniversaire » avec photo, prénom et âge. */
function useBdays() {
  const users = useStore((x) => x.users); const me = useStore((x) => x.me); const fr = useStore((x) => x.social.friends[x.me] || []);
  return Object.values(users).filter((u) => (u.id === me || fr.includes(u.id)) && isBirthday(u.birthday, 0)).sort((a, b) => (a.id === me ? -1 : b.id === me ? 1 : 0));
}
const BDAY_DECO = true;
function useBdText() {
  const l = useBdays(); const me = useStore((x) => x.me); useLang();
  const mine = l.find((x) => x.id === me); if (!BDAY_DECO || !mine) return { mine: undefined, text: undefined };
  const raw = t("Joyeux anniversaire"); const text = locale().startsWith("fr") ? raw : raw.replace(/\b\w/g, (c) => c.toUpperCase());
  return { mine, text };
}
function BdayDeco({ children }: { children: React.ReactNode }) {
  const { mine } = useBdText();
  if (!mine) return <>{children}</>;
  const age = mine.byear ? new Date().getFullYear() - mine.byear : 0; const nm = mine.name.trim().split(/\s+/)[0];
  return <span className="bdlogo bdself"><span className="bdcake" aria-hidden="true">🎂</span><svg className="bdb l" viewBox="-20 0 70 76" aria-hidden="true"><Balloon i={0} x={10} /><Balloon i={1} x={34} /></svg>{children}<svg className="bdb r" viewBox="-20 0 70 76" aria-hidden="true"><Balloon i={2} x={10} /><Balloon i={3} x={34} /></svg>
    <span className="bdline"><Avatar u={mine} s={22} /><b>{nm}{age > 0 ? " · " + t("{n} ans", { n: age }) : ""}</b></span></span>;
}

// Le nom NOTIIF en haut : on le touche, les lettres sautent l'une après l'autre en passant par toutes les couleurs.
import { useFete, FeteOrnaments, FeteUnder } from "./lib/fetes";
const WM_CUTS = [0, 354, 502, 616, 678, 751, 1048];
const BD_COL = ["#B83FD0", "#F2704A", "#1FA58F", "#E5679C", "#F2A33A", "#38A0F0"];
function BrandWm({ id, light, sound, big, onHome, bdText }: { id: string; light: boolean; sound: boolean; big?: boolean; onHome?: () => void; bdText?: string }) {
  const bday = !!bdText; const fete = useFete(); const fx = !bdText ? fete : null;
  const [go, setGo] = useState(0); const suf = id + (light ? "-light" : "");
  const tapped = () => { try { const now = Date.now(); const last = +(localStorage.getItem("notiif-tap-t") || 0); const streak = now - last < 2500 ? +(localStorage.getItem("notiif-tap-s") || 0) + 1 : 1; localStorage.setItem("notiif-tap-t", String(now)); localStorage.setItem("notiif-tap-s", String(streak));
    const total = +(localStorage.getItem("notiif-tap-n") || 0) + 1; localStorage.setItem("notiif-tap-n", String(total));
    if (total >= 40 && !localStorage.getItem("notiif-treasure")) { localStorage.setItem("notiif-treasure", "1"); actions.addScore(10); window.dispatchEvent(new Event("notiif-treasure")); }
    else if (streak === 7) { const P = [t("Tu es précieux pour tes proches 💜"), t("Merci d'être là, ça fait plaisir !"), t("Un petit coup de fil à quelqu'un que tu aimes ? 💌"), t("Tu fais du bien autour de toi 🌸")]; toast(P[Math.floor(Math.random() * P.length)]); } } catch { /* rien */ } };
  const hop = () => { tapped(); onHome?.(); let reduce = false; try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { /* rien */ } if (reduce) return; setGo((g) => g + 1); if (sound) { if (bday) sfx("birthday"); else popNotes(6); } try { navigator.vibrate?.(12); } catch { /* rien */ } };
  return <span className={"wm" + (big ? " big" : "") + (go ? " go" : "")} role="button" tabIndex={0} aria-label="NOTIIF" onClick={hop} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); hop(); } }}>
    <img className="wmb" src={`./wm-bg-${suf}.png`} alt="" draggable={false} />

    {fx && <FeteUnder fete={fx} suf={suf} light={light} />}
    {bdText && <svg className="wmbd" viewBox="0 0 524 184" aria-label={bdText}><text x="262" y="116" textAnchor="middle" fontSize={bdText.length > 15 ? 54 : 64} fontWeight="900" fontFamily="'Arial Black',Arial,sans-serif" textLength={bdText.length > 15 ? 450 : 420} lengthAdjust="spacingAndGlyphs">{[...bdText].map((c, i) => <tspan key={i} fill={BD_COL[i % BD_COL.length]}>{c}</tspan>)}</text></svg>}
    {!bdText && WM_CUTS.slice(0, 6).map((c, i) => (fx && i === 1) ? null : <img key={i + "-" + go} className="wml" draggable={false} alt="" src={`./wm-fg-${suf}.png`} style={{ ["--i" as string]: i, clipPath: `inset(${fx ? (i === 3 || i === 4 ? "41%" : i === 5 ? "35%" : "0") : "0"} ${100 - WM_CUTS[i + 1] / 10.48}% 0 ${c / 10.48}%)` }} />)}
    {fx && <FeteOrnaments fete={fx} suf={suf} light={light} />}
  </span>;
}

export default function App() {
  useLang();
  const pushOn = useStore((x) => !!x.settings[x.me]?.push); const lastNotif = useStore((x) => x.notifs.filter((n) => n.to === x.me && !n.read).sort((a, b) => b.at - a.at)[0]); const seenN = useRef<string | undefined>(undefined);
  const fxOn = useStore((x) => x.settings[x.me]?.fx ?? true); const lastFxMsg = useStore((x) => { let b: { id: string; fx?: string; at: number } | undefined; for (const c of x.convs) if (c.memberIds.includes(x.me)) for (const m of c.msgs) if (m.fx && m.from !== x.me && (!b || m.at > b.at)) b = m; return b ? b.id + "|" + b.fx : ""; }); const lastCfx = useStore((x) => { let b: { at: number; cfx?: { name: string; img?: string; audio?: string } } | undefined; for (const c of x.convs) if (c.memberIds.includes(x.me)) for (const m of c.msgs) if (m.fx && m.from !== x.me && (!b || m.at > b.at)) b = m; return b?.cfx; }); const seenFx = useRef<string | undefined>(undefined); const th0 = useStore((x) => x.settings[x.me]); const lastCall = useStore((x) => { let b: { id: string; at: number } | undefined; for (const c of x.convs) if (c.memberIds.includes(x.me)) for (const m of c.msgs) if (m.from !== x.me && m.text.startsWith("📹") && (!b || m.at > b.at)) b = m; return b?.id || ""; }); const seenCall = useRef<string | undefined>(undefined);
  const bubbleOn = useStore((x) => x.settings[x.me]?.bubble ?? true); const startCfg = useStore((x) => x.settings[x.me]?.start); const navCfg = useStore((x) => x.settings[x.me]?.nav); const topCfg = useStore((x) => x.settings[x.me]?.top); const started = useStore((s) => s.started); const me = useStore((s) => s.me); const lightCfg = useStore((s) => s.settings[s.me]?.light); const modeCfg = useStore((s) => s.settings[s.me]?.mode); const accent = useStore((s) => s.settings[s.me]?.accent); const [sysDark, setSysDark] = useState(() => { try { return window.matchMedia("(prefers-color-scheme: dark)").matches; } catch { return false; } }); useEffect(() => { try { const q = window.matchMedia("(prefers-color-scheme: dark)"); const f = () => setSysDark(q.matches); q.addEventListener("change", f); return () => q.removeEventListener("change", f); } catch { return undefined; } }, []); const styleCfg = useStore((s) => s.settings[s.me]?.style); const fsCfg = useStore((s) => s.settings[s.me]?.fs); const mode = modeCfg || (lightCfg === false ? "dark" : "auto"); const light = mode === "light" ? true : mode === "dark" ? false : !sysDark;
  const unreadN = useStore((s) => s.notifs.filter((n) => n.to === s.me && !n.read).length); const unreadM = useStore((s) => s.convs.filter((c) => c.memberIds.includes(s.me)).reduce((a, c) => a + c.msgs.filter((m) => m.from !== s.me && m.reads[s.me] === undefined).length, 0));
  const reqs = useStore((s) => s.reqs.filter((r) => r.to === s.me).length); const user = useStore((s) => userOf(s, s.me));
  const pendShares = useStore((s) => s.shares.filter((h) => h.authorId === s.me && h.status === "pending").length);
  const users = useStore((s) => s.users); const hand = useStore((s) => s.settings[s.me]?.hand); useEffect(() => { document.documentElement.dataset.hand = hand === "left" ? "left" : "right"; }, [hand]);
  const parseHash = () => { const m = (location.hash + location.search).match(/(?:add|invite)=(NID-[A-Z0-9]{5})/i); return m ? m[1].toUpperCase() : ""; };
  const [pendCode, setPendCode] = useState(parseHash());
  useEffect(() => { const f = () => setPendCode(parseHash() || ""); window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); }, []);
  useEffect(() => { const f = () => document.documentElement.classList.toggle("scrolled", window.scrollY > 90); f(); window.addEventListener("scroll", f, { passive: true }); return () => window.removeEventListener("scroll", f); }, []);
  const [arrived, setArrived] = useState(false); const [kidOk, setKidOk] = useState(false); useEffect(() => { let id = 0; const f = () => { document.documentElement.classList.add("scrolling"); clearTimeout(id); id = window.setTimeout(() => document.documentElement.classList.remove("scrolling"), 700); }; window.addEventListener("scroll", f, { passive: true }); return () => window.removeEventListener("scroll", f); }, []); const [treasure, setTreasure] = useState(false); useEffect(() => { const f = () => setTreasure(true); window.addEventListener("notiif-treasure", f); return () => window.removeEventListener("notiif-treasure", f); }, []); const fresh = !history.state?.v; const [v, setV] = useState<V>(() => (history.state?.v as V) || (startCfg && startCfg !== "create" && navItems().some((n) => n[0] === startCfg) ? (startCfg as V) : "home")); const [ask, setAsk] = useState(() => fresh && startCfg === "create"); const [storyC, setStoryC] = useState(false); const [compose, setCompose] = useState<false | "short" | "long" | "selfie" | "photo" | "text" | "audio" | "saudio" | "link">(false); const [wall, setWall] = useState(false); const [more, setMore] = useState(false);
  useEffect(() => { applyTheme({ light: !!light, accent }); document.documentElement.dataset.style = styleCfg === "bold" ? "bold" : "soft"; document.documentElement.style.setProperty("--fs", String(({ petit: 0.92, grand: 1.15, tgrand: 1.3 } as Record<string, number>)[fsCfg || ""] || 1)); }, [light, accent, fsCfg, styleCfg]);
  useEffect(() => { window.scrollTo(0, 0); }, [v]);
  useEffect(() => { if (!history.state?.v) history.replaceState({ v: "home" }, ""); const f = (e: PopStateEvent) => { setV(((e.state && e.state.v) as V) || "home"); setMore(!!(e.state && e.state.more)); }; window.addEventListener("popstate", f); return () => window.removeEventListener("popstate", f); }, []);
  const fxList = useStore((x) => { const a: { id: string; fx: string; at: number }[] = []; for (const c of x.convs) if (c.memberIds.includes(x.me)) for (const m of c.msgs) if (m.fx && m.from !== x.me) a.push({ id: m.id, fx: m.fx, at: m.at }); a.sort((p, q) => p.at - q.at); return a.map((m) => m.at + "|" + m.fx).join(";"); });
  const meId = useStore((x) => x.me); const fxBusy = useRef(false); const bdt = useBdText();
  useEffect(() => { if (!(typeof matchMedia !== "undefined" && matchMedia("(hover: hover) and (pointer: fine)").matches)) return; const k = (e: KeyboardEvent) => { const el = e.target as HTMLElement; const typing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable); if (e.key === "/" && !typing) { const i = document.querySelector<HTMLInputElement>(".dsearch input"); if (i) { e.preventDefault(); i.focus(); } } else if (e.key === "Escape" && !document.querySelector(".overlay,.modal,.detail,.viewer") && v !== "home" && !(typing && (el as HTMLInputElement).value)) { if (typing) el.blur(); history.back(); } }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [v]);
  useEffect(() => {
    const run = () => {
      if (fxBusy.current || document.visibilityState !== "visible" || !meId) return;
      const key = "notiif-fxseen-" + meId; const items = fxList ? fxList.split(";").map((v) => { const [at, fx] = v.split("|"); return { at: +at, fx }; }) : [];
      let seen = 0; try { seen = +(localStorage.getItem(key) || 0); } catch {}
      if (!seen) { try { localStorage.setItem(key, String(items.length ? items[items.length - 1].at : Date.now())); } catch {} return; }
      const todo = items.filter((m) => m.at > seen).slice(-8); if (!todo.length) return;
      try { localStorage.setItem(key, String(todo[todo.length - 1].at)); } catch {}
      if (!fxOn) return; fxBusy.current = true;
      todo.forEach((m, n) => setTimeout(() => { if (m.fx === "custom") { if (lastCfx) playCustom(lastCfx); } else playFx(m.fx as Fx); if (n === todo.length - 1) fxBusy.current = false; }, n * 3200));
    };
    run(); document.addEventListener("visibilitychange", run); return () => document.removeEventListener("visibilitychange", run);
  }, [fxList, fxOn, meId]);
  useEffect(() => { if (seenCall.current === undefined) { seenCall.current = lastCall; return; } if (!lastCall || lastCall === seenCall.current) return; seenCall.current = lastCall; if (!th0?.quiet) { playTone(th0?.ctone || "c1", 3); vibrate(th0?.vibc, 3); } }, [lastCall]);
  useEffect(() => { // notifications du téléphone : seulement quand l'application est ouverte ou en arrière-plan (hors-ligne = serveur nécessaire)
    if (seenN.current === undefined) { seenN.current = lastNotif?.id || ""; return; }
    if (!lastNotif || lastNotif.id === seenN.current) return; seenN.current = lastNotif.id;
    if (!th0?.quiet) { if (!th0?.ntone || th0.ntone === "n1") soundEnd(); else playTone(th0.ntone); vibrate(th0?.vibm, 1); }
    const nat = (window as any).CercleNative; if (pushOn && nat?.notify) { try { nat.notify(BRAND, lastNotif.text); } catch { /* ignoré */ } return; }
    if (!pushOn || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const opt = { body: lastNotif.text, icon: "./icon-192.png", badge: "./badge-96.png", tag: lastNotif.id, vibrate: [200, 100, 200] } as NotificationOptions;
    navigator.serviceWorker?.ready.then((r) => r.showNotification(BRAND, opt)).catch(() => { try { new Notification(BRAND, opt); } catch { /* ignoré */ } });
  }, [lastNotif?.id, pushOn]);
  useEffect(() => { sessionFromReturn().then((w) => { if (w && !started) actions.start(w.name); }).catch(() => {}); }, []);
  // Pendant qu'on fait défiler la page, la barre du bas et la bulle de messages se cachent ; elles reviennent dès qu'on s'arrête.
  useEffect(() => { let tm = 0; const root = document.documentElement; const show = () => { clearTimeout(tm); root.classList.remove("moving"); }; const on = () => { root.classList.add("moving"); clearTimeout(tm); tm = window.setTimeout(show, 90); }; window.addEventListener("scroll", on, { passive: true }); window.addEventListener("scrollend", show); return () => { window.removeEventListener("scroll", on); window.removeEventListener("scrollend", show); clearTimeout(tm); root.classList.remove("moving"); }; }, []);
  if (!started || !me || !user || needInstall()) return <><Onboarding started={!!(started && me && user)} /><ToastHost /></>;
  const tab = ([k, l, i]: [V, string, string]) => <button key={k} data-k={k} className={v === k ? "on" : ""} onClick={() => go(k)} style={{ position: "relative" }}><Ico n={i} /><i>{l}</i>{badge(k) > 0 && <span className="badge" style={{ position: "absolute", top: 0, right: 4 }}>{badge(k)}</span>}</button>;
  const go = (x: string, conv?: string) => { if (x === "arrived") { setMore(false); setArrived(true); return; } if (conv) { history.pushState({ v: x, conv }, ""); setV(x as V); setMore(false); return; } if (x !== v) history.pushState({ v: x }, ""); setV(x as V); setMore(false); };
  let keys = navCfg ? navCfg.split(",") : ["home", "friends", "messages", "notifs"];
  if (bubbleOn && keys.includes("messages")) { const alt = ["groups", "events", "media", "games"].find((x) => !keys.includes(x)) || "groups"; keys = keys.map((k) => (k === "messages" ? alt : k)); }
  const bar = keys.map((k) => navItems().find((n) => n[0] === k)).filter(Boolean).slice(0, 4) as [V, string, string][]; const half = Math.ceil(bar.length / 2);
  const topKeys = (topCfg ? topCfg.split(",") : ["search", "settings"]).filter((k) => k === "search" || k === "theme" || navItems().some((n) => n[0] === k)).slice(0, 4);
  const openConvFull = (id: string) => { history.pushState({ v: "messages", conv: id }, ""); setV("messages"); };
  const badge = (k: V) => (k === "shares" ? pendShares : k === "notifs" ? unreadN : k === "messages" ? unreadM : k === "friends" ? reqs : 0);
  const page0 = v === "home" ? <Home go={go} /> : v === "voice" ? <VoiceHome /> : v === "friends" ? <Friends go={go} /> : v === "groups" ? <Groups /> : v === "messages" ? <Messages /> : v === "games" ? <Games /> : v === "events" ? <Events /> : v === "media" ? <Media /> : v === "profile" ? <Profile /> : v === "notifs" ? <Notifs go={go} openConv={(id) => { history.pushState({ v: "messages", conv: id }, ""); setV("messages"); }} /> : v === "shares" ? <Shares /> : v === "legal" ? <LegalView /> : v === "settings" ? <Settings go={go} />
    : <Soon title={t("Appels audio et vidéo")} icon="📞" why={t("Les appels demandent un serveur de connexion (WebRTC). Ils seront ajoutés quand le serveur NOTIIF sera en place.")} />;
  const page = kidOn() && !kidOk && (v === "settings" || v === "profile" || v === "friends") ? <PinGate onOk={() => setKidOk(true)} /> : page0;
  const warn = getSaveWarn();
  const Item = ({ k, l, i }: { k: V; l: string; i: string }) => <button data-k={k} className={"navbtn" + (v === k ? " on" : "")} onClick={() => go(k)} aria-current={v === k ? "page" : undefined}><Ico n={i} />{l}{badge(k) > 0 && <span className="badge" style={{ marginLeft: "auto" }}>{badge(k)}</span>}</button>;
  return (<div className="shell">
    <aside className="side"><div className="brand" style={{ justifyContent: "center" }}><Logo s={60} /></div>
      <button type="button" className="sideme" onClick={() => go("profile")} aria-label={t("Mon profil")}><Avatar u={user} s={40} /><span className="grow ell"><b>{user.name}</b></span></button>
      <button className="btn" style={{ margin: "2px 0 8px" }} onClick={() => setAsk(true)}><Ico n="plus" s={18} />{" "}{t("Créer")}</button>
      {navItems().map(([k, l, i]) => <Item key={k} k={k} l={l} i={i} />)}
      <SideBdays go={go} />
</aside>
    <main className={"main" + (v === "home" ? " ishome" : "") + (v === "settings" ? " issettings" : "")}>
      <div className="brandbar"><BdayDeco><BrandWm bdText={bdt.text} onHome={() => { go("home"); window.scrollTo({ top: 0 }); }} id={accentOf(accent).id} light={light} sound={fxOn} big /></BdayDeco></div>
      {topKeys.includes("search") && <div className="dsearch"><SearchTop go={go} openConv={openConvFull} /><button type="button" className="dtheme" onClick={() => actions.setSetting("mode", light ? "dark" : "light")} aria-label={light ? t("Passer en thème sombre") : t("Passer en thème clair")}><Ico n={light ? "moon" : "sun"} s={22} /></button></div>}
      <div className={"top" + (v !== "home" ? " sub" : "")}><button className="topme" onClick={() => go("profile")} aria-label={t("Mon profil")}><Avatar u={user} s={46} /></button>{v !== "home" && <button className="topb" style={{ marginLeft: 8 }} onClick={() => history.back()} aria-label={t("Retour")}><Ico n="back" s={20} /></button>}<span className="grow tcenter"><span className="tw"><BdayDeco><BrandWm bdText={bdt.text} onHome={() => { go("home"); window.scrollTo({ top: 0 }); }} id={accentOf(accent).id} light={light} sound={fxOn} /></BdayDeco></span>{v === "home" && topKeys.includes("search") && <span className="mpill"><SearchTop go={go} openConv={openConvFull} /></span>}</span><div className="topr">{topKeys.filter((k) => k !== "profile").map((k) => k === "theme" ? <button key="theme" className="topb" onClick={() => actions.setSetting("mode", light ? "dark" : "light")} aria-label={light ? t("Passer en thème sombre") : t("Passer en thème clair")}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{light ? <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /> : <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>}</svg></button> : k === "search" ? <span key="search" className="topsearch"><SearchTop variant="icon" go={go} openConv={openConvFull} /></span> : (() => { const it = navItems().find((n) => n[0] === k); if (!it) return null; return <button key={k} className="topb" onClick={() => go(k)} aria-label={it[1]} style={{ position: "relative" }}><Ico n={it[2]} s={20} />{badge(it[0] as V) > 0 && <span className="badge" style={{ position: "absolute", top: -4, right: -4 }}>{badge(it[0] as V)}</span>}</button>; })())}<button className={"topb" + (more ? " on" : "")} onClick={() => { history.pushState({ v, more: 1 }, ""); setMore(true); }} aria-label={t("Tous les menus")}><Ico n="apps" s={20} /></button></div>{v !== "home" && v !== "settings" && <button type="button" className="topb subgear" onClick={() => go("settings")} aria-label={t("Paramètres")}><Ico n={(navItems().find((n) => n[0] === "settings") || ["", "", "settings"])[2]} s={20} /></button>}</div>
      {warn && <div className="card small" style={{ borderColor: "var(--warm)", marginBottom: 10 }}>⚠️ {warn}</div>}
      {page}</main>
    <aside className="right">
      <div className="card row"><Avatar u={user} s={48} /><div className="grow"><b>{user.name}</b><div className="muted small ell">{user.status}</div></div></div>
      <RightPanel go={go} />
    </aside>
    <nav className="bottom" aria-label={t("Navigation")}>
      {bar.slice(0, half).map(tab)}
      <button className="plus" {...pressProps(() => setAsk(true), () => setCompose("selfie"))} aria-label={t("Créer : une story ou une publication. Appui long pour un selfie vidéo")}><img src="./icon-192.png" alt="" width="58" height="58" /><span className="pbadge">+</span></button>
      {bar.slice(half).map(tab)}</nav>
    {more && <Modal title={t("Plus")} onClose={() => { if (history.state?.more) history.back(); else setMore(false); }}><div className="col" style={{ gap: 18 }}>
      {([[t("Les plus utiles"), [["media", t("Photos"), "img"], ["groups", t("Groupes"), "group"], ["games", t("Jeux"), "game"], ["events", t("Événements"), "cal"], ["voice", t("Vocal"), "voice"], ["calls", t("Appels"), "phone"]]], [t("Le reste"), [["shares", t("Partages"), "send"], ["notifs", t("Notifications"), "bell"], ["profile", t("Profil"), "user"], ["settings", t("Paramètres"), "cog"], ["legal", t("Légal"), "lock"]]]] as [string, [V, string, string][]][]).map(([tx, items]) =>
        <div key={tx} className="col" style={{ gap: 8 }}><b className="muted small" style={{ textTransform: "uppercase", letterSpacing: ".08em" }}>{tx}</b>
          <div className="tiles two">{items.map(([k, l, i]) => <button key={k} data-k={k} className="tile" onClick={() => go(k)}><span className="tic"><Ico n={i} s={24} /></span><span>{l}</span>{badge(k) > 0 && <span className="badge" style={{ position: "absolute", top: 6, right: 6 }}>{badge(k)}</span>}</button>)}</div></div>)}</div></Modal>}
    {started && <Guide />}
    {treasure && <Modal title={t("🏆 Tu as trouvé le trésor !")} onClose={() => setTreasure(false)}><div className="col center" style={{ alignItems: "center", gap: 10 }}><div style={{ fontSize: 64 }}>💎</div><b>{t("Bravo, chercheur de trésor !")}</b><p className="muted">{t("Tu as touché le logo plein de fois. Voici 10 points bonus, rien que pour toi.")}</p><button className="btn" onClick={() => setTreasure(false)}>{t("Merci !")}</button></div></Modal>}
    {arrived && <ArrivedModal onClose={() => setArrived(false)} />}
    {pendCode && (() => { const tx = users.find((x) => x.code === pendCode); const done = () => { setPendCode(""); history.replaceState(null, "", location.pathname + location.search); };
      return <Modal title={t("Invitation NOTIIF")} onClose={done}><div className="col center" style={{ alignItems: "center" }}>{tx ? <><Avatar u={tx} s={72} /><h3>{t("Ajouter {name} ?", { name: tx.name })}</h3><p className="muted small">@{tx.handle}</p><button className="btn" onClick={() => { toast(actions.addByCode(pendCode).msg); done(); }}>{t("Envoyer la demande")}</button></> : <p className="muted">{t("Ce code n'existe pas sur cet appareil. En mode démo, les comptes ne sont pas encore partagés entre appareils : cela viendra avec le serveur.")}</p>}<button className="btn ghost" onClick={done}>{t("Plus tard")}</button></div></Modal>; })()}
    {v !== "messages" && bubbleOn && <ChatBubble openList={() => go("messages")} openFull={(id) => { history.pushState({ v: "messages", conv: id }, ""); setV("messages"); }} />}
    {ask && <Modal title={t("Créer")} onClose={() => setAsk(false)}><div className="col" style={{ gap: 10 }}>
      <b className="small muted">{t("Dans la bulle du haut (24 h)")}</b>
      <button className="btn bigbtn" onClick={() => { setAsk(false); setCompose("selfie"); }}><span className="grow"><b>{t("🤳 Selfie")}</b><small>{t("Photo ou vidéo, plein écran")}</small></span></button>
      <button className="btn bigbtn" onClick={() => { setAsk(false); setCompose("photo"); }}><span className="grow"><b>{"🖼️ "}{t("Photo de la galerie")}</b><small>{t("Visible dans la bulle de vos amis")}</small></span></button>
      <button className="btn bigbtn" onClick={() => { setAsk(false); setCompose("saudio"); }}><span className="grow"><b>{micText(t("🎤 Vocal"))}</b><small>{t("Ta voix en story, 24 h")}</small></span></button>
      <label className="row small" style={{ gap: 8 }}><Switch on={wall} onChange={setWall} label={t("Garder aussi sur mon mur")} /><span>{t("Garder aussi sur mon mur")}</span></label>
      <b className="small muted">{t("Sur le mur (reste affiché)")}</b>
      <button className="btn bigbtn alt" onClick={() => { setAsk(false); setCompose("text"); }}><span className="grow"><b>{t("✏️ Écrire un texte")}</b></span></button>
      <button className="btn bigbtn alt" onClick={() => { setAsk(false); setCompose("audio"); }}><span className="grow"><b>{micText(t("🎤 Message vocal"))}</b></span></button>
      <button className="btn bigbtn alt" onClick={() => { setAsk(false); setCompose("link"); }}><span className="grow"><b>{"🔗 "}{t("Lien")}</b></span></button>
      <p className="muted small center" style={{ margin: 0 }}>{t("Astuce : restez appuyé sur le bouton pour ouvrir directement la caméra.")}</p></div></Modal>}
    {storyC && <QuickCompose story onClose={() => setStoryC(false)} />}
    {compose && <QuickCompose key={compose} long={compose === "long" || compose === "selfie"} story={compose === "selfie" || compose === "photo" || compose === "saudio"} alsoWall={wall} kind={compose === "saudio" ? "audio" : compose === "text" || compose === "photo" || compose === "audio" || compose === "link" ? compose : undefined} onClose={() => setCompose(false)} />}
    {!hand && !matchMedia("(hover: hover) and (pointer: fine)").matches && <Modal title={t("Quelle main ?")} onClose={() => actions.setSetting("hand", "right")}><div className="col" style={{ gap: 10 }}><p style={{ margin: 0 }}>{t("Tu tiens ton téléphone avec quelle main ? Les gros boutons se placeront du côté de ton pouce. Tu peux changer plus tard dans les réglages.")}</p><div className="row" style={{ gap: 10 }}><button type="button" className="btn bigbtn grow" onClick={() => actions.setSetting("hand", "left")}>{t("✋ Main gauche")}</button><button type="button" className="btn bigbtn grow" onClick={() => actions.setSetting("hand", "right")}>{t("🤚 Main droite")}</button></div></div></Modal>}
    <MiniPlayer /><ToastHost /></div>);
}
function RightPanel({ go }: { go: (v: string) => void }) {
  const s = useStore((x) => x); const evs = s.events.filter((e) => (e.hostId === s.me || e.inviteIds.includes(s.me)) && e.at > Date.now()).sort((a, b) => a.at - b.at).slice(0, 3); const groups = s.social.groups.filter((g) => g.memberIds.includes(s.me));
  return (<><div className="card col"><b>{t("Mes groupes")}</b>{groups.map((g) => <button key={g.id} className="row" style={{ background: "none", border: 0, color: "inherit", textAlign: "left", padding: 0 }} onClick={() => go("groups")}><span style={{ fontSize: "1.4rem" }}>{g.emoji}</span><span className="grow">{g.name}</span></button>)}</div>
    <div className="card col"><b>{t("À venir")}</b>{evs.map((e) => <div key={e.id}><div>{e.title}</div><div className="muted small">{new Date(e.at).toLocaleDateString(locale(), { weekday: "long", day: "numeric", month: "long" })}</div></div>)}{!evs.length && <span className="muted small">{t("Aucun événement.")}</span>}</div>
    <button className="card row" style={{ color: "inherit" }} onClick={() => go("games")}><Ico n="game" /><b className="grow">{t("Jouer en famille")}</b></button></>);
}
