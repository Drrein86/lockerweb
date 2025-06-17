'use client'

import Link from 'next/link'

// השבתת prerendering עבור עמוד זה
export const dynamic = 'force-dynamic'

export default function HomePage() {
  // מצב פיתוח - אין אימות - גרסה מעודכנת 2025
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          {/* הודעת מצב פיתוח */}
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400 text-xl">⚠️</span>
              <span className="text-yellow-400 font-bold">מצב פיתוח פעיל</span>
            </div>
            <p className="text-yellow-300/80 text-sm mt-1">
              האימות מושבת. תוכל לגשת לכל הדפים ללא התחברות.
            </p>
          </div>

          {/* כותרת */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-2">
              מערכת הלוקרים - מצב פיתוח
            </h1>
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
                <Link 
                  href="/admin/lockers" 
                  className="block text-white hover:text-purple-400 transition-colors"
                  onClick={(e) => {
                    console.log('🔗 לוחץ על ניהול לוקרים')
                    console.log('🎯 מפנה ל:', '/admin/lockers')
                    console.log('🌐 URL נוכחי:', typeof window !== 'undefined' ? window.location.href : 'SSR')
                    console.log('🔍 Event target:', e.target)
                    console.log('🔍 Event currentTarget:', e.currentTarget)
                  }}
                >
                  • ניהול לוקרים 🔧
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
                <Link href="/customer/unlock/XYZ123" className="block text-white hover:text-blue-400 transition-colors">
                  • פתיחת חבילה (דוגמא)
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
} 