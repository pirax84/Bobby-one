"use client";
import { useEffect, useMemo, useState } from "react";
import { useS } from "@/lib/store";
import { useT, LANGS } from "@/lib/i18n";
import { META, analyzeText, Level } from "@/lib/engine";
import { analyzeNumber } from "@/lib/numbers";
import { useCountry } from "./Where";
import { isApp, has, ensure, getCallLog, getSms, getContacts, getNotifs, getScreened, clearNotifs, CallEntry, SmsEntry, NotifEntry, ScreenEntry } from "@/lib/native";

const fmt = (d: number, lang: string) => { try { return new Intl.DateTimeFormat(LANGS[lang]?.code || "fr", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(d)); } catch { return ""; } };
const sameN = (a: string, b: string) => { const x = a.replace(/\D/g, ""), y = b.replace(/\D/g, ""); return x.length >= 7 && y.length >= 7 && x.slice(-9) === y.slice(-9); };
const Pill = ({ level, text }: { level: Level; text?: string }) => { const t = useT(); const m = META[level]; return <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: m.color + "26", color: m.color }}>{t(text || m.label)}</span>; };
const Tabs = ({ items, v, on }: { items: [string, string, number?][]; v: string; on: (k: string) => void }) => { const t = useT(); return <div role="tablist" className="flex gap-1.5 overflow-x-auto pb-1">{items.map(([k, l, n]) => <button type="button" role="tab" aria-selected={v === k} key={k} onClick={() => on(k)} className="btn2 !min-h-9 !py-1 whitespace-nowrap" style={v === k ? { background: "color-mix(in srgb, var(--brand) 25%, transparent)", borderColor: "var(--brand)" } : undefined}>{t(l)}{n != null ? " (" + n + ")" : ""}</button>)}</div>; };
const big = { background: "color-mix(in srgb, var(--brand) 22%, transparent)", borderColor: "var(--brand)" } as const;

