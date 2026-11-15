import { useState } from "react";
import { t } from "../i18n";
import { actions } from "../lib/store";
import { MkTile } from "./common";

type K = "notif" | "mic" | "cam";
const G: Record<K, string> = { notif: "linear-gradient(135deg,#FF8FA3,#E0609A)", mic: "linear-gradient(135deg,#5EE0C8,#2BB8D8 60%,var(--brand))", cam: "linear-gradient(135deg,var(--brand),var(--brand2))" };
const SVG: Record<K, JSX.Element> = {
  notif: <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 21h4" />,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
  cam: <><path d="M4 8h3l1.6-2.2h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13.4" r="3.6" /></>,
};

async function ask(k: K): Promise<boolean> {
  try {
    if (k === "notif") {
      if (typeof Notification === "undefined") return false;
      const r = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      if (r === "granted") actions.setSetting("push", true);
      return r === "granted";
    }
    const s = await navigator.mediaDevices.getUserMedia(k === "mic" ? { audio: true } : { video: true });
    s.getTracks().forEach((x) => x.stop());
    return true;
  } catch { return false; }
}

/** Écran du premier lancement : demande d'un coup les autorisations notifications, micro et caméra. */
export function Perms({ onDone }: { onDone: () => void }) {
  const [st, setSt] = useState<Partial<Record<K, boolean>>>({});
  const [busy, setBusy] = useState(false);
  const rows: [K, string, string][] = [["notif", t("Notifications"), t("Être prévenu d'un message, même appli fermée")], ["mic", t("Micro"), t("Envoyer des vocaux et passer des appels")], ["cam", t("Caméra"), t("Photos, vidéos et appels vidéo")]];
  const one = async (k: K) => { const ok = await ask(k); setSt((p) => ({ ...p, [k]: ok })); return ok; };
  const all = async () => { setBusy(true); for (const [k] of rows) await one(k); setBusy(false); done(); };
  const done = () => { try { localStorage.setItem("notiif-perms", "1"); } catch { /* rien */ } onDone(); };
  return (
    <div role="dialog" aria-modal="true" aria-label={t("Pour bien fonctionner")} style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "24px 20px", maxWidth: 440, margin: "0 auto" }}>
      <MkTile k="ii" size={76} />
      <h2 style={{ margin: "6px 0 0", textAlign: "center" }}>{t("Pour bien fonctionner")}</h2>
      <p className="muted" style={{ margin: "0 6px 8px", textAlign: "center" }}>{t("NOTIIF a besoin de 3 autorisations. Tu peux les changer plus tard dans les réglages.")}</p>
      {rows.map(([k, l, d]) => (
        <button key={k} type="button" className="card row" disabled={busy} onClick={() => void one(k)} style={{ width: "100%", gap: 12, textAlign: "start", alignItems: "center" }}>
          <span style={{ width: 46, height: 46, borderRadius: 15, background: G[k], color: "#fff", display: "grid", placeItems: "center", flex: "none", boxShadow: "0 4px 10px -4px rgba(0,0,0,.45)" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{SVG[k]}</svg></span>
          <span className="grow"><b>{l}</b><span className="muted small" style={{ display: "block" }}>{st[k] === false ? t("Refusé : à changer dans les réglages du téléphone") : d}</span></span>
          <span aria-label={st[k] ? t("Autorisé") : undefined} style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid var(--brand)", display: "grid", placeItems: "center", background: st[k] ? "var(--brand)" : "none", color: "#fff", flex: "none" }}>{st[k] ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" /></svg> : null}</span>
        </button>
      ))}
      <button type="button" className="btn" disabled={busy} onClick={() => void all()} style={{ width: "100%", marginTop: 8 }}>{t("Tout autoriser")}</button>
      <button type="button" className="chip" onClick={done} style={{ border: 0, background: "none" }}>{t("Plus tard")}</button>
    </div>
  );
}
