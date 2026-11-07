/** Éléments de l'écran qui peuvent tomber, s'envoler ou être aspirés (menu, cartes, boutons, photos…). */
const SEL = ".card, .navbtn, .bubble, .brandbar, .btn, .chip, .avatar, .msg, h1, h2, nav button, .dsearch, .post, .top, .sideme, img";
export function pickEls(max = 130): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(SEL)).filter((e) => { if (e.closest(".fxbox")) return false; const r = e.getBoundingClientRect(); return r.width > 18 && r.height > 12 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; }).slice(0, max);
}
let cleanup: (() => void) | null = null;
/** Remet tout en place tout de suite (un nouvel effet arrête le précédent). */
export function collapseStop() { cleanup?.(); cleanup = null; }
const R = (a: number, b: number) => a + Math.random() * (b - a);

/** Explosion : l'onde de choc part du centre. Les gros blocs de l'écran éclatent en morceaux, le reste est projeté ; puis tout se reconstruit. */
export function blastCollapse(cx: number, cy: number) {
  collapseStop();
  const root = document.documentElement; const els = pickEls(); const tms: number[] = []; const all: Animation[] = [];
  root.classList.add("collapsing");
  const diag = Math.hypot(innerWidth, innerHeight);
  const shards = document.createElement("div"); shards.setAttribute("aria-hidden", "true"); shards.style.cssText = "position:fixed;inset:0;z-index:199;pointer-events:none;overflow:hidden"; document.body.appendChild(shards);
  const items: { e: HTMLElement; a: Animation; end: string }[] = [];
  const sized = els.map((e) => { const r = e.getBoundingClientRect(); return { e, r, area: r.width * r.height }; });
  const big = new Set(sized.filter((x) => x.area > 5000 && x.r.width < innerWidth * 0.95).sort((a, b) => b.area - a.area).slice(0, 14).map((x) => x.e));
  sized.forEach(({ e, r }) => {
    const ex = r.left + r.width / 2, ey = r.top + r.height / 2; const dx = ex - cx, dy = ey - cy; const dist = Math.hypot(dx, dy) || 1; const s = 1.2 - (dist / diag) * 0.8;
    const delay = (dist / 3200) * 1000; const fall = innerHeight - ey + R(160, 420); const rot = R(-260, 260) * (0.5 + s); const fx = (dx / dist) * s * R(300, 620) + R(-40, 40), fy = (dy / dist) * s * R(220, 460) - R(60, 220) * s;
    const end = `translate(${fx * 1.3}px,${fall}px) rotate(${rot}deg)`;
    if (big.has(e)) {
      // éclats : 2×2 cases coupées en triangles, chaque morceau est une copie de l'élément
      const gx = [0, 50 + R(-12, 12), 100], gy = [0, 50 + R(-12, 12), 100]; const pts = (i: number, j: number) => [[gx[i], gy[j]], [gx[i + 1], gy[j]], [gx[i + 1], gy[j + 1]], [gx[i], gy[j + 1]]];
      for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) { const q = pts(a, b); for (const tri of [[q[0], q[1], q[2]], [q[0], q[2], q[3]]]) {
        const c = e.cloneNode(true) as HTMLElement; c.style.cssText += `;position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;margin:0;box-sizing:border-box;clip-path:polygon(${tri.map((p) => p[0] + "% " + p[1] + "%").join(",")});will-change:transform`; c.removeAttribute("id"); shards.appendChild(c);
        const mx = r.left + (r.width * (tri[0][0] + tri[1][0] + tri[2][0])) / 300, my = r.top + (r.height * (tri[0][1] + tri[1][1] + tri[2][1])) / 300; const ddx = mx - cx, ddy = my - cy; const dd = Math.hypot(ddx, ddy) || 1; const k = 1.25 - (dd / diag) * 0.8;
        const px = (ddx / dd) * k * R(380, 800), py = (ddy / dd) * k * R(260, 560) - R(80, 300) * k; const pr = R(-420, 420);
        all.push(c.animate([{ transform: "none", filter: "none", opacity: 1, offset: 0, easing: "cubic-bezier(.08,.8,.3,1)" }, { transform: `translate(${px}px,${py}px) rotate(${pr * 0.5}deg) scale(.95)`, filter: "brightness(.5) saturate(.4)", opacity: 1, offset: 0.25, easing: "cubic-bezier(.55,0,.95,.55)" }, { transform: `translate(${px * 1.4}px,${innerHeight - my + R(200, 500)}px) rotate(${pr}deg) scale(.8)`, filter: "brightness(.25) saturate(.2)", opacity: 1, offset: 1 }], { duration: 2300, delay, fill: "forwards" })); } }
      const a = e.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1, delay, fill: "forwards" }); items.push({ e, a, end });
    } else {
      const a = e.animate([{ transform: "none", filter: "none", offset: 0, easing: "cubic-bezier(.08,.8,.3,1)" }, { transform: `translate(${fx}px,${fy}px) rotate(${rot * 0.45}deg)`, filter: "brightness(.5) saturate(.4)", offset: 0.22, easing: "cubic-bezier(.55,0,.95,.6)" }, { transform: end, filter: "brightness(.25) saturate(.3)", offset: 1 }], { duration: 2300, delay, fill: "forwards" }); items.push({ e, a, end });
    }
  });
  tms.push(window.setTimeout(() => {
    shards.remove();
    items.forEach(({ e, a, end }) => { const a2 = e.animate([{ transform: end, filter: "brightness(.25)", opacity: 1 }, { transform: "none", filter: "none", opacity: 1 }], { duration: 900, delay: R(0, 450), easing: "cubic-bezier(.2,1.2,.4,1)", fill: "both" }); a.cancel(); all.push(a2); });
  }, 3700));
  tms.push(window.setTimeout(() => collapseStop(), 3700 + 450 + 950));
  cleanup = () => { tms.forEach(clearTimeout); all.forEach((a) => { try { a.cancel(); } catch { /* ignoré */ } }); items.forEach(({ a }) => { try { a.cancel(); } catch { /* ignoré */ } }); shards.remove(); root.classList.remove("collapsing"); };
}
