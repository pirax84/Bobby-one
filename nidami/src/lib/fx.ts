// Effets de conversation : idée classique des messageries, réalisée ici avec nos propres animations et des sons synthétisés (aucun fichier ni nom d'une marque existante).
export type Fx = "shake" | "confetti" | "hearts" | "kiss" | "snow" | "fireworks" | "ghost" | "fire" | "bubbles" | "party" | "rain" | "thunder" | "rocket" | "clap" | "laugh" | "music" | "money" | "bomb" | "birthday" | "burp" | "fart" | "vomit";
type Def = { label: string; text: string; em: string[]; file?: string };
export const FX: Record<Fx, Def> = {
  shake: { label: "📳 Secousse", text: "📳 Secousse !", em: [], file: "./sounds/secousse.mp3" },
  confetti: { label: "🎉 Confettis", text: "🎉 Confettis !", em: ["🎉", "🎊", "✨", "⭐"] },
  hearts: { label: "❤️ Cœurs", text: "❤️ Pluie de cœurs !", em: ["❤️", "💕", "💖", "💗"], file: "./sounds/hearts.mp3" },
  kiss: { label: "😘 Bisous", text: "😘 Gros bisous !", em: ["💋", "😘", "💋", "😚", "💋", "😗", "💋", "😙"], file: "./sounds/kiss.mp3" },
  snow: { label: "❄️ Neige", text: "❄️ Il neige !", em: ["❄️", "❅", "❆", "⛄"], file: "./sounds/snow.mp3" },
  fireworks: { label: "🎆 Feu d'artifice", text: "🎆 Feu d'artifice !", em: ["🎆", "🎇", "✨", "💥"], file: "./sounds/fireworks.mp3" },
  ghost: { label: "👻 Fantôme", text: "👻 Bouh !", em: ["👻", "🎃", "🦇", "💀"], file: "./sounds/ghost.mp3" },
  fire: { label: "🔥 Flammes", text: "🔥 Ça chauffe !", em: ["🔥", "🔥", "🧨", "☄️"], file: "./sounds/fire.mp3" },
  bubbles: { label: "🫧 Bulles", text: "🫧 Des bulles !", em: ["🫧", "💧", "🐠", "🐳"], file: "./sounds/bubbles.mp3" },
  party: { label: "🎂 Fête", text: "🎂 C'est la fête !", em: ["🎂", "🎈", "🎁", "🥳"], file: "./sounds/party.mp3" },
  rain: { label: "🌧️ Pluie", text: "🌧️ Il pleut !", em: ["💧", "🌧️", "💦", "☔"], file: "./sounds/rain.mp3" },
  thunder: { label: "⛈️ Orage", text: "⛈️ Coup de tonnerre !", em: ["⚡", "⛈️", "🌩️", "⚡"], file: "./sounds/thunder.mp3" },
  rocket: { label: "🚀 Fusée", text: "🚀 Décollage !", em: ["🚀", "🌟", "💫", "🛸"], file: "./sounds/fusee.mp3" },
  clap: { label: "👏 Bravo", text: "👏 Bravo !", em: ["👏", "🙌", "👏", "🌟"], file: "./sounds/bravo.mp3" },
  laugh: { label: "😂 Fou rire", text: "😂 Mort de rire !", em: ["😂", "🤣", "😆", "😹"], file: "./sounds/fourire.mp3" },
  music: { label: "🎵 Musique", text: "🎵 On met l'ambiance !", em: ["🎵", "🎶", "🎸", "🎤"] },
  money: { label: "💰 Jackpot", text: "💰 Jackpot !", em: ["💰", "🪙", "💎", "🤑"], file: "./sounds/jackpot.mp3" },
  bomb: { label: "💣 Boum", text: "💣 Boum !", em: ["💣", "💥", "🔥", "💨"], file: "./sounds/boum.mp3" },
  birthday: { label: "🎂 Anniversaire", text: "🎂 Joyeux anniversaire !", em: ["🎂", "🎈", "🎁", "🥳", "🎉", "🎈"] },
  burp: { label: "🤭 Rot", text: "🤭 Burp !", em: ["🤭", "🥴", "💨", "🍺"], file: "./sounds/rot.mp3" },
  fart: { label: "💨 Pet", text: "💨 Prout !", em: [] },
  vomit: { label: "🤮 Vomi", text: "🤮 Beurk !", em: ["🤮", "🤢", "🤮", "🤢", "🟢", "🤮"], file: "./sounds/vomi.mp3" },
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
/** Voix plus naturelle : train d'impulsions de la glotte (avec petites irrégularités) passé dans 3 formants qui bougent (voyelles). */
function vox(c: AC, o: Out, t: number, dur: number, { f0, form, vol = 0.3, jit = 0.01, shim = 0.05, breath = 0, atk = 0.02, rel = 0.06 }: { f0: (u: number) => number; form: (u: number) => [number, number, number]; vol?: number; jit?: number; shim?: number; breath?: number; atk?: number; rel?: number }) {
  const sr = c.sampleRate, n = Math.ceil(dur * sr), buf = c.createBuffer(1, n, sr), d = buf.getChannelData(0); let ph = 0, amp = 1, per = 1, prev = 0;
  for (let i = 0; i < n; i++) { const u = i / n; if (ph >= 1 || i === 0) { ph = ph >= 1 ? ph - 1 : 0; per = 1 + (Math.random() * 2 - 1) * jit; amp = 1 + (Math.random() * 2 - 1) * shim; }
    ph += (f0(u) * per) / sr; const q = ph; const g = q < 0.4 ? 0.5 * (1 - Math.cos((Math.PI * q) / 0.4)) : q < 0.56 ? Math.cos((Math.PI / 2) * ((q - 0.4) / 0.16)) : 0; d[i] = (g - prev) * 14 * amp; prev = g; }
  const src = c.createBufferSource(); src.buffer = buf; const out = c.createGain(); out.gain.setValueAtTime(0.0001, t); out.gain.linearRampToValueAtTime(vol, t + atk); out.gain.setValueAtTime(vol, t + Math.max(atk, dur - rel)); out.gain.linearRampToValueAtTime(0.0001, t + dur); out.connect(o);
  const nz = breath > 0 ? c.createBufferSource() : null; if (nz) nz.buffer = noiseBuf(c);
  const bw = [90, 120, 170], gn = [1, 0.7, 0.4];
  for (let k = 0; k < 3; k++) { const f = c.createBiquadFilter(); f.type = "bandpass"; const F0 = form(0)[k]; f.frequency.setValueAtTime(F0, t); f.Q.value = F0 / bw[k]; for (let j = 1; j <= 10; j++) f.frequency.linearRampToValueAtTime(form(j / 10)[k], t + (dur * j) / 10); const g = c.createGain(); g.gain.value = gn[k]; src.connect(f); f.connect(g); g.connect(out); if (nz) { const ng = c.createGain(); ng.gain.value = breath * 0.5; nz.connect(f); f.connect(ng); ng.connect(out); } }
  src.start(t); src.stop(t + dur + 0.02); if (nz) { nz.start(t); nz.stop(t + dur + 0.02); }
}
const pent = [72, 74, 76, 79, 81, 84, 86, 88];
const SFX: Record<Fx, (c: AC, o: Out, t: number) => void> = {
  // Secousse : cloche grave qui « vibre » + roulement métallique (esprit des vieilles messageries, mais notre propre son)
  shake: (c, o, t) => { for (let i = 0; i < 6; i++) { bell(c, o, i % 2 ? 62 : 67, t + i * 0.085, 0.5, 0.11); } air(c, o, t, 0.6, { f0: 3000, f1: 800, q: 2, vol: 0.12 }); bell(c, o, 55, t + 0.55, 1.4, 0.14); },
  confetti: (c, o, t) => { air(c, o, t, 0.12, { type: "highpass", f0: 2000, f1: 2000, vol: 0.35 }); [72, 76, 79, 84, 88, 91].forEach((n, i) => bell(c, o, n, t + 0.06 + i * 0.07, 1.1, 0.09)); },
  hearts: (c, o, t) => { [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => harp(c, o, n, t + i * 0.09, 1.4, 0.12)); note(c, o, hz(48), t, 1.8, { vol: 0.08, partials: [1, 2], atk: 0.3 }); },
  kiss: (c, o, t) => { [[0, 1], [0.5, 0.75]].forEach(([d, v], i) => { const T = t + d;
      const x = c.createOscillator(), g = c.createGain(); x.frequency.setValueAtTime(420, T); x.frequency.exponentialRampToValueAtTime(1500, T + 0.09); g.gain.setValueAtTime(0.0001, T); g.gain.linearRampToValueAtTime(0.09 * v, T + 0.04); g.gain.linearRampToValueAtTime(0.0001, T + 0.1); x.connect(g); g.connect(o); x.start(T); x.stop(T + 0.12); // succion des lèvres
      air(c, o, T + 0.09, 0.08, { f0: 1100, f1: 380, q: 6, vol: 1.0 * v }); air(c, o, T + 0.09, 0.03, { type: "lowpass", f0: 2200, vol: 0.7 * v }); // le « pop » des lèvres
      vox(c, o, T + 0.14, 0.2, { f0: (u) => 250 + 90 * u + i * 20, form: (u) => [320 + 480 * u, 800 + 400 * u, 2500], vol: 0.3 * v, jit: 0.01, shim: 0.05, breath: 0.1, atk: 0.03, rel: 0.1 }); }); },
  snow: (c, o, t) => { [0, 2, 4, 1, 5, 3, 6, 7].forEach((k, i) => bell(c, o, pent[k] + 12, t + i * 0.12, 1.6, 0.06)); note(c, o, hz(60), t, 2.2, { vol: 0.05, atk: 0.5 }); },
  fireworks: (c, o, t) => { [0, 1.4, 2.7].forEach((d, k) => { const w = c.createOscillator(), g = c.createGain(); w.frequency.setValueAtTime(600 + k * 150, t + d); w.frequency.exponentialRampToValueAtTime(2600, t + d + 0.45); g.gain.setValueAtTime(0.0001, t + d); g.gain.linearRampToValueAtTime(0.06, t + d + 0.08); g.gain.linearRampToValueAtTime(0.0001, t + d + 0.46); w.connect(g); g.connect(o); w.start(t + d); w.stop(t + d + 0.5);
      air(c, o, t + d + 0.46, 0.7, { type: "lowpass", f0: 900, f1: 80, vol: 0.55 }); air(c, o, t + d + 0.46, 0.06, { type: "highpass", f0: 2000, vol: 0.7 }); for (let i = 0; i < 12; i++) air(c, o, t + d + 0.55 + Math.random() * 0.7, 0.03, { type: "highpass", f0: 3000 + Math.random() * 2000, vol: 0.25 }); });
    for (let i = 0; i < 26; i++) { const d = 2.9 + i * 0.045 + Math.random() * 0.03; air(c, o, t + d, 0.04, { type: "bandpass", f0: 1800 + Math.random() * 2200, q: 0.8, vol: 0.5 }); } air(c, o, t + 4.1, 0.5, { type: "lowpass", f0: 600, f1: 60, vol: 0.5 }); },
  ghost: (c, o, t) => { voice(c, o, t, 1.5, 330, 520, [350, 900], [800, 2000], { vol: 0.4, vib: 6, vibAmt: 0.04, atk: 0.25 }); voice(c, o, t + 0.5, 1.7, 220, 330, [300, 700], [700, 1500], { vol: 0.3, vib: 4.5, vibAmt: 0.05, atk: 0.3 }); air(c, o, t, 2, { f0: 400, f1: 200, q: 0.5, vol: 0.05, curve: "lin" }); },
  fire: (c, o, t) => { air(c, o, t, 1.6, { type: "lowpass", f0: 600, f1: 300, vol: 0.28, atk: 0.2, curve: "lin" }); for (let i = 0; i < 22; i++) air(c, o, t + Math.random() * 1.5, 0.03 + Math.random() * 0.03, { type: "bandpass", f0: 1500 + Math.random() * 3500, q: 3, vol: 0.18 + Math.random() * 0.15 }); air(c, o, t, 0.5, { f0: 400, f1: 1800, q: 0.7, vol: 0.2 }); },
  bubbles: (c, o, t) => { for (let i = 0; i < 16; i++) { const d = i * 0.15 + Math.random() * 0.1, f = 380 + Math.random() * 700, L = 0.05 + Math.random() * 0.06; const x = c.createOscillator(), g = c.createGain(); x.frequency.setValueAtTime(f, t + d); x.frequency.exponentialRampToValueAtTime(f * 2.6, t + d + L); g.gain.setValueAtTime(0.0001, t + d); g.gain.linearRampToValueAtTime(0.22, t + d + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + d + L + 0.03); x.connect(g); g.connect(o); x.start(t + d); x.stop(t + d + L + 0.05);
      if (i % 3 === 0) air(c, o, t + d + L, 0.02, { type: "highpass", f0: 3500, vol: 0.18 }); } },
  party: (c, o, t) => { [[60, 0], [60, 0.14], [64, 0.28], [67, 0.42], [72, 0.6]].forEach(([n, d]) => brass(c, o, n, t + d, d > 0.5 ? 0.7 : 0.16, 0.1)); air(c, o, t + 0.62, 0.12, { type: "highpass", f0: 2500, vol: 0.3 }); [72, 76, 79, 84].forEach((n, i) => bell(c, o, n, t + 0.7 + i * 0.06, 1, 0.07)); },
  rain: (c, o, t) => { air(c, o, t, 2.2, { type: "highpass", f0: 3500, f1: 3500, vol: 0.14, atk: 0.4, curve: "lin" }); air(c, o, t, 2.2, { type: "bandpass", f0: 1200, q: 0.4, vol: 0.08, atk: 0.4, curve: "lin" }); for (let i = 0; i < 9; i++) bell(c, o, 84 + Math.floor(Math.random() * 12), t + Math.random() * 2, 0.35, 0.04); },
  thunder: (c, o, t) => { air(c, o, t, 0.1, { type: "highpass", f0: 1200, vol: 0.8 }); air(c, o, t + 0.04, 0.5, { type: "bandpass", f0: 900, f1: 200, q: 0.6, vol: 0.5 });
    for (let i = 0; i < 7; i++) { const d = 0.25 + i * 0.5 + Math.random() * 0.3; air(c, o, t + d, 1.2 + Math.random() * 1.5, { type: "lowpass", f0: 260 - i * 15, f1: 45, q: 0.8, vol: 0.55 - i * 0.04, atk: 0.12 + Math.random() * 0.2 }); }
    air(c, o, t + 0.2, 4.5, { type: "bandpass", f0: 120, f1: 60, q: 0.4, vol: 0.25, atk: 0.8, curve: "lin" }); air(c, o, t + 0.5, 4, { type: "highpass", f0: 4000, vol: 0.05, atk: 1, curve: "lin" }); },
  rocket: (c, o, t) => { air(c, o, t, 1.6, { type: "lowpass", f0: 250, f1: 2400, vol: 0.45, atk: 0.3, curve: "lin" }); air(c, o, t, 1.6, { f0: 600, f1: 5000, q: 1.2, vol: 0.2, atk: 0.4, curve: "lin" }); note(c, o, 90, t, 1.5, { vol: 0.12, type: "sawtooth", glide: 0.6 }); },
  clap: (c, o, t) => { for (let i = 0; i < 16; i++) { const d = i * 0.07 + Math.random() * 0.05; air(c, o, t + d, 0.06, { f0: 1400 + Math.random() * 1200, q: 0.9, vol: 0.28 }); air(c, o, t + d + 0.02, 0.04, { f0: 2600, q: 1.5, vol: 0.14 }); } },
  // Rire : voix claire et aiguë, syllabes « ha » courtes et rythmées, légèrement montantes puis descendantes, avec une petite inspiration
  laugh: (c, o, t) => { air(c, o, t, 0.22, { f0: 1000, f1: 2200, q: 0.8, vol: 0.09, atk: 0.15, curve: "lin" });
    for (let i = 0; i < 9; i++) { const d = 0.3 + i * 0.2 + i * i * 0.004, base = 300 + (i < 3 ? i * 18 : -(i - 2) * 16), a = i % 2 ? [880, 1500, 2900] : [760, 1250, 2800];
      air(c, o, t + d - 0.03, 0.05, { f0: 2200, q: 0.9, vol: 0.12 }); vox(c, o, t + d, 0.13, { f0: (u) => base * (1.06 - 0.12 * u), form: (u) => [a[0] - 40 * u, a[1], a[2]] as [number, number, number], vol: 0.8 - i * 0.03, jit: 0.012, shim: 0.08, breath: 0.1, atk: 0.012, rel: 0.06 }); }
    vox(c, o, t + 2.3, 0.7, { f0: (u) => 310 - 80 * u + 4 * Math.sin(u * 50), form: (u) => [820 - 100 * u, 1350 - 200 * u, 2800], vol: 0.6, jit: 0.012, shim: 0.08, breath: 0.15, atk: 0.04, rel: 0.35 }); },
  music: (c, o, t) => { [[67, 0], [71, 0.2], [74, 0.4], [79, 0.6], [76, 0.9], [72, 1.1], [74, 1.3], [79, 1.5]].forEach(([n, d]) => piano(c, o, n, t + d, 0.9, 0.14)); [43, 47, 50].forEach((n, i) => note(c, o, hz(n), t + i * 0.5, 1.2, { vol: 0.1, type: "triangle", partials: [1, 2] })); },
  money: (c, o, t) => { air(c, o, t, 0.04, { f0: 3000, vol: 0.3 }); bell(c, o, 88, t + 0.05, 1.6, 0.14); bell(c, o, 95, t + 0.2, 1.8, 0.14); for (let i = 0; i < 6; i++) bell(c, o, 100 + (i % 3), t + 0.45 + i * 0.05, 0.4, 0.05); },
  bomb: (c, o, t) => { const w = c.createOscillator(), g = c.createGain(); w.frequency.setValueAtTime(2400, t); w.frequency.exponentialRampToValueAtTime(220, t + 0.9); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.06, t + 0.05); g.gain.linearRampToValueAtTime(0.0001, t + 0.92); w.connect(g); g.connect(o); w.start(t); w.stop(t + 0.95);
    const T = t + 0.92; air(c, o, T, 0.12, { type: "highpass", f0: 800, vol: 1 }); air(c, o, T, 2.4, { type: "lowpass", f0: 1400, f1: 40, q: 0.6, vol: 1.1, atk: 0.005 }); note(c, o, 90, T, 1.6, { vol: 0.5, glide: 0.1 }); note(c, o, 45, T, 1.8, { vol: 0.5 });
    for (let i = 0; i < 18; i++) air(c, o, T + 0.3 + Math.random() * 1.4, 0.05, { type: "bandpass", f0: 600 + Math.random() * 2500, q: 1, vol: 0.2 }); },
  // Rot : un seul « grondement » grave, rauque, sans bruit liquide
  burp: (c, o, t) => { air(c, o, t, 0.06, { f0: 500, f1: 250, q: 1.5, vol: 0.25 });
    vox(c, o, t + 0.03, 0.75, { f0: (u) => 78 - 28 * u, form: (u) => [520 - 60 * u, 900 - 120 * u, 2300], vol: 1.1, jit: 0.16, shim: 0.4, breath: 0.12, atk: 0.03, rel: 0.3 });
    vox(c, o, t + 0.05, 0.7, { f0: (u) => 156 - 56 * u, form: (u) => [500, 850, 2200], vol: 0.25, jit: 0.2, shim: 0.4, atk: 0.03, rel: 0.3 }); },
  fart: (c, o, t) => { const osc = c.createOscillator(); osc.type = "sawtooth"; let f = 120; osc.frequency.setValueAtTime(f, t); for (let i = 1; i < 60; i++) { f = Math.max(45, f * (0.97 + Math.random() * 0.045) + (i > 45 ? 3 : 0)); osc.frequency.setValueAtTime(f * (i % 2 ? 1 : 0.92), t + i * 0.018); }
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 650; lp.Q.value = 4; const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.5, t + 0.04); g.gain.setValueAtTime(0.5, t + 0.85); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.15); osc.connect(lp); lp.connect(g); g.connect(o); osc.start(t); osc.stop(t + 1.2); air(c, o, t, 1.1, { type: "bandpass", f0: 300, q: 2, vol: 0.25, curve: "lin" }); note(c, o, 700, t + 1.05, 0.1, { vol: 0.07, glide: 0.4 }); },
  // Vomi : inspiration, deux haut-le-cœur aigus et tendus, puis un « beuuurgh » mouillé avec gargouillis et éclaboussures, et un gémissement
  vomit: (c, o, t) => { air(c, o, t, 0.35, { f0: 700, f1: 1700, q: 0.7, vol: 0.14, atk: 0.25, curve: "lin" });
    [0.45, 0.85].forEach((d, k) => vox(c, o, t + d, 0.28, { f0: (u) => 210 - 40 * u - k * 10, form: (u) => [500 + 250 * u, 1500 - 300 * u, 2600], vol: 0.55, jit: 0.07, shim: 0.3, breath: 0.45, atk: 0.04, rel: 0.1 }));
    vox(c, o, t + 1.35, 1.1, { f0: (u) => 230 - 100 * u, form: (u) => [500 + 350 * Math.sin(u * 3), 1500 - 500 * u, 2500], vol: 0.8, jit: 0.07, shim: 0.2, breath: 0.4, atk: 0.07, rel: 0.3 });
    const g = c.createGain(); g.gain.value = 0.6; const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.setValueAtTime(18, t + 1.35); lfo.frequency.linearRampToValueAtTime(30, t + 2.7); lg.gain.value = 0.45; lfo.connect(lg); lg.connect(g.gain); const src = c.createBufferSource(); src.buffer = noiseBuf(c); const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.setValueAtTime(1800, t + 1.35); f.frequency.linearRampToValueAtTime(500, t + 2.7); f.Q.value = 1.2; src.connect(f); f.connect(g); g.connect(o); src.start(t + 1.35); src.stop(t + 2.8); lfo.start(t + 1.35); lfo.stop(t + 2.8);
    for (let i = 0; i < 12; i++) { const d = 1.5 + i * 0.1 + Math.random() * 0.05; air(c, o, t + d, 0.12, { type: "bandpass", f0: 1300 + Math.random() * 1200, f1: 300 + Math.random() * 150, q: 5, vol: 0.4 }); }
    air(c, o, t + 2.65, 0.12, { f0: 2400, q: 0.8, vol: 0.2 }); vox(c, o, t + 2.8, 0.7, { f0: (u) => 190 - 50 * u, form: (u) => [450, 900 - 150 * u, 2400], vol: 0.4, jit: 0.04, shim: 0.15, breath: 0.3, atk: 0.1, rel: 0.3 }); },
} as Record<Fx, (c: AC, o: Out, t: number) => void>;
// Mélodie traditionnelle « Joyeux anniversaire » (domaine public), jouée au piano avec une basse douce : environ 7 secondes.
const BDAY: [number, number][] = [[67, .75], [67, .25], [69, 1], [67, 1], [72, 1], [71, 2], [67, .75], [67, .25], [69, 1], [67, 1], [74, 1], [72, 2], [67, .75], [67, .25], [79, 1], [76, 1], [72, 1], [71, 1], [69, 2], [77, .75], [77, .25], [76, 1], [72, 1], [74, 1], [72, 2]];
SFX.birthday = (c, o, t) => { const B = 0.28; let x = 0; BDAY.forEach(([n, d], i) => { piano(c, o, n, t + x * B, d * B * 2.2, 0.16); if (i % 3 === 0) note(c, o, hz(n - 24), t + x * B, 0.9, { vol: 0.07, type: "triangle", partials: [1, 2] }); x += d; });
  [72, 76, 79, 84].forEach((n, i) => bell(c, o, n, t + x * B + i * 0.07, 1.4, 0.09)); air(c, o, t + x * B, 0.12, { type: "highpass", f0: 2500, vol: 0.3 }); };
