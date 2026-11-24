// Vérification d'un document importé AVANT de pré-remplir quoi que ce soit depuis le coffre-fort.
import { analyzeText, analyzeUrl, levelOf, Level } from "./engine";
import { SenderRule, matchBlocked, emailsIn, linkDomainsIn, domainOf } from "./senders";
import type { ProfileKind } from "./vault";

export interface Issue { level: "info" | "careful" | "danger"; text: string; }
export interface DocCheck {
  verdict: "blocked" | Level; score: number; issues: Issue[]; sender: string;
  blockedBy?: SenderRule; claims: string | null; suggested: ProfileKind | null;
}

// Organismes souvent imités, et les seuls domaines d'où leurs messages peuvent venir.
const ORGS: [RegExp, string, string[]][] = [
  [/imp[ôo]ts|dgfip|finances publiques|tr[ée]sor public|amende/i, "l'administration des impôts", ["impots.gouv.fr", "dgfip.finances.gouv.fr", "finances.gouv.fr", "antai.gouv.fr"]],
  [/ameli|assurance maladie|\bcpam\b/i, "l'Assurance Maladie", ["ameli.fr", "assurance-maladie.fr"]],
  [/\bcaf\b|allocations familiales/i, "la CAF", ["caf.fr"]],
  [/\bants\b|agence nationale des titres/i, "l'ANTS", ["ants.gouv.fr"]],
  [/urssaf/i, "l'URSSAF", ["urssaf.fr", "autoentrepreneur.urssaf.fr"]],
  [/france travail|p[ôo]le emploi/i, "France Travail", ["francetravail.fr", "pole-emploi.fr"]],
  [/pr[ée]fecture|minist[èe]re|gouvernement|service-public|tribunal|gendarmerie|police nationale/i, "un service de l'État", ["gouv.fr", "service-public.fr", "interieur.gouv.fr", "justice.fr"]],
  [/la poste|colissimo|chronopost/i, "La Poste", ["laposte.fr", "laposte.net", "colissimo.fr", "chronopost.fr"]],
  [/\bedf\b|engie|[ée]lectricit[ée] de france/i, "un fournisseur d'énergie", ["edf.fr", "engie.fr", "engie.com"]],
];
const OFFICIAL_ALL = ORGS.flatMap((o) => o[2]);
const FREE_MAIL = /^(gmail\.com|googlemail\.com|outlook\.(fr|com)|hotmail\.(fr|com)|live\.(fr|com)|yahoo\.(fr|com)|icloud\.com|aol\.(fr|com)|gmx\.(fr|com)|orange\.fr|wanadoo\.fr|free\.fr|sfr\.fr|proton(mail)?\.(me|com)|mail\.ru|yandex\.(ru|com))$/;
export const isFreeMail = (d: string) => FREE_MAIL.test(d.toLowerCase());
const BAD_TLD = /\.(xyz|top|click|icu|buzz|cfd|rest|live|shop|online|site|info|ru|cn|tk|ml|ga|gq|cf)$/;
const isOfficial = (d: string) => OFFICIAL_ALL.some((o) => d === o || d.endsWith("." + o)) || d.endsWith(".gouv.fr");

