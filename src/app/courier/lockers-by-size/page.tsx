'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Cell {
  id: number
  code: string
  size: string
  lockerId: number
}

interface LockerGroup {
  locker: {
    id: number
    location: string
    description: string
  }
  cells: Cell[]
}

function LockersBySizeContent() {
  const [lockers, setLockers] = useState<LockerGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLocker, setSelectedLocker] = useState<LockerGroup | null>(null)
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const size = searchParams.get('size')

  useEffect(() => {
    if (!size) {
      router.push('/courier/size-selection')
      return
    }

    fetchAvailableLockers()
  }, [size, router])

  const fetchAvailableLockers = async () => {
    try {
      const response = await fetch(`/api/lockers/available?size=${size}`)
      const data = await response.json()
      
      if (data.available && data.lockers) {
        // עיבוד נתוני הלוקרים לפורמט הנכון
        const processedLockers = data.lockers.map((locker: any) => ({
          locker: {
            id: locker.id,
            location: locker.location,
            description: locker.description
          },
          cells: locker.availableCells || []
        }))
        
        // מיון לוקרים לפי סדר עולה של ID
        const sortedLockers = processedLockers.sort((a: LockerGroup, b: LockerGroup) => 
          a.locker.id - b.locker.id
        )
        
        setLockers(sortedLockers)
      } else {
        // נתוני Mock למקרה שה-API לא עובד
        const mockLockers: LockerGroup[] = [
          {
            locker: {
              id: 1,
              location: 'בניין A - קומה קרקע',
              description: 'ליד המעליות הראשיות'
            },
            cells: [
              { id: 1, code: 'A01', size: size || 'קטן', lockerId: 1 },
              { id: 2, code: 'A02', size: size || 'קטן', lockerId: 1 }
            ]
          },
          {
            locker: {
              id: 2,
              location: 'בניין B - כניסה ראשית',
              description: 'ליד דלפק הקבלה'
            },
            cells: [
              { id: 3, code: 'B01', size: size || 'קטן', lockerId: 2 }
            ]
          }
        ]
        setLockers(mockLockers)
      }
    } catch (error) {
      console.error('שגיאה בטעינת לוקרים:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLockerSelect = (locker: LockerGroup) => {
    setSelectedLocker(locker)
    // בחירה אוטומטית של התא הראשון
    if (locker.cells.length > 0) {
      setSelectedCell(locker.cells[0])
    }
  }

  const handleCellSelect = (cell: Cell) => {
    setSelectedCell(cell)
    // מציאת הלוקר המתאים
    const parentLocker = lockers.find(l => l.locker.id === cell.lockerId)
    if (parentLocker) {
      setSelectedLocker(parentLocker)
    }
  }

  const handleGoToCell = () => {
    if (selectedCell && selectedLocker) {
      router.push(`/courier/cell-verification?cellId=${selectedCell.id}&cellCode=${selectedCell.code}&lockerId=${selectedLocker.locker.id}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80 text-lg">טוען לוקרים זמינים...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* כותרת */}
        <div className="text-center mb-8">
          <Link href="/courier/size-selection" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition-all duration-300 mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>חזרה לבחירת גודל</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">
            לוקרים זמינים - גודל {size}
          </h1>
          <p className="text-white/70">
            רשימת לוקרים בסדר עולה עם תאים זמינים
          </p>
        </div>

        {/* תאים נבחרים */}
        {(selectedLocker || selectedCell) && (
          <div className="glass-card mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">בחירה נוכחית</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedLocker && (
                <div className="p-4 bg-white/10 rounded-lg">
                  <h4 className="font-bold text-purple-300 mb-2">לוקר נבחר</h4>
                  <p className="text-white">{selectedLocker.locker.location}</p>
                  <p className="text-white/70 text-sm">{selectedLocker.locker.description}</p>
                  <p className="text-purple-300 text-xs mt-1">ID: {selectedLocker.locker.id}</p>
                </div>
              )}
              {selectedCell && (
                <div className="p-4 bg-white/10 rounded-lg">
                  <h4 className="font-bold text-purple-300 mb-2">תא נבחר</h4>
                  <p className="text-white text-lg font-bold">{selectedCell.code}</p>
                  <p className="text-white/70 text-sm">גודל: {selectedCell.size}</p>
                  <p className="text-purple-300 text-xs mt-1">ID: {selectedCell.id}</p>
                </div>
              )}
            </div>
            
            {selectedCell && selectedLocker && (
              <div className="mt-4 text-center">
                <button
                  onClick={handleGoToCell}
                  className="btn-primary px-8 py-3"
                >
                  הולך לקחת את התא
                </button>
              </div>
            )}
          </div>
        )}

        {/* רשימת לוקרים */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">לוקרים זמינים (לפי סדר עולה)</h2>
          
          {lockers.length === 0 ? (
            <div className="glass-card text-center">
              <p className="text-red-400 text-lg mb-4">אין לוקרים זמינים בגודל {size} כרגע</p>
              <Link href="/courier/size-selection" className="btn-secondary">
                חזרה לבחירת גודל
              </Link>
            </div>
          ) : (
            lockers.map((lockerGroup) => (
              <div
                key={lockerGroup.locker.id}
                className={`glass-card transition-all duration-300 ${
                  selectedLocker?.locker.id === lockerGroup.locker.id
                    ? 'ring-2 ring-purple-400 bg-purple-500/20'
                    : 'hover:bg-white/10'
                }`}
              >
                {/* פרטי הלוקר */}
                <div className="border-b border-white/20 pb-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">
                          לוקר #{lockerGroup.locker.id}
                        </h3>
                        <p className="text-white/70 mb-1">{lockerGroup.locker.location}</p>
                        <p className="text-white/60 text-sm">{lockerGroup.locker.description}</p>
                        <p className="text-purple-300 text-sm">
                          {lockerGroup.cells.length} תאים זמינים
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleLockerSelect(lockerGroup)}
                      className="btn-secondary px-6 py-2"
                    >
                      בחר לוקר
                    </button>
                  </div>
                </div>

                {/* תאים זמינים בלוקר */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">תאים זמינים</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {lockerGroup.cells.map((cell) => (
                      <div
                        key={cell.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all duration-300 ${
                          selectedCell?.id === cell.id
                            ? 'bg-purple-500/30 border-purple-400'
                            : 'bg-white/10 border-white/20 hover:bg-white/20'
                        }`}
                        onClick={() => handleCellSelect(cell)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-bold text-white">{cell.code}</div>
                            <div className="text-white/70 text-sm">גודל: {cell.size}</div>
                            <div className="text-purple-300 text-xs">ID: {cell.id}</div>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCellSelect(cell)
                            }}
                            className="btn-primary text-sm px-3 py-1"
                          >
                            בחר
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* הערות */}
        <div className="glass-card mt-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            הוראות
          </h3>
          <ul className="space-y-2 text-white/70">
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>הלוקרים מוצגים לפי סדר מיון עולה</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>מוצגים רק לוקרים שיש בהם תאים בגודל {size}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>בחר לוקר ואז בחר תא ספציפי</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>לחץ על "הולך לקחת את התא" כדי להמשיך</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function LockersBySizePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-xl text-white">טוען...</div>
      </div>
    }>
      <LockersBySizeContent />
    </Suspense>
  )
} 