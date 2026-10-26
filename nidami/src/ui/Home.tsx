import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useStore, actions, userOf, State } from "../lib/store";
import { Post, Audience, feedFor, storiesFor, checkAccess, accessFor, originalOf, resolveRecipients, fmtSecs, VIEW_CHOICES, MAX_CUSTOM_SECS } from "../lib/engine";
import { Avatar, Ico, Modal, toast, ago, fileToDataUrl, BG, EMOJIS, EmojiGrid, useNow } from "./common";
import { WmImage, useCaptureGuard } from "./Wm";

// ───────── Barre des stories
export function Stories({ me }: { me: string }) {
  const posts = useStore((s) => s.posts); const social = useStore((s) => s.social); const users = useStore((s) => s.users); const now = useNow(5000);
  const [open, setOpen] = useState<string | null>(null); const [add, setAdd] = useState(false);
  const list = storiesFor(posts, me, now, social); const byAuthor = [...new Set(list.map((p) => p.authorId))];
  return (<><div className="stories">
    <button className="story" onClick={() => setAdd(true)} aria-label="Ajouter une story"><span className="ring add"><div className="av" style={{ width: 58, height: 58, background: "var(--card2)" }}><Ico n="plus" /></div></span><div>Ma story</div></button>
    {byAuthor.map((a) => { const u = users.find((x) => x.id === a); const seen = list.filter((p) => p.authorId === a).every((p) => p.authorId === me || p.views[me] !== undefined);
      return <button key={a} className="story" onClick={() => setOpen(a)}><span className={"ring" + (seen ? " seen" : "")}><Avatar u={u} s={58} /></span><div className="ell">{a === me ? "Moi" : u?.name}</div></button>; })}
  </div>
  {open && <StoryViewer authorId={open} me={me} onClose={() => setOpen(null)} />}
  {add && <Composer story onClose={() => setAdd(false)} />}</>);
}
function StoryViewer({ authorId, me, onClose }: { authorId: string; me: string; onClose: () => void }) {
  const posts = useStore((s) => s.posts); const social = useStore((s) => s.social); const users = useStore((s) => s.users);
  const items = useMemo(() => storiesFor(posts, me, Date.now(), social).filter((p) => p.authorId === authorId), [authorId]);
  const [i, setI] = useState(0); const [reply, setReply] = useState(""); const p = items[i];
  useEffect(() => { if (!p) return onClose(); actions.open(p.id); const t = setTimeout(() => (i + 1 < items.length ? setI(i + 1) : onClose()), 6000); return () => clearTimeout(t); }, [i]);
  const live = posts.find((x) => x.id === p?.id); if (!p || !live) return null; const u = users.find((x) => x.id === authorId);
  return (<div className="viewer" role="dialog" aria-label="Story">
    <div className="bar"><i style={{ width: "100%", animation: "sg 6s linear", transformOrigin: "left" }} key={i} /></div>
    <style>{"@keyframes sg{from{transform:scaleX(0)}to{transform:scaleX(1)}}"}</style>
    <div className="row" style={{ width: "min(560px,100%)" }}><Avatar u={u} s={36} /><b className="grow">{u?.name}</b><span className="muted small">{ago(live.createdAt)}</span><button className="btn ghost sm" onClick={onClose} aria-label="Fermer"><Ico n="x" s={18} /></button></div>
    {live.img ? <img src={live.img} alt="Story" /> : <div className="tbg" style={{ background: BG[(live.bg || 0) % BG.length], width: "min(560px,100%)", minHeight: 320 }}>{live.text}</div>}
    {live.img && live.text && <p>{live.text}</p>}
    {authorId === me ? <div className="card small" style={{ width: "min(560px,100%)" }}><Ico n="eye" s={16} /> Vu par : {Object.keys(live.views).map((v) => users.find((x) => x.id === v)?.name).join(", ") || "personne pour l'instant"}</div>
      : <div className="row" style={{ width: "min(560px,100%)" }}><input className="inp" placeholder="Répondre en privé…" value={reply} onChange={(e) => setReply(e.target.value)} /><button className="btn" onClick={() => { const c = actions.startDm(authorId); actions.send(c, "↩️ Réponse à votre story : " + reply); setReply(""); toast("Réponse envoyée en privé."); }} disabled={!reply.trim()}><Ico n="send" s={18} /></button>
        {EMOJIS.slice(0, 3).map((e) => <button key={e} className="react" onClick={() => { actions.react(live.id, e); toast("Réaction envoyée " + e); }}>{e}</button>)}</div>}
  </div>);
}

