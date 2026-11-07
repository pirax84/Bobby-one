const D = 11.5; // durée (s)
let stopper: (() => void) | null = null;
export function fogStop() { stopper?.(); stopper = null; }

/** Texture de brume : bruit fractal qui se répète sans couture (sert de nuages de brouillard). */
function fogTexture(size = 256): HTMLCanvasElement {
  const grid = (g: number) => Array.from({ length: g * g }, () => Math.random());
  const oct = [grid(4), grid(8), grid(16), grid(32), grid(64)]; const gs = [4, 8, 16, 32, 64]; const amp = [0.5, 0.27, 0.14, 0.07, 0.04];
  const sm = (t: number) => t * t * (3 - 2 * t);
  const c = document.createElement("canvas"); c.width = c.height = size; const g = c.getContext("2d")!; const im = g.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0; for (let o = 0; o < 5; o++) { const n = gs[o]; const fx = (x / size) * n, fy = (y / size) * n; const x0 = Math.floor(fx), y0 = Math.floor(fy); const tx = sm(fx - x0), ty = sm(fy - y0); const G = oct[o]; const a = G[(y0 % n) * n + (x0 % n)], b = G[(y0 % n) * n + ((x0 + 1) % n)], c2 = G[((y0 + 1) % n) * n + (x0 % n)], d = G[((y0 + 1) % n) * n + ((x0 + 1) % n)]; v += amp[o] * (a + (b - a) * tx + (c2 - a) * ty + (a - b - c2 + d) * tx * ty); }
    const al = Math.max(0, Math.min(1, (v - 0.28) * 2.1)); const i = (y * size + x) * 4; im.data[i] = 226; im.data[i + 1] = 232; im.data[i + 2] = 238; im.data[i + 3] = al * 255;
  }
  g.putImageData(im, 0, 0); return c;
}
/** Brouillard : la brume monte du sol, s'épaissit jusqu'à tout cacher (l'écran devient flou), puis se lève. */
export function fogShow() {
  fogStop();
  const box = document.createElement("div"); box.className = "fxbox sc"; box.setAttribute("aria-hidden", "true");
  const cv = document.createElement("canvas"); box.appendChild(cv); const dpr = Math.min(1.5, window.devicePixelRatio || 1); const W = innerWidth, H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr; cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%"; const g = cv.getContext("2d"); if (!g) return; g.scale(dpr, dpr); document.body.appendChild(box);
  const dark = document.documentElement.dataset.theme !== "light"; if (dark) box.style.filter = "brightness(.5) saturate(.8)"; const tex = fogTexture(); const t0 = performance.now(); let raf = 0;
  const L = [{ s: 1.9, vx: 14, vy: 2, a: 0.9, ph: 0 }, { s: 1.3, vx: -22, vy: -3, a: 0.8, ph: 90 }, { s: 0.85, vx: 36, vy: 4, a: 0.65, ph: 40 }, { s: 2.6, vx: 8, vy: -1, a: 0.7, ph: 160 }];
  const tile = (img: HTMLCanvasElement, w: number, ox: number, oy: number, alpha: number) => { const sz = w; const x0 = ((ox % sz) + sz) % sz - sz, y0 = ((oy % sz) + sz) % sz - sz; g.globalAlpha = alpha; for (let y = y0; y < H; y += sz) for (let x = x0; x < W; x += sz) g.drawImage(img, x, y, sz + 1, sz + 1); };
  const ease = (x: number) => x * x * (3 - 2 * x);
  const frame = (now: number) => {
    if (!box.isConnected) return; const t = (now - t0) / 1000;
    const d = ease(Math.min(1, t / 5.5)) * 0.9 * ease(Math.min(1, Math.max(0, (D - t) / 3))); // densité 0 → 1 → 0
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    // voile de fond et brume rampante qui monte du sol
    g.globalAlpha = 1; g.fillStyle = `rgba(214,222,230,${0.24 * d})`; g.fillRect(0, 0, W, H);
    const gr = g.createLinearGradient(0, H, 0, 0); gr.addColorStop(0, `rgba(236,240,244,${Math.min(1, d * 1.25)})`); gr.addColorStop(0.5, `rgba(226,232,238,${d * 0.55})`); gr.addColorStop(1, `rgba(214,222,230,${d * 0.25})`); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // nappes de brume qui dérivent à des vitesses différentes (profondeur)
    for (const l of L) tile(tex, Math.max(W, H) * l.s * 0.8, l.vx * t + l.ph * 3, l.vy * t + l.ph, l.a * d * 1.15);
    // bords plus denses
    const v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.75); v.addColorStop(0, "rgba(230,236,242,0)"); v.addColorStop(1, `rgba(230,236,242,${0.7 * d})`); g.globalAlpha = 1; g.fillStyle = v; g.fillRect(0, 0, W, H);
    try { box.style.backdropFilter = `blur(${(7 * d).toFixed(1)}px)`; (box.style as any).webkitBackdropFilter = box.style.backdropFilter; } catch { /* ignoré */ }
    if (t < D) raf = requestAnimationFrame(frame); else fogStop();
  };
  raf = requestAnimationFrame(frame);
  stopper = () => { cancelAnimationFrame(raf); box.remove(); };
}
