'use client'

import Link from 'next/link'

// השבתת prerendering עבור עמוד זה
export const dynamic = 'force-dynamic'

export default function HomePage() {
  // מצב פיתוח - אין אימות - גרסה מעודכנת 2025
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 p-6">
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

          {/* כפתור דף הדגמה ללקוחות */}
          <div className="text-center mb-12">
            <button
              onClick={() => window.open('/demo', '_blank')}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-4 rounded-lg font-bold text-xl shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              🎯 דף הדגמה ללקוחות
            </button>
            <p className="text-white/50 text-sm mt-2">דף הדגמה מקצועי לשיווק ומכירות</p>
          </div>

          {/* רשימת כל הדפים באפליקציה */}
          <div className="mb-12">
            <div className="glass-card">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">📄 כל הדפים באפליקציה</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                
                {/* דפי אדמין */}
                <div>
                  <h4 className="text-blue-300 font-bold mb-2">🔧 אדמין:</h4>
                  <div className="space-y-1 text-white/80">
                    <Link href="/admin" className="block hover:text-blue-300 transition-colors cursor-pointer">
                      • דף אדמין ראשי - ניהול 1
                    </Link>
                    <Link href="/admin/websocket" className="block hover:text-blue-300 transition-colors cursor-pointer">
                      • ניהול WebSocket - ניהול 2
                    </Link>
                    <Link href="/admin/lockers-management" className="block hover:text-blue-300 transition-colors cursor-pointer">
                      • ניהול לוקרים - ניהול 3
                    </Link>
                    <Link href="/admin/packages" className="block hover:text-blue-300 transition-colors cursor-pointer">
                      • ניהול חבילות - ניהול 4
                    </Link>
                    <Link href="/admin/settings" className="block hover:text-blue-300 transition-colors cursor-pointer">
                      • הגדרות - ניהול 5
                    </Link>
                    <Link href="/admin/logs" className="block hover:text-blue-300 transition-colors cursor-pointer">
                      • לוגים - ניהול 6
                    </Link>
                    <Link href="/admin/reports" className="block hover:text-blue-300 transition-colors cursor-pointer">
                      • דוחות - ניהול 7
                    </Link>
                  </div>
                </div>

                {/* דפי שליח */}
                <div>
                  <h4 className="text-blue-200 font-bold mb-2">🚚 שליח:</h4>
                  <div className="space-y-1 text-white/80">
                    <Link href="/courier" className="block hover:text-blue-200 transition-colors cursor-pointer">
                      • דף שליח ראשי - שליח 1
                    </Link>
                    <Link href="/courier/scan-qr" className="block hover:text-blue-200 transition-colors cursor-pointer">
                      • סריקת QR - שליח 2
                    </Link>
                    <Link href="/courier/location-search" className="block hover:text-blue-200 transition-colors cursor-pointer">
                      • חיפוש מיקום - שליח 3
                    </Link>
                    <Link href="/courier/size-selection" className="block hover:text-blue-200 transition-colors cursor-pointer">
                      • בחירת גודל - שליח 4
                    </Link>
                    <Link href="/courier/lockers-list" className="block hover:text-blue-200 transition-colors cursor-pointer">
                      • רשימת לוקרים - שליח 5
                    </Link>
                    <Link href="/courier/select-locker" className="block hover:text-blue-200 transition-colors cursor-pointer">
                      • בחירת לוקר - שליח 6
                    </Link>
                    <Link href="/courier/select-cell" className="block hover:text-blue-200 transition-colors cursor-pointer">
                      • בחירת תא - שליח 7
                    </Link>
                    <Link href="/courier/cell-verification" className="block hover:text-blue-200 transition-colors cursor-pointer">
                      • אימות תא - שליח 8
                    </Link>
                    <Link href="/courier/change-cell" className="block hover:text-blue-200 transition-colors cursor-pointer">
                      • החלפת תא - שליח 9
                    </Link>
                    <Link href="/courier/success" className="block hover:text-blue-200 transition-colors cursor-pointer">
                      • דף הצלחה - שליח 10
                    </Link>
                  </div>
                </div>

                {/* דפי לקוח */}
                <div>
                  <h4 className="text-blue-100 font-bold mb-2">👤 לקוח:</h4>
                  <div className="space-y-1 text-white/80">
                    <Link href="/customer" className="block hover:text-blue-100 transition-colors cursor-pointer">
                      • דף לקוח ראשי - לקוח 1
                    </Link>
                    <Link href="/customer/unlock/XYZ123" className="block hover:text-blue-100 transition-colors cursor-pointer">
                      • פתיחת חבילה - לקוח 2
                    </Link>
                    <Link href="/customer/unlock-demo" className="block hover:text-blue-100 transition-colors cursor-pointer">
                      • הדגמה פתיחה - לקוח 3
                    </Link>
                  </div>
                </div>

                {/* דפי עסק */}
                <div>
                  <h4 className="text-yellow-300 font-bold mb-2">🏢 עסק:</h4>
                  <div className="space-y-1 text-white/80">
                    <Link href="/business" className="block hover:text-yellow-300 transition-colors cursor-pointer">
                      • דף עסק ראשי - עסק 1
                    </Link>
                    <Link href="/business/categories" className="block hover:text-yellow-300 transition-colors cursor-pointer">
                      • קטגוריות מוצרים - עסק 2
                    </Link>
                    <Link href="/business/product-purchase" className="block hover:text-yellow-300 transition-colors cursor-pointer">
                      • קניית מוצרים - עסק 3
                    </Link>
                    <Link href="/business/product-rental" className="block hover:text-yellow-300 transition-colors cursor-pointer">
                      • השכרת מוצרים - עסק 4
                    </Link>
                    <Link href="/business/locker-rental" className="block hover:text-yellow-300 transition-colors cursor-pointer">
                      • השכרת לוקרים - עסק 5
                    </Link>
                    <Link href="/business/payment" className="block hover:text-yellow-300 transition-colors cursor-pointer">
                      • תשלום - עסק 6
                    </Link>
                    <Link href="/business/unlock" className="block hover:text-yellow-300 transition-colors cursor-pointer">
                      • פתיחת לוקר - עסק 7
                    </Link>
                    <Link href="/business/info" className="block hover:text-yellow-300 transition-colors cursor-pointer">
                      • מידע ושאלות - עסק 8
                    </Link>
                    <Link href="/business/help" className="block hover:text-yellow-300 transition-colors cursor-pointer">
                      • עזרה וקשר - עסק 9
                    </Link>
                  </div>
                </div>

                {/* דפי הדגמה */}
                <div>
                  <h4 className="text-yellow-400 font-bold mb-2">🎯 הדגמה:</h4>
                  <div className="space-y-1 text-white/80">
                    <Link href="/demo" className="block hover:text-yellow-400 transition-colors cursor-pointer">
                      • דף הדגמה ראשי - הדגמה 1
                    </Link>
                    <Link href="/demo/admin" className="block hover:text-yellow-400 transition-colors cursor-pointer">
                      • הדגמה אדמין - הדגמה 2
                    </Link>
                    <Link href="/demo/customer" className="block hover:text-yellow-400 transition-colors cursor-pointer">
                      • הדגמה לקוח - הדגמה 3
                    </Link>
                  </div>
                </div>

                {/* דפי API */}
                <div>
                  <h4 className="text-green-300 font-bold mb-2">⚙️ API:</h4>
                  <div className="space-y-1 text-white/80">
                    <a href="/api/lockers/available" target="_blank" className="block hover:text-green-300 transition-colors cursor-pointer">
                      • /api/lockers - API 1
                    </a>
                    <a href="/api/packages/track/ABC123" target="_blank" className="block hover:text-green-300 transition-colors cursor-pointer">
                      • /api/packages - API 2
                    </a>
                    <span className="block text-white/50 cursor-not-allowed">
                      • /api/unlock - API 3 (POST)
                    </span>
                    <a href="/api/admin/memory-status" target="_blank" className="block hover:text-green-300 transition-colors cursor-pointer">
                      • /api/admin/* - API 4
                    </a>
                    <span className="block text-white/50 cursor-not-allowed">
                      • /api/websocket - API 5 (WS)
                    </span>
                  </div>
                </div>

              </div>
              
              <div className="mt-6 p-4 bg-white/5 rounded-lg">
                <p className="text-white/60 text-xs text-center">
                  📊 סה"כ: ~35 דפים באפליקציה | 🔧 ניהול: 7 | 🚚 שליח: 10 | 👤 לקוח: 3 | 🏢 עסק: 9 | 🎯 הדגמה: 3 | ⚙️ API: 5+
                </p>
              </div>
            </div>
          </div>

          {/* תפריט פיתוח */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* דפי אדמין */}
            <div className="glass-card">
              <h3 className="text-xl font-bold text-blue-300 mb-4">🔧 אדמין</h3>
              <div className="space-y-2">
                <Link href="/admin" className="block text-white hover:text-blue-300 transition-colors">
                  • דף אדמין ראשי
                </Link>
                <Link href="/admin/websocket" className="block text-white hover:text-blue-300 transition-colors">
                  • ניהול WebSocket
                </Link>
                <Link 
                  href="/admin/lockers" 
                  className="block text-white hover:text-blue-300 transition-colors"
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
                <Link href="/admin/packages" className="block text-white hover:text-blue-300 transition-colors">
                  • ניהול חבילות
                </Link>
                <Link href="/admin/settings" className="block text-white hover:text-blue-300 transition-colors">
                  • הגדרות
                </Link>
                <Link href="/admin/logs" className="block text-white hover:text-blue-300 transition-colors">
                  • לוגים
                </Link>
                <Link href="/admin/reports" className="block text-white hover:text-blue-300 transition-colors">
                  • דוחות
                </Link>
              </div>
            </div>

            {/* דפי שליח */}
            <div className="glass-card">
              <h3 className="text-xl font-bold text-blue-200 mb-4">🚚 שליח</h3>
              <div className="space-y-2">
                <Link href="/courier" className="block text-white hover:text-blue-200 transition-colors">
                  • דף שליח ראשי
                </Link>
                <Link href="/courier/scan-qr" className="block text-white hover:text-blue-200 transition-colors">
                  • סריקת QR
                </Link>
                <Link href="/courier/select-locker" className="block text-white hover:text-blue-200 transition-colors">
                  • בחירת לוקר
                </Link>
                <Link href="/courier/change-cell" className="block text-white hover:text-blue-200 transition-colors">
                  • החלפת תא
                </Link>
                <Link href="/courier/success" className="block text-white hover:text-blue-200 transition-colors">
                  • דף הצלחה
                </Link>
              </div>
            </div>

            {/* דפי לקוח */}
            <div className="glass-card">
              <h3 className="text-xl font-bold text-blue-100 mb-4">👤 לקוח</h3>
              <div className="space-y-2">
                <Link href="/customer" className="block text-white hover:text-blue-100 transition-colors">
                  • דף לקוח ראשי
                </Link>
                <Link href="/customer/unlock/XYZ123" className="block text-white hover:text-blue-100 transition-colors">
                  • פתיחת חבילה (דוגמא)
                </Link>
              </div>
            </div>

            {/* דפי עסק */}
            <div className="glass-card">
              <h3 className="text-xl font-bold text-blue-200 mb-4">🏢 עסק</h3>
              <div className="space-y-2">
                <Link href="/business" className="block text-white hover:text-blue-200 transition-colors">
                  • דף עסק ראשי
                </Link>
                <Link href="/business/categories" className="block text-white hover:text-blue-200 transition-colors">
                  • קטגוריות מוצרים
                </Link>
                <Link href="/business/product-purchase" className="block text-white hover:text-blue-200 transition-colors">
                  • קניית מוצרים
                </Link>
                <Link href="/business/product-rental" className="block text-white hover:text-blue-200 transition-colors">
                  • השכרת מוצרים
                </Link>
                <Link href="/business/locker-rental" className="block text-white hover:text-blue-200 transition-colors">
                  • השכרת לוקרים
                </Link>
                <Link href="/business/payment" className="block text-white hover:text-blue-200 transition-colors">
                  • תשלום
                </Link>
                <Link href="/business/unlock" className="block text-white hover:text-blue-200 transition-colors">
                  • פתיחת לוקר
                </Link>
                <Link href="/business/info" className="block text-white hover:text-blue-200 transition-colors">
                  • מידע ושאלות נפוצות
                </Link>
                <Link href="/business/help" className="block text-white hover:text-blue-200 transition-colors">
                  • עזרה ויצירת קשר
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
} 