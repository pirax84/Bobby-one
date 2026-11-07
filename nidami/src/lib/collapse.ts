/** Éléments de l'écran qui peuvent tomber, s'envoler ou être aspirés (menu, cartes, boutons, photos…). */
const SEL = ".card, .navbtn, .bubble, .brandbar, .btn, .chip, .avatar, .msg, h1, h2, nav button, .dsearch, .post, .top, .sideme, img";
export function pickEls(max = 130): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(SEL)).filter((e) => { if (e.closest(".fxbox")) return false; const r = e.getBoundingClientRect(); return r.width > 18 && r.height > 12 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; }).slice(0, max);
}
let cleanup: (() => void) | null = null;
/** Remet tout en place tout de suite (un nouvel effet arrête le précédent). */
export function collapseStop() { cleanup?.(); cleanup = null; }
const R = (a: number, b: number) => a + Math.random() * (b - a);

/** Explosion : l'onde de choc part du centre, chaque élément est projeté, tombe, puis tout se reconstruit. */
export function blastCollapse(cx: number, cy: number) {
  collapseStop();
  const root = document.documentElement; const els = pickEls(); const anims: Animation[] = []; const tms: number[] = [];
  root.classList.add("collapsing");
  const diag = Math.hypot(innerWidth, innerHeight);
  const crack = document.createElement("div"); crack.className = "fxbox crack"; crack.setAttribute("aria-hidden", "true");
  let d = ""; for (let i = 0; i < 16; i++) { const a = (i / 16) * 6.283 + R(-0.2, 0.2); let x = cx, y = cy; d += `M${x},${y}`; for (let j = 0; j < 8; j++) { const l = R(50, 150); x += Math.cos(a + R(-0.5, 0.5)) * l; y += Math.sin(a + R(-0.5, 0.5)) * l; d += `L${x},${y}`; } }
  crack.innerHTML = `<svg width="100%" height="100%"><path d="${d}" fill="none" stroke="rgba(0,0,0,.55)" stroke-width="5"/><path d="${d}" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="1.6"/></svg>`;
  crack.style.opacity = "0"; crack.style.transition = "opacity .12s"; document.body.appendChild(crack); setTimeout(() => { crack.style.opacity = "1"; }, 120);
  const back: { e: HTMLElement; t: string }[] = [];
  els.forEach((e) => {
    const r = e.getBoundingClientRect(); const ex = r.left + r.width / 2, ey = r.top + r.height / 2; const dx = ex - cx, dy = ey - cy; const dist = Math.hypot(dx, dy) || 1; const s = 1.15 - (dist / diag) * 0.8;
    const fx = (dx / dist) * s * R(260, 520) + R(-40, 40), fy = (dy / dist) * s * R(200, 420) - R(60, 200) * s; const fall = innerHeight - ey + R(160, 420); const rot = R(-220, 220) * (0.5 + s);
    const delay = (dist / 2400) * 1000; const mid = `translate(${fx}px,${fy}px) rotate(${rot * 0.45}deg)`; const end = `translate(${fx * 1.3}px,${fall}px) rotate(${rot}deg)`;
    anims.push(e.animate([{ transform: "none", filter: "none", offset: 0, easing: "cubic-bezier(.1,.75,.35,1)" }, { transform: mid, filter: "brightness(.55) saturate(.5)", offset: 0.22, easing: "cubic-bezier(.55,0,.95,.6)" }, { transform: end, filter: "brightness(.3) saturate(.3)", offset: 1 }], { duration: 2300, delay, fill: "forwards" }));
    back.push({ e, t: end });
  });
  tms.push(window.setTimeout(() => {
    crack.style.transition = "opacity .6s"; crack.style.opacity = "0";
    back.forEach(({ e, t }, i) => { const a2 = e.animate([{ transform: t, filter: "brightness(.3)" }, { transform: "none", filter: "none" }], { duration: 850, delay: R(0, 420), easing: "cubic-bezier(.2,1.25,.4,1)", fill: "both" }); anims[i].cancel(); anims.push(a2); });
  }, 3600));
  tms.push(window.setTimeout(() => collapseStop(), 3600 + 420 + 900));
  cleanup = () => { tms.forEach(clearTimeout); anims.forEach((a) => { try { a.cancel(); } catch { /* ignoré */ } }); crack.remove(); root.classList.remove("collapsing"); };
}
