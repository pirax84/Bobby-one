package app.bobbyone

import android.content.Intent
import android.provider.CallLog
import android.provider.ContactsContract
import android.provider.Telephony
import android.provider.Settings
import android.webkit.JavascriptInterface
import org.json.JSONArray
import org.json.JSONObject

/** Pont entre l'écran de Bobby (le site) et le téléphone. Chaque fonction répond en texte (JSON). */
class Bridge(private val a: MainActivity) {

    @JavascriptInterface fun info(): String = JSONObject().put("app", true).put("sdk", android.os.Build.VERSION.SDK_INT).toString()

    @JavascriptInterface fun has(p: String): Boolean = Perm.has(a, p)

    @JavascriptInterface fun ask(p: String) { a.runOnUiThread { Perm.ask(a, p) } }

    @JavascriptInterface fun callLog(limit: Int): String {
        val out = JSONArray()
        if (!Perm.has(a, "calls")) return out.toString()
        try {
            val cols = arrayOf(CallLog.Calls.NUMBER, CallLog.Calls.CACHED_NAME, CallLog.Calls.TYPE, CallLog.Calls.DATE)
            a.contentResolver.query(CallLog.Calls.CONTENT_URI, cols, null, null, "date DESC")?.use { c ->
                while (c.moveToNext() && out.length() < limit) {
                    val type = when (c.getInt(2)) {
                        CallLog.Calls.OUTGOING_TYPE -> "out"
                        CallLog.Calls.MISSED_TYPE -> "missed"
                        CallLog.Calls.REJECTED_TYPE, 6 -> "rejected"
                        else -> "in"
                    }
                    val o = JSONObject().put("number", c.getString(0).takeUnless { it.isNullOrBlank() } ?: "Masqué").put("type", type).put("date", c.getLong(3))
                    c.getString(1)?.takeIf { it.isNotBlank() }?.let { o.put("name", it) }
                    out.put(o)
                }
            }
        } catch (e: Exception) { }
        return out.toString()
    }

    @JavascriptInterface fun sms(limit: Int): String {
        val out = JSONArray()
        if (!Perm.has(a, "sms")) return out.toString()
        try {
            val cols = arrayOf(Telephony.Sms.ADDRESS, Telephony.Sms.BODY, Telephony.Sms.DATE)
            a.contentResolver.query(Telephony.Sms.Inbox.CONTENT_URI, cols, null, null, "date DESC")?.use { c ->
                while (c.moveToNext() && out.length() < limit) {
                    out.put(JSONObject().put("address", c.getString(0) ?: "?").put("body", c.getString(1) ?: "").put("date", c.getLong(2)))
                }
            }
        } catch (e: Exception) { }
        return out.toString()
    }

    @JavascriptInterface fun contacts(): String {
        val out = JSONArray()
        if (!Perm.has(a, "contacts")) return out.toString()
        try {
            val map = LinkedHashMap<String, MutableList<String>>()
            val cols = arrayOf(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME, ContactsContract.CommonDataKinds.Phone.NUMBER)
            a.contentResolver.query(ContactsContract.CommonDataKinds.Phone.CONTENT_URI, cols, null, null, ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC")?.use { c ->
                while (c.moveToNext()) {
                    val n = c.getString(0) ?: continue; val t = c.getString(1) ?: continue
                    val l = map.getOrPut(n) { mutableListOf() }
                    if (l.none { it.filter(Char::isDigit) == t.filter(Char::isDigit) }) l.add(t)
                }
            }
            for ((n, t) in map) out.put(JSONObject().put("n", n).put("t", JSONArray(t)))
        } catch (e: Exception) { }
        return out.toString()
    }

    /** Messages vus au moment où ils arrivent (e-mails, WhatsApp, Telegram, SMS…). */
    @JavascriptInterface fun notifs(): String = Store.get(a, "notifs")

    /** Appels filtrés automatiquement par Bobby. */
    @JavascriptInterface fun screened(): String = Store.get(a, "screened")

    @JavascriptInterface fun clearNotifs() { a.getSharedPreferences("bobby", 0).edit().putString("notifs", "[]").apply() }

    @JavascriptInterface fun setBlocklist(json: String) { Store.setBlocklist(a, json) }

    @JavascriptInterface fun notify(title: String, text: String) { Notif.show(a, title, text) }

    @JavascriptInterface fun share(text: String) {
        a.runOnUiThread {
            try { a.startActivity(Intent.createChooser(Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text), "Partager")) } catch (e: Exception) { }
        }
    }

    @JavascriptInterface fun listen(lang: String) { a.runOnUiThread { a.startListening(lang) } }
    @JavascriptInterface fun stopListen() { a.runOnUiThread { a.stopListening() } }

    @JavascriptInterface fun takeSharedImage(): String { val s = a.sharedImage ?: ""; a.sharedImage = null; return s }

    @JavascriptInterface fun openAppSettings() {
        a.runOnUiThread {
            try { a.startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).setData(android.net.Uri.parse("package:" + a.packageName))) } catch (e: Exception) { }
        }
    }
}
