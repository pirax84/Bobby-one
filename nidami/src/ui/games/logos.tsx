import type { ReactNode } from "react";
import { rankLabel, SYM, suitColor, type Suit } from "./cards";

const COL = ["#9B87F5", "#2FCDBE", "#E5679C", "#FF8A6B", "#4F7BFF"];
/** Nom d'un jeu en lettres rondes multicolores. */
export const Word = ({ w, s = 15 }: { w: string; s?: number }) => <span aria-label={w}>{[...w].map((c, i) => <span key={i} aria-hidden="true" style={{ color: COL[i % 5], fontWeight: 900, fontSize: s, letterSpacing: ".5px" }}>{c}</span>)}</span>;

const mini = (r: number | string, s: Suit, rot: number, x: number, y: number, w = 34, h = 48, big = false): ReactNode => (
  <div key={x + "" + y} style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 7, background: "#fff", boxShadow: "0 3px 8px rgba(0,0,0,.35)", transform: `rotate(${rot}deg)`, color: suitColor(s), fontWeight: 900, fontFamily: "Georgia,serif" }}>
    <div style={{ position: "absolute", left: 5, top: 2, fontSize: big ? 15 : 13, lineHeight: 1.05 }}>{typeof r === "number" ? rankLabel(r) : r}<br />{SYM[s]}</div>
    <div style={{ position: "absolute", right: 4, bottom: 0, fontSize: big ? 26 : 22, opacity: 0.9 }}>{SYM[s]}</div>
  </div>);

