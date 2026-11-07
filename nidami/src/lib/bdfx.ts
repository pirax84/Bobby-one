import { bdSceneShow } from "./scenes";
import type { BdKind } from "./bdscenes";
// Effets « anniversaire » : chacun dure aussi longtemps que sa musique et a son propre décor.
export const BD_DUR: Record<string, number> = { bdall: 13.7, bd1: 21.4, bd2: 63.1, bd3: 18.6, bd4: 22.4, bd5: 25.5, bd6: 65.1 };
const COLS = ["#B03FD0", "#E8603B", "#12A596", "#D13F7F", "#E8845A", "#7A63E4", "#38B6FF"];
const CAKES = ["🎂", "🧁", "🍰", "🍩", "🍪", "🥧", "🍮", "🎂"];
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(l: T[]) => l[Math.floor(Math.random() * l.length)];
function el(box: HTMLElement, cls: string, css: Record<string, string>, txt?: string) {
  const e = document.createElement("div"); e.className = cls; if (txt) e.textContent = txt;
  for (const k in css) e.style.setProperty(k, css[k]); box.appendChild(e); return e;
}
type Box = HTMLElement;
const balloons = (b: Box, n: number, w0: number, w1: number, spread: number) => { for (let i = 0; i < n; i++) { const w = rnd(w0, w1); el(b, "bdballoon", { left: rnd(0, 96) + "%", width: w + "px", height: w * 1.22 + "px", background: pick(COLS), "--t": rnd(7, 12) + "s", "animation-delay": rnd(0, spread) + "s" }); } };
const confetti = (b: Box, n: number, s0: number, s1: number, spread: number) => { for (let i = 0; i < n; i++) el(b, "bdconf", { left: rnd(0, 100) + "%", width: rnd(s0, s1) + "px", height: rnd(s0 * 1.7, s1 * 1.7) + "px", background: pick(COLS), "--sx": rnd(-120, 120) + "px", "--t": rnd(4, 7.5) + "s", "animation-delay": rnd(0, spread) + "s", "border-radius": Math.random() < 0.3 ? "50%" : "3px" }); };
const cannons = (b: Box, every: number, count: number, first: number, until: number) => { for (let w = first; w < until; w += every) for (const side of [0, 1]) for (let i = 0; i < count; i++) el(b, "bdcannon", { left: side ? "98%" : "2%", background: pick(COLS), width: rnd(14, 24) + "px", height: rnd(24, 38) + "px", "--bx": (side ? -1 : 1) * rnd(15, 80) + "vw", "--by": -rnd(35, 92) + "vh", "animation-delay": w + rnd(0, 0.5) + "s" }); };
const emojiRain = (b: Box, list: string[], n: number, s0: number, s1: number, spread: number) => { for (let i = 0; i < n; i++) el(b, "bdconf bdem", { left: rnd(0, 96) + "%", "font-size": rnd(s0, s1) + "px", "--sx": rnd(-100, 100) + "px", "--t": rnd(4.5, 8) + "s", "animation-delay": rnd(0, spread) + "s" }, pick(list)); };
const starRain = (b: Box, n: number, s0: number, s1: number, spread: number) => { for (let i = 0; i < n; i++) { const z = rnd(s0, s1); el(b, "bdconf bdsh", { left: rnd(0, 96) + "%", width: z + "px", height: z + "px", background: pick(COLS), "--sx": rnd(-100, 100) + "px", "--t": rnd(4.5, 8) + "s", "animation-delay": rnd(0, spread) + "s" }); } };
const gifts = (b: Box, n: number, s0: number, s1: number, spread: number) => { for (let i = 0; i < n; i++) el(b, "bdgift", { left: rnd(2, 90) + "%", "font-size": rnd(s0, s1) + "px", "--t": rnd(3.2, 4.8) + "s", "animation-delay": rnd(0, spread) + "s" }, pick(["🎁", "🎁", "🎀", "🎁", "🧸", "🎁"])); };

