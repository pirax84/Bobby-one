package app.bobbyone

import android.app.Activity
import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.util.Base64
import android.view.View
import android.webkit.CookieManager
import android.webkit.GeolocationPermissions
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import org.json.JSONObject

class MainActivity : Activity() {
    companion object {
        const val HOME = "https://bobby-one-six.vercel.app/"
        const val HOST = "bobby-one-six.vercel.app"
        const val RC_FILE = 1
    }

    private lateinit var web: WebView
    private var fileCb: ValueCallback<Array<Uri>>? = null
    private var recognizer: SpeechRecognizer? = null
    @Volatile var sharedImage: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        web = WebView(this)
        web.setBackgroundColor(0xFF070912.toInt())
        setContentView(web)

        val s = web.settings
        s.javaScriptEnabled = true
        s.domStorageEnabled = true
        s.databaseEnabled = true
        s.mediaPlaybackRequiresUserGesture = false
        s.setGeolocationEnabled(true)
        s.allowFileAccess = false
        s.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        s.userAgentString = s.userAgentString + " BobbyApp/1"
        CookieManager.getInstance().setAcceptCookie(true)

        web.addJavascriptInterface(Bridge(this), "_BobbyBridge")

        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val u = request.url
                if (u.scheme == "https" && u.host == HOST) return false
                try { startActivity(Intent(Intent.ACTION_VIEW, u)) } catch (e: Exception) { }
                return true
            }
            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                if (request.isForMainFrame) {
                    val html = "<html><body style='background:#070912;color:#fff;font-family:sans-serif;text-align:center;padding:40px'>" +
                        "<h2>Pas de connexion</h2><p>Bobby a besoin d'internet pour vérifier les sites.</p>" +
                        "<p><a href='$HOME' style='color:#8B7CFF;font-size:20px'>Réessayer</a></p></body></html>"
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
                    val audio = r.resources.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)
                    if (audio && !Perm.has(this@MainActivity, "mic")) { Perm.ask(this@MainActivity, "mic"); r.deny() }
                    else r.grant(r.resources)
                }
            }
            override fun onGeolocationPermissionsShowPrompt(origin: String, cb: GeolocationPermissions.Callback) {
                val ok = Perm.has(this@MainActivity, "geo")
                if (!ok) Perm.ask(this@MainActivity, "geo")
                cb.invoke(origin, ok, false)
            }
        }

        web.setDownloadListener { url, ua, cd, mime, _ ->
            try {
                val r = DownloadManager.Request(Uri.parse(url))
                r.setMimeType(mime); r.addRequestHeader("User-Agent", ua)
                r.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                val name = android.webkit.URLUtil.guessFileName(url, cd, mime)
                r.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name)
                (getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager).enqueue(r)
            } catch (e: Exception) { }
        }

        web.loadUrl(urlFor(intent))
    }

    /** Adresse à ouvrir selon la façon dont Bobby a été lancé (icône, Partager, lien). */
    private fun urlFor(i: Intent?): String {
        try {
            if (i?.action == Intent.ACTION_SEND) {
                val type = i.type ?: ""
                if (type.startsWith("text/")) {
                    val t = i.getStringExtra(Intent.EXTRA_TEXT) ?: ""
                    if (t.isNotBlank()) return HOME + "?text=" + Uri.encode(t)
                } else if (type.startsWith("image/")) {
                    @Suppress("DEPRECATION") val uri = (if (Build.VERSION.SDK_INT >= 33) i.getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java) else i.getParcelableExtra<Uri>(Intent.EXTRA_STREAM))
                    if (uri != null) {
                        val bytes = contentResolver.openInputStream(uri)?.use { it.readBytes() }
                        if (bytes != null && bytes.size < 8_000_000) {
                            sharedImage = "data:" + type + ";base64," + Base64.encodeToString(bytes, Base64.NO_WRAP)
                            return HOME + "?share=nativeimage"
                        }
                    }
                }
            }
            if (i?.action == Intent.ACTION_VIEW && i.data != null && i.data!!.host == HOST) return i.data.toString()
        } catch (e: Exception) { }
        return HOME
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        web.loadUrl(urlFor(intent))
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == RC_FILE) {
            fileCb?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data)); fileCb = null
        }
        super.onActivityResult(requestCode, resultCode, data)
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() { if (web.canGoBack()) web.goBack() else super.onBackPressed() }

    private var tts: TextToSpeech? = null
    private var ttsReady = false
    fun speakText(text: String, lang: String, pitch: Float, rate: Float) {
        val go = {
            tts?.let { t ->
                try {
                    t.language = java.util.Locale.forLanguageTag(lang)
                    t.setPitch(pitch); t.setSpeechRate(rate)
                    t.speak(text, TextToSpeech.QUEUE_FLUSH, null, "bobby")
                } catch (e: Exception) { }
            }
        }
        if (tts == null) { tts = TextToSpeech(applicationContext) { st -> ttsReady = st == TextToSpeech.SUCCESS; if (ttsReady) go() } }
        else if (ttsReady) go()
    }
    fun stopSpeaking() { try { tts?.stop() } catch (e: Exception) { } }
    override fun onDestroy() { recognizer?.destroy(); tts?.shutdown(); super.onDestroy() }

    private fun js(code: String) { runOnUiThread { web.evaluateJavascript(code, null) } }
    private fun heard(text: String, err: String) { js("window.__bobbyListen && window.__bobbyListen(" + JSONObject.quote(text) + "," + JSONObject.quote(err) + ")") }

    /** Reconnaissance vocale du téléphone (le micro du navigateur n'existe pas dans une application). */
    fun startListening(lang: String) {
        if (!SpeechRecognizer.isRecognitionAvailable(this)) { heard("", "unsupported"); return }
        if (!Perm.has(this, "mic")) { Perm.ask(this, "mic"); heard("", "not-allowed"); return }
        recognizer?.destroy()
        val r = SpeechRecognizer.createSpeechRecognizer(this); recognizer = r
        r.setRecognitionListener(object : RecognitionListener {
            override fun onReadyForSpeech(p: Bundle?) {}
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(v: Float) {}
            override fun onBufferReceived(b: ByteArray?) {}
            override fun onEndOfSpeech() {}
            override fun onPartialResults(b: Bundle?) {}
            override fun onEvent(t: Int, b: Bundle?) {}
            override fun onError(e: Int) {
                heard("", when (e) {
                    SpeechRecognizer.ERROR_NO_MATCH, SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "no-speech"
                    SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "not-allowed"
                    else -> "x"
                })
            }
            override fun onResults(b: Bundle?) {
                val t = b?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull() ?: ""
                if (t.isBlank()) heard("", "no-speech") else heard(t, "")
            }
        })
        val i = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
            .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            .putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang)
            .putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
        r.startListening(i)
    }

    fun stopListening() { try { recognizer?.cancel() } catch (e: Exception) { } }
}
