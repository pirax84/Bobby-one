import { applyTheme } from "./lib/theme";
import { useEffect, useRef, useState } from "react";
import { useStore, actions, userOf, getSaveWarn } from "./lib/store";
import { Avatar, Ico, Logo, ToastHost, Modal, toast, pressProps } from "./ui/common";
import { Home, QuickCompose } from "./ui/Home";
import { Friends, Groups, Events, Profile, Notifs, Settings } from "./ui/Social";
import { Messages, Games, Soon } from "./ui/Chat";
import { Media } from "./ui/Albums";
import { LegalView } from "./ui/Legal";
import { Shares } from "./ui/Shares";
import { Onboarding, needInstall } from "./ui/Auth";
import { ChatBubble } from "./ui/Bubble";
import { playFx, playCustom, Fx, playTone, vibrate } from "./lib/fx";
import { sessionFromReturn } from "./lib/auth";

type V = "home" | "friends" | "groups" | "messages" | "calls" | "media" | "games" | "events" | "notifs" | "profile" | "shares" | "legal" | "settings";
export const NAV: [V, string, string][] = [["home", "Accueil", "home"], ["friends", "Amis", "users"], ["groups", "Groupes", "group"], ["messages", "Messages", "chat"], ["calls", "Appels", "phone"], ["media", "Photos", "img"], ["games", "Jeux", "game"], ["events", "Événements", "cal"], ["shares", "Partages", "send"], ["notifs", "Notifications", "bell"], ["profile", "Profil", "user"], ["legal", "Légal", "lock"], ["settings", "Paramètres", "cog"]];


