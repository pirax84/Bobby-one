import { useState, type ReactNode } from "react";
import { Modal } from "./common";
import { ACCENTS, accentOf } from "../lib/theme";
import { getPref } from "../lib/uipref";
import { t } from "../i18n";

/** « Aperçu avant de changer un réglage » : une petite feuille montre l'avant et l'après, on applique ou on annule. */
export type PvKind = "mode" | "fs" | "accent" | "style" | "toggle";
type Ask = { kind: PvKind; from: string; to: string; fromLabel: string; toLabel: string; apply: () => void };

const sysDark = () => { try { return window.matchMedia("(prefers-color-scheme: dark)").matches; } catch { return false; } };
export const previewOn = () => getPref("prev", "") !== "0";

function Box({ children, bg, fg, border }: { children: ReactNode; bg: string; fg: string; border?: string }) {
  return <div style={{ background: bg, color: fg, border: border || "1px solid rgba(120,120,160,.35)", borderRadius: 16, minHeight: 92, display: "grid", placeItems: "center", padding: 10, textAlign: "center", overflow: "hidden" }}>{children}</div>;
}
function Mock({ kind, v, label }: { kind: PvKind; v: string; label: string }) {
  if (kind === "mode") {
    const dark = v === "dark" || (v === "auto" && sysDark());
    return <Box bg={dark ? "#14185F" : "#F5F2FF"} fg={dark ? "#EDEEFF" : "#1B1F6E"}><div><b style={{ letterSpacing: 1 }}>NOTIIF</b><div style={{ marginTop: 8, height: 14, width: 70, borderRadius: 99, background: dark ? "#8E9BFF" : "#2A2E85", margin: "8px auto 0" }} /></div></Box>;
  }
  if (kind === "fs") {
    const px = ({ petit: 12, normal: 16, grand: 20, tgrand: 26 } as Record<string, number>)[v] || 16;
    return <Box bg="var(--card, #F5F2FF)" fg="var(--text, #1B1F6E)"><b style={{ fontSize: px, lineHeight: 1.2 }}>{t("Bonjour Marie !")}</b></Box>;
  }
  if (kind === "accent") {
    const a = accentOf(v);
    return <Box bg="var(--card, #F5F2FF)" fg="var(--text, #1B1F6E)"><div><span style={{ display: "inline-block", width: 34, height: 34, borderRadius: "50%", background: a.dot }} /><div style={{ marginTop: 8, height: 14, width: 80, borderRadius: 99, background: a.dot, margin: "8px auto 0" }} /></div></Box>;
  }
  if (kind === "style") {
    const bold = v === "bold";
    return <Box bg="var(--card, #F5F2FF)" fg="var(--text, #1B1F6E)"><div style={{ width: "80%", height: 52, borderRadius: 14, border: bold ? "3px solid currentColor" : "1px solid rgba(120,120,160,.35)", background: "rgba(120,120,160,.08)" }} /></Box>;
  }
  const on = v === "1";
  return <Box bg="var(--card, #F5F2FF)" fg="var(--text, #1B1F6E)"><div><b style={{ fontSize: 13 }}>{label}</b><div style={{ margin: "10px auto 0", width: 46, height: 26, borderRadius: 99, background: on ? "#4A55D6" : "rgba(120,120,160,.45)", position: "relative" }}><span style={{ position: "absolute", top: 3, left: on ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .2s" }} /></div></div></Box>;
}

export function usePreviewAsk() {
  const [a, setA] = useState<Ask | null>(null);
  const ask = (x: Ask) => { if (x.from === x.to) return; if (!previewOn()) { x.apply(); return; } setA(x); };
  const node = a ? <Modal title={t("Changer ce réglage ?")} onClose={() => setA(null)}>
    <div className="col" style={{ gap: 12 }}>
      <p className="muted small" style={{ margin: 0 }}>{t("Voilà ce que ça change à l'écran.")}</p>
      <div className="row" style={{ gap: 10, alignItems: "stretch" }}>
        <div className="col grow" style={{ gap: 6 }}><Mock kind={a.kind} v={a.from} label={a.fromLabel} /><div className="small center"><b>{t("Avant")}</b> · {a.fromLabel}</div></div>
        <div className="col grow" style={{ gap: 6 }}><Mock kind={a.kind} v={a.to} label={a.toLabel} /><div className="small center"><b>{t("Après")}</b> · {a.toLabel}</div></div>
      </div>
      <div className="row" style={{ gap: 10 }}>
        <button type="button" className="btn ghost grow" onClick={() => setA(null)}>{t("Annuler")}</button>
        <button type="button" className="btn grow" onClick={() => { const f = a.apply; setA(null); f(); }}>{t("Appliquer")}</button>
      </div>
    </div></Modal> : null;
  return { ask, node };
}
void ACCENTS;
