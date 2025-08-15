'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface CellInfo {
  cellId: string
  cellCode: string
  cellNumber: string
  lockerId: string
  lockerName: string
  size: string
  location: string
}

type VerificationStep = 'opening' | 'waiting-closure' | 'package-info' | 'success' | 'timeout' | 'error'

function CellVerificationContent() {
  const [timeLeft, setTimeLeft] = useState(300) // 5 דקות
  const [currentStep, setCurrentStep] = useState<VerificationStep>('opening')
  const [loading, setLoading] = useState(false)
  const [cellInfo, setCellInfo] = useState<CellInfo | null>(null)
  const [packageData, setPackageData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    trackingCode: '',
    notes: ''
  })
  const [error, setError] = useState<string>('')
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // טעינת פרמטרים מ-URL
    const params = {
      cellId: searchParams.get('cellId'),
      cellCode: searchParams.get('cellCode'),
      cellNumber: searchParams.get('cellNumber'),
      lockerId: searchParams.get('lockerId'),
      lockerName: searchParams.get('lockerName'),
      size: searchParams.get('size'),
      location: searchParams.get('location')
    }

    // בדיקת תקינות פרמטרים
    if (!params.cellId || !params.cellCode || !params.lockerId || !params.cellNumber) {
      router.push('/courier/location-search')
      return
    }

    setCellInfo(params as CellInfo)
    
    // יצירת קוד מעקב אוטומטי
    const trackingCode = generateTrackingCode()
    setPackageData(prev => ({ ...prev, trackingCode }))

    // התחלת תהליך פתיחת התא
    initiateUnlockCell(params.lockerId, params.cellNumber)
  }, [searchParams, router])

  const generateTrackingCode = () => {
    const prefix = 'PKG'
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `${prefix}${timestamp}${random}`
  }

  const initiateUnlockCell = async (lockerId: string, cellNumber: string) => {
    setLoading(true)
    setError('')
    
    try {
      console.log('🔓 מנסה לפתוח תא:', { lockerId, cellNumber })
      
      // קריאה ל-API לפתיחת התא דרך ESP32
      const response = await fetch('/api/lockers/unlock-cell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lockerId: parseInt(lockerId),
          cellId: cellNumber,
          packageId: `COURIER-${Date.now()}`,
          clientToken: 'COURIER-TOKEN'
        })
      })

      const data = await response.json()
      console.log('📡 תגובת API:', data)
      
      if (response.ok && data.success) {
        console.log('✅ התא נפתח בהצלחה')
        setCurrentStep('waiting-closure')
        startTimer()
        startCellStatusMonitoring(lockerId, cellNumber)
      } else {
        console.error('❌ שגיאה בפתיחת התא:', data)
        // במקרה של ESP32 לא מחובר, נמשיך בכל זאת (מצב סימולציה)
        if (data.message && data.message.includes('ESP32')) {
          console.log('⚠️ ESP32 לא מחובר - מעבר למצב סימולציה')
          setCurrentStep('waiting-closure')
          startTimer()
          startCellStatusMonitoring(lockerId, cellNumber)
        } else {
          setError(data.message || 'שגיאה בפתיחת התא')
          setCurrentStep('error')
        }
      }
    } catch (error) {
      console.error('❌ שגיאה בקריאת API:', error)
      // במקרה של שגיאת רשת, נמשיך למצב סימולציה
      console.log('⚠️ בעיית רשת - מעבר למצב סימולציה')
      setCurrentStep('waiting-closure')
      startTimer()
      startCellStatusMonitoring(lockerId, cellNumber)
    } finally {
      setLoading(false)
    }
  }

  const startTimer = () => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          if (currentStep === 'waiting-closure') {
            setCurrentStep('timeout')
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const startCellStatusMonitoring = (lockerId: string, cellNumber: string) => {
    let checkCount = 0
    const maxChecks = 100 // מקסימום 100 בדיקות (5 דקות)
    
    const checkInterval = setInterval(async () => {
      checkCount++
      
      try {
        const response = await fetch(`/api/lockers/cell-status?lockerId=${lockerId}&cellNumber=${cellNumber}`)
        const data = await response.json()
        
        console.log(`📊 בדיקת סטטוס תא #${checkCount}:`, data)
        
        if (data.success && data.cellClosed) {
          console.log('🔒 התא נסגר - עובר לשלב פרטי חבילה')
          clearInterval(checkInterval)
          setCurrentStep('package-info')
        }
      } catch (error) {
        console.error('❌ שגיאה בבדיקת סטטוס התא:', error)
      }
      
      // אחרי 30 שניות (10 בדיקות) ללא חיבור ESP32 - מעבר אוטומטי למצב סימולציה
      if (checkCount >= 10) {
        console.log('⚠️ מעבר למצב סימולציה - לחץ על כפתור "המשך" כדי לעבור לשלב הבא')
        clearInterval(checkInterval)
        // לא עוברים אוטומטית - נותנים למשתמש לבחור
      }
      
      // מנקה אחרי מקסימום בדיקות
      if (checkCount >= maxChecks) {
        clearInterval(checkInterval)
      }
    }, 3000) // בדיקה כל 3 שניות
  }

  const handlePackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // שמירת החבילה במסד הנתונים
      const response = await fetch('/api/packages/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trackingCode: packageData.trackingCode,
          customerName: packageData.customerName,
          customerPhone: packageData.customerPhone,
          customerEmail: packageData.customerEmail,
          size: cellInfo?.size,
          lockerId: parseInt(cellInfo?.lockerId || '0'),
          cellId: parseInt(cellInfo?.cellId || '0'),
          notes: packageData.notes
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setCurrentStep('success')
        // שליחת הודעה ללקוח יתבצע ב-API
      } else {
        setError(data.message || 'שגיאה בשמירת החבילה')
      }
    } catch (error) {
      console.error('שגיאה בשמירת החבילה:', error)
      setError('שגיאה בשמירת החבילה. נסה שוב.')
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    if (cellInfo) {
      setCurrentStep('opening')
      setError('')
      initiateUnlockCell(cellInfo.lockerId, cellInfo.cellNumber)
    }
  }

  const handleSelectAnotherCell = () => {
    router.push('/courier/location-search')
  }

  const handleNewDelivery = () => {
    router.push('/courier/location-search')
  }

  const handleSimulationContinue = () => {
    console.log('🎭 המשתמש בחר להמשיך במצב סימולציה')
    setCurrentStep('package-info')
  }

  const getStepInfo = () => {
    switch (currentStep) {
      case 'opening':
        return {
          title: '🔄 פותח תא...',
          subtitle: 'המערכת שולחת פקודה לפתיחת התא - אנא המתן',
          color: 'text-blue-400',
          icon: (
            <svg className="w-8 h-8 text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )
        }
      case 'waiting-closure':
        return {
          title: '🔓 התא נפתח! הכנס את החבילה',
          subtitle: 'כעת הכנס את החבילה לתא וסגור אותו בחוזקה',
          color: 'text-green-400',
          icon: (
            <svg className="w-8 h-8 text-green-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          )
        }
      case 'package-info':
        return {
          title: 'התא נסגר! הזן פרטי חבילה',
          subtitle: 'כעת נדרש להזין את פרטי הלקוח והחבילה',
          color: 'text-purple-400',
          icon: (
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )
        }
      case 'success':
        return {
          title: 'המשלוח הושלם בהצלחה!',
          subtitle: 'החבילה נשמרה והלקוח יקבל הודעה',
          color: 'text-green-400',
          icon: (
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        }
      case 'timeout':
        return {
          title: 'זמן הפעולה פג',
          subtitle: 'התא לא נסגר בזמן הנדרש',
          color: 'text-red-400',
          icon: (
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        }
      case 'error':
        return {
          title: '⚠️ בעיה בחיבור למערכת',
          subtitle: 'לא ניתן להתחבר ל-ESP32. ניתן להמשיך במצב ידני.',
          color: 'text-orange-400',
          icon: (
            <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          )
        }
      default:
        return {
          title: '',
          subtitle: '',
          color: 'text-white',
          icon: null
        }
    }
  }

  const stepInfo = getStepInfo()

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* כותרת */}
        <div className="text-center mb-8">
          <Link href="/courier/location-search" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition-all duration-300 mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>חזרה לחיפוש לוקרים</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">
            הכנסת חבילה ללוקר
          </h1>
          {cellInfo && (
            <p className="text-white/70">
              {cellInfo.lockerName} - תא {cellInfo.cellNumber} ({cellInfo.cellCode})
            </p>
          )}
        </div>

        {/* סטטוס העיבוד */}
        <div className="glass-card text-center mb-8">
          <div className="flex flex-col items-center gap-4">
            {stepInfo.icon}
            
            <div>
              <h2 className={`text-2xl font-bold mb-2 ${stepInfo.color}`}>
                {stepInfo.title}
              </h2>
              <p className="text-white/70 mb-4">{stepInfo.subtitle}</p>
              
              {(currentStep === 'waiting-closure' || currentStep === 'opening') && timeLeft > 0 && (
                <div className="space-y-2">
                  <div className="text-4xl font-mono text-yellow-400">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </div>
                  <p className="text-white/70">זמן נותר</p>
                </div>
              )}
              
              {error && currentStep === 'error' && (
                <div className="bg-orange-500/20 border border-orange-400/50 rounded-lg p-4 mt-4">
                  <p className="text-orange-300 text-sm">
                    💡 הערה: המערכת עובדת במצב ידני. השתמש בכפתורים למטה להמשך.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* פרטי התא */}
        {cellInfo && (
          <div className="glass-card mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">פרטי הלוקר והתא</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-white/10 rounded-lg">
                <div className="text-xl font-bold text-emerald-300 mb-1">{cellInfo.cellCode}</div>
                <div className="text-white/70 text-sm">קוד תא</div>
              </div>
              <div className="p-3 bg-white/10 rounded-lg">
                <div className="text-xl font-bold text-emerald-300 mb-1">{cellInfo.cellNumber}</div>
                <div className="text-white/70 text-sm">מספר תא</div>
              </div>
              <div className="p-3 bg-white/10 rounded-lg">
                <div className="text-xl font-bold text-emerald-300 mb-1">{cellInfo.size}</div>
                <div className="text-white/70 text-sm">גודל</div>
              </div>
              <div className="p-3 bg-white/10 rounded-lg">
                <div className="text-xl font-bold text-emerald-300 mb-1">{packageData.trackingCode}</div>
                <div className="text-white/70 text-sm">קוד מעקב</div>
              </div>
            </div>
          </div>
        )}

        {/* טופס פרטי חבילה */}
        {currentStep === 'package-info' && (
          <div className="glass-card mb-8">
            <h3 className="text-lg font-semibold text-white mb-6">פרטי חבילה ולקוח</h3>
            <form onSubmit={handlePackageSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    שם הלקוח *
                  </label>
                  <input
                    type="text"
                    required
                    value={packageData.customerName}
                    onChange={(e) => setPackageData(prev => ({ ...prev, customerName: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="הזן שם מלא"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    טלפון *
                  </label>
                  <input
                    type="tel"
                    required
                    value={packageData.customerPhone}
                    onChange={(e) => setPackageData(prev => ({ ...prev, customerPhone: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="05X-XXXXXXX"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    אימייל (אופציונלי)
                  </label>
                  <input
                    type="email"
                    value={packageData.customerEmail}
                    onChange={(e) => setPackageData(prev => ({ ...prev, customerEmail: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="example@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    קוד מעקב
                  </label>
                  <input
                    type="text"
                    value={packageData.trackingCode}
                    onChange={(e) => setPackageData(prev => ({ ...prev, trackingCode: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="קוד מעקב אוטומטי"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  הערות (אופציונלי)
                </label>
                <textarea
                  rows={3}
                  value={packageData.notes}
                  onChange={(e) => setPackageData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                  placeholder="הערות נוספות על החבילה..."
                />
              </div>
              
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary text-lg py-3 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>שומר...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>שמור חבילה ושלח הודעה ללקוח</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* כפתורי פעולה */}
        <div className="space-y-4">
          {currentStep === 'opening' && loading && (
            <div className="glass-card-sm">
              <p className="text-blue-300 text-center text-sm">
                המערכת מתחברת ל-ESP32 ופותחת את התא... אנא המתן.
              </p>
            </div>
          )}

          {currentStep === 'waiting-closure' && (
            <div className="space-y-4">
              <div className="glass-card-sm">
                <h4 className="text-lg font-semibold text-white mb-3 text-center">
                  🎯 הוראות לשליח
                </h4>
                <ol className="space-y-2 text-white/70 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                    <span>התא נפתח אוטומטית - גש אליו כעת</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                    <span>הכנס את החבילה לתוך התא</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                    <span>סגור את התא בחוזקה - המערכת תזהה את הסגירה</span>
                  </li>
                </ol>
              </div>
              
              {/* כפתור מעבר ידני למצב סימולציה */}
              <div className="bg-orange-500/20 border border-orange-400/50 rounded-lg p-4">
                <h4 className="text-orange-300 font-semibold mb-2 text-center">
                  ⚠️ המערכת לא מזהה סגירת תא?
                </h4>
                <p className="text-orange-200 text-sm mb-3 text-center">
                  אם הכבל לא מחובר או שהחיישן לא עובד, ניתן להמשיך במצב ידני
                </p>
                <button
                  onClick={handleSimulationContinue}
                  className="w-full btn-outline border-orange-400 text-orange-300 hover:bg-orange-500/20"
                >
                  המשך להזנת פרטי חבילה (מצב ידני)
                </button>
              </div>
            </div>
          )}

          {currentStep === 'success' && (
            <div className="space-y-4">
              <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-6 text-center">
                <h4 className="text-xl font-bold text-green-300 mb-2">
                  🎉 המשלוח הושלם בהצלחה!
                </h4>
                <p className="text-green-200 mb-4">
                  החבילה נשמרה במערכת והלקוח יקבל הודעה עם קוד השחרור.
                </p>
                <div className="bg-green-600/30 rounded-lg p-3 mb-4">
                  <p className="text-green-100 text-sm">
                    קוד מעקב: <span className="font-mono font-bold">{packageData.trackingCode}</span>
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleNewDelivery}
                className="w-full btn-primary text-lg py-3 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>משלוח חדש</span>
              </button>
            </div>
          )}

          {(currentStep === 'timeout' || currentStep === 'error') && (
            <div className="space-y-4">
              <div className="bg-orange-500/20 border border-orange-400/50 rounded-lg p-4">
                <h4 className="text-orange-300 font-semibold mb-2 text-center">
                  💡 אפשרויות המשך
                </h4>
                <p className="text-orange-200 text-sm mb-4 text-center">
                  {currentStep === 'timeout' 
                    ? 'הזמן פג לזיהוי סגירת התא. אולי החיישן לא מחובר?'
                    : 'לא ניתן להתחבר למערכת הלוקר. ניתן להמשיך במצב ידני.'}
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={handleSimulationContinue}
                    className="w-full btn-primary text-lg py-3 bg-orange-500 hover:bg-orange-600"
                  >
                    המשך במצב ידני (מומלץ)
                  </button>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleRetry}
                      className="flex-1 btn-secondary text-sm py-2"
                    >
                      נסה שוב
                    </button>
                    <button
                      onClick={handleSelectAnotherCell}
                      className="flex-1 btn-outline text-sm py-2"
                    >
                      בחר תא אחר
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* הוראות כלליות */}
        <div className="glass-card mt-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            מדריך תהליך המשלוח
          </h3>
          <div className="space-y-4">
            <div className="bg-emerald-500/20 border border-emerald-400/50 rounded-lg p-4">
              <h4 className="font-semibold text-emerald-300 mb-2">השלבים:</h4>
              <ol className="space-y-2 text-emerald-100 text-sm">
                <li className="flex items-center gap-3">
                  <span className="bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                  <span>המערכת פותחת את התא אוטומטית דרך ESP32</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                  <span>השליח מכניס את החבילה לתא</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                  <span>השליח סוגר את התא - המערכת מזהה את הסגירה</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
                  <span>השליח מזין פרטי לקוח וחבילה</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">5</span>
                  <span>המערכת שולחת הודעה ללקוח עם קוד שחרור</span>
                </li>
              </ol>
            </div>
            
            <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-300 mb-2">💡 טיפים חשובים:</h4>
              <ul className="space-y-1 text-blue-100 text-sm">
                <li>• וודא שהחבילה מתאימה לגודל התא שנבחר</li>
                <li>• סגור את התא בחוזקה למניעת בעיות</li>
                <li>• בדוק שפרטי הלקוח נכונים לפני השמירה</li>
                <li>• שמור את קוד המעקב למקרה הצורך</li>
              </ul>
            </div>
            
            <div className="bg-purple-500/20 border border-purple-400/50 rounded-lg p-4">
              <h4 className="font-semibold text-purple-300 mb-2">🔧 מצב ידני (סימולציה):</h4>
              <ul className="space-y-1 text-purple-100 text-sm">
                <li>• אם ה-ESP32 לא מחובר, המערכת עובדת במצב ידני</li>
                <li>• התא לא ייפתח פיזית - פתח אותו ידנית במפתח</li>
                <li>• המערכת לא תזהה סגירה אוטומטית - השתמש בכפתור "המשך"</li>
                <li>• כל השאר עובד רגיל - שמירת חבילה ושליחת הודעות</li>
              </ul>
            </div>
          </div>
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
