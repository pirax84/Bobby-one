// ─────────────────────────────────────────────────────────────────────────────
// Moteur de règles de Mon cercle : qui peut voir quoi, et pendant combien de temps.
// Pur (sans écran, sans stockage) pour pouvoir être testé. Le temps vient TOUJOURS
// d'une horloge passée en paramètre : c'est l'« heure du serveur » (jamais celle de l'écran).
// En mode démo, tout tourne sur l'appareil. En mode serveur (Supabase), les mêmes règles
// sont appliquées par la base de données (voir supabase/migrations).
// ─────────────────────────────────────────────────────────────────────────────

export type ID = string;
export type Audience =
  | { mode: "all" }                       // tous mes amis
  | { mode: "group"; groupId: ID }        // tous les membres d'un groupe
  | { mode: "only"; ids: ID[] }           // amis sélectionnés
  | { mode: "except"; ids: ID[] }         // tous mes amis sauf…
  | { mode: "list"; listId: ID }          // liste personnalisée
  | { mode: "me" };                       // moi uniquement

export interface Group { id: ID; name: string; emoji: string; description: string; rules: string; adminIds: ID[]; memberIds: ID[] }
export interface FriendList { id: ID; ownerId: ID; name: string; memberIds: ID[] }
export interface Comment { id: ID; authorId: ID; text: string; at: number; replyTo?: ID }
export interface Post {
  id: ID; authorId: ID; kind: "text" | "photo" | "video"; text: string; img?: string | null; video?: string | null; albumId?: ID; bg?: number;
  mood?: string; story?: boolean;
  createdAt: number;
  audience: Audience; recipients: ID[];      // destinataires figés à la publication
  viewSecs: number;                          // 0 = permanente ; sinon durée de consultation PAR PERSONNE
  expiresAt: number | null;                  // expiration globale (null = jamais)
  views: Record<ID, number>;                 // utilisateur → heure de première ouverture
  reactions: Record<ID, string>;
  comments: Comment[];
  purged?: boolean;                          // fichier supprimé du stockage
  sharedFrom?: ID; shareId?: ID;             // republication AUTORISÉE : simple référence vers l'original (aucune copie)
}
export interface Social { friends: Record<ID, ID[]>; blocks: Record<ID, ID[]>; groups: Group[]; lists: FriendList[] }

export const VIEW_CHOICES = [3, 5, 10, 30, 60] as const;      // secondes proposées
export const MAX_CUSTOM_SECS = 600;                          // durée personnalisée : 1 s à 10 min
export const DEFAULT_GLOBAL_MS = 24 * 3600 * 1000;           // 24 h

export const validViewSecs = (n: number) => Number.isInteger(n) && n >= 0 && n <= MAX_CUSTOM_SECS;
export const areFriends = (s: Social, a: ID, b: ID) => (s.friends[a] || []).includes(b) && (s.friends[b] || []).includes(a);
export const isBlocked = (s: Social, a: ID, b: ID) => (s.blocks[a] || []).includes(b) || (s.blocks[b] || []).includes(a);

// Qui recevra la publication ? (calculé une seule fois, à la publication)
export function resolveRecipients(s: Social, authorId: ID, aud: Audience): ID[] {
  const friends = (s.friends[authorId] || []).filter((f) => areFriends(s, authorId, f) && !isBlocked(s, authorId, f));
  let r: ID[] = [];
  switch (aud.mode) {
    case "all": r = friends; break;
    case "group": { const g = s.groups.find((x) => x.id === aud.groupId); r = g && g.memberIds.includes(authorId) ? g.memberIds.filter((m) => m !== authorId && friends.includes(m)) : []; break; }
    case "only": r = aud.ids.filter((i) => friends.includes(i)); break;
    case "except": r = friends.filter((f) => !aud.ids.includes(f)); break;
    case "list": { const l = s.lists.find((x) => x.id === aud.listId && x.ownerId === authorId); r = l ? l.memberIds.filter((i) => friends.includes(i)) : []; break; }
    case "me": r = []; break;
  }
  return [...new Set(r)];
}

export type Access =
  | { ok: true; author: boolean; remainingMs: number | null; firstOpen: boolean }
  | { ok: false; reason: "not-recipient" | "blocked" | "expired-global" | "expired-for-you" | "purged" | "missing" };

// Décision d'accès : appelée à CHAQUE ouverture. `open=false` = simple vérification (aucun chrono lancé).
export function checkAccess(post: Post | undefined, userId: ID, now: number, s: Social): Access {
  if (!post) return { ok: false, reason: "missing" };
  if (post.authorId === userId) return { ok: true, author: true, remainingMs: null, firstOpen: false };
  if (isBlocked(s, post.authorId, userId)) return { ok: false, reason: "blocked" };
  if (!post.recipients.includes(userId)) return { ok: false, reason: "not-recipient" };
  if (post.expiresAt !== null && now >= post.expiresAt) return { ok: false, reason: "expired-global" };
  if (post.purged) return { ok: false, reason: post.views[userId] !== undefined ? "expired-for-you" : "purged" };
  if (post.viewSecs === 0) return { ok: true, author: false, remainingMs: null, firstOpen: false };
  const opened = post.views[userId];
  if (opened === undefined) return { ok: true, author: false, remainingMs: post.viewSecs * 1000, firstOpen: true };
  const left = opened + post.viewSecs * 1000 - now;
  if (left <= 0) return { ok: false, reason: "expired-for-you" };
  return { ok: true, author: false, remainingMs: left, firstOpen: false };
}

