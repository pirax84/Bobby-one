import { create } from "zustand";
import { useS } from "./store";
const D: Record<string, string[]> = {
  "Accueil": ["Home", "Inicio", "Start"], "Parler à Bobby": ["Talk to Bobby", "Hablar con Bobby", "Mit Bobby sprechen"],
  "Analyse texte": ["Text analysis", "Análisis de texto", "Textanalyse"], "Analyse site web": ["Website analysis", "Análisis de sitio web", "Website-Analyse"],
  "Analyse image": ["Image analysis", "Análisis de imagen", "Bildanalyse"], "Analyse QR code": ["QR code analysis", "Análisis de código QR", "QR-Code-Analyse"],
  "Protection appels": ["Call protection", "Protección de llamadas", "Anrufschutz"], "Centre des menaces": ["Threat center", "Centro de amenazas", "Bedrohungszentrum"],
  "Famille": ["Family", "Familia", "Familie"], "Communauté": ["Community", "Comunidad", "Gemeinschaft"], "Réglages": ["Settings", "Ajustes", "Einstellungen"],
  "Votre tableau de bord": ["Your dashboard", "Su panel", "Ihr Dashboard"], "Posez-moi vos questions": ["Ask me anything", "Hágame preguntas", "Stellen Sie mir Fragen"],
  "SMS, mails, WhatsApp": ["SMS, emails, WhatsApp", "SMS, correos, WhatsApp", "SMS, E-Mails, WhatsApp"], "Ce site est-il fiable ?": ["Is this site trustworthy?", "¿Es fiable este sitio?", "Ist diese Seite vertrauenswürdig?"],
  "Capture d'écran, photo": ["Screenshot, photo", "Captura, foto", "Screenshot, Foto"], "Où mène ce code ?": ["Where does this code lead?", "¿A dónde lleva este código?", "Wohin führt dieser Code?"],
  "Qui vous appelle ?": ["Who is calling you?", "¿Quién le llama?", "Wer ruft an?"], "Reconnaître les arnaques": ["Spot scams", "Reconocer estafas", "Betrug erkennen"],
  "Protéger vos proches": ["Protect your loved ones", "Proteja a los suyos", "Schützen Sie Ihre Liebsten"], "Signalements en direct": ["Live reports", "Avisos en directo", "Live-Meldungen"], "Personnaliser Bobby": ["Customize Bobby", "Personalizar Bobby", "Bobby anpassen"],
  "Bonjour, je suis Bobby.": ["Hello, I'm Bobby.", "Hola, soy Bobby.", "Hallo, ich bin Bobby."], "Je vérifie ce qui mérite votre confiance.": ["I check what deserves your trust.", "Compruebo lo que merece su confianza.", "Ich prüfe, was Ihr Vertrauen verdient."],
  "Score de confiance": ["Trust score", "Puntuación de confianza", "Vertrauenswert"], "Protégé aujourd'hui": ["Protected today", "Protegido hoy", "Heute geschützt"], "Menaces bloquées": ["Threats blocked", "Amenazas bloqueadas", "Bedrohungen blockiert"], "Alertes communauté": ["Community alerts", "Alertas de la comunidad", "Community-Warnungen"],
  "Menaces repérées cette semaine": ["Threats spotted this week", "Amenazas detectadas esta semana", "Diese Woche erkannte Bedrohungen"], "Voir": ["See", "Ver", "Ansehen"],
  "Personnalisez Bobby comme vous le souhaitez.": ["Customize Bobby as you like.", "Personalice Bobby a su gusto.", "Passen Sie Bobby nach Wunsch an."], "Langue": ["Language", "Idioma", "Sprache"],
  "Notifications d'alerte": ["Alert notifications", "Notificaciones de alerta", "Warnmeldungen"], "Confidentialité renforcée (rien n'est envoyé)": ["Enhanced privacy (nothing is sent)", "Privacidad reforzada (no se envía nada)", "Erhöhter Datenschutz (nichts wird gesendet)"],
  "Bobby parle sur tous les écrans": ["Bobby speaks on every screen", "Bobby habla en todas las pantallas", "Bobby spricht auf allen Bildschirmen"],
  "Thème": ["Theme", "Tema", "Design"], "Sombre": ["Dark", "Oscuro", "Dunkel"], "Clair": ["Light", "Claro", "Hell"], "Niveau de sécurité": ["Security level", "Nivel de seguridad", "Sicherheitsstufe"],
  "À propos de Bobby One": ["About Bobby One", "Acerca de Bobby One", "Über Bobby One"],
  "Le menu et les écrans principaux changent de langue. Les analyses de Bobby restent en français pour le moment.": ["The menu and main screens change language. Bobby's analyses stay in French for now.", "El menú y las pantallas principales cambian de idioma. Los análisis de Bobby siguen en francés por ahora.", "Menü und Hauptbildschirme wechseln die Sprache. Bobbys Analysen bleiben vorerst auf Französisch."],
};
export const RTL = ["العربية", "اردو", "فارسی", "עברית", "پښتو"];
export const LANGS: Record<string, { code: string; tts: string }> = {
  "Français": { code: "fr", tts: "fr-FR" }, "English": { code: "en", tts: "en-US" }, "Español": { code: "es", tts: "es-ES" }, "Deutsch": { code: "de", tts: "de-DE" },
  "Português": { code: "pt", tts: "pt-BR" }, "Italiano": { code: "it", tts: "it-IT" }, "العربية": { code: "ar", tts: "ar-SA" }, "中文": { code: "zh-CN", tts: "zh-CN" },
  "हिन्दी": { code: "hi", tts: "hi-IN" }, "Русский": { code: "ru", tts: "ru-RU" }, "日本語": { code: "ja", tts: "ja-JP" },
  "Türkçe": { code: "tr", tts: "tr-TR" }, "Nederlands": { code: "nl", tts: "nl-NL" }, "Polski": { code: "pl", tts: "pl-PL" }, "한국어": { code: "ko", tts: "ko-KR" },
  "Bahasa Indonesia": { code: "id", tts: "id-ID" }, "Tiếng Việt": { code: "vi", tts: "vi-VN" }, "বাংলা": { code: "bn", tts: "bn-BD" }, "اردو": { code: "ur", tts: "ur-PK" },
  "فارسی": { code: "fa", tts: "fa-IR" }, "ไทย": { code: "th", tts: "th-TH" }, "Українська": { code: "uk", tts: "uk-UA" }, "Română": { code: "ro", tts: "ro-RO" },
  "Svenska": { code: "sv", tts: "sv-SE" },
  "Dansk": { code: "da", tts: "da-DK" },
  "Norsk": { code: "no", tts: "nb-NO" },
  "Suomi": { code: "fi", tts: "fi-FI" },
  "Ελληνικά": { code: "el", tts: "el-GR" },
  "עברית": { code: "he", tts: "he-IL" },
  "Čeština": { code: "cs", tts: "cs-CZ" },
  "Magyar": { code: "hu", tts: "hu-HU" },
  "Български": { code: "bg", tts: "bg-BG" },
  "Hrvatski": { code: "hr", tts: "hr-HR" },
  "Slovenčina": { code: "sk", tts: "sk-SK" },
  "Slovenščina": { code: "sl", tts: "sl-SI" },
  "Српски": { code: "sr", tts: "sr-RS" },
  "Lietuvių": { code: "lt", tts: "lt-LT" },
  "Latviešu": { code: "lv", tts: "lv-LV" },
  "Eesti": { code: "et", tts: "et-EE" },
  "Català": { code: "ca", tts: "ca-ES" },
  "Galego": { code: "gl", tts: "gl-ES" },
  "Euskara": { code: "eu", tts: "eu-ES" },
  "Íslenska": { code: "is", tts: "is-IS" },
  "Bahasa Melayu": { code: "ms", tts: "ms-MY" },
  "Filipino": { code: "tl", tts: "fil-PH" },
  "தமிழ்": { code: "ta", tts: "ta-IN" },
  "తెలుగు": { code: "te", tts: "te-IN" },
  "मराठी": { code: "mr", tts: "mr-IN" },
  "ગુજરાતી": { code: "gu", tts: "gu-IN" },
  "ಕನ್ನಡ": { code: "kn", tts: "kn-IN" },
  "മലയാളം": { code: "ml", tts: "ml-IN" },
  "ਪੰਜਾਬੀ": { code: "pa", tts: "pa-IN" },
  "සිංහල": { code: "si", tts: "si-LK" },
  "नेपाली": { code: "ne", tts: "ne-NP" },
  "Kiswahili": { code: "sw", tts: "sw-KE" },
  "Afrikaans": { code: "af", tts: "af-ZA" },
  "አማርኛ": { code: "am", tts: "am-ET" },
  "Hausa": { code: "ha", tts: "ha-NG" },
  "isiZulu": { code: "zu", tts: "zu-ZA" },
  "Yorùbá": { code: "yo", tts: "yo-NG" },
  "Shqip": { code: "sq", tts: "sq-AL" },
  "Македонски": { code: "mk", tts: "mk-MK" },
  "Беларуская": { code: "be", tts: "be-BY" },
  "Қазақша": { code: "kk", tts: "kk-KZ" },
  "Oʻzbek": { code: "uz", tts: "uz-UZ" },
  "Azərbaycan": { code: "az", tts: "az-AZ" },
  "ქართული": { code: "ka", tts: "ka-GE" },
  "Հայերեն": { code: "hy", tts: "hy-AM" },
  "မြန်မာ": { code: "my", tts: "my-MM" },
  "ខ្មែរ": { code: "km", tts: "km-KH" },
  "ລາວ": { code: "lo", tts: "lo-LA" },
  "Монгол": { code: "mn", tts: "mn-MN" },
  "پښتو": { code: "ps", tts: "ps-AF" },
  "Kurdî": { code: "ku", tts: "ku-TR" },
  "繁體中文": { code: "zh-TW", tts: "zh-TW" },
  "Malagasy": { code: "mg", tts: "mg-MG" },
  "Malti": { code: "mt", tts: "mt-MT" },
  "Cymraeg": { code: "cy", tts: "cy-GB" },
  "Gaeilge": { code: "ga", tts: "ga-IE" },
  "Esperanto": { code: "eo", tts: "eo" },
  "Latina": { code: "la", tts: "la" },
  "Bosanski": { code: "bs", tts: "bs-BA" },
};
const IDX: Record<string, number> = { English: 0, Español: 1, Deutsch: 2 };
const dict = (l: string, s: string) => { const i = IDX[l]; return i === undefined ? undefined : D[s]?.[i]; };
let cache: Record<string, string> = {};
try { if (typeof window !== "undefined") cache = JSON.parse(localStorage.getItem("bobby-tr2") || "{}"); } catch {}
let saveT: any = null;
const save = () => { if (saveT) return; saveT = setTimeout(() => { saveT = null; try { localStorage.setItem("bobby-tr2", JSON.stringify(cache)); } catch {} }, 400); };
const useTv = create<{ v: number }>(() => ({ v: 0 }));
const queue = new Map<string, { l: string; s: string }>();
const waiters = new Map<string, ((v: string) => void)[]>();
const failedAt = new Map<string, number>();
let timer: any = null;
const key = (l: string, s: string) => l + "|" + s;

