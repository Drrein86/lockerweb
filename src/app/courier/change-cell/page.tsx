'use client'

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען לוקרים זמינים...</p>
        </div>
      </div>
    )
  }

  if (lockers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">לא נמצאו תאים זמינים בגודל {size}</p>
          <Link href="/courier" className="btn-primary">
            חזרה לבחירת גודל
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* כותרת */}
        <div className="text-center mb-8">
          <Link href={`/courier/select-locker?size=${size}`} className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← חזרה
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🔄 החלפת לוקר ותא
          </h1>
          <p className="text-gray-600">
            גודל חבילה: <span className="font-bold text-blue-600">{size}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* רשימת לוקרים */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              🏢 בחר לוקר
            </h2>
            <div className="space-y-3">
              {lockers.map((lockerGroup) => (
                <button
                  key={lockerGroup.locker.id}
                  onClick={() => handleLockerSelect(lockerGroup)}
                  className={`
                    w-full p-4 rounded-lg border-2 text-right transition-all
                    ${selectedLocker?.locker.id === lockerGroup.locker.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                    }
                  `}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        לוקר #{lockerGroup.locker.id}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        📍 {lockerGroup.locker.location}
                      </p>
                      {lockerGroup.locker.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {lockerGroup.locker.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {lockerGroup.cells.length} תאים זמינים
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* רשימת תאים */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              📦 בחר תא
            </h2>
            
            {!selectedLocker ? (
              <div className="text-center text-gray-500 py-8">
                <p>בחר קודם לוקר כדי לראות תאים זמינים</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {selectedLocker.cells.map((cell) => (
                  <button
                    key={cell.id}
                    onClick={() => handleCellSelect(cell)}
                    className={`
                      p-4 rounded-lg border-2 text-center transition-all
                      ${selectedCell?.id === cell.id
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : 'border-gray-200 hover:border-green-300 hover:shadow-sm'
                      }
                    `}
                  >
                    <div className="font-bold text-lg text-gray-800">
                      {cell.code}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
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
          <div className="mt-8 bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              ✅ בחירה נוכחית
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800">לוקר נבחר:</h4>
                <p className="text-gray-700">{selectedLocker.locker.location}</p>
                <p className="text-sm text-gray-600">ID: {selectedLocker.locker.id}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800">תא נבחר:</h4>
                <p className="text-gray-700 text-xl font-bold">{selectedCell.code}</p>
                <p className="text-sm text-gray-600">ID: {selectedCell.id}</p>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleContinue}
                className="btn-primary text-lg px-8 py-3 flex items-center gap-2"
              >
                🔍 המשך לסריקת QR
              </button>
            </div>
          </div>
        )}

        {/* מידע נוסף */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">💡 טיפ</h3>
          <p className="text-yellow-700 text-sm">
            בחר לוקר הקרוב ביותר למיקום הלקוח לנוחותו
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ChangeCellPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center"><div className="text-xl">טוען...</div></div>}>
      <ChangeCellContent />
    </Suspense>
  )
} 