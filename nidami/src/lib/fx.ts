// Effets de conversation : idée classique des messageries, réalisée ici avec nos propres animations et des sons synthétisés (aucun fichier ni nom d'une marque existante).
export type Fx = "shake" | "confetti" | "hearts" | "kiss" | "snow" | "fireworks" | "ghost" | "fire" | "bubbles" | "party" | "rain" | "thunder" | "rocket" | "clap" | "laugh" | "music" | "money" | "bomb" | "birthday";
type Def = { label: string; text: string; em: string[] };
export const FX: Record<Fx, Def> = {
  shake: { label: "📳 Secousse", text: "📳 Secousse !", em: [] },
  confetti: { label: "🎉 Confettis", text: "🎉 Confettis !", em: ["🎉", "🎊", "✨", "⭐"] },
  hearts: { label: "❤️ Cœurs", text: "❤️ Pluie de cœurs !", em: ["❤️", "💕", "💖", "💗"] },
  kiss: { label: "😘 Bisous", text: "😘 Gros bisous !", em: ["😘", "💋", "😚", "💋"] },
  snow: { label: "❄️ Neige", text: "❄️ Il neige !", em: ["❄️", "❅", "❆", "⛄"] },
  fireworks: { label: "🎆 Feu d'artifice", text: "🎆 Feu d'artifice !", em: ["🎆", "🎇", "✨", "💥"] },
  ghost: { label: "👻 Fantôme", text: "👻 Bouh !", em: ["👻", "🎃", "🦇", "💀"] },
  fire: { label: "🔥 Flammes", text: "🔥 Ça chauffe !", em: ["🔥", "🔥", "🧨", "☄️"] },
  bubbles: { label: "🫧 Bulles", text: "🫧 Des bulles !", em: ["🫧", "💧", "🐠", "🐳"] },
  party: { label: "🎂 Fête", text: "🎂 C'est la fête !", em: ["🎂", "🎈", "🎁", "🥳"] },
  rain: { label: "🌧️ Pluie", text: "🌧️ Il pleut !", em: ["💧", "🌧️", "💦", "☔"] },
  thunder: { label: "⛈️ Orage", text: "⛈️ Coup de tonnerre !", em: ["⚡", "⛈️", "🌩️", "⚡"] },
  rocket: { label: "🚀 Fusée", text: "🚀 Décollage !", em: ["🚀", "🌟", "💫", "🛸"] },
  clap: { label: "👏 Bravo", text: "👏 Bravo !", em: ["👏", "🙌", "👏", "🌟"] },
  laugh: { label: "😂 Fou rire", text: "😂 Mort de rire !", em: ["😂", "🤣", "😆", "😹"] },
  music: { label: "🎵 Musique", text: "🎵 On met l'ambiance !", em: ["🎵", "🎶", "🎸", "🎤"] },
  money: { label: "💰 Jackpot", text: "💰 Jackpot !", em: ["💰", "🪙", "💎", "🤑"] },
  bomb: { label: "💣 Boum", text: "💣 Boum !", em: ["💣", "💥", "🔥", "💨"] },
  birthday: { label: "🎂 Anniversaire", text: "🎂 Joyeux anniversaire !", em: ["🎂", "🎈", "🎁", "🥳", "🎉", "🎈"] },
};
export const FX_KEYS = Object.keys(FX) as Fx[];
// ───────── Sons : synthèse « instrumentale » (cloches, harpe, voix, souffles…) — aucun fichier, aucun son d'une marque
type AC = BaseAudioContext; type Out = AudioNode;
const hz = (n: number) => 440 * Math.pow(2, (n - 69) / 12); // numéro de note MIDI → fréquence
const noiseBuf = (c: AC) => { const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; };
/** Une note : partiels (harmoniques) avec attaque et extinction naturelle. */
function note(c: AC, o: Out, f: number, t: number, dur: number, { vol = 0.12, type = "sine" as OscillatorType, partials = [1], atk = 0.005, vib = 0, glide = 0 } = {}) {
  partials.forEach((p, i) => { const osc = c.createOscillator(), g = c.createGain(); osc.type = type; osc.frequency.setValueAtTime(f * p * (glide ? 1 - glide : 1), t); if (glide) osc.frequency.exponentialRampToValueAtTime(f * p, t + dur * 0.4);
    if (vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = vib; lg.gain.value = f * p * 0.02; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + dur + 0.1); }
    const v = vol / (i + 1); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + atk); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); osc.connect(g); g.connect(o); osc.start(t); osc.stop(t + dur + 0.05); });
}
const bell = (c: AC, o: Out, n: number, t: number, d = 1.2, vol = 0.1) => { const f = hz(n); [1, 2.76, 5.4, 8.9].forEach((p, i) => note(c, o, f * p, t, d / (i * 0.8 + 1), { vol: vol / (i * 1.6 + 1) })); };
const harp = (c: AC, o: Out, n: number, t: number, d = 1.1, vol = 0.14) => note(c, o, hz(n), t, d, { vol, type: "triangle", partials: [1, 2, 3, 4], atk: 0.004 });
const piano = (c: AC, o: Out, n: number, t: number, d = 0.9, vol = 0.14) => note(c, o, hz(n), t, d, { vol, type: "triangle", partials: [1, 2, 3, 5], atk: 0.003 });
const brass = (c: AC, o: Out, n: number, t: number, d = 0.4, vol = 0.1) => { const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.setValueAtTime(600, t); f.frequency.linearRampToValueAtTime(2600, t + 0.08); f.frequency.exponentialRampToValueAtTime(900, t + d); f.connect(o); note(c, f, hz(n), t, d, { vol, type: "sawtooth", partials: [1, 1.004], atk: 0.04 }); };
/** Bruit filtré (souffle, pluie, tonnerre, applaudissement…) avec balayage de fréquence. */
function air(c: AC, o: Out, t: number, dur: number, { type = "bandpass" as BiquadFilterType, f0 = 1000, f1 = 1000, q = 1, vol = 0.2, atk = 0.01, curve = "exp" } = {}) {
  const src = c.createBufferSource(); src.buffer = noiseBuf(c); const f = c.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + atk); if (curve === "exp") g.gain.exponentialRampToValueAtTime(0.0001, t + dur); else { g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.linearRampToValueAtTime(0.0001, t + dur); }
  src.connect(f); f.connect(g); g.connect(o); src.start(t); src.stop(t + dur + 0.05);
}
/** Voix synthétique : source en dents de scie passée dans des filtres de voyelle qui bougent. */
function voice(c: AC, o: Out, t: number, dur: number, f0: number, f1: number, v1: [number, number], v2: [number, number], { vol = 0.12, vib = 5, vibAmt = 0.03, atk = 0.08 } = {}) {
  const osc = c.createOscillator(); osc.type = "sawtooth"; osc.frequency.setValueAtTime(f0, t); osc.frequency.linearRampToValueAtTime(f1, t + dur * 0.55); osc.frequency.linearRampToValueAtTime(f0 * 0.85, t + dur);
  const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = vib; lg.gain.value = f0 * vibAmt; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + dur + 0.1);
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + atk); g.gain.setValueAtTime(vol, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const mix = c.createGain(); mix.connect(g); g.connect(o);
  [v1, v2].forEach(([fa, fb], i) => { const b = c.createBiquadFilter(); b.type = "bandpass"; b.Q.value = 6; b.frequency.setValueAtTime(fa, t); b.frequency.linearRampToValueAtTime(fb, t + dur * 0.6); const bg = c.createGain(); bg.gain.value = i ? 0.5 : 1; osc.connect(b); b.connect(bg); bg.connect(mix); });
  osc.start(t); osc.stop(t + dur + 0.05);
}
const pent = [72, 74, 76, 79, 81, 84, 86, 88];
const SFX: Record<Fx, (c: AC, o: Out, t: number) => void> = {
  // Secousse : cloche grave qui « vibre » + roulement métallique (esprit des vieilles messageries, mais notre propre son)
  shake: (c, o, t) => { for (let i = 0; i < 6; i++) { bell(c, o, i % 2 ? 62 : 67, t + i * 0.085, 0.5, 0.11); } air(c, o, t, 0.6, { f0: 3000, f1: 800, q: 2, vol: 0.12 }); bell(c, o, 55, t + 0.55, 1.4, 0.14); },
  confetti: (c, o, t) => { air(c, o, t, 0.12, { type: "highpass", f0: 2000, f1: 2000, vol: 0.35 }); [72, 76, 79, 84, 88, 91].forEach((n, i) => bell(c, o, n, t + 0.06 + i * 0.07, 1.1, 0.09)); },
  hearts: (c, o, t) => { [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => harp(c, o, n, t + i * 0.09, 1.4, 0.12)); note(c, o, hz(48), t, 1.8, { vol: 0.08, partials: [1, 2], atk: 0.3 }); },
  kiss: (c, o, t) => { air(c, o, t, 0.05, { f0: 3500, vol: 0.3, q: 0.8 }); note(c, o, 650, t + 0.03, 0.16, { vol: 0.14, glide: 0.45 }); note(c, o, 900, t + 0.2, 0.12, { vol: 0.1 }); air(c, o, t + 0.2, 0.05, { f0: 4000, vol: 0.25, q: 0.8 }); },
  snow: (c, o, t) => { [0, 2, 4, 1, 5, 3, 6, 7].forEach((k, i) => bell(c, o, pent[k] + 12, t + i * 0.12, 1.6, 0.06)); note(c, o, hz(60), t, 2.2, { vol: 0.05, atk: 0.5 }); },
  fireworks: (c, o, t) => { const w = c.createOscillator(), g = c.createGain(); w.frequency.setValueAtTime(500, t); w.frequency.exponentialRampToValueAtTime(2800, t + 0.5); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.07, t + 0.1); g.gain.linearRampToValueAtTime(0.0001, t + 0.52); w.connect(g); g.connect(o); w.start(t); w.stop(t + 0.55);
    air(c, o, t + 0.5, 0.9, { type: "lowpass", f0: 700, f1: 90, vol: 0.5 }); for (let i = 0; i < 14; i++) air(c, o, t + 0.55 + Math.random() * 0.9, 0.05, { type: "highpass", f0: 3000, vol: 0.12 + Math.random() * 0.1 }); },
  ghost: (c, o, t) => { voice(c, o, t, 1.5, 330, 520, [350, 900], [800, 2000], { vol: 0.4, vib: 6, vibAmt: 0.04, atk: 0.25 }); voice(c, o, t + 0.5, 1.7, 220, 330, [300, 700], [700, 1500], { vol: 0.3, vib: 4.5, vibAmt: 0.05, atk: 0.3 }); air(c, o, t, 2, { f0: 400, f1: 200, q: 0.5, vol: 0.05, curve: "lin" }); },
  fire: (c, o, t) => { air(c, o, t, 1.6, { type: "lowpass", f0: 600, f1: 300, vol: 0.28, atk: 0.2, curve: "lin" }); for (let i = 0; i < 22; i++) air(c, o, t + Math.random() * 1.5, 0.03 + Math.random() * 0.03, { type: "bandpass", f0: 1500 + Math.random() * 3500, q: 3, vol: 0.18 + Math.random() * 0.15 }); air(c, o, t, 0.5, { f0: 400, f1: 1800, q: 0.7, vol: 0.2 }); },
  bubbles: (c, o, t) => { [0, 0.13, 0.26, 0.45, 0.58, 0.72].forEach((d, i) => { const f = 350 + Math.random() * 500; const x = c.createOscillator(), g = c.createGain(); x.frequency.setValueAtTime(f, t + d); x.frequency.exponentialRampToValueAtTime(f * 2.2, t + d + 0.1); g.gain.setValueAtTime(0.0001, t + d); g.gain.linearRampToValueAtTime(0.13, t + d + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.14); x.connect(g); g.connect(o); x.start(t + d); x.stop(t + d + 0.16); void i; }); },
  party: (c, o, t) => { [[60, 0], [60, 0.14], [64, 0.28], [67, 0.42], [72, 0.6]].forEach(([n, d]) => brass(c, o, n, t + d, d > 0.5 ? 0.7 : 0.16, 0.1)); air(c, o, t + 0.62, 0.12, { type: "highpass", f0: 2500, vol: 0.3 }); [72, 76, 79, 84].forEach((n, i) => bell(c, o, n, t + 0.7 + i * 0.06, 1, 0.07)); },
  rain: (c, o, t) => { air(c, o, t, 2.2, { type: "highpass", f0: 3500, f1: 3500, vol: 0.14, atk: 0.4, curve: "lin" }); air(c, o, t, 2.2, { type: "bandpass", f0: 1200, q: 0.4, vol: 0.08, atk: 0.4, curve: "lin" }); for (let i = 0; i < 9; i++) bell(c, o, 84 + Math.floor(Math.random() * 12), t + Math.random() * 2, 0.35, 0.04); },
  thunder: (c, o, t) => { air(c, o, t, 0.15, { type: "highpass", f0: 1500, vol: 0.5 }); air(c, o, t + 0.1, 2.6, { type: "lowpass", f0: 420, f1: 55, vol: 0.9, atk: 0.1 }); air(c, o, t + 1.0, 1.8, { type: "lowpass", f0: 250, f1: 50, vol: 0.5, atk: 0.2 }); },
  rocket: (c, o, t) => { air(c, o, t, 1.6, { type: "lowpass", f0: 250, f1: 2400, vol: 0.45, atk: 0.3, curve: "lin" }); air(c, o, t, 1.6, { f0: 600, f1: 5000, q: 1.2, vol: 0.2, atk: 0.4, curve: "lin" }); note(c, o, 90, t, 1.5, { vol: 0.12, type: "sawtooth", glide: 0.6 }); },
  clap: (c, o, t) => { for (let i = 0; i < 16; i++) { const d = i * 0.07 + Math.random() * 0.05; air(c, o, t + d, 0.06, { f0: 1400 + Math.random() * 1200, q: 0.9, vol: 0.28 }); air(c, o, t + d + 0.02, 0.04, { f0: 2600, q: 1.5, vol: 0.14 }); } },
  laugh: (c, o, t) => { [0, 0.2, 0.4, 0.6, 0.8].forEach((d, i) => voice(c, o, t + d, 0.14, 330 - i * 14, 300 - i * 14, [750, 1100], [1300, 1800], { vol: 0.38, vib: 0, atk: 0.02 })); },
  music: (c, o, t) => { [[67, 0], [71, 0.2], [74, 0.4], [79, 0.6], [76, 0.9], [72, 1.1], [74, 1.3], [79, 1.5]].forEach(([n, d]) => piano(c, o, n, t + d, 0.9, 0.14)); [43, 47, 50].forEach((n, i) => note(c, o, hz(n), t + i * 0.5, 1.2, { vol: 0.1, type: "triangle", partials: [1, 2] })); },
  money: (c, o, t) => { air(c, o, t, 0.04, { f0: 3000, vol: 0.3 }); bell(c, o, 88, t + 0.05, 1.6, 0.14); bell(c, o, 95, t + 0.2, 1.8, 0.14); for (let i = 0; i < 6; i++) bell(c, o, 100 + (i % 3), t + 0.45 + i * 0.05, 0.4, 0.05); },
  bomb: (c, o, t) => { const w = c.createOscillator(), g = c.createGain(); w.frequency.setValueAtTime(2200, t); w.frequency.exponentialRampToValueAtTime(260, t + 0.7); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.07, t + 0.05); g.gain.linearRampToValueAtTime(0.0001, t + 0.72); w.connect(g); g.connect(o); w.start(t); w.stop(t + 0.75);
    air(c, o, t + 0.72, 0.2, { type: "highpass", f0: 1000, vol: 0.7 }); air(c, o, t + 0.72, 1.6, { type: "lowpass", f0: 500, f1: 40, vol: 1, atk: 0.01 }); note(c, o, 55, t + 0.72, 1.2, { vol: 0.3, glide: 0.5 }); },
} as Record<Fx, (c: AC, o: Out, t: number) => void>;
// Mélodie traditionnelle « Joyeux anniversaire » (domaine public), jouée au piano avec une basse douce : environ 7 secondes.
const BDAY: [number, number][] = [[67, .75], [67, .25], [69, 1], [67, 1], [72, 1], [71, 2], [67, .75], [67, .25], [69, 1], [67, 1], [74, 1], [72, 2], [67, .75], [67, .25], [79, 1], [76, 1], [72, 1], [71, 1], [69, 2], [77, .75], [77, .25], [76, 1], [72, 1], [74, 1], [72, 2]];
SFX.birthday = (c, o, t) => { const B = 0.28; let x = 0; BDAY.forEach(([n, d], i) => { piano(c, o, n, t + x * B, d * B * 2.2, 0.16); if (i % 3 === 0) note(c, o, hz(n - 24), t + x * B, 0.9, { vol: 0.07, type: "triangle", partials: [1, 2] }); x += d; });
  [72, 76, 79, 84].forEach((n, i) => bell(c, o, n, t + x * B + i * 0.07, 1.4, 0.09)); air(c, o, t + x * B, 0.12, { type: "highpass", f0: 2500, vol: 0.3 }); };
