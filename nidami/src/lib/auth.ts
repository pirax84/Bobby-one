import { t } from "../i18n";
import { saveSession } from "./server";
// Connexion / inscription. Tout passe par le serveur Supabase (adresse et clé publique dans .env.local).
// Sans serveur relié, l'application reste en « mode démo » sur l'appareil. NON TESTÉ sur un vrai serveur.
const env = ((import.meta as unknown as { env?: Record<string, string> }).env) || {};
// Adresse et clé PUBLIQUE du serveur (la même que sur l'ancienne adresse GitHub) : le site notiif.vercel.app s'en sert aussi.
// Cette clé est faite pour être publique (elle est visible dans toute page web) ; la sécurité vient des règles du serveur.
export const SB_URL: string = env.VITE_SUPABASE_URL || "https://jtymrohpjhiukjreqewb.supabase.co";
export const SB_KEY: string = env.VITE_SUPABASE_ANON_KEY || "sb_publishable_2jGaV3B9eU2ITaI_9TgAvQ_fVOewCZA";
export const serverLive = () => !!SB_URL && !!SB_KEY && !/VOTRE-PROJET/.test(SB_URL);
export const serverOn = () => !!SB_URL && !!SB_KEY && !/VOTRE-PROJET/.test(SB_URL); // le serveur (comptes, amis, messages) est actif dans toutes les versions