let ctx: AudioContext | null = null;
/** Joue le bruitage de l'effet (volume modéré). */
export function sfx(k: Fx, target?: BaseAudioContext, noFile = false) {
  const file = FX[k]?.file; if (file && !target && !noFile) { try { const a = new Audio(file); a.volume = 1; a.play().catch(() => sfx(k, undefined, true)); return; } catch { /* repli sur le son synthétisé */ } }
  try {
    const c = target || (ctx ||= new (window.AudioContext || (window as any).webkitAudioContext)()); if ((c as AudioContext).state === "suspended") void (c as AudioContext).resume();
    const master = c.createGain(); master.gain.value = 0.9; const comp = c.createDynamicsCompressor(); master.connect(comp); comp.connect(c.destination); SFX[k](c, master, c.currentTime + 0.02);
  } catch { /* son indisponible */ }
}

// ───────── Sonneries propres à l'application (notifications et appels) : sons doux et mélodieux
export interface Tone { label: string; kind: "n" | "c"; len: number; play: (c: AC, o: Out, t: number) => void }
const soft = (c: AC, o: Out, n: number, t: number, d = 0.9, vol = 0.12) => { note(c, o, hz(n), t, d, { vol, type: "sine", partials: [1, 2, 3], atk: 0.006 }); note(c, o, hz(n) * 2.003, t, d * 0.6, { vol: vol * 0.25 }); };
export const TONES: Record<string, Tone> = {
  n1: { label: "Cristal", kind: "n", len: 1.6, play: (c, o, t) => { bell(c, o, 88, t, 1.5, 0.14); bell(c, o, 95, t + 0.16, 1.7, 0.12); } },
  n2: { label: "Aurore", kind: "n", len: 1.4, play: (c, o, t) => { [79, 83, 86, 91].forEach((n, i) => soft(c, o, n, t + i * 0.09, 0.9, 0.13)); } },
  n3: { label: "Brise", kind: "n", len: 1.8, play: (c, o, t) => { [72, 76, 79, 84, 88].forEach((n, i) => harp(c, o, n, t + i * 0.07, 1.3, 0.11)); } },
  n4: { label: "Lueur", kind: "n", len: 1.6, play: (c, o, t) => { [(88), 91, 88, 96].forEach((n, i) => bell(c, o, n, t + i * 0.13, 1.1, 0.09)); } },
  c1: { label: "Rivage", kind: "c", len: 3.2, play: (c, o, t) => { [[72, 0], [76, 0.3], [79, 0.6], [76, 0.9], [81, 1.2], [79, 1.5], [76, 1.8], [74, 2.1]].forEach(([n, d]) => soft(c, o, n, t + d, 1.1, 0.16)); [48, 52, 55].forEach((n, i) => note(c, o, hz(n), t + i * 1.0, 1.4, { vol: 0.08, type: "triangle", partials: [1, 2] })); } },
  c2: { label: "Cercle", kind: "c", len: 3.0, play: (c, o, t) => { [[84, 0], [88, 0.25], [91, 0.5], [96, 0.75], [91, 1.25], [88, 1.5], [84, 1.75], [79, 2.0]].forEach(([n, d]) => bell(c, o, n, t + d, 1.3, 0.11)); [60, 67, 64].forEach((n, i) => harp(c, o, n, t + i * 0.85, 1.6, 0.1)); } },
  c3: { label: "Matin", kind: "c", len: 3.0, play: (c, o, t) => { [[67, 0], [74, 0.2], [79, 0.4], [74, 0.6], [69, 0.9], [76, 1.1], [81, 1.3], [76, 1.5], [71, 1.8], [78, 2.0], [83, 2.2], [79, 2.5]].forEach(([n, d]) => harp(c, o, n, t + d, 0.9, 0.12)); } },
};
export const TONE_IDS = { n: Object.keys(TONES).filter((k) => TONES[k].kind === "n"), c: Object.keys(TONES).filter((k) => TONES[k].kind === "c") };
/** Joue une sonnerie ; `times` répétitions (appels). */
export function playTone(id: string, times = 1) {
  const d = TONES[id]; if (!d) return;
  try { const c = (ctx ||= new (window.AudioContext || (window as any).webkitAudioContext)()); if (c.state === "suspended") void c.resume(); const master = c.createGain(); master.gain.value = 0.9; const comp = c.createDynamicsCompressor(); master.connect(comp); comp.connect(c.destination); for (let i = 0; i < times; i++) d.play(c, master, c.currentTime + 0.03 + i * (d.len + 0.5)); } catch { /* son indisponible */ }
}
/** Dans l'application Android : vibre vraiment au maximum (force 255) ; sinon, motif standard du navigateur. */
export const buzz = (pat: number[], amp = 255) => { try { const n = (window as any).CercleNative; if (n?.vibrate) { n.vibrate(pat.join(","), amp); return; } navigator.vibrate?.(pat); } catch { /* ignoré */ } };
/** Niveaux de vibration réglables (messages, appels). La secousse, elle, vibre toujours au maximum. */
export const VIB_LEVELS: { id: string; label: string; pat: number[] }[] = [
  { id: "0", label: "Aucune", pat: [] }, { id: "1", label: "Légère", pat: [80] }, { id: "2", label: "Moyenne", pat: [180, 90, 180] }, { id: "3", label: "Forte", pat: [450, 80, 450, 80, 450] },
];
export const vibrate = (level?: string, repeat = 1) => { try { const l = VIB_LEVELS.find((x) => x.id === level) || VIB_LEVELS[2]; if (!l.pat.length) return; const pat: number[] = []; for (let i = 0; i < repeat; i++) pat.push(...l.pat, ...(i < repeat - 1 ? [600] : [])); buzz(pat, l.id === "1" ? 90 : l.id === "2" ? 170 : 255); } catch { /* ignoré */ } };
const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
export function playFx(k: Fx, sound = true) {
  const d = FX[k]; if (!d) return;
  if (sound) sfx(k);
  if (k === "shake") {
    buzz([500, 40, 500, 40, 500, 40, 500, 40, 500], 255);
    if (!reduced()) { const r = document.documentElement; r.classList.remove("shake"); void r.offsetWidth; r.classList.add("shake"); setTimeout(() => r.classList.remove("shake"), 2400); }
    return;
  }
  if (k === "birthday") { buzz([200, 100, 200, 100, 400, 200, 200, 100, 200, 100, 400, 200, 200, 100, 400, 100, 400], 255); }
  if (reduced()) return;
  const long = k === "birthday" || k === "vomit"; const smoke = k === "fart"; const rise = k === "bubbles" || k === "fire" || k === "ghost" || k === "rocket" || k === "music" || smoke; const box = document.createElement("div"); box.className = "fxbox" + (rise ? " rise" : ""); box.setAttribute("aria-hidden", "true");
  for (let i = 0; i < (long ? 60 : 34); i++) { const s = document.createElement("span"); if (smoke) { s.className = "smoke"; const z = 90 + Math.random() * 140; s.style.width = z + "px"; s.style.height = z + "px"; } else s.textContent = d.em[i % d.em.length]; s.style.left = Math.random() * 100 + "%"; s.style.animationDelay = Math.random() * (long ? 5 : d.file ? 2.4 : 0.9) + "s"; s.style.fontSize = 18 + Math.random() * 22 + "px"; s.style.animationDuration = 2 + Math.random() * 1.6 + "s"; box.appendChild(s); }
  if (k === "vomit" && !reduced()) { // liquide vert qui coule du haut de l'écran
    const top = document.createElement("div"); top.className = "slime-top"; box.appendChild(top);
    for (let i = 0; i < 16; i++) { const dr = document.createElement("div"); dr.className = "drip"; const w = 18 + Math.random() * 38; dr.style.left = i * 6.3 + Math.random() * 3 + "%"; dr.style.width = w + "px"; dr.style.setProperty("--h", 14 + Math.random() * 42 + "vh"); dr.style.animationDelay = 0.6 + Math.random() * 1.8 + "s"; box.appendChild(dr); } }
  document.body.appendChild(box); setTimeout(() => box.remove(), long ? 9500 : d.file ? 6800 : 4200);
}

/** Effet personnalisé : l'image de la personne tombe à l'écran et son enregistrement (3 s max) est joué. */
export function playCustom(c: { img?: string; audio?: string; name?: string }, sound = true) {
  if (sound && c.audio) { try { const a = new Audio(c.audio); a.volume = 1; void a.play(); } catch { /* son indisponible */ } }
  if (reduced()) return;
  const box = document.createElement("div"); box.className = "fxbox"; box.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 22; i++) { const s = document.createElement(c.img ? "img" : "span"); if (c.img) { (s as HTMLImageElement).src = c.img; s.style.width = 30 + Math.random() * 30 + "px"; s.style.height = s.style.width; s.style.objectFit = "cover"; s.style.borderRadius = "50%"; } else s.textContent = "🎙"; s.style.position = "absolute"; s.style.left = Math.random() * 100 + "%"; s.style.animationDelay = Math.random() * 0.8 + "s"; s.style.animationDuration = 2 + Math.random() * 1.4 + "s"; box.appendChild(s); }
  document.body.appendChild(box); setTimeout(() => box.remove(), 4200);
}
