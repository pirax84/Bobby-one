// Expéditeurs bloqués : adresses e-mail précises ou domaines entiers (et tous leurs sous-domaines).
export type SenderRule = { v: string; kind: "email" | "domain"; at: number };

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

/** Nettoie ce que l'utilisateur tape : « Toto <x@y.fr> », « @y.fr », « https://www.y.fr/… », « y.fr ». */
export function normalizeSender(raw: string): SenderRule | null {
  let x = raw.trim().toLowerCase();
  const m = x.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/);
  if (m) return { v: m[0], kind: "email", at: Date.now() };
  x = x.replace(/^https?:\/\//, "").replace(/^@/, "").replace(/^\*\./, "").replace(/^www\./, "").split(/[/?#\s]/)[0];
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(x)) return { v: x, kind: "domain", at: Date.now() };
  return null;
}

export const domainOf = (email: string) => email.split("@")[1]?.toLowerCase() || "";

/** Toutes les adresses e-mail trouvées dans un texte (en-têtes de mail compris). */
export function emailsIn(text: string): string[] { return [...new Set((text.match(EMAIL_RE) || []).map((e) => e.toLowerCase()))]; }

/** Tous les domaines de liens trouvés dans un texte. */
export function linkDomainsIn(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/(?:https?:\/\/|www\.)([a-z0-9.-]+\.[a-z]{2,})/gi)) out.add(m[1].toLowerCase().replace(/^www\./, ""));
  return [...out];
}

/** La règle de blocage qui correspond à cette adresse ou à ce domaine, s'il y en a une. */
export function matchBlocked(target: string, rules: SenderRule[]): SenderRule | null {
  const t = target.toLowerCase(); const d = t.includes("@") ? domainOf(t) : t;
  return rules.find((r) => (r.kind === "email" ? r.v === t : d === r.v || d.endsWith("." + r.v))) || null;
}

/** Cherche, dans tout un texte, une adresse ou un lien qui vient d'un expéditeur bloqué. */
export function findBlockedIn(text: string, rules: SenderRule[]): { found: string; rule: SenderRule } | null {
  if (!rules.length) return null;
  for (const e of emailsIn(text)) { const r = matchBlocked(e, rules); if (r) return { found: e, rule: r }; }
  for (const d of linkDomainsIn(text)) { const r = matchBlocked(d, rules); if (r) return { found: d, rule: r }; }
  return null;
}

/** Expéditeur principal d'un e-mail enregistré (.eml) ou collé : ligne « From: » / « De : ». */
export function senderFromText(text: string): string {
  const m = text.match(/^(?:from|de|exp[ée]diteur)\s*:\s*(.+)$/im);
  const e = m ? emailsIn(m[1])[0] : "";
  return e || "";
}

/** Si un message analysé par Bobby contient un expéditeur bloqué, le résultat passe en « Danger ». */
export function withBlocked<T extends { score: number; level: string; reasons: string[]; tips: string[] }>(r: T, text: string, rules: SenderRule[]): T {
  const hit = findBlockedIn(text, rules); if (!hit) return r;
  return { ...r, score: Math.min(r.score, 5), level: "danger", reasons: [(hit.rule.kind === "email" ? "Ce message vient d'une adresse que vous avez bloquée : " : "Ce message contient une adresse ou un lien d'un domaine que vous avez bloqué : ") + hit.found, ...r.reasons], tips: ["N'ouvrez aucun lien ni aucune pièce jointe de cet expéditeur.", ...r.tips] };
}
