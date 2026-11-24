// Coffre-fort de Bobby One : deux espaces strictement séparés, Profil Perso et Profil Pro.
// Aucune fonction de ce fichier ne lit un profil pour en remplir un autre.
export type ProfileKind = "PERSONAL" | "PROFESSIONAL";
export type Vault = Record<ProfileKind, Record<string, string>>;

export interface FieldDef { key: string; label: string; sensitive?: boolean; required?: boolean; placeholder?: string; }
export interface SectionDef { title: string; fields: FieldDef[]; }

export const SECTIONS: Record<ProfileKind, SectionDef[]> = {
  PERSONAL: [
    { title: "Identité", fields: [
      { key: "civility", label: "Civilité", required: true, placeholder: "M. ou Mme" },
      { key: "lastName", label: "Nom d'usage", required: true },
      { key: "birthLastName", label: "Nom de naissance" },
      { key: "firstNames", label: "Prénoms", required: true },
      { key: "birthDate", label: "Date de naissance", required: true, placeholder: "JJ/MM/AAAA" },
      { key: "birthPlace", label: "Lieu de naissance", required: true },
      { key: "nationality", label: "Nationalité", required: true },
      { key: "maritalStatus", label: "Situation familiale" },
    ] },
    { title: "Coordonnées", fields: [
      { key: "address", label: "Adresse", required: true },
      { key: "postalCode", label: "Code postal", required: true },
      { key: "city", label: "Ville", required: true },
      { key: "phone", label: "Téléphone", required: true },
      { key: "email", label: "E-mail", required: true },
    ] },
    { title: "Banque et administratif", fields: [
      { key: "socialSecurityNumber", label: "N° de sécurité sociale", sensitive: true },
      { key: "healthInsurance", label: "Mutuelle" },
      { key: "iban", label: "IBAN", sensitive: true },
      { key: "bic", label: "BIC" },
      { key: "drivingLicense", label: "N° de permis de conduire", sensitive: true },
      { key: "vehiclePlate", label: "Immatriculation du véhicule" },
    ] },
  ],
  PROFESSIONAL: [
    { title: "Entreprise", fields: [
      { key: "businessName", label: "Raison sociale / Nom commercial", required: true },
      { key: "legalForm", label: "Forme juridique", required: true, placeholder: "Micro-entreprise, SASU, salarié…" },
      { key: "contactName", label: "Nom et prénom du responsable", required: true },
      { key: "roleTitle", label: "Fonction" },
      { key: "siret", label: "SIRET", required: true },
      { key: "siren", label: "SIREN" },
      { key: "apeCode", label: "Code APE / NAF" },
      { key: "vatNumber", label: "N° de TVA" },
    ] },
    { title: "Coordonnées professionnelles", fields: [
      { key: "address", label: "Adresse professionnelle", required: true },
      { key: "postalCode", label: "Code postal", required: true },
      { key: "city", label: "Ville", required: true },
      { key: "phone", label: "Téléphone pro", required: true },
      { key: "email", label: "E-mail pro", required: true },
      { key: "website", label: "Site web" },
    ] },
    { title: "Banque et administratif", fields: [
      { key: "iban", label: "IBAN professionnel", sensitive: true },
      { key: "bic", label: "BIC professionnel" },
      { key: "employeeId", label: "Matricule" },
    ] },
  ],
};

export const EMPTY_VAULT: Vault = { PERSONAL: { nationality: "Française" }, PROFESSIONAL: {} };

export function completeness(v: Vault, p: ProfileKind): number {
  const req = SECTIONS[p].flatMap((s) => s.fields.filter((f) => f.required));
  const ok = req.filter((f) => (v[p][f.key] || "").trim()).length;
  return Math.round((ok / req.length) * 100);
}
export const mask = (x: string) => { const c = x.replace(/\s/g, ""); return c.length <= 4 ? "••••" : "•••• " + c.slice(-4); };

