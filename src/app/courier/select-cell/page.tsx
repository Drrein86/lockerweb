'use client'

// השבתת prerendering עבור עמוד זה
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Cell {
  id: number
  code: string
  size: string
  sizeDisplay: string
  area: number // שטח בסמ"ר
  available: boolean
  lockerId: number
  lockerLocation: string
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
        // מיון התאים לפי גודל עולה (שטח)
        const sortedCells = data.cells.sort((a: Cell, b: Cell) => a.area - b.area)
        setAvailableCells(sortedCells)
      } else {
        // נתונים מדומים למקרה שה-API לא עובד
        const mockCells: Cell[] = [
          {
            id: 1,
            code: 'A01',
            size: 'SMALL',
            sizeDisplay: 'קטן',
            area: 150, // 15x10 ס"מ
            available: true,
            lockerId: 1,
            lockerLocation: 'בניין A - קומה קרקע'
          },
          {
            id: 2,
            code: 'A02',
            size: 'MEDIUM',
            sizeDisplay: 'בינוני',
            area: 600, // 30x20 ס"מ
            available: true,
            lockerId: 1,
            lockerLocation: 'בניין A - קומה קרקע'
          },
          {
            id: 3,
            code: 'B01',
            size: 'LARGE',
            sizeDisplay: 'גדול',
            area: 1575, // 45x35 ס"מ
            available: true,
            lockerId: 2,
            lockerLocation: 'בניין B - קומה ראשונה'
          }
        ]
        setAvailableCells(mockCells)
      }
    } catch (error) {
      console.error('שגיאה בטעינת תאים:', error)
      // נתונים מדומים במקרה של שגיאה
      const mockCells: Cell[] = [
        {
          id: 1,
          code: 'A01',
          size: 'SMALL',
          sizeDisplay: 'קטן',
          area: 150,
          available: true,
          lockerId: 1,
          lockerLocation: 'בניין A - קומה קרקע'
        },
        {
          id: 2,
          code: 'A02',
          size: 'MEDIUM',
          sizeDisplay: 'בינוני',
          area: 600,
          available: true,
          lockerId: 1,
          lockerLocation: 'בניין A - קומה קרקע'
        }
      ]
      setAvailableCells(mockCells)
    } finally {
      setLoading(false)
    }
  }

  const handleCellSelection = (cell: Cell) => {
    setSelectedCell(cell)
  }

  const handleGoToCell = () => {
    if (selectedCell) {
      // מעבר לדף אימות פתיחת תא
      router.push(`/courier/cell-verification?cellId=${selectedCell.id}&cellCode=${selectedCell.code}`)
    }
  }

  const handleShowSizeSelection = () => {
    router.push('/courier/size-selection')
  }

  const handleShowLockersList = () => {
    router.push('/courier/lockers-list')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80">טוען תאים זמינים...</p>
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
            המערכת בודקת תאים פנויים לפי סדר עולה של גודל התא
          </p>
        </div>

        {/* כפתורי פעולה עיקריים */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={handleShowSizeSelection}
            className="glass-card text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-105 p-6"
          >
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4a1 1 0 011-1h4M4 16v4a1 1 0 001 1h4m8-16h4a1 1 0 011 1v4m-4 12h4a1 1 0 001-1v-4" />
                </svg>
              </div>
              <h3 className="font-bold">בחר גודל מוצר</h3>
              <p className="text-sm text-gray-300">בחירה ידנית של גודל החבילה</p>
            </div>
          </button>

          <button
            onClick={handleShowLockersList}
            className="glass-card text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-105 p-6"
          >
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="font-bold">הצג רשימת לוקרים/תאים</h3>
              <p className="text-sm text-gray-300">צפייה בכל הלוקרים הזמינים</p>
            </div>
          </button>
        </div>

        {/* רשימת תאים זמינים */}
        <div className="glass-card mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            תאים זמינים (לפי סדר גודל עולה)
          </h2>
          
          {availableCells.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">אין תאים זמינים כרגע</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableCells.map((cell) => (
                <div
                  key={cell.id}
                  className={`
                    border rounded-lg p-4 transition-all duration-300 cursor-pointer
                    ${selectedCell?.id === cell.id 
                      ? 'border-purple-400 bg-purple-500/20' 
                      : 'border-white/20 hover:border-white/40 hover:bg-white/10'
                    }
                  `}
                  onClick={() => handleCellSelection(cell)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <span className="font-bold">{cell.code}</span>
                      </div>
                      <div>
                        <h3 className="font-bold">{cell.sizeDisplay}</h3>
                        <p className="text-sm text-gray-300">{cell.lockerLocation}</p>
                        <p className="text-xs text-gray-400">שטח: {cell.area} ס״מ²</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCellSelection(cell)
                        }}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors"
                      >
                        בחר תא
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* תא נבחר */}
        {selectedCell && (
          <div className="glass-card mb-6 border-purple-400">
            <h3 className="text-lg font-bold mb-4 text-purple-300">תא נבחר</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">תא {selectedCell.code}</p>
                <p className="text-sm text-gray-300">{selectedCell.sizeDisplay} - {selectedCell.lockerLocation}</p>
                <p className="text-xs text-gray-400">שטח: {selectedCell.area} ס״מ²</p>
              </div>
              <button
                onClick={handleGoToCell}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-bold transition-colors"
              >
                🚶‍♂️ הולך לקחת את התא
              </button>
            </div>
          </div>
        )}

        {/* הערות */}
        <div className="glass-card-sm">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            הערות חשובות
          </h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>התאים מוצגים לפי סדר גודל עולה</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>בחר תא שגודלו מתאים לחבילה שלך</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>לאחר הבחירה, לך פיזית לתא ופתח אותו</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>אין מעבר אוטומטי לתא אחר אם התא לא נפתח</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
} 