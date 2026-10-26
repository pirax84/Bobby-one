// Effets de conversation : idée classique des messageries, réalisée ici avec nos propres animations et des sons synthétisés (aucun fichier ni nom d'une marque existante).
export type Fx = "shake" | "confetti" | "hearts" | "kiss" | "snow" | "fireworks" | "ghost" | "fire" | "bubbles" | "party" | "rain" | "thunder" | "rocket" | "clap" | "laugh" | "music" | "money" | "bomb";
type Def = { label: string; text: string; em: string[]; snd: [number, number, number][]; wave?: OscillatorType };
export const FX: Record<Fx, Def> = {
  shake: { label: "📳 Secousse", text: "📳 Secousse !", em: [], snd: [[180, .09, .03], [120, .09, .03], [180, .09, .03], [120, .09, .03], [220, .14, 0]], wave: "sawtooth" },
  confetti: { label: "🎉 Confettis", text: "🎉 Confettis !", em: ["🎉", "🎊", "✨", "⭐"], snd: [[660, .08, .02], [880, .08, .02], [1175, .16, 0]] },
  hearts: { label: "❤️ Cœurs", text: "❤️ Pluie de cœurs !", em: ["❤️", "💕", "💖", "💗"], snd: [[523, .12, .02], [659, .12, .02], [784, .2, 0]] },
  kiss: { label: "😘 Bisous", text: "😘 Gros bisous !", em: ["😘", "💋", "😚", "💋"], snd: [[900, .05, .03], [1200, .07, .02], [1500, .1, 0]] },
  snow: { label: "❄️ Neige", text: "❄️ Il neige !", em: ["❄️", "❅", "❆", "⛄"], snd: [[1400, .1, .05], [1750, .1, .05], [2100, .18, 0]] },
  fireworks: { label: "🎆 Feu d'artifice", text: "🎆 Feu d'artifice !", em: ["🎆", "🎇", "✨", "💥"], snd: [[300, .1, .05], [220, .08, .02], [900, .06, .02], [1300, .06, .02], [1700, .14, 0]], wave: "sawtooth" },
  ghost: { label: "👻 Fantôme", text: "👻 Bouh !", em: ["👻", "🎃", "🦇", "💀"], snd: [[200, .25, .02], [150, .3, .02], [110, .4, 0]], wave: "sine" },
  fire: { label: "🔥 Flammes", text: "🔥 Ça chauffe !", em: ["🔥", "🔥", "🧨", "☄️"], snd: [[250, .12, .02], [350, .12, .02], [500, .2, 0]], wave: "sawtooth" },
  bubbles: { label: "🫧 Bulles", text: "🫧 Des bulles !", em: ["🫧", "💧", "🐠", "🐳"], snd: [[600, .06, .04], [800, .06, .04], [1000, .06, .04], [1300, .1, 0]], wave: "sine" },
  party: { label: "🎂 Fête", text: "🎂 C'est la fête !", em: ["🎂", "🎈", "🎁", "🥳"], snd: [[523, .1, .02], [523, .1, .02], [659, .1, .02], [784, .1, .02], [1046, .25, 0]], wave: "triangle" },
  rain: { label: "🌧️ Pluie", text: "🌧️ Il pleut !", em: ["💧", "🌧️", "💦", "☔"], snd: [[1800, .04, .05], [2200, .04, .07], [1600, .04, .06], [2000, .04, .05], [1900, .04, .08], [2300, .05, 0]], wave: "sine" },
  thunder: { label: "⛈️ Orage", text: "⛈️ Coup de tonnerre !", em: ["⚡", "⛈️", "🌩️", "⚡"], snd: [[90, .5, .02], [60, .6, .02], [45, .7, 0]], wave: "sawtooth" },
  rocket: { label: "🚀 Fusée", text: "🚀 Décollage !", em: ["🚀", "🌟", "💫", "🛸"], snd: [[200, .1, 0], [300, .1, 0], [450, .1, 0], [650, .1, 0], [900, .1, 0], [1300, .15, 0], [1800, .2, 0]], wave: "sawtooth" },
  clap: { label: "👏 Bravo", text: "👏 Bravo !", em: ["👏", "🙌", "👏", "🌟"], snd: [[1100, .03, .09], [1000, .03, .09], [1100, .03, .09], [1000, .03, .09], [1100, .03, .09], [1000, .03, .09], [1100, .03, 0]], wave: "square" },
  laugh: { label: "😂 Fou rire", text: "😂 Mort de rire !", em: ["😂", "🤣", "😆", "😹"], snd: [[500, .08, .04], [550, .08, .04], [500, .08, .04], [550, .08, .04], [600, .08, .04], [520, .12, 0]], wave: "square" },
  music: { label: "🎵 Musique", text: "🎵 On met l'ambiance !", em: ["🎵", "🎶", "🎸", "🎤"], snd: [[392, .15, .02], [494, .15, .02], [587, .15, .02], [494, .15, .02], [784, .3, 0]], wave: "triangle" },
  money: { label: "💰 Jackpot", text: "💰 Jackpot !", em: ["💰", "🪙", "💎", "🤑"], snd: [[1568, .07, .02], [2093, .25, .05], [1568, .07, .02], [2093, .3, 0]], wave: "square" },
  bomb: { label: "💣 Boum", text: "💣 Boum !", em: ["💣", "💥", "🔥", "💨"], snd: [[800, .08, .12], [700, .08, .12], [600, .08, .12], [70, .6, 0]], wave: "sawtooth" },
};
export const FX_KEYS = Object.keys(FX) as Fx[];
let ctx: AudioContext | null = null;
function beep(seq: [number, number, number][], type: OscillatorType = "triangle", vol = 0.07) {
  try {
    ctx ||= new (window.AudioContext || (window as any).webkitAudioContext)(); const c = ctx; let t = c.currentTime;
    for (const [f, d, gap] of seq) { const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + 0.02); t += d + gap; }
  } catch { /* son indisponible */ }
}
const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
export function playFx(k: Fx, sound = true) {
  const d = FX[k]; if (!d) return;
  if (sound) beep(d.snd, d.wave || "triangle");
  if (k === "shake") {
    try { navigator.vibrate?.([80, 40, 80, 40, 120]); } catch { /* ignoré */ }
    if (!reduced()) { const r = document.documentElement; r.classList.remove("shake"); void r.offsetWidth; r.classList.add("shake"); setTimeout(() => r.classList.remove("shake"), 900); }
    return;
  }
  if (reduced()) return;
  const rise = k === "bubbles" || k === "fire" || k === "ghost" || k === "rocket" || k === "music"; const box = document.createElement("div"); box.className = "fxbox" + (rise ? " rise" : ""); box.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 34; i++) { const s = document.createElement("span"); s.textContent = d.em[i % d.em.length]; s.style.left = Math.random() * 100 + "%"; s.style.animationDelay = Math.random() * 0.9 + "s"; s.style.fontSize = 18 + Math.random() * 22 + "px"; s.style.animationDuration = 2 + Math.random() * 1.6 + "s"; box.appendChild(s); }
  document.body.appendChild(box); setTimeout(() => box.remove(), 4200);
}
