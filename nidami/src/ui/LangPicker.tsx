import { useMemo, useState } from "react";
import { LANGS, currentLang, setLang, t, useLang, deviceLang, resetLang } from "../i18n";

const BACK: Record<string, string> = {"fr": "Remettre en {n}", "en": "Switch back to {n}", "es": "Volver a {n}", "de": "Zurück auf {n}", "it": "Torna a {n}", "pt": "Voltar para {n}", "nl": "Terug naar {n}", "pl": "Wróć do: {n}", "ro": "Înapoi la {n}", "sv": "Tillbaka till {n}", "da": "Skift tilbage til {n}", "fi": "Palaa kieleen {n}", "cs": "Vrátit na {n}", "sk": "Vrátiť na {n}", "hu": "Vissza: {n}", "hr": "Vrati na {n}", "sl": "Nazaj na {n}", "bg": "Върни на {n}", "el": "Επιστροφή στα {n}", "et": "Tagasi keelde {n}", "lv": "Atpakaļ uz {n}", "lt": "Grįžti į {n}", "mt": "Irritorna għal {n}", "ga": "Athraigh ar ais go {n}", "tr": "{n} diline dön", "ru": "Вернуть: {n}", "ar": "العودة إلى {n}", "hi": "वापस {n} में", "id": "Kembali ke {n}", "ja": "{n}に戻す", "zh-CN": "切换回{n}"};
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
    {(() => { const d = LANGS.find((l) => l.code === deviceLang()); if (!d || d.code === cur) return null; return <button type="button" className="btn" lang={d.code} dir={d.dir} onClick={async () => { if (await resetLang()) { window.scrollTo({ top: 0 }); toast(t("Langue changée.")); } }}>↩ {(BACK[d.code] || "{n}").replace("{n}", d.native)}</button>; })()}
    <div className="langnow" data-testid="lang-current"><span className="muted small">{t("Langue actuelle")} :</span> <b lang={now.code}>{now.native}</b></div>
    <input className="inp" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Rechercher une langue")} aria-label={t("Rechercher une langue")} />
    <div className="langlist" role="listbox" aria-label={t("Langue")}>
      {list.map((l) => <button key={l.code} type="button" role="option" aria-selected={l.code === cur} data-lang={l.code} className={"langitem" + (l.code === cur ? " on" : "")}
        onClick={async () => { const ok = await setLang(l.code); if (ok) { window.scrollTo({ top: 0 }); toast(t("Langue changée.")); } else toast(t("Langue indisponible pour l'instant : vérifie ta connexion et réessaie.")); }}>
        <span lang={l.code} dir={l.dir} className="langnat">{l.native}</span><span className="muted small langen">{l.en}</span>{l.code === cur && <span className="langck" aria-hidden="true">✓</span>}</button>)}
      {!list.length && <p className="muted small" style={{ margin: "8px 4px" }}>{t("Aucune langue trouvée.")}</p>}
    </div></div>);
}
