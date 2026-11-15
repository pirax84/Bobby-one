import { t } from "../../i18n";
import { FACES, HAS_AID, setLook, type GameKey, type Look } from "./cardlook";
import { PlayCard } from "./cards";

const Sw = ({ on, label, onChange }: { on: boolean; label: string; onChange: (v: boolean) => void }) => (
  <label className="row" style={{ gap: 10, alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
    <span>{label}</span><input type="checkbox" role="switch" checked={on} onChange={(e) => onChange(e.target.checked)} style={{ width: 22, height: 22 }} />
  </label>
);
/** Réglages des cartes d'un jeu : face, dos, aide lumineuse, 4 couleurs. */
export function CardSettings({ game, look }: { game: GameKey; look: Look }) {
  const up = (p: Partial<Look>) => setLook(game, p);
  const pick = (on: boolean): React.CSSProperties => ({ background: "none", border: on ? "3px solid var(--brand)" : "3px solid transparent", borderRadius: 12, padding: 3, cursor: "pointer", lineHeight: 0 });
  const aid = HAS_AID.includes(game);
  return (
    <details className="card" style={{ width: "100%" }}>
      <summary style={{ cursor: "pointer", fontWeight: 700 }}>{t("Réglages des cartes")}</summary>
      <div className="col" style={{ gap: 10, marginTop: 10 }}>
        <b className="small">{t("Face des cartes")}</b>
        <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>{FACES.map((f) => <button key={f} type="button" aria-pressed={look.face === f} aria-label={t("Face des cartes") + " " + f} style={pick(look.face === f)} onClick={() => up({ face: f })}><PlayCard c={{ r: 12, s: "h" }} w={40} look={{ face: f, four: look.four }} /></button>)}</div>
        <b className="small">{t("Dos des cartes")}</b>
        <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>{[1, 2, 3, 4, 5, 6].map((n) => <button key={n} type="button" aria-pressed={look.back === n} aria-label={t("Dos des cartes") + " " + n} style={pick(look.back === n)} onClick={() => up({ back: n })}><PlayCard down w={40} look={{ back: n }} /></button>)}</div>
        {aid && <>
          <Sw on={look.aid} label={t("Aide : entoure les groupes")} onChange={(v) => up({ aid: v, asked: true })} />
          {look.aid && <>
            <b className="small">{t("Style du contour")}</b>
            <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>{([["epais", "Contour épais"], ["leve", "Groupe soulevé"], ["sombre", "Le reste s'assombrit"]] as const).map(([k, l]) => <button key={k} type="button" aria-pressed={look.style === k} className={"chip" + (look.style === k ? " on" : "")} onClick={() => up({ style: k })}>{t(l)}</button>)}</div>
            <Sw on={look.words} label={t("Mots écrits")} onChange={(v) => up({ words: v })} />
          </>}
        </>}
        <Sw on={look.four} label={t("Cartes en 4 couleurs")} onChange={(v) => up({ four: v })} />
      </div>
    </details>
  );
}
