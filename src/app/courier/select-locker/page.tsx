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

function SelectLockerContent() {
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
        // בחירה אוטומטית של הלוקר הראשון והתא הראשון
        if (data.lockers.length > 0) {
          const firstLocker = data.lockers[0]
          setSelectedLocker(firstLocker)
          if (firstLocker.cells.length > 0) {
            setSelectedCell(firstLocker.cells[0])
          }
        }
      }
    } catch (error) {
      console.error('שגיאה בטעינת לוקרים:', error)
      // Fallback data למקרה שה-API לא עובד
      const mockLockers = [
        {
          locker: {
            id: 1,
            location: 'בניין A - קומה קרקע',
            description: 'ליד המעליות הראשיות'
          },
          cells: [
            { id: 1, code: 'A01', size: 'SMALL' },
            { id: 2, code: 'A02', size: 'MEDIUM' },
            { id: 3, code: 'A03', size: 'LARGE' }
          ]
        }
      ]
      setLockers(mockLockers)
      setSelectedLocker(mockLockers[0])
      setSelectedCell(mockLockers[0].cells[0])
    } finally {
      setLoading(false)
    }
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

  const handleChangeLocker = () => {
    router.push(`/courier/change-cell?size=${size}`)
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

  if (!selectedLocker || !selectedCell) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">לא נמצאו תאים זמינים</p>
          <Link href="/courier" className="btn-primary">
            חזרה לבחירת גודל
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* כותרת */}
        <div className="text-center mb-8">
          <Link href="/courier" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← חזרה לבחירת גודל
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            📍 בחירת לוקר ותא
          </h1>
          <p className="text-gray-600">
            גודל חבילה: <span className="font-bold text-blue-600">{size}</span>
          </p>
        </div>

        {/* מידע על הלוקר והתא שנבחרו */}
        <div className="bg-white rounded-lg p-6 shadow-lg mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* פרטי הלוקר */}
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h3 className="text-xl font-bold text-blue-800 mb-2">
                🏢 לוקר נבחר
              </h3>
              <p className="text-lg font-semibold">{selectedLocker.locker.location}</p>
              {selectedLocker.locker.description && (
                <p className="text-gray-600 text-sm mt-1">
                  {selectedLocker.locker.description}
                </p>
              )}
              <div className="mt-3 text-sm text-blue-600">
                ID: {selectedLocker.locker.id}
              </div>
            </div>

            {/* פרטי התא */}
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h3 className="text-xl font-bold text-green-800 mb-2">
                📦 תא נבחר
              </h3>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {selectedCell.code}
              </div>
              <p className="text-gray-600">
                גודל: {size}
              </p>
              <div className="mt-3 text-sm text-green-600">
                ID: {selectedCell.id}
              </div>
            </div>
          </div>
        </div>

        {/* כפתורי פעולה */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={handleContinue}
            className="btn-primary text-lg px-8 py-3 flex items-center justify-center gap-2"
          >
            🔍 המשך לסריקת QR
          </button>
          
          <button
            onClick={handleChangeLocker}
            className="btn-secondary text-lg px-8 py-3 flex items-center justify-center gap-2"
          >
            🔁 החלף לוקר/תא
          </button>
        </div>

        {/* מידע נוסף */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📋 השלבים הבאים
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl mb-2">1️⃣</div>
              <p className="text-sm">סריקת QR של הלקוח</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl mb-2">2️⃣</div>
              <p className="text-sm">שמירת הפרטים</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl mb-2">3️⃣</div>
              <p className="text-sm">פתיחת התא</p>
            </div>
          </div>
        </div>

        {/* רשימת תאים זמינים באותו לוקר */}
        {selectedLocker.cells.length > 1 && (
          <div className="mt-8 bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              תאים נוספים זמינים באותו לוקר
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {selectedLocker.cells.map((cell) => (
                <button
                  key={cell.id}
                  onClick={() => setSelectedCell(cell)}
                  className={`
                    p-3 rounded text-center font-bold transition-all
                    ${selectedCell.id === cell.id 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                    }
                  `}
                >
                  {cell.code}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SelectLockerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center"><div className="text-xl">טוען...</div></div>}>
      <SelectLockerContent />
    </Suspense>
  )
} 