'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function CellVerificationContent() {
  const [timeLeft, setTimeLeft] = useState(60) // 60 שניות
  const [cellOpened, setCellOpened] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'waiting' | 'success' | 'timeout'>('waiting')
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const cellId = searchParams.get('cellId')
  const cellCode = searchParams.get('cellCode')
  const lockerId = searchParams.get('lockerId')

  useEffect(() => {
    if (!cellId || !cellCode || !lockerId) {
      router.push('/courier/select-cell')
      return
    }

    // התחלת הטיימר
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          if (!cellOpened) {
            setVerificationStatus('timeout')
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // סימולציה של בדיקת פתיחת התא
    const checkCellStatus = setInterval(async () => {
      try {
        const response = await fetch(`/api/lockers/cell-status?cellId=${cellId}`)
        const data = await response.json()
        
        if (data.opened) {
          setCellOpened(true)
          setVerificationStatus('success')
          clearInterval(checkCellStatus)
          clearInterval(timer)
        }
      } catch (error) {
        console.error('שגיאה בבדיקת סטטוס התא:', error)
      }
    }, 2000) // בדיקה כל 2 שניות

    return () => {
      clearInterval(timer)
      clearInterval(checkCellStatus)
    }
  }, [cellId, cellCode, lockerId, cellOpened, router])

  const handleSimulateOpen = () => {
    // סימולציה של פתיחת התא (לצרכי פיתוח)
    setCellOpened(true)
    setVerificationStatus('success')
  }

  const handleSelectAnotherCell = () => {
    router.push('/courier/select-cell')
  }

  const handleContinue = () => {
    setLoading(true)
    // מעבר לשלב הבא - סריקת QR או הכנסת פרטים
    router.push(`/courier/scan-qr?cellId=${cellId}&cellCode=${cellCode}&lockerId=${lockerId}`)
  }

  const getStatusColor = () => {
    switch (verificationStatus) {
      case 'waiting': return 'text-yellow-400'
      case 'success': return 'text-green-400'
      case 'timeout': return 'text-red-400'
      default: return 'text-white'
    }
  }

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'waiting':
        return (
          <svg className="w-8 h-8 text-yellow-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'success':
        return (
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'timeout':
        return (
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        {/* כותרת */}
        <div className="text-center mb-8">
          <Link href="/courier/select-cell" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition-all duration-300 mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>חזרה לבחירת תא</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">
            אימות פתיחת תא
          </h1>
          <p className="text-white/70">
            תא {cellCode} - אנא פתח את התא פיזית
          </p>
        </div>

        {/* סטטוס התא */}
        <div className="glass-card text-center mb-8">
          <div className="flex flex-col items-center gap-4">
            {getStatusIcon()}
            
            <div>
              <h2 className={`text-2xl font-bold mb-2 ${getStatusColor()}`}>
                {verificationStatus === 'waiting' && 'ממתין לפתיחת התא...'}
                {verificationStatus === 'success' && 'התא נפתח בהצלחה!'}
                {verificationStatus === 'timeout' && 'זמן הפתיחה פג'}
              </h2>
              
              {verificationStatus === 'waiting' && (
                <div className="space-y-2">
                  <div className="text-4xl font-mono text-yellow-400">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </div>
                  <p className="text-white/70">זמן נותר לפתיחת התא</p>
                </div>
              )}
              
              {verificationStatus === 'success' && (
                <p className="text-green-300">
                  כעת תוכל להמשיך לשלב הבא
                </p>
              )}
              
              {verificationStatus === 'timeout' && (
                <p className="text-red-300">
                  נא לחזור ולבחור תא אחר
                </p>
              )}
            </div>
          </div>
        </div>

        {/* פרטי התא */}
        <div className="glass-card mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">פרטי התא שנבחר</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-white/10 rounded-lg">
              <div className="text-2xl font-bold text-purple-300 mb-1">{cellCode}</div>
              <div className="text-white/70 text-sm">קוד תא</div>
            </div>
            <div className="p-3 bg-white/10 rounded-lg">
              <div className="text-2xl font-bold text-purple-300 mb-1">{cellId}</div>
              <div className="text-white/70 text-sm">מזהה תא</div>
            </div>
            <div className="p-3 bg-white/10 rounded-lg">
              <div className="text-2xl font-bold text-purple-300 mb-1">{lockerId}</div>
              <div className="text-white/70 text-sm">מזהה לוקר</div>
            </div>
          </div>
        </div>

        {/* כפתורי פעולה */}
        <div className="space-y-4">
          {verificationStatus === 'waiting' && (
            <div className="space-y-4">
              <button
                onClick={handleSimulateOpen}
                className="w-full btn-secondary text-lg py-3"
              >
                סימולציה - פתח תא (לצרכי פיתוח)
              </button>
              
              <div className="glass-card-sm">
                <p className="text-white/70 text-center text-sm">
                  גש פיזית לתא {cellCode} ופתח אותו. המערכת תזהה את הפתיחה אוטומטית.
                </p>
              </div>
            </div>
          )}

          {verificationStatus === 'success' && (
            <button
              onClick={handleContinue}
              disabled={loading}
              className="w-full btn-primary text-lg py-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>טוען...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span>המשך לשלב הבא</span>
                </>
              )}
            </button>
          )}

          {verificationStatus === 'timeout' && (
            <div className="space-y-4">
              <button
                onClick={handleSelectAnotherCell}
                className="w-full btn-primary text-lg py-3"
              >
                בחר תא אחר
              </button>
              
              <div className="glass-card-sm">
                <p className="text-red-300 text-center text-sm">
                  המערכת לא מקצה תא אחר אוטומטית - יש לבצע בחירה מחדש
                </p>
              </div>
            </div>
          )}
        </div>

        {/* הוראות */}
        <div className="glass-card mt-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            הוראות לשליח
          </h3>
          <ul className="space-y-2 text-white/70 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-purple-400">1.</span>
              <span>גש פיזית לתא {cellCode} במיקום הלוקר</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">2.</span>
              <span>פתח את התא בתוך {Math.floor(timeLeft / 60)} דקות ו-{timeLeft % 60} שניות</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">3.</span>
              <span>המערכת תזהה את הפתיחה ותאפשר לך להמשיך</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">4.</span>
              <span>אם הזמן יפוג, תצטרך לבחור תא אחר</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function CellVerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-xl text-white">טוען...</div>
      </div>
    }>
      <CellVerificationContent />
    </Suspense>
  )
}
