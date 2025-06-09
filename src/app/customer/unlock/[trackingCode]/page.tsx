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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען פרטי החבילה...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-xl text-center">
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl text-white">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-red-800 mb-4">שגיאה</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/customer" className="btn-primary">
            חזרה לדף הלקוח
          </Link>
        </div>
      </div>
    )
  }

  if (!packageData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600">לא נמצאו נתונים</p>
          <Link href="/customer" className="btn-primary mt-4">
            חזרה לדף הלקוח
          </Link>
        </div>
      </div>
    )
  }

  if (unlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-lg p-8 shadow-xl text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl text-white">🔓</span>
            </div>
            <h1 className="text-3xl font-bold text-green-800 mb-4">
              הלוקר נפתח בהצלחה!
            </h1>
            <p className="text-gray-600 text-lg mb-6">
              גש ללוקר ואסוף את החבילה שלך
            </p>
            
            <div className="bg-green-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">
                📍 פרטי האיסוף
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white rounded">
                  <div className="text-sm text-gray-600">מיקום</div>
                  <div className="font-bold">{packageData.locker.location}</div>
                </div>
                <div className="text-center p-3 bg-white rounded">
                  <div className="text-sm text-gray-600">תא</div>
                  <div className="font-bold text-2xl text-green-600">{packageData.cell.code}</div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 mb-6 border-r-4 border-yellow-400">
              <p className="text-yellow-800">
                <strong>⚠️ חשוב:</strong> התא ינעל אוטומטית לאחר 30 שניות. 
                אנא אסוף את החבילה במהירות.
              </p>
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* כותרת */}
        <div className="text-center mb-8">
          <Link href="/customer" className="text-green-600 hover:text-green-800 mb-4 inline-block">
            ← חזרה לדף הלקוח
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🔓 פתיחת לוקר
          </h1>
          <p className="text-gray-600">
            אישור פרטי החבילה ופתיחת הלוקר
          </p>
        </div>

        {/* פרטי החבילה */}
        <div className="bg-white rounded-lg p-8 shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            📦 פרטי החבילה
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם הלקוח</label>
              <div className="p-3 bg-gray-50 rounded-lg">{packageData.userName}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">קוד מעקב</label>
              <div className="p-3 bg-blue-50 rounded-lg font-mono">{packageData.trackingCode}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">גודל חבילה</label>
              <div className="p-3 bg-gray-50 rounded-lg">{packageData.size}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס</label>
              <div className="p-3 bg-green-50 rounded-lg text-green-700 font-semibold">
                {packageData.status}
              </div>
            </div>
          </div>

          {/* מיקום הלוקר */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">
              📍 מיקום הלוקר
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-sm text-gray-600">כתובת</div>
                <div className="font-bold text-lg">{packageData.locker.location}</div>
                {packageData.locker.description && (
                  <div className="text-sm text-gray-600 mt-1">
                    {packageData.locker.description}
                  </div>
                )}
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-sm text-gray-600">מספר תא</div>
                <div className="font-bold text-3xl text-blue-600">
                  {packageData.cell.code}
                </div>
              </div>
            </div>
          </div>

          {/* מידע על תוקף */}
          <div className="bg-yellow-50 rounded-lg p-4 mb-6 border-r-4 border-yellow-400">
            <div className="flex items-center gap-2">
              <span className="text-yellow-600">⏰</span>
              <span className="font-semibold">תוקף החבילה:</span>
              <span className="text-yellow-800">
                {packageData.daysLeft} ימים נותרו
              </span>
            </div>
          </div>

          {/* כפתור פתיחה */}
          <div className="text-center">
            <button
              onClick={handleUnlock}
              disabled={unlocking || !packageData.canCollect}
              className={`
                text-2xl font-bold py-4 px-8 rounded-lg transition-all transform
                ${unlocking || !packageData.canCollect
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 hover:scale-105 shadow-lg'
                }
                text-white flex items-center justify-center gap-3 mx-auto
              `}
            >
              {unlocking ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  פותח לוקר...
                </>
              ) : (
                <>
                  🔓 פתח לוקר עכשיו
                </>
              )}
            </button>
            
            {!packageData.canCollect && (
              <p className="text-red-600 mt-4">
                החבילה פגת תוקף ולא ניתן לאסוף אותה
              </p>
            )}
          </div>
        </div>

        {/* הוראות */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📋 הוראות לאיסוף
          </h3>
          <ol className="space-y-2 text-gray-600">
            <li>1. לחץ על כפתור "פתח לוקר עכשיו"</li>
            <li>2. גש למיקום הלוקר: <strong>{packageData.locker.location}</strong></li>
            <li>3. חפש את התא מספר: <strong>{packageData.cell.code}</strong></li>
            <li>4. התא ייפתח אוטומטית - קח את החבילה</li>
            <li>5. התא ינעל אוטומטית לאחר 30 שניות</li>
          </ol>
        </div>
      </div>
    </div>
  )
} 