import { test } from "node:test";
import assert from "node:assert/strict";
import { Social, Post, resolveRecipients, checkAccess, openPost, purgeExpired, feedFor, validViewSecs, accessFor, openAny, cascadeDelete, revokeShare } from "../src/lib/engine.ts";

const S = (): Social => ({
  friends: { pierre: ["celine", "thomas", "emilie"], celine: ["pierre"], thomas: ["pierre"], emilie: ["pierre"], intrus: [] },
  blocks: {}, lists: [], groups: [{ id: "g1", name: "Famille", emoji: "🏡", description: "", rules: "", adminIds: ["pierre"], memberIds: ["pierre", "celine", "thomas"] }],
});
const mk = (s: Social, over: Partial<Post> = {}): Post => ({
  id: "p1", authorId: "pierre", kind: "photo", text: "", img: "data:x", createdAt: 0, audience: { mode: "only", ids: ["celine", "thomas"] },
  recipients: resolveRecipients(s, "pierre", { mode: "only", ids: ["celine", "thomas"] }), viewSecs: 5, expiresAt: 24 * 3600e3, views: {}, reactions: {}, comments: [], ...over });

test("A+B : 5 s à partir de l'ouverture, puis plus d'accès", () => {
  const s = S(), p = mk(s);
  const a = openPost(p, "celine", 1000, s); assert.ok(a.ok);
  assert.ok(checkAccess(p, "celine", 5999, s).ok);
  const b = checkAccess(p, "celine", 6000, s); assert.deepEqual(b, { ok: false, reason: "expired-for-you" });
  assert.deepEqual(checkAccess(p, "celine", 60000, s), { ok: false, reason: "expired-for-you" });
});
test("la ré-ouverture ne relance pas le chrono", () => {
  const s = S(), p = mk(s); openPost(p, "celine", 1000, s); openPost(p, "celine", 3000, s);
  assert.equal(p.views.celine, 1000); assert.ok(!openPost(p, "celine", 6500, s).ok);
});
test("C : celui qui n'a pas ouvert garde son accès, avec ses propres 5 s", () => {
  const s = S(), p = mk(s); openPost(p, "celine", 1000, s);
  const t = openPost(p, "thomas", 20000, s); assert.ok(t.ok); assert.ok(checkAccess(p, "thomas", 24999, s).ok); assert.ok(!checkAccess(p, "thomas", 25000, s).ok);
});
test("D : un ami exclu n'y accède jamais", () => {
  const s = S(), p = mk(s); assert.deepEqual(checkAccess(p, "emilie", 10, s), { ok: false, reason: "not-recipient" });
  assert.deepEqual(openPost(p, "emilie", 10, s), { ok: false, reason: "not-recipient" }); assert.equal(p.views.emilie, undefined);
});
test("E : après expiration, accès refusé et fichier supprimé", () => {
  const s = S(), p = mk(s); openPost(p, "celine", 0, s); openPost(p, "thomas", 0, s);
  assert.ok(!checkAccess(p, "celine", 6000, s).ok); assert.equal(purgeExpired([p], 6000), 1); assert.equal(p.img, null); assert.deepEqual(checkAccess(p, "thomas", 6000, s), { ok: false, reason: "expired-for-you" });
});
test("F : expiration globale : plus personne ne peut ouvrir", () => {
  const s = S(), p = mk(s, { expiresAt: 10000 }); assert.deepEqual(checkAccess(p, "thomas", 10000, s), { ok: false, reason: "expired-global" });
  assert.equal(purgeExpired([p], 10000), 1);
});
test("G : un non-membre du groupe ne voit pas la publication du groupe", () => {
  const s = S(); const aud = { mode: "group", groupId: "g1" } as const; const p = mk(s, { audience: aud, recipients: resolveRecipients(s, "pierre", aud) });
  assert.deepEqual(p.recipients.sort(), ["celine", "thomas"]); assert.deepEqual(checkAccess(p, "emilie", 0, s), { ok: false, reason: "not-recipient" });
});
test("H : une personne bloquée n'a plus accès", () => {
  const s = S(), p = mk(s); s.blocks.pierre = ["celine"];
  assert.deepEqual(checkAccess(p, "celine", 0, s), { ok: false, reason: "blocked" });
  assert.ok(!resolveRecipients(s, "pierre", { mode: "all" }).includes("celine"));
});
test("I : deux personnes en même temps : délais indépendants", () => {
  const s = S(), p = mk(s); openPost(p, "celine", 1000, s); openPost(p, "thomas", 3000, s);
  assert.ok(!checkAccess(p, "celine", 6100, s).ok); assert.ok(checkAccess(p, "thomas", 6100, s).ok);
});
test("J : un utilisateur qui se fait passer pour un autre ne peut rien (identité = session, droits = destinataires)", () => {
  const s = S(), p = mk(s); assert.ok(!openPost(p, "intrus", 0, s).ok); assert.deepEqual(p.views, {});
});
test("permanente : pas de chrono ; l'auteur voit toujours", () => {
  const s = S(), p = mk(s, { viewSecs: 0, expiresAt: null }); const a = checkAccess(p, "celine", 9e12, s); assert.ok(a.ok && a.remainingMs === null);
  assert.ok(checkAccess(mk(s), "pierre", 9e12, s).ok);
});
test("destinataires : tous / sauf / seul", () => {
  const s = S(); assert.deepEqual(resolveRecipients(s, "pierre", { mode: "all" }).sort(), ["celine", "emilie", "thomas"]);
  assert.deepEqual(resolveRecipients(s, "pierre", { mode: "except", ids: ["thomas"] }).sort(), ["celine", "emilie"]);
  assert.deepEqual(resolveRecipients(s, "pierre", { mode: "me" }), []);
  assert.deepEqual(resolveRecipients(s, "pierre", { mode: "only", ids: ["intrus", "celine"] }), ["celine"]);
});
test("durées valides", () => { assert.ok(validViewSecs(3) && validViewSecs(0) && validViewSecs(600)); assert.ok(!validViewSecs(-1) && !validViewSecs(601) && !validViewSecs(2.5)); });
test("le fil garde les publications expirées pour moi (grisées) mais jamais celles d'un exclu", () => {
  const s = S(), p = mk(s); openPost(p, "celine", 0, s);
  assert.equal(feedFor([p], "celine", 9000, s).length, 1); assert.equal(feedFor([p], "emilie", 9000, s).length, 0);
});

