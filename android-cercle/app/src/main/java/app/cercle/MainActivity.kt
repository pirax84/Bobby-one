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
        const val HOME = "https://nidami-three.vercel.app/"
        const val HOST = "nidami-three.vercel.app"
        const val RC_FILE = 1
        const val RC_PERM = 2
        const val RC_NOTIF = 3
        const val CHANNEL = "cercle_messages"
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
                if (u.scheme == "https" && u.host == HOST) return false
                try { startActivity(Intent(Intent.ACTION_VIEW, u)) } catch (e: Exception) { }
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
        @JavascriptInterface fun hasNotifPermission(): Boolean = Build.VERSION.SDK_INT < 33 || checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
        @JavascriptInterface fun askNotif() { runOnUiThread { if (Build.VERSION.SDK_INT >= 33 && !hasNotifPermission()) requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), RC_NOTIF) } }
        @JavascriptInterface fun notify(title: String, body: String) {
            if (!hasNotifPermission()) return
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CHANNEL) == null) {
                val ch = NotificationChannel(CHANNEL, "Messages et activité", NotificationManager.IMPORTANCE_HIGH)
                ch.enableVibration(true); ch.vibrationPattern = longArrayOf(0, 200, 100, 200); nm.createNotificationChannel(ch)
            }
            val pi = PendingIntent.getActivity(this@MainActivity, 0, Intent(this@MainActivity, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
            val b = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this@MainActivity, CHANNEL) else Notification.Builder(this@MainActivity)
            b.setContentTitle(title).setContentText(body).setSmallIcon(R.drawable.ic_notif).setColor(0xFF0A838B.toInt()).setLargeIcon(BitmapFactory.decodeResource(resources, R.mipmap.ic_launcher)).setAutoCancel(true).setContentIntent(pi)
            nm.notify((System.currentTimeMillis() % 100000).toInt(), b.build())
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

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (web.canGoBack()) web.goBack() else super.onBackPressed()
    }
}
