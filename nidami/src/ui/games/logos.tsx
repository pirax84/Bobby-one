import type { ReactNode } from "react";
import { PlayCard } from "./cards";
import { getLook, type GameKey } from "./cardlook";

const COL = ["#9B87F5", "#2FCDBE", "#E5679C", "#FF8A6B", "#4F7BFF"];
/** Nom d'un jeu en lettres rondes multicolores. */
export const Word = ({ w, s = 15 }: { w: string; s?: number }) => <span aria-label={w}>{[...w].map((c, i) => <span key={i} aria-hidden="true" style={{ color: COL[i % 5], fontWeight: 900, fontSize: s, letterSpacing: ".5px" }}>{c}</span>)}</span>;

const NUIT = "linear-gradient(145deg,#2A1F5C,#150F33)";
const CARDS: Record<string, GameKey> = { belote: "belote", rami: "rami", tarot: "tarot", bataille: "bataille", pouilleux: "pouilleux", huit: "huit" };
const svg = (children: ReactNode) => <svg viewBox="0 0 76 76" width="76" height="76" fill="none" strokeLinecap="round" aria-hidden="true">{children}</svg>;
const disc = (cx: number, cy: number, c: string) => <circle key={cx + "-" + cy} cx={cx} cy={cy} r="5.6" fill={c} />;
const LOGOS: Record<string, { bg: string; art: ReactNode }> = {
  prisme: { bg: NUIT, art: svg(<><polygon points="38,10 52,24 38,38 24,24" fill="#2FCDBE" /><circle cx="20" cy="52" r="10" fill="#E5679C" /><rect x="46" y="44" width="18" height="18" rx="5" fill="#FF8A6B" /><polygon points="38,34 30,50 46,50" fill="#9B87F5" /></>) },
  noyau: { bg: NUIT, art: svg(<><circle cx="38" cy="38" r="26" stroke="#8BE3F0" strokeWidth="2" strokeDasharray="4 4" opacity=".6" /><circle cx="38" cy="38" r="16" stroke="#fff" strokeWidth="2" strokeDasharray="3 4" opacity=".4" /><circle cx="38" cy="38" r="9" fill="#E5679C" /><circle cx="38" cy="38" r="5" fill="#fff" /><circle cx="38" cy="12" r="5" fill="#2FCDBE" /><circle cx="60" cy="49" r="4" fill="#9B87F5" /></>) },
  aligne4: { bg: NUIT, art: svg(<>{[0, 1, 2, 3, 4, 5].flatMap((i) => [0, 1, 2, 3].map((j) => { const x = 11 + i * 10.8, y = 14 + j * 14.5; const on = "..a...|.ab...|.bab..|abbaa.".split("|")[j][i]; return on === "a" ? disc(x, y, "#3FD0E0") : on === "b" ? disc(x, y, "#FF7BC8") : <circle key={i + "" + j} cx={x} cy={y} r="5.6" fill="#fff" opacity=".12" />; }))}</>) },
  dames: { bg: NUIT, art: svg(<>{Array.from({ length: 8 }, (_, i) => Array.from({ length: 8 }, (_, j) => (i + j) % 2 ? <rect key={i + "" + j} x={9 + i * 7.25} y={9 + j * 7.25} width="7.25" height="7.25" fill="#3B2F8F" /> : <rect key={i + "" + j} x={9 + i * 7.25} y={9 + j * 7.25} width="7.25" height="7.25" fill="#E7E1FF" />))}{disc(27, 27, "#FF7BC8")}{disc(41, 34, "#FF7BC8")}{disc(48, 49, "#3FD0E0")}{disc(34, 56, "#3FD0E0")}</>) },
  navale: { bg: "linear-gradient(145deg,#2B5FA8,#12204F)", art: svg(<><circle cx="52" cy="26" r="14" stroke="#fff" strokeWidth="2" opacity=".35" /><circle cx="52" cy="26" r="7" stroke="#fff" strokeWidth="2" opacity=".55" /><rect x="10" y="40" width="42" height="9" rx="4.5" fill="#fff" /><path d="M8 58q7-6 14 0t14 0 14 0 14 0" stroke="#7FD6F2" strokeWidth="3" /></>) },
  dominos: { bg: NUIT, art: svg(<><g transform="rotate(-18 30 38)"><rect x="16" y="14" width="22" height="44" rx="5" fill="#fff" /><path d="M18 36h18" stroke="#291E5B" strokeWidth="2" /><circle cx="27" cy="25" r="2.6" fill="#291E5B" /><circle cx="27" cy="47" r="2.6" fill="#291E5B" /></g><g transform="rotate(14 50 38)"><rect x="40" y="14" width="22" height="44" rx="5" fill="#fff" /><path d="M42 36h18" stroke="#291E5B" strokeWidth="2" /><circle cx="48" cy="22" r="2.4" fill="#291E5B" /><circle cx="54" cy="28" r="2.4" fill="#291E5B" /><circle cx="51" cy="47" r="2.6" fill="#291E5B" /></g></>) },
  memory: { bg: NUIT, art: svg(<>{[0, 1, 2].flatMap((i) => [0, 1, 2].map((j) => { const x = 11 + i * 18, y = 11 + j * 18; const open = (i === 0 && j === 0) || (i === 2 && j === 2); return <rect key={i + "" + j} x={x} y={y} width="15" height="15" rx="4" fill={open ? "#fff" : "#fff"} opacity={open ? 1 : 0.18} />; }))}<path d="M18.5 22.5c-3-2-4-5-2-6.5 1.6-1 3 0 3.5 1 .5-1 2-2 3.5-1 2 1.500 1 4.500-2 6.500l-1.500 1z" fill="#FF7BC8" transform="translate(-1 0)" /><path d="M54.500 58.500c-3-2-4-5-2-6.500 1.600-1 3 0 3.500 1 .5-1 2-2 3.500-1 2 1.500 1 4.500-2 6.500l-1.500 1z" fill="#FF7BC8" /></>) },
  morpion: { bg: NUIT, art: svg(<><path d="M28 12V64M48 12V64M12 28H64M12 48H64" stroke="#fff" strokeWidth="3" opacity=".35" /><path d="M15 15l9 9M24 15l-9 9" stroke="#3FD0E0" strokeWidth="4" /><circle cx="38" cy="38" r="6" stroke="#FF7BC8" strokeWidth="4" /><path d="M52 52l9 9M61 52l-9 9" stroke="#3FD0E0" strokeWidth="4" /></>) },
};
export const GAME_KEYS = ["prisme", "noyau", "belote", "rami", "tarot", "bataille", "pouilleux", "huit", "aligne4", "dames", "navale", "morpion", "dominos", "memory"] as const;
export function GameLogo({ k, size = 76 }: { k: string; size?: number }) {
  const sc = size / 76; const gk = CARDS[k]; const l = LOGOS[k]; if (!gk && !l) return null;
  const face = gk ? getLook(gk).face : "A";
  return <div aria-hidden="true" style={{ width: size, height: size, flex: "none" }}><div style={{ position: "relative", width: 76, height: 76, borderRadius: 22, background: gk ? "linear-gradient(145deg,#5B49C8,#2A6D8C)" : l.bg, boxShadow: "0 4px 10px rgba(10,5,40,.35)", overflow: "hidden", transform: `scale(${sc})`, transformOrigin: "0 0" }}>
    {gk ? <>
      <div style={{ position: "absolute", left: 15, top: 14, transform: "rotate(-7deg)", transformOrigin: "50% 100%" }}><PlayCard c={{ r: 13, s: "s" }} w={34} look={{ face, four: false }} /></div>
      <div style={{ position: "absolute", left: 27, top: 13, transform: "rotate(7deg)", transformOrigin: "50% 100%" }}><PlayCard c={{ r: 12, s: "h" }} w={34} look={{ face, four: false }} /></div>
    </> : l.art}
  </div></div>;
}
