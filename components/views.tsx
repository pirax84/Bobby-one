"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, Upload, Phone, PhoneOff, ChevronDown, ClipboardPaste, Mic as MicI, Volume2, Download, Share2, History, ArrowRight, Sparkles } from "lucide-react";
import { analyzeText, analyzeUrl, ageLabel, hash, META, looksLikeUrl, levelOf, Result, UrlResult } from "@/lib/engine";
import { useS, View } from "@/lib/store";
import { useT, toFr, LANGS } from "@/lib/i18n";
import { THREATS, FEED, TOP, REP, FAMILY } from "@/lib/data";
import { Explain } from "./Explain";
import { Where, useCountry } from "./Where";
import { COUNTRIES, locate } from "@/lib/country";
import { ocr, decodeQr } from "@/lib/vision";
import { contactsSupported, pickContacts } from "@/lib/contacts";
import { analyzeNumber, NumResult } from "@/lib/numbers";
import { askNotif, askMic, notifState, alertDanger, PermState } from "@/lib/perm";
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
function useScan() { const { bump, addScan, settings } = useS(); return (kind: any, label: string, r: Result) => { bump(r.score < 60); if (r.score < 40 && settings.notif) alertDanger(META[r.level].bobby + " " + (r.reasons[0] || "")); addScan({ kind, label: label.replace(/\s+/g, " ").slice(0, 70), score: r.score, level: r.level }); }; }

