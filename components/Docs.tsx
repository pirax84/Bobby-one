"use client";
// Démarches : vérifier un document puis le pré-remplir depuis le coffre-fort (Profil Perso / Profil Pro),
// gérer le coffre-fort, les expéditeurs bloqués et la quarantaine.
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { User, Briefcase, Upload, ShieldCheck, ShieldAlert, ShieldX, Ban, Copy, Check, Eye, EyeOff, Trash2, Lock, Inbox, ArrowRight, Info, RotateCcw } from "lucide-react";
import { useS } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { META } from "@/lib/engine";
import { SECTIONS, completeness, mask, prefill, type ProfileKind } from "@/lib/vault";
import { normalizeSender } from "@/lib/senders";
import { checkDocument, isFreeMail, type DocCheck } from "@/lib/doccheck";
import { readDocument } from "@/lib/docread";
import { Title, Busy } from "./ui";

// Couleurs des profils, prises dans la palette de Bobby : bleu ciel = Perso, violet = Pro.
const PC: Record<ProfileKind, string> = { PERSONAL: "var(--brand2)", PROFESSIONAL: "var(--brand)" };
const PN: Record<ProfileKind, string> = { PERSONAL: "Profil Perso", PROFESSIONAL: "Profil Pro" };

async function copyText(x: string, notify: (s: string, t?: any) => void) {
  try { await navigator.clipboard.writeText(x); notify("Copié !"); } catch { notify("Impossible de copier ici.", "warn"); }
}

export function ProfileSwitch() {
  const t = useT(); const { profile, setProfile } = useS();
  return (<div role="radiogroup" aria-label={t("Profil utilisé")} className="grid grid-cols-2 gap-1 p-1 rounded-2xl border" style={{ borderColor: "var(--bd)", background: "var(--card)" }}>
    {(["PERSONAL", "PROFESSIONAL"] as ProfileKind[]).map((p) => { const on = profile === p; const I = p === "PERSONAL" ? User : Briefcase;
      return <button type="button" key={p} role="radio" aria-checked={on} onClick={() => setProfile(p)} className="min-h-12 rounded-xl flex items-center justify-center gap-2 font-semibold transition" style={on ? { background: PC[p], color: "#fff" } : { color: "var(--mute)" }}><I size={18} />{t(PN[p])}</button>; })}
  </div>);
}

const ProfileTag = ({ p }: { p: ProfileKind }) => { const t = useT(); return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: `color-mix(in srgb, ${PC[p]} 18%, transparent)`, color: PC[p] }}>{p === "PERSONAL" ? <User size={12} /> : <Briefcase size={12} />}{t(PN[p])}</span>; };

/* ------------------------------------------------------------------ */
/* Remplir un document                                                  */
/* ------------------------------------------------------------------ */
const VERDICT: Record<DocCheck["verdict"], { icon: any; color: string; title: string; sub: string }> = {
  blocked: { icon: Ban, color: META.danger.color, title: "Document refusé : expéditeur bloqué", sub: "Je l'ai mis en quarantaine. Aucune de vos informations n'a été utilisée." },
  danger: { icon: ShieldX, color: META.danger.color, title: "Attention : ce document ressemble à une arnaque", sub: "Je bloque le pré-remplissage pour protéger vos informations." },
  suspicious: { icon: ShieldAlert, color: META.suspicious.color, title: "Ce document me paraît suspect", sub: "Je bloque le pré-remplissage tant que vous n'avez pas vérifié." },
  careful: { icon: ShieldAlert, color: META.careful.color, title: "Quelques points à vérifier", sub: "Lisez-les avant de continuer." },
  safe: { icon: ShieldCheck, color: META.safe.color, title: "Ce document semble fiable", sub: "Vous pouvez le remplir avec votre coffre-fort." },
};