export default function App() {
  const pushOn = useStore((x) => !!x.settings[x.me]?.push); const lastNotif = useStore((x) => x.notifs.filter((n) => n.to === x.me && !n.read).sort((a, b) => b.at - a.at)[0]); const seenN = useRef<string | undefined>(undefined);
  const fxOn = useStore((x) => x.settings[x.me]?.fx ?? true); const lastFxMsg = useStore((x) => { let b: { id: string; fx?: string; at: number } | undefined; for (const c of x.convs) if (c.memberIds.includes(x.me)) for (const m of c.msgs) if (m.fx && m.from !== x.me && (!b || m.at > b.at)) b = m; return b ? b.id + "|" + b.fx : ""; }); const lastCfx = useStore((x) => { let b: { at: number; cfx?: { name: string; img?: string; audio?: string } } | undefined; for (const c of x.convs) if (c.memberIds.includes(x.me)) for (const m of c.msgs) if (m.fx && m.from !== x.me && (!b || m.at > b.at)) b = m; return b?.cfx; }); const seenFx = useRef<string | undefined>(undefined); const th0 = useStore((x) => x.settings[x.me]); const lastCall = useStore((x) => { let b: { id: string; at: number } | undefined; for (const c of x.convs) if (c.memberIds.includes(x.me)) for (const m of c.msgs) if (m.from !== x.me && m.text.startsWith("📹") && (!b || m.at > b.at)) b = m; return b?.id || ""; }); const seenCall = useRef<string | undefined>(undefined);
  const navCfg = useStore((x) => x.settings[x.me]?.nav); const topCfg = useStore((x) => x.settings[x.me]?.top); const started = useStore((s) => s.started); const me = useStore((s) => s.me); const light = useStore((s) => s.settings[s.me]?.light ?? true);
  const unreadN = useStore((s) => s.notifs.filter((n) => n.to === s.me && !n.read).length); const unreadM = useStore((s) => s.convs.filter((c) => c.memberIds.includes(s.me)).reduce((a, c) => a + c.msgs.filter((m) => m.from !== s.me && m.reads[s.me] === undefined).length, 0));
  const reqs = useStore((s) => s.reqs.filter((r) => r.to === s.me).length); const user = useStore((s) => userOf(s, s.me));
  const pendShares = useStore((s) => s.shares.filter((h) => h.authorId === s.me && h.status === "pending").length);
  const users = useStore((s) => s.users);
  const parseHash = () => { const m = location.hash.match(/add=(NID-[A-Z0-9]{5})/i); return m ? m[1].toUpperCase() : ""; };
  const [pendCode, setPendCode] = useState(parseHash());
  useEffect(() => { const f = () => setPendCode(parseHash() || ""); window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); }, []);
  const [v, setV] = useState<V>(() => (history.state?.v as V) || "home"); const [compose, setCompose] = useState<false | "short" | "long">(false); const [more, setMore] = useState(false);
  const th = useStore((s) => s.settings[s.me]); useEffect(() => { applyTheme({ light: !!light, premium: !!th?.premium, bg: th?.bg, fg: th?.fg, accent: th?.accent }); }, [light, th?.premium, th?.bg, th?.fg, th?.accent]);
  useEffect(() => { window.scrollTo(0, 0); }, [v]);
  useEffect(() => { if (!history.state?.v) history.replaceState({ v: "home" }, ""); const f = (e: PopStateEvent) => { setV(((e.state && e.state.v) as V) || "home"); setMore(!!(e.state && e.state.more)); }; window.addEventListener("popstate", f); return () => window.removeEventListener("popstate", f); }, []);
  useEffect(() => { if (seenFx.current === undefined) { seenFx.current = lastFxMsg; return; } if (!lastFxMsg || lastFxMsg === seenFx.current) return; seenFx.current = lastFxMsg; if (fxOn) { const k = lastFxMsg.split("|")[1]; if (k === "custom") { if (lastCfx) playCustom(lastCfx); } else playFx(k as Fx); } }, [lastFxMsg]);
  useEffect(() => { if (seenCall.current === undefined) { seenCall.current = lastCall; return; } if (!lastCall || lastCall === seenCall.current) return; seenCall.current = lastCall; if (!th0?.quiet) { playTone(th0?.ctone || "c1", 3); vibrate(th0?.vibc, 3); } }, [lastCall]);
  useEffect(() => { // notifications du téléphone : seulement quand l'application est ouverte ou en arrière-plan (hors-ligne = serveur nécessaire)
    if (seenN.current === undefined) { seenN.current = lastNotif?.id || ""; return; }
    if (!lastNotif || lastNotif.id === seenN.current) return; seenN.current = lastNotif.id;
    if (!th0?.quiet) { playTone(th0?.ntone || "n1"); vibrate(th0?.vibm, 1); }
    const nat = (window as any).CercleNative; if (pushOn && nat?.notify) { try { nat.notify("Mon cercle", lastNotif.text); } catch { /* ignoré */ } return; }
    if (!pushOn || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const opt = { body: lastNotif.text, icon: "./icon-192.png", badge: "./icon-192.png", tag: lastNotif.id, vibrate: [200, 100, 200] } as NotificationOptions;
    navigator.serviceWorker?.ready.then((r) => r.showNotification("Mon cercle", opt)).catch(() => { try { new Notification("Mon cercle", opt); } catch { /* ignoré */ } });
  }, [lastNotif?.id, pushOn]);
  useEffect(() => { sessionFromReturn().then((w) => { if (w && !started) actions.start(w.name); }).catch(() => {}); }, []);
  if (!started || !me || !user || needInstall()) return <><Onboarding started={!!(started && me && user)} /><ToastHost /></>;
  const tab = ([k, l, i]: [V, string, string]) => <button key={k} className={v === k ? "on" : ""} onClick={() => go(k)} style={{ position: "relative" }}><Ico n={i} /><i>{l}</i>{badge(k) > 0 && <span className="badge" style={{ position: "absolute", top: 0, right: 4 }}>{badge(k)}</span>}</button>;
  const go = (x: string) => { if (x !== v) history.pushState({ v: x }, ""); setV(x as V); setMore(false); };
  const bar = (navCfg ? navCfg.split(",") : ["home", "friends", "messages"]).map((k) => NAV.find((n) => n[0] === k)).filter(Boolean).slice(0, 3) as [V, string, string][];
  const topKeys = (topCfg ? topCfg.split(",") : ["notifs", "settings", "profile"]).filter((k) => NAV.some((n) => n[0] === k)).slice(0, 3);
  const badge = (k: V) => (k === "shares" ? pendShares : k === "notifs" ? unreadN : k === "messages" ? unreadM : k === "friends" ? reqs : 0);
  const page = v === "home" ? <Home /> : v === "friends" ? <Friends go={go} /> : v === "groups" ? <Groups /> : v === "messages" ? <Messages /> : v === "games" ? <Games /> : v === "events" ? <Events /> : v === "media" ? <Media /> : v === "profile" ? <Profile /> : v === "notifs" ? <Notifs go={go} /> : v === "shares" ? <Shares /> : v === "legal" ? <LegalView /> : v === "settings" ? <Settings />
    : <Soon title="Appels audio et vidéo" icon="📞" why="Les appels demandent un serveur de connexion (WebRTC). Ils seront ajoutés quand le serveur Mon cercle sera en place." />;
  const warn = getSaveWarn();
  const Item = ({ k, l, i }: { k: V; l: string; i: string }) => <button className={"navbtn" + (v === k ? " on" : "")} onClick={() => go(k)} aria-current={v === k ? "page" : undefined}><Ico n={i} />{l}{badge(k) > 0 && <span className="badge" style={{ marginLeft: "auto" }}>{badge(k)}</span>}</button>;
  return (<div className="shell">
    <aside className="side"><div className="brand"><Logo /><div><b>Votre cercle.</b><div className="muted small">Vos moments.</div></div></div>
      {NAV.map(([k, l, i]) => <Item key={k} k={k} l={l} i={i} />)}
      <button className="btn" style={{ marginTop: 10 }} onClick={() => setCompose("short")}><Ico n="plus" s={18} /> Publier</button></aside>
    <main className="main">
      <div className="top">{v !== "home" ? <button className="topb" onClick={() => history.back()} aria-label="Retour"><Ico n="back" s={20} /></button> : <span className="grow" />}<span className="grow" /><div className="topr">{topKeys.map((k) => k === "profile" ? <button key={k} style={{ background: "none", border: 0, padding: 0 }} onClick={() => go("profile")} aria-label="Mon profil"><Avatar u={user} s={34} /></button> : (() => { const it = NAV.find((n) => n[0] === k); if (!it) return null; return <button key={k} className="topb" onClick={() => go(k)} aria-label={it[1]} style={{ position: "relative" }}><Ico n={it[2]} s={20} />{badge(it[0] as V) > 0 && <span className="badge" style={{ position: "absolute", top: -4, right: -4 }}>{badge(it[0] as V)}</span>}</button>; })())}</div></div>
      {warn && <div className="card small" style={{ borderColor: "var(--warm)", marginBottom: 10 }}>⚠️ {warn}</div>}
      {page}</main>
    <aside className="right">
      <div className="card row"><Avatar u={user} s={48} /><div className="grow"><b>{user.name}</b><div className="muted small ell">{user.status}</div></div></div>
      <RightPanel go={go} />
    </aside>
    <nav className="bottom" aria-label="Navigation">
      {bar.slice(0, 2).map(tab)}
      <button className="plus" {...pressProps(() => setCompose("short"), () => setCompose("long"))} aria-label="Publier : appui simple pour écrire ou photo, appui long pour un selfie vidéo"><img src="./icon-192.png" alt="" width="58" height="58" /><span className="pbadge">+</span></button>
      {bar.slice(2, 3).map(tab)}
      <button className={more ? "on" : ""} onClick={() => { history.pushState({ v, more: 1 }, ""); setMore(true); }}><Ico n="apps" /><i>Plus</i></button></nav>
    {more && <Modal title="Plus" onClose={() => { if (history.state?.more) history.back(); else setMore(false); }}><div className="col" style={{ gap: 18 }}>
      {([["Mon cercle", [["groups", "Groupes", "group"], ["events", "Événements", "cal"], ["shares", "Partages", "send"]]], ["Médias et jeux", [["media", "Photos", "img"], ["games", "Jeux", "game"], ["calls", "Appels", "phone"]]], ["Mon compte", [["notifs", "Notifications", "bell"], ["profile", "Profil", "user"], ["settings", "Paramètres", "cog"], ["legal", "Légal", "lock"]]]] as [string, [V, string, string][]][]).map(([t, items]) =>
        <div key={t} className="col" style={{ gap: 8 }}><b className="muted small" style={{ textTransform: "uppercase", letterSpacing: ".08em" }}>{t}</b>
          <div className="tiles">{items.map(([k, l, i]) => <button key={k} className="tile" onClick={() => go(k)}><span className="tic"><Ico n={i} s={24} /></span><span>{l}</span>{badge(k) > 0 && <span className="badge" style={{ position: "absolute", top: 6, right: 6 }}>{badge(k)}</span>}</button>)}</div></div>)}</div></Modal>}
    {pendCode && (() => { const t = users.find((x) => x.code === pendCode); const done = () => { setPendCode(""); history.replaceState(null, "", location.pathname + location.search); };
      return <Modal title="Invitation Mon cercle" onClose={done}><div className="col center" style={{ alignItems: "center" }}>{t ? <><Avatar u={t} s={72} /><h3>Ajouter {t.name} ?</h3><p className="muted small">@{t.handle}</p><button className="btn" onClick={() => { toast(actions.addByCode(pendCode).msg); done(); }}>Envoyer la demande</button></> : <p className="muted">Ce code n'existe pas sur cet appareil. En mode démo, les comptes ne sont pas encore partagés entre appareils : cela viendra avec le serveur.</p>}<button className="btn ghost" onClick={done}>Plus tard</button></div></Modal>; })()}
    {v !== "messages" && <ChatBubble openFull={(id) => { history.pushState({ v: "messages", conv: id }, ""); setV("messages"); }} />}
    {compose && <QuickCompose long={compose === "long"} onClose={() => setCompose(false)} />}
    <ToastHost /></div>);
}
function RightPanel({ go }: { go: (v: string) => void }) {
  const s = useStore((x) => x); const evs = s.events.filter((e) => (e.hostId === s.me || e.inviteIds.includes(s.me)) && e.at > Date.now()).sort((a, b) => a.at - b.at).slice(0, 3); const groups = s.social.groups.filter((g) => g.memberIds.includes(s.me));
  return (<><div className="card col"><b>Mes groupes</b>{groups.map((g) => <button key={g.id} className="row" style={{ background: "none", border: 0, color: "inherit", textAlign: "left", padding: 0 }} onClick={() => go("groups")}><span style={{ fontSize: "1.4rem" }}>{g.emoji}</span><span className="grow">{g.name}</span></button>)}</div>
    <div className="card col"><b>À venir</b>{evs.map((e) => <div key={e.id}><div>{e.title}</div><div className="muted small">{new Date(e.at).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</div></div>)}{!evs.length && <span className="muted small">Aucun événement.</span>}</div>
    <button className="card row" style={{ color: "inherit" }} onClick={() => go("games")}><Ico n="game" /><b className="grow">Jouer en famille</b></button></>);
}
