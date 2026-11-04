import { useEffect, useRef, useState } from "react";
import { popNotes, audioReady, wakeAudio } from "../lib/fx";
import { ACCENTS, accentOf } from "../lib/theme";
import { t } from "../i18n";

export const INTRO_KEY = "notiif-intro"; // auto | full | off
const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* rien */ } };
function env() {
  let accent: string = ACCENTS[0].id, light = false, sound = true;
  try { const s = JSON.parse(get("nidami-v1") || "null"); const c = s?.settings?.[s?.me] || {}; accent = accentOf(c.accent).id; sound = c.fx ?? true;
    const mode = c.mode || (c.light === false ? "dark" : "auto"); light = mode === "light" ? true : mode === "dark" ? false : !window.matchMedia("(prefers-color-scheme: dark)").matches; } catch { /* défauts */ }
  return { accent, light, sound };
}
/** « auto » : toujours complète à chaque ouverture. */
function plan(): "full" | "short" | "none" {
  const m = get(INTRO_KEY) || "auto"; if (m === "off") return "none";
  try { if (sessionStorage.getItem("notiif-upd-reload")) { sessionStorage.removeItem("notiif-upd-reload"); return "none"; } } catch { /* rien */ }
  set("notiif-intro-seen", "1"); set("notiif-intro-day", new Date().toDateString());
  return "full";
}
const W = 524, H = 184, CUTS = [0, 354, 502, 616, 678, 751, 1048];
export function Intro() {
  const [mode, setMode] = useState(plan); const [out, setOut] = useState(false); const [gone, setGone] = useState(mode === "none"); const [step, setStep] = useState(0); const [run, setRun] = useState(0); const [ready, setReady] = useState(false); const [wait, setWait] = useState(false); const then = useRef<"short" | "">(""); const e = useRef(env()).current;
  useEffect(() => { const f = (ev: Event) => { const d = (ev as CustomEvent<{ m: "full" | "short"; then?: "short" }>).detail; then.current = d.then || ""; setMode(d.m); setOut(false); setStep(0); setGone(false); setRun((r) => r + 1); }; window.addEventListener("notiif-intro-preview", f); return () => window.removeEventListener("notiif-intro-preview", f); }, []);
  useEffect(() => { if (gone) return; setReady(false); setWait(false); let alive = true; if (!e.sound) { setReady(true); return; } void audioReady().then((ok) => { if (!alive) return; if (ok) setReady(true); else setWait(true); }); return () => { alive = false; }; }, [gone, run]);
  let reduce = false; try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { /* rien */ }
  const full = mode === "full" && !reduce;
  useEffect(() => { if (gone || !ready) return; const ids: number[] = []; const at = (ms: number, f: () => void) => ids.push(window.setTimeout(f, ms)); const snd = (n: number) => { if (e.sound) popNotes(n); };
    if (reduce) { at(900, () => setOut(true)); at(1250, () => setGone(true)); }
    else if (full) { at(150, () => { setStep(1); snd(6); }); at(900, () => setStep(2)); at(1250, () => { setStep(3); snd(1); }); at(1550, () => { setStep(4); snd(1); }); at(1950, () => { setStep(5); snd(3); }); at(2300, () => setStep(6)); at(3300, () => setOut(true)); at(3650, () => { setGone(true); if (then.current) { const m = then.current; then.current = ""; window.setTimeout(() => window.dispatchEvent(new CustomEvent("notiif-intro-preview", { detail: { m } })), 500); } }); }
    else { at(100, () => { setStep(1); snd(4); }); at(450, () => setStep(5)); at(1000, () => setOut(true)); at(1300, () => setGone(true)); }
    return () => ids.forEach(clearTimeout); }, [gone, run, ready]);
  if (gone) return null;
  const suf = e.accent + (e.light ? "-light" : "");
  const skip = () => { setOut(true); setTimeout(() => setGone(true), 250); };
  const P = (x: number, y: number) => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` });
  return (<div className={"intro" + (out ? " out" : "") + (e.light ? " light" : "")} onClick={() => { if (wait) { wakeAudio(); setWait(false); setReady(true); } else skip(); }} role="presentation" aria-hidden="true">
    <div className={"introwm s" + step}>
      <img className="wmb" src={`./wm-bg-${suf}.png`} alt="" draggable={false} />
      {CUTS.slice(0, 6).map((c, i) => <img key={i} className={"wml" + (step >= 1 ? " hop" : "")} src={`./wm-fg-${suf}.png`} alt="" draggable={false} style={{ ["--i" as string]: i, clipPath: `inset(0 ${100 - CUTS[i + 1] / 10.48}% 0 ${c / 10.48}%)` }} />)}
      {full && <>
        <span className={"ring o" + (step === 2 ? " on" : "")} style={P(214.5, 98.5)} />
        <span className={"ring d1" + (step === 3 ? " on" : "")} style={P(323, 63)} />
        <span className={"ring d2" + (step === 4 ? " on" : "")} style={P(353, 52)} />
        <span className={"fly f1" + (step >= 5 ? " go" : "")} style={P(323, 63)} />
        <span className={"fly f2" + (step >= 5 ? " go" : "")} style={P(353, 52)} />
      </>}
    </div>
    {wait && <div className="introtag on" style={{ marginTop: 18 }}><b className="b2">{t("Touchez l'écran pour lancer le son")}</b></div>}
    {full && <div className={"introtag" + (step >= 6 ? " on" : "")}><b>{t("Votre cercle.")}</b><b className="b2">{t("Vos moments.")}</b></div>}
  </div>);
}
