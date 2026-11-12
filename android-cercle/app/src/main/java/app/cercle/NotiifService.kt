package app.cercle

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/** Service qui reste actif (avec une petite notification discrète) et demande au serveur s'il y a un nouveau message, même écran éteint. */
class NotiifService : Service() {
    companion object {
        const val CH_SVC = "notiif_service"
        const val CH_MSG = "notiif_msg_pop"
        const val CH_TXT = "notiif_txt3"
        const val CH_VOC = "notiif_voc4"
        const val CH_MED = "notiif_med3"
        const val CH_TYP = "notiif_typ3"
        const val CH_CALL = "notiif_call1"
        @Volatile var visible = false
        private val notified = LinkedHashSet<String>()
        /** Un même message ne doit déclencher qu'une seule notification (Firebase ou veille, le premier arrivé). */
        fun claim(id: String): Boolean = synchronized(notified) { if (!notified.add(id)) false else { if (notified.size > 300) notified.remove(notified.first()); true } }
        fun start(ctx: Context) {
            val i = Intent(ctx, NotiifService::class.java)
            if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(i) else ctx.startService(i)
        }
        fun channels(ctx: Context) {
            val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val packageName = ctx.packageName
        if (Build.VERSION.SDK_INT >= 26) {
            if (nm.getNotificationChannel(CH_CALL) == null) {
                val cc = NotificationChannel(CH_CALL, "Appels", NotificationManager.IMPORTANCE_HIGH)
                cc.enableVibration(true); cc.vibrationPattern = longArrayOf(0, 600, 300, 600, 300, 600)
                cc.setSound(android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_RINGTONE), android.media.AudioAttributes.Builder().setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION_RINGTONE).setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION).build())
                nm.createNotificationChannel(cc)
            }
            if (nm.getNotificationChannel(CH_SVC) == null) nm.createNotificationChannel(NotificationChannel(CH_SVC, "NOTIIF en veille", NotificationManager.IMPORTANCE_MIN))
            if (nm.getNotificationChannel(CH_MSG) == null) {
                val ch = NotificationChannel(CH_MSG, "Messages et activité", NotificationManager.IMPORTANCE_HIGH)
                ch.enableVibration(true); ch.vibrationPattern = longArrayOf(0, 200, 100, 200)
                ch.setSound(android.net.Uri.parse("android.resource://" + packageName + "/" + R.raw.notiif_pop), android.media.AudioAttributes.Builder().setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION).setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION).build())
                nm.createNotificationChannel(ch)
            }
            for ((id, nom, res) in listOf(Triple(CH_TXT, "Messages écrits", R.raw.notiif_fin_text), Triple(CH_VOC, "Vocaux", R.raw.notiif_fin_voice), Triple(CH_MED, "Photos et vidéos", R.raw.notiif_fin_media), Triple(CH_TYP, "En train d'écrire", R.raw.notiif_debut))) {
                if (nm.getNotificationChannel(id) == null) {
                    val c2 = NotificationChannel(id, nom, NotificationManager.IMPORTANCE_HIGH)
                    c2.enableVibration(true); c2.vibrationPattern = longArrayOf(0, 200, 100, 200)
                    c2.setSound(android.net.Uri.parse("android.resource://" + packageName + "/" + res), android.media.AudioAttributes.Builder().setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION).setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION).build())
                    nm.createNotificationChannel(c2)
                }
            }
        }
        }
        fun stop(ctx: Context) { ctx.stopService(Intent(ctx, NotiifService::class.java)) }
    }

    @Volatile private var running = false
    private var worker: Thread? = null
    private val names = HashMap<String, String>()

    override fun onBind(i: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        channels(this)
        val pi = PendingIntent.getActivity(this, 0, Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val b = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, CH_SVC) else Notification.Builder(this)
        val n = b.setContentTitle("NOTIIF").setContentText("Je surveille tes messages").setSmallIcon(R.drawable.ic_notif).setContentIntent(pi).setOngoing(true).build()
        if (Build.VERSION.SDK_INT >= 29) startForeground(1, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC) else startForeground(1, n)
        if (!running) {
            running = true
            worker = Thread {
                var k = 0
                while (running) {
                    try { typing() } catch (e: Exception) { }
                    if (k % 3 == 0) { try { poll() } catch (e: Exception) { } }
                    k++
                    try { Thread.sleep(2000) } catch (e: InterruptedException) { break }
                }
            }.also { it.isDaemon = true; it.start() }
        }
        return START_STICKY
    }

    override fun onDestroy() { running = false; worker?.interrupt(); super.onDestroy() }

    private fun prefs() = getSharedPreferences("notiif", Context.MODE_PRIVATE)

    private fun http(method: String, url: String, key: String, token: String?, body: String? = null): Pair<Int, String> {
        val c = URL(url).openConnection() as HttpURLConnection
        c.requestMethod = method; c.connectTimeout = 8000; c.readTimeout = 8000
        c.setRequestProperty("apikey", key); c.setRequestProperty("Content-Type", "application/json")
        if (token != null) c.setRequestProperty("Authorization", "Bearer $token")
        if (body != null) { c.doOutput = true; c.outputStream.use { it.write(body.toByteArray()) } }
        val code = c.responseCode
        val txt = (if (code in 200..299) c.inputStream else c.errorStream)?.bufferedReader()?.readText() ?: ""
        return Pair(code, txt)
    }

    private fun refresh(base: String, key: String): Boolean {
        val p = prefs(); val rt = p.getString("refresh", null) ?: return false
        val r = http("POST", "$base/auth/v1/token?grant_type=refresh_token", key, null, JSONObject().put("refresh_token", rt).toString())
        if (r.first !in 200..299) return false
        val j = JSONObject(r.second); p.edit().putString("access", j.getString("access_token")).putString("refresh", j.getString("refresh_token")).apply(); return true
    }

    private fun nameOf(base: String, key: String, token: String, id: String): String {
        names[id]?.let { return it }
        val r = http("GET", "$base/rest/v1/profiles?id=eq.$id&select=display_name", key, token)
        val n = try { JSONArray(r.second).getJSONObject(0).getString("display_name") } catch (e: Exception) { "Un ami" }
        names[id] = n; return n
    }

    private val tSeen = HashMap<String, String>()
    private val tSound = HashMap<String, Long>()

    /** « Quelqu'un t'écrit » : le début du son NOTIIF, même app fermée. */
    private fun typing() {
        if (visible) return
        val p = prefs(); val base = p.getString("url", null) ?: return; val key = p.getString("key", null) ?: return
        val uid = p.getString("uid", null) ?: return; var tk = p.getString("access", null) ?: return
        val q = "$base/rest/v1/typing?to_id=eq.$uid&select=user_id,at"
        var r = http("GET", q, key, tk)
        if (r.first == 401 || r.first == 403) { if (refresh(base, key)) { tk = p.getString("access", tk)!!; r = http("GET", q, key, tk) } }
        if (r.first !in 200..299) return
        val arr = JSONArray(r.second); val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        for (i in 0 until arr.length()) {
            val o = arr.getJSONObject(i); val u = o.getString("user_id"); val at = o.getString("at")
            val old = tSeen[u]; tSeen[u] = at
            if (old == null || old == at) continue
            if ((p.getString("mute", "") ?: "").split(",").contains(u)) continue
            val now = System.currentTimeMillis(); if (now - (tSound[u] ?: 0L) < 9000) continue; tSound[u] = now
            val who = nameOf(base, key, tk, u)
            val pi = PendingIntent.getActivity(this, ("t" + u).hashCode(), Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP).putExtra("conv", "sbc_" + u), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
            val b = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, CH_TYP) else Notification.Builder(this)
            b.setContentTitle(who).setContentText("est en train d'écrire…").setSmallIcon(R.drawable.ic_notif).setColor(0xFF0A838B.toInt()).setContentIntent(pi).setAutoCancel(true)
            if (Build.VERSION.SDK_INT >= 26) b.setTimeoutAfter(5000)
            nm.notify(("t" + u).hashCode(), b.build())
        }
    }

    private fun poll() {
        val p = prefs(); val base = p.getString("url", null) ?: return; val key = p.getString("key", null) ?: return
        val uid = p.getString("uid", null) ?: return; var tk = p.getString("access", null) ?: return
        var last = p.getString("last", null)
        if (last == null) { val f = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US); f.timeZone = TimeZone.getTimeZone("UTC"); last = f.format(Date()); p.edit().putString("last", last).apply() }
        val q = "$base/rest/v1/messages?recipient=eq.$uid&created_at=gt.${URLEncoder.encode(last, "UTF-8")}&order=created_at.asc&limit=20&select=id,sender,body,fx,created_at,media_kind"
        var r = http("GET", q, key, tk)
        if (r.first == 401 || r.first == 403) { if (refresh(base, key)) { tk = p.getString("access", tk)!!; r = http("GET", q, key, tk) } }
        if (r.first !in 200..299) return
        val arr = JSONArray(r.second); if (arr.length() == 0) return
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        for (i in 0 until arr.length()) {
            val m = arr.getJSONObject(i); last = m.getString("created_at")
            if (visible) continue
            if ((p.getString("mute", "") ?: "").split(",").contains(m.getString("sender"))) continue
            nm.cancel(("t" + m.getString("sender")).hashCode())
            if (!claim(m.getString("id"))) continue
            val who = nameOf(base, key, tk, m.getString("sender"))
            val fx = if (m.isNull("fx")) "" else m.getString("fx")
            val mk = if (m.has("media_kind") && !m.isNull("media_kind")) m.getString("media_kind") else ""
            val body = if (fx.isNotEmpty()) "✨ Nouvel effet" else if (mk == "audio") "🎤 Nouveau vocal" else if (mk == "video") "🎬 Nouvelle vidéo" else if (mk.isNotEmpty()) "📷 Nouvelle photo" else "💬 Nouveau message"
            val chId = if (mk == "audio") CH_VOC else if (mk.isNotEmpty()) CH_MED else CH_TXT
            val pi = PendingIntent.getActivity(this, ("m" + m.getString("sender")).hashCode(), Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP).putExtra("conv", "sbc_" + m.getString("sender") + (if (mk == "audio") "~a" else "")), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
            val b = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, chId) else Notification.Builder(this)
            b.setContentTitle(who).setContentText(body).setSmallIcon(R.drawable.ic_notif).setColor(0xFF0A838B.toInt()).setContentIntent(pi).setAutoCancel(true)
            nm.notify(("m" + m.getString("sender")).hashCode(), b.build())
        }
        p.edit().putString("last", last).apply()
    }
}