const reshare = (s: Social, o: Post, by: string, to: string[], shareId = "s1"): Post => ({ id: "r1", authorId: by, kind: o.kind, text: "", createdAt: 0, audience: { mode: "only", ids: to }, recipients: to, viewSecs: o.viewSecs, expiresAt: o.expiresAt, views: {}, reactions: {}, comments: [], sharedFrom: o.id, shareId });
test("K : le partage autorisé garde la durée par personne de l'original", () => {
  const s = S(); s.friends.celine = ["pierre", "emilie"]; s.friends.emilie = ["pierre", "celine"]; const o = mk(s); const r = reshare(s, o, "celine", ["emilie"]); const all = [o, r];
  assert.ok(openAny(r, all, "emilie", 1000, s).ok); assert.ok(accessFor(r, all, "emilie", 5999, s).ok); assert.deepEqual(accessFor(r, all, "emilie", 6000, s), { ok: false, reason: "expired-for-you" });
  assert.equal(o.views.emilie, undefined);
});
test("L : l'auteur révoque le partage → il disparaît chez tous", () => {
  const s = S(); const o = mk(s); const r = reshare(s, o, "celine", ["emilie"]); const left = revokeShare([o, r], "s1");
  assert.deepEqual(left.map((p) => p.id), ["p1"]); assert.equal(feedFor(left, "emilie", 0, s).length, 0);
});
test("M : l'auteur supprime l'original → toutes les republications sont supprimées", () => {
  const s = S(); const o = mk(s); const r = reshare(s, o, "celine", ["emilie"]); assert.deepEqual(cascadeDelete([o, r], "p1"), []);
});
test("N : si l'original expire globalement, la republication aussi ; l'auteur original voit toujours", () => {
  const s = S(); const o = mk(s, { expiresAt: 10000 }); const r = reshare(s, o, "celine", ["emilie"]); const all = [o, r];
  assert.deepEqual(accessFor(r, all, "emilie", 10000, s), { ok: false, reason: "expired-global" }); assert.ok(accessFor(r, all, "pierre", 99999, s).ok);
});
test("O : quelqu'un qui n'est pas dans l'audience de la republication n'y accède pas ; un bloqué par l'auteur non plus", () => {
  const s = S(); const o = mk(s); const r = reshare(s, o, "celine", ["emilie"]); assert.deepEqual(accessFor(r, [o, r], "thomas", 0, s), { ok: false, reason: "not-recipient" });
  s.blocks.pierre = ["emilie"]; assert.deepEqual(accessFor(r, [o, r], "emilie", 0, s), { ok: false, reason: "blocked" });
});
