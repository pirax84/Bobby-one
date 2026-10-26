import { useRef, useState } from "react";
import { useStore, actions, userOf, Album } from "../lib/store";
import { Audience, resolveRecipients } from "../lib/engine";
import { Ico, Modal, toast, fileToDataUrl } from "./common";
import { WmImage, VideoWm } from "./Wm";
import { PhotoView } from "./Chat";

const MAX_VIDEO = 3 * 1024 * 1024;
const readFile = (f: File) => new Promise<string>((ok, ko) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => ko(new Error("lecture")); r.readAsDataURL(f); });

/** Choisit un fichier photo ou vidéo et l'ajoute à l'album. */
function useAdd(albumId: string) {
  const ref = useRef<HTMLInputElement>(null); const [busy, setBusy] = useState(false);
  const input = <input ref={ref} type="file" accept="image/*,video/*" hidden onChange={async (e) => {
    const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; setBusy(true);
    try {
      if (f.type.startsWith("video/")) { if (f.size > MAX_VIDEO) { toast("Vidéo trop lourde : 3 Mo au maximum pour l'instant (environ 10 secondes)."); setBusy(false); return; } const r = actions.addToAlbum(albumId, { video: await readFile(f) }); toast(r.ok ? "Vidéo ajoutée." : r.error || "Erreur"); }
      else if (f.type.startsWith("image/")) { const r = actions.addToAlbum(albumId, { img: await fileToDataUrl(f, 1000) }); toast(r.ok ? "Photo ajoutée." : r.error || "Erreur"); }
      else toast("Choisissez une photo ou une vidéo.");
    } catch { toast("Fichier illisible."); }
    setBusy(false); }} />;
  return { input, busy, open: () => ref.current?.click() };
}

export function Tile({ p, me, onOpen }: { p: { id: string; img?: string | null; video?: string | null; authorId: string; viewSecs: number }; me: string; onOpen: () => void }) {
  const name = useStore((s) => userOf(s, me)?.name || "");
  return <button className="card" onClick={onOpen} aria-label={p.video ? "Ouvrir la vidéo" : "Ouvrir la photo"} style={{ margin: 0, padding: 8, color: "inherit", textAlign: "left" }}><div className="protected" style={{ pointerEvents: "none", position: "relative" }}>{p.video ? <><VideoWm src={p.video} label={name} poster /><span className="play">▶</span></> : <WmImage src={p.img!} label={name} alt="Photo" style={{ aspectRatio: "1", objectFit: "cover" }} />}</div></button>;
}

export function AlbumView({ album, onBack }: { album: Album; onBack: () => void }) {
  const s = useStore((x) => x); const me = s.me; const mineA = album.ownerId === me; const add = useAdd(album.id);
  const items = s.posts.filter((p) => p.albumId === album.id && (p.authorId === me || p.recipients.includes(me)));
  const [open, setOpen] = useState<string | null>(null); const show = (id: string) => { history.pushState({ ...(history.state || {}), photo: 1 }, ""); setOpen(id); };
  const who = album.audience.mode === "me" ? "🔒 Privé : vous seul" : mineA ? `👥 Partagé avec ${album.recipients.length} personne${album.recipients.length > 1 ? "s" : ""}` : `👥 Album de ${userOf(s, album.ownerId)?.name}`;
  return (<div className="col"><div className="row"><button className="btn ghost sm" onClick={onBack} aria-label="Retour aux albums"><Ico n="back" s={18} /></button><h2 className="grow" style={{ margin: 0 }}>{album.name}</h2>{mineA && <button className="btn danger sm" onClick={() => { if (confirm("Supprimer cet album et tout ce qu'il contient, y compris chez ceux qui le voient ?")) { actions.deleteAlbum(album.id); onBack(); } }} aria-label="Supprimer l'album"><Ico n="trash" s={16} /></button>}</div>
    <div className="muted small">{who}</div>{add.input}
    {mineA && <button className="btn" onClick={add.open} disabled={add.busy}><Ico n="plus" s={16} /> {add.busy ? "Chargement…" : "Ajouter une photo ou une vidéo"}</button>}
    {items.length ? <div className="grid2">{items.map((p) => <Tile key={p.id} p={p} me={me} onOpen={() => show(p.id)} />)}</div> : <p className="muted">{mineA ? "Album vide : ajoutez une première photo ou vidéo." : "Rien dans cet album pour l'instant."}</p>}
    <p className="muted small">🔒 Mêmes règles que partout : filigrane à votre nom, captures bloquées dans l'application Android, aucun partage sans l'accord de l'auteur.</p>
    {open && <PhotoView id={open} onClose={() => setOpen(null)} />}</div>);
}

