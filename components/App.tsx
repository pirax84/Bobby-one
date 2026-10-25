"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, Check } from "lucide-react";
import { useS, View } from "@/lib/store";
import { NAV, Bobby, speak, stopSpeak, Fab, ToastHost } from "./ui";
import { useT, LANGS, RTL } from "@/lib/i18n";
import { BotV, HomeV, TextV, WebV, ImageV, QrV, CallsV, ThreatsV, FamilyV, CommunityV, SettingsV } from "./views";
const VIEWS: Record<View, () => JSX.Element> = { home: HomeV, chat: BotV, text: TextV, web: WebV, image: ImageV, qr: QrV, calls: CallsV, threats: ThreatsV, family: FamilyV, community: CommunityV, settings: SettingsV };
const STEPS = [["Bonjour, je suis Bobby.", "Je suis votre gardien personnel. Je vérifie messages, sites, appels et QR codes avant que vous ne fassiez une erreur."], ["Simple, comme une conversation", "Collez un message ou une adresse, je vous dis en clair si vous pouvez avoir confiance. Sans jargon."], ["Bobby veille sur vous.", "Protégez aussi vos proches grâce au mode famille et aux alertes de la communauté."]];
const BOTTOM: View[] = ["home", "calls", "chat", "community"];
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
    <main className="flex-1 min-w-0 p-4 md:p-8 pb-28 md:pb-8 pt-[max(1rem,env(safe-area-inset-top))] max-w-4xl mx-auto w-full">
      <div className="md:hidden flex items-center gap-3 mb-5"><Bobby s={36} /><p className="font-bold">Bobby One</p></div>
      <AnimatePresence mode="wait" initial={false}><motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .15 }}><V /></motion.div></AnimatePresence>
    </main>
    <nav aria-label="Navigation" className="md:hidden fixed bottom-0 inset-x-0 z-[45] flex justify-around px-2 pt-2 pb-[max(.5rem,env(safe-area-inset-bottom))] border-t backdrop-blur-xl" style={{ background: "var(--card)", borderColor: "var(--bd)" }}>
      {[...BOTTOM.map((id) => NAV.find((n) => n.id === id)!)].map((n) => <button type="button" key={n.id} onClick={() => nav(n.id)} aria-current={view === n.id ? "page" : undefined} className="flex flex-col items-center gap-1 text-[11px] px-2 py-1 min-w-[56px]" style={{ color: view === n.id ? "var(--brand)" : "var(--mute)" }}><n.icon size={22} /><span className="max-w-[72px] truncate">{t(n.label).replace(/^Analyse /, "")}</span></button>)}
      <button type="button" onClick={() => setMore(!more)} aria-expanded={more} className="flex flex-col items-center gap-1 text-[11px] px-2 py-1 min-w-[56px]" style={{ color: inMore || more ? "var(--brand)" : "var(--mute)" }}><MoreHorizontal size={22} /><span>{t("Plus")}</span></button></nav>
    <AnimatePresence>{more && <><motion.div key="bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="md:hidden fixed inset-0 z-40" onClick={() => setMore(false)} />
      <motion.div key="m" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} className="md:hidden card fixed bottom-24 inset-x-3 z-50 p-3 grid grid-cols-2 gap-2" style={{ background: "var(--solid)" }}>{NAV.filter((n) => !BOTTOM.includes(n.id)).map((n) => <button type="button" key={n.id} onClick={() => nav(n.id)} className="flex items-center gap-2 p-3 rounded-2xl text-sm text-start" style={{ background: view === n.id ? "var(--soft)" : "var(--card)", color: view === n.id ? "var(--brand)" : undefined }}><n.icon size={18} style={{ color: "var(--brand)" }} />{t(n.label)}</button>)}</motion.div></>}</AnimatePresence>
    <ToastHost />
    {onboarded && <Fab />}
    <AnimatePresence>{!onboarded && <motion.div role="dialog" aria-modal="true" exit={{ opacity: 0 }} className="fixed inset-0 z-[70] grid place-items-center p-4 bg-black/80 overflow-y-auto"><motion.div key={step} initial={{ scale: .95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-7 max-w-md w-full text-center space-y-5" style={{ background: "var(--solid)" }}>
      <div className="flex justify-center"><Bobby s={84} /></div>
      {step === 0 && <select className="inp max-w-[240px] mx-auto" aria-label="Langue / Language" value={settings.lang} onChange={(e) => set({ lang: e.target.value })}>{Object.keys(LANGS).map((l) => <option key={l} value={l}>{l}</option>)}</select>}
      <h2 className="text-2xl font-bold">{t(STEPS[step][0])}</h2><p className="text-mute">{t(STEPS[step][1])}</p>
      <div className="flex justify-center gap-2">{STEPS.map((_, i) => <span key={i} className="h-2 rounded-full transition-all" style={{ width: i === step ? 24 : 8, background: i === step ? "var(--brand)" : "var(--bd)" }} />)}</div>
      <div className="flex gap-3 justify-center"><button type="button" className="btn2" onClick={() => { stopSpeak(); finish(); }}>{t("Passer")}</button><button type="button" className="btn" onClick={() => { if (step < 2) setStep(step + 1); else { finish(); if (settings.voice !== false) speak(t("Bonjour, je suis Bobby. Je veille sur vous."), settings.lang); } }}>{t(step < 2 ? "Suivant" : "Commencer")}</button></div></motion.div></motion.div>}</AnimatePresence>
  </div>);
}
