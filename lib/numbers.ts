// Analyse d'un numéro de téléphone avec des règles officielles de numérotation (pas de base inventée).
import { Level, levelOf } from "./engine";
const DIAL: [string, string][] = [["1", "États-Unis / Canada"], ["7", "Russie / Kazakhstan"], ["20", "Égypte"], ["27", "Afrique du Sud"], ["30", "Grèce"], ["31", "Pays-Bas"], ["32", "Belgique"], ["33", "France"], ["34", "Espagne"], ["36", "Hongrie"], ["39", "Italie"], ["40", "Roumanie"], ["41", "Suisse"], ["43", "Autriche"], ["44", "Royaume-Uni"], ["45", "Danemark"], ["46", "Suède"], ["47", "Norvège"], ["48", "Pologne"], ["49", "Allemagne"], ["51", "Pérou"], ["52", "Mexique"], ["54", "Argentine"], ["55", "Brésil"], ["56", "Chili"], ["57", "Colombie"], ["58", "Venezuela"], ["60", "Malaisie"], ["61", "Australie"], ["62", "Indonésie"], ["63", "Philippines"], ["64", "Nouvelle-Zélande"], ["65", "Singapour"], ["66", "Thaïlande"], ["81", "Japon"], ["82", "Corée du Sud"], ["84", "Viêt Nam"], ["86", "Chine"], ["90", "Turquie"], ["91", "Inde"], ["92", "Pakistan"], ["94", "Sri Lanka"], ["98", "Iran"],
  ["212", "Maroc"], ["213", "Algérie"], ["216", "Tunisie"], ["218", "Libye"], ["221", "Sénégal"], ["223", "Mali"], ["224", "Guinée"], ["225", "Côte d'Ivoire"], ["226", "Burkina Faso"], ["227", "Niger"], ["228", "Togo"], ["229", "Bénin"], ["230", "Maurice"], ["233", "Ghana"], ["234", "Nigeria"], ["237", "Cameroun"], ["243", "RD Congo"], ["261", "Madagascar"], ["262", "La Réunion / Mayotte (France)"], ["351", "Portugal"], ["352", "Luxembourg"], ["353", "Irlande"], ["358", "Finlande"], ["359", "Bulgarie"], ["380", "Ukraine"], ["381", "Serbie"], ["385", "Croatie"], ["420", "Tchéquie"], ["421", "Slovaquie"], ["590", "Guadeloupe (France)"], ["594", "Guyane (France)"], ["596", "Martinique (France)"], ["966", "Arabie saoudite"], ["971", "Émirats arabes unis"], ["972", "Israël"]];
