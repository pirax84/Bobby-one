// Fabrique un QR code (SVG) pour un texte, sans réseau. Bibliothèque MIT de Kazuhiko Arase (dossier qrv).
import { QRCode, QRLevel as LV } from "./qrbundle";
export function qrSvg(text: string): string {
  const q = new QRCode(-1, LV.M); q.addData(text); q.make(); const n: number = q.getModuleCount(); const b = 4, s = 8, W = (n + 2 * b) * s; let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${(c + b) * s} ${(r + b) * s}h${s}v${s}h-${s}z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" width="220" height="220" role="img"><rect width="${W}" height="${W}" fill="#fff"/><path d="${d}" fill="#0B1030"/></svg>`;
}
