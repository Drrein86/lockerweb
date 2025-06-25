'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

export default function LockersListPage() {
  const [lockers, setLockers] = useState<LockerGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLocker, setSelectedLocker] = useState<LockerGroup | null>(null)
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null)
  
  const router = useRouter()

  useEffect(() => {
    fetchAllLockers()
  }, [])

  const fetchAllLockers = async () => {
    try {
      const response = await fetch('/api/lockers/available')
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
              { id: 1, code: 'A01', size: 'קטן', lockerId: 1 },
              { id: 2, code: 'A02', size: 'בינוני', lockerId: 1 },
              { id: 3, code: 'A03', size: 'גדול', lockerId: 1 }
            ]
          },
          {
            locker: {
              id: 2,
              location: 'בניין B - כניסה ראשית',
              description: 'ליד דלפק הקבלה'
            },
            cells: [
              { id: 4, code: 'B01', size: 'קטן', lockerId: 2 },
              { id: 5, code: 'B02', size: 'רחב', lockerId: 2 }
            ]
          },
          {
            locker: {
              id: 3,
              location: 'בניין C - קומה ראשונה',
              description: 'ליד חדר המורים'
            },
            cells: [
              { id: 6, code: 'C01', size: 'בינוני', lockerId: 3 },
              { id: 7, code: 'C02', size: 'גדול', lockerId: 3 }
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
    setSelectedCell(null) // איפוס בחירת התא
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
          <p className="text-white/80 text-lg">טוען רשימת לוקרים...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* כותרת */}
        <div className="text-center mb-8">
          <Link href="/courier/select-cell" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition-all duration-300 mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>חזרה לבחירת תא</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">
            רשימת לוקרים
          </h1>
          <p className="text-white/70">
            כל הלוקרים במערכת לפי סדר עולה
          </p>
        </div>

        {/* בחירה נוכחית */}
        {(selectedLocker || selectedCell) && (
          <div className="glass-card mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">בחירה נוכחית</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedLocker && (
                <div className="p-4 bg-white/10 rounded-lg">
                  <h4 className="font-bold text-purple-300 mb-2">לוקר נבחר</h4>
                  <p className="text-white font-semibold">לוקר #{selectedLocker.locker.id}</p>
                  <p className="text-white">{selectedLocker.locker.location}</p>
                  <p className="text-white/70 text-sm">{selectedLocker.locker.description}</p>
                  <p className="text-purple-300 text-sm mt-1">
                    {selectedLocker.cells.length} תאים זמינים
                  </p>
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
          <h2 className="text-xl font-bold text-white">לוקרים במערכת (לפי סדר עולה)</h2>
          
          {lockers.length === 0 ? (
            <div className="glass-card text-center">
              <p className="text-red-400 text-lg mb-4">אין לוקרים במערכת</p>
              <Link href="/courier" className="btn-secondary">
                חזרה לדף הראשי
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
                      <div className="w-20 h-20 bg-white/20 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">#{lockerGroup.locker.id}</div>
                          <div className="text-xs text-white/70">לוקר</div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">
                          לוקר #{lockerGroup.locker.id}
                        </h3>
                        <p className="text-white/70 mb-1 font-semibold">{lockerGroup.locker.location}</p>
                        <p className="text-white/60 text-sm">{lockerGroup.locker.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <p className="text-purple-300 text-sm">
                            📦 {lockerGroup.cells.length} תאים זמינים
                          </p>
                          <div className="flex gap-1">
                            {Array.from(new Set(lockerGroup.cells.map(c => c.size))).map(size => (
                              <span key={size} className="text-xs bg-white/20 px-2 py-1 rounded-full text-white/80">
                                {size}
                              </span>
                            ))}
                          </div>
                        </div>
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
                  <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    תאים זמינים
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {lockerGroup.cells.map((cell) => (
                      <div
                        key={cell.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 ${
                          selectedCell?.id === cell.id
                            ? 'bg-purple-500/30 border-purple-400'
                            : 'bg-white/10 border-white/20 hover:bg-white/20'
                        }`}
                        onClick={() => handleCellSelect(cell)}
                      >
                        <div className="text-center">
                          <div className="text-xl font-bold text-white mb-2">{cell.code}</div>
                          <div className="text-white/70 text-sm mb-2">גודל: {cell.size}</div>
                          <div className="text-purple-300 text-xs mb-3">ID: {cell.id}</div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCellSelect(cell)
                            }}
                            className="btn-primary text-sm px-4 py-2 w-full"
                          >
                            בחר תא
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

        {/* סטטיסטיקות */}
        <div className="glass-card mt-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2z" />
            </svg>
            סטטיסטיקות מערכת
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/10 rounded-lg">
              <div className="text-2xl font-bold text-purple-300 mb-1">{lockers.length}</div>
              <div className="text-white/70 text-sm">לוקרים במערכת</div>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-lg">
              <div className="text-2xl font-bold text-green-300 mb-1">
                {lockers.reduce((sum, l) => sum + l.cells.length, 0)}
              </div>
              <div className="text-white/70 text-sm">תאים זמינים</div>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-lg">
              <div className="text-2xl font-bold text-blue-300 mb-1">
                {Array.from(new Set(lockers.flatMap(l => l.cells.map(c => c.size)))).length}
              </div>
              <div className="text-white/70 text-sm">סוגי גדלים</div>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-lg">
              <div className="text-2xl font-bold text-yellow-300 mb-1">
                {lockers.reduce((sum, l) => sum + l.cells.length, 0) > 0 ? '100%' : '0%'}
              </div>
              <div className="text-white/70 text-sm">זמינות</div>
            </div>
          </div>
        </div>

        {/* הערות */}
        <div className="glass-card mt-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            הוראות שימוש
          </h3>
          <ul className="space-y-2 text-white/70">
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>הלוקרים מוצגים לפי סדר מיון עולה (מ-1 ומעלה)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>כל לוקר מציג את מספר התאים הזמינים וסוגי הגדלים</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>בחר לוקר ואז בחר תא ספציפי מתוך הלוקר</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>לחץ על "הולך לקחת את התא" כדי להמשיך לשלב הבא</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
} 