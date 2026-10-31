import { useEffect, useRef, useState, type ReactNode } from "react";
import { InstallCard } from "./Auth";
import { useStore, actions, userOf, cfgOf, User } from "../lib/store";
import { make as qrMake } from "../lib/qrvendor.js";
import { areFriends } from "../lib/engine";
import { FX, FX_KEYS, TONES, TONE_IDS, VIB_LEVELS, playTone, vibrate } from "../lib/fx";
import { favOf, DEFAULT_FAV } from "./FxBar";
import { Avatar, Ico, Modal, toast, ago, fileToDataUrl, useNow, Switch } from "./common";
import { Home } from "./Home";
import { t, T, locale } from "../i18n";
import { LangPicker } from "./LangPicker";
import { LegalView } from "./Legal";

export const inviteLink = (code: string) => location.origin + location.pathname.replace(/index\.html$/, "") + "#add=" + code;
export function QrSvg({ text, size = 220 }: { text: string; size?: number }) {
  const m = qrMake(text, true); const n = m.length, b = 3; let d = ""; m.forEach((row, r) => row.forEach((v, c) => { if (v) d += `M${c + b} ${r + b}h1v1h-1z`; }));
  const T = n + 2 * b, L = Math.round(n * 0.22), o = (T - L) / 2; // logo au centre (le QR est en correction d'erreur maximale)
  return <svg viewBox={`0 0 ${T} ${T}`} width={size} height={size} role="img" aria-label={t("QR code")} style={{ background: "#fff", borderRadius: 16 }}><path d={d} fill="#0F172A" shapeRendering="crispEdges" />
    <rect x={o - 0.8} y={o - 0.8} width={L + 1.6} height={L + 1.6} rx={L * 0.24} fill="#fff" /><image href="./logo-192.png" x={o} y={o} width={L} height={L} /></svg>;
}
function downloadQr(text: string, name: string) {
  const m = qrMake(text, true); const n = m.length, b = 4, k = 12, W = (n + 2 * b) * k; const c = document.createElement("canvas"); c.width = c.height = W; const g = c.getContext("2d")!; g.fillStyle = "#fff"; g.fillRect(0, 0, W, W); g.fillStyle = "#0F172A";
  m.forEach((row, r) => row.forEach((v, cc) => v && g.fillRect((cc + b) * k, (r + b) * k, k, k)));
  const L = Math.round(n * 0.22) * k, o = (W - L) / 2, im = new Image();
  const save = () => c.toBlob((bl) => { if (!bl) return; const a = document.createElement("a"); a.href = URL.createObjectURL(bl); a.download = `qr-${name}.png`; a.click(); });
  im.onload = () => { g.fillStyle = "#fff"; g.fillRect(o - k * 0.8, o - k * 0.8, L + k * 1.6, L + k * 1.6); g.drawImage(im, o, o, L, L); save(); }; im.onerror = save; im.src = "./logo-192.png";
}
export function MyQr({ u }: { u: User }) {
  const [big, setBig] = useState(false); const link = inviteLink(u.code); const D: [User["discover"], string, string][] = [["public", t("🌍 Public"), t("Tout le monde peut me trouver avec mon nom ou mon pseudo.")], ["limited", t("👥 Limité"), t("Seulement avec mon pseudo exact, ou les amis de mes amis.")], ["hidden", t("🔒 Invisible"), t("Personne ne me trouve. Seulement si je donne mon QR code ou mon code.")]];
  const [h, setH] = useState(u.handle);
  return (<div className="card col" style={{ alignItems: "center" }}><h3>{t("Mon QR code")}</h3><button style={{ background: "none", border: 0, padding: 0 }} onClick={() => { if (window.matchMedia?.("(pointer: fine)").matches) window.open(link, "_blank", "noopener"); else setBig(true); }} aria-label={t("Ouvrir ou agrandir le QR code")}><QrSvg text={link} /></button><div className="muted small">{window.matchMedia?.("(pointer: fine)").matches ? t("Cliquez sur le QR code pour ouvrir la page") : t("Touchez le QR code pour l'agrandir")}</div>{big && <Modal title={t("Mon QR code")} onClose={() => setBig(false)}><div className="col center" style={{ alignItems: "center" }}><QrSvg text={link} size={Math.min(window.innerWidth - 80, 460)} /><b style={{ letterSpacing: 1 }}>{u.code}</b></div></Modal>}<div className="muted small center">{t("Montrez-le à un proche : il scanne avec l'appareil photo de son téléphone.")}</div>
    <div><b style={{ color: "var(--warm)", letterSpacing: 1 }}>{u.code}</b> · @{u.handle}</div>
    <div className="row wrap" style={{ justifyContent: "center" }}><button className="btn sm" onClick={() => navigator.clipboard?.writeText(link).then(() => toast(t("Lien copié"))).catch(() => toast(t("Copie impossible")))}>{t("Copier mon lien")}</button><button className="btn ghost sm" onClick={() => downloadQr(link, u.handle)}>{t("Enregistrer l'image")}</button>
      <button className="btn danger sm" onClick={() => { if (confirm(t("Créer un nouveau code ? L'ancien QR code ne marchera plus."))) { actions.regenerateCode(); toast(t("Nouveau code créé.")); } }}>{t("Renouveler")}</button></div>
    <hr /><div className="col" style={{ width: "100%" }}><b>{t("Qui peut me trouver ?")}</b>{D.map(([k, l, tx]) => <label key={k} className="row" style={{ alignItems: "flex-start" }}><input type="radio" name="disc" checked={u.discover === k} onChange={() => { actions.setDiscover(k); toast(t("Réglage enregistré.")); }} style={{ width: 22, height: 22, marginTop: 2 }} /><span><b>{l}</b><div className="muted small">{tx}</div></span></label>)}
      <div className="row"><input className="inp" value={h} onChange={(e) => setH(e.target.value)} aria-label={t("Pseudo")} /><button className="btn sm" onClick={() => toast(actions.setHandle(h).msg)}>{t("Enregistrer le pseudo")}</button></div></div></div>);
}
function Scanner({ onCode, onClose }: { onCode: (c: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLVideoElement>(null); const [err, setErr] = useState("");
  useEffect(() => { let stop = false; let stream: MediaStream | null = null; const BD = (window as any).BarcodeDetector;
    if (!BD) { setErr(t("Ce navigateur ne sait pas lire les QR codes. Utilisez l'appareil photo du téléphone : il ouvrira le lien NOTIIF tout seul.")); return; }
    (async () => { try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); if (ref.current) { ref.current.srcObject = stream; await ref.current.play(); } const det = new BD({ formats: ["qr_code"] });
      const loop = async () => { if (stop || !ref.current) return; try { const r = await det.detect(ref.current); const v = r[0]?.rawValue as string | undefined; const m = v?.match(/add=(NID-[A-Z0-9]{5})/i) || v?.match(/(NID-[A-Z0-9]{5})/i); if (m) { onCode(m[1].toUpperCase()); return; } } catch {} setTimeout(loop, 300); }; loop(); } catch { setErr(t("Caméra indisponible ou refusée.")); } })();
    return () => { stop = true; stream?.getTracks().forEach((tx) => tx.stop()); }; }, []);
  return (<Modal title={t("Scanner un QR code")} onClose={onClose}><div className="col">{err ? <p className="muted">{err}</p> : <video ref={ref} playsInline muted style={{ width: "100%", borderRadius: 16 }} />}</div></Modal>);
}