export function DocsV() {
  const t = useT(); const { profile, setProfile, vault, blockedSenders, addSender, removeSender, toQuarantine, notify, go } = useS();
  const [text, setText] = useState(""); const [sender, setSender] = useState(""); const [name, setName] = useState("");
  const [busy, setBusy] = useState(false); const [pct, setPct] = useState(0); const [err, setErr] = useState("");
  const [res, setRes] = useState<DocCheck | null>(null); const [trust, setTrust] = useState(false); const [sure, setSure] = useState(false); const [profOk, setProfOk] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => { setRes(null); setTrust(false); setSure(false); setProfOk(false); setErr(""); };
  const analyze = (tx = text, sd = sender, nm = name || t("Texte collé")) => {
    if (tx.trim().length < 3) { setErr("Importez un document ou collez son texte d'abord."); return; }
    reset(); const r = checkDocument(tx, sd, useS.getState().blockedSenders, useS.getState().profile); setRes(r);
    if (r.verdict === "blocked") toQuarantine({ name: nm, sender: r.sender, reasons: r.issues.map((i) => i.text), excerpt: tx.slice(0, 1500) });
  };
  const onFile = async (f?: File | null) => {
    if (!f) return; reset(); setBusy(true); setPct(0); setName(f.name);
    try { const d = await readDocument(f, setPct); setText(d.text); const sd = d.sender || sender; setSender(sd); analyze(d.text, sd, f.name); }
    catch { setErr("Je n'ai pas pu lire ce document. Vérifiez votre connexion internet (la première lecture en a besoin) et réessayez."); }
    setBusy(false); if (fileRef.current) fileRef.current.value = "";
  };
  const locked = !!res && (res.verdict === "blocked" || (["danger", "suspicious"].includes(res.verdict) && !trust));
  const mismatch = !!res && !!res.suggested && res.suggested !== profile && !profOk;
  const fields = res && !locked && !mismatch ? prefill(text, profile, vault) : [];
  const V = res ? VERDICT[res.verdict] : null;

  return (<div className="space-y-5"><Title t="Remplir un document" d="Bobby vérifie d'abord le document et son expéditeur, puis vous aide à le remplir avec votre coffre-fort." />
    <ProfileSwitch />
    <section className="card p-5 space-y-4">
      <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="w-full grid place-items-center gap-2 border-2 border-dashed rounded-3xl p-7 text-center transition hover:border-[var(--brand)]" style={{ borderColor: "var(--bd)" }}>
        <span className="ico"><Upload size={22} /></span><span className="font-semibold">{t("Importer un document")}</span><span className="text-sm text-mute">{t("PDF, photo, capture d'écran ou e-mail enregistré (.eml)")}</span></button>
      <input ref={fileRef} type="file" accept="application/pdf,.pdf,image/*,.eml,.txt,.html,.htm,message/rfc822,text/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <div><label htmlFor="snd" className="text-sm font-medium">{t("Qui vous a envoyé ce document ? (adresse e-mail, facultatif)")}</label>
        <input id="snd" className="inp mt-1.5" dir="ltr" inputMode="email" placeholder="exemple@impots.gouv.fr" value={sender} onChange={(e) => { setSender(e.target.value); setRes(null); }} /></div>
      <details><summary className="cursor-pointer text-sm text-mute">{t("Ou collez le texte du document ou de l'e-mail")}</summary>
        <textarea className="inp min-h-28 mt-2 resize-y" aria-label={t("Texte du document")} value={text} onChange={(e) => { setText(e.target.value); setName(""); setRes(null); }} /></details>
      {err && <p className="text-sm" role="alert" style={{ color: META.careful.color }}>{t(err)}</p>}
      <button type="button" className="btn w-full sm:w-auto" disabled={busy || text.trim().length < 3} onClick={() => analyze()}><ShieldCheck size={18} />{t("Vérifier le document")}</button>
    </section>
    {busy && <><Busy steps={["Bobby lit le document…", "Je vérifie l'expéditeur…", "Je cherche les incohérences…"]} />{pct > 0 && <p className="text-xs text-mute">{Math.round(pct * 100)} %</p>}</>}

    {res && V && <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} role="alert" className="card p-5 md:p-6 space-y-4" style={{ borderColor: V.color, borderWidth: 2 }}>
      <div className="flex items-start gap-4"><span className="w-14 h-14 rounded-2xl grid place-items-center shrink-0" style={{ background: `color-mix(in srgb, ${V.color} 20%, transparent)`, color: V.color }}><V.icon size={30} /></span>
        <div className="min-w-0"><h2 className="text-lg md:text-xl font-bold leading-snug" style={{ color: V.color }}>{t(V.title)}</h2><p className="text-sm text-mute mt-1">{t(V.sub)}</p>
          {res.sender && <p className="text-sm mt-2 break-all"><span className="text-mute">{t("Expéditeur")} : </span><span dir="ltr">{res.sender}</span></p>}</div></div>
      {res.issues.length > 0 && <ul className="space-y-2">{res.issues.map((i, k) => <li key={k} className="flex gap-2 text-sm"><span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ background: i.level === "danger" ? META.danger.color : i.level === "careful" ? META.suspicious.color : "var(--mute)" }} /><span>{t(i.text)}</span></li>)}</ul>}

      {res.verdict === "blocked" ? <div className="flex flex-wrap gap-2"><button type="button" className="btn2" onClick={() => go("senders")}><Inbox size={16} />{t("Voir la quarantaine")}</button>
        {res.blockedBy && <button type="button" className="btn2" onClick={() => { removeSender(res.blockedBy!.v); notify("Expéditeur débloqué."); analyze(); }}><RotateCcw size={16} />{t("Débloquer cet expéditeur")}</button>}</div>
      : res.verdict !== "safe" && <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn2" onClick={() => { toQuarantine({ name: name || t("Texte collé"), sender: res.sender, reasons: res.issues.map((i) => i.text), excerpt: text.slice(0, 1500) }); notify("Document mis en quarantaine."); setText(""); setRes(null); }}><Inbox size={16} />{t("Mettre en quarantaine")}</button>
          {res.sender && <button type="button" className="btn2" onClick={() => { const r = normalizeSender(res.sender); if (r) { addSender(r); notify("Expéditeur bloqué."); analyze(); } }}><Ban size={16} />{t("Bloquer cet expéditeur")}</button>}
          {res.sender.includes("@") && !isFreeMail(res.sender.split("@")[1]) && <button type="button" className="btn2" onClick={() => { const r = normalizeSender(res.sender.split("@")[1]); if (r) { addSender(r); notify("Domaine entier bloqué."); analyze(); } }}><Ban size={16} />{t("Bloquer tout le domaine")} <span dir="ltr">@{res.sender.split("@")[1]}</span></button>}
        </div>
        {locked && <div className="rounded-2xl p-4 space-y-3" style={{ background: "var(--soft)" }}>
          {res.verdict === "danger" && <label className="flex items-start gap-3 text-sm cursor-pointer"><input type="checkbox" className="mt-1 w-5 h-5 accent-[var(--brand)]" checked={sure} onChange={(e) => setSure(e.target.checked)} /><span>{t("J'ai vérifié par un autre moyen (site officiel, appel à l'organisme) que ce document est authentique.")}</span></label>}
          <button type="button" className="btn2" disabled={res.verdict === "danger" && !sure} onClick={() => setTrust(true)}>{t("Je fais confiance à ce document, continuer")}</button></div>}
      </div>}
    </motion.section>}

    {res && !locked && mismatch && <section className="card p-5 space-y-3" style={{ borderColor: PC[res.suggested!] }}>
      <p className="font-semibold flex items-center gap-2"><Info size={18} style={{ color: PC[res.suggested!] }} />{t("Quel profil voulez-vous utiliser ?")}</p>
      <p className="text-sm text-mute">{t("Les informations Perso et Pro ne sont jamais mélangées. Choisissez le profil qui correspond à ce document.")}</p>
      <div className="flex flex-wrap gap-2"><button type="button" className="btn" onClick={() => { setProfile(res.suggested!); setProfOk(true); }}>{t("Utiliser le " + PN[res.suggested!])}</button><button type="button" className="btn2" onClick={() => setProfOk(true)}>{t("Garder le " + PN[profile])}</button></div></section>}

    {res && !locked && !mismatch && <section className="card p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap"><h2 className="font-semibold">{t("Informations à recopier")}</h2><ProfileTag p={profile} /></div>
      {fields.length === 0 ? <p className="text-sm text-mute">{t("Je n'ai pas reconnu de case à remplir dans ce document. Vous pouvez copier vos informations depuis le coffre-fort.")}</p>
        : <ul>{fields.map((f) => <li key={f.label} className="py-3 flex items-center gap-3 border-t first:border-t-0" style={{ borderColor: "var(--bd)" }}>
          <div className="min-w-0 flex-1"><p className="text-xs text-mute">{t(f.label)}{f.source.toLowerCase() !== f.label.toLowerCase() && <span className="opacity-70"> · « {f.source} »</span>}</p>
            {f.value ? <p className="font-medium break-words">{f.value}</p> : <p className="text-sm italic" style={{ color: META.danger.color }}>{t("Manquant dans votre coffre-fort")}</p>}</div>
          {f.value ? <button type="button" className="btn2" aria-label={t("Copier") + " " + t(f.label)} onClick={() => copyText(f.value, notify)}><Copy size={16} />{t("Copier")}</button>
            : <button type="button" className="btn2" onClick={() => go("vault")}>{t("Compléter")}<ArrowRight size={14} /></button>}</li>)}</ul>}
      {fields.some((f) => f.value) && <button type="button" className="btn2" onClick={() => copyText(fields.filter((f) => f.value).map((f) => t(f.label) + " : " + f.value).join("\n"), notify)}><Copy size={16} />{t("Tout copier")}</button>}
    </section>}
  </div>);
}

