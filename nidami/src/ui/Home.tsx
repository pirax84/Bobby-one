import { catsOf } from "../lib/cats";
import { soundEnd } from "../lib/fx";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Eph } from "./Vanish";
import { createPortal } from "react-dom";
import { useStore, getState as useStoreGet, actions, userOf, State } from "../lib/store";
import { Post, Audience, feedFor, storiesFor, checkAccess, accessFor, originalOf, resolveRecipients, fmtSecs, VIEW_CHOICES, MAX_CUSTOM_SECS } from "../lib/engine";
import { micText, Wreath, MicIcon, Avatar, Ico, Modal, toast, ago, fileToDataUrl, BG, EMOJIS, EmojiGrid, useNow, lp, ConfirmDel, pressProps, isBirthday, topEmojis, bumpEmoji, Switch, useScrollLock } from "./common";
import { ReactorsModal, EmojiSheet, CommentSheet } from "./Reactions";
import { WmImage, VideoWm, useCaptureGuard } from "./Wm";
import { Recorder, Camera } from "./Recorder";
import { Framer, FRAME0, bakeFrame, FaceHide, AvatarCrop, type Frame } from "./Photo";
import { AudioWave } from "./AudioWave";
import { LinkCard, safeUrl } from "./Links";
import { t } from "../i18n";
import { MemoryCard, ArrivedModal } from "./Extras";
import { usePeer, peerColor, PEER } from "../lib/peers";
import { usePref } from "../lib/uipref";
import { TopNplus } from "./QuickVoice";

// ───────── Barre des stories
/** Aperçu d'une story dans la bulle : la photo ou la vidéo ; jamais pour une story éphémère (elle reste cachée). */
function preview(posts: Post[], u?: { avatar?: string | null }): { img?: string | null; video?: string | null; bg?: string; icon?: string; blur?: boolean } {
  const p = [...posts].sort((x, y) => y.createdAt - x.createdAt)[0]; if (!p) return {};
  const blur = p.viewSecs > 0 ? true : undefined;
  if (p.img) return { img: p.img, blur }; if (p.video) return { video: p.video, blur }; if (p.viewSecs > 0) return { icon: "⏱" }; if (p.audio) return { icon: "mic" };
  if (p.bg !== undefined) return { bg: BG[p.bg % BG.length] };
  return u?.avatar ? { img: u.avatar } : {};
}
export function Stories({ me }: { me: string }) {
  const posts = useStore((s) => s.posts); const social = useStore((s) => s.social); const users = useStore((s) => s.users); const now = useNow(5000);
  const [open, setOpen] = useState<string | null>(null); 
  const list = storiesFor(posts, me, now, social); const byAuthor = [...new Set(list.map((p) => p.authorId))];
  const mid = usePref("mid", "plus"); 
  return (<><div className="stories">
    {mid === "mic" && <TopNplus />}
    {byAuthor.map((a) => { const u = users.find((x) => x.id === a); const seen = a !== me && list.filter((p) => p.authorId === a).every((p) => p.views[me] !== undefined);
      return <button key={a} className="story" onClick={() => setOpen(a)}><span className={"wreath" + (seen ? " seen" : "")}><Wreath {...preview(list.filter((p) => p.authorId === a), u)} /></span><div className="ell">{a === me ? t("Moi") : (u?.name || "").split(" ")[0]}</div></button>; })}
  </div>
  {open && <StoryViewer authorId={open} me={me} onClose={() => setOpen(null)} />}
</>);
}
function VoiceBox({ p, auto, story, onEnd, onTime }: { p: { audio?: string | null; text?: string }; auto: boolean; story: boolean; onEnd?: () => void; onTime?: (cur: number, dur: number) => void }) {
  const [lv, setLv] = useState(0);
  return <div className="tbg" style={{ width: "min(560px,100%)", minHeight: 240, flexDirection: "column", gap: 14 }}><MicIcon size={120} level={lv} /><AudioWave src={p.audio!} autoPlay={auto || story} mine onEnded={onEnd} onTime={onTime} onLevel={setLv} />{p.text && <div>{p.text}</div>}</div>;
}
function MediaBox({ p, label, auto = false, story = false, onEnd, onTime }: { p: { video?: string | null; audio?: string | null; text?: string; nowm?: boolean }; label: string; auto?: boolean; story?: boolean; onEnd?: () => void; onTime?: (cur: number, dur: number) => void }) {
  if (p.video) return <div style={{ width: "min(560px,100%)" }}><VideoWm src={p.video} label={label} bare={story} plain={!!p.nowm} onEnded={onEnd} onTime={onTime} /></div>;
  if (p.audio) return <VoiceBox p={p} auto={auto} story={story} onEnd={onEnd} onTime={onTime} />;
  return null;
}
function StoryViewer({ authorId, me, onClose }: { authorId: string; me: string; onClose: () => void }) {
  useScrollLock();
  const posts = useStore((s) => s.posts); const social = useStore((s) => s.social); const users = useStore((s) => s.users);
  const items = useMemo(() => storiesFor(posts, me, Date.now(), social).filter((p) => p.authorId === authorId), [authorId]);
  const [delStory, setDelStory] = useState(false); const [seenOpen, setSeenOpen] = useState(false); const [menuOpen, setMenuOpen] = useState(false); const [i, setI] = useState(0); const tS = useMemo(() => Date.now(), [i]); const [reply, setReply] = useState(""); const [pop, setPop] = useState<string | null>(null); const [more, setMore] = useState(false); const p = items[i]; const dur = p && p.viewSecs > 0 && p.authorId !== me ? p.viewSecs * 1000 : p.video || p.audio ? 90000 : 6000; const [prog, setProg] = useState(0); const media = !!(p && (p.video || p.audio)); const myName = users.find((x) => x.id === me)?.name || "";
  const hidden = useCaptureGuard(() => { if (p) actions.suspectCapture(p.id); toast(t("Capture bloquée : l'auteur sera prévenu.")); }, true);
  const next = () => (i + 1 < items.length ? setI(i + 1) : onClose());
  useEffect(() => { if (!p) return onClose(); setProg(0); actions.open(p.id); const tx = authorId === me && !(p.video || p.audio) ? 0 : window.setTimeout(next, dur); return () => clearTimeout(tx); }, [i]);
  const likesOn = useStore((s) => s.settings[authorId]?.likes !== false);
  const live = posts.find((x) => x.id === p?.id); if (!p || !live) return null; const u = users.find((x) => x.id === authorId);
  return (<div className={"viewer protected" + (hidden ? " blur" : "")} role="dialog" aria-label={t("Story")} onClick={(e) => { if ((e.target as HTMLElement).closest("button,input,textarea,form,a")) return; if (e.clientX > window.innerWidth / 2) next(); else if (i > 0) setI(i - 1); }}>
    <div className="bar">{media ? <i style={{ width: "100%", transform: `scaleX(${prog})`, transformOrigin: "left", animation: "none" }} key={i} /> : <i style={{ width: "100%", animation: `sg ${dur / 1000}s linear`, transformOrigin: "left" }} key={i} />}</div>
    <style>{"@keyframes sg{from{transform:scaleX(0)}to{transform:scaleX(1)}}"}</style>
    <div className="row" style={{ width: "min(560px,100%)" }}><Avatar u={u} s={36} /><b className="grow">{u?.name}</b><span className="muted small">{ago(live.createdAt)}</span>{authorId === me && <><button type="button" className="storychip" onClick={() => { setSeenOpen(!seenOpen); setMenuOpen(false); }} aria-label={t("Vu par")} aria-expanded={seenOpen}><Ico n="eye" s={16} />{" "}{Object.keys(live.views).length}</button><button type="button" className="btn ghost sm" onClick={() => { setMenuOpen(!menuOpen); setSeenOpen(false); }} aria-label={t("Options")} aria-expanded={menuOpen}><Ico n="more" s={18} /></button></>}<button className="btn ghost sm" onClick={onClose} aria-label={t("Fermer")}><Ico n="x" s={18} /></button></div>
    {authorId === me && seenOpen && <div className="card col" style={{ width: "min(560px,100%)", gap: 8 }}><b className="small">{t("Vu par")}</b>{Object.keys(live.views).length ? Object.keys(live.views).map((v) => { const vu = users.find((x) => x.id === v); return <div key={v} className="row" style={{ gap: 10, alignItems: "center" }}><Avatar u={vu} s={30} /><span>{vu?.name}</span></div>; }) : <span className="muted">{t("personne pour l'instant")}</span>}</div>}
    {authorId === me && menuOpen && <div className="card col" style={{ width: "min(560px,100%)", gap: 8 }}><b className="small">{t("⏱ Durée pour chaque ami qui la regarde")}</b><div className="row wrap" style={{ gap: 6 }}>{[[0, t("Normale")], [5, "5 s"], [10, "10 s"], [30, "30 s"]].map(([n, l]) => <button key={n} type="button" className={"chip" + (live.viewSecs === n ? " on" : "")} onClick={() => { actions.setViewSecs(live.id, n as number); toast(n ? t("Cette story disparaîtra {l} après l'ouverture.", { l: String(l) }) : t("Story normale (24 h).")); setMenuOpen(false); }}>{l}</button>)}</div><button type="button" className="btn danger" onClick={() => { setMenuOpen(false); setDelStory(true); }}><Ico n="trash" s={16} />{" "}{t("Supprimer cette story")}</button></div>}
    {(() => { const Es = (kind: "photo" | "mask" | "burn" | "fog", src: string | undefined, n: ReactNode) => authorId !== me && live.viewSecs > 0 ? <Eph key={live.id} kind={kind} id={live.id} src={src} start={tS} total={live.viewSecs * 1000} clear={live.viewSecs * 550}>{n}</Eph> : n;
      return live.video ? Es("fog", undefined, <MediaBox key={live.id} p={live} label={myName} story onEnd={next} onTime={(c, d) => setProg(Math.min(1, c / (isFinite(d) && d > 0 ? d : 10)))} />) : live.audio ? Es("mask", undefined, <MediaBox key={live.id} p={live} label={myName} story onEnd={next} onTime={(c, d) => setProg(Math.min(1, c / (isFinite(d) && d > 0 ? d : 10)))} />) : live.img ? Es("photo", live.img, <div style={{ width: "min(560px,100%)" }}><WmImage src={live.img} plain={!!live.nowm} label={myName} alt={t("Story")} style={{ borderRadius: 18 }} /></div>) : Es("mask", undefined, <div className="tbg" style={{ background: BG[(live.bg || 0) % BG.length], width: "min(560px,100%)", minHeight: 320 }}>{live.text}</div>); })()}
    {live.img && live.text && <p>{live.text}</p>}
    {authorId === me ? <>{delStory && <ConfirmDel what={t("cette story")} onYes={() => { actions.deletePost(live.id); onClose(); }} onClose={() => setDelStory(false)} />}</>
      : <div className="col" style={{ width: "min(560px,100%)", gap: 10 }}>
        <form className="row" style={{ gap: 8 }} onSubmit={(e) => { e.preventDefault(); if (!reply.trim()) return; const c = actions.startDm(authorId); actions.send(c, t("↩️ Réponse à votre story : {reply}", { reply })); setReply(""); toast(t("Réponse envoyée en privé.")); }}>
          <input className="inp grow" style={{ minHeight: 52, fontSize: "1.05rem", borderRadius: 18 }} placeholder={t("Répondre en privé…")} value={reply} onChange={(e) => setReply(e.target.value)} aria-label={t("Répondre en privé…")} />
          <button className="btn micbtn" style={{ width: 52, height: 52 }} disabled={!reply.trim()} aria-label={t("Envoyer")}><Ico n="send" s={20} /></button></form>
        {likesOn && <div className="row" style={{ gap: 6, overflowX: "auto", paddingBottom: 2 }}>{topEmojis(me).map((e) => <button key={e} className={"react big" + (live.reactions[me] === e ? " on" : "")} onClick={() => { actions.react(live.id, e); bumpEmoji(me, e); setPop(e); setTimeout(() => setPop(null), 900); }} aria-label={t("Réagir {e}", { e })}>{e}</button>)}<button className="react big" onClick={() => setMore(!more)} aria-label={t("Plus d'émoticônes")}>＋</button></div>}
        {likesOn && more && <div className="empanel" style={{ maxHeight: 190 }}><EmojiGrid onPick={(e) => { actions.react(live.id, e); bumpEmoji(me, e); setPop(e); setMore(false); setTimeout(() => setPop(null), 900); }} onClose={() => setMore(false)} /></div>}
      </div>}
    {pop && <div className="reactpop" aria-hidden="true">{pop}</div>}
  </div>);
}