type Ct = { name: string; tel?: string; email?: string };
function InviteContacts({ onClose }: { onClose: () => void }) {
  const me = useStore((x) => userOf(x, x.me)!); const [list, setList] = useState<Ct[]>([]); const [pick, setPick] = useState<string[]>([]); const [man, setMan] = useState("");
  const can = typeof navigator !== "undefined" && "contacts" in navigator && "ContactsManager" in window;
  const msg = t("Rejoins-moi sur NOTIIF, le réseau privé de nos proches (famille, amis, collègues, club…), sans publicité. Installe l'application ici : {inviteLink} (mon code : {code})", { inviteLink: inviteLink(me.code), code: me.code });
  const choose = async () => { try { const r = await (navigator as any).contacts.select(["name", "tel", "email"], { multiple: true }); const n: Ct[] = r.map((c: any) => ({ name: c.name?.[0] || c.email?.[0] || c.tel?.[0] || t("Contact"), tel: c.tel?.[0], email: c.email?.[0] })).filter((c: Ct) => c.tel || c.email); setList(n); setPick(n.map((c) => c.name)); if (!n.length) toast(t("Aucun contact avec un numéro ou un e-mail.")); } catch { toast(t("Accès aux contacts refusé ou annulé.")); } };
  const addMan = () => { const v = man.trim(); if (!v) return; const c: Ct = v.includes("@") ? { name: v, email: v } : { name: v, tel: v }; setList((x) => [...x, c]); setPick((x) => [...x, c.name]); setMan(""); };
  const share = async () => { try { if ((navigator as any).share) await (navigator as any).share({ title: "NOTIIF", text: msg }); else { await navigator.clipboard.writeText(msg); toast(t("Message copié : collez-le où vous voulez.")); } } catch { /* annulé */ } };
  const chosen = list.filter((c) => pick.includes(c.name));
  return <Modal title={t("Inviter mes proches")} onClose={onClose}><div className="col" style={{ gap: 10 }}>
    {can ? <button className="btn" onClick={choose}>{t("📇 Choisir dans mes contacts")}</button> : <p className="muted small" style={{ margin: 0 }}>{t("Sur ce téléphone ou navigateur, l'application ne peut pas lire vos contacts. Ajoutez un numéro ou un e-mail à la main, ou partagez le lien.")}</p>}
    <div className="row" style={{ gap: 6 }}><input className="inp sm" placeholder={t("Numéro ou e-mail")} value={man} onChange={(e) => setMan(e.target.value)} aria-label={t("Numéro ou e-mail")} onKeyDown={(e) => e.key === "Enter" && addMan()} /><button className="btn sm" onClick={addMan} disabled={!man.trim()}>{t("Ajouter")}</button></div>
    {list.map((c) => <div key={c.name} className="row"><span className="grow"><b>{c.name}</b><span className="muted small" style={{ display: "block" }}>{c.tel || c.email}</span></span><Switch on={pick.includes(c.name)} label={t("Inviter {name}", { name: c.name })} onChange={(v) => setPick((x) => (v ? [...x, c.name] : x.filter((y) => y !== c.name)))} /></div>)}
    {chosen.length > 0 && <div className="col" style={{ gap: 6 }}><b className="small">{t("Envoyer l'invitation :")}</b>{chosen.map((c) => <div key={c.name} className="row wrap" style={{ gap: 6 }}><span className="grow small">{c.name}</span>{c.tel && <a className="btn ghost sm" style={{ textDecoration: "none" }} href={`sms:${c.tel}?&body=${encodeURIComponent(msg)}`}>{t("SMS")}</a>}{c.email && <a className="btn ghost sm" style={{ textDecoration: "none" }} href={`mailto:${c.email}?subject=${encodeURIComponent(t("Rejoins-moi sur NOTIIF"))}&body=${encodeURIComponent(msg)}`}>{t("E-mail")}</a>}</div>)}</div>}
    <button className="btn ghost" onClick={share}>{t("🔗 Partager le lien d'invitation")}</button>
    <p className="muted small" style={{ margin: 0 }}>{t("🔒 Vos contacts ne sont ni enregistrés ni envoyés à NOTIIF : ils servent seulement à écrire le message sur votre téléphone. L'import depuis Google ou Facebook viendra avec la connexion par serveur.")}</p></div></Modal>;
}
function Acc({ id, acc, setAcc, icon, title, children, start = false }: { id: string; acc: string | null; setAcc: (v: string | null) => void; icon: string; title: string; children: ReactNode; start?: boolean }) {
  const [first, setFirst] = useState(start); const open = start && first && acc === null ? true : acc === id;
  return (<div className="acc"><button type="button" className="setrow" aria-expanded={open} onClick={() => { setFirst(false); setAcc(open ? "" : id); }}><span className="seti">{icon}</span><span className="grow"><b>{title}</b></span><span className="setch">{open ? "▾" : "›"}</span></button>{open && <div className="accbody col" style={{ gap: 10 }}>{children}</div>}</div>);
}
export function Friends({ go }: { go: (v: string) => void }) {
  const s = useStore((x) => x); const me = s.me; const user = userOf(s, me)!; const [code, setCode] = useState(""); const [list, setList] = useState(false); const [name, setName] = useState(""); const [sel, setSel] = useState<string[]>([]); const [menu, setMenu] = useState<string | null>(null); const [ct, setCt] = useState(false); const [rep, setRep] = useState<string | null>(null); const [acc, setAcc] = useState<string | null>(null);
  const allFriends = (s.social.friends[me] || []).map((i) => userOf(s, i)!).filter(Boolean); const ties = s.social.ties || {}; const friends = allFriends; const reqs = s.reqs.filter((r) => r.to === me); const blocked = (s.social.blocks[me] || []).map((i) => userOf(s, i)!).filter(Boolean);
  const mylists = s.social.lists.filter((l) => l.ownerId === me);
  return (<div className="col"><h1>{t("Amis")}</h1>
    {reqs.length > 0 && <Acc id="reqs" acc={acc} setAcc={setAcc} icon="📩" title={t("Demandes reçues ({length})", { length: reqs.length })} start>{reqs.map((r) => { const u = userOf(s, r.from); return <div key={r.id} className="frow" style={{ flexWrap: "wrap" }}><Avatar u={u} s={46} /><span className="grow" style={{ minWidth: 0 }}><b className="ell">{u?.name}</b></span><span style={{ flexBasis: "100%", height: 0 }} /><button className="btn sm grow" onClick={() => { actions.answerReq(r.id, true); toast(t("{name} est maintenant votre ami.", { name: u?.name })); }}>{t("Accepter")}</button><button className="btn ghost sm grow" onClick={() => actions.answerReq(r.id, false)}>{t("Refuser")}</button></div>; })}</Acc>}
    <FindPeople />
    <Acc id="inv" acc={acc} setAcc={setAcc} icon="➕" title={t("Inviter un proche")}><div className="row" style={{ gap: 8 }}><span className="muted small grow">{t("Mon code :")}{" "}<b style={{ color: "var(--brand)", letterSpacing: 1 }}>{user.code}</b></span><button className="chip" onClick={() => { navigator.clipboard?.writeText(user.code).then(() => toast(t("Code copié"))).catch(() => toast(t("Copie impossible"))); }}>{t("Copier")}</button></div>
      <form className="col" style={{ gap: 8 }} onSubmit={(e) => { e.preventDefault(); const r = actions.addByCode(code); toast(r.msg); if (r.ok) setCode(""); }}><input className="inp" placeholder={t("Code d'un proche (NID-…)")} value={code} onChange={(e) => setCode(e.target.value)} aria-label={t("Code d'invitation")} /><button className="btn" disabled={!code.trim()}>{t("Inviter")}</button></form>
      <button className="btn ghost" onClick={() => setCt(true)}>{t("📇 Inviter depuis mes contacts")}</button>
      <details className="muted small"><summary>{t("Mode démo : codes à tester")}</summary>{s.users.filter((u) => u.demo).map((u) => u.code).join(", ")}{" "}{t("(personnes fictives)")}</details></Acc>
    {(() => { const row = (f: User) => <div key={f.id} className="frow"><button type="button" className="frowmain" onClick={() => setMenu(f.id)} aria-label={t("Options pour {name}", { name: f.name })}><Avatar u={f} s={50} /><span className="grow"><b className="ell">{f.name}</b>{f.status ? <small className="ell">{f.status}</small> : null}</span></button><button type="button" className="fmsg" onClick={() => { actions.startDm(f.id); go("messages"); }} aria-label={t("💬 Écrire")}><Ico n="chat" s={20} /></button></div>;
      const sec = (id: string, icon: string, title: string, arr: User[]) => <Acc key={id} id={id} acc={acc} setAcc={setAcc} icon={icon} title={title + " (" + arr.length + ")"}>{arr.length ? arr.map(row) : <p className="muted small" style={{ margin: 0 }}>{t("Personne ici pour l'instant.")}</p>}</Acc>;
      return <>{sec("fam", "❤", t("Famille"), friends.filter((f) => ties[f.id] === "family"))}{sec("fav", "★", t("Favoris"), friends.filter((f) => ties[f.id] === "fav"))}{mylists.map((l) => sec("l" + l.id, "👥", l.name, friends.filter((f) => l.memberIds.includes(f.id))))}{sec("all", "👥", t("Tous mes amis"), friends)}</>; })()}
    {!friends.length && <p className="muted">{t("Pas encore d'amis.")}</p>}
    {rep && <Modal title={t("Signaler cette personne")} onClose={() => setRep(null)}><div className="col" style={{ gap: 8 }}><p className="muted small" style={{ margin: 0 }}>{t("Pourquoi ? Trois signalements de personnes différentes suspendent automatiquement le compte le temps d'une vérification.")}</p>{[t("Faux profil"), t("Vente, publicité ou démarchage"), t("Arnaque"), t("Propositions sexuelles ou escorting"), t("Contenu illégal"), t("Harcèlement"), t("Autre")].map((w) => <button key={w} className="btn ghost" onClick={() => { actions.report(rep, w); toast(t("Merci, signalement enregistré.")); setRep(null); }}>{w}</button>)}</div></Modal>}
    {ct && <InviteContacts onClose={() => setCt(false)} />}
    {menu && (() => { const f = userOf(s, menu); if (!f) return null; return <Modal title={f.name} onClose={() => setMenu(null)}><div className="col" style={{ gap: 8 }}><div className="row"><Avatar u={f} s={48} /><div className="muted small">@{f.handle}</div></div>
      <div><b className="small">{t("Lien avec {name}", { name: f.name })}</b><div className="chiprow" style={{ marginTop: 6 }}>{([[undefined, T("Aucun")], ["family", T("Famille")], ["fav", T("Favori")]] as const).map(([k, l]) => <button key={l} className={"chip" + ((s.social.ties?.[f.id] || undefined) === k ? " on" : "")} onClick={() => actions.setTie(f.id, k || null)}>{k === "family" ? "❤ " : k === "fav" ? "★ " : ""}{t(l)}</button>)}</div></div>
      <button className="btn" onClick={() => { actions.startDm(f.id); setMenu(null); go("messages"); }}>{t("💬 Écrire")}</button>
      <button className="btn ghost" onClick={() => { if (confirm(t("Retirer {name} de vos amis ?", { name: f.name }))) { actions.unfriend(f.id); setMenu(null); } }}>{t("Retirer des amis")}</button>
      <button className="btn ghost" onClick={() => { setRep(f.id); setMenu(null); }}>{t("Signaler")}</button>
      <button className="btn danger" onClick={() => { if (confirm(t("Bloquer {name} ? Il ne verra plus vos contenus.", { name: f.name }))) { actions.block(f.id, true); toast(t("Bloqué.")); setMenu(null); } }}>{t("Bloquer")}</button></div></Modal>; })()}
    <div className="card col"><div className="row"><h3 className="grow">{t("Mes listes")}</h3><button className="btn sm" onClick={() => setList(true)}><Ico n="plus" s={16} />{" "}{t("Créer")}</button></div>
      {mylists.map((l) => <div key={l.id}><b>{l.name}</b> <span className="muted small">{l.memberIds.map((i) => userOf(s, i)?.name).join(", ")}</span></div>)}{!mylists.length && <p className="muted small">{t("Ex. « Cousins », « Collègues »… pour choisir vite qui voit vos publications.")}</p>}</div>
    {blocked.length > 0 && <div className="card col"><h3>{t("Personnes bloquées")}</h3>{blocked.map((b) => <div key={b.id} className="row"><Avatar u={b} s={34} /><b className="grow">{b.name}</b><button className="btn ghost sm" onClick={() => actions.block(b.id, false)}>{t("Débloquer")}</button></div>)}</div>}
    {list && <Modal title={t("Nouvelle liste")} onClose={() => setList(false)}><div className="col"><input className="inp" placeholder={t("Nom de la liste")} value={name} onChange={(e) => setName(e.target.value)} /><div className="tabs" style={{ flexWrap: "wrap" }}>{friends.map((f) => <button key={f.id} className={"chip" + (sel.includes(f.id) ? " on" : "")} onClick={() => setSel((x) => (x.includes(f.id) ? x.filter((y) => y !== f.id) : [...x, f.id]))}>{f.name}</button>)}</div>
      <button className="btn" disabled={!name.trim() || !sel.length} onClick={() => { actions.createList(name, sel); setList(false); setName(""); setSel([]); }}>{t("Créer")}</button></div></Modal>}
  </div>);
}

