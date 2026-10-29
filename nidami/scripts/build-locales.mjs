// Assemble les fichiers de traduction : scripts/i18n/<code>.txt ("numéro|texte") + scripts/i18n/keys.json -> src/locales/<code>.json
// Vérifie que chaque phrase est présente et que les variables {name} sont les mêmes que dans le texte français.
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url)); const dir = path.join(here, "i18n"); const out = path.join(here, "..", "src", "locales");
const keys = JSON.parse(fs.readFileSync(path.join(dir, "keys.json"), "utf8")); const same = JSON.parse(fs.readFileSync(path.join(dir, "keys_same.json"), "utf8"));
const vars = (s) => [...new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).concat([...s.matchAll(/\{(\w+),\s*plural/g)].map((m) => m[1])))].sort().join(",");
fs.mkdirSync(out, { recursive: true }); let bad = 0; const only = process.argv.slice(2);
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".txt"))) {
  const code = f.replace(/\.txt$/, ""); if (only.length && !only.includes(code)) continue;
  const lines = new Map(); for (const ln of fs.readFileSync(path.join(dir, f), "utf8").split("\n")) { const i = ln.indexOf("|"); if (i > 0 && /^\d+$/.test(ln.slice(0, i))) lines.set(+ln.slice(0, i), ln.slice(i + 1).replace(/\r$/, "")); }
  const obj = {}; const errs = [];
  keys.forEach((k, i) => {
    let v = lines.get(i); if (v === undefined || !v.trim()) { errs.push(`manque #${i} ${k.slice(0, 40)}`); return; }
    if (vars(v) !== vars(k)) errs.push(`variables #${i}: "${k.slice(0, 40)}" -> "${v.slice(0, 60)}"`);
    if (/\{(\w+),\s*plural/.test(k) && !/\{(\w+),\s*plural,\s*(?:\w+\{[^{}]*\}\s*)+\}/.test(v)) errs.push(`pluriel cassé #${i}`);
    v = (/^\s/.test(k) ? " " : "") + v.trim() + (/\s$/.test(k) ? " " : ""); obj[k] = v;
  });
  for (const k of same) obj[k] = k;
  if (errs.length) { bad += errs.length; console.log(`✗ ${code}: ${errs.length} problème(s)`); errs.slice(0, 12).forEach((e) => console.log("   " + e)); }
  fs.writeFileSync(path.join(out, code + ".json"), JSON.stringify(obj));
  console.log(`${errs.length ? "!" : "✓"} ${code}: ${Object.keys(obj).length} phrases`);
}
process.exit(bad ? 1 : 0);
