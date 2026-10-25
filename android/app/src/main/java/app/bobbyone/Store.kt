package app.bobbyone

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/** Petit coffre local (sur le téléphone uniquement) pour la liste noire, les messages reçus et les appels filtrés. */
object Store {
    private fun p(c: Context) = c.applicationContext.getSharedPreferences("bobby", Context.MODE_PRIVATE)

    @Synchronized fun blocklist(c: Context): List<String> {
        val a = try { JSONArray(p(c).getString("block", "[]")) } catch (e: Exception) { JSONArray() }
        return (0 until a.length()).map { a.optString(it) }
    }
    @Synchronized fun setBlocklist(c: Context, json: String) {
        val a = try { JSONArray(json) } catch (e: Exception) { JSONArray() }
        p(c).edit().putString("block", a.toString()).apply()
    }

    @Synchronized private fun list(c: Context, key: String): JSONArray =
        try { JSONArray(p(c).getString(key, "[]")) } catch (e: Exception) { JSONArray() }

    @Synchronized fun push(c: Context, key: String, o: JSONObject, max: Int) {
        val old = list(c, key); val out = JSONArray(); out.put(o)
        var i = 0
        while (i < old.length() && out.length() < max) { out.put(old.get(i)); i++ }
        p(c).edit().putString(key, out.toString()).apply()
    }
    @Synchronized fun get(c: Context, key: String): String = list(c, key).toString()
}
