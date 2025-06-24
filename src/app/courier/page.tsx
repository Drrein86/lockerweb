'use client'

// השבתת prerendering עבור עמוד זה
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CourierPage() {
  console.log('🚚 נטען דף שליח (COURIER)')
  console.log('🌐 URL נוכחי בדף שליח:', typeof window !== 'undefined' ? window.location.href : 'SSR')
  
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSelectCell = async () => {
    setLoading(true)
    try {
      // מעבר לדף בחירת תא
      router.push('/courier/select-cell')
    } catch (error) {
      console.error('שגיאה במעבר לדף בחירת תא:', error)
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
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-lg rounded-3xl mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">🚚 ממשק שליח</h1>
              <p className="text-xl text-gray-300 mb-8">מערכת הכנסת מוצר ללוקר</p>
            </div>

            {/* כפתור בחר תא */}
            <div className="space-y-6">
              <button
                onClick={handleSelectCell}
                disabled={loading}
                className={`
                  relative w-full glass-card text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-105
                  ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  p-8 text-center
                `}
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold">בחר תא</h2>
                  <p className="text-gray-300">התחל תהליך בחירת תא מתאים לחבילה</p>
                </div>
                
                {loading && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                    <div className="loading-spinner"></div>
                  </div>
                )}
              </button>
            </div>

            {/* מידע נוסף */}
            <div className="glass-card-sm">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                הוראות לשליח
              </h3>
              <ul className="space-y-3 text-gray-300 text-sm">
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 font-bold">1.</span>
                  <span>לחץ על "בחר תא" להתחלת התהליך</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 font-bold">2.</span>
                  <span>המערכת תציג תאים זמינים לפי גודל מתאים</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 font-bold">3.</span>
                  <span>בחר תא ולך פיזית לפתוח אותו</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 font-bold">4.</span>
                  <span>הכנס את החבילה ותסגור את התא</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 