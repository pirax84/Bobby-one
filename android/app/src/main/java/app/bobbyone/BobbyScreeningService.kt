package app.bobbyone

import android.net.Uri
import android.os.Build
import android.provider.ContactsContract
import android.telecom.Call
import android.telecom.CallScreeningService
import org.json.JSONObject

/**
 * Filtre les appels entrants avant que le téléphone sonne.
 *  - numéro dans vos contacts : laissé passer
 *  - numéro marqué dangereux par vous : refusé (l'appelant tombe sur le répondeur)
 *  - démarchage commercial ou numéro surtaxé : le téléphone ne sonne pas
 */
class BobbyScreeningService : CallScreeningService() {

    private val demarchage = listOf("0162", "0163", "0270", "0271", "0377", "0378", "0424", "0425", "0568", "0569", "0948", "0949")

    private fun national(n: String): String {
        var d = n.filter { it.isDigit() }
        if (n.trim().startsWith("+33") || d.startsWith("33") && n.trim().startsWith("+")) d = "0" + d.removePrefix("33")
        if (d.startsWith("0033")) d = "0" + d.removePrefix("0033")
        return d
    }

    private fun inContacts(number: String): Boolean {
        if (!Perm.has(this, "contacts")) return false
        return try {
            val uri = Uri.withAppendedPath(ContactsContract.PhoneLookup.CONTENT_FILTER_URI, Uri.encode(number))
            contentResolver.query(uri, arrayOf(ContactsContract.PhoneLookup._ID), null, null, null)?.use { it.count > 0 } ?: false
        } catch (e: Exception) { false }
    }

    override fun onScreenCall(details: Call.Details) {
        var resp = CallResponse.Builder()
        try {
            if (Build.VERSION.SDK_INT >= 29 && details.callDirection != Call.Details.DIRECTION_INCOMING) { respondToCall(details, resp.build()); return }
            val number = details.handle?.schemeSpecificPart ?: ""
            if (number.isBlank() || inContacts(number)) { respondToCall(details, resp.build()); return }

            val last9 = number.filter { it.isDigit() }.takeLast(9)
            val nat = national(number)
            var action = ""; var reason = ""
            if (last9.length >= 6 && Store.blocklist(this).any { it.filter { c -> c.isDigit() }.takeLast(9) == last9 }) {
                action = "rejected"; reason = "Numéro marqué dangereux par vous"
                resp = resp.setDisallowCall(true).setRejectCall(true).setSkipNotification(true)
            } else if (demarchage.any { nat.startsWith(it) }) {
                action = "silenced"; reason = "Démarchage commercial"
                resp = resp.setSilenceCall(true)
            } else if (nat.startsWith("089")) {
                action = "silenced"; reason = "Numéro surtaxé"
                resp = resp.setSilenceCall(true)
            }
            if (action.isNotEmpty()) {
                Store.push(this, "screened", JSONObject().put("number", number).put("action", action).put("reason", reason).put("date", System.currentTimeMillis()), 100)
                Notif.show(this, if (action == "rejected") "Bobby a refusé un appel" else "Bobby a mis un appel en silence", "$number · $reason")
            }
        } catch (e: Exception) { /* en cas de doute, on laisse sonner */ }
        respondToCall(details, resp.build())
    }
}
