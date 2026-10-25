export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Vérification en ligne d'un site : listes de sites frauduleux + âge réel du nom de domaine.
let feed: { at: number; set: Set<string> } | null = null;
const host = (u: string) => { try { return new URL(/^https?:/i.test(u) ? u : "https://" + u).hostname.toLowerCase(); } catch { return ""; } };
async function openphish(h: string): Promise<boolean | null> {
  try {
    if (!feed || Date.now() - feed.at > 3600_000) {
      const r = await fetch("https://openphish.com/feed.txt", { signal: AbortSignal.timeout(5000), cache: "no-store" });
      if (!r.ok) throw new Error("feed");
      const set = new Set<string>(); for (const l of (await r.text()).split("\n")) { const x = host(l.trim()); if (x) set.add(x); }
      feed = { at: Date.now(), set };
    }
    return feed.set.has(h);
  } catch { return feed ? feed.set.has(h) : null; }
}
async function safeBrowsing(url: string): Promise<boolean | null> {
  const key = process.env.GOOGLE_SAFE_BROWSING_KEY; if (!key) return null;
  try {
    const r = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${key}`, { method: "POST", signal: AbortSignal.timeout(5000), headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client: { clientId: "bobby-one", clientVersion: "1.0" }, threatInfo: { threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"], platformTypes: ["ANY_PLATFORM"], threatEntryTypes: ["URL"], threatEntries: [{ url }] } }) });
    if (!r.ok) return null; const j = await r.json(); return !!j.matches?.length;
  } catch { return null; }
}
const SLD = new Set(["co", "com", "org", "net", "gov", "ac", "edu", "or", "ne"]);
const registrable = (h: string) => { const p = h.split("."); const n = p.length >= 3 && p[p.length - 1].length === 2 && SLD.has(p[p.length - 2]) ? 3 : 2; return p.slice(-n).join("."); };
let bootstrap: { at: number; map: Map<string, string> } | null = null;
async function rdapBase(tld: string): Promise<string | null> {
  try {
    if (!bootstrap || Date.now() - bootstrap.at > 86400_000) {
      const r = await fetch("https://data.iana.org/rdap/dns.json", { signal: AbortSignal.timeout(5000) }); if (!r.ok) throw new Error("boot");
      const j = await r.json(); const map = new Map<string, string>();
      for (const [tlds, urls] of j.services || []) for (const t of tlds) map.set(String(t).toLowerCase(), String(urls[0]));
      bootstrap = { at: Date.now(), map };
    }
    return bootstrap.map.get(tld) || null;
  } catch { return null; }
}
const created = (j: any): number | null => {
  const ev = (j?.events || []).find((e: any) => e.eventAction === "registration"); if (!ev?.eventDate) return null;
  const t = new Date(ev.eventDate).getTime(); return Number.isFinite(t) ? Math.max(0, Math.floor((Date.now() - t) / 86400000)) : null;
};
async function ageDays(h: string): Promise<number | null> {
  const dom = registrable(h); const tld = dom.split(".").pop() || "";
  const urls: string[] = [];
  const base = await rdapBase(tld); if (base) urls.push(base.replace(/\/?$/, "/") + "domain/" + dom);
  urls.push("https://rdap.org/domain/" + dom);
  for (const u of urls) {
    try { const r = await fetch(u, { signal: AbortSignal.timeout(6000), headers: { Accept: "application/rdap+json, application/json" }, redirect: "follow" }); if (!r.ok) continue; const a = created(await r.json()); if (a !== null) return a; } catch {}
  }
  return null;
}
export async function GET(req: Request) {
  const u = new URL(req.url).searchParams.get("u") || ""; const h = host(u);
  if (!h || !h.includes(".")) return Response.json({ ok: false }, { status: 400 });
  const full = /^https?:/i.test(u) ? u : "https://" + u;
  const [op, gsb, age] = await Promise.all([openphish(h), safeBrowsing(full), ageDays(h)]);
  const used = [op !== null && "OpenPhish", gsb !== null && "Google Safe Browsing"].filter(Boolean);
  return Response.json({ ok: true, host: h, listed: op === true || gsb === true ? true : used.length ? false : null, sources: used, ageDays: age }, { headers: { "Cache-Control": "no-store" } });
}
