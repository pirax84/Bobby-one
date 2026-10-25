"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Upload, Phone, PhoneOff, ChevronDown, Loader2 } from "lucide-react";
import { analyzeText, analyzeUrl, ageLabel, hash, META, Result, UrlResult } from "@/lib/engine";
import { useS, View } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { CALLS, THREATS, FEED, TOP, REP, FAMILY } from "@/lib/data";
import { NAV, Bobby, Gauge, Badge, Report, Title, Toggle, speak, Mic, listen, ERR } from "./ui";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const Busy = ({ t }: { t: string }) => { const ref = useRef<HTMLDivElement>(null); useEffect(() => { ref.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }, []); return <div ref={ref} className="card p-6 flex items-center gap-3 text-mute"><Loader2 className="animate-spin" size={18} />{t}</div>; };

export function HomeV() {
  const { go, protectedToday, blocked } = useS(); const t = useT(); const bars = [12, 18, 9, 24, 15, 31, 20], d = "LMMJVSD";
  const stats: [string, string | number, string, View][] = [["Score de confiance", "87/100", "#22C55E", "threats"], ["Protégé aujourd'hui", protectedToday, "#00D084", "text"], ["Menaces bloquées", blocked, "#EF4444", "calls"], ["Alertes communauté", 42, "#F59E0B", "community"]];
  return (<div className="space-y-6">
    <div className="card p-6 flex items-center gap-5"><motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 3 }}><Bobby s={72} /></motion.div>
      <div><h1 className="text-2xl md:text-3xl font-bold">{t("Bonjour, je suis Bobby.")}</h1><p className="text-mute">{t("Je vérifie ce qui mérite votre confiance.")}</p></div></div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{stats.map(([l, v, c, to]) => <motion.button whileHover={{ y: -3 }} whileTap={{ scale: .97 }} key={l} onClick={() => go(to)} className="card p-5 text-left"><p className="text-sm text-mute">{t(l)}</p><p className="text-3xl font-bold mt-2" style={{ color: c }}>{v}</p><p className="text-xs text-mute mt-2">{t("Voir")} →</p></motion.button>)}</div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{NAV.filter((n) => ["chat", "text", "web", "image", "qr", "calls"].includes(n.id)).map((n) => (
      <motion.button whileHover={{ y: -4 }} whileTap={{ scale: .97 }} key={n.id} onClick={() => go(n.id)} className="card p-5 text-left"><n.icon color="#00D084" /><p className="font-semibold mt-3">{t(n.label)}</p><p className="text-sm text-mute">{t(n.desc)}</p></motion.button>))}</div>
    <div className="card p-6"><h3 className="font-semibold mb-4">{t("Menaces repérées cette semaine")}</h3><div className="flex items-end gap-3 h-40">{bars.map((b, i) => (<div key={i} className="flex-1 flex flex-col items-center gap-2"><motion.div initial={{ height: 0 }} animate={{ height: b * 4 }} transition={{ delay: i * .07 }} className="w-full rounded-xl" style={{ background: "linear-gradient(#00D084,#0891B2)" }} /><span className="text-xs text-mute">{d[i]}</span></div>))}</div></div>
  </div>);
}

export function TextV() {
  const [t, setT] = useState(""); const [r, setR] = useState<Result | null>(null); const [b, setB] = useState(false); const bump = useS((s) => s.bump);
  const ex = ["URGENT : votre colis est bloqué. Réglez 2,99 € de frais sur http://colis-laposte-suivi.xyz avant ce soir.", "Bonjour, ici la banque. Votre compte est suspendu. Donnez-nous le code SMS reçu pour le vérifier.", "Salut ! On se retrouve à 19h au restaurant comme prévu ? Bises."];
  const run = async () => { setB(true); setR(null); await wait(1100); const x = analyzeText(t); setR(x); bump(x.score < 60); setB(false); };
  return (<div><Title t="Analyse texte" d="Collez un SMS, un mail ou un message WhatsApp." />
    <div className="card p-5 space-y-4"><textarea className="inp min-h-40" placeholder="Collez ici le message à vérifier…" value={t} onChange={(e) => setT(e.target.value)} />
      <div className="flex flex-wrap gap-2">{ex.map((e, i) => <button key={i} className="btn2" onClick={() => { setT(e); setR(null); }}>Exemple {i + 1}</button>)}<Mic onText={(x) => { setT((o) => (o + " " + x).trim()); setR(null); }} /></div>
      <button className="btn" disabled={t.trim().length < 5 || b} onClick={run}>Analyser avec Bobby</button></div>
    <div className="mt-6">{b && <Busy t="Bobby lit attentivement votre message…" />}{r && <Report r={r} />}</div></div>);
}

