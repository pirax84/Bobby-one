export const CALLS = [
  { n: "+33 3 88 60 90 90", name: "Mairie de Strasbourg", score: 96, reports: 0, kind: "safe" },
  { n: "+33 1 40 05 80 00", name: "Service des impôts", score: 93, reports: 1, kind: "safe" },
  { n: "+33 3 88 14 22 07", name: "Pharmacie du Centre", score: 91, reports: 0, kind: "safe" },
  { n: "+33 6 12 45 78 90", name: "Numéro inconnu", score: 58, reports: 3, kind: "unknown" },
  { n: "+33 7 56 12 98 76", name: "Numéro inconnu", score: 52, reports: 5, kind: "unknown" },
  { n: "+33 9 70 18 44 21", name: "Démarchage possible", score: 47, reports: 12, kind: "unknown" },
  { n: "+33 9 48 76 12 34", name: "Faux conseiller bancaire", score: 8, reports: 214, kind: "scam" },
  { n: "+225 07 58 90 12 34", name: "Arnaque « appel manqué »", score: 5, reports: 389, kind: "scam" },
  { n: "+33 1 86 65 42 10", name: "Faux support technique", score: 12, reports: 167, kind: "scam" },
  { n: "+44 20 7946 0321", name: "Faux gain de loterie", score: 15, reports: 98, kind: "scam" },
];
export const THREATS = [
  { id: "Phishing", d: "De faux messages qui imitent votre banque ou les impôts pour voler vos identifiants.", ex: ["« Votre compte sera suspendu, cliquez ici »", "« Remboursement d'impôts en attente »"], tip: "Ne cliquez jamais : allez sur le site officiel." },
  { id: "Faux achats en ligne", d: "Des boutiques à prix cassés qui encaissent mais n'envoient rien.", ex: ["iPhone à 99 € sur un site inconnu", "Site créé il y a 10 jours"], tip: "Vérifiez l'âge du site et payez par un moyen protégé." },
  { id: "Arnaques crypto", d: "Des promesses de gains énormes sur de faux placements.", ex: ["« Doublez votre mise en 48 h »", "Faux conseiller sur WhatsApp"], tip: "Aucun placement n'est garanti. Méfiez-vous des gains rapides." },
  { id: "Arnaques sentimentales", d: "Une fausse relation en ligne qui finit par une demande d'argent.", ex: ["Un profil parfait qui vit « à l'étranger »", "Demande d'aide urgente"], tip: "N'envoyez jamais d'argent à quelqu'un que vous n'avez pas rencontré." },
  { id: "Usurpation d'identité", d: "Quelqu'un utilise vos données pour ouvrir des comptes ou emprunter.", ex: ["Demande de photo de carte d'identité", "Faux dossier de location"], tip: "Ajoutez un filigrane : « pour dossier location uniquement »." },
  { id: "Faux support technique", d: "Un faux technicien prétend que votre ordinateur est infecté.", ex: ["Fenêtre rouge avec un numéro à appeler", "Prise de contrôle à distance"], tip: "Fermez la page et n'appelez jamais le numéro affiché." },
  { id: "Fraude deepfake", d: "Une voix ou une vidéo truquée par IA imite un proche ou un dirigeant.", ex: ["Appel d'un « petit-fils » en détresse", "Faux PDG qui demande un virement"], tip: "Convenez d'un mot de passe familial et rappelez la personne." },
];
export const FEED = [
  { t: "Faux SMS Chronopost : frais de 1,99 €", c: 1240, lv: "danger", ago: "il y a 12 min" },
  { t: "Appels « Ameli » pour renouveler la carte Vitale", c: 860, lv: "danger", ago: "il y a 41 min" },
  { t: "Site « promo-ps5-fr.top » signalé", c: 312, lv: "suspicious", ago: "il y a 1 h" },
  { t: "Faux mail Netflix : paiement refusé", c: 540, lv: "suspicious", ago: "il y a 2 h" },
  { t: "Faux recrutement télétravail sur WhatsApp", c: 205, lv: "careful", ago: "il y a 3 h" },
];
export const TOP = [["Faux colis", 92], ["Faux conseiller bancaire", 78], ["Phishing impôts", 64], ["Crypto", 51], ["Faux support", 37]] as [string, number][];
export const REP = {
  Numéros: ["+33 9 48 76 12 34", "+225 07 58 90 12 34", "+33 1 86 65 42 10", "+44 20 7946 0321"],
  Emails: ["service@ameli-remboursement.top", "no-reply@paypa1-secure.com", "contact@colis-suivi.xyz"],
  Sites: ["colis-laposte-suivi.xyz", "promo-ps5-fr.top", "impots-remboursement-gouv.click", "amazon-verify-compte.xyz"],
} as Record<string, string[]>;
export const FAMILY = [
  { n: "Mamie Lucette", role: "Senior", risk: "careful", alert: "Appel suspect bloqué ce matin", on: true },
  { n: "Léo", role: "Ado · 15 ans", risk: "safe", alert: "Aucune alerte récente", on: true },
  { n: "Camille", role: "Parent", risk: "suspicious", alert: "Faux SMS de livraison détecté", on: true },
  { n: "Papi Jean", role: "Senior", risk: "safe", alert: "Aucune alerte récente", on: false },
];
