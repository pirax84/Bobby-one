import { t } from "../i18n";
// Effets de conversation : idée classique des messageries, réalisée ici avec nos propres animations et des sons synthétisés (aucun fichier ni nom d'une marque existante).
export type Fx = "shake" | "hearts" | "kiss" | "snow" | "fireworks" | "ghost" | "fire" | "bubbles" | "party" | "rain" | "thunder" | "rocket" | "clap" | "laugh" | "money" | "bomb" | "tornado" | "fog" | "knock" | "bell" | "birthday" | "bd1" | "bd2" | "bd3" | "bd4" | "bd5" | "bd6" | "bdall" | "burp" | "fart" | "vomit" | "noel1" | "easter" | "noelv1" | "noelv2" | "noelv3" | "absent";
import { sceneShow, holidayShow, SCENES, type Scene } from "./scenes";
import { tornadoShow, tornadoStop } from "./tornado";
import { fogShow, fogStop } from "./fog";
import { doorShow } from "./door";
import { absentShow, absentStop } from "./absent";
import { collapseStop } from "./collapse";
import { devHidden, soundFor, sndMapOf } from "./dev";
import { noelVideoShow, noelVideoStop, NOEL_VIDEOS } from "./noelvideo";
import { bdayShow, bdayStop, BD_DUR } from "./bdfx";
const playing: HTMLAudioElement[] = [];
const track = (a: HTMLAudioElement) => { playing.push(a); a.addEventListener("ended", () => { const i = playing.indexOf(a); if (i >= 0) playing.splice(i, 1); }); return a; };
/** Arrête l'effet en cours (son et décor) : un seul effet à la fois, sauf « Tout en même temps ». */
/** Sortie commune des sons synthétisés d'effets : on la coupe d'un coup pour tout arrêter. */
let bus: GainNode | null = null;
const fxBus = (c: BaseAudioContext): AudioNode => { if (!bus || bus.context !== c) { bus = c.createGain(); bus.connect(c.destination); } return bus; };
let curKey: Fx | null = null; let curAt = 0; let curIv = 0;
export const playingFx = (): Fx | null => curKey;
const setCur = (k: Fx | null) => { curKey = k; curAt = Date.now(); window.dispatchEvent(new Event("notiif-fxstate")); clearInterval(curIv); if (k) curIv = window.setInterval(() => { if (Date.now() - curAt > 1800 && !document.querySelector(".fxbox") && !document.documentElement.classList.contains("collapsing")) { curKey = null; clearInterval(curIv); window.dispatchEvent(new Event("notiif-fxstate")); } }, 400); };
export function stopFx() { if (curKey) setCur(null); try { bus?.disconnect(); } catch { /* ignoré */ } bus = null; document.getElementById("fxstop")?.remove(); playing.splice(0).forEach((a) => { try { a.pause(); } catch { /* ignoré */ } }); noelVideoStop(); absentStop(); tornadoStop(); fogStop(); collapseStop(); document.querySelectorAll(".fxbox").forEach((e) => e.remove()); bdayStop(); try { document.documentElement.classList.remove("shake"); } catch { /* ignoré */ } }
type Def = { label: string; sub?: string; text: string; em: string[]; file?: string };
export const FX: Record<Fx, Def> = {
  shake: { get label() { return t("📳 Secousse"); }, get text() { return t("📳 Secousse !"); }, em: [], file: "./sounds/secousse.mp3" },
  hearts: { get label() { return t("❤️ Cœurs"); }, get text() { return t("❤️ Pluie de cœurs !"); }, em: ["❤️", "💕", "💖", "💗"], file: "./sounds/hearts.mp3" },
  kiss: { get label() { return t("😘 Bisous"); }, get text() { return t("😘 Gros bisous !"); }, em: ["💋", "😘", "💋", "😚", "💋", "😗", "💋", "😙"], file: "./sounds/kiss.mp3" },
  snow: { get label() { return t("❄️ Neige"); }, get text() { return t("❄️ Il neige !"); }, em: ["❄️", "❅", "❆", "⛄"], file: "./sounds/snow.mp3" },
  fireworks: { get label() { return t("🎆 Feu d'artifice"); }, get text() { return t("🎆 Feu d'artifice !"); }, em: ["🎆", "🎇", "✨", "💥"], file: "./sounds/fireworks.mp3" },
  ghost: { get label() { return t("👻 Fantôme"); }, get text() { return t("👻 Bouh !"); }, em: ["👻", "🎃", "🦇", "💀"], file: "./sounds/ghost.mp3" },
  fire: { get label() { return t("🔥 Flammes"); }, get text() { return t("🔥 Ça chauffe !"); }, em: ["🔥", "🔥", "🧨", "☄️"], file: "./sounds/fire.mp3" },
  bubbles: { get label() { return t("🫧 Bulles"); }, get text() { return t("🫧 Des bulles !"); }, em: ["🫧", "💧", "🐠", "🐳"], file: "./sounds/bubbles.mp3" },
  party: { get label() { return t("🎉 Fête"); }, get text() { return t("🎉 C'est la fête !"); }, em: ["🎉", "🎊", "🥳", "🎈", "✨", "🪩"], file: "./sounds/party.mp3" },
  rain: { get label() { return t("🌧️ Pluie"); }, get text() { return t("🌧️ Il pleut !"); }, em: ["💧", "🌧️", "💦", "☔"], file: "./sounds/rain.mp3" },
  thunder: { get label() { return t("⛈️ Orage"); }, get text() { return t("⛈️ Coup de tonnerre !"); }, em: ["⚡", "⛈️", "🌩️", "⚡"], file: "./sounds/thunder.mp3" },
  rocket: { get label() { return t("🚀 Fusée"); }, get text() { return t("🚀 Décollage !"); }, em: ["🚀", "🌟", "💫", "🛸"], file: "./sounds/fusee.mp3" },
  clap: { get label() { return t("👏 Bravo"); }, get text() { return t("👏 Bravo !"); }, em: ["👏", "🙌", "👏", "🌟"], file: "./sounds/bravo.mp3" },
  laugh: { get label() { return t("😂 Fou rire"); }, get text() { return t("😂 Mort de rire !"); }, em: ["😂", "🤣", "😆", "😹"], file: "./sounds/fourire.mp3" },
  money: { get label() { return t("💰 Jackpot"); }, get text() { return t("💰 Jackpot !"); }, em: ["💰", "🪙", "💎", "🤑"], file: "./sounds/jackpot.mp3" },
  bomb: { get label() { return t("💣 Boum"); }, get text() { return t("💣 Boum !"); }, em: ["💣", "💥", "🔥", "💨"], file: "./sounds/boum.mp3" },
  tornado: { get label() { return t("🌪 Tornade"); }, get text() { return t("🌪 Tornade !"); }, em: ["🌪", "💨", "🍂", "📄"] },
  fog: { get label() { return t("🌫 Brouillard"); }, get text() { return t("🌫 Le brouillard tombe…"); }, em: ["🌫", "☁️"] },
  absent: { get label() { return t("🗣 Message d'absence"); }, get sub() { return t("voix : français / anglais"); }, get text() { return t("🗣 Je ne suis pas disponible"); }, em: ["🗣", "💤"] },
  knock: { get label() { return t("🚪 Toc toc toc"); }, get text() { return t("🚪 Toc toc toc !"); }, em: ["🚪", "✊"] },
  bell: { get label() { return t("🔔 Sonnette"); }, get text() { return t("🔔 Ding dong !"); }, em: ["🔔", "🏠"] },
  birthday: { get label() { return t("🎂 Anniversaire"); }, get text() { return t("🎂 Joyeux anniversaire !"); }, em: ["🎂", "🎈", "🎁", "🥳", "🎉", "🎈"] },
  bd1: { get label() { return t("🎈 Ballons d'anniversaire"); }, get text() { return t("🎈 Joyeux anniversaire !"); }, em: ["🎈"], file: "./sounds/anniv/bd1.mp3", get sub() { return t("21 s"); } },
  bd2: { get label() { return t("🎂 Gâteau et confettis"); }, get text() { return t("🎂 Joyeux anniversaire !"); }, em: ["🎂"], file: "./sounds/anniv/bd2.mp3", get sub() { return t("1 min 03"); } },
  bd3: { get label() { return t("🎁 Cadeaux d'anniversaire"); }, get text() { return t("🎁 Joyeux anniversaire !"); }, em: ["🎁"], file: "./sounds/anniv/bd3.mp3", get sub() { return t("19 s"); } },
  bd4: { get label() { return t("🕯️ Souffler les bougies"); }, get text() { return t("🕯️ Joyeux anniversaire !"); }, em: ["🎂"], file: "./sounds/anniv/bd4.mp3", get sub() { return t("boîte à musique · 22 s"); } },
  bd5: { get label() { return t("🧁 Gâteaux et étoiles"); }, get text() { return t("🧁 Joyeux anniversaire !"); }, em: ["🧁"], file: "./sounds/anniv/bd5.mp3", get sub() { return t("piano · 26 s"); } },
  bd6: { get label() { return t("🎉 Méga fête"); }, get text() { return t("🎉 Joyeux anniversaire !"); }, em: ["🎉"], file: "./sounds/anniv/bd6.mp3", get sub() { return t("1 min 05"); } },
  bdall: { get label() { return t("🤪 Tout en même temps"); }, get sub() { return t("rend fou !"); }, get text() { return t("🤪 Joyeux anniversaire à fond !"); }, em: ["🎂"], file: "./sounds/anniv/bdall.mp3" },
  burp: { get label() { return t("🤭 Rot"); }, get text() { return t("🤭 Burp !"); }, em: ["🤭", "🥴", "💨", "🍺"], file: "./sounds/rot.mp3" },
  fart: { get label() { return t("💨 Pet"); }, get text() { return t("💨 Prout !"); }, em: [] },
  vomit: { get label() { return t("🤮 Vomi"); }, get text() { return t("🤮 Beurk !"); }, em: ["🤮", "🤢", "🤮", "🤢", "🟢", "🤮"], file: "./sounds/vomi.mp3" },
  noel1: { get label() { return t("🎄 Noël · Père Noël dans le ciel"); }, get sub() { return t("chanson de Noël · 14 s"); }, get text() { return t("🎄 Joyeux Noël !"); }, em: ["🎄"] },
  noelv1: { get label() { return t("🎅 Noël · Père Noël au-dessus de la ville"); }, get sub() { return t("Jingle Bells · 25 s"); }, get text() { return t("🎄 Joyeux Noël !"); }, em: ["🎅"] },
  noelv3: { get label() { return t("🌌 Noël · Traîneau et aurores"); }, get sub() { return t("Noël magic · 16 s"); }, get text() { return t("🎄 Joyeux Noël !"); }, em: ["🎄"] },
  noelv2: { get label() { return t("🔥 Noël · Coin du feu"); }, get sub() { return t("Mon beau sapin · 12 s"); }, get text() { return t("🎄 Joyeux Noël !"); }, em: ["🎄"] },
  easter: { get label() { return t("🐣 Pâques"); }, get text() { return t("🐣 Joyeuses Pâques !"); }, em: ["🐣"] },
};
/** Les effets anniversaire ont leur propre catégorie ; « Tous les effets » ne les contient pas. */
export const BDAY_KEYS: Fx[] = ["birthday", "bd1", "bd2", "bd3", "bd4", "bd5", "bd6", "bdall"];
export const FX_ALL = Object.keys(FX) as Fx[];
export const NOEL_KEYS: Fx[] = ["noel1", "noelv1", "noelv2", "noelv3"];
export const FX_KEYS = FX_ALL.filter((k) => !BDAY_KEYS.includes(k) && !NOEL_KEYS.includes(k));
// ───────── Sons : synthèse « instrumentale » (cloches, harpe, voix, souffles…) — aucun fichier, aucun son d'une marque
type AC = BaseAudioContext; type Out = AudioNode;
const hz = (n: number) => 440 * Math.pow(2, (n - 69) / 12); // numéro de note MIDI → fréquence
const noiseBuf = (c: AC) => { const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; };
/** Une note : partiels (harmoniques) avec attaque et extinction naturelle. */
function note(c: AC, o: Out, f: number, tx: number, dur: number, { vol = 0.12, type = "sine" as OscillatorType, partials = [1], atk = 0.005, vib = 0, glide = 0 } = {}) {
  partials.forEach((p, i) => { const osc = c.createOscillator(), g = c.createGain(); osc.type = type; osc.frequency.setValueAtTime(f * p * (glide ? 1 - glide : 1), tx); if (glide) osc.frequency.exponentialRampToValueAtTime(f * p, tx + dur * 0.4);
    if (vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = vib; lg.gain.value = f * p * 0.02; l.connect(lg); lg.connect(osc.frequency); l.start(tx); l.stop(tx + dur + 0.1); }
    const v = vol / (i + 1); g.gain.setValueAtTime(0.0001, tx); g.gain.linearRampToValueAtTime(v, tx + atk); g.gain.exponentialRampToValueAtTime(0.0001, tx + dur); osc.connect(g); g.connect(o); osc.start(tx); osc.stop(tx + dur + 0.05); });
}
const bell = (c: AC, o: Out, n: number, tx: number, d = 1.2, vol = 0.1) => { const f = hz(n); [1, 2.76, 5.4, 8.9].forEach((p, i) => note(c, o, f * p, tx, d / (i * 0.8 + 1), { vol: vol / (i * 1.6 + 1) })); };
const harp = (c: AC, o: Out, n: number, tx: number, d = 1.1, vol = 0.14) => note(c, o, hz(n), tx, d, { vol, type: "triangle", partials: [1, 2, 3, 4], atk: 0.004 });
const piano = (c: AC, o: Out, n: number, tx: number, d = 0.9, vol = 0.14) => note(c, o, hz(n), tx, d, { vol, type: "triangle", partials: [1, 2, 3, 5], atk: 0.003 });
const brass = (c: AC, o: Out, n: number, tx: number, d = 0.4, vol = 0.1) => { const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.setValueAtTime(600, tx); f.frequency.linearRampToValueAtTime(2600, tx + 0.08); f.frequency.exponentialRampToValueAtTime(900, tx + d); f.connect(o); note(c, f, hz(n), tx, d, { vol, type: "sawtooth", partials: [1, 1.004], atk: 0.04 }); };
/** Bruit filtré (souffle, pluie, tonnerre, applaudissement…) avec balayage de fréquence. */
function air(c: AC, o: Out, tx: number, dur: number, { type = "bandpass" as BiquadFilterType, f0 = 1000, f1 = 1000, q = 1, vol = 0.2, atk = 0.01, curve = "exp" } = {}) {
  const src = c.createBufferSource(); src.buffer = noiseBuf(c); const f = c.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, tx); if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, tx + dur);
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, tx); g.gain.linearRampToValueAtTime(vol, tx + atk); if (curve === "exp") g.gain.exponentialRampToValueAtTime(0.0001, tx + dur); else { g.gain.setValueAtTime(vol, tx + dur * 0.7); g.gain.linearRampToValueAtTime(0.0001, tx + dur); }
  src.connect(f); f.connect(g); g.connect(o); src.start(tx); src.stop(tx + dur + 0.05);
}
/** Bruit qui dure tout le temps voulu (vent, brume) : boucle, monte doucement, ondule, puis s'éteint. */
function bed(c: AC, o: Out, tx: number, dur: number, { type = "bandpass" as BiquadFilterType, f0 = 300, f1 = 300, q = 0.7, vol = 0.2, atk = 2, rel = 1.5, lfo = 0.3, depth = 0.3 } = {}) {
  const src = c.createBufferSource(); const nb = c.createBuffer(1, c.sampleRate * 4, c.sampleRate), d = nb.getChannelData(0); let last = 0; for (let i = 0; i < d.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 6; } src.buffer = nb; src.loop = true;
  const f = c.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, tx); if (f1 !== f0) f.frequency.linearRampToValueAtTime(f1, tx + dur);
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, tx); g.gain.linearRampToValueAtTime(vol, tx + atk); g.gain.setValueAtTime(vol, tx + Math.max(atk, dur - rel)); g.gain.linearRampToValueAtTime(0.0001, tx + dur);
  const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = lfo; lg.gain.value = vol * depth; l.connect(lg); lg.connect(g.gain); l.start(tx); l.stop(tx + dur + 0.1);
  src.connect(f); f.connect(g); g.connect(o); src.start(tx); src.stop(tx + dur + 0.1);
}
/** Voix synthétique : source en dents de scie passée dans des filtres de voyelle qui bougent. */
function voice(c: AC, o: Out, tx: number, dur: number, f0: number, f1: number, v1: [number, number], v2: [number, number], { vol = 0.12, vib = 5, vibAmt = 0.03, atk = 0.08 } = {}) {
  const osc = c.createOscillator(); osc.type = "sawtooth"; osc.frequency.setValueAtTime(f0, tx); osc.frequency.linearRampToValueAtTime(f1, tx + dur * 0.55); osc.frequency.linearRampToValueAtTime(f0 * 0.85, tx + dur);
  const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = vib; lg.gain.value = f0 * vibAmt; l.connect(lg); lg.connect(osc.frequency); l.start(tx); l.stop(tx + dur + 0.1);
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, tx); g.gain.linearRampToValueAtTime(vol, tx + atk); g.gain.setValueAtTime(vol, tx + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, tx + dur);
  const mix = c.createGain(); mix.connect(g); g.connect(o);
  [v1, v2].forEach(([fa, fb], i) => { const b = c.createBiquadFilter(); b.type = "bandpass"; b.Q.value = 6; b.frequency.setValueAtTime(fa, tx); b.frequency.linearRampToValueAtTime(fb, tx + dur * 0.6); const bg = c.createGain(); bg.gain.value = i ? 0.5 : 1; osc.connect(b); b.connect(bg); bg.connect(mix); });
  osc.start(tx); osc.stop(tx + dur + 0.05);
}
/** Voix plus naturelle : train d'impulsions de la glotte (avec petites irrégularités) passé dans 3 formants qui bougent (voyelles). */
function vox(c: AC, o: Out, tx: number, dur: number, { f0, form, vol = 0.3, jit = 0.01, shim = 0.05, breath = 0, atk = 0.02, rel = 0.06 }: { f0: (u: number) => number; form: (u: number) => [number, number, number]; vol?: number; jit?: number; shim?: number; breath?: number; atk?: number; rel?: number }) {
  const sr = c.sampleRate, n = Math.ceil(dur * sr), buf = c.createBuffer(1, n, sr), d = buf.getChannelData(0); let ph = 0, amp = 1, per = 1, prev = 0;
  for (let i = 0; i < n; i++) { const u = i / n; if (ph >= 1 || i === 0) { ph = ph >= 1 ? ph - 1 : 0; per = 1 + (Math.random() * 2 - 1) * jit; amp = 1 + (Math.random() * 2 - 1) * shim; }
    ph += (f0(u) * per) / sr; const q = ph; const g = q < 0.4 ? 0.5 * (1 - Math.cos((Math.PI * q) / 0.4)) : q < 0.56 ? Math.cos((Math.PI / 2) * ((q - 0.4) / 0.16)) : 0; d[i] = (g - prev) * 14 * amp; prev = g; }
  const src = c.createBufferSource(); src.buffer = buf; const out = c.createGain(); out.gain.setValueAtTime(0.0001, tx); out.gain.linearRampToValueAtTime(vol, tx + atk); out.gain.setValueAtTime(vol, tx + Math.max(atk, dur - rel)); out.gain.linearRampToValueAtTime(0.0001, tx + dur); out.connect(o);
  const nz = breath > 0 ? c.createBufferSource() : null; if (nz) nz.buffer = noiseBuf(c);
  const bw = [90, 120, 170], gn = [1, 0.7, 0.4];
  for (let k = 0; k < 3; k++) { const f = c.createBiquadFilter(); f.type = "bandpass"; const F0 = form(0)[k]; f.frequency.setValueAtTime(F0, tx); f.Q.value = F0 / bw[k]; for (let j = 1; j <= 10; j++) f.frequency.linearRampToValueAtTime(form(j / 10)[k], tx + (dur * j) / 10); const g = c.createGain(); g.gain.value = gn[k]; src.connect(f); f.connect(g); g.connect(out); if (nz) { const ng = c.createGain(); ng.gain.value = breath * 0.5; nz.connect(f); f.connect(ng); ng.connect(out); } }
  src.start(tx); src.stop(tx + dur + 0.02); if (nz) { nz.start(tx); nz.stop(tx + dur + 0.02); }
}
const pent = [72, 74, 76, 79, 81, 84, 86, 88];
const SFX: Record<string, (c: AC, o: Out, tx: number) => void> = {
  // Secousse : cloche grave qui « vibre » + roulement métallique (esprit des vieilles messageries, mais notre propre son)
  shake: (c, o, tx) => { for (let i = 0; i < 6; i++) { bell(c, o, i % 2 ? 62 : 67, tx + i * 0.085, 0.5, 0.11); } air(c, o, tx, 0.6, { f0: 3000, f1: 800, q: 2, vol: 0.12 }); bell(c, o, 55, tx + 0.55, 1.4, 0.14); },
  hearts: (c, o, tx) => { [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => harp(c, o, n, tx + i * 0.09, 1.4, 0.12)); note(c, o, hz(48), tx, 1.8, { vol: 0.08, partials: [1, 2], atk: 0.3 }); },
  kiss: (c, o, tx) => { [[0, 1], [0.5, 0.75]].forEach(([d, v], i) => { const T = tx + d;
      const x = c.createOscillator(), g = c.createGain(); x.frequency.setValueAtTime(420, T); x.frequency.exponentialRampToValueAtTime(1500, T + 0.09); g.gain.setValueAtTime(0.0001, T); g.gain.linearRampToValueAtTime(0.09 * v, T + 0.04); g.gain.linearRampToValueAtTime(0.0001, T + 0.1); x.connect(g); g.connect(o); x.start(T); x.stop(T + 0.12); // succion des lèvres
      air(c, o, T + 0.09, 0.08, { f0: 1100, f1: 380, q: 6, vol: 1.0 * v }); air(c, o, T + 0.09, 0.03, { type: "lowpass", f0: 2200, vol: 0.7 * v }); // le « pop » des lèvres
      vox(c, o, T + 0.14, 0.2, { f0: (u) => 250 + 90 * u + i * 20, form: (u) => [320 + 480 * u, 800 + 400 * u, 2500], vol: 0.3 * v, jit: 0.01, shim: 0.05, breath: 0.1, atk: 0.03, rel: 0.1 }); }); },
  snow: (c, o, tx) => { [0, 2, 4, 1, 5, 3, 6, 7].forEach((k, i) => bell(c, o, pent[k] + 12, tx + i * 0.12, 1.6, 0.06)); note(c, o, hz(60), tx, 2.2, { vol: 0.05, atk: 0.5 }); },
  fireworks: (c, o, tx) => { [0, 1.4, 2.7].forEach((d, k) => { const w = c.createOscillator(), g = c.createGain(); w.frequency.setValueAtTime(600 + k * 150, tx + d); w.frequency.exponentialRampToValueAtTime(2600, tx + d + 0.45); g.gain.setValueAtTime(0.0001, tx + d); g.gain.linearRampToValueAtTime(0.06, tx + d + 0.08); g.gain.linearRampToValueAtTime(0.0001, tx + d + 0.46); w.connect(g); g.connect(o); w.start(tx + d); w.stop(tx + d + 0.5);
      air(c, o, tx + d + 0.46, 0.7, { type: "lowpass", f0: 900, f1: 80, vol: 0.55 }); air(c, o, tx + d + 0.46, 0.06, { type: "highpass", f0: 2000, vol: 0.7 }); for (let i = 0; i < 12; i++) air(c, o, tx + d + 0.55 + Math.random() * 0.7, 0.03, { type: "highpass", f0: 3000 + Math.random() * 2000, vol: 0.25 }); });
    for (let i = 0; i < 26; i++) { const d = 2.9 + i * 0.045 + Math.random() * 0.03; air(c, o, tx + d, 0.04, { type: "bandpass", f0: 1800 + Math.random() * 2200, q: 0.8, vol: 0.5 }); } air(c, o, tx + 4.1, 0.5, { type: "lowpass", f0: 600, f1: 60, vol: 0.5 }); },
  ghost: (c, o, tx) => { voice(c, o, tx, 1.5, 330, 520, [350, 900], [800, 2000], { vol: 0.4, vib: 6, vibAmt: 0.04, atk: 0.25 }); voice(c, o, tx + 0.5, 1.7, 220, 330, [300, 700], [700, 1500], { vol: 0.3, vib: 4.5, vibAmt: 0.05, atk: 0.3 }); air(c, o, tx, 2, { f0: 400, f1: 200, q: 0.5, vol: 0.05, curve: "lin" }); },
  fire: (c, o, tx) => { air(c, o, tx, 1.6, { type: "lowpass", f0: 600, f1: 300, vol: 0.28, atk: 0.2, curve: "lin" }); for (let i = 0; i < 22; i++) air(c, o, tx + Math.random() * 1.5, 0.03 + Math.random() * 0.03, { type: "bandpass", f0: 1500 + Math.random() * 3500, q: 3, vol: 0.18 + Math.random() * 0.15 }); air(c, o, tx, 0.5, { f0: 400, f1: 1800, q: 0.7, vol: 0.2 }); },
  bubbles: (c, o, tx) => { for (let i = 0; i < 16; i++) { const d = i * 0.15 + Math.random() * 0.1, f = 380 + Math.random() * 700, L = 0.05 + Math.random() * 0.06; const x = c.createOscillator(), g = c.createGain(); x.frequency.setValueAtTime(f, tx + d); x.frequency.exponentialRampToValueAtTime(f * 2.6, tx + d + L); g.gain.setValueAtTime(0.0001, tx + d); g.gain.linearRampToValueAtTime(0.22, tx + d + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, tx + d + L + 0.03); x.connect(g); g.connect(o); x.start(tx + d); x.stop(tx + d + L + 0.05);
      if (i % 3 === 0) air(c, o, tx + d + L, 0.02, { type: "highpass", f0: 3500, vol: 0.18 }); } },
  party: (c, o, tx) => { [[60, 0], [60, 0.14], [64, 0.28], [67, 0.42], [72, 0.6]].forEach(([n, d]) => brass(c, o, n, tx + d, d > 0.5 ? 0.7 : 0.16, 0.1)); air(c, o, tx + 0.62, 0.12, { type: "highpass", f0: 2500, vol: 0.3 }); [72, 76, 79, 84].forEach((n, i) => bell(c, o, n, tx + 0.7 + i * 0.06, 1, 0.07)); },
  rain: (c, o, tx) => { air(c, o, tx, 2.2, { type: "highpass", f0: 3500, f1: 3500, vol: 0.14, atk: 0.4, curve: "lin" }); air(c, o, tx, 2.2, { type: "bandpass", f0: 1200, q: 0.4, vol: 0.08, atk: 0.4, curve: "lin" }); for (let i = 0; i < 9; i++) bell(c, o, 84 + Math.floor(Math.random() * 12), tx + Math.random() * 2, 0.35, 0.04); },
  thunder: (c, o, tx) => { air(c, o, tx, 0.1, { type: "highpass", f0: 1200, vol: 0.8 }); air(c, o, tx + 0.04, 0.5, { type: "bandpass", f0: 900, f1: 200, q: 0.6, vol: 0.5 });
    for (let i = 0; i < 7; i++) { const d = 0.25 + i * 0.5 + Math.random() * 0.3; air(c, o, tx + d, 1.2 + Math.random() * 1.5, { type: "lowpass", f0: 260 - i * 15, f1: 45, q: 0.8, vol: 0.55 - i * 0.04, atk: 0.12 + Math.random() * 0.2 }); }
    air(c, o, tx + 0.2, 4.5, { type: "bandpass", f0: 120, f1: 60, q: 0.4, vol: 0.25, atk: 0.8, curve: "lin" }); air(c, o, tx + 0.5, 4, { type: "highpass", f0: 4000, vol: 0.05, atk: 1, curve: "lin" }); },
  rocket: (c, o, tx) => { air(c, o, tx, 1.6, { type: "lowpass", f0: 250, f1: 2400, vol: 0.45, atk: 0.3, curve: "lin" }); air(c, o, tx, 1.6, { f0: 600, f1: 5000, q: 1.2, vol: 0.2, atk: 0.4, curve: "lin" }); note(c, o, 90, tx, 1.5, { vol: 0.12, type: "sawtooth", glide: 0.6 }); },
  clap: (c, o, tx) => { for (let i = 0; i < 16; i++) { const d = i * 0.07 + Math.random() * 0.05; air(c, o, tx + d, 0.06, { f0: 1400 + Math.random() * 1200, q: 0.9, vol: 0.28 }); air(c, o, tx + d + 0.02, 0.04, { f0: 2600, q: 1.5, vol: 0.14 }); } },
  // Rire : voix claire et aiguë, syllabes « ha » courtes et rythmées, légèrement montantes puis descendantes, avec une petite inspiration
  laugh: (c, o, tx) => { air(c, o, tx, 0.22, { f0: 1000, f1: 2200, q: 0.8, vol: 0.09, atk: 0.15, curve: "lin" });
    for (let i = 0; i < 9; i++) { const d = 0.3 + i * 0.2 + i * i * 0.004, base = 300 + (i < 3 ? i * 18 : -(i - 2) * 16), a = i % 2 ? [880, 1500, 2900] : [760, 1250, 2800];
      air(c, o, tx + d - 0.03, 0.05, { f0: 2200, q: 0.9, vol: 0.12 }); vox(c, o, tx + d, 0.13, { f0: (u) => base * (1.06 - 0.12 * u), form: (u) => [a[0] - 40 * u, a[1], a[2]] as [number, number, number], vol: 0.8 - i * 0.03, jit: 0.012, shim: 0.08, breath: 0.1, atk: 0.012, rel: 0.06 }); }
    vox(c, o, tx + 2.3, 0.7, { f0: (u) => 310 - 80 * u + 4 * Math.sin(u * 50), form: (u) => [820 - 100 * u, 1350 - 200 * u, 2800], vol: 0.6, jit: 0.012, shim: 0.08, breath: 0.15, atk: 0.04, rel: 0.35 }); },
  money: (c, o, tx) => { air(c, o, tx, 0.04, { f0: 3000, vol: 0.3 }); bell(c, o, 88, tx + 0.05, 1.6, 0.14); bell(c, o, 95, tx + 0.2, 1.8, 0.14); for (let i = 0; i < 6; i++) bell(c, o, 100 + (i % 3), tx + 0.45 + i * 0.05, 0.4, 0.05); },
  tornado: (c, o, tx) => { bed(c, o, tx, 9.5, { type: "bandpass", f0: 140, f1: 480, q: 0.7, vol: 0.7, atk: 2.5, rel: 1.8, lfo: 0.4, depth: 0.35 }); bed(c, o, tx, 9.5, { type: "lowpass", f0: 110, f1: 170, q: 0.5, vol: 0.9, atk: 1.8, rel: 1.8, lfo: 0.25, depth: 0.3 }); bed(c, o, tx + 0.8, 8.2, { type: "highpass", f0: 1300, f1: 2600, q: 0.4, vol: 0.14, atk: 3, rel: 2, lfo: 0.6, depth: 0.5 }); for (const at of [2.4, 4.9, 6.6]) air(c, o, tx + at, 1.4, { type: "lowpass", f0: 220, f1: 60, q: 0.6, vol: 0.55 }); },
  fog: (c, o, tx) => { bed(c, o, tx, 11, { type: "bandpass", f0: 260, f1: 520, q: 0.5, vol: 0.2, atk: 3.5, rel: 3, lfo: 0.18, depth: 0.4 }); bed(c, o, tx + 1, 9, { type: "highpass", f0: 3200, f1: 3200, q: 0.3, vol: 0.035, atk: 3, rel: 3, lfo: 0.12, depth: 0.5 }); bed(c, o, tx, 11, { type: "lowpass", f0: 130, f1: 130, q: 0.4, vol: 0.16, atk: 3, rel: 3, lfo: 0.1, depth: 0.3 }); },
  knock: (c, o, tx) => {
    // Coup de jointure sur une vraie porte en bois : claquement sec + résonances du bois (modes qui s'éteignent vite) + « boum » creux de la porte
    const nb = c.createBuffer(1, Math.floor(c.sampleRate * 0.04), c.sampleRate); const nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / nd.length, 2);
    const hit = (T: number, v: number) => {
      const j = 0.94 + Math.random() * 0.12;
      [[185, 1, 45], [262, 0.8, 38], [388, 0.9, 34], [545, 0.55, 30], [790, 0.4, 26], [1180, 0.25, 22]].forEach(([f, a, q]) => { const s = c.createBufferSource(); s.buffer = nb; const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = f * j; bp.Q.value = q; const g = c.createGain(); g.gain.value = 5.5 * a * v; s.connect(bp); bp.connect(g); g.connect(o); s.start(T); });
      const th = c.createOscillator(), tg = c.createGain(); th.frequency.setValueAtTime(112 * j, T); th.frequency.exponentialRampToValueAtTime(74, T + 0.12); tg.gain.setValueAtTime(0.0001, T); tg.gain.linearRampToValueAtTime(0.7 * v, T + 0.003); tg.gain.exponentialRampToValueAtTime(0.0001, T + 0.22); th.connect(tg); tg.connect(o); th.start(T); th.stop(T + 0.25);
      air(c, o, T, 0.012, { type: "highpass", f0: 1800, vol: 0.5 * v, atk: 0.0005 }); air(c, o, T + 0.02, 0.4, { type: "lowpass", f0: 220, f1: 90, q: 0.5, vol: 0.1 * v, atk: 0.02 });
    };
    [0.5, 0.95, 1.4].forEach((k, i) => hit(tx + k - 0.02, 0.85 + 0.12 * (i % 2)));
    [3.0, 3.35, 3.7, 4.05].forEach((k, i) => hit(tx + k - 0.02, 1.0 - 0.05 * i));
  },
  bell: (c, o, tx) => {
    const ring = (T: number, f: number, d: number, v: number) => { [[1, 1, 1], [2.02, 0.45, 1.6], [2.76, 0.3, 2.2], [4.1, 0.18, 3], [5.4, 0.1, 4]].forEach(([r, a, dc]) => { const w = c.createOscillator(), g = c.createGain(); w.frequency.value = f * r; g.gain.setValueAtTime(0.0001, T); g.gain.linearRampToValueAtTime(0.42 * a * v, T + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, T + d / dc); w.connect(g); g.connect(o); w.start(T); w.stop(T + d / dc + 0.05); }); air(c, o, T, 0.04, { type: "highpass", f0: 3000, f1: 3000, q: 0.5, vol: 0.25 * v, atk: 0.001 }); };
    const dd = (T: number, long = 1) => { ring(T - 0.02, 659.25, 2.2, 1); ring(T + 0.5 - 0.02, 523.25, 2.6 * long, 0.95); };
    dd(tx + 0.5); dd(tx + 2.9, 1.2);
  },
  bomb: (c, o, tx) => { const w = c.createOscillator(), g = c.createGain(); w.frequency.setValueAtTime(2400, tx); w.frequency.exponentialRampToValueAtTime(220, tx + 0.9); g.gain.setValueAtTime(0.0001, tx); g.gain.linearRampToValueAtTime(0.06, tx + 0.05); g.gain.linearRampToValueAtTime(0.0001, tx + 0.92); w.connect(g); g.connect(o); w.start(tx); w.stop(tx + 0.95);
    const T = tx + 0.92; air(c, o, T, 0.12, { type: "highpass", f0: 800, vol: 1 }); air(c, o, T, 2.4, { type: "lowpass", f0: 1400, f1: 40, q: 0.6, vol: 1.1, atk: 0.005 }); note(c, o, 90, T, 1.6, { vol: 0.5, glide: 0.1 }); note(c, o, 45, T, 1.8, { vol: 0.5 });
    for (let i = 0; i < 18; i++) air(c, o, T + 0.3 + Math.random() * 1.4, 0.05, { type: "bandpass", f0: 600 + Math.random() * 2500, q: 1, vol: 0.2 }); },
  // Rot : un seul « grondement » grave, rauque, sans bruit liquide
  burp: (c, o, tx) => { air(c, o, tx, 0.06, { f0: 500, f1: 250, q: 1.5, vol: 0.25 });
    vox(c, o, tx + 0.03, 0.75, { f0: (u) => 78 - 28 * u, form: (u) => [520 - 60 * u, 900 - 120 * u, 2300], vol: 1.1, jit: 0.16, shim: 0.4, breath: 0.12, atk: 0.03, rel: 0.3 });
    vox(c, o, tx + 0.05, 0.7, { f0: (u) => 156 - 56 * u, form: (u) => [500, 850, 2200], vol: 0.25, jit: 0.2, shim: 0.4, atk: 0.03, rel: 0.3 }); },
  fart: (c, o, tx) => { const osc = c.createOscillator(); osc.type = "sawtooth"; let f = 120; osc.frequency.setValueAtTime(f, tx); for (let i = 1; i < 60; i++) { f = Math.max(45, f * (0.97 + Math.random() * 0.045) + (i > 45 ? 3 : 0)); osc.frequency.setValueAtTime(f * (i % 2 ? 1 : 0.92), tx + i * 0.018); }
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 650; lp.Q.value = 4; const g = c.createGain(); g.gain.setValueAtTime(0.0001, tx); g.gain.linearRampToValueAtTime(0.5, tx + 0.04); g.gain.setValueAtTime(0.5, tx + 0.85); g.gain.exponentialRampToValueAtTime(0.0001, tx + 1.15); osc.connect(lp); lp.connect(g); g.connect(o); osc.start(tx); osc.stop(tx + 1.2); air(c, o, tx, 1.1, { type: "bandpass", f0: 300, q: 2, vol: 0.25, curve: "lin" }); note(c, o, 700, tx + 1.05, 0.1, { vol: 0.07, glide: 0.4 }); },
  // Vomi : inspiration, deux haut-le-cœur aigus et tendus, puis un « beuuurgh » mouillé avec gargouillis et éclaboussures, et un gémissement
  vomit: (c, o, tx) => { air(c, o, tx, 0.35, { f0: 700, f1: 1700, q: 0.7, vol: 0.14, atk: 0.25, curve: "lin" });
    [0.45, 0.85].forEach((d, k) => vox(c, o, tx + d, 0.28, { f0: (u) => 210 - 40 * u - k * 10, form: (u) => [500 + 250 * u, 1500 - 300 * u, 2600], vol: 0.55, jit: 0.07, shim: 0.3, breath: 0.45, atk: 0.04, rel: 0.1 }));
    vox(c, o, tx + 1.35, 1.1, { f0: (u) => 230 - 100 * u, form: (u) => [500 + 350 * Math.sin(u * 3), 1500 - 500 * u, 2500], vol: 0.8, jit: 0.07, shim: 0.2, breath: 0.4, atk: 0.07, rel: 0.3 });
    const g = c.createGain(); g.gain.value = 0.6; const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.setValueAtTime(18, tx + 1.35); lfo.frequency.linearRampToValueAtTime(30, tx + 2.7); lg.gain.value = 0.45; lfo.connect(lg); lg.connect(g.gain); const src = c.createBufferSource(); src.buffer = noiseBuf(c); const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.setValueAtTime(1800, tx + 1.35); f.frequency.linearRampToValueAtTime(500, tx + 2.7); f.Q.value = 1.2; src.connect(f); f.connect(g); g.connect(o); src.start(tx + 1.35); src.stop(tx + 2.8); lfo.start(tx + 1.35); lfo.stop(tx + 2.8);
    for (let i = 0; i < 12; i++) { const d = 1.5 + i * 0.1 + Math.random() * 0.05; air(c, o, tx + d, 0.12, { type: "bandpass", f0: 1300 + Math.random() * 1200, f1: 300 + Math.random() * 150, q: 5, vol: 0.4 }); }
    air(c, o, tx + 2.65, 0.12, { f0: 2400, q: 0.8, vol: 0.2 }); vox(c, o, tx + 2.8, 0.7, { f0: (u) => 190 - 50 * u, form: (u) => [450, 900 - 150 * u, 2400], vol: 0.4, jit: 0.04, shim: 0.15, breath: 0.3, atk: 0.1, rel: 0.3 }); },
} as Record<Fx, (c: AC, o: Out, tx: number) => void>;
// Mélodie traditionnelle « Joyeux anniversaire » (domaine public), jouée au piano avec une basse douce : environ 7 secondes.
const BDAY: [number, number][] = [[67, .75], [67, .25], [69, 1], [67, 1], [72, 1], [71, 2], [67, .75], [67, .25], [69, 1], [67, 1], [74, 1], [72, 2], [67, .75], [67, .25], [79, 1], [76, 1], [72, 1], [71, 1], [69, 2], [77, .75], [77, .25], [76, 1], [72, 1], [74, 1], [72, 2]];
SFX.birthday = (c, o, tx) => { const B = 0.28; let x = 0; BDAY.forEach(([n, d], i) => { piano(c, o, n, tx + x * B, d * B * 2.2, 0.16); if (i % 3 === 0) note(c, o, hz(n - 24), tx + x * B, 0.9, { vol: 0.07, type: "triangle", partials: [1, 2] }); x += d; });
  [72, 76, 79, 84].forEach((n, i) => bell(c, o, n, tx + x * B + i * 0.07, 1.4, 0.09)); air(c, o, tx + x * B, 0.12, { type: "highpass", f0: 2500, vol: 0.3 }); };
