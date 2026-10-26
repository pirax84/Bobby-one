import { useEffect, useRef, useState } from "react";
import { FONDS, ECRITURES_SOMBRE, ECRITURES_CLAIR, ACCENTS, type Opt } from "../lib/theme";
import { InstallCard } from "./Auth";
import { useStore, actions, userOf, cfgOf, User } from "../lib/store";
import { make as qrMake } from "../lib/qrvendor.js";
import { areFriends } from "../lib/engine";
import { Avatar, Ico, Modal, toast, ago, fileToDataUrl, useNow } from "./common";
import { Home } from "./Home";

export const inviteLink = (code: string) => location.origin + location.pathname.replace(/index\.html$/, "") + "#add=" + code;
export function QrSvg({ text, size = 220 }: { text: string; size?: number }) {
  const m = qrMake(text, true); const n = m.length, b = 3; let d = ""; m.forEach((row, r) => row.forEach((v, c) => { if (v) d += `M${c + b} ${r + b}h1v1h-1z`; }));
  const T = n + 2 * b, L = Math.round(n * 0.22), o = (T - L) / 2; // logo au centre (le QR est en correction d'erreur maximale)
  return <svg viewBox={`0 0 ${T} ${T}`} width={size} height={size} role="img" aria-label="QR code" style={{ background: "#fff", borderRadius: 16 }}><path d={d} fill="#0F172A" shapeRendering="crispEdges" />
    <rect x={o - 0.8} y={o - 0.8} width={L + 1.6} height={L + 1.6} rx={L * 0.24} fill="#fff" /><image href="./icon-192.png" x={o} y={o} width={L} height={L} /></svg>;
}
function downloadQr(text: string, name: string) {
  const m = qrMake(text, true); const n = m.length, b = 4, k = 12, W = (n + 2 * b) * k; const c = document.createElement("canvas"); c.width = c.height = W; const g = c.getContext("2d")!; g.fillStyle = "#fff"; g.fillRect(0, 0, W, W); g.fillStyle = "#0F172A";
  m.forEach((row, r) => row.forEach((v, cc) => v && g.fillRect((cc + b) * k, (r + b) * k, k, k)));
  const L = Math.round(n * 0.22) * k, o = (W - L) / 2, im = new Image();
  const save = () => c.toBlob((bl) => { if (!bl) return; const a = document.createElement("a"); a.href = URL.createObjectURL(bl); a.download = `qr-${name}.png`; a.click(); });
  im.onload = () => { g.fillStyle = "#fff"; g.fillRect(o - k * 0.8, o - k * 0.8, L + k * 1.6, L + k * 1.6); g.drawImage(im, o, o, L, L); save(); }; im.onerror = save; im.src = "./icon-192.png";
}
export function MyQr({ u }: { u: User }) {
  const [big, setBig] = useState(false); const link = inviteLink(u.code); const D: [User["discover"], string, string][] = [["public", "🌍 Public", "Tout le monde peut me trouver avec mon nom ou mon pseudo."], ["limited", "👥 Limité", "Seulement avec mon pseudo exact, ou les amis de mes amis."], ["hidden", "🔒 Invisible", "Personne ne me trouve. Seulement si je donne mon QR code ou mon code."]];
  const [h, setH] = useState(u.handle);
  return (<div className="card col" style={{ alignItems: "center" }}><h3>Mon QR code</h3><button style={{ background: "none", border: 0, padding: 0 }} onClick={() => setBig(true)} aria-label="Agrandir le QR code"><QrSvg text={link} /></button><div className="muted small">Touchez le QR code pour l'agrandir</div>{big && <Modal title="Mon QR code" onClose={() => setBig(false)}><div className="col center" style={{ alignItems: "center" }}><QrSvg text={link} size={Math.min(window.innerWidth - 80, 460)} /><b style={{ letterSpacing: 1 }}>{u.code}</b></div></Modal>}<div className="muted small center">Montrez-le à un proche : il scanne avec l'appareil photo de son téléphone.</div>
    <div><b style={{ color: "var(--warm)", letterSpacing: 1 }}>{u.code}</b> · @{u.handle}</div>
    <div className="row wrap" style={{ justifyContent: "center" }}><button className="btn sm" onClick={() => navigator.clipboard?.writeText(link).then(() => toast("Lien copié")).catch(() => toast("Copie impossible"))}>Copier mon lien</button><button className="btn ghost sm" onClick={() => downloadQr(link, u.handle)}>Enregistrer l'image</button>
      <button className="btn danger sm" onClick={() => { if (confirm("Créer un nouveau code ? L'ancien QR code ne marchera plus.")) { actions.regenerateCode(); toast("Nouveau code créé."); } }}>Renouveler</button></div>
    <hr /><div className="col" style={{ width: "100%" }}><b>Qui peut me trouver ?</b>{D.map(([k, l, t]) => <label key={k} className="row" style={{ alignItems: "flex-start" }}><input type="radio" name="disc" checked={u.discover === k} onChange={() => { actions.setDiscover(k); toast("Réglage enregistré."); }} style={{ width: 22, height: 22, marginTop: 2 }} /><span><b>{l}</b><div className="muted small">{t}</div></span></label>)}
      <div className="row"><input className="inp" value={h} onChange={(e) => setH(e.target.value)} aria-label="Pseudo" /><button className="btn sm" onClick={() => toast(actions.setHandle(h).msg)}>Enregistrer le pseudo</button></div></div></div>);
}
function Scanner({ onCode, onClose }: { onCode: (c: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLVideoElement>(null); const [err, setErr] = useState("");
  useEffect(() => { let stop = false; let stream: MediaStream | null = null; const BD = (window as any).BarcodeDetector;
    if (!BD) { setErr("Ce navigateur ne sait pas lire les QR codes. Utilisez l'appareil photo du téléphone : il ouvrira le lien Mon cercle tout seul."); return; }
    (async () => { try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); if (ref.current) { ref.current.srcObject = stream; await ref.current.play(); } const det = new BD({ formats: ["qr_code"] });
      const loop = async () => { if (stop || !ref.current) return; try { const r = await det.detect(ref.current); const v = r[0]?.rawValue as string | undefined; const m = v?.match(/add=(NID-[A-Z0-9]{5})/i) || v?.match(/(NID-[A-Z0-9]{5})/i); if (m) { onCode(m[1].toUpperCase()); return; } } catch {} setTimeout(loop, 300); }; loop(); } catch { setErr("Caméra indisponible ou refusée."); } })();
    return () => { stop = true; stream?.getTracks().forEach((t) => t.stop()); }; }, []);
  return (<Modal title="Scanner un QR code" onClose={onClose}><div className="col">{err ? <p className="muted">{err}</p> : <video ref={ref} playsInline muted style={{ width: "100%", borderRadius: 16 }} />}</div></Modal>);
}
export function Friends({ go }: { go: (v: string) => void }) {
  const s = useStore((x) => x); const me = s.me; const user = userOf(s, me)!; const [code, setCode] = useState(""); const [list, setList] = useState(false); const [name, setName] = useState(""); const [sel, setSel] = useState<string[]>([]);
  const friends = (s.social.friends[me] || []).map((i) => userOf(s, i)!).filter(Boolean); const reqs = s.reqs.filter((r) => r.to === me); const blocked = (s.social.blocks[me] || []).map((i) => userOf(s, i)!).filter(Boolean);
  const mylists = s.social.lists.filter((l) => l.ownerId === me);
  return (<div className="col"><h1>Amis</h1>
    {reqs.length > 0 && <div className="card col"><h3>Demandes reçues</h3>{reqs.map((r) => { const u = userOf(s, r.from); return <div key={r.id} className="row"><Avatar u={u} /><div className="grow"><b>{u?.name}</b><div className="muted small">{ago(r.at)}</div></div><button className="btn sm" onClick={() => { actions.answerReq(r.id, true); toast(`${u?.name} est maintenant votre ami.`); }}>Accepter</button><button className="btn ghost sm" onClick={() => actions.answerReq(r.id, false)}>Refuser</button></div>; })}</div>}
    <FindPeople />
    <div className="card col"><h3>Inviter quelqu'un</h3><p className="muted small">Mon cercle est fermé : on y entre avec un code. Votre code : <b style={{ color: "var(--warm)", letterSpacing: 1 }}>{user.code}</b> <button className="chip" onClick={() => { navigator.clipboard?.writeText(user.code).then(() => toast("Code copié")).catch(() => toast("Copie impossible")); }}>Copier</button></p>
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

function FindPeople() {
  const [q, setQ] = useState(""); const [scan, setScan] = useState(false); const s = useStore((x) => x); const res = q.trim().length >= 2 ? actions.searchUsers(q) : [];
  return (<div className="card col"><h3>Trouver quelqu'un</h3><div className="row"><input className="inp" placeholder="🔎 Nom ou @pseudo" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher" /><button className="btn ghost sm" onClick={() => setScan(true)}>📷 Scanner</button></div>
    {res.map((u) => <div key={u.id} className="row"><Avatar u={u} s={38} /><div className="grow"><b>{u.name}</b><div className="muted small">@{u.handle}</div></div><button className="btn sm" onClick={() => toast(actions.requestFriend(u.id).msg)}>Ajouter</button></div>)}
    {q.trim().length >= 2 && !res.length && <p className="muted small">Personne trouvé. Les personnes « invisibles » ou « limitées » ne se trouvent qu'avec leur QR code, leur code ou leur pseudo exact.</p>}
    {scan && <Scanner onClose={() => setScan(false)} onCode={(c) => { setScan(false); toast(actions.addByCode(c).msg); }} />}{s.me && null}</div>);
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
  const [t, setT] = useState(""); const [d, setD] = useState(""); const [p, setP] = useState(""); const [when, setWhen] = useState(""); const [sel, setSel] = useState<string[]>([]); const [det, setDet] = useState<string | null>(null);
  const friends = (s.social.friends[me] || []).map((i) => userOf(s, i)!).filter(Boolean);
  const evs = s.events.filter((e) => e.hostId === me || e.inviteIds.includes(me)).sort((a, b) => a.at - b.at);
  const LAB = { yes: "✅ Présent", no: "❌ Absent", maybe: "🤔 Peut-être" } as const;
  return (<div className="col"><div className="row"><h1 className="grow">Événements</h1><button className="btn sm" onClick={() => setMk(true)}><Ico n="plus" s={16} /> Créer</button></div>
    {!evs.length && <p className="muted">Anniversaires, repas de famille, vacances… créez le premier !</p>}
    {evs.map((e) => <div key={e.id} className="card col"><div className="row"><div className="grow"><h3>{e.title}</h3><div className="muted small">📅 {new Date(e.at).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })}{e.at < now ? " · passé" : ""}</div>{e.place && <div className="muted small">📍 {e.place}</div>}</div>{e.hostId === me && <button className="btn danger sm" onClick={() => confirm("Supprimer cet événement ?") && actions.deleteEvent(e.id)}><Ico n="trash" s={16} /></button>}</div>
      {e.desc && <div>{e.desc}</div>}<div className="muted small">Organisé par {userOf(s, e.hostId)?.name}</div>
      <div className="rsvp">{(["yes", "maybe", "no"] as const).map((v) => { const n = [e.hostId, ...e.inviteIds].filter((i) => e.rsvp[i] === v).length; return <button key={v} className={"rv " + v + (e.rsvp[me] === v ? " on" : "")} onClick={() => actions.rsvp(e.id, v)}><b>{n}</b><span>{LAB[v]}</span></button>; })}</div>
      <button className="btn ghost sm" onClick={() => setDet(e.id)}>👥 Voir qui vient</button></div>)}
    {det && (() => { const e = s.events.find((x) => x.id === det); if (!e) return null; const all = [e.hostId, ...e.inviteIds]; return <Modal title={e.title} onClose={() => setDet(null)}><div className="col">{([["yes", "✅ Présents"], ["maybe", "🤔 Peut-être"], ["no", "❌ Absents"], ["", "⏳ Sans réponse"]] as const).map(([v, l]) => { const l2 = all.filter((i) => (e.rsvp[i] || "") === v); return <div key={v}><div className="muted small">{l} · {l2.length}</div>{l2.length ? <div className="row wrap" style={{ gap: 6, marginTop: 4 }}>{l2.map((i) => <span key={i} className="chip">{userOf(s, i)?.name}</span>)}</div> : <div className="muted small">—</div>}</div>; })}</div></Modal>; })()}
    {mk && <Modal title="Nouvel événement" onClose={() => setMk(false)}><div className="col"><input className="inp" placeholder="Titre (ex. Anniversaire de Mamie)" value={t} onChange={(e) => setT(e.target.value)} /><input className="inp" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} aria-label="Date et heure" /><input className="inp" placeholder="Lieu" value={p} onChange={(e) => setP(e.target.value)} /><textarea className="inp" placeholder="Description" value={d} onChange={(e) => setD(e.target.value)} />
      <div className="muted small">Inviter</div><div className="tabs" style={{ flexWrap: "wrap" }}>{friends.map((f) => <button key={f.id} className={"chip" + (sel.includes(f.id) ? " on" : "")} onClick={() => setSel((x) => (x.includes(f.id) ? x.filter((y) => y !== f.id) : [...x, f.id]))}>{f.name}</button>)}</div>
      <button className="btn" disabled={!t.trim() || !when || !sel.length} onClick={() => { actions.createEvent({ title: t, desc: d, place: p, at: new Date(when).getTime(), inviteIds: sel }); setMk(false); setT(""); setD(""); setP(""); setWhen(""); setSel([]); toast("Événement créé."); }}>Créer</button></div></Modal>}
  </div>);
}