function FindPeople() {
  const [q, setQ] = useState(""); const [scan, setScan] = useState(false); const s = useStore((x) => x); const res = q.trim().length >= 2 ? actions.searchUsers(q) : [];
  return (<div className="card col" style={{ padding: 10, gap: 8 }}><div className="row" style={{ gap: 6 }}><input className="inp sm" placeholder={t("🔎 Trouver quelqu'un (nom ou @pseudo)")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("Rechercher")} /><button className="btn ghost sm" onClick={() => setScan(true)} aria-label={t("Scanner un QR code")}>📷</button></div>
    {res.map((u) => <div key={u.id} className="row"><Avatar u={u} s={38} /><div className="grow"><b>{u.name}</b><div className="muted small">@{u.handle}</div></div><button className="btn sm" onClick={() => toast(actions.requestFriend(u.id).msg)}>{t("Ajouter")}</button></div>)}
    {q.trim().length >= 2 && !res.length && <p className="muted small">{t("Aucune personne trouvée. Les personnes « invisibles » ou « limitées » ne se trouvent qu'avec leur QR code, leur code ou leur pseudo exact.")}</p>}
    {scan && <Scanner onClose={() => setScan(false)} onCode={(c) => { setScan(false); toast(actions.addByCode(c).msg); }} />}{s.me && null}</div>);
}
export function Groups() {
  const s = useStore((x) => x); const me = s.me; const [open, setOpen] = useState<string | null>(null); const [mk, setMk] = useState(false);
  const groups = s.social.groups.filter((g) => g.memberIds.includes(me)); const g = groups.find((x) => x.id === open);
  const [n, setN] = useState(""); const [em, setEm] = useState("👨‍👩‍👧"); const [d, setD] = useState(""); const [r, setR] = useState(""); const [sel, setSel] = useState<string[]>([]);
  const friends = (s.social.friends[me] || []).map((i) => userOf(s, i)!).filter(Boolean);
  if (g) return (<div className="col"><button className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={() => setOpen(null)}><Ico n="back" s={16} />{" "}{t("Groupes")}</button>
    <div className="card col"><div className="row"><span style={{ fontSize: "2.4rem" }}>{g.emoji}</span><div className="grow"><h1>{g.name}</h1><div className="muted">{g.description}</div></div></div>
      {g.rules && <div className="card" style={{ background: "var(--card2)" }}><b>{t("📜 Règles du groupe")}</b><div className="muted">{g.rules}</div></div>}
      <h3>{t("Membres ({length})", { length: g.memberIds.length })}</h3>{g.memberIds.map((m) => { const u = userOf(s, m); return <div key={m} className="row"><Avatar u={u} s={36} /><b className="grow">{u?.name}{g.adminIds.includes(m) ? " 👑" : ""}</b>{g.adminIds.includes(me) && m !== me && <button className="btn danger sm" onClick={() => { if (confirm(t("Retirer {name} du groupe ?", { name: u?.name }))) actions.removeMember(g.id, m); }}>{t("Retirer")}</button>}</div>; })}
      <button className="btn ghost sm" onClick={() => { if (confirm(t("Quitter ce groupe ?"))) { actions.leaveGroup(g.id); setOpen(null); } }}>{t("Quitter le groupe")}</button></div>
    <Home groupId={g.id} /></div>);
  return (<div className="col"><div className="row"><h1 className="grow">{t("Groupes")}</h1><button className="btn sm" onClick={() => setMk(true)}><Ico n="plus" s={16} />{" "}{t("Nouveau")}</button></div>
    <div className="grid2" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))" }}>{groups.map((x) => <button key={x.id} className="card col" style={{ textAlign: "left", color: "inherit" }} onClick={() => setOpen(x.id)}><span style={{ fontSize: "2rem" }}>{x.emoji}</span><b>{x.name}</b><span className="muted small">{t("{n, plural, one{# membre} other{# membres}}", { n: x.memberIds.length })}</span></button>)}</div>
    {!groups.length && <p className="muted">{t("Créez un groupe pour la famille, les vacances, les soirées…")}</p>}
    {mk && <Modal title={t("Nouveau groupe")} onClose={() => setMk(false)}><div className="col"><div className="row"><input className="inp" style={{ width: 80 }} value={em} onChange={(e) => setEm(e.target.value)} aria-label={t("Emoji")} /><input className="inp" placeholder={t("Nom du groupe")} value={n} onChange={(e) => setN(e.target.value)} /></div>
      <input className="inp" placeholder={t("Description")} value={d} onChange={(e) => setD(e.target.value)} /><textarea className="inp" placeholder={t("Règles du groupe (facultatif)")} value={r} onChange={(e) => setR(e.target.value)} />
      <div className="muted small">{t("Membres (parmi vos amis)")}</div><div className="tabs" style={{ flexWrap: "wrap" }}>{friends.map((f) => <button key={f.id} className={"chip" + (sel.includes(f.id) ? " on" : "")} onClick={() => setSel((x) => (x.includes(f.id) ? x.filter((y) => y !== f.id) : [...x, f.id]))}>{f.name}</button>)}</div>
      <button className="btn" disabled={!n.trim()} onClick={() => { actions.createGroup({ name: n, emoji: em || "👥", description: d, rules: r, memberIds: sel }); setMk(false); setN(""); setD(""); setR(""); setSel([]); toast(t("Groupe créé.")); }}>{t("Créer le groupe")}</button></div></Modal>}
  </div>);
}

