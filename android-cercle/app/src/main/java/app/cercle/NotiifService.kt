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
        const val CH_MSG = "cercle_messages"
        @Volatile var visible = false
        fun start(ctx: Context) {
            val i = Intent(ctx, NotiifService::class.java)
            if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(i) else ctx.startService(i)
        }
        fun stop(ctx: Context) { ctx.stopService(Intent(ctx, NotiifService::class.java)) }
    }

    @Volatile private var running = false
    private var worker: Thread? = null
    private val names = HashMap<String, String>()

    override fun onBind(i: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= 26) {
            if (nm.getNotificationChannel(CH_SVC) == null) nm.createNotificationChannel(NotificationChannel(CH_SVC, "NOTIIF en veille", NotificationManager.IMPORTANCE_MIN))
            if (nm.getNotificationChannel(CH_MSG) == null) {
                val ch = NotificationChannel(CH_MSG, "Messages et activité", NotificationManager.IMPORTANCE_HIGH)
                ch.enableVibration(true); ch.vibrationPattern = longArrayOf(0, 200, 100, 200); nm.createNotificationChannel(ch)
            }
        }
        val pi = PendingIntent.getActivity(this, 0, Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val b = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, CH_SVC) else Notification.Builder(this)
        val n = b.setContentTitle("NOTIIF").setContentText("Je surveille tes messages").setSmallIcon(R.drawable.ic_notif).setContentIntent(pi).setOngoing(true).build()
        if (Build.VERSION.SDK_INT >= 29) startForeground(1, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC) else startForeground(1, n)
        if (!running) {
            running = true
            worker = Thread {
                while (running) {
                    try { poll() } catch (e: Exception) { }
                    try { Thread.sleep(6000) } catch (e: InterruptedException) { break }
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

    private fun poll() {
        val p = prefs(); val base = p.getString("url", null) ?: return; val key = p.getString("key", null) ?: return
        val uid = p.getString("uid", null) ?: return; var tk = p.getString("access", null) ?: return
        var last = p.getString("last", null)
        if (last == null) { val f = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US); f.timeZone = TimeZone.getTimeZone("UTC"); last = f.format(Date()); p.edit().putString("last", last).apply() }
        val q = "$base/rest/v1/messages?recipient=eq.$uid&created_at=gt.${URLEncoder.encode(last, "UTF-8")}&order=created_at.asc&limit=20&select=id,sender,body,fx,created_at"
        var r = http("GET", q, key, tk)
        if (r.first == 401 || r.first == 403) { if (refresh(base, key)) { tk = p.getString("access", tk)!!; r = http("GET", q, key, tk) } }
        if (r.first !in 200..299) return
        val arr = JSONArray(r.second); if (arr.length() == 0) return
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        for (i in 0 until arr.length()) {
            val m = arr.getJSONObject(i); last = m.getString("created_at")
            if (visible) continue
            val who = nameOf(base, key, tk, m.getString("sender"))
            val fx = if (m.isNull("fx")) "" else m.getString("fx")
            val body = if (fx.isNotEmpty()) "✨ t'a envoyé un effet" else m.getString("body")
            val pi = PendingIntent.getActivity(this, 0, Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
            val b = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, CH_MSG) else Notification.Builder(this)
            b.setContentTitle(who).setContentText(body).setSmallIcon(R.drawable.ic_notif).setColor(0xFF0A838B.toInt()).setContentIntent(pi).setAutoCancel(true)
            nm.notify(m.getString("id").hashCode(), b.build())
        }
        p.edit().putString("last", last).apply()
    }
}
