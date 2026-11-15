import { t } from "../../i18n";

/** Encadré « Règles » repliable, commun à tous les jeux. */
export function Rules({ text }: { text: string }) {
  return <details className="small muted" style={{ width: "100%" }}><summary style={{ cursor: "pointer", fontWeight: 700 }}>{t("Règles du jeu")}</summary><p style={{ margin: "6px 0 0", whiteSpace: "pre-line", textAlign: "left" }}>{text}</p></details>;
}
