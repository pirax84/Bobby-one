import { Ico } from "./common";
import { t } from "../i18n";

const items = (): [string, string, string, string, string][] => [
  ["img", t("Les stories"), t("Une story dure 24 heures. Touche ton rond en haut de l'accueil pour la voir ou la supprimer."), "#9B87F5", "#2A1F5C"],
  ["plus", t("Le bouton N+"), t("Appui court : créer une story ou une publication. Appui long : filmer un selfie vidéo tout de suite."), "#2FCDBE", "#0E4A4A"],
  ["send", t("Publier"), t("Photo, selfie, texte ou lien. Pour chaque publication, tu choisis qui la voit."), "#FF8A6B", "#5A2619"],
  ["eye", t("Messages éphémères"), t("Dans la conversation, touche le petit bouton Normal ou Éphémère. Un message éphémère disparaît complètement après avoir été vu."), "#E5679C", "#5A1B38"],
  ["voice", t("Le vocal"), t("Maintiens le micro pour parler. Glisse vers le haut pour verrouiller, vers le bas pour annuler. Jusqu'à 10 minutes en privé."), "#A8E05F", "#2F4A0E"],
  ["smile", t("Emojis et effets"), t("Le bouton sourire dans la zone de texte ouvre les emojis et les effets plein écran."), "#F2C45A", "#4F3A0A"],
  ["chat", t("Répondre, épingler, modifier"), t("Appuie longuement sur un message pour le répondre, l'épingler, le modifier ou le supprimer."), "#38B6FF", "#0E3A5C"],
  ["bell", t("Réactions"), t("Touche le cœur pour réagir. Les trois petits points montrent qui a réagi et avec quel emoji."), "#4F7BFF", "#16296B"],
  ["phone", t("Appels"), t("Le bouton téléphone en haut d'une conversation lance un appel."), "#C85BE8", "#44165C"],
  ["group", t("Groupes"), t("Crée un groupe : ses publications ne sont vues que par ses membres."), "#9B87F5", "#2A1F5C"],
  ["cal", t("Anniversaires"), t("Le jour de l'anniversaire d'un ami, une bulle apparaît en haut de l'accueil."), "#2FCDBE", "#0E4A4A"],
  ["cog", t("Apparence"), t("Dans Paramètres : couleur, thème clair ou sombre, taille du texte et barres."), "#FF8A6B", "#5A2619"],
  ["home", t("Bien arrivé"), t("Dans « Plus », « Bien arrivé » prévient tes proches en un geste, sans jamais envoyer ta position."), "#E5679C", "#5A1B38"],
  ["lock", t("Sauvegarde"), t("Dans Paramètres, « Compte et données » : exporter et récupérer tes données."), "#A8E05F", "#2F4A0E"],
];
/** « Comment ça marche ? » : une carte par fonction. */
export function HowTo() {
  return <div className="col" style={{ gap: 10 }}>{items().map(([ic, h, d, dot, nuit], i) => <div key={i} className="card row" style={{ gap: 14, alignItems: "center" }}>
    <span style={{ width: 48, height: 48, flex: "none", borderRadius: 16, background: ic === "voice" ? "#fff" : nuit, boxShadow: ic === "voice" ? "inset 0 0 0 2px #2A1F5C" : undefined, color: dot, display: "grid", placeItems: "center" }}><Ico n={ic} s={26} /></span>
    <div className="grow"><b>{h}</b><div className="muted" style={{ marginTop: 2 }}>{d}</div></div></div>)}</div>;
}
