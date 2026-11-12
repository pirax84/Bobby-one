import { useEffect, useRef, useState } from "react";
import { t } from "../i18n";
import { Logo, toast, isPC, Switch } from "./common";
import { lockCfg, saveLock, lockHash, bioAvailable, bioSetup, bioCheck, unlock, useLocked, type LockCfg, type LockMode } from "../lib/lock";
import { serverOn, emailLogin } from "../lib/auth";

/** Grille 3×3 : on relie au moins 4 points avec le doigt (ou la souris). */
export function PatternPad({ onDone, min = 4 }: { onDone: (seq: string) => void; min?: number }) {
  const box = useRef<HTMLDivElement>(null); const [seq, setSeq] = useState<number[]>([]); const [pt, setPt] = useState<[number, number] | null>(null); const down = useRef(false);
  const hit = (x: number, y: number) => { const el = box.current; if (!el) return -1; const r = el.getBoundingClientRect(); const cw = r.width / 3, ch = r.height / 3; const cx = Math.floor((x - r.left) / cw), cy = Math.floor((y - r.top) / ch); if (cx < 0 || cx > 2 || cy < 0 || cy > 2) return -1; const mx = r.left + (cx + 0.5) * cw, my = r.top + (cy + 0.5) * ch; return Math.hypot(x - mx, y - my) < Math.min(cw, ch) * 0.32 ? cy * 3 + cx : -1; };
  const move = (e: React.PointerEvent) => { if (!down.current) return; const i = hit(e.clientX, e.clientY); const r = box.current!.getBoundingClientRect(); setPt([e.clientX - r.left, e.clientY - r.top]); if (i >= 0) setSeq((s) => (s.includes(i) ? s : [...s, i])); };
  const end = () => { if (!down.current) return; down.current = false; setPt(null); setSeq((s) => { if (s.length >= min) onDone(s.join("")); else if (s.length) toast(t("Relie au moins 4 points.")); return []; }); };
  const c = (i: number): [number, number] => { const r = box.current?.getBoundingClientRect(); const w = r?.width || 240, h = r?.height || 240; return [((i % 3) + 0.5) * w / 3, (Math.floor(i / 3) + 0.5) * h / 3]; };
  return <div ref={box} role="group" aria-label={t("Schéma")} style={{ position: "relative", width: 240, height: 240, touchAction: "none", margin: "0 auto" }} onPointerDown={(e) => { down.current = true; (e.target as Element).setPointerCapture?.(e.pointerId); const i = hit(e.clientX, e.clientY); setSeq(i >= 0 ? [i] : []); }} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
    <svg width="240" height="240" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>{seq.map((i, k) => k ? <line key={k} x1={c(seq[k - 1])[0]} y1={c(seq[k - 1])[1]} x2={c(i)[0]} y2={c(i)[1]} stroke="var(--brand)" strokeWidth="4" strokeLinecap="round" /> : null)}{seq.length > 0 && pt && <line x1={c(seq[seq.length - 1])[0]} y1={c(seq[seq.length - 1])[1]} x2={pt[0]} y2={pt[1]} stroke="var(--brand)" strokeWidth="4" strokeLinecap="round" opacity=".6" />}</svg>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gridTemplateRows: "repeat(3,1fr)", width: "100%", height: "100%" }}>{Array.from({ length: 9 }, (_, i) => <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 54, height: 54, borderRadius: "50%", border: "2px solid var(--brand)", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 14, height: 14, borderRadius: "50%", background: seq.includes(i) ? "var(--brand)" : "var(--mute)" }} /></div></div>)}</div></div>;
}
const FingerIcon = ({ s = 28 }: { s?: number }) => <svg viewBox="0 0 48 48" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M14 20a10 10 0 0 1 20 0" /><path d="M10 26a14 14 0 0 1 28 0v4" /><path d="M18 36c0-4 0-8 0-10a6 6 0 0 1 12 0c0 6 0 10 2 14" /><path d="M24 40c-1-3-1-8-1-14" /><path d="M12 34c0-3 0-6 0-8" /></svg>;
const FaceIcon = ({ s = 28 }: { s?: number }) => <svg viewBox="0 0 48 48" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M6 16V9a3 3 0 0 1 3-3h7" /><path d="M32 6h7a3 3 0 0 1 3 3v7" /><path d="M42 32v7a3 3 0 0 1-3 3h-7" /><path d="M16 42H9a3 3 0 0 1-3-3v-7" /><path d="M17 19v4" /><path d="M31 19v4" /><path d="M24 20v7h-3" /><path d="M17 33c4 3 10 3 14 0" /></svg>;