// Ouvre une publication : enregistre l'heure de PREMIÈRE ouverture (une seule fois) puis renvoie l'accès.
export function openPost(post: Post, userId: ID, now: number, s: Social): Access {
  const a = checkAccess(post, userId, now, s);
  if (a.ok && !a.author && post.views[userId] === undefined) post.views[userId] = now;   // sert aussi au « vu par »
  return a.ok && !a.author ? checkAccess(post, userId, now, s) : a;
}

// L'image est-elle encore distribuable à quelqu'un ? Sinon on la supprime du stockage.
export function shouldPurge(post: Post, now: number): boolean {
  if (post.purged || post.viewSecs === 0 && post.expiresAt === null) return false;
  if (post.expiresAt !== null && now >= post.expiresAt) return true;
  if (post.viewSecs > 0) return post.recipients.every((r) => post.views[r] !== undefined && now >= post.views[r] + post.viewSecs * 1000);
  return false;
}
export function purgeExpired(posts: Post[], now: number): number {
  let n = 0;
  for (const p of posts) if (shouldPurge(p, now)) { p.img = null; if (p.kind === "photo" || p.viewSecs > 0) p.text = p.viewSecs > 0 ? "" : p.text; p.purged = true; n++; }
  return n;
}

// Le fil d'une personne : publications qu'elle a le droit de voir (hors stories), plus récentes d'abord.
export function feedFor(posts: Post[], userId: ID, now: number, s: Social): Post[] {
  const shown = (p: Post) => { const a = accessFor(p, posts, userId, now, s); return a.ok || a.reason === "expired-for-you"; };   // « expirée pour moi » reste visible, grisée
  return posts.filter((p) => !p.story && !p.albumId && shown(p)).sort((a, b) => b.createdAt - a.createdAt);
}
export const storiesFor = (posts: Post[], userId: ID, now: number, s: Social) => posts.filter((p) => p.story && checkAccess(p, userId, now, s).ok).sort((a, b) => a.createdAt - b.createdAt);

export const fmtSecs = (n: number) => (n === 0 ? "Permanente" : n < 60 ? `${n} s` : n % 60 === 0 ? `${n / 60} min` : `${Math.floor(n / 60)} min ${n % 60} s`);
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// ── Partage avec accord : la republication n'est qu'un lien vers l'original ─────────────────────────
// L'auteur garde le contrôle total : s'il révoque ou supprime l'original, tout disparaît chez les autres.
export const originalOf = (p: Post, posts: Post[]): Post | undefined => (p.sharedFrom ? posts.find((x) => x.id === p.sharedFrom) : undefined);
function virtual(r: Post, o: Post): Post { return { ...o, id: r.id, authorId: r.authorId, recipients: r.recipients, views: r.views, sharedFrom: r.sharedFrom, shareId: r.shareId, viewSecs: r.viewSecs, expiresAt: r.expiresAt }; }
export function accessFor(p: Post | undefined, posts: Post[], userId: ID, now: number, s: Social): Access {
  if (!p) return { ok: false, reason: "missing" };
  if (!p.sharedFrom) return checkAccess(p, userId, now, s);
  const o = originalOf(p, posts); if (!o) return { ok: false, reason: "missing" };
  if (o.authorId === userId) return { ok: true, author: true, remainingMs: null, firstOpen: false };
  if (isBlocked(s, o.authorId, userId)) return { ok: false, reason: "blocked" };
  if (p.authorId === userId) { if (o.expiresAt !== null && now >= o.expiresAt) return { ok: false, reason: "expired-global" }; return { ok: true, author: true, remainingMs: null, firstOpen: false }; }
  return checkAccess(virtual(p, o), userId, now, s);
}
export function openAny(p: Post, posts: Post[], userId: ID, now: number, s: Social): Access {
  if (!p.sharedFrom) return openPost(p, userId, now, s);
  const o = originalOf(p, posts); if (!o) return { ok: false, reason: "missing" };
  const v = virtual(p, o); const pre = accessFor(p, posts, userId, now, s); if (!pre.ok || pre.author) return pre;
  const a = openPost(v, userId, now, s); p.views = v.views; return a;
}
export const cascadeDelete = (posts: Post[], id: ID): Post[] => posts.filter((x) => x.id !== id && x.sharedFrom !== id);
export const revokeShare = (posts: Post[], shareId: ID): Post[] => posts.filter((x) => x.shareId !== shareId);
