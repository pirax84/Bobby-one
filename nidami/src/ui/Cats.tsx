import { useState } from "react";
import { useStore, actions } from "../lib/store";
import { catsOf, CAT_EMOJIS } from "../lib/cats";
import { isPC, toast } from "./common";
import { t } from "../i18n";

/** Choisir une ou plusieurs catégories pour un contact, ou en inventer une (« Ma catégorie »). */
export function CatPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const s = useStore((x) => x); const cats = catsOf(s.social, s.me); const [add, setAdd] = useState(false); const [name, setName] = useState(""); const [em, setEm] = useState(CAT_EMOJIS[0]);
  const tog = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return <div className="col" style={{ gap: 8 }}>
    <div className="row wrap" style={{ gap: 6 }}>{cats.map((c) => <button key={c.id} type="button" className={"chip" + (value.includes(c.id) ? " on" : "")} aria-pressed={value.includes(c.id)} onClick={() => tog(c.id)}>{c.e} {c.n}</button>)}
      {!add && <button type="button" className="chip" style={{ borderStyle: "dashed" }} onClick={() => setAdd(true)}>{t("➕ Ma catégorie")}</button>}</div>
    {add && <div className="card col" style={{ gap: 8 }}>
      <input className="inp" placeholder={t("Ma catégorie : écris le nom que tu veux")} value={name} maxLength={30} onChange={(e) => setName(e.target.value)} aria-label={t("Nom de la catégorie")} autoFocus />
      <div className="row wrap" style={{ gap: 4 }}>{CAT_EMOJIS.map((e) => <button key={e} type="button" className={"chip" + (em === e ? " on" : "")} style={{ padding: "4px 10px" }} onClick={() => setEm(e)} aria-label={e}>{e}</button>)}</div>
      <div className="row" style={{ gap: 8 }}><button type="button" className="btn ghost sm grow" onClick={() => { setAdd(false); setName(""); }}>{t("Annuler")}</button>
        <button type="button" className="btn sm grow" disabled={!name.trim()} onClick={() => { const id = actions.addCat(name, em); onChange([...value, id]); setAdd(false); setName(""); toast(t("Catégorie créée.")); }}>{t("Créer la catégorie")}</button></div></div>}</div>;
}

/** Réglage « Qui voit quoi » : on choisit une catégorie, puis on coche les catégories qu'elle peut voir aussi. Rien de coché = rien d'autre n'est vu. */
export function SeesCard() {
  const s = useStore((x) => x); const me = s.me; const cats = catsOf(s.social, me); const pc = isPC();
  const [sel, setSel] = useState<string | null>(pc ? cats[0].id : null);
  const cur = cats.find((c) => c.id === sel); const val = (cur && s.social.sees?.[me]?.[cur.id]) || [];
  const set = (ids: string[]) => cur && actions.setSees(cur.id, ids);
  const others = cats.filter((c) => c.id !== cur?.id);
  const list = <div className="col" style={{ gap: 8 }}>{cats.map((c) => <button key={c.id} type="button" className="chip" style={{ justifyContent: "flex-start", padding: "12px 14px", borderRadius: 16, ...(sel === c.id ? { borderColor: "var(--brand)", boxShadow: "inset 0 0 0 1px var(--brand)" } : {}) }} aria-pressed={sel === c.id} onClick={() => setSel(c.id)}><span className="grow" style={{ textAlign: "left" }}>{c.e} {c.n}</span><span className="muted">›</span></button>)}</div>;
  const detail = cur && <div className="col" style={{ gap: 6 }}>
    {!pc && <button type="button" className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={() => setSel(null)}>{t("‹ Retour")}</button>}
    <h3 style={{ margin: 0 }}>{t("Les {name} voient aussi :", { name: cur.e + " " + cur.n })}</h3>
    <p className="muted small" style={{ margin: 0 }}>{t("Coche les catégories que tu veux leur montrer. Rien de coché : ils ne voient rien des autres.")}</p>
    <div className="row" style={{ gap: 8 }}><button type="button" className="btn ghost sm" onClick={() => set(others.map((c) => c.id))}>{t("Tout cocher")}</button><button type="button" className="btn ghost sm" onClick={() => set([])}>{t("Tout décocher")}</button></div>
    <label className="row" style={{ padding: "10px 4px", gap: 12, borderBottom: "1px solid var(--bd)", opacity: 0.6 }}><input type="checkbox" checked disabled style={{ width: 24, height: 24, accentColor: "var(--brand)" }} aria-label={cur.n} /><span className="grow">{cur.e} {cur.n}</span><span className="muted small">{t("toujours")}</span></label>
    {others.map((c) => <label key={c.id} className="row" style={{ padding: "10px 4px", gap: 12, borderBottom: "1px solid var(--bd)" }}><input type="checkbox" checked={val.includes(c.id)} onChange={() => set(val.includes(c.id) ? val.filter((x) => x !== c.id) : [...val, c.id])} style={{ width: 24, height: 24, accentColor: "var(--brand)" }} aria-label={c.n} /><span className="grow">{c.e} {c.n}</span></label>)}
    {cur.custom && <button type="button" className="btn ghost sm" style={{ alignSelf: "flex-start", marginTop: 6 }} onClick={() => { if (confirm(t("Supprimer cette catégorie ?"))) { actions.removeCat(cur.id); setSel(pc ? cats[0].id : null); } }}>{t("🗑 Supprimer cette catégorie")}</button>}</div>;
  return <div className="card col" style={{ gap: 10 }}><h3 style={{ margin: 0 }}>{t("🔀 Qui voit quoi")}</h3>
    <p className="muted small" style={{ margin: 0 }}>{t("Choisis une catégorie, puis coche ce qu'elle peut voir en plus. Utile quand tu publies pour une seule catégorie.")}</p>
    {pc ? <div style={{ display: "grid", gridTemplateColumns: "minmax(180px,1fr) 2fr", gap: 18, alignItems: "start" }}>{list}{detail}</div> : (sel && cur ? detail : list)}</div>;
}