export function WebV() {
  const [u, setU] = useState(""); const [r, setR] = useState<UrlResult | null>(null); const [b, setB] = useState(false); const [err, setErr] = useState(""); const { bump, report } = useS();
  const run = async (v = u) => { setU(v); setErr(""); setR(null); setB(true); await wait(1000); const x = analyzeUrl(v); setB(false); if (!x) return setErr("Cette adresse ne me semble pas valide. Exemple : exemple.fr"); setR(x); bump(x.score < 60); };
  return (<div><Title t="Analyse site web" d="Collez l'adresse d'un site avant d'y entrer vos informations." />
    <div className="card p-5 space-y-4"><div className="flex gap-3 flex-col sm:flex-row"><input className="inp" placeholder="https://…" value={u} onChange={(e) => setU(e.target.value)} onKeyDown={(e) => e.key === "Enter" && u && run()} /><button className="btn justify-center" disabled={!u || b} onClick={() => run()}>Vérifier</button><Mic onText={(x) => setU(x.replace(/\s+/g, "").replace(/point/gi, "."))} /></div>
      <div className="flex flex-wrap gap-2">{["https://www.impots.gouv.fr", "http://amazon-verify-compte.xyz/connexion", "promo-ps5-fr.top"].map((x) => <button key={x} className="btn2" onClick={() => run(x)}>{x.replace(/https?:\/\//, "")}</button>)}</div>{err && <p className="text-red-400 text-sm">{err}</p>}</div>
    <div className="mt-6">{b && <Busy t="Bobby inspecte ce site…" />}{r && <Report r={r}><div className="grid grid-cols-3 gap-3 text-center">{[["Domaine", r.domain], ["Ancienneté", ageLabel(r.ageDays)], ["Réputation", r.reputation]].map(([a, v]) => <div key={a} className="rounded-2xl p-3" style={{ background: "var(--bd)" }}><p className="text-xs text-mute">{a}</p><p className="font-semibold text-sm break-all">{v}</p></div>)}</div>
      {r.score < 60 && <button className="btn2" onClick={() => report(r.domain)}>Signaler ce site à la communauté</button>}</Report>}</div></div>);
}

const OCR = ["URGENT : votre colis est bloqué. Payez 2,99 € de frais de douane sur http://colis-laposte-suivi.xyz/payer avant ce soir.", "Rappel : rendez-vous chez le Dr Martin mardi à 14h30. Merci de confirmer par SMS.", "Félicitations ! Vous avez gagné un iPhone. Confirmez vos informations bancaires et le code SMS reçu.", "Offre télétravail sans expérience : gagnez 3000 € par mois. Envoyez votre IBAN pour commencer."];
export function ImageV() {
  const [img, setImg] = useState(""); const [txt, setTxt] = useState(""); const [r, setR] = useState<Result | null>(null); const [b, setB] = useState(false); const bump = useS((s) => s.bump);
  const go = async (seed: string, src: string) => { setImg(src); setR(null); setB(true); await wait(1400); const t = OCR[hash(seed) % OCR.length]; const x = analyzeText(t); setTxt(t); setR(x); bump(x.score < 60); setB(false); };
  return (<div><Title t="Analyse image" d="Ajoutez une capture d'écran : je lis le texte pour vous." />
    <div className="card p-5 space-y-4"><label className="grid place-items-center border-2 border-dashed rounded-3xl p-8 cursor-pointer text-mute hover:border-[#00D084]" style={{ borderColor: "var(--bd)" }}><Upload /><span className="mt-2">Choisir une image</span>
      <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) go(f.name + f.size, URL.createObjectURL(f)); }} /></label>
      <div className="flex flex-wrap gap-2">{OCR.map((_, i) => <button key={i} className="btn2" onClick={() => go("ex" + i + "x", "")}>Image d'exemple {i + 1}</button>)}</div></div>
    <div className="mt-6 space-y-4">{b && <Busy t="Bobby lit le texte de l'image (OCR)…" />}
      {r && <><div className="card p-5 flex gap-4">{img && <img src={img} alt="" className="w-24 h-24 object-cover rounded-2xl" />}<div><p className="text-xs text-mute mb-1">Texte détecté</p><p className="text-sm italic">« {txt} »</p></div></div><Report r={r} /></>}</div></div>);
}

const QRS = ["https://paiement-parking-secure.top/pay?id=8841", "https://www.service-public.fr/", "http://192.168.4.12/login", "https://amazon-verify-compte.xyz/connexion"];
export function QrV() {
  const [p, setP] = useState(""); const [r, setR] = useState<UrlResult | null>(null); const [b, setB] = useState(false); const bump = useS((s) => s.bump);
  const go = async (seed: string) => { setR(null); setB(true); await wait(1200); const c = QRS[hash(seed) % QRS.length]; setP(c); const x = analyzeUrl(c)!; setR(x); bump(x.score < 60); setB(false); };
  return (<div><Title t="Analyse QR code" d="Je regarde où mène un QR code avant que vous le scanniez." />
    <div className="card p-5 space-y-4"><label className="grid place-items-center border-2 border-dashed rounded-3xl p-8 cursor-pointer text-mute hover:border-[#00D084]" style={{ borderColor: "var(--bd)" }}><Upload /><span className="mt-2">Choisir l'image d'un QR code</span>
      <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) go(f.name + f.size); }} /></label>
      <div className="flex flex-wrap gap-2">{QRS.map((_, i) => <button key={i} className="btn2" onClick={() => go("qr" + i + "z")}>QR d'exemple {i + 1}</button>)}</div></div>
    <div className="mt-6">{b && <Busy t="Bobby décode le QR code…" />}{r && <Report r={r}><div className="rounded-2xl p-4 text-sm space-y-1" style={{ background: "var(--bd)" }}><p><b>Contenu décodé :</b> {p}</p><p><b>Destination :</b> {r.domain}</p><p><b>Niveau de risque :</b> {META[r.level].label}</p></div></Report>}</div></div>);
}

export function CallsV() {
  const vo = useS((x) => x.settings.voice !== false), lg = useS((x) => x.settings.lang);
  const [q, setQ] = useState(""); const [f, setF] = useState("all"); const [inc, setInc] = useState<(typeof CALLS)[0] | null>(null); const bump = useS((s) => s.bump);
  const list = CALLS.filter((c) => (f === "all" || c.kind === f) && (c.n + c.name).toLowerCase().includes(q.toLowerCase()));
  const lv = (s: number) => (s >= 85 ? "safe" : s >= 60 ? "careful" : s >= 40 ? "suspicious" : "danger");
  const rec = (k: string) => (k === "safe" ? "Vous pouvez répondre." : k === "unknown" ? "Laissez sonner, répondez seulement si vous attendez un appel." : "Ne répondez pas. Je vous conseille de bloquer ce numéro.");
  return (<div><Title t="Protection appels" d="Je vous dis qui appelle avant que vous décrochiez." />
    <button className="btn mb-4" onClick={() => { const c = CALLS[Math.floor(Math.random() * CALLS.length)]; setInc(c); if (vo) speak(c.kind === "scam" ? "Attention, appel suspect. Je pense qu'il s'agit probablement d'une arnaque. Ne répondez pas." : c.kind === "safe" ? "Ce numéro semble fiable." : "Numéro inconnu. Soyez prudent avant de répondre.", lg); }}><Phone size={18} />Simuler un appel entrant</button>
    <div className="flex flex-col sm:flex-row gap-3 mb-4"><div className="relative flex-1"><Search size={16} className="absolute left-4 top-4 text-mute" /><input className="inp pl-10" placeholder="Rechercher un numéro…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="flex gap-2 flex-wrap">{[["all", "Tous"], ["safe", "Sûrs"], ["unknown", "Inconnus"], ["scam", "Arnaques"]].map(([k, l]) => <button key={k} onClick={() => setF(k)} className={"btn2 " + (f === k ? "on" : "")}>{l}</button>)}</div></div>
    <div className="space-y-3">{list.map((c) => (<div key={c.n} className="card p-4 flex items-center gap-4"><Gauge score={c.score} size={64} /><div className="flex-1 min-w-0"><p className="font-semibold">{c.n}</p><p className="text-sm text-mute">{c.name} · {c.reports} signalements</p><p className="text-sm mt-1">{rec(c.kind)}</p></div><Badge lv={lv(c.score)} /></div>))}{!list.length && <p className="text-mute">Aucun numéro trouvé.</p>}</div>
    <AnimatePresence>{inc && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/70"><motion.div initial={{ scale: .9 }} animate={{ scale: 1 }} className="card p-6 w-full max-w-sm text-center space-y-4"><p className="text-mute text-sm">Appel entrant</p><p className="text-xl font-bold">{inc.n}</p><div className="flex justify-center"><Gauge score={inc.score} /></div><p className="font-medium">{inc.kind === "scam" ? "🔴 Je pense qu'il s'agit probablement d'une arnaque." : inc.kind === "safe" ? "✅ Ce numéro semble fiable." : "⚠️ Soyez prudent avant de répondre."}</p><p className="text-sm text-mute">{inc.name} · {inc.reports} signalements</p>
      <div className="flex gap-3"><button className="btn2 flex-1" onClick={() => { bump(false); setInc(null); }}>Répondre</button><button className="btn flex-1 justify-center" onClick={() => { bump(true); setInc(null); }}><PhoneOff size={16} />Bloquer</button></div></motion.div></motion.div>)}</AnimatePresence></div>);
}

export function ThreatsV() {
  const [q, setQ] = useState(""); const [o, setO] = useState("");
  return (<div><Title t="Centre des menaces" d="Apprenez à reconnaître les arnaques les plus courantes." />
    <div className="relative mb-4"><Search size={16} className="absolute left-4 top-4 text-mute" /><input className="inp pl-10" placeholder="Rechercher une menace…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
    <div className="space-y-3">{THREATS.filter((t) => (t.id + t.d).toLowerCase().includes(q.toLowerCase())).map((t) => (<div key={t.id} className="card overflow-hidden"><button className="w-full p-5 flex items-center justify-between text-left" onClick={() => setO(o === t.id ? "" : t.id)}><div><p className="font-semibold">{t.id}</p><p className="text-sm text-mute">{t.d}</p></div><ChevronDown className={"transition shrink-0 " + (o === t.id ? "rotate-180" : "")} /></button>
      {o === t.id && <div className="px-5 pb-5 space-y-3"><div><p className="text-xs text-mute mb-1">Exemples</p>{t.ex.map((e) => <p key={e} className="text-sm">• {e}</p>)}</div><p className="text-sm rounded-2xl p-3" style={{ background: "rgba(0,208,132,.12)" }}>💡 {t.tip}</p></div>}</div>))}</div></div>);
}

export function FamilyV() {
  const [m, setM] = useState(FAMILY); const [call, setCall] = useState(false);
  return (<div><Title t="Protection famille" d="Veillez sur vos proches, où qu'ils soient." />
    <div className="grid sm:grid-cols-3 gap-4 mb-6"><div className="card p-5"><p className="text-sm text-mute">Membres protégés</p><p className="text-3xl font-bold" style={{ color: "#00D084" }}>{m.filter((x) => x.on).length}/{m.length}</p></div><div className="card p-5"><p className="text-sm text-mute">Niveau de risque</p><p className="text-3xl font-bold" style={{ color: "#EAB308" }}>Modéré</p></div>
      <div className="card p-5"><p className="text-sm text-mute">Contact d'urgence</p><p className="font-semibold">Camille · 06 12 34 56 78</p><button className="btn2 mt-2" onClick={() => setCall(!call)}>{call ? "Appel en cours… (démo)" : "Appeler"}</button></div></div>
    <div className="space-y-3">{m.map((x, i) => (<div key={x.n} className="card p-5 flex items-center gap-4"><div className="w-12 h-12 rounded-full grid place-items-center font-bold text-[#04120C]" style={{ background: "#00D084" }}>{x.n[0]}</div><div className="flex-1 min-w-0"><p className="font-semibold">{x.n} <span className="text-mute text-sm font-normal">· {x.role}</span></p><p className="text-sm text-mute">{x.alert}</p></div><Badge lv={x.risk} /><Toggle on={x.on} f={() => setM(m.map((y, j) => (j === i ? { ...y, on: !y.on } : y)))} /></div>))}</div></div>);
}

export function CommunityV() {
  const [tab, setTab] = useState("Numéros"); const [q, setQ] = useState(""); const [kind, setKind] = useState("Sites"); const [n, setN] = useState(""); const [msg, setMsg] = useState(""); const [more, setMore] = useState<Record<string, number>>({}); const { reported, report } = useS();
  const mine = reported.map((x) => (x.includes("|") ? x.split("|") : ["Sites", x])).filter(([k]) => k === tab).map(([, v]) => v);
  const items = [...mine, ...REP[tab]].filter((x) => x.toLowerCase().includes(q.toLowerCase()));
  const send = () => { if (!n.trim()) { setMsg("⚠️ Écrivez d'abord le numéro, l'email ou le site à signaler."); return; } report(kind + "|" + n.trim()); setTab(kind); setN(""); setQ(""); setMsg("✅ Merci ! Votre signalement a été ajouté et protège les autres."); };
  return (<div><Title t="Bouclier communautaire" d="Les signalements de milliers d'utilisateurs, en direct." />
    <div className="card p-5 mb-4 space-y-3"><h3 className="font-semibold">Signaler une arnaque</h3>
      <div className="flex gap-2 flex-wrap">{Object.keys(REP).map((k) => <button key={k} className={"btn2 " + (kind === k ? "on" : "")} onClick={() => setKind(k)}>{k}</button>)}</div>
      <div className="flex gap-2 flex-col sm:flex-row"><input className="inp" placeholder={kind === "Numéros" ? "Ex : +33 7 00 00 00 00" : kind === "Emails" ? "Ex : faux@arnaque.top" : "Ex : faux-site.xyz"} value={n} onChange={(e) => { setN(e.target.value); setMsg(""); }} onKeyDown={(e) => e.key === "Enter" && send()} /><button className="btn justify-center" onClick={send}>Signaler</button></div>
      {msg && <p className="text-sm font-medium" style={{ color: msg.startsWith("✅") ? "#22C55E" : "#F59E0B" }}>{msg}</p>}</div>
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="card p-5 space-y-4"><div className="flex gap-2 flex-wrap">{Object.keys(REP).map((k) => <button key={k} className={"btn2 " + (tab === k ? "on" : "")} onClick={() => setTab(k)}>{k}</button>)}</div>
        <input className="inp" placeholder="Filtrer la liste…" value={q} onChange={(e) => setQ(e.target.value)} /><div className="space-y-2">{items.map((x, i) => <p key={x + i} className="text-sm p-3 rounded-2xl" style={{ background: "var(--bd)" }}>🚩 {x}</p>)}{!items.length && <p className="text-mute text-sm">Aucun résultat.</p>}</div></div>
      <div className="space-y-4"><div className="card p-5"><h3 className="font-semibold mb-3">Top menaces de la semaine</h3>{TOP.map(([l, v]) => <div key={l} className="mb-3"><div className="flex justify-between text-sm"><span>{l}</span><span className="text-mute">{v}%</span></div><div className="h-2 rounded-full" style={{ background: "var(--bd)" }}><motion.div initial={{ width: 0 }} animate={{ width: v + "%" }} className="h-2 rounded-full" style={{ background: "#00D084" }} /></div></div>)}</div>
        <div className="card p-5"><h3 className="font-semibold mb-3">Fil d'alertes</h3><div className="space-y-4">{FEED.map((f) => <div key={f.t} className="space-y-2"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium">{f.t}</p><p className="text-xs text-mute">{f.c + (more[f.t] || 0)} signalements · {f.ago}</p></div><Badge lv={f.lv} /></div>
          <button className="btn2 !py-1.5 !text-xs" disabled={!!more[f.t]} onClick={() => setMore({ ...more, [f.t]: 1 })}>{more[f.t] ? "✅ Merci, c'est noté" : "Je l'ai reçu aussi"}</button></div>)}</div></div></div></div></div>);
}