// ───────── Publier
const audOpts = (): [string, string][] => [["all", t("Tous mes amis")], ["group", t("Un groupe")], ["only", t("Amis sélectionnés")], ["except", t("Tous sauf…")], ["list", t("Une liste")], ["cat", t("Une catégorie")], ["me", t("Moi uniquement")]];
export function Composer({ onClose, story = false, groupId, init, alsoWall = false }: { onClose: () => void; story?: boolean; groupId?: string; alsoWall?: boolean; init?: { kind: "text" | "photo" | "video" | "audio" | "link"; vid?: string; img?: string; aud?: string } }) {
  const s = useStore((x) => x); const me = s.me; const friends = (s.social.friends[me] || []).map((id) => userOf(s, id)!).filter(Boolean);
  const groups = s.social.groups.filter((g) => g.memberIds.includes(me)); const lists = s.social.lists.filter((l) => l.ownerId === me);
  const [linkUrl, setLinkUrl] = useState(""); const [newL, setNewL] = useState(false); const [lname, setLname] = useState(""); const [lsel, setLsel] = useState<string[]>([]); const [kind, setKind] = useState<"text" | "photo" | "video" | "audio" | "link">(init?.kind || "text"); const [vid, setVid] = useState<string | null>(init?.vid || null); const [aud0, setAud0] = useState<string | null>(init?.aud || null); const [recK, setRecK] = useState<"video" | "audio" | null>(init?.kind === "audio" ? "audio" : init?.kind === "video" && !init.vid ? "video" : null); const [text, setText] = useState(""); const [img, setImg] = useState<string | null>(init?.img || null); const [bg, setBg] = useState(0); const [mood, setMood] = useState("");
  const [mode, setMode] = useState<string>(groupId ? "group" : "all"); const [sel, setSel] = useState<string[]>([]); const [gid, setGid] = useState(groupId || groups[0]?.id || ""); const [lid, setLid] = useState(lists[0]?.id || ""); const mycats = catsOf(s.social, me); const [cid, setCid] = useState("family");
  const [secs, setSecs] = useState(0); const [custom, setCustom] = useState(""); const [sdur, setSdur] = useState<"24h" | "inf" | "eph">("24h"); const [busy, setBusy] = useState(false); const [wm, setWm] = useState(true); const [frame, setFrame] = useState<Frame>(FRAME0); const [fh, setFh] = useState(false); const [crop, setCrop] = useState(false); const file = useRef<HTMLInputElement>(null);
  const aud: Audience = mode === "group" ? { mode: "group", groupId: gid } : mode === "only" ? { mode: "only", ids: sel } : mode === "except" ? { mode: "except", ids: sel } : mode === "list" ? { mode: "list", listId: lid } : mode === "cat" ? { mode: "cat", catId: cid } : mode === "me" ? { mode: "me" } : { mode: "all" };
  const count = resolveRecipients(s.social, me, aud).length; const eff = custom ? Number(custom) : secs;
  const validCustom = !custom || (Number.isInteger(Number(custom)) && Number(custom) >= 1 && Number(custom) <= MAX_CUSTOM_SECS);
  const pick = async (f?: File) => { if (!f) return; if (!f.type.startsWith("image/")) return toast(t("Choisissez une image.")); setBusy(true); try { setImg(await fileToDataUrl(f)); setKind("photo"); } catch { toast(t("Impossible de lire cette image.")); } setBusy(false); };
  const ok = (kind === "photo" ? !!img : kind === "video" ? !!vid : kind === "audio" ? !!aud0 : kind === "link" ? !!safeUrl(linkUrl) : text.trim().length > 0) && validCustom && (mode !== "only" || sel.length > 0) && !(story && sdur === "eph" && !(eff > 0));
  const go = async () => { const imgOut = kind === "photo" && img ? await bakeFrame(img, frame) : img; const r = actions.publish({ kind: kind === "link" ? "text" : kind, link: kind === "link" ? safeUrl(linkUrl) || undefined : undefined, text, img: kind === "photo" ? imgOut : null, video: kind === "video" ? vid : null, audio: kind === "audio" ? aud0 : null, bg, mood, audience: aud, viewSecs: story ? (sdur === "eph" ? eff : 0) : eff, permanent: story ? sdur === "inf" : eff === 0, story, nowm: (kind === "photo" || kind === "video") && !wm }); if (!r.ok) return toast(r.error || t("Erreur")); soundEnd(); if (story && alsoWall && (kind === "photo" || kind === "video")) actions.publish({ kind, text, img: kind === "photo" ? img : null, video: kind === "video" ? vid : null, audio: null, bg, mood, audience: aud, viewSecs: 0, permanent: true, story: false }); toast(story ? (sdur === "inf" ? t("Story publiée, sans limite de durée.") : sdur === "eph" ? t("Story éphémère publiée.") : t("Story publiée pour 24 h.")) : t("Publié !")); onClose(); };
  const toggle = (id: string) => setSel((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));
  const [em, setEm] = useState(false); const durVal = custom ? "c" : String(secs); const setDur = (v: string) => { if (v === "c") { setCustom("10"); } else { setCustom(""); setSecs(Number(v)); } };
  const audLabel = audOpts().find(([k]) => k === mode)?.[1] || "";
  return (<Modal title={init?.kind === "audio" && !story ? t("🎤 Message vocal") : story ? t("✨ Ma story") : t("📝 Nouvelle publication")} onClose={onClose}><div className={"col composer" + (init?.kind === "audio" && !story ? " voice" + (aud0 ? "" : " pre") : "")} style={{ gap: 8 }}>
    <input ref={file} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
    {story && <p className="muted small" style={{ margin: 0 }}>{t("Une story disparaît toute seule (24 h par défaut) et se regarde plein écran.")}</p>}
    <div className="tabs" role="tablist" aria-label={t("Type de contenu")}>{([["text", t("✏️ Texte")], ["photo", t("📷 Photo")], ["video", t("🤳 Selfie")], ["audio", t("🎤 Vocal")], ["link", t("🔗 Lien")]] as const).filter(([k]) => !(story && (k === "link" || k === "audio"))).map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={kind === k} className={"chip" + (kind === k ? " on" : "")} onClick={() => { setKind(k); setRecK(k === "video" && !vid ? "video" : null); if (k === "photo" && !img) file.current?.click(); }}>{micText(l)}</button>)}</div>
    {kind === "photo" && img && <div style={{ position: "relative" }}><Framer src={img} frame={frame} onChange={setFrame} /><button className="btn ghost sm" style={{ position: "absolute", top: 6, right: 6 }} onClick={() => { setImg(null); setKind("text"); }} aria-label={t("Retirer la photo")}><Ico n="x" s={16} /></button></div>}
    {kind === "photo" && img && <div className="col" style={{ gap: 12, margin: "10px 0 14px" }}><button className="btn" onClick={() => setFh(true)}>{t("🙂 Cacher des visages")}</button>
    {fh && img && <FaceHide src={img} onClose={() => setFh(false)} onDone={(u) => { setImg(u); setFrame(FRAME0); setFh(false); }} />}
    {crop && img && <AvatarCrop src={img} onClose={() => setCrop(false)} onDone={(u) => { actions.updateProfile({ avatar: u }); setCrop(false); toast(t("✅ Photo de profil modifiée !")); }} />}<button className="btn" onClick={() => setCrop(true)}>{t("👤 Utiliser comme photo de profil")}</button></div>}
    {kind === "photo" && !img && <button type="button" className="btn ghost" onClick={() => file.current?.click()}>{t("📷 Choisir une photo")}</button>}
    {kind === "video" && recK === "video" && <Camera onClose={() => setRecK(null)} onVideo={(u) => { setVid(u); setRecK(null); }} onPhoto={(u) => { setImg(u); setKind("photo"); setRecK(null); }} onAudio={(u) => { setAud0(u); setKind("audio"); setRecK(null); }} />}
    {(kind === "video" || kind === "audio") && (kind === "audio" && !aud0 ? <Camera startMode="voice" onVideo={(u) => { setVid(u); setKind("video"); setRecK(null); }} onPhoto={(u) => { setImg(u); setKind("photo"); setRecK(null); }} onAudio={(u) => setAud0(u)} onClose={() => (init?.kind === "audio" ? onClose() : setKind("text"))} />
      : (kind === "video" ? vid : aud0) ? <div className="card col" style={{ gap: 6 }}>{kind === "video" ? <video src={vid! + "#t=0.1"} poster="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" controls playsInline preload="metadata" className="vprev" /> : <AudioWave src={aud0!} />}{kind === "audio" ? <div className="row" style={{ gap: 8 }}><button type="button" className="btn ghost sm" onClick={() => setAud0(null)}>{t("🗑 Supprimer")}</button></div> : <button type="button" className="btn ghost sm" onClick={() => { setVid(null); setRecK(kind); }}>{t("🔁 Recommencer")}</button>}</div>
      : <button type="button" className="btn ghost" onClick={() => setRecK(kind)}>{kind === "video" ? t("🎥 Me filmer (10 s max)") : micText(t("🎤 Enregistrer un vocal (30 s max)"))}</button>)}
    {kind === "link" && <div className="col" style={{ gap: 8 }}><input className="inp" type="url" inputMode="url" placeholder={t("Collez un lien : playlist Spotify, Deezer ou YouTube, vidéo, Instagram, TikTok, Leboncoin…")} value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} aria-label={t("Lien à partager")} autoFocus />{safeUrl(linkUrl) ? <LinkCard url={safeUrl(linkUrl)!} /> : linkUrl.trim() && <p className="small" style={{ color: "var(--bad)", margin: 0 }}>{t("Ce lien n'a pas l'air valide.")}</p>}</div>}
    {story && kind === "text" ? <div className="tbg" style={{ background: BG[bg % BG.length], minHeight: 180 }}><textarea className="inp" rows={4} placeholder={t("Écrivez votre story…")} value={text} onChange={(e) => setText(e.target.value)} maxLength={300} aria-label={t("Texte de la story")} style={{ background: "transparent", border: 0, color: "#fff", textAlign: "center", fontSize: "1.2rem", fontWeight: 700, resize: "none", width: "100%" }} /></div>
      : <textarea className="inp" rows={kind === "text" ? 3 : 2} placeholder={kind === "text" ? t("Quoi de neuf avec vos proches ?") : t("Ajouter une légende (facultatif)…")} value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} aria-label={t("Texte")} />}
    <div className="row" style={{ gap: 6 }}>
      {!story && <button className={"tool" + (mood || em ? " on" : "")} onClick={() => setEm(!em)} aria-label={t("Humeur")}>{mood || "😊"}</button>}
      {kind === "text" && <div className="row grow" style={{ gap: 5, justifyContent: "flex-end" }}>{BG.map((b, i) => <button key={i} aria-label={t("Fond {v1}", { v1: (i + 1) })} onClick={() => setBg(i)} style={{ width: 22, height: 22, borderRadius: "50%", border: bg === i ? "2px solid #fff" : "0", background: b }} />)}</div>}
    </div>
    {em && <div className="empanel"><button className="chip" onClick={() => { setMood(""); setEm(false); }}>{t("Aucune humeur")}</button><EmojiGrid onPick={(e) => { setMood(e); setEm(false); }} onClose={() => setEm(false)} /></div>}
    <div className="opts">
      <label className="opt"><span>👥</span><select value={mode} onChange={(e) => { setMode(e.target.value); setSel([]); }} aria-label={t("Qui peut voir ?")}>{audOpts().map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
      {(kind === "photo" || kind === "video") && <label className="row small" style={{ gap: 8 }}><Switch on={wm} onChange={setWm} label={t("🛡 Filigrane (ton nom sur la photo)")} /><span>{t("🛡 Filigrane (ton nom sur la photo)")}</span></label>}
      {story ? <label className="opt"><span>⏳</span><select value={sdur} onChange={(e) => { const k = e.target.value as "24h" | "inf" | "eph"; setSdur(k); if (k === "eph" && !secs && !custom) setSecs(5); }} aria-label={t("Durée de la story")}><option value="24h">{t("24 heures")}</option><option value="inf">{t("Illimitée")}</option><option value="eph">{t("Éphémère")}</option></select></label> : null}
      {(!story || sdur === "eph") && <label className="opt"><span>⏱</span><select value={durVal} onChange={(e) => setDur(e.target.value)} aria-label={t("Durée de consultation")}>{!story && <option value="0">{t("Permanente")}</option>}{VIEW_CHOICES.map((v) => <option key={v} value={String(v)}>{fmtSecs(v)}</option>)}<option value="c">{t("Autre…")}</option></select></label>}
    </div>
    {custom !== "" && (!story || sdur === "eph") && <input className="inp" inputMode="numeric" placeholder={t("Secondes (1 à 999)")} value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, "").slice(0, 3))} aria-label={t("Durée personnalisée en secondes")} />}
    {mode === "group" && <select className="inp" value={gid} onChange={(e) => setGid(e.target.value)} aria-label={t("Groupe")}>{groups.map((g) => <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>)}</select>}
    {mode === "cat" && <select className="inp" value={cid} onChange={(e) => setCid(e.target.value)} aria-label={t("Catégorie")}>{mycats.map((c) => <option key={c.id} value={c.id}>{c.e} {c.n}</option>)}</select>}
    {mode === "list" && <div className="col" style={{ gap: 8 }}>
      {lists.length > 0 && <select className="inp" value={lid} onChange={(e) => setLid(e.target.value)} aria-label={t("Liste")}>{lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>}
      {!newL ? <button type="button" className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={() => setNewL(true)}>{t("＋ Créer une liste")}{lists.length ? " de plus" : ""}</button>
        : <div className="card col" style={{ gap: 8 }}><input className="inp" placeholder={t("Nom de la liste (ex. Collègues, Foot, Théâtre)")} value={lname} maxLength={30} onChange={(e) => setLname(e.target.value)} aria-label={t("Nom de la liste")} autoFocus />
          {friends.length ? <div className="tabs wrap">{friends.map((f) => <button key={f.id} type="button" className={"chip" + (lsel.includes(f.id) ? " on" : "")} onClick={() => setLsel((x) => (x.includes(f.id) ? x.filter((y) => y !== f.id) : [...x, f.id]))}>{f.name}</button>)}</div> : <p className="muted small" style={{ margin: 0 }}>{t("Ajoutez d'abord des amis pour les mettre dans une liste.")}</p>}
          <div className="row" style={{ gap: 8 }}><button type="button" className="btn ghost sm" onClick={() => { setNewL(false); setLname(""); setLsel([]); }}>{t("Annuler")}</button><button type="button" className="btn sm" disabled={!lname.trim() || !lsel.length} onClick={() => { const id = actions.createList(lname, lsel); setLid(id); setNewL(false); setLname(""); setLsel([]); toast(t("Liste créée.")); }}>{t("Créer la liste")}</button></div></div>}
    </div>}
    {(mode === "only" || mode === "except") && <div className="tabs wrap">{friends.map((f) => <button key={f.id} className={"chip" + (sel.includes(f.id) ? " on" : "")} onClick={() => toggle(f.id)}>{f.name}</button>)}</div>}
    {!validCustom && <p className="small" style={{ color: "var(--bad)" }}>{t("Entrez entre 1 et {MAX_CUSTOM_SECS} secondes.", { MAX_CUSTOM_SECS })}</p>}
    <p className="muted small" style={{ margin: 0 }}>{mode === "me" ? t("Visible par vous seulement.") : <span style={{ color: count ? "var(--ok)" : "var(--warm)" }}>{t("{audLabel} · {count} personne", { audLabel, count })}{count > 1 ? "s" : ""}</span>}{eff > 0 && (!story || sdur === "eph") ? t(" · {fmtSecs} par personne dès l'ouverture", { fmtSecs: fmtSecs(eff) }) : ""}</p>
    <button className="btn pubbtn" disabled={!ok || busy} onClick={go}>{busy ? t("Chargement…") : t("Publier")}</button></div></Modal>);
}

