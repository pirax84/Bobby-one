"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Upload, Phone, PhoneOff, ChevronDown, ClipboardPaste, Mic as MicI, Volume2, Download, Share2, History, ArrowRight, Sparkles } from "lucide-react";
import { analyzeText, analyzeUrl, ageLabel, hash, META, looksLikeUrl, scoreNumber, levelOf, Result, UrlResult } from "@/lib/engine";
import { useS, View } from "@/lib/store";
import { useT, toFr, LANGS } from "@/lib/i18n";
import { CALLS, THREATS, FEED, TOP, REP, FAMILY } from "@/lib/data";
import { NAV, Bobby, Gauge, Badge, Report, Title, Toggle, Busy, speak, stopSpeak, Mic, listen, ERR } from "./ui";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const STEPS_T = ["Bobby lit votre message…", "Je cherche les signes d'arnaque…", "Je calcule le score de confiance…"];
const STEPS_W = ["Bobby inspecte ce site…", "Je vérifie l'adresse et son ancienneté…", "Je calcule le score de confiance…"];
const EX_T = [
  { l: "Colis suspect", v: "URGENT : votre colis est bloqué. Réglez 2,99 € de frais sur http://colis-laposte-suivi.xyz avant ce soir." },
  { l: "Faux banquier", v: "Bonjour, ici la banque. Votre compte est suspendu. Donnez-nous le code SMS reçu pour le vérifier." },
  { l: "Message d'ami", v: "Salut ! On se retrouve à 19h au restaurant comme prévu ? Bises." },
];
const EX_W = ["https://www.impots.gouv.fr", "http://amazon-verify-compte.xyz/connexion", "promo-ps5-fr.top"];
function useScan() { const { bump, addScan } = useS(); return (kind: any, label: string, r: Result) => { bump(r.score < 60); addScan({ kind, label: label.replace(/\s+/g, " ").slice(0, 70), score: r.score, level: r.level }); }; }

function WebReport({ r }: { r: UrlResult }) {
  const t = useT(); const { report, notify } = useS();
  return (<Report r={r}>
    <div className="grid grid-cols-3 gap-2 text-center">{[["Domaine", r.domain], ["Ancienneté", ageLabel(r.ageDays, t)], ["Réputation", t(r.reputation)]].map(([a, v]) => <div key={a} className="rounded-2xl p-3 min-w-0" style={{ background: "var(--soft)" }}><p className="text-xs text-mute">{t(a)}</p><p className="font-semibold text-sm break-words">{v}</p></div>)}</div>
    {r.score < 60 && <button type="button" className="btn2" onClick={() => { report("Sites|" + r.domain); notify("Merci ! Signalement envoyé à la communauté."); }}>{t("Signaler ce site à la communauté")}</button>}
  </Report>);
}
const Chips = ({ items, on }: { items: { l: string; v: string }[]; on: (v: string) => void }) => { const t = useT(); return <div className="flex flex-wrap gap-2">{items.map((e) => <button type="button" key={e.l} className="btn2" onClick={() => on(e.v)}>{t(e.l)}</button>)}</div>; };

function InstallCard() {
  const t = useT(); const [ev, setEv] = useState<any>(null); const [ios, setIos] = useState(false); const [inst, setInst] = useState(true);
  useEffect(() => {
    const on = (e: any) => { e.preventDefault(); setEv(e); }; const done = () => setInst(true);
    window.addEventListener("beforeinstallprompt", on); window.addEventListener("appinstalled", done);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent)); setInst(!!(window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone));
    return () => { window.removeEventListener("beforeinstallprompt", on); window.removeEventListener("appinstalled", done); };
  }, []);
  if (inst || (!ev && !ios)) return null;
  return (<div className="card p-5 flex items-center gap-4"><div className="ico"><Download size={22} /></div><div className="flex-1 min-w-0"><p className="font-semibold">{t("Installer Bobby sur votre téléphone")}</p><p className="text-sm text-mute">{ev ? t("Un seul geste : Bobby s'ouvre comme une vraie application.") : t("Touchez Partager, puis « Sur l'écran d'accueil ».")}</p></div>
    {ev && <button type="button" className="btn" onClick={async () => { ev.prompt(); try { await ev.userChoice; } catch {} setEv(null); }}>{t("Installer")}</button>}</div>);
}

