export type Level = "safe" | "careful" | "suspicious" | "danger";
export interface Result { score: number; level: Level; reasons: string[]; tips: string[]; }
export const levelOf = (s: number): Level => (s >= 85 ? "safe" : s >= 60 ? "careful" : s >= 40 ? "suspicious" : "danger");
export const META: Record<Level, { label: string; color: string; bobby: string }> = {
  safe: { label: "Fiable", color: "#22C55E", bobby: "✅ Ce message semble fiable." },
  careful: { label: "Prudence", color: "#EAB308", bobby: "⚠️ Soyez prudent avant de répondre." },
  suspicious: { label: "Suspect", color: "#F97316", bobby: "⚠️ Cela me semble louche. Ne cliquez sur rien." },
  danger: { label: "Danger", color: "#EF4444", bobby: "🔴 Je pense qu'il s'agit probablement d'une arnaque." },
};
export const hash = (s: string) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const clamp = (n: number) => Math.max(2, Math.min(99, Math.round(n)));
const RULES: [RegExp, number, string, string][] = [
  [/urgent|imm[ée]diatement|dernier avis|sous 24|expire|avant ce soir|maintenant/i, 18, "Le message vous met la pression pour agir très vite.", "Prenez votre temps : un vrai organisme ne vous presse jamais."],
  [/virement|western union|bitcoin|crypto|carte cadeau|paysafe|iban|frais de|payer|r[èe]glement/i, 26, "On vous demande de l'argent ou un moyen de paiement inhabituel.", "Ne payez rien et n'envoyez jamais de cartes cadeaux ni de virements."],
  [/mot de passe|code (sms|re[çc]u|de v[ée]rification)|v[ée]rifier votre compte|confirm\w+ vos (informations|donn[ée]es)|compte (suspendu|bloqu[ée])|carte vitale|informations bancaires/i, 28, "On cherche à obtenir vos identifiants ou vos données personnelles.", "Ne donnez jamais un code ou un mot de passe, même à un « conseiller »."],
  [/f[ée]licitations|gagn[ée]|gagnant|h[ée]ritage|loterie|rendement garanti|100 ?% garanti|revenus passifs|investissement/i, 24, "L'offre paraît trop belle pour être vraie.", "Si c'est trop beau pour être vrai, c'est presque toujours une arnaque."],
  [/maman|papa|mon (ch[ée]ri|cher)|nouveau num[ée]ro|perdu mon t[ée]l[ée]phone|confidentiel|ne dis (rien|à personne)/i, 16, "Le message joue sur vos émotions ou se fait passer pour un proche.", "Appelez votre proche sur son ancien numéro pour vérifier."],
  [/colis|livraison|douane|frais de port|chronopost|colissimo/i, 12, "Il parle d'un colis ou d'une livraison, un prétexte très courant.", "Allez directement sur le site officiel du transporteur."],
  [/t[ée]l[ée]travail|recrutement|offre d'emploi|sans exp[ée]rience|gagnez \d+/i, 16, "L'offre d'emploi ressemble à une fausse annonce.", "Un vrai employeur ne demande jamais d'argent ni votre IBAN au départ."],
];
export function analyzeText(t: string): Result {
  let pen = 0; const reasons: string[] = []; const tips: string[] = [];
  RULES.forEach(([re, w, r, tip]) => { if (re.test(t)) { pen += w; reasons.push(r); tips.push(tip); } });
  const url = t.match(/https?:\/\/[^\s]+|\b[\w-]+\.(xyz|top|click|icu|buzz|cfd|ru)\b[^\s]*/i);
  if (url) { const u = analyzeUrl(url[0]); if (u && u.score < 85) { pen += u.score < 60 ? 28 : 14; reasons.push(`Le lien « ${u.domain} » paraît douteux.`); tips.push("N'ouvrez pas ce lien : tapez plutôt l'adresse officielle vous-même."); } }
  if (reasons.length === 0) { reasons.push("Je n'ai repéré ni pression, ni demande d'argent, ni lien suspect."); tips.push("Au moindre doute, vérifiez auprès de l'expéditeur par un autre moyen."); }
  const score = clamp(96 - pen * 0.9 + (hash(t) % 5));
  return { score, level: levelOf(score), reasons, tips };
}
const TRUST = ["paypal.com", "amazon.fr", "amazon.com", "impots.gouv.fr", "ameli.fr", "laposte.fr", "netflix.com", "apple.com", "microsoft.com", "google.com", "wikipedia.org", "service-public.fr"];
export interface UrlResult extends Result { domain: string; }
export function analyzeUrl(raw: string): UrlResult | null {
  let u: URL; try { u = new URL(/^https?:/i.test(raw.trim()) ? raw.trim() : "https://" + raw.trim()); } catch { return null; }
  const h = u.hostname.toLowerCase(); if (!h.includes(".")) return null;
  const trusted = TRUST.some((d) => h === d || h.endsWith("." + d)); let pen = 0; const reasons: string[] = []; const tips: string[] = [];
  const add = (n: number, r: string) => { pen += n; reasons.push(r); };
  if (!trusted) {
    if (u.protocol !== "https:") add(15, "La connexion n'est pas sécurisée (pas de https).");
    if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) add(30, "L'adresse est une suite de chiffres, pas un vrai nom de site.");
    if (/\.(xyz|top|click|icu|buzz|rest|cfd|live|shop)$/.test(h)) add(22, "Cette terminaison d'adresse est très utilisée par les arnaqueurs.");
    if ((h.match(/-/g) || []).length >= 2) add(12, "L'adresse contient beaucoup de tirets, souvent signe de faux site.");
    if (/paypal|amazon|impots|ameli|banque|bnp|laposte|colissimo|netflix|apple|microsoft|chronopost/.test(h)) add(32, "Ce site imite le nom d'une marque ou d'un organisme connu.");
    if (/login|verify|secure|update|promo|gratuit|gagn|paiement|connexion/.test(h + u.pathname)) add(12, "L'adresse contient des mots qui poussent à agir (connexion, paiement…).");
    if (h.split(".").length > 3) add(8, "L'adresse est anormalement longue et compliquée.");
  }
  if (reasons.length === 0) reasons.push(trusted ? "Ce site est un service connu et reconnu." : "Je n'ai repéré aucun signe inquiétant.");
  const score = clamp(97 - pen);
  tips.push(score >= 85 ? "Vous pouvez y aller, mais vérifiez toujours le cadenas dans la barre d'adresse." : score >= 60 ? "Évitez d'y saisir des informations personnelles." : "N'entrez ni mot de passe ni numéro de carte. Quittez ce site.");
  return { score, level: levelOf(score), reasons, tips, domain: h };
}
export const ageLabel = (d: number | null | undefined, t: (s: string) => string = (s) => s) => (d == null ? t("Inconnue") : d < 60 ? `${d} ${t("jours")}` : d < 730 ? `${Math.round(d / 30)} ${t("mois")}` : `${Math.round(d / 365)} ${t("ans")}`);
export const looksLikeUrl = (s: string) => { const x = s.trim(); return !/\s/.test(x) && (/^https?:\/\//i.test(x) || /^(www\.)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(x)); };
export interface CallResult { score: number; level: Level; name: string; reports: number; kind: "safe" | "unknown" | "scam"; }
export function scoreNumber(raw: string, known: { n: string; name: string; score: number; reports: number; kind: string }[]): CallResult | null {
  const d = raw.replace(/[^\d+]/g, ""); const digits = d.replace(/\D/g, ""); if (digits.length < 6) return null;
  const hit = known.find((c) => c.n.replace(/\D/g, "").endsWith(digits.slice(-9)) || digits.endsWith(c.n.replace(/\D/g, "").slice(-9)));
  if (hit) return { score: hit.score, level: levelOf(hit.score), name: hit.name, reports: hit.reports, kind: hit.kind as any };
  let pen = 0; if (/^\+?(225|224|212|216|237|221|44|7|234|91|86)/.test(d)) pen += 25; if (/^(\+33|0033|0)?9/.test(d)) pen += 12; if (/^(\+?33|0)?[67]/.test(d)) pen += 6;
  const score = clamp(70 - pen + (hash(digits) % 12)); const reports = score < 50 ? 8 + (hash(digits) % 40) : hash(digits) % 4;
  return { score, level: levelOf(score), name: score < 50 ? "Numéro douteux" : "Numéro inconnu", reports, kind: score < 50 ? "scam" : "unknown" };
}
