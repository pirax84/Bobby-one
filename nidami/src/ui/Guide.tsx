import { useEffect, useRef, useState } from "react";
import { t } from "../i18n";

const SEEN = "notiif-guide-seen";
const pages = (): [string, string, string][] => [
  ["💜", t("Bienvenue sur NOTIIF"), t("Un petit réseau privé pour votre famille et vos amis. Pas de publicité, pas d'inconnus.")],
  ["👋", t("Vos proches seulement"), t("Ajoutez des amis avec leur code ou leur QR code. Vous choisissez qui peut vous trouver.")],
  ["📸", t("Partagez vos moments"), t("Le bouton + en bas crée une photo, un selfie, un vocal ou un texte. Pour chaque publication, vous choisissez qui la voit.")],
  ["💬", t("Parlez-vous"), t("Messages, appels, groupes, événements. Tout reste entre vous.")],
  ["🎨", t("Faites-la à votre goût"), t("Dans Paramètres : couleur, thème clair ou sombre, taille du texte, et une sauvegarde de vos données.")],
  ["🏠", t("Et pour rassurer"), t("Dans « Plus », « Bien arrivé » prévient vos proches en un geste, sans jamais envoyer votre position.")],
];
export function Guide() {
  const [open, setOpen] = useState(() => { try { return !localStorage.getItem(SEEN); } catch { return false; } });
  const [i, setI] = useState(0); const box = useRef<HTMLDivElement>(null); const P = pages();
  useEffect(() => { const f = () => { setI(0); setOpen(true); }; window.addEventListener("notiif-guide", f); return () => window.removeEventListener("notiif-guide", f); }, []);
  if (!open) return null;
  const close = () => { try { localStorage.setItem(SEEN, "1"); } catch { /* rien */ } setOpen(false); };
  const go = (n: number) => { setI(n); box.current?.scrollTo({ left: n * box.current.clientWidth, behavior: "smooth" }); };
  return (<div role="dialog" aria-modal="true" aria-label={t("Guide")} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "var(--bg)", display: "flex", flexDirection: "column" }}>
    <div style={{ textAlign: "right", padding: 12 }}><button className="btn ghost sm" onClick={close}>{t("Passer")}</button></div>
    <div ref={box} onScroll={(e) => { const el = e.currentTarget; setI(Math.round(el.scrollLeft / el.clientWidth)); }} style={{ flex: 1, display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "none" }}>
      {P.map(([e, h, d], k) => <div key={k} style={{ minWidth: "100%", scrollSnapAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 32, textAlign: "center" }}><div style={{ fontSize: 80 }}>{e}</div><h2 style={{ margin: 0 }}>{h}</h2><p className="muted" style={{ maxWidth: 320, margin: 0, fontSize: "1.05rem" }}>{d}</p></div>)}</div>
    <div className="row" style={{ justifyContent: "center", gap: 8, padding: 8 }}>{P.map((_, k) => <span key={k} style={{ width: k === i ? 22 : 8, height: 8, borderRadius: 8, background: k === i ? "var(--brand)" : "var(--bd)", transition: "width .2s" }} />)}</div>
    <div className="row" style={{ padding: 16, gap: 10 }}>{i > 0 && <button className="btn ghost" onClick={() => go(i - 1)}>{t("Retour")}</button>}<button className="btn grow" onClick={() => (i < P.length - 1 ? go(i + 1) : close())}>{i < P.length - 1 ? t("Suivant") : t("C'est parti !")}</button></div></div>);
}