SFX.easter = (c, o, tx) => SFX.hearts(c, o, tx);
for (const k of ["noel1", "noelv1", "noelv2", "noelv3", "absent"]) SFX[k] = () => { /* fichier */ };
for (const k of ["bd1", "bd2", "bd3", "bd4", "bd5", "bd6", "bdall"]) SFX[k] = () => { /* ces effets jouent un fichier */ };
let ctx: AudioContext | null = null;
/** Joue le bruitage de l'effet (volume modéré). */
export const SHAKE_SNDS: [string, string, string][] = [["zl", "Zigzag long", "./sounds/secousse/zigzag-long.mp3"], ["z1", "Zigzag doux", "./sounds/secousse/Z1-zigzag-doux.mp3"], ["z2", "Zigzag rapide", "./sounds/secousse/Z2-zigzag-rapide.mp3"], ["z3", "Zigzag grave", "./sounds/secousse/Z3-zigzag-grave.mp3"], ["z4", "Zigzag large", "./sounds/secousse/Z4-zigzag-large.mp3"], ["z5", "Zigzag rebond", "./sounds/secousse/Z5-zigzag-rebond.mp3"], ["y1", "Zigzag triangle", "./sounds/secousse/Y01-zigzag-triangle.mp3"], ["y2", "Zigzag cloche", "./sounds/secousse/Y02-zigzag-cloche.mp3"], ["y3", "Zigzag descendant", "./sounds/secousse/Y03-zigzag-descendant.mp3"], ["y4", "Zigzag montant", "./sounds/secousse/Y04-zigzag-montant.mp3"], ["y5", "Zigzag double", "./sounds/secousse/Y05-zigzag-double.mp3"], ["y6", "Zigzag aigu", "./sounds/secousse/Y06-zigzag-aigu.mp3"], ["y7", "Zigzag lent", "./sounds/secousse/Y07-zigzag-lent.mp3"], ["y8", "Zigzag ressort", "./sounds/secousse/Y08-zigzag-ressort.mp3"], ["y9", "Zigzag bulle", "./sounds/secousse/Y09-zigzag-bulle-long.mp3"], ["y10", "Zigzag écho", "./sounds/secousse/Y10-zigzag-echo.mp3"]];
export function sfx(k: Fx, target?: BaseAudioContext, noFile = false) {
  if (!target && devHidden("mute", k)) return;
  const cs = !target ? soundFor(k) : null; if (cs) { try { const a = track(new Audio(cs.data)); a.volume = 1; void a.play().catch(() => {}); } catch { /* ignoré */ } return; }
  const file = k === "shake" ? (SHAKE_SNDS.find((x) => x[0] === cfgNow().shakesnd)?.[2] || FX[k]?.file) : FX[k]?.file; if (file && !target && !noFile) { try { const a = track(new Audio(file)); a.volume = 1; a.play().catch(() => sfx(k, undefined, true)); if (k === "shake") a.addEventListener("ended", () => { try { const b = track(new Audio(file)); b.volume = 1; void b.play(); } catch { /* ignoré */ } }, { once: true }); return; } catch { /* repli sur le son synthétisé */ } }
  try {
    const c = target || (ctx ||= new (window.AudioContext || (window as any).webkitAudioContext)()); if ((c as AudioContext).state === "suspended") void (c as AudioContext).resume();
    const master = c.createGain(); master.gain.value = 0.9; const comp = c.createDynamicsCompressor(); master.connect(comp); comp.connect(target ? c.destination : fxBus(c)); SFX[k](c, master, c.currentTime + 0.02);
  } catch { /* son indisponible */ }
}

