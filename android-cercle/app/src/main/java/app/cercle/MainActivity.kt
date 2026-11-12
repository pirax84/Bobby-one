package app.cercle

import android.Manifest
import android.app.Activity
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.graphics.BitmapFactory
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.webkit.JavascriptInterface
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.view.WindowManager
import android.webkit.CookieManager
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient

class MainActivity : Activity() {
    companion object {
        const val HOME = "https://pirax84.github.io/Bobby-one/"
        const val HOST = "pirax84.github.io"
        const val RC_FILE = 1
        const val RC_PERM = 2
        const val RC_NOTIF = 3
        const val CHANNEL = "notiif_msg_pop"
    }

    private lateinit var web: WebView
    private var fileCb: ValueCallback<Array<Uri>>? = null
    private var pending: PermissionRequest? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Empêche les captures d'écran et l'enregistrement de l'écran, et masque l'aperçu dans les applications récentes.
        window.setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE)
        web = WebView(this)
        web.setBackgroundColor(0xFF0F172A.toInt())
        setContentView(web)

        val s = web.settings
        s.javaScriptEnabled = true
        s.domStorageEnabled = true
        s.databaseEnabled = true
        s.mediaPlaybackRequiresUserGesture = false
        s.allowFileAccess = false
        s.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        s.userAgentString = s.userAgentString + " CercleApp/1"
        CookieManager.getInstance().setAcceptCookie(true)

        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val u = request.url
                if (u.scheme == "https" && u.host == HOST && (u.path ?: "").startsWith("/Bobby-one")) return false
                if (u.scheme == "https" || u.scheme == "http") { try { startActivity(Intent(this@MainActivity, LinkActivity::class.java).putExtra("url", u.toString())) } catch (e: Exception) { } }
                return true
            }
            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                if (request.isForMainFrame) {
                    val html = "<html><body style='background:#0F172A;color:#fff;font-family:sans-serif;text-align:center;padding:40px'>" +
                        "<h2>Pas de connexion</h2><p>Vérifiez votre connexion internet.</p>" +
                        "<p><a href='$HOME' style='color:#22D3EE;font-size:20px'>Réessayer</a></p></body></html>"
                    view.loadDataWithBaseURL(HOME, html, "text/html", "UTF-8", null)
                }
            }
        }

        web.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(w: WebView, cb: ValueCallback<Array<Uri>>, p: FileChooserParams): Boolean {
                fileCb?.onReceiveValue(null); fileCb = cb
                return try { startActivityForResult(p.createIntent(), RC_FILE); true } catch (e: Exception) { fileCb = null; false }
            }
            override fun onPermissionRequest(r: PermissionRequest) {
                runOnUiThread {
                    val need = ArrayList<String>()
                    if (r.resources.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE) && checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) need.add(Manifest.permission.RECORD_AUDIO)
                    if (r.resources.contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE) && checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) need.add(Manifest.permission.CAMERA)
                    if (need.isEmpty()) r.grant(r.resources)
                    else { pending?.deny(); pending = r; requestPermissions(need.toTypedArray(), RC_PERM) }
                }
            }
        }

        web.addJavascriptInterface(Native(), "CercleNative")
        web.loadUrl(urlFor(intent))
    }


    /** Pont vers le téléphone : notifications et vibration (la page web seule ne peut pas les faire dans l'application). */
    inner class Native {
        /** Ouvre un lien dans une visionneuse de l'application (sans passer par le navigateur). */
        @JavascriptInterface fun openLink(url: String) {
            if (!(url.startsWith("https://") || url.startsWith("http://"))) return
            runOnUiThread { try { startActivity(Intent(this@MainActivity, LinkActivity::class.java).putExtra("url", url)) } catch (e: Exception) { } }
        }
        /** Donne au service de veille la session du compte (adresse du serveur, clé publique, jetons) pour qu'il surveille les nouveaux messages. */
        @JavascriptInterface fun setSession(url: String, key: String, access: String, refresh: String, uid: String) {
            getSharedPreferences("notiif", Context.MODE_PRIVATE).edit().putString("url", url).putString("key", key).putString("access", access).putString("refresh", refresh).putString("uid", uid).apply()
            runOnUiThread { try { NotiifService.start(this@MainActivity) } catch (e: Exception) { } }
        }
        /** Amis silencieux (aucune notification) et prioritaires, choisis dans l'application. */
        @JavascriptInterface fun setPrefs(mute: String, prio: String) {
            getSharedPreferences("notiif", Context.MODE_PRIVATE).edit().putString("mute", mute).putString("prio", prio).apply()
        }
        @JavascriptInterface fun clearSession() {
            getSharedPreferences("notiif", Context.MODE_PRIVATE).edit().clear().apply()
            runOnUiThread { try { NotiifService.stop(this@MainActivity) } catch (e: Exception) { } }
        }
        /** Demande à Android de ne pas endormir l'application (sinon les messages arrivent en retard écran éteint). */
        @JavascriptInterface fun askBattery() {
            runOnUiThread { try {
                val pm = getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
                if (!pm.isIgnoringBatteryOptimizations(packageName)) startActivity(Intent(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:$packageName")))
            } catch (e: Exception) { } }
        }
        @JavascriptInterface fun hasNotifPermission(): Boolean = Build.VERSION.SDK_INT < 33 || checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
        @JavascriptInterface fun askNotif() { runOnUiThread { if (Build.VERSION.SDK_INT >= 33 && !hasNotifPermission()) requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), RC_NOTIF) } }
        @JavascriptInterface fun notify(title: String, body: String) { notifyConv(title, body, "") }
        @JavascriptInterface fun notifyConv(title: String, body: String, conv: String) {
            if (!hasNotifPermission()) return
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            NotiifService.channels(this@MainActivity)
            if (false) {
                val ch = NotificationChannel(CHANNEL, "Messages et activité", NotificationManager.IMPORTANCE_HIGH)
                ch.enableVibration(true); ch.vibrationPattern = longArrayOf(0, 200, 100, 200); nm.createNotificationChannel(ch)
            }
            val nid = (System.currentTimeMillis() % 100000).toInt()
            val it = Intent(this@MainActivity, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            if (conv.isNotEmpty()) it.putExtra("conv", conv)
            val pi = PendingIntent.getActivity(this@MainActivity, nid, it, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
            val b = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this@MainActivity, CHANNEL) else Notification.Builder(this@MainActivity)
            b.setContentTitle(title).setContentText(body).setSmallIcon(R.drawable.ic_notif).setColor(0xFF0A838B.toInt()).setLargeIcon(BitmapFactory.decodeResource(resources, R.mipmap.ic_launcher)).setAutoCancel(true).setContentIntent(pi)
            nm.notify(nid, b.build())
        }
        /** Vibre selon un motif « durées en ms séparées par des virgules » (vibre, pause, vibre…), à la force demandée (1 à 255). */
        @JavascriptInterface fun vibrate(pattern: String, amplitude: Int) {
            try {
                val t = pattern.split(",").map { it.trim().toLong() }.toLongArray(); if (t.isEmpty()) return
                val v = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                if (Build.VERSION.SDK_INT >= 26) {
                    v.vibrate(VibrationEffect.createWaveform(longArrayOf(0) + t, intArrayOf(0) + IntArray(t.size) { if (it % 2 == 0) amplitude.coerceIn(1, 255) else 0 }, -1))
                } else v.vibrate(longArrayOf(0) + t, -1)
            } catch (e: Exception) { }
        }
    }

    private fun urlFor(i: Intent?): String {
        val d = i?.data
        val conv = i?.getStringExtra("conv")
        if (!conv.isNullOrEmpty()) return HOME + "#open=" + conv
        return if (i?.action == Intent.ACTION_VIEW && d != null && d.host == HOST) d.toString() else HOME
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        web.loadUrl(urlFor(intent))
    }

    override fun onRequestPermissionsResult(code: Int, perms: Array<out String>, res: IntArray) {
        super.onRequestPermissionsResult(code, perms, res)
        if (code == RC_PERM) {
            val r = pending; pending = null
            if (r != null) { if (res.isNotEmpty() && res.all { it == PackageManager.PERMISSION_GRANTED }) r.grant(r.resources) else r.deny() }
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == RC_FILE) {
            fileCb?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data)); fileCb = null
        }
    }

    override fun onResume() { super.onResume(); NotiifService.visible = true }
    override fun onPause() { NotiifService.visible = false; super.onPause() }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (web.canGoBack()) web.goBack() else super.onBackPressed()
    }
}
