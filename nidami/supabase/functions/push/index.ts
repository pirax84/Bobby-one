// Envoie une notification Firebase au destinataire d'un nouveau message (appelée automatiquement par le serveur).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const sa = JSON.parse(Deno.env.get("FCM_SERVICE_ACCOUNT") || "{}");
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const b64 = (x: ArrayBuffer | string) => btoa(typeof x === "string" ? x : String.fromCharCode(...new Uint8Array(x))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function accessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const head = b64(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const pem = String(sa.private_key).replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const key = await crypto.subtle.importKey("pkcs8", Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(head + "." + claim));
  const jwt = head + "." + claim + "." + b64(sig);
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=" + jwt });
  return (await r.json()).access_token;
}

Deno.serve(async (req) => {
  try {
    const { record: m } = await req.json();
    if (!m?.recipient || !m?.sender) return new Response("ignore");
    const { data: toks } = await sb.from("push_tokens").select("token").eq("user_id", m.recipient);
    if (!toks?.length) return new Response("no token");
    const { data: p } = await sb.from("profiles").select("display_name").eq("id", m.sender).maybeSingle();
    const kind = m.fx ? "fx" : m.media_kind === "audio" ? "audio" : m.media_kind === "video" ? "video" : m.media_kind ? "image" : "text";
    const at = await accessToken();
    for (const { token } of toks) {
      const r = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
        method: "POST", headers: { Authorization: "Bearer " + at, "Content-Type": "application/json" },
        body: JSON.stringify({ message: { token, android: { priority: "HIGH" }, data: { id: String(m.id), sender: String(m.sender), name: p?.display_name || "Un ami", kind } } }),
      });
      if (r.status === 404 || r.status === 400) await sb.from("push_tokens").delete().eq("token", token);
    }
    return new Response("ok");
  } catch (e) { return new Response(String(e), { status: 500 }); }
});
