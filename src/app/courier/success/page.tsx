'use client'

// השבתת prerendering עבור עמוד זה
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function SuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(10)
  
  const cellId = searchParams.get('cellId') || 'A1'

  useEffect(() => {
    // Countdown timer for auto-redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/courier')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  const handleNewPackage = () => {
    router.push('/courier')
  }

  const handleGoHome = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 text-center">
          {/* Success Animation */}
          <div className="space-y-6">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500/20 backdrop-blur-lg rounded-full mb-6 animate-pulse">
              <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-green-400 mb-4">מעולה!</h1>
            <h2 className="text-2xl font-bold text-white mb-2">החבילה הוכנסה בהצלחה</h2>
          </div>

          {/* Success Details */}
          <div className="glass-card bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-400/30">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="text-xl font-bold text-green-300">תא {cellId}</span>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300">סטטוס:</span>
                  <span className="text-green-300 font-bold">החבילה נשמרה</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300">זמן:</span>
                  <span className="text-white font-bold">{new Date().toLocaleTimeString('he-IL')}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300">תאריך:</span>
                  <span className="text-white font-bold">{new Date().toLocaleDateString('he-IL')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="glass-card-sm">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              מה הלאה?
            </h3>
            <ul className="space-y-2 text-sm text-gray-300 text-right">
              <li className="flex items-start gap-2">
                <span className="text-green-400 font-bold">✓</span>
                <span>החבילה נשמרה בבטחה בתא {cellId}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 font-bold">✓</span>
                <span>הלקוח יקבל הודעה עם קוד לפתיחת התא</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 font-bold">✓</span>
                <span>התא ינעל אוטומטית עד שהלקוח יגיע</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">→</span>
                <span>אתה יכול להמשיך עם החבילה הבאה</span>
              </li>
            </ul>
          </div>

          {/* Auto Redirect Notice */}
          <div className="glass-card-sm bg-blue-500/10 border-blue-400/30">
            <div className="flex items-center justify-center gap-3">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-300 text-sm">
                מעבר אוטומטי לעמוד הבית בעוד {countdown} שניות
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleNewPackage}
              className="w-full glass-card bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/50 hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300 transform hover:scale-105 p-4"
            >
              <div className="flex items-center justify-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-lg font-bold">חבילה חדשה</span>
              </div>
            </button>

            <button
              onClick={handleGoHome}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg font-bold text-white hover:bg-white/20 transition-all duration-300"
            >
              חזרה לעמוד הבית
            </button>
          </div>

          {/* Celebration Elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></div>
            <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-50" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping opacity-60" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-40" style={{ animationDelay: '1.5s' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// מעבר אוטומטי הוסר - המשתמש יחליט מתי לעבור