export function Events() {
  const s = useStore((x) => x); const me = s.me; const [mk, setMk] = useState(false); const now = useNow(30000);
  const [tx, setT] = useState(""); const [d, setD] = useState(""); const [p, setP] = useState(""); const [when, setWhen] = useState(""); const [sel, setSel] = useState<string[]>([]); const [det, setDet] = useState<string | null>(null);
  const friends = (s.social.friends[me] || []).map((i) => userOf(s, i)!).filter(Boolean);
  const evs = s.events.filter((e) => e.hostId === me || e.inviteIds.includes(me)).sort((a, b) => a.at - b.at);
  const LAB = { yes: t("✅ Présent"), no: t("❌ Absent"), maybe: t("🤔 Peut-être") } as const;
  return (<div className="col"><div className="row"><h1 className="grow">{t("Événements")}</h1><button className="btn sm" onClick={() => setMk(true)}><Ico n="plus" s={16} />{" "}{t("Créer")}</button></div>
    {!evs.length && <p className="muted">{t("Anniversaires, repas de famille, vacances… créez le premier !")}</p>}
    {evs.map((e) => <div key={e.id} className="card col"><div className="row"><div className="grow"><h3>{e.title}</h3><div className="muted small">📅 {new Date(e.at).toLocaleString(locale(), { dateStyle: "full", timeStyle: "short" })}{e.at < now ? t(" · passé") : ""}</div>{e.place && <div className="muted small">📍 {e.place}</div>}</div>{e.hostId === me && <button className="btn danger sm" onClick={() => confirm(t("Supprimer cet événement ?")) && actions.deleteEvent(e.id)}><Ico n="trash" s={16} /></button>}</div>
      {e.desc && <div>{e.desc}</div>}<div className="muted small">{t("Organisé par {name}", { name: userOf(s, e.hostId)?.name })}</div>
      <div className="rsvp">{(["yes", "maybe", "no"] as const).map((v) => { const n = [e.hostId, ...e.inviteIds].filter((i) => e.rsvp[i] === v).length; return <button key={v} className={"rv " + v + (e.rsvp[me] === v ? " on" : "")} onClick={() => actions.rsvp(e.id, v)}><b>{n}</b><span>{LAB[v]}</span></button>; })}</div>
      <button className="btn ghost sm" onClick={() => setDet(e.id)}>{t("👥 Voir qui vient")}</button></div>)}
    {det && (() => { const e = s.events.find((x) => x.id === det); if (!e) return null; const all = [e.hostId, ...e.inviteIds]; return <Modal title={e.title} onClose={() => setDet(null)}><div className="col">{([["yes", t("✅ Présents")], ["maybe", t("🤔 Peut-être")], ["no", t("❌ Absents")], ["", t("⏳ Sans réponse")]] as const).map(([v, l]) => { const l2 = all.filter((i) => (e.rsvp[i] || "") === v); return <div key={v}><div className="muted small">{l} · {l2.length}</div>{l2.length ? <div className="row wrap" style={{ gap: 6, marginTop: 4 }}>{l2.map((i) => <span key={i} className="chip">{userOf(s, i)?.name}</span>)}</div> : <div className="muted small">—</div>}</div>; })}</div></Modal>; })()}
    {mk && <Modal title={t("Nouvel événement")} onClose={() => setMk(false)}><div className="col"><input className="inp" placeholder={t("Titre (ex. Anniversaire de Mamie)")} value={tx} onChange={(e) => setT(e.target.value)} /><input className="inp" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} aria-label={t("Date et heure")} /><input className="inp" placeholder={t("Lieu")} value={p} onChange={(e) => setP(e.target.value)} /><textarea className="inp" placeholder={t("Description")} value={d} onChange={(e) => setD(e.target.value)} />
      <div className="muted small">{t("Inviter")}</div><div className="tabs" style={{ flexWrap: "wrap" }}>{friends.map((f) => <button key={f.id} className={"chip" + (sel.includes(f.id) ? " on" : "")} onClick={() => setSel((x) => (x.includes(f.id) ? x.filter((y) => y !== f.id) : [...x, f.id]))}>{f.name}</button>)}</div>
      <button className="btn" disabled={!tx.trim() || !when || !sel.length} onClick={() => { actions.createEvent({ title: tx, desc: d, place: p, at: new Date(when).getTime(), inviteIds: sel }); setMk(false); setT(""); setD(""); setP(""); setWhen(""); setSel([]); toast(t("Événement créé.")); }}>{t("Créer")}</button></div></Modal>}
  </div>);
}