// ───────── Appels : protection automatique + journal par catégories
export function NativeCalls({ onCheck }: { onCheck: (n: string) => void }) {
  const t = useT(); const lang = useS((x) => x.settings.lang); const contacts = useS((x) => x.contacts); const blocked = useS((x) => x.blockedNums); const home = useCountry();
  const [list, setList] = useState<CallEntry[] | null>(null); const [busy, setBusy] = useState(false); const [tab, setTab] = useState("all");
  const [scr, setScr] = useState<ScreenEntry[]>([]); const [prot, setProt] = useState(false); const [names, setNames] = useState<{ n: string; t: string[] }[]>([]);
  const load = async (ask: boolean) => {
    if (!has("calls")) { if (!ask) return; setBusy(true); const ok = await ensure("calls"); setBusy(false); if (!ok) return; }
    setBusy(true); setList(await getCallLog(200)); setBusy(false);
  };
  useEffect(() => { setProt(has("screening")); setScr(getScreened()); load(false); const i = setInterval(() => { setProt(has("screening")); setScr(getScreened()); }, 4000); return () => clearInterval(i); }, []);
  useEffect(() => { if (has("contacts")) getContacts().then(setNames); }, [list]);
  const nameOf = (c: CallEntry) => c.name || names.find((k) => k.t.some((x) => sameN(x, c.number)))?.n || contacts.find((k) => k.t.some((x) => sameN(x, c.number)))?.n || "";
  const rows = useMemo(() => (list || []).map((c) => { const nm = nameOf(c); const r = analyzeNumber(c.number, home, blocked); const lvl: Level = nm ? "safe" : r.ok ? r.level : "careful"; return { c, nm, lvl }; }), [list, names, contacts, blocked, home]);
  const bad = rows.filter((r) => !r.nm && (r.lvl === "danger" || r.lvl === "suspicious")); const missed = rows.filter((r) => r.c.type === "missed" || r.c.type === "rejected"); const unk = rows.filter((r) => !r.nm);
  const shown = tab === "bad" ? bad : tab === "missed" ? missed : tab === "unk" ? unk : rows;
  const ICON: Record<string, string> = { in: "↙️", out: "↗️", missed: "❌", rejected: "🚫" };
  return (<>
    <div className="card p-5 mb-4 space-y-3"><h2 className="font-semibold">{t("Protection automatique des appels")}</h2>
      <p className="text-sm text-mute">{t("Quand un numéro marqué dangereux vous appelle, Bobby refuse l'appel tout seul, sans faire sonner le téléphone.")}</p>
      {prot ? <p className="text-sm font-medium" style={{ color: "#22C55E" }}>✅ {t("Protection active")} · {blocked.length} {t("numéro(s) bloqué(s)")}</p> : <button type="button" className="btn2 font-semibold self-start" style={big} onClick={async () => { await ensure("screening"); setProt(has("screening")); }}>{t("Activer la protection automatique")}</button>}
      {scr.length > 0 && <div><p className="text-sm font-semibold mb-1">{t("Appels que Bobby a arrêtés")}</p><ul className="space-y-1.5">{scr.slice(0, 20).map((s, i) => <li key={s.number + s.date + i} className="flex items-center gap-2 p-2.5 rounded-2xl text-sm" style={{ background: "var(--soft)" }}><span aria-hidden="true">🛡️</span><span className="flex-1 min-w-0 truncate" dir="ltr">{s.number}</span><span className="text-xs text-mute">{fmt(s.date, lang)}</span></li>)}</ul></div>}
    </div>
    <div className="card p-5 mb-4 space-y-3"><h2 className="font-semibold">{t("Mon journal d'appels")}</h2>
      {!list && <button type="button" className="btn2 font-semibold self-start" style={big} disabled={busy} onClick={() => load(true)}>{t(busy ? "Lecture…" : "Autoriser et importer mon journal d'appels")}</button>}
      {list && <><Tabs v={tab} on={setTab} items={[["all", "Tous", rows.length], ["bad", "Suspects", bad.length], ["unk", "Inconnus", unk.length], ["missed", "Manqués", missed.length]]} />
        {!shown.length && <p className="text-sm text-mute">{t("Aucun appel dans cette liste.")}</p>}
        <ul className="space-y-2 max-h-[28rem] overflow-y-auto pe-1">{shown.map((r, i) => <li key={r.c.number + r.c.date + i}><button type="button" className="w-full text-start flex items-center gap-3 p-3 rounded-2xl" style={{ background: "var(--soft)" }} onClick={() => { onCheck(r.c.number); window.scrollTo({ top: 0, behavior: "smooth" }); }}><span aria-hidden="true">{ICON[r.c.type] || "📞"}</span><span className="min-w-0 flex-1"><span className="block font-medium truncate" dir="auto">{r.nm || r.c.number}</span><span className="block text-xs text-mute" dir="ltr">{r.nm ? r.c.number + " · " : ""}{fmt(r.c.date, lang)}</span></span><Pill level={r.lvl} text={r.nm ? "Contact" : r.lvl === "careful" ? "Inconnu" : undefined} /></button></li>)}</ul>
        <button type="button" className="btn2 !min-h-9 !py-1" disabled={busy} onClick={() => load(true)}>{t(busy ? "Lecture…" : "Actualiser")}</button></>}
    </div></>);
}

