import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { actions, useStore } from "../lib/store";
import type { Post } from "../lib/engine";
import { Avatar, Ico, Modal, EmojiGrid, ConfirmDel, ago, useNow } from "./common";
import { t } from "../i18n";

/** Liste de ceux qui ont réagi à une publication (pour son auteur) : qui, avec quel emoji. */
export function ReactorsModal({ post, onClose }: { post: Post; onClose: () => void }) {
  const users = useStore((s) => s.users); const rows = Object.entries(post.reactions);
  const counts = rows.reduce<Record<string, number>>((m, [, e]) => ((m[e as string] = (m[e as string] || 0) + 1), m), {});
  return (<Modal title={t("Qui a réagi ?")} onClose={onClose}><div className="col" style={{ gap: 8 }}>
    {rows.length > 0 && <div className="row wrap" style={{ gap: 6 }}>{Object.entries(counts).map(([e, n]) => <span key={e} className="chip">{e} {n}</span>)}</div>}
    {rows.map(([uid, e]) => { const u = users.find((x) => x.id === uid); return <div key={uid} className="row" style={{ alignItems: "center", gap: 10 }}><Avatar u={u} s={38} /><b className="grow ell">{u?.name || "?"}</b><span style={{ fontSize: "1.6rem" }}>{e}</span></div>; })}
    {!rows.length && <p className="muted center">{t("Personne n'a encore réagi.")}</p>}
  </div></Modal>);
}

/** Choix d'un emoji dans la liste complète. */
export function EmojiSheet({ onPick, onClose }: { onPick: (e: string) => void; onClose: () => void }) {
  return (<Modal title={t("Choisir un emoji")} onClose={onClose}><div style={{ maxHeight: "60vh", overflow: "auto" }}><EmojiGrid onPick={(e) => { onPick(e); onClose(); }} /></div></Modal>);
}

/** Page de commentaires simple, comme la messagerie : liste, champ prêt à écrire, envoi, suppression des siens. */
export function CommentSheet({ postId, me, onClose }: { postId: string; me: string; onClose: () => void }) {
  const post = useStore((s) => s.posts.find((x) => x.id === postId)); const users = useStore((s) => s.users); const now = useNow(30000);
  const [txt, setTxt] = useState(""); const [del, setDel] = useState<string | null>(null); const [emo, setEmo] = useState(false); const end = useRef<HTMLDivElement>(null); const inp = useRef<HTMLInputElement>(null);
  const n = post?.comments.length || 0;
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [n]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  if (!post) return null;
  const send = () => { if (!txt.trim()) return; actions.comment(post.id, txt); setTxt(""); setEmo(false); inp.current?.focus(); };
  return createPortal(<div className="detail" role="dialog" aria-modal="true" aria-label={t("Commentaires")}>
    <div className="dhead"><button className="btn ghost sm" onClick={onClose} aria-label={t("Retour")} style={{ minWidth: 44 }}><Ico n="back" s={18} /></button><b className="grow ell">{t("Commentaires")}</b></div>
    <div className="dbody" role="log" aria-live="polite" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {!n && <p className="muted center" style={{ marginTop: 24 }}>{t("Aucun commentaire pour l'instant. Soyez le premier !")}</p>}
      {post.comments.map((c) => { const u = users.find((x) => x.id === c.authorId); const mine = c.authorId === me; return <div key={c.id} className="row" style={{ alignItems: "flex-start", gap: 8 }}><Avatar u={u} s={32} /><div className="cbub grow"><b className="small">{u?.name}</b> <span className="muted small">{ago(c.at, now)}</span><div style={{ overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>{c.text}</div></div>{(mine || post.authorId === me) && <button className="btn ghost sm" onClick={() => setDel(c.id)} aria-label={t("Supprimer")}><Ico n="trash" s={16} /></button>}</div>; })}
      <div ref={end} /></div>
    <div className="dfoot">{emo && <div className="card" style={{ maxHeight: 220, overflow: "auto", marginBottom: 8 }}><EmojiGrid onPick={(e) => setTxt((x) => x + e)} onClose={() => setEmo(false)} /></div>}
      {del && <ConfirmDel what={t("ce commentaire")} onYes={() => actions.deleteComment(post.id, del)} onClose={() => setDel(null)} />}
      <form className="row" onSubmit={(e) => { e.preventDefault(); send(); }}><button type="button" className="btn ghost sm" onClick={() => setEmo(!emo)} aria-label={t("Émoticônes")}>😊</button><input ref={inp} className="inp grow" autoFocus placeholder={t("Écrire un commentaire…")} value={txt} onChange={(e) => setTxt(e.target.value)} aria-label={t("Commentaire")} /><button className="btn sm" disabled={!txt.trim()} aria-label={t("Envoyer")}><Ico n="send" s={16} /></button></form></div>
  </div>, document.body);
}