type L = { bg: string; art: ReactNode };
const svg = (children: ReactNode) => <svg viewBox="0 0 76 76" width="76" height="76" fill="none" strokeLinecap="round" aria-hidden="true">{children}</svg>;
const LOGOS: Record<string, L> = {
  belote: { bg: "linear-gradient(135deg,#9B87F5,#6E58D8)", art: <>{mini(11, "h", -14, 10, 14)}{mini(9, "h", 10, 32, 12)}</> },
  rami: { bg: "linear-gradient(135deg,#5EE0C8,#2BB8D8)", art: <>{mini(5, "s", -18, 6, 16, 28, 42)}{mini(6, "s", 0, 24, 12, 28, 42)}{mini(7, "s", 18, 42, 16, 28, 42)}</> },
  tarot: { bg: "linear-gradient(135deg,#FF8FA3,#E0609A)", art: <>{mini("21", "c", -10, 8, 14, 38, 52)}{mini(13, "d", 12, 32, 12, 34, 50)}</> },
  bataille: { bg: "linear-gradient(135deg,#7A63E4,#A46BDB)", art: <>{mini(1, "s", -12, 8, 14)}{mini(13, "h", 12, 34, 16)}</> },
  pouilleux: { bg: "linear-gradient(135deg,#2FCDBE,#4F7BFF)", art: <>{mini(11, "c", -8, 8, 14)}{mini("?", "d", 14, 32, 14)}</> },
  huit: { bg: "linear-gradient(135deg,#FF8A6B,#E5679C)", art: <>{mini(8, "h", -10, 12, 10, 40, 56, true)}{mini(8, "s", 14, 34, 14)}</> },
  aligne4: { bg: "linear-gradient(135deg,#4F7BFF,#9B87F5)", art: svg(<><rect x="8" y="12" width="60" height="54" rx="9" fill="#2A2442" opacity=".55" />{["..a.", "..b.", ".aab", ".bba"].flatMap((row, j) => [...row].map((ch, i) => <circle key={i + "-" + j} cx={19 + i * 13} cy={25 + j * 13} r="5.5" fill={ch === "a" ? "#FFC2CE" : ch === "b" ? "#B9F0E4" : "#ffffff33"} />))}</>) },
  dames: { bg: "linear-gradient(135deg,#6E58D8,#E5679C)", art: svg(<>{[0, 1, 2, 3].flatMap((i) => [0, 1, 2, 3].map((j) => <rect key={i + "" + j} x={10 + i * 14} y={10 + j * 14} width="14" height="14" fill={(i + j) % 2 === 0 ? "#fff" : "#2A2442"} opacity={(i + j) % 2 === 0 ? 0.9 : 0.6} />))}<circle cx="24" cy="31" r="6.5" fill="#B9F0E4" stroke="#2A2442" strokeWidth="1.5" /><circle cx="52" cy="45" r="6.5" fill="#FFC2CE" stroke="#2A2442" strokeWidth="1.5" /><circle cx="38" cy="59" r="6.5" fill="#FFC2CE" stroke="#2A2442" strokeWidth="1.5" /></>) },
  navale: { bg: "linear-gradient(135deg,#2BB8D8,#4F7BFF)", art: svg(<><path d="M10 52h56l-8 11H18z" fill="#fff" /><path d="M26 52V36l14 8V52zM44 52V28l12 10V52z" fill="#fff" opacity=".9" /><path d="M8 66q6-5 12 0t12 0 12 0 12 0 12 0" stroke="#B9F0E4" strokeWidth="3" /><circle cx="56" cy="20" r="9" stroke="#FFC2CE" strokeWidth="3" /><path d="M56 8v8M56 24v8M44 20h8M60 20h8" stroke="#FFC2CE" strokeWidth="3" /></>) },
  morpion: { bg: "linear-gradient(135deg,#6E58D8,#9B87F5)", art: svg(<><path d="M28 12V64M48 12V64M12 28H64M12 48H64" stroke="#fff" strokeWidth="4" opacity=".8" /><path d="M16 16l8 8M24 16l-8 8" stroke="#B9F0E4" strokeWidth="4" /><circle cx="56" cy="56" r="5" stroke="#FFC2CE" strokeWidth="4" /></>) },
  dominos: { bg: "linear-gradient(135deg,#9B87F5,#2FCDBE)", art: svg(<><g transform="rotate(-14 38 38)"><rect x="14" y="14" width="20" height="40" rx="5" fill="#fff" /><path d="M16 34h16" stroke="#9B87F5" strokeWidth="2" /><circle cx="24" cy="22" r="2.6" fill="#2A2442" /><circle cx="24" cy="46" r="2.6" fill="#2A2442" /><circle cx="20" cy="42" r="2.6" fill="#2A2442" /><circle cx="28" cy="50" r="2.6" fill="#2A2442" /></g><g transform="rotate(12 52 40)"><rect x="40" y="18" width="20" height="40" rx="5" fill="#fff" /><path d="M42 38h16" stroke="#9B87F5" strokeWidth="2" /><circle cx="50" cy="27" r="2.6" fill="#E5679C" /><circle cx="50" cy="49" r="2.6" fill="#E5679C" /></g></>) },
  memory: { bg: "linear-gradient(135deg,#E5679C,#9B87F5)", art: <><div style={{ position: "absolute", left: 12, top: 16, width: 22, height: 40, borderRadius: 7, background: "#fff" }} /><div style={{ position: "absolute", left: 40, top: 16, width: 22, height: 40, borderRadius: 7, border: "3px solid #fff" }} /></> },
};
export const GAME_KEYS = ["belote", "rami", "tarot", "bataille", "pouilleux", "huit", "aligne4", "dames", "navale", "morpion", "dominos", "memory"] as const;
export function GameLogo({ k, size = 76 }: { k: string; size?: number }) {
  const l = LOGOS[k]; if (!l) return null; const sc = size / 76;
  return <div aria-hidden="true" style={{ width: size, height: size, flex: "none" }}><div style={{ position: "relative", width: 76, height: 76, borderRadius: 26, background: l.bg, boxShadow: "0 6px 14px -6px rgba(0,0,0,.5)", overflow: "hidden", transform: `scale(${sc})`, transformOrigin: "top left" }}>{l.art}</div></div>;
}
