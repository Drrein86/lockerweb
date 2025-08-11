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
                    <div>• דף אדמין ראשי - ניהול 1</div>
                    <div>• ניהול WebSocket - ניהול 2</div>
                    <div>• ניהול לוקרים - ניהול 3</div>
                    <div>• ניהול חבילות - ניהול 4</div>
                    <div>• הגדרות - ניהול 5</div>
                    <div>• לוגים - ניהול 6</div>
                    <div>• דוחות - ניהול 7</div>
                  </div>
                </div>

                {/* דפי שליח */}
                <div>
                  <h4 className="text-blue-200 font-bold mb-2">🚚 שליח:</h4>
                  <div className="space-y-1 text-white/80">
                    <div>• דף שליח ראשי - שליח 1</div>
                    <div>• סריקת QR - שליח 2</div>
                    <div>• חיפוש מיקום - שליח 3</div>
                    <div>• בחירת גודל - שליח 4</div>
                    <div>• רשימת לוקרים - שליח 5</div>
                    <div>• בחירת לוקר - שליח 6</div>
                    <div>• בחירת תא - שליח 7</div>
                    <div>• אימות תא - שליח 8</div>
                    <div>• החלפת תא - שליח 9</div>
                    <div>• דף הצלחה - שליח 10</div>
                  </div>
                </div>

                {/* דפי לקוח */}
                <div>
                  <h4 className="text-blue-100 font-bold mb-2">👤 לקוח:</h4>
                  <div className="space-y-1 text-white/80">
                    <div>• דף לקוח ראשי - לקוח 1</div>
                    <div>• פתיחת חבילה - לקוח 2</div>
                    <div>• הדגמה פתיחה - לקוח 3</div>
                  </div>
                </div>

                {/* דפי עסק */}
                <div>
                  <h4 className="text-yellow-300 font-bold mb-2">🏢 עסק:</h4>
                  <div className="space-y-1 text-white/80">
                    <div>• דף עסק ראשי - עסק 1</div>
                    <div>• קטגוריות מוצרים - עסק 2</div>
                    <div>• קניית מוצרים - עסק 3</div>
                    <div>• השכרת מוצרים - עסק 4</div>
                    <div>• השכרת לוקרים - עסק 5</div>
                    <div>• תשלום - עסק 6</div>
                    <div>• פתיחת לוקר - עסק 7</div>
                    <div>• מידע ושאלות - עסק 8</div>
                    <div>• עזרה וקשר - עסק 9</div>
                  </div>
                </div>

                {/* דפי הדגמה */}
                <div>
                  <h4 className="text-yellow-400 font-bold mb-2">🎯 הדגמה:</h4>
                  <div className="space-y-1 text-white/80">
                    <div>• דף הדגמה ראשי - הדגמה 1</div>
                    <div>• הדגמה אדמין - הדגמה 2</div>
                    <div>• הדגמה לקוח - הדגמה 3</div>
                  </div>
                </div>

                {/* דפי API */}
                <div>
                  <h4 className="text-green-300 font-bold mb-2">⚙️ API:</h4>
                  <div className="space-y-1 text-white/80">
                    <div>• /api/lockers - API 1</div>
                    <div>• /api/packages - API 2</div>
                    <div>• /api/unlock - API 3</div>
                    <div>• /api/admin/* - API 4</div>
                    <div>• /api/websocket - API 5</div>
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