export interface Prov { id: string; label: string; badge: string; sb?: string; soon?: string }
export const PROVIDERS: Prov[] = [
  { id: "apple", get label() { return t("Continuer avec Apple"); }, badge: "A", sb: "apple" },
  { id: "google", get label() { return t("Continuer avec Google"); }, badge: "G", sb: "google" },
  { id: "facebook", get label() { return t("Continuer avec Facebook"); }, badge: "f", sb: "facebook" },
  { id: "snapchat", get label() { return t("Continuer avec Snapchat"); }, badge: "👻", get soon() { return t("Snapchat demande un accord de développeur (Snap Kit). À demander avant de l'activer."); } },
  { id: "franceconnect", label: "FranceConnect", badge: "FC", get soon() { return t("FranceConnect demande une habilitation de l'État (dossier à déposer sur datapass.api.gouv.fr)."); } },
  { id: "laposte", get label() { return t("Identité Numérique La Poste"); }, badge: "ID", get soon() { return t("L'Identité Numérique La Poste demande un partenariat avec La Poste."); } },
];
const here = () => location.origin + location.pathname;
export const oauthUrl = (p: string) => `${SB_URL}/auth/v1/authorize?provider=${encodeURIComponent(p)}&redirect_to=${encodeURIComponent(here())}`;
export interface Who { name: string; email: string }
const nameOf = (u: any, fallback: string): string => String(u?.user_metadata?.name || u?.user_metadata?.full_name || u?.user_metadata?.given_name || fallback).slice(0, 30);
async function call(path: string, body: unknown, method = "POST", token?: string): Promise<{ ok: boolean; status: number; data: any }> {
  try { const r = await fetch(SB_URL + path, { method, headers: { apikey: SB_KEY, "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) }, body: JSON.stringify(body) }); return { ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) }; } catch { return { ok: false, status: 0, data: { error_code: "network" } }; }
}
/** Code d'erreur du serveur, ramené à quelques cas simples. */
export type ErrCode = "exists" | "badlogin" | "unconfirmed" | "weak" | "toomany" | "bademail" | "samepw" | "expired" | "network" | "other";
export function errCode(status: number, d: any): ErrCode {
  const c = String(d?.error_code || d?.code || ""); const m = String(d?.msg || d?.error_description || d?.message || "").toLowerCase();
  if (c === "network" || status === 0) return "network";
  if (c === "user_already_exists" || c === "email_exists" || /already (been )?registered|already exists/.test(m)) return "exists";
  if (c === "invalid_credentials" || /invalid login credentials/.test(m)) return "badlogin";
  if (c === "email_not_confirmed" || /not confirmed/.test(m)) return "unconfirmed";
  if (c === "weak_password" || /password should|weak/.test(m)) return "weak";
  if (status === 429 || /rate limit|too many|security purposes/.test(m) || c.startsWith("over_")) return "toomany";
  if (c === "email_address_invalid" || c === "validation_failed" || /invalid.*email|email.*invalid|unable to validate email/.test(m)) return "bademail";
  if (c === "same_password" || /different from the old/.test(m)) return "samepw";
  if (c === "otp_expired" || c === "bad_jwt" || c === "session_not_found" || status === 401 || /expired|invalid.*(jwt|token)/.test(m)) return "expired";
  return "other";
}
/** Message clair en français (traduit dans la langue choisie) pour chaque cas. */
export function errText(c: ErrCode): string {
  switch (c) {
    case "exists": return t("Un compte existe déjà avec cette adresse e-mail. Connectez-vous ou réinitialisez votre mot de passe.");
    case "badlogin": return t("Adresse e-mail ou mot de passe incorrect.");
    case "unconfirmed": return t("Votre adresse e-mail n'est pas encore confirmée. Ouvrez l'e-mail de confirmation, puis réessayez.");
    case "weak": return t("Mot de passe trop faible : utilisez au moins 8 caractères, avec des lettres et des chiffres.");
    case "toomany": return t("Trop d'essais d'affilée. Attendez quelques minutes, puis réessayez.");
    case "bademail": return t("Cette adresse e-mail n'est pas valide.");
    case "samepw": return t("Le nouveau mot de passe doit être différent de l'ancien.");
    case "expired": return t("Votre lien a expiré : demandez-en un nouveau.");
    case "network": return t("Serveur injoignable. Vérifiez votre connexion internet, puis réessayez.");
    default: return t("Une erreur est survenue. Réessayez dans un instant.");
  }
}
const msgOf = (r: { status: number; data: any }) => errText(errCode(r.status, r.data));
export async function emailSignUp(email: string, password: string, name: string, extra: Record<string, string> = {}): Promise<{ ok: boolean; msg: string; who?: Who; code?: ErrCode }> {
  const r = await call("/auth/v1/signup", { email, password, data: { name, ...extra } });
  if (!r.ok) return { ok: false, msg: msgOf(r), code: errCode(r.status, r.data) };
  // Serveur réglé pour cacher les comptes existants : il répond « OK » sans créer de compte (aucune identité).
  if (Array.isArray(r.data?.identities) && r.data.identities.length === 0) return { ok: false, msg: errText("exists"), code: "exists" };
  if (r.data?.access_token) saveSession(r.data);
  if (r.data?.access_token) return { ok: true, msg: t("Compte créé."), who: { name: nameOf(r.data.user, name), email } };
  return { ok: true, msg: t("Compte créé. Ouvrez l'e-mail de confirmation que nous venons de vous envoyer, puis revenez vous connecter.") };
}
export async function emailLogin(email: string, password: string): Promise<{ ok: boolean; msg: string; who?: Who; code?: ErrCode }> {
  const r = await call("/auth/v1/token?grant_type=password", { email, password });
  if (!r.ok) return { ok: false, msg: msgOf(r), code: errCode(r.status, r.data) };
  saveSession(r.data);
  return { ok: true, msg: t("Connecté."), who: { name: nameOf(r.data.user, email.split("@")[0]), email } };
}
/* ——— Mot de passe oublié ———
   1) sendReset : le serveur envoie un e-mail avec un lien ;
   2) le lien ramène sur NOTIIF avec « #…type=recovery » : on le repère dès le chargement (avant tout le reste) ;
   3) setNewPassword : on enregistre le nouveau mot de passe et la personne est connectée. */
export async function sendReset(email: string): Promise<{ ok: boolean; msg: string; code?: ErrCode }> {
  const r = await call("/auth/v1/recover?redirect_to=" + encodeURIComponent(here()), { email });
  return r.ok ? { ok: true, msg: "" } : { ok: false, msg: msgOf(r), code: errCode(r.status, r.data) };
}
export type Recovery = { access: string; refresh: string; expiresIn: number } | { error: ErrCode };
let recovery: Recovery | null = null;
/** Lit « #…type=recovery » dans l'adresse (au chargement, et si l'adresse change alors que NOTIIF est déjà ouvert). */
export const readRecovery = () => { try {
  const h = typeof location !== "undefined" ? location.hash : ""; if (!h || h.length < 3) return;
  const q = new URLSearchParams(h.slice(1));
  if (q.get("type") === "recovery" && q.get("access_token")) recovery = { access: q.get("access_token")!, refresh: q.get("refresh_token") || "", expiresIn: Number(q.get("expires_in")) || 3600 };
  else if (q.get("error") && /otp|expired|invalid/i.test((q.get("error_code") || "") + (q.get("error_description") || ""))) recovery = { error: "expired" };
  if (recovery) history.replaceState(history.state, "", location.pathname + location.search);
} catch { /* ignoré */ } return recovery; };
readRecovery();
export const pendingRecovery = () => recovery;
export const clearRecovery = () => { recovery = null; };
export async function setNewPassword(password: string): Promise<{ ok: boolean; msg: string; who?: Who; code?: ErrCode }> {
  const rc = recovery; if (!rc || "error" in rc) return { ok: false, msg: errText("expired"), code: "expired" };
  const r = await call("/auth/v1/user", { password }, "PUT", rc.access);
  if (!r.ok) return { ok: false, msg: msgOf(r), code: errCode(r.status, r.data) };
  saveSession({ access_token: rc.access, refresh_token: rc.refresh, expires_in: rc.expiresIn, user: r.data });
  return { ok: true, msg: "", who: { name: nameOf(r.data, String(r.data?.email || "").split("@")[0] || t("Moi")), email: r.data?.email || "" } };
}
/** Au retour de Google/Apple/Facebook, le serveur ajoute « #access_token=… » à l'adresse. */
export async function sessionFromReturn(): Promise<Who | null> {
  const h = location.hash; if (!serverOn() || !/access_token=/.test(h) || /type=recovery/.test(h)) return null;
  const tok = new URLSearchParams(h.slice(1)).get("access_token"); history.replaceState(null, "", location.pathname + location.search); if (!tok) return null;
  try { const r = await fetch(SB_URL + "/auth/v1/user", { headers: { apikey: SB_KEY, Authorization: "Bearer " + tok } }); if (!r.ok) return null; const u = await r.json(); return { name: nameOf(u, t("Moi")), email: u.email || "" }; } catch { return null; }
}
