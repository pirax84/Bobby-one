// Effets de conversation (secousse, confettis, cœurs) : idée classique des messageries, réalisée ici avec nos propres animations et un son synthétisé (aucun fichier ni nom d'une marque existante).
export type Fx = "shake" | "confetti" | "hearts";
let ctx: AudioContext | null = null;
function beep(seq: [number, number, number][], type: OscillatorType = "square", vol = 0.06) {
  try {
    ctx ||= new (window.AudioContext || (window as any).webkitAudioContext)(); const c = ctx; let t = c.currentTime;
    for (const [f, d, gap] of seq) { const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + 0.02); t += d + gap; }
  } catch { /* son indisponible */ }
}
const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
export function playFx(k: Fx, sound = true) {
  if (k === "shake") {
    if (sound) beep([[180, .09, .03], [120, .09, .03], [180, .09, .03], [120, .09, .03], [220, .14, 0]], "sawtooth", .07);
    try { navigator.vibrate?.([80, 40, 80, 40, 120]); } catch { /* ignoré */ }
    if (!reduced()) { const r = document.documentElement; r.classList.remove("shake"); void r.offsetWidth; r.classList.add("shake"); setTimeout(() => r.classList.remove("shake"), 900); }
    return;
  }
  if (sound) beep(k === "hearts" ? [[523, .12, .02], [659, .12, .02], [784, .2, 0]] : [[660, .08, .02], [880, .08, .02], [1175, .16, 0]], "triangle", .08);
  if (reduced()) return;
  const em = k === "hearts" ? ["❤️", "💕", "💖", "💗"] : ["🎉", "🎊", "✨", "⭐"]; const box = document.createElement("div"); box.className = "fxbox"; box.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 34; i++) { const s = document.createElement("span"); s.textContent = em[i % em.length]; s.style.left = Math.random() * 100 + "%"; s.style.animationDelay = Math.random() * 0.9 + "s"; s.style.fontSize = 18 + Math.random() * 22 + "px"; s.style.animationDuration = 2 + Math.random() * 1.6 + "s"; box.appendChild(s); }
  document.body.appendChild(box); setTimeout(() => box.remove(), 4200);
}
