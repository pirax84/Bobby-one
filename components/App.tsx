"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal } from "lucide-react";
import { useS, View } from "@/lib/store";
import { NAV, Bobby, speak } from "./ui";
import { useT } from "@/lib/i18n";
import { BotV, HomeV, TextV, WebV, ImageV, QrV, CallsV, ThreatsV, FamilyV, CommunityV, SettingsV } from "./views";
const VIEWS: Record<View, () => JSX.Element> = { home: HomeV, chat: BotV, text: TextV, web: WebV, image: ImageV, qr: QrV, calls: CallsV, threats: ThreatsV, family: FamilyV, community: CommunityV, settings: SettingsV };
const STEPS = [["Bonjour, je suis Bobby.", "Je suis votre gardien personnel. Je vérifie messages, sites, appels et QR codes avant que vous ne fassiez une erreur."], ["Simple, comme une conversation", "Collez un message ou une adresse, je vous dis en clair si vous pouvez avoir confiance. Sans jargon."], ["Bobby veille sur vous.", "Protégez aussi vos proches grâce au mode famille et aux alertes de la communauté."]];
export default function App() {
  const { view, go, onboarded, finish, settings } = useS(); const [ok, setOk] = useState(false); const [step, setStep] = useState(0); const [more, setMore] = useState(false);
  const t = useT();
  useEffect(() => setOk(true), []);
  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } if (!onboarded || settings.voice === false) return; const n = NAV.find((x) => x.id === view)!; speak(t(n.label) + ". " + t(n.desc), settings.lang); }, [view]);
  useEffect(() => { document.documentElement.classList.toggle("light", settings.theme === "light"); }, [settings.theme]);
  if (!ok) return null;
  const V = VIEWS[view]; const main = NAV.slice(0, 5), rest = NAV.slice(5);
  const nav = (id: View) => { go(id); setMore(false); window.scrollTo({ top: 0 }); };
  return (<div className="min-h-screen md:flex">
    <aside className="hidden md:flex flex-col w-64 shrink-0 p-4 gap-1 sticky top-0 h-screen border-r" style={{ borderColor: "var(--bd)" }}>
      <div className="flex items-center gap-3 p-3 mb-4"><Bobby s={40} /><div><p className="font-bold leading-tight">Bobby One</p><p className="text-xs text-mute">Bobby veille sur vous.</p></div></div>
      {NAV.map((n) => <button key={n.id} onClick={() => nav(n.id)} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition hover:bg-[rgba(0,208,132,.08)]" style={view === n.id ? { background: "rgba(0,208,132,.15)", color: "#00D084" } : { color: "var(--mute)" }}><n.icon size={18} />{t(n.label)}</button>)}
    </aside>
    <main className="flex-1 min-w-0 p-4 md:p-8 pb-28 md:pb-8 pt-[max(1rem,env(safe-area-inset-top))] max-w-5xl mx-auto w-full">
      <div className="md:hidden flex items-center gap-3 mb-5"><Bobby s={36} /><p className="font-bold">Bobby One</p></div>
      <AnimatePresence mode="wait"><motion.div key={view} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .2 }}><V /></motion.div></AnimatePresence>
    </main>
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex justify-around p-2 border-t backdrop-blur" style={{ background: "var(--card)", borderColor: "var(--bd)" }}>
      {main.slice(0, 4).map((n) => <button key={n.id} onClick={() => nav(n.id)} className="flex flex-col items-center gap-1 text-[11px] px-2 py-1" style={{ color: view === n.id ? "#00D084" : "var(--mute)" }}><n.icon size={22} /><span className="max-w-[64px] truncate">{t(n.label).replace(/^Analyse /, "")}</span></button>)}
      <button onClick={() => setMore(!more)} className="flex flex-col items-center gap-1 text-[11px] px-2 py-1 text-mute"><MoreHorizontal size={22} />Plus</button></nav>
    <AnimatePresence>{more && <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} className="md:hidden card fixed bottom-20 inset-x-3 z-40 p-3 grid grid-cols-2 gap-2">{[NAV[4], ...rest].map((n) => <button key={n.id} onClick={() => nav(n.id)} className="flex items-center gap-2 p-3 rounded-2xl text-sm" style={{ background: "var(--bd)" }}><n.icon size={18} color="#00D084" />{t(n.label)}</button>)}</motion.div>}</AnimatePresence>
    <AnimatePresence>{!onboarded && <motion.div exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/80"><motion.div key={step} initial={{ scale: .95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-8 max-w-md w-full text-center space-y-5"><div className="flex justify-center"><Bobby s={88} /></div><h2 className="text-2xl font-bold">{STEPS[step][0]}</h2><p className="text-mute">{STEPS[step][1]}</p>
      <div className="flex justify-center gap-2">{STEPS.map((_, i) => <span key={i} className="h-2 rounded-full transition-all" style={{ width: i === step ? 24 : 8, background: i === step ? "#00D084" : "var(--bd)" }} />)}</div>
      <div className="flex gap-3 justify-center"><button className="btn2" onClick={finish}>Passer</button><button className="btn" onClick={() => (step < 2 ? setStep(step + 1) : finish())}>{step < 2 ? "Suivant" : "Commencer"}</button></div></motion.div></motion.div>}</AnimatePresence>
  </div>);
}
