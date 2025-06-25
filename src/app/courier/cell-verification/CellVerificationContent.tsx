'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function CellVerificationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes in seconds
  const [cellOpened, setCellOpened] = useState(false)
  const [checking, setChecking] = useState(false)
  
  const cellId = searchParams.get('cellId') || 'A1'

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up - redirect back to cell selection
          router.push('/courier/select-cell?timeout=true')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Simulate cell opening check every 3 seconds
    const checkTimer = setInterval(() => {
      if (!cellOpened && Math.random() > 0.7) { // 30% chance each check
        setCellOpened(true)
        clearInterval(checkTimer)
        // Redirect to success page after cell opens
        setTimeout(() => {
          router.push('/courier/success?cellId=' + cellId)
        }, 2000)
      }
    }, 3000)

    return () => {
      clearInterval(timer)
      clearInterval(checkTimer)
    }
  }, [cellOpened, router, cellId])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = () => {
    return ((300 - timeLeft) / 300) * 100
  }

  const handleManualCheck = async () => {
    setChecking(true)
    // Simulate API call to check cell status
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 50% chance of opening on manual check
    if (Math.random() > 0.5) {
      setCellOpened(true)
      setTimeout(() => {
        router.push('/courier/success?cellId=' + cellId)
      }, 1000)
    } else {
      setChecking(false)
    }
  }

  const handleSelectDifferentCell = () => {
    router.push('/courier/select-cell')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-lg rounded-3xl mb-6">
              {cellOpened ? (
                <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">אימות פתיחת תא</h1>
            <p className="text-gray-300 text-lg">תא {cellId}</p>
          </div>

          {cellOpened ? (
            /* Cell Opened Successfully */
            <div className="glass-card bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/50 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-green-500/30 rounded-2xl flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-green-300">התא נפתח בהצלחה!</h2>
                <p className="text-green-200">התא {cellId} נפתח. אתה יכול כעת להכניס את החבילה.</p>
                <div className="pt-4">
                  <div className="animate-pulse text-green-300">מעביר לדף הצלחה...</div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Timer Display */}
              <div className="glass-card text-center">
                <h2 className="text-2xl font-bold mb-6">זמן שנותר לפתיחת התא</h2>
                
                {/* Circular Progress */}
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-white/10"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      className="text-yellow-400"
                      strokeDasharray={`${2 * Math.PI * 50}`}
                      strokeDashoffset={`${2 * Math.PI * 50 * (1 - getProgressPercentage() / 100)}`}
                      style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-yellow-400">{formatTime(timeLeft)}</span>
                  </div>
                </div>

                <p className="text-gray-300 mb-4">
                  אנא לך לתא {cellId} ופתח אותו בזמן הנותר
                </p>

                {timeLeft <= 60 && (
                  <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-3 mb-4">
                    <p className="text-red-300 text-sm flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      זמן מועט! מהר לפתוח את התא
                    </p>
                  </div>
                )}
              </div>

              {/* Status Check */}
              <div className="glass-card-sm text-center">
                <p className="text-gray-300 mb-4">
                  המערכת בודקת אוטומטית אם התא נפתח
                </p>
                <button
                  onClick={handleManualCheck}
                  disabled={checking}
                  className="w-full px-4 py-3 bg-blue-500/20 border border-blue-400/50 rounded-lg font-bold text-blue-300 hover:bg-blue-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checking ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-300"></div>
                      <span>בודק...</span>
                    </div>
                  ) : (
                    'בדוק ידנית אם התא נפתח'
                  )}
                </button>
              </div>

              {/* Instructions */}
              <div className="glass-card-sm">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  הוראות
                </h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">1.</span>
                    <span>לך לתא {cellId} שנבחר</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">2.</span>
                    <span>פתח את התא באמצעות המנגנון</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">3.</span>
                    <span>המערכת תזהה אוטומטית שהתא נפתח</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">4.</span>
                    <span>אם התא לא נפתח בזמן, תחזור לבחירת תא אחר</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleSelectDifferentCell}
                  className="w-full px-4 py-3 bg-gray-600/20 border border-gray-500/50 rounded-lg font-bold text-gray-300 hover:bg-gray-600/30 transition-all duration-300"
                >
                  בחר תא אחר
                </button>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="text-center">
            <Link 
              href="/courier/select-cell"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>חזרה לבחירת תא</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 