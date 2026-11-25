package app.cercle

import android.annotation.SuppressLint
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.TextView
import kotlin.math.abs

/**
 * Bulle NOTIIF par-dessus les autres applications (seulement si la personne l'a activée et autorisée).
 * Elle apparaît quand NOTIIF passe en arrière-plan, disparaît quand on revient dans l'appli.
 * On la déplace au doigt ; un simple appui rouvre NOTIIF ; la glisser tout en bas la cache.
 */
class BubbleService : Service() {
    companion object {
        private const val P = "notiif"
        fun enabled(ctx: Context) = ctx.getSharedPreferences(P, Context.MODE_PRIVATE).getBoolean("overlay", true)
        fun allowed(ctx: Context) = Settings.canDrawOverlays(ctx)
        /** Affiche la bulle (appli en arrière-plan). */
        fun show(ctx: Context) {
            if (!enabled(ctx) || !allowed(ctx)) return
            try { ctx.startService(Intent(ctx, BubbleService::class.java)) } catch (e: Exception) { }
        }
        fun hide(ctx: Context) { try { ctx.stopService(Intent(ctx, BubbleService::class.java)) } catch (e: Exception) { } }
        /** Nombre de messages non lus affiché sur la bulle. */
        fun setUnread(ctx: Context, n: Int) {
            ctx.getSharedPreferences(P, Context.MODE_PRIVATE).edit().putInt("unread", n.coerceAtLeast(0)).apply()
            instance?.refresh()
        }
        fun addUnread(ctx: Context) {
            val p = ctx.getSharedPreferences(P, Context.MODE_PRIVATE); setUnread(ctx, p.getInt("unread", 0) + 1)
        }
        @Volatile private var instance: BubbleService? = null
    }

    private var wm: WindowManager? = null
    private var root: FrameLayout? = null
    private var badge: TextView? = null
    private var lp: WindowManager.LayoutParams? = null

    override fun onBind(i: Intent?): IBinder? = null

    private fun dp(v: Int) = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v.toFloat(), resources.displayMetrics).toInt()

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (!allowed(this)) { stopSelf(); return START_NOT_STICKY }
        instance = this
        if (root == null) create()
        refresh()
        return START_NOT_STICKY
    }

    @SuppressLint("ClickableViewAccessibility")
    private fun create() {
        val w = getSystemService(Context.WINDOW_SERVICE) as WindowManager; wm = w
        val size = dp(58)
        val box = FrameLayout(this)
        val icon = ImageView(this)
        icon.setImageResource(R.mipmap.ic_launcher)
        val bg = GradientDrawable(); bg.shape = GradientDrawable.OVAL; bg.setColor(Color.parseColor("#1E1B4B")); bg.setStroke(dp(2), Color.WHITE)
        icon.background = bg; icon.clipToOutline = true; icon.elevation = dp(6).toFloat()
        icon.contentDescription = "NOTIIF"
        box.addView(icon, FrameLayout.LayoutParams(size, size))
        val b = TextView(this)
        val bb = GradientDrawable(); bb.cornerRadius = dp(10).toFloat(); bb.setColor(Color.parseColor("#7C3AED")); bb.setStroke(dp(1), Color.WHITE)
        b.background = bb; b.setTextColor(Color.WHITE); b.textSize = 11f; b.gravity = Gravity.CENTER; b.setPadding(dp(5), 0, dp(5), 0); b.minWidth = dp(20)
        b.elevation = dp(8).toFloat()
        box.addView(b, FrameLayout.LayoutParams(FrameLayout.LayoutParams.WRAP_CONTENT, dp(20), Gravity.TOP or Gravity.END))
        badge = b

        val type = if (Build.VERSION.SDK_INT >= 26) WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY else @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE
        val p = WindowManager.LayoutParams(size + dp(6), size + dp(6), type, WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS, PixelFormat.TRANSLUCENT)
        p.gravity = Gravity.TOP or Gravity.START
        val sp = getSharedPreferences(P, Context.MODE_PRIVATE)
        val dm = resources.displayMetrics
        // Position gardée en pourcentage de l'écran : elle reste visible même si on tourne le téléphone.
        p.x = (sp.getFloat("ovx", 1f) * (dm.widthPixels - size)).toInt().coerceIn(0, dm.widthPixels - size)
        p.y = (sp.getFloat("ovy", 0.35f) * (dm.heightPixels - size)).toInt().coerceIn(0, dm.heightPixels - size)
        lp = p

        var sx = 0f; var sy = 0f; var ox = 0; var oy = 0; var moved = false
        box.setOnTouchListener { _, e ->
            when (e.action) {
                MotionEvent.ACTION_DOWN -> { sx = e.rawX; sy = e.rawY; ox = p.x; oy = p.y; moved = false; true }
                MotionEvent.ACTION_MOVE -> {
                    val dx = e.rawX - sx; val dy = e.rawY - sy
                    if (!moved && abs(dx) + abs(dy) > dp(8)) moved = true
                    if (moved) {
                        val m = resources.displayMetrics
                        p.x = (ox + dx).toInt().coerceIn(0, m.widthPixels - size); p.y = (oy + dy).toInt().coerceIn(0, m.heightPixels - size)
                        try { w.updateViewLayout(box, p) } catch (ex: Exception) { }
                    }
                    true
                }
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    val m = resources.displayMetrics
                    if (moved) {
                        // Glissée tout en bas de l'écran : on la cache jusqu'au prochain passage en arrière-plan.
                        if (e.rawY > m.heightPixels - dp(70)) { stopSelf(); return@setOnTouchListener true }
                        // Elle se colle au bord le plus proche, comme un aimant.
                        p.x = if (p.x + size / 2 < m.widthPixels / 2) 0 else m.widthPixels - size
                        try { w.updateViewLayout(box, p) } catch (ex: Exception) { }
                        sp.edit().putFloat("ovx", p.x.toFloat() / (m.widthPixels - size).coerceAtLeast(1)).putFloat("ovy", p.y.toFloat() / (m.heightPixels - size).coerceAtLeast(1)).apply()
                    } else if (e.action == MotionEvent.ACTION_UP) {
                        val it = Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
                        try { startActivity(it) } catch (ex: Exception) { }
                        stopSelf()
                    }
                    true
                }
                else -> false
            }
        }
        try { w.addView(box, p); root = box } catch (e: Exception) { stopSelf() }
    }

    fun refresh() {
        val b = badge ?: return
        val n = getSharedPreferences(P, Context.MODE_PRIVATE).getInt("unread", 0)
        b.post { b.text = if (n > 99) "99+" else n.toString(); b.visibility = if (n > 0) View.VISIBLE else View.GONE }
    }

    override fun onDestroy() {
        instance = null
        try { root?.let { wm?.removeView(it) } } catch (e: Exception) { }
        root = null
        super.onDestroy()
    }
}
