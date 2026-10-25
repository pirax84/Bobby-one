"use client";
import { useEffect, useRef } from "react";
import { useS } from "@/lib/store";
import { useT } from "@/lib/i18n";
const MAP: Record<string, { color: string; emoji: string; title: string; text: string; blink: boolean }> = {
  safe: { color: "#22C55E", emoji: "✅", title: "Tout va bien", text: "Je n'ai repéré aucun signe d'arnaque. Restez quand même attentif.", blink: false },
  careful: { color: "#F59E0B", emoji: "⚠️", title: "Soyez prudent", text: "Quelques points me gênent. Vérifiez avant de répondre ou de cliquer.", blink: true },
  suspicious: { color: "#F97316", emoji: "⚠️", title: "Attention, c'est louche", text: "Ne cliquez sur rien et ne donnez aucune information.", blink: true },
  danger: { color: "#EF4444", emoji: "🔴", title: "Danger !", text: "Je pense qu'il s'agit d'une arnaque. Ne répondez pas, ne payez rien.", blink: true },
};
// Flash plein écran : le fond clignote 4 fois (rouge, orange) ou reste vert 3 secondes. Il faut appuyer sur « J'ai vu » pour le fermer (sauf le vert, qui se ferme seul).
export function FlashHost() {
  const f = useS((x) => x.flashing); const set = useS((x) => x.setFlashing); const t = useT(); const btn = useRef<HTMLButtonElement>(null);
  const m = f ? MAP[f.level] || MAP.careful : null;
  useEffect(() => {
    if (!f || !m) return;
    try { if (m.blink) navigator.vibrate?.(f.level === "danger" ? [200, 100, 200, 100, 200] : [150, 80, 150]); } catch {}
    const k = (e: KeyboardEvent) => e.key === "Escape" && set(null); window.addEventListener("keydown", k);
    const to = !m.blink ? setTimeout(() => set(null), 3000) : null; setTimeout(() => btn.current?.focus(), 50);
    return () => { window.removeEventListener("keydown", k); if (to) clearTimeout(to); };
  }, [f?.id]);
  if (!f || !m) return null;
  return (<div role="alertdialog" aria-modal="true" aria-label={t(m.title)} className="fixed inset-0 z-[90] grid place-items-center p-6" style={{ background: "rgba(0,0,0,.55)" }}>
    <div aria-hidden="true" className={"absolute inset-0 " + (m.blink ? "bobby-blink" : "bobby-steady")} style={{ background: m.color }} />
    <div className="relative card p-7 max-w-sm w-full text-center space-y-4" style={{ background: "var(--solid)", borderColor: m.color, borderWidth: 2 }}>
      <p className="text-6xl" aria-hidden="true">{m.emoji}</p><h2 className="text-2xl font-bold" style={{ color: m.color }}>{t(m.title)}</h2>
      <p className="text-lg">{t("Score de confiance")} : {f.score}/100</p><p className="text-mute">{t(m.text)}</p>
      <button ref={btn} type="button" className="btn w-full !min-h-14 text-lg" onClick={() => set(null)}>{t("J'ai vu")}</button></div></div>);
}
