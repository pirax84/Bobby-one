import { useEffect, useRef, useState } from "react";
import { useStore, actions, Msg } from "../lib/store";
import { MicIcon, Ico, ago, useNow, ConfirmDel } from "./common";
import { HoldMic } from "./Recorder";
import { AudioWave } from "./AudioWave";
import { t } from "../i18n";

interface Item { key: string; label: string; userId?: string; conv?: string; last?: Msg }
const first = (n: string) => n.trim().split(/\s+/)[0] || n;

/** Page « Vocal » : une ligne par proche (le micro devant le prénom), puis une page rien que pour les vocaux. */
export function VoiceHome() {
  const s = useStore((x) => x); const me = s.me; const now = useNow(30000);
  const [sel, setSelRaw] = useState<string | null>(() => (history.state?.voice as string) || null);
  const setSel = (k: string | null) => { if (k) history.pushState({ ...(history.state || {}), voice: k }, ""); setSelRaw(k); };
  useEffect(() => { const f = (e: PopStateEvent) => { if (!(e.state && e.state.voice)) setSelRaw(null); }; window.addEventListener("popstate", f); return () => window.removeEventListener("popstate", f); }, []);
  const back = () => { if (history.state?.voice) history.back(); else setSelRaw(null); };
  const lastAudio = (c?: { msgs: Msg[] }) => c?.msgs.filter((m) => m.audio && m.from !== me).at(-1);
  const people = (s.social.friends[me] || []).map((id) => s.users.find((u) => u.id === id)).filter((u): u is NonNullable<typeof u> => !!u);
  const cnt: Record<string, number> = {}; people.forEach((u) => { const k = first(u.name).toLowerCase(); cnt[k] = (cnt[k] || 0) + 1; });
  const lab1 = people.map((u) => (cnt[first(u.name).toLowerCase()] > 1 ? u.name : first(u.name)));
  const cnt2: Record<string, number> = {}; lab1.forEach((l) => { cnt2[l.toLowerCase()] = (cnt2[l.toLowerCase()] || 0) + 1; });
  const items: Item[] = people.map((u, i) => { const c = s.convs.find((x) => !x.groupId && x.memberIds.length === 2 && x.memberIds.includes(me) && x.memberIds.includes(u.id)); return { key: "u:" + u.id, label: cnt2[lab1[i].toLowerCase()] > 1 ? lab1[i] + " (@" + u.handle + ")" : lab1[i], userId: u.id, conv: c?.id, last: lastAudio(c) }; });
  s.convs.filter((c) => c.groupId && c.memberIds.includes(me)).forEach((c) => items.push({ key: "g:" + c.id, label: c.title || s.social.groups.find((g) => g.id === c.groupId)?.name || t("Groupe"), conv: c.id, last: lastAudio(c) }));
  items.sort((a, b) => (b.last?.at || 0) - (a.last?.at || 0) || a.label.localeCompare(b.label));
  const item = items.find((i) => i.key === sel);
  if (item) return <VoiceChat item={item} back={back} />;
  return (<div className="col" style={{ gap: 8 }}><h1>{t("Vocal")}</h1><p className="muted small" style={{ margin: 0 }}>{t("Choisis avec qui parler, rien que avec ta voix.")}</p>
    {items.map((i) => <button key={i.key} type="button" className="card row voiceitem" onClick={() => setSel(i.key)}><MicIcon size={28} /><span className="grow"><b>{i.label}</b>{i.last && <span className="muted small" style={{ display: "block" }}>{t("Vocal reçu {ago}", { ago: ago(i.last.at, now) })}</span>}</span></button>)}
    {!items.length && <p className="muted center">{t("Aucun proche pour l'instant : ajoutez des amis pour leur envoyer un vocal.")}</p>}</div>);
}

function VoiceChat({ item, back }: { item: Item; back: () => void }) {
  const s = useStore((x) => x); const me = s.me; const now = useNow(1000);
  const [cid, setCid] = useState<string | undefined>(item.conv); const [dur, setDur] = useState<"p" | "o">("p"); const [del, setDel] = useState<string | null>(null); const c = s.convs.find((x) => x.id === cid); const end = useRef<HTMLDivElement>(null);
  useEffect(() => { if (c) actions.markRead(c.id); }, [c?.msgs.length]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [c?.msgs.length]);
  const msgs = (c?.msgs || []).filter((m) => m.audio);
  const send = (u: string) => { const id = cid || (item.userId ? actions.startDm(item.userId) : undefined); if (!id) return; actions.send(id, "", 0, null, undefined, u, dur === "o"); setCid(id); };
  return (<div className="col chatfull">
    <div className="row"><button type="button" className="topb" onClick={back} aria-label={t("Retour")}><Ico n="back" s={20} /></button><b className="grow ell" style={{ fontSize: "1.2rem" }}>{item.label}</b></div>
    <div className="card msgs" role="log" aria-live="polite">{msgs.map((m) => { const mine = m.from === me; const hidden = !mine && (m.once || m.secs > 0);
      return <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start" }}>
        {hidden ? <div className="bubble muted">{t("🔒 Vocal éphémère · à ouvrir dans la conversation écrite")}</div> : <div className={"bubble" + (mine ? " me" : "")}><AudioWave src={m.audio!} mine={mine} /></div>}
        <div className="muted small row" style={{ gap: 8 }}>{ago(m.at, now)}{mine && m.once ? " · 🔥" : mine && m.secs > 0 ? " · ⏱ " + (m.secs >= 60 ? m.secs / 60 + " min" : m.secs + " s") : ""}{mine && <button type="button" className="btn ghost sm" onClick={() => setDel(m.id)} aria-label={t("Supprimer ce vocal")}><Ico n="trash" s={16} /></button>}</div></div>; })}
      {!msgs.length && <p className="muted center">{t("Aucun vocal pour l'instant : dis bonjour avec ta voix !")}</p>}<div ref={end} /></div>
    {del && cid && <ConfirmDel what={t("ce vocal")} onYes={() => actions.deleteMsg(cid, del)} onClose={() => setDel(null)} />}
    <div className="row voicedur" style={{ gap: 5, justifyContent: "center" }} role="radiogroup" aria-label={t("Durée du vocal")}>{([["p", t("🔓 Normal")], ["o", t("🔥 Éphémère")]] as const).map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={dur === v} className={"chip" + (dur === v ? " on" : "")} onClick={() => setDur(v)}>{l}</button>)}</div>
    <div className="col" style={{ alignItems: "center", gap: 6 }}><HoldMic className="bigmic" max={600} onDone={send}><MicIcon size={54} /></HoldMic><span className="muted small">{t("Maintiens pour parler · relâche pour envoyer")}</span></div>
  </div>);
}
