import { useMemo, useState } from "react";
import { LANGS, currentLang, setLang, t, useLang } from "../i18n";
import { toast } from "./common";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Choix de la langue : recherche par nom (natif, anglais, français), changement immédiat, choix mémorisé. */
export function LangPicker() {
  useLang();
  const cur = currentLang(); const [q, setQ] = useState("");
  const now = LANGS.find((l) => l.code === cur)!;
  const list = useMemo(() => { const n = norm(q.trim()); return n ? LANGS.filter((l) => [l.native, l.en, l.fr, l.code].some((x) => norm(x).includes(n))) : LANGS; }, [q]);
  return (<div className="card col" style={{ gap: 8 }} id="lang">
    <h3>{t("🌍 Langue")}</h3>
    <p className="muted small" style={{ margin: 0 }}>{t("Choisissez la langue de NOTIIF. Elle change tout de suite et votre choix est gardé.")}</p>
    <div className="langnow" data-testid="lang-current"><span className="muted small">{t("Langue actuelle")} :</span> <b lang={now.code}>{now.native}</b></div>
    <input className="inp" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Rechercher une langue")} aria-label={t("Rechercher une langue")} />
    <div className="langlist" role="listbox" aria-label={t("Langue")}>
      {list.map((l) => <button key={l.code} type="button" role="option" aria-selected={l.code === cur} data-lang={l.code} className={"langitem" + (l.code === cur ? " on" : "")}
        onClick={async () => { await setLang(l.code); toast(t("Langue changée.")); }}>
        <span lang={l.code} dir={l.dir} className="langnat">{l.native}</span><span className="muted small langen">{l.en}</span>{l.code === cur && <span className="langck" aria-hidden="true">✓</span>}</button>)}
      {!list.length && <p className="muted small" style={{ margin: "8px 4px" }}>{t("Aucune langue trouvée.")}</p>}
    </div></div>);
}
