'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Cell {
  id: number
  code: string
  size: string
  isOccupied: boolean
}

interface Locker {
  id: number
  location: string
  description: string
  cells: Cell[]
  createdAt: string
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

const MapIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="8" y1="2" x2="8" y2="18" stroke="white" strokeWidth="2"/>
    <line x1="16" y1="6" x2="16" y2="22" stroke="white" strokeWidth="2"/>
  </svg>
)

const LockedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="16" r="1" fill="currentColor"/>
    <path d="M7 11V7A5 5 0 0 1 17 7V11" stroke="currentColor" strokeWidth="2"/>
  </svg>
)

const UnlockedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function AdminLockersPage() {
  const [lockers, setLockers] = useState<Locker[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLockers()
  }, [])

  const fetchLockers = async () => {
    try {
      const response = await fetch('/api/admin/lockers')
      const data = await response.json()
      if (data.success) {
        setLockers(data.lockers)
      }
    } catch (error) {
      console.error('שגיאה בטעינת לוקרים:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSizeInHebrew = (size: string) => {
    const sizeMap: { [key: string]: string } = {
      'SMALL': 'קטן',
      'MEDIUM': 'בינוני', 
      'LARGE': 'גדול',
      'WIDE': 'רחב'
    }
    return sizeMap[size] || size
  }

  const getCellsBySize = (cells: Cell[]) => {
    const sizeCount = cells.reduce((acc, cell) => {
      acc[cell.size] = (acc[cell.size] || 0) + 1
      return acc
    }, {} as any)

    return Object.entries(sizeCount).map(([size, count]) => ({
      size: getSizeInHebrew(size),
      count: count as number,
      occupied: cells.filter(c => c.size === size && c.isOccupied).length
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white/80">טוען לוקרים...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* כותרת */}
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition-all duration-300 mb-6">
            <ArrowLeftIcon />
            <span>חזרה לדשבורד</span>
          </Link>
          <h1 className="text-3xl font-bold text-white">ניהול לוקרים</h1>
          <p className="text-white/70 mt-2">
            ניהול וצפייה בכל הלוקרים והתאים במערכת
          </p>
        </div>

        {/* סיכום כללי */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card">
            <div className="flex items-center gap-3 mb-2">
              <BuildingIcon />
              <h3 className="text-lg font-semibold text-white">סה"כ לוקרים</h3>
            </div>
            <p className="text-3xl font-bold text-white">{lockers.length}</p>
          </div>
          <div className="glass-card">
            <div className="flex items-center gap-3 mb-2">
              <PackageIcon />
              <h3 className="text-lg font-semibold text-white">סה"כ תאים</h3>
            </div>
            <p className="text-3xl font-bold text-white">
              {lockers.reduce((total, locker) => total + locker.cells.length, 0)}
            </p>
          </div>
          <div className="glass-card">
            <div className="flex items-center gap-3 mb-2">
              <LockedIcon />
              <h3 className="text-lg font-semibold text-white">תאים תפוסים</h3>
            </div>
            <p className="text-3xl font-bold text-orange-400">
              {lockers.reduce((total, locker) => 
                total + locker.cells.filter(cell => cell.isOccupied).length, 0
              )}
            </p>
          </div>
        </div>

        {/* רשימת לוקרים */}
        <div className="space-y-6">
          {lockers.map((locker) => (
            <div key={locker.id} className="glass-card">
              <div className="p-6 border-b border-white/20">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <BuildingIcon />
                      <h2 className="text-xl font-bold text-white">
                        לוקר #{locker.id}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapIcon />
                      <p className="text-white/80">{locker.location}</p>
                    </div>
                    {locker.description && (
                      <p className="text-sm text-white/60">{locker.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/50">
                      נוצר: {new Date(locker.createdAt).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* סטטיסטיקות תאים */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">פילוח תאים לפי גודל</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {getCellsBySize(locker.cells).map((sizeData) => (
                      <div key={sizeData.size} className="bg-white/10 backdrop-blur rounded-lg p-4 text-center border border-white/20">
                        <h4 className="font-semibold text-white">{sizeData.size}</h4>
                        <p className="text-sm text-white/70">
                          {sizeData.occupied}/{sizeData.count}
                        </p>
                        <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${(sizeData.occupied / sizeData.count) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* רשת תאים */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-white">מפת תאים</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {locker.cells.map((cell) => (
                      <div
                        key={cell.id}
                        className={`
                          p-3 rounded-lg border-2 text-center text-sm font-medium transition-all duration-200
                          ${cell.isOccupied 
                            ? 'bg-red-500/20 border-red-400/50 text-red-300' 
                            : 'bg-green-500/20 border-green-400/50 text-green-300'
                          }
                        `}
                      >
                        <div className="font-bold">{cell.code}</div>
                        <div className="text-xs">{getSizeInHebrew(cell.size)}</div>
                        <div className="text-xs mt-1 flex items-center justify-center gap-1">
                          {cell.isOccupied ? (
                            <>
                              <LockedIcon />
                              <span>תפוס</span>
                            </>
                          ) : (
                            <>
                              <UnlockedIcon />
                              <span>פנוי</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {lockers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/50">אין לוקרים במערכת</p>
          </div>
        )}
      </div>
    </div>
  )
} 