// ───────── Visionneuse éphémère
function Viewer({ postId, me, onClose }: { postId: string; me: string; onClose: () => void }) {
  const rp = useStore((s) => s.posts.find((p) => p.id === postId)); const all = useStore((s) => s.posts); const social = useStore((s) => s.social); const users = useStore((s) => s.users);
  const orig = rp ? originalOf(rp, all) : undefined; const post = rp && orig ? { ...orig, id: rp.id, views: rp.views } : rp;
  const now = useNow(100); const myName = users.find((x) => x.id === me)?.name || "";
  const hidden = useCaptureGuard(() => { actions.suspectCapture(postId); toast(t("Capture bloquée : l'auteur sera prévenu.")); }, true);
  const a = accessFor(rp, all, me, now, social); const t0 = useRef(0);
  useEffect(() => { if (!a.ok) onClose(); }, [a.ok]);
  if (!post || !a.ok) return null; const u = users.find((x) => x.id === post.authorId); const total = post.viewSecs * 1000; const left = a.remainingMs; if (!t0.current && left !== null) t0.current = Date.now() - (total - left); const E = (kind: "photo" | "mask" | "burn" | "fog", src: string | undefined, n: ReactNode) => left !== null && t0.current ? <Eph kind={kind} id={post.id} src={src} start={t0.current} total={total} clear={total * 0.55}>{n}</Eph> : n;
  return (<div className={"viewer protected" + (hidden ? " blur" : "")} role="dialog" aria-label={t("Publication éphémère")}>
    {left !== null && <div className="bar" aria-label={t("Temps restant")}><i style={{ width: `${Math.max(0, (left / total) * 100)}%` }} /></div>}
    <div className="row" style={{ width: "min(560px,100%)" }}><Avatar u={u} s={36} /><b className="grow">{u?.name}</b>{left !== null && <b style={{ color: "var(--warm)" }}>{t("{ceil} s", { ceil: Math.ceil(left / 1000) })}</b>}<button className="btn ghost sm" onClick={onClose} aria-label={t("Fermer")}><Ico n="x" s={18} /></button></div>
    {post.video ? E("fog", undefined, <MediaBox p={post} label={myName} auto />) : post.audio ? E("mask", undefined, <MediaBox p={post} label={myName} auto />) : post.img ? E("photo", post.img, <div style={{ width: "min(560px,100%)" }}><WmImage src={post.img} plain={!!post.nowm} label={myName} alt={t("Photo éphémère")} style={{ borderRadius: 18 }} /></div>) : E("mask", undefined, <div className="tbg" style={{ background: BG[(post.bg || 0) % BG.length], width: "min(560px,100%)", minHeight: 280 }}>{post.text}</div>)}
    {post.img && post.text && <p style={{ maxWidth: 560 }}>{post.text}</p>}
    {left !== null && <p className="muted small center" style={{ maxWidth: 520 }}>{t("Si vous fermez, le temps continue de s'écouler. Une photo peut toujours être photographiée avec un autre appareil.")}</p>}
  </div>);
}

