import { useState } from "react";
import { LEGAL, LEGAL_NOTICE, LEGAL_VERSION } from "../lib/legal";
import { t, currentLang, useLang } from "../i18n";

export function LegalView({ bare = false }: { bare?: boolean }) {
  useLang();
  const [id, setId] = useState<string | null>(null); const doc = LEGAL.find((d) => d.id === id) || null;
  return (<div className="col">{!bare && <h1>{t("Documents juridiques")}</h1>}
    {currentLang() !== "fr" && <p className="muted small" style={{ margin: 0 }}>{t("Pour l'instant, les documents juridiques existent uniquement en français.")}</p>}
    <div className="card small" style={{ borderColor: "var(--warm)" }}>⚖️ {LEGAL_NOTICE}<div className="muted">{t("Version {LEGAL_VERSION}", { LEGAL_VERSION })}</div></div>
    {!doc ? <div className="col" style={{ gap: 8 }}>{LEGAL.map((d) => <button key={d.id} type="button" className="setrow legalrow" onClick={() => { setId(d.id); window.scrollTo(0, 0); }}><span className="grow"><b>{d.title.replace(/ \(.*\)/, "")}</b></span><span className="setch">›</span></button>)}</div>
    : <><button type="button" className="setrow legalrow" onClick={() => setId(null)}><span className="setch">‹</span><span className="grow"><b>{t("Retour à la liste")}</b></span></button>
    <article className="card col"><h2>{doc.title}</h2>{doc.sections.map(([h, tx]) => <section key={h}><h3 style={{ fontSize: "1rem", marginBottom: 4 }}>{h}</h3><p style={{ margin: 0 }} className="muted">{tx}</p></section>)}</article></>}</div>);
}
