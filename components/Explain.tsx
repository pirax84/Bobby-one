"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, Volume2, Check } from "lucide-react";
import { useS, View } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { kidFor } from "@/lib/explain";
import { speak, stopSpeak } from "@/lib/voice";
import { Bobby } from "./ui";

export function Explain({ id, compact = false }: { id: string; compact?: boolean }) {
  const t = useT(); const lang = useS((s) => s.settings.lang); const { go, notify } = useS();
  const [open, setOpen] = useState(false); const [lvl, setLvl] = useState(0); const [ask, setAsk] = useState(false);
  const [a, b] = kidFor(id); const text = lvl === 0 ? a : b;
  const say = (x: string) => speak(x, lang);
  const start = () => { setOpen(true); setLvl(0); setAsk(true); say(a); };
  const close = () => { stopSpeak(); setOpen(false); setAsk(false); setLvl(0); };
  return (<div className={compact ? "" : "mt-3"}>
    {!open && <button type="button" className="btn2 text-sm" onClick={start}><HelpCircle size={16} />{t("Je n'ai pas compris : explique-moi simplement")}</button>}
    <AnimatePresence>{open && <motion.div role="region" aria-live="polite" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card p-4 space-y-3" style={{ borderColor: "var(--brand)" }}>
      <div className="flex gap-3"><Bobby s={40} /><div className="min-w-0 space-y-2"><p className="text-xs text-mute">{t(lvl === 0 ? "Bobby t'explique simplement" : "Encore plus simple")}</p><p className="leading-relaxed">{t(text)}</p></div></div>
      <div className="flex flex-wrap gap-2"><button type="button" className="btn2" onClick={() => say(text)}><Volume2 size={16} />{t("Réécouter")}</button>
        {ask && <span className="basis-full text-sm font-medium pt-1">{t("As-tu compris ?")}</span>}
        {ask && <button type="button" className="btn" onClick={() => { notify("Super, bravo !"); close(); }}><Check size={16} />{t("Oui, merci !")}</button>}
        {ask && lvl === 0 && <button type="button" className="btn2" onClick={() => { setLvl(1); say(b); }}>{t("Non, encore plus simple")}</button>}
        {ask && lvl === 1 && <button type="button" className="btn2" onClick={() => { close(); go("chat" as View); }}>{t("Poser ma question à Bobby")}</button>}
        <button type="button" className="btn2" onClick={close}>{t("Fermer")}</button></div>
    </motion.div>}</AnimatePresence></div>);
}
