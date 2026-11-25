// NOTIIF : notifications sur ORDINATEUR (navigateur fermé), par le « Web Push » des navigateurs (Chrome, Edge, Firefox).
// - GET  : donne la clé publique dont le navigateur a besoin pour s'abonner (créée toute seule au premier appel).
// - POST : appelé par le serveur à chaque nouveau message (déclencheur SQL 021), protégé par un code secret
//          que le serveur garde lui-même (table notiif_secret) : personne n'a de clé à recopier.
// Dans Supabase : Edge Functions > Deploy a new function > nom « notiif-web » > coller ce fichier,
// puis dans ses Details, décocher « Verify JWT ».
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };

let keys: { publicKey: string; privateKey: string } | null = null;
async function vapid() {
  if (keys) return keys;
  const { data } = await sb.from("web_push_keys").select("public_key, private_key").eq("id", 1).maybeSingle();
  if (data) keys = { publicKey: data.public_key, privateKey: data.private_key };
  else {
    const k = webpush.generateVAPIDKeys();
    await sb.from("web_push_keys").upsert({ id: 1, public_key: k.publicKey, private_key: k.privateKey });
    const { data: again } = await sb.from("web_push_keys").select("public_key, private_key").eq("id", 1).maybeSingle(); // si deux appels en même temps
    keys = again ? { publicKey: again.public_key, privateKey: again.private_key } : k;
  }
  webpush.setVapidDetails("https://notiif.vercel.app", keys.publicKey, keys.privateKey);
  return keys;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    if (req.method === "GET") return new Response(JSON.stringify({ publicKey: (await vapid()).publicKey }), { headers: { ...CORS, "Content-Type": "application/json" } });
    const { data: sec } = await sb.from("notiif_secret").select("value").eq("id", 1).maybeSingle();
    if (!sec?.value || req.headers.get("x-notiif-secret") !== sec.value) return new Response("non", { status: 401 });
    const { record: m, group } = await req.json();
    if (!m?.sender) return new Response("ignore");
    // Destinataires : la personne (message privé) ou les membres du groupe sauf l'expéditeur.
    let to: string[] = [];
    if (group && m.group_id) { const { data } = await sb.from("group_members").select("user_id").eq("group_id", m.group_id); to = (data || []).map((x: any) => x.user_id).filter((u: string) => u !== m.sender); }
    else if (m.recipient) to = [m.recipient];
    if (!to.length) return new Response("personne");
    const { data: subs } = await sb.from("web_push_subs").select("endpoint, sub, user_id").in("user_id", to);
    if (!subs?.length) return new Response("aucun abonnement");
    await vapid();
    const { data: p } = await sb.from("profiles").select("display_name").eq("id", m.sender).maybeSingle();
    const who = p?.display_name || "Un ami";
    const body = m.fx ? "✨ Nouvel effet" : m.media_kind === "audio" ? "🎤 Nouveau vocal" : m.media_kind === "video" ? "🎬 Nouvelle vidéo" : m.media_kind ? "📷 Nouvelle photo" : "💬 Nouveau message";
    const conv = group && m.group_id ? "sbg_" + m.group_id : "sbc_" + m.sender;
    const payload = JSON.stringify({ title: who, body, conv, tag: "m" + m.sender });
    await Promise.all(subs.map(async (s: any) => {
      try { await webpush.sendNotification(s.sub, payload, { TTL: 3600, urgency: "high" }); }
      catch (e: any) { if (e?.statusCode === 404 || e?.statusCode === 410) await sb.from("web_push_subs").delete().eq("endpoint", s.endpoint); }
    }));
    return new Response("ok");
  } catch (e) { return new Response(String(e), { status: 500, headers: CORS }); }
});
