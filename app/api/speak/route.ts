export const runtime = "nodejs";
export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return new Response("Pas de clé", { status: 501 });
  const { text } = await req.json().catch(() => ({ text: "" }));
  if (!text || typeof text !== "string") return new Response("Texte vide", { status: 400 });
  const r = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "tts-1", voice: "onyx", input: text.slice(0, 600), response_format: "mp3" }),
  });
  if (!r.ok) return new Response("Erreur voix", { status: 502 });
  return new Response(r.body, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
}