// ───────── Une publication

/** Écrire à quelqu'un : ouvre sa conversation (si elle existe). */
function writeTo(uid: string, me: string): boolean {
  const c = useStoreGet().convs.find((x) => x.memberIds.length === 2 && x.memberIds.includes(uid) && x.memberIds.includes(me));
  if (!c) { toast("Pas encore de conversation avec cette personne."); return false; }
  window.dispatchEvent(new CustomEvent("notiif-open-conv", { detail: c.id })); return true;
}
function UserSheet({ uid, me, onClose }: { uid: string; me: string; onClose: () => void }) {
  const users = useStore((s) => s.users); const all = useStore((s) => s.posts); const social = useStore((s) => s.social); const u = users.find((x) => x.id === uid);
  const pr = usePeer(uid.startsWith("sb_") ? uid.slice(3) : undefined); const pc = pr ? peerColor(pr) : undefined; const [pubs, setPubs] = useState(false); const now = Date.now();
  const mine = all.filter((p) => p.authorId === uid && !p.story && accessFor(p, all, me, now, social).ok).sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
  return <Modal title={u?.name || ""} onClose={onClose}><div className="col" style={{ alignItems: "center", gap: 8, textAlign: "center" }}>
    <Avatar u={u} s={92} /><h2 style={{ margin: "6px 0 0" }}>{u?.name}</h2>
    {pr && <b style={{ color: pc }}>● {PEER[pr].label}</b>}
    {uid !== me && <button className="btn" style={{ minWidth: 200 }} onClick={() => { if (writeTo(uid, me)) onClose(); }}>✉ Écrire</button>}
    <button className="btn ghost" style={{ minWidth: 200 }} onClick={() => setPubs(!pubs)}>{pubs ? "Masquer ses publications" : "Voir ses publications"}</button>
    {pubs && <div className="col" style={{ width: "100%", gap: 8, textAlign: "left" }}>{mine.length ? mine.map((p) => <div key={p.id} className="card" style={{ padding: 10 }}><div className="muted small">{ago(p.createdAt, now)}</div><div>{p.text || (p.img ? "📷 Photo" : p.video ? "🎬 Vidéo" : p.audio ? "🎤 Message vocal" : "")}</div></div>) : <span className="muted">Rien à voir pour l'instant.</span>}</div>}
  </div></Modal>;
}
function PostCard({ post: rp, me }: { post: Post; me: string }) {
  const social = useStore((s) => s.social); const users = useStore((s) => s.users); const all = useStore((s) => s.posts); const shares = useStore((s) => s.shares); const now = useNow(1000); const [prof, setProf] = useState(false); const [view, setView] = useState(false); const [cm, setCm] = useState(""); const [cPick, setCPick] = useState<string | null>(null); const cmRef = useRef<HTMLInputElement>(null); const [delC, setDelC] = useState<string | null>(null); const [more, setMore] = useState(false); const [replyTo, setReplyTo] = useState<string | undefined>(); const [ask, setAsk] = useState(false); const [detail, setDetail] = useState(false); const [pick, setPick] = useState(false); const [cmEmoji, setCmEmoji] = useState(false); const [who, setWho] = useState(false); const [emoSheet, setEmoSheet] = useState(false); const [cmOpen, setCmOpen] = useState(false);
  const openCm = () => { history.pushState({ ...(history.state || {}), cm: 1 }, ""); setCmOpen(true); }; const closeCm = () => { if (history.state?.cm) history.back(); else setCmOpen(false); };
  useEffect(() => { if (!cmOpen) return; const f = () => setCmOpen(false); window.addEventListener("popstate", f); return () => window.removeEventListener("popstate", f); }, [cmOpen]);
  const openDetail = () => { history.pushState({ ...(history.state || {}), detail: 1 }, ""); setDetail(true); }; const closeDetail = () => { if (history.state?.detail) history.back(); else setDetail(false); };
  useEffect(() => { if (!detail) return; const f = () => setDetail(false); window.addEventListener("popstate", f); return () => window.removeEventListener("popstate", f); }, [detail]);
  const orig = originalOf(rp, all); const post = orig ? { ...orig, id: rp.id, viewSecs: rp.viewSecs, views: rp.views, recipients: rp.recipients, reactions: rp.reactions, comments: rp.comments, authorId: orig.authorId } : rp; const sharer = orig ? users.find((x) => x.id === rp.authorId) : undefined;
  const u = users.find((x) => x.id === post.authorId); const a = accessFor(rp, all, me, now, social); const mine = post.authorId === me; const eph = post.viewSecs > 0; const myShares = shares.filter((h) => h.postId === rp.id && h.status === "approved");
  const lock = !mine && eph && rp.authorId !== me; const expired = !a.ok;
  const likesOn = useStore((s) => s.settings[post.authorId]?.likes !== false); const commOn = useStore((s) => s.settings[post.authorId]?.comm !== false);
  const body = (() => {
    if (expired) return <div className="eph gone"><div style={{ fontSize: "2rem" }}>⌛</div><b>{t("Expirée pour vous")}</b><div className="muted small">{t("Votre temps de consultation est écoulé.")}</div></div>;
    if (lock) { const opened = rp.views[me] !== undefined; return <div className="eph ephv">{post.img ? <img className="ephbg" src={post.img} alt="" /> : post.video ? <video className="ephbg" src={post.video + "#t=0.1"} muted playsInline preload="metadata" /> : null}<div className="ephin"><div style={{ fontSize: "1.6rem" }}>{post.kind === "photo" ? "📸" : "✉️"}</div><b>{post.kind === "photo" ? t("Photo") : t("Message")}{" "}{t("éphémère")}</b>
      <div className="muted small" style={{ margin: "4px 0 12px" }}>{opened ? t("Il vous reste {n} s.", { n: Math.ceil((a.ok ? a.remainingMs || 0 : 0) / 1000) }) : t("Vous aurez {fmtSecs} à partir de l'ouverture.", { fmtSecs: fmtSecs(post.viewSecs) })}</div><button className="btn sm" onClick={() => { const r = actions.open(rp.id); if (r.ok) setView(true); }}><Ico n="eye" s={16} /> {opened ? t("Reprendre") : t("Ouvrir")}</button></div></div>; }
    return <>{(post.video || post.audio) && <MediaBox p={post} label={users.find((x) => x.id === me)?.name || ""} />}{post.img && <div className="protected"><WmImage src={post.img} plain={!!post.nowm} label={users.find((x) => x.id === me)?.name || ""} alt={post.text || t("Photo")} /></div>}{post.kind === "text" ? <div className={post.bg !== undefined ? "tbg" : ""} style={post.bg !== undefined ? { background: BG[post.bg % BG.length] } : undefined}>{post.text}</div> : post.text && <p style={{ margin: "10px 0 0" }}>{post.text}</p>}{post.link && <LinkCard url={post.link} />}</>;
  })();
  const canAsk = !mine && !orig && rp.authorId !== me && !post.story; const heart = pressProps(() => actions.react(rp.id, rp.reactions[me] ? rp.reactions[me] : "❤️"), () => setEmoSheet(true));
  const myReact = rp.reactions[me]; const counts = Object.values(rp.reactions).reduce<Record<string, number>>((m, e) => ((m[e] = (m[e] || 0) + 1), m), {});
  return (<article className="card col" style={{ gap: 10 }}>
    {prof && <UserSheet uid={rp.authorId} me={me} onClose={() => setProf(false)} />}
    <div className="row"><button type="button" className="avbtn" onClick={() => { if (rp.authorId !== me) writeTo(rp.authorId, me); else setProf(true); }} aria-label={"Écrire à " + (u?.name || "")}><Avatar u={u} /></button><div className="grow"><button type="button" className="namebtn" onClick={() => setProf(true)}><b>{u?.name}</b></button> {post.mood}<div className="muted small">{ago(post.createdAt, now)} · {audLabel(post, social)}{eph ? ` · ⏱ ${fmtSecs(post.viewSecs)}` : ""}</div></div>
      <div className="sumrow" aria-label={t("Réactions et commentaires")}>{likesOn && Object.keys(rp.reactions).length > 0 && <span className="sumbub" aria-label={t("Réactions")}>❤ {Object.keys(rp.reactions).length}</span>}{commOn && rp.comments.length > 0 && <span className="sumbub" aria-label={t("Commentaires")}>💬 {rp.comments.length}</span>}</div>{(mine || rp.authorId === me) && <button className="btn ghost sm" onClick={() => setMore(!more)} aria-label={t("Options")}><Ico n="more" s={18} /></button>}</div>
    {sharer && <div className="small" style={{ color: "var(--warm)" }}>{t("↪ Partagé par")}{" "}<b>{sharer.name}</b>{" "}{t("avec l'accord de {name}", { name: u?.name })}</div>}
    {more && (mine || rp.authorId === me) && <div className="row wrap">{!orig && <button className="btn danger sm" onClick={() => { if (confirm(t("Supprimer cette publication ? Les partages autorisés disparaissent aussi."))) actions.deletePost(rp.id); }}><Ico n="trash" s={16} />{" "}{t("Supprimer partout")}</button>}{orig && mine && <button className="btn danger sm" onClick={() => { if (confirm(t("Retirer ce partage ? Il disparaît chez {name} et ses amis.", { name: sharer?.name }))) actions.revokeShare(rp.shareId!); }}>{t("Retirer ce partage")}</button>}{orig && rp.authorId === me && <button className="btn danger sm" onClick={() => { if (confirm(t("Arrêter de partager ?"))) actions.revokeShare(rp.shareId!); }}>{t("Arrêter mon partage")}</button>}</div>}
    {(expired || lock) ? body : <div className="mediaw" onClick={openDetail} role="button" tabIndex={0} aria-label={t("Agrandir la publication")} onKeyDown={(e) => e.key === "Enter" && openDetail()}>{body}
</div>}
    {mine && eph && !orig && <div className="muted small"><Ico n="eye" s={14} />{" "}{t("Vu par {length}/{length2} :", { length: Object.keys(post.views).length, length2: post.recipients.length })}{" "}{Object.keys(post.views).map((v) => users.find((x) => x.id === v)?.name).join(", ") || t("personne pour l'instant")}</div>}
    {mine && !orig && myShares.length > 0 && <div className="small" style={{ color: "var(--warm)" }}>{t("↪ {n, plural, one{# partage autorisé} other{# partages autorisés}}", { n: myShares.length })}{" "}{t("par vous (voir « Partages »).")}</div>}
    {orig && mine && <div className="muted small">{t("Vu par")}{" "}{Object.keys(rp.views).map((v) => users.find((x) => x.id === v)?.name).join(", ") || t("personne pour l'instant")}{" "}{t("· Public du partage :")}{" "}{rp.recipients.map((v) => users.find((x) => x.id === v)?.name).join(", ")}</div>}
    {!expired && !lock && <>
      {(likesOn || commOn || canAsk) && <>
        <div className="actrow">
          {likesOn && <button type="button" className={"actmain" + (myReact ? " on" : "")} aria-label={t("Réagir : appui long pour choisir un emoji")} {...heart} onClick={(e) => { e.stopPropagation(); heart.onClick(); }} onContextMenu={(e) => e.preventDefault()}><span className="heartsym">{myReact || "♡"}</span><span className="heartdots" aria-hidden="true">⋯</span><span className="sr">{t("Réagir")}</span></button>}
          {commOn && <button type="button" className="actbtn" onClick={() => openCm()}>💬 {t("Commenter")}</button>}
          {canAsk && <button type="button" className="actbtn" onClick={() => setAsk(true)}>↪ {t("Partager")}</button>}</div></>}</>}
    {detail && createPortal(<div className="detail" role="dialog" aria-modal="true" aria-label={t("Publication")}>
      <div className="dhead"><button className="btn ghost sm" onClick={closeDetail} aria-label={t("Retour")} style={{ minWidth: 44 }}><Ico n="back" s={18} /></button><Avatar u={u} s={34} /><b className="grow ell">{u?.name} {post.mood}</b></div>
      <div className="dbody">
        <div className="protected">{body}</div>
        {likesOn && <>
        <div className="reactlist" style={{ marginTop: 12 }}><div className="row" style={{ marginBottom: 6 }}><b className="grow">{t("Réactions")}</b><button className="react" onClick={() => setPick(!pick)} aria-label={t("Réagir")}>{pick ? "✕" : (myReact || "♡") + " ＋"}</button></div>
          {Object.entries(rp.reactions).sort((x, y) => (counts[y[1] as string] || 0) - (counts[x[1] as string] || 0) || String(x[1]).localeCompare(String(y[1]))).map(([uid, e]) => <div key={uid} className="row reactrow"><span className="reactem">{e as string}</span><b className="ell">{(users.find((x) => x.id === uid)?.name || "?").split(" ")[0]}</b></div>)}
          {!Object.keys(rp.reactions).length && <div className="muted small">{t("Personne n'a encore réagi.")}</div>}</div>
        {pick && <div className="card" style={{ marginTop: 8 }}><EmojiGrid onPick={(e) => { actions.react(rp.id, e); setPick(false); }} onClose={() => setPick(false)} /></div>}
        </>}
        {commOn && <div className="col" style={{ gap: 8, marginTop: 14 }}>{rp.comments.length === 0 && <div className="muted small center">{t("Aucun commentaire pour l'instant. Soyez le premier !")}</div>}{(() => { const all = rp.comments; const ids = new Set(all.map((x) => x.id)); const tops = all.filter((x) => !x.replyTo || !ids.has(x.replyTo)); const flat: typeof all = []; const add = (c: (typeof all)[number]) => { flat.push(c); all.filter((r) => r.replyTo === c.id).forEach(add); }; tops.forEach(add);
          return flat.map((c) => { const depth = c.replyTo && ids.has(c.replyTo) ? 1 : 0; const au = users.find((x) => x.id === c.authorId); const cr: Record<string, number> = {}; Object.values(c.reacts || {}).forEach((e) => { cr[e] = (cr[e] || 0) + 1; }); const mineR = c.reacts?.[me];
            return <div key={c.id} className="row" style={{ alignItems: "flex-start", marginLeft: depth * 28 }}><Avatar u={au} s={30} /><div className="cbub grow" {...(c.authorId === me || rp.authorId === me ? lp(() => setDelC(c.id)) : {})}><b className="small">{au?.name}</b> <span className="muted small">{ago(c.at, now)}</span><div>{c.text}</div>
              <div className="row wrap" style={{ gap: 6, marginTop: 4 }}>{Object.entries(cr).map(([e, n]) => <button key={e} type="button" className={"react sm" + (mineR === e ? " on" : "")} onClick={() => actions.reactComment(rp.id, c.id, e)}>{e}<small> {n}</small></button>)}
                <button type="button" className="muted small cact" onClick={() => setCPick(cPick === c.id ? null : c.id)} aria-label={t("Réagir à ce commentaire")}>{cPick === c.id ? "✕" : "😊＋"}</button>
                <button type="button" className="muted small cact" onClick={() => { setReplyTo(c.id); setCm((x) => (x ? x : "@" + (au?.name || "") + " ")); setTimeout(() => cmRef.current?.focus(), 30); }}>{t("Répondre")}</button></div>
              {cPick === c.id && <div className="row wrap" style={{ gap: 6, marginTop: 6 }}>{EMOJIS.map((e) => <button key={e} type="button" className="react sm" onClick={() => { actions.reactComment(rp.id, c.id, e); setCPick(null); }}>{e}</button>)}</div>}</div></div>; }); })()}</div>}
      </div>
      {commOn && <div className="dfoot">{cmEmoji && <div className="card" style={{ maxHeight: 220, overflow: "auto", marginBottom: 8 }}><EmojiGrid onPick={(e) => setCm(cm + e)} onClose={() => setCmEmoji(false)} /></div>}
        {delC && <ConfirmDel what={t("ce commentaire")} onYes={() => actions.deleteComment(rp.id, delC)} onClose={() => setDelC(null)} />}
        {replyTo && <div className="row small muted" style={{ gap: 8, marginBottom: 6 }}><span className="grow ell">↩︎ {t("Réponse à {name}", { name: users.find((x) => x.id === rp.comments.find((y) => y.id === replyTo)?.authorId)?.name || "" })}</span><button type="button" className="btn ghost sm" onClick={() => { setReplyTo(undefined); setCm(""); }} aria-label={t("Annuler la réponse")}>✕</button></div>}<form className="row" onSubmit={(e) => { e.preventDefault(); actions.comment(rp.id, cm, replyTo); setCm(""); setReplyTo(undefined); setCmEmoji(false); }}><button type="button" className="btn ghost sm" onClick={() => setCmEmoji(!cmEmoji)} aria-label={t("Émoticônes")}>😊</button><input ref={cmRef} className="inp" placeholder={replyTo ? t("Votre réponse…") : t("Écrire un commentaire…")} value={cm} onChange={(e) => setCm(e.target.value)} aria-label={t("Commentaire")} /><button className="btn sm" disabled={!cm.trim()} aria-label={t("Envoyer")}><Ico n="send" s={16} /></button></form></div>}</div>, document.body)}
    {who && <ReactorsModal post={rp} onClose={() => setWho(false)} />}
    {emoSheet && <EmojiSheet onPick={(e) => actions.react(rp.id, e)} onClose={() => setEmoSheet(false)} />}
    {cmOpen && <CommentSheet postId={rp.id} me={me} onClose={closeCm} />}
    {view && <Viewer postId={rp.id} me={me} onClose={() => setView(false)} />}
    {ask && <ShareAsk post={rp} onClose={() => setAsk(false)} />}
  </article>);
}
function audLabel(p: Post, s: State["social"]) { const m = p.audience.mode; return m === "all" ? t("Tous les amis") : m === "me" ? t("Moi seul") : m === "group" ? s.groups.find((g) => g.id === (p.audience as any).groupId)?.name || t("Groupe") : m === "only" ? t("Amis choisis") : m === "except" ? t("Amis sauf…") : m === "cat" ? (catsOf(s as any, p.authorId).find((c) => c.id === (p.audience as any).catId)?.n || t("Catégorie")) : t("Liste"); }

function BirthdayBanner({ go }: { go?: (v: string, conv?: string) => void }) {
  const users = useStore((x) => x.users); const me = useStore((x) => x.me); const fr = useStore((x) => x.social.friends[x.me] || []);
  const l = Object.values(users).filter((u) => u.id !== me && fr.includes(u.id) && isBirthday(u.birthday, 0));
  if (!l.length) return null;
  const write = (u: { id: string; name: string }) => { if (!go) return; const nm = u.name.trim().split(/\s+/)[0]; const cid = actions.startDm(u.id); try { sessionStorage.setItem("notiif-draft-" + cid, t("Joyeux anniversaire {name} ! 🎂🎉 Je te souhaite une magnifique journée, pleine de belles choses. Bises !", { name: nm })); } catch { /* ignoré */ } go("messages", cid); };
  return <div className="bdchips">{l.map((u) => <button key={u.id} type="button" className="bdchip" onClick={() => write(u)} aria-label={t("Souhaiter son anniversaire à {name}", { name: u.name })}><Avatar u={u} s={26} /><span>{t("Anniversaire de {name}", { name: u.name.trim().split(/\s+/)[0] })}</span></button>)}</div>;
}
export function Home({ groupId, go }: { groupId?: string; go?: (v: string, conv?: string) => void }) {
  const me = useStore((s) => s.me); const posts = useStore((s) => s.posts); const social = useStore((s) => s.social); const now = useNow(2000); const [compose, setCompose] = useState(false); const [filter, setFilter] = useState("all");
  const user = useStore((s) => userOf(s, s.me)); const groups = social.groups.filter((g) => g.memberIds.includes(me));
  useEffect(() => { actions.tick(); }, [now]);
  let feed = feedFor(posts, me, now, social); if (groupId) feed = feed.filter((p) => p.audience.mode === "group" && (p.audience as any).groupId === groupId); else if (filter === "mine") feed = feed.filter((p) => p.authorId === me); else if (filter !== "all") feed = feed.filter((p) => p.audience.mode === "group" && (p.audience as any).groupId === filter);
  const [arr, setArr] = useState(false);
  return (<div className="col home-gap">
    {!groupId && <BirthdayBanner go={go} />}
    {!groupId && <Stories me={me} />}
    {!groupId && <MemoryCard />}
    {arr && <ArrivedModal onClose={() => setArr(false)} />}
    <div className="card row composebox"><Avatar u={user} /><button className="inp grow" style={{ textAlign: "left", color: "var(--mute)" }} onClick={() => setCompose(true)}>{t("Quoi de neuf avec vos proches ?")}</button><button className="btn sm" onClick={() => setCompose(true)}><Ico n="img" s={18} /></button></div>
    {!groupId && <div className="tabs"><button type="button" className="chip arrchip" onClick={() => setArr(true)}>👋 {t("Arrivé")}</button><button className={"chip" + (filter === "all" ? " on" : "")} onClick={() => setFilter("all")}>{t("Tout")}</button><button className={"chip" + (filter === "mine" ? " on" : "")} onClick={() => setFilter("mine")}>{t("Mes publications")}</button>{groups.map((g) => <button key={g.id} className={"chip" + (filter === g.id ? " on" : "")} onClick={() => setFilter(g.id)}>{g.emoji} {g.name}</button>)}</div>}
    {!feed.length && <div className="card center muted">{t("Rien ici pour l'instant. Publiez votre premier moment ✨")}</div>}
    {feed.map((p) => <PostCard key={p.id} post={p} me={me} />)}
    {compose && <Composer groupId={groupId} onClose={() => setCompose(false)} />}
  </div>);
}
/** Point d'entrée : appui simple = choisir (texte, photo, vocal, vidéo) ; appui long = caméra directe (selfie vidéo ou photo). */
export function QuickCompose({ onClose, story = false, groupId, long = false, kind, alsoWall = false }: { onClose: () => void; story?: boolean; groupId?: string; long?: boolean; kind?: "text" | "photo" | "audio" | "link"; alsoWall?: boolean }) {
  const [step, setStep] = useState<"choose" | "record" | "composer">(long ? "record" : kind ? "composer" : "choose"); const [vid, setVid] = useState<string | null>(null); const [aud, setAud] = useState<string | null>(null); const [photo, setPhoto] = useState<string | null>(null); const [k, setK] = useState<"text" | "photo" | "video" | "audio" | "link">(kind || "text");
  if (step === "composer") return <Composer story={story} alsoWall={alsoWall} groupId={groupId} onClose={onClose} init={aud ? { kind: "audio", aud } : vid ? { kind: "video", vid } : photo ? { kind: "photo", img: photo } : { kind: k }} />;
  const title = story ? t("✨ Ma story") : t("📝 Nouvelle publication");
  if (step === "choose") return <Modal title={title} onClose={onClose}><div className="col" style={{ gap: 10 }}>
    <button className="btn" onClick={() => { setK("text"); setStep("composer"); }}>{t("✏️ Écrire un texte")}</button>
    <button className="btn" onClick={() => { setK("photo"); setStep("composer"); }}>{t("📷 Photo")}</button>
    <button className="btn" onClick={() => { setK("audio"); setStep("composer"); }}>{micText(t("🎤 Message vocal"))}</button>
    <button className="btn" onClick={() => setStep("record")}>{t("🤳 Selfie")}</button>
    <p className="muted small center" style={{ margin: 0 }}>{t("Astuce : restez appuyé sur le bouton pour ouvrir directement la caméra.")}</p></div></Modal>;
  return <Camera onClose={onClose} onVideo={(u) => { setVid(u); setStep("composer"); }} onPhoto={(u) => { setPhoto(u); setStep("composer"); }} onAudio={(u) => { setAud(u); setStep("composer"); }} />;
}
export { Composer as ComposerModal };

function ShareAsk({ post, onClose }: { post: Post; onClose: () => void }) {
  const s = useStore((x) => x); const me = s.me; const author = userOf(s, post.authorId); const [sel, setSel] = useState<string[]>([]); const [note, setNote] = useState("");
  const friends = (s.social.friends[me] || []).filter((f) => f !== post.authorId).map((i) => userOf(s, i)!).filter(Boolean);
  return (<Modal title={t("Demander à partager")} onClose={onClose}><div className="col">
    <p className="muted small">{t("Ce contenu appartient à")}{" "}<b>{author?.name}</b>{t(". Il décide s'il accepte. S'il accepte, vos amis choisis verront")}{" "}<b>{t("le contenu d'origine")}</b>{" "}{t("(pas une copie), avec les mêmes durées, et {name} pourra", { name: author?.name })}{" "}<b>{t("retirer le partage à tout moment")}</b>{" "}{t(": il disparaîtra alors chez tout le monde.")}</p>
    <div className="muted small">{t("Partager avec :")}</div><div className="tabs" style={{ flexWrap: "wrap" }}>{friends.map((f) => <button key={f.id} className={"chip" + (sel.includes(f.id) ? " on" : "")} onClick={() => setSel((x) => (x.includes(f.id) ? x.filter((y) => y !== f.id) : [...x, f.id]))}>{f.name}</button>)}{!friends.length && <span className="muted">{t("Vous n'avez pas d'autre ami.")}</span>}</div>
    <input className="inp" placeholder={t("Un petit mot pour l'auteur (facultatif)")} value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
    <button className="btn" disabled={!sel.length} onClick={() => { const r = actions.requestShare(post.id, sel, note); toast(r.msg); if (r.ok) onClose(); }}>{t("Envoyer la demande à {name}", { name: author?.name })}</button></div></Modal>);
}
