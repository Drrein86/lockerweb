'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState, Suspense } from 'react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const trackingCode = searchParams.get('trackingCode')
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* הודעת הצלחה */}
        <div className="bg-white rounded-lg p-8 shadow-xl text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl text-white">✅</span>
            </div>
            <h1 className="text-3xl font-bold text-green-800 mb-2">
              החבילה הוזנה בהצלחה!
            </h1>
            <p className="text-gray-600 text-lg">
              התא נפתח, הודעה נשלחה ללקוח
            </p>
          </div>

          {/* פרטי הצלחה */}
          <div className="bg-green-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4">
              📋 סיכום התהליך
            </h3>
            <div className="space-y-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-green-600">📦</span>
                <span>החבילה נשמרה במערכת</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-green-600">🔓</span>
                <span>התא נפתח בהצלחה</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-green-600">📧</span>
                <span>הודעת אימייל נשלחה ללקוח</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-green-600">🔢</span>
                <span>התא מוגדר כתפוס</span>
              </div>
            </div>
          </div>

          {/* קוד מעקב */}
          {trackingCode && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-800 mb-2">קוד מעקב</h4>
              <div className="font-mono text-xl bg-white p-3 rounded border-2 border-blue-200">
                {trackingCode}
              </div>
            </div>
          )}

          {/* כפתורי פעולה */}
          <div className="space-y-3">
            <Link 
              href="/courier"
              className="btn-primary w-full text-lg py-3 inline-block"
            >
              🚚 הזן חבילה נוספת
            </Link>
            
            <Link 
              href="/"
              className="btn-secondary w-full text-lg py-3 inline-block"
            >
              🏠 חזרה לעמוד הראשי
            </Link>
          </div>

          {/* מעבר אוטומטי */}
          <div className="mt-6 text-sm text-gray-600">
            מעבר אוטומטי לדף הראשי בעוד {countdown} שניות...
          </div>
        </div>

        {/* מידע נוסף */}
        <div className="mt-8 bg-white rounded-lg p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            💡 טיפים לשליח
          </h3>
          <ul className="space-y-2 text-gray-600">
            <li>• וודא שהחבילה הוכנסה לתא המתאים</li>
            <li>• התא ינעל אוטומטית לאחר מספר שניות</li>
            <li>• הלקוח יקבל הודעה עם פרטי האיסוף</li>
            <li>• ניתן לעקוב אחרי הסטטוס במערכת הניהול</li>
          </ul>
        </div>

        {/* סטטיסטיקות יומיות */}
        <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">📊 הסטטיסטיקות שלך היום</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">12</div>
              <div className="text-sm opacity-90">חבילות הוזנו</div>
            </div>
            <div>
              <div className="text-2xl font-bold">8</div>
              <div className="text-sm opacity-90">נאספו</div>
            </div>
            <div>
              <div className="text-2xl font-bold">67%</div>
              <div className="text-sm opacity-90">שיעור איסוף</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center"><div className="text-xl">טוען...</div></div>}>
      <SuccessContent />
    </Suspense>
  )
}

// מעבר אוטומטי לעמוד הראשי לאחר 5 שניות
if (typeof window !== 'undefined') {
  setTimeout(() => {
    window.location.href = '/courier'
  }, 5000)
} 