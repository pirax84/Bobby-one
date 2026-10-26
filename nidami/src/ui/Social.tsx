import { useState } from "react";
import { useStore, actions, userOf } from "../lib/store";
import { areFriends } from "../lib/engine";
import { Avatar, Ico, Modal, toast, ago, useNow } from "./common";
import { Home } from "./Home";

export function Friends({ go }: { go: (v: string) => void }) {
  const s = useStore((x) => x); const me = s.me; const user = userOf(s, me)!; const [code, setCode] = useState(""); const [list, setList] = useState(false); const [name, setName] = useState(""); const [sel, setSel] = useState<string[]>([]);
  const friends = (s.social.friends[me] || []).map((i) => userOf(s, i)!).filter(Boolean); const reqs = s.reqs.filter((r) => r.to === me); const blocked = (s.social.blocks[me] || []).map((i) => userOf(s, i)!).filter(Boolean);
  const mylists = s.social.lists.filter((l) => l.ownerId === me);
  return (<div className="col"><h1>Amis</h1>
    {reqs.length > 0 && <div className="card col"><h3>Demandes reçues</h3>{reqs.map((r) => { const u = userOf(s, r.from); return <div key={r.id} className="row"><Avatar u={u} /><div className="grow"><b>{u?.name}</b><div className="muted small">{ago(r.at)}</div></div><button className="btn sm" onClick={() => { actions.answerReq(r.id, true); toast(`${u?.name} est maintenant votre ami.`); }}>Accepter</button><button className="btn ghost sm" onClick={() => actions.answerReq(r.id, false)}>Refuser</button></div>; })}</div>}
    <div className="card col"><h3>Inviter quelqu'un</h3><p className="muted small">Nidami est fermé : on y entre avec un code. Votre code : <b style={{ color: "var(--warm)", letterSpacing: 1 }}>{user.code}</b> <button className="chip" onClick={() => { navigator.clipboard?.writeText(user.code).then(() => toast("Code copié")).catch(() => toast("Copie impossible")); }}>Copier</button></p>
      <form className="row" onSubmit={(e) => { e.preventDefault(); const r = actions.addByCode(code); toast(r.msg); if (r.ok) setCode(""); }}><input className="inp" placeholder="Code d'un proche (ex. NID-LEAXX)" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Code d'invitation" /><button className="btn" disabled={!code.trim()}>Envoyer</button></form>
      <p className="muted small">Mode démo : testez avec les codes {s.users.filter((u) => u.demo).map((u) => u.code).join(", ")}. Ces personnes sont fictives.</p></div>
    <div className="card col"><h3>Mes amis ({friends.length})</h3>{friends.map((f) => <div key={f.id} className="row"><Avatar u={f} /><div className="grow"><b>{f.name}</b><div className="muted small ell">{f.status}</div></div>
      <button className="btn ghost sm" onClick={() => { actions.startDm(f.id); go("messages"); }} aria-label={"Écrire à " + f.name}><Ico n="chat" s={16} /></button>
      <button className="btn ghost sm" onClick={() => { if (confirm(`Retirer ${f.name} de vos amis ?`)) actions.unfriend(f.id); }} aria-label="Retirer"><Ico n="x" s={16} /></button>
      <button className="btn danger sm" onClick={() => { if (confirm(`Bloquer ${f.name} ? Il ne verra plus vos contenus.`)) { actions.block(f.id, true); toast("Bloqué."); } }}>Bloquer</button>
      <button className="btn ghost sm" onClick={() => { const w = prompt("Pourquoi signalez-vous cette personne ?"); if (w) { actions.report(f.id, w); toast("Signalement enregistré."); } }}>Signaler</button></div>)}
      {!friends.length && <p className="muted">Pas encore d'amis.</p>}</div>
    <div className="card col"><div className="row"><h3 className="grow">Mes listes</h3><button className="btn sm" onClick={() => setList(true)}><Ico n="plus" s={16} /> Créer</button></div>
      {mylists.map((l) => <div key={l.id}><b>{l.name}</b> <span className="muted small">{l.memberIds.map((i) => userOf(s, i)?.name).join(", ")}</span></div>)}{!mylists.length && <p className="muted small">Ex. « Cousins », « Collègues »… pour choisir vite qui voit vos publications.</p>}</div>
    {blocked.length > 0 && <div className="card col"><h3>Personnes bloquées</h3>{blocked.map((b) => <div key={b.id} className="row"><Avatar u={b} s={34} /><b className="grow">{b.name}</b><button className="btn ghost sm" onClick={() => actions.block(b.id, false)}>Débloquer</button></div>)}</div>}
    {list && <Modal title="Nouvelle liste" onClose={() => setList(false)}><div className="col"><input className="inp" placeholder="Nom de la liste" value={name} onChange={(e) => setName(e.target.value)} /><div className="tabs" style={{ flexWrap: "wrap" }}>{friends.map((f) => <button key={f.id} className={"chip" + (sel.includes(f.id) ? " on" : "")} onClick={() => setSel((x) => (x.includes(f.id) ? x.filter((y) => y !== f.id) : [...x, f.id]))}>{f.name}</button>)}</div>
      <button className="btn" disabled={!name.trim() || !sel.length} onClick={() => { actions.createList(name, sel); setList(false); setName(""); setSel([]); }}>Créer</button></div></Modal>}
  </div>);
}

export function Groups() {
  const s = useStore((x) => x); const me = s.me; const [open, setOpen] = useState<string | null>(null); const [mk, setMk] = useState(false);
  const groups = s.social.groups.filter((g) => g.memberIds.includes(me)); const g = groups.find((x) => x.id === open);
  const [n, setN] = useState(""); const [em, setEm] = useState("👨‍👩‍👧"); const [d, setD] = useState(""); const [r, setR] = useState(""); const [sel, setSel] = useState<string[]>([]);
  const friends = (s.social.friends[me] || []).map((i) => userOf(s, i)!).filter(Boolean);
  if (g) return (<div className="col"><button className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={() => setOpen(null)}><Ico n="back" s={16} /> Groupes</button>
    <div className="card col"><div className="row"><span style={{ fontSize: "2.4rem" }}>{g.emoji}</span><div className="grow"><h1>{g.name}</h1><div className="muted">{g.description}</div></div></div>
      {g.rules && <div className="card" style={{ background: "var(--card2)" }}><b>📜 Règles du groupe</b><div className="muted">{g.rules}</div></div>}
      <h3>Membres ({g.memberIds.length})</h3>{g.memberIds.map((m) => { const u = userOf(s, m); return <div key={m} className="row"><Avatar u={u} s={36} /><b className="grow">{u?.name}{g.adminIds.includes(m) ? " 👑" : ""}</b>{g.adminIds.includes(me) && m !== me && <button className="btn danger sm" onClick={() => { if (confirm(`Retirer ${u?.name} du groupe ?`)) actions.removeMember(g.id, m); }}>Retirer</button>}</div>; })}
      <button className="btn ghost sm" onClick={() => { if (confirm("Quitter ce groupe ?")) { actions.leaveGroup(g.id); setOpen(null); } }}>Quitter le groupe</button></div>
    <Home groupId={g.id} /></div>);
  return (<div className="col"><div className="row"><h1 className="grow">Groupes</h1><button className="btn sm" onClick={() => setMk(true)}><Ico n="plus" s={16} /> Nouveau</button></div>
    <div className="grid2" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))" }}>{groups.map((x) => <button key={x.id} className="card col" style={{ textAlign: "left", color: "inherit" }} onClick={() => setOpen(x.id)}><span style={{ fontSize: "2rem" }}>{x.emoji}</span><b>{x.name}</b><span className="muted small">{x.memberIds.length} membres</span></button>)}</div>
    {!groups.length && <p className="muted">Créez un groupe pour la famille, les vacances, les soirées…</p>}
    {mk && <Modal title="Nouveau groupe" onClose={() => setMk(false)}><div className="col"><div className="row"><input className="inp" style={{ width: 80 }} value={em} onChange={(e) => setEm(e.target.value)} aria-label="Emoji" /><input className="inp" placeholder="Nom du groupe" value={n} onChange={(e) => setN(e.target.value)} /></div>
      <input className="inp" placeholder="Description" value={d} onChange={(e) => setD(e.target.value)} /><textarea className="inp" placeholder="Règles du groupe (facultatif)" value={r} onChange={(e) => setR(e.target.value)} />
      <div className="muted small">Membres (parmi vos amis)</div><div className="tabs" style={{ flexWrap: "wrap" }}>{friends.map((f) => <button key={f.id} className={"chip" + (sel.includes(f.id) ? " on" : "")} onClick={() => setSel((x) => (x.includes(f.id) ? x.filter((y) => y !== f.id) : [...x, f.id]))}>{f.name}</button>)}</div>
      <button className="btn" disabled={!n.trim()} onClick={() => { actions.createGroup({ name: n, emoji: em || "👥", description: d, rules: r, memberIds: sel }); setMk(false); setN(""); setD(""); setR(""); setSel([]); toast("Groupe créé."); }}>Créer le groupe</button></div></Modal>}
  </div>);
}

