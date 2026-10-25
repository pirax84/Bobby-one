package app.bobbyone

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import org.json.JSONObject

/** Voit passer les messages reçus (e-mails, WhatsApp, Telegram, SMS) pour que Bobby puisse les classer et les analyser. */
class BobbyNotifListener : NotificationListenerService() {
    private var lastKey = ""
    private var lastAt = 0L

    private fun category(pkg: String): String? = when {
        pkg == "com.google.android.gm" || pkg.startsWith("com.google.android.gm.") || pkg == "com.microsoft.office.outlook" ||
            pkg == "com.yahoo.mobile.client.android.mail" || pkg == "ch.protonmail.android" || pkg == "com.samsung.android.email.provider" ||
            pkg == "com.fsck.k9" || pkg == "com.orange.mail.android" || pkg == "fr.laposte.lapostemail" -> "email"
        pkg == "com.whatsapp" || pkg == "com.whatsapp.w4b" -> "whatsapp"
        pkg == "org.telegram.messenger" || pkg == "org.telegram.messenger.web" || pkg == "org.thunderdog.challegram" -> "telegram"
        pkg == "com.google.android.apps.messaging" || pkg == "com.samsung.android.messaging" || pkg == "com.android.mms" ||
            pkg == "com.android.messaging" || pkg == "com.sec.android.app.messaging" -> "sms"
        pkg == "com.facebook.orca" || pkg == "com.instagram.android" || pkg == "org.thoughtcrime.securesms" ||
            pkg == "com.snapchat.android" || pkg == "com.zhiliaoapp.musically" || pkg == "com.discord" || pkg == "com.viber.voip" -> "other"
        else -> null
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        try {
            val s = sbn ?: return
            if (s.packageName == packageName) return
            val cat = category(s.packageName) ?: return
            val n = s.notification ?: return
            if (n.flags and Notification.FLAG_GROUP_SUMMARY != 0) return
            val ex = n.extras ?: return
            val title = ex.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
            val text = (ex.getCharSequence(Notification.EXTRA_BIG_TEXT) ?: ex.getCharSequence(Notification.EXTRA_TEXT))?.toString() ?: ""
            if (text.isBlank()) return
            val key = s.packageName + "|" + title + "|" + text
            val now = System.currentTimeMillis()
            if (key == lastKey && now - lastAt < 10000) return
            lastKey = key; lastAt = now
            Store.push(this, "notifs", JSONObject().put("cat", cat).put("app", s.packageName).put("title", title).put("text", text.take(1500)).put("date", now), 300)
        } catch (e: Exception) { }
    }
}