let ctx: AudioContext | null = null;
/** Joue le bruitage de l'effet (volume modéré). */
export function sfx(k: Fx, target?: BaseAudioContext) {
  try {
    const c = target || (ctx ||= new (window.AudioContext || (window as any).webkitAudioContext)()); if ((c as AudioContext).state === "suspended") void (c as AudioContext).resume();
    const master = c.createGain(); master.gain.value = 0.9; const comp = c.createDynamicsCompressor(); master.connect(comp); comp.connect(c.destination); SFX[k](c, master, c.currentTime + 0.02);
  } catch { /* son indisponible */ }
}
const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
export function playFx(k: Fx, sound = true) {
  const d = FX[k]; if (!d) return;
  if (sound) sfx(k);
  if (k === "shake") {
    try { navigator.vibrate?.([80, 40, 80, 40, 120]); } catch { /* ignoré */ }
    if (!reduced()) { const r = document.documentElement; r.classList.remove("shake"); void r.offsetWidth; r.classList.add("shake"); setTimeout(() => r.classList.remove("shake"), 900); }
    return;
  }
  if (reduced()) return;
  const long = k === "birthday"; const rise = k === "bubbles" || k === "fire" || k === "ghost" || k === "rocket" || k === "music"; const box = document.createElement("div"); box.className = "fxbox" + (rise ? " rise" : ""); box.setAttribute("aria-hidden", "true");
  for (let i = 0; i < (long ? 60 : 34); i++) { const s = document.createElement("span"); s.textContent = d.em[i % d.em.length]; s.style.left = Math.random() * 100 + "%"; s.style.animationDelay = Math.random() * (long ? 5 : 0.9) + "s"; s.style.fontSize = 18 + Math.random() * 22 + "px"; s.style.animationDuration = 2 + Math.random() * 1.6 + "s"; box.appendChild(s); }
  document.body.appendChild(box); setTimeout(() => box.remove(), long ? 9500 : 4200);
}

/** Effet personnalisé : l'image de la personne tombe à l'écran et son enregistrement (3 s max) est joué. */
export function playCustom(c: { img?: string; audio?: string; name?: string }, sound = true) {
  if (sound && c.audio) { try { const a = new Audio(c.audio); a.volume = 1; void a.play(); } catch { /* son indisponible */ } }
  if (reduced()) return;
  const box = document.createElement("div"); box.className = "fxbox"; box.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 22; i++) { const s = document.createElement(c.img ? "img" : "span"); if (c.img) { (s as HTMLImageElement).src = c.img; s.style.width = 30 + Math.random() * 30 + "px"; s.style.height = s.style.width; s.style.objectFit = "cover"; s.style.borderRadius = "50%"; } else s.textContent = "🎙"; s.style.position = "absolute"; s.style.left = Math.random() * 100 + "%"; s.style.animationDelay = Math.random() * 0.8 + "s"; s.style.animationDuration = 2 + Math.random() * 1.4 + "s"; box.appendChild(s); }
  document.body.appendChild(box); setTimeout(() => box.remove(), 4200);
}