interface Live { ok: boolean; listed: boolean | null; sources: string[]; ageDays: number | null }
async function live(u: string): Promise<Live | null> {
  try { const r = await fetch("/api/live?u=" + encodeURIComponent(u), { signal: AbortSignal.timeout(9000) }); if (!r.ok) return null; const j = await r.json(); return j.ok ? j : null; } catch { return null; }
}
function applyLive(r: UrlResult, lv: Live | null): UrlResult {
  if (lv?.listed) return { ...r, score: Math.min(r.score, 5), level: "danger", reasons: ["Ce site figure sur une liste de sites frauduleux connus.", ...r.reasons.filter((x) => !/service connu|aucun signe/.test(x))], tips: ["Quittez ce site tout de suite et n'y entrez rien."] };
  if (lv?.ageDays != null && lv.ageDays < 30 && r.score > 59) return { ...r, score: 59, level: "careful", reasons: ["Ce nom de site a été créé il y a moins d'un mois, ce qui est fréquent chez les faux sites.", ...r.reasons] };
  return r;
}
function WebReport({ r, lv }: { r: UrlResult; lv?: Live | null }) {
  const t = useT(); const { report, notify } = useS();
  const listed = !lv ? "Indisponible" : lv.listed === true ? "⚠️ Signalé" : lv.listed === false ? "Non listé" : "Indisponible";
  return (<Report r={r} noun="site">
    <div className="grid grid-cols-3 gap-2 text-center">{[["Domaine", r.domain], ["Ancienneté", ageLabel(lv?.ageDays, t)], ["Listes de fraude en ligne", t(listed)]].map(([a, v]) => <div key={a} className="rounded-2xl p-3 min-w-0" style={{ background: "var(--soft)" }}><p className="text-xs text-mute">{t(a)}</p><p className="font-semibold text-sm break-words">{v}</p></div>)}</div>
    <p className="text-xs text-mute">{lv?.sources?.length ? t("Listes consultées") + " : " + lv.sources.join(", ") + ". " : ""}{t("« Non listé » ne veut pas dire « sûr » : les faux sites changent chaque jour.")}</p>
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


function ShareCard() {
  const t = useT(); const { notify } = useS(); const URL_ = "https://bobby-one-six.vercel.app/";
  const share = async () => {
    try {
      const nav: any = navigator; const msg = t("Je protège mes messages et mes appels contre les arnaques avec Bobby One. Essaie-le :");
      try { const r = await fetch("/bobby-qr.png"); const f = new File([await r.blob()], "bobby-qr.png", { type: "image/png" }); if (nav.canShare?.({ files: [f] })) { await nav.share({ files: [f], text: msg + " " + URL_ }); return; } } catch (e: any) { if (e?.name === "AbortError") return; }
      if (nav.share) { await nav.share({ text: msg, url: URL_ }); return; }
      await nav.clipboard.writeText(URL_); notify("Lien copié : collez-le dans un message.");
    } catch (e: any) { if (e?.name !== "AbortError") notify("Impossible de partager ici. Utilisez « Télécharger ».", "warn"); }
  };
  return (<section className="card p-5 flex flex-col sm:flex-row items-center gap-5">
    <img src="/bobby-qr.png" alt={t("QR code de Bobby One")} width={150} height={150} className="rounded-2xl bg-white p-1 shrink-0" style={{ width: 150, height: 150 }} />
    <div className="flex-1 min-w-0 text-center sm:text-start space-y-3"><div><h2 className="font-semibold">{t("Faites connaître Bobby à vos proches")}</h2><p className="text-sm text-mute">{t("Ils scannent ce code avec leur téléphone : Bobby s'ouvre et ils peuvent l'installer.")}</p></div>
      <div className="flex flex-wrap gap-2 justify-center sm:justify-start"><a href="/bobby-qr.png" download="bobby-one-qr.png" className="btn"><Download size={18} />{t("Télécharger")}</a><button type="button" className="btn2" onClick={share}><Share2 size={16} />{t("Partager")}</button><button type="button" className="btn2" onClick={async () => { try { await navigator.clipboard.writeText(URL_); notify("Lien copié : collez-le dans un message."); } catch { notify("Impossible de copier ici.", "warn"); } }}>{t("Copier le lien")}</button></div><p className="text-xs text-mute break-all" dir="ltr">bobby-one-six.vercel.app</p></div></section>);
}

export function HomeV() {
  const { go, protectedToday, blocked, reported, history, incoming, setIncoming, clearHistory, notify } = useS(); const t = useT(); const lang = useS((s) => s.settings.lang); const scan = useScan();
  const [q, setQ] = useState(""); const [res, setRes] = useState<{ r: Result | UrlResult; web: boolean; lv?: Live | null } | null>(null); const [b, setB] = useState(false); const [err, setErr] = useState("");
  const check = async (v = q) => {
    const x = v.trim(); if (x.length < 3) { setErr("Écrivez ou collez d'abord un message ou une adresse."); return; }
    setErr(""); setRes(null); setB(true); await wait(900);
    const u0 = looksLikeUrl(x) ? analyzeUrl(x) : null; const lv = u0 ? await live(x) : null; const u = u0 ? applyLive(u0, lv) : null; const r = u || analyzeText(x); scan(u ? "web" : "text", x, r); setRes({ r, web: !!u, lv }); setQ(""); setB(false);
  };
  useEffect(() => { if (incoming) { const x = incoming; setIncoming(null); setQ(x); check(x); } }, [incoming]);
  const paste = async () => { try { const x = await navigator.clipboard.readText(); if (x) { setQ(x); setRes(null); setErr(""); } else notify("Le presse-papiers est vide.", "warn"); } catch { notify("Impossible de coller ici : faites un appui long dans la case, puis « Coller ».", "warn"); } };
  const avg = history.length ? Math.round(history.reduce((a, h) => a + h.score, 0) / history.length) : null;
  const stats: [string, string | number, string, View][] = [["Moyenne de mes vérifications", avg === null ? "—" : avg + "/100", avg === null ? "var(--mute)" : META[levelOf(avg)].color, "threats"], ["Vérifications faites", protectedToday, "var(--brand)", "text"], ["Menaces détectées", blocked, "#EF4444", "calls"], ["Mes signalements", reported.length, "#F59E0B", "community"]];
  const code = LANGS[lang]?.code || "fr"; const days = Array.from({ length: 7 }, (_, i) => { try { return new Intl.DateTimeFormat(code, { weekday: "narrow" }).format(new Date(2024, 0, 1 + i)); } catch { return "·"; } }); const bars = [12, 18, 9, 24, 15, 31, 20];
  const tools = NAV.filter((n) => ["text", "web", "image", "qr", "calls", "threats"].includes(n.id));
  return (<div className="space-y-5">
    <InstallCard />
    <section className="card p-5 md:p-6 space-y-4">
      <div className="flex items-center gap-4"><motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 3 }}><Bobby s={60} /></motion.div>
        <div className="min-w-0"><h1 className="text-xl md:text-3xl font-bold tracking-tight">{t("Bonjour, je suis Bobby.")}</h1><p className="text-mute">{t("Je vérifie ce qui mérite votre confiance.")}</p></div></div>
      <Explain id="home" compact />
      <label htmlFor="quick" className="block text-sm font-medium">{t("Collez ici un message, un lien ou une adresse à vérifier")}</label>
      <textarea id="quick" className="inp min-h-28 resize-y" placeholder={t("Collez ici le message à vérifier…")} value={q} onChange={(e) => { setQ(e.target.value); setErr(""); }} />
      {err && <p className="text-sm" role="alert" style={{ color: "#F59E0B" }}>{t(err)}</p>}
      <div className="flex flex-wrap gap-2"><button type="button" className="btn flex-1 sm:flex-none" disabled={b} onClick={() => check()}><Sparkles size={18} />{t("Vérifier avec Bobby")}</button>
        <button type="button" className="btn2" onClick={paste}><ClipboardPaste size={16} />{t("Coller")}</button>{q && <button type="button" className="btn2" onClick={() => { setQ(""); setRes(null); setErr(""); }}>{t("Effacer")}</button>}<Mic onText={(x) => { setQ((o) => (o + " " + x).trim()); setRes(null); }} /></div>
      <div><p className="text-xs text-mute mb-2">{t("Essayez avec un exemple")}</p><Chips items={[...EX_T, { l: "Faux site", v: "amazon-verify-compte.xyz" }]} on={(v) => { setQ(v); setRes(null); setErr(""); }} /></div>
    </section>
    {b && <Busy steps={STEPS_T} />}
    {res && (res.web ? <WebReport r={res.r as UrlResult} lv={res.lv} /> : <Report r={res.r} />)}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{stats.map(([l, v, c, to]) => <motion.button type="button" whileTap={{ scale: .97 }} key={l} onClick={() => go(to)} className="card p-4 text-start"><p className="text-xs text-mute">{t(l)}</p><p className="text-2xl md:text-3xl font-bold mt-1" style={{ color: c }}>{v}</p><p className="text-xs text-mute mt-1 flex items-center gap-1">{t("Voir")}<ArrowRight size={12} className="rtl:rotate-180" /></p></motion.button>)}</div>
    <section><h2 className="font-semibold mb-3">{t("Tous les outils")}</h2><div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{tools.map((n) => (
      <motion.button type="button" whileTap={{ scale: .97 }} key={n.id} onClick={() => go(n.id)} className="card p-4 text-start flex flex-col gap-3"><span className="ico"><n.icon size={22} /></span><span><span className="block font-semibold leading-tight">{t(n.label)}</span><span className="block text-sm text-mute mt-0.5">{t(n.desc)}</span></span></motion.button>))}</div></section>
    {history.length > 0 && <section className="card p-5"><div className="flex items-center justify-between mb-3"><h2 className="font-semibold flex items-center gap-2"><History size={18} />{t("Vérifications récentes")}</h2><button type="button" className="text-sm text-mute underline" onClick={clearHistory}>{t("Effacer")}</button></div>
      <ul className="space-y-3">{history.slice(0, 5).map((h) => <li key={h.id} className="flex items-center gap-3"><Gauge score={h.score} size={44} /><div className="min-w-0 flex-1"><p className="text-sm truncate" dir="auto">{h.label}</p><p className="text-xs text-mute">{new Date(h.at).toLocaleTimeString(code, { hour: "2-digit", minute: "2-digit" })}</p></div><Badge lv={h.level} /></li>)}</ul></section>}
    <ShareCard />
    <section className="card p-5 flex gap-4"><div className="ico"><Share2 size={22} /></div><div><p className="font-semibold">{t("Vérifiez sans ouvrir Bobby")}</p><p className="text-sm text-mute">{t("Une fois Bobby installé (Android) : dans WhatsApp, Telegram, SMS, mails, réseaux sociaux ou la galerie photo, touchez Partager, puis choisissez Bobby One. Je vérifie le message, le lien ou l'image tout de suite.")}</p></div></section>
  </div>);
}