export function Events() {
  const s = useStore((x) => x); const me = s.me; const [mk, setMk] = useState(false); const now = useNow(30000);
  const [t, setT] = useState(""); const [d, setD] = useState(""); const [p, setP] = useState(""); const [when, setWhen] = useState(""); const [sel, setSel] = useState<string[]>([]);
  const friends = (s.social.friends[me] || []).map((i) => userOf(s, i)!).filter(Boolean);
  const evs = s.events.filter((e) => e.hostId === me || e.inviteIds.includes(me)).sort((a, b) => a.at - b.at);
  const LAB = { yes: "✅ Présent", no: "❌ Absent", maybe: "🤔 Peut-être" } as const;
  return (<div className="col"><div className="row"><h1 className="grow">Événements</h1><button className="btn sm" onClick={() => setMk(true)}><Ico n="plus" s={16} /> Créer</button></div>
    {!evs.length && <p className="muted">Anniversaires, repas de famille, vacances… créez le premier !</p>}
    {evs.map((e) => <div key={e.id} className="card col"><div className="row"><div className="grow"><h3>{e.title}</h3><div className="muted small">📅 {new Date(e.at).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })}{e.at < now ? " · passé" : ""}</div>{e.place && <div className="muted small">📍 {e.place}</div>}</div>{e.hostId === me && <button className="btn danger sm" onClick={() => confirm("Supprimer cet événement ?") && actions.deleteEvent(e.id)}><Ico n="trash" s={16} /></button>}</div>
      {e.desc && <div>{e.desc}</div>}<div className="muted small">Organisé par {userOf(s, e.hostId)?.name}</div>
      <div className="row wrap">{(["yes", "maybe", "no"] as const).map((v) => <button key={v} className={"chip" + (e.rsvp[me] === v ? " on" : "")} onClick={() => actions.rsvp(e.id, v)}>{LAB[v]}</button>)}</div>
      <div className="muted small">Réponses : {[e.hostId, ...e.inviteIds].map((i) => `${userOf(s, i)?.name} ${e.rsvp[i] ? LAB[e.rsvp[i]].slice(0, 2) : "⏳"}`).join(" · ")}</div></div>)}
    {mk && <Modal title="Nouvel événement" onClose={() => setMk(false)}><div className="col"><input className="inp" placeholder="Titre (ex. Anniversaire de Mamie)" value={t} onChange={(e) => setT(e.target.value)} /><input className="inp" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} aria-label="Date et heure" /><input className="inp" placeholder="Lieu" value={p} onChange={(e) => setP(e.target.value)} /><textarea className="inp" placeholder="Description" value={d} onChange={(e) => setD(e.target.value)} />
      <div className="muted small">Inviter</div><div className="tabs" style={{ flexWrap: "wrap" }}>{friends.map((f) => <button key={f.id} className={"chip" + (sel.includes(f.id) ? " on" : "")} onClick={() => setSel((x) => (x.includes(f.id) ? x.filter((y) => y !== f.id) : [...x, f.id]))}>{f.name}</button>)}</div>
      <button className="btn" disabled={!t.trim() || !when || !sel.length} onClick={() => { actions.createEvent({ title: t, desc: d, place: p, at: new Date(when).getTime(), inviteIds: sel }); setMk(false); setT(""); setD(""); setP(""); setWhen(""); setSel([]); toast("Événement créé."); }}>Créer</button></div></Modal>}
  </div>);
}

