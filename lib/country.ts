import { useS } from "./store";
export interface Src { label: string; url?: string; tel?: string; note?: string }
export interface Country { code: string; name: string; sources: Src[] }
const W: Src[] = [
  { label: "Signaler un site d'hameçonnage à Google", url: "https://safebrowsing.google.com/safebrowsing/report_phish/" },
  { label: "Signaler une fraude en ligne (international)", url: "https://www.econsumer.gov" },
];
export const COUNTRIES: Country[] = [
  { code: "FR", name: "France", sources: [
    { label: "17Cyber (police et gendarmerie)", url: "https://www.17cyber.gouv.fr" },
    { label: "Cybermalveillance.gouv.fr (aide aux victimes)", url: "https://www.cybermalveillance.gouv.fr" },
    { label: "Signal Spam (mails indésirables)", url: "https://www.signal-spam.fr" },
    { label: "Internet-signalement.gouv.fr (contenus illicites)", url: "https://www.internet-signalement.gouv.fr" },
    { label: "SMS ou appel indésirable : transférer au", tel: "33700" },
    { label: "Info Escroqueries (gratuit)", tel: "0805805817" }] },
  { code: "BE", name: "Belgique", sources: [
    { label: "Safeonweb : transférer le mail suspect à suspect@safeonweb.be", url: "https://safeonweb.be" },
    { label: "Point de contact (SPF Économie)", url: "https://pointdecontact.belgique.be" }] },
  { code: "CH", name: "Suisse", sources: [
    { label: "Centre national pour la cybersécurité (NCSC)", url: "https://www.ncsc.admin.ch" },
    { label: "eBanking – en toute sécurité (prévention)", url: "https://www.ebas.ch" }] },
  { code: "CA", name: "Canada", sources: [
    { label: "Centre antifraude du Canada", url: "https://antifraudcentre-centreantifraude.ca", tel: "18884958501" },
    { label: "Centre de notification des pourriels", url: "https://fightspam.gc.ca" }] },
  { code: "US", name: "États-Unis", sources: [
    { label: "FTC : signaler une fraude", url: "https://reportfraud.ftc.gov" },
    { label: "FBI IC3 (crimes sur internet)", url: "https://www.ic3.gov" },
    { label: "SMS indésirable : transférer au", tel: "7726" }] },
  { code: "GB", name: "Royaume-Uni", sources: [
    { label: "Mail suspect : transférer à report@phishing.gov.uk", url: "https://www.ncsc.gov.uk/collection/phishing-scams" },
    { label: "Action Fraud", url: "https://www.actionfraud.police.uk", tel: "03001232040" },
    { label: "SMS indésirable : transférer au", tel: "7726" }] },
  { code: "DE", name: "Allemagne", sources: [
    { label: "Verbraucherzentrale (protection des consommateurs)", url: "https://www.verbraucherzentrale.de" },
    { label: "BSI (sécurité informatique)", url: "https://www.bsi.bund.de" }] },
  { code: "ES", name: "Espagne", sources: [
    { label: "INCIBE (cybersécurité)", url: "https://www.incibe.es", tel: "017" },
    { label: "OSI – Oficina de Seguridad del Internauta", url: "https://www.osi.es" }] },
  { code: "IT", name: "Italie", sources: [{ label: "Polizia Postale", url: "https://www.commissariatodips.it" }] },
  { code: "PT", name: "Portugal", sources: [{ label: "CNCS (cybersécurité)", url: "https://www.cncs.gov.pt" }] },
  { code: "AU", name: "Australie", sources: [
    { label: "Scamwatch", url: "https://www.scamwatch.gov.au" },
    { label: "Cyber.gov.au", url: "https://www.cyber.gov.au" }] },
  { code: "IN", name: "Inde", sources: [{ label: "Portail national de la cybercriminalité", url: "https://cybercrime.gov.in", tel: "1930" }] },
];
export const GENERIC: Country = { code: "XX", name: "Autre pays", sources: [] };
export const sourcesFor = (code: string): Src[] => [...(COUNTRIES.find((c) => c.code === code)?.sources || []), ...W];
const TZ: [RegExp, string][] = [[/^Europe\/Paris/, "FR"], [/^Europe\/Brussels/, "BE"], [/^Europe\/Zurich/, "CH"], [/^America\/(Toronto|Montreal|Vancouver|Edmonton|Winnipeg|Halifax|Regina)/, "CA"], [/^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage)/, "US"], [/^Europe\/London/, "GB"], [/^Europe\/Berlin/, "DE"], [/^Europe\/Madrid/, "ES"], [/^Europe\/Rome/, "IT"], [/^Europe\/Lisbon/, "PT"], [/^Australia\//, "AU"], [/^Asia\/(Kolkata|Calcutta)/, "IN"]];
export function guessCountry(): string {
  try { const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; const h = TZ.find(([r]) => r.test(tz)); if (h) return h[1]; } catch {}
  try { const r = (navigator.language || "").split("-")[1]; if (r) return r.toUpperCase(); } catch {}
  return "XX";
}
export function locate(): Promise<string> {
  return new Promise((res, rej) => {
    if (useS.getState().settings.geoOn === false) return rej(new Error("off"));
    if (!navigator.geolocation) return rej(new Error("unsupported"));
    navigator.geolocation.getCurrentPosition(async (p) => {
      try { const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${p.coords.latitude}&longitude=${p.coords.longitude}&localityLanguage=en`); const j = await r.json(); if (j.countryCode) return res(String(j.countryCode).toUpperCase()); } catch {}
      rej(new Error("lookup"));
    }, (e) => rej(new Error(e.code === 1 ? "denied" : "fail")), { timeout: 10000, maximumAge: 3600000 });
  });
}
