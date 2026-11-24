// Lecture du contenu d'un document importé : PDF, image/photo, e-mail enregistré (.eml) ou texte.
import { ocr, decodeQr, loadScript, realText } from "./vision";
import { senderFromText } from "./senders";

const PDFJS = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/";

async function pdfText(file: File, onProgress?: (p: number) => void): Promise<string> {
  await loadScript(PDFJS + "pdf.min.js");
  const lib = (window as any).pdfjsLib; if (!lib) throw new Error("load");
  lib.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.js";
  const doc = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages = Math.min(doc.numPages, 6); let out = "";
  for (let i = 1; i <= pages; i++) {
    const page = await doc.getPage(i); const c = await page.getTextContent();
    let lastY: number | null = null;
    for (const it of c.items as any[]) { const y = it.transform?.[5]; out += (lastY !== null && Math.abs(y - lastY) > 4 ? "\n" : " ") + it.str; lastY = y; }
    // Champs à remplir d'un formulaire PDF (Cerfa…) : leurs noms aident à reconnaître ce qu'il faut écrire.
    try { const ann = await page.getAnnotations(); ann.filter((a: any) => a.fieldName).forEach((a: any) => { out += "\n" + String(a.alternativeText || a.fieldName) + " :"; }); } catch {}
    out += "\n"; onProgress?.(i / pages / 2);
  }
  // PDF scanné (sans texte) : on lit les deux premières pages comme des images.
  if (!realText(out)) {
    for (let i = 1; i <= Math.min(doc.numPages, 2); i++) {
      const page = await doc.getPage(i); const vp = page.getViewport({ scale: 2 });
      const cv = document.createElement("canvas"); cv.width = vp.width; cv.height = vp.height;
      await page.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise;
      const blob: Blob = await new Promise((r) => cv.toBlob((b) => r(b!), "image/png"));
      out += "\n" + await ocr(new File([blob], "page.png", { type: "image/png" }), (p) => onProgress?.(0.5 + (i - 1 + p) / 4));
    }
  }
  return out.replace(/[ \t]+/g, " ").trim();
}

function decodeQP(s: string) { return s.replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))); }

export interface ReadDoc { text: string; sender: string; }
export async function readDocument(file: File, onProgress?: (p: number) => void): Promise<ReadDoc> {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return { text: await pdfText(file, onProgress), sender: "" };
  if (file.type.startsWith("image/")) {
    const t = await ocr(file, onProgress); const q = await decodeQr(file).catch(() => null);
    const text = [realText(t) ? t : "", q ? "QR code : " + q : ""].join("\n").trim();
    return { text, sender: senderFromText(t) };
  }
  let raw = await file.text();
  if (name.endsWith(".eml") || /^(from|received|return-path):/im.test(raw.slice(0, 2000))) {
    const [head, ...body] = raw.split(/\r?\n\r?\n/); const sender = senderFromText(head) || (head.match(/^reply-to:.*$/im)?.[0] ? senderFromText(head.replace(/^reply-to/im, "From")) : "");
    const subject = head.match(/^subject:\s*(.+)$/im)?.[1] || "";
    let b = body.join("\n\n"); if (/quoted-printable/i.test(raw)) b = decodeQP(b);
    raw = "Objet : " + subject + "\n" + b;
    return { text: raw.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/[ \t]+/g, " ").trim().slice(0, 30000), sender };
  }
  const text = raw.replace(/<[^>]+>/g, " ").replace(/[ \t]+/g, " ").trim().slice(0, 30000);
  return { text, sender: senderFromText(text) };
}
