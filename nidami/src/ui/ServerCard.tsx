import { useEffect, useState } from "react";
import { serverOn, emailLogin, emailSignUp } from "../lib/auth";
import { getSess, signOut, myProfile, listFriends, listRequests, requestFriend, acceptRequest, sendMessage, thread, errText, type Friend, type Request, type Msg } from "../lib/server";
import { toast } from "./common";

/** Carte « Serveur » du panneau développeur : compte réel, amis par code, messages entre deux appareils. */
export function ServerCard() {
  const [sess, setSess] = useState(getSess());
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [name, setName] = useState(""); const [busy, setBusy] = useState(false); const [info, setInfo] = useState("");
  const [me, setMe] = useState<{ name: string; code: string } | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]); const [reqs, setReqs] = useState<Request[]>([]);
  const [code, setCode] = useState(""); const [open, setOpen] = useState<Friend | null>(null); const [msgs, setMsgs] = useState<Msg[]>([]); const [text, setText] = useState("");
  const refresh = async () => { if (!getSess()) return; const [m, f, r] = await Promise.all([myProfile(), listFriends(), listRequests()]); setMe(m); setFriends(f); setReqs(r); };
  useEffect(() => { if (sess) void refresh(); }, [sess]);
  useEffect(() => { if (!sess) return; const id = setInterval(() => { void refresh(); if (open) void thread(open.id).then(setMsgs); }, 3000); return () => clearInterval(id); }, [sess, open]);
  useEffect(() => { if (open) void thread(open.id).then(setMsgs); }, [open]);
  const box = (c: React.ReactNode) => <div className="card col" style={{ gap: 8 }}><h3>☁️ Serveur (comptes, amis, messages)</h3>{c}</div>;
  if (!serverOn()) return box(<p className="muted small" style={{ margin: 0 }}>Le serveur n'est pas relié à cette version.</p>);
  if (!sess) return box(<>
    <p className="muted small" style={{ margin: 0 }}>Crée un compte (tu recevras un e-mail de confirmation) ou connecte-toi.</p>
    <input className="inp" placeholder="Prénom (pour un nouveau compte)" value={name} onChange={(e) => setName(e.target.value)} />
    <input className="inp" type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
    <input className="inp" type="password" placeholder="Mot de passe (6 caractères minimum)" value={pw} onChange={(e) => setPw(e.target.value)} />
    <div className="row" style={{ gap: 8 }}>
      <button className="btn grow" disabled={busy} onClick={async () => { setBusy(true); const r = await emailLogin(email.trim(), pw); setBusy(false); setInfo(r.msg); setSess(getSess()); }}>Se connecter</button>
      <button className="btn ghost grow" disabled={busy} onClick={async () => { setBusy(true); const r = await emailSignUp(email.trim(), pw, name.trim() || email.split("@")[0]); setBusy(false); setInfo(r.msg); setSess(getSess()); }}>Créer un compte</button></div>
    {info && <p className="small" style={{ margin: 0 }}>{info}</p>}</>);
  const send = async () => { if (!open || !text.trim()) return; const r = await sendMessage(open.id, text.trim()); if (!r.ok) toast(errText(r)); else { setText(""); setMsgs(await thread(open.id)); } };
  return box(<>
    <div className="row"><span className="grow">Connecté : <b>{me?.name || sess.email}</b></span><button className="btn ghost" onClick={() => { signOut(); setSess(null); setMe(null); setOpen(null); }}>Se déconnecter</button></div>
    <div className="row"><span className="grow muted">Mon code ami (à donner)</span><b style={{ letterSpacing: 2 }}>{me?.code || "…"}</b></div>
    <div className="row" style={{ gap: 8 }}><input className="inp grow" placeholder="Code d'un ami" value={code} onChange={(e) => setCode(e.target.value)} />
      <button className="btn" onClick={async () => { const r = await requestFriend(code.trim()); if (!r.ok) toast(errText(r)); else { toast({ introuvable: "Code introuvable", "deja-amis": "Déjà amis", "ami-ajoute": "Ami ajouté !", "demande-envoyee": "Demande envoyée" }[String(r.data)] || "OK"); setCode(""); void refresh(); } }}>Ajouter</button></div>
    {reqs.map((r) => <div key={r.reqId} className="row"><span className="grow">{r.incoming ? `${r.name} veut être ton ami` : `Demande envoyée à ${r.name}`}</span>{r.incoming && <button className="btn" onClick={async () => { const x = await acceptRequest(r.reqId); if (!x.ok) toast(errText(x)); void refresh(); }}>Accepter</button>}</div>)}
    <b className="small">Mes amis</b>
    {friends.length === 0 && <p className="muted small" style={{ margin: 0 }}>Aucun ami pour l'instant.</p>}
    {friends.map((f) => <button key={f.id} className={"btn " + (open?.id === f.id ? "" : "ghost")} onClick={() => setOpen(f)}>💬 {f.name}</button>)}
    {open && <div className="col" style={{ gap: 6 }}>
      <b className="small">Discussion avec {open.name}</b>
      <div className="col" style={{ gap: 4, maxHeight: 220, overflow: "auto" }}>{msgs.map((m) => <div key={m.id} style={{ alignSelf: m.sender === sess.uid ? "flex-end" : "flex-start", background: "var(--card2, rgba(127,127,127,.18))", borderRadius: 12, padding: "6px 10px", maxWidth: "80%" }}>{m.body}</div>)}{msgs.length === 0 && <span className="muted small">Aucun message.</span>}</div>
      <div className="row" style={{ gap: 8 }}><input className="inp grow" placeholder="Ton message" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void send(); }} /><button className="btn" onClick={() => void send()}>Envoyer</button></div></div>}</>);
}
