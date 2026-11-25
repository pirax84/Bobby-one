import { SB_URL, SB_KEY } from "./auth";
import { getSess } from "./server";

/**
 * Temps réel : le serveur prévient tout de suite quand un message, une réaction ou « en train d'écrire » arrive.
 * Plus besoin de redemander au serveur chaque seconde : moins de batterie, moins de données, et c'est plus rapide.
 * Si le temps réel ne répond pas (pas encore activé sur le serveur, réseau coupé…), l'appli revient toute seule
 * à l'ancienne méthode (demander régulièrement) : rien ne casse.
 */
type Kind = "msg" | "typing" | "react" | "group";
const TABLES: [string, Kind][] = [["messages", "msg"], ["group_messages", "group"], ["msg_reactions", "react"], ["typing", "typing"]];

let ws: WebSocket | null = null; let ref = 0; let hb: ReturnType<typeof setInterval> | undefined; let retry = 0; let topic = "";
let lastEvent = 0; let joinedAt = 0; let sentTok = ""; let pgOk = false;
let handler: (k: Kind) => void = () => {};

/** Le temps réel est-il branché et vivant ? (connecté depuis peu, ou a déjà livré un événement) */
// Vrai seulement quand le serveur a confirmé « abonné aux changements » (sinon on garde le rythme normal).
export const liveOk = () => !!ws && ws.readyState === 1 && joinedAt > 0 && pgOk;
export const liveLast = () => lastEvent;

const send = (event: string, payload: unknown, t = topic) => { try { ws?.send(JSON.stringify({ topic: t, event, payload, ref: String(++ref) })); } catch { /* ignoré */ } };

function connect() {
  const s = getSess(); if (!s || !SB_URL || typeof WebSocket === "undefined") return;
  try { ws?.close(); } catch { /* ignoré */ }
  joinedAt = 0; pgOk = false; topic = "realtime:notiif-" + s.uid.slice(0, 8);
  const url = SB_URL.replace(/^http/, "ws") + "/realtime/v1/websocket?apikey=" + encodeURIComponent(SB_KEY) + "&vsn=1.0.0";
  let sock: WebSocket; try { sock = new WebSocket(url); } catch { return later(); }
  ws = sock;
  sock.onopen = () => {
    sentTok = s.access;
    send("phx_join", { config: { broadcast: { self: false }, presence: { key: "" }, postgres_changes: TABLES.map(([table]) => ({ event: "*", schema: "public", table })) }, access_token: s.access });
    clearInterval(hb); hb = setInterval(() => {
      send("heartbeat", {}, "phoenix");
      const cur = getSess(); if (cur && cur.access !== sentTok) { sentTok = cur.access; send("access_token", { access_token: cur.access }); }
    }, 25000);
  };
  sock.onmessage = (e) => {
    let m: any; try { m = JSON.parse(String(e.data)); } catch { return; }
    if (m.event === "phx_reply" && m.topic === topic && m.payload?.status === "ok" && !joinedAt) { joinedAt = Date.now(); retry = 0; handler("msg"); return; }
    if (m.event === "phx_reply" && m.topic === topic && m.payload?.status === "error") { try { sock.close(); } catch { /* ignoré */ } return; }
    if (m.event === "system" && m.topic === topic && m.payload?.extension === "postgres_changes") { pgOk = m.payload?.status === "ok"; if (pgOk) handler("msg"); return; }
    if (m.event === "postgres_changes") {
      const table = m.payload?.data?.table as string; const k = TABLES.find((x) => x[0] === table)?.[1]; if (!k) return;
      lastEvent = Date.now(); handler(k);
    }
  };
  sock.onclose = () => { if (ws === sock) { ws = null; joinedAt = 0; pgOk = false; clearInterval(hb); later(); } };
  sock.onerror = () => { try { sock.close(); } catch { /* ignoré */ } };
}
function later() { retry = Math.min(retry + 1, 6); setTimeout(() => { if (!ws) connect(); }, 1000 * 2 ** retry); }

/** Démarre l'écoute ; `on` est appelé dès qu'il y a du nouveau. */
export function startLive(on: (k: Kind) => void) {
  handler = on;
  if (!ws) connect();
  // Retour sur l'appli / retour du réseau : on se reconnecte sans attendre.
  const wake = () => { if (document.visibilityState !== "hidden" && (!ws || ws.readyState > 1)) { retry = 0; connect(); } };
  document.addEventListener("visibilitychange", wake); window.addEventListener("online", wake);
}
export function stopLive() { try { ws?.close(); } catch { /* ignoré */ } ws = null; clearInterval(hb); }
