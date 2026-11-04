import { useEffect, useRef, useState } from "react";
import { popNotes } from "../lib/fx";
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
/** « auto » : complète à la 1re ouverture et à la 1re du jour, courte aux autres ouvertures. */
function plan(): "full" | "short" | "none" {
  const m = get(INTRO_KEY) || "auto"; if (m === "off") return "none";
  const today = new Date().toDateString(); const first = !get("notiif-intro-seen"); const newDay = get("notiif-intro-day") !== today;
  set("notiif-intro-seen", "1"); set("notiif-intro-day", today);
  if (m === "full") return "full"; return first || newDay ? "full" : "short";
}
const W = 524, H = 184, CUTS = [0, 354, 502, 616, 678, 751, 1048];
export function Intro() {
  const [mode] = useState(plan); const [out, setOut] = useState(false); const [gone, setGone] = useState(mode === "none"); const [step, setStep] = useState(0); const e = useRef(env()).current;
  let reduce = false; try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { /* rien */ }
  const full = mode === "full" && !reduce;
  useEffect(() => { if (gone) return; const ids: number[] = []; const at = (ms: number, f: () => void) => ids.push(window.setTimeout(f, ms)); const snd = (n: number) => { if (e.sound) popNotes(n); };
    if (reduce) { at(900, () => setOut(true)); at(1250, () => setGone(true)); }
    else if (full) { at(150, () => { setStep(1); snd(6); }); at(900, () => setStep(2)); at(1250, () => { setStep(3); snd(1); }); at(1550, () => { setStep(4); snd(1); }); at(1950, () => { setStep(5); snd(3); }); at(2300, () => setStep(6)); at(3300, () => setOut(true)); at(3650, () => setGone(true)); }
    else { at(100, () => { setStep(1); snd(4); }); at(450, () => setStep(5)); at(1000, () => setOut(true)); at(1300, () => setGone(true)); }
    return () => ids.forEach(clearTimeout); }, [gone]);
  if (gone) return null;
  const suf = e.accent + (e.light ? "-light" : "");
  const skip = () => { setOut(true); setTimeout(() => setGone(true), 250); };
  const P = (x: number, y: number) => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` });
  return (<div className={"intro" + (out ? " out" : "") + (e.light ? " light" : "")} onClick={skip} role="presentation" aria-hidden="true">
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
    {full && <div className={"introtag" + (step >= 6 ? " on" : "")}><b>{t("Votre cercle.")}</b><b className="b2">{t("Vos moments.")}</b></div>}
  </div>);
}