/* ------------------------------------------------------------------ */
/* Coffre-fort                                                          */
/* ------------------------------------------------------------------ */
function VaultField({ p, k, label, sensitive, placeholder }: { p: ProfileKind; k: string; label: string; sensitive?: boolean; placeholder?: string }) {
  const t = useT(); const v = useS((s) => s.vault[p][k] || ""); const { setField, notify } = useS(); const [show, setShow] = useState(false); const [ok, setOk] = useState(false);
  const id = `${p}-${k}`;
  return (<div className="py-3 space-y-1.5 border-t first:border-t-0" style={{ borderColor: "var(--bd)" }}><label htmlFor={id} className="text-sm text-mute">{t(label)}</label>
    <div className="flex gap-2"><input id={id} className="inp" type={sensitive && !show ? "password" : "text"} autoComplete="off" placeholder={placeholder ? t(placeholder) : ""} value={v} onChange={(e) => setField(p, k, e.target.value)} />
      {sensitive && <button type="button" className="btn2 shrink-0" aria-label={t(show ? "Masquer" : "Afficher")} onClick={() => setShow(!show)}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
      <button type="button" className="btn2 shrink-0" disabled={!v} aria-label={t("Copier") + " " + t(label)} onClick={async () => { await copyText(v, notify); setOk(true); setTimeout(() => setOk(false), 1400); }}>{ok ? <Check size={16} /> : <Copy size={16} />}</button></div>
    {sensitive && v && !show && <p className="text-xs text-mute" dir="ltr">{mask(v)}</p>}</div>);
}
export function VaultV() {
  const t = useT(); const { profile, vault } = useS(); const pct = completeness(vault, profile);
  return (<div className="space-y-5"><Title t="Coffre-fort" d="Vos informations pour remplir les documents. Le Profil Perso et le Profil Pro restent séparés." />
    <ProfileSwitch />
    <section className="card p-5 space-y-2"><div className="flex justify-between items-center"><p className="font-semibold">{t("Profil complet à")} {pct} %</p><ProfileTag p={profile} /></div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--bd)" }}><div className="h-full rounded-full transition-all" style={{ width: pct + "%", background: PC[profile] }} /></div>
      <p className="text-xs text-mute flex items-center gap-1.5"><Lock size={12} />{t("Vos informations restent uniquement sur cet appareil.")}</p></section>
    {SECTIONS[profile].map((s) => <section key={profile + s.title} className="card p-5"><h2 className="font-semibold mb-1" style={{ color: PC[profile] }}>{t(s.title)}</h2>
      <div>{s.fields.map((f) => <VaultField key={f.key} p={profile} k={f.key} label={f.label} sensitive={f.sensitive} placeholder={f.placeholder} />)}</div></section>)}
  </div>);
}

