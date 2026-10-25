"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Bot, Mic as MicI, Volume2, VolumeX, Home, MessageSquareWarning, Globe, Image as Img, QrCode, PhoneCall, Siren, Users, Radio, Settings, Loader2, Check, X } from "lucide-react";
import { META, levelOf, Result } from "@/lib/engine";
import { useS, type View } from "@/lib/store";
import { useT, toFr } from "@/lib/i18n";
import { speak, stopSpeak, listen, ERR } from "@/lib/voice";
export { speak, stopSpeak, listen, ERR };

export const NAV: { id: View; label: string; icon: any; desc: string; group: string }[] = [
  { id: "home", label: "Accueil", icon: Home, desc: "Votre tableau de bord", group: "" },
  { id: "chat", label: "Parler à Bobby", icon: Bot, desc: "Posez-moi vos questions", group: "" },
  { id: "text", label: "Analyse texte", icon: MessageSquareWarning, desc: "SMS, mails, WhatsApp", group: "Vérifier" },
  { id: "web", label: "Analyse site web", icon: Globe, desc: "Ce site est-il fiable ?", group: "Vérifier" },
  { id: "image", label: "Analyse image", icon: Img, desc: "Capture d'écran, photo", group: "Vérifier" },
  { id: "qr", label: "Analyse QR code", icon: QrCode, desc: "Où mène ce code ?", group: "Vérifier" },
  { id: "calls", label: "Protection appels", icon: PhoneCall, desc: "Qui vous appelle ?", group: "Protéger" },
  { id: "threats", label: "Centre des menaces", icon: Siren, desc: "Reconnaître les arnaques", group: "Protéger" },
  { id: "family", label: "Famille", icon: Users, desc: "Protéger vos proches", group: "Protéger" },
  { id: "community", label: "Communauté", icon: Radio, desc: "Signalements en direct", group: "Protéger" },
  { id: "settings", label: "Réglages", icon: Settings, desc: "Personnaliser Bobby", group: "" },
];
export const Bobby = ({ s = 48 }: { s?: number }) => (
  <img src="/bobby.svg" alt="" aria-hidden="true" width={s} height={s} className="shrink-0" style={{ width: s, height: s }} />
);
export function Gauge({ score, size = 140 }: { score: number; size?: number }) {
  const c = META[levelOf(score)].color, r = size / 2 - 10, C = 2 * Math.PI * r;
  return (<div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${score}/100`}>
    <svg width={size} height={size} className="-rotate-90" aria-hidden="true"><circle cx={size / 2} cy={size / 2} r={r} stroke="var(--bd)" strokeWidth="10" fill="none" />
      <motion.circle cx={size / 2} cy={size / 2} r={r} stroke={c} strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - score / 100) }} transition={{ duration: .9 }} /></svg>
    <div className="absolute inset-0 grid place-items-center font-bold" style={{ color: c, fontSize: size / 3.9 }}>{score}</div></div>);
}
export const Badge = ({ lv }: { lv: string }) => { const m = META[lv as keyof typeof META]; const t = useT(); return <span className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap" style={{ background: m.color + "22", color: m.color }}>{t(m.label)}</span>; };
export function Title({ t, d }: { t: string; d: string }) { const T = useT(); return <div className="mb-5"><h1 className="text-2xl md:text-3xl font-bold tracking-tight">{T(t)}</h1><p className="text-mute mt-1">{T(d)}</p></div>; }
export const Toggle = ({ on, f, label }: { on: boolean; f: () => void; label?: string }) => (<button type="button" role="switch" aria-checked={on} aria-label={label} onClick={f} className="flex items-center w-12 h-7 rounded-full p-1 transition-colors shrink-0" style={{ background: on ? "var(--brand)" : "var(--bd)", justifyContent: on ? "flex-end" : "flex-start" }}><span className="block w-5 h-5 rounded-full bg-white" /></button>);

export function Busy({ steps }: { steps: string[] }) {
  const t = useT(); const ref = useRef<HTMLDivElement>(null); const [i, setI] = useState(0);
  useEffect(() => { ref.current?.scrollIntoView({ behavior: "smooth", block: "center" }); const id = setInterval(() => setI((x) => Math.min(x + 1, steps.length - 1)), 650); return () => clearInterval(id); }, []);
  return <div ref={ref} role="status" className="card p-6 space-y-4"><div className="flex items-center gap-3 text-mute"><Loader2 className="animate-spin" size={20} style={{ color: "var(--brand)" }} /><span>{t(steps[i])}</span></div><div className="h-2 rounded-full skeleton" /><div className="h-2 w-2/3 rounded-full skeleton" /></div>;
}
export function Report({ r, children, speakIt = true }: { r: Result; children?: React.ReactNode; speakIt?: boolean }) {
  const m = META[r.level]; const t = useT(); const lang = useS((x) => x.settings.lang); const vo = useS((x) => x.settings.voice !== false); const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const id = setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120); if (vo && speakIt) speak(`${m.bobby} ${r.tips[0]}`, lang); return () => clearTimeout(id); }, []);
  return (<motion.div ref={ref} aria-live="polite" style={{ scrollMarginTop: 80, borderColor: m.color + "88" }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-5 md:p-6 space-y-5">
    <div className="flex items-center gap-5"><Gauge score={r.score} size={116} /><div className="min-w-0"><Badge lv={r.level} /><p className="mt-3 text-lg font-semibold leading-snug">{t(m.bobby)}</p><p className="text-sm text-mute mt-1">{t("Score de confiance")} : {r.score}/100</p></div></div>
    {children}
    <div><h4 className="font-semibold mb-2">{t("Pourquoi ?")}</h4><ul className="space-y-1.5 text-mute text-sm">{r.reasons.map((x, i) => <li key={i} className="flex gap-2"><span aria-hidden="true">•</span><span>{t(x)}</span></li>)}</ul></div>
    <div><h4 className="font-semibold mb-2">{t("Mes conseils")}</h4><ul className="space-y-2 text-sm">{r.tips.map((x, i) => <li key={i} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0" style={{ color: "var(--brand)" }} /><span>{t(x)}</span></li>)}</ul></div>
    <button type="button" className="btn2" onClick={() => speak(m.bobby + " " + r.reasons.join(" ") + " " + r.tips.join(" "), lang)}><Volume2 size={16} />{t("Écouter Bobby")}</button>
  </motion.div>);
}
export function Mic({ onText }: { onText: (t: string) => void }) {
  const lang = useS((x) => x.settings.lang); const t = useT(); const [on, setOn] = useState(false); const [err, setErr] = useState("");
  return (<span className="inline-flex flex-col"><button type="button" className={"btn2 " + (on ? "on" : "")} onClick={() => { setErr(""); setOn(true); listen(lang, onText, (e) => setErr(ERR[e] || ERR.x), () => setOn(false)); }}><MicI size={16} />{t(on ? "Je vous écoute…" : "Parler")}</button>{err && <span className="text-xs mt-1" style={{ color: "#F59E0B" }}>{t(err)}</span>}</span>);
}
export function ToastHost() {
  const toast = useS((s) => s.toast); const t = useT(); const col = { ok: "#22C55E", warn: "#F59E0B", bad: "#EF4444", info: "var(--brand)" };
  return (<div className="fixed top-3 inset-x-0 z-[70] flex justify-center px-4 pointer-events-none" style={{ paddingTop: "env(safe-area-inset-top)" }}><AnimatePresence>{toast && <motion.div key={toast.id} role="status" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }} className="card px-4 py-3 text-sm font-medium flex items-center gap-2 shadow-lg" style={{ background: "var(--solid)", borderColor: col[toast.tone] }}><span className="w-2 h-2 rounded-full" style={{ background: col[toast.tone] }} />{t(toast.text)}</motion.div>}</AnimatePresence></div>);
}
const GO: [RegExp, View][] = [[/accueil/i, "home"], [/texte|message|sms|mail/i, "text"], [/site|web|lien/i, "web"], [/image|photo|capture/i, "image"], [/qr/i, "qr"], [/appel|t[ée]l[ée]phone|num[ée]ro/i, "calls"], [/menace|danger/i, "threats"], [/famille|proches/i, "family"], [/communaut[ée]|signal/i, "community"], [/r[ée]glage|param[èe]tre|option/i, "settings"]];
export function Fab() {
  const { settings: s, set, go, ask } = useS(); const t = useT(); const [lis, setLis] = useState(false); const [msg, setMsg] = useState(""); const vo = s.voice !== false;
  const hear = () => {
    if (lis) return; stopSpeak(); setMsg(""); setLis(true);
    listen(s.lang, async (t0) => {
      const f = await toFr(s.lang, t0); const hit = GO.find(([r]) => r.test(f));
      if (/ouvr|va |aller|montre|affiche|retour|accueil/i.test(f) && hit) { go(hit[1]); const n = NAV.find((x) => x.id === hit[1])!; if (vo) speak("D'accord, j'ouvre " + n.label, s.lang); } else ask(t0);
    }, (e) => { setMsg(ERR[e] || ERR.x); setTimeout(() => setMsg(""), 7000); }, () => setLis(false));
  };
  return (<div className="fixed end-4 z-[45] flex flex-col items-end gap-3 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] md:bottom-6">
    {lis && <div className="card px-4 py-2 text-sm" role="status">{t("Je vous écoute…")}</div>}
    {msg && <div className="card px-4 py-2 text-sm max-w-[260px]" style={{ color: "#F59E0B" }}>{t(msg)}</div>}
    <button type="button" aria-label={t(vo ? "Couper la voix de Bobby" : "Activer la voix de Bobby")} aria-pressed={vo} onClick={() => { set({ voice: !vo }); if (vo) stopSpeak(); }} className="w-11 h-11 rounded-full grid place-items-center shadow-lg border" style={{ background: vo ? "var(--soft)" : "var(--solid)", color: vo ? "var(--brand)" : "var(--mute)", borderColor: vo ? "var(--brand)" : "var(--bd)" }}>{vo ? <Volume2 size={20} /> : <VolumeX size={20} />}</button>
    <button type="button" aria-label={t("Parler à Bobby")} onClick={hear} className={"w-14 h-14 rounded-full grid place-items-center shadow-xl text-white " + (lis ? "animate-pulse" : "")} style={{ background: lis ? "#EF4444" : "linear-gradient(135deg,var(--brand),var(--brand2))" }}><MicI size={26} /></button>
  </div>);
}
export { X };