// Repérage des champs d'un document : chaque règle reconnaît un libellé (« Nom : », « Adresse »…)
// et indique quelle information du profil ACTIF utiliser. Une même règle n'a jamais accès aux deux profils.
interface Rule { re: RegExp; label: string; get: (p: ProfileKind, d: Record<string, string>) => string; }
const today = () => new Date().toLocaleDateString("fr-FR");
const RULES: Rule[] = [
  { re: /nom et pr[ée]nom|pr[ée]nom et nom|je soussign[ée]|nom complet/i, label: "Nom et prénom", get: (p, d) => p === "PERSONAL" ? [d.firstNames, d.lastName].filter(Boolean).join(" ") : d.contactName || "" },
  { re: /raison sociale|d[ée]nomination|nom commercial|nom de l'entreprise/i, label: "Raison sociale", get: (p, d) => p === "PROFESSIONAL" ? d.businessName || "" : "" },
  { re: /nom de naissance|nom patronymique/i, label: "Nom de naissance", get: (p, d) => p === "PERSONAL" ? d.birthLastName || d.lastName || "" : "" },
  { re: /pr[ée]noms?\b/i, label: "Prénom(s)", get: (p, d) => p === "PERSONAL" ? d.firstNames || "" : "" },
  { re: /^\W*nom\b|nom d'usage|nom de famille/i, label: "Nom", get: (p, d) => p === "PERSONAL" ? d.lastName || "" : d.contactName || "" },
  { re: /civilit[ée]/i, label: "Civilité", get: (p, d) => p === "PERSONAL" ? d.civility || "" : "" },
  { re: /date de naissance|n[ée]\(?e?\)? le/i, label: "Date de naissance", get: (p, d) => p === "PERSONAL" ? d.birthDate || "" : "" },
  { re: /lieu de naissance|n[ée]\(?e?\)? [àa]\b|commune de naissance/i, label: "Lieu de naissance", get: (p, d) => p === "PERSONAL" ? d.birthPlace || "" : "" },
  { re: /nationalit[ée]/i, label: "Nationalité", get: (p, d) => p === "PERSONAL" ? d.nationality || "" : "" },
  { re: /situation (familiale|matrimoniale)/i, label: "Situation familiale", get: (p, d) => p === "PERSONAL" ? d.maritalStatus || "" : "" },
  { re: /\bsiret\b/i, label: "SIRET", get: (p, d) => p === "PROFESSIONAL" ? d.siret || "" : "" },
  { re: /\bsiren\b/i, label: "SIREN", get: (p, d) => p === "PROFESSIONAL" ? d.siren || "" : "" },
  { re: /code (ape|naf)/i, label: "Code APE / NAF", get: (p, d) => p === "PROFESSIONAL" ? d.apeCode || "" : "" },
  { re: /n° ?(de )?tva|tva intracommunautaire/i, label: "N° de TVA", get: (p, d) => p === "PROFESSIONAL" ? d.vatNumber || "" : "" },
  { re: /forme juridique|statut juridique/i, label: "Forme juridique", get: (p, d) => p === "PROFESSIONAL" ? d.legalForm || "" : "" },
  { re: /fonction|qualit[ée] du signataire/i, label: "Fonction", get: (p, d) => p === "PROFESSIONAL" ? d.roleTitle || "" : "" },
  { re: /e-?mail|courriel|adresse [ée]lectronique/i, label: "E-mail", get: (_p, d) => d.email || "" },
  { re: /code postal|\bcp\b/i, label: "Code postal", get: (_p, d) => d.postalCode || "" },
  { re: /adresse|domicile|demeurant|si[èe]ge social/i, label: "Adresse", get: (_p, d) => d.address || "" },
  { re: /\bville\b|\bcommune\b|localit[ée]/i, label: "Ville", get: (_p, d) => d.city || "" },
  { re: /t[ée]l[ée]phone|\bt[ée]l\b|portable|mobile/i, label: "Téléphone", get: (_p, d) => d.phone || "" },
  { re: /s[ée]curit[ée] sociale|n° ?s[ée]cu|\bnir\b/i, label: "N° de sécurité sociale", get: (p, d) => p === "PERSONAL" ? d.socialSecurityNumber || "" : "" },
  { re: /\biban\b|rib|relev[ée] d'identit[ée] bancaire/i, label: "IBAN", get: (_p, d) => d.iban || "" },
  { re: /\bbic\b|swift/i, label: "BIC", get: (_p, d) => d.bic || "" },
  { re: /permis de conduire/i, label: "N° de permis", get: (p, d) => p === "PERSONAL" ? d.drivingLicense || "" : "" },
  { re: /immatriculation/i, label: "Immatriculation", get: (p, d) => p === "PERSONAL" ? d.vehiclePlate || "" : "" },
  { re: /fait [àa]|[ée]tabli [àa]/i, label: "Fait à", get: (_p, d) => d.city || "" },
  { re: /fait le|date du jour|^\W*le\W*$/i, label: "Date", get: () => today() },
];

export interface Prefill { label: string; value: string; source: string; }
// Lit le texte du document ligne par ligne et propose une valeur du profil actif pour chaque champ reconnu.
export function prefill(text: string, p: ProfileKind, v: Vault): Prefill[] {
  const out: Prefill[] = []; const seen = new Set<string>(); const d = v[p];
  for (const raw of text.split(/\n|(?<=:)\s{2,}/)) {
    const line = raw.trim(); if (line.length < 2 || line.length > 120) continue;
    const r = RULES.find((x) => x.re.test(line)); if (!r || seen.has(r.label)) continue;
    seen.add(r.label); out.push({ label: r.label, value: r.get(p, d).trim(), source: line.replace(/[:._\s]+$/, "").slice(0, 60) });
  }
  return out;
}