export function TextV() {
  const t = useT(); const scan = useScan(); const [v, setV] = useState(""); const [r, setR] = useState<Result | null>(null); const [b, setB] = useState(false);
  const run = async () => { setB(true); setR(null); await wait(850); const x = analyzeText(v); scan("text", v, x); setR(x); setV(""); setB(false); };
  return (<div><Title t="Analyse des messages" d="SMS, mails, WhatsApp, Telegram : copiez le message, puis collez-le ici." />
    <div className="card p-5 space-y-4"><textarea className="inp min-h-40 resize-y" aria-label={t("Message à vérifier")} placeholder={t("Collez ici le message à vérifier…")} value={v} onChange={(e) => { setV(e.target.value); setR(null); }} />
      <div className="flex flex-wrap gap-2"><Chips items={EX_T} on={(x) => { setV(x); setR(null); }} /><Mic onText={(x) => { setV((o) => (o + " " + x).trim()); setR(null); }} /><button type="button" className="btn2" onClick={async () => { try { const x = await navigator.clipboard.readText(); if (x) { setV(x); setR(null); } } catch {} }}>{t("Coller")}</button></div>
      <p className="text-xs text-mute">{t("Android ne permet pas à Bobby de lire vos SMS tout seul. Gardez le doigt sur le message, choisissez Copier, puis revenez ici et touchez Coller. Ou touchez Partager → Bobby One.")}</p>
      <div className="flex gap-2 flex-wrap"><button type="button" className="btn flex-1 sm:flex-none" disabled={v.trim().length < 5 || b} onClick={run}>{t("Analyser avec Bobby")}</button>{v && <button type="button" className="btn2" onClick={() => { setV(""); setR(null); }}>{t("Effacer")}</button>}</div></div>
    <div className="mt-5">{b && <Busy steps={STEPS_T} />}{r && <Report r={r} />}</div></div>);
}

