import { isApp, ensure, getContacts } from "./native";
// Carnet de contacts : choisi par l'utilisateur avec le sélecteur d'Android, gardé sur le téléphone.
export const contactsSupported = () => isApp() || (typeof navigator !== "undefined" && "contacts" in navigator && "ContactsManager" in window);
const digits = (x: string) => x.replace(/\D/g, "");
export const sameNumber = (a: string, b: string) => { const x = digits(a), y = digits(b); return x.length >= 7 && y.length >= 7 && x.slice(-9) === y.slice(-9); };
export function findContact(num: string, list: { n: string; t: string[] }[]) { return list.find((c) => c.t.some((t) => sameNumber(t, num))) || null; }
export async function pickContacts(): Promise<{ n: string; t: string[] }[]> {
  if (isApp()) { if (!(await ensure("contacts", 60000))) throw new Error("denied"); return getContacts(); }
  const nav: any = navigator; const r = await nav.contacts.select(["name", "tel"], { multiple: true });
  return (r || []).map((c: any) => ({ n: String((c.name && c.name[0]) || "Sans nom"), t: (c.tel || []).map(String) })).filter((c: any) => c.t.length);
}