function EditProfile({ u, onClose }: { u: User; onClose: () => void }) {
  const [name, setName] = useState(u.name); const [bio, setBio] = useState(u.bio); const [st, setSt] = useState(u.status); const [av, setAv] = useState<string | null>(u.avatar || null); const [vis, setVis] = useState(u.avatarVis || "friends"); const [hh, setHh] = useState(""); const f = useRef<HTMLInputElement>(null);
  const V: [User["avatarVis"], string][] = [["friends", t("Mes amis")], ["all", t("Tout le monde")], ["none", t("Personne")]];
  return <Modal title={t("Modifier mon profil")} onClose={onClose}><div className="col">
    <div className="col center" style={{ alignItems: "center", gap: 10 }}><Avatar u={{ ...u, avatar: av, avatarVis: "all" }} s={104} />
      <div className="row wrap" style={{ justifyContent: "center" }}><button className="btn sm" onClick={() => f.current?.click()}>{av ? t("Changer la photo") : t("Ajouter une photo")}</button>{av && <button className="btn danger sm" onClick={() => setAv(null)}>{t("Supprimer la photo")}</button>}</div>
      <input ref={f} type="file" accept="image/*" hidden onChange={async (e) => { const x = e.target.files?.[0]; if (x) { try { setAv(await fileToDataUrl(x)); } catch { toast(t("Impossible de lire cette image.")); } } }} /></div>
    <div className="card col" style={{ gap: 4, padding: 12 }}><b className="small">{t("Pseudo : @{handle}", { handle: u.handle })}</b><span className="muted small">{u.handleChanged ? t("Déjà changé une fois : définitif.") : t("Modifiable une seule fois, et c'est payant (pour limiter les faux profils).")}</span>{!u.handleChanged && <div className="row" style={{ gap: 6 }}><input className="inp sm" placeholder="nouveau pseudo" value={hh} onChange={(e) => setHh(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, "").slice(0, 20))} aria-label={t("Nouveau pseudo")} /><button className="btn sm" disabled={hh.length < 3} onClick={() => { const r = actions.changeHandle(hh); toast(r.msg); if (r.ok) setHh(""); }}>{t("Changer")}</button></div>}</div>
    <b className="small">{t("Qui peut voir ma photo ?")}</b><div className="tabs wrap">{V.map(([k, l]) => <button key={k} className={"chip" + (vis === k ? " on" : "")} onClick={() => setVis(k!)}>{l}</button>)}</div>
    <p className="muted small" style={{ margin: 0 }}>{t("Les autres voient alors votre initiale à la place de la photo.")}</p>
    <input className="inp" value={name} onChange={(e) => setName(e.target.value)} aria-label={t("Prénom ou pseudo")} maxLength={30} /><input className="inp" value={st} onChange={(e) => setSt(e.target.value)} aria-label={t("Statut")} maxLength={60} placeholder={t("Votre statut")} /><textarea className="inp" value={bio} onChange={(e) => setBio(e.target.value)} placeholder={t("Votre courte bio")} maxLength={200} />
    <button className="btn" onClick={() => { actions.updateProfile({ name: name.trim() || u.name, bio, status: st, avatar: av, avatarVis: vis }); toast(t("Profil mis à jour.")); onClose(); }}>{t("Enregistrer")}</button></div></Modal>;
}
function PostChoices() {
  const s = useStore((x) => x); const cfg = cfgOf(s, s.me);
  return (<div className="card col" style={{ gap: 6 }}><h3>{t("Mes publications")}</h3><p className="muted small" style={{ margin: 0 }}>{t("Choisissez ce que vos amis peuvent faire sur vos photos, vidéos et textes.")}</p>
    <label className="row" style={{ padding: "6px 0" }}><div className="grow"><b>{t("J'aime et réactions")}</b><div className="muted small">{t("Si c'est coupé, personne ne peut réagir à vos publications, et aucun compteur n'est affiché.")}</div></div><Switch on={cfg.likes !== false} onChange={(v) => actions.setSetting("likes", v)} label={t("J'aime et réactions")} /></label><hr />
    <label className="row" style={{ padding: "6px 0" }}><div className="grow"><b>{t("Commentaires")}</b><div className="muted small">{t("Si c'est coupé, personne ne peut commenter vos publications.")}</div></div><Switch on={cfg.comm !== false} onChange={(v) => actions.setSetting("comm", v)} label={t("Commentaires")} /></label></div>);
}
export function Profile() {
  const s = useStore((x) => x); const u = userOf(s, s.me)!; const [edit, setEdit] = useState(false);
  const mine = s.posts.filter((p) => p.authorId === s.me && !p.story).length; const friends = (s.social.friends[s.me] || []).length;
  return (<div className="col"><h1>{t("Mon profil")}</h1><div className="card col center" style={{ alignItems: "center" }}><button style={{ background: "none", border: 0, padding: 0, color: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }} onClick={() => setEdit(true)} aria-label={t("Modifier mon profil")}><span style={{ position: "relative" }}><Avatar u={u} s={96} /><span className="pbadge" style={{ right: -2, bottom: -2 }}>✎</span></span><h2>{u.name}</h2></button><div className="muted">{u.status}</div><div className="row muted small"><span>{t("{n, plural, one{# publication} other{# publications}}", { n: mine })}</span><span>·</span><span>{t("{n, plural, one{# ami} other{# amis}}", { n: friends })}</span><span>·</span><span>{t("Membre depuis {toLocaleDateString}", { toLocaleDateString: new Date(u.joinedAt).toLocaleDateString(locale(), { month: "long", year: "numeric" }) })}</span></div>
      <button className="btn sm" onClick={() => setEdit(true)}>{t("Modifier mon profil (photo, nom, bio)")}</button></div>
    <PostChoices />
    <MyQr u={u} />{edit && <EditProfile u={u} onClose={() => setEdit(false)} />}</div>);
}

