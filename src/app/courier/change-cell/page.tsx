'use client'

// השבתת prerendering עבור עמוד זה
export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Cell {
  id: number
  code: string
  size: string
}

interface LockerGroup {
  locker: {
    id: number
    location: string
    description: string
  }
  cells: Cell[]
}

// SVG Icons
const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 12H5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 19L5 12L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const BuildingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 2H18V22H16V20H8V22H6V2Z" stroke="white" strokeWidth="2"/>
    <path d="M8 6H10V8H8Z" stroke="white" strokeWidth="2"/>
    <path d="M14 6H16V8H14Z" stroke="white" strokeWidth="2"/>
    <path d="M8 10H10V12H8Z" stroke="white" strokeWidth="2"/>
    <path d="M14 10H16V12H14Z" stroke="white" strokeWidth="2"/>
  </svg>
)

const PackageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3H21L19 13H5L3 3Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 3L1 1" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7 13V21H17V13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

function ChangeCellContent() {
  const [lockers, setLockers] = useState<LockerGroup[]>([])
  const [selectedLocker, setSelectedLocker] = useState<LockerGroup | null>(null)
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const size = searchParams.get('size')

  useEffect(() => {
    if (!size) {
      router.push('/courier')
      return
    }

    fetchAvailableLockers()
  }, [size])

  const fetchAvailableLockers = async () => {
    try {
      const response = await fetch(`/api/lockers/available?size=${size}`)
      const data = await response.json()
      
      if (data.available) {
        setLockers(data.lockers)
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
  }

  const handleContinue = () => {
    if (selectedLocker && selectedCell) {
      const params = new URLSearchParams({
        size: size || '',
        lockerId: selectedLocker.locker.id.toString(),
        cellId: selectedCell.id.toString(),
        cellCode: selectedCell.code
      })
      router.push(`/courier/scan-qr?${params.toString()}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80">טוען לוקרים זמינים...</p>
        </div>
      </div>
    )
  }

  if (lockers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">לא נמצאו תאים זמינים בגודל {size}</p>
          <Link href="/courier" className="btn-primary">
            חזרה לבחירת גודל
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* כותרת */}
        <div className="text-center mb-8">
          <Link href={`/courier/select-locker?size=${size}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition-all duration-300 mb-6">
            <ArrowLeftIcon />
            <span>חזרה</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">
            החלפת לוקר ותא
          </h1>
          <p className="text-white/70">
            גודל חבילה: <span className="font-bold text-purple-300">{size}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* רשימת לוקרים */}
          <div className="glass-card">
            <div className="flex items-center gap-2 mb-4">
              <BuildingIcon />
              <h2 className="text-xl font-bold text-white">
                בחר לוקר
              </h2>
            </div>
            <div className="space-y-3">
              {lockers.map((lockerGroup) => (
                <button
                  key={lockerGroup.locker.id}
                  onClick={() => handleLockerSelect(lockerGroup)}
                  className={`
                    w-full p-4 rounded-lg border-2 text-right transition-all duration-300
                    ${selectedLocker?.locker.id === lockerGroup.locker.id
                      ? 'border-purple-400 bg-purple-500/20 shadow-md'
                      : 'border-white/20 hover:border-purple-300 hover:bg-white/5'
                    }
                  `}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-white">
                        לוקר #{lockerGroup.locker.id}
                      </h3>
                      <p className="text-sm text-white/70 mt-1">
                        {lockerGroup.locker.location}
                      </p>
                      {lockerGroup.locker.description && (
                        <p className="text-xs text-white/60 mt-1">
                          {lockerGroup.locker.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-400/30">
                        {lockerGroup.cells.length} תאים זמינים
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* רשימת תאים */}
          <div className="glass-card">
            <div className="flex items-center gap-2 mb-4">
              <PackageIcon />
              <h2 className="text-xl font-bold text-white">
                בחר תא
              </h2>
            </div>
            
            {!selectedLocker ? (
              <div className="text-center text-white/50 py-8">
                <p>בחר קודם לוקר כדי לראות תאים זמינים</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {selectedLocker.cells.map((cell) => (
                  <button
                    key={cell.id}
                    onClick={() => handleCellSelect(cell)}
                    className={`
                      p-4 rounded-lg border-2 text-center transition-all duration-300
                      ${selectedCell?.id === cell.id
                        ? 'border-purple-400 bg-purple-500/20 shadow-md'
                        : 'border-white/20 hover:border-purple-300 hover:bg-white/5'
                      }
                    `}
                  >
                    <div className="font-bold text-lg text-white">
                      {cell.code}
                    </div>
                    <div className="text-xs text-white/70 mt-1">
                      {size}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* סיכום ופעולות */}
        {selectedLocker && selectedCell && (
          <div className="mt-8 glass-card">
            <h3 className="text-lg font-semibold text-white mb-4">
              סיכום הבחירה
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-white/10 rounded border border-white/20">
                <div className="text-sm text-white/70">לוקר</div>
                <div className="font-bold text-white">{selectedLocker.locker.location}</div>
                <div className="text-xs text-purple-300 mt-1">ID: {selectedLocker.locker.id}</div>
              </div>
              <div className="text-center p-4 bg-white/10 rounded border border-white/20">
                <div className="text-sm text-white/70">תא</div>
                <div className="font-bold text-2xl text-purple-300">{selectedCell.code}</div>
                <div className="text-xs text-white/70 mt-1">ID: {selectedCell.id}</div>
              </div>
              <div className="text-center p-4 bg-white/10 rounded border border-white/20">
                <div className="text-sm text-white/70">גודל</div>
                <div className="font-bold text-white">{size}</div>
              </div>
            </div>
            
            <div className="text-center">
              <button
                onClick={handleContinue}
                className="btn-primary text-lg px-8 py-3"
              >
                המשך לסריקת QR
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChangeCellPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-xl text-white">טוען...</div>
      </div>
    }>
      <ChangeCellContent />
    </Suspense>
  )
} 