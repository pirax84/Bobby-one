import { useRef, useState } from "react";
import { t } from "../i18n";
import { Ico, MkTile } from "./common";

const TURQ = ["groups", "messages", "calls", "settings", "games"];
const ROSE = ["friends", "notifs", "profile", "events"];
const grad = (k: string) => k === "theme" || k === "search" ? "linear-gradient(135deg,#5EE0C8,#2BB8D8 60%,var(--brand))" : TURQ.includes(k) ? "linear-gradient(135deg,#5EE0C8,#2BB8D8 60%,var(--brand))" : ROSE.includes(k) ? "linear-gradient(135deg,#FF8FA3,#E0609A)" : "linear-gradient(135deg,var(--brand),var(--brand2))";

/** Aperçu d'une barre : on maintient un bouton puis on le glisse à gauche/droite pour changer sa place (aussi au clavier : flèches). */
export function ReorderStrip({ keys, label, icon, onChange }: { keys: string[]; label: (k: string) => string; icon: (k: string) => string; onChange: (order: string[]) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [order, setOrder] = useState<string[] | null>(null);
  const [drag, setDrag] = useState<{ k: string; dx: number } | null>(null);
  const st = useRef<{ k: string; x0: number; y0: number; timer: number; on: boolean; ord: string[] } | null>(null);
  const list = order || keys;
  const n = list.length;
  const finish = () => { const s = st.current; st.current = null; if (s) clearTimeout(s.timer); if (s?.on) { onChange(s.ord); } setDrag(null); setOrder(null); };
  const down = (e: React.PointerEvent, k: string) => {
    const el = e.currentTarget as HTMLElement; const pid = e.pointerId;
    const s = { k, x0: e.clientX, y0: e.clientY, on: false, ord: [...keys], timer: 0 };
    s.timer = window.setTimeout(() => { s.on = true; try { el.setPointerCapture(pid); } catch { /* rien */ } try { navigator.vibrate?.(15); } catch { /* rien */ } setOrder([...s.ord]); setDrag({ k, dx: 0 }); }, 280);
    st.current = s;
  };
  const move = (e: React.PointerEvent) => {
    const s = st.current; if (!s) return;
    if (!s.on) { if (Math.abs(e.clientX - s.x0) > 10 || Math.abs(e.clientY - s.y0) > 10) { clearTimeout(s.timer); st.current = null; } return; }
    const r = box.current!.getBoundingClientRect(); const w = r.width / s.ord.length; const px = e.clientX - r.left;
    const j = Math.max(0, Math.min(s.ord.length - 1, Math.floor(px / w)));
    const cur = s.ord.indexOf(s.k);
    if (j !== cur) { const a = [...s.ord]; a.splice(cur, 1); a.splice(j, 0, s.k); s.ord = a; setOrder(a); }
    setDrag({ k: s.k, dx: px - (s.ord.indexOf(s.k) + 0.5) * w });
  };
  const key = (e: React.KeyboardEvent, k: string) => {
    const i = keys.indexOf(k); const j = e.key === "ArrowLeft" ? i - 1 : e.key === "ArrowRight" ? i + 1 : i; if (j === i || j < 0 || j >= keys.length) return;
    e.preventDefault(); const a = [...keys]; a.splice(i, 1); a.splice(j, 0, k); onChange(a);
  };
  return (
    <div className="col" style={{ gap: 6 }}>
      <p className="muted small" style={{ margin: 0 }}>{t("Maintiens un bouton puis glisse-le à gauche ou à droite pour changer sa place.")}</p>
      <div ref={box} style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(n, 1)},1fr)`, padding: "12px 4px 8px", borderRadius: 24, background: "var(--bg2)", border: "1px solid var(--bd)", touchAction: "pan-y", userSelect: "none" }}>
        {list.map((k) => {
          const on = drag?.k === k;
          return (
            <button key={k} type="button" aria-label={label(k)} onPointerDown={(e) => down(e, k)} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} onKeyDown={(e) => key(e, k)} onContextMenu={(e) => e.preventDefault()}
              style={{ background: "none", border: 0, color: "var(--fg)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontSize: ".7rem", fontWeight: 600, padding: 4, touchAction: on ? "none" : "pan-y", transform: on ? `translateX(${drag!.dx}px) translateY(-8px) scale(1.12)` : undefined, transition: on ? "none" : "transform .15s", zIndex: on ? 3 : 1, filter: on ? "drop-shadow(0 10px 12px rgba(0,0,0,.4))" : undefined, position: "relative" }}>
              {k === "voice" ? <MkTile k="o" size={44} /> : <span style={{ width: 44, height: 44, borderRadius: 15, background: grad(k), color: "#fff", display: "grid", placeItems: "center", boxShadow: "0 4px 10px -4px rgba(0,0,0,.45)" }}><Ico n={icon(k)} s={22} /></span>}
              <span>{label(k)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
