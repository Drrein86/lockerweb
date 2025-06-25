'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Cell {
  id: number
  code: string
  size: string
  sizeOrder: number
  lockerId: number
  lockerLocation: string
  area: number // שטח התא בסמ"ר
}

export default function SelectCellPage() {
  const [availableCells, setAvailableCells] = useState<Cell[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchAvailableCells()
  }, [])

  const fetchAvailableCells = async () => {
    try {
      const response = await fetch('/api/lockers/available')
      const data = await response.json()
      
      if (data.available && data.cells) {
        // מיון התאים לפי סדר עולה של גודל (שטח)
        const sortedCells = data.cells.sort((a: Cell, b: Cell) => a.area - b.area)
        setAvailableCells(sortedCells)
      } else {
        // נתוני Mock למקרה שה-API לא עובד
        const mockCells: Cell[] = [
          {
            id: 1,
            code: 'A01',
            size: 'קטן',
            sizeOrder: 1,
            lockerId: 1,
            lockerLocation: 'בניין A - קומה קרקע',
            area: 150 // 15x10 ס"מ
          },
          {
            id: 2,
            code: 'A02',
            size: 'בינוני',
            sizeOrder: 2,
            lockerId: 1,
            lockerLocation: 'בניין A - קומה קרקע',
            area: 600 // 30x20 ס"מ
          },
          {
            id: 3,
            code: 'B01',
            size: 'גדול',
            sizeOrder: 3,
            lockerId: 2,
            lockerLocation: 'בניין B - כניסה ראשית',
            area: 1575 // 45x35 ס"מ
          }
        ]
        setAvailableCells(mockCells)
      }
    } catch (error) {
      console.error('שגיאה בטעינת תאים:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCellSelect = (cell: Cell) => {
    setSelectedCell(cell)
  }

  const handleGoToCell = () => {
    if (selectedCell) {
      // מעבר למסך אימות פתיחת תא
      router.push(`/courier/cell-verification?cellId=${selectedCell.id}&cellCode=${selectedCell.code}&lockerId=${selectedCell.lockerId}`)
    }
  }

  const handleShowLockersList = () => {
    router.push('/courier/lockers-list')
  }

  const handleSizeSelection = () => {
    router.push('/courier/size-selection')
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* כותרת */}
        <div className="text-center mb-8">
          <Link href="/courier" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition-all duration-300 mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>חזרה</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">
            בחירת תא
          </h1>
          <p className="text-white/70">
            התאים מוצגים לפי סדר עולה של גודל התא
          </p>
        </div>

        {/* אפשרויות בחירה */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={handleShowLockersList}
            className="btn-secondary text-center p-4"
          >
            <div className="flex flex-col items-center gap-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>הצג רשימת לוקרים</span>
            </div>
          </button>
          
          <button
            onClick={handleSizeSelection}
            className="btn-secondary text-center p-4"
          >
            <div className="flex flex-col items-center gap-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4a1 1 0 011-1h4m5 0h4a1 1 0 011 1v4m0 5v4a1 1 0 01-1 1h-4m-5 0H5a1 1 0 01-1-1v-4m1-5a2 2 0 100-4 2 2 0 000 4zm0 0c1 0 2 1 2 2v1H4v-1a2 2 0 012-2zM20 15a2 2 0 10-4 0 2 2 0 004 0zm-4 0c0-1-1-2-2-2v-1h4v1c-1 0-2 1-2 2z" />
              </svg>
              <span>בחר גודל מוצר</span>
            </div>
          </button>

          {selectedCell && (
            <button
              onClick={handleGoToCell}
              className="btn-primary text-center p-4"
            >
              <div className="flex flex-col items-center gap-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span>הולך לקחת את התא</span>
              </div>
            </button>
          )}
        </div>

        {/* רשימת תאים זמינים */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">תאים זמינים (לפי סדר גודל עולה)</h2>
          
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                      <span className="text-2xl font-bold">{cell.code}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        תא {cell.code}
                      </h3>
                      <p className="text-white/70 mb-1">
                        גודל: <span className="font-semibold text-purple-300">{cell.size}</span>
                      </p>
                      <p className="text-white/60 text-sm">
                        מיקום: {cell.lockerLocation}
                      </p>
                      <p className="text-white/50 text-xs">
                        שטח: {cell.area} ס"מ רבועים
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCellSelect(cell)
                      }}
                      className="btn-secondary text-sm px-4 py-2"
                    >
                      בחר תא
                    </button>
                    
                    {selectedCell?.id === cell.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleGoToCell()
                        }}
                        className="btn-primary text-sm px-4 py-2"
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
              <span>התאים מוצגים לפי סדר עולה של גודל (מהקטן לגדול)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>בחר תא שגודלו מתאים לגודל המוצר שלך (מעל 10 ס"מ רבועים)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>לאחר לחיצה על "הולך לקחת" יש לפתוח את התא פיזית בזמן המוגדר</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>אם לא תפתח את התא בזמן, תצטרך לבחור תא אחר</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
} 