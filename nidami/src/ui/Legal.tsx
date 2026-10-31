import { useState } from "react";
import { LEGAL, LEGAL_NOTICE, LEGAL_VERSION } from "../lib/legal";
import { t, currentLang, useLang } from "../i18n";

export function LegalView({ bare = false }: { bare?: boolean }) {
  useLang();
  const [id, setId] = useState(LEGAL[0].id); const doc = LEGAL.find((d) => d.id === id)!;
  return (<div className="col">{!bare && <h1>{t("Documents juridiques")}</h1>}
    {currentLang() !== "fr" && <p className="muted small" style={{ margin: 0 }}>{t("Pour l'instant, les documents juridiques existent uniquement en français.")}</p>}
    <div className="card small" style={{ borderColor: "var(--warm)" }}>⚖️ {LEGAL_NOTICE}<div className="muted">{t("Version {LEGAL_VERSION}", { LEGAL_VERSION })}</div></div>
    <div className="col" style={{ gap: 8 }} role="tablist">{LEGAL.map((d) => <button key={d.id} type="button" role="tab" aria-selected={id === d.id} className={"setrow legalrow" + (id === d.id ? " on" : "")} onClick={() => setId(d.id)}><span className="grow"><b>{d.title.replace(/ \(.*\)/, "")}</b></span><span className="setch">{id === d.id ? "▾" : "›"}</span></button>)}</div>
    <article className="card col"><h2>{doc.title}</h2>{doc.sections.map(([h, tx]) => <section key={h}><h3 style={{ fontSize: "1rem", marginBottom: 4 }}>{h}</h3><p style={{ margin: 0 }} className="muted">{tx}</p></section>)}</article></div>);
}