const GO_VIEW: Record<string, string> = { home: "home", friends: "friends", media: "media", shares: "shares", groups: "groups", messages: "messages", events: "events", games: "games" };
export function Notifs({ go, openConv }: { go?: (v: string) => void; openConv?: (id: string) => void }) {
  const s = useStore((x) => x); const mine = s.notifs.filter((n) => n.to === s.me); const quiet = s.settings[s.me]?.quiet; const [selId, setSelId] = useState<string | null>(null);
  const n = mine.find((x) => x.id === selId); const who = n?.by ? userOf(s, n.by) : null;
  // Aperçu de la publication concernée : jamais pour une publication éphémère ou une story.
  const post = n?.ref ? s.posts.find((x) => x.id === n.ref && (x.authorId === s.me || x.recipients.includes(s.me)) && !(x.viewSecs > 0 || x.story)) : undefined;
  const target = n ? (n.v || (n.go ? GO_VIEW[n.go] : "") || "home") : "home";
  const open = () => { if (!n) return; setSelId(null); if (target === "messages" && n.ref && openConv) openConv(n.ref); else go?.(target); };
  return (<div className="col"><h1>{t("Notifications")}</h1><div className="row wrap" style={{ gap: 8 }}><button className="btn ghost sm" onClick={() => go?.("settings")} aria-label={t("Réglages des notifications")}><Ico n="cog" s={16} />{" "}{t("Réglages")}</button><button className="btn ghost sm" onClick={() => actions.readNotifs()}>{t("Tout marquer lu")}</button></div>
    {quiet && <p className="muted small">{t("🌙 Mode silencieux activé : pas d'alerte, mais la liste reste ici.")}</p>}
    {mine.map((x) => { const by = x.by ? userOf(s, x.by) : null; return <button key={x.id} type="button" className="card row notifrow" style={{ textAlign: "start", width: "100%", alignItems: "center", gap: 10 }} onClick={() => { actions.readNotif(x.id); setSelId(x.id); }}><span className="dot" style={{ opacity: x.read ? 0 : 1 }} />{by && <Avatar u={by} s={36} />}<div className="grow">{x.text}<div className="muted small">{ago(x.at)}{x.pv && x.pv.length < 40 ? " · " + x.pv : ""}</div></div></button>; })}{!mine.length && <p className="muted">{t("Rien de nouveau.")}</p>}
    <p className="muted small">{t("Les notifications ne contiennent jamais le contenu d'une publication éphémère.")}</p>
    {n && <Modal title={t("Notifications")} onClose={() => setSelId(null)}><div className="col" style={{ gap: 12 }}>
      <div className="row" style={{ gap: 10, alignItems: "center" }}>{who && <Avatar u={who} s={48} />}<div className="grow"><b>{n.text}</b><div className="muted small">{ago(n.at)}</div></div></div>
      {n.pv && <div className="card" style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: "1.05rem" }}>{n.pv}</div>}
      {post && (post.img || post.text) && <div className="card col" style={{ margin: 0, gap: 8 }}>{post.img && <img src={post.img} alt={t("Photo")} style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 12 }} />}{post.text && <div className="small" style={{ overflowWrap: "anywhere" }}>{post.text.slice(0, 200)}</div>}</div>}
      <div className="row" style={{ gap: 8 }}><button className="btn grow" onClick={open}>{t("Ouvrir")}</button><button className="btn ghost grow" onClick={() => setSelId(null)}>{t("Fermer")}</button></div></div></Modal>}</div>);
}

