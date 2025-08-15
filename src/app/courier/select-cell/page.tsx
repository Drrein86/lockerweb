'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Cell {
  id: number
  code: string
  cellNumber: number
  size: string
  sizeDisplay: string
  lockerId: number
  lockerName: string
  lockerLocation: string
  area: number
  sizeOrder: number
}

interface LockerInfo {
  id: number
  name: string
  location: string
  description: string
}

function SelectCellPageContent() {
  const [availableCells, setAvailableCells] = useState<Cell[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null)
  const [locker, setLocker] = useState<LockerInfo | null>(null)
  const [size, setSize] = useState<string>('')
  const [location, setLocation] = useState<string>('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const lockerId = searchParams.get('lockerId')
    const sizeParam = searchParams.get('size')
    const locationParam = searchParams.get('location')
    
    if (!lockerId || !sizeParam) {
      // אם אין פרמטרים נדרשים, חזרה לחיפוש
      router.push('/courier/location-search')
      return
    }
    
    setSize(sizeParam)
    setLocation(locationParam || '')
    fetchAvailableCells(lockerId, sizeParam)
  }, [searchParams])

  const fetchAvailableCells = async (lockerId: string, size: string) => {
    try {
      setLoading(true)
      
      // קריאה לAPI עם הפרמטרים הספציפיים
      const response = await fetch(`/api/lockers/available?lockerId=${lockerId}&size=${size}`)
      const data = await response.json()
      
      if (data.available && data.cells && data.cells.length > 0) {
        // מיון התאים לפי מספר התא
        const sortedCells = data.cells.sort((a: Cell, b: Cell) => a.cellNumber - b.cellNumber)
        setAvailableCells(sortedCells)
        
        // שמירת מידע הלוקר
        if (data.lockers && data.lockers.length > 0) {
          setLocker({
            id: data.lockers[0].id,
            name: data.lockers[0].name,
            location: data.lockers[0].location,
            description: data.lockers[0].description
          })
        }
      } else {
        // אם אין תאים זמינים, חזרה לבחירת גודל
        alert(`לא נמצאו תאים זמינים בגודל ${size} בלוקר זה`)
        router.push(`/courier/size-selection?lockerId=${lockerId}&location=${encodeURIComponent(location)}`)
      }
    } catch (error) {
      console.error('שגיאה בטעינת תאים:', error)
      alert('שגיאה בטעינת תאים זמינים')
      router.push('/courier/location-search')
    } finally {
      setLoading(false)
    }
  }

  const handleCellSelect = (cell: Cell) => {
    setSelectedCell(cell)
  }

  const handleGoToCell = () => {
    if (selectedCell && locker) {
      // מעבר למסך אימות פתיחת תא עם כל הפרמטרים הנדרשים
      const params = new URLSearchParams({
        cellId: selectedCell.id.toString(),
        cellCode: selectedCell.code,
        cellNumber: selectedCell.cellNumber.toString(),
        lockerId: locker.id.toString(),
        lockerName: locker.name,
        size: size,
        location: location
      })
      router.push(`/courier/cell-verification?${params.toString()}`)
    }
  }

  const handleChangeLocker = () => {
    router.push('/courier/location-search')
  }

  const handleChangeSize = () => {
    const lockerId = searchParams.get('lockerId')
    if (lockerId) {
      router.push(`/courier/size-selection?lockerId=${lockerId}&location=${encodeURIComponent(location)}`)
    } else {
      router.push('/courier/location-search')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80 text-lg">בודק תאים זמינים...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-2 md:p-4">
      <div className="max-w-4xl mx-auto overflow-hidden">
        {/* כותרת */}
        <div className="text-center mb-8">
          <Link href={`/courier/size-selection?lockerId=${searchParams.get('lockerId')}&location=${encodeURIComponent(location)}`} className="inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition-all duration-300 mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm md:text-base">חזרה לבחירת גודל</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            בחירת תא ספציפי
          </h1>
          
          {/* מידע על הלוקר והגודל */}
          {locker && (
            <div className="glass-card-sm max-w-2xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
                <div className="text-center md:text-right flex-1 min-w-0">
                  <h3 className="text-base md:text-lg font-bold text-white mb-1 truncate">{locker.name}</h3>
                  <p className="text-white/70 text-xs md:text-sm truncate">{locker.location}</p>
                  {locker.description && (
                    <p className="text-white/60 text-xs truncate">{locker.description}</p>
                  )}
                </div>
                <div className="text-center md:text-left flex-shrink-0">
                  <span className="bg-purple-500/20 px-2 md:px-3 py-1 rounded-full text-purple-200 text-xs md:text-sm font-semibold">
                    גודל: {size}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-white/70 mt-4">
            בחר תא זמין מהרשימה למטה
          </p>
        </div>

        {/* אפשרויות בחירה */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          <button
            onClick={handleChangeLocker}
            className="btn-secondary text-center p-2 md:p-4"
          >
            <div className="flex flex-col items-center gap-1 md:gap-2">
              <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs md:text-sm">החלף לוקר</span>
            </div>
          </button>
          
          <button
            onClick={handleChangeSize}
            className="btn-secondary text-center p-2 md:p-4"
          >
            <div className="flex flex-col items-center gap-1 md:gap-2">
              <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4a1 1 0 011-1h4m5 0h4a1 1 0 011 1v4m0 5v4a1 1 0 01-1 1h-4m-5 0H5a1 1 0 01-1-1v-4m1-5a2 2 0 100-4 2 2 0 000 4zm0 0c1 0 2 1 2 2v1H4v-1a2 2 0 012-2zM20 15a2 2 0 10-4 0 2 2 0 004 0zm-4 0c0-1-1-2-2-2v-1h4v1c-1 0-2 1-2 2z" />
              </svg>
              <span className="text-xs md:text-sm">החלף גודל</span>
            </div>
          </button>
          
          <Link
            href={`/courier/change-cell?location=${encodeURIComponent(location)}`}
            className="btn-outline text-center p-2 md:p-4 col-span-2 md:col-span-1"
          >
            <div className="flex flex-col items-center gap-1 md:gap-2">
              <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="text-xs md:text-sm">אפשרויות מתקדמות</span>
            </div>
          </Link>

          {selectedCell && (
            <button
              onClick={handleGoToCell}
              className="btn-primary text-center p-2 md:p-4 col-span-2 md:col-span-3"
            >
              <div className="flex flex-col items-center gap-1 md:gap-2">
                <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span className="text-sm md:text-base">בחר תא {selectedCell.code}</span>
              </div>
            </button>
          )}
        </div>

        {/* רשימת תאים זמינים */}
        <div className="space-y-4">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4">תאים זמינים בגודל {size}</h2>
          
          {availableCells.length === 0 ? (
            <div className="glass-card text-center">
              <p className="text-red-400 text-lg mb-4">אין תאים זמינים כרגע</p>
              <Link href="/courier" className="btn-secondary">
                חזרה לדף הראשי
              </Link>
            </div>
          ) : (
            availableCells.map((cell) => (
              <div
                key={cell.id}
                className={`glass-card cursor-pointer transition-all duration-300 ${
                  selectedCell?.id === cell.id 
                    ? 'ring-2 ring-purple-400 bg-purple-500/20' 
                    : 'hover:bg-white/10'
                }`}
                onClick={() => handleCellSelect(cell)}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-lg md:text-2xl font-bold truncate">{cell.code}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg md:text-xl font-bold text-white mb-1 truncate">
                        תא מספר {cell.cellNumber}
                      </h3>
                      <p className="text-white/70 mb-1 text-sm md:text-base">
                        גודל: <span className="font-semibold text-purple-300">{cell.sizeDisplay}</span>
                      </p>
                      <p className="text-white/60 text-xs md:text-sm truncate">
                        לוקר: {cell.lockerName}
                      </p>
                      <p className="text-white/50 text-xs">
                        שטח: {cell.area} ס"מ רבועים
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-row md:flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCellSelect(cell)
                      }}
                      className="btn-secondary text-xs md:text-sm px-3 py-2 md:px-4 flex-1 md:flex-none"
                    >
                      בחר תא
                    </button>
                    
                    {selectedCell?.id === cell.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleGoToCell()
                        }}
                        className="btn-primary text-xs md:text-sm px-3 py-2 md:px-4 flex-1 md:flex-none"
                      >
                        הולך לקחת
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* הערות חשובות */}
        <div className="glass-card mt-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            הערות חשובות
          </h3>
          <ul className="space-y-2 text-white/70">
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>התאים מוצגים לפי מספר התא בלוקר</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>כל התאים שמוצגים מתאימים לגודל המוצר שבחרת ({size})</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>לאחר בחירת תא, המערכת תפתח אותו אוטומטית להכנסת החבילה</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>אם תרצה לשנות גודל או לוקר, השתמש בכפתורים למעלה</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function SelectCellPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">טוען...</div>
      </div>
    }>
      <SelectCellPageContent />
    </Suspense>
  )
} 