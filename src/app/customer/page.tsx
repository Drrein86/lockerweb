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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* רקע מיוחד */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxLjUiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
      
      <div className="relative z-10 min-h-screen flex flex-col p-4">
        {/* כותרת עליונה */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="btn-secondary flex items-center gap-2">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            חזרה
          </Link>
        </div>

        {/* תוכן מרכזי */}
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-lg w-full space-y-8">
            {/* כותרת */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-lg rounded-2xl mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M8 11v6h8v-6M8 11h8" />
                </svg>
              </div>
              <h1 className="heading-primary">איסוף חבילות</h1>
              <p className="text-gray-300">הזן את קוד המעקב לאיסוף החבילה שלך</p>
            </div>

            {/* טופס קוד מעקב */}
            <div className="glass-card">
              <form onSubmit={handleTrackingSubmit} className="space-y-6">
                <div>
                  <label htmlFor="trackingCode" className="heading-tertiary flex items-center gap-2">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    קוד מעקב
                  </label>
                  <input
                    id="trackingCode"
                    type="text"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                    placeholder="הזן קוד מעקב (לדוגמא: XYZ123ABC)"
                    className="input-glass w-full text-xl font-mono text-center"
                    dir="ltr"
                    maxLength={20}
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    קוד המעקב נמצא באימייל או ההודעה שקיבלת
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !trackingCode.trim()}
                  className={`
                    btn-primary w-full text-lg flex items-center justify-center gap-3
                    ${loading || !trackingCode.trim() ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      בודק...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      פתח לוקר
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* מידע שימושי */}
            <div className="glass-card-sm">
              <h3 className="heading-tertiary flex items-center gap-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                איך זה עובד?
              </h3>
              <ol className="space-y-3 text-gray-300 text-sm">
                <li className="flex items-start gap-3">
                  <span className="bg-white/20 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                  <span>הזן את קוד המעקב שקיבלת באימייל</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-white/20 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                  <span>לחץ על "פתח לוקר"</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-white/20 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                  <span>גש למיקום הלוקר</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-white/20 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
                  <span>התא ייפתח אוטומטית - קח את החבילה</span>
                </li>
              </ol>
            </div>

            {/* מידע חשוב */}
            <div className="glass-card-sm">
              <h3 className="heading-tertiary flex items-center gap-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                חשוב לדעת
              </h3>
              <ul className="space-y-3 text-gray-300 text-sm">
                <li className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>הקישור תקף למשך 7 ימים מרגע הקבלה</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>התא ינעל אוטומטית לאחר 30 שניות</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>שמור את קוד המעקב עד לאיסוף</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                  <span>ייתכן שתתבקש להזדהות</span>
                </li>
              </ul>
            </div>

            {/* סטטיסטיקות */}
            <div className="glass-card-sm">
              <h3 className="heading-tertiary text-center">המערכת שלנו</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-white">2,450</div>
                  <div className="text-xs text-gray-400">חבילות נאספו השבוע</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-white">15</div>
                  <div className="text-xs text-gray-400">לוקרים פעילים</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-white">99.2%</div>
                  <div className="text-xs text-gray-400">זמינות המערכת</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-white">4.8⭐</div>
                  <div className="text-xs text-gray-400">דירוג לקוחות</div>
                </div>
              </div>
            </div>

            {/* קישורים שימושיים */}
            <div className="glass-card-sm text-center">
              <h3 className="heading-tertiary flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.18l.707-.707a1 1 0 011.414 0l4.586 4.586a1 1 0 010 1.414L12 21.82l-6.707-6.707a1 1 0 010-1.414L9.879 9.513a1 1 0 011.414 0L12 2.18z" />
                </svg>
                צריך עזרה?
              </h3>
              <div className="space-y-2">
                <a href="tel:03-1234567" className="btn-secondary w-full text-sm">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  צור קשר: 03-1234567
                </a>
                <a href="mailto:support@lockers.co.il" className="btn-secondary w-full text-sm">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  support@lockers.co.il
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 