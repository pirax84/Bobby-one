// Thèmes de Mon cercle. Le thème d'origine est gratuit ; les autres couleurs font partie de Mon cercle+ (payant).
export interface Opt { id: string; label: string; v: string; v2?: string; pro: boolean }
export const FONDS: Opt[] = [
  { id: "nuit", label: "Nuit", v: "#0F172A", v2: "#162033", pro: false },
  { id: "ocean", label: "Océan", v: "#071E26", v2: "#0D2C37", pro: true },
  { id: "foret", label: "Forêt", v: "#0C1F18", v2: "#132B22", pro: true },
  { id: "charbon", label: "Charbon", v: "#121214", v2: "#1C1C20", pro: true },
];
export const ECRITURES_SOMBRE: Opt[] = [
  { id: "blanc", label: "Blanc", v: "#F1F5F9", v2: "#94A3B8", pro: false },
  { id: "menthe", label: "Menthe", v: "#CFFAF0", v2: "#7FB8AC", pro: true },
  { id: "sable", label: "Sable", v: "#F5E9D3", v2: "#B3A58D", pro: true },
  { id: "ciel", label: "Ciel", v: "#DBEAFE", v2: "#8FA6C7", pro: true },
];
export const ECRITURES_CLAIR: Opt[] = [
  { id: "encre", label: "Encre", v: "#0F172A", v2: "#52606D", pro: false },
  { id: "foret", label: "Forêt", v: "#064E3B", v2: "#4B6F63", pro: true },
  { id: "ardoise", label: "Ardoise", v: "#334155", v2: "#64748B", pro: true },
  { id: "prune", label: "Prune", v: "#3B1F4A", v2: "#76608A", pro: true },
];
export const ACCENTS: Opt[] = [
  { id: "menthe", label: "Menthe", v: "#10B981", v2: "#22D3EE", pro: false },
  { id: "ciel", label: "Ciel", v: "#38BDF8", v2: "#818CF8", pro: true },
  { id: "corail", label: "Corail", v: "#FB7185", v2: "#FDBA74", pro: true },
  { id: "or", label: "Or", v: "#F5B301", v2: "#FDE68A", pro: true },
];
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(",");
export interface ThemeCfg { light: boolean; premium: boolean; bg?: string; fg?: string; accent?: string }
const pick = (list: Opt[], id: string | undefined, premium: boolean) => { const o = list.find((x) => x.id === id); return o && (premium || !o.pro) ? o : list[0]; };
/** Applique le thème choisi (les choix payants sont ignorés si Mon cercle+ n'est pas actif). */
export function applyTheme(c: ThemeCfg) {
  const r = document.documentElement.style; r.cssText = "";
  document.documentElement.dataset.theme = c.light ? "light" : "dark";
  let ac = pick(ACCENTS, c.accent, c.premium); if (c.light && ac === ACCENTS[0]) ac = { ...ac, v: "#0E9F6E", v2: "#0891B2" }; const fg = pick(c.light ? ECRITURES_CLAIR : ECRITURES_SOMBRE, c.fg, c.premium);
  r.setProperty("--brand", ac.v); r.setProperty("--brand2", ac.v2!); r.setProperty("--brand-rgb", rgb(ac.v)); r.setProperty("--brand2-rgb", rgb(ac.v2!));
  r.setProperty("--on", c.light ? "#fff" : "#07140F");
  if (!c.light) { const bg = pick(FONDS, c.bg, c.premium); r.setProperty("--bg", bg.v); r.setProperty("--bg2", bg.v2!); }
  r.setProperty("--fg", fg.v); r.setProperty("--mute", fg.v2!);
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute("content", c.light ? "#EAF7F1" : pick(FONDS, c.bg, c.premium).v);
}