function VoicePick() {
  const { settings: s, set } = useS(); const [vs, setVs] = useState<string[]>([]);
  useEffect(() => { const load = () => { const code = ({ English: "en", Español: "es", Deutsch: "de" } as any)[s.lang] || "fr"; setVs(window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(code)).map((v) => v.name)); }; load(); window.speechSynthesis.onvoiceschanged = load; }, [s.lang]);
  return (<div className="flex gap-2 flex-wrap justify-end"><select className="inp !w-auto max-w-[200px]" value={s.voiceName || ""} onChange={(e) => set({ voiceName: e.target.value })}><option value="" style={{ color: "#000" }}>Automatique (voix masculine)</option>{vs.map((n) => <option key={n} value={n} style={{ color: "#000" }}>{n}</option>)}</select><button className="btn2" onClick={() => speak("Bonjour, je suis Bobby. Je veille sur vous.", s.lang)}>▶ Tester</button></div>);
}

export function SettingsV() {
  const { settings: s, set } = useS(); const t = useT();
  const Row = ({ l, children }: { l: string; children: React.ReactNode }) => <div className="flex items-center justify-between gap-4 py-4 border-b" style={{ borderColor: "var(--bd)" }}><span>{t(l)}</span>{children}</div>;
  return (<div><Title t={t("Réglages")} d={t("Personnalisez Bobby comme vous le souhaitez.")} />
    <div className="card px-6"><Row l="Langue"><select className="inp !w-auto" value={s.lang} onChange={(e) => set({ lang: e.target.value })}>{["Français", "English", "Español", "Deutsch"].map((l) => <option key={l} style={{ color: "#000" }}>{l}</option>)}</select></Row>
      {s.lang !== "Français" && <p className="text-sm text-mute py-3">{t("Le menu et les écrans principaux changent de langue. Les analyses de Bobby restent en français pour le moment.")}</p>}
      <Row l="Bobby parle sur tous les écrans"><Toggle on={s.voice !== false} f={() => { set({ voice: s.voice === false }); if (s.voice !== false) window.speechSynthesis?.cancel(); }} /></Row>
      <Row l="Voix de Bobby"><VoicePick /></Row>
      <Row l="Voix grave (style Jarvis)"><Toggle on={s.deep !== false} f={() => set({ deep: s.deep === false })} /></Row>
      <Row l="Notifications d'alerte"><Toggle on={s.notif} f={() => set({ notif: !s.notif })} /></Row>
      <Row l="Confidentialité renforcée (rien n'est envoyé)"><Toggle on={s.privacy} f={() => set({ privacy: !s.privacy })} /></Row>
      <Row l="Thème"><div className="flex gap-2">{(["dark", "light"] as const).map((x) => <button key={x} className={"btn2 " + (s.theme === x ? "on" : "")} onClick={() => set({ theme: x })}>{t(x === "dark" ? "Sombre" : "Clair")}</button>)}</div></Row>
      <Row l="Niveau de sécurité"><div className="flex gap-2 flex-wrap justify-end">{(["Standard", "Renforcé", "Maximum"] as const).map((x) => <button key={x} className={"btn2 " + (s.security === x ? "on" : "")} onClick={() => set({ security: x })}>{x}</button>)}</div></Row>
      <div className="py-5 flex items-center gap-4"><Bobby s={48} /><div><p className="font-semibold">{t("À propos de Bobby One")}</p><p className="text-sm text-mute">Version 1.0 · « Bobby veille sur vous. » Prototype de démonstration : les analyses sont simulées.</p></div></div></div></div>);
}

