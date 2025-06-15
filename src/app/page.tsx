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

  if (!user) {
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

  const userMenu = menuItems[user.role] || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* כותרת */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">שלום, {user.name}!</h1>
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