import { useSyncExternalStore } from "react";
import { ID, Post, Social, Audience, Group, FriendList, Comment, resolveRecipients, openPost, purgeExpired, uid, validViewSecs, DEFAULT_GLOBAL_MS, areFriends, Access } from "./engine";
import { seed, demoPosts } from "./seed";

export interface User { id: ID; name: string; hue: number; bio: string; status: string; joinedAt: number; code: string; demo?: boolean; avatar?: string | null }
export interface Msg { id: ID; from: ID; once?: boolean; gone?: Record<ID, number>; text: string; img?: string | null; audio?: string | null; at: number; secs: number; reads: Record<ID, number>; edited?: boolean; pinned?: boolean; replyTo?: ID }
export interface Conv { id: ID; memberIds: ID[]; groupId?: ID; title?: string; msgs: Msg[]; typing?: Record<ID, number> }
export interface Notif { id: ID; to: ID; text: string; at: number; read: boolean; go?: string }
export interface EventT { id: ID; hostId: ID; title: string; desc: string; at: number; place: string; inviteIds: ID[]; rsvp: Record<ID, "yes" | "no" | "maybe"> }
export interface Game { id: ID; kind: "morpion"; xId: ID; oId: ID; board: string[]; turn: "X" | "O"; winner: "X" | "O" | "draw" | null; at: number }
export interface Req { id: ID; from: ID; to: ID; at: number }
export interface Report { id: ID; by: ID; target: ID; why: string; at: number }
export interface State {
  v: 1; started: boolean; me: ID; users: User[]; social: Social; posts: Post[]; notifs: Notif[]; convs: Conv[]; events: EventT[]; games: Game[]; reqs: Req[]; reports: Report[];
  scores: Record<ID, number>; settings: Record<ID, { quiet: boolean; light: boolean; autoplay: boolean }>;
}
const KEY = "nidami-v1";
let state: State = load();
const subs = new Set<() => void>();
let saveWarn = "";
function load(): State { try { const s = localStorage.getItem(KEY); if (s) { const o = JSON.parse(s); if (o?.v === 1) return o; } } catch {} return seed(); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); saveWarn = ""; } catch { saveWarn = "Mémoire de l'appareil pleine : supprimez d'anciennes photos."; } }
function emit() { save(); subs.forEach((f) => f()); }
export const getState = () => state;
export const getSaveWarn = () => saveWarn;
export function useStore<T>(sel: (s: State) => T): T { return sel(useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, getState, getState)); }
// Une mise à jour = on modifie une copie profonde simple puis on notifie.
function mut(fn: (s: State) => void) { const s: State = structuredClone(state); fn(s); state = s; emit(); }
export const now = () => Date.now();          // « heure du serveur » du mode démo
export const userOf = (s: State, id: ID) => s.users.find((u) => u.id === id);
export const codeFor = (id: ID) => "NID-" + id.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 5).padEnd(5, "X");
const notify = (s: State, to: ID, text: string, go?: string) => { if (to !== s.me || true) s.notifs.unshift({ id: uid(), to, text, at: now(), read: false, go }); };

