// Lecture réelle des images : texte (OCR) et QR codes. Les outils sont chargés à la demande.
const loaded: Record<string, Promise<void>> = {};
export function loadScript(src: string): Promise<void> {
  return (loaded[src] ||= new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.async = true; s.onload = () => res(); s.onerror = () => { delete loaded[src]; rej(new Error("load")); }; document.head.appendChild(s); }));
}
export async function ocr(file: File, onProgress?: (p: number) => void): Promise<string> {
  await loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js");
  const T = (window as any).Tesseract; if (!T) throw new Error("load");
  const { data } = await T.recognize(file, "fra+eng", { logger: (m: any) => { if (m.status === "recognizing text" && onProgress) onProgress(m.progress || 0); } });
  return String(data?.text || "").trim();
}
export async function decodeQr(file: File): Promise<string | null> {
  const bmp = await createImageBitmap(file);
  const draw = (w: number, h: number, filter = "none", gray = false) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d", { willReadFrequently: true })!; g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); try { (g as any).filter = filter; } catch {} g.drawImage(bmp, 0, 0, w, h); return { c, g }; };
  const sizes = [1200, 800, 500, 320, 220].map((m) => { const k = Math.min(1, m / Math.max(bmp.width, bmp.height)); return [Math.max(40, Math.round(bmp.width * k)), Math.max(40, Math.round(bmp.height * k))] as [number, number]; }).filter((x, i, a) => a.findIndex((y) => y[0] === x[0]) === i);
  // 1) lecteur intégré du téléphone (le plus fiable, il lit aussi les QR codes décorés avec un logo)
  try { const BD = (window as any).BarcodeDetector; if (BD) { const det = new BD({ formats: ["qr_code"] }); for (const [w, h] of sizes) { const { c } = draw(w, h); const r = await det.detect(c); if (r[0]?.rawValue) return r[0].rawValue; } } } catch {}
  // 2) lecteur de secours : plusieurs tailles et un léger flou (il « arrondit » les points des QR décorés), en clair et en inversé
  try {
    await loadScript("https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js"); const jsQR = (window as any).jsQR; if (!jsQR) return null;
    for (const f of ["none", "blur(1px) contrast(1.6) grayscale(1)", "blur(2px) contrast(2.2) grayscale(1)"]) for (const [w, h] of sizes) {
      const { g } = draw(w, h, f); const d = g.getImageData(0, 0, w, h); const q = jsQR(d.data, w, h, { inversionAttempts: "attemptBoth" }); if (q?.data) return q.data;
    }
    return null;
  } catch { return null; }
}
// Un texte lu dans une image est exploitable seulement s'il contient de vrais mots (sinon c'est du charabia, par exemple un QR code lu comme du texte).
export function realText(t: string): boolean { const w = (t.match(/\p{L}{3,}/gu) || []).filter((x) => /[aeiouyàâéèêëîïôùûü]/i.test(x)); return w.length >= 4 && w.join("").length >= 20; }