// ───────── Publier
const AUD: [string, string][] = [["all", "Tous mes amis"], ["group", "Un groupe"], ["only", "Amis sélectionnés"], ["except", "Tous sauf…"], ["list", "Une liste"], ["me", "Moi uniquement"]];
export function Composer({ onClose, story = false, groupId }: { onClose: () => void; story?: boolean; groupId?: string }) {
  const s = useStore((x) => x); const me = s.me; const friends = (s.social.friends[me] || []).map((id) => userOf(s, id)!).filter(Boolean);
  const groups = s.social.groups.filter((g) => g.memberIds.includes(me)); const lists = s.social.lists.filter((l) => l.ownerId === me);
  const [kind, setKind] = useState<"text" | "photo">("text"); const [text, setText] = useState(""); const [img, setImg] = useState<string | null>(null); const [bg, setBg] = useState(0); const [mood, setMood] = useState("");
  const [mode, setMode] = useState<string>(groupId ? "group" : "all"); const [sel, setSel] = useState<string[]>([]); const [gid, setGid] = useState(groupId || groups[0]?.id || ""); const [lid, setLid] = useState(lists[0]?.id || "");
  const [secs, setSecs] = useState(0); const [custom, setCustom] = useState(""); const [busy, setBusy] = useState(false); const file = useRef<HTMLInputElement>(null);
  const aud: Audience = mode === "group" ? { mode: "group", groupId: gid } : mode === "only" ? { mode: "only", ids: sel } : mode === "except" ? { mode: "except", ids: sel } : mode === "list" ? { mode: "list", listId: lid } : mode === "me" ? { mode: "me" } : { mode: "all" };
  const count = resolveRecipients(s.social, me, aud).length; const eff = custom ? Number(custom) : secs;
  const validCustom = !custom || (Number.isInteger(Number(custom)) && Number(custom) >= 1 && Number(custom) <= MAX_CUSTOM_SECS);
  const pick = async (f?: File) => { if (!f) return; if (!f.type.startsWith("image/")) return toast("Choisissez une image."); setBusy(true); try { setImg(await fileToDataUrl(f)); setKind("photo"); } catch { toast("Impossible de lire cette image."); } setBusy(false); };
  const ok = (kind === "photo" ? !!img : text.trim().length > 0) && validCustom && (mode !== "only" || sel.length > 0);
  const go = () => { const r = actions.publish({ kind, text, img: kind === "photo" ? img : null, bg, mood, audience: aud, viewSecs: story ? 0 : eff, permanent: !story && eff === 0, story }); if (!r.ok) return toast(r.error || "Erreur"); toast(story ? "Story publiée pour 24 h." : "Publié !"); onClose(); };
  const toggle = (id: string) => setSel((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));
  return (<Modal title={story ? "Nouvelle story" : "Nouvelle publication"} onClose={onClose}><div className="col">
    <div className="tabs"><button className={"chip" + (kind === "text" ? " on" : "")} onClick={() => setKind("text")}>✏️ Texte</button><button className={"chip" + (kind === "photo" ? " on" : "")} onClick={() => { setKind("photo"); if (!img) file.current?.click(); }}>📷 Photo</button></div>
    <input ref={file} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
    {kind === "photo" && (img ? <div style={{ position: "relative" }}><img className="photo" src={img} alt="Aperçu" /><button className="btn ghost sm" style={{ position: "absolute", top: 8, right: 8 }} onClick={() => { setImg(null); file.current?.click(); }}>Changer</button></div> : <button className="btn ghost" onClick={() => file.current?.click()} disabled={busy}>{busy ? "Chargement…" : "Choisir une photo"}</button>)}
    <textarea className="inp" placeholder={kind === "photo" ? "Ajouter une légende (facultatif)…" : "Quoi de neuf avec vos proches ?"} value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} aria-label="Texte" />
    {kind === "text" && <div className="row">{BG.map((b, i) => <button key={i} aria-label={"Fond " + (i + 1)} onClick={() => setBg(i)} style={{ width: 30, height: 30, borderRadius: "50%", border: bg === i ? "3px solid #fff" : "0", background: b }} />)}</div>}
    {!story && <div className="row wrap">{["😊", "😍", "🥳", "😴", "🤒", "💪"].map((m) => <button key={m} className={"react" + (mood === m ? " on" : "")} onClick={() => setMood(mood === m ? "" : m)}>{m}</button>)}<span className="muted small">Humeur</span></div>}
    {!story && <><h3 style={{ fontSize: "1rem" }}>Qui peut voir ?</h3>
      <div className="tabs wrap">{AUD.map(([k, l]) => <button key={k} className={"chip" + (mode === k ? " on" : "")} onClick={() => { setMode(k); setSel([]); }}>{l}</button>)}</div>
      {mode === "group" && <select className="inp" value={gid} onChange={(e) => setGid(e.target.value)} aria-label="Groupe">{groups.map((g) => <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>)}</select>}
      {mode === "list" && (lists.length ? <select className="inp" value={lid} onChange={(e) => setLid(e.target.value)}>{lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select> : <p className="muted small">Vous n'avez pas encore de liste : créez-en une dans « Amis ».</p>)}
      {(mode === "only" || mode === "except") && <div className="tabs wrap">{friends.map((f) => <button key={f.id} className={"chip" + (sel.includes(f.id) ? " on" : "")} onClick={() => toggle(f.id)}>{f.name}</button>)}</div>}
      <p className="small" style={{ color: count ? "var(--ok)" : "var(--warm)" }}>{mode === "me" ? "Visible par vous seulement." : `👥 ${count} personne${count > 1 ? "s" : ""} pourr${count > 1 ? "ont" : "a"} voir cette publication.`}</p>
      <h3 style={{ fontSize: "1rem" }}>Durée de consultation (par personne)</h3>
      <div className="tabs wrap"><button className={"chip" + (!custom && secs === 0 ? " on" : "")} onClick={() => { setSecs(0); setCustom(""); }}>♾️ Permanente</button>{VIEW_CHOICES.map((v) => <button key={v} className={"chip" + (!custom && secs === v ? " on" : "")} onClick={() => { setSecs(v); setCustom(""); }}>{fmtSecs(v)}</button>)}
        <input className="inp" style={{ width: 120 }} inputMode="numeric" placeholder="Autre (s)" value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, "").slice(0, 3))} aria-label="Durée personnalisée en secondes" /></div>
      {!validCustom && <p className="small" style={{ color: "var(--bad)" }}>Entrez un nombre de secondes entre 1 et {MAX_CUSTOM_SECS}.</p>}
      {eff > 0 && <p className="muted small"><Ico n="clock" s={14} /> Chaque ami dispose de {fmtSecs(eff)} <b>à partir de sa propre ouverture</b>. La publication disparaît pour tous après 24 h. Une photo peut toujours être photographiée avec un autre appareil : Mon cercle ne peut pas l'empêcher.</p>}</>}
    {story && <p className="muted small">Votre story est visible par tous vos amis pendant 24 h.</p>}
    <button className="btn" disabled={!ok || busy} onClick={go}>Publier</button></div></Modal>);
}

// ───────── Visionneuse éphémère
function Viewer({ postId, me, onClose }: { postId: string; me: string; onClose: () => void }) {
  const rp = useStore((s) => s.posts.find((p) => p.id === postId)); const all = useStore((s) => s.posts); const social = useStore((s) => s.social); const users = useStore((s) => s.users);
  const orig = rp ? originalOf(rp, all) : undefined; const post = rp && orig ? { ...orig, id: rp.id, views: rp.views } : rp;
  const now = useNow(100); const myName = users.find((x) => x.id === me)?.name || "";
  const hidden = useCaptureGuard(() => { actions.suspectCapture(postId); toast("Capture bloquée : l'auteur sera prévenu."); }, true);
  const a = accessFor(rp, all, me, now, social);
  useEffect(() => { if (!a.ok) onClose(); }, [a.ok]);
  if (!post || !a.ok) return null; const u = users.find((x) => x.id === post.authorId); const total = post.viewSecs * 1000; const left = a.remainingMs;
  return (<div className={"viewer protected" + (hidden ? " blur" : "")} role="dialog" aria-label="Publication éphémère">
    {left !== null && <div className="bar" aria-label="Temps restant"><i style={{ width: `${Math.max(0, (left / total) * 100)}%` }} /></div>}
    <div className="row" style={{ width: "min(560px,100%)" }}><Avatar u={u} s={36} /><b className="grow">{u?.name}</b>{left !== null && <b style={{ color: "var(--warm)" }}>{Math.ceil(left / 1000)} s</b>}<button className="btn ghost sm" onClick={onClose} aria-label="Fermer"><Ico n="x" s={18} /></button></div>
    {post.img ? <div style={{ width: "min(560px,100%)" }}><WmImage src={post.img} label={myName} alt="Photo éphémère" style={{ borderRadius: 18 }} /></div> : <div className="tbg" style={{ background: BG[(post.bg || 0) % BG.length], width: "min(560px,100%)", minHeight: 280 }}>{post.text}</div>}
    {post.img && post.text && <p style={{ maxWidth: 560 }}>{post.text}</p>}
    {left !== null && <p className="muted small center" style={{ maxWidth: 520 }}>Si vous fermez, le temps continue de s'écouler. Une photo peut toujours être photographiée avec un autre appareil.</p>}
  </div>);
}

// ───────── Une publication
function PostCard({ post: rp, me }: { post: Post; me: string }) {
  const social = useStore((s) => s.social); const users = useStore((s) => s.users); const all = useStore((s) => s.posts); const shares = useStore((s) => s.shares); const now = useNow(1000); const [view, setView] = useState(false); const [cm, setCm] = useState(""); const [more, setMore] = useState(false); const [replyTo, setReplyTo] = useState<string | undefined>(); const [ask, setAsk] = useState(false); const [detail, setDetail] = useState(false); const [pick, setPick] = useState(false); const [cmEmoji, setCmEmoji] = useState(false);
  const openDetail = () => { history.pushState({ ...(history.state || {}), detail: 1 }, ""); setDetail(true); }; const closeDetail = () => { if (history.state?.detail) history.back(); else setDetail(false); };
  useEffect(() => { if (!detail) return; const f = () => setDetail(false); window.addEventListener("popstate", f); return () => window.removeEventListener("popstate", f); }, [detail]);
  const orig = originalOf(rp, all); const post = orig ? { ...orig, id: rp.id, views: rp.views, recipients: rp.recipients, reactions: rp.reactions, comments: rp.comments, authorId: orig.authorId } : rp; const sharer = orig ? users.find((x) => x.id === rp.authorId) : undefined;
  const u = users.find((x) => x.id === post.authorId); const a = accessFor(rp, all, me, now, social); const mine = post.authorId === me; const eph = post.viewSecs > 0; const myShares = shares.filter((h) => h.postId === rp.id && h.status === "approved");
  const lock = !mine && eph && rp.authorId !== me; const expired = !a.ok;
  const body = (() => {
    if (expired) return <div className="eph gone"><div style={{ fontSize: "2rem" }}>⌛</div><b>Expirée pour vous</b><div className="muted small">Votre temps de consultation est écoulé.</div></div>;
    if (lock) { const opened = rp.views[me] !== undefined; return <div className="eph"><div style={{ fontSize: "2rem" }}>{post.kind === "photo" ? "📸" : "✉️"}</div><b>{post.kind === "photo" ? "Photo" : "Message"} éphémère</b>
      <div className="muted small" style={{ margin: "4px 0 12px" }}>{opened ? `Il vous reste ${Math.ceil((a.ok ? a.remainingMs || 0 : 0) / 1000)} s.` : `Vous aurez ${fmtSecs(post.viewSecs)} à partir de l'ouverture.`}</div><button className="btn" onClick={() => { const r = actions.open(rp.id); if (r.ok) setView(true); }}><Ico n="eye" s={18} /> {opened ? "Reprendre" : "Ouvrir"}</button></div>; }
    return <>{post.img && <div className="protected"><WmImage src={post.img} label={users.find((x) => x.id === me)?.name || ""} alt={post.text || "Photo"} /></div>}{post.kind === "text" ? <div className={post.bg !== undefined ? "tbg" : ""} style={post.bg !== undefined ? { background: BG[post.bg % BG.length] } : undefined}>{post.text}</div> : post.text && <p style={{ margin: "10px 0 0" }}>{post.text}</p>}</>;
  })();
  const myReact = rp.reactions[me]; const counts = Object.values(rp.reactions).reduce<Record<string, number>>((m, e) => ((m[e] = (m[e] || 0) + 1), m), {});
  return (<article className="card col" style={{ gap: 10 }}>
    <div className="row"><Avatar u={u} /><div className="grow"><b>{u?.name}</b> {post.mood}<div className="muted small">{ago(post.createdAt, now)} · {audLabel(post, social)}{eph ? ` · ⏱ ${fmtSecs(post.viewSecs)}` : ""}</div></div>
      {(mine || rp.authorId === me) && <button className="btn ghost sm" onClick={() => setMore(!more)} aria-label="Options"><Ico n="more" s={18} /></button>}</div>
    {sharer && <div className="small" style={{ color: "var(--warm)" }}>↪ Partagé par <b>{sharer.name}</b> avec l'accord de {u?.name}</div>}
    {more && (mine || rp.authorId === me) && <div className="row wrap">{!orig && <button className="btn danger sm" onClick={() => { if (confirm("Supprimer cette publication ? Les partages autorisés disparaissent aussi.")) actions.deletePost(rp.id); }}><Ico n="trash" s={16} /> Supprimer partout</button>}{orig && mine && <button className="btn danger sm" onClick={() => { if (confirm(`Retirer ce partage ? Il disparaît chez ${sharer?.name} et ses amis.`)) actions.revokeShare(rp.shareId!); }}>Retirer ce partage</button>}{orig && rp.authorId === me && <button className="btn danger sm" onClick={() => { if (confirm("Arrêter de partager ?")) actions.revokeShare(rp.shareId!); }}>Arrêter mon partage</button>}</div>}
    {(expired || lock) ? body : <div className="mediaw" onClick={openDetail} role="button" tabIndex={0} aria-label="Agrandir la publication" onKeyDown={(e) => e.key === "Enter" && openDetail()}>{body}
      <div className="mact"><button className={"mbtn" + (myReact ? " on" : "")} onClick={(e) => { e.stopPropagation(); actions.react(rp.id, myReact ? myReact : "❤️"); }} aria-label="J'aime">{myReact || "🤍"}{Object.keys(rp.reactions).length > 0 && <small>{Object.keys(rp.reactions).length}</small>}</button><button className="mbtn" onClick={(e) => { e.stopPropagation(); openDetail(); }} aria-label="Commenter">💬{rp.comments.length > 0 && <small>{rp.comments.length}</small>}</button></div></div>}
    {mine && eph && !orig && <div className="muted small"><Ico n="eye" s={14} /> Vu par {Object.keys(post.views).length}/{post.recipients.length} : {Object.keys(post.views).map((v) => users.find((x) => x.id === v)?.name).join(", ") || "personne pour l'instant"}</div>}
    {mine && !orig && myShares.length > 0 && <div className="small" style={{ color: "var(--warm)" }}>↪ {myShares.length} partage{myShares.length > 1 ? "s" : ""} autorisé{myShares.length > 1 ? "s" : ""} par vous (voir « Partages »).</div>}
    {orig && mine && <div className="muted small">Vu par {Object.keys(rp.views).map((v) => users.find((x) => x.id === v)?.name).join(", ") || "personne pour l'instant"} · Public du partage : {rp.recipients.map((v) => users.find((x) => x.id === v)?.name).join(", ")}</div>}
    {!expired && !lock && <>
      {!mine && !orig && rp.authorId !== me && !post.story && <button className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={() => setAsk(true)}>↪ Demander à partager</button>}
      <div className="row small muted" style={{ gap: 14 }}>{Object.keys(rp.reactions).length > 0 && <span>{Object.entries(counts).map(([e, n]) => e + " " + n).join("  ")}</span>}{rp.comments.length > 0 && <span>💬 {rp.comments.length}</span>}{!Object.keys(rp.reactions).length && !rp.comments.length && <span>Touchez la photo pour réagir ou commenter</span>}</div></>}
    {detail && createPortal(<div className="detail" role="dialog" aria-modal="true" aria-label="Publication">
      <div className="dhead"><button className="btn ghost sm" onClick={closeDetail} aria-label="Retour" style={{ minWidth: 44 }}><Ico n="back" s={18} /></button><Avatar u={u} s={34} /><b className="grow ell">{u?.name} {post.mood}</b></div>
      <div className="dbody">
        <div className="protected">{body}</div>
        <div className="row wrap" style={{ gap: 8, justifyContent: "center", marginTop: 12 }}>{EMOJIS.map((e) => <button key={e} className={"react" + (myReact === e ? " on" : "")} onClick={() => actions.react(rp.id, e)} aria-label={"Réagir " + e}>{e}{counts[e] ? <small> {counts[e]}</small> : null}</button>)}<button className="react" onClick={() => setPick(!pick)} aria-label="Plus d'émoticônes">{pick ? "✕" : "＋"}</button></div>
        {pick && <div className="card" style={{ marginTop: 8 }}><EmojiGrid onPick={(e) => { actions.react(rp.id, e); setPick(false); }} /></div>}
        {Object.entries(counts).filter(([e]) => !EMOJIS.includes(e)).length > 0 && <div className="row wrap small muted" style={{ marginTop: 8 }}>Autres : {Object.entries(counts).filter(([e]) => !EMOJIS.includes(e)).map(([e, n]) => e + " " + n).join("  ")}</div>}
        <div className="col" style={{ gap: 8, marginTop: 14 }}>{rp.comments.length === 0 && <div className="muted small center">Aucun commentaire pour l'instant. Soyez le premier !</div>}{rp.comments.map((c) => <div key={c.id} className="row" style={{ alignItems: "flex-start", marginLeft: c.replyTo ? 28 : 0 }}><Avatar u={users.find((x) => x.id === c.authorId)} s={30} /><div className="cbub grow"><b className="small">{users.find((x) => x.id === c.authorId)?.name}</b> <span className="muted small">{ago(c.at, now)}</span><div>{c.text}</div><button className="muted small" style={{ background: "none", border: 0, padding: 0 }} onClick={() => setReplyTo(c.id)}>Répondre</button></div></div>)}</div>
      </div>
      <div className="dfoot">{cmEmoji && <div className="card" style={{ maxHeight: 220, overflow: "auto", marginBottom: 8 }}><EmojiGrid onPick={(e) => setCm(cm + e)} /></div>}
        <form className="row" onSubmit={(e) => { e.preventDefault(); actions.comment(rp.id, cm, replyTo); setCm(""); setReplyTo(undefined); setCmEmoji(false); }}><button type="button" className="btn ghost sm" onClick={() => setCmEmoji(!cmEmoji)} aria-label="Émoticônes">😊</button><input className="inp" placeholder={replyTo ? "Votre réponse…" : "Écrire un commentaire…"} value={cm} onChange={(e) => setCm(e.target.value)} aria-label="Commentaire" /><button className="btn sm" disabled={!cm.trim()} aria-label="Envoyer"><Ico n="send" s={16} /></button></form></div></div>, document.body)}
    {view && <Viewer postId={rp.id} me={me} onClose={() => setView(false)} />}
    {ask && <ShareAsk post={rp} onClose={() => setAsk(false)} />}
  </article>);
}
function audLabel(p: Post, s: State["social"]) { const m = p.audience.mode; return m === "all" ? "Tous les amis" : m === "me" ? "Moi seul" : m === "group" ? s.groups.find((g) => g.id === (p.audience as any).groupId)?.name || "Groupe" : m === "only" ? "Amis choisis" : m === "except" ? "Amis sauf…" : "Liste"; }

export function Home({ groupId }: { groupId?: string }) {
  const me = useStore((s) => s.me); const posts = useStore((s) => s.posts); const social = useStore((s) => s.social); const now = useNow(2000); const [compose, setCompose] = useState(false); const [filter, setFilter] = useState("all");
  const user = useStore((s) => userOf(s, s.me)); const groups = social.groups.filter((g) => g.memberIds.includes(me));
  useEffect(() => { actions.tick(); }, [now]);
  let feed = feedFor(posts, me, now, social); if (groupId) feed = feed.filter((p) => p.audience.mode === "group" && (p.audience as any).groupId === groupId); else if (filter === "mine") feed = feed.filter((p) => p.authorId === me); else if (filter !== "all") feed = feed.filter((p) => p.audience.mode === "group" && (p.audience as any).groupId === filter);
  return (<div className="col">
    {!groupId && <Stories me={me} />}
    <div className="card row"><Avatar u={user} /><button className="inp grow" style={{ textAlign: "left", color: "var(--mute)" }} onClick={() => setCompose(true)}>Quoi de neuf avec vos proches ?</button><button className="btn sm" onClick={() => setCompose(true)}><Ico n="img" s={18} /></button></div>
    {!groupId && <div className="tabs"><button className={"chip" + (filter === "all" ? " on" : "")} onClick={() => setFilter("all")}>Tout</button><button className={"chip" + (filter === "mine" ? " on" : "")} onClick={() => setFilter("mine")}>Mes publications</button>{groups.map((g) => <button key={g.id} className={"chip" + (filter === g.id ? " on" : "")} onClick={() => setFilter(g.id)}>{g.emoji} {g.name}</button>)}</div>}
    {!feed.length && <div className="card center muted">Rien ici pour l'instant. Publiez votre premier moment ✨</div>}
    {feed.map((p) => <PostCard key={p.id} post={p} me={me} />)}
    {compose && <Composer groupId={groupId} onClose={() => setCompose(false)} />}
  </div>);
}
export { Composer as ComposerModal };

function ShareAsk({ post, onClose }: { post: Post; onClose: () => void }) {
  const s = useStore((x) => x); const me = s.me; const author = userOf(s, post.authorId); const [sel, setSel] = useState<string[]>([]); const [note, setNote] = useState("");
  const friends = (s.social.friends[me] || []).filter((f) => f !== post.authorId).map((i) => userOf(s, i)!).filter(Boolean);
  return (<Modal title="Demander à partager" onClose={onClose}><div className="col">
    <p className="muted small">Ce contenu appartient à <b>{author?.name}</b>. Il décide s'il accepte. S'il accepte, vos amis choisis verront <b>le contenu d'origine</b> (pas une copie), avec les mêmes durées, et {author?.name} pourra <b>retirer le partage à tout moment</b> : il disparaîtra alors chez tout le monde.</p>
    <div className="muted small">Partager avec :</div><div className="tabs" style={{ flexWrap: "wrap" }}>{friends.map((f) => <button key={f.id} className={"chip" + (sel.includes(f.id) ? " on" : "")} onClick={() => setSel((x) => (x.includes(f.id) ? x.filter((y) => y !== f.id) : [...x, f.id]))}>{f.name}</button>)}{!friends.length && <span className="muted">Vous n'avez pas d'autre ami.</span>}</div>
    <input className="inp" placeholder="Un petit mot pour l'auteur (facultatif)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
    <button className="btn" disabled={!sel.length} onClick={() => { const r = actions.requestShare(post.id, sel, note); toast(r.msg); if (r.ok) onClose(); }}>Envoyer la demande à {author?.name}</button></div></Modal>);
}
