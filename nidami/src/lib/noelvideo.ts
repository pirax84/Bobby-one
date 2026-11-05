import { t } from "../i18n";

/** Durées (s) des vidéos de Noël, et leur forme : h = horizontale (PC), v = verticale (téléphone). */
export const NOEL_VIDEOS: Record<string, { src: string; dur: number; o: "h" | "v" }> = {
  noelv1: { src: "./videos/noel/noelv1.mp4", dur: 20.8, o: "h" },
  noelv2: { src: "./videos/noel/noelv2.mp4", dur: 25, o: "h" },
  noelv3: { src: "./videos/noel/noelv3.mp4", dur: 20, o: "v" },
  noelv4: { src: "./videos/noel/noelv4.mp4", dur: 16.3, o: "v" },
};
const isPortrait = () => innerHeight > innerWidth;
/** « Automatique » : une vidéo de la bonne forme pour l'écran, au hasard. */
export const pickNoelVideo = (): string => { const want = isPortrait() ? "v" : "h"; const l = Object.keys(NOEL_VIDEOS).filter((k) => NOEL_VIDEOS[k].o === want); return l[Math.floor(Math.random() * l.length)]; };

let voiceTimer: ReturnType<typeof setTimeout> | undefined;
/** Coupe la vidéo, la voix et les cloches en cours. */
export function noelVideoStop() {
  clearTimeout(voiceTimer);
  try { speechSynthesis.cancel(); } catch { /* ignoré */ }
  document.querySelectorAll(".fxbox video").forEach((v) => { try { (v as HTMLVideoElement).pause(); v.removeAttribute("src"); (v as HTMLVideoElement).load(); } catch { /* ignoré */ } });
}
function hoHoHo() {
  try {
    const s = speechSynthesis; const u = new SpeechSynthesisUtterance(t("Ho ho ho ! Joyeux Noël !"));
    u.lang = "fr-FR"; u.pitch = 0.1; u.rate = 0.62; u.volume = 1;
    const v = s.getVoices().find((x) => /^fr/i.test(x.lang) && /male|homme|thomas|paul|henri|claude/i.test(x.name)) || s.getVoices().find((x) => /^fr/i.test(x.lang));
    if (v) u.voice = v;
    s.speak(u);
  } catch { /* pas de voix sur cet appareil */ }
}
/** Joue une vidéo de Noël plein écran, avec cloches (dans la vidéo) et « Ho ho ho ! Joyeux Noël ! ». */
export function noelVideoShow(key: string, sound: boolean) {
  const d = NOEL_VIDEOS[key] || NOEL_VIDEOS[pickNoelVideo()];
  const box = document.createElement("div"); box.className = "fxbox"; box.setAttribute("aria-hidden", "true");
  box.style.cssText = "position:fixed;inset:0;z-index:9999;background:#0b1038;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .6s;pointer-events:auto";
  const v = document.createElement("video"); v.src = d.src; v.playsInline = true; v.setAttribute("playsinline", ""); v.preload = "auto"; v.muted = !sound;
  const portraitScreen = isPortrait(); const fit = (d.o === "v") === portraitScreen ? "cover" : "contain";
  v.style.cssText = "width:100%;height:100%;object-fit:" + fit;
  box.appendChild(v); document.body.appendChild(box);
  const end = () => { box.style.opacity = "0"; setTimeout(() => { if (box.isConnected) { noelVideoStop(); box.remove(); } }, 700); };
  box.addEventListener("click", end); v.addEventListener("ended", end);
  v.addEventListener("canplay", () => { box.style.opacity = "1"; }, { once: true });
  v.play().catch(() => { v.muted = true; v.play().catch(end); }); // démarrage automatique : le son peut être refusé
  setTimeout(() => { if (box.isConnected) end(); }, d.dur * 1000 + 1500);
  if (sound) voiceTimer = setTimeout(hoHoHo, 1800);
}
