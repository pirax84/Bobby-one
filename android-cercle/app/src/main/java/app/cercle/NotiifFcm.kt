package app.cercle

import android.app.Notification
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/** Reçoit les notifications envoyées par le serveur (Firebase), même quand l'application est fermée. */
class NotiifFcm : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        getSharedPreferences("notiif_fcm", Context.MODE_PRIVATE).edit().putString("token", token).apply()
    }

    override fun onMessageReceived(msg: RemoteMessage) {
        val d = msg.data
        if (d.isEmpty() || NotiifService.visible) return
        val id = d["id"] ?: System.currentTimeMillis().toString()
        if (!NotiifService.claim(id)) return
        val sender = d["sender"] ?: ""
        val who = d["name"] ?: "Un ami"
        val kind = d["kind"] ?: "text"
        if (kind == "call") {
            NotiifService.channels(this)
            val nmc = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val pic = PendingIntent.getActivity(this, ("c" + sender).hashCode(), Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP).putExtra("conv", "sbc_" + sender), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
            val bc = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, NotiifService.CH_CALL) else Notification.Builder(this)
            bc.setContentTitle("📞 " + who).setContentText("Appel NOTIIF : touche pour répondre").setSmallIcon(R.drawable.ic_notif).setColor(0xFF0A838B.toInt()).setCategory(Notification.CATEGORY_CALL).setContentIntent(pic).setAutoCancel(true)
            if (Build.VERSION.SDK_INT >= 26) bc.setTimeoutAfter(45000)
            nmc.notify(("c" + sender).hashCode(), bc.build())
            return
        }
        val body = when (kind) { "fx" -> "✨ Nouvel effet"; "audio" -> "🎤 Nouveau vocal"; "video" -> "🎬 Nouvelle vidéo"; "image" -> "📷 Nouvelle photo"; else -> "💬 Nouveau message" }
        val chId = when (kind) { "audio" -> NotiifService.CH_VOC; "video", "image" -> NotiifService.CH_MED; else -> NotiifService.CH_TXT }
        NotiifService.channels(this)
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.cancel(("t" + sender).hashCode())
        val pi = PendingIntent.getActivity(this, ("m" + sender).hashCode(), Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP).putExtra("conv", "sbc_" + sender + (if (kind == "audio") "~a" else "")), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val b = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, chId) else Notification.Builder(this)
        b.setContentTitle(who).setContentText(body).setSmallIcon(R.drawable.ic_notif).setColor(0xFF0A838B.toInt()).setContentIntent(pi).setAutoCancel(true)
        nm.notify(("m" + sender).hashCode(), b.build())
    }
}