// ───────── Sonneries propres à l'application (notifications et appels) : sons doux et mélodieux
export interface Tone { label: string; kind: "n" | "c"; len: number; play: (c: AC, o: Out, tx: number) => void }
const soft = (c: AC, o: Out, n: number, tx: number, d = 0.9, vol = 0.12) => { note(c, o, hz(n), tx, d, { vol, type: "sine", partials: [1, 2, 3], atk: 0.006 }); note(c, o, hz(n) * 2.003, tx, d * 0.6, { vol: vol * 0.25 }); };
export const TONES: Record<string, Tone> = {
  n1: { get label() { return t("Cristal"); }, kind: "n", len: 1.6, play: (c, o, tx) => { bell(c, o, 88, tx, 1.5, 0.14); bell(c, o, 95, tx + 0.16, 1.7, 0.12); } },
  n2: { get label() { return t("Aurore"); }, kind: "n", len: 1.4, play: (c, o, tx) => { [79, 83, 86, 91].forEach((n, i) => soft(c, o, n, tx + i * 0.09, 0.9, 0.13)); } },
  n3: { get label() { return t("Brise"); }, kind: "n", len: 1.8, play: (c, o, tx) => { [72, 76, 79, 84, 88].forEach((n, i) => harp(c, o, n, tx + i * 0.07, 1.3, 0.11)); } },
  n4: { get label() { return t("Lueur"); }, kind: "n", len: 1.6, play: (c, o, tx) => { [(88), 91, 88, 96].forEach((n, i) => bell(c, o, n, tx + i * 0.13, 1.1, 0.09)); } },
  c1: { get label() { return t("Rivage"); }, kind: "c", len: 3.2, play: (c, o, tx) => { [[72, 0], [76, 0.3], [79, 0.6], [76, 0.9], [81, 1.2], [79, 1.5], [76, 1.8], [74, 2.1]].forEach(([n, d]) => soft(c, o, n, tx + d, 1.1, 0.16)); [48, 52, 55].forEach((n, i) => note(c, o, hz(n), tx + i * 1.0, 1.4, { vol: 0.08, type: "triangle", partials: [1, 2] })); } },
  c2: { get label() { return t("Cercle"); }, kind: "c", len: 3.0, play: (c, o, tx) => { [[84, 0], [88, 0.25], [91, 0.5], [96, 0.75], [91, 1.25], [88, 1.5], [84, 1.75], [79, 2.0]].forEach(([n, d]) => bell(c, o, n, tx + d, 1.3, 0.11)); [60, 67, 64].forEach((n, i) => harp(c, o, n, tx + i * 0.85, 1.6, 0.1)); } },
  c3: { get label() { return t("Matin"); }, kind: "c", len: 3.0, play: (c, o, tx) => { [[67, 0], [74, 0.2], [79, 0.4], [74, 0.6], [69, 0.9], [76, 1.1], [81, 1.3], [76, 1.5], [71, 1.8], [78, 2.0], [83, 2.2], [79, 2.5]].forEach(([n, d]) => harp(c, o, n, tx + d, 0.9, 0.12)); } },
};
export const TONE_IDS = { n: Object.keys(TONES).filter((k) => TONES[k].kind === "n"), c: Object.keys(TONES).filter((k) => TONES[k].kind === "c") };
/** Joue une sonnerie ; `times` répétitions (appels). */
export function playTone(id: string, times = 1) {
  const d = TONES[id]; if (!d || devHidden("mute", "tone-" + id)) return;
  try { const c = (ctx ||= new (window.AudioContext || (window as any).webkitAudioContext)()); if (c.state === "suspended") void c.resume(); const master = c.createGain(); master.gain.value = 0.9; const comp = c.createDynamicsCompressor(); master.connect(comp); comp.connect(c.destination); for (let i = 0; i < times; i++) d.play(c, master, c.currentTime + 0.03 + i * (d.len + 0.5)); } catch { /* son indisponible */ }
}
/** Dans l'application Android : vibre vraiment au maximum (force 255) ; sinon, motif standard du navigateur. */
export const buzz = (pat: number[], amp = 255) => { try { const n = (window as any).CercleNative; if (n?.vibrate) { n.vibrate(pat.join(","), amp); return; } navigator.vibrate?.(pat); } catch { /* ignoré */ } };
/** Niveaux de vibration réglables (messages, appels). La secousse, elle, vibre toujours au maximum. */
export const VIB_LEVELS: { id: string; label: string; pat: number[] }[] = [
  { id: "0", get label() { return t("Aucune"); }, pat: [] }, { id: "1", get label() { return t("Légère"); }, pat: [80] }, { id: "2", get label() { return t("Moyenne"); }, pat: [180, 90, 180] }, { id: "3", get label() { return t("Forte"); }, pat: [450, 80, 450, 80, 450] },
];
export const vibrate = (level?: string, repeat = 1) => { try { const l = VIB_LEVELS.find((x) => x.id === level) || VIB_LEVELS[2]; if (!l.pat.length) return; const pat: number[] = []; for (let i = 0; i < repeat; i++) pat.push(...l.pat, ...(i < repeat - 1 ? [600] : [])); buzz(pat, l.id === "1" ? 90 : l.id === "2" ? 170 : 255); } catch { /* ignoré */ } };
const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Vraie pluie (traînées obliques, éclaboussures) et orage (ciel sombre, éclairs ramifiés, flashs). */
function bolt(): string {
  const W = 300, H = 600; let x = 150 + (Math.random() - 0.5) * 80, y = 0; const pts = [[x, y]]; const br: string[] = [];
  while (y < H) { y += 30 + Math.random() * 40; x += (Math.random() - 0.5) * 70; pts.push([x, y]); if (Math.random() < 0.3 && y < H - 100) { let bx = x, by = y; const b = [[bx, by]]; for (let j = 0; j < 3; j++) { by += 25 + Math.random() * 30; bx += (Math.random() < 0.5 ? -1 : 1) * (15 + Math.random() * 30); b.push([bx, by]); } br.push(b.map((p) => p.join(",")).join(" ")); } }
  const main = pts.map((p) => p.join(",")).join(" ");
  const L = (p: string, w: number, c: string, o: number) => `<polyline points="${p}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" opacity="${o}"/>`;
  const all = [main, ...br];
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${all.map((p) => L(p, 14, "#9fb4ff", 0.35)).join("")}${all.map((p) => L(p, 5, "#dfe7ff", 0.8)).join("")}${all.map((p, i) => L(p, i ? 1.6 : 2.6, "#fff", 1)).join("")}</svg>`;
}

/** Un personnage (smiley) qui rote avec une fumée verte, ou qui envoie un bisou suivi d'une pluie de petits bisous. */
function charShow(k: "burp" | "kiss") {
  const box = document.createElement("div"); box.className = "fxbox chr"; box.setAttribute("aria-hidden", "true");
  const face = document.createElement("div"); face.className = "chface " + k; face.textContent = k === "burp" ? "😮" : "😘"; box.appendChild(face);
  if (k === "burp") {
    for (let b = 0; b < 3; b++) for (let i = 0; i < 6; i++) { const p = document.createElement("span"); p.className = "gsmoke"; const z = 60 + Math.random() * 90; p.style.width = z + "px"; p.style.height = z + "px"; p.style.setProperty("--dx", (Math.random() - 0.5) * 240 + "px"); p.style.setProperty("--dy", -(160 + Math.random() * 200) + "px"); p.style.animationDelay = 0.5 + b * 1.2 + i * 0.08 + "s"; box.appendChild(p); }
  } else {
    const heart = document.createElement("span"); heart.className = "bigkiss"; heart.textContent = "💋"; box.appendChild(heart);
    for (let i = 0; i < 38; i++) { const p = document.createElement("span"); p.className = "kfall"; p.textContent = i % 4 === 0 ? "💋" : i % 4 === 1 ? "💗" : i % 4 === 2 ? "😘" : "💋"; p.style.left = Math.random() * 96 + "%"; p.style.fontSize = 18 + Math.random() * 22 + "px"; p.style.animationDuration = 2.6 + Math.random() * 2 + "s"; p.style.animationDelay = 0.9 + Math.random() * 2.4 + "s"; box.appendChild(p); }
  }
  document.body.appendChild(box); setTimeout(() => box.remove(), 6800);
}

/** Cœurs en plus : grands cœurs, roses et pétales qui tombent. */
function heartsExtra() {
  const box = document.createElement("div"); box.className = "fxbox hx"; box.setAttribute("aria-hidden", "true");
  const add = (cls: string, txt: string, size: number, delay: number, dur: number) => { const s = document.createElement("span"); s.className = cls; s.textContent = txt; s.style.left = Math.random() * 94 + "%"; s.style.fontSize = size + "px"; s.style.animationDelay = delay + "s"; s.style.animationDuration = dur + "s"; box.appendChild(s); return s; };
  for (let i = 0; i < 16; i++) add("hbig", pick(["❤️", "💖", "💗", "💝", "🩷", "❤️"]), 60 + Math.random() * 90, Math.random() * 2.2, 4 + Math.random() * 2.5);
  for (let i = 0; i < 12; i++) add("hbig", "🌹", 36 + Math.random() * 40, Math.random() * 2.5, 4 + Math.random() * 2.5);
  for (let i = 0; i < 70; i++) { const p = add("petal", "", 0, Math.random() * 3, 3.5 + Math.random() * 3); const z = 12 + Math.random() * 14; p.style.width = z + "px"; p.style.height = z * 1.3 + "px"; p.style.setProperty("--pc", pick(["#e63462", "#ff5c8a", "#c2185b", "#ff8fb1", "#d81b60"])); p.style.setProperty("--sw", (Math.random() < 0.5 ? -1 : 1) * (40 + Math.random() * 80) + "px"); }
  document.body.appendChild(box); setTimeout(() => box.remove(), 8000);
}
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

/** « Tout s'écroule » : l'écran se fissure, les éléments tombent en désordre, puis tout se remet en place. */
function crumble() {
  const root = document.documentElement; if (root.classList.contains("crumbling")) return;
  const els = Array.from(document.querySelectorAll<HTMLElement>(".card, .navbtn, .bubble, .brandbar, .btn, .chip, .avatar, .msg, h1, h2, nav button")).filter((e) => { const r = e.getBoundingClientRect(); return r.width > 20 && r.height > 12 && r.bottom > 0 && r.top < innerHeight; }).slice(0, 90);
  root.classList.add("crumbling");
  els.forEach((e) => { const r = e.getBoundingClientRect(); e.style.setProperty("--dx", (Math.random() - 0.5) * 120 + "px"); e.style.setProperty("--dy", innerHeight - r.top + 20 + Math.random() * 140 + "px"); e.style.setProperty("--rt", (Math.random() - 0.5) * 70 + "deg"); e.style.setProperty("--cd", Math.random() * 0.5 + "s"); e.classList.add("crumble"); });
  const box = document.createElement("div"); box.className = "fxbox crack"; box.setAttribute("aria-hidden", "true");
  let d = ""; const cx = innerWidth * (0.3 + Math.random() * 0.4), cy = innerHeight * (0.3 + Math.random() * 0.3);
  for (let i = 0; i < 11; i++) { const a = (i / 11) * 6.283 + Math.random() * 0.4; let x = cx, y = cy; d += `M${x},${y}`; for (let j = 0; j < 6; j++) { const l = 40 + Math.random() * 120; x += Math.cos(a + (Math.random() - 0.5) * 0.7) * l; y += Math.sin(a + (Math.random() - 0.5) * 0.7) * l; d += ` L${x},${y}`; } }
  box.innerHTML = `<svg width="100%" height="100%"><path d="${d}" fill="none" stroke="rgba(255,255,255,.9)" stroke-width="2"/><path d="${d}" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="4" transform="translate(2,2)" opacity=".5"/></svg>`;
  document.body.appendChild(box);
  setTimeout(() => { els.forEach((e) => e.classList.add("rebuild")); box.remove(); }, 2300);
  setTimeout(() => { els.forEach((e) => { e.classList.remove("crumble", "rebuild"); ["--dx", "--dy", "--rt", "--cd"].forEach((p) => e.style.removeProperty(p)); }); root.classList.remove("crumbling"); }, 3300);
}
function weatherShow(storm: boolean) {
  const box = document.createElement("div"); box.className = "fxbox wx" + (storm ? " storm" : ""); box.setAttribute("aria-hidden", "true");
  const sky = document.createElement("div"); sky.className = "wxsky"; box.appendChild(sky);
  const n = storm ? 190 : 150;
  for (let i = 0; i < n; i++) { const d = document.createElement("i"); const h = 50 + Math.random() * 80; d.style.left = Math.random() * 115 - 10 + "%"; d.style.height = h + "px"; d.style.opacity = String(0.35 + Math.random() * 0.5); d.style.animationDuration = 0.45 + Math.random() * 0.35 + "s"; d.style.animationDelay = -Math.random() * 1 + "s"; d.style.setProperty("--w", 1 + Math.random() * 1.4 + "px"); box.appendChild(d); }
  for (let i = 0; i < 26; i++) { const sp = document.createElement("b"); sp.style.left = Math.random() * 100 + "%"; sp.style.animationDelay = Math.random() * 0.9 + "s"; sp.style.bottom = Math.random() * 14 + "%"; box.appendChild(sp); }
  if (storm) {
    for (const [at, left] of [[600, 18], [1900, 62], [3400, 35], [4700, 78]] as const) setTimeout(() => {
      if (!box.isConnected) return;
      const f = document.createElement("div"); f.className = "wxflash"; box.appendChild(f); setTimeout(() => f.remove(), 700);
      const b = document.createElement("div"); b.className = "wxbolt"; b.style.left = left + "%"; b.innerHTML = bolt(); box.appendChild(b); setTimeout(() => b.remove(), 650);
    }, at);
  }
  document.body.appendChild(box); setTimeout(() => { box.classList.add("out"); setTimeout(() => box.remove(), 700); }, 6200);
}
export function playFx(k: Fx, sound = true) {
  const d = FX[k]; if (!d) return;
  stopFx(); setCur(k);
  if (sound) sfx(k);
  if (k === "shake") {
    crumble();
    buzz([500, 40, 500, 40, 500, 40, 500, 40, 500], 255);
    if (!reduced()) { const r = document.documentElement; r.classList.remove("shake"); void r.offsetWidth; r.classList.add("shake"); setTimeout(() => r.classList.remove("shake"), 2400); }
    return;
  }
  if (k in BD_DUR) { bdayShow(k); return; }
  if (k === "tornado" && !reduced()) { tornadoShow(); return; }
  if (k === "fog" && !reduced()) { fogShow(); return; }
  if ((k === "knock" || k === "bell") && !reduced()) { doorShow(k); return; }
  if (k === "absent") { absentShow(sound && !devHidden("mute", k)); return; }
  if (k in NOEL_VIDEOS && !reduced()) { noelVideoShow(k, sound && !devHidden("mute", k)); return; }
  if (!reduced() && (k === "easter")) { holidayShow(k); return; }
  if (!reduced() && (SCENES as string[]).includes(k)) { sceneShow(k as Scene); if (k !== "rocket") return; }
  if (k === "hearts" && !reduced()) heartsExtra();
  if ((k === "burp" || k === "kiss") && !reduced()) { charShow(k); return; }
  if ((k === "rain" || k === "thunder") && !reduced()) { weatherShow(k === "thunder"); return; }
  if (k === "birthday") { buzz([200, 100, 200, 100, 400, 200, 200, 100, 200, 100, 400, 200, 200, 100, 400, 100, 400], 255); }
  if (reduced()) return;
  const long = k === "birthday" || k === "vomit"; const smoke = k === "fart"; const rise = k === "bubbles" || k === "fire" || k === "ghost" || k === "rocket" || smoke; const box = document.createElement("div"); box.className = "fxbox" + (rise ? " rise" : ""); box.setAttribute("aria-hidden", "true");
  for (let i = 0; i < (long ? 60 : 34); i++) { const s = document.createElement("span"); if (smoke) { s.className = "smoke"; const z = 90 + Math.random() * 140; s.style.width = z + "px"; s.style.height = z + "px"; } else s.textContent = d.em[i % d.em.length]; s.style.left = Math.random() * 100 + "%"; s.style.animationDelay = Math.random() * (long ? 5 : d.file ? 2.4 : 0.9) + "s"; s.style.fontSize = 18 + Math.random() * 22 + "px"; s.style.animationDuration = 2 + Math.random() * 1.6 + "s"; box.appendChild(s); }
  if (k === "vomit" && !reduced()) { // liquide vert qui coule du haut de l'écran
    const top = document.createElement("div"); top.className = "slime-top"; box.appendChild(top);
    for (let i = 0; i < 16; i++) { const dr = document.createElement("div"); dr.className = "drip"; const w = 18 + Math.random() * 38; dr.style.left = i * 6.3 + Math.random() * 3 + "%"; dr.style.width = w + "px"; dr.style.setProperty("--h", 14 + Math.random() * 42 + "vh"); dr.style.animationDelay = 0.6 + Math.random() * 1.8 + "s"; box.appendChild(dr); } }
  document.body.appendChild(box); setTimeout(() => box.remove(), long ? 9500 : d.file ? 6800 : 4200);
}

/** Effet personnalisé : l'image de la personne tombe à l'écran et son enregistrement (3 s max) est joué. */
export function playCustom(c: { img?: string; audio?: string; name?: string }, sound = true) {
  stopFx();
  if (sound && c.audio) { try { const a = new Audio(c.audio); a.volume = 1; void a.play(); } catch { /* son indisponible */ } }
  if (reduced()) return;
  const box = document.createElement("div"); box.className = "fxbox"; box.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 22; i++) { const s = document.createElement(c.img ? "img" : "span"); if (c.img) { (s as HTMLImageElement).src = c.img; s.style.width = 30 + Math.random() * 30 + "px"; s.style.height = s.style.width; s.style.objectFit = "cover"; s.style.borderRadius = "50%"; } else s.textContent = "🎙"; s.style.position = "absolute"; s.style.left = Math.random() * 100 + "%"; s.style.animationDelay = Math.random() * 0.8 + "s"; s.style.animationDuration = 2 + Math.random() * 1.4 + "s"; box.appendChild(s); }
  document.body.appendChild(box); setTimeout(() => box.remove(), 4200);
}

// Petits « pop » qui montent, un par lettre, quand on touche le nom NOTIIF.
let sharedCtx: AudioContext | null = null;
/** Un seul contexte audio pour toute l'appli : il reste « réveillé » après le 1er geste. */
function ctxShared(): AudioContext | null {
  try {
    if (!sharedCtx || sharedCtx.state === "closed") { const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext; sharedCtx = new AC(); }
    return sharedCtx;
  } catch { return null; }
}
export function popNotes(n = 6, vol = 0.16, shift = 1, gap = 0.07) {
  const c = ctxShared(); if (!c) return;
  const play = () => { try {
    for (let i = 0; i < n; i++) { const t0 = c.currentTime + 0.02 + i * gap; const o = c.createOscillator(); const g = c.createGain(); o.type = "sine"; o.frequency.setValueAtTime(520 * shift * Math.pow(1.122, i * 2), t0); o.frequency.exponentialRampToValueAtTime(900 * shift * Math.pow(1.122, i * 2), t0 + 0.08); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12); o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + 0.14); }
  } catch { /* pas de son : tant pis */ } };
  if (c.state === "running") play(); else { try { c.resume().then(() => { if (c.state === "running") play(); }).catch(() => { /* bloqué */ }); } catch { /* rien */ } }
}

/** Réveille le son dès le tout premier toucher (les navigateurs l'exigent). */
if (typeof window !== "undefined") { const wake = () => { const c = ctxShared(); try { c?.resume(); } catch { /* rien */ } window.removeEventListener("pointerdown", wake); window.removeEventListener("keydown", wake); }; window.addEventListener("pointerdown", wake); window.addEventListener("keydown", wake); }

function fxOn(): boolean { try { const x = JSON.parse(localStorage.getItem("nidami-v1") || "null"); return x?.settings?.[x?.me]?.fx ?? true; } catch { return true; } }
/** Début de la notification : quelqu'un entre en contact (écrit, enregistre…). */
const cfgNow = (): any => { try { const x = JSON.parse(localStorage.getItem("nidami-v1") || "null"); return x?.settings?.[x?.me] || {}; } catch { return {}; } };
/** Petits sons de l'application (likes, commentaires) : réglables, coupés par « Application discrète ». */
export function uiSound(k: "like" | "comm") { const c = cfgNow(); if (c.discret) return; if (k === "like" ? c.sndlike === false : c.sndcomm === false) return; try { const a = new Audio(k === "like" ? "./sounds/reserve/S3-rebond.mp3" : "./sounds/reserve/S2-vibrato.mp3"); a.volume = 0.5; a.play().catch(() => {}); } catch { /* ignoré */ } if (c.vibtap) buzz([18]); }
export function soundStart() { if (fxOn() && !cfgNow().discret) popNotes(6, 0.3); }
/** Fin de la notification : le message est parti. */
export function soundEnd() { if (fxOn() && !cfgNow().discret) popNotes(3, 0.3); }

/** Sons de notification de la famille NOTIIF (prêts pour quand le serveur enverra les évènements). */
export const notifSound = {
  vocal: () => { if (fxOn()) popNotes(4, 0.3, 0.6, 0.13); },
  story: () => { if (fxOn()) popNotes(6, 0.3, 0.7, 0.07); },
  reaction: () => { if (fxOn()) popNotes(2, 0.3, 0.5, 0.16); },
  appel: () => { if (!fxOn()) return; const k = (d: number, n: number) => setTimeout(() => popNotes(n, 0.3, 0.5, 0.07), d); k(0, 6); k(900, 3); k(1500, 6); k(2400, 3); },
  reserve: () => { if (fxOn()) popNotes(3, 0.3, 0.7, 0.07); },
};

/** Sonneries d'appel de la famille NOTIIF (même timbre que le « pop »). Choix dans le mode développeur. */
export const CALL_TONES: [string, string, string][] = [["montee", "Montée", "./sounds/tones/appel-montee.mp3"], ["rebond", "Rebond", "./sounds/tones/appel-rebond.mp3"], ["doux", "Doux", "./sounds/tones/appel-doux.mp3"]];
function ringFile(url: string, times = 3) {
  let n = 0; const fb = () => { if (n === 1) notifSound.appel(); };
  const go = () => { if (n++ >= times) return; try { const a = track(new Audio(url)); a.volume = 1; a.addEventListener("ended", go, { once: true }); void a.play().catch(fb); } catch { fb(); } };
  go();
}
export function playCallRing() { if (!fxOn() || cfgNow().discret) return; const cs = soundFor("appel"); ringFile(cs ? cs.data : (CALL_TONES.find((x) => x[0] === sndMapOf("appel")) || CALL_TONES[0])[2]); }
export function playNotifSound() {
  const cs = soundFor("notif");
  if (cs) { if (fxOn() && !cfgNow().discret) { try { const a = track(new Audio(cs.data)); a.volume = 1; void a.play().catch(() => {}); } catch { /* ignoré */ } } return; }
  soundEnd();
}

/** Le navigateur autorise-t-il déjà le son ? (sinon il faut un premier toucher de l'utilisateur) */
export function audioReady(): Promise<boolean> {
  const c = ctxShared(); if (!c) return Promise.resolve(false); if (c.state === "running") return Promise.resolve(true);
  return new Promise((ok) => { const to = setTimeout(() => ok(c.state === "running"), 250); try { c.resume().then(() => { clearTimeout(to); ok(c.state === "running"); }).catch(() => { clearTimeout(to); ok(false); }); } catch { clearTimeout(to); ok(false); } });
}
export function wakeAudio() { try { void ctxShared()?.resume(); } catch { /* rien */ } }
