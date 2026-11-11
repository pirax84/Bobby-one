import { SB_URL, SB_KEY } from "./auth";
// Dialogue avec le serveur Supabase (comptes, amis, messages). Aucun mot de passe n'est gardé : seulement la session.
export interface Sess { access: string; refresh: string; exp: number; uid: string; email: string }
const K = "notiif-sb";
export const getSess = (): Sess | null => { try { return JSON.parse(localStorage.getItem(K) || "null"); } catch { return null; } };
export const saveSession = (d: any) => {
  if (!d?.access_token) return;
  try { localStorage.setItem(K, JSON.stringify({ access: d.access_token, refresh: d.refresh_token, exp: Date.now() / 1000 + (Number(d.expires_in) || 3600) - 60, uid: d.user?.id || getSess()?.uid || "", email: d.user?.email || getSess()?.email || "" })); } catch { /* ignoré */ }
};
export const signOut = () => { try { localStorage.removeItem(K); } catch { /* ignoré */ } try { (window as any).CercleNative?.clearSession?.(); } catch { /* ignoré */ } };
async function token(): Promise<string | null> {
  const s = getSess(); if (!s) return null;
  if (Date.now() / 1000 < s.exp) return s.access;
  try {
    const r = await fetch(SB_URL + "/auth/v1/token?grant_type=refresh_token", { method: "POST", headers: { apikey: SB_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: s.refresh }) });
    if (!r.ok) { signOut(); return null; }
    saveSession(await r.json()); return getSess()?.access || null;
  } catch { return s.access; }
}
export interface Res<T = any> { ok: boolean; status: number; data: T }
async function req(method: string, path: string, body?: unknown, prefer?: string): Promise<Res> {
  const tk = await token(); if (!tk) return { ok: false, status: 401, data: null };
  try {
    const r = await fetch(SB_URL + path, { method, headers: { apikey: SB_KEY, Authorization: "Bearer " + tk, "Content-Type": "application/json", ...(prefer ? { Prefer: prefer } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    const txt = await r.text(); let data: any = null; try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }
    return { ok: r.ok, status: r.status, data };
  } catch { return { ok: false, status: 0, data: null }; }
}
const q = encodeURIComponent;
export interface Person { id: string; name: string }
export interface Friend extends Person { cats: string[] }
export interface Request extends Person { reqId: string; incoming: boolean }
export interface Msg { id: string; sender: string; recipient: string; body: string; fx: string | null; created_at: string }
export const errText = (r: Res) => r.status === 0 ? "Pas de connexion au serveur." : String(r.data?.message || r.data?.msg || r.data?.hint || "Erreur " + r.status);

export async function myProfile(): Promise<{ name: string; code: string } | null> {
  const s = getSess(); if (!s) return null;
  const r = await req("GET", `/rest/v1/profiles?id=eq.${s.uid}&select=display_name,code`);
  const p = Array.isArray(r.data) ? r.data[0] : null; return p ? { name: p.display_name, code: p.code } : null;
}
async function names(ids: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {}; if (!ids.length) return out;
  const r = await req("GET", `/rest/v1/profiles?id=in.(${ids.join(",")})&select=id,display_name`);
  if (Array.isArray(r.data)) for (const p of r.data) out[p.id] = p.display_name; return out;
}
export async function listFriends(): Promise<Friend[]> {
  const r = await req("GET", "/rest/v1/friends?select=friend_id,cats"); if (!Array.isArray(r.data)) return [];
  const n = await names(r.data.map((x: any) => x.friend_id));
  return r.data.map((x: any) => ({ id: x.friend_id, name: n[x.friend_id] || "?", cats: x.cats || [] }));
}
export async function listRequests(): Promise<Request[]> {
  const s = getSess(); const r = await req("GET", "/rest/v1/friend_requests?select=id,from_id,to_id"); if (!s || !Array.isArray(r.data)) return [];
  const n = await names(r.data.map((x: any) => (x.from_id === s.uid ? x.to_id : x.from_id)));
  return r.data.map((x: any) => { const inc = x.to_id === s.uid; const o = inc ? x.from_id : x.to_id; return { reqId: x.id, id: o, name: n[o] || "?", incoming: inc }; });
}
export const requestFriend = (code: string) => req("POST", "/rest/v1/rpc/request_friend", { p_code: code });
export const acceptRequest = (id: string, cats: string[] = []) => req("POST", "/rest/v1/rpc/accept_request", { p_id: id, p_cats: cats });
export const sendMessage = (to: string, body: string, fx?: string, id?: string) => req("POST", "/rest/v1/messages", { ...(id ? { id } : {}), sender: getSess()?.uid, recipient: to, body, fx: fx || null }, "return=minimal");
export async function allMessages(): Promise<Msg[]> { const r = await req("GET", "/rest/v1/messages?order=created_at.desc&limit=300&select=id,sender,recipient,body,fx,created_at"); return Array.isArray(r.data) ? (r.data as Msg[]).reverse() : []; }
export async function thread(friend: string): Promise<Msg[]> {
  const me = getSess()?.uid; if (!me) return [];
  const f = `or=(and(sender.eq.${me},recipient.eq.${friend}),and(sender.eq.${friend},recipient.eq.${me}))`;
  const r = await req("GET", `/rest/v1/messages?${f}&order=created_at.desc&limit=40&select=id,sender,recipient,body,fx,created_at`);
  return Array.isArray(r.data) ? (r.data as Msg[]).reverse() : [];
}
void q;
