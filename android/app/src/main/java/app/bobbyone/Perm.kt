package app.bobbyone

import android.Manifest
import android.app.Activity
import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings

/** Autorisations demandées à l'utilisateur, avec des noms simples utilisés par l'écran. */
object Perm {
    const val RC_PERM = 3
    const val RC_ROLE = 2

    private fun perms(name: String): Array<String> = when (name) {
        "calls" -> arrayOf(Manifest.permission.READ_CALL_LOG)
        "sms" -> arrayOf(Manifest.permission.READ_SMS)
        "contacts" -> arrayOf(Manifest.permission.READ_CONTACTS)
        "mic" -> arrayOf(Manifest.permission.RECORD_AUDIO)
        "geo" -> arrayOf(Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION)
        "notif" -> if (Build.VERSION.SDK_INT >= 33) arrayOf(Manifest.permission.POST_NOTIFICATIONS) else emptyArray()
        else -> emptyArray()
    }

    fun has(c: Context, name: String): Boolean {
        when (name) {
            "notifaccess" -> {
                val s = Settings.Secure.getString(c.contentResolver, "enabled_notification_listeners") ?: return false
                return s.contains(c.packageName)
            }
            "screening" -> {
                if (Build.VERSION.SDK_INT < 29) return false
                val rm = c.getSystemService(Context.ROLE_SERVICE) as RoleManager
                return rm.isRoleHeld(RoleManager.ROLE_CALL_SCREENING)
            }
        }
        val list = perms(name)
        if (list.isEmpty()) return true
        // pour la position, une seule des deux suffit
        return if (name == "geo") list.any { c.checkSelfPermission(it) == PackageManager.PERMISSION_GRANTED }
        else list.all { c.checkSelfPermission(it) == PackageManager.PERMISSION_GRANTED }
    }

    fun ask(a: Activity, name: String) {
        try {
            when (name) {
                "notifaccess" -> a.startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
                "screening" -> {
                    if (Build.VERSION.SDK_INT >= 29) {
                        val rm = a.getSystemService(Context.ROLE_SERVICE) as RoleManager
                        if (rm.isRoleAvailable(RoleManager.ROLE_CALL_SCREENING) && !rm.isRoleHeld(RoleManager.ROLE_CALL_SCREENING))
                            a.startActivityForResult(rm.createRequestRoleIntent(RoleManager.ROLE_CALL_SCREENING), RC_ROLE)
                    }
                }
                else -> {
                    val list = perms(name)
                    if (list.isNotEmpty() && !has(a, name)) a.requestPermissions(list, RC_PERM)
                }
            }
        } catch (e: Exception) { /* le téléphone refuse : l'écran le verra avec has() */ }
    }
}
