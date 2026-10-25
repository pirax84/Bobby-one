"use client";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Bot, Home, MessageSquareWarning, Globe, Image as Img, QrCode, PhoneCall, Siren, Users, Radio, Settings } from "lucide-react";
import { META, levelOf, Result } from "@/lib/engine";
import { useS, type View } from "@/lib/store";
export const NAV: { id: View; label: string; icon: any; desc: string }[] = [
  { id: "home", label: "Accueil", icon: Home, desc: "Votre tableau de bord" },
  { id: "chat", label: "Parler à Bobby", icon: Bot, desc: "Posez-moi vos questions" },
  { id: "text", label: "Analyse texte", icon: MessageSquareWarning, desc: "SMS, mails, WhatsApp" },
  { id: "web", label: "Analyse site web", icon: Globe, desc: "Ce site est-il fiable ?" },
  { id: "image", label: "Analyse image", icon: Img, desc: "Capture d'écran, photo" },
  { id: "qr", label: "Analyse QR code", icon: QrCode, desc: "Où mène ce code ?" },
  { id: "calls", label: "Protection appels", icon: PhoneCall, desc: "Qui vous appelle ?" },
  { id: "threats", label: "Centre des menaces", icon: Siren, desc: "Reconnaître les arnaques" },
  { id: "family", label: "Famille", icon: Users, desc: "Protéger vos proches" },
  { id: "community", label: "Communauté", icon: Radio, desc: "Signalements en direct" },
  { id: "settings", label: "Réglages", icon: Settings, desc: "Personnaliser Bobby" },
];
export const Bobby = ({ s = 48 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 48 48"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#00D084" /><stop offset="1" stopColor="#0891B2" /></linearGradient></defs>
    <circle cx="24" cy="24" r="24" fill="url(#bg)" /><circle cx="17" cy="21" r="3.5" fill="#04120C" /><circle cx="31" cy="21" r="3.5" fill="#04120C" /><path d="M16 31q8 7 16 0" stroke="#04120C" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>
);
export function Gauge({ score, size = 140 }: { score: number; size?: number }) {
  const c = META[levelOf(score)].color, r = size / 2 - 10, C = 2 * Math.PI * r;
  return (<div className="relative shrink-0" style={{ width: size, height: size }}>
    <svg width={size} height={size} className="-rotate-90"><circle cx={size / 2} cy={size / 2} r={r} stroke="var(--bd)" strokeWidth="10" fill="none" />
      <motion.circle cx={size / 2} cy={size / 2} r={r} stroke={c} strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - score / 100) }} transition={{ duration: 1 }} /></svg>
    <div className="absolute inset-0 grid place-items-center text-3xl font-bold" style={{ color: c }}>{score}</div></div>);
}
const MALE = /thomas|paul|daniel|henri|antoine|jean|guy|david|mark|alex|jorge|diego|jan|stefan|conrad|male|homme|nicolas|oliver|arthur|reed/i;
const LG: Record<string, string> = { English: "en-US", Español: "es-ES", Deutsch: "de-DE" };
export const speak = (txt: string, lang: string, onend?: () => void) => {
  if (typeof window === "undefined" || !window.speechSynthesis) { onend?.(); return; }
  window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(txt.replace(/[^\p{L}\p{N}\s.,'’:;!?%€«»()\/-]/gu, "")); u.lang = LG[lang] || "fr-FR"; const st = useS.getState().settings; const code = (LG[lang] || "fr-FR").slice(0, 2); const pool = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(code)); const vv = pool.find((v) => v.name === st.voiceName) || pool.find((v) => MALE.test(v.name)) || pool[0]; if (vv) u.voice = vv; u.pitch = st.deep === false ? 1 : 0.55; u.rate = st.deep === false ? .95 : .88; if (onend) u.onend = onend; window.speechSynthesis.speak(u);
};
export const ERR: Record<string, string> = {
  "not-allowed": "Le micro est bloqué. Sur téléphone, il faut ouvrir l'adresse en https (version en ligne) et autoriser le micro.",
  "no-speech": "Je n'ai rien entendu, réessayez.", unsupported: "Ce navigateur ne gère pas le micro. Essayez Chrome (Android) ou Safari (iPhone).", x: "Le micro ne fonctionne pas pour le moment.",
};
export function listen(lang: string, done: (t: string) => void, fail: (e: string) => void, end?: () => void) {
  const R = typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;
  if (!R) { fail("unsupported"); end?.(); return null; }
  const r = new R(); r.lang = LG[lang] || "fr-FR"; r.interimResults = false; r.maxAlternatives = 1;
  r.onresult = (e: any) => done(e.results[0][0].transcript); r.onerror = (e: any) => fail(e.error); if (end) r.onend = end;
  try { r.start(); } catch { fail("x"); end?.(); } return r;
}
export function Mic({ onText }: { onText: (t: string) => void }) {
  const lang = useS((x) => x.settings.lang); const [on, setOn] = useState(false); const [err, setErr] = useState("");
  return (<span className="inline-block"><button type="button" className={"btn2 " + (on ? "on" : "")} onClick={() => { setErr(""); setOn(true); listen(lang, onText, (e) => setErr(ERR[e] || ERR.x), () => setOn(false)); }}>🎤 {on ? "Je vous écoute…" : "Parler"}</button>{err && <p className="text-xs mt-1" style={{ color: "#F59E0B" }}>{err}</p>}</span>);
}
export const Badge = ({ lv }: { lv: string }) => { const m = META[lv as keyof typeof META]; return <span className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap" style={{ background: m.color + "22", color: m.color }}>{m.label}</span>; };
export function Report({ r, children }: { r: Result; children?: React.ReactNode }) {
  const m = META[r.level]; const lang = useS((x) => x.settings.lang); const vo = useS((x) => x.settings.voice !== false); const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150); if (vo) speak(`${m.bobby} Score de confiance : ${r.score} sur 100. ${r.tips[0]}`, lang); }, []);
  return (<motion.div ref={ref} style={{ scrollMarginTop: 16, borderColor: m.color + "77" }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-6 space-y-5" >
    <div className="flex items-center gap-5"><Gauge score={r.score} /><div><Badge lv={r.level} /><p className="mt-3 text-lg font-medium">{m.bobby}</p><p className="text-sm text-mute mt-1">Score de confiance : {r.score}/100</p></div></div>
    <button className="btn2" onClick={() => speak(m.bobby + " " + r.reasons.join(" ") + " " + r.tips.join(" "), lang)}>🔊 Écouter Bobby</button>
    {children}
    <div><h4 className="font-semibold mb-2">Pourquoi ?</h4><ul className="space-y-1.5 text-mute text-sm">{r.reasons.map((x, i) => <li key={i}>• {x}</li>)}</ul></div>
    <div><h4 className="font-semibold mb-2">Mes conseils</h4><ul className="space-y-1.5 text-sm">{r.tips.map((x, i) => <li key={i} className="flex gap-2"><span style={{ color: "#00D084" }}>✓</span>{x}</li>)}</ul></div>
  </motion.div>);
}
export const Title = ({ t, d }: { t: string; d: string }) => (<div className="mb-6"><h1 className="text-2xl md:text-3xl font-bold">{t}</h1><p className="text-mute mt-1">{d}</p></div>);
export const Toggle = ({ on, f }: { on: boolean; f: () => void }) => (<button onClick={f} aria-pressed={on} className="w-12 h-7 rounded-full p-1 transition" style={{ background: on ? "#00D084" : "var(--bd)" }}><span className="block w-5 h-5 rounded-full bg-white transition" style={{ transform: on ? "translateX(20px)" : "none" }} /></button>);