/* ------------------------------------------------------------------ */
/* Expéditeurs bloqués et quarantaine                                   */
/* ------------------------------------------------------------------ */
export function SendersV() {
  const t = useT(); const { blockedSenders, addSender, removeSender, quarantine, dropQuarantine, notify } = useS(); const [v, setV] = useState(""); const [err, setErr] = useState("");
  const add = () => { const r = normalizeSender(v); if (!r) { setErr("Je ne reconnais ni une adresse e-mail, ni un nom de domaine. Exemples : arnaque@exemple.com ou exemple.com"); return; } addSender(r); setV(""); setErr(""); notify(r.kind === "email" ? "Adresse bloquée." : "Domaine entier bloqué."); };
  return (<div className="space-y-5"><Title t="Expéditeurs bloqués" d="Les documents, messages et liens venant de ces adresses sont refusés et mis en quarantaine." />
    <section className="card p-5 space-y-3"><label htmlFor="blk" className="font-semibold block">{t("Bloquer une adresse e-mail ou un domaine")}</label>
      <div className="flex gap-2 flex-col sm:flex-row"><input id="blk" className="inp" dir="ltr" inputMode="email" placeholder="arnaque@exemple.com · exemple.com" value={v} onChange={(e) => { setV(e.target.value); setErr(""); }} onKeyDown={(e) => e.key === "Enter" && add()} /><button type="button" className="btn shrink-0" disabled={!v.trim()} onClick={add}><Ban size={18} />{t("Bloquer")}</button></div>
      {err && <p className="text-sm" role="alert" style={{ color: META.careful.color }}>{t(err)}</p>}
      <p className="text-xs text-mute">{t("Une adresse bloque seulement cette adresse. Un domaine (ex. exemple.com) bloque toutes les adresses et tous les liens de ce domaine.")}</p></section>
    <section className="card p-5"><h2 className="font-semibold mb-3">{t("Ma liste de blocage")} ({blockedSenders.length})</h2>
      {blockedSenders.length === 0 ? <p className="text-sm text-mute">{t("Aucun expéditeur bloqué pour le moment.")}</p>
        : <ul>{blockedSenders.map((b) => <li key={b.v} className="py-3 flex items-center gap-3 border-t first:border-t-0" style={{ borderColor: "var(--bd)" }}><Ban size={18} style={{ color: META.danger.color }} className="shrink-0" />
          <div className="min-w-0 flex-1"><p className="font-medium break-all" dir="ltr">{b.kind === "domain" ? "@" + b.v : b.v}</p><p className="text-xs text-mute">{t(b.kind === "email" ? "Adresse e-mail" : "Domaine entier")} · {new Date(b.at).toLocaleDateString()}</p></div>
          <button type="button" className="btn2" onClick={() => { removeSender(b.v); notify("Expéditeur débloqué."); }}>{t("Débloquer")}</button></li>)}</ul>}</section>
    <section className="card p-5"><h2 className="font-semibold mb-3 flex items-center gap-2"><Inbox size={18} />{t("Quarantaine")} ({quarantine.length})</h2>
      {quarantine.length === 0 ? <p className="text-sm text-mute">{t("Aucun document en quarantaine.")}</p>
        : <ul className="space-y-3">{quarantine.map((q) => <li key={q.id} className="rounded-2xl p-4 space-y-2" style={{ background: "var(--soft)" }}>
          <div className="flex items-start gap-3"><div className="min-w-0 flex-1"><p className="font-medium break-words">{q.name}</p><p className="text-xs text-mute break-all">{q.sender && <span dir="ltr">{q.sender} · </span>}{new Date(q.at).toLocaleString()}</p></div>
            <button type="button" className="btn2" aria-label={t("Supprimer définitivement")} onClick={() => { dropQuarantine(q.id); notify("Document supprimé."); }}><Trash2 size={16} /></button></div>
          {q.reasons[0] && <p className="text-sm">{t(q.reasons[0])}</p>}
          <details><summary className="text-xs text-mute cursor-pointer">{t("Voir un extrait")}</summary><p className="text-xs whitespace-pre-wrap mt-2 max-h-40 overflow-y-auto" dir="auto">{q.excerpt}</p></details></li>)}</ul>}</section>
  </div>);
}