const navopts = (): [string, string][] => [["home", t("Accueil")], ["friends", t("Amis")], ["groups", t("Groupes")], ["messages", t("Messages")], ["calls", t("Appels")], ["media", t("Photos et vidéos")], ["games", t("Jeux")], ["events", t("Événements")], ["shares", t("Partages")], ["notifs", t("Notifications")], ["profile", t("Profil")], ["legal", t("Légal")], ["settings", t("Paramètres")]];
export function Settings({ go }: { go?: (v: any) => void }) {
  const s = useStore((x) => x); const cfg = cfgOf(s, s.me);
  const [sec, setSec] = useState<string | null>(() => (history.state?.sec as string) || null); const [q, setQ] = useState(""); const [legal, setLegal] = useState(false);
  useEffect(() => { const h = () => setSec((history.state?.sec as string) || null); window.addEventListener("popstate", h); return () => window.removeEventListener("popstate", h); }, []);
  const open = (k: string) => { history.pushState({ ...(history.state || {}), v: "settings", sec: k }, ""); setSec(k); window.scrollTo(0, 0); };
  const Tg = ({ k, label, desc }: { k: "quiet" | "light" | "autoplay" | "fx"; label: string; desc: string }) => <label className="row" style={{ padding: "8px 0" }}><div className="grow"><b>{label}</b><div className="muted small">{desc}</div></div><Switch on={cfg[k]} onChange={(v) => actions.setSetting(k, v)} label={label} /></label>;
  const rows: [string, string, string, string][] = [["look", "🎨", t("Apparence"), t("Thème, barres, écran de démarrage")], ["notifs", "🔔", t("Notifications et sons"), t("Sonneries, vibreur, effets favoris")], ["priv", "🔒", t("Confidentialité"), t("Qui voit quoi, bloqués")], ["profile", "👤", t("Mon profil"), t("Photo, nom, statut")], ["lang", "🌍", t("Langue"), ""], ["install", "📲", t("Installer l'application"), t("Téléphone, tablette, ordinateur")], ["legal", "ℹ️", t("Aide et mentions légales"), t("Questions, conditions")], ["acct", "🧪", t("Compte et données"), t("Mode démo, export, déconnexion")]];
  const shown = rows.filter(([, , a, b]) => !q.trim() || (a + " " + b).toLowerCase().includes(q.trim().toLowerCase()));
  const titles: Record<string, string> = Object.fromEntries(rows.map((r) => [r[0], r[2]]));
  if (!sec) return (<div className="col"><h1>{t("Paramètres")}</h1>
    <input className="inp" placeholder={t("Chercher un réglage")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("Chercher un réglage")} />
    {shown.map(([k, ic, a, b]) => <button key={k} type="button" className="setrow" onClick={() => (k === "profile" ? go?.("profile") : k === "legal" ? setLegal(true) : open(k))}><span className="seti">{ic}</span><span className="grow"><b>{a}</b>{b ? <small>{b}</small> : null}</span><span className="setch">›</span></button>)}
    {!shown.length && <p className="muted">{t("Aucun résultat.")}</p>}
    {legal && <Modal title={t("Documents juridiques")} onClose={() => setLegal(false)}><div style={{ textAlign: "left" }}><LegalView bare /></div></Modal>}</div>);
  return (<div className="col"><h1>{titles[sec] || t("Paramètres")}</h1>
    {sec === "install" && <>
    <InstallCard />
    </>}
    {sec === "lang" && <>
    <LangPicker />
    </>}
    {sec === "notifs" && <>
    <div className="card col" style={{ gap: 8 }}><h3>{t("🎵 Sonneries et vibreur")}</h3>
      <b className="small">{t("Sonnerie des notifications")}</b><div className="row wrap" style={{ gap: 6 }}>{TONE_IDS.n.map((id) => <button key={id} className={"chip" + ((cfg.ntone || "n1") === id ? " on" : "")} onClick={() => { actions.setSetting("ntone", id); playTone(id); }}>{TONES[id].label}</button>)}</div>
      <b className="small">{t("Sonnerie des appels")}</b><div className="row wrap" style={{ gap: 6 }}>{TONE_IDS.c.map((id) => <button key={id} className={"chip" + ((cfg.ctone || "c1") === id ? " on" : "")} onClick={() => { actions.setSetting("ctone", id); playTone(id); }}>{TONES[id].label}</button>)}</div>
      <b className="small">{t("Vibreur des messages")}</b><div className="row wrap" style={{ gap: 6 }}>{VIB_LEVELS.map((v) => <button key={v.id} className={"chip" + ((cfg.vibm || "2") === v.id ? " on" : "")} onClick={() => { actions.setSetting("vibm", v.id); vibrate(v.id); }}>{v.label}</button>)}</div>
      <b className="small">{t("Vibreur des appels")}</b><div className="row wrap" style={{ gap: 6 }}>{VIB_LEVELS.map((v) => <button key={v.id} className={"chip" + ((cfg.vibc || "3") === v.id ? " on" : "")} onClick={() => { actions.setSetting("vibc", v.id); vibrate(v.id, 2); }}>{v.label}</button>)}</div>
      <p className="muted small" style={{ margin: 0 }}>{t("La secousse fait toujours vibrer au maximum. Touchez un choix pour l'essayer.")}</p></div>
    </>}
    {sec === "notifs" && <>
    <div className="card col" style={{ gap: 6 }}><h3>{t("🔔 Notifications sur le téléphone")}</h3>
      <label className="row"><span className="grow"><b>{t("Recevoir les notifications")}</b><span className="muted small" style={{ display: "block" }}>{t("Messages, demandes d'amis, partages, événements…")}</span></span><Switch on={!!cfg.push} label={t("Notifications sur le téléphone")} onChange={async (v) => { if (!v) { actions.setSetting("push", false); return; } const nat = (window as any).CercleNative; if (nat) { if (nat.hasNotifPermission()) { actions.setSetting("push", true); toast(t("Notifications activées.")); return; } nat.askNotif(); toast(t("Autorisez les notifications dans la fenêtre du téléphone.")); for (let i = 0; i < 40; i++) { await new Promise((r) => setTimeout(r, 750)); if (nat.hasNotifPermission()) { actions.setSetting("push", true); toast(t("Notifications activées.")); return; } } return toast(t("Notifications refusées : autorisez-les dans les réglages du téléphone (Applications > Cercle > Notifications).")); }
        if (typeof Notification === "undefined") return toast(t("Ce navigateur ne gère pas les notifications. Installez l'application (QR Android) ou l'icône sur l'écran d'accueil.")); const r = await Notification.requestPermission(); if (r !== "granted") return toast(t("Notifications refusées : autorisez-les dans les réglages du téléphone, puis réessayez.")); actions.setSetting("push", true); toast(t("Notifications activées.")); }} /></label>
      <b className="small" style={{ marginTop: 6 }}>{t("Quelles notifications recevoir ?")}</b>
      {([["messages", t("💬 Messages")], ["friends", t("👋 Demandes d'amis")], ["home", t("📰 Publications et stories")], ["shares", t("🔁 Partages")], ["events", t("📅 Événements")], ["groups", t("👥 Groupes")], ["media", t("🖼 Albums")], ["games", t("🎮 Jeux")]] as const).map(([k, l]) => <label key={k} className="row" style={{ padding: "4px 0" }}><span className="grow">{l}</span><Switch on={cfg.nt?.[k] !== false} label={t("Notifications : {l}", { l })} onChange={(v) => actions.setNotifType(k, v)} /></label>)}
      {cfg.push && <button className="chip" style={{ alignSelf: "flex-start" }} onClick={() => { navigator.serviceWorker?.ready.then((r) => r.showNotification("NOTIIF", { body: t("Test : tout fonctionne ✅"), icon: "./icon-192.png" })).catch(() => toast(t("Impossible d'afficher la notification de test."))); }}>{t("Envoyer un test")}</button>}
      <p className="muted small" style={{ margin: 0 }}>{t("Honnêtement : pour l'instant, les notifications s'affichent quand l'application est ouverte ou en arrière-plan. Les recevoir application fermée demande le serveur (envoi à distance), prévu avec la connexion de vrais comptes. Appels : bientôt.")}</p></div>
    </>}
    {sec === "notifs" && <>
    <div className="card col" style={{ gap: 4 }}><h3>{t("Mes 4 effets favoris")}</h3><p className="muted small" style={{ margin: 0 }}>{t("Ils s'affichent en premier dans les conversations. Les autres restent sous le bouton « + ».")}</p>
      {FX_KEYS.map((k) => { const cur = favOf(cfg.fxfav); const on = cur.includes(k); return <label key={k} className="row" style={{ padding: "5px 0" }}><span className="grow">{FX[k].label}</span><Switch on={on} label={t("Favori : {label}", { label: FX[k].label })} onChange={(v) => { if (v && cur.length >= 4) return toast(t("4 favoris au maximum : désactivez-en un d'abord.")); if (!v && cur.length <= 1) return toast(t("Gardez au moins un favori.")); actions.setSetting("fxfav", FX_KEYS.filter((x) => (x === k ? v : cur.includes(x))).join(",")); }} /></label>; })}
      <button className="chip" style={{ alignSelf: "flex-start" }} onClick={() => actions.setSetting("fxfav", DEFAULT_FAV.join(","))}>{t("Remettre par défaut")}</button></div>
    </>}
    {sec === "look" && <>
    <div className="card"><label className="row" style={{ padding: "8px 0" }}><div className="grow"><b>{t("Thème clair")}</b><div className="muted small">{t("Fond clair, blanc et turquoise.")}</div></div><Switch on={cfg.light} onChange={(v) => actions.setSetting("light", v)} label={t("Thème clair")} /></label><hr /><label className="row" style={{ padding: "8px 0" }}><div className="grow"><b>{t("Thème sombre")}</b><div className="muted small">{t("Fond bleu nuit et turquoise, plus doux le soir.")}</div></div><Switch on={!cfg.light} onChange={(v) => actions.setSetting("light", !v)} label={t("Thème sombre")} /></label><hr /><Tg k="fx" label={t("Effets dans les conversations")} desc={t("Secousse d'écran avec son, cœurs, anniversaire : quand un ami en envoie un, vous le voyez et l'entendez. Activé au départ.")} /><hr /><Tg k="quiet" label={t("Plage silencieuse")} desc={t("Coupe les alertes la nuit (en mode serveur).")} /><hr /><Tg k="autoplay" label={t("Lecture automatique des vidéos")} desc={t("Pour les vidéos courtes (bientôt).")} /></div>
    </>}
    {sec === "look" && <>
    <div className="card col" style={{ gap: 4 }}><h3>{t("Barre du haut")}</h3><p className="muted small" style={{ margin: 0 }}>{t("Le bouton « Plus » (tous les menus) est toujours en haut à droite. Ajoutez jusqu'à 4 raccourcis à côté.")}</p>
      {([["search", t("Rechercher")], ...navopts()] as [string, string][]).map(([k, l]) => { const cur = (cfg.top ? cfg.top.split(",") : ["search", "settings"]); const on = cur.includes(k); return <label key={k} className="row" style={{ padding: "6px 0" }}><span className="grow"><b>{l}</b></span><Switch on={on} label={t("En haut : {l}", { l })} onChange={(v) => { if (v && cur.length >= 4) return toast(t("4 raccourcis au maximum : désactivez-en un d'abord.")); if (!v && cur.length <= 1) return toast(t("Gardez au moins un raccourci.")); const order = ["settings", ...navopts().map(([x]) => x)]; const nx = order.filter((x, i) => order.indexOf(x) === i && (x === k ? v : cur.includes(x))); actions.setSetting("top", nx.join(",")); }} /></label>; })}
      <button className="chip" style={{ alignSelf: "flex-start" }} onClick={() => actions.setSetting("top", "search,settings")}>{t("Remettre par défaut")}</button></div>
    </>}
    {sec === "look" && <>
    <div className="card col" style={{ gap: 4 }}><h3>{t("Barre du bas")}</h3><p className="muted small" style={{ margin: 0 }}>{t("Choisissez jusqu'à 4 raccourcis. Le bouton « Créer » reste toujours au milieu. Les autres menus sont dans le bouton « Plus » en haut à droite.")}</p>
      {navopts().map(([k, l]) => { const cur = (cfg.nav ? cfg.nav.split(",") : ["home", "friends", "messages", "notifs"]); const on = cur.includes(k); return <label key={k} className="row" style={{ padding: "6px 0" }}><span className="grow"><b>{l}</b></span><Switch on={on} label={t("Raccourci {l}", { l })} onChange={(v) => { if (v && cur.length >= 4) return toast(t("4 raccourcis au maximum : désactivez-en un d'abord.")); if (!v && cur.length <= 1) return toast(t("Gardez au moins un raccourci.")); const nx = navopts().map(([x]) => x).filter((x) => (x === k ? v : cur.includes(x))); actions.setSetting("nav", nx.join(",")); }} /></label>; })}
      <button className="chip" style={{ alignSelf: "flex-start" }} onClick={() => actions.setSetting("nav", "home,friends,messages,notifs")}>{t("Remettre par défaut")}</button></div>
    </>}
    {sec === "look" && <>
    <PostChoices />
    </>}
    {sec === "look" && <>
    <div className="card col" style={{ gap: 6 }}><label className="row" style={{ padding: "6px 0" }}><div className="grow"><b>{t("Bulle de messages")}</b><div className="muted small">{t("Une petite bulle que vous déplacez où vous voulez. Quand elle est affichée, « Messages » est remplacé par « Groupes » dans la barre du bas.")}</div></div><Switch on={cfg.bubble !== false} onChange={(v) => actions.setSetting("bubble", v)} label={t("Bulle de messages")} /></label><hr /><label className="row" style={{ padding: "6px 0" }}><div className="grow"><b>{t("Écran de démarrage")}</b><div className="muted small">{t("La page qui s'ouvre quand vous lancez NOTIIF.")}</div></div><select className="inp sm" style={{ width: "auto" }} value={cfg.start || "home"} onChange={(e) => actions.setSetting("start", e.target.value)} aria-label={t("Écran de démarrage")}>{[["home", t("Accueil")], ["create", t("Créer")], ["friends", t("Amis")], ["messages", t("Messages")], ["groups", t("Groupes")], ["calls", t("Appels")], ["notifs", t("Notifications")], ["media", t("Photos")], ["events", t("Événements")], ["games", t("Jeux")]].map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label></div>
    </>}
    {sec === "priv" && <>
    <div className="card col"><h3>{t("🔒 Confidentialité")}</h3><ul className="muted" style={{ margin: 0, paddingLeft: 18 }}><li>{t("Aucune publicité. Aucune vente de données.")}</li><li>{t("Aucun bouton de partage vers l'extérieur, aucun profil public.")}</li><li>{t("Personne ne peut vous trouver sans votre code d'invitation.")}</li><li>{t("Aucune application ne peut empêcher une personne autorisée de photographier son écran avec un autre appareil.")}</li></ul></div>
    </>}
    {sec === "acct" && <>
    <div className="card col"><h3>{t("🧪 Mode démo (sur cet appareil)")}</h3><p className="muted small">{t("Pour l'instant, vos données restent sur cet appareil et les amis sont fictifs. Les vrais comptes, les messages entre téléphones et les appels demandent un serveur : voir le guide dans le dossier « docs » du projet.")}</p>
      <button className="btn ghost" onClick={() => actions.logout()}>{t("Se déconnecter")}</button>
      <button className="btn ghost" onClick={() => { const b = new Blob([actions.exportData()], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "mes-donnees-cercle.json"; a.click(); }}>{t("Exporter mes données")}</button>
      <button className="btn danger" onClick={() => { if (confirm(t("Supprimer toutes vos données NOTIIF de cet appareil ?"))) actions.deleteAccountData(); }}>{t("Supprimer mon compte et mes données")}</button></div>
    </>}
    {sec === "acct" && <>
    <div className="card col"><h3>{t("🔁 Changer de membre (démo)")}</h3><p className="muted small">{t("Pour tester les durées par personne : publiez une photo de 5 s pour Céline et Thomas, puis passez de l'un à l'autre.")}</p><div className="tabs" style={{ flexWrap: "wrap" }}>{s.users.filter((u) => u.id === s.me || (s.social.friends[s.me] || []).includes(u.id) || u.demo || s.users.length).map((u) => <button key={u.id} className={"chip" + (u.id === s.me ? " on" : "")} onClick={() => { actions.switchUser(u.id); toast(t("Vous êtes maintenant {name}.", { name: u.name })); }}>{u.name}</button>)}</div></div>
    </>}
  </div>);
}
