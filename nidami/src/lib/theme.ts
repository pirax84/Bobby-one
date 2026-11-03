// Couleurs de NOTIIF : 9 couleurs au choix (lavande au départ), chacune en thème clair ou sombre.
// Les valeurs exactes sont dans styles.css (variables CSS) ; ici on choisit la couleur et clair/sombre.
export const ACCENTS = [
  { id: "lavande", name: "Lavande", dot: "#9B87F5", bg: "#120F1F", lbg: "#F5F2FF" },
  { id: "turquoise", name: "Turquoise", dot: "#2FCDBE", bg: "#0B1A21", lbg: "#EEF9F7" },
  { id: "corail", name: "Corail", dot: "#FF8A6B", bg: "#1A1216", lbg: "#FDF0EC" },
  { id: "framboise", name: "Framboise", dot: "#E5679C", bg: "#171018", lbg: "#FCEFF4" },
  { id: "citron", name: "Citron vert", dot: "#A8E05F", bg: "#0F1608", lbg: "#F3F9E9" },
  { id: "miel", name: "Miel", dot: "#F2C45A", bg: "#1A150B", lbg: "#FBF5E6" },
  { id: "azur", name: "Azur", dot: "#38B6FF", bg: "#0A1822", lbg: "#EBF6FD" },
  { id: "ocean", name: "Bleu océan", dot: "#4F7BFF", bg: "#0A1226", lbg: "#EDF1FF" },
  { id: "orchidee", name: "Orchidée", dot: "#C85BE8", bg: "#180D1F", lbg: "#F8EEFC" },
] as const;
export const accentOf = (id?: string) => ACCENTS.find((a) => a.id === id) || ACCENTS[0];
export interface ThemeCfg { light: boolean; accent?: string }
export function applyTheme(c: ThemeCfg) {
  const root = document.documentElement;
  root.style.cssText = "";
  root.dataset.theme = c.light ? "light" : "dark";
  const a = accentOf(c.accent);
  root.dataset.accent = a.id;
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute("content", c.light ? a.lbg : a.bg);
}