export function HomeV() {
  const { go, protectedToday, blocked, history, incoming, setIncoming, clearHistory, notify } = useS(); const t = useT(); const lang = useS((s) => s.settings.lang); const scan = useScan();
  const [q, setQ] = useState(""); const [res, setRes] = useState<{ r: Result | UrlResult; web: boolean } | null>(null); const [b, setB] = useState(false); const [err, setErr] = useState("");
  const check = async (v = q) => {
    const x = v.trim(); if (x.length < 3) { setErr("Écrivez ou collez d'abord un message ou une adresse."); return; }
    setErr(""); setRes(null); setB(true); await wait(900);
    const u = looksLikeUrl(x) ? analyzeUrl(x) : null; const r = u || analyzeText(x); scan(u ? "web" : "text", x, r); setRes({ r, web: !!u }); setB(false);
  };
  useEffect(() => { if (incoming) { const x = incoming; setIncoming(null); setQ(x); check(x); } }, [incoming]);
  const paste = async () => { try { const x = await navigator.clipboard.readText(); if (x) { setQ(x); setRes(null); setErr(""); } else notify("Le presse-papiers est vide.", "warn"); } catch { notify("Impossible de coller ici : faites un appui long dans la case, puis « Coller ».", "warn"); } };
  const avg = history.length ? Math.round(history.reduce((a, h) => a + h.score, 0) / history.length) : 87;
  const stats: [string, string | number, string, View][] = [["Score de confiance", avg + "/100", META[levelOf(avg)].color, "threats"], ["Protégé aujourd'hui", protectedToday, "var(--brand)", "text"], ["Menaces bloquées", blocked, "#EF4444", "calls"], ["Alertes communauté", 42, "#F59E0B", "community"]];
  const code = LANGS[lang]?.code || "fr"; const days = Array.from({ length: 7 }, (_, i) => { try { return new Intl.DateTimeFormat(code, { weekday: "narrow" }).format(new Date(2024, 0, 1 + i)); } catch { return "·"; } }); const bars = [12, 18, 9, 24, 15, 31, 20];
  const tools = NAV.filter((n) => ["text", "web", "image", "qr", "calls", "threats"].includes(n.id));
  return (<div className="space-y-5">
    <section className="card p-5 md:p-6 space-y-4">
      <div className="flex items-center gap-4"><motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 3 }}><Bobby s={60} /></motion.div>
        <div className="min-w-0"><h1 className="text-xl md:text-3xl font-bold tracking-tight">{t("Bonjour, je suis Bobby.")}</h1><p className="text-mute">{t("Je vérifie ce qui mérite votre confiance.")}</p></div></div>
      <label htmlFor="quick" className="block text-sm font-medium">{t("Collez ici un message, un lien ou une adresse à vérifier")}</label>
      <textarea id="quick" className="inp min-h-28 resize-y" placeholder={t("Collez ici le message à vérifier…")} value={q} onChange={(e) => { setQ(e.target.value); setErr(""); }} />
      {err && <p className="text-sm" role="alert" style={{ color: "#F59E0B" }}>{t(err)}</p>}
      <div className="flex flex-wrap gap-2"><button type="button" className="btn flex-1 sm:flex-none" disabled={b} onClick={() => check()}><Sparkles size={18} />{t("Vérifier avec Bobby")}</button>
        <button type="button" className="btn2" onClick={paste}><ClipboardPaste size={16} />{t("Coller")}</button><Mic onText={(x) => { setQ((o) => (o + " " + x).trim()); setRes(null); }} /></div>
      <div><p className="text-xs text-mute mb-2">{t("Essayez avec un exemple")}</p><Chips items={[...EX_T, { l: "Faux site", v: "amazon-verify-compte.xyz" }]} on={(v) => { setQ(v); setRes(null); setErr(""); }} /></div>
    </section>
    {b && <Busy steps={STEPS_T} />}
    {res && (res.web ? <WebReport r={res.r as UrlResult} /> : <Report r={res.r} />)}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{stats.map(([l, v, c, to]) => <motion.button type="button" whileTap={{ scale: .97 }} key={l} onClick={() => go(to)} className="card p-4 text-start"><p className="text-xs text-mute">{t(l)}</p><p className="text-2xl md:text-3xl font-bold mt-1" style={{ color: c }}>{v}</p><p className="text-xs text-mute mt-1 flex items-center gap-1">{t("Voir")}<ArrowRight size={12} className="rtl:rotate-180" /></p></motion.button>)}</div>
    <InstallCard />
    <section><h2 className="font-semibold mb-3">{t("Tous les outils")}</h2><div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{tools.map((n) => (
      <motion.button type="button" whileTap={{ scale: .97 }} key={n.id} onClick={() => go(n.id)} className="card p-4 text-start flex flex-col gap-3"><span className="ico"><n.icon size={22} /></span><span><span className="block font-semibold leading-tight">{t(n.label)}</span><span className="block text-sm text-mute mt-0.5">{t(n.desc)}</span></span></motion.button>))}</div></section>
    {history.length > 0 && <section className="card p-5"><div className="flex items-center justify-between mb-3"><h2 className="font-semibold flex items-center gap-2"><History size={18} />{t("Vérifications récentes")}</h2><button type="button" className="text-sm text-mute underline" onClick={clearHistory}>{t("Effacer")}</button></div>
      <ul className="space-y-3">{history.slice(0, 5).map((h) => <li key={h.id} className="flex items-center gap-3"><Gauge score={h.score} size={44} /><div className="min-w-0 flex-1"><p className="text-sm truncate" dir="auto">{h.label}</p><p className="text-xs text-mute">{new Date(h.at).toLocaleTimeString(code, { hour: "2-digit", minute: "2-digit" })}</p></div><Badge lv={h.level} /></li>)}</ul></section>}
    <section className="card p-5 flex gap-4"><div className="ico"><Share2 size={22} /></div><div><p className="font-semibold">{t("Vérifiez sans ouvrir Bobby")}</p><p className="text-sm text-mute">{t("Sur Android, une fois Bobby installé : dans n'importe quelle application, touchez Partager, puis choisissez Bobby One. Je vérifie le message ou le lien tout de suite.")}</p></div></section>
    <section className="card p-5"><h2 className="font-semibold mb-4">{t("Menaces repérées cette semaine")}</h2><div className="flex items-end gap-3 h-36">{bars.map((v, i) => (<div key={i} className="flex-1 flex flex-col items-center gap-2"><motion.div initial={{ height: 0 }} animate={{ height: v * 3.6 }} transition={{ delay: i * .06 }} className="w-full rounded-xl" style={{ background: "linear-gradient(var(--brand),var(--brand2))" }} /><span className="text-xs text-mute">{days[i]}</span></div>))}</div></section>
  </div>);
}

