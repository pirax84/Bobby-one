import { req, getSess } from "./server";
import { actions } from "./store";
// Appel vocal NOTIIF (WebRTC) : les deux téléphones s'échangent des « signaux » par le serveur, puis la voix passe en direct.
export type CallState = { phase: "idle" | "ringing-out" | "ringing-in" | "connecting" | "live"; peer: string; callId: string; muted: boolean; since: number; video: boolean; cam: boolean };
const ICE: RTCConfiguration = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }] };
let st: CallState = { phase: "idle", peer: "", callId: "", muted: false, since: 0, video: false, cam: true };
let remote: MediaStream | null = null;
export const streams = () => ({ local, remote });
const subs = new Set<() => void>(); const emit = () => subs.forEach((f) => f());
export const callState = () => st; export const onCall = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
const set = (p: Partial<CallState>) => { st = { ...st, ...p }; emit(); };
let pc: RTCPeerConnection | null = null; let local: MediaStream | null = null; let audioEl: HTMLAudioElement | null = null; let offerSdp = ""; let lastSeen = new Date(Date.now() - 5000).toISOString(); let timer: number | undefined; let ringTimer: number | undefined; let pendingIce: string[] = []; let remoteSet = false; const seen = new Set<string>();
const send = (to: string, callId: string, kind: string, payload?: unknown) => req("POST", "/rest/v1/call_signals", { to_id: to, call_id: callId, kind, payload: payload === undefined ? null : JSON.stringify(payload) }, "return=minimal");
function cleanup() { try { pc?.close(); } catch { /* rien */ } pc = null; local?.getTracks().forEach((t) => t.stop()); local = null; if (audioEl) { audioEl.srcObject = null; audioEl.remove(); audioEl = null; } offerSdp = ""; remote = null; pendingIce = []; remoteSet = false; if (ringTimer) { clearTimeout(ringTimer); ringTimer = undefined; } stopRing(); }
let ringIv: number | undefined;
function stopRing() { if (ringIv) { clearInterval(ringIv); ringIv = undefined; } }
function startRing(kind: "in" | "out") { stopRing(); const beep = () => { try { const a = new Audio("./sounds/notiif/debut.mp3"); a.volume = kind === "in" ? 0.9 : 0.4; void a.play().catch(() => {}); } catch { /* rien */ } try { navigator.vibrate?.(kind === "in" ? [300, 150, 300] : 0); } catch { /* rien */ } }; beep(); ringIv = window.setInterval(beep, 2600); }
async function makePc(peer: string, callId: string, video = false) {
  pc = new RTCPeerConnection(ICE); remoteSet = false; pendingIce = [];
  pc.onicecandidate = (e) => { if (e.candidate) void send(peer, callId, "ice", e.candidate.toJSON()); };
  pc.ontrack = (e) => { remote = e.streams[0]; emit(); if (!audioEl) { audioEl = document.createElement("audio"); audioEl.autoplay = true; (audioEl as any).playsInline = true; document.body.appendChild(audioEl); } audioEl.srcObject = e.streams[0]; void audioEl.play().catch(() => {}); };
  pc.onconnectionstatechange = () => { const s = pc?.connectionState; if (s === "connected" && st.phase !== "live") { stopRing(); set({ phase: "live", since: Date.now() }); } else if (s === "failed" || s === "closed") end(false); };
  local = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: video ? { facingMode: "user", width: { ideal: 640 } } : false }); local.getTracks().forEach((t) => pc!.addTrack(t, local!));
}
export async function startCall(peer: string, video = false) {
  if (st.phase !== "idle" || !getSess()) return false; const callId = crypto.randomUUID();
  try { set({ phase: "ringing-out", peer, callId, muted: false, since: 0, video, cam: true }); startRing("out"); await makePc(peer, callId, video); const o = await pc!.createOffer(); await pc!.setLocalDescription(o); await send(peer, callId, "offer", o); ringTimer = window.setTimeout(() => { if (st.phase === "ringing-out") end(true); }, 45000); return true; }
  catch { cleanup(); set({ phase: "idle", peer: "", callId: "", video: false }); return false; }
}
export async function accept() {
  if (st.phase !== "ringing-in") return; const { peer, callId } = st; stopRing(); set({ phase: "connecting" });
  try { await makePc(peer, callId, st.video); await pc!.setRemoteDescription(JSON.parse(offerSdp)); remoteSet = true; for (const c of pendingIce) await pc!.addIceCandidate(JSON.parse(c)).catch(() => {}); pendingIce = []; const a = await pc!.createAnswer(); await pc!.setLocalDescription(a); await send(peer, callId, "answer", a); }
  catch { end(true); }
}
export function end(notify = true) { const { peer, callId, phase } = st; if (notify && phase !== "idle" && peer) void send(peer, callId, "hangup"); cleanup(); set({ phase: "idle", peer: "", callId: "", since: 0, video: false, cam: true }); }
export function decline() { end(true); }
export function toggleCam() { const on = !st.cam; local?.getVideoTracks().forEach((t) => { t.enabled = on; }); set({ cam: on }); }
export function toggleMute() { const m = !st.muted; local?.getAudioTracks().forEach((t) => { t.enabled = !m; }); set({ muted: m }); }
async function poll() {
  const me = getSess()?.uid; if (!me) return;
  const r = await req("GET", `/rest/v1/call_signals?to_id=eq.${me}&created_at=gt.${encodeURIComponent(lastSeen)}&order=created_at.asc&limit=50&select=id,from_id,call_id,kind,payload,created_at`); if (!r.ok || !Array.isArray(r.data)) return;
  for (const m of r.data as { id: string; from_id: string; call_id: string; kind: string; payload: string | null; created_at: string }[]) {
    lastSeen = m.created_at; if (seen.has(m.id)) continue; seen.add(m.id); void req("DELETE", `/rest/v1/call_signals?id=eq.${m.id}`);
    if (Date.now() - Date.parse(m.created_at) > 60000) { if (m.kind === "offer") actions.missedCall(m.from_id, m.call_id, Date.parse(m.created_at)); continue; }
    if (m.kind === "offer") { if (st.phase !== "idle") { void send(m.from_id, m.call_id, "hangup"); continue; } offerSdp = m.payload || ""; set({ phase: "ringing-in", peer: m.from_id, callId: m.call_id, muted: false, since: 0, video: offerSdp.includes("m=video"), cam: true }); startRing("in"); }
    else if (m.call_id !== st.callId) continue;
    else if (m.kind === "answer" && pc && st.phase === "ringing-out") { try { await pc.setRemoteDescription(JSON.parse(m.payload || "{}")); remoteSet = true; for (const c of pendingIce) await pc.addIceCandidate(JSON.parse(c)).catch(() => {}); pendingIce = []; stopRing(); set({ phase: "connecting" }); } catch { end(true); } }
    else if (m.kind === "ice") { if (pc && remoteSet) await pc.addIceCandidate(JSON.parse(m.payload || "{}")).catch(() => {}); else pendingIce.push(m.payload || "{}"); }
    else if (m.kind === "hangup") { if (st.phase === "ringing-in") actions.missedCall(st.peer, st.callId); end(false); }
  }
}
export function startCallWatch() { if (timer) return; timer = window.setInterval(() => { if (document.visibilityState === "visible" || st.phase !== "idle") void poll(); }, 1200); }
