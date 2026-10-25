"use client";
import { useEffect, useState } from "react";
import { ShieldAlert, ExternalLink, Phone } from "lucide-react";
import { useS } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { COUNTRIES, sourcesFor, guessCountry } from "@/lib/country";

export function useCountry() { const c = useS((s) => s.settings.country); const [g, setG] = useState("XX"); useEffect(() => setG(guessCountry()), []); return c || g; }

export function Where({ title = "Où signaler cette arnaque (sources officielles)" }: { title?: string }) {
  const t = useT(); const code = useCountry(); const name = COUNTRIES.find((c) => c.code === code)?.name || "Autre pays";
  const list = sourcesFor(code);
  return (<div className="rounded-2xl p-4 space-y-3" style={{ background: "var(--soft)" }}>
    <p className="font-semibold flex items-center gap-2"><ShieldAlert size={18} style={{ color: "var(--brand)" }} />{t(title)} · {t(name)}</p>
    <ul className="space-y-2 text-sm">{list.map((x) => <li key={x.label} className="flex items-start gap-2 flex-wrap"><span className="flex-1 min-w-[10rem]">{t(x.label)}</span>
      {x.url && <a href={x.url} target="_blank" rel="noopener noreferrer" className="btn2 !min-h-9 !py-1" dir="ltr"><ExternalLink size={14} />{t("Ouvrir")}</a>}
      {x.tel && <a href={"tel:" + x.tel} className="btn2 !min-h-9 !py-1" dir="ltr"><Phone size={14} />{x.tel}</a>}</li>)}</ul>
    <p className="text-xs text-mute">{t("Liens choisis à la main. Vérifiez toujours que l'adresse du site est bien celle d'un organisme officiel.")}</p>
  </div>);
}
