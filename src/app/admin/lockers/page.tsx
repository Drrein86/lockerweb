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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען לוקרים...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* כותרת */}
        <div className="mb-8">
          <Link href="/admin" className="text-blue-500 hover:text-blue-700 mb-4 inline-block">
            ← חזרה לדשבורד
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">ניהול לוקרים</h1>
          <p className="text-gray-600 mt-2">
            ניהול וצפייה בכל הלוקרים והתאים במערכת
          </p>
        </div>

        {/* סיכום כללי */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">סה"כ לוקרים</h3>
            <p className="text-3xl font-bold text-blue-600">{lockers.length}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">סה"כ תאים</h3>
            <p className="text-3xl font-bold text-green-600">
              {lockers.reduce((total, locker) => total + locker.cells.length, 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">תאים תפוסים</h3>
            <p className="text-3xl font-bold text-orange-600">
              {lockers.reduce((total, locker) => 
                total + locker.cells.filter(cell => cell.isOccupied).length, 0
              )}
            </p>
          </div>
        </div>

        {/* רשימת לוקרים */}
        <div className="space-y-6">
          {lockers.map((locker) => (
            <div key={locker.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      🏢 לוקר #{locker.id}
                    </h2>
                    <p className="text-gray-600 mb-1">📍 {locker.location}</p>
                    {locker.description && (
                      <p className="text-sm text-gray-500">{locker.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      נוצר: {new Date(locker.createdAt).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* סטטיסטיקות תאים */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">פילוח תאים לפי גודל</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {getCellsBySize(locker.cells).map((sizeData) => (
                      <div key={sizeData.size} className="bg-gray-50 rounded-lg p-4 text-center">
                        <h4 className="font-semibold text-gray-800">{sizeData.size}</h4>
                        <p className="text-sm text-gray-600">
                          {sizeData.occupied}/{sizeData.count}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
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
                  <h3 className="text-lg font-semibold mb-4">מפת תאים</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {locker.cells.map((cell) => (
                      <div
                        key={cell.id}
                        className={`
                          p-3 rounded-lg border-2 text-center text-sm font-medium
                          ${cell.isOccupied 
                            ? 'bg-red-100 border-red-300 text-red-800' 
                            : 'bg-green-100 border-green-300 text-green-800'
                          }
                        `}
                      >
                        <div className="font-bold">{cell.code}</div>
                        <div className="text-xs">{getSizeInHebrew(cell.size)}</div>
                        <div className="text-xs mt-1">
                          {cell.isOccupied ? '🔒 תפוס' : '🟢 פנוי'}
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
            <p className="text-gray-500">אין לוקרים במערכת</p>
          </div>
        )}
      </div>
    </div>
  )
} 