import { useS } from "./store";
import { translate, LANGS } from "./i18n";
const GOOD = /natural|neural|online|premium|enhanced|studio|wavenet/i;
const MALE = /remy|rémy|claude|fabrice|gerard|jerome|thomas|paul|daniel|henri|antoine|jean|guy|david|mark|alex|jorge|diego|jan|stefan|conrad|male|homme|nicolas|oliver|arthur|reed/i;
let audio: HTMLAudioElement | null = null; let noHq = false; let token = 0;
export const stopSpeak = () => { token++; if (typeof window === "undefined") return; try { window.speechSynthesis?.cancel(); } catch {} if (audio) { try { audio.pause(); } catch {} audio = null; } };
export const speak = async (txt: string, lang: string, onend?: () => void) => {
  if (typeof window === "undefined") { onend?.(); return; }
  stopSpeak(); const my = token;
  const out = lang === "Français" ? txt : (await Promise.all(txt.split(/(?<=[.!?])\s+/).map((p) => translate(lang, p)))).join(" ");
  if (my !== token) return;
  const clean = out.replace(/[^\p{L}\p{N}\p{M}\s.,'’:;!?%€«»()\/。，！？、-]/gu, "");
  if (!noHq) {
    try {
      const r = await fetch("/api/speak", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: clean }) });
      if (my !== token) return;
      if (r.ok) { const a = new Audio(URL.createObjectURL(await r.blob())); audio = a; a.onended = () => onend?.(); try { await a.play(); return; } catch { audio = null; } } else noHq = true;
    } catch { noHq = true; }
  }
  if (!window.speechSynthesis) { onend?.(); return; }
  const u = new SpeechSynthesisUtterance(clean); const tts = LANGS[lang]?.tts || "fr-FR"; u.lang = tts;
  const st = useS.getState().settings; const code = tts.slice(0, 2); const pool = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(code));
  const sc = (v: SpeechSynthesisVoice) => (v.name === st.voiceName ? 100 : 0) + (MALE.test(v.name) ? 10 : 0) + (GOOD.test(v.name) ? 6 : 0) + (v.localService ? 0 : 1);
  const vv = [...pool].sort((x, y) => sc(y) - sc(x))[0]; if (vv) u.voice = vv; u.pitch = st.pitch ?? 0.75; u.rate = 0.92; if (onend) u.onend = onend; window.speechSynthesis.speak(u);
};
export const ERR: Record<string, string> = {
  "not-allowed": "Le micro est bloqué. Autorisez le micro dans votre navigateur (le site doit être en https).",
  "no-speech": "Je n'ai rien entendu, réessayez.", unsupported: "Ce navigateur ne gère pas le micro. Essayez Chrome (Android) ou Safari (iPhone).", x: "Le micro ne fonctionne pas pour le moment.",
};
export function listen(lang: string, done: (t: string) => void, fail: (e: string) => void, end?: () => void) {
  const R = typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;
  if (!R) { fail("unsupported"); end?.(); return null; }
  const r = new R(); r.lang = LANGS[lang]?.tts || "fr-FR"; r.interimResults = false; r.maxAlternatives = 1;
  r.onresult = (e: any) => done(e.results[0][0].transcript); r.onerror = (e: any) => fail(e.error); if (end) r.onend = end;
  try { r.start(); } catch { fail("x"); end?.(); } return r;
}
