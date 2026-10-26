// Connexion / inscription. Tout passe par le serveur Supabase (adresse et clé publique dans .env.local).
// Sans serveur relié, l'application reste en « mode démo » sur l'appareil. NON TESTÉ sur un vrai serveur.
const env = ((import.meta as unknown as { env?: Record<string, string> }).env) || {};
export const SB_URL: string = env.VITE_SUPABASE_URL || "";
const SB_KEY: string = env.VITE_SUPABASE_ANON_KEY || "";
export const serverOn = () => !!SB_URL && !!SB_KEY && !/VOTRE-PROJET/.test(SB_URL);

export interface Prov { id: string; label: string; badge: string; sb?: string; soon?: string }
export const PROVIDERS: Prov[] = [
  { id: "apple", label: "Continuer avec Apple", badge: "A", sb: "apple" },
  { id: "google", label: "Continuer avec Google", badge: "G", sb: "google" },
  { id: "facebook", label: "Continuer avec Facebook", badge: "f", sb: "facebook" },
  { id: "snapchat", label: "Continuer avec Snapchat", badge: "👻", soon: "Snapchat demande un accord de développeur (Snap Kit). À demander avant de l'activer." },
  { id: "franceconnect", label: "FranceConnect", badge: "FC", soon: "FranceConnect demande une habilitation de l'État (dossier à déposer sur datapass.api.gouv.fr)." },
  { id: "laposte", label: "Identité Numérique La Poste", badge: "ID", soon: "L'Identité Numérique La Poste demande un partenariat avec La Poste." },
];
const here = () => location.origin + location.pathname;
export const oauthUrl = (p: string) => `${SB_URL}/auth/v1/authorize?provider=${encodeURIComponent(p)}&redirect_to=${encodeURIComponent(here())}`;
export interface Who { name: string; email: string }
const nameOf = (u: any, fallback: string): string => String(u?.user_metadata?.name || u?.user_metadata?.full_name || u?.user_metadata?.given_name || fallback).slice(0, 30);
async function call(path: string, body: unknown): Promise<{ ok: boolean; data: any }> {
  try { const r = await fetch(SB_URL + path, { method: "POST", headers: { apikey: SB_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) }); return { ok: r.ok, data: await r.json().catch(() => ({})) }; } catch { return { ok: false, data: { msg: "Serveur injoignable." } }; }
}
const msgOf = (d: any) => String(d?.msg || d?.error_description || d?.message || "Une erreur est survenue.");
export async function emailSignUp(email: string, password: string, name: string): Promise<{ ok: boolean; msg: string; who?: Who }> {
  const r = await call("/auth/v1/signup", { email, password, data: { name } });
  if (!r.ok) return { ok: false, msg: msgOf(r.data) };
  if (r.data?.access_token) return { ok: true, msg: "Compte créé.", who: { name: nameOf(r.data.user, name), email } };
  return { ok: true, msg: "Compte créé. Ouvrez l'e-mail de confirmation que nous venons de vous envoyer, puis revenez vous connecter." };
}
export async function emailLogin(email: string, password: string): Promise<{ ok: boolean; msg: string; who?: Who }> {
  const r = await call("/auth/v1/token?grant_type=password", { email, password });
  if (!r.ok) return { ok: false, msg: msgOf(r.data) };
  return { ok: true, msg: "Connecté.", who: { name: nameOf(r.data.user, email.split("@")[0]), email } };
}
/** Au retour de Google/Apple/Facebook, le serveur ajoute « #access_token=… » à l'adresse. */
export async function sessionFromReturn(): Promise<Who | null> {
  const h = location.hash; if (!serverOn() || !/access_token=/.test(h)) return null;
  const tok = new URLSearchParams(h.slice(1)).get("access_token"); history.replaceState(null, "", location.pathname + location.search); if (!tok) return null;
  try { const r = await fetch(SB_URL + "/auth/v1/user", { headers: { apikey: SB_KEY, Authorization: "Bearer " + tok } }); if (!r.ok) return null; const u = await r.json(); return { name: nameOf(u, "Moi"), email: u.email || "" }; } catch { return null; }
}