function EditProfile({ u, onClose }: { u: User; onClose: () => void }) {
  const [name, setName] = useState(u.name); const [bio, setBio] = useState(u.bio); const [st, setSt] = useState(u.status); const [av, setAv] = useState<string | null>(u.avatar || null); const [vis, setVis] = useState(u.avatarVis || "friends"); const f = useRef<HTMLInputElement>(null);
  const V: [User["avatarVis"], string][] = [["friends", "Mes amis"], ["all", "Tout le monde"], ["none", "Personne"]];
  return <Modal title="Modifier mon profil" onClose={onClose}><div className="col">
    <div className="col center" style={{ alignItems: "center", gap: 10 }}><Avatar u={{ ...u, avatar: av, avatarVis: "all" }} s={104} />
      <div className="row wrap" style={{ justifyContent: "center" }}><button className="btn sm" onClick={() => f.current?.click()}>{av ? "Changer la photo" : "Ajouter une photo"}</button>{av && <button className="btn danger sm" onClick={() => setAv(null)}>Supprimer la photo</button>}</div>
      <input ref={f} type="file" accept="image/*" hidden onChange={async (e) => { const x = e.target.files?.[0]; if (x) { try { setAv(await fileToDataUrl(x)); } catch { toast("Impossible de lire cette image."); } } }} /></div>
    <b className="small">Qui peut voir ma photo ?</b><div className="tabs wrap">{V.map(([k, l]) => <button key={k} className={"chip" + (vis === k ? " on" : "")} onClick={() => setVis(k!)}>{l}</button>)}</div>
    <p className="muted small" style={{ margin: 0 }}>Les autres voient alors votre initiale à la place de la photo.</p>
    <input className="inp" value={name} onChange={(e) => setName(e.target.value)} aria-label="Prénom ou pseudo" maxLength={30} /><input className="inp" value={st} onChange={(e) => setSt(e.target.value)} aria-label="Statut" maxLength={60} placeholder="Votre statut" /><textarea className="inp" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Votre courte bio" maxLength={200} />
    <button className="btn" onClick={() => { actions.updateProfile({ name: name.trim() || u.name, bio, status: st, avatar: av, avatarVis: vis }); toast("Profil mis à jour."); onClose(); }}>Enregistrer</button></div></Modal>;
}
export function Profile() {
  const s = useStore((x) => x); const u = userOf(s, s.me)!; const [edit, setEdit] = useState(false);
  const mine = s.posts.filter((p) => p.authorId === s.me && !p.story).length; const friends = (s.social.friends[s.me] || []).length;
  return (<div className="col"><h1>Mon profil</h1><div className="card col center" style={{ alignItems: "center" }}><button style={{ background: "none", border: 0, padding: 0, color: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }} onClick={() => setEdit(true)} aria-label="Modifier mon profil"><span style={{ position: "relative" }}><Avatar u={u} s={96} /><span className="pbadge" style={{ right: -2, bottom: -2 }}>✎</span></span><h2>{u.name}</h2></button><div className="muted">{u.status}</div><div className="row muted small"><span>{mine} publications</span><span>·</span><span>{friends} amis</span><span>·</span><span>Membre depuis {new Date(u.joinedAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</span></div>
      <button className="btn sm" onClick={() => setEdit(true)}>Modifier mon profil (photo, nom, bio)</button></div>
    <MyQr u={u} />{edit && <EditProfile u={u} onClose={() => setEdit(false)} />}</div>);
}

export function Notifs() {
  const s = useStore((x) => x); const mine = s.notifs.filter((n) => n.to === s.me); const quiet = s.settings[s.me]?.quiet;
  return (<div className="col"><div className="row"><h1 className="grow">Notifications</h1><button className="btn ghost sm" onClick={() => actions.readNotifs()}>Tout marquer lu</button></div>
    {quiet && <p className="muted small">🌙 Mode silencieux activé : pas d'alerte, mais la liste reste ici.</p>}
    {mine.map((n) => <div key={n.id} className="card row"><span className="dot" style={{ opacity: n.read ? 0 : 1 }} /><div className="grow">{n.text}<div className="muted small">{ago(n.at)}</div></div></div>)}{!mine.length && <p className="muted">Rien de nouveau.</p>}
    <p className="muted small">Les notifications ne contiennent jamais le contenu d'une publication éphémère.</p></div>);
}

function ThemePicker({ cfg }: { cfg: ReturnType<typeof cfgOf> }) {
  const pro = !!cfg.premium;
  const Row = ({ title, k, list, cur, kind }: { title: string; k: "bg" | "fg" | "accent"; list: Opt[]; cur: string | undefined; kind: "bg" | "fg" | "ac" }) =>
    <div className="col" style={{ gap: 6 }}><b className="small">{title}</b><div className="row wrap">{list.map((o, i) => { const on = (cur || list[0].id) === o.id && (pro || !o.pro); const style = kind === "ac" ? { background: `linear-gradient(135deg,${o.v},${o.v2})` } : kind === "bg" ? { background: o.v, color: "#fff" } : { background: cfg.light ? "#fff" : "#0F172A", color: o.v };
      return <button key={o.id} className={"sw" + (on ? " on" : "")} style={style} title={o.label} aria-label={o.label + (o.pro && !pro ? " (Plus)" : "")} onClick={() => { if (o.pro && !pro) { toast("Cette couleur fait partie de Plus."); return; } actions.setSetting(k, o.id); }}>{kind === "fg" ? "Aa" : ""}{o.pro && !pro && <span className="lock">🔒</span>}</button>; })}</div></div>;
  return <div className="card plus-card col"><div className="row"><h3 className="grow">🎨 Couleurs de l'application</h3><span className="badge">PLUS</span></div>
    <p className="muted small">La palette d'origine est gratuite. Changer le fond, l'écriture et la couleur d'accent fait partie de l'offre payante « Plus ».</p>
    {!cfg.light && <Row title="Fond" k="bg" list={FONDS} cur={cfg.bg} kind="bg" />}
    <Row title="Écriture" k="fg" list={cfg.light ? ECRITURES_CLAIR : ECRITURES_SOMBRE} cur={cfg.fg} kind="fg" />
    <Row title="Couleur d'accent" k="accent" list={ACCENTS} cur={cfg.accent} kind="ac" />
    <label className="row" style={{ paddingTop: 6 }}><div className="grow"><b>Activer « Plus » (démonstration)</b><div className="muted small">Aucun paiement n'est branché pour l'instant : cet interrupteur sert à essayer les couleurs. Le vrai paiement (Google Play, App Store ou carte) sera ajouté avec le serveur.</div></div><input type="checkbox" checked={pro} onChange={(e) => actions.setSetting("premium", e.target.checked)} style={{ width: 24, height: 24 }} /></label></div>;
}
export function Settings() {
  const s = useStore((x) => x); const cfg = cfgOf(s, s.me);
  const Tg = ({ k, label, desc }: { k: "quiet" | "light" | "autoplay"; label: string; desc: string }) => <label className="row" style={{ padding: "8px 0" }}><div className="grow"><b>{label}</b><div className="muted small">{desc}</div></div><input type="checkbox" checked={cfg[k]} onChange={(e) => actions.setSetting(k, e.target.checked)} style={{ width: 24, height: 24 }} /></label>;
  return (<div className="col"><h1>Paramètres</h1>
    <InstallCard /><ThemePicker cfg={cfg} />
    <div className="card"><Tg k="light" label="Thème clair" desc="Par défaut, l'application est sombre." /><hr /><Tg k="quiet" label="Plage silencieuse" desc="Coupe les alertes la nuit (en mode serveur)." /><hr /><Tg k="autoplay" label="Lecture automatique des vidéos" desc="Pour les vidéos courtes (bientôt)." /></div>
    <div className="card col"><h3>🔒 Confidentialité</h3><ul className="muted" style={{ margin: 0, paddingLeft: 18 }}><li>Aucune publicité. Aucune vente de données.</li><li>Aucun bouton de partage vers l'extérieur, aucun profil public.</li><li>Personne ne peut vous trouver sans votre code d'invitation.</li><li>Aucune application ne peut empêcher une personne autorisée de photographier son écran avec un autre appareil.</li></ul></div>
    <div className="card col"><h3>🧪 Mode démo (sur cet appareil)</h3><p className="muted small">Pour l'instant, vos données restent sur cet appareil et les amis sont fictifs. Les vrais comptes, les messages entre téléphones et les appels demandent un serveur : voir le guide dans le dossier « docs » du projet.</p>
      <button className="btn ghost" onClick={() => { const b = new Blob([actions.exportData()], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "mes-donnees-cercle.json"; a.click(); }}>Exporter mes données</button>
      <button className="btn danger" onClick={() => { if (confirm("Supprimer toutes vos données Mon cercle de cet appareil ?")) actions.deleteAccountData(); }}>Supprimer mon compte et mes données</button></div>
    <div className="card col"><h3>🔁 Changer de membre (démo)</h3><p className="muted small">Pour tester les durées par personne : publiez une photo de 5 s pour Céline et Thomas, puis passez de l'un à l'autre.</p><div className="tabs" style={{ flexWrap: "wrap" }}>{s.users.filter((u) => u.id === s.me || (s.social.friends[s.me] || []).includes(u.id) || u.demo || s.users.length).map((u) => <button key={u.id} className={"chip" + (u.id === s.me ? " on" : "")} onClick={() => { actions.switchUser(u.id); toast(`Vous êtes maintenant ${u.name}.`); }}>{u.name}</button>)}</div></div></div>);
}
