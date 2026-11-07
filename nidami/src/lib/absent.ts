import { absentMsg } from "./presence";
/** Message d'absence : une voix dit « je ne suis pas là ». En français pour la France, en anglais pour toutes les autres langues. */
const lang = () => { try { return (navigator.language || "en").toLowerCase().startsWith("fr") ? "fr" : "en"; } catch { return "en"; } };
export const ABSENT_TEXT = { fr: "Bonjour ! Je ne suis pas disponible pour le moment. Je te réponds dès que je suis de retour.", en: "Hello! I'm not available right now. I'll get back to you as soon as I'm back." };
let stopper: (() => void) | null = null;
export function absentStop() { try { stopper?.(); } catch { /* ignoré */ } stopper = null; try { speechSynthesis.cancel(); } catch { /* ignoré */ } }
/** Enregistre mon message d'absence : 5 secondes au maximum, puis s'arrête tout seul. */
export async function recordAbsent(onTick: (s: number) => void): Promise<{ stop: () => void; done: Promise<string> }> {
  const st = await navigator.mediaDevices.getUserMedia({ audio: true }); const rec = new MediaRecorder(st); const ch: Blob[] = [];
  rec.ondataavailable = (e) => { if (e.data.size) ch.push(e.data); };
  let iv = 0; const stop = () => { if (rec.state !== "inactive") rec.stop(); };
  const done = new Promise<string>((res, rej) => {
    rec.onstop = () => { clearInterval(iv); st.getTracks().forEach((x) => x.stop()); const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(new Error("lecture")); r.readAsDataURL(new Blob(ch, { type: rec.mimeType || "audio/webm" })); };
    let n = 0; iv = window.setInterval(() => { n += 0.1; onTick(Math.min(5, n)); if (n >= 5) stop(); }, 100); rec.start();
  });
  return { stop, done };
}
export function absentShow(sound: boolean) {
  const l = lang(); const mine = absentMsg(); const txt = mine ? (l === "fr" ? "🎙 Mon message d'absence" : "🎙 My away message") : ABSENT_TEXT[l];
  const box = document.createElement("div"); box.className = "fxbox"; box.setAttribute("aria-hidden", "true"); box.style.cssText = "display:flex;align-items:center;justify-content:center;background:rgba(10,8,24,.55);backdrop-filter:blur(6px);opacity:0;transition:opacity .35s";
  const card = document.createElement("div"); card.style.cssText = "max-width:min(86vw,420px);padding:22px 24px;border-radius:26px;background:var(--card,#fff);color:var(--fg,#222);box-shadow:0 18px 60px rgba(0,0,0,.45);text-align:center;font:600 18px/1.4 system-ui,sans-serif";
  const ic = document.createElement("div"); ic.textContent = "🗣"; ic.style.cssText = "font-size:54px;margin-bottom:8px;animation:absp 1s ease-in-out infinite"; const p = document.createElement("div"); p.textContent = txt; card.append(ic, p);
  const st = document.createElement("style"); st.textContent = "@keyframes absp{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}"; box.append(st, card); document.body.appendChild(box); requestAnimationFrame(() => { box.style.opacity = "1"; });
  const end = () => { box.style.opacity = "0"; setTimeout(() => box.remove(), 400); };
  if (mine) { if (!sound) { setTimeout(end, 5500); return; } try { const au = new Audio(mine); au.onended = () => setTimeout(end, 400); au.onerror = () => setTimeout(end, 1500); stopper = () => { au.pause(); }; void au.play().catch(() => setTimeout(end, 1500)); setTimeout(end, 7000); return; } catch { setTimeout(end, 3000); return; } }
  if (sound) { try { const s = speechSynthesis; s.cancel(); const u = new SpeechSynthesisUtterance(txt); u.lang = l === "fr" ? "fr-FR" : "en-US"; u.rate = 0.95; const v = s.getVoices().find((x) => x.lang.toLowerCase().startsWith(l)); if (v) u.voice = v; u.onend = () => setTimeout(end, 500); u.onerror = () => setTimeout(end, 4000); s.speak(u); setTimeout(end, 14000); return; } catch { /* pas de voix */ } }
  setTimeout(end, 6000);
}