/** Analyse le texte d'un document et son expéditeur. `sender` peut être vide (document sans expéditeur connu). */
export function checkDocument(text: string, sender: string, blocked: SenderRule[], profile: ProfileKind): DocCheck {
  const issues: Issue[] = []; let pen = 0;
  const add = (level: Issue["level"], txt: string, w: number) => { issues.push({ level, text: txt }); pen += w; };
  const s = sender.trim().toLowerCase(); const sd = s.includes("@") ? domainOf(s) : s;
  const claim = ORGS.find(([re]) => re.test(text)); const claims = claim ? claim[1] : null;
  const suggested: ProfileKind | null = /\bsiret\b|\bsiren\b|raison sociale|code (ape|naf)|tva intracommunautaire|forme juridique|kbis/i.test(text) ? "PROFESSIONAL"
    : /[ée]tat civil|situation familiale|s[ée]curit[ée] sociale|date de naissance|lieu de naissance|ayants? droit|enfants? [àa] charge/i.test(text) ? "PERSONAL" : null;

  // 1. Expéditeur ou lien bloqué : refus immédiat, aucun pré-remplissage possible.
  const targets = [...(s ? [s] : []), ...emailsIn(text), ...linkDomainsIn(text)];
  for (const tg of targets) { const r = matchBlocked(tg, blocked); if (r) return { verdict: "blocked", score: 0, sender: s || tg, blockedBy: r, claims, suggested, issues: [{ level: "danger", text: (r.kind === "email" ? "Cette adresse e-mail" : "Ce domaine") + " fait partie de vos expéditeurs bloqués : " + r.v }] }; }

  // 2. Expéditeur incohérent ou bizarre.
  if (sd) {
    if (claim && !claim[2].some((o) => sd === o || sd.endsWith("." + o)) && !sd.endsWith(".gouv.fr")) {
      if (FREE_MAIL.test(sd)) add("danger", `Le document dit venir de ${claim[1]}, mais il a été envoyé depuis une messagerie gratuite (${sd}). Un organisme officiel n'écrit jamais depuis une adresse de ce type.`, 45);
      else add("danger", `Le document dit venir de ${claim[1]}, mais l'adresse de l'expéditeur (${sd}) n'est pas une adresse officielle de cet organisme.`, 40);
    }
    if (!isOfficial(sd) && /imp[oô]ts|ameli|caf|gouv|ants|urssaf|cpam|tresor|amende|antai|laposte|banque/.test(sd)) add("danger", `L'adresse de l'expéditeur (${sd}) imite le nom d'un organisme officiel.`, 35);
    if (BAD_TLD.test(sd)) add("careful", `La fin de l'adresse de l'expéditeur (${sd}) est très utilisée par les arnaqueurs.`, 18);
    const local = s.split("@")[0] || "";
    if (/\d{5,}/.test(local) || (local.length > 18 && !/[._-]/.test(local))) add("careful", "Le nom de l'adresse de l'expéditeur ressemble à une suite de caractères au hasard.", 12);
    if ((sd.match(/-/g) || []).length >= 2) add("careful", "Le domaine de l'expéditeur contient beaucoup de tirets, souvent signe de fausse adresse.", 10);
  } else if (claim) add("info", `Ce document dit venir de ${claim[1]}. Vérifiez que vous l'avez bien reçu par un canal officiel (espace personnel, courrier).`, 4);

  // 3. Liens contenus dans le document.
  for (const d of linkDomainsIn(text)) {
    const u = analyzeUrl(d);
    if (claim && !isOfficial(d)) add("danger", `Le document contient un lien vers « ${d} », qui n'est pas le site officiel de ${claim[1]}.`, 30);
    else if (u && u.score < 60) add("careful", `Le lien « ${d} » paraît douteux.`, 16);
  }

  // 4. Demandes qu'un vrai formulaire ne fait jamais.
  if (/cryptogramme|\bcvv\b|code (de (votre )?carte|confidentiel)|date d'expiration de (votre )?carte|num[ée]ro de (votre )?carte bancaire/i.test(text)) add("danger", "Le document demande les numéros ou le code de votre carte bancaire. Un formulaire administratif ne le demande jamais.", 40);
  if (/mot de passe|identifiant de connexion|code (re[çc]u par )?sms|code de v[ée]rification/i.test(text)) add("danger", "Le document demande un mot de passe ou un code reçu par SMS. Ne le donnez jamais.", 35);
  if (/carte cadeau|paysafe|transcash|neosurf|bitcoin|\bcrypto(monnaie|-monnaie)?s?\b/i.test(text)) add("danger", "Le document demande un paiement par carte cadeau ou cryptomonnaie : c'est toujours une arnaque.", 40);

  // 5. Signes d'arnaque habituels de Bobby (urgence, argent, émotions…).
  const base = analyzeText(text);
  if (base.score < 85) base.reasons.filter((r) => !/ne m'a|Je n'ai repéré/.test(r)).forEach((r) => add(base.score < 60 ? "careful" : "info", r, base.score < 60 ? 10 : 4));

  // 6. Cohérence avec le profil choisi (séparation stricte Perso / Pro).
  if (suggested && suggested !== profile) add("careful", suggested === "PROFESSIONAL"
    ? "Ce document ressemble à un document professionnel (SIRET, raison sociale…), alors que le Profil Perso est sélectionné."
    : "Ce document ressemble à un document personnel (état civil, sécurité sociale…), alors que le Profil Pro est sélectionné.", 0);

  // 7. Document illisible ou presque vide.
  if (text.replace(/\s/g, "").length < 40) add("careful", "Je n'arrive presque pas à lire ce document : je ne peux pas bien le vérifier.", 12);

  const score = Math.max(2, Math.min(98, 96 - pen));
  return { verdict: levelOf(score), score, issues, sender: s, claims, suggested };
}
