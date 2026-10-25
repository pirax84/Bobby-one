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
  try { const BD = (window as any).BarcodeDetector; if (BD) { const r = await new BD({ formats: ["qr_code"] }).detect(bmp); if (r[0]?.rawValue) return r[0].rawValue; } } catch {}
  try {
    await loadScript("https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js"); const jsQR = (window as any).jsQR; if (!jsQR) return null;
    const k = Math.min(1, 1200 / Math.max(bmp.width, bmp.height)); const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
    const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d")!; g.drawImage(bmp, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h); const q = jsQR(d.data, w, h); return q?.data || null;
  } catch { return null; }
}