const cakeSvg = () => {
  const xs = [128, 164, 200, 236, 272];
  const cand = xs.map((x, i) => { const c = ["#12A596", "#E5679C", "#B03FD0", "#E8603B", "#12A596"][i];
    return `<rect x="${x - 7}" y="86" width="14" height="62" rx="5" fill="${c}" stroke="#2A2150" stroke-width="4"/><path d="M${x - 7} 100l14 -8M${x - 7} 116l14 -8M${x - 7} 132l14 -8" stroke="#fff" stroke-width="3" opacity=".7"/><g class="bdblow" style="transform-origin:${x}px 84px"><g class="bdflame" style="transform-origin:${x}px 84px;animation-delay:${i * 0.11}s"><path d="M${x} 40 q22 28 0 46 q-22 -18 0 -46z" fill="url(#cfl)" stroke="#2A2150" stroke-width="3"/><path d="M${x} 60 q9 12 0 22 q-9 -10 0 -22z" fill="#fff" opacity=".85"/></g></g>`; }).join("");
  const smoke = xs.map((x, i) => [0, 1, 2].map((j) => `<circle class="bdsmk" cx="${x}" cy="76" r="${7 + j * 2}" fill="#9A93BC" style="animation-delay:calc(var(--w) + ${0.25 + i * 0.05 + j * 0.35}s)"/>`).join("")).join("");
  const scal = Array.from({ length: 11 }, (_, i) => `<circle cx="${70 + i * 26}" cy="338" r="13" fill="#fff" stroke="#2A2150" stroke-width="3.5"/>`).join("");
  const berries = [92, 148, 252, 308].map((x, i) => `<g transform="translate(${x} ${232 + (i % 2) * 6})"><path d="M0 -14c-16 0 -20 22 0 32c20 -10 16 -32 0 -32z" fill="#E5679C" stroke="#2A2150" stroke-width="4"/><circle cx="-5" cy="-2" r="2" fill="#fff"/><circle cx="5" cy="3" r="2" fill="#fff"/><path d="M-6 -15l6 -7l6 7z" fill="#12A596" stroke="#2A2150" stroke-width="3" stroke-linejoin="round"/></g>`).join("");
  return `<svg class="bdcakesvg" viewBox="0 0 400 400"><defs>
<linearGradient id="cb" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#F58BB5"/><stop offset="1" stop-color="#C43377"/></linearGradient>
<linearGradient id="ct" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#C46BE0"/><stop offset="1" stop-color="#8E36B0"/></linearGradient>
<radialGradient id="cfl" cx=".5" cy=".7" r=".6"><stop offset="0" stop-color="#FFB38F"/><stop offset="1" stop-color="#E8603B"/></radialGradient></defs>
<ellipse cx="200" cy="362" rx="190" ry="26" fill="#EDE6FF" stroke="#2A2150" stroke-width="6"/>
<path d="M50 250v82q0 28 150 28t150 -28v-82z" fill="url(#cb)" stroke="#2A2150" stroke-width="6" stroke-linejoin="round"/>
<path d="M70 262v70" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".35"/>
<ellipse cx="200" cy="250" rx="150" ry="30" fill="#FFF1F7" stroke="#2A2150" stroke-width="6"/>
${scal}
<path d="M96 160v74q0 24 104 24t104 -24v-74z" fill="url(#ct)" stroke="#2A2150" stroke-width="6" stroke-linejoin="round"/>
<path d="M114 172v56" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".3"/>
<ellipse cx="200" cy="160" rx="104" ry="22" fill="#FFF1F7" stroke="#2A2150" stroke-width="6"/>
<path d="M96 160q0 22 14 22t14 -14q0 20 16 20t16 -18q0 22 16 22t16 -20q0 20 16 20t16 -18q0 22 16 22t16 -18q0 18 14 18t14 -22" fill="#fff" stroke="#2A2150" stroke-width="4" stroke-linejoin="round"/>
${berries}${cand}${smoke}</svg>`;
};

/** Lance le décor de l'effet k (bd1…bd6). */
export function bdayShow(k: string) {
  if (k === "bdall") { const ks = ["bd1", "bd2", "bd3", "bd4", "bd5", "bd6"] as BdKind[]; bdSceneShow(ks, Object.fromEntries(ks.map((x) => [x, BD_DUR.bdall]))); return; }
  const dur = BD_DUR[k]; if (!dur) return;
  if (k in BD_DUR) { bdSceneShow([k as BdKind], BD_DUR); return; }
  const box = document.createElement("div"); box.className = "bdfx"; box.setAttribute("aria-hidden", "true");
  box.style.setProperty("--d", dur + "s");
  const spread = Math.max(1, dur - 7);
  if (k === "bd1") { // ballons qui montent
    balloons(box, Math.round(dur * 1.6), 46, 92, spread);
  } else if (k === "bd2") { // grand gâteau + confettis + ballons
    el(box, "bdcake", {}, "🎂");
    confetti(box, Math.round(dur * 4), 16, 28, dur - 6);
    cannons(box, 5, 34, 1, dur - 4);
    balloons(box, Math.round(dur * 0.5), 40, 70, spread);
    emojiRain(box, ["🎉", "🎊"], Math.round(dur * 0.8), 34, 60, dur - 6);
  } else if (k === "bd3") { // cadeaux et nœuds qui tombent et rebondissent
    gifts(box, Math.round(dur * 1.3), 60, 110, dur - 5);
  } else if (k === "bd4") { // coup de vent qui souffle les bougies
    const W = dur * 0.5; box.style.setProperty("--w", W + "s");
    const wrap = el(box, "bdcakew", {}); wrap.innerHTML = cakeSvg();
    el(box, "bdwind", { "animation-delay": W + "s" }, "💨");
    for (let i = 0; i < 3; i++) el(box, "bdwline", { top: 36 + i * 7 + "%", "animation-delay": W + i * 0.12 + "s" });
    cannons(box, 100, 70, W + 2.2, W + 2.3);
    emojiRain(box, ["🎉", "🎊", "🎈"], Math.round(dur * 1.2), 34, 62, 1);
    box.querySelectorAll(".bdem").forEach((e) => { (e as HTMLElement).style.animationDelay = W + 2 + rnd(0, dur - W - 6) + "s"; });
  } else if (k === "bd5") { // pluie de petits gâteaux de tous les goûts et d'étoiles
    emojiRain(box, CAKES, Math.round(dur * 3.2), 44, 90, dur - 6);
    starRain(box, Math.round(dur * 1.6), 34, 70, dur - 6);
  } else if (k === "bd6") { // méga fête : tout en petit
    balloons(box, Math.round(dur * 1.1), 30, 54, spread);
    confetti(box, Math.round(dur * 4), 8, 14, dur - 6);
    gifts(box, Math.round(dur * 0.9), 30, 50, dur - 5);
    emojiRain(box, CAKES, Math.round(dur * 1.2), 30, 52, dur - 6);
    starRain(box, Math.round(dur * 1.2), 18, 34, dur - 6);
    cannons(box, 8, 20, 2, dur - 4);
  }
  document.body.appendChild(box); setTimeout(() => box.remove(), (dur + 1) * 1000);
}

/** Arrête tous les décors d'anniversaire en cours. */
export const bdayStop = () => { document.querySelectorAll(".bdfx").forEach((e) => e.remove()); };
