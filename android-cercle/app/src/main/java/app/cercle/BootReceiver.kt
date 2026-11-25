package app.cercle

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Après un redémarrage du téléphone (ou une mise à jour de l'appli) : relance la veille des messages si nécessaire. */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
        val a = intent.action ?: return
        if (a != Intent.ACTION_BOOT_COMPLETED && a != Intent.ACTION_MY_PACKAGE_REPLACED && a != "android.intent.action.QUICKBOOT_POWERON") return
        try { NotiifService.startIfNeeded(ctx) } catch (e: Exception) { }
    }
}
