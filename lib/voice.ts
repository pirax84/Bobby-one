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
  const tts = LANGS[lang]?.tts || "fr-FR"; const vv = await pickVoice(lang); if (my !== token) return;
  const st = useS.getState().settings;
  // Même voix, même vitesse, même tonalité partout : le texte est découpé en phrases lues l'une après l'autre.
  const parts = clean.match(/[^.!?。！？]+[.!?。！？]*/g)?.map((x) => x.trim()).filter(Boolean) || [clean];
  const chunks: string[] = []; for (const p of parts) { if (p.length <= 200) chunks.push(p); else for (let i = 0; i < p.length; i += 200) chunks.push(p.slice(i, i + 200)); }
  chunks.forEach((c, i) => { const u = new SpeechSynthesisUtterance(c); u.lang = vv?.lang || tts; if (vv) u.voice = vv; u.pitch = st.pitch ?? 0.75; u.rate = st.rate ?? 0.92; if (i === chunks.length - 1 && onend) u.onend = onend; window.speechSynthesis.speak(u); });
};
// Liste des voix du téléphone : elle arrive parfois avec un petit retard, on l'attend pour que la voix soit toujours la même.
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((res) => {
    const sy = typeof window !== "undefined" ? window.speechSynthesis : undefined; if (!sy) return res([]);
    const now = sy.getVoices(); if (now.length) return res(now);
    let done = false; const fin = () => { if (done) return; done = true; sy.removeEventListener?.("voiceschanged", fin); res(sy.getVoices()); };
    sy.addEventListener?.("voiceschanged", fin); setTimeout(fin, 1500);
  });
}
export const voicesFor = (all: SpeechSynthesisVoice[], lang: string) => { const code = (LANGS[lang]?.tts || "fr-FR").slice(0, 2); return all.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith(code)); };
// Les voix « du téléphone » (locales) obéissent à la vitesse et à la tonalité ; beaucoup de voix « réseau » les ignorent.
export async function pickVoice(lang: string): Promise<SpeechSynthesisVoice | undefined> {
  const st = useS.getState().settings; const pool = voicesFor(await loadVoices(), lang);
  const sc = (v: SpeechSynthesisVoice) => (v.name === st.voiceName ? 1000 : 0) + (v.localService ? 50 : 0) + (MALE.test(v.name) ? 10 : 0) + (GOOD.test(v.name) ? 3 : 0);
  return [...pool].sort((x, y) => sc(y) - sc(x) || x.name.localeCompare(y.name))[0];
}
export const ERR: Record<string, string> = {
  "not-allowed": "Le micro est bloqué. Autorisez le micro dans votre navigateur (le site doit être en https).",
  off: "Le micro est désactivé. Vous pouvez le réactiver dans Paramètres > Notifications et autorisations.",
  "no-speech": "Je n'ai rien entendu, réessayez.", unsupported: "Ce navigateur ne gère pas le micro. Essayez Chrome (Android) ou Safari (iPhone).", x: "Le micro ne fonctionne pas pour le moment.",
};
import { isApp, has as nHas, ensure as nEnsure, nListen } from "./native";
export function listen(lang: string, done: (t: string) => void, fail: (e: string) => void, end?: () => void) {
  if (useS.getState().settings.micOn === false) { fail("off"); end?.(); return null; }
  if (isApp()) { if (!nHas("mic")) { nEnsure("mic", 60000).then((ok) => { if (ok) nListen(LANGS[lang]?.tts || "fr-FR", done, fail, end); else { fail("not-allowed"); end?.(); } }); return null; } return nListen(LANGS[lang]?.tts || "fr-FR", done, fail, end); }
  const R = typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;
  if (!R) { fail("unsupported"); end?.(); return null; }
  const r = new R(); r.lang = LANGS[lang]?.tts || "fr-FR"; r.interimResults = false; r.maxAlternatives = 1;
  r.onresult = (e: any) => done(e.results[0][0].transcript); r.onerror = (e: any) => fail(e.error); if (end) r.onend = end;
  try { r.start(); } catch { fail("x"); end?.(); } return r;
}