const HOME: Record<string, { cc: string; trunk: boolean }> = { FR: { cc: "33", trunk: true }, BE: { cc: "32", trunk: true }, CH: { cc: "41", trunk: true }, GB: { cc: "44", trunk: true }, DE: { cc: "49", trunk: true }, AU: { cc: "61", trunk: true }, ES: { cc: "34", trunk: false }, PT: { cc: "351", trunk: false }, US: { cc: "1", trunk: false }, CA: { cc: "1", trunk: false }, IN: { cc: "91", trunk: false } };
const FR_DEMARCHAGE = ["0162", "0163", "0270", "0271", "0377", "0378", "0424", "0425", "0568", "0569", "0948", "0949"];
export interface NumResult { ok: true; e164: string; country: string; kind: string; score: number; level: Level; reasons: string[]; tips: string[] }
export interface NumError { ok: false; err: string }
export const digitsOnly = (x: string) => x.replace(/\D/g, "");
export function analyzeNumber(raw: string, home: string, blocked: string[] = []): NumResult | NumError {
  let s = raw.trim().replace(/[\s.\-()]/g, ""); if (s.startsWith("00")) s = "+" + s.slice(2);
  let e164: string;
  if (s.startsWith("+")) e164 = "+" + digitsOnly(s);
  else {
    const h = HOME[home]; const d = digitsOnly(s);
    if (!h) return { ok: false, err: "Ajoutez l'indicatif du pays au début, par exemple +33 pour la France." };
    e164 = "+" + h.cc + (h.trunk && d.startsWith("0") ? d.slice(1) : d);
  }
  const n = e164.slice(1); if (n.length < 8 || n.length > 15) return { ok: false, err: "Ce numéro est incomplet ou trop long. Exemple : +33 6 12 34 56 78." };
  const cc = [3, 2, 1].map((k) => n.slice(0, k)).find((c) => DIAL.some(([x]) => x === c)); const country = cc ? DIAL.find(([x]) => x === cc)![1] : "Pays inconnu";
  const reasons: string[] = []; const tips: string[] = []; let score = 62; let kind = "Numéro inconnu";
  if (blocked.some((b) => digitsOnly(b).slice(-9) === n.slice(-9))) return { ok: true, e164, country, kind: "Marqué par vous", score: 5, level: "danger", reasons: ["Vous avez marqué ce numéro comme dangereux."], tips: ["Ne répondez pas et ne le rappelez pas."] };
  if (cc === "33") {
    const rest = n.slice(2); if (rest.length !== 9) return { ok: false, err: "Un numéro français a 10 chiffres (par exemple 06 12 34 56 78). Vérifiez qu'il est complet." };
    const nat = "0" + rest; const f = rest[0];
    if (FR_DEMARCHAGE.some((p) => nat.startsWith(p))) { score = 45; kind = "Démarchage commercial"; reasons.push("Ce début de numéro est réservé par l'ARCEP aux appels de démarchage commercial."); tips.push("Vous pouvez ne pas répondre. Inscrivez-vous gratuitement sur bloctel.gouv.fr contre le démarchage."); }
    else if (nat.startsWith("089")) { score = 40; kind = "Numéro surtaxé"; reasons.push("Les numéros en 089 sont surtaxés : les rappeler peut coûter très cher."); tips.push("Ne rappelez pas ce numéro."); }
    else if (nat.startsWith("080")) { score = 80; kind = "Numéro gratuit"; reasons.push("Les numéros en 080 sont gratuits à appeler, mais n'importe qui peut en obtenir un."); tips.push("Vérifiez qui vous appelle avant de donner une information."); }
    else if (f === "6" || f === "7") { score = 72; kind = "Mobile français"; reasons.push("C'est un numéro de mobile. Je n'ai aucune information sur son propriétaire."); tips.push("Un appel inconnu n'est pas dangereux en soi : ne donnez jamais de code, de mot de passe ni de numéro de carte."); }
    else if (f === "9") { score = 62; kind = "Numéro internet (box ou téléphonie web)"; reasons.push("Les numéros en 09 sont utilisés par les box internet, mais aussi par beaucoup de centres d'appels et de démarcheurs."); tips.push("Si on vous presse d'agir, raccrochez et rappelez l'organisme sur son numéro officiel."); }
    else { score = 78; kind = "Téléphone fixe français"; reasons.push("C'est un numéro fixe français. Je n'ai aucune information sur son propriétaire."); tips.push("Un numéro affiché peut être falsifié : en cas de doute, raccrochez et rappelez le numéro officiel."); }
  } else if (cc) {
    score = 62; kind = "Numéro étranger"; reasons.push("Ce numéro vient de l'étranger (" + country + "). Je n'ai aucune information sur son propriétaire.");
    tips.push("S'il n'a sonné qu'une fois, ne le rappelez pas : c'est une arnaque fréquente (appel manqué qui coûte cher en rappel).", "Ne donnez jamais de code, de mot de passe ni de numéro de carte à un appel inattendu.");
  } else { score = 55; kind = "Indicatif inconnu"; reasons.push("Je ne reconnais pas l'indicatif de ce numéro."); tips.push("Ne le rappelez pas si vous ne l'attendez pas."); }
  tips.push("En cas d'arnaque, signalez-la avec les sources officielles ci-dessous.");
  return { ok: true, e164, country, kind, score, level: levelOf(score), reasons, tips };
}
