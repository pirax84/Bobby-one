const R = (a: number, b: number) => a + Math.random() * (b - a);
const KNOCKS = [0.5, 0.95, 1.4, 3.0, 3.35, 3.7, 4.05]; // instants des coups (s), les mêmes que dans le son
const RINGS = [0.5, 2.9]; // appuis sur la sonnette
export const DOOR_DUR = { knock: 5.4, bell: 5.6 };

/** La porte en bois (veines, panneaux, poignée, judas), dessinée une seule fois. */
function doorImage(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas"); c.width = Math.ceil(w); c.height = Math.ceil(h); const g = c.getContext("2d")!;
  const bg = g.createLinearGradient(0, 0, w, 0); bg.addColorStop(0, "#6e4222"); bg.addColorStop(0.5, "#835029"); bg.addColorStop(1, "#5e361a"); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) { const x = R(0, w); g.strokeStyle = `rgba(${R(0, 1) < 0.6 ? "30,15,5" : "190,130,80"},${R(0.04, 0.16)})`; g.lineWidth = R(0.6, 2.2); g.beginPath(); g.moveTo(x, 0); let xx = x; for (let y = 0; y <= h; y += 40) { xx += R(-3, 3); g.lineTo(xx, y); } g.stroke(); }
  for (let i = 0; i < 5; i++) { const kx = R(w * 0.1, w * 0.9), ky = R(h * 0.05, h * 0.95); for (let r = 3; r < 16; r += 3) { g.strokeStyle = `rgba(40,20,8,${0.22 - r * 0.01})`; g.lineWidth = 1.4; g.beginPath(); g.ellipse(kx, ky, r * 0.7, r * 1.6, 0, 0, 6.283); g.stroke(); } }
  const pw = w * 0.34, ph = h * 0.24, gx = w * 0.09; const P: [number, number][] = [[gx, h * 0.06], [w - gx - pw, h * 0.06], [gx, h * 0.36], [w - gx - pw, h * 0.36]];
  const lowH = h * 0.4; P.push([gx, h * 0.62], [w - gx - pw, h * 0.62]);
  P.forEach(([x, y], i) => { const hh = i >= 4 ? Math.min(lowH * 0.9, h * 0.32) : ph; g.fillStyle = "rgba(0,0,0,.28)"; g.fillRect(x - 3, y - 3, pw + 6, hh + 6); const pg = g.createLinearGradient(x, y, x + pw, y + hh); pg.addColorStop(0, "#74482a"); pg.addColorStop(1, "#5a3419"); g.fillStyle = pg; g.fillRect(x, y, pw, hh); g.fillStyle = "rgba(255,210,160,.22)"; g.fillRect(x, y, pw, 3); g.fillRect(x, y, 3, hh); g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(x, y + hh - 3, pw, 3); g.fillRect(x + pw - 3, y, 3, hh); });
  // judas
  const jx = w / 2, jy = h * 0.2; const jg = g.createRadialGradient(jx - 3, jy - 3, 1, jx, jy, 12); jg.addColorStop(0, "#fff7d0"); jg.addColorStop(0.35, "#c9a64a"); jg.addColorStop(1, "#5c4310"); g.fillStyle = jg; g.beginPath(); g.arc(jx, jy, 12, 0, 6.283); g.fill(); g.fillStyle = "#050505"; g.beginPath(); g.arc(jx, jy, 5, 0, 6.283); g.fill();
  // plaque + poignée + serrure
  const hx = w * 0.86, hy = h * 0.5; g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(hx - 15, hy - 70, 30, 150); const pg = g.createLinearGradient(hx - 14, 0, hx + 14, 0); pg.addColorStop(0, "#8a6a1f"); pg.addColorStop(0.5, "#f3d98b"); pg.addColorStop(1, "#7a5a18"); g.fillStyle = pg; g.fillRect(hx - 13, hy - 72, 26, 146);
  const kg = g.createRadialGradient(hx - 6, hy - 18, 2, hx, hy - 10, 20); kg.addColorStop(0, "#fff3c2"); kg.addColorStop(0.4, "#d4ac4a"); kg.addColorStop(1, "#6b4b0e"); g.fillStyle = kg; g.beginPath(); g.arc(hx, hy - 10, 18, 0, 6.283); g.fill();
  g.fillStyle = "#17110a"; g.beginPath(); g.arc(hx, hy + 38, 4, 0, 6.283); g.fill(); g.fillRect(hx - 1.5, hy + 38, 3, 12);
  // ombre sur les bords
  const eg = g.createLinearGradient(0, 0, w, 0); eg.addColorStop(0, "rgba(0,0,0,.35)"); eg.addColorStop(0.06, "rgba(0,0,0,0)"); eg.addColorStop(0.94, "rgba(0,0,0,0)"); eg.addColorStop(1, "rgba(0,0,0,.35)"); g.fillStyle = eg; g.fillRect(0, 0, w, h);
  return c;
}
/** Petit tremblement de l'écran à chaque coup (très léger, ne touche pas à l'effet). */
function tremble(amp: number) {
  const el = document.querySelector<HTMLElement>(".shell"); if (!el) return;
  try { el.animate([{ transform: "translate(0,0)" }, { transform: `translate(${amp}px,${-amp * 0.5}px)` }, { transform: `translate(${-amp * 0.8}px,${amp * 0.4}px)` }, { transform: `translate(${amp * 0.4}px,0)` }, { transform: "translate(0,0)" }], { duration: 170, easing: "ease-out" }); } catch { /* ignoré */ }
}
/** Quelqu'un frappe à la porte (« toc toc »), ou sonne : décor réaliste plein écran de 5 secondes, synchronisé avec le son. */
export function doorShow(kind: "knock" | "bell") {
  const box = document.createElement("div"); box.className = "fxbox sc"; box.setAttribute("aria-hidden", "true");
  const cv = document.createElement("canvas"); box.appendChild(cv); const dpr = Math.min(2, devicePixelRatio || 1); const W = innerWidth, H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr; cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%"; const g = cv.getContext("2d"); if (!g) return; g.scale(dpr, dpr); document.body.appendChild(box);
  const D = DOOR_DUR[kind]; const dh = H * 0.9, dw = Math.min(W * 0.84, dh * 0.5), dx = (W - dw) / 2, dy = H * 0.04; const door = kind === "knock" ? doorImage(dw, dh) : null;
  const dust = Array.from({ length: 40 }, () => ({ x: R(dx, dx + dw), y: R(dy - 20, dy + 30), vy: R(10, 50), s: R(0.8, 2.2), t0: R(0, 4) }));
  const done = new Set<number>(); const t0 = performance.now(); let raf = 0;
  const wall = (f: number) => { const w = g.createLinearGradient(0, 0, 0, H); w.addColorStop(0, "#241a15"); w.addColorStop(1, "#0e0908"); g.globalAlpha = f; g.fillStyle = w; g.fillRect(0, 0, W, H); for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,235,210,${0.012 + (i % 5) * 0.002})`; g.fillRect((i * 97) % W, (i * 53) % H, 2 + (i % 4), 2); } };
  const frame = (now: number) => {
    if (!box.isConnected) return; const t = (now - t0) / 1000; const f = Math.min(1, t / 0.35) * Math.min(1, Math.max(0, (D - t) / 0.6));
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H); wall(f);
    if (kind === "knock" && door) {
      for (const kt of KNOCKS) if (t >= kt && !done.has(kt)) { done.add(kt); tremble(kt > 2.9 ? 3.2 : 2.2); }
      const last = [...KNOCKS].filter((k) => k <= t).pop(); const age = last === undefined ? 9 : t - last; const sh = Math.sin(age * 90) * Math.exp(-age * 16) * (last && last > 2.9 ? 7 : 5);
      // lumière du couloir sous la porte + ombres de pieds
      const by = dy + dh; const lg = g.createLinearGradient(0, by - 6, 0, by + 70); lg.addColorStop(0, `rgba(255,205,130,${0.75 * f})`); lg.addColorStop(1, "rgba(255,205,130,0)"); g.globalAlpha = 1; g.fillStyle = lg; g.fillRect(dx - 30, by - 6, dw + 60, 76);
      g.globalAlpha = f; g.fillStyle = "rgba(0,0,0,.9)"; g.fillRect(dx, by - 7, dw, 7);
      const fs = t > 1.7 && t < 3.0 ? Math.min(1, (t - 1.7) / 0.3) * Math.min(1, (3.0 - t) / 0.3) : 0; if (fs > 0) { g.fillStyle = `rgba(20,10,5,${0.8 * fs * f})`; g.beginPath(); g.ellipse(W / 2 - dw * 0.12, by - 3, dw * 0.07, 3, 0, 0, 6.283); g.ellipse(W / 2 + dw * 0.1, by - 3, dw * 0.07, 3, 0, 0, 6.283); g.fill(); }
      // chambranle
      g.globalAlpha = f; const fr = 20; const fg = g.createLinearGradient(dx - fr, 0, dx + dw + fr, 0); fg.addColorStop(0, "#4a2f1b"); fg.addColorStop(0.5, "#6b4527"); fg.addColorStop(1, "#3d2515"); g.fillStyle = fg; g.fillRect(dx - fr, dy - fr, dw + fr * 2, dh + fr); g.fillStyle = "rgba(255,220,170,.18)"; g.fillRect(dx - fr, dy - fr, dw + fr * 2, 3);
      g.save(); g.translate(sh, 0); g.drawImage(door, dx, dy, dw, dh - 7); g.restore();
      g.globalAlpha = 1; for (const kt of KNOCKS) { const a = t - kt; if (a < 0 || a > 0.55) continue; const cx2 = dx + dw * 0.5, cy2 = dy + dh * 0.45; g.strokeStyle = `rgba(255,225,180,${0.5 * (1 - a / 0.55) * f})`; g.lineWidth = 3; g.beginPath(); g.ellipse(cx2 + sh, cy2, a * 260, a * 330, 0, 0, 6.283); g.stroke(); }
      g.fillStyle = "rgba(220,200,170,.8)"; for (const d of dust) { const a = t - d.t0 - 0.5; if (a < 0 || a > 3) continue; g.globalAlpha = 0.5 * f * (1 - a / 3); g.fillRect(d.x, d.y + a * d.vy * 3, d.s, d.s); }
    } else {
      // sonnette : plaque en laiton sur le mur, bouton qui s'enfonce, ondes sonores
      const s = Math.min(W, H) / 700; const px = W / 2, py = H * 0.5; const pw = 130 * s, ph = 230 * s;
      g.globalAlpha = f; const pg = g.createLinearGradient(px - pw / 2, 0, px + pw / 2, 0); pg.addColorStop(0, "#7d6320"); pg.addColorStop(0.25, "#e8cf7e"); pg.addColorStop(0.55, "#c9a64a"); pg.addColorStop(1, "#6e5518");
      g.fillStyle = "rgba(0,0,0,.5)"; g.beginPath(); g.roundRect(px - pw / 2 + 8 * s, py - ph / 2 + 12 * s, pw, ph, 18 * s); g.fill(); g.fillStyle = pg; g.beginPath(); g.roundRect(px - pw / 2, py - ph / 2, pw, ph, 18 * s); g.fill(); g.strokeStyle = "rgba(255,245,200,.5)"; g.lineWidth = 2; g.stroke();
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { g.fillStyle = "#4a3a12"; g.beginPath(); g.arc(px + sx * (pw / 2 - 16 * s), py + sy * (ph / 2 - 16 * s), 5 * s, 0, 6.283); g.fill(); }
      let press = 0; let ringA = 9; for (const rt of RINGS) { const a = t - rt; if (a >= 0 && a < 1.8) { ringA = Math.min(ringA, a); if (a < 0.25) press = Math.max(press, Math.sin((a / 0.25) * Math.PI)); if (a < 1.6 && a > 0.45 && rt > 2) press = Math.max(press, a < 1.2 ? 1 : 0); } }
      const glow = ringA < 2 ? Math.max(0, 1 - ringA / 1.8) : 0; const by = py - 20 * s; const bR = 38 * s;
      g.globalCompositeOperation = "lighter"; const lgl = g.createRadialGradient(px, by, bR * 0.5, px, by, bR * 3.2); lgl.addColorStop(0, `rgba(255,190,90,${0.7 * glow * f})`); lgl.addColorStop(1, "rgba(255,190,90,0)"); g.fillStyle = lgl; g.beginPath(); g.arc(px, by, bR * 3.2, 0, 6.283); g.fill(); g.globalCompositeOperation = "source-over";
      g.fillStyle = "#2b2210"; g.beginPath(); g.arc(px, by, bR + 6 * s, 0, 6.283); g.fill(); g.strokeStyle = `rgba(255,190,90,${0.35 + 0.65 * glow})`; g.lineWidth = 4 * s; g.beginPath(); g.arc(px, by, bR + 6 * s, 0, 6.283); g.stroke();
      const sc = 1 - 0.1 * press; const bg2 = g.createRadialGradient(px - 10 * s, by - 12 * s, 2, px, by, bR * sc); bg2.addColorStop(0, "#ffffff"); bg2.addColorStop(0.6, "#e9e2cf"); bg2.addColorStop(1, press > 0.5 ? "#9a937f" : "#b9b19a"); g.fillStyle = bg2; g.beginPath(); g.arc(px, by + 2 * s * press, bR * sc, 0, 6.283); g.fill();
      g.fillStyle = "#3a2d0f"; g.font = `bold ${15 * s}px system-ui,sans-serif`; g.textAlign = "center"; g.fillText("RING", px, py + 78 * s);
      for (const rt of RINGS) for (let k = 0; k < 4; k++) { const a = t - rt - k * 0.16; if (a < 0 || a > 1.4) continue; g.strokeStyle = `rgba(255,225,170,${0.5 * (1 - a / 1.4) * f})`; g.lineWidth = 3 * s; g.beginPath(); g.arc(px, by, bR + a * 330 * s, 0, 6.283); g.stroke(); }
      if (RINGS.some((rt) => t > rt && t < rt + 0.1)) { const rt = RINGS.find((r) => t > r && t < r + 0.1)!; if (!done.has(rt)) { done.add(rt); tremble(1.6); } }
    }
    const v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, `rgba(0,0,0,${0.55 * f})`); g.globalAlpha = 1; g.fillStyle = v; g.fillRect(0, 0, W, H);
    if (t < D) raf = requestAnimationFrame(frame); else box.remove();
  };
  raf = requestAnimationFrame(frame); void raf;
}