function Pin({ onDone, label }: { onDone: (p: string) => void; label: string }) {
  const [v, setV] = useState("");
  return <form className="col" style={{ gap: 8, alignItems: "center" }} onSubmit={(e) => { e.preventDefault(); if (v.length >= 4) { onDone(v); setV(""); } }}><input className="inp" inputMode="numeric" type="password" maxLength={6} autoFocus value={v} aria-label={label} placeholder={label} onChange={(e) => setV(e.target.value.replace(/\D/g, ""))} style={{ textAlign: "center", letterSpacing: 8, maxWidth: 200 }} /><button className="btn" disabled={v.length < 4}>{t("Valider")}</button></form>;
}

/** Réglages > Confidentialité > Verrou NOTIIF. */
export function LockCard() {
  const [cfg, setCfg] = useState<LockCfg>(lockCfg()); const [bio, setBio] = useState(false); const pc = isPC();
  const [step, setStep] = useState<null | { m: LockMode; first?: string; face?: boolean }>(null);
  useEffect(() => { void bioAvailable().then(setBio); }, []);
  const up = (p: Partial<LockCfg>) => { const n = { ...cfg, ...p }; setCfg(n); saveLock(n); };
  const choose = async (m: LockMode, face = false) => {
    if (m === "none") { up({ m: "none", h: undefined, cid: undefined }); toast(t("Verrou coupé.")); return; }
    if (m === "bio") { if (!bio) { toast(t("Ton appareil ne sait pas faire ça.")); return; } const cid = await bioSetup(); if (!cid) { toast(t("Impossible d'activer. Réessaie.")); return; } up({ m: "bio", cid, face, h: undefined }); toast(t("Verrou activé.")); return; }
    setStep({ m });
  };
  const done = async (code: string) => {
    if (!step) return;
    if (!step.first) { setStep({ ...step, first: code }); return; }
    if (step.first !== code) { toast(t("Ce n'est pas pareil. Recommence.")); setStep({ m: step.m }); return; }
    up({ m: step.m, h: await lockHash(code), cid: undefined }); setStep(null); toast(t("Verrou activé."));
  };
  const row = (m: LockMode, title: string, sub: string, icon: React.ReactNode, face = false, off = false) => { const sel = cfg.m === m && (m !== "bio" || !!cfg.face === face); return <button key={title} type="button" role="radio" aria-checked={sel} disabled={off} onClick={() => void choose(m, face)} className="row" style={{ gap: 12, padding: 12, borderRadius: 14, textAlign: "left", width: "100%", border: sel ? "2px solid var(--brand)" : "1px solid var(--bd)", background: sel ? "rgba(var(--brand-rgb),.14)" : "var(--card)", color: "var(--fg)", opacity: off ? 0.5 : 1 }}><span style={{ color: "var(--brand)", width: 30, display: "flex", justifyContent: "center" }}>{icon}</span><span className="grow"><b>{title}</b><div className="muted small">{sub}</div></span><span style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid var(--brand)", background: sel ? "var(--brand)" : "transparent" }} /></button>; };
  return <div className="card col" style={{ gap: 8 }}><h3>{t("Verrou NOTIIF")}</h3><p className="muted small" style={{ margin: 0 }}>{t("Pour que personne n'ouvre NOTIIF sur ton appareil")}</p>
    <div className="col" role="radiogroup" aria-label={t("Choisis ton verrou")} style={{ gap: 6 }}>
      {row("none", t("Aucun verrou"), t("Pas de verrou, NOTIIF s'ouvre direct"), <span>○</span>)}
      {pc ? row("bio", "Windows Hello", bio ? t("Empreinte ou visage, si ton PC le permet") : t("Pas disponible sur ce PC"), <FingerIcon />, false, !bio) : <>{row("bio", t("Empreinte"), bio ? t("Ton doigt sur le capteur") : t("Pas disponible sur ce téléphone"), <FingerIcon />, false, !bio)}{row("bio", t("Visage"), bio ? t("Ton téléphone te reconnaît") : t("Pas disponible sur ce téléphone"), <FaceIcon />, true, !bio)}</>}
      {!pc && row("pattern", t("Schéma"), t("Un dessin avec le doigt"), <span>▦</span>)}
      {row("pin", t("Code PIN"), t("4 à 6 chiffres"), <span>••</span>)}</div>
    {step && <div className="card col" style={{ alignItems: "center", gap: 8 }}><b>{step.m === "pattern" ? (step.first ? t("Dessine-le encore une fois") : t("Dessine ton schéma")) : (step.first ? t("Écris-le encore une fois") : t("Choisis ton code PIN"))}</b>{step.m === "pattern" ? <PatternPad onDone={(c) => void done(c)} /> : <Pin onDone={(c) => void done(c)} label={t("Code PIN")} />}<button type="button" className="btn ghost" onClick={() => setStep(null)}>{t("Annuler")}</button><div className="muted small">{t("Si tu l'oublies, tu peux le refaire avec ton mot de passe.")}</div></div>}
    {cfg.m !== "none" && <><div className="muted small">{t("Verrouiller")}</div><div className="row" style={{ gap: 6, flexWrap: "wrap" }}>{([[0, t("Tout de suite")], [60, t("Après 1 min")], [300, t("Après 5 min")]] as [number, string][]).map(([s, l]) => <button key={s} type="button" className={"chip" + (cfg.after === s ? " on" : "")} aria-pressed={cfg.after === s} onClick={() => up({ after: s })}>{l}</button>)}</div>
      {!pc && <label className="row" style={{ padding: "6px 0" }}><span className="grow"><b>{t("Cacher l'aperçu dans les applis récentes")}</b></span><Switch on={cfg.hide} onChange={(v) => up({ hide: v })} label={t("Cacher l'aperçu dans les applis récentes")} /></label>}</>}</div>;
}

/** Écran verrouillé : affiché par-dessus toute l'appli tant qu'on n'a pas déverrouillé. */
export function LockGate() {
  const locked = useLocked(); const cfg = lockCfg(); const [err, setErr] = useState(false); const [forgot, setForgot] = useState(false); const [mail, setMail] = useState(""); const [pw, setPw] = useState("");
  const tryBio = async () => { if (cfg.cid && (await bioCheck(cfg.cid))) unlock(); else setErr(true); };
  useEffect(() => { if (locked && cfg.m === "bio") void tryBio(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [locked]);
  if (!locked || cfg.m === "none") return null;
  const check = async (code: string) => { if (cfg.h && (await lockHash(code)) === cfg.h) unlock(); else setErr(true); };
  const reset = async () => { const r = await emailLogin(mail.trim(), pw); if (r.who) { saveLock({ ...cfg, m: "none", h: undefined, cid: undefined }); unlock(); toast(t("Verrou coupé. Tu peux en choisir un autre dans les réglages.")); } else toast(r.msg); };
  return <div role="dialog" aria-modal="true" aria-label={t("NOTIIF est verrouillé")} style={{ position: "fixed", inset: 0, zIndex: 2147483000, background: "var(--bg)", color: "var(--fg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 24, textAlign: "center" }}>
    <Logo s={96} /><h1 style={{ fontSize: "1.4rem" }}>{t("NOTIIF est verrouillé")}</h1>
    {cfg.m === "bio" && <><div className="muted">{isPC() ? t("Utilise Windows Hello") : t("Pose ton doigt ou montre ton visage")}</div><button type="button" className="btn" aria-label={t("Déverrouiller")} onClick={() => void tryBio()} style={{ width: 110, height: 110, borderRadius: "50%", background: "none", border: "2px solid var(--brand)", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center" }}><FingerIcon s={64} /></button></>}
    {cfg.m === "pin" && <Pin label={t("Code PIN")} onDone={(c) => void check(c)} />}
    {cfg.m === "pattern" && <><div className="muted">{t("Dessine ton schéma")}</div><PatternPad onDone={(c) => void check(c)} /></>}
    {err && <div role="alert" style={{ color: "var(--warm)" }}>{t("Ça ne marche pas. Réessaie.")}</div>}
    {!forgot ? <button type="button" className="btn ghost" onClick={() => setForgot(true)}>{t("J'ai oublié")}</button>
      : serverOn() ? <div className="col" style={{ width: "100%", maxWidth: 320 }}><input className="inp" type="email" placeholder={t("Adresse e-mail")} value={mail} onChange={(e) => setMail(e.target.value)} /><input className="inp" type="password" placeholder={t("Mot de passe")} value={pw} onChange={(e) => setPw(e.target.value)} /><button className="btn" onClick={() => void reset()}>{t("Retirer le verrou")}</button></div>
        : <div className="muted small" style={{ maxWidth: 320 }}>{t("En mode démo, le verrou ne peut se retirer qu'en effaçant les données de l'appli.")}</div>}
  </div>;
}