export function TextV() {
  const t = useT(); const scan = useScan(); const [v, setV] = useState(""); const [r, setR] = useState<Result | null>(null); const [b, setB] = useState(false);
  const run = async () => { setB(true); setR(null); await wait(850); const x = analyzeText(v); scan("text", v, x); setR(x); setB(false); };
  return (<div><Title t="Analyse texte" d="Collez un SMS, un mail ou un message WhatsApp." />
    <div className="card p-5 space-y-4"><textarea className="inp min-h-40 resize-y" aria-label={t("Message à vérifier")} placeholder={t("Collez ici le message à vérifier…")} value={v} onChange={(e) => { setV(e.target.value); setR(null); }} />
      <div className="flex flex-wrap gap-2"><Chips items={EX_T} on={(x) => { setV(x); setR(null); }} /><Mic onText={(x) => { setV((o) => (o + " " + x).trim()); setR(null); }} /></div>
      <button type="button" className="btn w-full sm:w-auto" disabled={v.trim().length < 5 || b} onClick={run}>{t("Analyser avec Bobby")}</button></div>
    <div className="mt-5">{b && <Busy steps={STEPS_T} />}{r && <Report r={r} />}</div></div>);
}

export function WebV() {
  const t = useT(); const scan = useScan(); const [u, setU] = useState(""); const [r, setR] = useState<UrlResult | null>(null); const [b, setB] = useState(false); const [err, setErr] = useState("");
  const run = async (v = u) => { setU(v); setErr(""); setR(null); setB(true); await wait(850); const x = analyzeUrl(v); setB(false); if (!x) { setErr("Cette adresse ne me semble pas valide. Exemple : exemple.fr"); return; } scan("web", x.domain, x); setR(x); };
  return (<div><Title t="Analyse site web" d="Collez l'adresse d'un site avant d'y entrer vos informations." />
    <div className="card p-5 space-y-4"><div className="flex gap-2 flex-col sm:flex-row"><input className="inp" dir="ltr" inputMode="url" aria-label={t("Adresse du site")} placeholder="https://…" value={u} onChange={(e) => setU(e.target.value)} onKeyDown={(e) => e.key === "Enter" && u && run()} /><button type="button" className="btn" disabled={!u || b} onClick={() => run()}>{t("Vérifier")}</button><Mic onText={(x) => setU(x.replace(/\s+/g, "").replace(/point/gi, "."))} /></div>
      <div className="flex flex-wrap gap-2">{EX_W.map((x) => <button type="button" key={x} className="btn2" dir="ltr" onClick={() => run(x)}>{x.replace(/https?:\/\//, "")}</button>)}</div>{err && <p className="text-sm" role="alert" style={{ color: "#F59E0B" }}>{t(err)}</p>}</div>
    <div className="mt-5">{b && <Busy steps={STEPS_W} />}{r && <WebReport r={r} />}</div></div>);
}

const OCR = ["URGENT : votre colis est bloqué. Payez 2,99 € de frais de douane sur http://colis-laposte-suivi.xyz/payer avant ce soir.", "Rappel : rendez-vous chez le Dr Martin mardi à 14h30. Merci de confirmer par SMS.", "Félicitations ! Vous avez gagné un iPhone. Confirmez vos informations bancaires et le code SMS reçu.", "Offre télétravail sans expérience : gagnez 3000 € par mois. Envoyez votre IBAN pour commencer."];
const Drop = ({ label, onFile }: { label: string; onFile: (f: File) => void }) => { const t = useT(); return <label className="grid place-items-center gap-2 border-2 border-dashed rounded-3xl p-8 cursor-pointer text-mute text-center transition hover:border-[var(--brand)]" style={{ borderColor: "var(--bd)" }}><Upload /><span>{t(label)}</span><input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} /></label>; };
export function ImageV() {
  const t = useT(); const scan = useScan(); const [img, setImg] = useState(""); const [txt, setTxt] = useState(""); const [r, setR] = useState<Result | null>(null); const [b, setB] = useState(false);
  const go = async (seed: string, src: string) => { setImg(src); setR(null); setB(true); await wait(1100); const x0 = OCR[hash(seed) % OCR.length]; const x = analyzeText(x0); scan("image", x0, x); setTxt(x0); setR(x); setB(false); };
  return (<div><Title t="Analyse image" d="Ajoutez une capture d'écran : je lis le texte pour vous." />
    <div className="card p-5 space-y-4"><Drop label="Choisir une image" onFile={(f) => go(f.name + f.size, URL.createObjectURL(f))} />
      <div className="flex flex-wrap gap-2">{OCR.map((_, i) => <button type="button" key={i} className="btn2" onClick={() => go("ex" + i + "x", "")}>{t("Image d'exemple")} {i + 1}</button>)}</div></div>
    <div className="mt-5 space-y-4">{b && <Busy steps={["Bobby lit le texte de l'image…", "Je cherche les signes d'arnaque…", "Je calcule le score de confiance…"]} />}
      {r && <><div className="card p-5 flex gap-4">{img && <img src={img} alt="" className="w-24 h-24 object-cover rounded-2xl" />}<div className="min-w-0"><p className="text-xs text-mute mb-1">{t("Texte détecté")} · <span style={{ color: "#F59E0B" }}>{t("lecture simulée (démo)")}</span></p><p className="text-sm italic">« {t(txt)} »</p></div></div><Report r={r} /></>}</div></div>);
}

const QRS = ["https://paiement-parking-secure.top/pay?id=8841", "https://www.service-public.fr/", "http://192.168.4.12/login", "https://amazon-verify-compte.xyz/connexion"];
async function decodeQr(f: File): Promise<string | null | "none"> {
  try { const BD = (window as any).BarcodeDetector; if (!BD) return null; const det = new BD({ formats: ["qr_code"] }); const bmp = await createImageBitmap(f); const res = await det.detect(bmp); return res[0]?.rawValue || "none"; } catch { return null; }
}
export function QrV() {
  const t = useT(); const scan = useScan(); const [p, setP] = useState(""); const [r, setR] = useState<UrlResult | Result | null>(null); const [web, setWeb] = useState(true); const [sim, setSim] = useState(false); const [b, setB] = useState(false); const [err, setErr] = useState("");
  const show = (c: string, simulated: boolean) => { const u = looksLikeUrl(c) ? analyzeUrl(c) : null; const x = u || analyzeText(c); scan("qr", c, x); setP(c); setWeb(!!u); setR(x); setSim(simulated); };
  const go = async (seed: string, f?: File) => {
    setR(null); setErr(""); setB(true); await wait(900);
    const d = f ? await decodeQr(f) : null;
    if (d === "none") setErr("Je ne trouve aucun QR code dans cette image. Essayez une photo plus nette.");
    else if (d) show(d, false); else show(QRS[hash(seed) % QRS.length], true);
    setB(false);
  };
  return (<div><Title t="Analyse QR code" d="Je regarde où mène un QR code avant que vous le scanniez." />
    <div className="card p-5 space-y-4"><Drop label="Choisir l'image d'un QR code" onFile={(f) => go(f.name + f.size, f)} />
      <div className="flex flex-wrap gap-2">{QRS.map((_, i) => <button type="button" key={i} className="btn2" onClick={() => go("qr" + i + "z")}>{t("QR d'exemple")} {i + 1}</button>)}</div>{err && <p className="text-sm" role="alert" style={{ color: "#F59E0B" }}>{t(err)}</p>}</div>
    <div className="mt-5">{b && <Busy steps={["Bobby décode le QR code…", "Je vérifie la destination…", "Je calcule le score de confiance…"]} />}
      {r && (() => { const body = <div className="rounded-2xl p-4 text-sm space-y-1 break-words" style={{ background: "var(--soft)" }}><p><b>{t("Contenu décodé")} :</b> <span dir="ltr">{p}</span></p>{web && <p><b>{t("Destination")} :</b> <span dir="ltr">{(r as UrlResult).domain}</span></p>}<p><b>{t("Niveau de risque")} :</b> {t(META[r.level].label)}</p>{sim && <p style={{ color: "#F59E0B" }}>{t("Lecture simulée (démo) : votre navigateur ne sait pas lire les QR codes.")}</p>}</div>; return <Report r={r}>{body}</Report>; })()}</div></div>);
}

export function CallsV() {
  const t = useT(); const scan = useScan(); const vo = useS((x) => x.settings.voice !== false), lg = useS((x) => x.settings.lang); const bump = useS((s) => s.bump); const notify = useS((s) => s.notify);
  const [q, setQ] = useState(""); const [f, setF] = useState("all"); const [inc, setInc] = useState<(typeof CALLS)[0] | null>(null); const [num, setNum] = useState(""); const [nr, setNr] = useState<ReturnType<typeof scoreNumber>>(null); const [ne, setNe] = useState("");
  const list = CALLS.filter((c) => (f === "all" || c.kind === f) && (c.n + c.name + t(c.name)).toLowerCase().includes(q.toLowerCase()));
  const rec = (k: string) => (k === "safe" ? "Vous pouvez répondre." : k === "unknown" ? "Laissez sonner, répondez seulement si vous attendez un appel." : "Ne répondez pas. Je vous conseille de bloquer ce numéro.");
  const phrase = (k: string) => (k === "scam" ? "Attention, appel suspect. Je pense qu'il s'agit probablement d'une arnaque. Ne répondez pas." : k === "safe" ? "Ce numéro semble fiable." : "Numéro inconnu. Soyez prudent avant de répondre.");
  const sim = () => { const c = CALLS[Math.floor(Math.random() * CALLS.length)]; setInc(c); if (vo) speak(phrase(c.kind), lg); };
  const check = () => { const x = scoreNumber(num, CALLS); if (!x) { setNr(null); setNe("Entrez un numéro complet, par exemple +33 6 12 34 56 78."); return; } setNe(""); setNr(x); scan("call", num, { score: x.score, level: x.level, reasons: [], tips: [] }); if (vo) speak(phrase(x.kind), lg); };
  const close = () => { stopSpeak(); setInc(null); };
  useEffect(() => { if (!inc) return; const k = (e: KeyboardEvent) => e.key === "Escape" && close(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [inc]);
  return (<div><Title t="Protection appels" d="Je vous dis qui appelle avant que vous décrochiez." />
    <div className="card p-5 mb-4 space-y-3"><label htmlFor="num" className="font-semibold block">{t("Vérifier un numéro")}</label>
      <div className="flex gap-2 flex-col sm:flex-row"><input id="num" dir="ltr" inputMode="tel" className="inp" placeholder="+33 6 12 34 56 78" value={num} onChange={(e) => { setNum(e.target.value); setNe(""); }} onKeyDown={(e) => e.key === "Enter" && check()} /><button type="button" className="btn" onClick={check}>{t("Vérifier")}</button></div>
      {ne && <p className="text-sm" role="alert" style={{ color: "#F59E0B" }}>{t(ne)}</p>}
      {nr && <div className="flex items-center gap-4 pt-2"><Gauge score={nr.score} size={72} /><div className="flex-1 min-w-0"><Badge lv={nr.level} /><p className="font-semibold mt-1">{t(nr.name)} · {nr.reports} {t("signalements")}</p><p className="text-sm text-mute">{t(rec(nr.kind))}</p></div></div>}
      <button type="button" className="btn2" onClick={sim}><Phone size={16} />{t("Simuler un appel entrant")}</button></div>
    <div className="flex flex-col sm:flex-row gap-3 mb-4"><div className="relative flex-1"><Search size={16} className="absolute start-4 top-4 text-mute" /><input className="inp ps-10" aria-label={t("Rechercher un numéro…")} placeholder={t("Rechercher un numéro…")} value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="flex gap-2 flex-wrap">{[["all", "Tous"], ["safe", "Sûrs"], ["unknown", "Inconnus"], ["scam", "Arnaques"]].map(([k, l]) => <button type="button" key={k} onClick={() => setF(k)} aria-pressed={f === k} className={"btn2 " + (f === k ? "on" : "")}>{t(l)}</button>)}</div></div>
    <div className="space-y-3">{list.map((c) => (<div key={c.n} className="card p-4 flex items-center gap-4"><Gauge score={c.score} size={60} /><div className="flex-1 min-w-0"><p className="font-semibold" dir="ltr">{c.n}</p><p className="text-sm text-mute">{t(c.name)} · {c.reports} {t("signalements")}</p><p className="text-sm mt-1">{t(rec(c.kind))}</p></div><Badge lv={levelOf(c.score)} /></div>))}{!list.length && <p className="text-mute">{t("Aucun numéro trouvé.")}</p>}</div>
    <AnimatePresence>{inc && (<motion.div role="dialog" aria-modal="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] grid place-items-center p-4 bg-black/70"><motion.div initial={{ scale: .92 }} animate={{ scale: 1 }} className="card p-6 w-full max-w-sm text-center space-y-4" style={{ background: "var(--solid)" }}><p className="text-mute text-sm">{t("Appel entrant")}</p><p className="text-xl font-bold" dir="ltr">{inc.n}</p><div className="flex justify-center"><Gauge score={inc.score} /></div><p className="font-medium">{t(inc.kind === "scam" ? "🔴 Je pense qu'il s'agit probablement d'une arnaque." : inc.kind === "safe" ? "✅ Ce numéro semble fiable." : "⚠️ Soyez prudent avant de répondre.")}</p><p className="text-sm text-mute">{t(inc.name)} · {inc.reports} {t("signalements")}</p>
      <div className="flex gap-3"><button type="button" className="btn2 flex-1 justify-center" onClick={() => { bump(false); close(); }}>{t("Répondre")}</button><button type="button" className="btn flex-1" onClick={() => { bump(true); close(); notify("Numéro bloqué."); }}><PhoneOff size={16} />{t("Bloquer")}</button></div></motion.div></motion.div>)}</AnimatePresence></div>);
}

export function ThreatsV() {
  const t = useT(); const [q, setQ] = useState(""); const [o, setO] = useState("");
  const list = THREATS.filter((x) => (x.id + x.d + t(x.id) + t(x.d)).toLowerCase().includes(q.toLowerCase()));
  return (<div><Title t="Centre des menaces" d="Apprenez à reconnaître les arnaques les plus courantes." />
    <div className="relative mb-4"><Search size={16} className="absolute start-4 top-4 text-mute" /><input className="inp ps-10" aria-label={t("Rechercher une menace…")} placeholder={t("Rechercher une menace…")} value={q} onChange={(e) => setQ(e.target.value)} /></div>
    <div className="space-y-3">{list.map((x) => (<div key={x.id} className="card overflow-hidden"><button type="button" aria-expanded={o === x.id} className="w-full p-5 flex items-center justify-between gap-3 text-start" onClick={() => setO(o === x.id ? "" : x.id)}><div><p className="font-semibold">{t(x.id)}</p><p className="text-sm text-mute">{t(x.d)}</p></div><ChevronDown className={"transition shrink-0 " + (o === x.id ? "rotate-180" : "")} /></button>
      {o === x.id && <div className="px-5 pb-5 space-y-3"><div><p className="text-xs text-mute mb-1">{t("Exemples")}</p>{x.ex.map((e) => <p key={e} className="text-sm">• {t(e)}</p>)}</div><p className="text-sm rounded-2xl p-3" style={{ background: "var(--soft)" }}>💡 {t(x.tip)}</p></div>}</div>))}{!list.length && <p className="text-mute">{t("Aucun résultat.")}</p>}</div></div>);
}

export function FamilyV() {
  const t = useT(); const [m, setM] = useState(FAMILY); const [call, setCall] = useState(false);
  return (<div><Title t="Protection famille" d="Veillez sur vos proches, où qu'ils soient." />
    <div className="grid sm:grid-cols-3 gap-3 mb-5"><div className="card p-5"><p className="text-sm text-mute">{t("Membres protégés")}</p><p className="text-3xl font-bold" style={{ color: "var(--brand)" }}>{m.filter((x) => x.on).length}/{m.length}</p></div><div className="card p-5"><p className="text-sm text-mute">{t("Niveau de risque")}</p><p className="text-3xl font-bold" style={{ color: "#EAB308" }}>{t("Modéré")}</p></div>
      <div className="card p-5"><p className="text-sm text-mute">{t("Contact d'urgence")}</p><p className="font-semibold">Camille · <span dir="ltr">06 12 34 56 78</span></p><button type="button" className="btn2 mt-2" onClick={() => setCall(!call)}>{t(call ? "Appel en cours… (démo)" : "Appeler")}</button></div></div>
    <div className="space-y-3">{m.map((x, i) => (<div key={x.n} className="card p-4 flex items-center gap-3"><div className="w-12 h-12 rounded-full grid place-items-center font-bold text-white shrink-0" style={{ background: "linear-gradient(135deg,var(--brand),var(--brand2))" }}>{x.n[0]}</div><div className="flex-1 min-w-0"><p className="font-semibold">{x.n} <span className="text-mute text-sm font-normal">· {t(x.role)}</span></p><p className="text-sm text-mute">{t(x.alert)}</p></div><Badge lv={x.risk} /><Toggle label={x.n} on={x.on} f={() => setM(m.map((y, j) => (j === i ? { ...y, on: !y.on } : y)))} /></div>))}</div></div>);
}

export function CommunityV() {
  const t = useT(); const [tab, setTab] = useState("Numéros"); const [q, setQ] = useState(""); const [kind, setKind] = useState("Sites"); const [n, setN] = useState(""); const [msg, setMsg] = useState(""); const [more, setMore] = useState<Record<string, number>>({}); const { reported, report } = useS();
  const mine = reported.map((x) => (x.includes("|") ? x.split("|") : ["Sites", x])).filter(([k]) => k === tab).map(([, v]) => v);
  const items = [...mine, ...REP[tab]].filter((x) => x.toLowerCase().includes(q.toLowerCase()));
  const send = () => { if (!n.trim()) { setMsg("⚠️ Écrivez d'abord le numéro, l'email ou le site à signaler."); return; } report(kind + "|" + n.trim()); setTab(kind); setN(""); setQ(""); setMsg("✅ Merci ! Votre signalement a été ajouté et protège les autres."); };
  return (<div><Title t="Bouclier communautaire" d="Les signalements de milliers d'utilisateurs, en direct." />
    <div className="card p-5 mb-4 space-y-3"><h2 className="font-semibold">{t("Signaler une arnaque")}</h2>
      <div className="flex gap-2 flex-wrap">{Object.keys(REP).map((k) => <button type="button" key={k} aria-pressed={kind === k} className={"btn2 " + (kind === k ? "on" : "")} onClick={() => setKind(k)}>{t(k)}</button>)}</div>
      <div className="flex gap-2 flex-col sm:flex-row"><input className="inp" dir="ltr" aria-label={t("Signaler une arnaque")} placeholder={kind === "Numéros" ? "+33 7 00 00 00 00" : kind === "Emails" ? "faux@arnaque.top" : "faux-site.xyz"} value={n} onChange={(e) => { setN(e.target.value); setMsg(""); }} onKeyDown={(e) => e.key === "Enter" && send()} /><button type="button" className="btn" onClick={send}>{t("Signaler")}</button></div>
      {msg && <p className="text-sm font-medium" role="status" style={{ color: msg.startsWith("✅") ? "#22C55E" : "#F59E0B" }}>{t(msg)}</p>}</div>
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="card p-5 space-y-4"><div className="flex gap-2 flex-wrap">{Object.keys(REP).map((k) => <button type="button" key={k} aria-pressed={tab === k} className={"btn2 " + (tab === k ? "on" : "")} onClick={() => setTab(k)}>{t(k)}</button>)}</div>
        <input className="inp" aria-label={t("Filtrer la liste…")} placeholder={t("Filtrer la liste…")} value={q} onChange={(e) => setQ(e.target.value)} /><div className="space-y-2">{items.map((x, i) => <p key={x + i} className="text-sm p-3 rounded-2xl break-all" dir="ltr" style={{ background: "var(--soft)" }}>🚩 {x}</p>)}{!items.length && <p className="text-mute text-sm">{t("Aucun résultat.")}</p>}</div></div>
      <div className="space-y-4"><div className="card p-5"><h2 className="font-semibold mb-3">{t("Top menaces de la semaine")}</h2>{TOP.map(([l, v]) => <div key={l} className="mb-3"><div className="flex justify-between text-sm"><span>{t(l)}</span><span className="text-mute">{v}%</span></div><div className="h-2 rounded-full" style={{ background: "var(--bd)" }}><motion.div initial={{ width: 0 }} animate={{ width: v + "%" }} className="h-2 rounded-full" style={{ background: "linear-gradient(90deg,var(--brand),var(--brand2))" }} /></div></div>)}</div>
        <div className="card p-5"><h2 className="font-semibold mb-3">{t("Fil d'alertes")}</h2><div className="space-y-4">{FEED.map((x) => <div key={x.t} className="space-y-2"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium">{t(x.t)}</p><p className="text-xs text-mute">{x.c + (more[x.t] || 0)} {t("signalements")} · {t(x.ago)}</p></div><Badge lv={x.lv} /></div>
          <button type="button" className="btn2 text-xs" disabled={!!more[x.t]} onClick={() => setMore({ ...more, [x.t]: 1 })}>{t(more[x.t] ? "✅ Merci, c'est noté" : "Je l'ai reçu aussi")}</button></div>)}</div></div></div></div></div>);
}

function VoicePick() {
  const { settings: s, set } = useS(); const t = useT(); const [vs, setVs] = useState<string[]>([]);
  useEffect(() => { const sy = typeof window !== "undefined" ? window.speechSynthesis : undefined; if (!sy) return; const load = () => { const code = (LANGS[s.lang]?.tts || "fr-FR").slice(0, 2); setVs(sy.getVoices().filter((v) => v.lang.toLowerCase().startsWith(code)).map((v) => v.name)); }; load(); sy.onvoiceschanged = load; return () => { sy.onvoiceschanged = null; }; }, [s.lang]);
  return (<div className="flex gap-2 flex-wrap justify-end"><select className="inp max-w-[200px]" aria-label={t("Voix de Bobby")} value={s.voiceName || ""} onChange={(e) => set({ voiceName: e.target.value })}><option value="">{t("Automatique (voix masculine)")}</option>{vs.map((n) => <option key={n} value={n}>{n}</option>)}</select><button type="button" className="btn2" onClick={() => speak("Bonjour, je suis Bobby. Je veille sur vous.", s.lang)}><Volume2 size={16} />{t("Tester")}</button></div>);
}

export function SettingsV() {
  const { settings: s, set, clearHistory, notify } = useS(); const t = useT();
  const Row = ({ l, children }: { l: string; children: React.ReactNode }) => <div className="flex items-center justify-between gap-4 py-4 border-b" style={{ borderColor: "var(--bd)" }}><span>{t(l)}</span>{children}</div>;
  return (<div><Title t="Réglages" d="Personnalisez Bobby comme vous le souhaitez." />
    <div className="card px-5 md:px-6"><Row l="Langue"><select className="inp max-w-[220px]" aria-label={t("Langue")} value={s.lang} onChange={(e) => set({ lang: e.target.value })}>{Object.keys(LANGS).map((l) => <option key={l} value={l}>{l}</option>)}</select></Row>
      <Row l="Bobby parle sur tous les écrans"><Toggle label={t("Bobby parle sur tous les écrans")} on={s.voice !== false} f={() => { set({ voice: s.voice === false }); if (s.voice !== false) stopSpeak(); }} /></Row>
      <Row l="Voix de Bobby"><VoicePick /></Row>
      <Row l="Gravité de la voix"><div className="flex items-center gap-2 text-xs text-mute">{t("Grave")}<input type="range" aria-label={t("Gravité de la voix")} min="0.5" max="1" step="0.05" value={s.pitch ?? 0.75} onChange={(e) => set({ pitch: parseFloat(e.target.value) })} />{t("Normal")}</div></Row>
      <Row l="Notifications d'alerte"><Toggle label={t("Notifications d'alerte")} on={s.notif} f={() => set({ notif: !s.notif })} /></Row>
      <Row l="Confidentialité renforcée (rien n'est envoyé)"><Toggle label={t("Confidentialité renforcée (rien n'est envoyé)")} on={s.privacy} f={() => set({ privacy: !s.privacy })} /></Row>
      <Row l="Thème"><div className="flex gap-2">{(["dark", "light"] as const).map((x) => <button type="button" key={x} aria-pressed={s.theme === x} className={"btn2 " + (s.theme === x ? "on" : "")} onClick={() => set({ theme: x })}>{t(x === "dark" ? "Sombre" : "Clair")}</button>)}</div></Row>
      <Row l="Niveau de sécurité"><div className="flex gap-2 flex-wrap justify-end">{(["Standard", "Renforcé", "Maximum"] as const).map((x) => <button type="button" key={x} aria-pressed={s.security === x} className={"btn2 " + (s.security === x ? "on" : "")} onClick={() => set({ security: x })}>{t(x)}</button>)}</div></Row>
      <Row l="Historique des vérifications"><button type="button" className="btn2" onClick={() => { clearHistory(); notify("Historique effacé."); }}>{t("Effacer")}</button></Row>
      <div className="py-5 flex items-center gap-4"><Bobby s={48} /><div><p className="font-semibold">{t("À propos de Bobby One")}</p><p className="text-sm text-mute">{t("Version 1.1 · « Bobby veille sur vous. » Prototype de démonstration : les analyses sont simulées.")}</p></div></div></div></div>);
}

export function BotV() {
  const { settings: st, set } = useS(); const t = useT(); const lang = st.lang, vo = st.voice !== false; const bump = useS((x) => x.bump);
  const [m, setM] = useState<{ me: boolean; t: string; fr?: boolean }[]>([{ me: false, t: "Bonjour, je suis Bobby. Collez un message ou une adresse de site, ou posez-moi une question sur les arnaques." }]);
  const [i, setI] = useState(""); const [lis, setLis] = useState(false); const [convo, setConvo] = useState(false); const [err, setErr] = useState("");
  const box = useRef<HTMLDivElement>(null); const rec = useRef<any>(null); const cv = useRef(false);
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [m]);
  useEffect(() => () => { cv.current = false; rec.current?.abort?.(); stopSpeak(); }, []);
  const reply = (x: string) => {
    const u = x.match(/https?:\/\/\S+|\b[\w-]+\.(com|fr|net|org|xyz|top|click|info|shop|io)\b\S*/i);
    if (u) { const r = analyzeUrl(u[0]); if (r) { bump(r.score < 60); return `${META[r.level].bobby} Score : ${r.score}/100. ${r.reasons[0]} ${r.tips[0]}`; } }
    if (/victime|arnaqu[ée]|pirat[ée]|piratage|que faire/i.test(x)) return "Pas de panique. 1) Ne payez rien de plus. 2) Appelez votre banque pour faire opposition. 3) Changez vos mots de passe. 4) Gardez les preuves et signalez sur cybermalveillance.gouv.fr. En cas de danger immédiat, appelez le 17.";
    if (/qui es-tu|qui [eê]tes|c'est quoi bobby/i.test(x)) return "Je suis Bobby, votre gardien personnel. Je repère les signes d'arnaque dans vos messages, sites, appels et QR codes.";
    if (/^(bonjour|salut|coucou|hello)\b/i.test(x.trim())) return "Bonjour ! Je suis là pour vous aider. Collez-moi un message suspect ou une adresse de site.";
    if (x.trim().length >= 15) { const r = analyzeText(x); bump(r.score < 60); return `${META[r.level].bobby} Score : ${r.score}/100. ${r.reasons[0]} ${r.tips[0]}`; }
    return "Je n'ai pas bien compris. Collez le message ou l'adresse à vérifier, ou demandez-moi « que faire si je suis victime ? ».";
  };
  const hear = () => { setErr(""); setLis(true); rec.current = listen(lang, (x) => send(x), (e) => { setErr(ERR[e] || ERR.x); cv.current = false; setConvo(false); }, () => setLis(false)); };
  const send = async (x = i, fr = false) => { if (!x.trim()) return; setM((o) => [...o, { me: true, t: x, fr }]); setI(""); const a = reply(fr ? x : await toFr(lang, x)); setTimeout(() => { setM((o) => [...o, { me: false, t: a }]); if (vo) speak(a, lang, () => { if (cv.current) hear(); }); else if (cv.current) hear(); }, 300); };
  const toggleConvo = () => { if (convo) { cv.current = false; setConvo(false); rec.current?.abort?.(); stopSpeak(); } else { cv.current = true; setConvo(true); if (!vo) set({ voice: true }); hear(); } };
  const pending = useS((x) => x.pending); useEffect(() => { if (pending) { useS.setState({ pending: null }); send(pending); } }, [pending]);
  return (<div><Title t="Parler à Bobby" d="Écrivez ou parlez à Bobby : il vous répond à voix haute." />
    <div className="card p-4"><div ref={box} className="h-[46vh] overflow-y-auto space-y-3 pe-1" aria-live="polite">{m.map((x, k) => <div key={k} className={"flex " + (x.me ? "justify-end" : "gap-2")}>{!x.me && <Bobby s={32} />}<p className="max-w-[85%] rounded-2xl px-4 py-2 text-sm" style={x.me ? { background: "linear-gradient(135deg,var(--brand),var(--brand2))", color: "#fff" } : { background: "var(--soft)" }}>{!x.me || x.fr ? t(x.t) : x.t}</p></div>)}</div>
      <div className="flex flex-wrap gap-2 mt-3"><button type="button" className={"btn2 " + (lis ? "on" : "")} disabled={lis} onClick={hear}><MicI size={16} />{t(lis ? "Je vous écoute…" : "Parler à Bobby")}</button><button type="button" className={"btn2 " + (convo ? "on" : "")} onClick={toggleConvo}>🗣️ {t(convo ? "Arrêter la conversation" : "Conversation vocale")}</button>
        <button type="button" className={"btn2 " + (vo ? "on" : "")} onClick={() => { set({ voice: !vo }); stopSpeak(); }}>{t(vo ? "🔊 Voix activée" : "🔇 Voix coupée")}</button></div>
      {err && <p className="text-sm mt-2" role="alert" style={{ color: "#F59E0B" }}>{t(err)}</p>}
      <div className="flex flex-wrap gap-2 mt-3">{["Que faire si je suis victime ?", "Est-ce que colis-laposte-suivi.xyz est fiable ?"].map((x) => <button type="button" key={x} className="btn2 text-xs" onClick={() => send(x, true)}>{t(x)}</button>)}</div>
      <div className="flex gap-2 mt-3"><input className="inp" aria-label={t("Écrivez à Bobby…")} placeholder={t("Écrivez à Bobby…")} value={i} onChange={(e) => setI(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} /><button type="button" className="btn" onClick={() => send()}>{t("Envoyer")}</button></div>
      <p className="text-xs text-mute mt-3">{t("Bobby répond avec ses règles intégrées (pas encore une IA en ligne).")}</p></div></div>);
}