export const actions = {
  start(name: string, bio = "") { mut((s) => { const id = "u_" + uid(); const hue = Math.floor(Math.random() * 360); s.users.push({ id, name: name.trim().slice(0, 30) || "Moi", hue, bio, status: "Bienvenue dans mon nid 🪺", joinedAt: now(), code: codeFor(id) }); s.me = id; s.started = true;
    for (const f of s.users.filter((u) => u.demo && ["celine", "thomas", "emilie", "max"].includes(u.id))) { s.social.friends[id] = [...(s.social.friends[id] || []), f.id]; s.social.friends[f.id] = [...(s.social.friends[f.id] || []), id]; }
    for (const a of ["celine", "thomas", "emilie", "max"]) s.social.friends[a] = [...new Set([...(s.social.friends[a] || []), ...["celine", "thomas", "emilie", "max"].filter((x) => x !== a)])];
    const fam = s.social.groups.find((g) => g.id === "g_famille"); if (fam) { fam.memberIds.push(id); fam.adminIds.push(id); }
    const ami = s.social.groups.find((g) => g.id === "g_amis"); if (ami) { ami.memberIds.push(id); ami.adminIds.push(id); }
    s.reqs.push({ id: uid(), from: "lea", to: id, at: now() - 3600e3 }); s.posts = demoPosts(id);
    s.convs.push({ id: "c_" + uid(), memberIds: [id, "celine"], msgs: [{ id: uid(), from: "celine", text: "Coucou ! Bienvenue dans Nidami 💜", at: now() - 120e3, secs: 0, reads: {} }] });
    s.convs.push({ id: "c_" + uid(), memberIds: [id, "celine", "thomas", "emilie"], groupId: "g_famille", title: "Famille", msgs: [{ id: uid(), from: "thomas", text: "Qui est là dimanche pour le repas ?", at: now() - 3600e3, secs: 0, reads: {} }] });
    s.events.push({ id: uid(), hostId: "emilie", title: "Repas de famille", desc: "Chacun apporte un petit plat.", at: now() + 5 * 864e5, place: "Chez Mamie", inviteIds: [id, "celine", "thomas"], rsvp: { thomas: "yes" } });
  }); },
  switchUser(id: ID) { mut((s) => { s.me = id; }); },
  updateProfile(p: Partial<Pick<User, "name" | "bio" | "status" | "avatar">>) { mut((s) => { const u = userOf(s, s.me)!; Object.assign(u, p); }); },
  setSetting(k: "quiet" | "light" | "autoplay", v: boolean) { mut((s) => { s.settings[s.me] = { quiet: false, light: false, autoplay: true, ...s.settings[s.me], [k]: v }; }); },
  reset() { try { localStorage.removeItem(KEY); } catch {} state = seed(); emit(); },

  publish(p: { kind: "text" | "photo"; text: string; img?: string | null; bg?: number; mood?: string; audience: Audience; viewSecs: number; permanent: boolean; story?: boolean }): { ok: boolean; error?: string; id?: ID } {
    if (!validViewSecs(p.viewSecs)) return { ok: false, error: "Durée invalide." };
    let id = ""; let err = "";
    mut((s) => {
      const recipients = resolveRecipients(s.social, s.me, p.audience);
      if (p.audience.mode !== "me" && !recipients.length) { err = "Personne ne pourra voir cette publication : choisissez d'autres destinataires."; return; }
      id = "p_" + uid(); const t = now();
      const eph = !p.permanent && (p.viewSecs > 0 || p.story);
      s.posts.unshift({ id, authorId: s.me, kind: p.kind, text: p.text.slice(0, 2000), img: p.img || null, bg: p.bg, mood: p.mood, story: p.story, createdAt: t, audience: p.audience, recipients, viewSecs: p.permanent ? 0 : p.viewSecs, expiresAt: eph ? t + DEFAULT_GLOBAL_MS : null, views: {}, reactions: {}, comments: [] });
      for (const r of recipients) notify(s, r, `${userOf(s, s.me)!.name} a partagé ${p.story ? "une story" : "une publication"}${eph && !p.story ? " éphémère" : ""}.`, p.story ? "home" : "home");
    });
    return err ? { ok: false, error: err } : { ok: true, id };
  },
  open(postId: ID): Access { let res: Access = { ok: false, reason: "missing" }; mut((s) => { const p = s.posts.find((x) => x.id === postId); if (p) res = openPost(p, s.me, now(), s.social); });
    if (res.ok && !res.author && res.firstOpen) { /* l'auteur voit « vu par » */ } return res; },
  tick() { const t = now(); const probe: Post[] = state.posts; if (!probe.some((p) => p.viewSecs > 0 || p.expiresAt !== null)) return; let n = 0; const s: State = structuredClone(state); n = purgeExpired(s.posts, t); if (n) { state = s; emit(); } },
  deletePost(id: ID) { mut((s) => { s.posts = s.posts.filter((p) => !(p.id === id && p.authorId === s.me)); }); },
  react(id: ID, emoji: string) { mut((s) => { const p = s.posts.find((x) => x.id === id); if (!p || !(p.authorId === s.me || p.recipients.includes(s.me))) return; if (p.reactions[s.me] === emoji) delete p.reactions[s.me]; else { p.reactions[s.me] = emoji; if (p.authorId !== s.me) notify(s, p.authorId, `${userOf(s, s.me)!.name} a réagi ${emoji} à votre publication.`, "home"); } }); },
  comment(id: ID, text: string, replyTo?: ID) { const t = text.trim(); if (!t) return; mut((s) => { const p = s.posts.find((x) => x.id === id); if (!p || !(p.authorId === s.me || p.recipients.includes(s.me))) return; const c: Comment = { id: uid(), authorId: s.me, text: t.slice(0, 500), at: now(), replyTo }; p.comments.push(c); if (p.authorId !== s.me) notify(s, p.authorId, `${userOf(s, s.me)!.name} a commenté votre publication.`, "home"); }); },

  addByCode(code: string): { ok: boolean; msg: string } { let r = { ok: false, msg: "Code inconnu." }; mut((s) => { const c = code.trim().toUpperCase(); const u = s.users.find((x) => x.code === c);
    if (!u) return; if (u.id === s.me) { r = { ok: false, msg: "C'est votre propre code !" }; return; }
    if (areFriends(s.social, s.me, u.id)) { r = { ok: false, msg: `${u.name} est déjà votre ami.` }; return; }
    if (s.reqs.some((q) => q.from === s.me && q.to === u.id)) { r = { ok: false, msg: "Demande déjà envoyée." }; return; }
    s.reqs.push({ id: uid(), from: s.me, to: u.id, at: now() }); notify(s, u.id, `${userOf(s, s.me)!.name} vous demande en ami.`, "friends"); r = { ok: true, msg: `Demande envoyée à ${u.name}.` }; }); return r; },
  answerReq(id: ID, accept: boolean) { mut((s) => { const q = s.reqs.find((x) => x.id === id && x.to === s.me); if (!q) return; s.reqs = s.reqs.filter((x) => x.id !== id); if (accept) { s.social.friends[s.me] = [...new Set([...(s.social.friends[s.me] || []), q.from])]; s.social.friends[q.from] = [...new Set([...(s.social.friends[q.from] || []), s.me])]; notify(s, q.from, `${userOf(s, s.me)!.name} a accepté votre demande.`, "friends"); } }); },
  unfriend(id: ID) { mut((s) => { s.social.friends[s.me] = (s.social.friends[s.me] || []).filter((x) => x !== id); s.social.friends[id] = (s.social.friends[id] || []).filter((x) => x !== s.me); }); },
  block(id: ID, on: boolean) { mut((s) => { const b = new Set(s.social.blocks[s.me] || []); on ? b.add(id) : b.delete(id); s.social.blocks[s.me] = [...b]; }); },
  report(target: ID, why: string) { mut((s) => { s.reports.push({ id: uid(), by: s.me, target, why: why.slice(0, 500), at: now() }); }); },

  createGroup(g: { name: string; emoji: string; description: string; rules: string; memberIds: ID[] }) { mut((s) => { const id = "g_" + uid(); s.social.groups.push({ id, name: g.name.slice(0, 40), emoji: g.emoji, description: g.description.slice(0, 300), rules: g.rules.slice(0, 500), adminIds: [s.me], memberIds: [s.me, ...g.memberIds.filter((m) => areFriends(s.social, s.me, m))] });
    s.convs.push({ id: "c_" + uid(), memberIds: [s.me, ...g.memberIds], groupId: id, title: g.name, msgs: [] }); for (const m of g.memberIds) notify(s, m, `${userOf(s, s.me)!.name} vous a ajouté au groupe « ${g.name} ».`, "groups"); }); },
  removeMember(gid: ID, uidd: ID) { mut((s) => { const g = s.social.groups.find((x) => x.id === gid); if (!g || !g.adminIds.includes(s.me) || uidd === s.me) return; g.memberIds = g.memberIds.filter((m) => m !== uidd); g.adminIds = g.adminIds.filter((m) => m !== uidd); const c = s.convs.find((x) => x.groupId === gid); if (c) c.memberIds = c.memberIds.filter((m) => m !== uidd); }); },
  leaveGroup(gid: ID) { mut((s) => { const g = s.social.groups.find((x) => x.id === gid); if (!g) return; g.memberIds = g.memberIds.filter((m) => m !== s.me); g.adminIds = g.adminIds.filter((m) => m !== s.me); const c = s.convs.find((x) => x.groupId === gid); if (c) c.memberIds = c.memberIds.filter((m) => m !== s.me); }); },
  createList(name: string, memberIds: ID[]) { mut((s) => { s.social.lists.push({ id: "l_" + uid(), ownerId: s.me, name: name.slice(0, 30), memberIds } as FriendList); }); },

  startDm(other: ID): ID { let id = ""; mut((s) => { const c = s.convs.find((x) => !x.groupId && x.memberIds.length === 2 && x.memberIds.includes(s.me) && x.memberIds.includes(other)); if (c) { id = c.id; return; } id = "c_" + uid(); s.convs.push({ id, memberIds: [s.me, other], msgs: [] }); }); return id; },
  send(convId: ID, text: string, secs = 0, img: string | null = null, replyTo?: ID, audio: string | null = null, once = false) { const t = text.trim(); if (!t && !img && !audio) return; mut((s) => { const c = s.convs.find((x) => x.id === convId && x.memberIds.includes(s.me)); if (!c) return; c.msgs.push({ id: uid(), from: s.me, text: t.slice(0, 2000), img, audio, at: now(), secs, once, gone: {}, reads: {}, replyTo });
    for (const m of c.memberIds.filter((x) => x !== s.me)) notify(s, m, `${userOf(s, s.me)!.name} : nouveau message${secs || once ? " éphémère" : ""}.`, "messages"); }); },
  markRead(convId: ID) { mut((s) => { const c = s.convs.find((x) => x.id === convId && x.memberIds.includes(s.me)); if (!c) return; let ch = false; for (const m of c.msgs) if (m.from !== s.me && m.secs === 0 && !m.once && m.reads[s.me] === undefined) { m.reads[s.me] = now(); ch = true; } if (!ch) { s.notifs.forEach((n) => { if (n.to === s.me && n.go === "messages" && !n.read) n.read = true; }); } }); },
  openMsg(convId: ID, id: ID) { mut((s) => { const m = s.convs.find((c) => c.id === convId && c.memberIds.includes(s.me))?.msgs.find((x) => x.id === id); if (m && m.from !== s.me && m.reads[s.me] === undefined) m.reads[s.me] = now(); }); },
  closeOnce(convId: ID, id: ID) { mut((s) => { const c = s.convs.find((x) => x.id === convId && x.memberIds.includes(s.me)); const m = c?.msgs.find((x) => x.id === id); if (!c || !m || !m.once || m.from === s.me) return; m.gone = { ...m.gone, [s.me]: now() };
    if (c.memberIds.filter((x) => x !== m.from).every((x) => m.gone![x] !== undefined)) { m.text = ""; m.img = null; m.audio = null; } }); },
  suspectCapture(postId: ID | null, convId?: ID, msgId?: ID) { mut((s) => { let author = ""; if (postId) author = s.posts.find((p) => p.id === postId)?.authorId || ""; else if (convId) author = s.convs.find((c) => c.id === convId)?.msgs.find((m) => m.id === msgId)?.from || ""; if (author && author !== s.me) notify(s, author, `${userOf(s, s.me)!.name} a peut-être tenté une capture d'un de vos contenus.`, "home"); }); },
  editMsg(convId: ID, id: ID, text: string) { mut((s) => { const m = s.convs.find((c) => c.id === convId)?.msgs.find((x) => x.id === id); if (m && m.from === s.me && text.trim()) { m.text = text.trim().slice(0, 2000); m.edited = true; } }); },
  deleteMsg(convId: ID, id: ID) { mut((s) => { const c = s.convs.find((x) => x.id === convId); if (c) c.msgs = c.msgs.filter((m) => !(m.id === id && m.from === s.me)); }); },
  pinMsg(convId: ID, id: ID) { mut((s) => { const m = s.convs.find((c) => c.id === convId && c.memberIds.includes(s.me))?.msgs.find((x) => x.id === id); if (m) m.pinned = !m.pinned; }); },

  createEvent(e: { title: string; desc: string; at: number; place: string; inviteIds: ID[] }) { mut((s) => { s.events.push({ id: uid(), hostId: s.me, ...e, title: e.title.slice(0, 60), rsvp: { [s.me]: "yes" } }); for (const i of e.inviteIds) notify(s, i, `${userOf(s, s.me)!.name} vous invite : ${e.title}.`, "events"); }); },
  rsvp(id: ID, v: "yes" | "no" | "maybe") { mut((s) => { const e = s.events.find((x) => x.id === id); if (e && (e.hostId === s.me || e.inviteIds.includes(s.me))) e.rsvp[s.me] = v; }); },
  deleteEvent(id: ID) { mut((s) => { s.events = s.events.filter((e) => !(e.id === id && e.hostId === s.me)); }); },

  newGame(other: ID) { mut((s) => { if (!areFriends(s.social, s.me, other)) return; s.games.unshift({ id: uid(), kind: "morpion", xId: s.me, oId: other, board: Array(9).fill(""), turn: "X", winner: null, at: now() }); notify(s, other, `${userOf(s, s.me)!.name} vous invite à une partie de Morpion.`, "games"); }); },
  play(id: ID, cell: number) { mut((s) => { const g = s.games.find((x) => x.id === id); if (!g || g.winner || g.board[cell]) return; const mine = g.turn === "X" ? g.xId : g.oId; if (mine !== s.me) return; g.board[cell] = g.turn;
    const L = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]; if (L.some((l) => l.every((i) => g.board[i] === g.turn))) g.winner = g.turn; else if (g.board.every(Boolean)) g.winner = "draw"; else g.turn = g.turn === "X" ? "O" : "X"; }); },
  addScore(n: number) { mut((s) => { s.scores[s.me] = (s.scores[s.me] || 0) + n; }); },

  readNotifs() { mut((s) => { s.notifs.forEach((n) => { if (n.to === s.me) n.read = true; }); }); },
  deleteAccountData() { actions.reset(); },
  exportData(): string { const s = state; const me = s.me; return JSON.stringify({ profil: userOf(s, me), publications: s.posts.filter((p) => p.authorId === me), messages: s.convs.filter((c) => c.memberIds.includes(me)).map((c) => ({ ...c, msgs: c.msgs.filter((m) => m.from === me) })), evenements: s.events.filter((e) => e.hostId === me) }, null, 2); },
};
export type { Group };
