'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface LockerOption {
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
  distance?: string // מרחק משוער
}

interface CellOption {
  id: number
  code: string
  cellNumber: number
  size: string
  sizeDisplay: string
  lockerId: number
  lockerName: string
  lockerLocation: string
  area: number
}

type ViewMode = 'size-selection' | 'locker-selection' | 'cell-selection'

export default function ChangeCellPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('size-selection')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedLocker, setSelectedLocker] = useState<LockerOption | null>(null)
  const [availableLockers, setAvailableLockers] = useState<LockerOption[]>([])
  const [availableCells, setAvailableCells] = useState<CellOption[]>([])
  const [loading, setLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<string>('')
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const location = searchParams.get('location') || ''
    setCurrentLocation(location)
  }, [searchParams])

  const packageSizes = [
    { value: 'SMALL', display: 'קטן', icon: '📱', description: 'עד 15x10x5 ס"מ', color: 'from-green-400 to-green-500' },
    { value: 'MEDIUM', display: 'בינוני', icon: '📦', description: 'עד 30x20x15 ס"מ', color: 'from-blue-400 to-blue-500' },
    { value: 'LARGE', display: 'גדול', icon: '📦', description: 'עד 45x35x25 ס"מ', color: 'from-orange-400 to-orange-500' },
    { value: 'WIDE', display: 'רחב', icon: '📦', description: 'עד 60x40x10 ס"מ', color: 'from-purple-400 to-purple-500' }
  ]

  const handleSizeSelection = async (size: string) => {
    setSelectedSize(size)
    setLoading(true)
    
    try {
      // חיפוש לוקרים עם תאים זמינים בגודל שנבחר
      const response = await fetch(`/api/lockers/available?size=${size}${currentLocation ? `&location=${encodeURIComponent(currentLocation)}` : ''}`)
      const data = await response.json()
      
      if (data.available && data.lockers.length > 0) {
        setAvailableLockers(data.lockers)
        setViewMode('locker-selection')
      } else {
        alert(`לא נמצאו לוקרים זמינים עם תאים בגודל ${getSizeDisplay(size)}`)
      }
    } catch (error) {
      console.error('שגיאה בחיפוש לוקרים:', error)
      alert('שגיאה בחיפוש לוקרים')
    } finally {
      setLoading(false)
    }
  }

  const handleLockerSelection = async (locker: LockerOption) => {
    setSelectedLocker(locker)
    setLoading(true)
    
    try {
      // חיפוש תאים זמינים בלוקר שנבחר
      const response = await fetch(`/api/lockers/available?lockerId=${locker.id}&size=${selectedSize}`)
      const data = await response.json()
      
      if (data.available && data.cells.length > 0) {
        setAvailableCells(data.cells)
        setViewMode('cell-selection')
      } else {
        alert(`לא נמצאו תאים זמינים בגודל ${getSizeDisplay(selectedSize)} בלוקר זה`)
      }
    } catch (error) {
      console.error('שגיאה בחיפוש תאים:', error)
      alert('שגיאה בחיפוש תאים')
    } finally {
      setLoading(false)
    }
  }

  const handleCellSelection = (cell: CellOption) => {
    // מעבר למסך אימות התא עם כל הפרמטרים
    const params = new URLSearchParams({
      cellId: cell.id.toString(),
      cellCode: cell.code,
      cellNumber: cell.cellNumber.toString(),
      lockerId: cell.lockerId.toString(),
      lockerName: cell.lockerName,
      size: selectedSize,
      location: currentLocation
    })
    router.push(`/courier/cell-verification?${params.toString()}`)
  }

  const getSizeDisplay = (size: string) => {
    const sizeObj = packageSizes.find(s => s.value === size)
    return sizeObj?.display || size
  }

  const handleBackNavigation = () => {
    if (viewMode === 'cell-selection') {
      setViewMode('locker-selection')
    } else if (viewMode === 'locker-selection') {
      setViewMode('size-selection')
    } else {
      router.push('/courier/location-search')
    }
  }

  const getBreadcrumb = () => {
    switch (viewMode) {
      case 'size-selection':
        return 'בחירת גודל חדש'
      case 'locker-selection':
        return `בחירת לוקר לגודל ${getSizeDisplay(selectedSize)}`
      case 'cell-selection':
        return `בחירת תא ב${selectedLocker?.name}`
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* רקע מיוחד */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxLjUiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
      
      <div className="relative z-10 min-h-screen flex flex-col p-4">
        {/* כותרת עליונה */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={handleBackNavigation}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            חזרה
          </button>
          
          {/* ניווט לינק */}
          <div className="text-sm text-white/60">
            {getBreadcrumb()}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-6xl w-full space-y-8">
            {/* כותרת */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-lg rounded-2xl mb-6">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h1 className="heading-primary">🔄 החלפת לוקר / תא</h1>
              <p className="text-indigo-200 text-lg">מצא אפשרות חלופית המתאימה לצרכים שלך</p>
            </div>

            {/* תוכן דינמי לפי מצב */}
            {viewMode === 'size-selection' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-4">איזה גודל תא אתה מחפש?</h2>
                  <p className="text-white/70">בחר את הגודל המתאים למוצר שלך</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {packageSizes.map((pkg) => (
                    <button
                      key={pkg.value}
                      onClick={() => handleSizeSelection(pkg.value)}
                      disabled={loading}
                      className={`
                        glass-card text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-105
                        ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <div className="p-6 text-center">
                        <div className={`w-16 h-16 bg-gradient-to-r ${pkg.color} rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4`}>
                          {pkg.icon}
                        </div>
                        <h3 className="text-xl font-bold mb-2">{pkg.display}</h3>
                        <p className="text-white/70 text-sm">{pkg.description}</p>
                      </div>
                      
                      {loading && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {viewMode === 'locker-selection' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    לוקרים זמינים עם תאים בגודל {getSizeDisplay(selectedSize)}
                  </h2>
                  <p className="text-white/70">נמצאו {availableLockers.length} לוקרים זמינים</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableLockers.map((locker) => (
                    <div
                      key={locker.id}
                      className="glass-card cursor-pointer hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
                      onClick={() => handleLockerSelection(locker)}
                    >
                      <div className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-indigo-500/30 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white">{locker.name}</h3>
                            <p className="text-white/70 text-sm">{locker.location}</p>
                          </div>
                        </div>
                        
                        {locker.description && (
                          <p className="text-white/60 text-sm mb-4">{locker.description}</p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-green-300 font-semibold">
                            {locker.cellsBySize[selectedSize as keyof typeof locker.cellsBySize]} תאים זמינים
                          </span>
                          <span className="text-white/60 text-sm">
                            {locker.totalAvailableCells} תאים סה"כ
                          </span>
                        </div>
                        
                        {locker.distance && (
                          <div className="mt-2 text-indigo-300 text-xs">
                            מרחק: {locker.distance}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewMode === 'cell-selection' && selectedLocker && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    תאים זמינים ב{selectedLocker.name}
                  </h2>
                  <p className="text-white/70">{selectedLocker.location}</p>
                  <div className="mt-4">
                    <span className="bg-purple-500/20 px-4 py-2 rounded-full text-purple-200 text-sm">
                      גודל: {getSizeDisplay(selectedSize)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableCells.map((cell) => (
                    <div
                      key={cell.id}
                      className="glass-card cursor-pointer hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
                      onClick={() => handleCellSelection(cell)}
                    >
                      <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-purple-500/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl font-bold text-white">{cell.cellNumber}</span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-white mb-2">
                          תא {cell.cellNumber}
                        </h3>
                        <p className="text-white/70 text-sm mb-2">קוד: {cell.code}</p>
                        <p className="text-white/60 text-sm mb-4">
                          גודל: {cell.sizeDisplay} • {cell.area} ס"מ²
                        </p>
                        
                        <button className="btn-primary w-full">
                          בחר תא זה
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* מידע נוסף */}
            <div className="glass-card-sm">
              <h3 className="heading-tertiary flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                מידע שימושי
              </h3>
              <ul className="space-y-3 text-indigo-200">
                <li className="flex items-start gap-3">
                  <span className="text-indigo-300 font-bold">•</span>
                  <span>המערכת מציגה רק לוקרים ותאים זמינים באזור שלך</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-indigo-300 font-bold">•</span>
                  <span>ניתן לחזור ולשנות את הגודל או הלוקר בכל שלב</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-indigo-300 font-bold">•</span>
                  <span>המערכת תפתח את התא שתבחר אוטומטית להכנסת החבילה</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 