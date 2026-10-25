export const runtime = "nodejs";
// Secours quand le service worker n'est pas encore actif : on garde le texte partagé.
export async function POST(req: Request) {
  let text = "";
  try { const f = await req.formData(); text = [f.get("title"), f.get("text"), f.get("url")].filter((x) => typeof x === "string" && x).join(" ").trim(); } catch {}
  return Response.redirect(new URL("/" + (text ? "?text=" + encodeURIComponent(text) : ""), req.url), 303);
}
export async function GET(req: Request) { return Response.redirect(new URL("/", req.url), 303); }
