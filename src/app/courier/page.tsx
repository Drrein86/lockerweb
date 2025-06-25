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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-lg rounded-3xl mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">מערכת שליח</h1>
            <p className="text-gray-300 text-lg">בחר תא להכנסת החבילה</p>
          </div>

          {/* Main Action Button */}
          <div className="space-y-4">
            <button
              onClick={handleSelectCell}
              className="w-full glass-card bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/50 hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300 transform hover:scale-105 p-8"
            >
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold">בחר תא</h2>
                <p className="text-gray-300">בחר תא זמין עבור החבילה שלך</p>
              </div>
            </button>
          </div>

          {/* Quick Info */}
          <div className="glass-card-sm">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              איך זה עובד
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">1.</span>
                <span>לחץ על "בחר תא" כדי לראות תאים זמינים</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">2.</span>
                <span>בחר תא שמתאים לגודל החבילה שלך</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">3.</span>
                <span>לך לתא הנבחר ופתח אותו</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">4.</span>
                <span>הכנס את החבילה וסגור את התא</span>
              </li>
            </ul>
          </div>

          {/* Navigation */}
          <div className="text-center">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>חזרה לעמוד הבית</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 