export function Media() {
  const s = useStore((x) => x); const me = s.me; const [tab, setTab] = useState<"photos" | "videos" | "albums">("photos"); const [al, setAl] = useState<string | null>(null);
  const [mk, setMk] = useState(false); const [name, setName] = useState(""); const [mode, setMode] = useState<"me" | "all" | "only">("me"); const [sel, setSel] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null); const show = (id: string) => { history.pushState({ ...(history.state || {}), photo: 1 }, ""); setOpen(id); };
  const friends = (s.social.friends[me] || []).map((i) => userOf(s, i)!).filter(Boolean);
  const albums = s.albums.filter((a) => a.ownerId === me || a.recipients.includes(me));
  const auto = s.albums.find((a) => a.ownerId === me && a.auto);
  const photosMine = s.posts.filter((p) => p.authorId === me && p.img && !p.video && !p.albumId && !p.story);
  const photosShared = s.posts.filter((p) => p.authorId !== me && p.img && !p.video && !p.albumId && !p.purged && p.viewSecs === 0 && p.recipients.includes(me));
  const videos = s.posts.filter((p) => p.video && (p.authorId === me || p.recipients.includes(me)));
  const addVideo = () => { let id = auto?.id; if (!id) { const r = actions.createAlbum("Mes vidéos", { mode: "me" }); id = r.id; if (id) actions.markAutoAlbum(id); } toast("Choisissez la vidéo ensuite."); setTimeout(() => document.getElementById("vid-input")?.click(), 50); };
  const create = () => { const aud: Audience = mode === "me" ? { mode: "me" } : mode === "all" ? { mode: "all" } : { mode: "only", ids: sel }; const r = actions.createAlbum(name, aud); if (!r.ok) return toast(r.error || "Erreur"); setMk(false); setName(""); setSel([]); setMode("me"); if (r.id) setAl(r.id); };
  const cur = al ? albums.find((a) => a.id === al) : null;
  const Grid = ({ l }: { l: typeof photosMine }) => <div className="grid2">{l.map((p) => <Tile key={p.id} p={p} me={me} onOpen={() => show(p.id)} />)}</div>;
  const count = (a: Album) => s.posts.filter((p) => p.albumId === a.id && (p.authorId === me || p.recipients.includes(me))).length;
  return (<div className="col"><h1>Photos et vidéos</h1>
    <div className="tabs"><button className={"chip" + (tab === "photos" ? " on" : "")} onClick={() => { setTab("photos"); setAl(null); }}>📷 Photos</button><button className={"chip" + (tab === "videos" ? " on" : "")} onClick={() => { setTab("videos"); setAl(null); }}>🎬 Vidéos</button><button className={"chip" + (tab === "albums" ? " on" : "")} onClick={() => setTab("albums")}>🗂 Albums</button></div>
    {tab === "photos" && <><h3>Mes photos</h3>{photosMine.length ? <Grid l={photosMine} /> : <p className="muted">Vos photos publiées apparaîtront ici.</p>}<h3>Partagées avec moi (permanentes)</h3>{photosShared.length ? <Grid l={photosShared} /> : <p className="muted">Rien pour l'instant.</p>}</>}
    {tab === "videos" && <><input id="vid-input" type="file" accept="video/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; if (f.size > MAX_VIDEO) return toast("Vidéo trop lourde : 3 Mo au maximum pour l'instant (environ 10 secondes)."); const a = actions.getAutoAlbum(); if (!a) return toast("Album introuvable."); const r = actions.addToAlbum(a, { video: await readFile(f) }); toast(r.ok ? "Vidéo ajoutée (privée, dans « Mes vidéos »)." : r.error || "Erreur"); }} />
      <button className="btn" onClick={addVideo}><Ico n="plus" s={16} /> Ajouter une vidéo</button>
      {videos.length ? <div className="grid2">{videos.map((p) => <Tile key={p.id} p={p} me={me} onOpen={() => show(p.id)} />)}</div> : <p className="muted">Pas encore de vidéo. Pour l'instant : courtes (environ 10 secondes, 3 Mo max). Les vidéos plus longues viendront avec le serveur.</p>}
      <p className="muted small">Pour partager une vidéo avec des amis, mettez-la dans un album partagé (onglet Albums).</p></>}
    {tab === "albums" && (cur ? <AlbumView album={cur} onBack={() => setAl(null)} /> : <><button className="btn" onClick={() => setMk(true)}><Ico n="plus" s={16} /> Nouvel album</button>
      {albums.length ? <div className="col" style={{ gap: 8 }}>{albums.map((a) => <button key={a.id} className="card row" style={{ color: "inherit", textAlign: "left" }} onClick={() => setAl(a.id)}><span style={{ fontSize: "1.6rem" }}>{a.audience.mode === "me" ? "🔒" : "👥"}</span><span className="grow"><b>{a.name}</b><span className="muted small" style={{ display: "block" }}>{a.ownerId === me ? (a.audience.mode === "me" ? "Privé" : `Partagé avec ${a.recipients.length}`) : `De ${userOf(s, a.ownerId)?.name}`} · {count(a)} élément{count(a) > 1 ? "s" : ""}</span></span></button>)}</div> : <p className="muted">Aucun album. Créez-en un, privé ou partagé avec vos amis.</p>}</>)}
    {mk && <Modal title="Nouvel album" onClose={() => setMk(false)}><div className="col"><input className="inp" placeholder="Nom (ex. Vacances 2026)" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
      <div className="tabs wrap">{([["me", "🔒 Privé"], ["all", "👥 Tous mes amis"], ["only", "✅ Amis choisis"]] as const).map(([k, l]) => <button key={k} className={"chip" + (mode === k ? " on" : "")} onClick={() => { setMode(k); setSel([]); }}>{l}</button>)}</div>
      {mode === "only" && <div className="tabs wrap">{friends.map((f) => <button key={f.id} className={"chip" + (sel.includes(f.id) ? " on" : "")} onClick={() => setSel((x) => (x.includes(f.id) ? x.filter((y) => y !== f.id) : [...x, f.id]))}>{f.name}</button>)}</div>}
      <p className="muted small" style={{ margin: 0 }}>{mode === "me" ? "Vous seul le verrez." : `${resolveRecipients(s.social, me, mode === "all" ? { mode: "all" } : { mode: "only", ids: sel }).length} ami(s) pourront le voir. Seuls vos amis voient, et personne ne peut repartager sans votre accord.`}</p>
      <button className="btn" disabled={!name.trim() || (mode === "only" && !sel.length)} onClick={create}>Créer l'album</button></div></Modal>}
    {open && <PhotoView id={open} onClose={() => setOpen(null)} />}</div>);
}
