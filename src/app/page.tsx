'use client'

import { useAuthStore } from '@/lib/services/auth.service'
import Link from 'next/link'

// השבתת prerendering עבור עמוד זה
export const dynamic = 'force-dynamic'

const menuItems = {
  admin: [
    { href: '/admin/websocket', label: 'ניהול חיבורי WebSocket' },
    { href: '/admin/lockers', label: 'ניהול לוקרים' },
    { href: '/admin/users', label: 'ניהול משתמשים' },
  ],
  courier: [
    { href: '/courier/deliveries', label: 'משלוחים פעילים' },
    { href: '/courier/history', label: 'היסטוריית משלוחים' },
  ],
  customer: [
    { href: '/customer/packages', label: 'החבילות שלי' },
    { href: '/customer/history', label: 'היסטוריית משלוחים' },
  ],
}

export default function HomePage() {
  const { user, logout } = useAuthStore()
  const isDevelopment = process.env.NODE_ENV === 'development'

  if (!user && !isDevelopment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-8">ברוכים הבאים למערכת הלוקרים</h1>
          <div className="space-x-4">
            <Link href="/login" className="btn-primary">
              התחברות
            </Link>
            <Link href="/register" className="btn-secondary">
              הרשמה
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // במצב פיתוח - הצג תפריט מלא
  if (isDevelopment && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          {/* הודעת מצב פיתוח */}
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400 text-xl">⚠️</span>
              <span className="text-yellow-400 font-bold">מצב פיתוח</span>
            </div>
            <p className="text-yellow-300/80 text-sm mt-1">
              האימות מושבת. תוכל לגשת לכל הדפים ללא התחברות.
            </p>
          </div>

          {/* כותרת */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-2">מערכת הלוקרים - מצב פיתוח</h1>
            <p className="text-white/70">בחר את הדף שברצונך לבדוק</p>
          </div>

          {/* תפריט פיתוח */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* דפי אדמין */}
            <div className="glass-card">
              <h3 className="text-xl font-bold text-purple-400 mb-4">🔧 אדמין</h3>
              <div className="space-y-2">
                <Link href="/admin" className="block text-white hover:text-purple-400 transition-colors">
                  • דף אדמין ראשי
                </Link>
                <Link href="/admin/websocket" className="block text-white hover:text-purple-400 transition-colors">
                  • ניהול WebSocket
                </Link>
                <Link href="/admin/lockers" className="block text-white hover:text-purple-400 transition-colors">
                  • ניהול לוקרים
                </Link>
                <Link href="/admin/packages" className="block text-white hover:text-purple-400 transition-colors">
                  • ניהול חבילות
                </Link>
                <Link href="/admin/settings" className="block text-white hover:text-purple-400 transition-colors">
                  • הגדרות
                </Link>
                <Link href="/admin/logs" className="block text-white hover:text-purple-400 transition-colors">
                  • לוגים
                </Link>
                <Link href="/admin/reports" className="block text-white hover:text-purple-400 transition-colors">
                  • דוחות
                </Link>
              </div>
            </div>

            {/* דפי שליח */}
            <div className="glass-card">
              <h3 className="text-xl font-bold text-green-400 mb-4">🚚 שליח</h3>
              <div className="space-y-2">
                <Link href="/courier" className="block text-white hover:text-green-400 transition-colors">
                  • דף שליח ראשי
                </Link>
                <Link href="/courier/scan-qr" className="block text-white hover:text-green-400 transition-colors">
                  • סריקת QR
                </Link>
                <Link href="/courier/select-locker" className="block text-white hover:text-green-400 transition-colors">
                  • בחירת לוקר
                </Link>
                <Link href="/courier/change-cell" className="block text-white hover:text-green-400 transition-colors">
                  • החלפת תא
                </Link>
                <Link href="/courier/success" className="block text-white hover:text-green-400 transition-colors">
                  • דף הצלחה
                </Link>
              </div>
            </div>

            {/* דפי לקוח */}
            <div className="glass-card">
              <h3 className="text-xl font-bold text-blue-400 mb-4">👤 לקוח</h3>
              <div className="space-y-2">
                <Link href="/customer" className="block text-white hover:text-blue-400 transition-colors">
                  • דף לקוח ראשי
                </Link>
                <Link href="/login" className="block text-white hover:text-blue-400 transition-colors">
                  • דף התחברות
                </Link>
                <Link href="/register" className="block text-white hover:text-blue-400 transition-colors">
                  • דף הרשמה
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const userMenu = user ? menuItems[user.role] || [] : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* כותרת */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">שלום, {user?.name || 'משתמש'}!</h1>
          <p className="text-white/70">מה תרצה לעשות היום?</p>
        </div>

        {/* תפריט */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {userMenu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="glass-card hover:bg-white/10 transition-colors duration-200 text-center group"
            >
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                {item.label}
              </h2>
              <p className="text-white/50">לחץ כדי לעבור לדף</p>
            </Link>
          ))}
        </div>

        {/* כפתור התנתקות */}
        <div className="text-center mt-12">
          <button
            onClick={logout}
            className="btn-secondary"
          >
            התנתקות
          </button>
        </div>
      </div>
    </div>
  )
} 