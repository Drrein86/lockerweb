'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface PackageData {
  id: number
  trackingCode: string
  userName: string
  userEmail: string
  userPhone: string
  size: string
  status: string
  locker: {
    id: number
    location: string
    description: string
  }
  cell: {
    id: number
    code: string
  }
  createdAt: string
  daysLeft: number
  canCollect: boolean
}

// SVG Icons
const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 12H5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 19L5 12L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const UnlockIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="white" strokeWidth="2"/>
    <path d="M7 11V7A5 5 0 0 1 17 7V8" stroke="white" strokeWidth="2"/>
    <circle cx="12" cy="16" r="1" fill="white"/>
  </svg>
)

const ErrorIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
    <line x1="15" y1="9" x2="9" y2="15" stroke="white" strokeWidth="2"/>
    <line x1="9" y1="9" x2="15" y2="15" stroke="white" strokeWidth="2"/>
  </svg>
)

const MapIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="8" y1="2" x2="8" y2="18" stroke="white" strokeWidth="2"/>
    <line x1="16" y1="6" x2="16" y2="22" stroke="white" strokeWidth="2"/>
  </svg>
)

const CellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="white" strokeWidth="2"/>
    <path d="M8 8H16V16H8Z" stroke="white" strokeWidth="2"/>
  </svg>
)

const WarningIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 22H22L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 9V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function UnlockPage() {
  const params = useParams()
  const trackingCode = params.trackingCode as string
  
  const [packageData, setPackageData] = useState<PackageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [unlocking, setUnlocking] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPackageData()
  }, [trackingCode])

  const fetchPackageData = async () => {
    try {
      const response = await fetch(`/api/packages/track/${trackingCode}`)
      const data = await response.json()
      
      if (response.ok && data.package) {
        setPackageData(data.package)
      } else {
        setError(data.error || 'חבילה לא נמצאה')
      }
    } catch (error) {
      console.error('שגיאה:', error)
      setError('שגיאה בטעינת נתוני החבילה')
    } finally {
      setLoading(false)
    }
  }

  const handleUnlock = async () => {
    if (!packageData) return
    
    setUnlocking(true)
    
    try {
      const response = await fetch('/api/packages/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trackingCode: packageData.trackingCode
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        setUnlocked(true)
        // עדכון סטטוס החבילה
        setPackageData(prev => prev ? {...prev, status: 'נאסף'} : null)
      } else {
        alert('שגיאה בפתיחת הלוקר: ' + result.error)
      }
    } catch (error) {
      console.error('שגיאה:', error)
      alert('שגיאה בפתיחת הלוקר')
    } finally {
      setUnlocking(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80">טוען פרטי החבילה...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-400/30">
            <ErrorIcon />
          </div>
          <h1 className="text-2xl font-bold text-red-400 mb-4">שגיאה</h1>
          <p className="text-white/70 mb-6">{error}</p>
          <Link href="/customer" className="btn-primary">
            חזרה לדף הלקוח
          </Link>
        </div>
      </div>
    )
  }

  if (!packageData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-white/70">לא נמצאו נתונים</p>
          <Link href="/customer" className="btn-primary mt-4">
            חזרה לדף הלקוח
          </Link>
        </div>
      </div>
    )
  }

  if (unlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="glass-card text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <UnlockIcon />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              הלוקר נפתח בהצלחה!
            </h1>
            <p className="text-white/70 text-lg mb-6">
              גש ללוקר ואסוף את החבילה שלך
            </p>
            
            <div className="bg-white/10 rounded-lg p-6 mb-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">
                פרטי האיסוף
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white/10 rounded border border-white/20">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <MapIcon />
                    <div className="text-sm text-white/70">מיקום</div>
                  </div>
                  <div className="font-bold text-white">{packageData.locker.location}</div>
                </div>
                <div className="text-center p-3 bg-white/10 rounded border border-white/20">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <CellIcon />
                    <div className="text-sm text-white/70">תא</div>
                  </div>
                  <div className="font-bold text-2xl text-purple-300">{packageData.cell.code}</div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-500/20 rounded-lg p-4 mb-6 border border-yellow-400/30">
              <div className="flex items-center justify-center gap-2 text-yellow-300">
                <WarningIcon />
                <p className="font-semibold">
                  חשוב: התא ינעל אוטומטית לאחר 30 שניות. 
                  אנא אסוף את החבילה במהירות.
                </p>
              </div>
            </div>

            <Link href="/customer" className="btn-primary text-lg px-8 py-3">
              סיום
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* כותרת */}
        <div className="text-center mb-8">
          <Link href="/customer" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition-all duration-300 mb-6">
            <ArrowLeftIcon />
            <span>חזרה לדף הלקוח</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">
            פתיחת לוקר
          </h1>
          <p className="text-white/70">
            אישור פרטי החבילה ופתיחת הלוקר
          </p>
        </div>

        {/* פרטי החבילה */}
        <div className="glass-card mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            פרטי החבילה שלך
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* פרטי החבילה */}
            <div className="bg-white/10 rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">מידע כללי</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-white/70">קוד מעקב:</span>
                  <span className="font-mono font-bold text-purple-300 mr-2">{packageData.trackingCode}</span>
                </div>
                <div>
                  <span className="text-white/70">שם:</span>
                  <span className="font-semibold text-white mr-2">{packageData.userName}</span>
                </div>
                <div>
                  <span className="text-white/70">גודל:</span>
                  <span className="font-semibold text-white mr-2">{packageData.size}</span>
                </div>
                <div>
                  <span className="text-white/70">סטטוס:</span>
                  <span className={`font-semibold mr-2 px-2 py-1 rounded text-xs ${
                    packageData.status === 'ממתין' 
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30' 
                      : 'bg-green-500/20 text-green-300 border border-green-400/30'
                  }`}>
                    {packageData.status}
                  </span>
                </div>
              </div>
            </div>

            {/* מיקום הלוקר */}
            <div className="bg-white/10 rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">מיקום הלוקר</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapIcon />
                  <span className="text-white/70">מיקום:</span>
                  <span className="font-semibold text-white">{packageData.locker.location}</span>
                </div>
                {packageData.locker.description && (
                  <div>
                    <span className="text-white/70">תיאור:</span>
                    <span className="text-white mr-2">{packageData.locker.description}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CellIcon />
                  <span className="text-white/70">תא:</span>
                  <span className="font-bold text-2xl text-purple-300">{packageData.cell.code}</span>
                </div>
              </div>
            </div>
          </div>

          {/* זמן שנותר */}
          <div className="mt-6 text-center">
            <div className="bg-purple-500/20 rounded-lg p-4 border border-purple-400/30">
              <p className="text-white/80">
                זמן שנותר לאיסוף: <span className="font-bold text-purple-300">{packageData.daysLeft} ימים</span>
              </p>
            </div>
          </div>
        </div>

        {/* כפתור פתיחה */}
        <div className="text-center mb-8">
          {packageData.canCollect ? (
            <button
              onClick={handleUnlock}
              disabled={unlocking}
              className={`btn-primary text-xl px-12 py-4 ${
                unlocking ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
              } transition-all duration-300`}
            >
              {unlocking ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  פותח לוקר...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <UnlockIcon />
                  פתח לוקר ואסוף חבילה
                </div>
              )}
            </button>
          ) : (
            <div className="glass-card bg-red-500/20 border-red-400/30">
              <p className="text-red-300 font-semibold">
                לא ניתן לאסוף את החבילה כרגע
              </p>
              <p className="text-white/70 text-sm mt-2">
                אנא פנה לשירות הלקוחות
              </p>
            </div>
          )}
        </div>

        {/* הוראות איסוף */}
        <div className="glass-card">
          <h3 className="text-lg font-semibold text-white mb-4">
            הוראות איסוף
          </h3>
          <ul className="space-y-2 text-white/80">
            <li className="flex items-start gap-2">
              <span className="text-purple-300 font-bold">1.</span>
              לחץ על "פתח לוקר ואסוף חבילה"
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-300 font-bold">2.</span>
              גש למיקום הלוקר: {packageData.locker.location}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-300 font-bold">3.</span>
              חפש את תא מספר: <span className="font-bold text-purple-300">{packageData.cell.code}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-300 font-bold">4.</span>
              התא ייפתח אוטומטית לאחר הלחיצה
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-300 font-bold">5.</span>
              אסוף את החבילה תוך 30 שניות
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
} 