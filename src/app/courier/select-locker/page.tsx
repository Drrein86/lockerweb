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

// SVG Icons
const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 12H5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 19L5 12L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const BuildingIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 2H18V22H16V20H8V22H6V2Z" stroke="white" strokeWidth="2"/>
    <path d="M8 6H10V8H8Z" stroke="white" strokeWidth="2"/>
    <path d="M14 6H16V8H14Z" stroke="white" strokeWidth="2"/>
    <path d="M8 10H10V12H8Z" stroke="white" strokeWidth="2"/>
    <path d="M14 10H16V12H14Z" stroke="white" strokeWidth="2"/>
  </svg>
)

const PackageIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3H21L19 13H5L3 3Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 3L1 1" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7 13V21H17V13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const ScanIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
  </svg>
)

const ChangeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 4V10H7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M23 20V14H17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80">טוען לוקרים זמינים...</p>
        </div>
      </div>
    )
  }

  if (!selectedLocker || !selectedCell) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">לא נמצאו תאים זמינים</p>
          <Link href="/courier" className="btn-primary">
            חזרה לבחירת גודל
          </Link>
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
            <ArrowLeftIcon />
            <span>חזרה לבחירת גודל</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">
            בחירת לוקר ותא
          </h1>
          <p className="text-white/70">
            גודל חבילה: <span className="font-bold text-purple-300">{size}</span>
          </p>
        </div>

        {/* מידע על הלוקר והתא שנבחרו */}
        <div className="glass-card mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* פרטי הלוקר */}
            <div className="text-center p-4 bg-white/10 rounded-lg border border-white/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <BuildingIcon />
                <h3 className="text-xl font-bold text-white">
                  לוקר נבחר
                </h3>
              </div>
              <p className="text-lg font-semibold text-white">{selectedLocker.locker.location}</p>
              {selectedLocker.locker.description && (
                <p className="text-white/70 text-sm mt-1">
                  {selectedLocker.locker.description}
                </p>
              )}
              <div className="mt-3 text-sm text-purple-300">
                ID: {selectedLocker.locker.id}
              </div>
            </div>

            {/* פרטי התא */}
            <div className="text-center p-4 bg-white/10 rounded-lg border border-white/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <PackageIcon />
                <h3 className="text-xl font-bold text-white">
                  תא נבחר
                </h3>
              </div>
              <div className="text-3xl font-bold text-purple-300 mb-2">
                {selectedCell.code}
              </div>
              <p className="text-white/70">
                גודל: {size}
              </p>
              <div className="mt-3 text-sm text-purple-300">
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
            <ScanIcon />
            המשך לסריקת QR
          </button>
          
          <button
            onClick={handleChangeLocker}
            className="btn-secondary text-lg px-8 py-3 flex items-center justify-center gap-2"
          >
            <ChangeIcon />
            החלף לוקר/תא
          </button>
        </div>

        {/* מידע נוסף */}
        <div className="glass-card">
          <h3 className="text-lg font-semibold text-white mb-4">
            השלבים הבאים
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white/10 rounded border border-white/20">
              <div className="text-2xl mb-2">1️⃣</div>
              <p className="text-sm text-white/80">סריקת QR של הלקוח</p>
            </div>
            <div className="text-center p-3 bg-white/10 rounded border border-white/20">
              <div className="text-2xl mb-2">2️⃣</div>
              <p className="text-sm text-white/80">הזנת פרטי החבילה</p>
            </div>
            <div className="text-center p-3 bg-white/10 rounded border border-white/20">
              <div className="text-2xl mb-2">3️⃣</div>
              <p className="text-sm text-white/80">פתיחת התא והזנה</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SelectLockerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-xl text-white">טוען...</div>
      </div>
    }>
      <SelectLockerContent />
    </Suspense>
  )
} 