'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

type PackageSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'WIDE'

interface LockerInfo {
  id: number
  name: string
  location: string
  description: string
  cellsBySize: {
    SMALL: number
    MEDIUM: number
    LARGE: number
    WIDE: number
  }
}

function SizeSelectionPageContent() {
  const [selectedSize, setSelectedSize] = useState<PackageSize | null>(null)
  const [loading, setLoading] = useState(false)
  const [locker, setLocker] = useState<LockerInfo | null>(null)
  const [loadingLocker, setLoadingLocker] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  const lockerId = searchParams.get('lockerId')
  const location = searchParams.get('location')
  const city = searchParams.get('city')
  const street = searchParams.get('street')

  useEffect(() => {
    if (lockerId) {
      loadLockerInfo()
    } else {
      // אם אין lockerId, חזרה לדף החיפוש
      router.push('/courier/location-search')
    }
  }, [lockerId])

  const loadLockerInfo = async () => {
    try {
      // בניית URL לפי הפרמטרים הזמינים
      const params = new URLSearchParams()
      
      if (location) {
        params.append('location', location)
      }
      if (city) {
        params.append('city', city)
      }
      if (street) {
        params.append('street', street)
      }
      
      // אם אין פרמטרי חיפוש, אולי צריך לחזור לדף החיפוש
      if (!location && !city && !street) {
        router.push('/courier/location-search')
        return
      }
      
      const response = await fetch(`/api/lockers/by-location?${params.toString()}`)
      const data = await response.json()
      
      if (data.found) {
        const selectedLocker = data.lockers.find((l: LockerInfo) => l.id === parseInt(lockerId!))
        if (selectedLocker) {
          setLocker(selectedLocker)
        } else {
          // אם הלוקר לא נמצא, חזרה לדף החיפוש
          router.push('/courier/location-search')
        }
      }
    } catch (error) {
      console.error('שגיאה בטעינת מידע לוקר:', error)
      router.push('/courier/location-search')
    } finally {
      setLoadingLocker(false)
    }
  }

  const packageSizes = [
    {
      size: 'SMALL' as PackageSize,
      displayName: 'קטן',
      icon: '📱',
      description: 'עד 15x10x5 ס"מ',
      area: '150 ס"מ רבועים',
      color: 'from-green-400 to-green-500',
      examples: ['טלפון נייד', 'ארנק', 'מפתחות']
    },
    {
      size: 'MEDIUM' as PackageSize,
      displayName: 'בינוני',
      icon: '📦',
      description: 'עד 30x20x15 ס"מ',
      area: '600 ס"מ רבועים',
      color: 'from-blue-400 to-blue-500',
      examples: ['ספר', 'קופסת נעליים קטנה', 'מוצרי קוסמטיקה']
    },
    {
      size: 'LARGE' as PackageSize,
      displayName: 'גדול',
      icon: '📦',
      description: 'עד 45x35x25 ס"מ',
      area: '1,575 ס"מ רבועים',
      color: 'from-orange-400 to-orange-500',
      examples: ['קופסת נעליים', 'מוצרי אלקטרוניקה', 'בגדים']
    },
    {
      size: 'WIDE' as PackageSize,
      displayName: 'רחב',
      icon: '📦',
      description: 'עד 60x40x10 ס"מ',
      area: '2,400 ס"מ רבועים',
      color: 'from-purple-400 to-purple-500',
      examples: ['מסמכים גדולים', 'תמונות', 'חבילות שטוחות']
    }
  ]

  // סינון גדלים זמינים בלוקר הנבחר
  const availableSizes = packageSizes.filter(pkg => 
    locker ? locker.cellsBySize[pkg.size] > 0 : true
  )

  const handleSizeSelection = async (size: PackageSize) => {
    if (!locker || !lockerId) return
    
    setSelectedSize(size)
    setLoading(true)
    
    try {
      // בדיקת זמינות תאים בלוקר הספציפי לפי הגודל שנבחר
      const response = await fetch(`/api/lockers/available?size=${size}&lockerId=${lockerId}`)
      const data = await response.json()
      
      if (data.available && data.cells.length > 0) {
        // מעבר לדף בחירת תא ספציפי
        const params = new URLSearchParams()
        params.append('lockerId', lockerId)
        params.append('size', size)
        
        if (location) params.append('location', location)
        if (city) params.append('city', city)
        if (street) params.append('street', street)
        
        router.push(`/courier/select-cell?${params.toString()}`)
      } else {
        alert(`אין תאים זמינים בגודל ${getSizeDisplayName(size)} בלוקר זה כרגע`)
      }
    } catch (error) {
      console.error('שגיאה בבדיקת זמינות:', error)
      alert('שגיאה בבדיקת זמינות התאים')
    } finally {
      setLoading(false)
    }
  }

  const getSizeDisplayName = (size: PackageSize) => {
    const pkg = packageSizes.find(p => p.size === size)
    return pkg?.displayName || size
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* רקע מיוחד */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxLjUiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
      
      <div className="relative z-10 min-h-screen flex flex-col p-4">
        {/* כותרת עליונה */}
        <div className="flex items-center justify-between mb-8">
          <Link href={`/courier/location-search`} className="btn-secondary flex items-center gap-2">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            חזרה לחיפוש לוקרים
          </Link>
        </div>

        {/* תוכן מרכזי */}
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-4xl w-full space-y-8">
            {/* כותרת */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-lg rounded-2xl mb-6">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4a1 1 0 011-1h4m5 0h4a1 1 0 011 1v4m0 5v4a1 1 0 01-1 1h-4m-5 0H5a1 1 0 01-1-1v-4m1-5a2 2 0 100-4 2 2 0 000 4zm0 0c1 0 2 1 2 2v1H4v-1a2 2 0 012-2zM20 15a2 2 0 10-4 0 2 2 0 004 0zm-4 0c0-1-1-2-2-2v-1h4v1c-1 0-2 1-2 2z" />
                </svg>
              </div>
              <h1 className="heading-primary">בחירת גודל מוצר</h1>
              <p className="text-gray-300 text-lg">בחר את הגודל המתאים למוצר שלך</p>
              
              {/* מידע על הלוקר הנבחר */}
              {loadingLocker ? (
                <div className="glass-card-sm">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span className="text-white/70">טוען מידע לוקר...</span>
                  </div>
                </div>
              ) : locker && (
                <div className="glass-card-sm">
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    לוקר נבחר: {locker.name}
                  </h3>
                  <p className="text-white/70 mb-3">{locker.location}</p>
                  {locker.description && (
                    <p className="text-white/60 text-sm mb-3">{locker.description}</p>
                  )}
                  <div className="flex gap-2 text-sm">
                    {Object.entries(locker.cellsBySize).map(([size, count]) => (
                      count > 0 && (
                        <span key={size} className="bg-blue-500/20 px-2 py-1 rounded text-xs text-blue-200">
                          {getSizeDisplayName(size as PackageSize)}: {count} זמינים
                        </span>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* בחירת גודל */}
            {!loadingLocker && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {packageSizes.map((pkg) => {
                  const isAvailable = locker ? locker.cellsBySize[pkg.size] > 0 : true
                  const cellsCount = locker ? locker.cellsBySize[pkg.size] : 0
                  
                  return (
                    <button
                      key={pkg.size}
                      onClick={() => isAvailable && handleSizeSelection(pkg.size)}
                      disabled={loading || !isAvailable}
                      className={`
                        relative glass-card text-white transition-all duration-300 transform
                        ${isAvailable ? 'hover:bg-white/20 hover:scale-105 cursor-pointer' : 'opacity-50 cursor-not-allowed bg-gray-500/20'}
                        ${selectedSize === pkg.size ? 'ring-2 ring-white/50 bg-white/20' : ''}
                        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                  <div className="p-6">
                    {/* אייקון וכותרת */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-16 h-16 bg-gradient-to-r ${pkg.color} rounded-2xl flex items-center justify-center text-2xl`}>
                        {pkg.icon}
                      </div>
                      <div className="text-right flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-2xl font-bold">{pkg.displayName}</h3>
                          {locker && (
                            <span className={`text-sm px-2 py-1 rounded ${
                              isAvailable 
                                ? 'bg-green-500/20 text-green-300' 
                                : 'bg-red-500/20 text-red-300'
                            }`}>
                              {isAvailable ? `${cellsCount} זמינים` : 'לא זמין'}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-300 text-sm">{pkg.description}</p>
                        <p className="text-gray-400 text-xs">{pkg.area}</p>
                      </div>
                    </div>
                    
                    {/* דוגמאות */}
                    <div className="border-t border-white/20 pt-4">
                      <h4 className="text-sm font-semibold text-white/80 mb-2">דוגמאות:</h4>
                      <div className="flex flex-wrap gap-2">
                        {pkg.examples.map((example, index) => (
                          <span
                            key={index}
                            className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/70"
                          >
                            {example}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {loading && selectedSize === pkg.size && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                      <div className="flex items-center gap-2 text-white">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        <span>בודק זמינות...</span>
                      </div>
                    </div>
                  )}
                </button>
              )})}
            </div>
          )}

            {/* מידע נוסף */}
            <div className="glass-card-sm">
              <h3 className="heading-tertiary flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                טיפים לבחירת גודל
              </h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 font-bold">•</span>
                  <span>בחר גודל שמתאים למוצר שלך - עדיף מעט יותר גדול מאשר קטן מדי</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 font-bold">•</span>
                  <span>המערכת תציג רק תאים זמינים בגודל שבחרת</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 font-bold">•</span>
                  <span>אם אין תאים זמינים, תוכל לחזור ולבחור גודל אחר</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 font-bold">•</span>
                  <span>הגדלים מוצגים לפי שטח התא בסנטימטרים רבועים</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SizeSelectionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">טוען...</div>
      </div>
    }>
      <SizeSelectionPageContent />
    </Suspense>
  )
} 