async function one(from: string, to: string, s: string): Promise<string | null> {
  try { const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(s)}`); if (r.ok) { const j = await r.json(); const o = j[0].map((x: any) => x[0]).join(""); if (o) return o; } } catch {}
  try { const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(s)}&langpair=${from}|${to}`); const j = await r.json(); const o = j?.responseData?.translatedText; if (o && !/MYMEMORY WARNING|INVALID|QUERY LENGTH/i.test(o)) return o; } catch {}
  return null;
}
function finish(l: string, s: string, out: string | null) {
  const k = key(l, s);
  if (out) { cache[k] = out; save(); failedAt.delete(k); } else failedAt.set(k, Date.now());
  queue.delete(k); const w = waiters.get(k); waiters.delete(k); w?.forEach((f) => f(out || s));
}
async function runBatch(l: string, arr: string[]) {
  const code = LANGS[l]?.code; if (!code || code === "fr") { arr.forEach((s) => finish(l, s, s)); return; }
  const clean = arr.map((s) => s.replace(/\s*\n+\s*/g, " "));
  let done = false;
  if (arr.length > 1) {
    try {
      const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=fr&tl=${code}&dt=t&q=${encodeURIComponent(clean.join("\n"))}`);
      if (r.ok) { const j = await r.json(); const parts = j[0].map((x: any) => x[0]).join("").split("\n"); if (parts.length === arr.length) { arr.forEach((s, i) => finish(l, s, parts[i].trim() || null)); done = true; } }
    } catch {}
  }
  if (!done) await Promise.all(arr.map(async (s, i) => finish(l, s, await one("fr", code, clean[i]))));
}
async function flush() {
  timer = null; const items = [...queue.values()]; const byLang = new Map<string, string[]>();
  items.forEach(({ l, s }) => { const a = byLang.get(l) || []; a.push(s); byLang.set(l, a); });
  const jobs: Promise<void>[] = [];
  byLang.forEach((list, l) => { let cur: string[] = [], len = 0; const out: string[][] = []; list.forEach((s) => { if (cur.length && (len + s.length > 1100 || cur.length >= 40)) { out.push(cur); cur = []; len = 0; } cur.push(s); len += s.length + 1; }); if (cur.length) out.push(cur); out.forEach((c) => jobs.push(runBatch(l, c))); });
  await Promise.all(jobs); useTv.setState((x) => ({ v: x.v + 1 }));
}
const enqueue = (l: string, s: string) => { const k = key(l, s); if (queue.has(k)) return; const f = failedAt.get(k); if (f && Date.now() - f < 60000) return; queue.set(k, { l, s }); if (!timer) timer = setTimeout(flush, 40); };
const worth = (s: string) => /\p{L}/u.test(s);

export function translate(l: string, s: string): Promise<string> {
  const code = LANGS[l]?.code; if (!s || !s.trim() || !code || code === "fr" || !worth(s)) return Promise.resolve(s);
  const d = dict(l, s); if (d) return Promise.resolve(d); const k = key(l, s); if (cache[k]) return Promise.resolve(cache[k]);
  return new Promise((res) => { const w = waiters.get(k) || []; w.push(res); waiters.set(k, w); enqueue(l, s); });
}
export async function toFr(l: string, s: string): Promise<string> {
  const code = LANGS[l]?.code; if (!s.trim() || !code || code === "fr") return s;
  return (await one(code, "fr", s)) || s;
}
export const tr = (l: string, s: string) => {
  if (!s || l === "Français" || !worth(s)) return s; const d = dict(l, s); if (d) return d;
  const k = key(l, s); if (cache[k]) return cache[k]; enqueue(l, s); return s;
};
export const useT = () => { const l = useS((s) => s.settings.lang); useTv((x) => x.v); return (s: string) => tr(l, s); };
export const useLang = () => useS((s) => s.settings.lang);