// ───────── Messages : SMS, e-mails, WhatsApp, Telegram…
export function NativeInbox({ onPick }: { onPick: (body: string) => void }) {
  const t = useT(); const lang = useS((x) => x.settings.lang);
  const [sms, setSms] = useState<SmsEntry[] | null>(null); const [nt, setNt] = useState<NotifEntry[]>([]); const [acc, setAcc] = useState(false); const [tab, setTab] = useState("sms"); const [only, setOnly] = useState(false); const [busy, setBusy] = useState(false);
  const loadSms = async (ask: boolean) => { if (!has("sms")) { if (!ask) return; setBusy(true); const ok = await ensure("sms"); setBusy(false); if (!ok) return; } setBusy(true); setSms(await getSms(200)); setBusy(false); };
  useEffect(() => { loadSms(false); const f = () => { setNt(getNotifs()); setAcc(has("notifaccess")); }; f(); const i = setInterval(f, 3000); return () => clearInterval(i); }, []);
  const lvl = (b: string): Level => analyzeText(b).level;
  const rows = useMemo(() => {
    const base: { k: string; who: string; body: string; date: number; lvl: Level }[] =
      tab === "sms" ? (sms || []).map((m) => ({ k: m.address, who: m.address, body: m.body, date: m.date, lvl: lvl(m.body) }))
        : nt.filter((n) => n.cat === tab).map((n) => ({ k: n.app + n.title, who: n.title || n.app, body: n.text, date: n.date, lvl: lvl(n.title + " " + n.text) }));
    return base;
  }, [tab, sms, nt]);
  const cnt = (c: string) => nt.filter((n) => n.cat === c).length; const sus = (l: Level) => l === "danger" || l === "suspicious";
  const shown = only ? rows.filter((r) => sus(r.lvl)) : rows;
  const TABS: [string, string, number?][] = [["sms", "SMS", sms ? sms.length : undefined], ["email", "E-mails", cnt("email")], ["whatsapp", "WhatsApp", cnt("whatsapp")], ["telegram", "Telegram", cnt("telegram")], ["other", "Autres", cnt("other")]];
  const live = tab !== "sms";
  return (<div className="card p-5 mb-4 space-y-3"><h2 className="font-semibold">{t("Mes messages")}</h2>
    <Tabs items={TABS} v={tab} on={setTab} />
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={only} onChange={(e) => setOnly(e.target.checked)} />{t("Suspects seulement")}</label>
    {tab === "sms" && !sms && <button type="button" className="btn2 font-semibold self-start" style={big} disabled={busy} onClick={() => loadSms(true)}>{t(busy ? "Lecture…" : "Autoriser et importer mes SMS")}</button>}
    {live && !acc && <div className="rounded-2xl p-3 text-sm space-y-2" style={{ background: "var(--soft)" }}><p>{t("Pour voir vos e-mails, WhatsApp et Telegram, Bobby lit les notifications du téléphone. Il ne peut pas ouvrir votre boîte mail : il voit seulement ce qui arrive après l'activation.")}</p><button type="button" className="btn2 font-semibold" style={big} onClick={async () => { await ensure("notifaccess"); setAcc(has("notifaccess")); }}>{t("Activer la lecture des notifications")}</button></div>}
    {live && acc && <p className="text-xs text-mute">{t("Bobby voit les messages reçus depuis l'activation. Les anciens messages ne sont pas visibles.")}</p>}
    {(live ? acc : !!sms) && !shown.length && <p className="text-sm text-mute">{t(live ? "Rien pour l'instant. Les nouveaux messages apparaîtront ici." : "Aucun message dans cette liste.")}</p>}
    {shown.length > 0 && <ul className="space-y-2 max-h-[30rem] overflow-y-auto pe-1">{shown.map((m, i) => <li key={m.k + m.date + i}><button type="button" className="w-full text-start flex items-start gap-3 p-3 rounded-2xl" style={{ background: "var(--soft)" }} onClick={() => { onPick(m.who + " : " + m.body); window.scrollTo({ top: 0, behavior: "smooth" }); }}><span className="min-w-0 flex-1"><span className="block font-medium truncate" dir="auto">{m.who}</span><span className="block text-sm text-mute line-clamp-2 break-words" dir="auto">{m.body}</span><span className="block text-xs text-mute">{fmt(m.date, lang)}</span></span><Pill level={m.lvl} /></button></li>)}</ul>}
    {live && nt.some((n) => n.cat === tab) && <button type="button" className="btn2 !min-h-9 !py-1" onClick={() => { clearNotifs(); setNt(getNotifs()); }}>{t("Vider cette liste")}</button>}
  </div>);
}
export { isApp };
