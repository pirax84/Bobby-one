"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid } from "lucide-react";
import { useS, View } from "@/lib/store";
import { NAV, Bobby, speak, stopSpeak, Fab, ToastHost } from "./ui";
import { useT, LANGS, RTL } from "@/lib/i18n";
import { BotV, HomeV, TextV, WebV, ImageV, QrV, CallsV, ThreatsV, FamilyV, CommunityV, SettingsV } from "./views";
const VIEWS: Record<View, () => JSX.Element> = { home: HomeV, chat: BotV, text: TextV, web: WebV, image: ImageV, qr: QrV, calls: CallsV, threats: ThreatsV, family: FamilyV, community: CommunityV, settings: SettingsV };
const STEPS = [["Bonjour, je suis Bobby.", "Je suis votre gardien personnel. Je vérifie messages, sites, appels et QR codes avant que vous ne fassiez une erreur."], ["Simple, comme une conversation", "Collez un message ou une adresse, je vous dis en clair si vous pouvez avoir confiance. Sans jargon."], ["Bobby veille sur vous.", "Protégez aussi vos proches grâce au mode famille et aux alertes de la communauté."]];
const BOTTOM: View[] = ["home", "calls", "chat", "community"];
const DESC = (id: View) => NAV.find((n) => n.id === id)!;
export default function App() {
  const { view, go, onboarded, finish, settings, set, setIncoming } = useS(); const [ok, setOk] = useState(false); const [step, setStep] = useState(0); const [more, setMore] = useState(false);
  const t = useT();
  useEffect(() => {
    setOk(true);
    // Partage vers Bobby (Android) : ?text= ?url= ?title= ou ?go=
    try {
      const p = new URLSearchParams(location.search); const x = [p.get("title"), p.get("text"), p.get("url")].filter(Boolean).join(" ").trim(); const g = p.get("go") as View;
      if (x) { go("home"); setIncoming(x); } else if (g && g in VIEWS) go(g);
      if (x || g) history.replaceState(null, "", location.pathname);
    } catch {}
  }, []);
  useEffect(() => { document.documentElement.dir = RTL.includes(settings.lang) ? "rtl" : "ltr"; document.documentElement.lang = LANGS[settings.lang]?.code || "fr"; }, [settings.lang]);
  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } if (!onboarded || settings.voice === false) return; const n = NAV.find((x) => x.id === view)!; speak(t(n.label) + ". " + t(n.desc), settings.lang); }, [view]);
  useEffect(() => { document.documentElement.classList.toggle("light", settings.theme === "light"); }, [settings.theme]);
  if (!ok) return null;
  const V = VIEWS[view];
  const nav = (id: View) => { go(id); setMore(false); window.scrollTo({ top: 0 }); };
  const groups = ["", "Vérifier", "Protéger"]; const inMore = !BOTTOM.includes(view);
  const item = (n: (typeof NAV)[0]) => <button type="button" key={n.id} onClick={() => nav(n.id)} aria-current={view === n.id ? "page" : undefined} className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-start transition w-full" style={view === n.id ? { background: "var(--soft)", color: "var(--brand)", fontWeight: 600 } : { color: "var(--mute)" }}><n.icon size={18} />{t(n.label)}</button>;
  return (<div className="min-h-screen md:flex">
    <aside className="hidden md:flex flex-col w-64 shrink-0 p-4 gap-1 sticky top-0 h-screen overflow-y-auto border-e" style={{ borderColor: "var(--bd)" }}>
      <div className="flex items-center gap-3 p-3 mb-3"><Bobby s={40} /><div><p className="font-bold leading-tight">Bobby One</p><p className="text-xs text-mute">{t("Bobby veille sur vous.")}</p></div></div>
      {groups.map((g) => <div key={g} className="space-y-1">{g && <p className="text-xs uppercase tracking-wide text-mute px-4 pt-4 pb-1">{t(g)}</p>}{NAV.filter((n) => n.group === g && n.id !== "settings").map(item)}</div>)}
      <div className="mt-auto pt-4">{item(NAV.find((n) => n.id === "settings")!)}</div>
    </aside>
    <main className="flex-1 min-w-0 p-4 md:p-8 pb-32 md:pb-8 pt-[max(1rem,env(safe-area-inset-top))] max-w-4xl mx-auto w-full">
      <div className="md:hidden flex items-center gap-3 mb-5"><Bobby s={36} /><p className="font-bold">Bobby One</p></div>
      <AnimatePresence mode="wait" initial={false}><motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .15 }}><V /></motion.div></AnimatePresence>
    </main>
    <nav aria-label="Navigation" className="md:hidden fixed inset-x-3 z-[45] bottom-[max(.75rem,env(safe-area-inset-bottom))] h-16 rounded-[28px] border backdrop-blur-xl flex items-center justify-between px-2 shadow-2xl" style={{ background: "var(--solid)", borderColor: "var(--bd)" }}>
      {(["home", "calls"] as View[]).map((id) => { const n = DESC(id); const on = view === id; return <button type="button" key={id} onClick={() => nav(id)} aria-current={on ? "page" : undefined} aria-label={t(n.label)} className="relative flex-1 h-12 grid place-items-center active:scale-90 transition-transform">{on && <motion.span layoutId="pill" className="absolute inset-x-1 inset-y-0.5 rounded-2xl" style={{ background: "var(--soft)" }} />}<span className="relative flex flex-col items-center gap-0.5" style={{ color: on ? "var(--brand)" : "var(--mute)" }}><n.icon size={24} strokeWidth={on ? 2.4 : 1.9} /><span className="text-xs font-medium">{t(id === "calls" ? "Appels" : n.label)}</span></span></button>; })}
      <button type="button" onClick={() => nav("chat")} aria-label={t("Parler à Bobby")} aria-current={view === "chat" ? "page" : undefined} className="relative -mt-8 mx-1 w-[68px] h-[68px] shrink-0 rounded-full grid place-items-center active:scale-90 transition-transform" style={{ background: "linear-gradient(135deg,var(--brand),var(--brand2))", boxShadow: "0 8px 24px -4px var(--brand)", border: "4px solid var(--bg)" }}><Bobby s={44} /></button>
      {(["community"] as View[]).map((id) => { const n = DESC(id); const on = view === id; return <button type="button" key={id} onClick={() => nav(id)} aria-current={on ? "page" : undefined} aria-label={t(n.label)} className="relative flex-1 h-12 grid place-items-center active:scale-90 transition-transform">{on && <motion.span layoutId="pill" className="absolute inset-x-1 inset-y-0.5 rounded-2xl" style={{ background: "var(--soft)" }} />}<span className="relative flex flex-col items-center gap-0.5" style={{ color: on ? "var(--brand)" : "var(--mute)" }}><n.icon size={24} strokeWidth={on ? 2.4 : 1.9} /><span className="text-xs font-medium">{t(n.label)}</span></span></button>; })}
      <button type="button" onClick={() => setMore(!more)} aria-expanded={more} aria-label={t("Menu")} className="relative flex-1 h-12 grid place-items-center active:scale-90 transition-transform">{(inMore || more) && <motion.span layoutId="pill" className="absolute inset-x-1 inset-y-0.5 rounded-2xl" style={{ background: "var(--soft)" }} />}<span className="relative flex flex-col items-center gap-0.5" style={{ color: inMore || more ? "var(--brand)" : "var(--mute)" }}><LayoutGrid size={24} strokeWidth={inMore || more ? 2.4 : 1.9} /><span className="text-xs font-medium">{t("Menu")}</span></span></button></nav>
    <AnimatePresence>{more && <><motion.div key="bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMore(false)} />
      <motion.div key="m" role="dialog" aria-label={t("Menu")} initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ type: "spring", damping: 24, stiffness: 300 }} className="md:hidden fixed bottom-28 inset-x-3 z-50 rounded-[28px] border p-4 grid grid-cols-3 gap-3" style={{ background: "var(--solid)", borderColor: "var(--bd)" }}>{NAV.filter((n) => !BOTTOM.includes(n.id)).map((n) => <button type="button" key={n.id} onClick={() => nav(n.id)} className="flex flex-col items-center gap-2 p-3 rounded-3xl text-center text-xs font-medium active:scale-95 transition-transform" style={{ background: view === n.id ? "var(--soft)" : "var(--card)", color: view === n.id ? "var(--brand)" : "var(--fg)" }}><span className="w-12 h-12 rounded-2xl grid place-items-center text-white" style={{ background: "linear-gradient(135deg,var(--brand),var(--brand2))" }}><n.icon size={24} /></span>{t(n.label)}</button>)}</motion.div></>}</AnimatePresence>
    <ToastHost />
    {onboarded && <Fab />}
    <AnimatePresence>{!onboarded && <motion.div role="dialog" aria-modal="true" exit={{ opacity: 0 }} className="fixed inset-0 z-[70] grid place-items-center p-4 bg-black/80 overflow-y-auto"><motion.div key={step} initial={{ scale: .95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-7 max-w-md w-full text-center space-y-5" style={{ background: "var(--solid)" }}>
      <div className="flex justify-center"><img src="/bobby-logo.svg" alt="Bobby One" width={176} height={176} className="rounded-[40px]" style={{ width: 176, height: 176 }} /></div>
      {step === 0 && <select className="inp max-w-[240px] mx-auto" aria-label="Langue / Language" value={settings.lang} onChange={(e) => set({ lang: e.target.value })}>{Object.keys(LANGS).map((l) => <option key={l} value={l}>{l}</option>)}</select>}
      <h2 className="text-2xl font-bold">{t(STEPS[step][0])}</h2><p className="text-mute">{t(STEPS[step][1])}</p>
      <div className="flex justify-center gap-2">{STEPS.map((_, i) => <span key={i} className="h-2 rounded-full transition-all" style={{ width: i === step ? 24 : 8, background: i === step ? "var(--brand)" : "var(--bd)" }} />)}</div>
      <div className="flex gap-3 justify-center"><button type="button" className="btn2" onClick={() => { stopSpeak(); finish(); }}>{t("Passer")}</button><button type="button" className="btn" onClick={() => { if (step < 2) setStep(step + 1); else { finish(); if (settings.voice !== false) speak(t("Bonjour, je suis Bobby. Je veille sur vous."), settings.lang); } }}>{t(step < 2 ? "Suivant" : "Commencer")}</button></div></motion.div></motion.div>}</AnimatePresence>
  </div>);
}
