import { t } from "../i18n";

/** Durées (s) des vidéos de Noël, et leur forme : h = horizontale (PC), v = verticale (téléphone). */
export const NOEL_VIDEOS: Record<string, { src: string; dur: number; o: "h" | "v" }> = {
  noelv1: { src: "./videos/noel/noelv1.mp4", dur: 30.6, o: "h" },
  noelv2: { src: "./videos/noel/noelv2.mp4", dur: 14.3, o: "v" },
};
const isPortrait = () => innerHeight > innerWidth;
let voiceTimer: ReturnType<typeof setTimeout> | undefined;
/** Coupe la vidéo, la voix et les cloches en cours. */
export function noelVideoStop() {
  clearTimeout(voiceTimer);
  try { speechSynthesis.cancel(); } catch { /* ignoré */ }
  document.querySelectorAll(".fxbox video").forEach((v) => { try { (v as HTMLVideoElement).pause(); v.removeAttribute("src"); (v as HTMLVideoElement).load(); } catch { /* ignoré */ } });
}
/** Joue une vidéo de Noël plein écran, avec cloches (dans la vidéo) et « Ho ho ho ! Joyeux Noël ! ». */
export function noelVideoShow(key: string, sound: boolean) {
  const d = NOEL_VIDEOS[key]; if (!d) return;
  const box = document.createElement("div"); box.className = "fxbox"; box.setAttribute("aria-hidden", "true");
  box.style.cssText = "position:fixed;inset:0;z-index:9999;background:#0b1038;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .6s;pointer-events:auto";
  const v = document.createElement("video"); v.src = d.src; v.playsInline = true; v.setAttribute("playsinline", ""); v.preload = "auto"; v.muted = !sound;
  const portraitScreen = isPortrait(); const fit = (d.o === "v") === portraitScreen ? "cover" : "contain";
  v.style.cssText = "width:100%;height:100%;object-fit:" + fit; v.style.position = "relative";
  if (fit === "contain") { const bg = document.createElement("video"); bg.src = d.src; bg.muted = true; bg.loop = true; bg.playsInline = true; bg.setAttribute("playsinline", ""); bg.style.cssText = "position:absolute;inset:-5%;width:110%;height:110%;object-fit:cover;filter:blur(28px) brightness(.7)"; box.appendChild(bg); void bg.play().catch(() => {}); }
  box.appendChild(v); document.body.appendChild(box);
  const kill = () => { box.querySelectorAll("video").forEach((x) => { try { x.pause(); x.removeAttribute("src"); x.load(); } catch { /* ignoré */ } }); };
  const end = () => { if (!box.isConnected || box.dataset.ending) return; box.dataset.ending = "1"; box.style.opacity = "0"; setTimeout(() => { kill(); box.remove(); }, 700); };
  box.addEventListener("click", end); v.addEventListener("ended", end);
  v.addEventListener("canplay", () => { if (box.isConnected && !box.dataset.ending) box.style.opacity = "1"; }, { once: true });
  v.play().catch(() => { if (!box.isConnected) return; v.muted = true; v.play().catch(end); }); // démarrage automatique : le son peut être refusé
  setTimeout(() => { if (box.isConnected) end(); }, d.dur * 1000 + 1500);
}
