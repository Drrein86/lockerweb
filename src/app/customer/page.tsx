'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function CustomerPage() {
  const [trackingCode, setTrackingCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleTrackingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingCode.trim()) {
      alert('אנא הזן קוד מעקב')
      return
    }

    setLoading(true)
    
    try {
      // בדיקת תקינות קוד המעקב
      const response = await fetch(`/api/packages/track/${trackingCode}`)
      const data = await response.json()
      
      if (response.ok && data.package) {
        // מעבר לדף פתיחת הלוקר
        window.location.href = `/customer/unlock/${trackingCode}`
      } else {
        alert('קוד מעקב לא נמצא או שהחבילה כבר נאספה')
      }
    } catch (error) {
      console.error('שגיאה:', error)
      alert('שגיאה בבדיקת קוד המעקב')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* כותרת */}
        <div className="text-center mb-8">
          <Link href="/" className="text-green-600 hover:text-green-800 mb-4 inline-block">
            ← חזרה לעמוד הראשי
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            📦 איסוף חבילות
          </h1>
          <p className="text-gray-600">
            הזן את קוד המעקב לאיסוף החבילה שלך
          </p>
        </div>

        {/* טופס קוד מעקב */}
        <div className="bg-white rounded-lg p-8 shadow-lg mb-8">
          <form onSubmit={handleTrackingSubmit} className="space-y-6">
            <div>
              <label htmlFor="trackingCode" className="block text-lg font-semibold text-gray-700 mb-3">
                🔍 קוד מעקב
              </label>
              <input
                id="trackingCode"
                type="text"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                placeholder="הזן קוד מעקב (לדוגמא: XYZ123ABC)"
                className="w-full p-4 text-xl border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-center"
                dir="ltr"
                maxLength={20}
              />
              <p className="text-sm text-gray-600 mt-2">
                קוד המעקב נמצא באימייל או ההודעה שקיבלת
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !trackingCode.trim()}
              className={`
                w-full py-4 px-6 text-xl font-bold rounded-lg transition-all
                ${loading || !trackingCode.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 transform hover:scale-105'
                }
                text-white flex items-center justify-center gap-3
              `}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  בודק...
                </>
              ) : (
                <>
                  🔓 פתח לוקר
                </>
              )}
            </button>
          </form>
        </div>

        {/* מידע שימושי */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* הוראות */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              📋 איך זה עובד?
            </h3>
            <ol className="space-y-3 text-gray-600">
              <li className="flex items-start gap-3">
                <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                <span>הזן את קוד המעקב שקיבלת באימייל</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                <span>לחץ על "פתח לוקר"</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                <span>גש למיקום הלוקר</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
                <span>התא ייפתח אוטומטית - קח את החבילה</span>
              </li>
            </ol>
          </div>

          {/* מידע חשוב */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              ⚠️ חשוב לדעת
            </h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-3">
                <span className="text-yellow-500">⏰</span>
                <span>הקישור תקף למשך 7 ימים מרגע הקבלה</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500">🔒</span>
                <span>התא ינעל אוטומטית לאחר 30 שניות</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-500">📱</span>
                <span>שמור את קוד המעקב עד לאיסוף</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500">🆔</span>
                <span>ייתכן שתתבקש להזדהות</span>
              </li>
            </ul>
          </div>
        </div>

        {/* סטטיסטיקות מערכת */}
        <div className="mt-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">📊 המערכת שלנו</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">2,450</div>
              <div className="text-sm opacity-90">חבילות נאספו השבוע</div>
            </div>
            <div>
              <div className="text-2xl font-bold">15</div>
              <div className="text-sm opacity-90">לוקרים פעילים</div>
            </div>
            <div>
              <div className="text-2xl font-bold">99.2%</div>
              <div className="text-sm opacity-90">זמינות המערכת</div>
            </div>
            <div>
              <div className="text-2xl font-bold">4.8⭐</div>
              <div className="text-sm opacity-90">דירוג לקוחות</div>
            </div>
          </div>
        </div>

        {/* קישורים שימושיים */}
        <div className="mt-8 text-center">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🆘 צריך עזרה?
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:03-1234567" className="btn-secondary">
                📞 צור קשר: 03-1234567
              </a>
              <a href="mailto:support@lockers.co.il" className="btn-secondary">
                📧 support@lockers.co.il
              </a>
              <Link href="/customer/faq" className="btn-secondary">
                ❓ שאלות נפוצות
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 