export function Profile() {
  const s = useStore((x) => x); const u = userOf(s, s.me)!; const [name, setName] = useState(u.name); const [bio, setBio] = useState(u.bio); const [st, setSt] = useState(u.status);
  const mine = s.posts.filter((p) => p.authorId === s.me && !p.story).length; const friends = (s.social.friends[s.me] || []).length;
  return (<div className="col"><h1>Mon profil</h1><div className="card col center" style={{ alignItems: "center" }}><Avatar u={u} s={92} /><h2>{u.name}</h2><div className="muted">{u.status}</div><div className="row muted small"><span>{mine} publications</span><span>·</span><span>{friends} amis</span><span>·</span><span>Membre depuis {new Date(u.joinedAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</span></div></div>
    <div className="card col"><h3>Modifier</h3><input className="inp" value={name} onChange={(e) => setName(e.target.value)} aria-label="Prénom ou pseudo" maxLength={30} /><input className="inp" value={st} onChange={(e) => setSt(e.target.value)} aria-label="Statut" maxLength={60} /><textarea className="inp" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Votre courte bio" maxLength={200} />
      <button className="btn" onClick={() => { actions.updateProfile({ name: name.trim() || u.name, bio, status: st }); toast("Profil mis à jour."); }}>Enregistrer</button></div></div>);
}

export function Notifs() {
  const s = useStore((x) => x); const mine = s.notifs.filter((n) => n.to === s.me); const quiet = s.settings[s.me]?.quiet;
  return (<div className="col"><div className="row"><h1 className="grow">Notifications</h1><button className="btn ghost sm" onClick={() => actions.readNotifs()}>Tout marquer lu</button></div>
    {quiet && <p className="muted small">🌙 Mode silencieux activé : pas d'alerte, mais la liste reste ici.</p>}
    {mine.map((n) => <div key={n.id} className="card row"><span className="dot" style={{ opacity: n.read ? 0 : 1 }} /><div className="grow">{n.text}<div className="muted small">{ago(n.at)}</div></div></div>)}{!mine.length && <p className="muted">Rien de nouveau.</p>}
    <p className="muted small">Les notifications ne contiennent jamais le contenu d'une publication éphémère.</p></div>);
}

export function Settings() {
  const s = useStore((x) => x); const cfg = { quiet: false, light: false, autoplay: true, ...s.settings[s.me] };
  const Tg = ({ k, label, desc }: { k: "quiet" | "light" | "autoplay"; label: string; desc: string }) => <label className="row" style={{ padding: "8px 0" }}><div className="grow"><b>{label}</b><div className="muted small">{desc}</div></div><input type="checkbox" checked={cfg[k]} onChange={(e) => actions.setSetting(k, e.target.checked)} style={{ width: 24, height: 24 }} /></label>;
  return (<div className="col"><h1>Paramètres</h1>
    <div className="card"><Tg k="light" label="Thème clair" desc="Par défaut, Nidami est sombre." /><hr /><Tg k="quiet" label="Plage silencieuse" desc="Coupe les alertes la nuit (en mode serveur)." /><hr /><Tg k="autoplay" label="Lecture automatique des vidéos" desc="Pour les vidéos courtes (bientôt)." /></div>
    <div className="card col"><h3>🔒 Confidentialité</h3><ul className="muted" style={{ margin: 0, paddingLeft: 18 }}><li>Aucune publicité. Aucune vente de données.</li><li>Aucun bouton de partage vers l'extérieur, aucun profil public.</li><li>Personne ne peut vous trouver sans votre code d'invitation.</li><li>Aucune application ne peut empêcher une personne autorisée de photographier son écran avec un autre appareil.</li></ul></div>
    <div className="card col"><h3>🧪 Mode démo (sur cet appareil)</h3><p className="muted small">Pour l'instant, vos données restent sur cet appareil et les amis sont fictifs. Les vrais comptes, les messages entre téléphones et les appels demandent un serveur : voir le guide dans le dossier « docs » du projet.</p>
      <button className="btn ghost" onClick={() => { const b = new Blob([actions.exportData()], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "mes-donnees-nidami.json"; a.click(); }}>Exporter mes données</button>
      <button className="btn danger" onClick={() => { if (confirm("Supprimer toutes vos données Nidami de cet appareil ?")) actions.deleteAccountData(); }}>Supprimer mon compte et mes données</button></div>
    <div className="card col"><h3>🔁 Changer de membre (démo)</h3><p className="muted small">Pour tester les durées par personne : publiez une photo de 5 s pour Céline et Thomas, puis passez de l'un à l'autre.</p><div className="tabs" style={{ flexWrap: "wrap" }}>{s.users.filter((u) => u.id === s.me || (s.social.friends[s.me] || []).includes(u.id) || u.demo || s.users.length).map((u) => <button key={u.id} className={"chip" + (u.id === s.me ? " on" : "")} onClick={() => { actions.switchUser(u.id); toast(`Vous êtes maintenant ${u.name}.`); }}>{u.name}</button>)}</div></div></div>);
}
