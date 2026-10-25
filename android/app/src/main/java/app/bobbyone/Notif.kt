package app.bobbyone

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager

object Notif {
    private const val CH = "bobby_alerts"

    fun show(c: Context, title: String, text: String, id: Int = (System.currentTimeMillis() % 100000).toInt()) {
        try {
            if (android.os.Build.VERSION.SDK_INT >= 33 &&
                c.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return
            val nm = c.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.createNotificationChannel(NotificationChannel(CH, "Alertes de Bobby", NotificationManager.IMPORTANCE_HIGH))
            val open = PendingIntent.getActivity(c, 0, Intent(c, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP),
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
            val n = Notification.Builder(c, CH)
                .setSmallIcon(R.drawable.ic_stat)
                .setContentTitle(title)
                .setContentText(text)
                .setStyle(Notification.BigTextStyle().bigText(text))
                .setContentIntent(open)
                .setAutoCancel(true)
                .setTimeoutAfter(15000)
                .build()
            nm.notify(id, n)
        } catch (e: Exception) { /* sans importance */ }
    }
}
