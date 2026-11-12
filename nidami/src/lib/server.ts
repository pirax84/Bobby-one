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
export interface Msg { id: string; sender: string; recipient: string; body: string; fx: string | null; created_at: string; media_kind?: string | null; media?: string | null }
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
export const sendMessage = (to: string, body: string, fx?: string, id?: string, media?: { kind: string; data: string }) => req("POST", "/rest/v1/messages", { ...(id ? { id } : {}), sender: getSess()?.uid, recipient: to, body, fx: fx || null, ...(media ? { media_kind: media.kind, media: media.data } : {}) }, "return=minimal");
export async function getMedia(id: string): Promise<string | null> { const r = await req("GET", `/rest/v1/messages?id=eq.${id}&select=media`); return Array.isArray(r.data) && r.data[0]?.media ? String(r.data[0].media) : null; }
export async function allMessages(): Promise<Msg[]> { let r = await req("GET", "/rest/v1/messages?order=created_at.desc&limit=300&select=id,sender,recipient,body,fx,created_at,media_kind"); if (!r.ok) r = await req("GET", "/rest/v1/messages?order=created_at.desc&limit=300&select=id,sender,recipient,body,fx,created_at"); return Array.isArray(r.data) ? (r.data as Msg[]).reverse() : []; }
export async function thread(friend: string): Promise<Msg[]> {
  const me = getSess()?.uid; if (!me) return [];
  const f = `or=(and(sender.eq.${me},recipient.eq.${friend}),and(sender.eq.${friend},recipient.eq.${me}))`;
  const r = await req("GET", `/rest/v1/messages?${f}&order=created_at.desc&limit=40&select=id,sender,recipient,body,fx,created_at`);
  return Array.isArray(r.data) ? (r.data as Msg[]).reverse() : [];
}
void q;

/** « Je suis en train d'écrire à cet ami » (le signal expire tout seul). */
export const dbg = { tPost: "–", tGet: "–", pull: "–" };
export const sendTyping = async (to: string) => { const r = await req("POST", "/rest/v1/typing?on_conflict=user_id,to_id", { user_id: getSess()?.uid, to_id: to, at: new Date().toISOString() }, "resolution=merge-duplicates,return=minimal"); dbg.tPost = r.status + " " + new Date().toLocaleTimeString(); return r; };
/** Qui m'écrit en ce moment (dernières secondes). */
const tSeen = new Map<string, { at: string; local: number }>(); let tFirst = true;
export async function typingNow(): Promise<string[]> {
  const me = getSess()?.uid; if (!me) return [];
  const r = await req("GET", `/rest/v1/typing?to_id=eq.${me}&select=user_id,at`); dbg.tGet = r.status + " (" + (Array.isArray(r.data) ? r.data.length : "?") + " signal) " + new Date().toLocaleTimeString(); if (!Array.isArray(r.data)) return [];
  const out: string[] = []; const t0 = Date.now();
  for (const x of r.data as { user_id: string; at: string }[]) {
    const old = tSeen.get(x.user_id);
    if (!old || old.at !== x.at) { tSeen.set(x.user_id, { at: x.at, local: t0 }); if (!(tFirst && !old && t0 - Date.parse(x.at) > 6000)) out.push(x.user_id); }
    else if (t0 - old.local < 4500) out.push(x.user_id);
  }
  tFirst = false; return out;
}

/** Mon état de présence + « je suis là maintenant ». */
export const heartbeat = (presence: string) => req("PATCH", `/rest/v1/profiles?id=eq.${getSess()?.uid}`, { presence, seen_at: new Date().toISOString() }, "return=minimal");
/** Appli cachée ou fermée : je me déclare absent tout de suite (la requête part même pendant la fermeture). */
export function heartbeatAway() { const s = getSess(); if (!s) return; try { void fetch(SB_URL + `/rest/v1/profiles?id=eq.${s.uid}`, { method: "PATCH", keepalive: true, headers: { apikey: SB_KEY, Authorization: "Bearer " + s.access, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ presence: "away", seen_at: new Date(Date.now() - 60000).toISOString() }) }); } catch { /* ignoré */ } }
/** Présence de mes amis : « absent » si pas vu depuis plus de 75 secondes. */
const pSeen = new Map<string, { v: string; local: number }>();
export async function peersNow(): Promise<Record<string, "here" | "later" | "busy" | "away">> {
  const r = await req("GET", "/rest/v1/profiles?select=id,presence,seen_at"); const out: Record<string, "here" | "later" | "busy" | "away"> = {};
  if (!Array.isArray(r.data)) return out; const t0 = Date.now();
  for (const p of r.data) {
    const v = String(p.seen_at || ""); const old = pSeen.get(p.id); let fresh: boolean;
    if (!v) fresh = false;
    else if (!old) { pSeen.set(p.id, { v, local: t0 }); fresh = t0 - Date.parse(v) < 25000; }
    else if (old.v !== v) { pSeen.set(p.id, { v, local: t0 }); fresh = true; }
    else fresh = t0 - old.local < 25000;
    out[p.id] = !fresh ? "away" : p.presence === "busy" ? "busy" : p.presence === "later" ? "later" : p.presence === "away" ? "away" : "here";
  }
  return out;
}