export function WebV() {
  const t = useT(); const scan = useScan(); const [u, setU] = useState(""); const [r, setR] = useState<UrlResult | null>(null); const [lv, setLv] = useState<Live | null>(null); const [b, setB] = useState(false); const [err, setErr] = useState("");
  const run = async (v = u) => { setU(v); setErr(""); setR(null); setB(true); const x0 = analyzeUrl(v); const l = x0 ? await live(v) : null; await wait(500); setB(false); if (!x0) { setErr("Cette adresse ne me semble pas valide. Exemple : exemple.fr"); return; } const x = applyLive(x0, l); scan("web", x.domain, x); setLv(l); setR(x); setU(""); };
  return (<div><Title t="Analyse site web" d="Collez l'adresse d'un site avant d'y entrer vos informations." />
    <div className="card p-5 space-y-4"><div className="flex gap-2 flex-col sm:flex-row"><input className="inp" dir="ltr" inputMode="url" aria-label={t("Adresse du site")} placeholder="https://…" value={u} onChange={(e) => setU(e.target.value)} onKeyDown={(e) => e.key === "Enter" && u && run()} /><button type="button" className="btn" disabled={!u || b} onClick={() => run()}>{t("Vérifier")}</button><Mic onText={(x) => setU(x.replace(/\s+/g, "").replace(/point/gi, "."))} /></div>
      <div className="flex flex-wrap gap-2">{EX_W.map((x) => <button type="button" key={x} className="btn2" dir="ltr" onClick={() => run(x)}>{x.replace(/https?:\/\//, "")}</button>)}</div>{err && <p className="text-sm" role="alert" style={{ color: "#F59E0B" }}>{t(err)}</p>}</div>
    <div className="mt-5">{b && <Busy steps={STEPS_W} />}{r && <WebReport r={r} lv={lv} />}</div></div>);
}

const Drop = ({ label, onFile }: { label: string; onFile: (f: File) => void }) => { const t = useT(); return <label className="grid place-items-center gap-2 border-2 border-dashed rounded-3xl p-8 cursor-pointer text-mute text-center transition hover:border-[var(--brand)]" style={{ borderColor: "var(--bd)" }}><Upload /><span>{t(label)}</span><input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} /></label>; };
const URL_RE = /(https?:\/\/[^\s"'<>]+|\b(?:[a-z0-9-]+\.)+(?:com|fr|net|org|xyz|top|click|info|shop|io|co|be|ch|ca|uk|de|es|it|icu|live|buzz)\b[^\s"'<>]*)/i;
async function analyzeAny(text: string): Promise<{ r: Result | UrlResult; web: boolean; lv: Live | null }> {
  const t0 = analyzeText(text); const m = text.match(URL_RE);
  if (!m) return { r: t0, web: false, lv: null };
  const u0 = analyzeUrl(m[0]); if (!u0) return { r: t0, web: false, lv: null };
  const lv = await live(m[0]); const u = applyLive(u0, lv);
  if (u.score < t0.score) return { r: { ...u, reasons: [...u.reasons, ...t0.reasons.filter((x) => !u.reasons.includes(x))] } as UrlResult, web: true, lv };
  return { r: { ...t0, reasons: [...t0.reasons, ...u.reasons.filter((x) => !t0.reasons.includes(x))] }, web: false, lv };
}
export function ImageV() {
  const t = useT(); const scan = useScan(); const shared = useS((s) => s.sharedFile); const setShared = useS((s) => s.setSharedFile);
  const [img, setImg] = useState(""); const [txt, setTxt] = useState(""); const [res, setRes] = useState<{ r: Result | UrlResult; web: boolean; lv: Live | null } | null>(null); const [b, setB] = useState(false); const [err, setErr] = useState(""); const [pct, setPct] = useState(0); const [qr, setQr] = useState("");
  const go = async (f: File) => {
    setImg(URL.createObjectURL(f)); setRes(null); setErr(""); setTxt(""); setQr(""); setPct(0); setB(true);
    try {
      let text = ""; try { text = await ocr(f, setPct); } catch { setErr("Je n'ai pas pu charger la lecture des images. Vérifiez votre connexion internet et réessayez."); setB(false); return; }
      const code = await decodeQr(f).catch(() => null); if (code) setQr(code);
      const all = [text, code || ""].join("\n").trim();
      if (all.replace(/\s/g, "").length < 8) { setErr("Je ne trouve pas de texte lisible dans cette image. Essayez une capture plus nette."); setB(false); return; }
      setTxt(text); const x = await analyzeAny(all); scan("image", text || code || "image", x.r); setRes(x);
    } catch { setErr("Une erreur est survenue en lisant l'image. Réessayez."); }
    setB(false);
  };
  useEffect(() => { if (shared) { const f = shared; setShared(null); go(f); } }, [shared]);
  return (<div><Title t="Analyse image" d="Ajoutez une capture d'écran : je lis le texte pour vous." />
    <div className="card p-5 space-y-4"><Drop label="Choisir une image" onFile={go} /><p className="text-xs text-mute">{t("Bobby lit le vrai texte de votre image. La première lecture peut prendre quelques secondes et demande internet.")}</p></div>
    <div className="mt-5 space-y-4">{b && <Busy steps={["Bobby lit le texte de l'image…", "Je cherche les signes d'arnaque…", "Je calcule le score de confiance…"]} />}{b && pct > 0 && <p className="text-xs text-mute">{Math.round(pct * 100)} %</p>}
      {err && <p className="text-sm" role="alert" style={{ color: "#F59E0B" }}>{t(err)}</p>}
      {res && <><div className="card p-5 flex gap-4">{img && <img src={img} alt="" className="w-24 h-24 object-cover rounded-2xl shrink-0" />}<div className="min-w-0"><p className="text-xs text-mute mb-1">{t("Texte détecté")}</p><p className="text-sm italic break-words" dir="auto">« {txt.slice(0, 500)} »</p>{qr && <p className="text-sm mt-2 break-all" dir="ltr">QR : {qr}</p>}</div></div>{res.web ? <WebReport r={res.r as UrlResult} lv={res.lv} /> : <Report r={res.r} />}</>}</div></div>);
}

export function QrV() {
  const t = useT(); const scan = useScan(); const [p, setP] = useState(""); const [res, setRes] = useState<{ r: Result | UrlResult; web: boolean; lv: Live | null } | null>(null); const [b, setB] = useState(false); const [err, setErr] = useState("");
  const go = async (f: File) => {
    setRes(null); setErr(""); setP(""); setB(true);
    try {
      const code = await decodeQr(f);
      if (!code) { setErr("Je ne trouve aucun QR code lisible dans cette image. Essayez une photo plus nette, bien droite, avec le QR code entier."); setB(false); return; }
      setP(code); const x = await analyzeAny(code); scan("qr", code, x.r); setRes(x);
    } catch { setErr("Une erreur est survenue en lisant le QR code. Réessayez."); }
    setB(false);
  };
  return (<div><Title t="Analyse QR code" d="Je regarde où mène un QR code avant que vous le scanniez." />
    <div className="card p-5 space-y-4"><Drop label="Choisir l'image d'un QR code" onFile={go} /><p className="text-xs text-mute">{t("Prenez le QR code en photo (ou une capture d'écran), puis choisissez l'image ici. Je lis le vrai contenu.")}</p></div>
    <div className="mt-5 space-y-4">{b && <Busy steps={["Bobby décode le QR code…", "Je vérifie la destination…", "Je calcule le score de confiance…"]} />}
      {err && <p className="text-sm" role="alert" style={{ color: "#F59E0B" }}>{t(err)}</p>}
      {res && <><div className="rounded-2xl p-4 text-sm break-all card"><b>{t("Contenu décodé")} :</b> <span dir="ltr">{p}</span></div>{res.web ? <WebReport r={res.r as UrlResult} lv={res.lv} /> : <Report r={res.r} />}</>}</div></div>);
}

export function CallsV() {
  const t = useT(); const scan = useScan(); const notify = useS((s) => s.notify); const bump = useS((s) => s.bump); const report = useS((s) => s.report);
  const contacts = useS((x) => x.contacts); const setContacts = useS((x) => x.setContacts); const blocked = useS((x) => x.blockedNums); const setBlocked = useS((x) => x.setBlockedNums);
  const home = useCountry(); const [num, setNum] = useState(""); const [ne, setNe] = useState(""); const [kc, setKc] = useState(""); const [nr, setNr] = useState<NumResult | null>(null);
  const HEAD: Record<string, string> = { safe: "✅ Ce numéro semble correct.", careful: "⚠️ Numéro inconnu : soyez prudent avant de répondre.", suspicious: "⚠️ Ce numéro est suspect. Ne le rappelez pas.", danger: "🔴 Ce numéro est dangereux. Ne répondez pas." };
  const check = (v = num) => {
    setNum(v); setKc(""); setNr(null); setNe(""); const x = analyzeNumber(v, home, blocked); const k = x.ok ? contacts.find((c) => c.t.some((tt) => { const y = analyzeNumber(tt, home); return y.ok && y.e164 === x.e164; })) : undefined; if (k) { setKc(k.n); return; }
     if (!x.ok) { setNe(x.err); return; }
    setNr(x); scan("call", v, { score: x.score, level: x.level, reasons: x.reasons, tips: x.tips });
  };
  const mark = () => { if (!nr) return; setBlocked([nr.e164, ...blocked.filter((b) => b !== nr.e164)]); report("Numéros|" + nr.e164); bump(true); notify("Numéro marqué comme dangereux. Bobby vous le dira à chaque vérification."); setNr(analyzeNumber(nr.e164, home, [nr.e164, ...blocked]) as NumResult); };
  const pick = async () => { if (!contactsSupported()) { notify("Ce navigateur ne permet pas d'importer les contacts. Utilisez Chrome sur Android.", "warn"); return; } try { const c = await pickContacts(); if (c.length) { const m = new Map(contacts.map((x) => [x.n + x.t.join(), x])); c.forEach((x) => m.set(x.n + x.t.join(), x)); setContacts([...m.values()]); notify(c.length + " " + (c.length > 1 ? "contacts ajoutés." : "contact ajouté.")); } } catch (e: any) { if (e?.name !== "AbortError") notify("Je n'ai pas pu accéder aux contacts.", "warn"); } };
  return (<div><Title t="Protection appels" d="Je vous dis qui appelle avant que vous décrochiez." />
    <div className="card p-5 mb-4 space-y-3"><label htmlFor="num" className="font-semibold block">{t("Vérifier un numéro")}</label>
      <div className="flex gap-2 flex-col sm:flex-row"><input id="num" dir="ltr" inputMode="tel" className="inp" placeholder="+33 6 12 34 56 78" value={num} onChange={(e) => { setNum(e.target.value); setNe(""); }} onKeyDown={(e) => e.key === "Enter" && check()} /><button type="button" className="btn" onClick={() => check()}>{t("Vérifier")}</button>{num && <button type="button" className="btn2" onClick={() => { setNum(""); setNr(null); setKc(""); setNe(""); }}>{t("Effacer")}</button>}</div>
      <p className="text-xs text-mute">{t("Android ne permet pas à Bobby de lire votre journal d'appels. Copiez le numéro depuis votre journal d'appels, puis collez-le ici.")}</p>
      {ne && <p className="text-sm" role="alert" style={{ color: "#F59E0B" }}>{t(ne)}</p>}</div>
    {kc && <div className="card p-5 mb-4 flex items-center gap-3" style={{ borderColor: "#22C55E88" }}><span aria-hidden="true" className="text-2xl">✅</span><p className="font-medium">{t("Ce numéro est dans vos contacts")} : <span dir="auto">{kc}</span></p></div>}
    {nr && <div className="mb-4"><Report r={{ score: nr.score, level: nr.level, reasons: nr.reasons, tips: nr.tips }} headline={HEAD[nr.level]}>
      <div className="grid grid-cols-2 gap-2 text-center">{[["Pays", nr.country], ["Type", nr.kind]].map(([a, v]) => <div key={a} className="rounded-2xl p-3 min-w-0" style={{ background: "var(--soft)" }}><p className="text-xs text-mute">{t(a)}</p><p className="font-semibold text-sm break-words">{t(v)}</p></div>)}</div>
      <p className="text-xs text-mute">{t("Je n'ai pas de liste de numéros frauduleux : mon analyse s'appuie sur les règles officielles de numérotation. Pour un numéro précis, utilisez les sources officielles ci-dessous.")}</p>
      {nr.level !== "danger" || nr.kind !== "Marqué par vous" ? <button type="button" className="btn2" onClick={mark}>{t("Marquer ce numéro comme dangereux")}</button> : null}</Report></div>}
    <div className="card p-5 mb-4 space-y-3"><h2 className="font-semibold">{t("Mes contacts")}</h2>
      <p className="text-sm text-mute">{t("Choisissez des contacts de votre téléphone : Bobby saura que leurs numéros sont connus. Rien n'est envoyé : la liste reste sur votre téléphone.")}</p>
      <div className="flex flex-wrap gap-2"><button type="button" className="btn2" onClick={pick}><Users size={16} />{t("Importer des contacts")}</button>
        {contacts.length > 0 && <button type="button" className="btn2" onClick={() => { setContacts([]); setKc(""); notify("Contacts retirés de Bobby."); }}>{t("Retirer mes contacts")}</button>}</div>
      {contacts.length > 0 && <><p className="text-sm">{contacts.length} {t(contacts.length > 1 ? "contacts importés" : "contact importé")}</p>
        <ul className="space-y-2 max-h-72 overflow-y-auto pe-1">{contacts.map((c, i) => <li key={c.n + i} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "var(--soft)" }}><div className="w-9 h-9 rounded-full grid place-items-center font-bold text-white shrink-0" style={{ background: "linear-gradient(135deg,var(--brand),var(--brand2))" }}>{(c.n[0] || "?").toUpperCase()}</div><div className="min-w-0 flex-1"><p className="font-medium truncate" dir="auto">{c.n}</p><p className="text-xs text-mute truncate" dir="ltr">{c.t.join(" · ")}</p></div><button type="button" className="btn2 !min-h-9 !py-1" onClick={() => { check(c.t[0]); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{t("Vérifier")}</button><button type="button" className="btn2 !min-h-9 !py-1" aria-label={t("Retirer")} onClick={() => setContacts(contacts.filter((_, j) => j !== i))}>✕</button></li>)}</ul></>}</div>
    {blocked.length > 0 && <div className="card p-5 mb-4 space-y-3"><h2 className="font-semibold">{t("Numéros que j'ai marqués dangereux")}</h2><ul className="space-y-2">{blocked.map((b) => <li key={b} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "var(--soft)" }}><span className="flex-1" dir="ltr">{b}</span><button type="button" className="btn2 !min-h-9 !py-1" onClick={() => setBlocked(blocked.filter((x) => x !== b))}>{t("Retirer")}</button></li>)}</ul></div>}
    <div className="mt-2"><Where title="Sources officielles pour signaler un appel ou un SMS" /></div></div>);
}

export function ThreatsV() {
  const t = useT(); const [q, setQ] = useState(""); const [o, setO] = useState("");
  const list = THREATS.filter((x) => (x.id + x.d + t(x.id) + t(x.d)).toLowerCase().includes(q.toLowerCase()));
  return (<div><Title t="Centre des menaces" d="Apprenez à reconnaître les arnaques les plus courantes." />
    <div className="mb-4"><Where title="Sources officielles pour signaler et vous faire aider" /></div>
    <div className="relative mb-4"><Search size={16} className="absolute start-4 top-4 text-mute" /><input className="inp ps-10" aria-label={t("Rechercher une menace…")} placeholder={t("Rechercher une menace…")} value={q} onChange={(e) => setQ(e.target.value)} /></div>
    <div className="space-y-3">{list.map((x) => (<div key={x.id} className="card overflow-hidden"><button type="button" aria-expanded={o === x.id} className="w-full p-5 flex items-center justify-between gap-3 text-start" onClick={() => setO(o === x.id ? "" : x.id)}><div><p className="font-semibold">{t(x.id)}</p><p className="text-sm text-mute">{t(x.d)}</p></div><ChevronDown className={"transition shrink-0 " + (o === x.id ? "rotate-180" : "")} /></button>
      {o === x.id && <div className="px-5 pb-5 space-y-3"><Explain id={"threat:" + x.id} compact /><div><p className="text-xs text-mute mb-1">{t("Exemples")}</p>{x.ex.map((e) => <p key={e} className="text-sm">• {t(e)}</p>)}</div><p className="text-sm rounded-2xl p-3" style={{ background: "var(--soft)" }}>💡 {t(x.tip)}</p></div>}</div>))}{!list.length && <p className="text-mute">{t("Aucun résultat.")}</p>}</div></div>);
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
    <p className="text-sm rounded-2xl p-3 mb-4" style={{ background: "var(--soft)" }}>⚠️ {t("Les listes et les chiffres de cet écran sont des exemples de démonstration. Seuls vos propres signalements sont réels (et restent sur votre téléphone).")}</p>
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

function CountryPick() {
  const { settings: s, set, notify } = useS(); const t = useT(); const cur = useCountry(); const [b, setB] = useState(false);
  const loc = async () => { setB(true); try { const c = await locate(); set({ country: c }); notify("Pays trouvé : " + (COUNTRIES.find((x) => x.code === c)?.name || c)); } catch (e: any) { notify(e?.message === "denied" ? "Localisation refusée. Choisissez votre pays dans la liste." : "Je n'ai pas pu vous localiser. Choisissez votre pays dans la liste.", "warn"); } setB(false); };
  return (<div className="flex gap-2 flex-wrap justify-end"><select className="inp max-w-[170px]" aria-label={t("Mon pays")} value={cur} onChange={(e) => set({ country: e.target.value })}>{COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}<option value="XX">Autre pays</option></select><button type="button" className="btn2" disabled={b} onClick={loc}>{t(b ? "Recherche…" : "Me localiser")}</button></div>);
}
function VoicePick() {
  const { settings: s, set } = useS(); const t = useT(); const [vs, setVs] = useState<string[]>([]);
  useEffect(() => { const sy = typeof window !== "undefined" ? window.speechSynthesis : undefined; if (!sy) return; const load = () => { const code = (LANGS[s.lang]?.tts || "fr-FR").slice(0, 2); setVs(sy.getVoices().filter((v) => v.lang.toLowerCase().startsWith(code)).map((v) => v.name)); }; load(); sy.onvoiceschanged = load; return () => { sy.onvoiceschanged = null; }; }, [s.lang]);
  return (<div className="flex gap-2 flex-wrap justify-end"><select className="inp max-w-[200px]" aria-label={t("Voix de Bobby")} value={s.voiceName || ""} onChange={(e) => set({ voiceName: e.target.value })}><option value="">{t("Automatique (voix masculine)")}</option>{vs.map((n) => <option key={n} value={n}>{n}</option>)}</select><button type="button" className="btn2" onClick={() => speak("Bonjour, je suis Bobby. Je veille sur vous.", s.lang)}><Volume2 size={16} />{t("Tester")}</button></div>);
}


export function PermissionsCard({ compact = false }: { compact?: boolean }) {
  const t = useT(); const { set, notify, settings } = useS(); const [n, setN] = useState<PermState>("default"); const [g, setG] = useState<PermState>("default"); const [m, setM] = useState<PermState>("default");
  useEffect(() => { setN(notifState()); try { (navigator as any).permissions?.query({ name: "geolocation" }).then((x: any) => setG(x.state)); (navigator as any).permissions?.query({ name: "microphone" }).then((x: any) => setM(x.state)); } catch {} }, []);
  const lab = (x: PermState) => (x === "granted" ? "✅ Autorisé" : x === "denied" ? "⛔ Refusé (à changer dans les réglages du téléphone)" : x === "unsupported" ? "Non disponible ici" : "Pas encore autorisé");
  const Row2 = ({ title, desc, st, onClick }: { title: string; desc: string; st: PermState; onClick: () => void }) => (<div className="flex items-center gap-3 py-3 border-b last:border-0" style={{ borderColor: "var(--bd)" }}><div className="flex-1 min-w-0"><p className="font-medium">{t(title)}</p><p className="text-xs text-mute">{t(desc)}</p><p className="text-xs mt-1">{t(lab(st))}</p></div>{st !== "granted" && st !== "unsupported" && <button type="button" className="btn2" onClick={onClick}>{t("Autoriser")}</button>}</div>);
  return (<div className={compact ? "text-start" : "card p-5"}>
    {!compact && <h2 className="font-semibold mb-1">{t("Autorisations de Bobby")}</h2>}
    <Row2 title="Alertes (notifications)" desc="Pour vous prévenir tout de suite quand un message ou un site est dangereux." st={n} onClick={async () => { const x = await askNotif(); setN(x); if (x === "granted") { set({ notif: true }); alertDanger("Les alertes de Bobby sont activées."); } }} />
    <Row2 title="Localisation" desc="Pour connaître votre pays et afficher les bonnes sources officielles." st={g} onClick={async () => { try { const c = await locate(); set({ country: c }); setG("granted"); notify("Pays trouvé : " + (COUNTRIES.find((x) => x.code === c)?.name || c)); } catch (e: any) { setG(e?.message === "denied" ? "denied" : "default"); notify("Je n'ai pas pu vous localiser. Choisissez votre pays dans les réglages.", "warn"); } }} />
    <Row2 title="Micro" desc="Pour parler à Bobby avec votre voix." st={m} onClick={async () => setM(await askMic())} />
    {!compact && <div className="rounded-2xl p-4 mt-4 text-sm space-y-2" style={{ background: "var(--soft)" }}><p className="font-semibold">{t("Ce que Bobby ne peut pas faire (et pourquoi)")}</p><p>{t("Une application installée depuis internet n'a pas le droit de lire vos SMS, votre journal d'appels, vos photos, vos mails, ni les messages de WhatsApp, Telegram, Instagram, Messenger, TikTok, Snapchat ou des autres réseaux sociaux. Votre téléphone l'interdit, pour votre sécurité.")}</p><p>{t("Ce qui marche : touchez Partager dans n'importe quelle application (message, mail, WhatsApp, Telegram, réseaux sociaux, photos), puis choisissez Bobby One. Bobby lit alors le message ou l'image que vous lui envoyez.")}</p></div>}
  </div>);
}

export function SettingsV() {
  const { settings: s, set, clearHistory, notify } = useS(); const t = useT();
  const Row = ({ l, children }: { l: string; children: React.ReactNode }) => <div className="flex items-center justify-between gap-4 py-4 border-b" style={{ borderColor: "var(--bd)" }}><span>{t(l)}</span>{children}</div>;
  return (<div><Title t="Réglages" d="Personnalisez Bobby comme vous le souhaitez." />
    <div className="space-y-4"><div className="card px-5 md:px-6"><Row l="Langue"><select className="inp max-w-[220px]" aria-label={t("Langue")} value={s.lang} onChange={(e) => set({ lang: e.target.value })}>{Object.keys(LANGS).map((l) => <option key={l} value={l}>{l}</option>)}</select></Row>
      <Row l="Mon pays (pour les sources officielles)"><CountryPick /></Row>
      <Row l="Bobby parle sur tous les écrans"><Toggle label={t("Bobby parle sur tous les écrans")} on={s.voice !== false} f={() => { set({ voice: s.voice === false }); if (s.voice !== false) stopSpeak(); }} /></Row>
      <Row l="Vitesse de la voix"><div className="flex items-center gap-2 text-xs text-mute">{t("Lent")}<input type="range" aria-label={t("Vitesse de la voix")} min="0.6" max="1.4" step="0.05" value={s.rate ?? 0.92} onChange={(e) => set({ rate: parseFloat(e.target.value) })} />{t("Rapide")}</div></Row>
      <Row l="Tonalité de la voix"><div className="flex items-center gap-2 text-xs text-mute">{t("Grave")}<input type="range" aria-label={t("Tonalité de la voix")} min="0.5" max="1.3" step="0.05" value={s.pitch ?? 0.75} onChange={(e) => set({ pitch: parseFloat(e.target.value) })} />{t("Aiguë")}</div></Row>
      <Row l="Écouter la voix"><button type="button" className="btn2" onClick={() => speak("Bonjour, je suis Bobby. Je veille sur vous.", s.lang)}><Volume2 size={16} />{t("Tester")}</button></Row>
      <Row l="Notifications d'alerte"><Toggle label={t("Notifications d'alerte")} on={s.notif} f={() => set({ notif: !s.notif })} /></Row>
      <Row l="Confidentialité renforcée (rien n'est envoyé)"><Toggle label={t("Confidentialité renforcée (rien n'est envoyé)")} on={s.privacy} f={() => set({ privacy: !s.privacy })} /></Row>
      <Row l="Thème"><div className="flex gap-2">{(["dark", "light"] as const).map((x) => <button type="button" key={x} aria-pressed={s.theme === x} className={"btn2 " + (s.theme === x ? "on" : "")} onClick={() => set({ theme: x })}>{t(x === "dark" ? "Sombre" : "Clair")}</button>)}</div></Row>
      <Row l="Niveau de sécurité"><div className="flex gap-2 flex-wrap justify-end">{(["Standard", "Renforcé", "Maximum"] as const).map((x) => <button type="button" key={x} aria-pressed={s.security === x} className={"btn2 " + (s.security === x ? "on" : "")} onClick={() => set({ security: x })}>{t(x)}</button>)}</div></Row>
      <Row l="Historique des vérifications"><button type="button" className="btn2" onClick={() => { clearHistory(); notify("Historique effacé."); }}>{t("Effacer")}</button></Row>
      <div className="py-5 flex items-center gap-4"><Bobby s={48} /><div><p className="font-semibold">{t("À propos de Bobby One")}</p><p className="text-sm text-mute">{t("Version 1.2 · « Bobby veille sur vous. » Analyse par règles intégrées et listes de fraude en ligne. La base de numéros de téléphone et la liste communautaire sont encore des exemples.")}</p></div></div></div><PermissionsCard /></div></div>);
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
