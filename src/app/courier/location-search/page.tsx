'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface LockerInfo {
  id: number
  name: string
  location: string
  description: string
  deviceId: string
  totalAvailableCells: number
  cellsBySize: {
    SMALL: number
    MEDIUM: number
    LARGE: number
    WIDE: number
  }
  hasSmall: boolean
  hasMedium: boolean
  hasLarge: boolean
  hasWide: boolean
}

interface SearchResult {
  found: boolean
  lockers: LockerInfo[]
  total: number
  message?: string
  suggestions?: string[]
  summary?: {
    totalLockers: number
    totalAvailableCells: number
    cellsBySize: {
      SMALL: number
      MEDIUM: number
      LARGE: number
      WIDE: number
    }
  }
}

export default function LocationSearchPage() {
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [selectedLocker, setSelectedLocker] = useState<LockerInfo | null>(null)
  const router = useRouter()

  const handleLocationSearch = async () => {
    if (!location.trim()) {
      alert('אנא הזן כתובת למשלוח')
      return
    }

    setLoading(true)
    setSearchResult(null)
    setSelectedLocker(null)

    try {
      const response = await fetch(`/api/lockers/by-location?location=${encodeURIComponent(location.trim())}`)
      const data: SearchResult = await response.json()
      
      setSearchResult(data)
      
      if (data.found && data.lockers.length === 1) {
        // אם נמצא לוקר אחד בלבד, נבחר אותו אוטומטית
        setSelectedLocker(data.lockers[0])
      }
    } catch (error) {
      console.error('שגיאה בחיפוש לוקרים:', error)
      alert('שגיאה בחיפוש לוקרים. נסה שוב.')
    } finally {
      setLoading(false)
    }
  }

  const handleLockerSelect = (locker: LockerInfo) => {
    setSelectedLocker(locker)
  }

  const handleContinueToSizeSelection = () => {
    if (!selectedLocker) return
    
    // מעבר לבחירת גודל עם פרמטר הלוקר שנבחר
    router.push(`/courier/size-selection?lockerId=${selectedLocker.id}&location=${encodeURIComponent(location)}`)
  }

  const getSizeDisplayName = (size: string) => {
    const sizeMap: Record<string, string> = {
      'SMALL': 'קטן',
      'MEDIUM': 'בינוני',
      'LARGE': 'גדול',
      'WIDE': 'רחב'
    }
    return sizeMap[size] || size
  }

  const popularLocations = [
    'תל אביב',
    'רמת גן',
    'פתח תקווה',
    'חיפה',
    'ירושלים',
    'באר שבע'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden">
      {/* רקע מיוחד */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxLjUiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
      
      <div className="relative z-10 min-h-screen flex flex-col p-4">
        {/* כותרת עליונה */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/courier" className="btn-secondary flex items-center gap-2">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            חזרה
          </Link>
        </div>

        {/* תוכן מרכזי */}
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-4xl w-full space-y-8">
            {/* כותרת */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-lg rounded-2xl mb-6">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h1 className="heading-primary">🎯 איתור לוקרים</h1>
              <p className="text-blue-200 text-lg">הזן כתובת למשלוח כדי למצוא לוקרים זמינים באזור</p>
            </div>

            {/* חיפוש מיקום */}
            <div className="glass-card">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                חיפוש לוקרים
              </h2>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="הכנס כתובת למשלוח (רחוב, עיר, שכונה)"
                    className="flex-1 px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    onKeyPress={(e) => e.key === 'Enter' && !loading && handleLocationSearch()}
                    disabled={loading}
                  />
                  <button
                    onClick={handleLocationSearch}
                    disabled={loading || !location.trim()}
                    className="btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>מחפש...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        חפש
                      </div>
                    )}
                  </button>
                </div>

                {/* מיקומים פופולריים */}
                <div>
                  <p className="text-white/70 text-sm mb-3">מיקומים פופולריים:</p>
                  <div className="flex flex-wrap gap-2">
                    {popularLocations.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => setLocation(loc)}
                        className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-white/80 hover:text-white transition-all duration-200"
                        disabled={loading}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* תוצאות חיפוש */}
            {searchResult && (
              <div className="glass-card">
                {searchResult.found ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        נמצאו {searchResult.total} לוקרים
                      </h3>
                      {searchResult.summary && (
                        <div className="text-sm text-white/70">
                          סה"כ {searchResult.summary.totalAvailableCells} תאים זמינים
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {searchResult.lockers.map((locker) => (
                        <div
                          key={locker.id}
                          className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                            selectedLocker?.id === locker.id
                              ? 'border-blue-400 bg-blue-500/20'
                              : 'border-white/20 bg-white/5 hover:bg-white/10'
                          }`}
                          onClick={() => handleLockerSelect(locker)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-white mb-1">{locker.name}</h4>
                              <p className="text-white/80 mb-2">{locker.location}</p>
                              {locker.description && (
                                <p className="text-white/60 text-sm mb-3">{locker.description}</p>
                              )}
                              
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-white/80">
                                  {locker.totalAvailableCells} תאים זמינים
                                </span>
                                <div className="flex gap-2">
                                  {Object.entries(locker.cellsBySize).map(([size, count]) => (
                                    count > 0 && (
                                      <span key={size} className="bg-white/10 px-2 py-1 rounded text-xs text-white/70">
                                        {getSizeDisplayName(size)}: {count}
                                      </span>
                                    )
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-center gap-2">
                              {selectedLocker?.id === locker.id ? (
                                <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-6 h-6 border-2 border-white/30 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedLocker && (
                      <div className="mt-6 text-center">
                        <button
                          onClick={handleContinueToSizeSelection}
                          className="btn-primary text-lg px-8 py-3"
                        >
                          המשך עם {selectedLocker.name}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">לא נמצאו לוקרים</h3>
                    <p className="text-white/70 mb-4">{searchResult.message}</p>
                    
                    {searchResult.suggestions && (
                      <div className="text-right">
                        <h4 className="text-lg font-semibold text-white mb-2">הצעות:</h4>
                        <ul className="space-y-1 text-white/70">
                          {searchResult.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-blue-400">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* מידע נוסף */}
            <div className="glass-card-sm">
              <h3 className="heading-tertiary flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                איך זה עובד?
              </h3>
              <ul className="space-y-3 text-blue-200">
                <li className="flex items-start gap-3">
                  <span className="text-blue-300 font-bold">1.</span>
                  <span>הזן כתובת למשלוח בשדה החיפוש</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-300 font-bold">2.</span>
                  <span>המערכת תמצא לוקרים זמינים באזור עם תאים פנויים</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-300 font-bold">3.</span>
                  <span>בחר את הלוקר המתאים ולחץ "המשך"</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-300 font-bold">4.</span>
                  <span>תעבור לבחירת גודל תא מתאים למוצר שלך</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 