export function BotV() {
  const { settings: st, set } = useS(); const lang = st.lang, vo = st.voice !== false; const bump = useS((x) => x.bump);
  const [m, setM] = useState<{ me: boolean; t: string }[]>([{ me: false, t: "Bonjour, je suis Bobby. Collez un message ou une adresse de site, ou posez-moi une question sur les arnaques." }]);
  const [i, setI] = useState(""); const [lis, setLis] = useState(false); const [convo, setConvo] = useState(false); const [err, setErr] = useState("");
  const box = useRef<HTMLDivElement>(null); const rec = useRef<any>(null); const cv = useRef(false);
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [m]);
  useEffect(() => () => { cv.current = false; rec.current?.abort?.(); window.speechSynthesis?.cancel(); }, []);
  const reply = (x: string) => {
    const u = x.match(/https?:\/\/\S+|\b[\w-]+\.(com|fr|net|org|xyz|top|click|info|shop|io)\b\S*/i);
    if (u) { const r = analyzeUrl(u[0]); if (r) { bump(r.score < 60); return `${META[r.level].bobby} Score : ${r.score}/100. ${r.reasons[0]} ${r.tips[0]}`; } }
    if (/victime|arnaqu[ée]|pirat[ée]|piratage|que faire/i.test(x)) return "Pas de panique. 1) Ne payez rien de plus. 2) Appelez votre banque pour faire opposition. 3) Changez vos mots de passe. 4) Gardez les preuves et signalez sur cybermalveillance.gouv.fr. En cas de danger immédiat, appelez le 17.";
    if (/qui es-tu|qui [eê]tes|c'est quoi bobby/i.test(x)) return "Je suis Bobby, votre gardien personnel. Je repère les signes d'arnaque dans vos messages, sites, appels et QR codes.";
    if (/^(bonjour|salut|coucou|hello)\b/i.test(x.trim())) return "Bonjour ! Je suis là pour vous aider. Collez-moi un message suspect ou une adresse de site.";
    if (x.trim().length >= 15) { const r = analyzeText(x); bump(r.score < 60); return `${META[r.level].bobby} Score : ${r.score}/100. ${r.reasons[0]} ${r.tips[0]}`; }
    return "Je n'ai pas bien compris. Collez le message ou l'adresse à vérifier, ou demandez-moi « que faire si je suis victime ? ».";
  };
  const hear = () => { setErr(""); setLis(true); rec.current = listen(lang, (t) => send(t), (e) => { setErr(ERR[e] || ERR.x); cv.current = false; setConvo(false); }, () => setLis(false)); };
  const send = (x = i) => { if (!x.trim()) return; const a = reply(x); setM((o) => [...o, { me: true, t: x }]); setI(""); setTimeout(() => { setM((o) => [...o, { me: false, t: a }]); if (vo) speak(a, lang, () => { if (cv.current) hear(); }); else if (cv.current) hear(); }, 500); };
  const toggleConvo = () => { if (convo) { cv.current = false; setConvo(false); rec.current?.abort?.(); window.speechSynthesis?.cancel(); } else { cv.current = true; setConvo(true); if (!vo) set({ voice: true }); hear(); } };
  return (<div><Title t="Parler à Bobby" d="Écrivez ou parlez à Bobby : il vous répond à voix haute." />
    <div className="card p-4"><div ref={box} className="h-[45vh] overflow-y-auto space-y-3 pr-1">{m.map((x, k) => <div key={k} className={"flex " + (x.me ? "justify-end" : "gap-2")}>{!x.me && <Bobby s={32} />}<p className="max-w-[85%] rounded-2xl px-4 py-2 text-sm" style={x.me ? { background: "#00D084", color: "#04120C" } : { background: "var(--bd)" }}>{x.t}</p></div>)}</div>
      <div className="flex flex-wrap gap-2 mt-3"><button className={"btn2 " + (lis ? "on" : "")} disabled={lis} onClick={hear}>🎤 {lis ? "Je vous écoute…" : "Parler à Bobby"}</button><button className={"btn2 " + (convo ? "on" : "")} onClick={toggleConvo}>🗣️ {convo ? "Arrêter la conversation" : "Conversation vocale"}</button>
        <button className={"btn2 " + (vo ? "on" : "")} onClick={() => { set({ voice: !vo }); window.speechSynthesis?.cancel(); }}>{vo ? "🔊 Voix activée" : "🔇 Voix coupée"}</button></div>
      {err && <p className="text-sm mt-2" style={{ color: "#F59E0B" }}>{err}</p>}
      <div className="flex flex-wrap gap-2 mt-3">{["Que faire si je suis victime ?", "Est-ce que colis-laposte-suivi.xyz est fiable ?"].map((x) => <button key={x} className="btn2 !text-xs" onClick={() => send(x)}>{x}</button>)}</div>
      <div className="flex gap-2 mt-3"><input className="inp" placeholder="Écrivez à Bobby…" value={i} onChange={(e) => setI(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} /><button className="btn" onClick={() => send()}>Envoyer</button></div>
      <p className="text-xs text-mute mt-3">Bobby répond avec ses règles intégrées (pas encore une IA en ligne).</p></div></div>);
}
