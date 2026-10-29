// Thèmes de NOTIIF : un thème clair et un thème sombre, tous deux en turquoise.
// Les couleurs sont définies dans styles.css (variables CSS) ; ici on choisit seulement clair ou sombre.
export interface ThemeCfg { light: boolean }
export function applyTheme(c: ThemeCfg) {
  const root = document.documentElement;
  root.style.cssText = "";
  root.dataset.theme = c.light ? "light" : "dark";
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute("content", c.light ? "#EEF9F7" : "#0B1A21");
}
